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
                    // Opcional: filtrar apenas pagos se quiser esconder pendentes/cancelados do público
                    // const confirmed = allPartData.filter(p => p.status_pagamento === 'pago');
                    setParticipantes(allPartData);
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
        if (partes.length <= 1) return nome;
        const primeiroNome = partes[0];
        const sobrenomesCensurados = partes.slice(1).map(parte => {
            return parte.charAt(0) + '*'.repeat(parte.length - 1);
        }).join(' ');
        return `${primeiroNome} ${sobrenomesCensurados}`;
    };

    if (loading) {
        return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando participantes...</div>;
    }

    if (!rifa) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <h2>Nenhuma rifa encontrada</h2>
                <p>Não há rifas ativas ou o ID informado é inválido.</p>
                <Link href="/rifa" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>Voltar para Rifa</Link>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="titulo-secao">Participantes da Rifa: {rifa.nome_premio}</h1>

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
                    <p style={{ textAlign: 'center', color: '#ccc' }}>Nenhum participante encontrado.</p>
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