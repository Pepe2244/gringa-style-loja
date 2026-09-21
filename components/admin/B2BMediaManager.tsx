'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';

interface B2BAsset {
id: string;
section: string; // 'hero', 'cliente', 'projetos', 'galeria'
title?: string;
url: string;
secondary_url?: string;
}

export default function B2BMediaManager() {
const [assets, setAssets] = useState<B2BAsset[]>([]);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState<'galeria' | 'clientes' | 'hero' | 'projetos'>('galeria');

// Formulários
const [inputTitle, setInputTitle] = useState('');
const [fileToUpload, setFileToUpload] = useState<File | null>(null);
const [secondaryFileToUpload, setSecondaryFileToUpload] = useState<File | null>(null); // Para Antes/Depois
const [uploading, setUploading] = useState(false);

const fetchAssets = async () => {
setLoading(true);
try {
const { data, error } = await supabase
.from('b2b_assets')
.select('*')
.order('created_at', { ascending: false });

  if (error) throw error;
  setAssets(data || []);
} catch (err) {
  console.error('Erro ao buscar ativos B2B:', err);
} finally {
  setLoading(false);
}


};

useEffect(() => {
fetchAssets();
}, []);

// Função auxiliar para comprimir e enviar arquivo para o Cloudflare via /api/upload
const uploadFileToCloudflare = async (file: File): Promise<string> => {
let fileToUpload: File = file;
let fileName = file.name;

if (file.type.startsWith('image/')) {
  try {
    const compressedBlob = await compressImage(file);
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
    fileName = `${baseName}.webp`;
    fileToUpload = new File([compressedBlob], fileName, { type: 'image/webp' });
  } catch (error) {
    console.error('Erro na compressão:', error);
  }
}

const formData = new FormData();
formData.append('file', fileToUpload, fileName);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

if (!response.ok) {
  const errData = await response.json().catch(() => ({}));
  throw new Error(errData.error || `HTTP ${response.status}: Falha no upload`);
}

const result = await response.json();
if (!result.url) throw new Error('A API de upload não retornou a URL da imagem.');
return result.url;


};

const handleSaveAsset = async (e: React.FormEvent, sectionType: string) => {
e.preventDefault();
if (!fileToUpload && sectionType !== 'projetos') {
alert('Selecione um arquivo de imagem.');
return;
}

setUploading(true);
try {
  let mainUrl = '';
  let secondaryUrl = '';

  if (fileToUpload) {
    mainUrl = await uploadFileToCloudflare(fileToUpload);
  }

  if (sectionType === 'projetos' && secondaryFileToUpload) {
    secondaryUrl = await uploadFileToCloudflare(secondaryFileToUpload);
  }

  // Se for o Hero, removemos o anterior ou atualizamos para manter apenas 1 ativo principal no topo
  if (sectionType === 'hero') {
    await supabase.from('b2b_assets').delete().eq('section', 'hero');
  }

  const newRecord: any = {
    section: sectionType,
    url: mainUrl,
    title: inputTitle.trim() || null,
  };

  if (sectionType === 'projetos') {
    if (secondaryUrl) newRecord.secondary_url = secondaryUrl;
  }

  const { error } = await supabase.from('b2b_assets').insert([newRecord]);
  if (error) throw error;

  // Limpar campos
  setFileToUpload(null);
  setSecondaryFileToUpload(null);
  setInputTitle('');
  await fetchAssets();
  alert('Imagem enviada e salva com sucesso!');
} catch (err: any) {
  console.error('Erro ao salvar:', err);
  alert(`Erro ao salvar: ${err.message}`);
} finally {
  setUploading(false);
}


};

const handleDelete = async (id: string) => {
if (!window.confirm('Deseja realmente remover este elemento?')) return;

try {
  const { error } = await supabase
    .from('b2b_assets')
    .delete()
    .eq('id', id);

  if (error) throw error;
  await fetchAssets();
} catch (err) {
  console.error('Erro ao excluir:', err);
  alert('Erro ao excluir o item.');
}


};

return (
<div className="space-y-6" style={{ color: 'white' }}>

Gerenciador Visual - Soldas Especiais
Faça upload de arquivos do seu dispositivo para atualizar automaticamente o site B2B.


  {/* Abas */}
  <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
    <button
      onClick={() => setActiveTab('galeria')}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab === 'galeria' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
    >
      Galeria de Obras
    </button>
    <button
      onClick={() => setActiveTab('clientes')}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab === 'clientes' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
    >
      Carrossel de Clientes
    </button>
    <button
      onClick={() => setActiveTab('hero')}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab === 'hero' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
    >
      Imagem do Hero (Topo)
    </button>
    <button
      onClick={() => setActiveTab('projetos')}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${activeTab === 'projetos' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
    >
      Projetos (Antes / Depois)
    </button>
  </div>

  {/* GALERIA */}
  {activeTab === 'galeria' && (
    <div className="space-y-6">
      <form onSubmit={(e) => handleSaveAsset(e, 'galeria')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-lg p-4 cursor-pointer hover:border-[#ff6b00] transition-colors w-full">
          <Upload size={20} />
          <span className="text-sm truncate">{fileToUpload ? fileToUpload.name : 'Escolher imagem para a Galeria...'}</span>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setFileToUpload(e.target.files[0])} className="hidden" />
        </label>
        <button type="submit" disabled={uploading || !fileToUpload} className="bg-[#ff6b00] hover:bg-[#ff8c33] text-black px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer w-full md:w-auto">
          {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Imagem'}
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {assets.filter(a => a.section === 'galeria').map((item) => (
          <div key={item.id} className="relative group bg-zinc-800 rounded-lg overflow-hidden aspect-square border border-zinc-700">
            <img src={item.url} alt="Galeria B2B" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white cursor-pointer">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* CLIENTES */}
  {activeTab === 'clientes' && (
    <div className="space-y-6">
      <form onSubmit={(e) => handleSaveAsset(e, 'cliente')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          placeholder="Nome da Empresa / Cliente"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff6b00] w-full md:w-1/3"
        />
        <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-lg p-4 cursor-pointer hover:border-[#ff6b00] transition-colors w-full">
          <Upload size={20} />
          <span className="text-sm truncate">{fileToUpload ? fileToUpload.name : 'Escolher Logo do Cliente...'}</span>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setFileToUpload(e.target.files[0])} className="hidden" />
        </label>
        <button type="submit" disabled={uploading || !fileToUpload} className="bg-[#ff6b00] hover:bg-[#ff8c33] text-black px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer w-full md:w-auto">
          {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Adicionar Logo'}
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {assets.filter(a => a.section === 'cliente').map((item) => (
          <div key={item.id} className="relative group bg-zinc-800 p-4 rounded-lg flex flex-col items-center justify-center border border-zinc-700">
            <img src={item.url} alt={item.title || 'Cliente'} className="h-16 object-contain mb-2" />
            <span className="text-xs text-zinc-400">{item.title || 'Sem Nome'}</span>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white cursor-pointer">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* HERO */}
  {activeTab === 'hero' && (
    <div className="space-y-6">
      <form onSubmit={(e) => handleSaveAsset(e, 'hero')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-lg p-4 cursor-pointer hover:border-[#ff6b00] transition-colors w-full">
          <Upload size={20} />
          <span className="text-sm truncate">{fileToUpload ? fileToUpload.name : 'Escolher nova Imagem Principal (Hero)...'}</span>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setFileToUpload(e.target.files[0])} className="hidden" />
        </label>
        <button type="submit" disabled={uploading || !fileToUpload} className="bg-[#ff6b00] hover:bg-[#ff8c33] text-black px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer w-full md:w-auto">
          {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Atualizar Hero'}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assets.filter(a => a.section === 'hero').map((item) => (
          <div key={item.id} className="relative group bg-zinc-800 rounded-lg overflow-hidden aspect-video border border-zinc-700">
            <img src={item.url} alt="Hero B2B" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white cursor-pointer">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* PROJETOS (ANTES E DEPOIS) */}
  {activeTab === 'projetos' && (
    <div className="space-y-6">
      <form onSubmit={(e) => handleSaveAsset(e, 'projetos')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <input 
          type="text" 
          placeholder="Título do Projeto (Ex: Recuperação de Eixo)"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff6b00]"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-lg p-4 cursor-pointer hover:border-[#ff6b00] transition-colors">
            <span className="text-xs text-zinc-400 font-bold">FOTO ANTES</span>
            <span className="text-sm truncate">{fileToUpload ? fileToUpload.name : 'Selecionar arquivo...'}</span>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setFileToUpload(e.target.files[0])} className="hidden" />
          </label>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-lg p-4 cursor-pointer hover:border-[#ff6b00] transition-colors">
            <span className="text-xs text-zinc-400 font-bold">FOTO DEPOIS</span>
            <span className="text-sm truncate">{secondaryFileToUpload ? secondaryFileToUpload.name : 'Selecionar arquivo...'}</span>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setSecondaryFileToUpload(e.target.files[0])} className="hidden" />
          </label>
        </div>
        <button type="submit" disabled={uploading || !fileToUpload || !secondaryFileToUpload} className="w-full bg-[#ff6b00] hover:bg-[#ff8c33] text-black py-3 rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer">
          {uploading ? <Loader2 className="animate-spin inline" size={20} /> : 'Adicionar Projeto Antes/Depois'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.filter(a => a.section === 'projetos').map((item) => (
          <div key={item.id} className="relative group bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-2">
            <h4 className="font-bold text-white text-lg">{item.title || 'Projeto Industrial'}</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Antes</span>
                <img src={item.url} alt="Antes" className="w-full h-32 object-cover rounded" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Depois</span>
                <img src={item.secondary_url || ''} alt="Depois" className="w-full h-32 object-cover rounded" />
              </div>
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white cursor-pointer">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>


);
}