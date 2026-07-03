import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Carrega variáveis de ambiente do .env na raiz do projeto
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const { config } = await import('dotenv');
config({ path: path.join(rootDir, '.env') });


const app = express();
const PORT = process.env.PORT || 3001;
const DIST_DIR = new URL('../dist', import.meta.url).pathname;

// ── Supabase client (service_role — back-end only) ──────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(DIST_DIR));

/* ══════════════════════════════════════════════════════════════════════════════
   CONTACTS
══════════════════════════════════════════════════════════════════════════════ */

// GET all contacts (with optional search + departamento filter)
app.get('/api/contacts', async (req, res) => {
  try {
    const { search, departamento } = req.query;

    let query = supabase
      .from('contacts')
      .select('*')
      .order('id', { ascending: true });

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
    console.error('GET /api/contacts:', error);
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
    console.error('GET /api/contacts/:id:', error);
    res.status(500).json({ error: 'Erro ao carregar contato' });
  }
});

// POST create contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { id: _ignored, ...fields } = req.body;   // ignora id enviado pelo cliente
    const newContact = {
      nome: '',
      cargo: '',
      email: '',
      telefone: '',
      departamento: '',
      ...fields,
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert(newContact)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('POST /api/contacts:', error);
    res.status(500).json({ error: 'Erro ao criar contato' });
  }
});

// PUT update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id: _ignored, ...updates } = req.body;

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Contato não encontrado' });

    res.json(data);
  } catch (error) {
    console.error('PUT /api/contacts/:id:', error);
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

// DELETE contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/contacts/:id:', error);
    res.status(500).json({ error: 'Erro ao excluir contato' });
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   DEPARTMENTS & STATS
══════════════════════════════════════════════════════════════════════════════ */

// GET departments list (agrupado por nome, com total)
app.get('/api/departments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('departamento');

    if (error) throw error;

    const counts = {};
    for (const row of data) {
      if (row.departamento) {
        counts[row.departamento] = (counts[row.departamento] || 0) + 1;
      }
    }

    const departments = Object.entries(counts)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    res.json(departments);
  } catch (error) {
    console.error('GET /api/departments:', error);
    res.status(500).json({ error: 'Erro ao carregar departamentos' });
  }
});

// GET stats (totais do diretório)
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('departamento, email, telefone');

    if (error) throw error;

    const departments = new Set(data.map(c => c.departamento).filter(Boolean));
    const withEmail   = data.filter(c => c.email   && c.email.trim().length   > 0).length;
    const withPhone   = data.filter(c => c.telefone && c.telefone.trim().length > 0).length;

    res.json({
      totalContatos:     data.length,
      totalDepartamentos: departments.size,
      comEmail:  withEmail,
      comTelefone: withPhone,
    });
  } catch (error) {
    console.error('GET /api/stats:', error);
    res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   EMAIL — envio individual personalizado via SMTP
══════════════════════════════════════════════════════════════════════════════ */

// POST /api/send-email  { to, subject, htmlBody, nome }
app.post('/api/send-email', async (req, res) => {
  const { to, subject, htmlBody, nome } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ error: 'Campos obrigatórios: to, subject' });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(503).json({
      error: 'SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"Portal MT" <${smtpFrom}>`,
      to,
      subject,
      html: htmlBody,
    });

    console.log(`✅ E-mail enviado → ${to}${nome ? ` (${nome})` : ''}`);
    res.json({ success: true, to });
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   SPA FALLBACK
══════════════════════════════════════════════════════════════════════════════ */

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(`${DIST_DIR}/index.html`);
});

/* ══════════════════════════════════════════════════════════════════════════════
   STARTUP
══════════════════════════════════════════════════════════════════════════════ */

async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, nome')
      .limit(3);

    if (error) throw error;

    console.log(`✅ Supabase conectado! ${data.length} registros na amostra:`);
    data.forEach(c => console.log(`   #${c.id} ${c.nome}`));
  } catch (error) {
    console.error('❌ Falha ao conectar com o Supabase:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  await checkSupabaseConnection();
});
