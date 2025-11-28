'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Rifa, Premio } from '@/types';
import { Trash2, Edit, Plus, X, Trophy, Users, PlayCircle } from 'lucide-react';

export default function RifaManager() {
    const [rifas, setRifas] = useState<Rifa[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingRifa, setEditingRifa] = useState<Rifa | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [nomePremio, setNomePremio] = useState('');
    const [descricao, setDescricao] = useState('');
    const [precoNumero, setPrecoNumero] = useState('');
    const [totalNumeros, setTotalNumeros] = useState('');
    const [imagemCapaFile, setImagemCapaFile] = useState<File | null>(null);
    const [imagemCapaPreview, setImagemCapaPreview] = useState('');

    // Prizes state
    const [premios, setPremios] = useState<{ id?: number, descricao: string, imagemFile?: File, imagemPreview?: string, imagemUrl?: string }[]>([{ descricao: '' }]);

    // Management Modal
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedRifaId, setSelectedRifaId] = useState<number | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);

    // Draw Modal
    const [showDrawModal, setShowDrawModal] = useState(false);
    const [drawRifa, setDrawRifa] = useState<Rifa | null>(null);
    const [drawPrizes, setDrawPrizes] = useState<Premio[]>([]);
    const [drawing, setDrawing] = useState(false);
    const [drawAnimation, setDrawAnimation] = useState('000');

    useEffect(() => {
        fetchRifas();
    }, []);

    const fetchRifas = async () => {
        const { data, error } = await supabase.from('rifas').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Erro ao buscar rifas:', error);
            alert('Erro ao buscar rifas: ' + error.message);
        }
        if (data) setRifas(data);
    };

    const openModal = async (rifa: Rifa | null = null) => {
        setEditingRifa(rifa);
        if (rifa) {
            setNomePremio(rifa.nome_premio);
            setDescricao(rifa.descricao);
            setPrecoNumero(String(rifa.preco_numero));
            setTotalNumeros(String(rifa.total_numeros));
            setImagemCapaPreview(rifa.imagem_premio_url || '');

            // Fetch prizes
            const { data: prizesData } = await supabase.from('premios').select('*').eq('rifa_id', rifa.id).order('ordem');
            if (prizesData && prizesData.length > 0) {
                setPremios(prizesData.map(p => ({
                    id: p.id,
                    descricao: p.descricao,
                    imagemUrl: p.imagem_url,
                    imagemPreview: p.imagem_url
                })));
            } else {
                setPremios([{ descricao: '' }]);
            }
        } else {
            setNomePremio('');
            setDescricao('');
            setPrecoNumero('');
            setTotalNumeros('');
            setImagemCapaPreview('');
            setPremios([{ descricao: '' }]);
        }
        setImagemCapaFile(null);
        setShowModal(true);
    };

    const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImagemCapaFile(file);
            setImagemCapaPreview(URL.createObjectURL(file));
        }
    };

    const handlePrizeChange = (index: number, field: string, value: any) => {
        const newPremios = [...premios];
        if (field === 'descricao') newPremios[index].descricao = value;
        if (field === 'file') {
            const file = value;
            newPremios[index].imagemFile = file;
            newPremios[index].imagemPreview = URL.createObjectURL(file);
        }
        setPremios(newPremios);
    };

    const addPrizeField = () => {
        setPremios([...premios, { descricao: '' }]);
    };

    const removePrizeField = (index: number) => {
        setPremios(premios.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let capaUrl = editingRifa ? editingRifa.imagem_premio_url : null;

        if (imagemCapaFile) {
            const fileName = `capa-${Date.now()}-${imagemCapaFile.name}`;
            const { error: uploadError } = await supabase.storage.from('imagens-rifas').upload(fileName, imagemCapaFile);
            if (uploadError) {
                alert('Erro upload capa: ' + uploadError.message);
                setLoading(false);
                return;
            }
            const { data } = supabase.storage.from('imagens-rifas').getPublicUrl(fileName);
            capaUrl = data.publicUrl;
        }

        const rifaData = {
            nome_premio: nomePremio,
            descricao,
            preco_numero: parseFloat(precoNumero),
            total_numeros: parseInt(totalNumeros),
            imagem_premio_url: capaUrl,
            status: editingRifa ? editingRifa.status : 'ativa'
        };

        try {
            let rifaId;
            if (editingRifa) {
                const { error } = await supabase.from('rifas').update(rifaData).eq('id', editingRifa.id);
                if (error) throw error;
                rifaId = editingRifa.id;
                alert('Rifa atualizada!');
            } else {
                const { data, error } = await supabase.from('rifas').insert([rifaData]).select().single();
                if (error) throw error;
                rifaId = data.id;

                // Notification
                await supabase.from('notificacoes_push_queue').insert({
                    titulo: '🍀 Nova Rifa no Ar!',
                    mensagem: `A rifa "${nomePremio}" já começou. Garanta seus números!`,
                    link_url: `/rifa`,
                    status: 'rascunho'
                });

                alert('Rifa criada!');
            }

            // Handle Prizes
            // 1. Upload images for prizes
            const finalPrizes = [];
            for (let i = 0; i < premios.length; i++) {
                let pUrl = premios[i].imagemUrl;
                if (premios[i].imagemFile) {
                    const pFile = premios[i].imagemFile!;
                    const pName = `premio-${rifaId}-${Date.now()}-${i}-${pFile.name}`;
                    const { error: pUpErr } = await supabase.storage.from('imagens-premios').upload(pName, pFile);
                    if (!pUpErr) {
                        const { data } = supabase.storage.from('imagens-premios').getPublicUrl(pName);
                        pUrl = data.publicUrl;
                    }
                }
                if (premios[i].descricao.trim()) {
                    finalPrizes.push({
                        id: premios[i].id, // Keep ID if exists to update
                        rifa_id: rifaId,
                        descricao: premios[i].descricao,
                        ordem: i + 1,
                        imagem_url: pUrl
                    });
                }
            }

            // 2. Sync prizes (Upsert/Delete)
            // Get existing IDs to know what to delete
            const { data: existingPrizes } = await supabase.from('premios').select('id').eq('rifa_id', rifaId);
            const existingIds = existingPrizes?.map(p => p.id) || [];
            const currentIds = finalPrizes.map(p => p.id).filter(Boolean);
            const toDelete = existingIds.filter(id => !currentIds.includes(id));

            if (toDelete.length > 0) {
                await supabase.from('premios').delete().in('id', toDelete);
            }

            if (finalPrizes.length > 0) {
                await supabase.from('premios').upsert(finalPrizes);
            }

            setShowModal(false);
            fetchRifas();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir rifa? Isso apagará participantes e prêmios.')) return;
        try {
            const { error } = await supabase.from('rifas').delete().eq('id', id);
            if (error) throw error;
            fetchRifas();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'ativa' ? 'finalizada' : 'ativa';
        try {
            const { error } = await supabase.from('rifas').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            fetchRifas();
        } catch (error: any) {
            alert('Erro ao atualizar status: ' + error.message);
        }
    };

    // --- Management Logic ---
    const openManageModal = async (rifaId: number) => {
        setSelectedRifaId(rifaId);
        setShowManageModal(true);
        fetchParticipants(rifaId);
    };

    const fetchParticipants = async (rifaId: number) => {
        const { data } = await supabase.from('participantes_rifa').select('*').eq('rifa_id', rifaId).order('created_at');
        if (data) setParticipants(data);
    };

    const confirmPayment = async (participantId: number, numbers: number[]) => {
        if (!selectedRifaId) return;
        try {
            const { error } = await supabase.rpc('confirmar_pagamento', {
                participante_id_param: participantId,
                rifa_id_param: selectedRifaId,
                numeros_param: numbers
            });
            if (error) throw error;
            alert('Pagamento confirmado!');
            fetchParticipants(selectedRifaId);
        } catch (error: any) {
            alert('Erro: ' + error.message);
        }
    };

    const cancelReservation = async (participantId: number, numbers: number[]) => {
        if (!selectedRifaId || !confirm('Cancelar reserva?')) return;
        try {
            const { error } = await supabase.rpc('cancelar_reserva', {
                participante_id_param: participantId,
                rifa_id_param: selectedRifaId,
                numeros_param: numbers
            });
            if (error) throw error;
            alert('Reserva cancelada!');
            fetchParticipants(selectedRifaId);
        } catch (error: any) {
            alert('Erro: ' + error.message);
        }
    };

    // --- Draw Logic ---
    const openDrawModal = async (rifa: Rifa) => {
        setDrawRifa(rifa);
        const { data } = await supabase.from('premios').select('*').eq('rifa_id', rifa.id).order('ordem');
        if (data) setDrawPrizes(data);
        setShowDrawModal(true);
    };

    const performDraw = async (prizeId: number, prizeDesc: string) => {
        if (!drawRifa) return;
        setDrawing(true);

        // Fetch paid participants
        const { data: participants } = await supabase
            .from('participantes_rifa')
            .select('nome, numeros_escolhidos')
            .eq('rifa_id', drawRifa.id)
            .eq('status_pagamento', 'pago');

        if (!participants || participants.length === 0) {
            alert('Não há participantes pagos para sortear.');
            setDrawing(false);
            return;
        }

        // Get already drawn numbers
        const { data: drawnPrizes } = await supabase
            .from('premios')
            .select('ganhador_numero')
            .eq('rifa_id', drawRifa.id)
            .not('ganhador_numero', 'is', null);

        const drawnNumbers = new Set(drawnPrizes?.map(p => p.ganhador_numero));

        // Build pool
        const pool: { number: number, name: string }[] = [];
        participants.forEach(p => {
            p.numeros_escolhidos.forEach((n: number) => {
                if (!drawnNumbers.has(n)) {
                    pool.push({ number: n, name: p.nome });
                }
            });
        });

        if (pool.length === 0) {
            alert('Todos os números pagos já foram sorteados!');
            setDrawing(false);
            return;
        }

        // Animation
        const interval = setInterval(() => {
            const random = pool[Math.floor(Math.random() * pool.length)];
            setDrawAnimation(String(random.number).padStart(3, '0'));
        }, 100);

        setTimeout(async () => {
            clearInterval(interval);
            const winner = pool[Math.floor(Math.random() * pool.length)];
            setDrawAnimation(String(winner.number).padStart(3, '0'));

            // Save winner
            const { error } = await supabase.from('premios').update({
                ganhador_nome: winner.name,
                ganhador_numero: winner.number
            }).eq('id', prizeId);

            if (error) {
                alert('Erro ao salvar vencedor: ' + error.message);
            } else {
                // Notification
                await supabase.from('notificacoes_push_queue').insert({
                    titulo: '🎉 Temos um Vencedor!',
                    mensagem: `Parabéns ${winner.name}! Você ganhou "${prizeDesc}" com o número ${winner.number}.`,
                    link_url: `/acompanhar-rifa?id=${drawRifa.id}`,
                    status: 'rascunho'
                });

                // Refresh prizes
                const { data } = await supabase.from('premios').select('*').eq('rifa_id', drawRifa.id).order('ordem');
                if (data) setDrawPrizes(data);
            }
            setDrawing(false);
        }, 3000);
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Gerenciar Rifas</h1>
                <button className="btn-admin btn-adicionar" onClick={() => openModal()}>
                    <Plus size={18} style={{ marginRight: '5px' }} /> Nova Rifa
                </button>
            </div>

            <table className="admin-tabela">
                <thead>
                    <tr>
                        <th>Rifa</th>
                        <th>Progresso</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {rifas.map(rifa => {
                        const sold = rifa.numeros_vendidos ? rifa.numeros_vendidos.length : 0;
                        const percent = (sold / rifa.total_numeros) * 100;
                        return (
                            <tr key={rifa.id}>
                                <td>{rifa.nome_premio}</td>
                                <td>{sold} / {rifa.total_numeros} ({percent.toFixed(1)}%)</td>
                                <td>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={rifa.status === 'ativa'}
                                            onChange={() => toggleStatus(rifa.id, rifa.status)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </td>
                                <td>
                                    <div className="acoes-btn">
                                        <button className="btn-admin-acao btn-sortear" onClick={() => openDrawModal(rifa)}>Sortear</button>
                                        <button className="btn-admin-acao btn-participantes" onClick={() => openManageModal(rifa.id)}>Participantes</button>
                                        <button className="btn-admin-acao btn-editar" onClick={() => openModal(rifa)}>Editar</button>
                                        <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(rifa.id)}>Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="admin-mobile-list">
                {rifas.map(rifa => {
                    const sold = rifa.numeros_vendidos ? rifa.numeros_vendidos.length : 0;
                    const percent = (sold / rifa.total_numeros) * 100;
                    return (
                        <div key={rifa.id} className="admin-mobile-card">
                            <div className="admin-mobile-card-header">
                                <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1.2rem' }}>{rifa.nome_premio}</h3>
                                <label className="switch" style={{ transform: 'scale(0.8)' }}>
                                    <input
                                        type="checkbox"
                                        checked={rifa.status === 'ativa'}
                                        onChange={() => toggleStatus(rifa.id, rifa.status)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="admin-mobile-card-body">
                                <p><strong>Progresso:</strong> {sold} / {rifa.total_numeros} ({percent.toFixed(1)}%)</p>
                                <div style={{ width: '100%', height: '10px', background: '#333', borderRadius: '5px', marginTop: '5px' }}>
                                    <div style={{ width: `${percent}%`, height: '100%', background: 'var(--cor-destaque)', borderRadius: '5px' }}></div>
                                </div>
                            </div>
                            <div className="admin-mobile-card-actions" style={{ flexWrap: 'wrap' }}>
                                <button className="btn-admin-acao btn-sortear" onClick={() => openDrawModal(rifa)} style={{ flex: '1 1 45%' }}>Sortear</button>
                                <button className="btn-admin-acao btn-participantes" onClick={() => openManageModal(rifa.id)} style={{ flex: '1 1 45%' }}>Participantes</button>
                                <button className="btn-admin-acao btn-editar" onClick={() => openModal(rifa)} style={{ flex: '1 1 45%' }}>Editar</button>
                                <button className="btn-admin-acao btn-excluir" onClick={() => handleDelete(rifa.id)} style={{ flex: '1 1 45%' }}>Excluir</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="modal-admin-container visivel">
                    <div className="modal-admin">
                        <button className="modal-fechar-btn" onClick={() => setShowModal(false)}>&times;</button>
                        <h2 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '25px' }}>
                            {editingRifa ? 'Editar Rifa' : 'Nova Rifa'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="form-campo">
                                <label>Nome do Prêmio Principal</label>
                                <input
                                    type="text"
                                    value={nomePremio}
                                    onChange={e => setNomePremio(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-campo">
                                <label>Descrição</label>
                                <textarea
                                    value={descricao}
                                    onChange={e => setDescricao(e.target.value)}
                                    required
                                    rows={3}
                                />
                            </div>
                            <div className="form-campo">
                                <label>Preço por Número</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={precoNumero}
                                    onChange={e => setPrecoNumero(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-campo">
                                <label>Total de Números</label>
                                <input
                                    type="number"
                                    value={totalNumeros}
                                    onChange={e => setTotalNumeros(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-campo">
                                <label>Imagem de Capa</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCapaChange}
                                />
                                {imagemCapaPreview && <img src={imagemCapaPreview} alt="Preview" style={{ width: '100px', marginTop: '10px' }} />}
                            </div>

                            <hr style={{ borderColor: '#555', margin: '25px 0' }} />
                            <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '15px' }}>Gerenciar Prêmios</h3>

                            {premios.map((premio, index) => (
                                <div key={index} className="premio-item">
                                    <div className="premio-item-header">
                                        <label>{index + 1}º Prêmio</label>
                                        {index > 0 && (
                                            <button type="button" onClick={() => removePrizeField(index)} className="btn-admin btn-excluir" style={{ padding: '5px 10px' }}>Remover</button>
                                        )}
                                    </div>
                                    <div className="premio-item-body">
                                        <div className="premio-campo-descricao">
                                            <input
                                                type="text"
                                                placeholder="Descrição do prêmio"
                                                value={premio.descricao}
                                                onChange={e => handlePrizeChange(index, 'descricao', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="premio-campo-imagem">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => e.target.files && handlePrizeChange(index, 'file', e.target.files[0])}
                                            />
                                            {premio.imagemPreview && <img src={premio.imagemPreview} alt="Preview" style={{ width: '50px', marginTop: '5px' }} />}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={addPrizeField} className="btn-admin btn-editar" style={{ color: 'black', width: '100%', marginTop: '10px' }}>+ Adicionar Prêmio</button>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-admin btn-cancelar">Cancelar</button>
                                <button type="submit" className="btn-admin btn-adicionar" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar Rifa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Participants Modal */}
            {showManageModal && (
                <div className="modal-admin-container visivel">
                    <div className="modal-admin" style={{ maxWidth: '800px' }}>
                        <button className="modal-fechar-btn" onClick={() => setShowManageModal(false)}>&times;</button>
                        <h2 className="titulo-secao">Gerenciar Participantes</h2>
                        <div className="participants-list">
                            {participants.length === 0 ? <p>Nenhum participante.</p> : (
                                <ul className="lista-participantes">
                                    {participants.map(p => (
                                        <li key={p.id} className="participante-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong>{p.nome}</strong> <small>(Tel: {p.telefone})</small><br />
                                                <small>Números: {p.numeros_escolhidos.join(', ')}</small><br />
                                                <span style={{ color: p.status_pagamento === 'pago' ? '#00ff88' : '#ffcc00' }}>
                                                    {p.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                                                </span>
                                            </div>
                                            <div className="acoes-btn">
                                                {p.status_pagamento === 'pendente' && (
                                                    <button className="btn-admin btn-adicionar" style={{ padding: '5px 10px', fontSize: '0.8em' }} onClick={() => confirmPayment(p.id, p.numeros_escolhidos)}>Confirmar</button>
                                                )}
                                                <button className="btn-admin btn-excluir" style={{ padding: '5px 10px', fontSize: '0.8em' }} onClick={() => cancelReservation(p.id, p.numeros_escolhidos)}>Cancelar</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Draw Modal */}
            {showDrawModal && drawRifa && (
                <div className="modal-admin-container visivel">
                    <div className="modal-admin" style={{ maxWidth: '500px', textAlign: 'center' }}>
                        <button className="modal-fechar-btn" onClick={() => setShowDrawModal(false)}>&times;</button>
                        <h2 className="titulo-secao">Sorteio: {drawRifa.nome_premio}</h2>

                        <div id="sorteio-animacao" style={{ display: 'block' }}>
                            {drawAnimation}
                        </div>

                        <ul id="sorteio-lista-premios">
                            {drawPrizes.map(prize => (
                                <li key={prize.id} className="premio-sorteio-item">
                                    <div className="premio-sorteio-info">
                                        <strong>{prize.ordem}º Prêmio:</strong> {prize.descricao}
                                        {prize.ganhador_nome && (
                                            <div className="vencedor-destaque">
                                                🏆 Vencedor: {prize.ganhador_nome} (Nº {prize.ganhador_numero})
                                            </div>
                                        )}
                                    </div>
                                    {!prize.ganhador_nome && (
                                        <button
                                            className="btn-admin btn-sortear"
                                            onClick={() => performDraw(prize.id, prize.descricao)}
                                            disabled={drawing}
                                        >
                                            {drawing ? 'Sorteando...' : 'Sortear'}
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
