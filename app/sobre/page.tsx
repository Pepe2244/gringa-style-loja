import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BreadcrumbSchema, WebPageSchema } from '@/components/SEO/StructuredData';

export const metadata: Metadata = {
    title: 'Sobre o Grupo Gringa Style | Loja e Soldas Especiais',
    description: 'Conheça o Grupo Gringa Style, formado pela loja de equipamentos para soldadores e pela operação de soldas especiais para a indústria.',
  alternates: { canonical: '/sobre' },
};

export default function SobrePage() {
    return (
        <>
            <WebPageSchema page={{
                name: 'Sobre o Grupo Gringa Style',
                description: 'Conheça o Grupo Gringa Style, formado pela loja de equipamentos para soldadores e pela operação de soldas especiais para a indústria.',
                url: '/sobre'
            }} />
            <BreadcrumbSchema items={[
                { name: 'Gringa Style', url: '/' },
                { name: 'Sobre', url: '/sobre' }
            ]} />
            <main className="container" style={{ padding: '60px 15px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 className="titulo-secao" style={{ textAlign: 'center', marginBottom: '20px' }}>Sobre o Grupo Gringa Style</h1>
                <p className="subtitulo-secao" style={{ textAlign: 'center', marginBottom: '60px', color: '#ccc', fontSize: '1.2rem' }}>
                    Duas frentes que trabalham com o mesmo compromisso: tornar a soldagem mais segura, eficiente e respeitada.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <section style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333' }}>
                        <span style={{ color: 'var(--cor-destaque)', fontFamily: 'var(--fonte-titulos)', letterSpacing: '1px' }}>B2C | PARA QUEM VIVE A SOLDAGEM</span>
                        <h2 style={{ fontFamily: 'var(--fonte-titulos)', color: '#fff', fontSize: '2rem', margin: '12px 0' }}>Loja Gringa Style</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.7' }}>Máscaras, acessórios e EPIs escolhidos para soldadores que exigem proteção, conforto e personalidade no trabalho.</p>
                        <Link href="/loja" style={{ display: 'inline-block', marginTop: '18px', color: 'var(--cor-destaque)', fontWeight: 'bold' }}>Conheça a loja</Link>
                    </section>
                    <section style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333' }}>
                        <span style={{ color: 'var(--cor-destaque)', fontFamily: 'var(--fonte-titulos)', letterSpacing: '1px' }}>B2B | PARA OPERAÇÕES INDUSTRIAIS</span>
                        <h2 style={{ fontFamily: 'var(--fonte-titulos)', color: '#fff', fontSize: '2rem', margin: '12px 0' }}>Soldas Especiais</h2>
                        <p style={{ color: '#ccc', lineHeight: '1.7' }}>Engenharia de soldagem, recuperação de ativos, manutenção e execução técnica para reduzir riscos e tempo parado.</p>
                        <Link href="/soldas-especiais" style={{ display: 'inline-block', marginTop: '18px', color: 'var(--cor-destaque)', fontWeight: 'bold' }}>Conheça os serviços</Link>
                    </section>
                </div>
                
                <div style={{ backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', marginBottom: '40px' }}>
                    <h2 className="titulo-secao" style={{ fontSize: '2.5rem', textAlign: 'center' }}>Nossa História</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        <Image 
                            src="/imagens/logo_gringa_style.png" 
                            alt="Logo Gringa Style" 
                            width={150} 
                            height={150} 
                            style={{ borderRadius: '10px', border: '2px solid var(--cor-destaque)' }} 
                        />
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Equipamentos de proteção e estilo de alto desempenho para o soldador moderno e exigente, que não se contenta com o básico e quer estampar o orgulho da profissão no próprio equipamento.
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Tudo começou no início de 2025. Vivenciando o dia a dia das oficinas, percebemos uma carência enorme no mercado nacional: faltavam EPIs que unissem a segurança rigorosa da solda com um visual verdadeiramente autêntico e agressivo, já que a maioria das opções eram ferramentas padronizadas e sem personalidade.
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Foi aí que decidimos criar a Gringa Style. Nossa proposta sempre foi oferecer muito mais do que &quot;apenas&quot; equipamento de proteção; queríamos que a máscara fosse uma extensão da identidade do soldador. O que começou com foco em máscaras de design exclusivo rapidamente se expandiu.
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Com a força e a parceria da nossa comunidade de clientes que abraçou o conceito de imediato, passamos a fornecer também acessórios de alta precisão e inovamos ao criar um sistema de rifas 100% transparente para democratizar o acesso a equipamentos da mais alta performance.
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Hoje, o Grupo Gringa Style conecta a experiência de quem vive o cordão perfeito todos os dias com soluções técnicas para os desafios reais da indústria.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', fontSize: '1.8rem', fontFamily: 'var(--fonte-titulos)' }}>Missão</h3>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Proporcionar equipamentos de solda TIG que combinem proteção superior, conforto e estilo personalizado, elevando o padrão da profissão.
                        </p>
                    </div>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', fontSize: '1.8rem', fontFamily: 'var(--fonte-titulos)' }}>Visão</h3>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Ser a referência nacional em acessórios de solda personalizados, inspirando soldadores a expressarem sua paixão através do equipamento.
                        </p>
                    </div>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', fontSize: '1.8rem', fontFamily: 'var(--fonte-titulos)' }}>Valores</h3>
                        <ul style={{ color: '#ccc', lineHeight: '1.6', listStyle: 'none', padding: 0 }}>
                            <li>• Paixão pela excelência</li>
                            <li>• Inovação constante</li>
                            <li>• Transparência total</li>
                            <li>• Comunidade forte</li>
                        </ul>
                    </div>
                </div>

                <div style={{ backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', marginBottom: '40px' }}>
                    <h2 className="titulo-secao" style={{ fontSize: '2.5rem', textAlign: 'center' }}>Nossas Máscaras e Lentes</h2>
                    <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                        Trabalhamos com <strong>máscaras de solda personalizadas passivas</strong>, desenvolvidas com tecnologia de ponta para garantir uma visibilidade cristalina da poça de fusão.
                    </p>
                    <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                        Nossas lentes passivas escuras oferecem excelente proteção contra os raios UV e infravermelhos perigosos gerados pelo arco elétrico, ajudando a minimizar a fadiga ocular mesmo após horas de trabalho contínuo. Entendemos que a visão é o bem mais valioso de um soldador, e nossos produtos refletem esse cuidado.
                    </p>
                </div>

                <div style={{ backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h2 className="titulo-secao" style={{ fontSize: '2.5rem', textAlign: 'center' }}>O Que Nossos Clientes Dizem</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <blockquote style={{ borderLeft: '4px solid var(--cor-destaque)', paddingLeft: '20px', color: '#ccc', fontStyle: 'italic' }}>
                            &quot;A máscara Gringa Style mudou meu jogo na oficina. Estilo top e proteção impecável!&quot;<br/>
                            <cite style={{ color: 'var(--cor-destaque)', fontWeight: 'bold' }}>— João, Soldador Profissional</cite>
                        </blockquote>
                        <blockquote style={{ borderLeft: '4px solid var(--cor-destaque)', paddingLeft: '20px', color: '#ccc', fontStyle: 'italic' }}>
                            &quot;Finalmente um equipamento que combina funcionalidade e atitude. Recomendo!&quot;<br/>
                            <cite style={{ color: 'var(--cor-destaque)', fontWeight: 'bold' }}>— Maria, Técnica em Solda</cite>
                        </blockquote>
                        <blockquote style={{ borderLeft: '4px solid var(--cor-destaque)', paddingLeft: '20px', color: '#ccc', fontStyle: 'italic' }}>
                            &quot;Qualidade excepcional e design único. Orgulho de usar!&quot;<br/>
                            <cite style={{ color: 'var(--cor-destaque)', fontWeight: 'bold' }}>— Pedro, Empreendedor</cite>
                        </blockquote>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Link href="/" style={{ backgroundColor: 'var(--cor-destaque)', color: '#000', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', textDecoration: 'none' }}>
                        Explore Nossos Produtos
                    </Link>
                </div>
            </main>
        </>
    );
}
