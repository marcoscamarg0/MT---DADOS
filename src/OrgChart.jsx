import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Users, ChevronDown, ChevronUp, Search, Network, ZoomIn, ZoomOut, Maximize2, X, Mail, Phone, Building2, Send, LayoutTemplate, Pencil, Trash2, Plus, RotateCcw, Save, Filter, Info } from 'lucide-react';
import { EMAIL_PRESETS, openMailClient } from './emailTemplates';
import './index.css';

const API = '/api';
const ORG_STORAGE_KEY = 'mt-orgchart-data-v1';

/* ═══════════════════════════════════════════════════════════
   ESTRUTURA ORGANIZACIONAL (Decreto nº 11.360/2023 e atualizações)
   Cada nó traz "resumo" e "competencias" para exibir o que o
   setor faz, além dos campos usados no layout/tema (tipo) e no
   cruzamento com a lista de contatos (deptKey).
   ═══════════════════════════════════════════════════════════ */
const DEFAULT_ORG_TREE = {
  id: 'MINISTRO', sigla: 'MINISTRO', nome: 'Ministro de Estado', tipo: 'ministerio',
  deptKey: 'Gabinete do Ministro - GM',
  resumo: 'Autoridade máxima do Ministério dos Transportes, responsável pela política nacional de transportes ferroviário e rodoviário e pela política nacional de trânsito.',
  competencias: [
    'Definir a política nacional de transportes ferroviário e rodoviário e a política nacional de trânsito.',
    'Participar do planejamento estratégico e definir prioridades dos investimentos em transportes, em articulação com o Ministério de Portos e Aeroportos.',
    'Aprovar os planos de outorgas do setor, na forma da legislação específica.',
    'Definir diretrizes para a representação do País em organismos internacionais e em tratados relativos a transportes.',
    'Conduzir o desenvolvimento da infraestrutura ferroviária e rodoviária, promovendo segurança e eficiência no transporte de cargas e passageiros.',
  ],
  filhos: [
    {
      id: 'SE', sigla: 'SE', nome: 'Secretaria Executiva', tipo: 'secretaria',
      deptKey: 'Secretaria Executiva - SE',
      resumo: 'Coordena e supervisiona as demais Secretarias e entidades vinculadas, e conduz o planejamento estratégico do Ministério.',
      competencias: [
        'Assistir o Ministro na supervisão e coordenação das Secretarias e entidades vinculadas.',
        'Supervisionar sistemas federais de orçamento, contabilidade, finanças, pessoal, TI, patrimônio e arquivos.',
        'Coordenar a formulação do planejamento estratégico e definir prioridades dos investimentos e planos de outorgas.',
        'Propor a aprovação de instrumentos de planejamento, delegação, outorgas e propostas tarifárias.',
        'Coordenar ações de licenciamento ambiental de empreendimentos estratégicos.',
        'Supervisionar remoção de interferências, desapropriações e emissão de posse para obras de infraestrutura.',
        'Supervisionar a política nacional de trânsito e de transportes ferroviário e rodoviário.',
        'Propor, acompanhar e implementar políticas de fomento ao transporte intermodal e multimodal.',
      ],
      filhos: [
        { id: 'SUST', sigla: 'SUST', nome: 'Subsecretaria de Sustentabilidade', tipo: 'subsecretaria', deptKey: 'Subsecretaria de Sustentabilidade - SUST', filhos: [],
          resumo: 'Coordena a transição ecológica e as questões socioambientais dos empreendimentos de infraestrutura do Ministério.',
          competencias: [
            'Coordenar a implementação de diretrizes de transição ecológica nas obras e outorgas do Ministério.',
            'Coordenar e monitorar o equacionamento de questões socioambientais dos empreendimentos de infraestrutura.',
            'Representar o Ministério junto a órgãos ambientais e em fóruns e colegiados relacionados ao tema.',
            'Padronizar procedimentos de utilidade pública, remoção de interferências e desapropriação para obras.',
          ] },
        { id: 'SPAR', sigla: 'SPAR', nome: 'Subsecretaria de Parcerias', tipo: 'subsecretaria', deptKey: 'Subsecretaria de Parcerias - SPAR', filhos: [],
          resumo: 'Avalia planos de outorga e assessora concessões, autorizações, desestatizações e parcerias com a iniciativa privada.',
          competencias: [
            'Avaliar os planos de outorga setoriais quanto à aderência à política nacional de transportes.',
            'Coordenar entre as Secretarias os temas de parceria e articular-se com órgãos públicos e a sociedade civil.',
            'Assistir tecnicamente o Ministro em matérias de concessões, autorizações e desestatizações.',
            'Assessorar instrumentos de parceria com a iniciativa privada e reorganizações institucionais de entidades vinculadas.',
          ] },
        { id: 'SFPLAN', sigla: 'SFPLAN', nome: 'Subsecretaria de Fomento e Planejamento', tipo: 'subsecretaria', deptKey: 'Subsecretaria de Fomento e Planejamento - SFPLAN', filhos: [],
          resumo: 'Formula a política nacional de transportes ferroviário e rodoviário e coordena o planejamento e o fomento do setor.',
          competencias: [
            'Formular, monitorar e avaliar a política nacional de transportes ferroviário e rodoviário.',
            'Definir critérios e prioridades para os planos de logística e infraestrutura de transportes.',
            'Coordenar a implementação e atualização do Sistema Nacional de Viação.',
            'Identificar fontes de recursos e coordenar a captação de financiamento nacional e internacional.',
            'Elaborar, atualizar e monitorar o planejamento nacional de transportes ferroviário e rodoviário.',
          ] },
        { id: 'SPOA', sigla: 'SPOA', nome: 'Subsecretaria de Planejamento, Orçamento e Administração', tipo: 'subsecretaria', deptKey: 'SPOA - Planejamento, Orçamento e Administração', filhos: [],
          resumo: 'Responsável pelo orçamento, finanças, contabilidade, pessoal, patrimônio e arquivos do Ministério.',
          competencias: [
            'Planejar e supervisionar a execução orçamentária, financeira e contábil do Ministério.',
            'Acompanhar, por relatórios gerenciais, a execução orçamentária e financeira e reportar ao Secretário-Executivo.',
            'Coordenar organização institucional, pessoal civil, serviços gerais e gestão de documentos e arquivos.',
            'Realizar tomadas de contas de responsáveis por bens e valores públicos.',
            'Liquidar e executar despesas da Lei Orçamentária Anual, restos a pagar e despesas de pessoal.',
          ] },
        { id: 'SGETI', sigla: 'SGETI', nome: 'Subsecretaria de Gestão Estratégica, Tecnologia e Inovação', tipo: 'subsecretaria', deptKey: 'SGETI - Gestão Estratégica, Tecnologia e Inovação', filhos: [],
          resumo: 'Conduz a gestão estratégica, a transformação digital e a governança de tecnologia da informação do Ministério.',
          competencias: [
            'Elaborar, monitorar e avaliar a gestão e o planejamento estratégico do Ministério.',
            'Coordenar ações de geração de valor e eficiência, alinhando Secretarias e entidades vinculadas ao plano estratégico.',
            'Definir programas de simplificação, inovação, otimização de gastos e melhoria de produtividade.',
            'Definir diretrizes e coordenar projetos de transformação digital dos serviços públicos do Ministério.',
          ] },
        { id: 'CONJUR', sigla: 'CONJUR', nome: 'Consultoria Jurídica', tipo: 'consultoria', deptKey: 'Consultoria Jurídica - CONJUR', filhos: [],
          resumo: 'Órgão setorial da Advocacia-Geral da União responsável pela assessoria jurídica do Ministério.',
          competencias: [
            'Prestar assessoria e consultoria jurídica no âmbito do Ministério.',
            'Fixar a interpretação da Constituição, das leis e demais normas na área de atuação do Ministério.',
            'Emitir parecer conclusivo sobre a constitucionalidade e legalidade das propostas normativas.',
            'Assistir o Ministro no controle interno da legalidade administrativa dos atos do Ministério.',
            'Examinar prévia e conclusivamente convênios, editais, contratos, dispensas e inexigibilidades de licitação.',
          ] },
        { id: 'OUV', sigla: 'OUV', nome: 'Ouvidoria', tipo: 'consultoria', deptKey: 'Ouvidoria', filhos: [],
          resumo: 'Canal de atendimento ao cidadão, recebimento de denúncias e proteção de dados pessoais do Ministério.',
          competencias: [
            'Coordenar o atendimento às manifestações dos cidadãos e o acesso à informação.',
            'Exercer a função de canal de recebimento de denúncias no Ministério.',
            'Exercer as atividades de encarregado pelo tratamento de dados pessoais (LGPD).',
            'Representar o Ministério no Sistema de Ouvidorias Federais.',
          ] },
        { id: 'CORREG', sigla: 'CORREG', nome: 'Corregedoria', tipo: 'consultoria', deptKey: 'Corregedoria', filhos: [],
          resumo: 'Órgão setorial do Sistema de Correição do Poder Executivo Federal, responsável pela apuração de irregularidades funcionais.',
          competencias: [
            'Promover atividades de correição para verificar a regularidade e a eficácia dos serviços.',
            'Instaurar sindicâncias e processos administrativos disciplinares.',
            'Julgar e aplicar penalidades de advertência ou suspensão de até 30 dias.',
            'Instruir processos com penalidades mais graves para remessa ao Ministro.',
          ] },
      ]
    },
    {
      id: 'GM', sigla: 'GM', nome: 'Gabinete Ministerial', tipo: 'gabinete',
      deptKey: 'Gabinete do Ministro - GM',
      resumo: 'Assiste diretamente o Ministro em sua representação política e social e organiza seu expediente e agenda institucional.',
      competencias: [
        'Assistir o Ministro em sua representação política e social e cuidar do seu expediente pessoal.',
        'Monitorar a tramitação de projetos de interesse do Ministério no Congresso Nacional.',
        'Cuidar da publicação oficial e da divulgação de matérias do Ministério.',
        'Prestar apoio administrativo aos expedientes de interesse do Ministério.',
      ],
      filhos: [
        { id: 'CCGM', sigla: 'CCGM', nome: 'Coordenação-Geral do Gabinete do Ministro', tipo: 'coordenacao', deptKey: 'Gabinete do Ministro - GM', filhos: [],
          resumo: 'Coordena as atividades administrativas e de apoio direto do Gabinete do Ministro.',
          competencias: [
            'Coordenar a agenda, os expedientes e o apoio administrativo do Gabinete do Ministro.',
            'Articular internamente as demandas dirigidas ao Ministro entre as unidades do Ministério.',
            'Acompanhar o andamento de processos e demandas de despacho direto ao Ministro.',
          ] },
        { id: 'CERIM', sigla: 'CERIM', nome: 'Assessoria de Cerimonial', tipo: 'assessoria', deptKey: 'Gabinete do Ministro - GM', filhos: [],
          resumo: 'Responsável pelo cerimonial e pela organização de solenidades oficiais do Ministério.',
          competencias: [
            'Organizar o cerimonial e o protocolo de eventos e solenidades oficiais do Ministério.',
            'Coordenar a logística de recepção de autoridades e convidados em atos oficiais.',
            'Orientar as unidades do Ministério quanto às normas de cerimonial público.',
          ] },
        { id: 'ASSAD', sigla: 'ASSAD', nome: 'Assessoria Administrativa', tipo: 'assessoria', deptKey: 'Gabinete do Ministro - GM', filhos: [],
          resumo: 'Presta apoio administrativo ao Gabinete do Ministro.',
          competencias: [
            'Prestar apoio administrativo aos expedientes de interesse do Gabinete do Ministro.',
            'Gerir documentos, protocolos e processos administrativos do Gabinete.',
            'Apoiar a organização de recursos materiais e de infraestrutura do Gabinete.',
          ] },
        { id: 'AEAPF', sigla: 'AEAPF', nome: 'Assessoria Especial de Assuntos Parlamentares e Federativos', tipo: 'assessoria', deptKey: 'Assessoria Especial de Assuntos Parlamentares e Federativos', filhos: [],
          resumo: 'Cuida do relacionamento do Ministério com o Congresso Nacional e com Estados, Distrito Federal e Municípios.',
          competencias: [
            'Assessorar o Ministro sobre o processo legislativo e o relacionamento com o Congresso Nacional e entes federativos.',
            'Planejar e coordenar as atividades relacionadas à ação parlamentar e à conjuntura política.',
            'Acompanhar a tramitação de requerimentos do Congresso Nacional e de entes federativos.',
            'Manter interlocução com os Executivos estaduais, distrital e municipais e respectivas casas legislativas.',
          ] },
        { id: 'AESCOM', sigla: 'AESCOM', nome: 'Assessoria Especial de Comunicação Social', tipo: 'assessoria', deptKey: 'Assessoria Especial de Comunicação Social - AESCOM', filhos: [],
          resumo: 'Responsável pela comunicação institucional e pela divulgação das ações do Ministério e de suas entidades vinculadas.',
          competencias: [
            'Divulgar matérias relacionadas à atuação do Ministério e de suas entidades vinculadas.',
            'Executar as atividades de comunicação social sobre as realizações do Ministério.',
          ] },
        { id: 'AECI', sigla: 'AECI', nome: 'Assessoria Especial de Controle Interno', tipo: 'assessoria', deptKey: 'Assessoria Especial de Controle Interno', filhos: [],
          resumo: 'Assessora o Ministro nas áreas de controle, risco, transparência e integridade da gestão.',
          competencias: [
            'Assessorar diretamente o Ministro nas áreas de controle, risco, transparência e integridade da gestão.',
            'Acompanhar recomendações da Controladoria-Geral da União e deliberações do Tribunal de Contas da União.',
            'Planejar e coordenar programas de integridade, controle, conformidade e prevenção a fraude e corrupção.',
            'Apurar preliminarmente denúncias de irregularidades envolvendo agentes públicos do Ministério.',
          ] },
        { id: 'APSD', sigla: 'APSD', nome: 'Assessoria de Participação Social e Diversidade', tipo: 'assessoria', deptKey: 'Assessoria de Participação Social e Diversidade', filhos: [],
          resumo: 'Articula a relação do Ministério com a sociedade civil e assessora políticas de participação social, diversidade e direitos humanos.',
          competencias: [
            'Articular, junto à Secretaria-Geral da Presidência, as relações políticas do Ministério com a sociedade civil.',
            'Fortalecer mecanismos e instâncias democráticas de diálogo entre a administração federal e a sociedade civil.',
            'Assessorar o Ministro na formulação de políticas de participação social e igualdade de gênero, étnica e racial.',
            'Assessorar políticas de proteção aos direitos humanos e de enfrentamento a desigualdades sociais e regionais.',
          ] },
        { id: 'AI', sigla: 'AI', nome: 'Assessoria Internacional', tipo: 'assessoria', deptKey: 'Assessoria Internacional - AESINT', filhos: [],
          resumo: 'Assessora o Ministro em temas, negociações e acordos internacionais de infraestrutura de transportes, em articulação com o Itamaraty.',
          competencias: [
            'Assessorar o Ministro em temas, negociações e processos internacionais, em articulação com o Ministério das Relações Exteriores.',
            'Subsidiar decisões sobre a política internacional de infraestrutura de transportes ferroviário e rodoviário.',
            'Divulgar oportunidades de parceria e investimento a potenciais parceiros e investidores internacionais.',
            'Manter interlocução com embaixadas estrangeiras e organismos internacionais com sede no País.',
          ] },
      ]
    },
    {
      id: 'SNTR', sigla: 'SNTR', nome: 'Secretaria Nacional de Transporte Rodoviário', tipo: 'secretaria-nacional',
      deptKey: 'Secretaria Nacional de Transporte Rodoviário - SNTR',
      resumo: 'Coordena a política nacional de transporte rodoviário, incluindo obras, outorgas e regulação do setor.',
      competencias: [
        'Assessorar o Ministro na coordenação dos órgãos e entidades do setor de transporte rodoviário.',
        'Propor, implementar e avaliar a política nacional de transporte rodoviário e o Sistema Nacional de Viação.',
        'Estabelecer diretrizes para planos de outorga e propostas tarifárias do setor rodoviário.',
        'Propor planos de investimento, outorgas e convênios de delegação a Estados, Distrito Federal e Municípios.',
      ],
      filhos: [
        { id: 'DOP_SNTR', sigla: 'DOP', nome: 'Departamento de Obras Públicas', tipo: 'departamento', deptKey: 'DOP/SNTR - Obras Públicas', filhos: [],
          resumo: 'Subsidia o planejamento e o monitoramento das obras públicas de infraestrutura rodoviária.',
          competencias: [
            'Subsidiar programas, investimentos e carteira de projetos do setor de transporte rodoviário.',
            'Monitorar os principais empreendimentos rodoviários sob responsabilidade direta do DNIT.',
            'Cooperar com processos de desapropriação necessários às obras de infraestrutura rodoviária.',
            'Acompanhar a gestão do patrimônio do setor de transporte rodoviário.',
          ] },
        { id: 'DOUT_SNTR', sigla: 'DOUT', nome: 'Departamento de Outorgas Rodoviárias', tipo: 'departamento', deptKey: 'DOUT/SNTR - Outorgas Rodoviárias', filhos: [],
          resumo: 'Conduz os estudos técnicos, econômicos e regulatórios das outorgas do setor rodoviário.',
          competencias: [
            'Propor e acompanhar estudos técnicos e econômicos sobre outorgas rodoviárias.',
            'Acompanhar aspectos regulatórios e analisar projetos de concessão, permissão e autorização.',
            'Avaliar condições para convênios de delegação a entes federativos, empresas estatais e parcerias privadas.',
          ] },
      ]
    },
    {
      id: 'SNTF', sigla: 'SNTF', nome: 'Secretaria Nacional de Transporte Ferroviário', tipo: 'secretaria-nacional',
      deptKey: 'Secretaria Nacional de Transporte Ferroviário - SNTF',
      resumo: 'Coordena a política nacional de transporte ferroviário, incluindo obras, outorgas e regulação do setor.',
      competencias: [
        'Assessorar o Ministro na coordenação dos órgãos e entidades do setor de transporte ferroviário.',
        'Propor, implementar e avaliar a política nacional de transporte ferroviário e o Sistema Nacional de Viação.',
        'Estabelecer diretrizes para planos de outorga e propostas tarifárias do setor ferroviário.',
        'Propor planos de investimento, outorgas e convênios de delegação a Estados, Distrito Federal e Municípios.',
      ],
      filhos: [
        { id: 'DOP_SNTF', sigla: 'DOP', nome: 'Departamento de Obras e Projetos', tipo: 'departamento', deptKey: 'DOP/SNTF - Obras e Projetos Ferroviários', filhos: [],
          resumo: 'Subsidia o planejamento e o monitoramento das obras públicas de infraestrutura ferroviária.',
          competencias: [
            'Subsidiar programas, investimentos e carteira de projetos do setor de transporte ferroviário.',
            'Monitorar os principais empreendimentos ferroviários sob responsabilidade da Infra S.A. e do DNIT.',
            'Cooperar com processos de desapropriação necessários às obras de infraestrutura ferroviária.',
          ] },
        { id: 'DOUT_SNTF', sigla: 'DOUT', nome: 'Departamento de Outorgas Ferroviárias', tipo: 'departamento', deptKey: 'DOUT/SNTF - Outorgas Ferroviárias', filhos: [],
          resumo: 'Conduz os estudos técnicos, econômicos e regulatórios das outorgas do setor ferroviário.',
          competencias: [
            'Propor e acompanhar estudos técnicos e econômicos sobre outorgas ferroviárias.',
            'Acompanhar aspectos regulatórios e analisar projetos de concessão, permissão e autorização.',
            'Avaliar condições para convênios de delegação a entes federativos, empresas estatais e parcerias privadas.',
          ] },
      ]
    },
    {
      id: 'SENATRAN', sigla: 'SENATRAN', nome: 'Secretaria Nacional de Trânsito', tipo: 'secretaria-nacional',
      deptKey: 'Secretaria Nacional de Trânsito - SENATRAN',
      resumo: 'Órgão máximo executivo de trânsito da União, responsável pela coordenação do Sistema Nacional de Trânsito, conforme o Código de Trânsito Brasileiro.',
      competencias: [
        'Coordenar o Sistema Nacional de Trânsito (SNT), conforme o art. 19 da Lei nº 9.503/1997 (Código de Trânsito Brasileiro).',
        'Planejar, normatizar e supervisionar as políticas de segurança, educação, engenharia e fiscalização de trânsito no País.',
        'Presidir e articular as câmaras temáticas e as reuniões preparatórias do Conselho Nacional de Trânsito (Contran).',
      ],
      filhos: [
        { id: 'DSEG', sigla: 'DSEG', nome: 'Departamento de Segurança no Trânsito', tipo: 'departamento', deptKey: 'DSEG/SENATRAN - Segurança no Trânsito', filhos: [],
          resumo: 'Cuida da segurança veicular, engenharia de tráfego, sinalização, educação e saúde no trânsito.',
          competencias: [
            'Planejar e coordenar ações de segurança, educação e saúde para o trânsito.',
            'Propor normas de padronização de segurança veicular e de homologação de veículos.',
            'Elaborar e atualizar manuais de sinalização e dispositivos de controle de trânsito aprovados pelo Contran.',
            'Planejar e divulgar políticas de educação e saúde para o trânsito, em articulação com Educação e Saúde.',
          ] },
        { id: 'DRFG', sigla: 'DRFG', nome: 'Departamento de Regulação, Fiscalização e Gestão', tipo: 'departamento', deptKey: 'DRFG/SENATRAN - Regulação, Fiscalização e Gestão', filhos: [],
          resumo: 'Regula, fiscaliza e administra os sistemas informatizados e os recursos financeiros do Sistema Nacional de Trânsito.',
          competencias: [
            'Coordenar a integração dos órgãos do Sistema Nacional de Trânsito e apoiar a fiscalização do cumprimento das normas.',
            'Administrar os sistemas informatizados de registro de veículos e condutores (Renavam, CRLV e CNH).',
            'Administrar o Fundo Nacional de Segurança e Educação de Trânsito (Funset) e a cota-parte do seguro DPVAT.',
            'Coordenar a arrecadação e o repasse de multas de trânsito e fiscalizar a aplicação dos recursos repassados.',
          ] },
      ]
    },
    { id: 'CONATT', sigla: 'CONATT', nome: 'Comissão Nacional das Autoridades de Transportes Terrestres', tipo: 'colegiado', deptKey: '', filhos: [],
      resumo: 'Órgão colegiado de articulação federativa entre as autoridades de trânsito e transportes terrestres da União, Estados, Distrito Federal e Municípios.',
      competencias: [
        'Exercer as competências estabelecidas no Decreto nº 10.703, de 18 de maio de 2021.',
        'Promover a articulação e a cooperação federativa entre as autoridades de trânsito e de transportes terrestres.',
      ] },
    { id: 'CONTRAN', sigla: 'CONTRAN', nome: 'Conselho Nacional de Trânsito', tipo: 'colegiado', deptKey: '', filhos: [],
      resumo: 'Órgão máximo normativo e consultivo do Sistema Nacional de Trânsito, presidido pela Senatran.',
      competencias: [
        'Exercer as competências estabelecidas no art. 12 da Lei nº 9.503, de 1997 (Código de Trânsito Brasileiro).',
        'Estabelecer as normas regulamentares do Código de Trânsito Brasileiro e as diretrizes da Política Nacional de Trânsito.',
      ] },
    { id: 'CGNT', sigla: 'CGNT', nome: 'Comitê de Governança do Planejamento Integrado de Transportes', tipo: 'colegiado', deptKey: '', filhos: [],
      resumo: 'Órgão colegiado de governança que integra o planejamento estratégico dos investimentos em transportes.',
      competencias: [
        'Promover a governança e a integração do planejamento estratégico dos investimentos em infraestrutura de transportes.',
        'Articular as Secretarias e entidades vinculadas na definição de prioridades de investimento.',
      ] },
    { id: 'CONSETRANS', sigla: 'CONSETRANS', nome: 'Conselho Nacional de Secretários de Transportes', tipo: 'colegiado', deptKey: '', filhos: [],
      resumo: 'Instância de articulação entre o Ministério e os órgãos estaduais de transportes.',
      competencias: [
        'Promover a articulação federativa entre o Ministério e os órgãos estaduais de transportes.',
        'Debater diretrizes e prioridades da política de transportes com os Estados e o Distrito Federal.',
      ] },
    { id: 'DNIT', sigla: 'DNIT', nome: 'Departamento Nacional de Infraestrutura de Transportes', tipo: 'vinculada', deptKey: '', filhos: [],
      resumo: 'Autarquia federal vinculada ao Ministério, responsável pela implantação, manutenção e operação da infraestrutura viária federal.',
      competencias: [
        'Implantar, manter, operar e explorar a infraestrutura rodoviária e ferroviária de domínio da União.',
        'Executar obras de construção, restauração e conservação de rodovias e ferrovias federais.',
        'Exercer, no âmbito federal, a gestão do patrimônio viário sob sua responsabilidade.',
      ] },
    { id: 'ANTT', sigla: 'ANTT', nome: 'Agência Nacional de Transportes Terrestres', tipo: 'vinculada', deptKey: '', filhos: [],
      resumo: 'Agência reguladora responsável pela regulação, outorga e fiscalização dos serviços de transporte terrestre.',
      competencias: [
        'Regular e fiscalizar as concessões, permissões e autorizações de transporte ferroviário e rodoviário de cargas e passageiros.',
        'Editar normas técnicas e econômicas relativas à prestação de serviços de transporte terrestre.',
        'Mediar conflitos de interesses entre prestadores de serviço e usuários no setor de transporte terrestre.',
      ] },
    { id: 'INFRA', sigla: 'INFRA', nome: 'Infra S.A. / Valec / EPL', tipo: 'vinculada', deptKey: '', filhos: [],
      resumo: 'Empresas públicas federais vinculadas ao Ministério responsáveis por projetos, estruturação e construção de infraestrutura ferroviária.',
      competencias: [
        'Desenvolver, estruturar e viabilizar projetos de infraestrutura de transportes, incluindo ferrovias.',
        'Executar e/ou administrar a construção e a exploração de trechos ferroviários sob sua responsabilidade.',
        'Estruturar parcerias e modelagens de investimento em infraestrutura de transportes.',
      ] },
  ]
};

