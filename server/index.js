import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_DIR = new URL('../dist', import.meta.url).pathname;

// Cliente Supabase — usa a service_role key porque isso roda só no back-end
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(DIST_DIR));

// GET all contacts with optional search/filter
app.get('/api/contacts', async (req, res) => {
  try {
    const { search, departamento } = req.query;

    let query = supabase.from('contacts').select('*').order('id', { ascending: true });

    if (departamento && departamento !== 'Todos') {
      query = query.eq('departamento', departamento);
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(
        `nome.ilike.${term},cargo.ilike.${term},email.ilike.${term},telefone.ilike.${term},departamento.ilike.${term}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar contatos' });
  }
});

// GET single contact
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Contato não encontrado' });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar contato' });
  }
});

// PUT update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id, ...updates } = req.body;

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Contato não encontrado' });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

// GET departments list
app.get('/api/departments', async (req, res) => {
  try {
    const { data, error } = await supabase.from('contacts').select('departamento');
    if (error) throw error;

    const counts = {};
    for (const row of data) {
      counts[row.departamento] = (counts[row.departamento] || 0) + 1;
    }

    const departments = Object.entries(counts)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar departamentos' });
  }
});

// GET stats
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('departamento, email, telefone');

    if (error) throw error;

    const departments = new Set(data.map(c => c.departamento));
    const withEmail = data.filter(c => c.email && c.email.length > 0).length;
    const withPhone = data.filter(c => c.telefone && c.telefone.length > 0).length;

    res.json({
      totalContatos: data.length,
      totalDepartamentos: departments.size,
      comEmail: withEmail,
      comTelefone: withPhone
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
});

// SPA fallback: qualquer rota que não seja /api/* devolve o index.html do build
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(`${DIST_DIR}/index.html`);
});

async function checkSupabaseConnection() {
  try {
    const { error, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`✅ Conectado ao Supabase! (${count} contatos na tabela)`);
  } catch (error) {
    console.error('❌ Falha ao conectar com o Supabase:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  await checkSupabaseConnection();
});
