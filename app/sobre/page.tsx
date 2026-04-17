import type { Metadata } from 'next';
import Link from 'next/link';
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
            <main className="container" style={{ padding: '60px 15px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="titulo-secao" style={{ textAlign: 'center', marginBottom: '40px' }}>Sobre a Gringa Style</h1>
            
            <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    A Gringa Style nasceu puramente da paixão pela solda TIG de alta performance e pelo desejo de trazer mais atitude para o chão de fábrica e oficinas de todo o Brasil.
                </p>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Somos especialistas em oferecer equipamentos que unem <strong>estilo único, conforto absoluto e proteção máxima</strong> para o soldador moderno e exigente, que não se contenta com o básico e quer estampar o orgulho da profissão no próprio equipamento.
                </p>
                
                <h2 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', marginTop: '30px', fontSize: '1.5rem' }}>A Nossa História</h2>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Tudo começou no início de 2025. Vivenciando o dia a dia das oficinas, percebemos uma carência enorme no mercado nacional: faltavam equipamentos de proteção que unissem a segurança rigorosa da solda com um visual verdadeiramente autêntico e agressivo. A maioria das opções eram ferramentas padronizadas, sem personalidade.
                </p>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Foi aí que decidimos criar a Gringa Style. Nossa proposta sempre foi oferecer muito mais do que "apenas" equipamento de EPI; nós queríamos que a máscara fosse uma extensão da identidade do soldador. O que começou com foco em máscaras de design exclusivo rapidamente se expandiu. 
                </p>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Com a força e a parceria da nossa comunidade de clientes — que abraçou o conceito de imediato —, passamos a fornecer também acessórios de alta precisão e inovamos ao criar um sistema de rifas 100% transparente para democratizar o acesso a equipamentos da mais alta performance. Hoje, a Gringa Style é mais que uma loja, é uma marca feita por quem entende de TIG para quem vive o cordão perfeito todos os dias.
                </p>

                <h2 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', marginTop: '30px', fontSize: '1.5rem' }}>Nossas Máscaras e Lentes</h2>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Trabalhamos com <strong>máscaras de solda personalizadas passivas</strong>, desenvolvidas com tecnologia de ponta para garantir uma visibilidade cristalina da poça de fusão.
                </p>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Nossas lentes passivas escuras oferecem excelente proteção contra os raios UV e infravermelhos perigosos gerados pelo arco elétrico, ajudando a minimizar a fadiga ocular mesmo após horas de trabalho contínuo. Entendemos que a visão é o bem mais valioso de um soldador, e nossos produtos refletem esse cuidado.
                </p>

                <h2 style={{ color: 'var(--cor-destaque)', marginBottom: '15px', marginTop: '30px', fontSize: '1.5rem' }}>Acessórios Premium</h2>
                <p style={{ marginBottom: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Além das máscaras duráveis, perfeitamente anatômicas e resistentes a impactos severos, destacamo-nos pela nossa linha completa de acessórios TIG de nível industrial. Trabalhamos com bocais de cerâmica tradicionais, bocais de Pyrex de alta visibilidade e difusores de gás (Gas Lens) otimizados para economia de argônio e cordões perfeitos.
                </p>
                <p style={{ marginBottom: '30px', color: '#ccc', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Nossa missão principal é elevar o nível da sua soldagem, combinando a precisão técnica que a indústria exige com um visual agressivo e personalizado que você merece.
                </p>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Link href="/#produtos" className="btn btn-secundario" style={{ padding: '15px 30px', fontSize: '1.1rem', textDecoration: 'none' }}>
                        Conhecer os Produtos
                    </Link>
                </div>
            </div>
        </main>
    </>
    );
}
