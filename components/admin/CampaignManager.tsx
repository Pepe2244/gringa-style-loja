'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit, Plus, X, Upload } from 'lucide-react';

export default function CampaignManager() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [nome, setNome] = useState('');
    const [aviso, setAviso] = useState('');
    const [corFundo, setCorFundo] = useState('#1A1A1A');
    const [corTexto, setCorTexto] = useState('#1A1A1A');
    const [corDestaque, setCorDestaque] = useState('#FFA500');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState('');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        const { data: config, error: configError } = await supabase.from('configuracoes_site').select('campanha_ativa_id').limit(1).maybeSingle();
        if (configError) {
            console.error('Erro ao buscar configurações:', configError);
            // alert('Erro ao buscar configurações: ' + configError.message); // Optional, maybe not critical
        }
        if (config) setActiveCampaignId(config.campanha_ativa_id);

        const { data, error } = await supabase.from('campanhas').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Erro ao buscar campanhas:', error);
            alert('Erro ao buscar campanhas: ' + error.message);
        }
        if (data) setCampaigns(data);
    };

    const openModal = (campaign: any = null) => {
        setEditingCampaign(campaign);
        if (campaign) {
            setNome(campaign.nome_campanha);
            setAviso(campaign.aviso_deslizante_texto || '');
            setCorFundo(campaign.cor_fundo || '#1A1A1A');
            setCorTexto(campaign.cor_texto || '#1A1A1A');
            setCorDestaque(campaign.cor_destaque || '#FFA500');
            setBannerPreview(campaign.banner_url || '');
        } else {
            setNome('');
            setAviso('');
            setCorFundo('#1A1A1A');
            setCorTexto('#1A1A1A');
            setCorDestaque('#FFA500');
            setBannerPreview('');
        }
        setBannerFile(null);
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let bannerUrl = editingCampaign ? editingCampaign.banner_url : null;

        if (bannerFile) {
            const fileName = `banner-${Date.now()}-${bannerFile.name}`;
            const { error: uploadError } = await supabase.storage.from('banners-campanhas').upload(fileName, bannerFile);
            if (uploadError) {
                alert('Erro no upload: ' + uploadError.message);
                setLoading(false);
                return;
            }
            const { data } = supabase.storage.from('banners-campanhas').getPublicUrl(fileName);
            bannerUrl = data.publicUrl;
        }

        const campaignData = {
            nome_campanha: nome,
            banner_url: bannerUrl,
            aviso_deslizante_texto: aviso || null,
            cor_fundo: corFundo,
            cor_texto: corTexto,
            cor_destaque: corDestaque
        };

        try {
            if (editingCampaign) {
                const { error } = await supabase.from('campanhas').update(campaignData).eq('id', editingCampaign.id);
                if (error) throw error;
                alert('Campanha atualizada!');
            } else {
                const { error } = await supabase.from('campanhas').insert([campaignData]);
                if (error) throw error;
                alert('Campanha criada!');
            }
            setShowModal(false);
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
            const { error } = await supabase.from('campanhas').delete().eq('id', id);
            if (error) throw error;
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
            const { error } = await supabase.from('configuracoes_site').update({ campanha_ativa_id: newId }).eq('id', 1);

            // If config doesn't exist, insert it (unlikely but safe)
            if (error && error.code === 'PGRST116') {
                await supabase.from('configuracoes_site').insert({ id: 1, campanha_ativa_id: newId });
            } else if (error) {
                throw error;
            }

            setActiveCampaignId(newId);
            fetchCampaigns(); // Refresh UI
        } catch (error: any) {
            alert('Erro ao alterar status: ' + error.message);
        }
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
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map(camp => (
                        <tr key={camp.id}>
                            <td>{camp.nome_campanha}</td>
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
                                <img src={camp.banner_url} alt="Banner" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                            )}
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
                <div className="modal-admin-container visivel">
                    <div className="modal-admin">
                        <button className="modal-fechar-btn" onClick={() => setShowModal(false)}>&times;</button>
                        <h2 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '25px' }}>
                            {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="form-campo">
                                <label>Nome da Campanha</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-campo">
                                <label>Banner (URL ou Upload)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {bannerPreview && (
                                    <img src={bannerPreview} alt="Preview" style={{ width: '100%', marginTop: '10px', maxHeight: '100px', objectFit: 'contain' }} />
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
