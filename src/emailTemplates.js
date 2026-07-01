/* ═══════════════════════════════════════════════════════════
   TEMPLATES DE E-MAIL — Ministério dos Transportes
   Arquivo compartilhado entre App.jsx (Diretório) e OrgChart.jsx
   ═══════════════════════════════════════════════════════════ */

/* Paleta institucional usada nos templates */
const BRAND = {
  navy: '#0f2d5a',
  navyDark: '#0a1f3d',
  blue: '#1d4ed8',
  gray: '#f4f6f9',
  border: '#e2e8f0',
  text: '#1f2937',
  muted: '#64748b',
};

/**
 * Envolve o conteúdo de cada template num "papel timbrado" HTML,
 * com cabeçalho institucional, faixa de cor e rodapé padronizado.
 * Mantém tudo em CSS inline por compatibilidade com clientes de e-mail.
 */
function letterhead({ eyebrow, title, accent = BRAND.navy, body }) {
  return `
<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
  <div style="background:linear-gradient(90deg,${BRAND.navyDark},${accent});padding:22px 28px;">
    <div style="color:#cbd5e1;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;margin-bottom:6px;">
      Ministério dos Transportes
    </div>
    <div style="color:#ffffff;font-size:19px;font-weight:700;line-height:1.3;">
      ${title}
    </div>
    ${eyebrow ? `<div style="color:#dbe4ff;font-size:12px;margin-top:6px;">${eyebrow}</div>` : ''}
  </div>
  <div style="padding:28px 28px 8px;color:${BRAND.text};font-size:14.5px;line-height:1.7;">
    ${body}
  </div>
  <div style="padding:18px 28px 24px;">
    <div style="border-top:1px solid ${BRAND.border};padding-top:16px;color:${BRAND.muted};font-size:11.5px;line-height:1.6;">
      Esta mensagem foi enviada pelo <strong>Portal Corporativo — Ministério dos Transportes</strong>.<br/>
      Caso não seja o destinatário pretendido, favor desconsiderar e excluir este e-mail.
    </div>
  </div>
</div>`.trim();
}

const sig = 'Atenciosamente,<br/><strong>Equipe de Gestão de Pessoas</strong><br/>Ministério dos Transportes';

