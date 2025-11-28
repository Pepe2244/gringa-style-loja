'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Trash2, Edit, Plus, X } from 'lucide-react';

export default function CouponManager() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [products, setProducts] = useState<Pick<Product, 'id' | 'nome'>[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [codigo, setCodigo] = useState('');
    const [tipoDesconto, setTipoDesconto] = useState('percentual');
    const [valorDesconto, setValorDesconto] = useState('');
    const [tipoAplicacao, setTipoAplicacao] = useState('geral');
    const [produtosAplicaveis, setProdutosAplicaveis] = useState<string[]>([]);
    const [dataValidade, setDataValidade] = useState('');
    const [limiteUso, setLimiteUso] = useState('');

    useEffect(() => {
        fetchCoupons();
        fetchProducts();
    }, []);

    const fetchCoupons = async () => {
        const { data, error } = await supabase.from('cupons').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Erro ao buscar cupons:', error);
            alert('Erro ao buscar cupons: ' + error.message);
        }
        if (data) setCoupons(data);
    };

    const fetchProducts = async () => {
        const { data, error } = await supabase.from('produtos').select('id, nome').order('nome');
        if (error) {
            console.error('Erro ao buscar produtos para cupons:', error);
            alert('Erro ao buscar produtos: ' + error.message);
        }
        if (data) setProducts(data);
    };

    const openModal = (coupon: any = null) => {
        setEditingCoupon(coupon);
        if (coupon) {
            setCodigo(coupon.codigo);
            setTipoDesconto(coupon.tipo_desconto);
            setValorDesconto(coupon.valor_desconto);
            setTipoAplicacao(coupon.tipo_aplicacao);
            setProdutosAplicaveis(coupon.produtos_aplicaveis ? coupon.produtos_aplicaveis.map(String) : []);
            setDataValidade(coupon.data_validade ? coupon.data_validade.slice(0, 16) : '');
            setLimiteUso(coupon.limite_uso || '');
        } else {
            setCodigo('');
            setTipoDesconto('percentual');
            setValorDesconto('');
            setTipoAplicacao('geral');
            setProdutosAplicaveis([]);
            setDataValidade('');
            setLimiteUso('');
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const couponData = {
            codigo: codigo.toUpperCase().trim(),
            tipo_desconto: tipoDesconto,
            valor_desconto: parseFloat(valorDesconto),
            tipo_aplicacao: tipoAplicacao,
            produtos_aplicaveis: tipoAplicacao === 'produto' ? produtosAplicaveis.map(Number) : null,
            data_validade: dataValidade || null,
            limite_uso: limiteUso ? parseInt(limiteUso) : null,
        };

        try {
            if (editingCoupon) {
                const { error } = await supabase.from('cupons').update(couponData).eq('id', editingCoupon.id);
                if (error) throw error;
                alert('Cupom atualizado!');
            } else {
                const { error } = await supabase.from('cupons').insert([couponData]);
                if (error) throw error;
                alert('Cupom criado!');
            }
            setShowModal(false);
            fetchCoupons();
        } catch (error: any) {
            alert('Erro ao salvar cupom: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir este cupom?')) return;
        try {
            const { error } = await supabase.from('cupons').delete().eq('id', id);
            if (error) throw error;
            fetchCoupons();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from('cupons').update({ ativo: !currentStatus }).eq('id', id);
            if (error) throw error;
            fetchCoupons();
        } catch (error: any) {
            alert('Erro ao atualizar status: ' + error.message);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Gerenciar Cupons</h1>
                <button className="btn-admin btn-adicionar" onClick={() => openModal()}>
                    <Plus size={18} style={{ marginRight: '5px' }} /> Novo Cupom
                </button>
            </div>

            <table className="admin-tabela">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {coupons.map(coupon => (
                        <tr key={coupon.id}>
                            <td>{coupon.codigo}</td>
                            <td>{coupon.tipo_desconto === 'percentual' ? '%' : 'R$'}</td>
                            <td>{coupon.valor_desconto}</td>
                            <td>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={coupon.ativo}
                                        onChange={() => toggleStatus(coupon.id, coupon.ativo)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </td>
                            <td>
                                <div className="acoes-btn">
                                    <button className="btn-admin-acao btn-editar" onClick={() => openModal(coupon)}>Editar</button>
                                    <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(coupon.id)}>Excluir</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="admin-mobile-list">
                {coupons.map(coupon => (
                    <div key={coupon.id} className="admin-mobile-card">
                        <div className="admin-mobile-card-header">
                            <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1.2rem' }}>{coupon.codigo}</h3>
                            <label className="switch" style={{ transform: 'scale(0.8)' }}>
                                <input
                                    type="checkbox"
                                    checked={coupon.ativo}
                                    onChange={() => toggleStatus(coupon.id, coupon.ativo)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="admin-mobile-card-body">
                            <p><strong>Tipo:</strong> {coupon.tipo_desconto === 'percentual' ? 'Percentual (%)' : 'Fixo (R$)'}</p>
                            <p><strong>Valor:</strong> {coupon.valor_desconto}</p>
                            <p><strong>Status:</strong> {coupon.ativo ? 'Ativo' : 'Inativo'}</p>
                        </div>
                        <div className="admin-mobile-card-actions">
                            <button className="btn-admin-acao btn-editar" onClick={() => openModal(coupon)} style={{ flex: 1 }}>Editar</button>
                            <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(coupon.id)} style={{ flex: 1 }}>Excluir</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-admin-container visivel">
                    <div className="modal-admin">
                        <button className="modal-fechar-btn" onClick={() => setShowModal(false)}>&times;</button>
                        <h2 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '25px' }}>
                            {editingCoupon ? 'Editar Cupom' : 'Adicionar Cupom'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="form-campo">
                                <label>Código do Cupom</label>
                                <input
                                    type="text"
                                    value={codigo}
                                    onChange={e => setCodigo(e.target.value.toUpperCase())}
                                    required
                                    placeholder="Ex: NATAL10"
                                />
                                <small>O código que o cliente vai digitar. Use maiúsculas, sem espaços.</small>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <div className="form-campo" style={{ flex: 1, minWidth: '150px' }}>
                                    <label>Tipo de Desconto</label>
                                    <select
                                        value={tipoDesconto}
                                        onChange={e => setTipoDesconto(e.target.value)}
                                    >
                                        <option value="percentual">Percentual (%)</option>
                                        <option value="fixo">Valor Fixo (R$)</option>
                                    </select>
                                </div>
                                <div className="form-campo" style={{ flex: 1, minWidth: '150px' }}>
                                    <label>Valor</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={valorDesconto}
                                        onChange={e => setValorDesconto(e.target.value)}
                                        required
                                        placeholder="Ex: 10 ou 50.00"
                                    />
                                </div>
                            </div>

                            <div className="form-campo">
                                <label>Onde aplicar o desconto?</label>
                                <select
                                    value={tipoAplicacao}
                                    onChange={e => setTipoAplicacao(e.target.value)}
                                >
                                    <option value="geral">No carrinho inteiro</option>
                                    <option value="produto">Apenas em produtos específicos</option>
                                </select>
                            </div>

                            {tipoAplicacao === 'produto' && (
                                <div className="form-campo">
                                    <label>Produtos Específicos</label>
                                    <select
                                        multiple
                                        value={produtosAplicaveis}
                                        onChange={e => setProdutosAplicaveis(Array.from(e.target.selectedOptions, option => option.value))}
                                        style={{ height: '150px' }}
                                    >
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                        ))}
                                    </select>
                                    <small>Segure Ctrl (ou Cmd no Mac) para selecionar vários.</small>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <div className="form-campo" style={{ flex: 1 }}>
                                    <label>Validade (Opcional)</label>
                                    <input
                                        type="datetime-local"
                                        value={dataValidade}
                                        onChange={e => setDataValidade(e.target.value)}
                                    />
                                </div>
                                <div className="form-campo" style={{ flex: 1 }}>
                                    <label>Limite de Uso (Opcional)</label>
                                    <input
                                        type="number"
                                        value={limiteUso}
                                        onChange={e => setLimiteUso(e.target.value)}
                                        placeholder="Ex: 100"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-admin btn-cancelar">Cancelar</button>
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
