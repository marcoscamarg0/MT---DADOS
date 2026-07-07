import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  BookOpen, Search, Sparkles, Brain, Users, ChevronRight,
  Clock, Tag, ExternalLink, Copy, Check, RotateCcw,
  FileText, Shield, BarChart3, Database, Globe, X,
  BookMarked, Lightbulb, AlertCircle, ChevronDown, Plus, Trash2, Link
} from 'lucide-react';

const API = '/api';

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
    title: 'LGPD no Setor Público',
    description: 'Conformidade, adequação e responsabilidade dos órgãos públicos',
    query: 'Quais as obrigações da APF sob a LGPD e quais especialistas do nosso quadro devem fazer parte do comitê de adequação?',
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
  { id: 2, title: 'Estratégia de Governo Digital 2024-2027', type: 'Política', tags: ['EGD', 'Governo Digital'], url: 'https://www.gov.br/governodigital/pt-br/estrategia-de-governanca-digital', year: '2024' },
  { id: 3, title: 'DAMA-DMBOK — Data Management Body of Knowledge', type: 'Framework', tags: ['DMBOK', 'Maturidade'], url: 'https://www.dama.org/cpages/body-of-knowledge', year: '2017' },
  { id: 4, title: 'Acórdão TCU 2.569/2020 — Governança de Dados', type: 'Acórdão TCU', tags: ['TCU', 'Governança'], url: 'https://portal.tcu.gov.br', year: '2020' },
  { id: 5, title: 'Governança de Dados — INDA', type: 'Portal', tags: ['INDA', 'Governança'], url: 'https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/governancadedados', year: '2024' },
  { id: 6, title: 'PGDados — Programa de Governança', type: 'Portal', tags: ['INDA', 'Governança'], url: 'https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/governancadedados/pgdados', year: '2024' },
  { id: 7, title: 'Guia PGDados (Parte 1) — Política Interna', type: 'Guia', tags: ['Guia', 'Governança'], url: 'https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/governancadedados/arquivos/guia-pgdados/guia-parte-1_politica-interna-de-governanca-de-dados-_v1-4-2.pdf', year: '2024' },
  { id: 8, title: 'Guia PGDados (Parte 2) — Estratégia de Dados', type: 'Guia', tags: ['Guia', 'Governança'], url: 'https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/governancadedados/arquivos/guia-pgdados/guia-parte-2_estrategia-de-dados_v1-0.pdf', year: '2024' },
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
        <div key={'table' + i} style={{ overflowX: 'auto', margin: '20px 0', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', border: '1px solid var(--border)' }}>
            <tbody>
              {tableLines.map((tLine, tIdx) => {
                const isHeader = tIdx === 0;
                const isSeparator = tLine.replace(/[\s|:-]/g, '').length === 0;
                if (isSeparator) return null;
                const cells = tLine.split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
                return (
                  <tr key={tIdx} style={{ background: isHeader ? 'var(--bg-elevated)' : 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '12px 16px', fontWeight: isHeader ? '700' : '400', borderRight: '1px solid var(--border)', color: isHeader ? 'var(--primary)' : 'var(--text)' }}>
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

    if (line.startsWith('### ')) elements.push(<h3 key={i} className="research-md-h3" style={{ color: 'var(--primary)', marginTop: '24px' }}>{line.slice(4)}</h3>);
    else if (line.startsWith('## ')) elements.push(<h2 key={i} className="research-md-h2" style={{ borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginTop: '32px' }}>{line.slice(3)}</h2>);
    else if (line.startsWith('# ')) elements.push(<h1 key={i} className="research-md-h1">{line.slice(2)}</h1>);
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i} style={{ marginBottom: '6px' }}>{parseBold(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={'ul' + i} className="research-md-ul" style={{ background: 'var(--bg-elevated)', padding: '16px 16px 16px 32px', borderRadius: '8px' }}>{items}</ul>);
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: '6px' }}>{parseBold(lines[i].replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      elements.push(<ol key={'ol' + i} className="research-md-ol" style={{ background: 'var(--bg-elevated)', padding: '16px 16px 16px 32px', borderRadius: '8px' }}>{items}</ol>);
      continue;
    } else if (line.startsWith('---')) elements.push(<hr key={i} className="research-md-hr" style={{ borderTop: '2px dashed var(--border)', margin: '24px 0' }} />);
    else if (line.trim() === '') elements.push(<div key={i} style={{ height: 12 }} />);
    else elements.push(<p key={i} className="research-md-p" style={{ fontSize: '0.95rem', lineHeight: '1.7' }}>{parseBold(line)}</p>);
    i++;
  }
  return <div className="research-md">{elements}</div>;
}

function SkeletonBlock({ lines = 5 }) {
  return (
    <div className="research-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${60 + (i % 4) * 10}%` }} />
      ))}
    </div>
  );
}

