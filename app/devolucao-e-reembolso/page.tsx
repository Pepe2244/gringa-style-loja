'use client';

import Link from 'next/link';

export default function DevolucaoReembolsoPage() {
    return (
        <main>
            <div className="container privacy-container">
                <h1 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '20px' }}>Trocas e Devoluções</h1>
                <p>Sua satisfação é nossa prioridade. Esta política explica, em linguagem simples, como proceder com trocas e devoluções na Gringa Style.</p>

                <h2>1. Direito de Arrependimento</h2>
                <p>Comprou e mudou de ideia? Pelo Código de Defesa do Consumidor, você tem <strong>7 (sete) dias corridos</strong> após o recebimento para solicitar a devolução.</p>
                <ul>
                    <li>O produto deve estar na embalagem original e sem indícios de uso.</li>
                    <li>O custo do frete de retorno é por conta da Gringa Style.</li>
                </ul>

                <h2>2. Defeitos de Fabricação</h2>
                <p>A precisão é o nosso foco. Se seu equipamento apresentar falhas técnicas:</p>
                <ul>
                    <li>Garantia legal de <strong>90 dias</strong>.</li>
                    <li>Análise técnica concluída em até 30 dias após o recebimento.</li>
                </ul>

                <h2>3. Máscaras Personalizadas</h2>
                <p>Atenção Soldador: Máscaras feitas sob encomenda são exclusivas. Devoluções só são aceitas em caso de erro na personalização ou defeito técnico.</p>

                <h2>4. Como solicitar</h2>
                <p>Entre em contato direto com quem entende:</p>
                <ul>
                    <li><strong>E-mail Oficial:</strong> nalessogtaw015@gmail.com</li>
                    <li><strong>WhatsApp:</strong> Suporte Gringa Style</li>
                </ul>

                <h2>5. Reembolso</h2>
                <p>O estorno ocorre pelo mesmo método da compra:</p>
                <ul>
                    <li><strong>Pix:</strong> Em até 48h.</li>
                    <li><strong>Cartão:</strong> Estorno em até 2 faturas dependendo da operadora.</li>
                </ul>

                <p style={{ marginTop: '20px' }}><em>Última atualização: Abril de 2026.</em></p>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link href="/" className="btn btn-secundario">
                        &larr; Voltar ao Início
                    </Link>
                </div>
            </div>
        </main>
    );
}