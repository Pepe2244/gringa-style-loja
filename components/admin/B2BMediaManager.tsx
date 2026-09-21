'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Image as ImageIcon, Briefcase, Layers } from 'lucide-react';

interface B2BAsset {
  id: string;
  section: string; // 'hero', 'cliente', 'projeto_antes', 'projeto_depois', 'galeria'
  title?: string;
  url: string;
  secondary_url?: string; // Para o caso do 'antes e depois'
}

export default function B2BMediaManager() {
  const [assets, setAssets] = useState<B2BAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'galeria' | 'clientes' | 'hero' | 'projetos'>('galeria');

  // Estados para novos cadastros
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputSecondaryUrl, setInputSecondaryUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddAsset = async (e: React.FormEvent, sectionType: string) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const newRecord: any = {
        section: sectionType,
        url: inputUrl.trim(),
        title: inputTitle.trim() || null,
      };

      if (sectionType === 'projetos') {
        newRecord.secondary_url = inputSecondaryUrl.trim() || null;
      }

      const { error } = await supabase
        .from('b2b_assets')
        .insert([newRecord]);

      if (error) throw error;

      setInputUrl('');
      setInputTitle('');
      setInputSecondaryUrl('');
      await fetchAssets();
      alert('Ativo adicionado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar ativo:', err);
      alert('Erro ao salvar no banco de dados. Verifique se a tabela b2b_assets existe.');
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Gerenciador de Mídias e Imagens - Soldas Especiais</h2>
        <p className="text-sm text-zinc-400">Controle total sobre as imagens do Hero, Clientes, Projetos e Galeria B2B.</p>
      </div>

      {/* Abas de Navegação do Painel */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('galeria')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'galeria' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
        >
          Galeria de Obras
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'clientes' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
        >
          Carrossel de Clientes
        </button>
        <button
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'hero' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
        >
          Imagem do Hero (Topo)
        </button>
        <button
          onClick={() => setActiveTab('projetos')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'projetos' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
        >
          Projetos (Antes / Depois)
        </button>
      </div>

      {/* CONTEÚDO DA ABA: GALERIA DE OBRAS */}
      {activeTab === 'galeria' && (
        <div className="space-y-6">
          <form onSubmit={(e) => handleAddAsset(e, 'galeria')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
            <input 
              type="url" 
              placeholder="Cole o link da imagem do Cloudflare (ex: https://...)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              required
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
            />
            <button type="submit" disabled={isSubmitting} className="bg-[#ff6b00] hover:bg-[#ff8c33] text-black px-6 py-2 rounded-lg font-bold transition-colors">
              Adicionar à Galeria
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {assets.filter(a => a.section === 'galeria').map((item) => (
              <div key={item.id} className="relative group bg-zinc-800 rounded-lg overflow-hidden aspect-square border border-zinc-700">
                <img src={item.url} alt="Galeria B2B" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: CARROSSEL DE CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="space-y-6">
          <form onSubmit={(e) => handleAddAsset(e, 'cliente')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Nome da Empresa / Cliente"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
            />
            <input 
              type="url" 
              placeholder="Link do Logo (Cloudflare)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              required
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
            />
            <button type="submit" disabled={isSubmitting} className="bg-[#ff6b00] hover:bg-[#ff8c33] text-black px-6 py-2 rounded-lg font-bold transition-colors">
              Adicionar Cliente
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {assets.filter(a => a.section === 'cliente').map((item) => (
              <div key={item.id} className="relative group bg-zinc-800 p-4 rounded-lg flex flex-col items-center justify-center border border-zinc-700">
                <img src={item.url} alt={item.title || 'Cliente'} className="h-16 object-contain mb-2" />
                <span className="text-xs text-zinc-400">{item.title || 'Sem Nome'}</span>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: IMAGEM DO HERO */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <form onSubmit={(e) => handleAddAsset(e, 'hero')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
            <input 
              type="url" 
              placeholder="Link da imagem principal do topo (Cloudflare)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              required
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
            />
            <button type="submit" disabled={isSubmitting} className="bg-[#ff6b00] hover:bg-[#ff8c33] text-black px-6 py-2 rounded-lg font-bold transition-colors">
              Definir Hero
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assets.filter(a => a.section === 'hero').map((item) => (
              <div key={item.id} className="relative group bg-zinc-800 rounded-lg overflow-hidden aspect-video border border-zinc-700">
                <img src={item.url} alt="Hero B2B" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: PROJETOS (ANTES E DEPOIS) */}
      {activeTab === 'projetos' && (
        <div className="space-y-6">
          <form onSubmit={(e) => handleAddAsset(e, 'projetos')} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
            <input 
              type="text" 
              placeholder="Título do Projeto (Ex: Recuperação de Eixo)"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
            />
            <div className="flex gap-4">
              <input 
                type="url" 
                placeholder="Link da foto ANTES (Cloudflare)"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                required
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
              />
              <input 
                type="url" 
                placeholder="Link da foto DEPOIS (Cloudflare)"
                value={inputSecondaryUrl}
                onChange={(e) => setInputSecondaryUrl(e.target.value)}
                required
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#ff6b00] hover:bg-[#ff8c33] text-black py-2 rounded-lg font-bold transition-colors">
              Adicionar Par Antes/Depois
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
                  <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white">
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
