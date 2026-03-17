'use client';

import { useState, useEffect } from 'react';
// Caminhos relativos para garantir compatibilidade
import { supabase } from '../../lib/supabase';
import { Product, Category, ProductVariant } from '../../types';
import { Json } from '../../types/database.types';
import { Trash2, Edit, Plus, X, Upload, Image as ImageIcon, Video, Eraser, AlertCircle, Loader2, Package } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Campos do Formulário
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [precoPromocional, setPrecoPromocional] = useState('');
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
            console.log("Produtos carregados:", data?.length); // Debug no console do telemóvel
            setProducts(data || []);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao buscar produtos:', err);
            setError('Erro de ligação ao Supabase. Verifique a internet.');
        }
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categorias').select('*').order('nome');
        if (data) setCategories(data);
    };

    const openModal = (product: Product | null = null) => {
        setEditingProduct(product);
        if (product) {
            setNome(product.nome);
            setDescricao(product.descricao);
            setPreco(String(product.preco));
            setPrecoPromocional(product.preco_promocional ? String(product.preco_promocional) : '');
            setCategoriaId(product.categoria_id ? String(product.categoria_id) : '');
            setTags(product.tags ? product.tags.join(', ') : '');
            setEmEstoque(product.em_estoque);

            const variants = product.variants as unknown as ProductVariant | null;
            setVariantTipo(variants?.tipo || '');
            setVariantOpcoes(variants?.opcoes.join(', ') || '');
            setExistingMedia(product.media_urls || []);
        } else {
            resetForm();
        }
        setMediaFiles([]);
        setMediaPreviews([]);
        setShowModal(true);
    };

    const resetForm = () => {
        setNome('');
        setDescricao('');
        setPreco('');
        setPrecoPromocional('');
        setCategoriaId('');
        setTags('');
        setEmEstoque(true);
        setVariantTipo('');
        setVariantOpcoes('');
        setExistingMedia([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            mediaPreviews.forEach(url => URL.revokeObjectURL(url));
            setMediaFiles(files);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setMediaPreviews(newPreviews);
        }
    };

    const removeNewMedia = (index: number) => {
        const newFiles = mediaFiles.filter((_, i) => i !== index);
        const newPreviews = mediaPreviews.filter((_, i) => i !== index);
        URL.revokeObjectURL(mediaPreviews[index]);
        setMediaFiles(newFiles);
        setMediaPreviews(newPreviews);
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

        let finalMediaUrls = [...existingMedia];

        for (const file of mediaFiles) {
            let fileToUpload = file;
            if (file.type.startsWith('image/')) {
                try {
                    fileToUpload = await compressImage(file);
                } catch (error) {
                    console.error('Erro na compressão:', error);
                }
            }

            const fileExt = fileToUpload.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('gringa-style-produtos').upload(fileName, fileToUpload);

            if (uploadError) continue;

            const { data } = supabase.storage.from('gringa-style-produtos').getPublicUrl(fileName);
            finalMediaUrls.push(data.publicUrl);
        }

        const variants = (variantTipo && variantOpcoes) ? {
            tipo: variantTipo,
            opcoes: variantOpcoes.split(',').map(s => s.trim()).filter(Boolean)
        } : null;

        const generatedSlug = nome.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const productData = {
            nome,
            slug: generatedSlug,
            descricao,
            preco: parseFloat(preco),
            preco_promocional: precoPromocional ? parseFloat(precoPromocional) : null,
            categoria_id: categoriaId ? parseInt(categoriaId) : null,
            tags: tags.split(',').map(s => s.trim()).filter(Boolean),
            em_estoque,
            media_urls: finalMediaUrls,
            variants: variants as unknown as Json
        };

        try {
            if (editingProduct) {
                const { error } = await supabase.from('produtos').update(productData as any).eq('id', editingProduct.id);
                if (error) throw error;
                alert('Produto atualizado!');
            } else {
                const { data, error } = await supabase.from('produtos').insert([productData as any]).select().single();
                if (error) throw error;
                alert('Produto criado!');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir este produto?')) return;
        await supabase.from('produtos').delete().eq('id', id);
        fetchProducts();
    };

    const toggleStock = async (id: number, currentStatus: boolean) => {
        await supabase.from('produtos').update({ em_estoque: !currentStatus }).eq('id', id);
        fetchProducts();
    };

    return (
        <div className="admin-container" style={{ paddingBottom: '100px' }}>
            <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Gestão de Inventário</h1>
                    <p style={{ color: '#888', fontSize: '0.8rem' }}>{products.length} produtos encontrados</p>
                </div>
                <button className="btn-admin btn-adicionar" onClick={() => openModal()} style={{ borderRadius: '50px', padding: '10px 20px' }}>
                    <Plus size={18} /> <span className="hide-mobile">Novo</span>
                </button>
            </div>

            {loading && products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: 'white' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto' }} size={40} />
                    <p style={{ marginTop: '10px' }}>Sincronizando dados...</p>
                </div>
            ) : error ? (
                <div style={{ background: '#300', border: '1px solid red', padding: '20px', borderRadius: '10px', color: '#ff8888', textAlign: 'center' }}>
                    <AlertCircle style={{ margin: '0 auto 10px' }} />
                    <p>{error}</p>
                    <button onClick={() => fetchProducts()} style={{ marginTop: '10px', background: 'red', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px' }}>Reatentar</button>
                </div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666', border: '2px dashed #222', borderRadius: '15px' }}>
                    <Package size={48} style={{ marginBottom: '10px' }} />
                    <p>A vitrine está vazia. Comece a adicionar produtos.</p>
                </div>
            ) : (
                <>
                    {/* LISTA MOBILE - FORÇADA */}
                    <div className="admin-mobile-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {products.map(prod => (
                            <div key={prod.id} style={{ background: '#111', padding: '15px', borderRadius: '12px', border: '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1.1rem' }}>{prod.nome}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.7rem', color: prod.em_estoque ? '#00ff88' : '#ff4444' }}>
                                            {prod.em_estoque ? 'STOCK OK' : 'ESGOTADO'}
                                        </span>
                                        <label className="switch" style={{ transform: 'scale(0.7)' }}>
                                            <input type="checkbox" checked={prod.em_estoque} onChange={() => toggleStock(prod.id, prod.em_estoque)} />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '15px' }}>
                                    <p style={{ margin: '2px 0' }}><strong>Preço:</strong> R$ {prod.preco.toFixed(2)}</p>
                                    {prod.preco_promocional && <p style={{ margin: '2px 0', color: '#00ff88' }}><strong>Promo:</strong> R$ {prod.preco_promocional.toFixed(2)}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => openModal(prod)} style={{ flex: 1, padding: '10px', background: '#333', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold' }}>Editar</button>
                                    <button onClick={() => handleDelete(prod.id)} style={{ padding: '10px', background: '#200', border: 'none', borderRadius: '6px', color: '#ff4444' }}><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* TABELA DESKTOP (Normalmente escondida no CSS em mobile) */}
                    <table className="admin-tabela hide-mobile">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Preço</th>
                                <th>Estoque</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(prod => (
                                <tr key={prod.id}>
                                    <td>{prod.nome}</td>
                                    <td>R$ {prod.preco.toFixed(2)}</td>
                                    <td>
                                        <label className="switch">
                                            <input type="checkbox" checked={prod.em_estoque} onChange={() => toggleStock(prod.id, prod.em_estoque)} />
                                            <span className="slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div className="acoes-btn">
                                            <button className="btn-admin-acao btn-editar" onClick={() => openModal(prod)}>Editar</button>
                                            <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(prod.id)}>Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {showModal && (
                <div className="modal-admin-container visivel" style={{ zIndex: 1000 }}>
                    <div className="modal-admin" style={{ maxHeight: '90vh', overflowY: 'auto', padding: '20px' }}>
                        <button className="modal-fechar-btn" onClick={() => setShowModal(false)} style={{ fontSize: '2rem' }}>&times;</button>
                        <h2 className="titulo-secao" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>{editingProduct ? 'Editar' : 'Novo'} Produto</h2>

                        <form onSubmit={handleSave}>
                            <div className="form-campo">
                                <label>Nome</label>
                                <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-campo">
                                    <label>Preço</label>
                                    <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} required />
                                </div>
                                <div className="form-campo">
                                    <label>Categoria</label>
                                    <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} required>
                                        <option value="">Escolher...</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-campo">
                                <label>Descrição</label>
                                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} required rows={3} style={{ width: '100%', borderRadius: '8px', padding: '10px' }} />
                            </div>

                            <div className="form-campo">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label>Mídias ({existingMedia.length + mediaFiles.length})</label>
                                    {existingMedia.length > 0 && (
                                        <button type="button" onClick={clearAllExistingMedia} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>Limpar Tudo</button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#000', padding: '10px', borderRadius: '8px' }}>
                                    {existingMedia.map((url, i) => (
                                        <div key={i} style={{ position: 'relative', aspectRatio: '1/1' }}>
                                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                            <button type="button" onClick={() => removeExistingMedia(url)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', borderRadius: '50%', color: 'white', border: 'none', width: '20px', height: '20px', fontSize: '10px' }}>X</button>
                                        </div>
                                    ))}
                                    {mediaPreviews.map((url, i) => (
                                        <div key={i} style={{ position: 'relative', aspectRatio: '1/1' }}>
                                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', opacity: 0.6 }} />
                                            <button type="button" onClick={() => removeNewMedia(i)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#00ff88', borderRadius: '50%', color: 'black', border: 'none', width: '20px', height: '20px', fontSize: '10px' }}>X</button>
                                        </div>
                                    ))}
                                    <label style={{ border: '2px dashed #333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', aspectRatio: '1/1' }}>
                                        <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        <Plus size={20} color="#666" />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-admin" style={{ flex: 1, background: '#444' }}>Sair</button>
                                <button type="submit" className="btn-admin" style={{ flex: 2, background: 'var(--cor-destaque)', color: 'black' }} disabled={loading}>
                                    {loading ? 'A Gravar...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                @media (max-width: 768px) {
                    .hide-mobile { display: none !important; }
                    .admin-mobile-list { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .admin-mobile-list { display: none !important; }
                }
            `}</style>
        </div>
    );
}