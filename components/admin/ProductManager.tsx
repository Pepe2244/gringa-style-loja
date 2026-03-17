'use client';

import { useState, useEffect } from 'react';
// Correção de caminhos para resolver erros de compilação
import { supabase } from '../../lib/supabase';
import { Product, Category, ProductVariant } from '../../types';
import { Json } from '../../types/database.types';
import { Trash2, Edit, Plus, X, Upload, Image as ImageIcon, Video, Eraser } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);

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
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase.from('produtos').select('*').order('id');
        if (error) {
            console.error('Erro ao buscar produtos:', error);
        }
        if (data) setProducts(data);
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase.from('categorias').select('*').order('nome');
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

            // Limpa previews anteriores para evitar fugas de memória
            mediaPreviews.forEach(url => URL.revokeObjectURL(url));

            // ESTRATÉGIA: Substitui a seleção pendente em vez de acumular
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
        if (confirm('Remover todas as fotos atuais do produto?')) {
            setExistingMedia([]);
        }
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
            alert(`Erro crítico: ${error.message}`);
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
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Gerenciar Produtos</h1>
                <button className="btn-admin btn-adicionar" onClick={() => openModal()}>
                    <Plus size={18} style={{ marginRight: '5px' }} /> Novo Produto
                </button>
            </div>

            <table className="admin-tabela">
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

            {showModal && (
                <div className="modal-admin-container visivel">
                    <div className="modal-admin">
                        <button className="modal-fechar-btn" onClick={() => setShowModal(false)}>&times;</button>
                        <h2 className="titulo-secao">{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</h2>

                        <form onSubmit={handleSave}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-campo">
                                    <label>Nome</label>
                                    <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                                </div>
                                <div className="form-campo">
                                    <label>Categoria</label>
                                    <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} required>
                                        <option value="">Selecione...</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-campo">
                                <label>Descrição</label>
                                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} required rows={3} />
                            </div>

                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-campo">
                                    <label>Preço</label>
                                    <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} required />
                                </div>
                                <div className="form-campo">
                                    <label>Preço Promo</label>
                                    <input type="number" step="0.01" value={precoPromocional} onChange={e => setPrecoPromocional(e.target.value)} />
                                </div>
                            </div>

                            <div className="form-campo" style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ fontWeight: 'bold' }}>Mídias do Produto ({existingMedia.length + mediaFiles.length})</label>
                                    {existingMedia.length > 0 && (
                                        <button type="button" onClick={clearAllExistingMedia} className="btn-admin" style={{ background: '#ff4444', fontSize: '0.8rem', padding: '5px 10px' }}>
                                            <Eraser size={14} /> Limpar Atuais
                                        </button>
                                    )}
                                </div>

                                <div className="media-management-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', background: '#222', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                                    {existingMedia.map((url, i) => (
                                        <div key={`existing-${i}`} style={{ position: 'relative', aspectRatio: '1/1' }}>
                                            <img src={url} className="preview-img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '2px solid var(--cor-destaque)' }} />
                                            <button type="button" onClick={() => removeExistingMedia(url)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', padding: '2px' }}><X size={14} /></button>
                                        </div>
                                    ))}

                                    {mediaPreviews.map((url, i) => (
                                        <div key={`new-${i}`} style={{ position: 'relative', aspectRatio: '1/1' }}>
                                            <img src={url} className="preview-img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '2px solid #00ff88' }} />
                                            <button type="button" onClick={() => removeNewMedia(i)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#00ff88', borderRadius: '50%', border: 'none', color: 'black', cursor: 'pointer', padding: '2px' }}><X size={14} /></button>
                                        </div>
                                    ))}

                                    <label className="upload-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #444', borderRadius: '4px', cursor: 'pointer', aspectRatio: '1/1' }}>
                                        <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        <Plus size={24} color="#666" />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-admin btn-cancelar">Cancelar</button>
                                <button type="submit" className="btn-admin btn-adicionar" disabled={loading}>{loading ? 'Processando...' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}