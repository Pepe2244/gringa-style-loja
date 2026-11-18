'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  ExternalLink, 
  X, 
  MessageSquare, 
  CheckCircle2, 
  Layers, 
  Filter,
  ArrowRight,
  Maximize2,
  SlidersHorizontal
} from 'lucide-react';
import { DEFAULT_B2B_CATALOG_BY_FILENAME, parseB2BTitle } from '@/components/admin/B2BMediaManager';

const GS_WHATSAPP_NUMBER = '5515998608170';

function buildGSWhatsAppUrl(text: string) {
  return `https://wa.me/${GS_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

const PORTFOLIO_PDF_TAGS = [
  'INOX SCH 40 / 10S',
  'TUBULAÇÃO OD',
  'AÇO CARBONO',
  'GTAW (TIG)',
  'CALDEIRAS',
  'TANQUES & ETE',
];

export type PortfolioCategory = 
  | 'todos' 
  | 'soldas' 
  | 'recuperacao' 
  | 'mecanica' 
  | 'caldeiraria';

export interface PortfolioItem {
  id: string;
  title: string;
  category: PortfolioCategory;
  categoryLabel: string;
  imageUrl: string;
  secondaryImageUrl?: string | null; // Para Antes/Depois
  processo: string;
  material?: string;
  descricao: string;
  destaque?: boolean;
}

interface GSPortfolioProps {
  dynamicImages?: any[];
}

const CATEGORIAS: { id: PortfolioCategory; label: string }[] = [
  { id: 'todos', label: 'Todas as Obras' },
  { id: 'soldas', label: 'Soldas Especiais' },
  { id: 'recuperacao', label: 'Recuperação de Peças' },
  { id: 'mecanica', label: 'Mecânica Industrial' },
  { id: 'caldeiraria', label: 'Caldeiraria & Estruturas' },
];

const BASE_PROJECT_IMAGES: {
  id: string;
  key: keyof typeof DEFAULT_B2B_CATALOG_BY_FILENAME;
  imageUrl: string;
  destaque?: boolean;
}[] = [
  {
    id: 'proj-1',
    key: '1791390326865',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390326865-WhatsApp_Image_2026-10-07_at_12.18.11.webp',
    destaque: true,
  },
  {
    id: 'proj-2',
    key: '1791390340643',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390340643-WhatsApp_Image_2026-10-07_at_12.18.10.webp',
    destaque: true,
  },
  {
    id: 'proj-3',
    key: '1791390375785',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390375785-WhatsApp_Image_2026-10-07_at_12.18.10__2_.webp',
  },
  {
    id: 'proj-4',
    key: '1791390384705',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390384705-WhatsApp_Image_2026-10-07_at_12.18.10__1_.webp',
    destaque: true,
  },
  {
    id: 'proj-5',
    key: '1791390414807',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390414807-WhatsApp_Image_2026-10-07_at_12.53.31.webp',
  },
  {
    id: 'proj-6',
    key: '1791390447746',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390447746-WhatsApp_Image_2026-10-07_at_12.53.32.webp',
  },
  {
    id: 'proj-7',
    key: '1791390475375',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390475375-WhatsApp_Image_2026-10-07_at_12.53.34.webp',
    destaque: true,
  },
  {
    id: 'proj-8',
    key: '1791390488081',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390488081-WhatsApp_Image_2026-10-07_at_12.53.33.webp',
  },
  {
    id: 'proj-9',
    key: '1791390505175',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390505175-WhatsApp_Image_2026-10-07_at_12.53.33__3_.webp',
  },
  {
    id: 'proj-10',
    key: '1791390646250',
    imageUrl: 'https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev/1791390646250-WhatsApp_Image_2026-10-07_at_12.53.32__1_.webp',
  },
];

// Dados industriais reais alinhados ao portfólio oficial em PDF
const PROJETOS_BASE: PortfolioItem[] = BASE_PROJECT_IMAGES.map((entry) => {
  const meta = DEFAULT_B2B_CATALOG_BY_FILENAME[entry.key];
  const catObj = CATEGORIAS.find((c) => c.id === meta.category) || CATEGORIAS[1];
  return {
    id: entry.id,
    title: meta.title,
    category: meta.category,
    categoryLabel: catObj.label,
    imageUrl: entry.imageUrl,
    processo: meta.processo,
    material: meta.material,
    descricao: meta.descricao,
    destaque: entry.destaque,
  };
});

export default function GSPortfolio({ dynamicImages = [] }: GSPortfolioProps) {
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory>('todos');
  const [modalItem, setModalItem] = useState<PortfolioItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Combina os dados base com quaisquer imagens extras vindas do Supabase (se houver)
  const allProjects = useMemo(() => {
    if (!dynamicImages || dynamicImages.length === 0) {
      return PROJETOS_BASE;
    }

    // Se temos imagens dinâmicas, mapeamos com inteligência:
    // As que já batem com a URL de base usam a ficha técnica completa;
    // As novas fotos adicionadas pelo chefe ganham formatação padrão profissional.
    const dynamicList: PortfolioItem[] = [];

    dynamicImages.forEach((img, idx) => {
      // Extrai os metadados ricos cadastrados no painel admin ou do catálogo oficial por arquivo
      const meta = parseB2BTitle(img.title, img.url);
      const catObj = CATEGORIAS.find(c => c.id === meta.category) || CATEGORIAS[1];

      // Se o usuário digitou uma descrição específica no admin, usa ela!
      // Se não digitou, usa uma descrição coerente com o processo e material
      const descricaoFinal = meta.descricao && meta.descricao.trim() 
        ? meta.descricao 
        : `Serviço técnico especializado em ${meta.processo.toLowerCase()}, executado com material ${meta.material || 'especificado pelo projeto'}, sob rigoroso controle de qualidade e inspeção dimensional.`;

      dynamicList.push({
        id: img.id || `dyn-${idx}`,
        title: meta.title || `Execução Industrial #${idx + 1}`,
        category: meta.category,
        categoryLabel: catObj.label,
        imageUrl: img.url,
        secondaryImageUrl: img.secondary_url,
        processo: meta.processo || 'Soldas Especiais e Recuperação Técnica',
        material: meta.material || 'Aço / Ligas Metálicas Especiais',
        descricao: descricaoFinal,
        destaque: idx < 4,
      });
    });

    // Retorna as imagens reais cadastradas no admin
    if (dynamicList.length > 0) {
      return dynamicList;
    }
    return PROJETOS_BASE;
  }, [dynamicImages]);

  // Filtragem
  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'todos') return allProjects;
    return allProjects.filter(item => item.category === selectedCategory);
  }, [allProjects, selectedCategory]);

  const handleOpenModal = (item: PortfolioItem) => {
    setModalItem(item);
    setSliderPosition(50);
  };

  const handleCloseModal = () => {
    setModalItem(null);
  };

  const generateProjectWhatsApp = (item: PortfolioItem) => {
    const text = `Olá! Estava analisando o portfólio da GS Soluções Industriais e fiquei interessado na execução:\n\n*${item.title}*\nProcesso: ${item.processo}\n\nGostaria de solicitar uma cotação técnica para uma necessidade similar em nossa fábrica.`;
    return buildGSWhatsAppUrl(text);
  };

  return (
    <div className="gs-portfolio-wrapper">
      <div className="container">
        {/* Cabeçalho da Seção */}
        <div className="portfolio-header">
          <div className="portfolio-kicker">
            <span className="portfolio-kicker-dash">—</span>
            <span className="portfolio-kicker-text">PORTFÓLIO DE OBRAS</span>
          </div>
          <h2 className="portfolio-title-split">
            PORTFÓLIO <span className="text-accent">TÉCNICO</span>
          </h2>
          <p className="portfolio-subtitle">
            Projetos executados pela <strong>GS Soluções Industriais</strong> com alto rigor dimensional, 
            acabamento sanitário e soldas especiais que comprovam nossa capacidade em ambientes industriais exigentes.
          </p>
          <div className="portfolio-pdf-tags">
            {PORTFOLIO_PDF_TAGS.map((tag) => (
              <span key={tag} className="portfolio-pdf-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="portfolio-filter-container">
          <div className="portfolio-filters" role="tablist" aria-label="Filtrar projetos por especialidade">
            {CATEGORIAS.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`portfolio-filter-btn ${active ? 'is-active' : ''}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade de Cards do Portfólio */}
        <div className="portfolio-grid">
          {filteredProjects.map((item) => (
            <article 
              key={item.id} 
              className="portfolio-card group"
              onClick={() => handleOpenModal(item)}
            >
              {/* Imagem do Projeto */}
              <div className="portfolio-image-wrapper">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="portfolio-img object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Badges superiores */}
                <div className="portfolio-top-badges">
                  <span className="portfolio-cat-badge">
                    {item.categoryLabel}
                  </span>
                  {item.secondaryImageUrl && (
                    <span className="portfolio-compare-badge">
                      <SlidersHorizontal className="w-3 h-3 mr-1 inline" />
                      Antes / Depois
                    </span>
                  )}
                </div>

                {/* Tarja Preta de Legenda Estilo PDF GS */}
                <div className="portfolio-caption-black">
                  {item.processo || item.categoryLabel}
                </div>

                {/* Botão de Expandir no Hover */}
                <button
                  type="button"
                  aria-label={`Ampliar detalhes de ${item.title}`}
                  className="portfolio-expand-btn"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Informações Técnicas do Card */}
              <div className="portfolio-card-body">
                {item.material && (
                  <div className="portfolio-material-badge">
                    <span>{item.material}</span>
                  </div>
                )}

                <h3 className="portfolio-card-title">{item.title}</h3>
                
                <p className="portfolio-card-desc">
                  {item.descricao}
                </p>

                <div className="portfolio-card-footer">
                  <span className="portfolio-cta-link">
                    Ver memorial técnico
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Chamada para Ação no Rodapé do Portfólio (Estilo PDF Blueprint) */}
        <div className="portfolio-bottom-box">
          <div className="portfolio-bottom-content">
            <span className="portfolio-bottom-kicker">ENGENHARIA DE PLANTÃO</span>
            <h4>Precisa de reparo emergencial ou fabricação especializada?</h4>
            <p>
              Envie fotos, memoriais ou desenhos técnicos. Nossa equipe de engenharia analisa a viabilidade e entrega a proposta técnica com rapidez.
            </p>
          </div>
          <a
            href={buildGSWhatsAppUrl('Olá! Gostaria de consultar a engenharia da GS Soluções Industriais para uma necessidade de serviço na minha empresa.')}
            target="_blank"
            rel="noopener noreferrer"
            className="portfolio-direct-cta"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            SOLICITAR PROPOSTA TÉCNICA
          </a>
        </div>
      </div>

      {/* MODAL / LIGHTBOX DE DETALHES EM TELA CHEIA */}
      {modalItem && (
        <div 
          className="portfolio-modal-backdrop" 
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="portfolio-modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              type="button"
              className="portfolio-modal-close"
              onClick={handleCloseModal}
              aria-label="Fechar detalhes"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="portfolio-modal-grid">
              {/* Lado Esquerdo: Imagem Ampliada ou Comparativo Antes/Depois */}
              <div className="portfolio-modal-visual">
                {modalItem.secondaryImageUrl ? (
                  // Comparador Antes / Depois
                  <div className="portfolio-slider-container">
                    <div className="relative w-full h-[400px] md:h-[480px] overflow-hidden rounded-xl">
                      {/* Imagem do Depois (fundo) */}
                      <Image
                        src={modalItem.imageUrl}
                        alt={`Depois: ${modalItem.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <span className="slider-label slider-label-after">DEPOIS (RECUPERADO)</span>

                      {/* Imagem do Antes (recortada com clipPath para manter alinhamento 1:1) */}
                      <div 
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <Image
                          src={modalItem.secondaryImageUrl}
                          alt={`Antes: ${modalItem.title}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <span className="slider-label slider-label-before">ANTES</span>
                      </div>

                      {/* Linha divisória visível do comparador */}
                      <div
                        className="slider-divider-line"
                        style={{ left: `${sliderPosition}%` }}
                        aria-hidden="true"
                      />

                      {/* Controle deslizante */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="slider-input"
                        aria-label="Comparar antes e depois arrastando a barra"
                      />
                    </div>
                    <p className="slider-instruction">
                      ↔ Arraste a barra para comparar o estado inicial e o resultado final.
                    </p>
                  </div>
                ) : (
                  // Imagem Normal em Alta Resolução
                  <div className="relative w-full h-[360px] md:h-[500px] rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                    <Image
                      src={modalItem.imageUrl}
                      alt={modalItem.title}
                      fill
                      priority
                      className="object-contain md:object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="portfolio-caption-black">
                      {modalItem.processo || modalItem.categoryLabel}
                    </div>
                  </div>
                )}
              </div>

              {/* Lado Direito: Especificações Técnicas e Ação */}
              <div className="portfolio-modal-info">
                <div className="portfolio-modal-badge">
                  {modalItem.categoryLabel}
                </div>

                <h3 className="portfolio-modal-title">{modalItem.title}</h3>

                <div className="portfolio-specs-list">
                  <div className="portfolio-spec-item">
                    <span className="spec-label">Processo de Fabricação / Solda</span>
                    <strong className="spec-value">{modalItem.processo}</strong>
                  </div>

                  {modalItem.material && (
                    <div className="portfolio-spec-item">
                      <span className="spec-label">Material & Metal Base</span>
                      <strong className="spec-value">{modalItem.material}</strong>
                    </div>
                  )}

                  <div className="portfolio-spec-item">
                    <span className="spec-label">Controle de Qualidade</span>
                    <strong className="spec-value">Inspeção Dimensional e Ensaios Não-Destrutivos (END)</strong>
                  </div>
                </div>

                <div className="portfolio-modal-desc-box">
                  <h4>Memorial Descritivo do Serviço:</h4>
                  <p>{modalItem.descricao}</p>
                </div>

                <div className="portfolio-modal-actions">
                  <a
                    href={generateProjectWhatsApp(modalItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-modal-whatsapp"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    SOLICITAR COTAÇÃO DESTA PEÇA VIA WHATSAPP
                  </a>
                  <p className="portfolio-modal-note">
                    Atendimento técnico para paradas programadas e intervenções sob demanda em todo o Brasil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS ESPECÍFICOS DO PORTFÓLIO GS - TEMA BLUEPRINT / PDF */}
      <style dangerouslySetInnerHTML={{__html: `
        .gs-portfolio-wrapper {
          padding: 0;
          color: #0F172A;
        }

        .portfolio-header {
          text-align: center;
          max-width: 840px;
          margin: 0 auto 28px;
        }

        .portfolio-pdf-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 18px;
        }

        .portfolio-pdf-tag {
          padding: 5px 12px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #D95B16;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
        }

        .portfolio-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .portfolio-kicker-dash {
          color: #D95B16;
          font-weight: 900;
          font-size: 1.2rem;
        }

        .portfolio-kicker-text {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #475569;
          text-transform: uppercase;
        }

        .portfolio-title-split {
          font-family: var(--fonte-titulos, sans-serif);
          font-size: clamp(32px, 4.5vw, 50px);
          font-weight: 900;
          line-height: 1.1;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .portfolio-title-split .text-accent {
          color: #D95B16;
        }

        .portfolio-subtitle {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #475569;
        }

        .portfolio-filter-container {
          display: flex;
          justify-content: center;
          margin-bottom: 38px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .portfolio-filters {
          display: inline-flex;
          gap: 6px;
          padding: 5px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
        }

        .portfolio-filter-btn {
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .portfolio-filter-btn:hover {
          color: #0F172A;
          background: rgba(255, 255, 255, 0.6);
        }

        .portfolio-filter-btn.is-active {
          background: #D95B16;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(217, 91, 22, 0.3);
        }

        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 26px;
        }

        .portfolio-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        }

        .portfolio-card:hover {
          transform: translateY(-5px);
          border-color: #D95B16;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
        }

        .portfolio-image-wrapper {
          position: relative;
          width: 100%;
          height: 230px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .portfolio-top-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 4;
        }

        .portfolio-cat-badge {
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .portfolio-compare-badge {
          background: #D95B16;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(217, 91, 22, 0.4);
        }

        .portfolio-caption-black {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #0F172A;
          color: #ffffff;
          border-top: 2px solid #D95B16;
          padding: 8px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-align: center;
          z-index: 3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .portfolio-expand-btn {
          position: absolute;
          bottom: 46px;
          right: 12px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          color: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
          opacity: 0;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.12);
        }

        .portfolio-card:hover .portfolio-expand-btn {
          opacity: 1;
        }

        .portfolio-expand-btn:hover {
          background: #D95B16;
          color: #ffffff;
          border-color: #D95B16;
        }

        .portfolio-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .portfolio-material-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #D95B16;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }

        .portfolio-card-title {
          font-family: var(--fonte-titulos, sans-serif);
          font-size: 1.18rem;
          font-weight: 800;
          line-height: 1.3;
          color: #0F172A;
          margin-bottom: 8px;
          transition: color 0.2s ease;
        }

        .portfolio-card:hover .portfolio-card-title {
          color: #D95B16;
        }

        .portfolio-card-desc {
          color: #475569;
          font-size: 0.88rem;
          line-height: 1.55;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .portfolio-card-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .portfolio-cta-link {
          display: inline-flex;
          align-items: center;
          font-size: 0.82rem;
          font-weight: 800;
          color: #D95B16;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .portfolio-bottom-box {
          margin-top: 56px;
          padding: 36px 42px;
          background: #0F172A;
          border: 1px solid #1E293B;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          color: #ffffff;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.15);
        }

        .portfolio-bottom-kicker {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #D95B16;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .portfolio-bottom-content h4 {
          font-family: var(--fonte-titulos, sans-serif);
          font-size: 1.45rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .portfolio-bottom-content p {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.5;
          max-width: 600px;
        }

        .portfolio-direct-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 15px 26px;
          border-radius: 8px;
          background: #D95B16;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: all 0.2s ease;
          box-shadow: 0 6px 18px rgba(217, 91, 22, 0.35);
        }

        .portfolio-direct-cta:hover {
          background: #ea6923;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(217, 91, 22, 0.5);
        }

        /* MODAL STYLES TEMA BLUEPRINT / PDF */
        .portfolio-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }

        .portfolio-modal-content {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          width: 100%;
          max-width: 1050px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
          padding: 32px;
          color: #0F172A;
        }

        .portfolio-modal-close {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .portfolio-modal-close:hover {
          background: #D95B16;
          color: #ffffff;
          border-color: #D95B16;
        }

        .portfolio-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: center;
        }

        .portfolio-modal-badge {
          display: inline-block;
          background: rgba(217, 91, 22, 0.1);
          color: #D95B16;
          border: 1px solid rgba(217, 91, 22, 0.3);
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .portfolio-modal-title {
          font-family: var(--fonte-titulos, sans-serif);
          font-size: clamp(24px, 2.5vw, 32px);
          font-weight: 900;
          line-height: 1.2;
          color: #0F172A;
          margin-bottom: 20px;
        }

        .portfolio-specs-list {
          display: grid;
          gap: 12px;
          margin-bottom: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 18px;
        }

        .portfolio-spec-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .spec-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }

        .spec-value {
          font-size: 0.92rem;
          color: #0F172A;
          font-weight: 700;
        }

        .portfolio-modal-desc-box {
          margin-bottom: 24px;
        }

        .portfolio-modal-desc-box h4 {
          font-size: 0.9rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .portfolio-modal-desc-box p {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #475569;
        }

        .portfolio-modal-whatsapp {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 15px 20px;
          background: #25D366;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.88rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          box-shadow: 0 6px 18px rgba(37, 211, 102, 0.3);
        }

        .portfolio-modal-whatsapp:hover {
          background: #22bf5b;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(37, 211, 102, 0.45);
        }

        .portfolio-modal-note {
          font-size: 0.76rem;
          color: #94a3b8;
          text-align: center;
          margin-top: 10px;
        }

        /* SLIDER ANTES E DEPOIS */
        .portfolio-slider-container {
          position: relative;
        }

        .slider-label {
          position: absolute;
          bottom: 16px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          z-index: 5;
        }

        .slider-label-before {
          left: 16px;
          background: rgba(220, 38, 38, 0.95);
          color: #fff;
        }

        .slider-label-after {
          right: 16px;
          background: #D95B16;
          color: #fff;
        }

        .slider-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: ew-resize;
          z-index: 10;
        }

        .slider-divider-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #D95B16;
          transform: translateX(-50%);
          z-index: 6;
          pointer-events: none;
          box-shadow: 0 0 10px rgba(217, 91, 22, 0.75);
        }

        .slider-divider-line::after {
          content: '↔';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #D95B16;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
        }

        .slider-instruction {
          text-align: center;
          font-size: 0.78rem;
          color: #64748b;
          margin-top: 8px;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 900px) {
          .portfolio-filter-container {
            justify-content: flex-start;
          }

          .portfolio-modal-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .portfolio-bottom-box {
            flex-direction: column;
            text-align: center;
            padding: 28px;
          }

          .portfolio-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
}