/* ── Categorias (para filtros) derivadas do "tipo" de cada nó ── */
const TIPO_TO_CATEGORIA = {
  ministerio: 'topo',
  gabinete: 'assistencia', assessoria: 'assistencia', coordenacao: 'assistencia', consultoria: 'assistencia',
  secretaria: 'executiva', subsecretaria: 'executiva',
  'secretaria-nacional': 'secretarias',
  departamento: 'departamentos',
  colegiado: 'colegiados',
  vinculada: 'entidades',
};
const CATEGORIAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'assistencia', label: 'Assistência Direta' },
  { id: 'executiva', label: 'Secretaria-Executiva' },
  { id: 'secretarias', label: 'Secretarias Nacionais' },
  { id: 'departamentos', label: 'Departamentos' },
  { id: 'colegiados', label: 'Órgãos Colegiados' },
  { id: 'entidades', label: 'Entidades Vinculadas' },
];
const TIPO_LABELS = {
  ministerio: 'Ministro', secretaria: 'Secretaria-Executiva', gabinete: 'Gabinete',
  subsecretaria: 'Subsecretaria', assessoria: 'Assessoria', coordenacao: 'Coordenação',
  consultoria: 'Consultoria/Órgão de controle', 'secretaria-nacional': 'Secretaria Nacional',
  departamento: 'Departamento', colegiado: 'Órgão colegiado', vinculada: 'Entidade vinculada',
};

