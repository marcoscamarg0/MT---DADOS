import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const { config } = await import('dotenv');
config({ path: path.join(rootDir, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_DIR = new URL('../dist', import.meta.url).pathname;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
// AQUI ESTÁ A CORREÇÃO PRINCIPAL: Aumentando o limite para 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(DIST_DIR));

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
    res.status(500).json({ error: 'Erro ao carregar contatos' });
  }
});

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
    res.status(500).json({ error: 'Erro ao carregar contato' });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { id: _ignored, ...fields } = req.body;
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
    res.status(500).json({ error: 'Erro ao criar contato' });
  }
});

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
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir contato' });
  }
});

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
    res.status(500).json({ error: 'Erro ao carregar departamentos' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('departamento, email, telefone');

    if (error) throw error;

    const departments = new Set(data.map(c => c.departamento).filter(Boolean));
    const withEmail = data.filter(c => c.email && c.email.trim().length > 0).length;
    const withPhone = data.filter(c => c.telefone && c.telefone.trim().length > 0).length;

    res.json({
      totalContatos: data.length,
      totalDepartamentos: departments.size,
      comEmail: withEmail,
      comTelefone: withPhone,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
});

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

    res.json({ success: true, to });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/research/sources', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_sources')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    if (e.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ error: e.message });
  }
});

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
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 5000); // Reduzido ligeiramente para dar mais fôlego no contexto geral
    res.json({ text, length: text.length });
  } catch (e) {
    res.status(500).json({ error: `Erro ao buscar URL: ${e.message}` });
  }
});

const SYSTEM_PROMPT = `Você é um especialista sênior em Gestão e Governança de Dados no setor público federal brasileiro e atua como um tutor acadêmico interativo.

O sistema de frontend renderizará seu texto em uma interface intuitiva para estudos.
Ao responder siga estritamente as regras abaixo:
1. Seja altamente visual, prático e focado na facilidade de aprendizado.
2. Estruture a resposta com seções muito claras usando Markdown (## e ###).
3. Utilize TABELAS em Markdown extensivamente para comparar cenários, modelos, prós e contras, e dados estruturados.
4. Use listas encadeadas (bullet points) para criar fluxos de processos.
5. Destaque em **negrito** todos os termos técnicos, leis e conceitos-chave.
6. Sempre cite legislação pertinente, frameworks (DAMA-DMBOK, EGD, INDA) e acórdãos (TCU).
7. Mantenha um tom profissional, didático e estritamente em português brasileiro.
8. CRUZAMENTO DE DADOS: Sempre que o usuário perguntar "quem procurar", "com quem falar" ou solicitar recomendações baseadas no órgão, cruze o conhecimento teórico com a lista de especialistas internos fornecida no contexto e recomende nominalmente as pessoas, citando seus cargos e setores.`;

app.post('/api/research/query', async (req, res) => {
  const { query, sources, contacts } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Campo obrigatorio: query' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OPENROUTER_API_KEY nao configurada. Adicione a chave no arquivo .env e reinicie o servidor.',
    });
  }

  let sourcesContext = '';
  if (Array.isArray(sources) && sources.length > 0) {
    const items = sources.map((s, i) => {
      let block = `[Fonte ${i + 1}] "${s.titulo}"`;
      if (s.url) block += `\nURL: ${s.url}`;
      if (s.notas) block += `\nNotas: ${s.notas}`;
      if (s.conteudo_url) block += `\nConteudo da pagina:\n${s.conteudo_url.slice(0, 2000)}`;
      return block;
    }).join('\n\n---\n\n');
    sourcesContext = `\n\n## Fontes de Pesquisa\nUse as informacoes abaixo como contexto adicional. Cite as fontes quando relevante.\n\n${items}`;
  }

  let contactsContext = '';
  if (Array.isArray(contacts) && contacts.length > 0) {
    const contactsList = contacts.map(c => `- ${c.nome} | Cargo: ${c.cargo || 'N/A'} | Departamento: ${c.departamento || 'N/A'} | Email: ${c.email || 'N/A'}`).join('\n');
    contactsContext = `\n\n## Base de Especialistas do Órgão\nVocê tem acesso aos seguintes servidores da organização. Baseado na pergunta, recomende essas pessoas cruzando a teoria com a especialidade delas:\n${contactsList}`;
  }

  const finalSystemPrompt = SYSTEM_PROMPT + sourcesContext + contactsContext;

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
        max_tokens: 2200,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Erro na API OpenRouter: ${response.status}` });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(502).json({ error: 'Resposta vazia da IA. Tente novamente.' });
    }

    res.json({ answer, model: data.model });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(`${DIST_DIR}/index.html`);
});

app.listen(PORT, async () => {
  try {
    await supabase.from('contacts').select('id').limit(1);
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  } catch (error) {
    console.log("Erro ao conectar no banco no Startup");
  }
});