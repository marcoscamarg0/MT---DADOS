import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Users, ChevronDown, ChevronUp, Search, Network, ZoomIn, ZoomOut, Maximize2, X, Mail, Phone, Building2, Send } from 'lucide-react';
import './index.css';

const API = '/api';

/* ═══════════════════════════════════════════════════════════
   ESTRUTURA ORGANIZACIONAL
   ═══════════════════════════════════════════════════════════ */
const ORG_TREE = {
  id: 'MINISTRO', sigla: 'MINISTRO', nome: 'Ministro de Estado', tipo: 'ministerio',
  deptKey: 'Gabinete do Ministro - GM',
  filhos: [
    {
      id: 'SE', sigla: 'SE', nome: 'Secretaria Executiva', tipo: 'secretaria',
      deptKey: 'Secretaria Executiva - SE',
      filhos: [
        { id: 'SUST', sigla: 'SUST', nome: 'Subsecretaria de Sustentabilidade', tipo: 'subsecretaria', deptKey: 'Subsecretaria de Sustentabilidade - SUST', filhos: [] },
        { id: 'SPAR', sigla: 'SPAR', nome: 'Subsecretaria de Parcerias', tipo: 'subsecretaria', deptKey: 'Subsecretaria de Parcerias - SPAR', filhos: [] },
        { id: 'SFPLAN', sigla: 'SFPLAN', nome: 'Subsecretaria de Fomento e Planejamento', tipo: 'subsecretaria', deptKey: 'Subsecretaria de Fomento e Planejamento - SFPLAN', filhos: [] },
        { id: 'SPOA', sigla: 'SPOA', nome: 'Subsecretaria de Planejamento, Orçamento e Administração', tipo: 'subsecretaria', deptKey: 'SPOA - Planejamento, Orçamento e Administração', filhos: [] },
        { id: 'SGETI', sigla: 'SGETI', nome: 'Subsecretaria de Gestão Estratégica, Tecnologia e Inovação', tipo: 'subsecretaria', deptKey: 'SGETI - Gestão Estratégica, Tecnologia e Inovação', filhos: [] },
        { id: 'CONJUR', sigla: 'CONJUR', nome: 'Consultoria Jurídica', tipo: 'consultoria', deptKey: 'Consultoria Jurídica - CONJUR', filhos: [] },
        { id: 'OUV', sigla: 'OUV', nome: 'Ouvidoria', tipo: 'consultoria', deptKey: 'Ouvidoria', filhos: [] },
        { id: 'CORREG', sigla: 'CORREG', nome: 'Corregedoria', tipo: 'consultoria', deptKey: 'Corregedoria', filhos: [] },
      ]
    },
    {
      id: 'GM', sigla: 'GM', nome: 'Gabinete Ministerial', tipo: 'gabinete',
      deptKey: 'Gabinete do Ministro - GM',
      filhos: [
        { id: 'CCGM', sigla: 'CCGM', nome: 'Coordenação-Geral do Gabinete do Ministro', tipo: 'coordenacao', deptKey: 'Gabinete do Ministro - GM', filhos: [] },
        { id: 'CERIM', sigla: 'CERIM', nome: 'Assessoria de Cerimonial', tipo: 'assessoria', deptKey: 'Gabinete do Ministro - GM', filhos: [] },
        { id: 'ASSAD', sigla: 'ASSAD', nome: 'Assessoria Administrativa', tipo: 'assessoria', deptKey: 'Gabinete do Ministro - GM', filhos: [] },
        { id: 'AEAPF', sigla: 'AEAPF', nome: 'Assessoria Especial de Assuntos Parlamentares e Federativos', tipo: 'assessoria', deptKey: 'Assessoria Especial de Assuntos Parlamentares e Federativos', filhos: [] },
        { id: 'AESCOM', sigla: 'AESCOM', nome: 'Assessoria Especial de Comunicação Social', tipo: 'assessoria', deptKey: 'Assessoria Especial de Comunicação Social - AESCOM', filhos: [] },
        { id: 'AECI', sigla: 'AECI', nome: 'Assessoria Especial de Controle Interno', tipo: 'assessoria', deptKey: 'Assessoria Especial de Controle Interno', filhos: [] },
        { id: 'APSD', sigla: 'APSD', nome: 'Assessoria de Participação Social e Diversidade', tipo: 'assessoria', deptKey: 'Assessoria de Participação Social e Diversidade', filhos: [] },
        { id: 'AI', sigla: 'AI', nome: 'Assessoria Internacional', tipo: 'assessoria', deptKey: 'Assessoria Internacional - AESINT', filhos: [] },
      ]
    },
    {
      id: 'SNTR', sigla: 'SNTR', nome: 'Secretaria Nacional de Transporte Rodoviário', tipo: 'secretaria',
      deptKey: 'Secretaria Nacional de Transporte Rodoviário - SNTR',
      filhos: [
        { id: 'DOP_SNTR', sigla: 'DOP', nome: 'Departamento de Obras Públicas', tipo: 'departamento', deptKey: 'DOP/SNTR - Obras Públicas', filhos: [] },
        { id: 'DOUT_SNTR', sigla: 'DOUT', nome: 'Departamento de Outorgas Rodoviárias', tipo: 'departamento', deptKey: 'DOUT/SNTR - Outorgas Rodoviárias', filhos: [] },
      ]
    },
    {
      id: 'SNTF', sigla: 'SNTF', nome: 'Secretaria Nacional de Transporte Ferroviário', tipo: 'secretaria',
      deptKey: 'Secretaria Nacional de Transporte Ferroviário - SNTF',
      filhos: [
        { id: 'DOP_SNTF', sigla: 'DOP', nome: 'Departamento de Obras e Projetos', tipo: 'departamento', deptKey: 'DOP/SNTF - Obras e Projetos Ferroviários', filhos: [] },
        { id: 'DOUT_SNTF', sigla: 'DOUT', nome: 'Departamento de Outorgas Ferroviárias', tipo: 'departamento', deptKey: 'DOUT/SNTF - Outorgas Ferroviárias', filhos: [] },
      ]
    },
    {
      id: 'SENATRAN', sigla: 'SENATRAN', nome: 'Secretaria Nacional de Trânsito', tipo: 'secretaria',
      deptKey: 'Secretaria Nacional de Trânsito - SENATRAN',
      filhos: [
        { id: 'DSEG', sigla: 'DSEG', nome: 'Departamento de Segurança no Trânsito', tipo: 'departamento', deptKey: 'DSEG/SENATRAN - Segurança no Trânsito', filhos: [] },
        { id: 'DRFG', sigla: 'DRFG', nome: 'Departamento de Regulação, Fiscalização e Gestão', tipo: 'departamento', deptKey: 'DRFG/SENATRAN - Regulação, Fiscalização e Gestão', filhos: [] },
      ]
    },
    { id: 'CONATT', sigla: 'CONATT', nome: 'Comissão Nacional das Autoridades de Transportes Terrestres', tipo: 'colegiado', deptKey: '', filhos: [] },
    { id: 'CONTRAN', sigla: 'CONTRAN', nome: 'Conselho Nacional de Trânsito', tipo: 'colegiado', deptKey: '', filhos: [] },
    { id: 'CGNT', sigla: 'CGNT', nome: 'Comitê de Governança do Planejamento Integrado de Transportes', tipo: 'colegiado', deptKey: '', filhos: [] },
    { id: 'CONSETRANS', sigla: 'CONSETRANS', nome: 'Conselho Nacional de Secretários de Transportes', tipo: 'colegiado', deptKey: '', filhos: [] },
    { id: 'DNIT', sigla: 'DNIT', nome: 'Departamento Nacional de Infraestrutura de Transportes', tipo: 'vinculada', deptKey: '', filhos: [] },
    { id: 'ANTT', sigla: 'ANTT', nome: 'Agência Nacional de Transportes Terrestres', tipo: 'vinculada', deptKey: '', filhos: [] },
    { id: 'INFRA', sigla: 'INFRA', nome: 'Infra S.A. / Valec / EPL', tipo: 'vinculada', deptKey: '', filhos: [] },
  ]
};

