'use client';

import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main>
            <div className="container privacy-container">
                <h1 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '20px' }}>Política de Privacidade</h1>
                <p>Sua privacidade é importante para nós. Esta política explica, em linguagem simples, como tratamos seus dados no site da Gringa Style.</p>

                <h2>1. Dados que Coletamos e Forma de Uso</h2>
                <p>Coletamos informações essenciais para garantir o processamento dos seus pedidos e sua participação em nossos eventos:</p>
                <ul>
                    <li><strong>Compras na Loja (Carrinho):</strong> Solicitamos <strong>Nome Completo</strong> e <strong>Endereço de Entrega (CEP, Rua, etc)</strong> para o cálculo preciso do frete (via SuperFrete) e preparo do envio. Caso você pague via PIX ou Cartão de Crédito, a transação é processada de forma 100% segura por provedores de pagamento homologados, e finalizada pelo nosso atendimento humano no WhatsApp para garantir a entrega perfeita.</li>
                    <li><strong>Participação em Rifas:</strong> Solicitamos <strong>Nome</strong> e <strong>Telefone (WhatsApp)</strong>. Esses dados são armazenados de forma segura em nosso banco de dados em nuvem, garantindo a lisura do sorteio e nos permitindo contatar você imediatamente caso seja o vencedor.</li>
                </ul>

                <h2>2. Cupons de Desconto e Promoções</h2>
                <p>Ao aplicar cupons no seu carrinho de compras, os dados são processados em nossos servidores para validar descontos de forma dinâmica e prevenir fraudes ou usos além do limite estabelecido pelas campanhas.</p>

                <h2>3. Armazenamento Local (Cookies e LocalStorage)</h2>
                <p>Para melhorar sua experiência de navegação, nós utilizamos tecnologias de mercado:</p>
                <ul>
                    <li><strong>Carrinho de Compras:</strong> Utilizamos o "LocalStorage" do seu dispositivo para guardar os itens que você colocou no carrinho. Assim, mesmo que você feche a aba, seus produtos não se perdem. Nenhuma informação pessoal é enviada nesse processo passivo.</li>
                    <li><strong>Google Analytics e Ahrefs:</strong> Utilizamos ferramentas de métricas de forma agrupada e autônoma. Coletamos dados de navegação base (como páginas visitadas e tempo no site) para otimizar velocidade e oferecer os melhores produtos. Tudo de forma que respeite os termos de consentimento e LGPD.</li>
                </ul>

                <h2>4. Segurança da Base de Dados</h2>
                <p>A Gringa Style utiliza o <strong>Supabase</strong>, um provedor de infraestrutura de banco de dados global que aplica segurança e criptografia de nível de indústria. Tudo o que processamos tem acesso fortemente restrito, limitado a membros da moderação das rifas ou postagens dos produtos.</p>

                <h2>5. Seus Direitos (LGPD)</h2>
                <p>Nós respeitamos integralmente a Lei Geral de Proteção de Dados Pessoais (LGPD). A qualquer momento você tem o direito de:</p>
                <ul>
                    <li>Saber quais dos seus dados diretos estão armazenados.</li>
                    <li>Corrigir informações de endereço de entrega ou contatos de celular via nosso canal oficial antes do envio ou sorteio.</li>
                    <li>Pedir a exclusão de sua conta/dados (ressalvadas obrigações legais de comprovação e nota fiscal após compras e participações).</li>
                </ul>
                <p>Para qualquer uma dessas solicitações, basta entrar em contato conosco pelo nosso WhatsApp de Suporte.</p>

                <p style={{ marginTop: '20px' }}><em>Última atualização: Março de 2026.</em></p>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link href="/" className="btn btn-secundario">
                        &larr; Voltar ao Início
                    </Link>
                </div>
            </div>
        </main>
    );
}