const DATA_KW = ['dado', 'data', 'informação', 'ti', 'tecnologia', 'dgit', 'sistemas', 'lgpd', 'privacidade', 'segurança', 'assessor', 'diretor', 'gerente'];
function scoreContact(c, q) {
  const h = `${c.nome} ${c.cargo || ''} ${c.departamento || ''}`.toLowerCase();
  const qw = q.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  let s = 0;
  DATA_KW.forEach(k => { if (h.includes(k)) s += 2; });
  qw.forEach(w => { if (h.includes(w)) s += 3; });
  return s;
}

export default function ResearchPage({ contacts = [] }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem('mt-research-history') || '[]'); } catch { return []; } });
  const [activeTag, setActiveTag] = useState('Todos');
  const [copied, setCopied] = useState(false);
  const [showHist, setShowHist] = useState(false);

  const [customSources, setCustomSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [newSource, setNewSource] = useState({ titulo: '', url: '', notas: '' });
  const [isSaving, setIsSaving] = useState(false);

  const resultRef = useRef(null);
  const inputRef = useRef(null);

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

  const findRelated = useCallback((q) =>
    contacts.map(c => ({ ...c, score: scoreContact(c, q) }))
      .filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 10),
    [contacts]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setResult(null);

    const foundRelated = findRelated(q);
    setRelated(foundRelated);

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
              const { text } = await r.json();
              return { ...s, conteudo_url: text };
            }
          } catch (e) { }
        }
        return s;
      }));

      const res = await fetch(`${API}/research/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          sources: enrichedSources,
          contacts: foundRelated
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao consultar a IA');

      setResult(data.answer);

      const entry = { id: Date.now(), query: q };
      setHistory(prev => {
        const u = [entry, ...prev.filter(h => h.query !== q)].slice(0, 10);
        try { localStorage.setItem('mt-research-history', JSON.stringify(u)); } catch { }
        return u;
      });

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [findRelated, customSources, selectedSources]);

  const handleSubmit = (e) => { e?.preventDefault(); doSearch(query); };
  const handleCat = (cat) => { setQuery(cat.query); doSearch(cat.query); };
  const handleHist = (h) => { setQuery(h.query); doSearch(h.query); setShowHist(false); };
  const copyResult = async () => { await navigator.clipboard.writeText(result || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const clear = () => { setResult(null); setError(null); setRelated([]); setQuery(''); inputRef.current?.focus(); };

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
    try {
      await fetch(`${API}/research/sources/${id}`, { method: 'DELETE' });
    } catch (err) { }
    setCustomSources(customSources.filter(s => s.id !== id));
    const nextSel = new Set(selectedSources);
    nextSel.delete(id);
    setSelectedSources(nextSel);
  };

  const toggleSourceSelection = (id) => {
    const nextSel = new Set(selectedSources);
    if (nextSel.has(id)) nextSel.delete(id);
    else nextSel.add(id);
    setSelectedSources(nextSel);
  };

  return (
    <div className="research-page" style={{ height: '100%', overflowY: 'auto' }}>

      <div className="research-hero">
        <div className="research-hero-glow" />
        <div className="research-hero-content">
          <div className="research-hero-badge"><Brain size={14} /><span>IA · OpenRouter · Laguna XS-2.1</span></div>
          <h1 className="research-hero-title">Repositório de Pesquisas</h1>
          <p className="research-hero-sub">
            Governança de Dados &amp; Maturidade no Serviço Público Federal — com cruzamento inteligente de especialistas da sua base de contatos e leitura de links.
          </p>

          <form className="research-search-form" onSubmit={handleSubmit}>
            <div className="research-search-wrap" style={{ alignItems: 'flex-start', padding: '12px 16px' }}>
              <Search size={18} className="research-search-icon" style={{ marginTop: '4px' }} />
              <textarea
                id="research-search-input"
                ref={inputRef}
                className="research-search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ex: Como implementar governança de dados no MT e quem do banco de dados eu chamo para isso?"
                style={{
                  resize: 'vertical',
                  minHeight: '80px',
                  lineHeight: '1.5',
                  padding: '0'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (query.trim() && !loading) handleSubmit(e);
                  }
                }}
              />
              {query && <button type="button" className="research-search-clear" onClick={() => setQuery('')} style={{ marginTop: '2px' }}><X size={14} /></button>}
              <button type="submit" className="research-search-btn" disabled={loading || !query.trim()} style={{ marginTop: '0', alignSelf: 'flex-start' }}>
                {loading ? <span className="research-spinner" /> : <Sparkles size={15} />}
                {loading ? 'Analisando...' : 'Pesquisar'}
              </button>
            </div>

            {history.length > 0 && (
              <div className="research-history-wrap">
                <button type="button" className="research-history-toggle" onClick={() => setShowHist(v => !v)}>
                  <Clock size={12} /> Histórico ({history.length})
                  <ChevronDown size={11} style={{ transform: showHist ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>
                {showHist && (
                  <div className="research-history-list">
                    {history.map(h => (
                      <button key={h.id} className="research-history-item" onClick={() => handleHist(h)}>
                        <Clock size={11} /><span>{h.query.slice(0, 90)}{h.query.length > 90 ? '…' : ''}</span>
                      </button>
                    ))}
                    <button className="research-history-item research-history-clear"
                      onClick={() => { setHistory([]); localStorage.removeItem('mt-research-history'); setShowHist(false); }}>
                      <X size={11} /> Limpar histórico
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="research-body">

        {(loading || result || error) && (
          <div ref={resultRef} className="research-result-panel">
            <div className="research-result-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="research-result-icon"><Brain size={15} /></div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Análise da IA (Tutor Acadêmico)</span>
                {result && <span className="research-result-badge">Laguna XS-2.1</span>}
                {selectedSources.size > 0 && <span className="research-result-badge" style={{ background: 'var(--success-light)', color: 'var(--success)', borderColor: 'var(--success)' }}>{selectedSources.size} fonte(s) lida(s)</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {result && <button className="research-icon-btn" onClick={copyResult}>{copied ? <Check size={13} /> : <Copy size={13} />}</button>}
                <button className="research-icon-btn" onClick={clear}><RotateCcw size={13} /></button>
              </div>
            </div>

            <div className="research-result-body" style={{ background: 'var(--bg-base)' }}>
              {loading && <div><div className="research-loading-label"><span className="research-spinner" /> Lendo links, verificando o banco de especialistas e estruturando sua resposta...</div><SkeletonBlock lines={7} /></div>}
              {error && (
                <div className="research-error">
                  <AlertCircle size={16} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Erro ao consultar a IA</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4, opacity: 0.8 }}>{error}</div>
                  </div>
                </div>
              )}
              {result && !loading && (
                <div className="research-result-query-label"><Search size={12} />"{query.slice(0, 120)}{query.length > 120 ? '…' : ''}"</div>
              )}
              {result && !loading && <SimpleMarkdown text={result} />}
            </div>
          </div>
        )}

        <div className="research-section">
          <div className="research-section-header">
            <BookOpen size={16} style={{ color: 'var(--accent)' }} />
            <h2 className="research-section-title">Tópicos de Pesquisa Rápida (Com cruzamento de banco de dados)</h2>
          </div>
          <div className="research-categories-grid">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.id} className="research-category-card"
                  style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}
                  onClick={() => handleCat(cat)} disabled={loading}>
                  <div className="research-category-icon"><Icon size={20} /></div>
                  <div className="research-category-body">
                    <div className="research-category-title">{cat.title}</div>
                    <div className="research-category-desc">{cat.description}</div>
                  </div>
                  <ChevronRight size={15} className="research-category-arrow" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="research-section">
          <div className="research-section-header">
            <BookMarked size={16} style={{ color: 'var(--success)' }} />
            <h2 className="research-section-title">Biblioteca de Referências Nacionais</h2>
          </div>
          <div className="research-tags-filter">
            {allTags.map(t => (
              <button key={t} className={`research-tag-btn${activeTag === t ? ' active' : ''}`} onClick={() => setActiveTag(t)}>{t}</button>
            ))}
          </div>
          <div className="research-refs-grid">
            {filteredRefs.map(ref => (
              <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer" className="research-ref-card">
                <div className="research-ref-top"><span className="research-ref-type">{ref.type}</span><span className="research-ref-year">{ref.year}</span></div>
                <div className="research-ref-title">{ref.title}</div>
                <div className="research-ref-tags">{ref.tags.map(t => <span key={t} className="research-ref-tag"><Tag size={9} /> {t}</span>)}</div>
                <ExternalLink size={12} className="research-ref-ext" />
              </a>
            ))}
          </div>
        </div>

        <div className="research-section">
          <div className="research-section-header">
            <Database size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="research-section-title">Memória da IA (Fontes e Links no Banco de Dados)</h2>
          </div>
          <p className="research-section-sub">
            Adicione páginas web, links de documentação ou anotações. As fontes adicionadas serão automaticamente marcadas para leitura da IA.
          </p>

          <form onSubmit={handleAddSource} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '16px',
            background: 'var(--bg-elevated)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                className="research-search-input"
                style={{ flex: '1', minWidth: '200px', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-surface)' }}
                placeholder="Título da fonte (ex: Documentação EGD)"
                value={newSource.titulo}
                onChange={e => setNewSource({ ...newSource, titulo: e.target.value })}
                required
              />
              <input
                className="research-search-input"
                style={{ flex: '2', minWidth: '250px', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-surface)' }}
                placeholder="URL (Link para a IA ler a página)"
                value={newSource.url}
                onChange={e => setNewSource({ ...newSource, url: e.target.value })}
              />
            </div>

            <textarea
              className="research-search-input"
              style={{
                width: '100%',
                minHeight: '120px',
                border: '1px solid var(--border)',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                resize: 'vertical',
                fontFamily: 'inherit',
                color: 'var(--text)',
                lineHeight: '1.5'
              }}
              placeholder="Escreva suas anotações ou cole um texto longo aqui..."
              value={newSource.notas}
              onChange={e => setNewSource({ ...newSource, notas: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="research-search-btn" disabled={isSaving} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                {isSaving ? 'Salvando...' : <><Plus size={16} /> Salvar no Banco</>}
              </button>
            </div>
          </form>

          {customSources.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', marginTop: '12px' }}>
              {customSources.map(source => (
                <div key={source.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px',
                  background: 'var(--bg-surface)',
                  border: selectedSources.has(source.id) ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '10px', transition: 'all 0.2s',
                  boxShadow: selectedSources.has(source.id) ? '0 4px 12px var(--primary-light)' : 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedSources.has(source.id)}
                    onChange={() => toggleSourceSelection(source.id)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text)' }}>{source.titulo}</div>
                    {source.url && (
                      <a href={source.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', textDecoration: 'none' }}>
                        <Link size={10} /> {source.url.slice(0, 40)}{source.url.length > 40 ? '...' : ''}
                      </a>
                    )}
                    {source.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.notas}</div>}
                  </div>
                  <button type="button" onClick={() => handleDeleteSource(source.id)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}