const THEME = {
  ministerio: { color: '#e2e8f0', stripe: 'linear-gradient(90deg,#1e3a5f,#0f2d5a)', border: 'rgba(100,140,200,0.5)', badgeBg: 'rgba(30,58,95,0.8)' },
  secretaria: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  gabinete: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  subsecretaria: { color: '#6ee7b7', stripe: 'linear-gradient(90deg,#047857,#059669)', border: 'rgba(16,185,129,0.5)', badgeBg: 'rgba(4,120,87,0.3)' },
  assessoria: { color: '#6ee7b7', stripe: 'linear-gradient(90deg,#047857,#059669)', border: 'rgba(16,185,129,0.5)', badgeBg: 'rgba(4,120,87,0.3)' },
  coordenacao: { color: '#6ee7b7', stripe: 'linear-gradient(90deg,#047857,#059669)', border: 'rgba(16,185,129,0.5)', badgeBg: 'rgba(4,120,87,0.3)' },
  consultoria: { color: '#67e8f9', stripe: 'linear-gradient(90deg,#0369a1,#0284c7)', border: 'rgba(14,165,233,0.5)', badgeBg: 'rgba(3,105,161,0.3)' },
  departamento: { color: '#6ee7b7', stripe: 'linear-gradient(90deg,#047857,#059669)', border: 'rgba(16,185,129,0.5)', badgeBg: 'rgba(4,120,87,0.3)' },
  colegiado: { color: '#fcd34d', stripe: 'linear-gradient(90deg,#d97706,#b45309)', border: 'rgba(245,158,11,0.5)', badgeBg: 'rgba(217,119,6,0.3)' },
  vinculada: { color: '#fb923c', stripe: 'linear-gradient(90deg,#ea580c,#c2410c)', border: 'rgba(249,115,22,0.5)', badgeBg: 'rgba(234,88,12,0.3)' },
};

