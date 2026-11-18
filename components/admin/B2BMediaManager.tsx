'use client';

import { useEffect, useState } from 'react';
import { Edit, Image as ImageIcon, Loader2, Plus, Trash2, Upload, X, Layers, FileText, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/imageCompression';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import Image from 'next/image';
import { deleteB2BAsset, saveB2BAsset } from '@/app/actions/admin-data';

type B2BSection = 'galeria' | 'cliente' | 'hero' | 'projetos';
type B2BTab = B2BSection | 'clientes';

export interface B2BAsset {
  id: string;
  section: B2BSection;
  title?: string | null;
  url: string;
  secondary_url?: string | null;
}

export interface B2BProjectMeta {
  title: string;
  category: 'soldas' | 'recuperacao' | 'mecanica' | 'caldeiraria';
  processo: string;
  material: string;
  descricao: string;
}

const tabLabels: Record<B2BTab, string> & { cliente: string } = {
  galeria: 'Galeria de obras',
  clientes: 'Clientes / Parceiros',
  hero: 'Imagem do hero',
  projetos: 'Projetos antes/depois',
  cliente: 'Clientes / Parceiros',
};

const visibleTabs: B2BTab[] = ['galeria', 'projetos', 'clientes', 'hero'];

export const DEFAULT_B2B_CATALOG_BY_FILENAME: Record<string, B2BProjectMeta> = {
  '1791390326865': {
    title: 'Tubulação em Aço Inoxidável Schedule 40 / 10S',
    category: 'soldas',
    processo: 'Soldagem GTAW (TIG) no Procedimento',
    material: 'Aço Inoxidável AISI 304 / 316L (Sch 40 e 10S)',
    descricao: 'Soldagem de linha de processo em aço inoxidável seguindo procedimento qualificado, garantindo penetração total, controle térmico preciso e alta resistência mecânica.',
  },
  '1791390340643': {
    title: 'Tubulação OD Sanitária e Alimentícia',
    category: 'soldas',
    processo: 'Solda TIG (GTAW) Sanitária com Purga Interna',
    material: 'Aço Inoxidável Sanitário OD Polido',
    descricao: 'Execução de tubulação e conexões padrão OD para indústria alimentícia, de bebidas e farmacêutica, com purga interna de gás inerte (injetado) isenta de oxidação.',
  },
  '1791390375785': {
    title: 'Manutenção em Parede e Feixe Tubular de Caldeira',
    category: 'mecanica',
    processo: 'Soldagem e Reparo Térmico sob Normas ASME / NR-13',
    material: 'Aço Carbono para Alta Temperatura (ASTM A178 / A106)',
    descricao: 'Intervenção rápida e segura em parede de água e feixes tubulares de caldeira industrial, restabelecendo a estanqueidade e reduzindo o tempo de parada da planta.',
  },
  '1791390384705': {
    title: 'Recuperação e Soldagem em Eixo de Biodigestor',
    category: 'recuperacao',
    processo: 'Soldagem Especializada em Espessuras de Grande Porte',
    material: 'Aço Carbono / Aço Liga de Alta Espessura',
    descricao: 'Recuperação estrutural e soldagem técnica de penetração total em eixo e mancais de biodigestor submetidos a severo esforço mecânico e torção contínua.',
  },
  '1791390414807': {
    title: 'Intervenção Técnica em Caldeira e Espaço Confinado',
    category: 'recuperacao',
    processo: 'Reparo de Tubos de Troca Térmica (NR-33 / NR-35)',
    material: 'Tubos de Caldeira em Aço Carbono',
    descricao: 'Execução segura em áreas críticas e espaços confinados por equipe certificada NR-33 e NR-35, com preparação, tamponamento e soldagem de feixes tubulares.',
  },
  '1791390447746': {
    title: 'Fabricação de Caixa de Captação ETE em Aço Inox',
    category: 'caldeiraria',
    processo: 'Caldeiraria em Inox & Soldagem GTAW de Precisão',
    material: 'Aço Inoxidável Resistente à Corrosão',
    descricao: 'Fabricação e soldagem de caixa de captação para Estação de Tratamento de Efluentes (ETE), com cordões TIG uniformes e proteção anticorrosiva superior.',
  },
  '1791390475375': {
    title: 'Montagem de Tanques, Vasos de Pressão e Estruturas',
    category: 'caldeiraria',
    processo: 'Caldeiraria Pesada & Montagem Industrial em Campo',
    material: 'Aço Inoxidável e Aço Carbono Certificados',
    descricao: 'Fabricação e montagem em campo de tanques de armazenamento, vasos sob normas ASME/ANSI, plataformas de acesso e interligações de tubulação industrial.',
  },
  '1791390488081': {
    title: 'Raiz Interna em Tubo OD Injetado e Aço Carbono',
    category: 'soldas',
    processo: 'GTAW (TIG) com Purga de Gás Inerte (100% Penetração)',
    material: 'Tubo OD Inox Sanitário e Aço Carbono',
    descricao: 'Penetração controlada na raiz interna através de purga com argônio puro, garantindo superfície interna lisa, livre de oxidação ou incrustações para fluidos críticos.',
  },
  '1791390505175': {
    title: 'Acabamento Técnico e Artístico GTAW em Tubulação',
    category: 'soldas',
    processo: 'Soldagem GTAW (TIG) de Alta Precisão',
    material: 'Tubulação Industrial em Aço Inox',
    descricao: 'Cordões de solda com geometria uniforme, aporte térmico controlado e acabamento metalúrgico de alto padrão, inspecionados visual e dimensionalmente.',
  },
  '1791390646250': {
    title: 'Instalação de Linhas de Combate a Incêndio e Utilidades',
    category: 'mecanica',
    processo: 'Montagem de Redes Pressurizadas e Cavaletes',
    material: 'Tubulação em Aço Carbono Sch 40 Pintura Epóxi',
    descricao: 'Montagem completa de rede de hidrantes, bombas de incêndio, válvulas de governo e linhas de utilidades industriais conforme normas técnicas de segurança.',
  },
};

function findDefaultCatalogByUrl(imageUrl?: string | null): B2BProjectMeta | null {
  if (!imageUrl) return null;
  const entry = Object.entries(DEFAULT_B2B_CATALOG_BY_FILENAME).find(([key]) => imageUrl.includes(key));
  return entry ? entry[1] : null;
}

// Helper para desserializar com segurança os metadados do campo title
export function parseB2BTitle(rawTitle: string | null | undefined, imageUrl?: string | null): B2BProjectMeta {
  const trimmed = rawTitle?.trim() || '';

  // Tenta analisar se é JSON estruturado salvo pelo Admin
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        title: parsed.title || 'Obra Industrial Especializada',
        category: parsed.category || 'soldas',
        processo: parsed.processo || 'Soldas Especiais de Precisão',
        material: parsed.material || 'Aço Carbono / Inox / Ligas Especiais',
        descricao: parsed.descricao || '',
      };
    } catch {
      // Ignora erro e trata como texto/fallback
    }
  }

  // Se houver correspondência exata no catálogo oficial do portfólio pelo arquivo da imagem
  const catalogMatch = findDefaultCatalogByUrl(imageUrl);
  if (catalogMatch) {
    return {
      ...catalogMatch,
      title: trimmed || catalogMatch.title,
    };
  }

  if (!trimmed) {
    return {
      title: 'Obra Industrial Especializada',
      category: 'soldas',
      processo: 'Soldas Especiais de Precisão',
      material: 'Aço Carbono / Inox / Ligas Especiais',
      descricao: 'Serviço executado sob rigoroso padrão de qualidade industrial.',
    };
  }

  // Se for texto simples antigo
  return {
    title: trimmed,
    category: 'soldas',
    processo: 'Soldas Especiais de Precisão',
    material: 'Aço Carbono / Inox / Ligas Especiais',
    descricao: '',
  };
}

