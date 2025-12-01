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
            <div id="historico-lista" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {rifas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#ccc' }}>Nenhuma rifa foi finalizada ainda.</p>
                ) : (
                    rifas.map(rifa => {
                        const premiosDaRifa = premios.filter(p => p.rifa_id === rifa.id);
                        if (premiosDaRifa.length === 0) return null;

                        const totalDigitos = String(rifa.total_numeros - 1).length;

                        // Fallback para logo se não houver imagem da rifa
                        const rifaImagem = rifa.imagem_premio_url
                            ? `${rifa.imagem_premio_url}?format=webp&width=150&quality=75`
                            : '/imagens/gringa_style_logo.png';

                        return (
                            <div key={rifa.id} className="historico-card" style={{
                                backgroundColor: 'var(--cor-fundo-secundaria)',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #444',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                            }}>
                                <div className="historico-header" style={{
                                    display: 'flex',
                                    gap: '15px',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #555',
                                    paddingBottom: '15px'
                                }}>
                                    <img
                                        src={rifaImagem}
                                        alt={rifa.nome_premio}
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '5px',
                                            border: '1px solid #555'
                                        }}
                                    />
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1.4rem', fontFamily: 'var(--font-titulos)' }}>
                                            {rifa.nome_premio}
                                        </h3>
                                        <p style={{ margin: '5px 0 0 0', color: '#ccc', fontSize: '0.9rem' }}>
                                            Sorteio realizado • {rifa.total_numeros} números
                                        </p>
                                    </div>
                                </div>

                                <div className="lista-ganhadores" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {premiosDaRifa.map(premio => (
                                        <div key={premio.id} className="ganhador-item" style={{
                                            background: '#333',
                                            padding: '10px 15px',
                                            borderRadius: '5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px'
                                        }}>
                                            {premio.imagem_url ? (
                                                <img
                                                    src={`${premio.imagem_url}?format=webp&width=60&quality=75`}
                                                    alt={premio.descricao}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                <div style={{ width: '50px', height: '50px', background: '#444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏆</div>
                                            )}

                                            <div style={{ flex: 1 }}>
                                                <strong style={{ color: 'white', display: 'block' }}>
                                                    {premio.ordem}º Prêmio: <span style={{ fontWeight: 'normal', color: '#ddd' }}>{premio.descricao}</span>
                                                </strong>
                                                <div style={{ marginTop: '3px', fontSize: '0.95rem' }}>
                                                    <span style={{ color: '#00ff88', fontWeight: 'bold' }}>Ganhador:</span> {censurarNome(premio.vencedor_nome || '')}
                                                    <span style={{ color: '#ccc', marginLeft: '8px' }}>(Nº {censurarNumero(premio.vencedor_numero!, totalDigitos)})</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}