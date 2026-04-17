'use client';

import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main>
            <div className="container privacy-container">
                <h1 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '20px' }}>Política de Privacidade</h1>
                <p>Sua privacidade é importante para nós. Esta política explica, em linguagem simples, como tratamos seus dados no site da Gringa Style.</p>

                <h2>1. Dados que Coletamos e Forma de Uso</h2>
                <p>Coletamos informações essenciais para garantir o processamento dos seus pedidos e sua participação em nossos eventos, sempre com base legal na execução de contrato ou consentimento:</p>
                <ul>
                    <li><strong>Compras na Loja (Carrinho):</strong> Solicitamos <strong>Nome Completo</strong> e <strong>Endereço de Entrega (CEP, Rua, etc)</strong> para o cálculo preciso do frete (via SuperFrete) e preparo do envio. Esses dados são compartilhados apenas com provedores de frete homologados e armazenados por até 5 anos para cumprimento de obrigações fiscais. Caso você pague via PIX ou Cartão de Crédito, a transação é processada de forma 100% segura por provedores de pagamento homologados, e finalizada pelo nosso atendimento humano no WhatsApp para garantir a entrega perfeita.</li>
                    <li><strong>Participação em Rifas:</strong> Solicitamos <strong>Nome</strong> e <strong>Telefone (WhatsApp)</strong> com seu consentimento explícito. Esses dados são armazenados de forma segura em nosso banco de dados em nuvem por até 6 meses após o sorteio, garantindo a lisura do sorteio e nos permitindo contatar você imediatamente caso seja o vencedor. Não compartilhamos esses dados com terceiros.</li>
                </ul>

                <h2>2. Cupons de Desconto e Promoções</h2>
                <p>Ao aplicar cupons no seu carrinho de compras, os dados são processados em nossos servidores para validar descontos de forma dinâmica e prevenir fraudes ou usos além do limite estabelecido pelas campanhas. Não armazenamos dados pessoais adicionais nesse processo.</p>

                <h2>3. Armazenamento Local (Cookies e LocalStorage)</h2>
                <p>Para melhorar sua experiência de navegação, nós utilizamos tecnologias de mercado com seu consentimento:</p>
                <ul>
                    <li><strong>Carrinho de Compras:</strong> Utilizamos o "LocalStorage" do seu dispositivo para guardar os itens que você colocou no carrinho. Assim, mesmo que você feche a aba, seus produtos não se perdem. Nenhuma informação pessoal é enviada nesse processo passivo.</li>
                    <li><strong>Google Analytics e Ahrefs:</strong> Utilizamos ferramentas de métricas de forma agrupada e autônoma, com base em legítimo interesse após seu consentimento explícito. Coletamos dados de navegação base (como páginas visitadas e tempo no site) para otimizar velocidade e oferecer os melhores produtos. Você pode gerenciar consentimentos via banner de cookies no site.</li>
                    <li><strong>Cookies Essenciais:</strong> Utilizados para funcionamento básico do site (ex.: sessão de carrinho). Não requerem consentimento prévio e são sempre ativos.</li>
                </ul>

                <h2>4. Compartilhamento de Dados</h2>
                <p>Seus dados são compartilhados apenas quando necessário:</p>
                <ul>
                    <li>Provedores de frete (SuperFrete) para cálculo e entrega.</li>
                    <li>Provedores de pagamento (PIX/Cartão) para processamento seguro.</li>
                    <li>Não vendemos ou alugamos dados para terceiros.</li>
                </ul>

                <h2>5. Segurança da Base de Dados</h2>
                <p>A Gringa Style utiliza o <strong>Supabase</strong>, um provedor de infraestrutura de banco de dados global que aplica segurança e criptografia de nível de indústria (ISO 27001). Tudo o que processamos tem acesso fortemente restrito, limitado a membros da moderação das rifas ou postagens dos produtos. Realizamos auditorias regulares de segurança.</p>

                <h2>6. Seus Direitos (LGPD)</h2>
                <p>Nós respeitamos integralmente a Lei Geral de Proteção de Dados Pessoais (LGPD). A qualquer momento você tem o direito de:</p>
                <ul>
                    <li><strong>Acesso:</strong> Saber quais dos seus dados diretos estão armazenados.</li>
                    <li><strong>Correção:</strong> Corrigir informações de endereço de entrega ou contatos de celular via nosso canal oficial antes do envio ou sorteio.</li>
                    <li><strong>Exclusão:</strong> Pedir a exclusão de sua conta/dados (ressalvadas obrigações legais de comprovação e nota fiscal após compras e participações).</li>
                    <li><strong>Portabilidade:</strong> Solicitar uma cópia dos seus dados em formato estruturado.</li>
                    <li><strong>Revogação de Consentimento:</strong> Para rifas ou comunicações de marketing.</li>
                </ul>
                <p>Para qualquer uma dessas solicitações, basta entrar em contato conosco pelo nosso WhatsApp de Suporte: <a href="https://wa.me/5515998608170" target="_blank">+55 15 99860-8170</a>.</p>

                <h2>7. Retenção de Dados</h2>
                <p>Retemos dados apenas pelo tempo necessário:</p>
                <ul>
                    <li>Dados de compras: 5 anos (obrigação fiscal).</li>
                    <li>Dados de rifas: 6 meses após sorteio.</li>
                    <li>Dados de navegação (Analytics): Anonimizados após 26 meses.</li>
                </ul>

                <h2>8. Menores de Idade</h2>
                <p>Nosso site não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados de crianças.</p>

                <h2>9. Alterações nesta Política</h2>
                <p>Podemos atualizar esta política periodicamente. Notificaremos mudanças significativas via site ou e-mail.</p>

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
