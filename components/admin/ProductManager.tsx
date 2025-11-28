'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import { Trash2, Edit, Plus, X, Upload, Image as ImageIcon, Video } from 'lucide-react';

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [precoPromocional, setPrecoPromocional] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [tags, setTags] = useState('');
    const [emEstoque, setEmEstoque] = useState(true);
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
        const { data } = await supabase.from('produtos').select('*').order('id');
        if (data) setProducts(data);
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
            setEmEstoque(product.emEstoque);
            setVariantTipo(product.variants?.tipo || '');
            setVariantOpcoes(product.variants?.opcoes.join(', ') || '');
            setExistingMedia(product.media_urls || []);
        } else {
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
        }
        setMediaFiles([]);
        setMediaPreviews([]);
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setMediaFiles(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (urlToRemove: string) => {
        setExistingMedia(prev => prev.filter(url => url !== urlToRemove));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let finalMediaUrls = [...existingMedia];

        // Upload new files
        for (const file of mediaFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('gringa-style-produtos').upload(fileName, file);

            if (uploadError) {
                alert(`Erro no upload de ${file.name}: ${uploadError.message}`);
                continue;
            }

            const { data } = supabase.storage.from('gringa-style-produtos').getPublicUrl(fileName);
            finalMediaUrls.push(data.publicUrl);
        }

        const variants = (variantTipo && variantOpcoes) ? {
            tipo: variantTipo,
            opcoes: variantOpcoes.split(',').map(s => s.trim()).filter(Boolean)
        } : null;

        const productData = {
            nome,
            descricao,
            preco: parseFloat(preco),
            preco_promocional: precoPromocional ? parseFloat(precoPromocional) : null,
            categoria_id: categoriaId ? parseInt(categoriaId) : null,
            tags: tags.split(',').map(s => s.trim()).filter(Boolean),
            emEstoque,
            media_urls: finalMediaUrls,
            variants
        };

        try {
            if (editingProduct) {
                const { error } = await supabase.from('produtos').update(productData).eq('id', editingProduct.id);
                if (error) throw error;

                // Push Notification Logic (Simplified)
                if (productData.preco_promocional && (!editingProduct.preco_promocional || productData.preco_promocional !== editingProduct.preco_promocional)) {
                    await supabase.from('notificacoes_push_queue').insert({
                        titulo: '🔥 PROMOÇÃO ATIVADA!',
                        mensagem: `O produto "${nome}" está em promoção por R$${productData.preco_promocional.toFixed(2).replace('.', ',')}!`,
                        link_url: `/produto?id=${editingProduct.id}`,
                        status: 'rascunho'
                    });
                }

                alert('Produto atualizado!');
            } else {
                const { data, error } = await supabase.from('produtos').insert([productData]).select().single();
                if (error) throw error;

                // Push Notification for New Product
                await supabase.from('notificacoes_push_queue').insert({
                    titulo: '🔥 Novidade na Loja!',
                    mensagem: `O produto "${nome}" já está disponível. Venha conferir!`,
                    link_url: `/produto?id=${data.id}`,
                    status: 'rascunho'
                });

                alert('Produto criado!');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir este produto?')) return;
        try {
            const { error } = await supabase.from('produtos').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const toggleStock = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from('produtos').update({ emEstoque: !currentStatus }).eq('id', id);
            if (error) throw error;

            // Stock Notification
            if (!currentStatus) { // Was false, now true -> Back in stock
                const prod = products.find(p => p.id === id);
                if (prod) {
                    await supabase.from('notificacoes_push_queue').insert({
                        titulo: '🛍️ De volta ao estoque!',
                        mensagem: `O produto "${prod.nome}" está disponível novamente!`,
                        link_url: `/produto?id=${id}`,
                        status: 'rascunho'
                    });
                }
            }

            fetchProducts();
        } catch (error: any) {
            alert('Erro ao atualizar estoque: ' + error.message);
        }
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
                            <td>
                                R$ {prod.preco.toFixed(2)}
                                {prod.preco_promocional && <span style={{ color: '#00ff88', marginLeft: '5px' }}>({prod.preco_promocional.toFixed(2)})</span>}
                            </td>
                            <td>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={prod.emEstoque}
                                        onChange={() => toggleStock(prod.id, prod.emEstoque)}
                                    />
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

            <div className="admin-mobile-list">
                {products.map(prod => (
                    <div key={prod.id} className="admin-mobile-card">
                        <div className="admin-mobile-card-header">
                            <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1.2rem' }}>{prod.nome}</h3>
                            <label className="switch" style={{ transform: 'scale(0.8)' }}>
                                <input
                                    type="checkbox"
                                    checked={prod.emEstoque}
                                    onChange={() => toggleStock(prod.id, prod.emEstoque)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="admin-mobile-card-body">
                            <p><strong>Preço:</strong> R$ {prod.preco.toFixed(2)}</p>
                            {prod.preco_promocional && (
                                <p style={{ color: '#00ff88' }}><strong>Promo:</strong> R$ {prod.preco_promocional.toFixed(2)}</p>
                            )}
                            <p><strong>Estoque:</strong> {prod.emEstoque ? 'Sim' : 'Não'}</p>
                        </div>
                        <div className="admin-mobile-card-actions">
                            <button className="btn-admin-acao btn-editar" onClick={() => openModal(prod)} style={{ flex: 1, padding: '10px' }}>Editar</button>
                            <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(prod.id)} style={{ flex: 1, padding: '10px' }}>Excluir</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-admin-container visivel">
                    <div className="modal-admin">
                        <button className="modal-fechar-btn" onClick={() => setShowModal(false)}>&times;</button>
                        <h2 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '25px' }}>
                            {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
                        </h2>

                        <form onSubmit={handleSave}>
                            <div className="form-campo">
                                <label>Nome do Produto</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-campo">
                                <label>Preço</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={preco}
                                    onChange={e => setPreco(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-campo">
                                <label>Preço Promocional (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={precoPromocional}
                                    onChange={e => setPrecoPromocional(e.target.value)}
                                />
                                <small>Deixe em branco ou 0 se não houver promoção.</small>
                            </div>

                            <div className="form-campo">
                                <label>Descrição</label>
                                <textarea
                                    value={descricao}
                                    onChange={e => setDescricao(e.target.value)}
                                    required
                                    rows={4}
                                />
                            </div>

                            <div className="form-campo">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={emEstoque}
                                        onChange={e => setEmEstoque(e.target.checked)}
                                        style={{ width: 'auto' }}
                                    />
                                    Em Estoque
                                </label>
                            </div>

                            <div className="form-campo">
                                <label>Categoria</label>
                                <select
                                    value={categoriaId}
                                    onChange={e => setCategoriaId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione uma categoria...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-campo">
                                <label>Tags (separadas por vírgula)</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                    placeholder="Ex: mascara, tig, alta performance"
                                />
                            </div>

                            <div className="form-campo">
                                <label>Tipo da Variante (Opcional)</label>
                                <input
                                    type="text"
                                    value={variantTipo}
                                    onChange={e => setVariantTipo(e.target.value)}
                                    placeholder="Ex: Cor"
                                />
                            </div>

                            <div className="form-campo">
                                <label>Opções (separadas por vírgula)</label>
                                <input
                                    type="text"
                                    value={variantOpcoes}
                                    onChange={e => setVariantOpcoes(e.target.value)}
                                    placeholder="Ex: Azul, Verde, Vermelho"
                                />
                            </div>

                            <div className="form-campo">
                                <label>Mídias (imagens ou vídeo)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                />
                                <small>Ao editar, o envio de novas mídias substituirá TODAS as antigas.</small>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                    {existingMedia.map((url, idx) => (
                                        <div key={`exist-${idx}`} style={{ position: 'relative' }}>
                                            {url.includes('.mp4') || url.includes('.webm') ? (
                                                <video src={url} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <img src={url} alt="Media" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeExistingMedia(url)}
                                                style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    {mediaPreviews.map((url, idx) => (
                                        <div key={`new-${idx}`} style={{ position: 'relative' }}>
                                            {mediaFiles[idx].type.startsWith('video/') ? (
                                                <video src={url} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <img src={url} alt="New Media" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeNewMedia(idx)}
                                                style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-admin btn-cancelar">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-admin btn-adicionar" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
