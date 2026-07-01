import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_DIR = new URL('../dist', import.meta.url).pathname;

// Cliente Supabase — usa a service_role key porque isso roda só no back-end
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Transporter do Outlook / Microsoft 365 (SMTP AUTH precisa estar habilitado
// na caixa de e-mail pelo admin do Exchange, e usar senha de aplicativo se MFA ativo)
const mailer = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // usa STARTTLS
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD,
  },
});

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

// POST enviar e-mail HTML individualmente pra cada destinatário
app.post('/api/send-email', async (req, res) => {
  try {
    const { subject, html, contactIds } = req.body;

    if (!subject || !html) {
      return res.status(400).json({ error: 'Assunto e conteúdo HTML são obrigatórios' });
    }
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Nenhum destinatário selecionado' });
    }

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, nome, email')
      .in('id', contactIds);

    if (error) throw error;

    const recipients = contacts.filter(c => c.email);
    const results = [];

    // Envia um por um (não em lote/CC/BCC), com um pequeno intervalo
    // pra não estourar limite de envio do Outlook
    for (const contact of recipients) {
      try {
        await mailer.sendMail({
          from: process.env.OUTLOOK_EMAIL,
          to: contact.email,
          subject,
          html: html.replaceAll('{{nome}}', contact.nome || ''),
        });
        results.push({ email: contact.email, status: 'enviado' });
      } catch (sendError) {
        console.error(`Falha ao enviar para ${contact.email}:`, sendError.message);
        results.push({ email: contact.email, status: 'falhou', erro: sendError.message });
      }
      await new Promise(r => setTimeout(r, 300));
    }

    const enviados = results.filter(r => r.status === 'enviado').length;
    res.json({ total: recipients.length, enviados, falharam: recipients.length - enviados, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar e-mails' });
  }
});

// SPA fallback: qualquer rota que não seja /api/* devolve o index.html do build
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(`${DIST_DIR}/index.html`);
});

async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, nome')
      .limit(5);

    if (error) throw error;

    console.log(`✅ Conectado ao Supabase! (${data.length} registros na amostra)`);
    console.log('Exemplo:', data);
  } catch (error) {
    console.error('❌ Falha ao conectar com o Supabase:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  await checkSupabaseConnection();
});