/* ── Conversão árvore aninhada (filhos[]) <-> lista plana (parentId) ──
   Trabalhar em formato plano facilita edição (mover, excluir, adicionar). */
function treeToFlat(node, parentId = null, out = []) {
  const { filhos, ...rest } = node;
  out.push({ ...rest, parentId });
  (filhos || []).forEach(c => treeToFlat(c, node.id, out));
  return out;
}
function flatToTree(flat, rootId = 'MINISTRO') {
  const byId = Object.fromEntries(flat.map(n => [n.id, { ...n, filhos: [] }]));
  flat.forEach(n => {
    if (n.parentId && byId[n.parentId]) byId[n.parentId].filhos.push(byId[n.id]);
  });
  return byId[rootId];
}
function descendantsOf(flat, id) {
  const out = [];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    flat.filter(n => n.parentId === cur).forEach(n => { out.push(n.id); stack.push(n.id); });
  }
  return out;
}
function ancestorsOf(flat, id) {
  const out = [];
  const byId = Object.fromEntries(flat.map(n => [n.id, n]));
  let cur = byId[id];
  while (cur && cur.parentId) { out.push(cur.parentId); cur = byId[cur.parentId]; }
  return out;
}
function loadOrgFlat() {
  try {
    const raw = localStorage.getItem(ORG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignora e usa o padrão */ }
  return treeToFlat(DEFAULT_ORG_TREE);
}
function saveOrgFlat(flat) {
  try { localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(flat)); return true; }
  catch { return false; }
}

