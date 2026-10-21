'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { saveShopConfig } from '@/app/actions/admin-data';

export default function ConfigManager() {
    const [diasNovo, setDiasNovo] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchConfig = async () => {
        const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle();
        if (data) setDiasNovo(data.valor);
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSave = async () => {
        const parsedDays = parseInt(diasNovo, 10);
        if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
            alert('Informe um número de dias válido entre 1 e 365.');
            return;
        }
        setLoading(true);
        try {
            const result = await saveShopConfig(parsedDays);
            if (!result.success) throw new Error(result.error);
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

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="admin-container" style={{ marginTop: '20px', background: '#222', padding: '20px', borderRadius: '8px' }}>
                <div className="form-campo">
                    <label>Dias de Destaque &quot;NOVO&quot;</label>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={diasNovo}
                        onChange={(e) => setDiasNovo(e.target.value)}
                        placeholder="Ex: 7"
                        style={{ maxWidth: '150px' }}
                    />
                    <small>Produtos criados há menos de X dias receberão o selo &quot;NOVO&quot;.</small>
                </div>

                <button type="submit" className="btn-admin btn-adicionar" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </form>
        </div>
    );
}
