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
        const chavePix = "00020126360014BR.GOV.BCB.PIX0114+55159986081705204000053039865802BR5925Gringa Style Equipamentos6012Itapetininga62070503***63041D3D";
        navigator.clipboard.writeText(chavePix).then(() => {
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
                            value="00020126360014BR.GOV.BCB.PIX0114+55159986081705204000053039865802BR5925Gringa Style Equipamentos6012Itapetininga62070503***63041D3D"
                            readOnly
                            id="chave-pix-input"
                        />
                        <button className="btn-copiar" onClick={copiarChavePix}>
                            {copiado ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>

                    <div className="qr-code-container">
                        {/* Placeholder for QR Code - In a real app, generate this dynamically */}
                        <Image src="/imagens/qrcode-pix.png" alt="QR Code Pix" width={200} height={200} style={{ margin: '20px auto' }} />
                        <p style={{ fontSize: '0.9em', color: '#ccc' }}>(QR Code ilustrativo, use a chave acima se preferir)</p>
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

                <button className="btn btn-whatsapp" onClick={enviarComprovante}>
                    <i className="fab fa-whatsapp"></i> Enviar Comprovante
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