export default function B2BMediaManager() {
  const [assets, setAssets] = useState<B2BAsset[]>([]);
  const [activeTab, setActiveTab] = useState<B2BTab>('galeria');
  const [editingAsset, setEditingAsset] = useState<B2BAsset | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Estados dos campos do formulário
  const [inputTitle, setInputTitle] = useState('');
  const [inputCategory, setInputCategory] = useState<'soldas' | 'recuperacao' | 'mecanica' | 'caldeiraria'>('soldas');
  const [inputProcess, setInputProcess] = useState('');
  const [inputMaterial, setInputMaterial] = useState('');
  const [inputDesc, setInputDesc] = useState('');

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [secondaryFileToUpload, setSecondaryFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('b2b_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAssets((data || []) as B2BAsset[]);
    } catch (fetchError: any) {
      console.error('Erro ao buscar mídias B2B:', fetchError);
      setError(`Não foi possível carregar as mídias: ${fetchError.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const uploadFile = async (file: File) => {
    let preparedFile = file;
    let fileName = file.name;

    if (file.type.startsWith('image/')) {
      try {
        const compressedBlob = await compressImage(file);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
        fileName = `${baseName}.webp`;
        preparedFile = new File([compressedBlob], fileName, { type: 'image/webp' });
      } catch (compressionError) {
        console.error('Erro na compressão da imagem:', compressionError);
      }
    }

    const formData = new FormData();
    formData.append('file', preparedFile, fileName);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.url) {
      throw new Error(result.error || `HTTP ${response.status}: falha no upload`);
    }
    return result.url as string;
  };

  const openModal = (section: B2BSection, asset: B2BAsset | null = null) => {
    setActiveTab(section);
    setEditingAsset(asset);
    
    if (asset) {
      if (section === 'cliente') {
        setInputTitle(asset.title || '');
        setInputCategory('soldas');
        setInputProcess('');
        setInputMaterial('');
        setInputDesc('');
      } else {
        const parsed = parseB2BTitle(asset.title, asset.url);
        setInputTitle(parsed.title);
        setInputCategory(parsed.category);
        setInputProcess(parsed.processo);
        setInputMaterial(parsed.material);
        setInputDesc(parsed.descricao);
      }
    } else {
      setInputTitle('');
      setInputCategory(section === 'projetos' ? 'recuperacao' : 'soldas');
      setInputProcess('');
      setInputMaterial('');
      setInputDesc('');
    }

    setFileToUpload(null);
    setSecondaryFileToUpload(null);
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (uploading) return;
    setShowModal(false);
    setEditingAsset(null);
    setInputTitle('');
    setInputProcess('');
    setInputMaterial('');
    setInputDesc('');
    setFileToUpload(null);
    setSecondaryFileToUpload(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const section = activeTab === 'clientes' ? 'cliente' : activeTab;
    const isProject = section === 'projetos';
    const isGallery = section === 'galeria';
    const isWorkItem = isProject || isGallery;
    const mainFileRequired = !editingAsset && !fileToUpload;

    if (mainFileRequired || (isProject && !editingAsset && !secondaryFileToUpload)) {
      setError(isProject ? 'Selecione a imagem de antes e a imagem de depois.' : 'Selecione uma imagem.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const mainUrl = fileToUpload ? await uploadFile(fileToUpload) : editingAsset?.url;
      const secondaryUrl = secondaryFileToUpload
        ? await uploadFile(secondaryFileToUpload)
        : editingAsset?.secondary_url;

      if (!mainUrl) throw new Error('A imagem principal não foi definida.');

      let finalTitleValue: string | null = null;

      if (isWorkItem) {
        // Salva metadados técnicos completos em formato estruturado
        const metaPayload: B2BProjectMeta = {
          title: inputTitle.trim() || 'Serviço Técnico Industrial',
          category: inputCategory,
          processo: inputProcess.trim() || 'Soldas Especiais e Recuperação',
          material: inputMaterial.trim() || 'Aço / Ligas Especiais',
          descricao: inputDesc.trim() || 'Execução técnica realizada sob rígido controle de processo.',
        };
        finalTitleValue = JSON.stringify(metaPayload);
      } else if (section === 'cliente') {
        finalTitleValue = inputTitle.trim() || 'Cliente Parceiro';
      } else {
        finalTitleValue = null;
      }

      const record = {
        section,
        url: mainUrl,
        title: finalTitleValue,
        ...(isProject
          ? { secondary_url: secondaryUrl || null }
          : isGallery && secondaryUrl
            ? { secondary_url: secondaryUrl }
            : {}),
      };

      const result = await saveB2BAsset(record, editingAsset?.id, !editingAsset);
      if (!result.success) throw new Error(result.error);
      await fetchAssets();
      closeModal();
    } catch (saveError: any) {
      console.error('Erro ao salvar mídia B2B:', saveError);
      setError(`Não foi possível salvar: ${saveError.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: B2BAsset) => {
    if (!window.confirm('Deseja realmente remover esta mídia?')) return;
    setError(null);
    try {
      const result = await deleteB2BAsset(asset.id);
      if (!result.success) throw new Error(result.error);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
    } catch (deleteError: any) {
      console.error('Erro ao excluir mídia B2B:', deleteError);
      setError(`Não foi possível excluir: ${deleteError.message}`);
    }
  };

  const visibleAssets = assets.filter((asset) => asset.section === (activeTab === 'clientes' ? 'cliente' : activeTab));
  const modalSection = activeTab === 'clientes' ? 'cliente' : activeTab;
  const isProjectModal = modalSection === 'projetos';
  const isGalleryModal = modalSection === 'galeria';
  const isTechnicalWork = isProjectModal || isGalleryModal;

  return (
    <div className="admin-container" style={{ maxWidth: '1150px', color: 'white' }}>
      <div className="admin-header">
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Portfólio & Mídia B2B (GS Soluções Industriais)
          </h1>
          <p style={{ color: '#aaa', fontSize: '0.88rem', margin: '6px 0 0' }}>
            Cadastre e edite fotos, processos técnicos, materiais e descrições das obras exibidas no portfólio.
          </p>
        </div>
        <button className="btn-admin btn-adicionar" onClick={() => openModal(modalSection)}>
          <Plus size={18} /> Adicionar nesta seção
        </button>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {visibleTabs.map((tab) => (
          <button key={tab} className={`btn ${activeTab === tab ? '' : 'btn-secundario'}`} onClick={() => setActiveTab(tab)}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#3a1515', border: '1px solid #a33', color: '#ffb0b0', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: '#aaa' }}>
          <Loader2 className="animate-spin" style={{ margin: '0 auto 10px' }} /> Carregando mídias...
        </div>
      ) : visibleAssets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: '#777', border: '2px dashed #333', borderRadius: '12px' }}>
          <ImageIcon size={42} style={{ margin: '0 auto 10px' }} />
          <p>Nenhuma mídia cadastrada nesta seção.</p>
          <button className="btn-admin btn-adicionar" onClick={() => openModal(modalSection)}>Adicionar a primeira</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isProjectModal ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          {visibleAssets.map((asset) => {
            const parsed = parseB2BTitle(asset.title, asset.url);
            const hasBeforeAfter = isProjectModal || Boolean(asset.secondary_url);
            return (
              <article key={asset.id} style={{ background: '#161616', border: '1px solid #2d2d2d', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {hasBeforeAfter ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '8px', background: '#0f0f0f' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden' }}>
                      <Image src={getProxiedImageUrl(asset.secondary_url || asset.url)} alt="Antes" fill sizes="(max-width: 768px) 50vw, 200px" style={{ objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(220,38,38,0.9)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ANTES</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden' }}>
                      <Image src={getProxiedImageUrl(asset.url)} alt="Depois" fill sizes="(max-width: 768px) 50vw, 200px" style={{ objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(37,211,102,0.9)', color: '#000', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>DEPOIS</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: activeTab === 'hero' ? '16 / 9' : '4 / 3', overflow: 'hidden', background: '#0f0f0f' }}>
                    <Image src={getProxiedImageUrl(asset.url)} alt={parsed.title} fill sizes="(max-width: 768px) 100vw, 300px" style={{ objectFit: activeTab === 'clientes' ? 'contain' : 'cover', padding: activeTab === 'clientes' ? '14px' : '0' }} />
                  </div>
                )}
                
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <strong style={{ color: '#fff', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {parsed.title}
                    </strong>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button aria-label="Editar" title="Editar" onClick={() => openModal(asset.section, asset)} className="btn-admin" style={{ background: '#252525', color: '#ffaa00', padding: '6px 10px' }}><Edit size={15} /></button>
                      <button aria-label="Excluir" title="Excluir" onClick={() => handleDelete(asset)} className="btn-admin" style={{ background: '#311', color: '#ff7777', padding: '6px 10px' }}><Trash2 size={15} /></button>
                    </div>
                  </div>

                  {isTechnicalWork && (
                    <>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(255,170,0,0.15)', color: '#ffaa00', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {parsed.category}
                        </span>
                        <span style={{ background: '#222', color: '#bbb', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                          {parsed.processo}
                        </span>
                      </div>
                      {parsed.descricao && (
                        <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                          {parsed.descricao}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL DE ADIÇÃO E EDIÇÃO RICA */}
      {showModal && (
        <div className="modal-admin-container visivel" style={{ zIndex: 1000 }} onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="modal-admin" style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', background: '#141414', border: '1px solid #333', borderRadius: '16px', padding: '26px' }}>
            <button className="modal-fechar-btn" onClick={closeModal} aria-label="Fechar modal"><X size={24} /></button>
            <h2 className="titulo-secao" style={{ fontSize: '1.4rem', color: '#ffaa00', marginBottom: '4px' }}>
              {editingAsset ? 'Editar Mídia B2B' : 'Adicionar Nova Mídia B2B'}
            </h2>
            <p style={{ color: '#888', marginBottom: '22px', fontSize: '0.88rem' }}>
              Seção ativa: <strong>{tabLabels[activeTab]}</strong>
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* SE FOR PROJETOS OU GALERIA (CAMPOS TÉCNICOS COMPLETOS) */}
              {isTechnicalWork ? (
                <>
                  <div className="form-campo" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 'bold', color: '#ddd' }}>Título da Obra / Serviço *</label>
                    <input 
                      value={inputTitle} 
                      onChange={(e) => setInputTitle(e.target.value)} 
                      required 
                      placeholder="Ex.: Recuperação de Parede de Caldeira de Carbono" 
                      style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 12px', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-campo" style={{ marginBottom: 0 }}>
                      <label style={{ fontWeight: 'bold', color: '#ddd' }}>Categoria no Portfólio *</label>
                      <select 
                        value={inputCategory} 
                        onChange={(e) => setInputCategory(e.target.value as any)}
                        style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 12px', borderRadius: '6px' }}
                      >
                        <option value="soldas">Soldas Especiais</option>
                        <option value="recuperacao">Recuperação de Peças</option>
                        <option value="caldeiraria">Caldeiraria & Estruturas</option>
                        <option value="mecanica">Mecânica Industrial</option>
                      </select>
                    </div>

                    <div className="form-campo" style={{ marginBottom: 0 }}>
                      <label style={{ fontWeight: 'bold', color: '#ddd' }}>Processo de Solda / Reparo</label>
                      <input 
                        value={inputProcess} 
                        onChange={(e) => setInputProcess(e.target.value)} 
                        placeholder="Ex.: MIG/MAG Pesada & Reforço de Vigas" 
                        style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 12px', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  <div className="form-campo" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 'bold', color: '#ddd' }}>Material & Metal Base</label>
                    <input 
                      value={inputMaterial} 
                      onChange={(e) => setInputMaterial(e.target.value)} 
                      placeholder="Ex.: Aço Carbono ASTM A36 / Aço Inox AISI 316L" 
                      style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 12px', borderRadius: '6px' }}
                    />
                  </div>

                  <div className="form-campo" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 'bold', color: '#ddd' }}>Memorial Descritivo / Descrição do Serviço</label>
                    <textarea 
                      value={inputDesc} 
                      onChange={(e) => setInputDesc(e.target.value)} 
                      rows={4}
                      placeholder="Descreva o desafio da operação e o procedimento técnico executado (ex.: pré-aquecimento, usinagem, controle térmico, teste de líquido penetrante)..." 
                      style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 12px', borderRadius: '6px', lineHeight: 1.5 }}
                    />
                  </div>
                </>
              ) : modalSection === 'cliente' ? (
                <div className="form-campo" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 'bold', color: '#ddd' }}>Nome da Empresa / Cliente *</label>
                  <input 
                    value={inputTitle} 
                    onChange={(e) => setInputTitle(e.target.value)} 
                    required 
                    placeholder="Ex.: Suzano, Amcor, Dexco..." 
                    style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 12px', borderRadius: '6px' }}
                  />
                </div>
              ) : null}

              {/* SELETORES DE IMAGEM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <FilePicker 
                  label={isTechnicalWork ? 'Foto do DEPOIS (ou Foto Principal da Obra)' : 'Imagem'} 
                  file={fileToUpload} 
                  currentUrl={editingAsset?.url} 
                  onChange={setFileToUpload} 
                />

                {isTechnicalWork && (
                  <FilePicker 
                    label={isProjectModal ? 'Foto do ANTES (Peça gasta/avariada para o comparador) *' : 'Foto do ANTES (Opcional — ativa comparador Antes/Depois)'} 
                    file={secondaryFileToUpload} 
                    currentUrl={editingAsset?.secondary_url || undefined} 
                    onChange={setSecondaryFileToUpload} 
                  />
                )}
              </div>

              {error && <p style={{ color: '#ff8888', margin: 0, fontWeight: 'bold' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} className="btn-admin" style={{ flex: 1, background: '#2a2a2a', color: 'white', padding: '12px' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin" style={{ flex: 2, background: '#ffaa00', color: 'black', fontWeight: 'bold', padding: '12px' }} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} size={20} /> : editingAsset ? 'Salvar Alterações' : 'Cadastrar no Portfólio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FilePicker({ label, file, currentUrl, onChange }: { label: string; file: File | null; currentUrl?: string | null; onChange: (file: File | null) => void }) {
  return (
    <label className="form-campo" style={{ marginBottom: 0, border: '1px dashed #555', borderRadius: '8px', padding: '14px', cursor: 'pointer', background: '#1a1a1a', display: 'block' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffaa00', fontWeight: 'bold' }}>
        <Upload size={18} /> {label}
      </span>
      <span style={{ display: 'block', color: '#aaa', fontSize: '0.82rem', marginTop: '6px' }}>
        {file?.name || (currentUrl ? 'Imagem atual carregada. Clique se quiser substituir por outro arquivo.' : 'Clique aqui para escolher uma imagem do seu computador')}
      </span>
      <input type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} style={{ display: 'none' }} />
    </label>
  );
}
