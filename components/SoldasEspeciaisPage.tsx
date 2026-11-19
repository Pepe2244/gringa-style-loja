'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Factory,
  HardHat,
  PhoneCall,
  Mail,
  ArrowRight,
  CheckCircle2,
  Phone,
  Beer,
  Utensils,
  FlaskConical,
  Fuel,
  Sparkles,
  TreePine,
  Layers,
  Car,
  Tractor,
  Pickaxe,
  Zap,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import GSPortfolio from '@/components/b2b/GSPortfolio';
import GSWhatsAppButton from '@/components/b2b/GSWhatsAppButton';

const contatosTecnicos = [
  { nome: 'Nalesso', telefone: '(15) 99860-8170', numeroLimpo: '5515998608170' },
  { nome: 'Emanuel', telefone: '(67) 8145-0995', numeroLimpo: '556781450995' },
  { nome: 'Fernando', telefone: '(19) 99328-3474', numeroLimpo: '5519993283474' },
];

const pilaresQuemSomos = [
  {
    icon: ShieldCheck,
    title: 'SEGURANÇA',
    text: 'Prioridade máxima em cada projeto. Compromisso rigoroso com NRs (NR-33 e NR-35) para risco zero.',
  },
  {
    icon: Award,
    title: 'QUALIDADE',
    text: 'Execução precisa, materiais de primeira linha e o padrão de excelência GS em cada solda.',
  },
  {
    icon: CheckCircle2,
    title: 'COMPROMISSO',
    text: 'Cumprimento de prazos, agilidade e parceria total. Entendemos a urgência da indústria.',
  },
];

const tubulacoesSpecs = [
  {
    code: '40',
    title: 'AÇO INOXIDÁVEL SCHEDULE 40',
    desc: 'Soldagem no procedimento para alta resistência mecânica',
  },
  {
    code: '10S',
    title: 'AÇO INOXIDÁVEL SCHEDULE 10S',
    desc: 'Acabamento limpo e controle térmico preciso',
  },
  {
    code: 'OD',
    title: 'TUBULAÇÃO OD (SANITÁRIA E ALIMENTÍCIA)',
    desc: 'Padrão higiênico rigoroso com purga interna (injetado)',
  },
  {
    code: 'AC',
    title: 'TUBULAÇÃO EM AÇO CARBONO',
    desc: 'Execução no procedimento para linhas de utilidades e processo',
  },
];

const destaquesTecnicos = [
  {
    number: '01',
    title: 'PROCESSO GTAW (TIG) DE ALTA PRECISÃO',
    text: 'Cordões uniformes, controle de penetração e acabamentos técnicos e artísticos de alto nível.',
  },
  {
    number: '02',
    title: 'TUBO OD INJETADO & RAIZ EM AÇO CARBONO',
    text: 'Purga com gás inerte garantindo raiz interna isenta de oxidação para aplicações críticas.',
  },
  {
    number: '03',
    title: 'VASOS DE PRESSÃO (NORMAS ASME E ANSI)',
    text: 'Capacidade comprovada em sistemas sob pressão, priorizando integridade estrutural e durabilidade.',
  },
];

const caldeirariaItens = [
  {
    number: '01',
    title: 'MONTAGEM DE TANQUES E ESTRUTURAS METÁLICAS',
    text: 'Plataformas, suportes e interligações industriais.',
  },
  {
    number: '02',
    title: 'CAIXA DE CAPTAÇÃO ETE EM AÇO INOX',
    text: 'Caldeiraria pesada resistente à corrosão e abrasão.',
  },
  {
    number: '03',
    title: 'EIXOS E ESPESSURAS DE GRANDE PORTE',
    text: 'Recuperação dimensional e soldagem técnica em eixo de biodigestor.',
  },
];

const caldeirariaDiferenciais = [
  { title: 'SOB MEDIDA', sub: 'Adequação exata ao layout da sua planta' },
  { title: 'INOX & AÇO CARBONO', sub: 'Materiais certificados e rastreáveis' },
  { title: 'MONTAGEM EM CAMPO', sub: 'Equipe ágil para paradas programadas' },
  { title: 'ALTA DURABILIDADE', sub: 'Acabamento técnico contra corrosão' },
];

const manutencaoCards = [
  {
    title: 'MANUTENÇÃO EM CALDEIRAS',
    text: 'Intervenções rápidas e seguras em feixes tubulares e componentes térmicos para reduzir o tempo de parada.',
    img: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390375785-WhatsApp_Image_2026-10-07_at_12.18.10__2_.webp',
  },
  {
    title: 'TORRES DE RESFRIAMENTO',
    text: 'Montagem e adequação de tubulações em aço carbono para sistemas de água gelada e resfriamento industrial.',
    img: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390475375-WhatsApp_Image_2026-10-07_at_12.53.34.webp',
  },
  {
    title: 'LINHAS DE COMBATE A INCÊNDIO',
    text: 'Instalação completa de redes pressurizadas, cavaletes e conexões conforme exigências técnicas de segurança.',
    img: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390646250-WhatsApp_Image_2026-10-07_at_12.53.32__1_.webp',
  },
];

