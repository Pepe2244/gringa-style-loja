'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Send, CheckCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function PushNotificationManager() {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('/');
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        const { data, error } = await supabase
            .from('notificacoes_push_queue')
            .select('*')
            .eq('status', 'rascunho')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar notificações:', error);
            alert('Erro ao buscar notificações: ' + error.message);
        }
        if (data) setDrafts(data);
    };

    const handleSendManual = async (e: React.FormEvent) => {
        e.preventDefault();

        // GROWTH HACK: Você tem certeza que quer spammar TODOS os usuários?
        if (!confirm('ATENÇÃO: Enviar push genérico para TODOS os usuários tem alta taxa de descadastro. Deseja prosseguir?')) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('notificacoes_push_queue').insert({
                titulo: title,
                mensagem: message,
                link_url: link,
                status: 'aprovado' // Assume-se que um gatilho de DB ou Edge Function vai capturar isso e disparar.
            });

            if (error) throw error;
            alert('Notificação manual inserida na fila de disparo!');
            setTitle('');
            setMessage('');
            setLink('/');
        } catch (error: any) {
            alert('Erro ao enviar notificação: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Aprovar e disparar esta notificação agora?')) return;

        // Optimistic UI: Tira da tela imediatamente para dar feedback de velocidade ao usuário
        const updatedDrafts = drafts.filter(d => d.id !== id);
        setDrafts(updatedDrafts);

        try {
            const { error } = await supabase
                .from('notificacoes_push_queue')
                .update({ status: 'aprovado' })
                .eq('id', id);

            if (error) throw error;
            // Não fazemos o fetchDrafts() aqui. A tela já atualizou na linha 62.

        } catch (error: any) {
            // Se der erro no banco, revertemos a tela e avisamos.
            alert('Erro crítico ao aprovar: ' + error.message);
            fetchDrafts(); 
        }
    };

    const handleDelete = (id: number) => setConfirmDelete(id);

    const executeDelete = async () => {
        if (!confirmDelete) return;
        const updatedDrafts = drafts.filter(d => d.id !== confirmDelete);
        setDrafts(updatedDrafts);
        setConfirmDelete(null);
        try {
            const { error } = await supabase.from('notificacoes_push_queue').delete().eq('id', confirmDelete);
            if (error) throw error;
        } catch (error: any) {
            alert('Erro ao excluir no banco de dados: ' + error.message);
            fetchDrafts();
        }
    };

    return (
        <div className="admin-container font-sans">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Centro de Notificações Push</h1>
            </div>

            <div className="notificacao-container" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginTop: '20px' }}>
                <div className="notificacao-coluna" style={{ flex: 1, minWidth: '300px' }}>
                    <h3 className="titulo-secao" style={{ fontSize: '1.2em', borderBottom: '1px solid #555', paddingBottom: '10px' }}>Rascunhos (Gatilhos Automáticos)</h3>
                    {drafts.length === 0 ? (
                        <p style={{ color: '#888' }}>Nenhum rascunho pendente na fila.</p>
                    ) : (
                        <ul className="lista-notificacoes" style={{ listStyle: 'none', padding: 0 }}>
                            {drafts.map(draft => (
                                <li key={draft.id} className="notificacao-item" style={{ background: '#1A1A1A', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid orange' }}>
                                    <h4 style={{ color: 'white', marginBottom: '5px', fontSize: '1.1rem' }}>{draft.titulo}</h4>
                                    <p style={{ color: '#aaa', fontSize: '0.95em', marginBottom: '10px' }}>{draft.mensagem}</p>
                                    <small style={{ color: '#777', fontStyle: 'italic', display: 'block', marginBottom: '15px' }}>🔗 Destino: {draft.link_url || 'Home'}</small>
                                    <div className="acoes-btn" style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            className="btn-admin btn-adicionar"
                                            onClick={(e) => { e.preventDefault(); handleApprove(draft.id); }}
                                            style={{ fontSize: '0.85em', padding: '8px 12px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                        >
                                            <CheckCircle size={16} style={{ marginRight: '5px' }} /> Aprovar Disparo
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-admin btn-excluir"
                                            onClick={(e) => { e.preventDefault(); handleDelete(draft.id); }}
                                            style={{ fontSize: '0.85em', padding: '8px 12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="notificacao-coluna" style={{ flex: 1, minWidth: '300px' }}>
                    <h3 className="titulo-secao" style={{ fontSize: '1.2em', borderBottom: '1px solid #555', paddingBottom: '10px' }}>Criar Disparo Manual</h3>
                    <div style={{ background: '#1A1A1A', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                        <form onSubmit={handleSendManual}>
                            <div className="form-campo">
                                <label style={{ color: '#ccc' }}>Título da Notificação</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    required 
                                    placeholder="Ex: 🔥 ÚLTIMAS HORAS DA RIFA!" 
                                    style={{ background: '#111', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '4px', width: '100%' }}
                                />
                            </div>
                            <div className="form-campo" style={{ marginTop: '15px' }}>
                                <label style={{ color: '#ccc' }}>Mensagem (Curta e Direta)</label>
                                <textarea 
                                    value={message} 
                                    onChange={e => setMessage(e.target.value)} 
                                    required 
                                    rows={3} 
                                    placeholder="Ex: Faltam só 50 números para o sorteio. Vai ficar de fora?"
                                    style={{ background: '#111', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '4px', width: '100%', resize: 'vertical' }}
                                ></textarea>
                            </div>
                            <div className="form-campo" style={{ marginTop: '15px' }}>
                                <label style={{ color: '#ccc' }}>Link de Destino (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={link} 
                                    onChange={e => setLink(e.target.value)} 
                                    placeholder="Ex: /rifa" 
                                    style={{ background: '#111', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '4px', width: '100%' }}
                                />
                                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Para onde o usuário vai ao clicar na notificação.</small>
                            </div>
                            <button 
                                type="submit" 
                                className="btn-admin" 
                                disabled={loading} 
                                style={{ width: '100%', marginTop: '20px', padding: '12px', background: 'orange', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
                            >
                                {loading ? 'Enviando para a fila...' : 'Disparar para Todos Assinantes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}


