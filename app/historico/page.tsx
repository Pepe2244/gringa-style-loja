'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Rifa, Premio } from '@/types';

export default function HistoricoPage() {
    const [rifas, setRifas] = useState<Rifa[]>([]);
    const [premios, setPremios] = useState<Premio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data: rifasData } = await supabase
                .from('rifas')
                .select('*')
                .eq('status', 'finalizada')
                .order('created_at', { ascending: false });

            const { data: premiosData } = await supabase
                .from('premios')
                .select('*')
                .not('vencedor_nome', 'is', null)
                .order('ordem', { ascending: true });

            if (rifasData) setRifas(rifasData);
            if (premiosData) setPremios(premiosData);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const censurarNome = (nome: string) => {
        if (!nome) return '';
        const partes = nome.trim().split(' ').filter(p => p.length > 0);
        if (partes.length <= 1) return nome;
        const primeiroNome = partes[0];
        const sobrenomesCensurados = partes.slice(1).map(parte => {
            return parte.charAt(0) + '*'.repeat(parte.length - 1);
        }).join(' ');
        return `${primeiroNome} ${sobrenomesCensurados}`;
    };

    const censurarNumero = (numero: number, totalDigitos: number) => {
        if (numero === null || numero === undefined) return '';
        const numeroString = String(numero).padStart(totalDigitos, '0');
        const metadeVisivel = Math.ceil(numeroString.length / 2);
        return numeroString.substring(0, metadeVisivel) + '*'.repeat(numeroString.length - metadeVisivel);
    };

    if (loading) {
        return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando histórico...</div>;
    }

    return (
        <div className="container historico-container">
            <h1 className="titulo-secao">Histórico de Rifas</h1>
            <div id="historico-lista">
                {rifas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#ccc' }}>Nenhuma rifa foi finalizada ainda.</p>
                ) : (
                    rifas.map(rifa => {
                        const premiosDaRifa = premios.filter(p => p.rifa_id === rifa.id);
                        if (premiosDaRifa.length === 0) return null;

                        const totalDigitos = String(rifa.total_numeros - 1).length;

                        return (
                            <div key={rifa.id} className="rifa-encerrada-card">
                                <h3>{rifa.nome_premio}</h3>
                                <p>Sorteio realizado. Total de {rifa.total_numeros} números concorreram.</p>

                                {premiosDaRifa.map(premio => (
                                    <div key={premio.id} className="vencedor-info" style={{ marginTop: '10px', overflow: 'hidden', textAlign: 'left' }}>
                                        {premio.imagem_url && (
                                            <img
                                                src={`${premio.imagem_url}?format=webp&width=100&quality=75`}
                                                alt={premio.descricao}
                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', marginRight: '15px', float: 'left' }}
                                            />
                                        )}
                                        <div style={{ overflow: 'hidden' }}>
                                            <strong style={{ color: '#fff', fontSize: '1.1em' }}>{premio.ordem}º Prêmio:</strong> {premio.descricao} <br />
                                            <strong>Vencedor(a):</strong> {censurarNome(premio.vencedor_nome || '')} <br />
                                            <strong>Número:</strong> {censurarNumero(premio.vencedor_numero!, totalDigitos)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
