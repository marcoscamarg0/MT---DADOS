import React, { useState, useCallback } from 'react';
import { Download, ChevronDown, ChevronRight, CheckSquare, Square, FileJson, FileText, X, Check, Users, Building2, User, Phone, Mail } from 'lucide-react';

const ORG_TREE = {
    id: 'ministro',
    sigla: 'MT',
    nome: 'Ministério dos Transportes',
    titular: 'GEORGE SANTORO',
    email: 'ministro@transportes.gov.br',
    telefone: '55 (61) 2029-7001 / 7002 / 7003 / 7004 / 7724',
    tipo: 'ministerio',
    filhos: [
        {
            id: 'gm', sigla: 'GM', nome: 'Gabinete do Ministro', tipo: 'assessoria',
            titular: 'MAÍRA ALVES PITA', email: 'chefiadegabinete@transportes.gov.br', telefone: '55 (61) 2029-7005/7717', filhos: []
        },
        {
            id: 'conjur', sigla: 'CONJUR', nome: 'Consultoria Jurídica', tipo: 'assessoria',
            titular: 'MARCONI ARANÍ MÉLO FILHO', email: 'conjur.mt@transportes.gov.br', telefone: '55 (61) 2029-7155/7129', filhos: []
        },
        {
            id: 'aeci', sigla: 'AECI', nome: 'Assessoria Especial de Controle Interno', tipo: 'assessoria',
            titular: 'HENRIQUE BARROS PEREIRA RAMOS', email: 'henrique.ramos@transportes.gov.br', telefone: '55 (61) 2029-7933/7505', filhos: []
        },
        {
            id: 'aspar', sigla: 'ASPAR', nome: 'Assessoria Especial de Assuntos Parlamentares e Federativos', tipo: 'assessoria',
            titular: 'FELIPPE MORAIS ARCO VERDE', email: 'felippe.morais@transportes.gov.br', telefone: '55 (61) 2029-7242', filhos: []
        },
        {
            id: 'aescom', sigla: 'AESCOM', nome: 'Assessoria Especial de Comunicação Social', tipo: 'assessoria',
            titular: 'MILENA SANTOS DE ANDRADE', email: 'milena.andrade@transportes.gov.br', telefone: '55 (61) 2029-7038/7039', filhos: []
        },
        {
            id: 'aspadi', sigla: 'ASPADI', nome: 'Assessoria de Participação Social e Diversidade', tipo: 'assessoria',
            titular: 'FANI MAMEDE', email: 'fani.mamede@transportes.gov.br', telefone: '55 (61) 2029-7104/8171', filhos: []
        },
        {
            id: 'aint', sigla: 'AESINT', nome: 'Assessoria Internacional', tipo: 'assessoria',
            titular: 'LUIZ ANTONIO SURUAGY DO AMARAL DANTAS', email: 'luiz.dantas@transportes.gov.br', telefone: '55 (61) 2029-7564', filhos: []
        },
        {
            id: 'ouv', sigla: 'OUV', nome: 'Ouvidoria', tipo: 'assessoria',
            titular: 'ROSANA DAHER VAN DER BROOCKE', email: 'rosana.broocke@transportes.gov.br', telefone: '55 (61) 2029-8285', filhos: []
        },
        {
            id: 'correg', sigla: 'CORREG', nome: 'Corregedoria', tipo: 'assessoria',
            titular: 'RONDINELLI MELO ALCÂNTARA FALCÃO', email: 'corregedoria@transportes.gov.br', telefone: '55 (61) 2029-7609', filhos: []
        },
        {
            id: 'ce', sigla: 'CE', nome: 'Comissão de Ética', tipo: 'assessoria',
            titular: 'Renato de Souza Santos', email: 'renato.santos@transportes.gov.br', telefone: '(61) 2029-7009', filhos: []
        },
        {
            id: 'se', sigla: 'SE', nome: 'Secretaria Executiva', tipo: 'secretaria',
            titular: 'BRUNO LEITÃO PRAXEDES', email: 'executiva@transportes.gov.br', telefone: '55 (61) 2029-7179',
            filhos: [
                {
                    id: 'spoa', sigla: 'SPOA', nome: 'Subsecretaria de Planejamento, Orçamento e Administração', tipo: 'subsecretaria',
                    titular: 'MANUEL AUGUSTO ALVES SILVA', email: 'spoa@transportes.gov.br', telefone: '55 (61) 2029-8996',
                    filhos: [
                        { id: 'cgrl', sigla: 'CGRL', nome: 'Coord.-Geral de Recursos Logísticos', tipo: 'coordenacao', titular: 'ROSE LEUDA FREITAS DAMASCENO', email: 'rose.damasceno@transportes.gov.br', telefone: '55 (61) 2029-7540', filhos: [] },
                        { id: 'cgo', sigla: 'CGO', nome: 'Coord.-Geral de Orçamento', tipo: 'coordenacao', titular: 'DELVAN ALVES CIPRIANO', email: 'delvan.cipriano@transportes.gov.br', telefone: '55 (61) 2029-7220', filhos: [] },
                        { id: 'cgfc', sigla: 'CGFC', nome: 'Coord.-Geral de Finanças e Contabilidade', tipo: 'coordenacao', titular: 'FÁBIO CESAR DE CARVALHO', email: 'fabio.cesar@transportes.gov.br', telefone: '55 (61) 2029-8066', filhos: [] },
                        { id: 'cglc', sigla: 'CGLC', nome: 'Coord.-Geral de Licitações e Contratos', tipo: 'coordenacao', titular: 'VICTOR HUGO MARTINS DOS SANTOS', email: 'coglc.spoa@transportes.gov.br', telefone: '55 (61) 2029-8084/7118', filhos: [] },
                        { id: 'cggp', sigla: 'CGGP', nome: 'Coord.-Geral de Gestão de Pessoas', tipo: 'coordenacao', titular: 'LUANA DOS SANTOS BRITO', email: 'luana.brito@transportes.gov.br', telefone: '55 (61) 2029-7396/7440', filhos: [] },
                    ]
                },
                {
                    id: 'sgeti', sigla: 'SGETI', nome: 'Subsecretaria de Gestão Estratégica, Tecnologia e Inovação', tipo: 'subsecretaria',
                    titular: 'DIOGO DA FONSECA TABALIPA', email: 'diogo.tabalipa@transportes.gov.br', telefone: '55 (61) 2029-7375/8156',
                    filhos: [
                        { id: 'cgetic', sigla: 'CGETIC', nome: 'Coord.-Geral de Gestão Estratégica e Governança de TIC', tipo: 'coordenacao', titular: 'VALERIA FERREIRA AGUIAR R ZIEMBOWICZ', email: 'valeria.aguiar@transportes.gov.br', telefone: '55 (61) 2029-8157', filhos: [] },
                        { id: 'cgti', sigla: 'CGTI', nome: 'Coord.-Geral de Tecnologia da Informação', tipo: 'coordenacao', titular: 'JAIME HELENO CORREA DE LISBOA', email: 'jaime.lisboa@transportes.gov.br', telefone: '55 (61) 2029-8160', filhos: [] },
                        { id: 'cgdin', sigla: 'CGDIN', nome: 'Coord.-Geral de Dados e Inovação', tipo: 'coordenacao', titular: 'MÁRIO OSWALDO GOMES DA SILVA', email: 'mario.oswaldo@transportes.gov.br', telefone: '55 (61) 2029-7379', filhos: [] },
                    ]
                },
                {
                    id: 'sust', sigla: 'SUST', nome: 'Subsecretaria de Sustentabilidade', tipo: 'subsecretaria',
                    titular: 'CLOVES EDUARDO BENEVIDES', email: 'executiva.sust@transportes.gov.br', telefone: '55 (61) 2029-8152',
                    filhos: [
                        { id: 'cgla', sigla: 'CGLA', nome: 'Coord.-Geral de Licenciamento Ambiental', tipo: 'coordenacao', titular: 'CAMILA LOURDES DA SILVA', email: 'camila.silva@transportes.gov.br', telefone: '55 (61) 2029-', filhos: [] },
                        { id: 'cgpec', sigla: 'CGPEC', nome: 'Coord.-Geral de Projetos Especiais e Mudança do Clima', tipo: 'coordenacao', titular: 'GEORGE YUN', email: 'george.yun@transportes.gov.br', telefone: '55 (61) 2029-8168', filhos: [] },
                    ]
                },
                {
                    id: 'spar', sigla: 'SPAR', nome: 'Subsecretaria de Parcerias', tipo: 'subsecretaria',
                    titular: 'HÉLIO CARNEIRO FERNANDES', email: 'spar@transportes.gov.br', telefone: '55 (61) 2029-7822',
                    filhos: [
                        { id: 'cgparceria', sigla: 'CGP', nome: 'Coord.-Geral de Parcerias', tipo: 'coordenacao', titular: 'LARISSA SPINOLA', email: 'larissa.spinola@transportes.gov.br', telefone: '55 (61) 2029-7755', filhos: [] },
                    ]
                },
                {
                    id: 'sfplan', sigla: 'SFPLAN', nome: 'Subsecretaria de Fomento e Planejamento', tipo: 'subsecretaria',
                    titular: 'GABRIELA MONTEIRO AVELINO', email: 'gabriela.avelino@transportes.gov.br', telefone: '55 (61) 2029-7606',
                    filhos: [
                        { id: 'cgip', sigla: 'CGIP', nome: 'Coord.-Geral de Instrumentos de Planejamento', tipo: 'coordenacao', titular: 'CAMILLA DO CARMO PEROTTO', email: 'camilla.perotto@transportes.gov.br', telefone: '55 (61) 2029-7480', filhos: [] },
                        { id: 'cgpp', sigla: 'CGPP', nome: 'Coord.-Geral de Política de Planejamento', tipo: 'coordenacao', titular: 'RODRIGO SANTOS FERREIRA', email: 'rodrigo.ferreira@transportes.gov.br', telefone: '55 (61) 2029-7514', filhos: [] },
                        { id: 'cggi', sigla: 'CGGI', nome: 'Coord.-Geral de Governança da Informação', tipo: 'coordenacao', titular: 'DANILO OLIVEIRA IMBIMBO', email: 'danilo.imbimbo@transportes.gov.br', telefone: '(61) 2029-7815', filhos: [] },
                    ]
                },
            ]
        },
        {
            id: 'sntr', sigla: 'SNTR', nome: 'Secretaria Nacional de Transporte Rodoviário', tipo: 'secretaria',
            titular: 'VIVIANE ESSE', email: 'agenda.sntr@transportes.gov.br', telefone: '55 (61) 2029-7719/7589',
            filhos: [
                {
                    id: 'dout-sntr', sigla: 'DOUT', nome: 'Departamento de Outorgas Rodoviárias', tipo: 'departamento',
                    titular: 'FERNANDA DE GODOY PENTEADO', email: 'fernanda.penteado@transportes.gov.br', telefone: '55 (61) 2029-7693',
                    filhos: [
                        { id: 'cgcsr', sigla: 'CGCSR', nome: 'Coord.-Geral de Concessões e Serviços Rodoviários', tipo: 'coordenacao', titular: 'ANDERSON SANTOS BELLAS', email: 'anderson.bellas@transportes.gov.br', telefone: '55 (61) 2029-7760', filhos: [] },
                        { id: 'cgodr', sigla: 'CGODR', nome: 'Coord.-Geral de Outorgas e Delegações Rodoviárias', tipo: 'coordenacao', titular: 'PATRÍCIA THEODOROVSKI GARBIN CASTANHA', email: 'patricia.garbin@transportes.gov.br', telefone: '(61) 2029-7445', filhos: [] },
                    ]
                },
                {
                    id: 'dop-sntr', sigla: 'DOP', nome: 'Departamento de Obras Públicas', tipo: 'departamento',
                    titular: 'ALLAN MAGALHÃES MACHADO', email: 'allan.machado@transportes.gov.br', telefone: '55 (61) 2029-7800',
                    filhos: [
                        { id: 'cgop', sigla: 'CGOP', nome: 'Coord.-Geral de Obras Públicas', tipo: 'coordenacao', titular: 'MARIANA CAMPOS PORTO', email: 'mariana.porto@transportes.gov.br', telefone: '55 (61) 2029-7404', filhos: [] },
                    ]
                },
            ]
        },
        {
            id: 'sntf', sigla: 'SNTF', nome: 'Secretaria Nacional de Transporte Ferroviário', tipo: 'secretaria',
            titular: 'LEONARDO CEZAR RIBEIRO', email: 'agenda.sntf@transportes.gov.br', telefone: '55 (61) 2029-7759/7807/7758',
            filhos: [
                {
                    id: 'dop-sntf', sigla: 'DOP', nome: 'Departamento de Obras e Projetos Ferroviários', tipo: 'departamento',
                    titular: 'MARYANE DA SILVA FIGUEIREDO ARAÚJO', email: 'maryane.araujo@transportes.gov.br', telefone: '55 (61) 2029-7577/7938/7738',
                    filhos: [
                        { id: 'cgop-sntf', sigla: 'CGOP', nome: 'Coord.-Geral de Obras e Projetos', tipo: 'coordenacao', titular: 'HENRIQUE OLIVEIRA MENDES', email: 'henrique.mendes@transportes.gov.br', telefone: '55 (61) 2029-7763/7938', filhos: [] },
                    ]
                },
                {
                    id: 'dout-sntf', sigla: 'DOUT', nome: 'Departamento de Outorgas Ferroviárias', tipo: 'departamento',
                    titular: 'JEFFERSON VASCONCELOS SANTOS', email: 'jefferson.santos@transportes.gov.br', telefone: '55 (61) 2029-7758/7807',
                    filhos: [
                        { id: 'cgof1', sigla: 'CGOF-I', nome: 'Coord.-Geral de Outorgas Ferroviárias I', tipo: 'coordenacao', titular: 'ALVARO SIMÕES DA CONCEIÇÃO NETO', email: 'alvaro.neto@transportes.gov.br', telefone: '55 (61) 2029-7471/7938/7738', filhos: [] },
                        { id: 'cgof2', sigla: 'CGOF-II', nome: 'Coord.-Geral de Outorgas Ferroviárias II', tipo: 'coordenacao', titular: 'LUIS FELLIPE ARRUSSUL DE MELO', email: 'luis.melo@transportes.gov.br', telefone: '55 (61) 2029-8291', filhos: [] },
                    ]
                },
            ]
        },
        {
            id: 'senatran', sigla: 'SENATRAN', nome: 'Secretaria Nacional de Trânsito', tipo: 'secretaria',
            titular: 'ADRUALDO DE LIMA CATÃO', email: 'gabinete.senatran@transportes.gov.br', telefone: '55 (61) 2029-7810/8180/8262',
            filhos: [
                {
                    id: 'drfg', sigla: 'DRFG', nome: 'Departamento de Regulação, Fiscalização e Gestão', tipo: 'departamento',
                    titular: 'BASÍLIO MILITANI NETO', email: 'drfg@transportes.gov.br', telefone: '55 (61) 2029-8463',
                    filhos: [
                        { id: 'cgsi', sigla: 'CGSI', nome: 'Coord.-Geral de Sistemas e Inovação', tipo: 'coordenacao', titular: 'EVERTON MURILO VIEIRA', email: 'everton.vieira@transportes.gov.br', telefone: '55 (61) 2029-8205', filhos: [] },
                        { id: 'cgie', sigla: 'CGIE', nome: 'Coord.-Geral de Informação e Estatística', tipo: 'coordenacao', titular: 'PEDRO CÉSAR VIEIRA BARBOSA', email: 'drfg@transportes.gov.br', telefone: '55 (61) 2029-8463', filhos: [] },
                        { id: 'cgr', sigla: 'CGR', nome: 'Coord.-Geral de Regulação', tipo: 'coordenacao', titular: 'THALYA VITORIA REZENDE NEVES', email: 'drfg@transportes.gov.br', telefone: '55 (61) 2029-8463', filhos: [] },
                        { id: 'cgsc', sigla: 'CGSC', nome: 'Coord.-Geral de Supervisão e Conformidade', tipo: 'coordenacao', titular: 'ISRAEL JOSÉ REIS DE CARVALHO', email: 'drfg@transportes.gov.br', telefone: '55 (61) 2029-8227', filhos: [] },
                    ]
                },
                {
                    id: 'dseg', sigla: 'DSEG', nome: 'Departamento de Segurança no Trânsito', tipo: 'departamento',
                    titular: 'MARIA ALICE NASCIMENTO SOUZA', email: 'dseg.senatran@transportes.gov.br', telefone: '55 (61) 2029-8429',
                    filhos: [
                        { id: 'cgsv', sigla: 'CGSV', nome: 'Coord.-Geral de Segurança Viária', tipo: 'coordenacao', titular: 'DANIEL MARIZ TAVARES', email: 'cgsv@transportes.gov.br', telefone: '55 (61) 2029-8429', filhos: [] },
                        { id: 'cgest', sigla: 'CGEST', nome: 'Coord.-Geral de Formação e Educação para o Trânsito', tipo: 'coordenacao', titular: 'IZABELA RIZZOTTI SOUZA LIMA', email: 'cgest@transportes.gov.br', telefone: '55 (61) 2029-8213', filhos: [] },
                    ]
                },
            ]
        },
        {
            id: 'antt', sigla: 'ANTT', nome: 'Agência Nacional de Transportes Terrestres', tipo: 'entidade',
            titular: '—', email: 'www.antt.gov.br', telefone: '166', filhos: []
        },
        {
            id: 'antaq', sigla: 'ANTAQ', nome: 'Agência Nacional de Transportes Aquaviários', tipo: 'entidade',
            titular: '—', email: 'www.antaq.gov.br', telefone: '0800 644 5001', filhos: []
        },
        {
            id: 'dnit', sigla: 'DNIT', nome: 'Departamento Nacional de Infraestrutura de Transportes', tipo: 'entidade',
            titular: '—', email: 'www.dnit.gov.br', telefone: '0800 61 1532', filhos: []
        },
        {
            id: 'infra', sigla: 'INFRA', nome: 'Empresa de Planejamento e Logística (EPL / Infra S.A.)', tipo: 'entidade',
            titular: '—', email: 'www.epl.gov.br', telefone: '(61) 3329-8200', filhos: []
        },
        {
            id: 'valec', sigla: 'VALEC', nome: 'VALEC Engenharia, Construções e Ferrovias S.A.', tipo: 'entidade',
            titular: '—', email: 'www.valec.gov.br', telefone: '(61) 2029-6000', filhos: []
        },
    ]
};

