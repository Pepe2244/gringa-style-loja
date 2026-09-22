'use client';

import { useEffect, useState } from 'react';
import { Edit, Image as ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/imageCompression';
import Image from 'next/image';

type B2BSection = 'galeria' | 'cliente' | 'hero' | 'projetos';
type B2BTab = B2BSection | 'clientes';

interface B2BAsset {
  id: string;
  section: B2BSection;
  title?: string | null;
  url: string;
  secondary_url?: string | null;
}

const tabLabels: Record<B2BTab, string> & { cliente: string } = {
  galeria: 'Galeria de obras',
  clientes: 'Clientes',
  hero: 'Imagem do hero',
  projetos: 'Projetos antes/depois',
  cliente: 'Clientes',
};

const visibleTabs: B2BTab[] = ['galeria', 'clientes', 'hero', 'projetos'];

export default function B2BMediaManager() {
  const [assets, setAssets] = useState<B2BAsset[]>([]);
  const [activeTab, setActiveTab] = useState<B2BTab>('galeria');
  const [editingAsset, setEditingAsset] = useState<B2BAsset | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
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
    setInputTitle(asset?.title || '');
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
    setFileToUpload(null);
    setSecondaryFileToUpload(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const section = activeTab === 'clientes' ? 'cliente' : activeTab;
    const isProject = section === 'projetos';
    const mainFileRequired = !editingAsset && !fileToUpload;

    if (mainFileRequired || (isProject && !editingAsset && !secondaryFileToUpload)) {
      setError(isProject ? 'Selecione as duas imagens do projeto.' : 'Selecione uma imagem.');
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

      if (section === 'hero' && !editingAsset) {
        const { error: deleteError } = await supabase.from('b2b_assets').delete().eq('section', 'hero');
        if (deleteError) throw deleteError;
      }

      const record = {
        section,
        url: mainUrl,
        title: inputTitle.trim() || null,
        ...(isProject ? { secondary_url: secondaryUrl || null } : {}),
      };

      const result = editingAsset
        ? await supabase.from('b2b_assets').update(record).eq('id', editingAsset.id)
        : await supabase.from('b2b_assets').insert([record]);

      if (result.error) throw result.error;
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
      const { error: deleteError } = await supabase.from('b2b_assets').delete().eq('id', asset.id);
      if (deleteError) throw deleteError;
      setAssets((current) => current.filter((item) => item.id !== asset.id));
    } catch (deleteError: any) {
      console.error('Erro ao excluir mídia B2B:', deleteError);
      setError(`Não foi possível excluir: ${deleteError.message}`);
    }
  };

  const visibleAssets = assets.filter((asset) => asset.section === (activeTab === 'clientes' ? 'cliente' : activeTab));
  const modalSection = activeTab === 'clientes' ? 'cliente' : activeTab;
  const isProjectModal = modalSection === 'projetos';

  return (
    <div className="admin-container" style={{ maxWidth: '1100px', color: 'white' }}>
      <div className="admin-header">
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Mídia B2B</h1>
          <p style={{ color: '#888', fontSize: '0.85rem', margin: '6px 0 0' }}>
            Gerencie as imagens exibidas em Soldas Especiais.
          </p>
        </div>
        <button className="btn-admin btn-adicionar" onClick={() => openModal(modalSection)}>
          <Plus size={18} /> Adicionar mídia
        </button>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
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
        <div style={{ textAlign: 'center', padding: '70px 20px', color: '#aaa' }}><Loader2 className="animate-spin" style={{ margin: '0 auto 10px' }} /> Carregando mídias...</div>
      ) : visibleAssets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: '#777', border: '2px dashed #333', borderRadius: '12px' }}>
          <ImageIcon size={42} style={{ margin: '0 auto 10px' }} />
          <p>Nenhuma mídia cadastrada nesta seção.</p>
          <button className="btn-admin btn-adicionar" onClick={() => openModal(modalSection)}>Adicionar a primeira</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isProjectModal ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: '15px' }}>
          {visibleAssets.map((asset) => (
            <article key={asset.id} style={{ background: '#111', border: '1px solid #2b2b2b', borderRadius: '10px', overflow: 'hidden' }}>
              {isProjectModal ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', padding: '5px' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '5px', overflow: 'hidden' }}>
                    <Image src={asset.url} alt="Antes" fill sizes="(max-width: 768px) 50vw, 200px" style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '5px', overflow: 'hidden' }}>
                    <Image src={asset.secondary_url || asset.url} alt="Depois" fill sizes="(max-width: 768px) 50vw, 200px" style={{ objectFit: 'cover' }} />
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', aspectRatio: activeTab === 'hero' ? '16 / 9' : '1', overflow: 'hidden' }}>
                  <Image src={asset.url} alt={asset.title || tabLabels[activeTab]} fill sizes="(max-width: 768px) 100vw, 300px" style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <strong style={{ color: '#ddd', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.title || tabLabels[activeTab]}</strong>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button aria-label="Editar mídia" title="Editar mídia" onClick={() => openModal(asset.section, asset)} className="btn-admin" style={{ background: '#222', color: 'white', padding: '8px' }}><Edit size={16} /></button>
                  <button aria-label="Excluir mídia" title="Excluir mídia" onClick={() => handleDelete(asset)} className="btn-admin" style={{ background: '#311', color: '#ff7777', padding: '8px' }}><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-admin-container visivel" style={{ zIndex: 1000 }} onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="modal-admin" style={{ maxWidth: '650px', background: '#111', border: '1px solid #333' }}>
            <button className="modal-fechar-btn" onClick={closeModal} aria-label="Fechar modal"><X size={24} /></button>
            <h2 className="titulo-secao" style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{editingAsset ? 'Editar mídia' : 'Adicionar mídia'}</h2>
            <p style={{ color: '#888', marginBottom: '20px' }}>{tabLabels[activeTab]}</p>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(modalSection === 'cliente' || isProjectModal) && (
                <div className="form-campo" style={{ marginBottom: 0 }}>
                  <label>{isProjectModal ? 'Título do projeto' : 'Nome da empresa'}</label>
                  <input value={inputTitle} onChange={(event) => setInputTitle(event.target.value)} required={isProjectModal} placeholder={isProjectModal ? 'Ex.: Recuperação de eixo' : 'Nome do cliente'} />
                </div>
              )}
              <FilePicker label={isProjectModal ? 'Foto antes' : 'Imagem'} file={fileToUpload} currentUrl={editingAsset?.url} onChange={setFileToUpload} />
              {isProjectModal && <FilePicker label="Foto depois" file={secondaryFileToUpload} currentUrl={editingAsset?.secondary_url || undefined} onChange={setSecondaryFileToUpload} />}
              {error && <p style={{ color: '#ff8888', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="button" onClick={closeModal} className="btn-admin" style={{ flex: 1, background: '#333', color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn-admin" style={{ flex: 2, background: 'var(--cor-destaque)', color: 'black' }} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} size={18} /> : editingAsset ? 'Salvar alterações' : 'Adicionar mídia'}
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
    <label className="form-campo" style={{ marginBottom: 0, border: '1px dashed #555', borderRadius: '8px', padding: '12px', cursor: 'pointer' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={17} /> {label}</span>
      <span style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginTop: '7px' }}>{file?.name || (currentUrl ? 'Imagem atual mantida. Clique para substituir.' : 'Selecione uma imagem')}</span>
      <input type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} style={{ display: 'none' }} />
    </label>
  );
}