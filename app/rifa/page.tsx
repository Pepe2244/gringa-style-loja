'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Rifa, Premio } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { reservarNumerosRifa } from '@/app/actions/rifa';
import { Trophy } from 'lucide-react';
import { getProxiedImageUrl } from '@/utils/imageUrl';

// GROWTH HACK TÉCNICO: Forçamos o TypeScript a aceitar a nova coluna do banco
// sem precisarmos reescrever os arquivos globais de tipagem agora.
interface RifaFront extends Omit<Rifa, 'status'> {
    status: 'ativa' | 'finalizada' | 'cancelada' | string;
}

export default function RifaPage() {
    const { showToast } = useToast();
    const [rifa, setRifa] = useState<RifaFront | null>(null);
    const [premios, setPremios] = useState<Premio[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [reserving, setReserving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchRifa(true);
        const pollInterval = setInterval(() => { fetchRifa(false); }, 10000);
        return () => clearInterval(pollInterval);
    }, []);

    const fetchRifa = async (showLoadingState = true): Promise<RifaFront | null> => {
        if (showLoadingState) setLoading(true);
        let fetchedRifa: RifaFront | null = null;
        try {
            let { data: rifaData, error: rifaError } = await supabase
                .from('rifas')
                .select('*')
                .eq('status', 'ativa')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!rifaData) {
                const { data: lastRifa } = await supabase
                    .from('rifas')
                    .select('*')
                    .eq('status', 'finalizada')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                rifaData = lastRifa;
            }

            if (rifaData) {
                fetchedRifa = rifaData as RifaFront;
                setRifa(fetchedRifa);

                setSelectedNumbers(current => {
                    const sold = new Set(rifaData.numeros_vendidos || []);
                    const reserved = new Set(rifaData.numeros_reservados || []);
                    return current.filter(n => !sold.has(n) && !reserved.has(n));
                });

                const { data: premiosData } = await supabase
                    .from('premios')
                    .select('*')
                    .eq('rifa_id', rifaData.id)
                    .order('ordem', { ascending: true });

                if (premiosData) setPremios(premiosData);
            } else {
                setRifa(null);
            }
        } catch (error) {
            console.error('Erro ao buscar rifa:', error);
            if (showLoadingState) showToast('Erro ao carregar a rifa. Tente recarregar a página.', 'error');
        } finally {
            if (showLoadingState) setLoading(false);
        }
        return fetchedRifa;
    };

    const toggleNumber = (number: number) => {
        if (rifa?.status === 'finalizada') {
            showToast('Esta rifa já foi encerrada.', 'error');
            return;
        }

        let newSelection = [];
        if (selectedNumbers.includes(number)) {
            newSelection = selectedNumbers.filter(n => n !== number);
        } else {
            newSelection = [...selectedNumbers, number];
        }
        setSelectedNumbers(newSelection);
    };

    const handleSurpresinha = () => {
        if (!rifa || rifa.status === 'finalizada') return;
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
        if (!rifa || rifa.status === 'finalizada') return;
        if (!clientName.trim() || !clientPhone.trim() || selectedNumbers.length === 0) {
            showToast('Por favor, preencha seu nome, telefone e selecione pelo menos um número.', 'error');
            return;
        }

        setReserving(true);
        try {
            const freshRifa = await fetchRifa(false);
            if (!freshRifa) throw new Error('Não foi possível verificar a disponibilidade. Tente novamente.');

            const soldSet = new Set(freshRifa.numeros_vendidos || []);
            const reservedSet = new Set(freshRifa.numeros_reservados || []);
            const conflitos = selectedNumbers.filter(n => soldSet.has(n) || reservedSet.has(n));

            if (conflitos.length > 0) {
                throw new Error("Um dos números que você escolheu acabou de ser reservado por outra pessoa. Atualizamos a lista.");
            }

            const result = await reservarNumerosRifa(freshRifa.id, selectedNumbers, clientName, clientPhone);

            if (!result.success) throw new Error(result.error);
            
            let participantId = null;
            if (Array.isArray(result.data) && result.data.length > 0) {
                participantId = result.data[0].participante_id || result.data[0].id || (typeof result.data[0] === 'number' ? result.data[0] : null);
            } else if (result.data && typeof result.data === 'object') {
                participantId = result.data.participante_id || result.data.id;
            } else if (typeof result.data === 'number' || typeof result.data === 'string') {
                participantId = result.data;
            }

            if (!participantId) {
                console.error("Erro Crítico: ID do Participante Ausente. Data completa:", result.data);
                throw new Error(`Ocorreu um erro ao obter sua reserva. Dados: ${JSON.stringify(result.data)}. Por favor contate o suporte.`);
            }

            router.push(`/pagamento?participante_id=${participantId}`);
        } catch (error: any) {
            showToast(error.message || 'Erro ao reservar. Tente novamente.', 'error');
            await fetchRifa(false);
            setSelectedNumbers([]);
        } finally {
            setReserving(false);
        }
    };

    if (loading) return (
        <div className="container" id="rifa-container">
            <div className="rifa-card">
                {[{ w: '70%', h: '40px' }, { w: '100%', h: '400px' }, { w: '50%', h: '24px' }, { w: '100%', h: '20px' }, { w: '100%', h: '20px' }].map((s, i) => (
                    <div key={i} style={{ background: '#333', borderRadius: '8px', height: s.h, width: s.w, marginBottom: '16px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ))}
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.25} }`}</style>
        </div>
    );

    if (!rifa) {
        return (
            <div className="container" id="rifa-container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <div className="rifa-card">
                    <h1 className="titulo-secao">Nenhuma Rifa no Momento</h1>
                    <p style={{ fontSize: '1.1em' }}>Em breve teremos novidades.</p>
                </div>
            </div>
        );
    }

    const totalDigitos = String(rifa.total_numeros - 1).length;
    const soldSet = new Set(rifa.numeros_vendidos || []);
    const reservedSet = new Set(rifa.numeros_reservados || []);

    const isFinished = rifa.status === 'finalizada';
    const isSoldOut = soldSet.size >= rifa.total_numeros || isFinished;

    const imageUrl = getProxiedImageUrl(rifa.imagem_premio_url || '/imagens/gringa_style_logo.png');

    const censurarNome = (nome: string) => {
        if (!nome) return '';
        const partes = nome.trim().split(' ');
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

    const premioVencedor = premios.find(p => p.vencedor_numero === rifa.numero_vencedor);

    return (
        <div className="container" id="rifa-container">
            <div className="rifa-card">
                <h1 className="titulo-secao">{rifa.nome_premio}</h1>

                <div className="relative w-full max-w-[600px] h-auto aspect-square mx-auto mb-5">
                    <Image src={imageUrl} alt="Prêmio da Rifa" fill priority sizes="(max-width: 768px) 100vw, 600px" className="rifa-imagem-premio object-cover rounded-lg" />
                </div>

                {isFinished && (
                    <div style={{ background: 'rgba(255, 165, 0, 0.1)', border: '2px solid orange', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                        <Trophy size={48} color="orange" style={{ margin: '0 auto 10px' }} />
                        <h2 style={{ color: 'orange', margin: 0 }}>RIFA ENCERRADA</h2>
                        {rifa.numero_vencedor !== null && rifa.numero_vencedor !== undefined ? (
                            <div style={{ background: '#222', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                                <p style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px' }}>
                                    O Número Vencedor foi: <br/><strong style={{ fontSize: '2.5rem', color: '#00ff88', letterSpacing: '2px' }}>{String(rifa.numero_vencedor).padStart(totalDigitos, '0')}</strong>
                                </p>
                                {premioVencedor && (
                                    <>
                                        <p style={{ color: '#ccc', margin: '5px 0', fontSize: '1.1rem' }}>🏆 Ganhador: <strong style={{color: 'white'}}>{censurarNome(String(premioVencedor.vencedor_nome))}</strong></p>
                                        <p style={{ color: '#ccc', margin: '5px 0', fontSize: '1.1rem' }}>📱 Contato: <strong style={{color: 'white'}}>{censurarTelefone(String(premioVencedor.vencedor_telefone))}</strong></p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: 'white', marginTop: '10px' }}>Sorteio realizado. Verifique os prêmios abaixo.</p>
                        )}
                        <Link href="/historico" style={{ display: 'inline-block', marginTop: '15px', color: 'orange', textDecoration: 'underline' }}>
                            Ver Histórico Completo
                        </Link>
                    </div>
                )}

                <p className="rifa-descricao">{rifa.descricao}</p>

                {!isFinished && (
                    <p className="rifa-preco">Apenas R$ {rifa.preco_numero.toFixed(2).replace('.', ',')} por número!</p>
                )}

                <Link href={`/acompanhar-rifa?id=${rifa.id}`} className="btn btn-secundario" style={{ marginBottom: '20px', display: 'inline-block' }}>
                    Ver Participantes
                </Link>

                <div className="rifa-progresso-container" style={{ margin: '20px 0', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Progresso:</span>
                        <span>{Math.round((soldSet.size / rifa.total_numeros) * 100)}% vendido</span>
                    </div>
                    <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${(soldSet.size / rifa.total_numeros) * 100}%`, height: '100%', backgroundColor: 'var(--cor-destaque)', transition: 'width 0.5s ease-in-out' }} />
                    </div>
                </div>

                {isFinished ? (
                    <div className="aviso-esgotado" style={{ background: '#333', color: '#aaa', padding: '15px', borderRadius: '8px', fontWeight: 'bold' }}>
                        Esta rifa já foi sorteada e encerrada. Obrigado por participar!
                    </div>
                ) : isSoldOut ? (
                    <div className="aviso-esgotado" style={{ background: '#ff4444', color: 'white', padding: '15px', borderRadius: '8px', fontWeight: 'bold' }}>
                        RIFA ESGOTADA! O sorteio será realizado em breve!
                    </div>
                ) : (
                    <div className="rifa-actions-container" style={{ marginBottom: '20px' }}>
                        <h3>Escolha seus números da sorte:</h3>
                        <div className="rifa-controls" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
                            <input type="number" placeholder="Buscar número..." className="input-busca-rifa" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: 'white' }} />
                            <button className="btn btn-surpresinha" onClick={handleSurpresinha} style={{ background: 'var(--cor-destaque)', color: 'black', border: 'none', padding: '10px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
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
                                onClick={() => !isOccupied && !isFinished && !isSoldOut && toggleNumber(i)}
                                style={{ opacity: isFinished ? 0.5 : 1, cursor: isFinished || isOccupied ? 'not-allowed' : 'pointer' }}
                            >
                                {numStr}
                            </div>
                        );
                    })}
                </div>

                {!isSoldOut && !isFinished && selectedNumbers.length > 0 && (
                    <div className="resumo-selecao" style={{ display: 'block' }}>
                        <h4>Resumo da sua Seleção</h4>
                        <p>Total a pagar: <strong id="total-a-pagar">R$ {(selectedNumbers.length * rifa.preco_numero).toFixed(2).replace('.', ',')}</strong></p>
                        <div className="form-cliente">
                            <input type="text" className="input-cliente" placeholder="Seu nome completo" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                            <input type="tel" className="input-cliente" placeholder="Seu WhatsApp (DDD + Número)" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
                            <button className="btn btn-finalizar" onClick={handleReserve} disabled={reserving}>
                                {reserving ? 'Reservando...' : 'Reservar e Pagar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


