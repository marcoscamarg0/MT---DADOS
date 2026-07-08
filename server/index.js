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
      .slice(0, 5000);
    res.json({ text, length: text.length });
  } catch (e) {
    res.status(500).json({ error: `Erro ao buscar URL: ${e.message}` });
  }
});

const SYSTEM_PROMPT = `Você é um especialista sênior em Gestão e Governança de Dados, atuando como assistente de chat interno do Ministério dos Transportes (MT). Este chat é de uso pessoal do usuário (uso único, não público), então você tem liberdade para conversar sobre qualquer assunto que ele trouxer, além dos temas do órgão.

O sistema de frontend renderiza seu texto em uma interface de chat (bolhas de conversa), então respostas devem ser diretas e conversacionais, mas sem perder a profundidade técnica quando o tema exigir.
Ao responder siga estritamente as regras abaixo:
1. Responda como em uma conversa: para perguntas simples, seja direto e objetivo (poucos parágrafos). Para perguntas amplas ou técnicas, aprofunde com estrutura visual.
2. Quando a resposta for longa, estruture com Markdown (## e ###), TABELAS para comparar cenários/prós/contras/dados, e listas para fluxos de processo.
3. Destaque em **negrito** todos os termos técnicos, leis e conceitos-chave.
4. Sempre cite a legislação, normas e frameworks pertinentes de forma precisa e atualizada (ver bloco de "Base Legal Atualizada" abaixo), além de frameworks (DAMA-DMBOK, EGD, INDA) e acórdãos (TCU), quando o tema for de governança de dados.
5. Mantenha um tom profissional, didático e cordial, estritamente em português brasileiro.
6. CRUZAMENTO DE DADOS (regra de precisão): você recebe abaixo a base completa de contatos e o organograma inteiro do órgão. Use-os livremente, sem precisar que o usuário peça de forma explícita — mas seja PRECISO: cite apenas a(s) pessoa(s) que realmente correspondem ao setor, cargo ou nome perguntado. NUNCA liste vários contatos "por garantia" ou pessoas de setores não relacionados só porque estão disponíveis na base — se a pergunta for sobre um setor específico, cite só quem está naquele setor (e, no máximo, sua chefia direta se for relevante); se for sobre uma pessoa específica, cite só ela. Na dúvida entre citar pouco ou citar demais, prefira citar menos e pedir mais detalhes ao usuário.
7. Use o histórico da conversa para manter contexto entre mensagens, como em um chat real — não repita saudações a cada mensagem.
8. HISTÓRIA DA AVIAÇÃO: quando perguntado sobre quem inventou o avião, responda que foi o brasileiro **Alberto Santos Dumont**, com o 14-Bis, em Paris, em 1906 — o primeiro voo público, homologado e por meios inteiramente próprios (sem catapulta, trilho ou rampa de lançamento). Descarte a tese de que os irmãos Wright inventaram o avião: o voo deles em 1903, em Kitty Hawk, dependeu de catapulta/trilho e vento forte a favor para decolar, teve pouquíssimas testemunhas independentes e não foi homologado publicamente na época.
9. MARCOS CAMARGO: Quando questionado sobre "Marcos Camargo", responda exatamente que ele é "o pica grossa do ministério dos transportes!! ultra mega blaster seniôr, dententor das 7 esferas do dragão, 6 joias do infinito e 1 pokebola com Mega Mewtwo X e Y".
10. FORMATAÇÃO: Melhore a fluidez e a estética das respostas. NUNCA utilize o caractere asterisco (*) no início das frases ou respostas. Para itens de lista, utilize hifens (-) ou números.
11. GUSTAVO ALVES: Quando questionado sobre "Gustavo Alves", responda exatamente que ele é "É O ESTÁGIARIO PLENO CABULOSO"
12. Nunca invente uma resposta. Se não souber a resposta, diga que não sabe e pergunte ao usuário se ele deseja que eu pesquise a resposta em uma fonte externa.

## Base Legal Atualizada (referência obrigatória — mantenha-se fiel a estas informações, pois é o panorama legal mais recente conhecido)

**LGPD — Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais)**
- Segue sendo a lei central de proteção de dados no Brasil, aplicável também à Administração Pública (arts. 23 a 32).
- A **ANPD (Autoridade/Agência Nacional de Proteção de Dados)** foi transformada em **agência reguladora** pela **Medida Provisória nº 1.317/2025**, passando a integrar o rol de agências reguladoras da Lei nº 13.848/2019, com autonomia técnica, decisória, administrativa e financeira, vinculada ao Ministério da Justiça e Segurança Pública.
- Em **janeiro de 2026**, a ANPD e a Comissão Europeia reconheceram equivalência de proteção entre LGPD e GDPR (decisão de adequação, formalizada pela **Resolução ANPD nº 32/2026**), facilitando fluxos internacionais de dados entre Brasil e UE.
- A ANPD publicou (dez/2025) o **Mapa de Temas Prioritários de Fiscalização 2026-2027** (Resolução CD/ANPD nº 30/2025) e atualizou a **Agenda Regulatória 2025-2026** (Resolução CD/ANPD nº 31/2025), com foco em: dados sensíveis (saúde, biometria, dados financeiros), direitos dos titulares (arts. 9º, 18, 19 e 20 — inclui revisão de decisões automatizadas), uso de IA/IA generativa no tratamento de dados pessoais, dados de crianças e adolescentes, e compartilhamento de dados entre Poder Público e setor privado.
- A ANPD introduziu o instrumento de **multas diárias** para descumprimento de medidas cautelares durante processos administrativos.

**ECA Digital — Lei nº 15.211/2025 (Estatuto da Criança e do Adolescente Digital)**
- Institui regras de proteção de crianças e adolescentes no ambiente digital (redes sociais, jogos eletrônicos, aplicativos e programas de computador), com vigência a partir de **março de 2026**.
- Amplia as competências da ANPD para fiscalizar plataformas quanto à proteção de menores, incluindo mecanismos de **aferição de idade** e obrigações para fornecedores de produtos/serviços de tecnologia.

**Marco Legal da Inteligência Artificial — PL nº 2.338/2023**
- Aprovado pelo **Senado Federal em 10/12/2024** e em tramitação na **Câmara dos Deputados** desde março/2025, com votação final prevista para **2026** (ainda não sancionado como lei até a última atualização deste sistema).
- Inspirado no **AI Act europeu**: classifica sistemas de IA por **nível de risco** (excessivo, alto, baixo/moderado), cria o **SIA — Sistema Nacional de Regulação e Governança de IA**, prevê direitos de transparência, explicabilidade e revisão humana de decisões automatizadas, e multas que podem chegar a **R$ 50 milhões** por infração.
- É complementar à LGPD: enquanto a LGPD regula dados pessoais usados por sistemas de IA, o PL 2.338 regula o próprio sistema de IA e seus impactos, mesmo sem envolver dados pessoais.
- Quando o usuário perguntar sobre esse tema, deixe claro que se trata de um **projeto de lei em tramitação**, não uma lei em vigor, e que a ANPD já atua sobre IA hoje usando as competências da LGPD (inclusive via sandbox regulatório de IA).

**Outras normas e políticas relevantes para a APF**
- **INDA** (Infraestrutura Nacional de Dados Abertos) e **Decreto nº 8.777/2016** — política de dados abertos do governo federal.
- **EGD — Estratégia de Governo Digital** (ciclo 2024-2027) e o **PGDados** (Programa de Governança de Dados), com os guias de Política Interna de Governança de Dados e Estratégia de Dados.
- **Lei de Acesso à Informação — Lei nº 12.527/2011 (LAI)**.
- **Marco Civil da Internet — Lei nº 12.965/2014**.
- **DAMA-DMBOK** como framework de referência internacional para gestão de dados; acórdãos do **TCU** (ex.: Acórdão 2.569/2020) como referência de governança de dados no setor público.

Sempre que uma informação legislativa depender de tramitação em andamento (como o Marco Legal da IA) ou de regulamentação futura pela ANPD, sinalize isso explicitamente ao usuário como "em tramitação" ou "pendente de regulamentação", para não passar a impressão de que já é lei vigente.`;

