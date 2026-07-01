import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = join(__dirname, 'data', 'contacts.json');
const DIST_DIR = join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json());
app.use(express.static(DIST_DIR));

function loadContacts() {
  const data = readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveContacts(contacts) {
  writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
}

// GET all contacts with optional search/filter
app.get('/api/contacts', (req, res) => {
  try {
    let contacts = loadContacts();
    const { search, departamento } = req.query;

    if (search) {
      const term = search.toLowerCase();
      contacts = contacts.filter(c =>
        c.nome.toLowerCase().includes(term) ||
        c.cargo.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.telefone.toLowerCase().includes(term) ||
        c.departamento.toLowerCase().includes(term)
      );
    }

    if (departamento && departamento !== 'Todos') {
      contacts = contacts.filter(c => c.departamento === departamento);
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar contatos' });
  }
});

// GET single contact
app.get('/api/contacts/:id', (req, res) => {
  try {
    const contacts = loadContacts();
    const contact = contacts.find(c => c.id === parseInt(req.params.id));
    if (!contact) return res.status(404).json({ error: 'Contato não encontrado' });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar contato' });
  }
});

// PUT update contact
app.put('/api/contacts/:id', (req, res) => {
  try {
    const contacts = loadContacts();
    const index = contacts.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Contato não encontrado' });

    contacts[index] = { ...contacts[index], ...req.body, id: contacts[index].id };
    saveContacts(contacts);
    res.json(contacts[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

// GET departments list
app.get('/api/departments', (req, res) => {
  try {
    const contacts = loadContacts();
    const departments = [...new Set(contacts.map(c => c.departamento))].sort();
    const deptCounts = departments.map(dept => ({
      nome: dept,
      total: contacts.filter(c => c.departamento === dept).length
    }));
    res.json(deptCounts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar departamentos' });
  }
});

// GET stats
app.get('/api/stats', (req, res) => {
  try {
    const contacts = loadContacts();
    const departments = [...new Set(contacts.map(c => c.departamento))];
    const withEmail = contacts.filter(c => c.email && c.email.length > 0).length;
    const withPhone = contacts.filter(c => c.telefone && c.telefone.length > 0).length;

    res.json({
      totalContatos: contacts.length,
      totalDepartamentos: departments.length,
      comEmail: withEmail,
      comTelefone: withPhone
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
});

// SPA fallback: qualquer rota que não seja /api/* devolve o index.html do build
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});