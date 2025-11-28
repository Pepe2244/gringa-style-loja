'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ConfigManager() {
    const [diasNovo, setDiasNovo] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle();
        if (data) setDiasNovo(data.valor);
    };

    const handleSave = async () => {
        if (!diasNovo) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('configuracoes').upsert({ chave: 'dias_novo', valor: diasNovo });
            if (error) throw error;
            alert('Configurações salvas!');
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Configurações da Loja</h1>
            </div>

            <div className="admin-container" style={{ marginTop: '20px', background: '#222', padding: '20px', borderRadius: '8px' }}>
                <div className="form-campo">
                    <label>Dias de Destaque "NOVO"</label>
                    <input
                        type="number"
                        value={diasNovo}
                        onChange={(e) => setDiasNovo(e.target.value)}
                        placeholder="Ex: 7"
                        style={{ maxWidth: '150px' }}
                    />
                    <small>Produtos criados há menos de X dias receberão o selo "NOVO".</small>
                </div>

                <button className="btn-admin btn-adicionar" onClick={handleSave} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    );
}