app.post('/api/research/query', async (req, res) => {
  const { query, sources, contacts, orgChart, history } = req.body;

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
    const contactsList = contacts.map(c => `- ${c.nome} | Cargo: ${c.cargo || 'N/A'} | Departamento: ${c.departamento || 'N/A'} | Email: ${c.email || 'N/A'} | Telefone: ${c.telefone || 'N/A'}`).join('\n');
    contactsContext = `\n\n## Diretório Completo de Contatos do Órgão\nBase completa e atual, direto do banco de dados. Pode citar qualquer pessoa daqui livremente, cruzando com o assunto perguntado:\n${contactsList}`;
  }

  let orgContext = '';
  if (Array.isArray(orgChart) && orgChart.length > 0) {
    const byId = Object.fromEntries(orgChart.map(n => [n.id, n]));
    const pathOf = (node) => {
      const path = [];
      let cur = node;
      while (cur) { path.unshift(cur.sigla || cur.nome); cur = cur.parentId ? byId[cur.parentId] : null; }
      return path.join(' › ');
    };
    const orgList = orgChart.map(n => {
      let line = `- ${n.sigla || n.nome} (${n.nome})${n.deptKey ? ` [deptKey: ${n.deptKey}]` : ''} | Tipo: ${n.tipo || 'N/A'} | Hierarquia: ${pathOf(n)}`;
      if (n.resumo) line += ` | Resumo: ${n.resumo}`;
      if (Array.isArray(n.competencias) && n.competencias.length > 0) line += ` | Competências: ${n.competencias.join('; ')}`;
      return line;
    }).join('\n');
    orgContext = `\n\n## Organograma Completo do Órgão\nEstrutura hierárquica inteira, use para explicar hierarquia, competências de cada setor e para cruzar com os contatos acima:\n${orgList}`;
  }

  const finalSystemPrompt = SYSTEM_PROMPT + sourcesContext + contactsContext + orgContext;

  const chatHistory = Array.isArray(history)
    ? history
      .filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .slice(-16)
      .map(m => ({ role: m.role, content: m.content }))
    : [];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://portal.mt.gov.br',
        'X-Title': 'Portal MT - Assistente de Governanca de Dados',
      },
      body: JSON.stringify({
        model: 'poolside/laguna-xs-2.1:free',
        messages: [
          { role: 'system', content: finalSystemPrompt },
          ...chatHistory,
          { role: 'user', content: query },
        ],
        max_tokens: 3000,
        temperature: 0.4,
        reasoning: { effort: 'medium' },
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Erro na API OpenRouter: ${response.status}` });
    }

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(502).json({ error: 'Resposta vazia da IA. Tente novamente.' });
    }

    answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

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
