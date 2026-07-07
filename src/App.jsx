import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Users, Building2, Mail, Phone, CheckSquare, Square, LayoutGrid, List, Download, X, Copy, FileDown, LayoutTemplate, Check, Send, Info, Network, Plus, Save, Trash2, Pencil, Moon, Sun, Loader, BookOpen } from 'lucide-react';
import OrgChart, { loadOrgFlat, TIPO_LABELS, THEME, ancestorsOf, saveOrgFlat, treeToFlat, DEFAULT_ORG_TREE } from './OrgChart';
import { EMAIL_PRESETS, openMailClient } from './emailTemplates';
import ResearchPage from './ResearchPage';
import './index.css';

const API = '/api';

/* -- Theme bootstrap: apply before render to avoid flash -- */
(function () {
  try {
    const t = localStorage.getItem('mt-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (_) { /* */ }
})();

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
function ContactCard({ contact, onEdit, onDelete, selected, onToggle, viewMode, hierarchyPath }) {
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
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)' }} title={contact.departamento}>
          {hierarchyPath || contact.departamento || '—'}
        </div>
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-muted)' }}>
          {contact.email || '—'}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: 110 }}>
          {contact.telefone || '—'}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="card-action-btn" onClick={e => { e.stopPropagation(); onEdit(contact); }} title="Editar contato">
            <Pencil size={13} />
          </button>
          {onDelete && (
            <button className="card-action-btn card-action-btn--danger" onClick={e => { e.stopPropagation(); onDelete(contact.id); }} title="Excluir contato">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`contact-card${isSelected ? ' selected' : ''}`} onClick={() => onToggle(contact.id)}>
      <div className="card-checkbox">{isSelected ? <CheckSquare size={17} /> : <Square size={17} />}</div>
      <div className="contact-avatar" style={{ '--avatar-color': color }}>{initials}</div>
      <div className="contact-name">{contact.nome}</div>
      <div className="contact-cargo">{contact.cargo || '—'}</div>
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
        {(hierarchyPath || contact.departamento) && (
          <div className="detail-item" title={contact.departamento}>
            <Building2 size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>{hierarchyPath || contact.departamento}</span>
          </div>
        )}
      </div>
      <div className="card-actions" onClick={e => e.stopPropagation()}>
        <button className="card-action-btn" onClick={() => onEdit(contact)} title="Editar contato">
          <Pencil size={13} />
        </button>
        {onDelete && (
          <button className="card-action-btn card-action-btn--danger" onClick={() => onDelete(contact.id)} title="Excluir contato">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}


/* ── Modal de edição de contato ────────────────────────── */
function ContactEditModal({ contact, onClose, onSave, defaultDeptKey }) {
  const [form, setForm] = useState({
    nome: contact?.nome || '',
    cargo: contact?.cargo || '',
    email: contact?.email || '',
    telefone: contact?.telefone || '',
    departamento: contact?.departamento || defaultDeptKey || '',
  });
  const isNew = !contact?.id;

  const handleSave = () => {
    if (!form.nome.trim()) { alert('O nome é obrigatório.'); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{isNew ? 'Novo Contato' : 'Editar Contato'}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <label className="modal-label">Nome *</label>
          <input className="modal-input" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} placeholder="Nome completo" />
          <label className="modal-label" style={{ marginTop: 12 }}>Cargo / Função</label>
          <input className="modal-input" value={form.cargo} onChange={e => setForm(f => ({...f, cargo: e.target.value}))} placeholder="ex.: Analista Técnico" />
          <label className="modal-label" style={{ marginTop: 12 }}>E-mail</label>
          <input className="modal-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@transportes.gov.br" />
          <label className="modal-label" style={{ marginTop: 12 }}>Telefone</label>
          <input className="modal-input" value={form.telefone} onChange={e => setForm(f => ({...f, telefone: e.target.value}))} placeholder="(61) 2029-XXXX" />
          <label className="modal-label" style={{ marginTop: 12 }}>Departamento (chave)</label>
          <input className="modal-input" value={form.departamento} onChange={e => setForm(f => ({...f, departamento: e.target.value}))} placeholder="Mesmo valor do deptKey do setor" />
        </div>
        <div className="modal-footer" style={{ padding: '0 24px 20px', justifyContent: 'flex-end' }}>
          <button className="action-btn" onClick={onClose}>Cancelar</button>
          <button className="action-btn email-btn" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={13} /> {isNew ? 'Criar Contato' : 'Salvar'}
          </button>
        </div>
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activePreset, setActivePreset] = useState(EMAIL_PRESETS[0].id);
  const [emailSubject, setEmailSubject] = useState(EMAIL_PRESETS[0].subject);
  const [emailBody, setEmailBody] = useState(EMAIL_PRESETS[0].body);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [statFilter, setStatFilter] = useState(null);
  const [sendProgress, setSendProgress] = useState(null);

  // -- Theme toggle
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('mt-theme') || 'dark'; } catch { return 'dark'; }
  });
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('mt-theme', next); } catch (_) { /* */ }
  }, [theme]);

  // Org tree state
  const [orgNodes, setOrgNodes] = useState([]);
  useEffect(() => { setOrgNodes(loadOrgFlat()); }, []);

  // Sector edit state
  const [sectorEditing, setSectorEditing] = useState(false);
  const [sectorForm, setSectorForm] = useState(null);

  // Contact modal state
  const [contactModal, setContactModal] = useState(null); // null | { contact: obj|null }

  const activeNode = useMemo(() => orgNodes.find(n => n.deptKey === selectedDept), [orgNodes, selectedDept]);
  const parentNodes = useMemo(() => {
    if (!activeNode) return [];
    return ancestorsOf(orgNodes, activeNode.id).map(id => orgNodes.find(n => n.id === id)).filter(Boolean).reverse();
  }, [orgNodes, activeNode]);
  const childNodes = useMemo(() => {
    if (!activeNode) return [];
    return orgNodes.filter(n => n.parentId === activeNode.id);
  }, [orgNodes, activeNode]);

  const getContactHierarchy = useCallback((deptKey) => {
    if (!deptKey || orgNodes.length === 0) return null;
    const node = orgNodes.find(n => n.deptKey === deptKey);
    if (!node) return null;
    const parentIds = ancestorsOf(orgNodes, node.id);
    const path = parentIds.map(id => orgNodes.find(n => n.id === id)).filter(Boolean).reverse();
    return [...path, node].filter(n => n.id !== 'MINISTRO').map(n => n.sigla || n.nome).join(' › ');
  }, [orgNodes]);

  // Navigate from OrgChart to Directory
  const navigateToDept = useCallback((deptKey) => {
    setSelectedDept(deptKey || 'Todos');
    setActiveTab('contacts');
    setSectorEditing(false);
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedDept !== 'Todos') params.set('departamento', selectedDept);
      const res = await fetch(`${API}/contacts?${params}`);
      setContacts(await res.json());
    } catch { }
  }, [search, selectedDept]);

  // Lista completa e SEM filtro, usada só pelo cruzamento de dados do
  // chat de IA — nunca deve depender da busca/departamento selecionados
  // na aba Diretório, senão a IA só "enxerga" o recorte filtrado da tela.
  const [allContacts, setAllContacts] = useState([]);
  const fetchAllContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/contacts`);
      setAllContacts(await res.json());
    } catch { }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchContacts(), fetchAllContacts()]);
    fetch(`${API}/departments`).then(r => r.json()).then(setDepartments).catch(() => {});
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, [fetchContacts, fetchAllContacts]);

  useEffect(() => {
    fetch(`${API}/departments`).then(r => r.json()).then(setDepartments).catch(() => { });
  }, []);
  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => { });
  }, []);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { fetchAllContacts(); }, [fetchAllContacts]);

  const toggleSelect = id =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const displayedContacts = useMemo(() => {
    if (statFilter === 'email') return contacts.filter(c => c.email && c.email.length > 0);
    if (statFilter === 'telefone') return contacts.filter(c => c.telefone && c.telefone.length > 0);
    return contacts;
  }, [contacts, statFilter]);

  const selectedContacts = displayedContacts.filter(c => selected.size === 0 || selected.has(c.id));

  const toggleStatFilter = (f) => setStatFilter(prev => prev === f ? null : f);

  // Sector CRUD
  const startSectorEdit = () => {
    if (!activeNode) return;
    setSectorForm({
      nome: activeNode.nome || '',
      sigla: activeNode.sigla || '',
      resumo: activeNode.resumo || '',
      competencias: (activeNode.competencias || []).join('\n'),
    });
    setSectorEditing(true);
  };

  const saveSector = () => {
    if (!activeNode || !sectorForm) return;
    const updated = orgNodes.map(n => n.id === activeNode.id ? {
      ...n,
      nome: sectorForm.nome.trim() || n.nome,
      sigla: sectorForm.sigla.trim(),
      resumo: sectorForm.resumo.trim(),
      competencias: sectorForm.competencias.split('\n').map(s => s.trim()).filter(Boolean),
    } : n);
    saveOrgFlat(updated);
    setOrgNodes(updated);
    setSectorEditing(false);
  };

  const addSubSector = () => {
    if (!activeNode) return;
    const newId = 'N' + Date.now().toString(36).toUpperCase();
    const child = {
      id: newId, parentId: activeNode.id, sigla: '', nome: 'Novo setor',
      tipo: activeNode.tipo === 'ministerio' ? 'assessoria' : activeNode.tipo,
      deptKey: '', resumo: '', competencias: [],
    };
    const updated = [...orgNodes, child];
    saveOrgFlat(updated);
    setOrgNodes(updated);
  };

  // Contact CRUD
  const handleContactSave = async (form) => {
    try {
      if (contactModal?.contact?.id) {
        // update
        await fetch(`${API}/contacts/${contactModal.contact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        // create
        await fetch(`${API}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, departamento: form.departamento || selectedDept }),
        });
      }
      setContactModal(null);
      await Promise.all([fetchContacts(), fetchAllContacts()]);
      fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
      fetch(`${API}/departments`).then(r => r.json()).then(setDepartments).catch(() => {});
    } catch { alert('Erro ao salvar contato.'); }
  };

  const handleContactDelete = async (id) => {
    if (!window.confirm('Excluir este contato?')) return;
    try {
      await fetch(`${API}/contacts/${id}`, { method: 'DELETE' });
      await Promise.all([fetchContacts(), fetchAllContacts()]);
      fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
      fetch(`${API}/departments`).then(r => r.json()).then(setDepartments).catch(() => {});
    } catch { alert('Erro ao excluir contato.'); }
  };

  const downloadJSON = () => {
    const data = JSON.stringify(selectedContacts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `contatos_${selected.size > 0 ? 'selecionados' : 'todos'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const headers = ['nome', 'cargo', 'departamento', 'email', 'telefone'];
    const rows = selectedContacts.map(c =>
      headers.map(h => `"${(c[h] || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `contatos_${selected.size > 0 ? 'selecionados' : 'todos'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const applyPreset = presetId => {
    const preset = EMAIL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setEmailSubject(preset.subject);
    setEmailBody(preset.body);
    setCopyStatus(null);
  };

  const [copyStatus, setCopyStatus] = useState(null); // 'html' | 'emails' | null

  /* -- Send individual emails (one per contact with name replaced) -- */
  const sendIndividualEmails = async () => {
    const targets = selectedContacts.filter(c => c.email);
    if (targets.length === 0) { alert('Nenhum destinatário com e-mail cadastrado.'); return; }
    const items = targets.map(c => ({ id: c.id, nome: c.nome, email: c.email, status: 'pending' }));
    setSendProgress({ items: [...items], done: false });
    setShowEmailModal(false);

    for (let i = 0; i < items.length; i++) {
      items[i] = { ...items[i], status: 'sending' };
      setSendProgress({ items: [...items], done: false });
      try {
        const body = emailBody.replaceAll('{{nome}}', targets[i].nome || 'Prezado(a)');
        const res = await fetch(`${API}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: targets[i].email, subject: emailSubject, htmlBody: body, nome: targets[i].nome }),
        });
        const data = await res.json();
        items[i] = { ...items[i], status: res.ok ? 'ok' : 'err', error: data.error };
      } catch (e) {
        items[i] = { ...items[i], status: 'err', error: e.message };
      }
      setSendProgress({ items: [...items], done: i === items.length - 1 });
    }
  };

  const compiledPreviewHtml = emailBody.replaceAll('{{nome}}', 'Fulano de Tal');

  const copyHtmlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopyStatus('html');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      alert('Não foi possível copiar. Selecione o texto manualmente.');
    }
  };

  const copyEmailListToClipboard = async () => {
    const emails = selectedContacts.filter(c => c.email).map(c => c.email);
    if (emails.length === 0) {
      alert('Nenhum destinatário com e-mail cadastrado.');
      return;
    }
    try {
      await navigator.clipboard.writeText(emails.join('; '));
      setCopyStatus('emails');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      alert('Não foi possível copiar a lista de e-mails.');
    }
  };

  const sendViaMailClient = () => {
    const emails = selectedContacts.filter(c => c.email).map(c => c.email);
    if (emails.length === 0) {
      alert('Nenhum destinatário com e-mail cadastrado.');
      return;
    }
    openMailClient({
      to: emails,
      subject: emailSubject,
      htmlBody: emailBody,
      name: emails.length === 1 ? selectedContacts.find(c => c.email)?.nome : '',
    });
  };

  const downloadEmailHtml = () => {
    const fullHtml =
      `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>${emailSubject || 'E-mail'}</title></head>
<body>
${emailBody}
</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `email_${activePreset}_${new Date().toISOString().slice(0, 10)}.html`;
    a.click(); URL.revokeObjectURL(url);
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
          <button
            className={`nav-tab${activeTab === 'research' ? ' active' : ''}`}
            onClick={() => setActiveTab('research')}
          >
            <BookOpen size={15} /> Pesquisas
          </button>
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </nav>

      {/* Body */}
      <div className="body-layout">
        {/* Sidebar */}
        {activeTab === 'contacts' && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-label">Departamentos</div>
              <div className="sidebar-search-wrap">
                <Search size={13} />
                <input
                  placeholder="Filtrar áreas..."
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="sidebar-list">
              <button
                className={`sidebar-item${selectedDept === 'Todos' && !statFilter ? ' active' : ''}`}
                onClick={() => { setSelectedDept('Todos'); setStatFilter(null); }}
              >
                <span>Visão Geral</span>
                <span className="sidebar-badge">{stats.totalContatos}</span>
              </button>
              {departments
                .filter(d => !sidebarSearch || d.nome.toLowerCase().includes(sidebarSearch.toLowerCase()))
                .map(d => (
                  <button
                    key={d.nome}
                    className={`sidebar-item${selectedDept === d.nome ? ' active' : ''}`}
                    onClick={() => { setSelectedDept(d.nome); setStatFilter(null); }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {d.nome}
                    </span>
                    <span className="sidebar-badge">{d.total}</span>
                  </button>
                ))
              }
              {sidebarSearch && departments.filter(d => d.nome.toLowerCase().includes(sidebarSearch.toLowerCase())).length === 0 && (
                <div style={{ padding: '16px 12px', fontSize: '0.78rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                  Nenhuma área encontrada
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className={`main-area${activeTab === 'chart' ? ' full-height' : ''}${activeTab === 'research' ? ' full-height' : ''}`}>
          {activeTab === 'research' && (
            <ResearchPage contacts={allContacts} />
          )}
          {activeTab === 'contacts' && (
            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

              {/* Stats — clicáveis para filtrar */}
              <div className="stats-grid">
                <div
                  className="stat-card"
                  style={{ '--stat-color': 'var(--primary)', '--stat-bg': 'var(--primary-light)' }}
                  onClick={() => { setSelectedDept('Todos'); setStatFilter(null); }}
                  title="Ver todos os contatos"
                >
                  <div className="stat-icon"><Users size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.totalContatos}</div>
                    <div className="stat-label">Total de Contatos</div>
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ '--stat-color': 'var(--success)', '--stat-bg': 'var(--success-light)' }}
                  onClick={() => { setSelectedDept('Todos'); setStatFilter(null); }}
                  title="Ver todos os departamentos"
                >
                  <div className="stat-icon"><Building2 size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.totalDepartamentos}</div>
                    <div className="stat-label">Departamentos</div>
                  </div>
                </div>
                <div
                  className={`stat-card${statFilter === 'email' ? ' stat-active' : ''}`}
                  style={{ '--stat-color': 'var(--accent)', '--stat-bg': 'var(--accent-light)' }}
                  onClick={() => { setSelectedDept('Todos'); toggleStatFilter('email'); }}
                  title="Clique para filtrar: apenas com e-mail"
                >
                  <div className="stat-icon"><Mail size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.comEmail ?? '—'}</div>
                    <div className="stat-label">
                      Com E-mail
                      {statFilter === 'email' && <span style={{ fontSize: '0.65rem', color: 'var(--accent)', marginLeft: 4 }}>● filtrado</span>}
                    </div>
                  </div>
                </div>
                <div
                  className={`stat-card${statFilter === 'telefone' ? ' stat-active' : ''}`}
                  style={{ '--stat-color': 'var(--warning)', '--stat-bg': 'var(--warning-light)' }}
                  onClick={() => { setSelectedDept('Todos'); toggleStatFilter('telefone'); }}
                  title="Clique para filtrar: apenas com telefone"
                >
                  <div className="stat-icon"><Phone size={22} /></div>
                  <div>
                    <div className="stat-value">{stats.comTelefone ?? '—'}</div>
                    <div className="stat-label">
                      Com Telefone
                      {statFilter === 'telefone' && <span style={{ fontSize: '0.65rem', color: 'var(--warning)', marginLeft: 4 }}>● filtrado</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes do Setor Selecionado */}
              {selectedDept !== 'Todos' && activeNode && (
                <div className="sector-info-card" style={{ borderLeft: `4px solid ${(THEME[activeNode.tipo] || THEME.assessoria).color}`, marginBottom: 20 }}>
                  
                  {/* Header com breadcrumbs */}
                  <div className="sic-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div className="sic-breadcrumbs">
                        {parentNodes.map(pn => (
                          <span key={pn.id}>
                            <button type="button" className="sic-breadcrumb-link"
                              onClick={() => pn.deptKey ? setSelectedDept(pn.deptKey) : null}
                              disabled={!pn.deptKey}>
                              {pn.sigla || pn.nome}
                            </button>
                            <span className="sic-breadcrumb-separator">/</span>
                          </span>
                        ))}
                        <span className="sic-breadcrumb-current">{activeNode.sigla || activeNode.nome}</span>
                      </div>
                      <h3 className="sic-title" style={{ fontSize: '1.15rem', marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge" style={{
                          backgroundColor: (THEME[activeNode.tipo] || THEME.assessoria).badgeBg,
                          color: (THEME[activeNode.tipo] || THEME.assessoria).color,
                          borderColor: (THEME[activeNode.tipo] || THEME.assessoria).border,
                          fontSize: '0.62rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid',
                        }}>{activeNode.sigla || TIPO_LABELS[activeNode.tipo]}</span>
                        {sectorEditing ? sectorForm?.nome : activeNode.nome}
                      </h3>
                    </div>
                    {/* Ações do setor */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {!sectorEditing ? (
                        <button className="action-btn" onClick={startSectorEdit}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                          <Pencil size={12} /> Editar setor
                        </button>
                      ) : (
                        <>
                          <button className="action-btn email-btn" onClick={saveSector}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                            <Save size={12} /> Salvar
                          </button>
                          <button className="action-btn" onClick={() => setSectorEditing(false)}
                            style={{ fontSize: '0.75rem' }}>Cancelar</button>
                        </>
                      )}
                      <button className="action-btn" onClick={addSubSector}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                        <Plus size={12} /> Subsetor
                      </button>
                    </div>
                  </div>

                  {/* Formulário de edição do setor */}
                  {sectorEditing && sectorForm && (
                    <div className="sic-edit-form">
                      <div className="sic-edit-grid">
                        <div>
                          <label className="modal-label">Nome do setor</label>
                          <input className="modal-input" value={sectorForm.nome}
                            onChange={e => setSectorForm(f => ({...f, nome: e.target.value}))} />
                        </div>
                        <div>
                          <label className="modal-label">Sigla</label>
                          <input className="modal-input" value={sectorForm.sigla}
                            onChange={e => setSectorForm(f => ({...f, sigla: e.target.value}))}
                            placeholder="ex.: SPOA" />
                        </div>
                      </div>
                      <label className="modal-label" style={{ marginTop: 10 }}>Resumo</label>
                      <input className="modal-input" value={sectorForm.resumo}
                        onChange={e => setSectorForm(f => ({...f, resumo: e.target.value}))}
                        placeholder="Breve descrição do setor..." />
                      <label className="modal-label" style={{ marginTop: 10 }}>Competências (uma por linha)</label>
                      <textarea className="modal-textarea" rows={4} value={sectorForm.competencias}
                        onChange={e => setSectorForm(f => ({...f, competencias: e.target.value}))}
                        style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} />
                    </div>
                  )}

                  {/* Resumo do setor */}
                  {!sectorEditing && activeNode.resumo && (
                    <p className="sic-resumo" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '8px 0 14px', lineHeight: 1.5 }}>
                      {activeNode.resumo}
                    </p>
                  )}

                  {/* Subsetores / Coordenações */}
                  {childNodes.length > 0 && (
                    <div className="sic-subsections" style={{ marginBottom: 14 }}>
                      <div className="sic-section-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-subtle)', fontWeight: 700, marginBottom: 8 }}>
                        <Network size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Subsetores &amp; Coordenações ({childNodes.length})
                      </div>
                      <div className="sic-subnodes-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {childNodes.map(cn => {
                          const cnTheme = THEME[cn.tipo] || THEME.assessoria;
                          return (
                            <button key={cn.id} type="button" className="sic-subnode-item"
                              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: `3px solid ${cnTheme.color}`, borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                              onClick={() => cn.deptKey ? setSelectedDept(cn.deptKey) : null}>
                              <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text)' }}>{cn.nome}</span>
                              <span className="badge" style={{ backgroundColor: cnTheme.badgeBg, color: cnTheme.color, borderColor: cnTheme.border, fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', border: '1px solid', marginLeft: 4 }}>
                                {cn.sigla || TIPO_LABELS[cn.tipo]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Competências */}
                  {!sectorEditing && activeNode.competencias && activeNode.competencias.length > 0 && (
                    <details className="sic-details" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                      <summary className="sic-summary">
                        <Info size={13} style={{ marginRight: 6 }} />
                        Competências Regimentais ({activeNode.competencias.length})
                      </summary>
                      <ul style={{ listStyle: 'none', padding: '10px 0 0 0', margin: 0 }}>
                        {activeNode.competencias.map((comp, idx) => (
                          <li key={idx} style={{ position: 'relative', paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: '8px' }}>
                            <span style={{ position: 'absolute', left: 0, color: 'var(--primary-hover)', fontWeight: 'bold' }}>—</span>{comp}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Adicionar contato ao setor */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <button className="action-btn email-btn"
                      onClick={() => setContactModal({ contact: null })}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                      <Plus size={13} /> Adicionar Contato neste Setor
                    </button>
                  </div>
                </div>
              )}

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
                {displayedContacts.map(c => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    selected={selected}
                    onToggle={toggleSelect}
                    viewMode={viewMode}
                    hierarchyPath={getContactHierarchy(c.departamento)}
                    onEdit={(contact) => setContactModal({ contact })}
                    onDelete={handleContactDelete}
                  />
                ))}
                {displayedContacts.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Nenhum contato encontrado{selectedDept !== 'Todos' ? ' neste setor' : statFilter ? ' com este filtro' : ''}.
                    </div>
                    {selectedDept !== 'Todos' && (
                      <div style={{ marginTop: 12 }}>
                        <button className="action-btn email-btn" onClick={() => setContactModal({ contact: null })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Plus size={13} /> Adicionar primeiro contato
                        </button>
                      </div>
                    )}
                    {statFilter && (
                      <div style={{ marginTop: 12 }}>
                        <button className="action-btn" onClick={() => setStatFilter(null)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <X size={13} /> Remover filtro
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticky action bar — aparece quando há selecionados */}
              {selected.size > 0 && (
                <div className="sticky-action-bar">
                  <span className="selection-label">
                    {selected.size} selecionado{selected.size > 1 ? 's' : ''}
                  </span>
                  <button className="action-btn" onClick={() => setSelected(new Set())} title="Limpar seleção">
                    <X size={13} /> Limpar
                  </button>
                  <button className="action-btn" onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Download size={13} /> CSV
                  </button>
                  <button className="action-btn" onClick={downloadJSON} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Download size={13} /> JSON
                  </button>
                  <button className="action-btn email-btn" onClick={() => setShowEmailModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={13} /> E-mail ({selectedContacts.filter(c => c.email).length})
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chart' && <OrgChart onNavigateToDept={navigateToDept} />}
        </main>
      </div>

      {/* Modal de Editar/Criar Contato */}
      {contactModal && (
        <ContactEditModal
          contact={contactModal.contact}
          onClose={() => setContactModal(null)}
          onSave={handleContactSave}
          defaultDeptKey={selectedDept !== 'Todos' ? selectedDept : ''}
        />
      )}

      {/* Modal de E-mail Predefinido */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Compor E-mail</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {selected.size > 0
                      ? `${selected.size} destinatário${selected.size > 1 ? 's' : ''} selecionado${selected.size > 1 ? 's' : ''}`
                      : `${contacts.filter(c => c.email).length} destinatários (todos com e-mail)`}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body modal-body-split">
              {/* Coluna esquerda: edição */}
              <div className="email-editor-col">
                <label className="modal-label">
                  <LayoutTemplate size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Predefinição do corpo do e-mail
                </label>
                <div className="preset-pills">
                  {EMAIL_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`preset-pill${activePreset === p.id ? ' active' : ''}`}
                      onClick={() => applyPreset(p.id)}
                      title={`Usar predefinição "${p.label}"`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <label className="modal-label" style={{ marginTop: 16 }}>Assunto</label>
                <input
                  className="modal-input"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Assunto do e-mail..."
                />

                <label className="modal-label" style={{ marginTop: 16 }}>
                  Corpo do e-mail (HTML) — use <code>{'{{nome}}'}</code> pra personalizar com o nome do contato
                </label>
                <textarea
                  className="modal-textarea email-textarea-lg"
                  value={emailBody}
                  onChange={e => { setEmailBody(e.target.value); setCopyStatus(null); }}
                  placeholder="<p>Olá {{nome}},</p><p>Sua mensagem aqui...</p>"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>

              {/* Coluna direita: prévia grande */}
              <div className="email-preview-col">
                <label className="modal-label">Prévia (como o destinatário verá)</label>
                <div className="email-preview-frame">
                  <div className="email-preview-toolbar">
                    <span className="email-preview-dot" style={{ background: '#ef4444' }} />
                    <span className="email-preview-dot" style={{ background: '#f59e0b' }} />
                    <span className="email-preview-dot" style={{ background: '#10b981' }} />
                  </div>
                  <div className="email-preview-meta">
                    <div><strong>Assunto:</strong> {emailSubject || '(sem assunto)'}</div>
                  </div>
                  <div
                    className="email-preview-html"
                    dangerouslySetInnerHTML={{ __html: compiledPreviewHtml }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '0 24px 24px', flexWrap: 'wrap' }}>
              <button className="action-btn" onClick={() => applyPreset(EMAIL_PRESETS[0].id)}>
                Restaurar padrão
              </button>
              <button className="action-btn" onClick={copyEmailListToClipboard}>
                {copyStatus === 'emails' ? <Check size={14} /> : <Copy size={14} />}
                {copyStatus === 'emails' ? ' Copiado!' : ' Copiar e-mails'}
              </button>
              <button className="action-btn" onClick={downloadEmailHtml}>
                <FileDown size={14} /> Baixar .html
              </button>
              <button className="action-btn" onClick={copyHtmlToClipboard}>
                {copyStatus === 'html' ? <Check size={14} /> : <Copy size={14} />}
                {copyStatus === 'html' ? ' HTML copiado!' : ' Copiar HTML'}
              </button>
              <button className="action-btn" onClick={sendViaMailClient} title="Abre cliente de e-mail padrão">
                <Send size={14} /> Abrir no cliente
              </button>
              <button
                className="action-btn email-btn"
                onClick={sendIndividualEmails}
                title="Envia um e-mail personalizado separado para cada destinatário (substitui {{nome}})"
              >
                <Mail size={14} /> Enviar individual ({selectedContacts.filter(c => c.email).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Progresso de Envio Individual */}
      {sendProgress && (
        <div className="modal-overlay" onClick={() => sendProgress.done && setSendProgress(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Enviando e-mails...</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {sendProgress.items.filter(i => i.status === 'ok').length} de {sendProgress.items.length} enviados
                  </div>
                </div>
              </div>
              {sendProgress.done && (
                <button className="modal-close" onClick={() => setSendProgress(null)}><X size={16} /></button>
              )}
            </div>
            <div className="modal-body" style={{ padding: '16px 24px', maxHeight: '55vh', overflowY: 'auto' }}>
              {sendProgress.items.map(item => (
                <div key={item.id} className="send-progress-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.email}</div>
                  </div>
                  {item.status === 'pending' && <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Aguardando...</span>}
                  {item.status === 'sending' && <span className="send-status-sending">⟳ Enviando</span>}
                  {item.status === 'ok'      && <span className="send-status-ok">✓ Enviado</span>}
                  {item.status === 'err'     && <span className="send-status-err" title={item.error}>✗ Erro</span>}
                </div>
              ))}
            </div>
            {sendProgress.done && (
              <div className="modal-footer" style={{ padding: '0 24px 20px', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {sendProgress.items.filter(i => i.status === 'ok').length} enviados ·{' '}
                  {sendProgress.items.filter(i => i.status === 'err').length} com erro
                </span>
                <button className="action-btn email-btn" onClick={() => setSendProgress(null)}>Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}