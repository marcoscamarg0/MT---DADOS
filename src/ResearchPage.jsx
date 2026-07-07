import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  BookOpen, Search, Sparkles, Brain, Users, ChevronRight,
  Clock, Tag, ExternalLink, Copy, Check, RotateCcw,
  FileText, Shield, BarChart3, Database, Globe, X,
  BookMarked, Lightbulb, AlertCircle, ChevronDown, Plus, Trash2, Link,
  Send, MessageSquarePlus, PanelRightOpen, PanelRightClose, Bot, User
} from 'lucide-react';
import { loadOrgFlat } from './OrgChart';

const API = '/api';
const HISTORY_KEY = 'mt-chat-history-v2';

const CATEGORIES = [
  {
    id: 'governanca', icon: Shield, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
    title: 'Governança de Dados na APF',
    description: 'Frameworks, políticas e boas práticas para o setor público federal',
    query: 'Como estruturar um programa de governança de dados no serviço público federal brasileiro e quem eu devo procurar internamente no órgão para iniciar esse projeto?',
  },
  {
    id: 'maturidade', icon: BarChart3, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
    title: 'Maturidade em Dados',
    description: 'Modelos DMBOK, CMMI e avaliação de maturidade organizacional',
    query: 'Quais são os principais modelos de maturidade em dados e quais setores ou coordenadores no nosso órgão podem atuar como líderes dessa transformação?',
  },
  {
    id: 'lgpd', icon: FileText, color: '#10b981', bg: 'rgba(16,185,129,0.12)',
    title: 'LGPD e ANPD atualizada',
    description: 'Conformidade, ANPD como agência reguladora e obrigações da APF',
    query: 'O que mudou na LGPD e na atuação da ANPD mais recentemente, e quais são as obrigações atuais da Administração Pública Federal? Quais especialistas do nosso quadro devem participar do comitê de adequação?',
  },
  {
    id: 'ia-lei', icon: Sparkles, color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
    title: 'Marco Legal da IA (PL 2.338)',
    description: 'Situação atual do projeto de lei e impactos para o setor público',
    query: 'Em que pé está o Marco Legal da Inteligência Artificial (PL 2.338/2023) e como ele vai se relacionar com a LGPD no tratamento de dados no setor público?',
  },
  {
    id: 'politicas', icon: Globe, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    title: 'Políticas e Frameworks Nacionais',
    description: 'INDA, EGD, PNPD e estratégias de dados do governo federal',
    query: 'Explique a Infraestrutura Nacional de Dados Abertos (INDA) e aponte os setores que devem garantir o cumprimento do decreto 8.777.',
  }
];

