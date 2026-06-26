import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Building2, Mail, Phone, Edit3, CheckSquare, Square, LayoutGrid, List, Download, X, Send } from 'lucide-react';
import OrgChart from './OrgChart';
import './index.css';

const API = 'http://localhost:3001/api';

/* ── Helpers ────────────────────────────────────────────── */
const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#0891b2', '#10b981', '#f59e0b',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  const parts = name.split(' ').filter(p => p.length > 2);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

/* ── Contact Card ────────────────────────────────────────── */
function ContactCard({ contact, onEdit, selected, onToggle, viewMode }) {
  const isSelected = selected.has(contact.id);
  const color = getAvatarColor(contact.nome);
  const initials = getInitials(contact.nome);

  if (viewMode === 'list') {
    return (
      <div
        className={`contact-list-item${isSelected ? ' selected' : ''}`}
        onClick={() => onToggle(contact.id)}
      >
        <div className="checkbox-area">
          {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
        </div>
        <div className="contact-avatar" style={{ '--avatar-color': color }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="contact-name">{contact.nome}</div>
          <div className="contact-cargo">{contact.cargo || '—'}</div>
        </div>
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)' }}>
          {contact.departamento || '—'}
        </div>
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)' }}>
          {contact.email || '—'}
        </div>
        <button className="edit-btn" onClick={e => { e.stopPropagation(); onEdit(contact); }}>
          <Edit3 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`contact-card${isSelected ? ' selected' : ''}`}
      onClick={() => onToggle(contact.id)}
    >
      <div style={{ position: 'absolute', top: 14, left: 14 }} className="checkbox-area">
        {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
      </div>
      <button className="edit-btn" onClick={e => { e.stopPropagation(); onEdit(contact); }}>
        <Edit3 size={14} />
      </button>

      <div className="contact-avatar" style={{ '--avatar-color': color }}>{initials}</div>
      <div className="contact-name">{contact.nome}</div>
      <div className="contact-cargo">{contact.cargo || 'Cargo não informado'}</div>

      <div className="contact-details">
        {contact.email && (
          <div className="detail-item">
            <Mail size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>{contact.email}</span>
          </div>
        )}
        {contact.telefone && (
          <div className="detail-item">
            <Phone size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span>{contact.telefone}</span>
          </div>
        )}
        {contact.departamento && (
          <div className="detail-item">
            <Building2 size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>{contact.departamento}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── E-mail predefinido padrão ───────────────────────────── */
const EMAIL_DEFAULT_SUBJECT = 'Comunicado — Ministério dos Transportes';
const EMAIL_DEFAULT_BODY =
`Prezado(a),

Encaminhamos este comunicado em nome do Ministério dos Transportes.

Atenciosamente,
Equipe de Gestão de Pessoas — MT`;

/* ── App Principal ───────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab]       = useState('contacts');
  const [contacts, setContacts]         = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [stats, setStats]               = useState({ totalContatos: 0, totalDepartamentos: 0, comEmail: 0, comTelefone: 0 });
  const [search, setSearch]             = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selected, setSelected]         = useState(new Set());
  const [viewMode, setViewMode]         = useState('grid');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState(EMAIL_DEFAULT_SUBJECT);
  const [emailBody, setEmailBody]       = useState(EMAIL_DEFAULT_BODY);

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedDept !== 'Todos') params.set('departamento', selectedDept);
      const res = await fetch(`${API}/contacts?${params}`);
      setContacts(await res.json());
    } catch { }
  }, [search, selectedDept]);

  useEffect(() => {
    fetch(`${API}/departments`).then(r => r.json()).then(setDepartments).catch(() => { });
  }, []);
  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => { });
  }, []);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const toggleSelect = id =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectedContacts = contacts.filter(c => selected.size === 0 || selected.has(c.id));

  const downloadJSON = () => {
    const data = JSON.stringify(selectedContacts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `contatos_${selected.size > 0 ? 'selecionados' : 'todos'}_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const headers = ['nome','cargo','departamento','email','telefone'];
    const rows = selectedContacts.map(c =>
      headers.map(h => `"${(c[h] || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `contatos_${selected.size > 0 ? 'selecionados' : 'todos'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const sendEmail = () => {
    const emails = selectedContacts
      .map(c => c.email)
      .filter(Boolean);
    if (emails.length === 0) {
      alert('Nenhum e-mail encontrado nos contatos selecionados.');
      return;
    }
    const to      = emails.join(';');
    const subject = encodeURIComponent(emailSubject);
    const body    = encodeURIComponent(emailBody);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div>

      {/* Navbar */}
      <nav className="top-navbar">
        <div className="navbar-brand">
          <div className="brand-logo">MT</div>
          <div>
            <div className="brand-sub">Portal Corporativo</div>
            <div className="brand-text">Ministério dos Transportes</div>
          </div>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab${activeTab === 'contacts' ? ' active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <Users size={15} /> Diretório
          </button>
          <button
            className={`nav-tab${activeTab === 'chart' ? ' active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            <Building2 size={15} /> Organograma
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="body-layout">
        {/* Sidebar */}
        {activeTab === 'contacts' && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-label">Departamentos</div>
              <div className="search-input-wrap">
                <Search size={13} />
                <input placeholder="Filtrar áreas..." />
              </div>
            </div>
            <div className="sidebar-list">
              <button
                className={`sidebar-item${selectedDept === 'Todos' ? ' active' : ''}`}
                onClick={() => setSelectedDept('Todos')}
              >
                <span>Visão Geral</span>
                <span className="sidebar-badge">{stats.totalContatos}</span>
              </button>
              {departments.map(d => (
                <button
                  key={d.nome}
                  className={`sidebar-item${selectedDept === d.nome ? ' active' : ''}`}
                  onClick={() => setSelectedDept(d.nome)}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                    {d.nome}
                  </span>
                  <span className="sidebar-badge">{d.total}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className={`main-area${activeTab === 'chart' ? ' full-height' : ''}`}>
          {activeTab === 'contacts' && (
            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card" style={{ '--stat-color': 'var(--primary)', '--stat-bg': 'var(--primary-light)' }}>
                  <div className="stat-icon"><Users size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.totalContatos}</div>
                    <div className="stat-label">Total de Contatos</div>
                  </div>
                </div>
                <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'var(--success-light)' }}>
                  <div className="stat-icon"><Building2 size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.totalDepartamentos}</div>
                    <div className="stat-label">Departamentos</div>
                  </div>
                </div>
                <div className="stat-card" style={{ '--stat-color': 'var(--accent)', '--stat-bg': 'var(--accent-light)' }}>
                  <div className="stat-icon"><Mail size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.comEmail ?? '—'}</div>
                    <div className="stat-label">Com E-mail</div>
                  </div>
                </div>
                <div className="stat-card" style={{ '--stat-color': 'var(--warning)', '--stat-bg': 'var(--warning-light)' }}>
                  <div className="stat-icon"><Phone size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.comTelefone ?? '—'}</div>
                    <div className="stat-label">Com Telefone</div>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-input-wrap" style={{ flex: 1, maxWidth: 400 }}>
                  <Search size={15} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nome, cargo..."
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {selected.size > 0 && (
                    <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      {selected.size} selecionado{selected.size > 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    className="action-btn"
                    onClick={downloadJSON}
                    title={selected.size > 0 ? 'Baixar selecionados (JSON)' : 'Baixar todos (JSON)'}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> JSON
                  </button>
                  <button
                    className="action-btn"
                    onClick={downloadCSV}
                    title={selected.size > 0 ? 'Baixar selecionados (CSV)' : 'Baixar todos (CSV)'}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> CSV
                  </button>
                  <button
                    className="action-btn email-btn"
                    onClick={() => setShowEmailModal(true)}
                    title={selected.size > 0 ? 'Enviar e-mail aos selecionados' : 'Enviar e-mail a todos'}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Mail size={14} /> E-mail
                  </button>
                  <div style={{
                    display: 'flex', gap: 4,
                    background: 'var(--bg-surface)', padding: 4,
                    borderRadius: 8, border: '1px solid var(--border)'
                  }}>
                    <button
                      className={`nav-tab${viewMode === 'grid' ? ' active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      title="Grade"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      className={`nav-tab${viewMode === 'list' ? ' active' : ''}`}
                      onClick={() => setViewMode('list')}
                      title="Lista"
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className={viewMode === 'grid' ? 'contacts-grid' : 'contacts-list'}>
                {contacts.map(c => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    selected={selected}
                    onToggle={toggleSelect}
                    viewMode={viewMode}
                    onEdit={() => { }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chart' && <OrgChart />}
        </main>
      </div>

      {/* Modal de E-mail Predefinido */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Enviar E-mail</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {selected.size > 0
                      ? `${selected.size} destinatário${selected.size > 1 ? 's' : ''} selecionado${selected.size > 1 ? 's' : ''}`
                      : `${contacts.filter(c => c.email).length} destinatários (todos com e-mail)`}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <label className="modal-label">Assunto</label>
              <input
                className="modal-input"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                placeholder="Assunto do e-mail..."
              />

              <label className="modal-label" style={{ marginTop: 16 }}>Corpo da mensagem</label>
              <textarea
                className="modal-textarea"
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={7}
                placeholder="Corpo do e-mail..."
              />

              <div className="modal-footer">
                <button
                  className="action-btn"
                  onClick={() => { setEmailSubject(EMAIL_DEFAULT_SUBJECT); setEmailBody(EMAIL_DEFAULT_BODY); }}
                >
                  Restaurar padrão
                </button>
                <button className="action-btn email-btn" onClick={sendEmail}>
                  <Send size={14} /> Abrir no cliente de e-mail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}