'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Send, CheckCircle } from 'lucide-react';

export default function PushNotificationManager() {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('/');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        const { data } = await supabase
            .from('notificacoes_push_queue')
            .select('*')
            .eq('status', 'rascunho')
            .order('created_at', { ascending: false });

        if (data) setDrafts(data);
    };

    const handleSendManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('Enviar esta notificação manual para TODOS os assinantes agora?')) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('notificacoes_push_queue').insert({
                titulo: title,
                mensagem: message,
                link_url: link,
                status: 'aprovado'
            });

            if (error) throw error;
            alert('Notificação manual enviada para a fila!');
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
        if (!confirm('Aprovar e enviar esta notificação?')) return;
        try {
            const { error } = await supabase
                .from('notificacoes_push_queue')
                .update({ status: 'aprovado' })
                .eq('id', id);

            if (error) throw error;
            alert('Notificação aprovada!');
            fetchDrafts();
        } catch (error: any) {
            alert('Erro ao aprovar: ' + error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir este rascunho?')) return;
        try {
            const { error } = await supabase.from('notificacoes_push_queue').delete().eq('id', id);
            if (error) throw error;
            fetchDrafts();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Centro de Notificações Push</h1>
            </div>

            <div className="notificacao-container" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginTop: '20px' }}>
                <div className="notificacao-coluna" style={{ flex: 1, minWidth: '300px' }}>
                    <h3 className="titulo-secao" style={{ fontSize: '1.2em', borderBottom: '1px solid #555', paddingBottom: '10px' }}>Rascunhos (Automáticos)</h3>
                    {drafts.length === 0 ? (
                        <p>Nenhum rascunho pendente.</p>
                    ) : (
                        <ul className="lista-notificacoes" style={{ listStyle: 'none', padding: 0 }}>
                            {drafts.map(draft => (
                                <li key={draft.id} className="notificacao-item" style={{ background: '#222', padding: '15px', borderRadius: '5px', marginBottom: '10px', borderLeft: '3px solid var(--cor-destaque)' }}>
                                    <h4 style={{ color: '#eee', marginBottom: '5px' }}>{draft.titulo}</h4>
                                    <p style={{ color: '#ccc', fontSize: '0.9em', marginBottom: '10px' }}>{draft.mensagem}</p>
                                    <small style={{ color: '#888', fontStyle: 'italic', display: 'block', marginBottom: '10px' }}>Link: {draft.link_url}</small>
                                    <div className="acoes-btn" style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn-admin btn-adicionar" onClick={() => handleApprove(draft.id)} style={{ fontSize: '0.8em', padding: '5px 10px' }}>
                                            <CheckCircle size={14} style={{ marginRight: '5px' }} /> Aprovar
                                        </button>
                                        <button className="btn-admin btn-excluir" onClick={() => handleDelete(draft.id)} style={{ fontSize: '0.8em', padding: '5px 10px' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="notificacao-coluna" style={{ flex: 1, minWidth: '300px' }}>
                    <h3 className="titulo-secao" style={{ fontSize: '1.2em', borderBottom: '1px solid #555', paddingBottom: '10px' }}>Criar Notificação Manual</h3>
                    <div style={{ background: '#222', padding: '20px', borderRadius: '8px' }}>
                        <form onSubmit={handleSendManual}>
                            <div className="form-campo">
                                <label>Título</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: 🔥 PROMOÇÃO RELÂMPAGO!" />
                            </div>
                            <div className="form-campo">
                                <label>Mensagem</label>
                                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3} placeholder="Ex: A Máscara Gringa Style com 20% OFF. Só hoje!"></textarea>
                            </div>
                            <div className="form-campo">
                                <label>Link (Opcional)</label>
                                <input type="text" value={link} onChange={e => setLink(e.target.value)} placeholder="Ex: /produto?id=1" />
                                <small>Deixe em branco para abrir a página inicial.</small>
                            </div>
                            <button type="submit" className="btn-admin btn-adicionar" disabled={loading} style={{ width: '100%' }}>
                                Enviar para Todos Assinantes
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