const segmentosMercado = [
  { name: 'BEBIDAS', icon: Beer },
  { name: 'ALIMENTOS', icon: Utensils },
  { name: 'QUÍMICO', icon: FlaskConical },
  { name: 'PETROQUÍMICO', icon: Fuel },
  { name: 'FARMA / COSMÉTICOS', icon: Sparkles },
  { name: 'PAPEL E CELULOSE', icon: TreePine },
  { name: 'BIODIESEL', icon: Fuel },
  { name: 'PLÁSTICO', icon: Layers },
  { name: 'AUTOMOTIVO', icon: Car },
  { name: 'AGROINDUSTRIAL', icon: Tractor },
  { name: 'MINERAÇÃO', icon: Pickaxe },
  { name: 'BIOENERGIA', icon: Zap },
  { name: 'CIMENTÍCIO', icon: Building2 },
];

export default function GSServicosIndustriaisPage() {
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    servico: 'Tubulações Industriais & Schedule (Inox / Carbono)',
    mensagem: '',
  });

  const [heroImage, setHeroImage] = useState('/imagens/tocha-2.webp');
  const [clientesDinamicos, setClientesDinamicos] = useState<{ name: string; src: string }[]>([]);
  const [galeriaImagens, setGaleriaImagens] = useState<any[]>([]);

  useEffect(() => {
    const fetchB2BAssets = async () => {
      const { data, error } = await supabase
        .from('b2b_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const hero = data.find((item) => item.section === 'hero');
        if (hero && hero.url) setHeroImage(getProxiedImageUrl(hero.url));

        const cl = data.filter((item) => item.section === 'cliente');
        if (cl.length > 0) {
          setClientesDinamicos(
            cl.map((c) => ({
              name: c.title || 'Indústria Parceira',
              src: getProxiedImageUrl(c.url),
            }))
          );
        }

        const gal = data.filter((item) => item.section === 'galeria' || item.section === 'projetos');
        if (gal.length > 0) {
          setGaleriaImagens(
            gal.map((g) => ({
              ...g,
              url: getProxiedImageUrl(g.url),
              secondary_url: g.secondary_url ? getProxiedImageUrl(g.secondary_url) : null,
            }))
          );
        }
      }
    };

    fetchB2BAssets();
  }, []);

  const clientesFinais =
    clientesDinamicos.length > 0
      ? clientesDinamicos
      : [
          { name: 'Suzano', src: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1790018315388-IMG_4480_Original.webp' },
          { name: 'Dexco', src: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1790018385766-IMG_4490_Original.webp' },
          { name: 'Castrolanda', src: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1790017949830-IMG_4492_Original.webp' },
          { name: 'Amcor', src: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1790017896935-IMG_4486_Original.webp' },
          { name: 'Givaudan', src: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1790018293485-IMG_4483_Original.webp' },
          { name: 'Placas do Brasil', src: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1790017987242-IMG_4493_Original.webp' },
          { name: 'Greenplac', src: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1790018136542-IMG_4487_Original.webp' },
        ];
  const carouselItems = [...clientesFinais, ...clientesFinais];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mensagem = `Olá! Quero solicitar uma proposta técnica com a GS Soluções Industriais.\n\n*Nome:* ${formData.nome}\n*Empresa:* ${formData.empresa || 'Não informado'}\n*E-mail:* ${formData.email}\n*Telefone:* ${formData.telefone}\n*Necessidade:* ${formData.servico}\n*Detalhes do Projeto:* ${formData.mensagem || 'Sem detalhes adicionais'}`;
    const whatsappUrl = `https://wa.me/5515998608170?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="gs-pdf-theme">
      {/* 1. CAPA / HERO INSTITUCIONAL */}
      <section className="gs-pdf-section gs-hero-pdf">
        <div className="container gs-hero-pdf-grid">
          <div className="gs-hero-pdf-content">
            <div className="gs-kicker-bar mb-3">
              <span className="gs-kicker-dash">—</span>
              <span className="gs-kicker-text">ATENDIMENTO EM CAMPO &amp; PARADAS DE PLANTA EM TODO O BRASIL</span>
            </div>

            <h1 className="gs-title-split gs-hero-title-main">
              ENGENHARIA EM SOLDAS, <br />
              <span className="text-accent">CALDEIRARIA &amp; MANUTENÇÃO</span>
            </h1>

            <p className="gs-lead-pdf">
              Intervenções de alta integridade em linhas de processo, vasos de pressão, caldeiras e ativos críticos — com procedimentos qualificados e mobilização rápida para operações que não podem parar.
            </p>

            <div className="gs-hero-pills-row">
              <div className="gs-hero-spec-item">
                <span className="spec-title">PROCESSO GTAW (TIG) &amp; SCH</span>
                <span className="spec-sub">Inox 40/10S, OD sanitária injetada e carbono</span>
              </div>
              <div className="gs-hero-spec-item">
                <span className="spec-title">VASOS, CALDEIRAS &amp; TANQUES</span>
                <span className="spec-sub">Fabricação e reparos sob normas ASME e ANSI</span>
              </div>
              <div className="gs-hero-spec-item">
                <span className="spec-title">OPERAÇÃO NR-33 &amp; NR-35</span>
                <span className="spec-sub">Equipe certificada para áreas críticas e paradas</span>
              </div>
            </div>

            <div className="gs-hero-actions-pdf">
              <a
                href="https://wa.me/5515998608170?text=Olá!%20Gostaria%20de%20solicitar%20uma%20visita%20técnica%20ou%20orçamento%20com%20a%20GS%20Soluções%20Industriais."
                target="_blank"
                rel="noopener noreferrer"
                className="gs-btn-orange"
              >
                <PhoneCall className="w-5 h-5 mr-2" />
                FALAR COM ENGENHARIA DE PLANTÃO
              </a>
              <a href="#portfolio" className="gs-btn-outline-dark">
                VER PORTFÓLIO TÉCNICO
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>

          <div className="gs-hero-pdf-visual">
            <div className="gs-visual-card-pdf">
              <Image
                src={heroImage}
                alt="Execução técnica de solda industrial pela GS Soluções Industriais"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="gs-visual-caption-pdf">
                <span>TECNOLOGIA METALÚRGICA APLICADA</span>
              </div>
            </div>
          </div>
        </div>
        <div className="gs-pdf-gradient-strip" aria-hidden="true" />
      </section>

      {/* 2. QUEM SOMOS & PILARES DE EXCELÊNCIA (Estilo Página 2 do PDF) */}
      <section id="sobre" className="gs-pdf-section gs-bg-white border-y border-slate-200">
        <div className="container">
          <div className="gs-grid-split items-center">
            <div>
              <div className="gs-kicker-bar">
                <span className="gs-kicker-dash">—</span>
                <span className="gs-kicker-text">SOBRE NÓS</span>
              </div>
              <h2 className="gs-title-split text-3xl md:text-5xl">
                QUEM <span className="text-accent">SOMOS</span>
              </h2>
              <p className="gs-text-desc mt-4">
                Atuamos lado a lado com a <strong>engenharia da sua planta</strong> para executar serviços críticos com rigor dimensional, materiais certificados e cumprimento estrito de cronogramas em campo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                {pilaresQuemSomos.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="gs-card-white gs-card-top-accent">
                      <div className="flex items-center gap-2 mb-2 text-accent">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <h4 className="font-bold text-slate-900 tracking-wider text-sm">{item.title}</h4>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{item.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="gs-kpis-strip mt-8">
                <div className="kpi-box">
                  <strong>NRS 33 &amp; 35</strong>
                  <span>Equipe certificada e segura</span>
                </div>
                <div className="kpi-box">
                  <strong>ASME &amp; ANSI</strong>
                  <span>Procedimentos qualificados</span>
                </div>
                <div className="kpi-box">
                  <strong>100% NO PRAZO</strong>
                  <span>Foco em produtividade</span>
                </div>
              </div>
            </div>

            <div className="relative h-[360px] sm:h-[430px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
              <Image
                src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390414807-WhatsApp_Image_2026-10-07_at_12.53.31.webp"
                alt="Execução segura em áreas críticas pela equipe da GS"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="gs-caption-bar-black">
                Execução segura em áreas críticas e espaços confinados
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRINCIPAIS PARCEIROS & INDÚSTRIAS ATENDIDAS */}
      <section id="clientes" className="gs-pdf-section gs-clients-section">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="gs-kicker-bar justify-center">
              <span className="gs-kicker-dash">—</span>
              <span className="gs-kicker-text">AUTORIDADE COMPROVADA</span>
            </div>
            <h2 className="gs-title-split text-3xl md:text-5xl">
              PRINCIPAIS <span className="text-accent">PARCEIROS</span>
            </h2>
            <p className="gs-text-desc mt-2">
              Atendemos grandes operações industriais nos setores de papel e celulose, alimentício, embalagens, químico e manufatura pesada.
            </p>
          </div>
        </div>

        <div className="gs-clients-marquee" aria-label="Carrossel de indústrias parceiras">
          <div className="gs-clients-marquee-track">
            {carouselItems.map((client, idx) => (
              <div key={`${client.name}-${idx}`} className="gs-client-card" title={client.name}>
                <div className="gs-client-logo-box">
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    sizes="160px"
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. O PORTFÓLIO DE OBRAS TÉCNICAS (Estilo Página 3 do PDF com Grid e Filtros) */}
      <section id="portfolio" className="gs-pdf-section gs-bg-white border-y border-slate-200">
        <GSPortfolio dynamicImages={galeriaImagens} />
      </section>

      {/* 5. TUBULAÇÕES INDUSTRIAIS & SCHEDULE (Estilo Página 4 do PDF) */}
      <section id="especialidades" className="gs-pdf-section">
        <span id="tubulacoes" className="sr-only" aria-hidden="true" />
        <div className="container">
          <div className="gs-grid-split items-center">
            <div>
              <div className="gs-kicker-bar">
                <span className="gs-kicker-dash">—</span>
                <span className="gs-kicker-text">SERVIÇOS ESPECIALIZADOS</span>
              </div>
              <h2 className="gs-title-split text-3xl md:text-5xl">
                TUBULAÇÕES <span className="text-accent">INDUSTRIAIS</span>
              </h2>
              <p className="gs-text-desc mt-3 mb-6">
                Fabricação, montagem e soldagem de linhas de processo em aço inoxidável e aço carbono, seguindo procedimentos qualificados.
              </p>

              <div className="space-y-4">
                {tubulacoesSpecs.map((spec) => (
                  <div key={spec.code} className="gs-spec-row-card">
                    <span className="gs-code-badge">{spec.code}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-wide">{spec.title}</h4>
                      <p className="text-slate-600 text-xs mt-0.5">{spec.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:h-[440px]">
              <div className="relative h-[260px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390326865-WhatsApp_Image_2026-10-07_at_12.18.11.webp"
                  alt="Aço Inox Sch 40 / 10s"
                  fill
                  sizes="(max-width: 640px) 100vw, 20vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black text-[11px]">Aço Inox Sch 40 / 10s</div>
              </div>

              <div className="relative h-[260px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390340643-WhatsApp_Image_2026-10-07_at_12.18.10.webp"
                  alt="OD Sanitária e Alimentícia"
                  fill
                  sizes="(max-width: 640px) 100vw, 20vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black text-[11px]">OD Sanitária e Alimentícia</div>
              </div>

              <div className="relative h-[260px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390384705-WhatsApp_Image_2026-10-07_at_12.18.10__1_.webp"
                  alt="Aço Carbono no procedimento"
                  fill
                  sizes="(max-width: 640px) 100vw, 20vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black text-[11px]">Aço Carbono no procedimento</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DESTAQUE TÉCNICO: SOLDAS ESPECIALIZADAS (Estilo Página 5 do PDF) */}
      <section id="soldas-especiais" className="gs-pdf-section gs-bg-white border-y border-slate-200">
        <div className="container">
          <div className="gs-grid-split items-center">
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200 border-l-4 border-l-[#D95B16] shadow-sm">
              <div className="gs-kicker-bar">
                <span className="gs-kicker-dash">—</span>
                <span className="gs-kicker-text">DESTAQUE TÉCNICO</span>
              </div>
              <h2 className="gs-title-split text-3xl md:text-5xl">
                SOLDAS <span className="text-accent">ESPECIALIZADAS</span>
              </h2>

              <div className="space-y-5 mt-6">
                {destaquesTecnicos.map((item, idx) => (
                  <div
                    key={item.number}
                    className={`flex gap-4 ${idx < destaquesTecnicos.length - 1 ? 'pb-5 border-b border-slate-100' : ''}`}
                  >
                    <span className="gs-step-num">{item.number}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-wide">{item.title}</h4>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="gs-notice-box-orange mt-8">
                <strong>Padrão GS Soluções Industriais:</strong> Cada solda passa por inspeção visual e conformidade técnica rigorosa.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:h-[440px]">
              <div className="relative h-[280px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md sm:row-span-2">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390447746-WhatsApp_Image_2026-10-07_at_12.53.32.webp"
                  alt="Precisão em vasos e tubulações"
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black">Precisão em vasos e tubulações</div>
              </div>
              <div className="relative h-[220px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390488081-WhatsApp_Image_2026-10-07_at_12.53.33.webp"
                  alt="Raiz interna / OD Injetado"
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black">Raiz interna / OD Injetado</div>
              </div>
              <div className="relative h-[220px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390505175-WhatsApp_Image_2026-10-07_at_12.53.33__3_.webp"
                  alt="Acabamento GTAW"
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black">Acabamento GTAW</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CALDEIRARIA, TANQUES E ESTRUTURAS (Estilo Página 6 do PDF) */}
      <section id="caldeiraria" className="gs-pdf-section">
        <div className="container">
          <div className="gs-grid-split items-center">
            <div>
              <div className="gs-kicker-bar">
                <span className="gs-kicker-dash">—</span>
                <span className="gs-kicker-text">ESTRUTURA E MANUTENÇÃO</span>
              </div>
              <h2 className="gs-title-split text-3xl md:text-5xl">
                CALDEIRARIA, TANQUES E <br />
                <span className="text-accent">ESTRUTURAS</span>
              </h2>
              <p className="gs-text-desc mt-3 mb-6">
                Fabricação e montagem em campo de equipamentos e estruturas metálicas de pequeno a grande porte.
              </p>

              <div className="space-y-4">
                {caldeirariaItens.map((item) => (
                  <div key={item.number} className="gs-spec-row-card">
                    <span className="gs-code-badge">{item.number}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-wide">{item.title}</h4>
                      <p className="text-slate-600 text-xs mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:h-[420px]">
              <div className="relative h-[220px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390475375-WhatsApp_Image_2026-10-07_at_12.53.34.webp"
                  alt="Montagem e solda em tanques"
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black">Montagem e solda em tanques</div>
              </div>
              <div className="relative h-[220px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390447746-WhatsApp_Image_2026-10-07_at_12.53.32.webp"
                  alt="Caixa de captação ETE em Inox"
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black">Caixa de captação ETE em Inox</div>
              </div>
              <div className="relative h-[220px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390384705-WhatsApp_Image_2026-10-07_at_12.18.10__1_.webp"
                  alt="Eixo de biodigestor"
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black">Eixo de biodigestor</div>
              </div>
              <div className="relative h-[220px] sm:h-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390646250-WhatsApp_Image_2026-10-07_at_12.53.32__1_.webp"
                  alt="Estruturas e tubulações"
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="gs-caption-bar-black">Estruturas e tubulações</div>
              </div>
            </div>
          </div>

          {/* Barra inferior em largura total estilo Página 6 do PDF */}
          <div className="mt-8 bg-white border border-slate-200 border-t-[3px] border-t-[#D95B16] rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {caldeirariaDiferenciais.map((item) => (
              <div key={item.title} className="p-5">
                <strong className="block text-accent text-xs font-extrabold tracking-wider">{item.title}</strong>
                <span className="text-xs text-slate-600 mt-1 block">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. MANUTENÇÃO INDUSTRIAL E UTILIDADES (Estilo Página 7 do PDF) */}
      <section id="manutencao" className="gs-pdf-section gs-bg-white border-y border-slate-200">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="gs-kicker-bar justify-center">
              <span className="gs-kicker-dash">—</span>
              <span className="gs-kicker-text">CONFIABILIDADE OPERACIONAL</span>
            </div>
            <h2 className="gs-title-split text-3xl md:text-5xl">
              MANUTENÇÃO INDUSTRIAL E <span className="text-accent">UTILIDADES</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {manutencaoCards.map((card) => (
              <div key={card.title} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
                <div className="relative h-64 w-full overflow-hidden border-b-[3px] border-[#D95B16]">
                  <Image src={card.img} alt={card.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-extrabold text-accent text-lg mb-2 tracking-wide">{card.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. SEGMENTOS ATENDIDOS (Estilo Página 8 do PDF - Layout Split) */}
      <section id="segmentos" className="gs-pdf-section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Foto Lateral Vertical (Página 8 do PDF) */}
            <div className="lg:col-span-5 relative h-[360px] lg:h-auto lg:min-h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
              <Image
                src="https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390475375-WhatsApp_Image_2026-10-07_at_12.53.34.webp"
                alt="Atendimento técnico em plantas industriais pela GS Soluções Industriais"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="gs-caption-bar-black">
                Atendimento técnico em plantas industriais
              </div>
            </div>

            {/* Conteúdo Direito: Mercados + Barra Tripla */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-8">
              <div>
                <div className="gs-kicker-bar">
                  <span className="gs-kicker-dash">—</span>
                  <span className="gs-kicker-text">MERCADOS</span>
                </div>
                <h2 className="gs-title-split text-3xl md:text-5xl">
                  SEGMENTOS <span className="text-accent">ATENDIDOS</span>
                </h2>
                <p className="gs-text-desc mt-2 mb-6">
                  Soluções industriais completas para diversos setores da economia produtiva.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {segmentosMercado.map((seg) => {
                    const SegIcon = seg.icon;
                    return (
                      <div key={seg.name} className="gs-market-badge-pdf">
                        <SegIcon className="w-5 h-5 text-accent mb-1.5" />
                        <span className="text-slate-800 font-bold text-[11px] leading-tight">{seg.name}</span>
                        <div className="w-6 h-0.5 bg-accent/60 mt-2 rounded-full" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Destaques de Rodapé do Mercado (Barra Tripla Página 8 do PDF) */}
              <div className="bg-white border border-slate-200 border-l-4 border-l-[#D95B16] rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div className="flex items-start gap-3 p-4">
                  <ShieldCheck className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-accent text-xs font-extrabold">EQUIPE CERTIFICADA</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      NRs 33 &amp; 35 · Soldagem qualificada
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-accent text-xs font-extrabold">PROJETOS SOB MEDIDA</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Adequação exata ao layout da sua planta
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <Factory className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-accent text-xs font-extrabold">SOLUÇÕES COMPLETAS</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Da fabricação à montagem em campo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. DIFERENCIAIS COMPETITIVOS: 100% NO PRAZO (Estilo Página 9 do PDF) */}
      <section id="diferenciais" className="gs-pdf-section gs-bg-white border-y border-slate-200">
        <div className="container">
          <div className="gs-grid-split items-stretch">
            <div className="gs-box-big-prazo">
              <span className="text-accent text-xs font-bold tracking-widest uppercase block mb-2">— POR QUE NOS ESCOLHER?</span>
              <strong className="text-6xl md:text-8xl font-black text-accent block leading-none">100%</strong>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-2 mb-4 tracking-tight">PROJETOS NO PRAZO</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Compromisso total com os cronogramas acordados, garantindo que sua operação não pare. Nossa eficiência é o seu ganho real de produtividade.
              </p>
            </div>

            <div className="flex flex-col justify-between gap-5">
              <div className="bg-white p-7 rounded-2xl border border-slate-200 border-l-[5px] border-l-[#D95B16] shadow-sm">
                <h4 className="text-accent font-extrabold text-lg mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent flex-shrink-0" />
                  QUALIDADE CERTIFICADA (ASME &amp; ANSI)
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Seguimos rigorosamente todos os procedimentos e normas técnicas (ASME, ANSI) para garantir a integridade estrutural, estanqueidade e durabilidade de nossos serviços.
                </p>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-slate-200 border-l-[5px] border-l-[#D95B16] shadow-sm">
                <h4 className="text-accent font-extrabold text-lg mb-2 flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-accent flex-shrink-0" />
                  SEGURANÇA EM PRIMEIRO LUGAR (NR-33 &amp; NR-35)
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Nossa equipe utiliza todos os EPIs necessários, possui certificações para trabalho em altura e espaço confinado e segue protocolos rigorosos para um ambiente livre de acidentes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. ATENDIMENTO COMERCIAL & CONTATOS REAIS (Estilo Página 10 do PDF) */}
      <section id="contato" className="gs-pdf-section border-t border-slate-200">
        <div className="container gs-grid-split items-start">
          <div>
            <div className="gs-kicker-bar">
              <span className="gs-kicker-dash">—</span>
              <span className="gs-kicker-text">ATENDIMENTO COMERCIAL</span>
            </div>
            <h2 className="gs-title-split text-3xl md:text-5xl">
              Vamos iniciar seu <br />
              <span className="text-accent">próximo projeto?</span>
            </h2>
            <p className="gs-text-desc mt-3 mb-7">
              Especialistas em mecânica industrial, caldeiraria e soldas especiais. Solicite um orçamento ou agende uma visita técnica da nossa engenharia.
            </p>

            {/* BOX DOS CONTATOS REAIS DO PDF */}
            <div className="bg-white border border-slate-200 border-l-4 border-l-[#D95B16] rounded-2xl p-5 space-y-3 mb-4 shadow-sm">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                TELEFONES / WHATSAPP DIRETO DA EQUIPE
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {contatosTecnicos.map((ct) => (
                  <a
                    key={ct.nome}
                    href={`https://wa.me/${ct.numeroLimpo}?text=Ol%C3%A1%20${ct.nome}!%20Gostaria%20de%20um%20or%C3%A7amento%20com%20a%20GS%20Solu%C3%A7%C3%B5es%20Industriais.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#D95B16] hover:bg-orange-50/40 hover:shadow-md transition-all flex flex-col"
                  >
                    <span className="text-slate-900 font-bold text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      {ct.nome}
                    </span>
                    <strong className="text-accent text-xs mt-1">{ct.telefone}</strong>
                  </a>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-[#D95B16] rounded-xl flex items-center gap-3 shadow-sm mb-5">
              <Mail className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">E-mail Comercial</span>
                <strong className="text-slate-900 text-sm break-all">contato@gsservicosindustriais.com.br</strong>
              </div>
            </div>

            {/* SELO INSTITUCIONAL GS (Página 10 do PDF) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="relative w-16 h-16 rounded-xl bg-[#0F172A] p-2 flex-shrink-0 border border-slate-200">
                <Image
                  src="/imagens/logo_gs_servicos_industriais.webp"
                  alt="GS Soluções Industriais"
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </div>
              <div>
                <strong className="block text-accent text-sm font-black tracking-wide">GS SOLUÇÕES INDUSTRIAIS</strong>
                <span className="block text-slate-700 text-xs font-semibold">MECÂNICA E SOLDAS ESPECIAIS</span>
                <div className="w-10 h-0.5 bg-[#D95B16] my-1.5" />
                <span className="block text-[10px] font-bold tracking-widest text-slate-500">
                  SEGURANÇA • QUALIDADE • COMPROMISSO
                </span>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO RÁPIDO DE COTAÇÃO */}
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200 border-t-4 border-t-[#D95B16] shadow-md">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Solicitar Proposta Técnica</h3>
            <p className="text-slate-600 text-xs mb-6">Receba atendimento prioritário da nossa engenharia.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu Nome completo *"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  placeholder="Nome da Empresa"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Seu E-mail *"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-accent"
                />
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="Telefone / WhatsApp *"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Demanda Principal:</label>
                <select
                  name="servico"
                  value={formData.servico}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-accent"
                >
                  <option value="Tubulações Industriais & Schedule (Inox / Carbono)">Tubulações Industriais &amp; Schedule (Inox / Carbono)</option>
                  <option value="Soldagem TIG Sanitária (OD Injetado)">Soldagem TIG Sanitária (OD Injetado)</option>
                  <option value="Caldeiraria, Tanques & Vasos de Pressão">Caldeiraria, Tanques &amp; Vasos de Pressão</option>
                  <option value="Manutenção de Caldeiras & Torres">Manutenção de Caldeiras &amp; Torres</option>
                  <option value="Montagem Mecânica & Parada de Planta">Montagem Mecânica &amp; Parada de Planta</option>
                  <option value="Recuperação Dimensional de Eixos">Recuperação Dimensional de Eixos</option>
                </select>
              </div>

              <textarea
                name="mensagem"
                value={formData.mensagem}
                onChange={handleChange}
                rows={3}
                placeholder="Detalhes do equipamento, diâmetro, material ou cronograma de parada..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-accent"
              />

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-lg bg-accent text-white font-bold text-sm tracking-wide uppercase hover:bg-[#b84507] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                ENVIAR PROPOSTA PARA NOSSO WHATSAPP
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* BOTÃO FLUTUANTE DE WHATSAPP GS */}
      <GSWhatsAppButton />

      {/* ESTILOS FIÉIS AO PDF INSTITUCIONAL GS */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Neutraliza vazamento de espaçamento global da loja nesta página B2B */
        main:has(.gs-pdf-theme) {
          padding-bottom: 0 !important;
          background-color: #f7f9fa;
        }

        .gs-pdf-theme .container {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }

        .gs-pdf-theme {
          background-color: #f7f9fa;
          background-image:
            linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          color: #0f172a;
          font-family: inherit;
          overflow-x: hidden;
        }

        .text-accent {
          color: #D95B16 !important;
        }

        .bg-accent {
          background-color: #D95B16 !important;
        }

        .gs-pdf-section {
          padding: 76px 0;
          position: relative;
        }

        .gs-hero-pdf {
          padding: 64px 0 76px;
        }

        .gs-pdf-gradient-strip {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #D95B16 0%, #2AB3A6 100%);
        }

        .gs-bg-white {
          background-color: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(8px);
        }

        .gs-hero-pdf-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        .gs-grid-split {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 44px;
        }

        .gs-kicker-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .gs-kicker-dash {
          color: #D95B16;
          font-weight: 900;
          font-size: 1.2rem;
          line-height: 1;
        }

        .gs-kicker-text {
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #D95B16;
        }

        .gs-title-split {
          font-family: var(--fonte-titulos, sans-serif);
          font-size: clamp(38px, 4.8vw, 64px);
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
          letter-spacing: -0.01em;
          margin-bottom: 18px;
        }

        .gs-hero-title-main {
          font-size: clamp(32px, 3.85vw, 52px);
          line-height: 1.04;
        }

        .gs-lead-pdf {
          font-size: 1.12rem;
          line-height: 1.6;
          color: #334155;
          max-width: 580px;
          margin-bottom: 28px;
        }

        .gs-text-desc {
          font-size: 1rem;
          line-height: 1.6;
          color: #475569;
        }

        .gs-hero-pills-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
          padding: 18px 0;
          border-top: 1px solid rgba(15, 23, 42, 0.12);
          border-bottom: 1px solid rgba(15, 23, 42, 0.12);
        }

        .gs-hero-spec-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          border-left: 2px solid #D95B16;
          padding-left: 12px;
        }

        .spec-title {
          font-size: 0.78rem;
          font-weight: 800;
          color: #D95B16;
          letter-spacing: 0.06em;
        }

        .spec-sub {
          font-size: 0.74rem;
          color: #64748b;
          line-height: 1.35;
        }

        .gs-hero-actions-pdf {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .gs-btn-orange {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #D95B16;
          color: #fff;
          font-weight: 800;
          font-size: 0.88rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 14px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 14px rgba(217, 91, 22, 0.35);
          transition: all 0.2s ease;
        }

        .gs-btn-orange:hover {
          background: #bf4d0e;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(217, 91, 22, 0.45);
        }

        .gs-btn-outline-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          font-weight: 800;
          font-size: 0.88rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 14px 22px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .gs-btn-outline-dark:hover {
          border-color: #D95B16;
          color: #D95B16;
        }

        .gs-visual-card-pdf {
          position: relative;
          width: 100%;
          height: 480px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15);
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #0f172a;
        }

        .gs-visual-caption-pdf {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid rgba(217, 91, 22, 0.45);
          z-index: 2;
        }

        .gs-card-white {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .gs-card-top-accent {
          border-top: 3px solid #D95B16;
        }

        .gs-kpis-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 16px 20px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #D95B16;
          border-radius: 12px;
        }

        .kpi-box {
          padding-right: 12px;
          border-right: 1px solid #e2e8f0;
        }

        .kpi-box:last-child {
          border-right: none;
          padding-right: 0;
        }

        .kpi-box strong {
          display: block;
          color: #D95B16;
          font-size: 1.1rem;
          font-weight: 900;
        }

        .kpi-box span {
          font-size: 0.75rem;
          color: #64748b;
        }

        .gs-caption-bar-black {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #0f172a;
          color: #fff;
          border-top: 2px solid #D95B16;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 8px 12px;
          letter-spacing: 0.02em;
          z-index: 2;
        }

        /* CARROSSEL DE PARCEIROS SEGURO E CONTÍNUO */
        .gs-clients-section {
          padding: 64px 0;
        }

        .gs-clients-marquee {
          width: 100%;
          overflow: hidden;
          padding: 8px 0;
        }

        .gs-clients-marquee-track {
          display: flex;
          width: max-content;
          gap: 24px;
          padding: 0 12px;
          animation: gsMarquee 30s linear infinite !important;
        }

        .gs-clients-marquee:hover .gs-clients-marquee-track {
          animation-play-state: paused !important;
        }

        @keyframes gsMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .gs-client-card {
          position: relative;
          width: 200px;
          height: 100px;
          flex-shrink: 0;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
          transition: border-color 0.25s ease, transform 0.25s ease;
        }

        .gs-client-card:hover {
          border-color: #D95B16;
          transform: translateY(-2px);
        }

        .gs-client-logo-box {
          position: relative;
          width: 156px;
          height: 60px;
          filter: grayscale(100%);
          opacity: 0.8;
          transition: filter 0.25s ease, opacity 0.25s ease;
        }

        .gs-client-card:hover .gs-client-logo-box {
          filter: grayscale(0%);
          opacity: 1;
        }

        .gs-spec-row-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #D95B16;
          border-radius: 10px;
          padding: 14px 18px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
        }

        .gs-code-badge {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: rgba(217, 91, 22, 0.1);
          color: #D95B16;
          font-weight: 900;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gs-step-num {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #D95B16;
          color: #fff;
          font-weight: 900;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gs-notice-box-orange {
          background: rgba(217, 91, 22, 0.08);
          border: 1px solid rgba(217, 91, 22, 0.28);
          border-radius: 8px;
          padding: 12px 18px;
          font-size: 0.85rem;
          color: #9a3412;
        }

        .gs-market-badge-pdf {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .gs-market-badge-pdf:hover {
          transform: translateY(-3px);
          border-color: #D95B16;
        }

        .gs-box-big-prazo {
          background: #fff;
          border: 2px solid #D95B16;
          border-radius: 16px;
          padding: 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 6px 22px rgba(217, 91, 22, 0.08);
        }

        @media (max-width: 900px) {
          .gs-pdf-section {
            padding: 56px 0;
          }

          .gs-hero-pdf-grid,
          .gs-grid-split {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .gs-visual-card-pdf {
            height: 360px;
          }

          .gs-kpis-strip {
            grid-template-columns: 1fr;
          }

          .kpi-box {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
            padding-right: 0;
            padding-bottom: 10px;
          }

          .kpi-box:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .gs-box-big-prazo {
            padding: 32px 24px;
          }
        }

        @media (max-width: 640px) {
          .gs-hero-pills-row {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
      `}} />
    </div>
  );
}
