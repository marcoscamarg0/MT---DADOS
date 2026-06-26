import React, { useState, useMemo, useRef } from 'react';
import { FileJson, FileText, Search, Users, ChevronDown, ChevronRight, Mail, Phone } from 'lucide-react';
import './styles.css'; // Importe o seu CSS aqui

const API = 'http://localhost:3001/api';

const ORG_TREE = {
    id: 'GM', sigla: 'GM', nome: 'Gabinete do Ministro', tipo: 'ministerio', deptKey: 'Gabinete do Ministro - GM',
    filhos: [
        { id: 'AESCOM', sigla: 'AESCOM', nome: 'Comunicação Social', tipo: 'assessoria', deptKey: 'Assessoria Especial de Comunicação Social - AESCOM', filhos: [] },
        {
            id: 'SE', sigla: 'SE', nome: 'Secretaria Executiva', tipo: 'secretaria', deptKey: 'Secretaria Executiva - SE',
            filhos: [
                { id: 'SPOA', sigla: 'SPOA', nome: 'Planejamento e Adm.', tipo: 'subsecretaria', deptKey: 'SPOA - Planejamento, Orçamento e Administração', filhos: [] },
                { id: 'SGETI', sigla: 'SGETI', nome: 'Gestão Estratégica e TI', tipo: 'subsecretaria', deptKey: 'SGETI - Gestão Estratégica, Tecnologia e Inovação', filhos: [] },
            ]
        },
        {
            id: 'SNTR', sigla: 'SNTR', nome: 'Sec. Nacional de Transporte Rodoviário', tipo: 'secretaria', deptKey: 'Secretaria Nacional de Transporte Rodoviário - SNTR',
            filhos: [
                { id: 'DOP_SNTR', sigla: 'DOP', nome: 'Obras Públicas Rodoviárias', tipo: 'departamento', deptKey: 'DOP/SNTR - Obras Públicas', filhos: [] },
            ]
        },
        {
            id: 'SNTF', sigla: 'SNTF', nome: 'Sec. Nacional de Transporte Ferroviário', tipo: 'secretaria', deptKey: 'Secretaria Nacional de Transporte Ferroviário - SNTF',
            filhos: [
                { id: 'DOP_SNTF', sigla: 'DOP', nome: 'Obras Ferroviárias', tipo: 'departamento', deptKey: 'DOP/SNTF - Obras e Projetos Ferroviários', filhos: [] },
            ]
        }
    ]
};

const STYLES = {
    ministerio: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Ministério' },
    secretaria: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Secretaria' },
    assessoria: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Assessoria' },
    subsecretaria: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Subsecretaria' },
    departamento: { color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', label: 'Departamento' },
};

function getInitials(name) {
    if (!name) return '??';
    const p = name.split(' ').filter(x => x.length > 2);
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function ContactTooltip({ contacts, nome, tipo, rect }) {
    const cfg = STYLES[tipo] || STYLES.assessoria;
    const above = (window.innerHeight - rect.bottom) < 300;

    const style = {
        left: Math.min(rect.left, window.innerWidth - 300),
        ...(above ? { bottom: window.innerHeight - rect.top + 10 } : { top: rect.bottom + 10 })
    };

    return (
        <div className="org-tooltip" style={style}>
            <div className="org-tooltip-header" style={{ background: cfg.bg }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0' }}>{nome}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{contacts.length} contatos</div>
            </div>
            <div className="org-tooltip-body">
                {contacts.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>Sem contatos</div>
                ) : (
                    contacts.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: '10px', padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 16, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                                {getInitials(c.nome)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.nome}</div>
                                {c.cargo && <div style={{ fontSize: '11px', color: '#64748b' }}>{c.cargo}</div>}
                                {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}><Mail size={10} /> {c.email}</div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function OrgNode({ node, allContacts, depth = 0 }) {
    const [expanded, setExpanded] = useState(depth < 1);
    const [hovered, setHovered] = useState(false);
    const [rect, setRect] = useState(null);
    const nodeRef = useRef(null);

    const cfg = STYLES[node.tipo] || STYLES.assessoria;
    const hasChildren = (node.filhos || []).length > 0;
    const contacts = useMemo(() => allContacts.filter(c => c.departamento === node.deptKey), [allContacts, node.deptKey]);

    return (
        <div className={`org-node-group ${depth === 0 ? 'org-tree-root' : ''}`}>
            <div className="org-card-wrapper" ref={nodeRef} onMouseEnter={() => { setRect(nodeRef.current.getBoundingClientRect()); setHovered(true); }} onMouseLeave={() => setHovered(false)}>
                <div className="org-card" style={{ width: depth === 0 ? 220 : 180 }}>
                    <div className="org-card-accent" style={{ background: cfg.color }} />
                    <div className="org-card-body">
                        <span className="org-sigla" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {node.sigla}
                        </span>
                        <div className="org-nome">{node.nome}</div>
                        {contacts.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                                <Users size={12} /> {contacts.length}
                            </div>
                        )}
                    </div>
                    {hasChildren && (
                        <button className="org-expand-btn" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}
                </div>
                {hovered && rect && <ContactTooltip contacts={contacts} nome={node.nome} tipo={node.tipo} rect={rect} />}
            </div>

            {hasChildren && expanded && (
                <div className="org-children">
                    {node.filhos.map(child => (
                        <OrgNode key={child.id} node={child} allContacts={allContacts} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function OrgChart() {
    const [contacts, setContacts] = React.useState([]);
    const [search, setSearch] = React.useState('');

    React.useEffect(() => {
        fetch(`${API}/contacts`).then(r => r.json()).then(setContacts).catch(() => { });
    }, []);

    const displayContacts = useMemo(() => {
        if (!search) return contacts;
        const q = search.toLowerCase();
        return contacts.filter(c => c.nome?.toLowerCase().includes(q) || c.departamento?.toLowerCase().includes(q));
    }, [contacts, search]);

    return (
        <div className="org-chart-wrapper">
            <div className="org-header">
                <div>
                    <h2>Organograma</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Passe o mouse nos cards para ver as equipes</p>
                </div>
                <div className="search-input-wrap" style={{ width: '300px' }}>
                    <Search size={16} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contato..." />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-outline"><FileJson size={16} /> JSON</button>
                    <button className="btn-outline"><FileText size={16} /> CSV</button>
                </div>
            </div>
            <div className="org-tree-container">
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <OrgNode node={ORG_TREE} allContacts={displayContacts} />
                </div>
            </div>
        </div>
    );
}