const REFERENCES = [
  { id: 1, title: 'LGPD — Lei 13.709/2018', type: 'Lei', tags: ['LGPD', 'Privacidade'], url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', year: '2018' },
  { id: 2, title: 'ECA Digital — Lei 15.211/2025', type: 'Lei', tags: ['LGPD', 'Crianças'], url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm', year: '2025' },
  { id: 3, title: 'Marco Legal da IA — PL 2.338/2023 (Senado)', type: 'Projeto de Lei', tags: ['IA', 'Governança'], url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/157233', year: '2023' },
  { id: 4, title: 'Estratégia de Governo Digital 2024-2027', type: 'Política', tags: ['EGD', 'Governo Digital'], url: 'https://www.gov.br/governodigital/pt-br/estrategia-de-governanca-digital', year: '2024' },
  { id: 5, title: 'DAMA-DMBOK — Data Management Body of Knowledge', type: 'Framework', tags: ['DMBOK', 'Maturidade'], url: 'https://www.dama.org/cpages/body-of-knowledge', year: '2017' },
  { id: 6, title: 'Acórdão TCU 2.569/2020 — Governança de Dados', type: 'Acórdão TCU', tags: ['TCU', 'Governança'], url: 'https://portal.tcu.gov.br', year: '2020' },
  { id: 7, title: 'Governança de Dados — INDA', type: 'Portal', tags: ['INDA', 'Governança'], url: 'https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/governancadedados', year: '2024' },
  { id: 8, title: 'PGDados — Programa de Governança', type: 'Portal', tags: ['INDA', 'Governança'], url: 'https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/governancadedados/pgdados', year: '2024' },
  { id: 9, title: 'ANPD — Agenda Regulatória 2025-2026', type: 'Regulação', tags: ['LGPD', 'ANPD'], url: 'https://www.gov.br/anpd/pt-br', year: '2026' },
];

function parseBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p);
}

function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('|') && line.includes('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={'table' + i} className="chat-md-table-wrap">
          <table className="chat-md-table">
            <tbody>
              {tableLines.map((tLine, tIdx) => {
                const isHeader = tIdx === 0;
                const isSeparator = tLine.replace(/[\s|:-]/g, '').length === 0;
                if (isSeparator) return null;
                const cells = tLine.split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
                return (
                  <tr key={tIdx} className={isHeader ? 'chat-md-tr-head' : ''}>
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className={isHeader ? 'chat-md-th' : 'chat-md-td'}>
                        {parseBold(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith('### ')) elements.push(<h3 key={i} className="chat-md-h3">{line.slice(4)}</h3>);
    else if (line.startsWith('## ')) elements.push(<h2 key={i} className="chat-md-h2">{line.slice(3)}</h2>);
    else if (line.startsWith('# ')) elements.push(<h1 key={i} className="chat-md-h1">{line.slice(2)}</h1>);
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i}>{parseBold(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={'ul' + i} className="chat-md-ul">{items}</ul>);
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i}>{parseBold(lines[i].replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      elements.push(<ol key={'ol' + i} className="chat-md-ol">{items}</ol>);
      continue;
    } else if (line.startsWith('---')) elements.push(<hr key={i} className="chat-md-hr" />);
    else if (line.trim() === '') elements.push(<div key={i} style={{ height: 10 }} />);
    else elements.push(<p key={i} className="chat-md-p">{parseBold(line)}</p>);
    i++;
  }
  return <div className="chat-md">{elements}</div>;
}

function TypingIndicator() {
  return (
    <div className="chat-typing">
      <span /><span /><span />
    </div>
  );
}

function normalizeText(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/* Usado só para decidir quais cartões de contato mostrar na tela
   embaixo da resposta (UI). Não limita o que a IA pode citar — ela
   já recebe o diretório e o organograma completos no back-end. */
function extractMentionedContacts(answerText, contacts) {
  if (!answerText) return [];
  const normAnswer = normalizeText(answerText);
  return contacts.filter(c => {
    if (!c.nome) return false;
    const parts = normalizeText(c.nome).split(/\s+/).filter(p => p.length > 2);
    if (parts.length === 0) return false;
    const matchCount = parts.filter(p => normAnswer.includes(p)).length;
    return parts.length === 1 ? matchCount === 1 : matchCount >= 2;
  }).slice(0, 12);
}

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export default function ResearchPage({ contacts = [] }) {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTag, setActiveTag] = useState('Todos');
  const [copiedId, setCopiedId] = useState(null);

  const [customSources, setCustomSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [newSource, setNewSource] = useState({ titulo: '', url: '', notas: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [orgNodes, setOrgNodes] = useState([]);
  useEffect(() => { setOrgNodes(loadOrgFlat()); }, []);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const allTags = ['Todos', ...new Set(REFERENCES.flatMap(r => r.tags))];
  const filteredRefs = activeTag === 'Todos' ? REFERENCES : REFERENCES.filter(r => r.tags.includes(activeTag));

  useEffect(() => {
    fetch(`${API}/research/sources`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomSources(data);
          setSelectedSources(new Set(data.map(s => s.id)));
        }
      })
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-60))); } catch { }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const sendMessage = useCallback(async (text) => {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: q };
    const priorMessages = messages;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const activeCustomSources = customSources.filter(s => selectedSources.has(s.id));
      const enrichedSources = await Promise.all(activeCustomSources.map(async (s) => {
        if (s.url) {
          try {
            const r = await fetch(`${API}/research/fetch-url`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: s.url })
            });
            if (r.ok) {
              const { text: pageText } = await r.json();
              return { ...s, conteudo_url: pageText };
            }
          } catch (e) { }
        }
        return s;
      }));

      const history = priorMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API}/research/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          sources: enrichedSources,
          contacts,
          orgChart: orgNodes,
          history,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao consultar a IA');

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer,
        related: extractMentionedContacts(data.answer, contacts),
        sourcesUsed: selectedSources.size,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const errMsg = { id: Date.now() + 2, role: 'assistant', error: e.message };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, contacts, orgNodes, customSources, selectedSources]);

  const handleSubmit = (e) => { e?.preventDefault(); sendMessage(input); };
  const handleCat = (cat) => { sendMessage(cat.query); };
  const newChat = () => { setMessages([]); try { localStorage.removeItem(HISTORY_KEY); } catch { }; inputRef.current?.focus(); };
  const copyMsg = async (id, content) => { await navigator.clipboard.writeText(content || ''); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); };

  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!newSource.titulo) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/research/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });
      if (res.ok) {
        const data = await res.json();
        setCustomSources([data, ...customSources]);
        setSelectedSources(prev => new Set(prev).add(data.id));
      } else {
        const fallbackData = { id: Date.now().toString(), ...newSource };
        setCustomSources([fallbackData, ...customSources]);
        setSelectedSources(prev => new Set(prev).add(fallbackData.id));
      }
    } catch (err) {
      const fallbackData = { id: Date.now().toString(), ...newSource };
      setCustomSources([fallbackData, ...customSources]);
      setSelectedSources(prev => new Set(prev).add(fallbackData.id));
    } finally {
      setNewSource({ titulo: '', url: '', notas: '' });
      setIsSaving(false);
    }
  };

  const handleDeleteSource = async (id) => {
    try { await fetch(`${API}/research/sources/${id}`, { method: 'DELETE' }); } catch (err) { }
    setCustomSources(customSources.filter(s => s.id !== id));
    const nextSel = new Set(selectedSources);
    nextSel.delete(id);
    setSelectedSources(nextSel);
  };

  const toggleSourceSelection = (id) => {
    const nextSel = new Set(selectedSources);
    if (nextSel.has(id)) nextSel.delete(id); else nextSel.add(id);
    setSelectedSources(nextSel);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-page">

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-avatar"><Bot size={18} /></div>
          <div>
            <div className="chat-header-title">Assistente de Governança de Dados</div>
            <div className="chat-header-sub">
              <span className="chat-status-dot" /> Legislação atualizada · LGPD, ANPD, ECA Digital e Marco Legal da IA
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-header-btn" onClick={newChat} title="Nova conversa">
            <MessageSquarePlus size={15} /><span>Novo chat</span>
          </button>
          <button className="chat-header-btn" onClick={() => setPanelOpen(v => !v)} title="Biblioteca e fontes">
            {panelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            <span>Biblioteca</span>
          </button>
        </div>
      </div>

      <div className="chat-body">
        {/* Messages */}
        <div className="chat-main">
          <div className="chat-messages" ref={scrollRef}>
            {isEmpty ? (
              <div className="chat-welcome">
                <div className="chat-welcome-icon"><Sparkles size={26} /></div>
                <h1 className="chat-welcome-title">Como posso ajudar hoje?</h1>
                <p className="chat-welcome-sub">
                  Tire dúvidas sobre governança de dados, LGPD, ANPD, ECA Digital e o Marco Legal da IA — e pergunte à vontade sobre contatos, setores e o organograma do Ministério dos Transportes, ex.: <em>"quem devo procurar na Secretaria Executiva?"</em> ou <em>"qual o contato de Maria Silva?"</em>
                </p>
                <div className="chat-suggestions-grid">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button key={cat.id} className="chat-suggestion-card"
                        style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}
                        onClick={() => handleCat(cat)}>
                        <div className="chat-suggestion-icon"><Icon size={17} /></div>
                        <div>
                          <div className="chat-suggestion-title">{cat.title}</div>
                          <div className="chat-suggestion-desc">{cat.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="chat-thread">
                {messages.map(m => (
                  <div key={m.id} className={`chat-row chat-row--${m.role}`}>
                    <div className="chat-avatar">
                      {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                    </div>
                    <div className="chat-bubble-col">
                      <div className={`chat-bubble chat-bubble--${m.role}${m.error ? ' chat-bubble--error' : ''}`}>
                        {m.error ? (
                          <div className="chat-error">
                            <AlertCircle size={15} />
                            <div>
                              <div style={{ fontWeight: 700 }}>Erro ao consultar a IA</div>
                              <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 2 }}>{m.error}</div>
                            </div>
                          </div>
                        ) : m.role === 'assistant' ? (
                          <SimpleMarkdown text={m.content} />
                        ) : (
                          <p className="chat-user-text">{m.content}</p>
                        )}
                      </div>

                      {m.role === 'assistant' && !m.error && (
                        <div className="chat-bubble-actions">
                          <button className="chat-icon-btn-sm" onClick={() => copyMsg(m.id, m.content)}>
                            {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === m.id ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                      )}

                      {m.role === 'assistant' && m.related && m.related.length > 0 && (
                        <div className="chat-related">
                          <div className="chat-related-label"><Users size={12} /> Especialistas recomendados</div>
                          <div className="chat-related-grid">
                            {m.related.map(c => (
                              <div key={c.id} className="chat-related-card">
                                <div className="chat-related-name">{c.nome}</div>
                                <div className="chat-related-cargo">{c.cargo || '—'}</div>
                                <div className="chat-related-dept">{c.departamento || '—'}</div>
                                {c.email && <a className="chat-related-mail" href={`mailto:${c.email}`}>{c.email}</a>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="chat-row chat-row--assistant">
                    <div className="chat-avatar"><Bot size={15} /></div>
                    <div className="chat-bubble-col">
                      <div className="chat-bubble chat-bubble--assistant chat-bubble--loading">
                        <TypingIndicator />
                        <span className="chat-loading-text">Consultando legislação e especialistas...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <form className="chat-input-bar" onSubmit={handleSubmit}>
            <div className="chat-input-wrap">
              <textarea
                ref={(el) => { textareaRef.current = el; inputRef.current = el; }}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte sobre governança de dados, LGPD, ANPD, IA..."
                rows={1}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !loading) handleSubmit(e);
                  }
                }}
              />
              <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
                {loading ? <span className="chat-spinner" /> : <Send size={16} />}
              </button>
            </div>
            <div className="chat-input-hint">Enter para enviar · Shift+Enter para quebrar linha</div>
          </form>
        </div>

        {/* Side panel: library + sources */}
        <div className={`chat-panel${panelOpen ? ' chat-panel--open' : ''}`}>
          <div className="chat-panel-inner">
            <div className="chat-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookMarked size={15} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Biblioteca de Referências</span>
              </div>
              <button className="chat-icon-btn-sm chat-panel-close" onClick={() => setPanelOpen(false)}><X size={14} /></button>
            </div>

            <div className="chat-panel-section">
              <div className="chat-tags-filter">
                {allTags.map(t => (
                  <button key={t} className={`chat-tag-btn${activeTag === t ? ' active' : ''}`} onClick={() => setActiveTag(t)}>{t}</button>
                ))}
              </div>
              <div className="chat-refs-list">
                {filteredRefs.map(ref => (
                  <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer" className="chat-ref-card">
                    <div className="chat-ref-top"><span className="chat-ref-type">{ref.type}</span><span className="chat-ref-year">{ref.year}</span></div>
                    <div className="chat-ref-title">{ref.title}</div>
                    <ExternalLink size={11} className="chat-ref-ext" />
                  </a>
                ))}
              </div>
            </div>

            <div className="chat-panel-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Database size={15} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Memória da IA (fontes)</span>
              </div>
              <p className="chat-panel-hint">Adicione páginas, links ou anotações para a IA usar como contexto nas respostas.</p>

              <form onSubmit={handleAddSource} className="chat-source-form">
                <input
                  className="chat-form-input"
                  placeholder="Título da fonte"
                  value={newSource.titulo}
                  onChange={e => setNewSource({ ...newSource, titulo: e.target.value })}
                  required
                />
                <input
                  className="chat-form-input"
                  placeholder="URL (opcional)"
                  value={newSource.url}
                  onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                />
                <textarea
                  className="chat-form-input chat-form-textarea"
                  placeholder="Anotações ou texto..."
                  value={newSource.notas}
                  onChange={e => setNewSource({ ...newSource, notas: e.target.value })}
                />
                <button type="submit" className="chat-form-submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : <><Plus size={14} /> Salvar</>}
                </button>
              </form>

              {customSources.length > 0 && (
                <div className="chat-sources-list">
                  {customSources.map(source => (
                    <div key={source.id} className={`chat-source-item${selectedSources.has(source.id) ? ' active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedSources.has(source.id)}
                        onChange={() => toggleSourceSelection(source.id)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="chat-source-title">{source.titulo}</div>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noreferrer" className="chat-source-url">
                            <Link size={10} /> {source.url.slice(0, 32)}{source.url.length > 32 ? '...' : ''}
                          </a>
                        )}
                      </div>
                      <button type="button" onClick={() => handleDeleteSource(source.id)} className="chat-source-del">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {panelOpen && <div className="chat-panel-overlay" onClick={() => setPanelOpen(false)} />}
      </div>
    </div>
  );
}