const THEME = {
  ministerio: { color: '#e2e8f0', stripe: 'linear-gradient(90deg,#1e3a5f,#0f2d5a)', border: 'rgba(100,140,200,0.5)', badgeBg: 'rgba(30,58,95,0.8)' },
  secretaria: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  gabinete: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  subsecretaria: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  assessoria: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  coordenacao: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  consultoria: { color: '#93c5fd', stripe: 'linear-gradient(90deg,#1d4ed8,#1e40af)', border: 'rgba(59,130,246,0.5)', badgeBg: 'rgba(29,78,216,0.3)' },
  'secretaria-nacional': { color: '#6ee7b7', stripe: 'linear-gradient(90deg,#065f46,#047857)', border: 'rgba(16,185,129,0.5)', badgeBg: 'rgba(6,95,70,0.35)' },
  departamento: { color: '#6ee7b7', stripe: 'linear-gradient(90deg,#059669,#10b981)', border: 'rgba(16,185,129,0.5)', badgeBg: 'rgba(5,150,105,0.3)' },
  colegiado: { color: '#fcd34d', stripe: 'linear-gradient(90deg,#d97706,#b45309)', border: 'rgba(245,158,11,0.5)', badgeBg: 'rgba(217,119,6,0.3)' },
  vinculada: { color: '#fb923c', stripe: 'linear-gradient(90deg,#ea580c,#c2410c)', border: 'rgba(249,115,22,0.5)', badgeBg: 'rgba(234,88,12,0.3)' },
};

