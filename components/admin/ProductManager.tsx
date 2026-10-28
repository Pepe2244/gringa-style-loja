'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// Caminhos relativos para compatibilidade com o ambiente atual
import { supabase } from '../../lib/supabase';
import { Product, Category, ProductVariant } from '../../types';
import { Trash2, Edit, Plus, AlertCircle, Loader2, Package, Tag, Settings2, RefreshCw } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';
import { getProxiedImageUrl } from '../../utils/imageUrl';
import { deleteProduct, saveProduct, setProductStock } from '@/app/actions/admin-data';
import { revalidateProductCache } from '@/app/actions/produtos';
import { slugify, getCanonicalProductSlug } from '@/utils/slugify';

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncingCache, setSyncingCache] = useState(false);

    // Campos do Formulário Restaurados
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [precoPromocional, setPrecoPromocional] = useState('');
    const [precoPix, setPrecoPix] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [tags, setTags] = useState('');
    const [em_estoque, setEmEstoque] = useState(true);
    const [variantTipo, setVariantTipo] = useState('');
    const [variantOpcoes, setVariantOpcoes] = useState('');

    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [existingMedia, setExistingMedia] = useState<string[]>([]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchProducts(), fetchCategories()]);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error: fetchError } = await supabase.from('produtos').select('*').order('id');
            if (fetchError) throw fetchError;
            setProducts(data || []);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao buscar produtos:', err);
            setError('Falha na ligação com o banco de dados.');
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase.from('categorias').select('*').order('nome');
            if (error) throw error;
            if (data) setCategories(data);
        } catch (err: any) {
            console.error('Erro ao buscar categorias:', err);
        }
    };

    const openModal = (product: Product | null = null) => {
        setEditingProduct(product);
        if (product) {
            setNome(product.nome || '');
            setDescricao(product.descricao || '');
            setPreco(product.preco != null ? String(product.preco) : '');
            setPrecoPromocional(product.preco_promocional != null ? String(product.preco_promocional) : '');
            setPrecoPix(product.preco_pix != null ? String(product.preco_pix) : '');
            setCategoriaId(product.categoria_id != null ? String(product.categoria_id) : '');
            setTags(product.tags ? product.tags.join(', ') : '');
            setEmEstoque(Boolean(product.em_estoque));

            const variants = product.variants as unknown as ProductVariant | null;
            setVariantTipo(variants?.tipo || '');
            setVariantOpcoes(variants?.opcoes?.join(', ') || '');
            const medias = (Array.isArray(product.media_urls) && product.media_urls.length > 0)
                ? product.media_urls
                : (Array.isArray(product.imagens) ? product.imagens : []);
            setExistingMedia(medias);
        } else {
            resetFormFields();
        }
        mediaPreviews.forEach(url => URL.revokeObjectURL(url));
        setMediaFiles([]);
        setMediaPreviews([]);
        setShowModal(true);
    };

    const closeModal = () => {
        mediaPreviews.forEach(url => URL.revokeObjectURL(url));
        setMediaFiles([]);
        setMediaPreviews([]);
        setShowModal(false);
    };

    const resetFormFields = () => {
        setNome('');
        setDescricao('');
        setPreco('');
        setPrecoPromocional('');
        setPrecoPix('');
        setCategoriaId('');
        setTags('');
        setEmEstoque(true);
        setVariantTipo('');
        setVariantOpcoes('');
        setExistingMedia([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setMediaFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewMedia = (index: number) => {
        const previewToRemove = mediaPreviews[index];
        if (previewToRemove) {
            URL.revokeObjectURL(previewToRemove);
        }
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (urlToRemove: string) => {
        setExistingMedia(prev => prev.filter(url => url !== urlToRemove));
    };

    const clearAllExistingMedia = () => {
        if (confirm('Remover todas as fotos atuais?')) setExistingMedia([]);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const finalMediaUrls = [...existingMedia];

        for (const file of mediaFiles) {
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

            try {
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
                if (result.url) {
                    finalMediaUrls.push(result.url);
                }
            } catch (uploadErr: any) {
                console.error('Erro ao enviar imagem:', uploadErr);
                alert(`Erro ao subir imagem: ${uploadErr.message}. O produto não foi salvo para evitar inconsistência nas mídias.`);
                setLoading(false);
                return;
            }
        }

        const trimmedTipo = variantTipo.trim();
        const trimmedOpcoes = variantOpcoes.split(',').map(s => s.trim()).filter(Boolean);
        const variants = (trimmedTipo && trimmedOpcoes.length > 0) ? {
            tipo: trimmedTipo,
            opcoes: trimmedOpcoes
        } : null;

        const generatedSlug = editingProduct && editingProduct.nome === nome && editingProduct.slug
            ? getCanonicalProductSlug({ id: editingProduct.id, nome, slug: editingProduct.slug })
            : slugify(nome);

        const parsedPreco = parseFloat(preco.replace(',', '.'));
        const parsedPromo = precoPromocional.trim() ? parseFloat(precoPromocional.replace(',', '.')) : null;
        const parsedPix = precoPix.trim() ? parseFloat(precoPix.replace(',', '.')) : null;

        if (isNaN(parsedPreco) || parsedPreco <= 0) {
            alert('Por favor, informe um Preço Base válido maior que zero.');
            setLoading(false);
            return;
        }

        if (parsedPromo !== null && !isNaN(parsedPromo) && parsedPromo >= parsedPreco) {
            const prosseguir = confirm(
                `Atenção: O Preço Promocional (R$ ${parsedPromo.toFixed(2)}) é MAIOR ou IGUAL ao Preço Base (R$ ${parsedPreco.toFixed(2)}).\n\nPara que a promoção "De R$ 450 por R$ 420" funcione na vitrine, o Preço Base deve ser o maior (ex: 450) e o Promocional deve ser o menor (ex: 420).\n\nDeseja salvar mesmo assim?`
            );
            if (!prosseguir) {
                setLoading(false);
                return;
            }
        }

        const productData = {
            nome,
            slug: generatedSlug,
            descricao,
            preco: parsedPreco,
            preco_promocional: parsedPromo,
            preco_pix: parsedPix,
            categoria_id: categoriaId ? parseInt(categoriaId) : null,
            tags: tags.split(',').map(s => s.trim()).filter(Boolean),
            em_estoque,
            media_urls: finalMediaUrls,
            variants
        };

        try {
            const result = await saveProduct(productData, editingProduct?.id);
            if (!result.success) throw new Error(result.error);
            alert(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
            closeModal();
            fetchProducts();
        } catch (error: any) {
            console.error('Erro ao salvar produto:', error);
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este produto definitivamente? A ação não pode ser desfeita.')) return;

        // Atualização Otimista: Remove da UI imediatamente para sensação de fluidez
        const previousProducts = [...products];
        setProducts(products.filter(p => p.id !== id));

        try {
            const result = await deleteProduct(id);
            if (!result.success) throw new Error(result.error);

            // Feedback silencioso (opcional, pode usar um toast aqui se preferir)
            console.log(`Produto ${id} excluído com sucesso e cache limpo.`);
        } catch (error: any) {
            console.error('Erro na exclusão do produto:', error);
            alert(`Falha ao excluir o produto: ${error.message}`);
            // Reverte a atualização otimista caso falhe
            setProducts(previousProducts);
        }
    };

    const toggleStock = async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        // Atualização otimista
        setProducts(products.map(p => p.id === id ? { ...p, em_estoque: newStatus } : p));

        try {
            const result = await setProductStock(id, newStatus);
            if (!result.success) throw new Error(result.error);
        } catch (error: any) {
            console.error('Erro ao alterar estoque:', error);
            alert('Falha ao atualizar o status de estoque.');
            // Reverte a atualização otimista caso falhe
            setProducts(products.map(p => p.id === id ? { ...p, em_estoque: currentStatus } : p));
        }
    };

    const handleSyncCache = async () => {
        setSyncingCache(true);
        try {
            const res = await revalidateProductCache();
            if (res.success) {
                alert('Cache da loja e do site sincronizado com sucesso! Todas as páginas foram atualizadas.');
            } else {
                alert(`Erro ao sincronizar cache: ${res.error}`);
            }
        } catch (err: any) {
            alert(`Falha na sincronização: ${err.message}`);
        } finally {
            setSyncingCache(false);
        }
    };

    return (
        <div className="admin-container" style={{ paddingBottom: '100px' }}>
            <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Gestão Gringa Style</h1>
                    <p style={{ color: '#888', fontSize: '0.8rem' }}>{products.length} itens no inventário</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleSyncCache}
                        disabled={syncingCache}
                        style={{
                            borderRadius: '50px',
                            padding: '10px 18px',
                            background: '#222',
                            border: '1px solid #444',
                            color: '#FFA500',
                            cursor: syncingCache ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}
                        title="Força a atualização imediata de todo o cache do site e vitrine"
                    >
                        <RefreshCw size={16} className={syncingCache ? "animate-spin" : ""} />
                        <span>{syncingCache ? 'Sincronizando...' : 'Sincronizar Site'}</span>
                    </button>
                    <button className="btn-admin btn-adicionar" onClick={() => openModal()} style={{ borderRadius: '50px', padding: '10px 20px' }}>
                        <Plus size={18} /> <span>Novo</span>
                    </button>
                </div>
            </div>

            {loading && products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: 'white' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto' }} size={40} />
                    <p style={{ marginTop: '10px' }}>Sincronizando banco de dados...</p>
                </div>
            ) : error ? (
                <div style={{ background: '#300', border: '1px solid red', padding: '20px', borderRadius: '10px', color: '#ff8888', textAlign: 'center' }}>
                    <AlertCircle style={{ margin: '0 auto 10px' }} />
                    <p>{error}</p>
                    <button onClick={() => fetchProducts()} style={{ marginTop: '10px', background: 'red', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Recarregar</button>
                </div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666', border: '2px dashed #222', borderRadius: '15px' }}>
                    <Package size={48} style={{ margin: '0 auto 10px' }} />
                    <p>Nenhum produto encontrado. Adicione o primeiro.</p>
                </div>
            ) : (
                <>
                    <div className="admin-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {products.map(prod => (
                            <div key={prod.id} style={{ background: '#111', padding: '12px 16px', borderRadius: '12px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1rem' }}>{prod.nome}</h3>
                                    <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {prod.preco_promocional && prod.preco_promocional < prod.preco ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ textDecoration: 'line-through', color: '#777' }}>R$ {prod.preco.toFixed(2)}</span>
                                                <span style={{ color: '#00ff88', fontWeight: 'bold', background: 'rgba(0, 255, 136, 0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                                                    Por R$ {prod.preco_promocional.toFixed(2)} (PROMO)
                                                </span>
                                            </span>
                                        ) : (
                                            <span style={{ color: '#eee' }}>R$ {prod.preco.toFixed(2)}</span>
                                        )}
                                        {prod.preco_pix ? <span style={{ color: '#00d2ff' }}>| PIX R$ {prod.preco_pix.toFixed(2)}</span> : null}
                                        <span style={{ color: prod.em_estoque ? '#4ade80' : '#f87171' }}>
                                            | {prod.em_estoque ? 'Em Estoque' : 'Esgotado'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label className="switch" style={{ transform: 'scale(0.7)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={prod.em_estoque} onChange={() => toggleStock(prod.id, prod.em_estoque)} />
                                        <span className="slider"></span>
                                    </label>
                                    <button onClick={() => openModal(prod)} style={{ background: '#222', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(prod.id)} style={{ background: '#311', border: 'none', color: '#ff4444', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {showModal && (
                <div className="modal-admin-container visivel" style={{ zIndex: 1000 }}>
                    <div className="modal-admin" style={{ maxHeight: '95vh', overflowY: 'auto', padding: '20px', background: '#111', borderRadius: '15px', width: '95%', maxWidth: '600px' }}>
                        <button className="modal-fechar-btn" onClick={closeModal} style={{ fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                        <h2 className="titulo-secao" style={{ fontSize: '1.3rem', marginBottom: '20px' }}>{editingProduct ? 'Editar' : 'Novo'} Produto</h2>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-campo">
                                <label>Nome do Item</label>
                                <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div className="form-campo">
                                    <label>Preço Base / &quot;De&quot; (R$)</label>
                                    <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} placeholder="Ex: 450.00" required />
                                    <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>Preço normal do item</small>
                                </div>
                                <div className="form-campo">
                                    <label>Preço Promo / &quot;Por&quot; (R$)</label>
                                    <input type="number" step="0.01" value={precoPromocional} onChange={e => setPrecoPromocional(e.target.value)} placeholder="Ex: 420.00" />
                                    <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>Vazio se não for promo</small>
                                </div>
                                <div className="form-campo">
                                    <label>Preço PIX (Opcional)</label>
                                    <input type="number" step="0.01" value={precoPix} onChange={e => setPrecoPix(e.target.value)} placeholder="Ex: 79.90" />
                                    <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '3px', display: 'block' }}>Valor à vista via PIX</small>
                                </div>
                            </div>

                            {(() => {
                                const pBase = parseFloat(preco.replace(',', '.'));
                                const pPromo = precoPromocional.trim() ? parseFloat(precoPromocional.replace(',', '.')) : null;
                                if (!isNaN(pBase) && pBase > 0 && pPromo !== null && !isNaN(pPromo)) {
                                    if (pPromo < pBase) {
                                        const pct = Math.round(((pBase - pPromo) / pBase) * 100);
                                        return (
                                            <div style={{ background: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.4)', padding: '10px 14px', borderRadius: '8px', color: '#00ff88', fontSize: '0.85rem' }}>
                                                ✨ <strong>Promoção Ativa na Loja:</strong> De <del style={{ color: '#888' }}>R$ {pBase.toFixed(2)}</del> por <strong>R$ {pPromo.toFixed(2)}</strong> ({pct}% OFF na vitrine)
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div style={{ background: 'rgba(255, 165, 0, 0.1)', border: '1px solid rgba(255, 165, 0, 0.5)', padding: '10px 14px', borderRadius: '8px', color: '#ffb347', fontSize: '0.85rem' }}>
                                                ⚠️ <strong>Atenção:</strong> Para ativar o desconto, o Preço Promo (Por) deve ser <strong>menor</strong> que o Preço Base (De R$ {pBase.toFixed(2)}).
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })()}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-campo">
                                    <label>Categoria</label>
                                    <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} required>
                                        <option value="">Selecionar...</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                                    </select>
                                </div>
                                <div className="form-campo">
                                    <label>Em Estoque?</label>
                                    <div style={{ display: 'flex', alignItems: 'center', height: '45px' }}>
                                        <label className="switch" style={{ cursor: 'pointer' }}>
                                            <input type="checkbox" checked={em_estoque} onChange={e => setEmEstoque(e.target.checked)} />
                                            <span className="slider"></span>
                                        </label>
                                        <span style={{ marginLeft: '10px', fontSize: '0.9rem' }}>{em_estoque ? 'Sim' : 'Não'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-campo">
                                <label>Descrição Curta</label>
                                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} required rows={3} />
                            </div>

                            <div className="form-campo">
                                <label><Tag size={14} /> Tags (separadas por vírgula)</label>
                                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="ex: tig, protecao, mascara" />
                            </div>

                            <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#888' }}><Settings2 size={14} /> Variantes (Opcional)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
                                    <input type="text" value={variantTipo} onChange={e => setVariantTipo(e.target.value)} placeholder="Tipo (ex: Tamanho)" style={{ fontSize: '0.8rem' }} />
                                    <input type="text" value={variantOpcoes} onChange={e => setVariantOpcoes(e.target.value)} placeholder="Opções (P, M, G)" style={{ fontSize: '0.8rem' }} />
                                </div>
                            </div>

                            <div className="form-campo">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label>Imagens/Vídeos ({existingMedia.length + mediaFiles.length})</label>
                                    {existingMedia.length > 0 && (
                                        <button type="button" onClick={clearAllExistingMedia} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Resetar Fotos</button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#000', padding: '8px', borderRadius: '8px' }}>
                                    {existingMedia.map((url, i) => (
                                        <div key={`ex-${i}`} style={{ position: 'relative', aspectRatio: '1/1' }}>
                                            <Image src={getProxiedImageUrl(url)} alt="Imagem do produto" width={160} height={160} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--cor-destaque)' }} />
                                            <button type="button" onClick={() => removeExistingMedia(url)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', borderRadius: '50%', color: 'white', border: 'none', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}>&times;</button>
                                        </div>
                                    ))}
                                    {mediaPreviews.map((url, i) => (
                                        <div key={`nw-${i}`} style={{ position: 'relative', aspectRatio: '1/1' }}>
                                            <Image src={url} alt="Pré-visualização da imagem" width={160} height={160} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #00ff88', opacity: 0.8 }} />
                                            <button type="button" onClick={() => removeNewMedia(i)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#00ff88', borderRadius: '50%', color: 'black', border: 'none', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}>&times;</button>
                                        </div>
                                    ))}
                                    <label style={{ border: '1px dashed #444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', aspectRatio: '1/1' }}>
                                        <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        <Plus size={20} color="#666" />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={closeModal} className="btn-admin" style={{ flex: 1, background: '#333', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" className="btn-admin" style={{ flex: 2, background: 'var(--cor-destaque)', color: 'black', fontWeight: 'bold', cursor: 'pointer' }} disabled={loading}>
                                    {loading ? 'A Guardar...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}