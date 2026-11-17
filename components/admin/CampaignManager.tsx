'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Plus, Calendar, Tag, Search, Trash2 } from 'lucide-react';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { deleteCampaign, saveCampaign, setActiveCampaign } from '@/app/actions/admin-data';
import { Campaign } from '@/types';

interface ProductOption {
    id: number;
    nome: string;
    preco: number;
    imagens: string[] | null;
}

interface ProductDiscountItem {
    produto_id: number;
    tipo: 'percentual' | 'fixo' | 'preco_fixo';
    valor: string;
}

function calculatePreviewPrice(basePrice: number, tipo: string, valorStr: string): number {
    const val = Number(valorStr);
    if (!Number.isFinite(val) || val <= 0) return basePrice;
    if (tipo === 'percentual') {
        const disc = (basePrice * val) / 100;
        return Math.max(0.01, Math.round((basePrice - disc) * 100) / 100);
    }
    if (tipo === 'fixo') {
        return Math.max(0.01, Math.round((basePrice - val) * 100) / 100);
    }
    if (tipo === 'preco_fixo') {
        return Math.max(0.01, Math.min(basePrice, Math.round(val * 100) / 100));
    }
    return basePrice;
}

function toDatetimeLocal(isoStr?: string | null): string {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
}

function fromDatetimeLocal(localStr?: string): string | null {
    if (!localStr || !localStr.trim()) return null;
    const d = new Date(localStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
}

export default function CampaignManager() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductOption[]>([]);

    // Form states
    const [nome, setNome] = useState('');
    const [aviso, setAviso] = useState('');
    const [corFundo, setCorFundo] = useState('#1A1A1A');
    const [corTexto, setCorTexto] = useState('#FFFFFF');
    const [corDestaque, setCorDestaque] = useState('#FFA500');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState('');

    // Novos campos de agendamento e desconto
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [tipoDesconto, setTipoDesconto] = useState<'nenhum' | 'percentual' | 'fixo'>('nenhum');
    const [valorDesconto, setValorDesconto] = useState('');
    const [aplicarEmTodos, setAplicarEmTodos] = useState(false);
    const [produtosAplicaveis, setProdutosAplicaveis] = useState<number[]>([]);
    const [produtosDescontos, setProdutosDescontos] = useState<ProductDiscountItem[]>([]);
    const [bulkTipo, setBulkTipo] = useState<'percentual' | 'fixo' | 'preco_fixo'>('percentual');
    const [bulkValor, setBulkValor] = useState('');
    const [buscaProduto, setBuscaProduto] = useState('');

    const fetchCampaigns = async () => {
        const { data: config, error: configError } = await supabase.from('configuracoes_site').select('campanha_ativa_id').limit(1).maybeSingle();
        if (configError) {
            console.error('Erro ao buscar configurações:', configError);
        }
        if (config) setActiveCampaignId(config.campanha_ativa_id);

        const { data, error } = await supabase.from('campanhas').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Erro ao buscar campanhas:', error);
            alert('Erro ao buscar campanhas: ' + error.message);
        }
        if (data) setCampaigns(data);
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('id, nome, preco, imagens')
                .order('nome');
            if (error) console.error('Erro ao buscar produtos para campanha:', error);
            if (data) setProducts(data);
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchProducts();
    }, []);

    const openModal = (campaign: Campaign | null = null) => {
        if (bannerPreview && bannerPreview.startsWith('blob:')) {
            URL.revokeObjectURL(bannerPreview);
        }
        setEditingCampaign(campaign);
        if (campaign) {
            setNome(campaign.nome_campanha || '');
            setAviso(campaign.aviso_deslizante_texto || '');
            setCorFundo(campaign.cor_fundo || '#1A1A1A');
            setCorTexto(campaign.cor_texto || '#FFFFFF');
            setCorDestaque(campaign.cor_destaque || '#FFA500');
            setBannerPreview(campaign.banner_url || '');

            setDataInicio(toDatetimeLocal(campaign.data_inicio));
            setDataFim(toDatetimeLocal(campaign.data_fim));
            setTipoDesconto(campaign.tipo_desconto || 'nenhum');
            setValorDesconto(campaign.valor_desconto != null ? String(campaign.valor_desconto) : '');
            setAplicarEmTodos(campaign.aplicar_em_todos ?? false);
            setProdutosAplicaveis(Array.isArray(campaign.produtos_aplicaveis) ? campaign.produtos_aplicaveis : []);

            const rawDescontos = (campaign as any).produtos_descontos;
            if (Array.isArray(rawDescontos) && rawDescontos.length > 0) {
                setProdutosDescontos(
                    rawDescontos.map((item: any) => ({
                        produto_id: Number(item.produto_id),
                        tipo: ['percentual', 'fixo', 'preco_fixo'].includes(item.tipo) ? item.tipo : 'percentual',
                        valor: item.valor != null ? String(item.valor) : ''
                    }))
                );
            } else if (Array.isArray(campaign.produtos_aplicaveis) && campaign.produtos_aplicaveis.length > 0) {
                setProdutosDescontos(
                    campaign.produtos_aplicaveis.map((id: number) => ({
                        produto_id: Number(id),
                        tipo: campaign.tipo_desconto || 'percentual',
                        valor: campaign.valor_desconto != null ? String(campaign.valor_desconto) : ''
                    }))
                );
            } else {
                setProdutosDescontos([]);
            }
        } else {
            setNome('');
            setAviso('');
            setCorFundo('#1A1A1A');
            setCorTexto('#FFFFFF');
            setCorDestaque('#FFA500');
            setBannerPreview('');

            setDataInicio('');
            setDataFim('');
            setTipoDesconto('nenhum');
            setValorDesconto('');
            setAplicarEmTodos(false);
            setProdutosAplicaveis([]);
            setProdutosDescontos([]);
        }
        setBulkTipo('percentual');
        setBulkValor('');
        setBuscaProduto('');
        setBannerFile(null);
        setShowModal(true);
    };

    const closeModal = () => {
        if (bannerPreview && bannerPreview.startsWith('blob:')) {
            URL.revokeObjectURL(bannerPreview);
        }
        setBannerFile(null);
        setBannerPreview('');
        setBuscaProduto('');
        setShowModal(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (bannerPreview && bannerPreview.startsWith('blob:')) {
                URL.revokeObjectURL(bannerPreview);
            }
            const file = e.target.files[0];
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const isoInicio = fromDatetimeLocal(dataInicio);
        const isoFim = fromDatetimeLocal(dataFim);

        if (isoInicio && isoFim && new Date(isoInicio) > new Date(isoFim)) {
            alert('A data de início da campanha não pode ser posterior à data de término.');
            setLoading(false);
            return;
        }

        let parsedValorDesconto: number | null = null;
        if (tipoDesconto !== 'nenhum') {
            const num = parseFloat(valorDesconto.replace(',', '.'));
            if (isNaN(num) || num <= 0) {
                alert('Informe um valor de desconto válido maior que zero.');
                setLoading(false);
                return;
            }
            if (tipoDesconto === 'percentual' && num > 100) {
                alert('O desconto percentual não pode ser maior que 100%.');
                setLoading(false);
                return;
            }
            parsedValorDesconto = num;

            if (!aplicarEmTodos && produtosAplicaveis.length === 0) {
                alert('Selecione pelo menos um produto para o desconto ou escolha "Toda a Loja".');
                setLoading(false);
                return;
            }
        }

        let bannerUrl = editingCampaign ? editingCampaign.banner_url : null;

        if (bannerFile) {
            try {
                const formData = new FormData();
                formData.append('file', bannerFile);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${response.status}: Falha no upload para Cloudflare R2`);
                }

                const result = await response.json();
                if (result.url) {
                    bannerUrl = result.url;
                }
            } catch (uploadErr: any) {
                console.error('Erro no upload do banner:', uploadErr);
                alert(`Erro no upload: ${uploadErr.message}`);
                setLoading(false);
                return;
            }
        }

        const finalProdutosDescontos = produtosDescontos
            .map(item => ({
                produto_id: Number(item.produto_id),
                tipo: item.tipo,
                valor: Number(item.valor)
            }))
            .filter(item => Number.isSafeInteger(item.produto_id) && item.produto_id > 0 && Number.isFinite(item.valor) && item.valor > 0);

        const finalProdutosAplicaveis = Array.from(new Set([
            ...(aplicarEmTodos ? [] : produtosAplicaveis),
            ...finalProdutosDescontos.map(item => item.produto_id)
        ]));

        const campaignData = {
            nome_campanha: nome.trim(),
            banner_url: bannerUrl,
            aviso_deslizante_texto: aviso.trim() || null,
            cor_fundo: corFundo,
            cor_texto: corTexto,
            cor_destaque: corDestaque,
            data_inicio: isoInicio,
            data_fim: isoFim,
            tipo_desconto: tipoDesconto === 'nenhum' ? null : tipoDesconto,
            valor_desconto: parsedValorDesconto,
            aplicar_em_todos: aplicarEmTodos,
            produtos_aplicaveis: finalProdutosAplicaveis,
            produtos_descontos: finalProdutosDescontos
        };

        try {
            const result = await saveCampaign(campaignData, editingCampaign?.id);
            if (!result.success) throw new Error(result.error);
            alert(editingCampaign ? 'Campanha atualizada com sucesso!' : 'Campanha criada com sucesso!');
            closeModal();
            fetchCampaigns();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir esta campanha?')) return;
        try {
            const result = await deleteCampaign(id);
            if (!result.success) throw new Error(result.error);
            fetchCampaigns();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const toggleActive = async (id: number) => {
        const isActivating = activeCampaignId !== id;
        if (isActivating && !confirm('Ativar esta campanha? Outras serão desativadas.')) return;
        if (!isActivating && !confirm('Desativar campanha atual?')) return;

        try {
            const newId = isActivating ? id : null;

            const result = await setActiveCampaign(newId);
            if (!result.success) throw new Error(result.error);

            setActiveCampaignId(newId);

        } catch (error: any) {
            alert('Erro ao alterar status: ' + error.message);
        }
    };

    const formatCampaignSchedule = (camp: Campaign) => {
        if (!camp.data_inicio && !camp.data_fim) {
            return <span style={{ color: '#888', fontSize: '0.82rem' }}>Sempre ativa (sem prazo)</span>;
        }

        const now = Date.now();
        const start = camp.data_inicio ? new Date(camp.data_inicio).getTime() : null;
        const end = camp.data_fim ? new Date(camp.data_fim).getTime() : null;

        let statusBadge = null;
        if (start && now < start) {
            statusBadge = <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.72rem', background: 'rgba(96, 165, 250, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>⏳ Agendada</span>;
        } else if (end && now > end) {
            statusBadge = <span style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '0.72rem', background: 'rgba(156, 163, 175, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>⌛ Expirada</span>;
        } else {
            statusBadge = <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.72rem', background: 'rgba(0, 255, 136, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>🔥 Em vigor</span>;
        }

        const formatDt = (iso: string) => {
            const d = new Date(iso);
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {statusBadge}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#ccc' }}>
                    {camp.data_inicio ? formatDt(camp.data_inicio) : 'Início imediato'}
                    {' → '}
                    {camp.data_fim ? formatDt(camp.data_fim) : 'Sem término'}
                </span>
            </div>
        );
    };

    const formatCampaignDiscount = (camp: Campaign) => {
        const rawDescontos = (camp as any).produtos_descontos;
        const hasCustomProducts = Array.isArray(rawDescontos) && rawDescontos.length > 0;
        const customCount = hasCustomProducts ? rawDescontos.length : 0;
        const hasGlobalDiscount = Boolean(camp.tipo_desconto && camp.valor_desconto);

        if (!hasCustomProducts && !hasGlobalDiscount) {
            return <span style={{ color: '#777', fontSize: '0.82rem' }}>Sem desconto</span>;
        }

        const discountText = camp.tipo_desconto === 'percentual'
            ? `${camp.valor_desconto}% OFF`
            : `R$ ${camp.valor_desconto?.toFixed(2)} OFF`;

        const scopeText = camp.aplicar_em_todos
            ? 'na loja toda'
            : `em ${camp.produtos_aplicaveis?.length || 0} produtos`;

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {hasCustomProducts && (
                    <span style={{ color: '#00ff88', fontWeight: 'bold', background: 'rgba(0, 255, 136, 0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0, 255, 136, 0.3)', fontSize: '0.82rem' }}>
                        🏷️ {customCount} produto(s) com descontos próprios
                    </span>
                )}
                {hasGlobalDiscount && (
                    <span style={{ color: '#FFA500', fontWeight: 'bold', background: 'rgba(255, 165, 0, 0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 165, 0, 0.3)', fontSize: '0.82rem' }}>
                        {discountText} {scopeText}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Gerenciar Campanhas</h1>
                <button className="btn-admin btn-adicionar" onClick={() => openModal()}>
                    <Plus size={18} style={{ marginRight: '5px' }} /> Nova Campanha
                </button>
            </div>

            <table className="admin-tabela">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Período</th>
                        <th>Desconto</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map(camp => (
                        <tr key={camp.id}>
                            <td>
                                <strong style={{ color: 'var(--cor-destaque)' }}>{camp.nome_campanha}</strong>
                            </td>
                            <td>{formatCampaignSchedule(camp)}</td>
                            <td>{formatCampaignDiscount(camp)}</td>
                            <td>
                                {activeCampaignId === camp.id ? (
                                    <span style={{ color: '#00ff88', fontWeight: 'bold' }}>Ativa</span>
                                ) : (
                                    <span style={{ color: '#ccc' }}>Inativa</span>
                                )}
                            </td>
                            <td>
                                <div className="acoes-btn">
                                    <button
                                        className={`btn-admin-acao ${activeCampaignId === camp.id ? 'btn-desativar' : 'btn-adicionar'}`}
                                        onClick={() => toggleActive(camp.id)}
                                    >
                                        {activeCampaignId === camp.id ? 'Desativar' : 'Ativar'}
                                    </button>
                                    <button className="btn-admin-acao btn-editar" onClick={() => openModal(camp)}>Editar</button>
                                    <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(camp.id)}>Excluir</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="admin-mobile-list">
                {campaigns.map(camp => (
                    <div key={camp.id} className="admin-mobile-card">
                        <div className="admin-mobile-card-header">
                            <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1.2rem' }}>{camp.nome_campanha}</h3>
                            {activeCampaignId === camp.id ? (
                                <span style={{ color: '#00ff88', fontWeight: 'bold' }}>Ativa</span>
                            ) : (
                                <span style={{ color: '#ccc' }}>Inativa</span>
                            )}
                        </div>
                        <div className="admin-mobile-card-body">
                            {camp.banner_url && (
                                <Image src={getProxiedImageUrl(camp.banner_url)} alt="Banner" width={600} height={100} unoptimized style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                            )}
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Período:</strong> {formatCampaignSchedule(camp)}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Desconto:</strong> {formatCampaignDiscount(camp)}
                            </div>
                            <p><strong>Aviso:</strong> {camp.aviso_deslizante_texto || 'Nenhum'}</p>
                        </div>
                        <div className="admin-mobile-card-actions">
                            <button
                                className={`btn-admin-acao ${activeCampaignId === camp.id ? 'btn-desativar' : 'btn-adicionar'}`}
                                onClick={() => toggleActive(camp.id)}
                                style={{ flex: 1 }}
                            >
                                {activeCampaignId === camp.id ? 'Desativar' : 'Ativar'}
                            </button>
                            <button className="btn-admin-acao btn-editar" onClick={() => openModal(camp)} style={{ flex: 1 }}>Editar</button>
                            <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(camp.id)} style={{ flex: 1 }}>Excluir</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-admin-container visivel" style={{ zIndex: 1000 }}>
                    <div className="modal-admin" style={{ maxHeight: '95vh', overflowY: 'auto', padding: '20px', background: '#111', borderRadius: '15px', width: '95%', maxWidth: '780px' }}>
                        <button className="modal-fechar-btn" onClick={closeModal}>&times;</button>
                        <h2 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '20px' }}>
                            {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
                        </h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-campo">
                                <label>Nome da Campanha</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    placeholder="Ex: Black Friday ou Promoção de Verão"
                                    required
                                />
                            </div>

                            {/* Bloco de Agendamento */}
                            <div style={{ background: '#181818', padding: '14px', borderRadius: '10px', border: '1px solid #2b2b2b' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#eee', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={15} color="#FFA500" /> Agendamento da Campanha (Opcional)
                                    </h4>
                                    {(dataInicio || dataFim) && (
                                        <button
                                            type="button"
                                            onClick={() => { setDataInicio(''); setDataFim(''); }}
                                            style={{ background: 'transparent', border: 'none', color: '#ff7777', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Limpar datas
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                                    <div className="form-campo" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Data e Hora de Início</label>
                                        <input
                                            type="datetime-local"
                                            value={dataInicio}
                                            onChange={e => setDataInicio(e.target.value)}
                                            style={{ background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '8px', width: '100%', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                    <div className="form-campo" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Data e Hora de Término</label>
                                        <input
                                            type="datetime-local"
                                            value={dataFim}
                                            onChange={e => setDataFim(e.target.value)}
                                            style={{ background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '8px', width: '100%', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                </div>
                                <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '8px', display: 'block' }}>
                                    💡 A campanha e seus banners serão ativados automaticamente nesse período. Se em branco, valerá continuamente enquanto estiver ativada.
                                </small>
                            </div>

                            {/* Bloco de Desconto Promocional */}
                            <div style={{ background: '#181818', padding: '16px', borderRadius: '10px', border: '1px solid #2b2b2b' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: '#eee', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Tag size={16} color="#00ff88" /> Descontos da Campanha
                                </h4>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '8px', display: 'block' }}>Estratégia de Desconto</label>
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.84rem', color: !aplicarEmTodos ? '#00ff88' : '#bbb' }}>
                                            <input
                                                type="radio"
                                                name="estrategiaDesconto"
                                                checked={!aplicarEmTodos}
                                                onChange={() => setAplicarEmTodos(false)}
                                            />
                                            🏷️ Descontos Individuais por Produto (Ex: R$ 50 em um, 50% em outro)
                                        </label>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.84rem', color: aplicarEmTodos ? '#FFA500' : '#bbb' }}>
                                            <input
                                                type="radio"
                                                name="estrategiaDesconto"
                                                checked={aplicarEmTodos}
                                                onChange={() => setAplicarEmTodos(true)}
                                            />
                                            🌐 Desconto Geral na Loja Toda (Ex: 15% OFF em tudo)
                                        </label>
                                    </div>
                                </div>

                                {aplicarEmTodos ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: tipoDesconto === 'nenhum' ? '1fr' : '1fr 1fr', gap: '12px', background: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                        <div className="form-campo" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Tipo de Desconto da Loja</label>
                                            <select
                                                value={tipoDesconto}
                                                onChange={e => {
                                                    const val = e.target.value as 'nenhum' | 'percentual' | 'fixo';
                                                    setTipoDesconto(val);
                                                    if (val === 'nenhum') setValorDesconto('');
                                                }}
                                                style={{ background: '#1c1c1c', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '8px', width: '100%', fontSize: '0.85rem' }}
                                            >
                                                <option value="nenhum">Sem desconto adicional</option>
                                                <option value="percentual">Percentual (%)</option>
                                                <option value="fixo">Fixo (R$)</option>
                                            </select>
                                        </div>

                                        {tipoDesconto !== 'nenhum' && (
                                            <div className="form-campo" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>
                                                    {tipoDesconto === 'percentual' ? 'Valor do Desconto (%)' : 'Valor do Desconto (R$)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    max={tipoDesconto === 'percentual' ? 100 : undefined}
                                                    value={valorDesconto}
                                                    onChange={e => setValorDesconto(e.target.value)}
                                                    placeholder={tipoDesconto === 'percentual' ? 'Ex: 15' : 'Ex: 30.00'}
                                                    style={{ background: '#1c1c1c', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '8px', width: '100%', fontSize: '0.85rem' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ background: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                        {/* Barra de Busca e Ações Rápidas */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                                            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                                                <Search size={14} color="#888" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="text"
                                                    value={buscaProduto}
                                                    onChange={e => setBuscaProduto(e.target.value)}
                                                    placeholder="Buscar produto para adicionar à campanha..."
                                                    style={{ width: '100%', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '6px 10px 6px 30px', fontSize: '0.8rem' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const existingIds = new Set(produtosDescontos.map(d => d.produto_id));
                                                        const toAdd = products
                                                            .filter(p => !existingIds.has(p.id))
                                                            .map(p => ({
                                                                produto_id: p.id,
                                                                tipo: 'percentual' as const,
                                                                valor: '10'
                                                            }));
                                                        setProdutosDescontos(prev => [...prev, ...toAdd]);
                                                    }}
                                                    style={{ background: '#222', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)', padding: '5px 9px', borderRadius: '4px', fontSize: '0.74rem', cursor: 'pointer' }}
                                                >
                                                    + Adicionar Todos da Loja
                                                </button>
                                                {produtosDescontos.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setProdutosDescontos([])}
                                                        style={{ background: '#222', color: '#ff7777', border: '1px solid rgba(255, 119, 119, 0.4)', padding: '5px 9px', borderRadius: '4px', fontSize: '0.74rem', cursor: 'pointer' }}
                                                    >
                                                        Limpar Lista
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Resultados da busca suspensa para adicionar */}
                                        {buscaProduto.trim() && (
                                            <div style={{ background: '#181818', border: '1px solid #444', borderRadius: '6px', padding: '8px', marginBottom: '10px', maxHeight: '130px', overflowY: 'auto' }}>
                                                <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '4px' }}>Resultados da busca:</div>
                                                {products
                                                    .filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))
                                                    .map(prod => {
                                                        const jaAdicionado = produtosDescontos.some(d => d.produto_id === prod.id);
                                                        return (
                                                            <div
                                                                key={prod.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '4px 6px',
                                                                    borderBottom: '1px solid #282828',
                                                                    fontSize: '0.78rem'
                                                                }}
                                                            >
                                                                <span style={{ color: '#eee' }}>{prod.nome} (R$ {prod.preco.toFixed(2)})</span>
                                                                {jaAdicionado ? (
                                                                    <span style={{ color: '#00ff88', fontSize: '0.72rem' }}>✓ Adicionado</span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setProdutosDescontos(prev => [
                                                                                ...prev,
                                                                                { produto_id: prod.id, tipo: 'percentual', valor: '15' }
                                                                            ]);
                                                                        }}
                                                                        style={{ background: '#00ff8822', color: '#00ff88', border: '1px solid #00ff88', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                                                                    >
                                                                        + Adicionar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}

                                        {/* Ação em lote para preencher vários com agilidade */}
                                        {produtosDescontos.length > 1 && (
                                            <div style={{ background: '#181818', padding: '6px 10px', borderRadius: '6px', border: '1px solid #2e2e2e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#aaa' }}>Preencher todos da lista com:</span>
                                                <select
                                                    value={bulkTipo}
                                                    onChange={e => setBulkTipo(e.target.value as any)}
                                                    style={{ background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '3px 6px', fontSize: '0.74rem' }}
                                                >
                                                    <option value="percentual">% Desconto</option>
                                                    <option value="fixo">R$ Desconto</option>
                                                    <option value="preco_fixo">R$ Preço Final</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={bulkValor}
                                                    onChange={e => setBulkValor(e.target.value)}
                                                    placeholder="Valor"
                                                    style={{ width: '65px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '3px 6px', fontSize: '0.74rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!bulkValor || Number(bulkValor) <= 0) {
                                                            alert('Informe um valor válido para aplicar em lote.');
                                                            return;
                                                        }
                                                        setProdutosDescontos(prev =>
                                                            prev.map(item => ({
                                                                ...item,
                                                                tipo: bulkTipo,
                                                                valor: bulkValor
                                                            }))
                                                        );
                                                    }}
                                                    style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer' }}
                                                >
                                                    Aplicar em Todos
                                                </button>
                                                <span style={{ fontSize: '0.72rem', color: '#888', marginLeft: 'auto' }}>
                                                    {produtosDescontos.length} produto(s) na campanha
                                                </span>
                                            </div>
                                        )}

                                        {/* Tabela de Produtos com Configurações Independentes */}
                                        {produtosDescontos.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#777', fontSize: '0.8rem' }}>
                                                Nenhum produto adicionado nesta campanha ainda.<br />
                                                Use a busca acima ou clique em <strong>"+ Adicionar Todos da Loja"</strong> para configurar descontos independentes.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                                                {produtosDescontos.map((item) => {
                                                    const prod = products.find(p => p.id === item.produto_id);
                                                    if (!prod) return null;
                                                    const precoFinal = calculatePreviewPrice(prod.preco, item.tipo, String(item.valor));
                                                    const economia = prod.preco - precoFinal;

                                                    return (
                                                        <div
                                                            key={item.produto_id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '6px 10px',
                                                                background: '#181818',
                                                                borderRadius: '6px',
                                                                border: '1px solid #2a2a2a',
                                                            }}
                                                        >
                                                            <div style={{ flex: 1, minWidth: '140px' }}>
                                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {prod.nome}
                                                                </div>
                                                                <div style={{ fontSize: '0.72rem', color: '#888' }}>
                                                                    Original: R$ {prod.preco.toFixed(2)}
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <select
                                                                    value={item.tipo}
                                                                    onChange={e => {
                                                                        const newTipo = e.target.value as 'percentual' | 'fixo' | 'preco_fixo';
                                                                        setProdutosDescontos(prev =>
                                                                            prev.map(p => p.produto_id === item.produto_id ? { ...p, tipo: newTipo } : p)
                                                                        );
                                                                    }}
                                                                    style={{ background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '4px 6px', fontSize: '0.75rem' }}
                                                                >
                                                                    <option value="percentual">% OFF</option>
                                                                    <option value="fixo">R$ OFF</option>
                                                                    <option value="preco_fixo">Preço Fixo</option>
                                                                </select>

                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={item.valor}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setProdutosDescontos(prev =>
                                                                            prev.map(p => p.produto_id === item.produto_id ? { ...p, valor: val } : p)
                                                                        );
                                                                    }}
                                                                    placeholder="Valor"
                                                                    style={{ width: '75px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '4px 6px', fontSize: '0.75rem' }}
                                                                />
                                                            </div>

                                                            <div style={{ minWidth: '95px', textAlign: 'right' }}>
                                                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00ff88' }}>
                                                                    R$ {precoFinal.toFixed(2)}
                                                                </div>
                                                                <div style={{ fontSize: '0.68rem', color: economia > 0 ? '#FFA500' : '#888' }}>
                                                                    {economia > 0 ? `(-R$ ${economia.toFixed(2)})` : 'sem desc.'}
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setProdutosDescontos(prev => prev.filter(p => p.produto_id !== item.produto_id));
                                                                }}
                                                                title="Remover produto da campanha"
                                                                style={{ background: 'transparent', border: 'none', color: '#ff6666', cursor: 'pointer', padding: '2px 4px' }}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="form-campo">
                                <label>Banner (URL ou Upload)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {bannerPreview && (
                                    <Image src={getProxiedImageUrl(bannerPreview)} alt="Preview" width={600} height={100} unoptimized style={{ width: '100%', marginTop: '10px', maxHeight: '100px', objectFit: 'contain' }} />
                                )}
                            </div>

                            <div className="color-picker-wrapper form-campo">
                                <label>Cor de Fundo</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={corFundo}
                                        onChange={e => setCorFundo(e.target.value)}
                                        style={{ width: '50px', height: '40px', padding: 0, border: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={corFundo}
                                        onChange={e => setCorFundo(e.target.value)}
                                        style={{ flex: 1, fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div className="form-campo">
                                <label>Texto do Aviso Deslizante</label>
                                <input
                                    type="text"
                                    value={aviso}
                                    onChange={e => setAviso(e.target.value)}
                                    placeholder="Ex: FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 200"
                                />
                            </div>

                            <div className="color-picker-wrapper form-campo">
                                <label>Cor de Destaque</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={corDestaque}
                                        onChange={e => setCorDestaque(e.target.value)}
                                        style={{ width: '50px', height: '40px', padding: 0, border: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={corDestaque}
                                        onChange={e => setCorDestaque(e.target.value)}
                                        style={{ flex: 1, fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div className="color-picker-wrapper form-campo">
                                <label>Cor do Texto</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={corTexto}
                                        onChange={e => setCorTexto(e.target.value)}
                                        style={{ width: '50px', height: '40px', padding: 0, border: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={corTexto}
                                        onChange={e => setCorTexto(e.target.value)}
                                        style={{ flex: 1, fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={closeModal} className="btn-admin btn-cancelar">Cancelar</button>
                                <button type="submit" className="btn-admin btn-adicionar" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar Campanha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
