'use client';

import { useState, useEffect } from 'react';

export default function B2BMediaManager() {
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) {
        const data = await res.json();
        const images = data.flatMap((p: any) => p.imagens || []).filter(Boolean);
        setMediaList(images);
      }
    } catch (err) {
      console.error('Erro ao buscar mídias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchMedia();
      } else {
        alert('Falha no upload do arquivo.');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Gerenciador de Mídia B2B</h2>
          <p className="text-sm text-zinc-400">Gerencie os ativos visuais e catálogos para o canal B2B.</p>
        </div>
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {uploading ? 'Enviando...' : 'Adicionar Nova Mídia'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*,application/pdf" />
        </label>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {loading ? (
          <p className="text-zinc-400 text-center py-8">Carregando mídias...</p>
        ) : mediaList.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhuma mídia cadastrada no sistema.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {mediaList.map((url, index) => (
              <div key={index} className="relative group bg-zinc-800 rounded-lg overflow-hidden aspect-square border border-zinc-700">
                <img src={url} alt={`Mídia B2B ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-xs text-white break-all">
                  {url}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}