export const EMAIL_PRESETS = [
  {
    id: 'comunicado',
    label: 'Comunicado Oficial',
    subject: 'Comunicado Oficial — Ministério dos Transportes',
    body: letterhead({
      eyebrow: 'Comunicado Institucional',
      title: 'Comunicado Oficial',
      body: `
        <p>Prezado(a) <strong>{{nome}}</strong>,</p>
        <p>Encaminhamos, em nome do Ministério dos Transportes, o comunicado abaixo para conhecimento e providências que se fizerem necessárias.</p>
        <p style="background:${BRAND.gray};border-left:3px solid ${BRAND.navy};padding:12px 16px;border-radius:6px;">
          [Descreva aqui o teor do comunicado.]
        </p>
        <p>Permanecemos à disposição para eventuais esclarecimentos.</p>
        <p>${sig}</p>`,
    }),
  },
  {
    id: 'reuniao',
    label: 'Convocação de Reunião',
    subject: 'Convocação: Reunião — Ministério dos Transportes',
    body: letterhead({
      eyebrow: 'Agenda Institucional',
      title: 'Convocação para Reunião',
      accent: '#1d4ed8',
      body: `
        <p>Prezado(a) <strong>{{nome}}</strong>,</p>
        <p>Convocamos sua participação na reunião abaixo detalhada:</p>
        <table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:13.5px;">
          <tr><td style="padding:8px 0;color:${BRAND.muted};width:110px;">Data</td><td style="padding:8px 0;font-weight:600;">[data]</td></tr>
          <tr style="border-top:1px solid ${BRAND.border};"><td style="padding:8px 0;color:${BRAND.muted};">Horário</td><td style="padding:8px 0;font-weight:600;">[hora]</td></tr>
          <tr style="border-top:1px solid ${BRAND.border};"><td style="padding:8px 0;color:${BRAND.muted};">Local</td><td style="padding:8px 0;font-weight:600;">[local ou link de acesso]</td></tr>
        </table>
        <p><strong>Pauta:</strong></p>
        <p style="background:${BRAND.gray};border-left:3px solid #1d4ed8;padding:12px 16px;border-radius:6px;">
          [Liste aqui os principais pontos a serem tratados.]
        </p>
        <p>Solicitamos a gentileza de confirmar presença até <strong>[data limite]</strong>.</p>
        <p>${sig}</p>`,
    }),
  },
  {
    id: 'circular',
    label: 'Circular Normativa',
    subject: 'Circular nº [XX/2026] — Ministério dos Transportes',
    body: letterhead({
      eyebrow: 'Circular Interna',
      title: 'Circular Normativa nº [XX/2026]',
      accent: '#047857',
      body: `
        <p>Prezado(a) <strong>{{nome}}</strong>,</p>
        <p>Para conhecimento e cumprimento por todas as unidades, informamos o teor da presente circular:</p>
        <p style="background:${BRAND.gray};border-left:3px solid #047857;padding:12px 16px;border-radius:6px;">
          [Descreva o assunto normativo, base legal e procedimentos aplicáveis.]
        </p>
        <p><strong>Vigência:</strong> [data de início de vigência]</p>
        <p>Dúvidas sobre esta circular podem ser encaminhadas à unidade responsável.</p>
        <p>${sig}</p>`,
    }),
  },
  {
    id: 'urgente',
    label: 'Aviso Urgente',
    subject: 'Aviso Urgente — Ministério dos Transportes',
    body: letterhead({
      eyebrow: 'Comunicação Prioritária',
      title: 'Aviso Urgente',
      accent: '#b91c1c',
      body: `
        <p>Prezado(a) <strong>{{nome}}</strong>,</p>
        <p style="display:inline-block;background:#fee2e2;color:#991b1b;font-weight:700;font-size:12px;letter-spacing:.4px;text-transform:uppercase;padding:5px 10px;border-radius:5px;">
          Atenção imediata requerida
        </p>
        <p style="margin-top:14px;background:${BRAND.gray};border-left:3px solid #b91c1c;padding:12px 16px;border-radius:6px;">
          [Descreva a informação ou providência necessária.]
        </p>
        <p>Pedimos que este comunicado seja tratado com prioridade.</p>
        <p>${sig}</p>`,
    }),
  },
  {
    id: 'boas-vindas',
    label: 'Boas-vindas',
    subject: 'Bem-vindo(a) ao Ministério dos Transportes',
    body: letterhead({
      eyebrow: 'Integração de Novos Servidores',
      title: 'Boas-vindas à Equipe',
      accent: '#7c3aed',
      body: `
        <p>Prezado(a) <strong>{{nome}}</strong>,</p>
        <p>É com satisfação que damos as boas-vindas à nossa equipe. Sua trajetória no Ministério dos Transportes começa agora, e estamos à disposição para apoiar essa transição.</p>
        <p>Nos próximos dias você receberá informações sobre integração, acessos a sistemas e demais rotinas do órgão.</p>
        <p>Qualquer dúvida, nossa equipe de Gestão de Pessoas está à disposição.</p>
        <p>${sig}</p>`,
    }),
  },
  {
    id: 'agradecimento',
    label: 'Agradecimento',
    subject: 'Agradecimento — Ministério dos Transportes',
    body: letterhead({
      eyebrow: 'Reconhecimento Institucional',
      title: 'Nota de Agradecimento',
      accent: '#b45309',
      body: `
        <p>Prezado(a) <strong>{{nome}}</strong>,</p>
        <p>Gostaríamos de expressar nosso sincero agradecimento pelo empenho e dedicação demonstrados no exercício de suas atribuições.</p>
        <p>Seu trabalho contribui diretamente para os resultados institucionais do Ministério dos Transportes.</p>
        <p>${sig}</p>`,
    }),
  },
  {
    id: 'em-branco',
    label: 'Em Branco',
    subject: '',
    body: letterhead({
      title: 'Nova Mensagem',
      body: `<p>Prezado(a) <strong>{{nome}}</strong>,</p><p>[Escreva sua mensagem aqui.]</p><p>${sig}</p>`,
    }),
  },
];

/**
 * Converte o HTML do template num texto simples legível,
 * usado para o envio via mailto (que não suporta HTML).
 */
export function htmlToPlainText(html) {
  const withBreaks = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|table)>/gi, '\n')
    .replace(/<li>/gi, '• ');
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  let text;
  if (div) {
    div.innerHTML = withBreaks;
    text = div.textContent || div.innerText || '';
  } else {
    text = withBreaks.replace(/<[^>]+>/g, '');
  }
  return text
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(l => l.trim())
    .join('\n')
    .trim();
}

/**
 * Abre o cliente de e-mail padrão do usuário diretamente (mailto:),
 * usando um link temporário para máxima compatibilidade entre navegadores.
 */
export function openMailClient({ to = [], subject = '', htmlBody = '', name = '' }) {
  if (!to.length) return false;
  const plain = htmlToPlainText(htmlBody).replaceAll('{{nome}}', name || 'Prezado(a)');
  const href = `mailto:${to.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plain)}`;
  const link = document.createElement('a');
  link.href = href;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