/* ── Helpers de avatar ─────────────────────────────────────── */
const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#0891b2', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];
function getAvatarColor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function getInitials(name) {
  const p = name.split(' ').filter(x => x.length > 2);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

/* ═══════════════════════════════════════════════════════════
   CARD DO NÓ
   ═══════════════════════════════════════════════════════════ */
function NodeCard({ node, contacts, contactList, isRoot, expanded, onToggle, onSelectNode }) {
  const theme = THEME[node.tipo] || THEME.assessoria;
  const hasChildren = node.filhos && node.filhos.length > 0;
  const hasContacts = contacts > 0;

  return (
    <div
      className={`org-modern-card${isRoot ? ' root-card' : ''}`}
      style={{ borderColor: theme.border }}
      onClick={() => hasContacts && onSelectNode(node, contactList)}
    >
      <div className="org-card-stripe" style={{ background: theme.stripe }} />
      <div className="org-card-body">
        <div className="card-header">
          <span className="badge" style={{ backgroundColor: theme.badgeBg, color: theme.color, borderColor: theme.border }}>
            {node.sigla}
          </span>
          {hasContacts && (
            <span className="contact-count" title="Ver pessoas deste setor">
              <Users size={10} /> {contacts}
            </span>
          )}
        </div>
        <h3 className="card-title">{node.nome}</h3>
        <p className="card-subtitle">{node.tipo}</p>
        {hasChildren && (
          <button
            className="expand-toggle"
            style={{ color: expanded ? theme.color : undefined }}
            onClick={e => { e.stopPropagation(); onToggle(); }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{expanded ? 'Recolher' : 'Expandir'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NÓ RECURSIVO
   ═══════════════════════════════════════════════════════════ */
function OrgNode({ node, allContacts, defaultExpanded, onSelectNode }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const hasChildren = node.filhos && node.filhos.length > 0;

  const contactList = useMemo(
    () => node.deptKey ? allContacts.filter(c => c.departamento === node.deptKey) : [],
    [allContacts, node.deptKey]
  );

  const label = (
    <NodeCard
      node={node}
      contacts={contactList.length}
      contactList={contactList}
      isRoot={false}
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      onSelectNode={onSelectNode}
    />
  );

  if (!hasChildren || !expanded) return <TreeNode label={label} />;

  return (
    <TreeNode label={label}>
      {node.filhos.map(child => (
        <OrgNode key={child.id} node={child} allContacts={allContacts} onSelectNode={onSelectNode} />
      ))}
    </TreeNode>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAINEL DE CONTATOS DO SETOR
   ═══════════════════════════════════════════════════════════ */
function ContactPanel({ node, contacts, onClose, onEmail }) {
  if (!node) return null;
  const theme = THEME[node.tipo] || THEME.assessoria;
  const hasEmails = contacts.some(c => c.email);

  return (
    <div className="org-contact-panel">
      <div className="ocp-header" style={{ borderBottom: `2px solid ${theme.border}` }}>
        <div>
          <span className="badge" style={{ backgroundColor: theme.badgeBg, color: theme.color, borderColor: theme.border, fontSize: '0.62rem' }}>
            {node.sigla}
          </span>
          <div className="ocp-title">{node.nome}</div>
          <div className="ocp-count"><Users size={12} /> {contacts.length} pessoa{contacts.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          {hasEmails && (
            <button
              className="action-btn email-btn"
              onClick={onEmail}
              title="Enviar e-mail às pessoas deste setor"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: '0.75rem' }}
            >
              <Mail size={13} /> E-mail setor
            </button>
          )}
          <button className="modal-close" onClick={onClose}><X size={15} /></button>
        </div>
      </div>

      <div className="ocp-list">
        {contacts.length === 0 ? (
          <div className="ocp-empty">Nenhum contato cadastrado neste setor.</div>
        ) : (
          contacts.map(c => {
            const color = getAvatarColor(c.nome);
            const initials = getInitials(c.nome);
            return (
              <div key={c.id} className="ocp-item">
                <div className="ocp-avatar" style={{ background: color }}>{initials}</div>
                <div className="ocp-info">
                  <div className="ocp-name">{c.nome}</div>
                  {c.cargo && <div className="ocp-cargo">{c.cargo}</div>}
                  {c.email && (
                    <div className="ocp-detail"><Mail size={11} /><a href={`mailto:${c.email}`}>{c.email}</a></div>
                  )}
                  {c.telefone && (
                    <div className="ocp-detail"><Phone size={11} /><span>{c.telefone}</span></div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTES E E-MAIL PADRÃO
   ═══════════════════════════════════════════════════════ */
const ZOOM_MIN = 0.15, ZOOM_MAX = 2.5, ZOOM_STEP = 0.12, DRAG_THRESHOLD = 5;

const EMAIL_DEFAULT_SUBJECT = 'Comunicado — Ministério dos Transportes';
const EMAIL_DEFAULT_BODY =
  `Prezado(a),

Encaminhamos este comunicado em nome do Ministério dos Transportes.

Atenciosamente,
Equipe de Gestão de Pessoas — MT`;

/* Tamanho virtual máximo do conteúdo (margem de segurança) */
const CONTENT_VIRTUAL_W = 7000;
const CONTENT_VIRTUAL_H = 4000;

/**
 * Limita x e y para que pelo menos MARGIN px do conteúdo
 * permaneça visível dentro do canvas.
 */
function clampPan(x, y, scale, canvasEl) {
  if (!canvasEl) return { x, y };
  const { width: vw, height: vh } = canvasEl.getBoundingClientRect();
  const MARGIN = 120; // px mínimos visíveis
  const contentW = CONTENT_VIRTUAL_W * scale;
  const contentH = CONTENT_VIRTUAL_H * scale;
  return {
    x: Math.max(MARGIN - contentW, Math.min(vw - MARGIN, x)),
    y: Math.max(MARGIN - contentH, Math.min(vh - MARGIN, y)),
  };
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function OrgChart() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [rootExpanded, setRootExpanded] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.75 });
  const [isDragging, setIsDragging] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState(EMAIL_DEFAULT_SUBJECT);
  const [emailBody, setEmailBody] = useState(EMAIL_DEFAULT_BODY);
  const [emailTargetList, setEmailTargetList] = useState(null); // null = todos

  const canvasRef = useRef(null);
  const pointerRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/contacts`).then(r => r.json()).then(setContacts).catch(() => { });
  }, []);

  const displayContacts = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      c.nome?.toLowerCase().includes(q) || c.departamento?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const rootContactList = useMemo(
    () => displayContacts.filter(c => c.departamento === ORG_TREE.deptKey),
    [displayContacts]
  );

  /* ── Zoom com scroll ──────────────────────────────────── */
  const handleWheel = useCallback(e => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setTransform(prev => {
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.scale + delta));
      const ratio = newScale / prev.scale;
      const nx = mouseX - ratio * (mouseX - prev.x);
      const ny = mouseY - ratio * (mouseY - prev.y);
      const clamped = clampPan(nx, ny, newScale, canvasRef.current);
      return { scale: newScale, ...clamped };
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  /* ── Pan ─────────────────────────────────────────────── */
  const onPointerDown = useCallback(e => {
    if (e.button !== 0) return;
    // Ignora cliques dentro de cards (botões, textos, etc.)
    if (e.target.closest('.org-modern-card')) return;
    pointerRef.current = {
      startX: e.clientX, startY: e.clientY,
      originX: transform.x, originY: transform.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [transform.x, transform.y]);

  const onPointerMove = useCallback(e => {
    if (!pointerRef.current) return;
    const dx = e.clientX - pointerRef.current.startX;
    const dy = e.clientY - pointerRef.current.startY;
    if (!pointerRef.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    pointerRef.current.moved = true;
    setIsDragging(true);
    const nx = pointerRef.current.originX + dx;
    const ny = pointerRef.current.originY + dy;
    setTransform(prev => {
      const clamped = clampPan(nx, ny, prev.scale, canvasRef.current);
      return { ...prev, ...clamped };
    });
  }, []);

  const onPointerUp = useCallback(e => {
    if (pointerRef.current) e.currentTarget.releasePointerCapture?.(e.pointerId);
    pointerRef.current = null;
    setIsDragging(false);
  }, []);

  /* ── Zoom buttons ───────────────────────────────────── */
  const zoomBy = delta => {
    const el = canvasRef.current; if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setTransform(prev => {
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.scale + delta));
      const ratio = newScale / prev.scale;
      const nx = width / 2 - ratio * (width / 2 - prev.x);
      const ny = height / 2 - ratio * (height / 2 - prev.y);
      const clamped = clampPan(nx, ny, newScale, el);
      return { scale: newScale, ...clamped };
    });
  };

  const resetView = () => {
    const el = canvasRef.current;
    const clamped = clampPan(0, 0, 0.75, el);
    setTransform({ scale: 0.75, ...clamped });
  };

  const handleSelectNode = (node, contactList) => setSelectedNode({ node, contacts: contactList });

  /* ── E-mail ──────────────────────────────────────────── */
  const openEmailModal = (targetList = null) => {
    setEmailTargetList(targetList);
    setShowEmailModal(true);
  };

  const sendEmail = () => {
    const list = emailTargetList ?? contacts;
    const emails = list.map(c => c.email).filter(Boolean);
    if (emails.length === 0) {
      alert('Nenhum e-mail encontrado nos contatos selecionados.');
      return;
    }
    const to = emails.join(';');
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  /* ── Root label ─────────────────────────────────────── */
  const rootLabel = (
    <NodeCard
      node={ORG_TREE}
      contacts={rootContactList.length}
      contactList={rootContactList}
      isRoot={true}
      expanded={rootExpanded}
      onToggle={() => setRootExpanded(v => !v)}
      onSelectNode={handleSelectNode}
    />
  );

  return (
    <div className="org-container">
      {/* Toolbar */}
      <div className="org-toolbar">
        <div className="org-title-area">
          <h2>
            <Network size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
            Estrutura Organizacional
          </h2>
          <p>Clique num card para ver as pessoas · Arraste para mover · Scroll para zoom</p>
        </div>
        <div className="org-actions">
          <div className="search-box">
            <Search size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar unidade..." />
          </div>
          <button
            className="action-btn email-btn"
            onClick={() => openEmailModal()}
            title="Enviar e-mail a todos os contatos"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Mail size={14} /> E-mail
          </button>
        </div>
      </div>

      {/* Área principal: canvas + painel lateral */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="org-canvas figma-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', flex: 1 }}
        >
          <div
            style={{
              transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0',
              willChange: 'transform',
              padding: '80px 120px 120px',
              display: 'inline-block',
            }}
          >
            {rootExpanded ? (
              <Tree lineWidth="1.5px" lineColor="rgba(255,255,255,0.1)" lineBorderRadius="10px" label={rootLabel}>
                {ORG_TREE.filhos.map(child => (
                  <OrgNode
                    key={child.id}
                    node={child}
                    allContacts={displayContacts}
                    onSelectNode={handleSelectNode}
                  />
                ))}
              </Tree>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center' }}>{rootLabel}</div>
            )}
          </div>

          {/* HUD */}
          <div className="canvas-hud">
            <button className="hud-btn" onClick={() => zoomBy(-ZOOM_STEP)}><ZoomOut size={15} /></button>
            <span className="hud-zoom-label">{Math.round(transform.scale * 100)}%</span>
            <button className="hud-btn" onClick={() => zoomBy(ZOOM_STEP)}><ZoomIn size={15} /></button>
            <div className="hud-divider" />
            <button className="hud-btn" onClick={resetView}><Maximize2 size={14} /></button>
          </div>
        </div>

        {/* Painel de contatos do setor */}
        {selectedNode && (
          <ContactPanel
            node={selectedNode.node}
            contacts={selectedNode.contacts}
            onClose={() => setSelectedNode(null)}
            onEmail={() => openEmailModal(selectedNode.contacts)}
          />
        )}
      </div>

      {/* Modal de E-mail */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Enviar E-mail</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {emailTargetList
                      ? `${emailTargetList.filter(c => c.email).length} destinatário(s) do setor selecionado`
                      : `${contacts.filter(c => c.email).length} destinatário(s) — todos os contatos`}
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
