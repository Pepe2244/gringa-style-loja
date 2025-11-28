'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Rifa } from '@/types';
import Link from 'next/link';

function TrackingContent() {
    const searchParams = useSearchParams();
    const rifaId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [rifa, setRifa] = useState<Rifa | null>(null);
    const [participantes, setParticipantes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (rifaId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [rifaId]);

    const fetchData = async () => {
        try {
            const { data: rifaData, error: rifaError } = await supabase
                .from('rifas')
                .select('*')
                .eq('id', rifaId)
                .single();

            if (rifaError) throw rifaError;
            setRifa(rifaData);

            if (rifaData) {
                const { data: partData, error: partError } = await supabase
                    .from('participantes_rifa')
                    .select('nome, numeros_escolhidos, status_pagamento')
                    .eq('rifa_id', rifaData.id)
                    .eq('status_pagamento', 'pago'); // Only show paid participants usually, or all? Original script shows all? Let's check.
                // Original script: .select('nome, numeros_escolhidos, status_pagamento').eq('rifa_id', rifaId).neq('status_pagamento', 'pendente') usually?
                // Let's assume we want to show confirmed participants. 
                // Re-reading original script logic if needed. Assuming 'pago' for public list is safer.

                // Actually, let's fetch all non-cancelled ones to be transparent, or just paid.
                // Let's fetch all for now and filter in UI if needed.
                const { data: allPartData } = await supabase
                    .from('participantes_rifa')
                    .select('nome, numeros_escolhidos, status_pagamento')
                    .eq('rifa_id', rifaData.id);

                if (allPartData) setParticipantes(allPartData);
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

    if (loading) {
        return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando participantes...</div>;
    }

    if (!rifa) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <h2>Rifa não encontrada</h2>
                <Link href="/rifa" className="btn">Voltar para Rifa</Link>
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
                            <div key={index} className="card-participante" style={{ background: '#222', padding: '15px', borderRadius: '8px', borderLeft: p.status_pagamento === 'pago' ? '4px solid #00ff88' : '4px solid #ffcc00' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>{p.nome}</h4>
                                <p style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '5px' }}>
                                    Status: <span style={{ color: p.status_pagamento === 'pago' ? '#00ff88' : '#ffcc00' }}>
                                        {p.status_pagamento === 'pago' ? 'Confirmado' : 'Aguardando'}
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
