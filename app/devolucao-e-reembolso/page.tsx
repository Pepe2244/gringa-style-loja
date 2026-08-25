'use client';

import Link from 'next/link';
import { BreadcrumbSchema } from '@/components/SEO/StructuredData';

export default function DevolucaoReembolsoPage() {
    return (
        <>
            <BreadcrumbSchema items={[
                { name: 'Gringa Style', url: '/' },
                { name: 'Trocas e Devoluções', url: '/devolucao-e-reembolso' }
            ]} />
            
            <main className="container py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-white">
                <div 
                    style={{ 
                        marginTop: '20px', 
                        background: '#111', 
                        padding: '40px', 
                        borderRadius: '12px', 
                        border: '1px solid #27272a', 
                        textAlign: 'left' 
                    }}
                >
                    <h1 
                        style={{ 
                            fontSize: '2.2rem', 
                            marginBottom: '25px', 
                            color: 'white', 
                            borderBottom: '2px solid var(--cor-destaque)', 
                            paddingBottom: '12px', 
                            display: 'inline-block',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        Trocas e Devoluções
                    </h1>

                    <div className="space-y-6 text-zinc-300 leading-relaxed">
                        <p>
                            Sua satisfação é nossa prioridade. Esta política explica, em linguagem simples, como proceder com trocas e devoluções na Gringa Style.
                        </p>

                        <h2 className="text-xl font-bold text-amber-500 pt-4 border-b border-zinc-800 pb-2">
                            1. Direito de Arrependimento
                        </h2>
                        <p>
                            Comprou e mudou de ideia? Pelo Código de Defesa do Consumidor, você tem <strong>7 (sete) dias corridos</strong> após o recebimento para solicitar a devolução.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                            <li>O produto deve estar na embalagem original e sem indícios de uso.</li>
                            <li>O custo do frete de retorno é por conta da Gringa Style.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-amber-500 pt-4 border-b border-zinc-800 pb-2">
                            2. Defeitos de Fabricação
                        </h2>
                        <p>
                            A precisão é o nosso foco. Se seu equipamento apresentar falhas técnicas:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                            <li>Garantia legal de <strong>90 dias</strong>.</li>
                            <li>Análise técnica concluída em até 30 dias após o recebimento.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-amber-500 pt-4 border-b border-zinc-800 pb-2">
                            3. Máscaras Personalizadas
                        </h2>
                        <p>
                            Atenção Soldador: Máscaras feitas sob encomenda são exclusivas. Devoluções só são aceitas em caso de erro na personalização ou defeito técnico.
                        </p>

                        <h2 className="text-xl font-bold text-amber-500 pt-4 border-b border-zinc-800 pb-2">
                            4. Como solicitar
                        </h2>
                        <p>
                            Entre em contato direto com quem entende:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                            <li><strong>E-mail Oficial:</strong> nalessogtaw015@gmail.com</li>
                            <li><strong>WhatsApp:</strong> Suporte Gringa Style</li>
                        </ul>

                        <h2 className="text-xl font-bold text-amber-500 pt-4 border-b border-zinc-800 pb-2">
                            5. Reembolso
                        </h2>
                        <p>
                            O estorno ocorre pelo mesmo método da compra:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                            <li><strong>Pix:</strong> Em até 48h.</li>
                            <li><strong>Cartão:</strong> Estorno em até 2 faturas dependendo da operadora.</li>
                        </ul>

                        <p style={{ marginTop: '20px', fontStyle: 'italic', color: '#888' }}>
                            Última atualização: Abril de 2026.
                        </p>

                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                            <Link href="/" className="btn btn-secundario">
                                &larr; Voltar ao Início
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}