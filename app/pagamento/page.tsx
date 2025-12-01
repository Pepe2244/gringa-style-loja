'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Rifa } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

function PaymentContent() {
    const searchParams = useSearchParams();
    const participanteId = searchParams.get('participante_id');

    const [loading, setLoading] = useState(true);
    const [participante, setParticipante] = useState<any>(null);
    const [rifa, setRifa] = useState<Rifa | null>(null);
    const [copiado, setCopiado] = useState(false);

    // Busca a chave das variáveis públicas. Se não existir, retorna string vazia.
    // NUNCA escreva a chave diretamente aqui.
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
            const { data: partData, error: partError } = await supabase
                .from('participantes_rifa')
                .select('*')
                .eq('id', participanteId)
                .single();

            if (partError) throw partError;
            setParticipante(partData);

            if (partData) {
                const { data: rifaData, error: rifaError } = await supabase
                    .from('rifas')
                    .select('*')
                    .eq('id', partData.rifa_id)
                    .single();

                if (rifaError) throw rifaError;
                setRifa(rifaData);
            }
        } catch (error) {
            console.error('Error fetching payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copiarChavePix = () => {
        if (!pixKey) {
            alert("Erro: A Chave PIX não foi configurada no painel administrativo/env.");
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
        return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando informações de pagamento...</div>;
    }

    if (!participante || !rifa) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <h2>Pedido não encontrado</h2>
                <p>Não foi possível encontrar os detalhes da sua reserva.</p>
                <Link href="/rifa" className="btn">Voltar para Rifa</Link>
            </div>
        );
    }

    const total = participante.numeros_escolhidos.length * rifa.preco_numero;

    return (
        <div className="container">
            <div className="pagamento-card">
                <h1 className="titulo-secao">Pagamento da Reserva</h1>

                <div className="detalhes-reserva">
                    <p><strong>Participante:</strong> {participante.nome}</p>
                    <p><strong>Rifa:</strong> {rifa.nome_premio}</p>
                    <p><strong>Números Reservados:</strong> {participante.numeros_escolhidos.join(', ')}</p>
                    <p className="valor-total">Total a Pagar: R$ {total.toFixed(2).replace('.', ',')}</p>
                </div>

                <div className="area-pix">
                    <h3>Pagamento via PIX</h3>
                    <p>Copie a chave abaixo e faça o pagamento no seu banco:</p>

                    <div className="chave-pix-container">
                        <input
                            type="text"
                            value={pixKey}
                            readOnly
                            placeholder={pixKey ? "" : "Chave PIX não configurada"}
                            id="chave-pix-input"
                        />
                        <button className="btn-copiar" onClick={copiarChavePix} disabled={!pixKey}>
                            {copiado ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>

                    <div className="qr-code-container">
                        {/* Placeholder for QR Code - In a real app, generate this dynamically */}
                        <Image src="/imagens/pix-qrcode-placeholder.png" alt="QR Code Pix" width={200} height={200} style={{ margin: '20px auto' }} />
                        <p style={{ fontSize: '0.9em', color: '#ccc' }}>(QR Code ilustrativo, use a chave acima)</p>
                    </div>
                </div>

                <div className="passo-a-passo">
                    <h3>Próximos Passos:</h3>
                    <ol>
                        <li>Faça o pagamento do valor exato.</li>
                        <li>Envie o comprovante pelo WhatsApp para confirmarmos seus números.</li>
                        <li>Aguarde a confirmação e boa sorte!</li>
                    </ol>
                </div>

                <button className="btn btn-whatsapp" onClick={enviarComprovante} style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                    </svg>
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