/* ── Helpers de avatar ─────────────────────────────────────── */
const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#0891b2', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];
function getAvatarColor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function getInitials(name) {
  const p = name.split(' ').filter(x => x.length > 2);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

/* ═══════════════════════════════════════════════════════════
   CARD DO NÓ
   ═══════════════════════════════════════════════════════════ */
function NodeCard({ node, contacts, contactList, isRoot, expanded, dimmed, selected, hasChildren, onToggle, onSelectNode }) {
  const theme = THEME[node.tipo] || THEME.assessoria;
  if (hasChildren === undefined) hasChildren = node.filhos && node.filhos.length > 0;
  const hasContacts = contacts > 0;

  return (
    <div
      className={`org-modern-card${isRoot ? ' root-card' : ''}${dimmed ? ' card-dimmed' : ''}${selected ? ' card-selected' : ''}`}
      style={{ borderColor: selected ? theme.color : theme.border }}
      onClick={() => onSelectNode(node, contactList)}
    >
      <div className="org-card-stripe" style={{ background: theme.stripe }} />
      <div className="org-card-body">
        <div className="card-header">
          <span className="badge" style={{ backgroundColor: theme.badgeBg, color: theme.color, borderColor: theme.border }}>
            {node.sigla}
          </span>
          {hasContacts && (
            <span className="contact-count" title="Ver pessoas deste setor">
              <Users size={10} /> {contacts}
            </span>
          )}
        </div>
        <h3 className="card-title" title={node.nome}>{node.nome}</h3>
        <p className="card-subtitle">{TIPO_LABELS[node.tipo] || node.tipo}</p>
        {hasChildren && (
          <button
            className="expand-toggle"
            style={{ color: expanded ? theme.color : undefined }}
            onClick={e => { e.stopPropagation(); onToggle(); }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{expanded ? 'Recolher' : 'Expandir'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NÓ RECURSIVO
   ═══════════════════════════════════════════════════════════ */
function OrgNode({ node, allContacts, defaultExpanded, onSelectNode, visibleIds, selectedId }) {
  const [manualExpanded, setManualExpanded] = useState(defaultExpanded || false);
  const filteredChildren = useMemo(
    () => (node.filhos || []).filter(c => !visibleIds || visibleIds.has(c.id)),
    [node.filhos, visibleIds]
  );
  const hasChildren = filteredChildren.length > 0;
  const isFiltering = !!visibleIds;
  const expanded = isFiltering ? hasChildren : manualExpanded;

  const contactList = useMemo(
    () => node.deptKey ? allContacts.filter(c => c.departamento === node.deptKey) : [],
    [allContacts, node.deptKey]
  );

  const label = (
    <NodeCard
      node={node}
      contacts={contactList.length}
      contactList={contactList}
      isRoot={false}
      expanded={expanded}
      hasChildren={hasChildren}
      selected={selectedId === node.id}
      onToggle={() => setManualExpanded(v => !v)}
      onSelectNode={onSelectNode}
    />
  );

  if (!hasChildren || !expanded) return <TreeNode label={label} />;

  return (
    <TreeNode label={label}>
      {filteredChildren.map(child => (
        <OrgNode
          key={child.id}
          node={child}
          allContacts={allContacts}
          onSelectNode={onSelectNode}
          visibleIds={visibleIds}
          selectedId={selectedId}
        />
      ))}
    </TreeNode>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAINEL LATERAL DO SETOR — visão + edição
   Mostra resumo/competências (o que o setor faz), a lista de
   contatos vinculados e, em modo de edição, um formulário para
   alterar nome, sigla, tipo, hierarquia e competências.
   ═══════════════════════════════════════════════════════════ */
function SectorPanel({
  node, contacts, onClose, onEmail,
  editMode, allNodesFlat, onSave, onDelete, onAddChild, isRoot, startInEdit,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const buildForm = n => ({
    nome: n.nome, sigla: n.sigla, tipo: n.tipo,
    deptKey: n.deptKey || '', resumo: n.resumo || '',
    competencias: (n.competencias || []).join('\n'),
    parentId: n.parentId || '',
  });

  useEffect(() => {
    if (!node) return;
    if (startInEdit) { setForm(buildForm(node)); setEditing(true); }
    else { setEditing(false); setForm(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id, startInEdit]);

  if (!node) return null;
  const theme = THEME[node.tipo] || THEME.assessoria;
  const hasEmails = contacts.some(c => c.email);

  const startEdit = () => { setForm(buildForm(node)); setEditing(true); };

  const save = () => {
    onSave(node.id, {
      nome: form.nome.trim() || node.nome,
      sigla: form.sigla.trim(),
      tipo: form.tipo,
      deptKey: form.deptKey.trim(),
      resumo: form.resumo.trim(),
      competencias: form.competencias.split('\n').map(s => s.trim()).filter(Boolean),
      parentId: isRoot ? node.parentId : form.parentId,
    });
    setEditing(false);
  };

  if (editing && form) {
    const forbidden = new Set([node.id, ...descendantsOf(allNodesFlat || [], node.id)]);
    const otherNodes = (allNodesFlat || []).filter(n => !forbidden.has(n.id));
    return (
      <div className="org-contact-panel sector-edit-panel">
        <div className="ocp-header" style={{ borderBottom: `2px solid ${theme.border}` }}>
          <div>
            <span className="badge" style={{ backgroundColor: theme.badgeBg, color: theme.color, borderColor: theme.border, fontSize: '0.62rem' }}>
              Editando
            </span>
            <div className="ocp-title">{node.nome}</div>
          </div>
          <button className="modal-close" onClick={() => setEditing(false)}><X size={15} /></button>
        </div>
        <div className="ocp-list sector-edit-form">
          <label className="modal-label">Nome do setor</label>
          <input className="modal-input" value={form.nome} disabled={isRoot}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />

          <label className="modal-label" style={{ marginTop: 12 }}>Sigla</label>
          <input className="modal-input" value={form.sigla}
            onChange={e => setForm(f => ({ ...f, sigla: e.target.value }))} placeholder="ex.: SPOA" />

          <label className="modal-label" style={{ marginTop: 12 }}>Categoria/tipo</label>
          <select className="modal-input" value={form.tipo} disabled={isRoot}
            onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            {Object.keys(TIPO_LABELS).filter(t => t !== 'ministerio').map(t => (
              <option key={t} value={t}>{TIPO_LABELS[t]}</option>
            ))}
          </select>

          {!isRoot && (
            <>
              <label className="modal-label" style={{ marginTop: 12 }}>Subordinado a</label>
              <select className="modal-input" value={form.parentId}
                onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                {otherNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.sigla ? `[${n.sigla}] ` : ''}{n.nome}</option>
                ))}
              </select>
              <div className="field-hint">Define a posição do setor no organograma.</div>
            </>
          )}

          <label className="modal-label" style={{ marginTop: 12 }}>Vínculo com contatos (departamento)</label>
          <input className="modal-input" value={form.deptKey}
            onChange={e => setForm(f => ({ ...f, deptKey: e.target.value }))}
            placeholder="deve bater com o campo 'departamento' do diretório" />

          <label className="modal-label" style={{ marginTop: 12 }}>Resumo</label>
          <input className="modal-input" value={form.resumo}
            onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))} />

          <label className="modal-label" style={{ marginTop: 12 }}>Competências (uma por linha)</label>
          <textarea className="modal-textarea sector-comp-textarea" value={form.competencias}
            onChange={e => setForm(f => ({ ...f, competencias: e.target.value }))}
            style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} />

          <div className="sector-edit-actions">
            <button className="action-btn email-btn" onClick={save}><Save size={13} /> Salvar</button>
            <button className="action-btn" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
          <div className="sector-edit-actions">
            <button className="action-btn" onClick={() => onAddChild(node.id)}><Plus size={13} /> Adicionar subsetor</button>
            {!isRoot && (
              <button className="action-btn danger-btn" onClick={() => onDelete(node.id)}><Trash2 size={13} /> Excluir</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-contact-panel">
      <div className="ocp-header" style={{ borderBottom: `2px solid ${theme.border}` }}>
        <div>
          <span className="badge" style={{ backgroundColor: theme.badgeBg, color: theme.color, borderColor: theme.border, fontSize: '0.62rem' }}>
            {node.sigla || TIPO_LABELS[node.tipo]}
          </span>
          <div className="ocp-title">{node.nome}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          {editMode && (
            <button className="action-btn" onClick={startEdit} title="Editar este setor"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: '0.75rem' }}>
              <Pencil size={13} /> Editar
            </button>
          )}
          <button className="modal-close" onClick={onClose}><X size={15} /></button>
        </div>
      </div>

      <div className="ocp-list">
        {node.resumo && <p className="sector-resumo">{node.resumo}</p>}

        {node.competencias && node.competencias.length > 0 && (
          <>
            <div className="sector-section-label"><Info size={12} /> O que este setor faz</div>
            <ul className="sector-comp-list">
              {node.competencias.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </>
        )}

        <div className="sector-section-label" style={{ marginTop: node.competencias?.length ? 18 : 0 }}>
          <Users size={12} /> {contacts.length} pessoa{contacts.length !== 1 ? 's' : ''} neste setor
          {hasEmails && (
            <button
              className="action-btn email-btn sector-email-btn"
              onClick={onEmail}
              title="Enviar e-mail às pessoas deste setor"
            >
              <Mail size={12} /> E-mail
            </button>
          )}
        </div>

        {contacts.length === 0 ? (
          <div className="ocp-empty">Nenhum contato cadastrado neste setor.</div>
        ) : (
          contacts.map(c => {
            const color = getAvatarColor(c.nome);
            const initials = getInitials(c.nome);
            return (
              <div key={c.id} className="ocp-item">
                <div className="ocp-avatar" style={{ background: color }}>{initials}</div>
                <div className="ocp-info">
                  <div className="ocp-name">{c.nome}</div>
                  {c.cargo && <div className="ocp-cargo">{c.cargo}</div>}
                  {c.email && (
                    <div className="ocp-detail"><Mail size={11} /><a href={`mailto:${c.email}`}>{c.email}</a></div>
                  )}
                  {c.telefone && (
                    <div className="ocp-detail"><Phone size={11} /><span>{c.telefone}</span></div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTES E E-MAIL PADRÃO
   ═══════════════════════════════════════════════════════ */
const ZOOM_MIN = 0.15, ZOOM_MAX = 2.5, ZOOM_STEP = 0.12, DRAG_THRESHOLD = 5;

/* Tamanho virtual máximo do conteúdo (margem de segurança) */
const CONTENT_VIRTUAL_W = 7000;
const CONTENT_VIRTUAL_H = 4000;

/**
 * Limita x e y para que pelo menos MARGIN px do conteúdo
 * permaneça visível dentro do canvas.
 */
function clampPan(x, y, scale, canvasEl) {
  if (!canvasEl) return { x, y };
  const { width: vw, height: vh } = canvasEl.getBoundingClientRect();
  const MARGIN = 120; // px mínimos visíveis
  const contentW = CONTENT_VIRTUAL_W * scale;
  const contentH = CONTENT_VIRTUAL_H * scale;
  return {
    x: Math.max(MARGIN - contentW, Math.min(vw - MARGIN, x)),
    y: Math.max(MARGIN - contentH, Math.min(vh - MARGIN, y)),
  };
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function OrgChart() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [rootExpanded, setRootExpanded] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.75 });
  const [isDragging, setIsDragging] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activePreset, setActivePreset] = useState(EMAIL_PRESETS[0].id);
  const [emailSubject, setEmailSubject] = useState(EMAIL_PRESETS[0].subject);
  const [emailBody, setEmailBody] = useState(EMAIL_PRESETS[0].body);
  const [emailTargetList, setEmailTargetList] = useState(null); // null = todos

  /* ── Estrutura do organograma: editável e persistida ─────── */
  const [nodesFlat, setNodesFlat] = useState(() => loadOrgFlat());
  const [editMode, setEditMode] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [autoEditId, setAutoEditId] = useState(null);
  const [toast, setToast] = useState('');

  const orgTree = useMemo(() => flatToTree(nodesFlat), [nodesFlat]);

  const flashToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const persistNodes = next => {
    setNodesFlat(next);
    saveOrgFlat(next);
  };

  const handleSaveNode = (id, updates) => {
    const next = nodesFlat.map(n => (n.id === id ? { ...n, ...updates } : n));
    persistNodes(next);
    setAutoEditId(null);
    setSelectedNode(sel => (sel && sel.node.id === id ? { ...sel, node: { ...sel.node, ...updates } } : sel));
    flashToast('Setor atualizado.');
  };

  const handleDeleteNode = id => {
    const node = nodesFlat.find(n => n.id === id);
    if (!node) return;
    const desc = descendantsOf(nodesFlat, id);
    const msg = desc.length
      ? `Excluir "${node.nome}" também removerá ${desc.length} subsetor(es) vinculados. Continuar?`
      : `Excluir "${node.nome}"? Esta ação não pode ser desfeita.`;
    if (!window.confirm(msg)) return;
    const toRemove = new Set([id, ...desc]);
    const next = nodesFlat.filter(n => !toRemove.has(n.id));
    persistNodes(next);
    setSelectedNode(null);
    flashToast('Setor excluído.');
  };

  const handleAddChild = parentId => {
    const parent = nodesFlat.find(n => n.id === parentId);
    if (!parent) return;
    const newId = 'N' + Date.now().toString(36).toUpperCase();
    const child = {
      id: newId, parentId, sigla: '', nome: 'Novo setor',
      tipo: parent.tipo === 'ministerio' ? 'assessoria' : parent.tipo,
      deptKey: '', resumo: '', competencias: [],
    };
    const next = [...nodesFlat, child];
    persistNodes(next);
    setAutoEditId(newId);
    setSelectedNode({ node: child, contacts: [] });
    flashToast('Novo setor criado — preencha os dados e salve.');
  };

  const handleResetOrg = () => {
    if (!window.confirm('Restaurar o organograma para a versão original? Todas as edições feitas serão perdidas.')) return;
    const next = treeToFlat(DEFAULT_ORG_TREE);
    persistNodes(next);
    setSelectedNode(null);
    flashToast('Organograma restaurado ao padrão.');
  };

  const canvasRef = useRef(null);
  const pointerRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/contacts`).then(r => r.json()).then(setContacts).catch(() => { });
  }, []);

  const displayContacts = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      c.nome?.toLowerCase().includes(q) || c.departamento?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const rootContactList = useMemo(
    () => displayContacts.filter(c => c.departamento === orgTree.deptKey),
    [displayContacts, orgTree.deptKey]
  );

  /* ── Filtro por categoria + busca por nome/sigla de setor ──
     Um nó fica visível se corresponder ao filtro/busca OU se for
     ancestral de algum nó que corresponda (para manter o caminho
     até a raiz visível na árvore). */
  const visibleIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (filterCategoria === 'todos' && !q) return null; // sem filtro: mostra tudo
    const matches = nodesFlat.filter(n => {
      const catOk = filterCategoria === 'todos' || TIPO_TO_CATEGORIA[n.tipo] === filterCategoria;
      const searchOk = !q || n.nome.toLowerCase().includes(q) || (n.sigla || '').toLowerCase().includes(q);
      return catOk && searchOk;
    }).map(n => n.id);
    const visible = new Set(['MINISTRO']);
    matches.forEach(id => {
      visible.add(id);
      ancestorsOf(nodesFlat, id).forEach(a => visible.add(a));
    });
    return visible;
  }, [nodesFlat, filterCategoria, search]);

  const categoriaCounts = useMemo(() => {
    const counts = { todos: nodesFlat.length - 1 };
    CATEGORIAS.forEach(c => {
      if (c.id === 'todos') return;
      counts[c.id] = nodesFlat.filter(n => TIPO_TO_CATEGORIA[n.tipo] === c.id).length;
    });
    return counts;
  }, [nodesFlat]);

  /* ── Zoom com scroll ──────────────────────────────────── */
  const handleWheel = useCallback(e => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setTransform(prev => {
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.scale + delta));
      const ratio = newScale / prev.scale;
      const nx = mouseX - ratio * (mouseX - prev.x);
      const ny = mouseY - ratio * (mouseY - prev.y);
      const clamped = clampPan(nx, ny, newScale, canvasRef.current);
      return { scale: newScale, ...clamped };
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  /* ── Pan ─────────────────────────────────────────────── */
  const onPointerDown = useCallback(e => {
    if (e.button !== 0) return;
    // Ignora cliques dentro de cards (botões, textos, etc.)
    if (e.target.closest('.org-modern-card')) return;
    pointerRef.current = {
      startX: e.clientX, startY: e.clientY,
      originX: transform.x, originY: transform.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [transform.x, transform.y]);

  const onPointerMove = useCallback(e => {
    if (!pointerRef.current) return;
    const dx = e.clientX - pointerRef.current.startX;
    const dy = e.clientY - pointerRef.current.startY;
    if (!pointerRef.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    pointerRef.current.moved = true;
    setIsDragging(true);
    const nx = pointerRef.current.originX + dx;
    const ny = pointerRef.current.originY + dy;
    setTransform(prev => {
      const clamped = clampPan(nx, ny, prev.scale, canvasRef.current);
      return { ...prev, ...clamped };
    });
  }, []);

  const onPointerUp = useCallback(e => {
    if (pointerRef.current) e.currentTarget.releasePointerCapture?.(e.pointerId);
    pointerRef.current = null;
    setIsDragging(false);
  }, []);

  /* ── Zoom buttons ───────────────────────────────────── */
  const zoomBy = delta => {
    const el = canvasRef.current; if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setTransform(prev => {
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.scale + delta));
      const ratio = newScale / prev.scale;
      const nx = width / 2 - ratio * (width / 2 - prev.x);
      const ny = height / 2 - ratio * (height / 2 - prev.y);
      const clamped = clampPan(nx, ny, newScale, el);
      return { scale: newScale, ...clamped };
    });
  };

  const resetView = () => {
    const el = canvasRef.current;
    const clamped = clampPan(0, 0, 0.75, el);
    setTransform({ scale: 0.75, ...clamped });
  };

  const handleSelectNode = (node, contactList) => {
    setAutoEditId(null);
    setSelectedNode({ node, contacts: contactList });
  };

  /* ── E-mail ──────────────────────────────────────────── */
  const openEmailModal = (targetList = null) => {
    setEmailTargetList(targetList);
    setShowEmailModal(true);
  };

  const applyPreset = presetId => {
    const preset = EMAIL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setEmailSubject(preset.subject);
    setEmailBody(preset.body);
  };

  const sendEmail = () => {
    const list = emailTargetList ?? contacts;
    const emails = list.map(c => c.email).filter(Boolean);
    if (emails.length === 0) {
      alert('Nenhum e-mail encontrado nos contatos selecionados.');
      return;
    }
    openMailClient({ to: emails, subject: emailSubject, htmlBody: emailBody });
  };

  /* ── Root label ─────────────────────────────────────── */
  const rootFilteredChildren = useMemo(
    () => (orgTree.filhos || []).filter(c => !visibleIds || visibleIds.has(c.id)),
    [orgTree.filhos, visibleIds]
  );
  const rootHasChildren = rootFilteredChildren.length > 0;
  const rootIsExpanded = visibleIds ? rootHasChildren : rootExpanded;

  const rootLabel = (
    <NodeCard
      node={orgTree}
      contacts={rootContactList.length}
      contactList={rootContactList}
      isRoot={true}
      hasChildren={rootHasChildren}
      expanded={rootIsExpanded}
      selected={selectedNode?.node?.id === 'MINISTRO'}
      onToggle={() => setRootExpanded(v => !v)}
      onSelectNode={handleSelectNode}
    />
  );

  return (
    <div className="org-container">
      {/* Toolbar */}
      <div className="org-toolbar">
        <div className="org-title-area">
          <h2>
            <Network size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
            Estrutura Organizacional
          </h2>
          <p>Clique num card para ver o que o setor faz · Arraste para mover · Scroll para zoom</p>
        </div>
        <div className="org-actions">
          <div className="search-box">
            <Search size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar setor ou sigla..." />
          </div>
          <button
            className="action-btn email-btn"
            onClick={() => openEmailModal()}
            title="Enviar e-mail a todos os contatos"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Mail size={14} /> E-mail
          </button>
          <button
            className={`action-btn${editMode ? ' edit-active-btn' : ''}`}
            onClick={() => setEditMode(v => !v)}
            title="Ativar/desativar edição do organograma"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Pencil size={14} /> {editMode ? 'Edição ativa' : 'Editar'}
          </button>
          <button
            className="action-btn"
            onClick={handleResetOrg}
            title="Restaurar organograma original"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={14} /> Restaurar
          </button>
        </div>
      </div>

      {/* Filtros por categoria de setor */}
      <div className="org-filter-bar">
        <span className="org-filter-label"><Filter size={12} /> Filtrar:</span>
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            className={`filter-chip${filterCategoria === c.id ? ' active' : ''}`}
            onClick={() => setFilterCategoria(c.id)}
          >
            {c.label}
            <span className="filter-chip-count">{categoriaCounts[c.id] ?? 0}</span>
          </button>
        ))}
        {editMode && (
          <span className="org-edit-banner">
            <Pencil size={11} /> Modo de edição ativo — clique num setor e depois em "Editar"
          </span>
        )}
      </div>

      {/* Área principal: canvas + painel lateral */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="org-canvas figma-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', flex: 1 }}
        >
          <div
            style={{
              transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0',
              willChange: 'transform',
              padding: '80px 120px 120px',
              display: 'inline-block',
            }}
          >
            {rootIsExpanded ? (
              <Tree lineWidth="1.5px" lineColor="rgba(255,255,255,0.1)" lineBorderRadius="10px" label={rootLabel}>
                {rootFilteredChildren.map(child => (
                  <OrgNode
                    key={child.id}
                    node={child}
                    allContacts={displayContacts}
                    onSelectNode={handleSelectNode}
                    visibleIds={visibleIds}
                    selectedId={selectedNode?.node?.id}
                  />
                ))}
              </Tree>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center' }}>{rootLabel}</div>
            )}
          </div>

          {/* HUD */}
          <div className="canvas-hud">
            <button className="hud-btn" onClick={() => zoomBy(-ZOOM_STEP)}><ZoomOut size={15} /></button>
            <span className="hud-zoom-label">{Math.round(transform.scale * 100)}%</span>
            <button className="hud-btn" onClick={() => zoomBy(ZOOM_STEP)}><ZoomIn size={15} /></button>
            <div className="hud-divider" />
            <button className="hud-btn" onClick={resetView}><Maximize2 size={14} /></button>
          </div>
        </div>

        {/* Painel do setor: descrição, competências, contatos e edição */}
        {selectedNode && (
          <SectorPanel
            node={selectedNode.node}
            contacts={selectedNode.contacts}
            onClose={() => { setSelectedNode(null); setAutoEditId(null); }}
            onEmail={() => openEmailModal(selectedNode.contacts)}
            editMode={editMode}
            allNodesFlat={nodesFlat}
            onSave={handleSaveNode}
            onDelete={handleDeleteNode}
            onAddChild={handleAddChild}
            isRoot={selectedNode.node.id === 'MINISTRO'}
            startInEdit={autoEditId === selectedNode.node.id}
          />
        )}

        {/* Toast de confirmação */}
        {toast && <div className="org-toast">{toast}</div>}
      </div>

      {/* Modal de E-mail */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Enviar E-mail</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {emailTargetList
                      ? `${emailTargetList.filter(c => c.email).length} destinatário(s) do setor selecionado`
                      : `${contacts.filter(c => c.email).length} destinatário(s) — todos os contatos`}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body modal-body-split">
              {/* Coluna esquerda: edição */}
              <div className="email-editor-col">
                <label className="modal-label">
                  <LayoutTemplate size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Modelo de e-mail
                </label>
                <div className="preset-pills">
                  {EMAIL_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`preset-pill${activePreset === p.id ? ' active' : ''}`}
                      onClick={() => applyPreset(p.id)}
                      title={`Usar modelo "${p.label}"`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <label className="modal-label" style={{ marginTop: 16 }}>Assunto</label>
                <input
                  className="modal-input"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Assunto do e-mail..."
                />
                <label className="modal-label" style={{ marginTop: 16 }}>
                  Corpo do e-mail (HTML) — use <code>{'{{nome}}'}</code> para personalizar
                </label>
                <textarea
                  className="modal-textarea email-textarea-lg"
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="<p>Olá {{nome}},</p><p>Sua mensagem aqui...</p>"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>

              {/* Coluna direita: prévia */}
              <div className="email-preview-col">
                <label className="modal-label">Prévia (como o destinatário verá)</label>
                <div className="email-preview-frame">
                  <div className="email-preview-toolbar">
                    <span className="email-preview-dot" style={{ background: '#ef4444' }} />
                    <span className="email-preview-dot" style={{ background: '#f59e0b' }} />
                    <span className="email-preview-dot" style={{ background: '#10b981' }} />
                  </div>
                  <div className="email-preview-meta">
                    <div><strong>Assunto:</strong> {emailSubject || '(sem assunto)'}</div>
                  </div>
                  <div
                    className="email-preview-html"
                    dangerouslySetInnerHTML={{ __html: emailBody.replaceAll('{{nome}}', 'Fulano de Tal') }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '0 24px 24px' }}>
              <button
                className="action-btn"
                onClick={() => applyPreset(EMAIL_PRESETS[0].id)}
              >
                Restaurar padrão
              </button>
              <button className="action-btn email-btn" onClick={sendEmail}>
                <Send size={14} /> Abrir no cliente de e-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}