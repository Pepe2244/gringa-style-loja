'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
}

export default function B2BMediaManager() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('galeria_b2b')
        .select('*')
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaList(data || []);
    } catch (err) {
      console.error('Erro ao buscar mídias:', err);
      alert('Erro ao carregar a galeria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('galeria_b2b')
        .insert([{ url: newUrl.trim() }]);

      if (error) throw error;
      
      setNewUrl('');
      await fetchMedia();
    } catch (err) {
      console.error('Erro ao adicionar mídia:', err);
      alert('Erro ao adicionar a imagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta imagem do portfólio?')) return;

    try {
      const { error } = await supabase
        .from('galeria_b2b')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMedia();
    } catch (err) {
      console.error('Erro ao remover mídia:', err);
      alert('Erro ao remover a imagem.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Gerenciador de Portfólio B2B</h2>
          <p className="text-sm text-zinc-400">Adicione os links das imagens (Cloudflare) para exibir na página de Soldas Especiais.</p>
        </div>
      </div>

      {/* Formulário de Adição via URL */}
      <form onSubmit={handleAddMedia} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4">
        <input 
          type="url" 
          placeholder="Cole aqui o link da imagem (ex: https://cloudflare.../imagem.jpg)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          required
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
        />
        <button 
          type="submit" 
          disabled={isSubmitting || !newUrl.trim()}
          className="bg-[#ff6b00] hover:bg-[#ff8c33] text-black px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Adicionando...' : 'Adicionar Imagem'}
        </button>
      </form>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {loading ? (
          <p className="text-zinc-400 text-center py-8">Carregando galeria...</p>
        ) : mediaList.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhuma imagem cadastrada. Adicione o primeiro link acima.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {mediaList.map((item) => (
              <div key={item.id} className="relative group bg-zinc-800 rounded-lg overflow-hidden aspect-square border border-zinc-700">
                <img src={item.url} alt="Portfólio B2B" className="w-full h-full object-cover" />
                
                {/* Overlay com botão de deletar */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white transition-transform transform hover:scale-110"
                    title="Remover Imagem"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

