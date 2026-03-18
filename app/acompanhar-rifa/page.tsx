'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Rifa } from '@/types';
import Link from 'next/link';

function TrackingContent() {
    const searchParams = useSearchParams();
    const rifaIdParam = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [rifa, setRifa] = useState<Rifa | null>(null);
    const [participantes, setParticipantes] = useState<any[]>([]);
    const [premios, setPremios] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [rifaIdParam]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let rifaData = null;

            // 1. Tenta buscar pelo ID da URL
            if (rifaIdParam) {
                const { data, error } = await supabase
                    .from('rifas')
                    .select('*')
                    .eq('id', rifaIdParam)
                    .single();

                if (!error) rifaData = data;
            }

            // 2. Se não achou por ID (ou não tem ID), busca a rifa ATIVA
            if (!rifaData) {
                const { data, error } = await supabase
                    .from('rifas')
                    .select('*')
                    .eq('status', 'ativa')
                    .limit(1)
                    .maybeSingle();

                if (!error) rifaData = data;
            }

            if (rifaData) {
                setRifa(rifaData);

                // Busca participantes da rifa encontrada
                const { data: allPartData, error: partError } = await supabase
                    .from('participantes_rifa')
                    .select('nome, numeros_escolhidos, status_pagamento')
                    .eq('rifa_id', rifaData.id);

                if (allPartData) {
                    setParticipantes(allPartData);
                }

                if (rifaData.status === 'finalizada') {
                    const { data: premiosData } = await supabase
                        .from('premios')
                        .select('vencedor_numero, vencedor_nome, vencedor_telefone')
                        .eq('rifa_id', rifaData.id);
                        
                    if (premiosData) setPremios(premiosData);
                }
            }
        } catch (error) {
            console.error('Error fetching tracking data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredParticipantes = participantes.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.numeros_escolhidos.some((n: number) => String(n).includes(searchTerm))
    );

    const censurarNome = (nome: string) => {
        if (!nome) return '';
        const partes = nome.trim().split(' ').filter(p => p.length > 0);
        return `${partes[0]} ************`;
    };

    const censurarTelefone = (telefone: string) => {
        if (!telefone) return '';
        const apenasNumeros = telefone.replace(/\D/g, '');
        if (apenasNumeros.length < 10) return telefone;
        const ddd = apenasNumeros.substring(0, 2);
        const inicio = apenasNumeros.substring(2, 7);
        return `(${ddd}) ${inicio}-****`;
    };

    if (loading) {
        return (
            <div className="container">
                <div style={{ background: '#333', borderRadius: '8px', height: '44px', width: '60%', margin: '0 auto 30px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ background: '#333', borderRadius: '25px', height: '46px', maxWidth: '500px', margin: '0 auto 30px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: '#222', borderRadius: '8px', height: '110px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    ))}
                </div>
                <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.25} }`}</style>
            </div>
        );
    }

    if (!rifa) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎟️</div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Nenhuma rifa encontrada</h2>
                <p style={{ color: '#aaa', marginBottom: '30px' }}>Não há rifas ativas ou o ID informado é inválido.</p>
                <Link href="/rifa" className="btn" style={{ display: 'inline-block' }}>Ver Rifas Disponíveis</Link>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="titulo-secao">Participantes da Rifa: {rifa.nome_premio}</h1>

            {rifa.status === 'finalizada' && (
                <div style={{ background: 'rgba(255, 165, 0, 0.1)', border: '2px solid orange', padding: '20px', borderRadius: '10px', marginBottom: '30px', textAlign: 'center', maxWidth: '600px', margin: '0 auto 30px' }}>
                    <h2 style={{ color: 'orange', margin: '0 0 15px 0' }}>🏆 RIFA ENCERRADA E SORTEADA 🏆</h2>
                    {premios.find(p => p.vencedor_numero === rifa.numero_vencedor) ? (() => {
                        const vencedor = premios.find(p => p.vencedor_numero === rifa.numero_vencedor);
                        const totalDigitos = String(rifa.total_numeros - 1).length;
                        return (
                            <div style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                                <p style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px' }}>
                                    Número Sorteado: <br/><strong style={{ fontSize: '2.5rem', color: '#00ff88', letterSpacing: '2px' }}>{String(rifa.numero_vencedor).padStart(totalDigitos, '0')}</strong>
                                </p>
                                <p style={{ color: '#ccc', margin: '5px 0', fontSize: '1.1rem' }}>Ganhador: <strong style={{color: 'white'}}>{censurarNome(String(vencedor.vencedor_nome))}</strong></p>
                                <p style={{ color: '#ccc', margin: '5px 0', fontSize: '1.1rem' }}>Contato: <strong style={{color: 'white'}}>{censurarTelefone(String(vencedor.vencedor_telefone))}</strong></p>
                            </div>
                        );
                    })() : (
                        <p style={{ color: 'white' }}>Nenhum vencedor atribuído no momento.</p>
                    )}
                </div>
            )}

            <div className="search-container" style={{ maxWidth: '500px', margin: '0 auto 30px' }}>
                <input
                    type="search"
                    placeholder="Buscar por nome ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '25px', border: 'none', background: '#333', color: 'white' }}
                />
            </div>

            <div className="lista-participantes">
                {filteredParticipantes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔍</div>
                        <h3 style={{ color: '#fff', marginBottom: '8px' }}>
                            {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum participante ainda'}
                        </h3>
                        <p style={{ color: '#aaa' }}>
                            {searchTerm
                                ? `Nenhum participante corresponde a "${searchTerm}". Tente outro nome ou número.`
                                : 'Seja o primeiro a participar desta rifa!'}
                        </p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={{ marginTop: '16px', background: 'var(--cor-destaque)', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', color: 'black' }}>
                                Limpar busca
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                        {filteredParticipantes.map((p, index) => (
                            <div key={index} className="card-participante" style={{
                                background: '#222',
                                padding: '15px',
                                borderRadius: '8px',
                                borderLeft: p.status_pagamento === 'pago' ? '4px solid #00ff88' : (p.status_pagamento === 'cancelado' ? '4px solid #ff4444' : '4px solid #ffcc00')
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>{censurarNome(p.nome)}</h4>
                                <p style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '5px' }}>
                                    Status: <span style={{
                                        color: p.status_pagamento === 'pago' ? '#00ff88' : (p.status_pagamento === 'cancelado' ? '#ff4444' : '#ffcc00'),
                                        fontWeight: 'bold'
                                    }}>
                                        {p.status_pagamento === 'pago' ? 'Confirmado' : (p.status_pagamento === 'cancelado' ? 'Cancelado' : 'Aguardando')}
                                    </span>
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {p.numeros_escolhidos.map((n: number) => (
                                        <span key={n} style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em' }}>
                                            {String(n).padStart(String(rifa.total_numeros - 1).length, '0')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <Link href="/rifa" className="btn btn-secundario">Voltar para a Rifa</Link>
            </div>
        </div>
    );
}

export default function TrackingPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando...</div>}>
            <TrackingContent />
        </Suspense>
    );
}