'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Rifa } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { getPaymentDetails } from '@/app/actions/pagamento';
import { Copy, Check, MessageCircle } from 'lucide-react'; // Ícones limpos

function PaymentContent() {
    const searchParams = useSearchParams();
    const participanteId = searchParams.get('participante_id');

    const [loading, setLoading] = useState(true);
    const [participante, setParticipante] = useState<any>(null);
    const [rifa, setRifa] = useState<Rifa | null>(null);
    const [copiado, setCopiado] = useState(false);
    const [erro, setErro] = useState('');

    const pixKey = process.env.NEXT_PUBLIC_PIX_KEY || "";

    useEffect(() => {
        if (participanteId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [participanteId]);

    const fetchData = async () => {
        try {
            const result = await getPaymentDetails(Number(participanteId));

            if (result.success) {
                setParticipante(result.participante);
                setRifa(result.rifa);
            } else {
                console.error('Erro ao carregar pagamento:', result.error);
                setErro(result.error || 'Erro ao buscar reserva.');
            }
        } catch (error) {
            console.error('Erro inesperado:', error);
            setErro('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const copiarChavePix = () => {
        if (!pixKey) {
            alert("A Chave PIX não foi configurada.");
            return;
        }
        navigator.clipboard.writeText(pixKey).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
    };

    const enviarComprovante = () => {
        if (!participante || !rifa) return;

        const total = participante.numeros_escolhidos.length * rifa.preco_numero;
        const mensagem = `Olá! Acabei de fazer o pagamento da Rifa *${rifa.nome_premio}*.\n\n` +
            `*Nome:* ${participante.nome}\n` +
            `*Números:* ${participante.numeros_escolhidos.join(', ')}\n` +
            `*Valor:* R$ ${total.toFixed(2).replace('.', ',')}\n\n` +
            `Segue o comprovante em anexo.`;

        window.open(`https://wa.me/5515998608170?text=${encodeURIComponent(mensagem)}`, '_blank');
    };

    if (loading) {
        return <div className="container" style={{ padding: '100px 0', textAlign: 'center', color: 'white' }}>Carregando informações...</div>;
    }

    if (erro) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                <h2 style={{ color: '#ff4444' }}>Erro</h2>
                <p>{erro}</p>
                <Link href="/rifa" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>Voltar para Rifa</Link>
            </div>
        );
    }

    if (!participante || !rifa) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                <h2>Reserva não encontrada</h2>
                <Link href="/rifa" className="btn">Voltar</Link>
            </div>
        );
    }

    const total = participante.numeros_escolhidos.length * rifa.preco_numero;

    return (
        <div className="container">
            <div className="pagamento-card" style={{ maxWidth: '600px', margin: '40px auto', background: '#222', padding: '30px', borderRadius: '10px' }}>
                <h1 className="titulo-secao" style={{ fontSize: '32px' }}>Pagamento da Reserva</h1>

                <div className="detalhes-reserva" style={{ marginBottom: '30px', background: '#333', padding: '20px', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '10px' }}><strong>Participante:</strong> {participante.nome}</p>
                    <p style={{ marginBottom: '10px' }}><strong>Rifa:</strong> {rifa.nome_premio}</p>
                    <p style={{ marginBottom: '10px' }}><strong>Números:</strong> <span style={{ color: 'var(--cor-destaque)' }}>{participante.numeros_escolhidos.join(', ')}</span></p>
                    <p className="valor-total" style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '15px', color: '#00ff88' }}>
                        Total: R$ {total.toFixed(2).replace('.', ',')}
                    </p>
                </div>

                <div className="area-pix" style={{ textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '15px', color: '#fff' }}>Pagamento via PIX</h3>
                    <p style={{ marginBottom: '15px', color: '#ccc' }}>Copie a chave e pague no seu banco:</p>

                    <div className="chave-pix-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <input
                            type="text"
                            value={pixKey}
                            readOnly
                            placeholder="Chave não configurada"
                            style={{ flex: 1, padding: '12px', borderRadius: '5px', border: '1px solid #555', background: '#111', color: '#fff', textAlign: 'center' }}
                        />
                        <button
                            onClick={copiarChavePix}
                            style={{
                                padding: '0 20px',
                                background: copiado ? '#28a745' : 'var(--cor-destaque)',
                                color: copiado ? 'white' : 'black',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            {copiado ? <Check size={18} /> : <Copy size={18} />}
                            {copiado ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>

                    <div className="qr-code-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        {/* Fallback inteligente para imagem */}
                        <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                            <Image
                                src="/imagens/pix-qrcode-placeholder.png"
                                alt="QR Code Pix"
                                width={200}
                                height={200}
                                style={{ width: '200px', height: 'auto' }} // Fix do warning de aspect ratio
                                onError={(e) => {
                                    // Se falhar, esconde (fallback visual via CSS ou estado seria ideal, mas isso resolve o crash)
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <p style={{ fontSize: '0.8em', color: '#888' }}>(QR Code ilustrativo)</p>
                    </div>
                </div>

                <hr style={{ borderColor: '#444', margin: '30px 0' }} />

                <div className="passo-a-passo" style={{ textAlign: 'left', marginBottom: '30px' }}>
                    <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '10px' }}>Próximos Passos:</h3>
                    <ol style={{ paddingLeft: '20px', color: '#ccc', lineHeight: '1.6' }}>
                        <li>Faça o pagamento do valor exato.</li>
                        <li>Envie o comprovante no WhatsApp.</li>
                        <li>Aguarde a confirmação.</li>
                    </ol>
                </div>

                <button
                    className="btn"
                    onClick={enviarComprovante}
                    style={{
                        width: '100%',
                        padding: '15px',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: '#25D366', // Cor oficial WhatsApp
                        color: 'white'
                    }}
                >
                    <MessageCircle size={24} />
                    Enviar Comprovante
                </button>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando...</div>}>
            <PaymentContent />
        </Suspense>
    );
}