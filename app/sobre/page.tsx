import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BreadcrumbSchema, WebPageSchema } from '@/components/SEO/StructuredData';

export const metadata: Metadata = {
  title: 'Sobre a Gringa Style | Especialistas em Solda TIG',
  description: 'Conheça a história da Gringa Style. Somos apaixonados por solda TIG, oferecendo máscaras passivas e acessórios de alta durabilidade e estilo exclusivo.',
  alternates: { canonical: '/sobre' },
};

export default function SobrePage() {
    return (
        <>
            <WebPageSchema page={{
                name: 'Sobre a Gringa Style',
                description: 'Conheça a história da Gringa Style. Somos apaixonados por solda TIG, oferecendo máscaras passivas e acessórios de alta durabilidade e estilo exclusivo.',
                url: '/sobre'
            }} />
            <BreadcrumbSchema items={[
                { name: 'Gringa Style', url: '/' },
                { name: 'Sobre', url: '/sobre' }
            ]} />
            <main className="container" style={{ padding: '60px 15px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 className="titulo-secao" style={{ textAlign: 'center', marginBottom: '20px' }}>Sobre a Gringa Style</h1>
                <p className="subtitulo-secao" style={{ textAlign: 'center', marginBottom: '60px', color: '#ccc', fontSize: '1.2rem' }}>
                    Paixão pela solda TIG, estilo único e proteção máxima para soldadores que não se contentam com o básico.
                </p>
                
                <div style={{ backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', marginBottom: '40px' }}>
                    <h2 style={{ color: 'var(--cor-destaque)', marginBottom: '20px', fontSize: '1.8rem', textAlign: 'center' }}>Nossa História</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        <Image 
                            src="/imagens/logo_gringa_style.png" 
                            alt="Logo Gringa Style" 
                            width={150} 
                            height={150} 
                            style={{ borderRadius: '10px', border: '2px solid var(--cor-destaque)' }} 
                        />
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            A Gringa Style nasceu puramente da paixão pela solda TIG de alta performance e pelo desejo de trazer mais atitude para o chão de fábrica e oficinas de todo o Brasil.
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Somos especialistas em oferecer equipamentos que unem <strong>estilo único, conforto absoluto e proteção máxima</strong> para o soldador moderno e exigente, que não se contenta com o básico e quer estampar o orgulho da profissão no próprio equipamento.
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Tudo começou no início de 2025. Vivenciando o dia a dia das oficinas, percebemos uma carência enorme no mercado nacional: faltavam equipamentos de proteção que unissem a segurança rigorosa da solda com um visual verdadeiramente autêntico e agressivo. A maioria das opções eram ferramentas padronizadas, sem personalidade.
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Foi aí que decidimos criar a Gringa Style. Nossa proposta sempre foi oferecer muito mais do que "apenas" equipamento de EPI; nós queríamos que a máscara fosse uma extensão da identidade do soldador. O que começou com foco em máscaras de design exclusivo rapidamente se expandiu. 
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                            Com a força e a parceria da nossa comunidade de clientes — que abraçou o conceito de imediato —, passamos a fornecer também acessórios de alta precisão e inovamos ao criar um sistema de rifas 100% transparente para democratizar o acesso a equipamentos da mais alta performance. Hoje, a Gringa Style é mais que uma loja, é uma marca feita por quem entende de TIG para quem vive o cordão perfeito todos os dias.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', fontSize: '1.5rem' }}>Missão</h3>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Proporcionar equipamentos de solda TIG que combinem proteção superior, conforto e estilo personalizado, elevando o padrão da profissão.
                        </p>
                    </div>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', fontSize: '1.5rem' }}>Visão</h3>
                        <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                            Ser a referência nacional em acessórios de solda personalizados, inspirando soldadores a expressarem sua paixão através do equipamento.
                        </p>
                    </div>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', fontSize: '1.5rem' }}>Valores</h3>
                        <ul style={{ color: '#ccc', lineHeight: '1.6', listStyle: 'none', padding: 0 }}>
                            <li>• Paixão pela excelência</li>
                            <li>• Inovação constante</li>
                            <li>• Transparência total</li>
                            <li>• Comunidade forte</li>
                        </ul>
                    </div>
                </div>

                <div style={{ backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333', marginBottom: '40px' }}>
                    <h2 style={{ color: 'var(--cor-destaque)', marginBottom: '20px', fontSize: '1.8rem', textAlign: 'center' }}>Nossas Máscaras e Lentes</h2>
                    <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                        Trabalhamos com <strong>máscaras de solda personalizadas passivas</strong>, desenvolvidas com tecnologia de ponta para garantir uma visibilidade cristalina da poça de fusão.
                    </p>
                    <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'center' }}>
                        Nossas lentes passivas escuras oferecem excelente proteção contra os raios UV e infravermelhos perigosos gerados pelo arco elétrico, ajudando a minimizar a fadiga ocular mesmo após horas de trabalho contínuo. Entendemos que a visão é o bem mais valioso de um soldador, e nossos produtos refletem esse cuidado.
                    </p>
                </div>

                <div style={{ backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h2 style={{ color: 'var(--cor-destaque)', marginBottom: '20px', fontSize: '1.8rem', textAlign: 'center' }}>O Que Nossos Clientes Dizem</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <blockquote style={{ borderLeft: '4px solid var(--cor-destaque)', paddingLeft: '20px', color: '#ccc', fontStyle: 'italic' }}>
                            "A máscara Gringa Style mudou meu jogo na oficina. Estilo top e proteção impecável!"<br/>
                            <cite style={{ color: 'var(--cor-destaque)', fontWeight: 'bold' }}>— João, Soldador Profissional</cite>
                        </blockquote>
                        <blockquote style={{ borderLeft: '4px solid var(--cor-destaque)', paddingLeft: '20px', color: '#ccc', fontStyle: 'italic' }}>
                            "Finalmente um equipamento que combina funcionalidade e atitude. Recomendo!"<br/>
                            <cite style={{ color: 'var(--cor-destaque)', fontWeight: 'bold' }}>— Maria, Técnica em Solda</cite>
                        </blockquote>
                        <blockquote style={{ borderLeft: '4px solid var(--cor-destaque)', paddingLeft: '20px', color: '#ccc', fontStyle: 'italic' }}>
                            "Qualidade excepcional e design único. Orgulho de usar!"<br/>
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
