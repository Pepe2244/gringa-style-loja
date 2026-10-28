'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Rifa, Premio } from '@/types';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { BreadcrumbSchema, WebPageSchema } from '@/components/SEO/StructuredData';

export default function HistoricoPage() {
    const [rifas, setRifas] = useState<Rifa[]>([]);
    const [premios, setPremios] = useState<Premio[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/rifas/history');
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao buscar histórico.');
            setRifas(data.rifas || []);
            setPremios(data.premios || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const censurarNumero = (numero: number, totalDigitos: number) => {
        if (numero === null || numero === undefined) return '';
        const numeroString = String(numero).padStart(totalDigitos, '0');
        const metadeVisivel = Math.ceil(numeroString.length / 2);
        return numeroString.substring(0, metadeVisivel) + '*'.repeat(numeroString.length - metadeVisivel);
    };

    return (
        <>
            <WebPageSchema page={{
                name: 'Histórico de Rifas e Sorteios | Gringa Style',
                description: 'Confira o histórico completo das rifas realizadas pela Gringa Style. Veja os vencedores e prêmios sorteados.',
                url: '/historico'
            }} />
            <BreadcrumbSchema items={[
                { name: 'Gringa Style', url: '/' },
                { name: 'Histórico', url: '/historico' }
            ]} />
            <div className="container historico-container">
                <h1 className="titulo-secao">Histórico de Rifas</h1>
                <p style={{ textAlign: 'center', color: '#ccc', maxWidth: '760px', margin: '0 auto 30px', lineHeight: '1.6' }}>
                    Transparência total em cada sorteio realizado pela Gringa Style. Todas as ações entre amigos são auditadas pelos resultados oficiais da Loteria Federal, premiando soldadores de todo o Brasil com máscaras personalizadas, tochas TIG e EPIs.
                </p>
                {loading ? (
                    <div style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando histórico...</div>
                ) : (
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
                                    ? getProxiedImageUrl(rifa.imagem_premio_url)
                                    : '/imagens/logo_gringa_style.png';

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
                                            <Image
                                                src={rifaImagem}
                                                alt={rifa.nome_premio}
                                                width={80}
                                                height={80}
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
                                                        <Image
                                                            src={getProxiedImageUrl(premio.imagem_url)}
                                                            alt={premio.descricao}
                                                            width={50}
                                                            height={50}
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
                                                            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>Ganhador:</span> {premio.vencedor_nome}
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
                )}

                <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <Link href="/rifa" className="btn btn-secundario">
                        Participar da Rifa Atual
                    </Link>
                    <Link href="/loja" className="btn btn-secundario">
                        Ir para a Loja Gringa Style
                    </Link>
                </div>
            </div>
        </>
    );
}