const TIPO_CONFIG = {
    ministerio: { bg: 'bg-[#1a3a5c]', border: 'border-[#1a3a5c]', text: 'text-white', badge: 'bg-white/20 text-white', label: 'Ministério' },
    secretaria: { bg: 'bg-[#1d6fa4]', border: 'border-[#1d6fa4]', text: 'text-white', badge: 'bg-white/20 text-white', label: 'Secretaria Nacional' },
    assessoria: { bg: 'bg-[#2e7d32]', border: 'border-[#388e3c]', text: 'text-white', badge: 'bg-white/20 text-white', label: 'Assessoria' },
    subsecretaria: { bg: 'bg-white', border: 'border-[#1d6fa4]', text: 'text-[#1a3a5c]', badge: 'bg-[#e3f0fa] text-[#1d6fa4]', label: 'Subsecretaria' },
    departamento: { bg: 'bg-white', border: 'border-[#f59e0b]', text: 'text-[#1a3a5c]', badge: 'bg-amber-100 text-amber-700', label: 'Departamento' },
    coordenacao: { bg: 'bg-[#f8fafc]', border: 'border-[#94a3b8]', text: 'text-[#334155]', badge: 'bg-slate-100 text-slate-600', label: 'Coordenação' },
    entidade: { bg: 'bg-white', border: 'border-[#7c3aed]', text: 'text-[#1a3a5c]', badge: 'bg-purple-100 text-purple-700', label: 'Entidade Vinculada' },
};

