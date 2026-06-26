import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Building2, Mail, Phone, Edit3, CheckSquare, Square, LayoutGrid, List } from 'lucide-react';
import OrgChart from './OrgChart';
import './styles.css';

const API = 'http://localhost:3001/api';

function getAvatarColor(name) {
  const colors = ['#2563eb', '#7c3aed', '#e11d48', '#0891b2', '#059669', '#d97706'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  const parts = name.split(' ').filter(p => p.length > 2);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function ContactCard({ contact, onEdit, selected, onToggle, viewMode }) {
  const isSelected = selected.has(contact.id);
  const color = getAvatarColor(contact.nome);
  const initials = getInitials(contact.nome);

  if (viewMode === 'list') {
    return (
      <div className={`contact-list-item ${isSelected ? 'selected' : ''}`} onClick={() => onToggle(contact.id)}>
        <div className="checkbox-area">{isSelected ? <CheckSquare size={18} /> : <Square size={18} />}</div>
        <div className="contact-avatar" style={{ '--avatar-color': color }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="contact-name">{contact.nome}</div>
          <div className="contact-cargo">{contact.cargo || '-'}</div>
        </div>
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)' }}>{contact.departamento || '-'}</div>
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)' }}>{contact.email || '-'}</div>
        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(contact); }}><Edit3 size={16} /></button>
      </div>
    );
  }

  return (
    <div className={`contact-card ${isSelected ? 'selected' : ''}`} onClick={() => onToggle(contact.id)}>
      <div style={{ position: 'absolute', top: 16, left: 16 }} className="checkbox-area">
        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
      </div>
      <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(contact); }}><Edit3 size={16} /></button>

      <div className="contact-avatar" style={{ '--avatar-color': color }}>{initials}</div>
      <div className="contact-name">{contact.nome}</div>
      <div className="contact-cargo">{contact.cargo || 'Cargo não informado'}</div>

      <div className="contact-details">
        {contact.email && <div className="detail-item"><Mail size={12} /> <span>{contact.email}</span></div>}
        {contact.telefone && <div className="detail-item"><Phone size={12} /> <span>{contact.telefone}</span></div>}
        {contact.departamento && <div className="detail-item"><Building2 size={12} color="var(--primary)" /> <span>{contact.departamento}</span></div>}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ totalContatos: 0, totalDepartamentos: 0, comEmail: 0, comTelefone: 0 });
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selected, setSelected] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedDept !== 'Todos') params.set('departamento', selectedDept);
      const res = await fetch(`${API}/contacts?${params}`);
      setContacts(await res.json());
    } catch { }
  }, [search, selectedDept]);

  useEffect(() => { fetch(`${API}/departments`).then(r => r.json()).then(setDepartments).catch(() => { }); }, []);
  useEffect(() => { fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => { }); }, []);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const toggleSelect = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div>
      <div className="gov-bar">
        <span>gov.br</span><span className="gov-bar-divider" /><span>Ministério dos Transportes</span>
      </div>

      <nav className="top-navbar">
        <div className="navbar-brand">
          <div className="brand-logo">MT</div>
          <div>
            <div className="brand-sub">Portal Corporativo</div>
            <div className="brand-text">Ministério dos Transportes</div>
          </div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}><Users size={16} /> Diretório</button>
          <button className={`nav-tab ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}><Building2 size={16} /> Organograma</button>
        </div>
      </nav>

      <div className="body-layout">
        {activeTab === 'contacts' && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-label">Departamentos</div>
              <div className="search-input-wrap">
                <Search size={14} />
                <input placeholder="Filtrar áreas..." />
              </div>
            </div>
            <div className="sidebar-list">
              <button className={`sidebar-item ${selectedDept === 'Todos' ? 'active' : ''}`} onClick={() => setSelectedDept('Todos')}>
                <span>Visão Geral</span>
                <span className="sidebar-badge">{stats.totalContatos}</span>
              </button>
              {departments.map(d => (
                <button key={d.nome} className={`sidebar-item ${selectedDept === d.nome ? 'active' : ''}`} onClick={() => setSelectedDept(d.nome)}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>{d.nome}</span>
                  <span className="sidebar-badge">{d.total}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className={`main-area ${activeTab === 'chart' ? 'full-height' : ''}`}>
          {activeTab === 'contacts' && (
            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

              <div className="stats-grid">
                <div className="stat-card" style={{ '--stat-color': 'var(--primary)', '--stat-bg': 'var(--primary-light)' }}>
                  <div className="stat-icon"><Users size={24} /></div>
                  <div><div className="stat-value">{stats.totalContatos}</div><div className="stat-label">Total de Contatos</div></div>
                </div>
                <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': '#ecfdf5' }}>
                  <div className="stat-icon"><Building2 size={24} /></div>
                  <div><div className="stat-value">{stats.totalDepartamentos}</div><div className="stat-label">Departamentos</div></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
                <div className="search-input-wrap" style={{ flex: 1, maxWidth: 400 }}>
                  <Search size={16} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, cargo..." />
                </div>
                <div style={{ display: 'flex', gap: 8, background: 'var(--bg-surface)', padding: 4, borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <button className={`nav-tab ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></button>
                  <button className={`nav-tab ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /></button>
                </div>
              </div>

              <div className={viewMode === 'grid' ? 'contacts-grid' : 'contacts-list'}>
                {contacts.map(c => (
                  <ContactCard key={c.id} contact={c} selected={selected} onToggle={toggleSelect} viewMode={viewMode} onEdit={() => { }} />
                ))}
              </div>

            </div>
          )}
          {activeTab === 'chart' && <OrgChart />}
        </main>
      </div>
    </div>
  );
}