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
   RESEARCH SOURCES — Fontes personalizadas (notas + links)
══════════════════════════════════════════════════════════════════════════════ */

// GET all sources
app.get('/api/research/sources', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_sources')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    // Tabela pode não existir ainda
    if (e.code === '42P01') {
      return res.json([]); // retorna vazio enquanto tabela não existe
    }
    res.status(500).json({ error: e.message });
  }
});

// POST create source
app.post('/api/research/sources', async (req, res) => {
  try {
    const { titulo, url, notas, tipo } = req.body;
    if (!titulo) return res.status(400).json({ error: 'titulo obrigatorio' });
    const { data, error } = await supabase
      .from('research_sources')
      .insert({ titulo, url: url || null, notas: notas || null, tipo: tipo || 'nota' })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update source
app.put('/api/research/sources/:id', async (req, res) => {
  try {
    const { titulo, url, notas, tipo } = req.body;
    const { data, error } = await supabase
      .from('research_sources')
      .update({ titulo, url, notas, tipo })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE source
app.delete('/api/research/sources/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('research_sources')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST fetch URL content (para preview e armazenamento)
app.post('/api/research/fetch-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url obrigatoria' });
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PortalMT-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return res.status(502).json({ error: `URL retornou ${r.status}` });
    const html = await r.text();
    // Extrai texto limpo: remove tags HTML, scripts e estilos
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 6000); // máx 6k chars para não estourar o contexto
    res.json({ text, length: text.length });
  } catch (e) {
    res.status(500).json({ error: `Erro ao buscar URL: ${e.message}` });
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   RESEARCH — IA via OpenRouter (free tier)
══════════════════════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `Você é um especialista sênior em Gestão e Governança de Dados no setor público federal brasileiro.
Seu conhecimento inclui:
- LGPD (Lei 13.709/2018) aplicada à Administração Pública Federal
- Estratégia de Governo Digital (EGD) e Política de Dados Abertos
- DAMA-DMBOK, modelos de maturidade de dados (CMM, CMMI, DCAM, DAMA)
- Infraestrutura Nacional de Dados Abertos (INDA) e Decreto 8.777/2016
- Acórdãos do TCU sobre governança de TI e dados (ex.: 2.569/2020, 1.628/2019)
- Frameworks de governança da CGU, ANPD e Ministério da Gestão
- Melhores práticas internacionais adaptadas ao contexto brasileiro (COBIT, ISO 8000, ISO 27001)
- Experiências dos ministérios, autarquias e empresas públicas federais

Ao responder:
1. Seja objetivo e prático — foque em passos concretos aplicáveis
2. Cite legislação, acórdãos e frameworks específicos quando relevante
3. Estruture a resposta com seções claras usando markdown (## e ###)
4. Mencione desafios comuns no setor público e como superá-los
5. Use linguagem formal mas acessível
6. Responda sempre em português brasileiro`;

// POST /api/research/query
app.post('/api/research/query', async (req, res) => {
  const { query, sources } = req.body;  // sources = [{ titulo, url, notas, conteudo_url }]
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Campo obrigatorio: query' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OPENROUTER_API_KEY nao configurada. Adicione a chave no arquivo .env e reinicie o servidor.',
    });
  }

  // Monta bloco de contexto com fontes personalizadas
  let sourcesContext = '';
  if (Array.isArray(sources) && sources.length > 0) {
    const items = sources.map((s, i) => {
      let block = `[Fonte ${i + 1}] "${s.titulo}"`;
      if (s.url) block += `\nURL: ${s.url}`;
      if (s.notas) block += `\nNotas: ${s.notas}`;
      if (s.conteudo_url) block += `\nConteudo da pagina:\n${s.conteudo_url.slice(0, 2000)}`;
      return block;
    }).join('\n\n---\n\n');
    sourcesContext = `\n\n## Fontes Personalizadas do Usuario\nUse as informacoes abaixo como contexto adicional para sua resposta. Cite as fontes quando relevante.\n\n${items}`;
  }

  const finalSystemPrompt = SYSTEM_PROMPT + sourcesContext;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://portal.mt.gov.br',
        'X-Title': 'Portal MT - Repositorio de Pesquisas',
      },
      body: JSON.stringify({
        model: 'poolside/laguna-xs-2.1:free',
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: query },
        ],
        max_tokens: 1800,
        temperature: 0.45,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', response.status, errText);
      return res.status(502).json({ error: `Erro na API OpenRouter: ${response.status}` });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(502).json({ error: 'Resposta vazia da IA. Tente novamente.' });
    }

    const srcCount = sources?.length || 0;
    console.log(`Pesquisa IA [Laguna XS-2.1] (+${srcCount} fontes): "${query.slice(0, 60)}..." -> ${answer.length} chars`);
    res.json({ answer, model: data.model });
  } catch (error) {
    console.error('Erro ao chamar OpenRouter:', error.message);
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