function flattenTree(node, parent = null) {
    const flat = [{ ...node, parentId: parent, filhos: undefined }];
    for (const child of (node.filhos || [])) {
        flat.push(...flattenTree(child, node.id));
    }
    return flat;
}

const ALL_NODES = flattenTree(ORG_TREE);

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

function downloadCSV(data, filename) {
    const headers = ['sigla', 'nome', 'tipo', 'titular', 'email', 'telefone', 'parentId'];
    const rows = data.map(n => headers.map(h => `"${(n[h] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

function TooltipInfo({ titular, email, telefone }) {
    return (
        <div className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl whitespace-nowrap transition-all duration-200 pointer-events-none border border-slate-700">
            <div className="font-bold text-[10px] text-slate-400 uppercase mb-2 border-b border-slate-700 pb-1">Responsável do Setor</div>
            <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                <User size={13} className="text-blue-400" />
                {titular && titular !== '—' && titular !== 'VAGO' ? titular : 'Não informado'}
            </div>
            {email && (
                <div className="flex items-center gap-2 text-[11px] text-slate-300 mb-1">
                    <Mail size={12} className="text-slate-400" />
                    {email}
                </div>
            )}
            {telefone && (
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <Phone size={12} className="text-emerald-400" />
                    {telefone}
                </div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
    );
}

function NodeCard({ node, selected, onToggleSelect, expanded, onToggleExpand, depth = 0 }) {
    const cfg = TIPO_CONFIG[node.tipo] || TIPO_CONFIG.coordenacao;
    const hasChildren = node.filhos && node.filhos.length > 0;
    const isSelected = selected.has(node.id);

    return (
        <div className={`relative flex flex-col items-center`} style={{ minWidth: depth === 0 ? 170 : 150 }}>
            <div
                className={`relative rounded-xl border-2 ${cfg.border} ${cfg.bg} shadow-sm hover:shadow-md transition-all cursor-pointer group select-none flex flex-col`}
                style={{ width: depth === 0 ? 170 : 150, minHeight: 80 }}
                onClick={() => onToggleSelect(node.id)}
            >
                <button
                    className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => { e.stopPropagation(); onToggleSelect(node.id); }}
                >
                    {isSelected
                        ? <CheckSquare size={14} className="text-blue-500" />
                        : <Square size={14} className={cfg.text} />
                    }
                </button>

                {isSelected && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400 ring-offset-1 pointer-events-none" />
                )}

                <TooltipInfo titular={node.titular} email={node.email} telefone={node.telefone} />

                <div className="p-3 flex-1 flex flex-col items-center justify-center text-center">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 ${cfg.badge}`}>
                        {node.sigla}
                    </span>
                    <p className={`text-[10px] font-bold leading-tight ${cfg.text}`} title={node.nome}>
                        {node.nome}
                    </p>
                </div>

                {hasChildren && (
                    <button
                        onClick={e => { e.stopPropagation(); onToggleExpand(node.id); }}
                        className={`absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow border-2 ${cfg.border} ${cfg.bg} hover:scale-110 transition-transform`}
                    >
                        {expanded.has(node.id)
                            ? <ChevronDown size={12} className={cfg.text} />
                            : <ChevronRight size={12} className={cfg.text} />
                        }
                    </button>
                )}
            </div>

            {hasChildren && expanded.has(node.id) && (
                <div className="mt-5 flex flex-row flex-wrap justify-center gap-3 pt-2 relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-300" />
                    {node.filhos.length > 1 && (
                        <div
                            className="absolute top-1 bg-slate-300 h-0.5"
                            style={{
                                left: `calc(50% - ${(node.filhos.length - 1) * 85}px)`,
                                width: `${(node.filhos.length - 1) * 170}px`
                            }}
                        />
                    )}
                    {node.filhos.map(child => (
                        <div key={child.id} className="relative flex flex-col items-center">
                            <div className="w-0.5 h-3 bg-slate-300" />
                            <NodeCard
                                node={child}
                                selected={selected}
                                onToggleSelect={onToggleSelect}
                                expanded={expanded}
                                onToggleExpand={onToggleExpand}
                                depth={depth + 1}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DownloadPanel({ selected, onClose, onSelectAll, onClearAll }) {
    const selectedNodes = ALL_NODES.filter(n => selected.has(n.id));
    const downloadData = selectedNodes.length > 0 ? selectedNodes : ALL_NODES;
    const label = selectedNodes.length > 0
        ? `${selectedNodes.length} selecionados`
        : `Todos (${ALL_NODES.length})`;

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 animate-[fade-in_0.3s_ease]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Download size={16} className="text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">Baixar Dados</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <div className="p-4 space-y-3">
                <p className="text-xs text-slate-500">
                    {selectedNodes.length > 0
                        ? `Exportando ${label}`
                        : 'Nenhum nó selecionado — exportará todos os dados'}
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={() => onSelectAll()}
                        className="flex-1 text-xs py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                    >
                        Selecionar Tudo
                    </button>
                    <button
                        onClick={() => onClearAll()}
                        className="flex-1 text-xs py-1.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                        Limpar Seleção
                    </button>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => downloadJSON(downloadData, `organograma_mt_${Date.now()}.json`)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a3a5c] text-white rounded-xl hover:bg-[#1d6fa4] transition-colors font-medium text-sm"
                    >
                        <FileJson size={18} />
                        <span>Baixar JSON</span>
                        <span className="ml-auto text-xs opacity-70">{label}</span>
                    </button>
                    <button
                        onClick={() => downloadCSV(downloadData, `organograma_mt_${Date.now()}.csv`)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm"
                    >
                        <FileText size={18} />
                        <span>Baixar CSV</span>
                        <span className="ml-auto text-xs opacity-70">{label}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function Legend() {
    const tipos = Object.entries(TIPO_CONFIG).filter(([k]) => k !== 'ministerio');
    return (
        <div className="flex flex-wrap gap-2 items-center justify-center">
            {tipos.map(([key, cfg]) => (
                <span key={key} className={`text-[10px] font-bold px-2 py-1 rounded border ${cfg.border} ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                </span>
            ))}
        </div>
    );
}

function AssessoriaBlock({ nodes, selected, onToggleSelect }) {
    const cfg = TIPO_CONFIG.assessoria;
    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {nodes.map(node => {
                const isSelected = selected.has(node.id);
                return (
                    <div
                        key={node.id}
                        onClick={() => onToggleSelect(node.id)}
                        className={`relative px-4 py-3 rounded-lg border-2 ${cfg.border} ${cfg.bg} cursor-pointer hover:shadow-md transition-all group select-none flex flex-col items-center text-center`}
                        style={{ minWidth: 140, flex: '1 1 140px', maxWidth: 180 }}
                    >
                        {isSelected && <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400 ring-offset-1 pointer-events-none" />}

                        <TooltipInfo titular={node.titular} email={node.email} telefone={node.telefone} />

                        <span className="text-[10px] font-bold text-white/90 uppercase mb-1.5 px-2 py-0.5 rounded bg-black/10">{node.sigla}</span>
                        <p className="text-[10px] font-semibold text-white leading-snug">{node.nome}</p>
                    </div>
                );
            })}
        </div>
    );
}

export default function OrgChart() {
    const [selected, setSelected] = useState(new Set());
    const [expanded, setExpanded] = useState(new Set(['ministro', 'se', 'sntr', 'sntf', 'senatran']));
    const [showDownload, setShowDownload] = useState(false);

    const toggleSelect = useCallback((id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const toggleExpand = useCallback((id) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const selectAll = () => setSelected(new Set(ALL_NODES.map(n => n.id)));
    const clearAll = () => setSelected(new Set());

    const ministerioNode = ORG_TREE;
    const assessorias = ORG_TREE.filhos.filter(n => n.tipo === 'assessoria');
    const secretarias = ORG_TREE.filhos.filter(n => n.tipo === 'secretaria');
    const entidades = ORG_TREE.filhos.filter(n => n.tipo === 'entidade');

    const cfg = TIPO_CONFIG.ministerio;

    return (
        <div className="relative w-full">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Organograma do Ministério dos Transportes</h2>
                    <p className="text-xs text-slate-500 mt-1">Passe o mouse num card para ver o responsável • Clique no ▶ para expandir</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                        {selected.size > 0 ? `${selected.size} selecionados` : `${ALL_NODES.length} unidades`}
                    </span>
                    <button
                        onClick={() => setShowDownload(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a3a5c] text-white text-sm font-bold rounded-xl hover:bg-[#1d6fa4] transition-colors shadow-sm"
                    >
                        <Download size={16} />
                        Baixar Dados
                    </button>
                </div>
            </div>

            <div className="mb-6"><Legend /></div>

            <div className="w-full pb-12 overflow-x-hidden">
                <div className="flex flex-col items-center gap-0 w-full mx-auto" style={{ padding: '0 10px' }}>

                    <div
                        className={`relative rounded-2xl border-2 ${cfg.border} ${cfg.bg} shadow-lg cursor-pointer group select-none`}
                        style={{ width: 240 }}
                        onClick={() => toggleSelect(ministerioNode.id)}
                    >
                        {selected.has(ministerioNode.id) && <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-400 ring-offset-2 pointer-events-none" />}

                        <TooltipInfo titular={ministerioNode.titular} email={ministerioNode.email} telefone={ministerioNode.telefone} />

                        <div className="p-5 text-center">
                            <div className="w-12 h-12 rounded-xl bg-white/10 mx-auto mb-4 flex items-center justify-center">
                                <Building2 size={24} className="text-white" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1.5">Ministério dos Transportes</p>
                            <h3 className="text-base font-bold text-white">Gabinete do Ministro</h3>
                        </div>
                    </div>

                    <div className="w-0.5 bg-slate-300 h-6" />

                    <div className="bg-[#e8f5e9] border border-[#a5d6a7] rounded-2xl p-4 w-full max-w-6xl shadow-sm">
                        <p className="text-[10px] font-bold text-[#2e7d32] uppercase tracking-wider mb-3 text-center">Órgãos de Assistência Direta e Imediata ao Ministro</p>
                        <AssessoriaBlock nodes={assessorias} selected={selected} onToggleSelect={toggleSelect} />
                    </div>

                    <div className="w-0.5 bg-slate-300 h-6" />

                    <div className="flex flex-row gap-6 items-start justify-center flex-wrap w-full max-w-7xl">
                        {secretarias.map(secretaria => (
                            <div key={secretaria.id} className="flex flex-col items-center">
                                <div
                                    className={`relative rounded-xl border-2 border-[#1d6fa4] bg-[#1d6fa4] shadow-md cursor-pointer group select-none flex flex-col`}
                                    style={{ width: 180, minHeight: 80 }}
                                    onClick={() => toggleSelect(secretaria.id)}
                                >
                                    {selected.has(secretaria.id) && <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400 ring-offset-2 pointer-events-none" />}

                                    <TooltipInfo titular={secretaria.titular} email={secretaria.email} telefone={secretaria.telefone} />

                                    <div className="p-3 text-center flex-1 flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-bold text-white/90 uppercase mb-2 px-2 py-0.5 rounded bg-black/10">{secretaria.sigla}</span>
                                        <p className="text-[10px] font-bold text-white leading-snug">{secretaria.nome}</p>
                                    </div>
                                    {secretaria.filhos.length > 0 && (
                                        <button
                                            onClick={e => { e.stopPropagation(); toggleExpand(secretaria.id); }}
                                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow border-2 border-[#1d6fa4] bg-[#1d6fa4] hover:scale-110 transition-transform"
                                        >
                                            {expanded.has(secretaria.id) ? <ChevronDown size={12} className="text-white" /> : <ChevronRight size={12} className="text-white" />}
                                        </button>
                                    )}
                                </div>

                                {secretaria.filhos.length > 0 && expanded.has(secretaria.id) && (
                                    <div className="mt-5 flex flex-col items-center gap-3 pt-2">
                                        <div className="w-0.5 h-3 bg-slate-300" />
                                        <div className="flex flex-row flex-wrap gap-3 justify-center">
                                            {secretaria.filhos.map(filho => (
                                                <div key={filho.id} className="flex flex-col items-center">
                                                    <div className="w-0.5 h-3 bg-slate-300" />
                                                    <NodeCard
                                                        node={filho}
                                                        selected={selected}
                                                        onToggleSelect={toggleSelect}
                                                        expanded={expanded}
                                                        onToggleExpand={toggleExpand}
                                                        depth={1}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="w-0.5 bg-slate-300 h-8 mt-6" />

                    <div className="bg-[#f3e8ff] border border-[#c4b5fd] rounded-2xl p-4 w-full max-w-6xl shadow-sm">
                        <p className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider mb-3 text-center">Entidades Vinculadas</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {entidades.map(entidade => {
                                const isSelected = selected.has(entidade.id);
                                return (
                                    <div
                                        key={entidade.id}
                                        onClick={() => toggleSelect(entidade.id)}
                                        className="relative bg-white border-2 border-[#7c3aed] rounded-xl px-4 py-3 cursor-pointer hover:shadow-md transition-all select-none group flex flex-col items-center text-center"
                                        style={{ minWidth: 150, flex: '1 1 150px', maxWidth: 190 }}
                                    >
                                        {isSelected && <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400 ring-offset-1 pointer-events-none" />}

                                        <TooltipInfo titular={entidade.titular} email={entidade.email} telefone={entidade.telefone} />

                                        <span className="text-[9px] font-bold text-purple-700 uppercase block mb-1.5 px-2 py-0.5 rounded bg-purple-50">{entidade.sigla}</span>
                                        <p className="text-[10px] font-bold text-slate-700 leading-snug">{entidade.nome}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {showDownload && (
                <DownloadPanel
                    selected={selected}
                    onClose={() => setShowDownload(false)}
                    onSelectAll={selectAll}
                    onClearAll={clearAll}
                />
            )}
        </div>
    );
}