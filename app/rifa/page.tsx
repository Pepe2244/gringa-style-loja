'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Rifa, Premio } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { reservarNumerosRifa } from '@/app/actions/rifa';

export default function RifaPage() {
    const { showToast } = useToast();
    const [rifa, setRifa] = useState<Rifa | null>(null);
    const [premios, setPremios] = useState<Premio[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [reserving, setReserving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchRifa();

        // Realtime Subscription
        const channel = supabase
            .channel('rifa-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rifas',
                    filter: rifa ? `id=eq.${rifa.id}` : undefined
                },
                (payload) => {
                    console.log('Rifa updated:', payload);
                    fetchRifa();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [rifa?.id]);

    const fetchRifa = async () => {
        setLoading(true);
        try {
            const { data: rifaData, error: rifaError } = await supabase
                .from('rifas')
                .select('*')
                .eq('status', 'ativa')
                .limit(1)
                .maybeSingle();

            if (rifaError) throw rifaError;

            if (rifaData) {
                setRifa(rifaData);
                const { data: premiosData } = await supabase
                    .from('premios')
                    .select('*')
                    .eq('rifa_id', rifaData.id)
                    .order('ordem', { ascending: true });

                if (premiosData) setPremios(premiosData);
            }
        } catch (error) {
            console.error('Error fetching rifa:', error);
        } finally {
            setLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const toggleNumber = (number: number) => {
        if (selectedNumbers.includes(number)) {
            setSelectedNumbers(selectedNumbers.filter(n => n !== number));
        } else {
            setSelectedNumbers([...selectedNumbers, number]);
        }
    };

    const handleSurpresinha = () => {
        if (!rifa) return;
        const available = [];
        const soldSet = new Set(rifa.numeros_vendidos || []);
        const reservedSet = new Set(rifa.numeros_reservados || []);

        for (let i = 0; i < rifa.total_numeros; i++) {
            if (!soldSet.has(i) && !reservedSet.has(i) && !selectedNumbers.includes(i)) {
                available.push(i);
            }
        }

        if (available.length === 0) {
            showToast('Não há números suficientes disponíveis.', 'error');
            return;
        }

        const count = Math.min(5, available.length);
        const randomSelection = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            randomSelection.push(available[randomIndex]);
            available.splice(randomIndex, 1);
        }

        setSelectedNumbers([...selectedNumbers, ...randomSelection]);
        showToast(`${count} números aleatórios selecionados!`, 'success');
    };

    const handleReserve = async () => {
        if (!rifa) return;
        if (!clientName.trim() || !clientPhone.trim() || selectedNumbers.length === 0) {
            showToast('Por favor, preencha seu nome, telefone e selecione pelo menos um número.', 'error');
            return;
        }

        setReserving(true);
        try {
            const result = await reservarNumerosRifa(rifa.id, selectedNumbers, clientName, clientPhone);

            if (!result.success) throw new Error(result.error);

            // VERIFICAÇÃO CRÍTICA ADICIONADA
            // Garante que o retorno do banco de dados contém um ID válido antes de redirecionar
            if (!result.data || !Array.isArray(result.data) || result.data.length === 0 || !result.data[0].participante_id) {
                console.error("ERRO GRAVE: RPC retornou sucesso mas sem ID válido", result);
                throw new Error("Erro interno: Falha ao recuperar ID da reserva. Contate o suporte.");
            }

            const participantId = result.data[0].participante_id;
            console.log("Redirecionando para pagamento com ID:", participantId); // Debug log

            router.push(`/pagamento?participante_id=${participantId}`);
        } catch (error: any) {
            console.error('Error reserving numbers:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

            if (errorMessage.includes('já foi reservado')) {
                showToast('Um dos números escolhidos já foi reservado. Atualize e tente de novo.', 'error');
                fetchRifa(); // Refresh data
                setSelectedNumbers([]);
            } else {
                // Mostra o erro real se disponível, ou uma mensagem genérica
                showToast(errorMessage || 'Ocorreu um erro ao tentar reservar seus números. Tente novamente.', 'error');
            }
        } finally {
            setReserving(false);
        }
    };

    if (loading) {
        return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando rifa...</div>;
    }

    if (!rifa) {
        return (
            <div className="container" id="rifa-container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <div className="rifa-card">
                    <h1 className="titulo-secao">Nenhuma Rifa Ativa no Momento</h1>
                    <p style={{ fontSize: '1.1em' }}>Fique de olho! Em breve teremos novidades e mais prêmios incríveis por aqui.</p>
                    <br />
                    <Link href="/historico" className="btn btn-secundario">Ver Ganhadores Anteriores</Link>
                </div>
            </div>
        );
    }

    const totalDigitos = String(rifa.total_numeros - 1).length;
    const soldSet = new Set(rifa.numeros_vendidos || []);
    const reservedSet = new Set(rifa.numeros_reservados || []);
    const isSoldOut = soldSet.size >= rifa.total_numeros;

    const imageUrl = rifa.imagem_premio_url
        ? `${rifa.imagem_premio_url}?format=webp&width=600&quality=80`
        : '/imagens/placeholder.png';

    return (
        <div className="container" id="rifa-container">
            <div className="rifa-card">
                <h1 className="titulo-secao">{rifa.nome_premio}</h1>

                <img src={imageUrl} alt="Prêmio da Rifa" className="rifa-imagem-premio" />

                {premios.length > 0 && (
                    <div className="lista-premios-rifa">
                        <h4>Prêmios desta Rifa:</h4>
                        <ul style={{ listStyle: 'none', paddingLeft: 0, textAlign: 'left', maxWidth: '400px', margin: '10px auto', backgroundColor: '#111', padding: '15px', borderRadius: '5px' }}>
                            {premios.map(p => (
                                <li key={p.id} style={{ marginBottom: '8px' }}>
                                    <strong style={{ color: 'var(--cor-destaque)' }}>{p.ordem}º Prêmio:</strong> {p.descricao}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="rifa-descricao">{rifa.descricao}</p>
                <p className="rifa-preco">Apenas R$ {rifa.preco_numero.toFixed(2).replace('.', ',')} por número!</p>
                <Link href={`/acompanhar-rifa?id=${rifa.id}`} className="btn btn-secundario" style={{ marginBottom: '20px', display: 'inline-block' }}>
                    Ver Participantes
                </Link>

                <div className="rifa-progresso-container" style={{ margin: '20px 0', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Progresso:</span>
                        <span>{Math.round((soldSet.size / rifa.total_numeros) * 100)}% vendido</span>
                    </div>
                    <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${(soldSet.size / rifa.total_numeros) * 100}%`,
                                height: '100%',
                                backgroundColor: 'var(--cor-destaque)',
                                transition: 'width 0.5s ease-in-out'
                            }}
                        />
                    </div>
                    <p style={{ fontSize: '0.9em', color: '#ccc', marginTop: '5px' }}>
                        {rifa.total_numeros - soldSet.size} números restantes!
                    </p>
                </div>

                {isSoldOut ? (
                    <div className="aviso-esgotado">RIFA ESGOTADA! Obrigado a todos que participaram. O sorteio será realizado em breve!</div>
                ) : (
                    <div className="rifa-actions-container" style={{ marginBottom: '20px' }}>
                        <h3>Escolha seus números da sorte:</h3>

                        <div className="rifa-controls" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
                            <input
                                type="number"
                                placeholder="Buscar número..."
                                className="input-busca-rifa"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: 'white' }}
                            />
                            <button
                                className="btn btn-surpresinha"
                                onClick={handleSurpresinha}
                                style={{ background: 'var(--cor-destaque)', color: 'black', border: 'none', padding: '10px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                🎲 Surpresinha (5)
                            </button>
                        </div>
                    </div>
                )}

                <div className={`numeros-grid ${isSoldOut ? 'desabilitado' : ''}`}>
                    {Array.from({ length: rifa.total_numeros }).map((_, i) => {
                        const numStr = String(i).padStart(totalDigitos, '0');
                        if (searchTerm && !numStr.includes(searchTerm)) return null;

                        const isOccupied = soldSet.has(i) || reservedSet.has(i);
                        const isSelected = selectedNumbers.includes(i);

                        return (
                            <div
                                key={i}
                                className={`numero-rifa ${isOccupied ? 'ocupado' : ''} ${isSelected ? 'selecionado' : ''}`}
                                onClick={() => !isOccupied && !isSoldOut && toggleNumber(i)}
                            >
                                {numStr}
                            </div>
                        );
                    })}
                </div>

                {!isSoldOut && selectedNumbers.length > 0 && (
                    <div className="resumo-selecao" style={{ display: 'block' }}>
                        <h4>Resumo da sua Seleção</h4>
                        <p>Números selecionados: <strong id="numeros-selecionados-lista">
                            {selectedNumbers.sort((a, b) => a - b).map(n => String(n).padStart(totalDigitos, '0')).join(', ')}
                        </strong></p>
                        <p>Total a pagar: <strong id="total-a-pagar">
                            R$ {(selectedNumbers.length * rifa.preco_numero).toFixed(2).replace('.', ',')}
                        </strong></p>
                        <div className="form-cliente">
                            <input
                                type="text"
                                id="nome-cliente"
                                className="input-cliente"
                                placeholder="Seu nome completo"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                required
                            />
                            <input
                                type="tel"
                                id="telefone-cliente"
                                className="input-cliente"
                                placeholder="Seu WhatsApp (DDD + Número)"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                required
                            />
                            <button
                                id="btn-reservar"
                                className="btn btn-finalizar"
                                onClick={handleReserve}
                                disabled={reserving}
                            >
                                {reserving ? 'Reservando...' : 'Reservar e Pagar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}