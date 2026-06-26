import { useState, useEffect, useCallback } from 'react'
import { Search, Users, Building2, Mail, Phone, MapPin, Edit3, X, CheckCircle, Menu, UserCheck, Hash, HelpCircle, Code, Database, Cpu, Layers } from 'lucide-react'
import './index.css'
import OrgChart from './OrgChart.jsx'

const API = 'http://localhost:3001/api'

// Avatar color generator based on name
function getAvatarColor(name) {
  const colors = [
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #14b8a6, #2dd4bf)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name) {
  const parts = name.split(' ').filter(p => p.length > 2)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

// =================== STATS COMPONENT ===================
function Stats({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card-icon"><Users size={20} /></div>
        <div className="stat-card-value">{stats.totalContatos || 0}</div>
        <div className="stat-card-label">Total de Contatos</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-icon"><Building2 size={20} /></div>
        <div className="stat-card-value">{stats.totalDepartamentos || 0}</div>
        <div className="stat-card-label">Departamentos</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-icon"><Mail size={20} /></div>
        <div className="stat-card-value">{stats.comEmail || 0}</div>
        <div className="stat-card-label">Com E-mail</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-icon"><Phone size={20} /></div>
        <div className="stat-card-value">{stats.comTelefone || 0}</div>
        <div className="stat-card-label">Com Telefone</div>
      </div>
    </div>
  )
}

// =================== SIDEBAR COMPONENT ===================
function Sidebar({ departments, selectedDept, onSelectDept, mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && <div className="mobile-overlay" onClick={onCloseMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">MT</div>
            <h1>Ministério dos Transportes</h1>
          </div>
        </div>

        <div className="sidebar-subtitle">Departamentos</div>

        <div className="sidebar-departments-list">
          <div
            className={`sidebar-item ${selectedDept === 'Todos' ? 'active' : ''}`}
            onClick={() => { onSelectDept('Todos'); onCloseMobile(); }}
          >
            <span className="sidebar-item-name">📋 Todos</span>
            <span className="sidebar-item-count">
              {departments.reduce((sum, d) => sum + d.total, 0)}
            </span>
          </div>

          {departments.map(dept => (
            <div
              key={dept.nome}
              className={`sidebar-item ${selectedDept === dept.nome ? 'active' : ''}`}
              onClick={() => { onSelectDept(dept.nome); onCloseMobile(); }}
            >
              <span className="sidebar-item-name">{dept.nome}</span>
              <span className="sidebar-item-count">{dept.total}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}

// =================== CONTACT CARD COMPONENT ===================
function ContactCard({ contact, onEdit }) {
  return (
    <div className="contact-card" onClick={() => onEdit(contact)}>
      <div className="contact-card-header">
        <div
          className="contact-avatar"
          style={{ background: getAvatarColor(contact.nome) }}
        >
          {getInitials(contact.nome)}
        </div>
        <div className="contact-card-info">
          <div className="contact-name">{contact.nome}</div>
          {contact.cargo && <div className="contact-cargo">{contact.cargo}</div>}
        </div>
        <button
          className="contact-edit-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
          title="Editar contato"
        >
          <Edit3 size={15} />
        </button>
      </div>

      <div className="contact-details">
        {contact.email && (
          <div className="contact-detail">
            <Mail size={15} />
            <span className="contact-detail-text">{contact.email}</span>
          </div>
        )}
        {contact.telefone && (
          <div className="contact-detail">
            <Phone size={15} />
            <span className="contact-detail-text">{contact.telefone}</span>
          </div>
        )}
        {contact.endereco && (
          <div className="contact-detail">
            <MapPin size={15} />
            <span className="contact-detail-text">
              {contact.endereco}
              {contact.cep ? ` - CEP: ${contact.cep}` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="contact-dept-tag">
        <Building2 size={11} />
        {contact.departamento}
      </div>
    </div>
  )
}

// =================== EDIT MODAL COMPONENT ===================
function EditModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState({ ...contact })
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        const updated = await res.json()
        onSave(updated)
      }
    } catch (err) {
      console.error('Erro ao salvar:', err)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Editar Contato</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="form-input" value={form.nome} onChange={e => handleChange('nome', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <input className="form-input" value={form.cargo} onChange={e => handleChange('cargo', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Departamento</label>
            <input className="form-input" value={form.departamento} onChange={e => handleChange('departamento', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" value={form.email} onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input className="form-input" value={form.telefone} onChange={e => handleChange('telefone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input className="form-input" value={form.endereco} onChange={e => handleChange('endereco', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">CEP</label>
            <input className="form-input" value={form.cep} onChange={e => handleChange('cep', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input className="form-input" value={form.cidade} onChange={e => handleChange('cidade', e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <CheckCircle size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =================== ABOUT SECTION COMPONENT ===================
function AboutSection() {
  return (
    <div className="docs-container">
      <div className="docs-header">
        <h3 className="docs-title">Como Funciona este Site</h3>
        <p className="docs-intro">Conheça a arquitetura, o fluxo de dados e as tecnologias por trás deste portal.</p>
      </div>

      <div className="docs-grid">
        <div className="docs-card">
          <div className="docs-card-header">
            <div className="docs-card-icon"><Code size={20} /></div>
            <h4 className="docs-card-title">Interface (Frontend)</h4>
          </div>
          <div className="docs-card-body">
            <p>Construída em <strong>React 19</strong> e empacotada com <strong>Vite</strong> para um desenvolvimento e compilação ultra-rápidos.</p>
            <ul className="docs-card-list">
              <li><strong>Componentes Modulares</strong>: Organizados de forma declarativa (Sidebar, Cards, Organograma, Modais).</li>
              <li><strong>Estilização com Tailwind v4</strong>: Layout responsivo, adaptável de dispositivos móveis a grandes telas, com sistema de temas corporativos do Governo Federal.</li>
              <li><strong>Biblioteca Lucide React</strong>: Ícones consistentes e otimizados para uma excelente experiência do usuário.</li>
            </ul>
          </div>
        </div>

        <div className="docs-card">
          <div className="docs-card-header">
            <div className="docs-card-icon"><Database size={20} /></div>
            <h4 className="docs-card-title">Banco de Dados & API</h4>
          </div>
          <div className="docs-card-body">
            <p>Alimentado por um servidor leve rodando em <strong>Node.js</strong> com o framework <strong>Express</strong> na porta 3001.</p>
            <ul className="docs-card-list">
              <li><strong>Armazenamento Local</strong>: Os dados dos contatos são mantidos em formato estruturado num arquivo JSON.</li>
              <li><strong>Pesquisa Dinâmica</strong>: O endpoint realiza buscas textuais em múltiplos campos e aplica filtros por departamento no lado do servidor.</li>
              <li><strong>Atualização e Sincronização</strong>: Alterações via modal disparam chamadas REST (método PUT) salvando no banco de dados local instantaneamente.</li>
            </ul>
          </div>
        </div>

        <div className="docs-card">
          <div className="docs-card-header">
            <div className="docs-card-icon"><Layers size={20} /></div>
            <h4 className="docs-card-title">Organograma Interativo</h4>
          </div>
          <div className="docs-card-body">
            <p>Exibição gráfica da estrutura completa do Ministério dos Transportes, ligando órgãos e subsecretarias.</p>
            <ul className="docs-card-list">
              <li><strong>Árvore Hierárquica</strong>: Renderizada recursivamente a partir de uma estrutura de dados de nós aninhados.</li>
              <li><strong>Controles Dinâmicos</strong>: Permite expandir ou colapsar sub-setores individualmente para melhor visualização.</li>
              <li><strong>Exportação Inteligente</strong>: Selecione os setores que desejar e baixe os dados formatados em arquivos JSON ou CSV em apenas um clique.</li>
            </ul>
          </div>
        </div>

        <div className="docs-card">
          <div className="docs-card-header">
            <div className="docs-card-icon"><Cpu size={20} /></div>
            <h4 className="docs-card-title">Estatísticas em Tempo Real</h4>
          </div>
          <div className="docs-card-body">
            <p>O painel calcula de forma agregada a saúde cadastral dos contatos do Ministério dos Transportes.</p>
            <ul className="docs-card-list">
              <li><strong>Indicadores Rápidos</strong>: Total de contatos cadastrados e contagem de departamentos.</li>
              <li><strong>Completude de Informações</strong>: Acompanhamento da quantidade de contatos que possuem e-mail e telefone cadastrados.</li>
              <li><strong>Atualização sob Demanda</strong>: Sempre que um contato é editado, os dados das estatísticas são recalculados pelo backend.</li>
            </ul>
          </div>
        </div>

        <div className="docs-card docs-flow-card">
          <div className="docs-card-header">
            <div className="docs-card-icon"><Layers size={20} /></div>
            <h4 className="docs-card-title">Fluxo de Dados do Sistema</h4>
          </div>
          <div className="docs-card-body">
            <p>Entenda o ciclo de vida de uma requisição ou ação do usuário dentro do portal de contatos e organograma:</p>
            <div className="docs-steps">
              <div className="docs-step">
                <div className="docs-step-number">1</div>
                <div className="docs-step-title">Ação no Front</div>
                <div className="docs-step-desc">O usuário busca por contatos, muda de departamento ou edita um registro.</div>
              </div>
              <div className="docs-step">
                <div className="docs-step-number">2</div>
                <div className="docs-step-title">Chamada HTTP</div>
                <div className="docs-step-desc">O React faz um fetch (ex: GET ou PUT) para o servidor Express (porta 3001).</div>
              </div>
              <div className="docs-step">
                <div className="docs-step-number">3</div>
                <div className="docs-step-title">Persistência</div>
                <div className="docs-step-desc">O servidor manipula os dados e os grava no arquivo contatos.json local.</div>
              </div>
              <div className="docs-step">
                <div className="docs-step-number">4</div>
                <div className="docs-step-title">Atualização</div>
                <div className="docs-step-desc">Os novos dados e estatísticas são enviados de volta e a tela se atualiza sem recarregar.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =================== MAIN APP ===================
function App() {
  const [activeTab, setActiveTab] = useState('contacts')
  const [contacts, setContacts] = useState([])
  const [departments, setDepartments] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('Todos')
  const [editingContact, setEditingContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedDept !== 'Todos') params.set('departamento', selectedDept)

      const res = await fetch(`${API}/contacts?${params}`)
      const data = await res.json()
      setContacts(data)
    } catch (err) {
      console.error('Erro ao buscar contatos:', err)
    }
    setLoading(false)
  }, [search, selectedDept])

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API}/departments`)
      const data = await res.json()
      setDepartments(data)
    } catch (err) {
      console.error('Erro ao buscar departamentos:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/stats`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchStats()
  }, [])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => fetchContacts(), 300)
    return () => clearTimeout(timer)
  }, [fetchContacts])

  const handleSave = (updatedContact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c))
    setEditingContact(null)
    fetchDepartments()
    fetchStats()
    setToast('Contato atualizado com sucesso!')
    setTimeout(() => setToast(null), 3000)
  }

  const deptTitle = selectedDept === 'Todos' ? 'Todos os Departamentos' : selectedDept

  return (
    <div className="app-layout">
      {activeTab === 'contacts' && (
        <Sidebar
          departments={departments}
          selectedDept={selectedDept}
          onSelectDept={setSelectedDept}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      )}

      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-title">
            {activeTab === 'contacts' && (
              <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
                <Menu size={18} />
              </button>
            )}
            <div>
              <h2>{activeTab === 'contacts' ? deptTitle : activeTab === 'chart' ? 'Organograma' : 'Como Funciona'}</h2>
              <div className="top-bar-subtitle">
                {activeTab === 'contacts' 
                  ? 'Sistema de Contatos — Ministério dos Transportes' 
                  : activeTab === 'chart' 
                    ? 'Estrutura Hierárquica do Ministério' 
                    : 'Como este site está funcionando'}
              </div>
            </div>
          </div>

          <div className="nav-tabs">
            <button 
              className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              <Users size={16} />
              <span>Contatos</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <Building2 size={16} />
              <span>Organograma</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <HelpCircle size={16} />
              <span>Como Funciona</span>
            </button>
          </div>
        </div>

        {activeTab === 'contacts' && (
          <>
            <Stats stats={stats} />

            <div className="filter-bar">
              <div className="search-wrapper">
                <Search />
                <input
                  className="search-input"
                  placeholder="Buscar por nome, cargo, email, telefone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  id="search-contacts"
                />
              </div>
              <select
                className="filter-select"
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                id="filter-department"
              >
                <option value="Todos">Todos os Departamentos</option>
                {departments.map(d => (
                  <option key={d.nome} value={d.nome}>{d.nome} ({d.total})</option>
                ))}
              </select>
            </div>

            {!loading && (
              <div className="results-count">
                <Hash size={14} />
                {contacts.length} contato{contacts.length !== 1 ? 's' : ''} encontrado{contacts.length !== 1 ? 's' : ''}
              </div>
            )}

            {loading ? (
              <div className="loading">
                <div className="loading-spinner" />
                <div className="loading-text">Carregando contatos...</div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><UserCheck /></div>
                <h3>Nenhum contato encontrado</h3>
                <p>Tente ajustar os filtros ou a busca para encontrar o que procura.</p>
              </div>
            ) : (
              <div className="contacts-grid">
                {contacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEdit={setEditingContact}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'chart' && (
          <div className="p-8">
            <OrgChart />
          </div>
        )}

        {activeTab === 'about' && (
          <AboutSection />
        )}
      </main>

      {editingContact && (
        <EditModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSave={handleSave}
        />
      )}

      {toast && (
        <div className="toast">
          <CheckCircle size={20} />
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
