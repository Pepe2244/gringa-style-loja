'use client';

import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main>
            <div className="container privacy-container">
                <h1 className="titulo-secao" style={{ textAlign: 'left', marginBottom: '20px' }}>Política de Privacidade</h1>
                <p>Sua privacidade é importante para nós. Esta política explica, em linguagem simples, como tratamos seus dados no site da Gringa Style.</p>

                <h2>1. Dados que Coletamos</h2>
                <p>Coletamos informações de duas formas principais:</p>
                <ul>
                    <li><strong>Ao comprar um produto:</strong> Solicitamos seu <strong>Nome</strong> para identificar seu pedido no WhatsApp.</li>
                    <li><strong>Ao participar de uma Rifa:</strong> Solicitamos seu <strong>Nome</strong> e <strong>Telefone (WhatsApp)</strong>. Esses dados são salvos em nosso banco de dados (Supabase) para gerenciar a rifa e entrar em contato com o vencedor.</li>
                </ul>

                <h2>2. Cupons de Desconto</h2>
                <p>Ao aplicar um cupom de desconto no carrinho, o código digitado é enviado ao nosso servidor (Supabase) para verificação. Esse processo nos permite:</p>
                <ul>
                    <li>Validar se o cupom é autêntico e está dentro da validade.</li>
                    <li>Contabilizar o uso desse cupom, para garantir o limite de usos (ex: "válido para as 100 primeiras compras").</li>
                </ul>

                <h2>3. Como Usamos seus Dados</h2>
                <p>Usamos seus dados exclusivamente para:</p>
                <ul>
                    <li>Processar seu pedido de compra (via WhatsApp).</li>
                    <li>Registrar sua participação na rifa.</li>
                    <li>Validar e aplicar cupons de desconto.</li>
                    <li>Identificar você publicamente (de forma censurada, ex: "Pedro H.") caso você seja o vencedor de uma rifa.</li>
                    <li>Entrar em contato sobre seu pedido ou sua participação.</li>
                </ul>
                <p><strong>Nós não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros.</strong></p>

                <h2>4. Armazenamento Local (Não são Cookies)</h2>
                <p>Este site <strong>não usa cookies de rastreamento</strong>.</p>
                <p>Usamos o "Armazenamento Local" (<code>localStorage</code>) do seu navegador para uma única finalidade: <strong>manter os produtos no seu carrinho de compras</strong>. Se você fechar o site e voltar depois, seus itens ainda estarão lá. Esse dado fica salvo apenas no seu próprio dispositivo e não é enviado para nós, a menos que você finalize a compra.</p>

                <h2>5. Dados Analíticos</h2>
                <p>Para entender como nosso site está sendo usado e onde podemos melhorar, coletamos dados analíticos <strong>totalmente anônimos</strong>. Isso inclui informações como quais páginas são mais visitadas ou quantos visitantes recebemos. Esses dados não podem ser usados para identificar você pessoalmente.</p>


                <h2>6. Seus Direitos (LGPD)</h2>
                <p>Como seus dados (Nome e Telefone) são coletados para a rifa, você tem o direito de:</p>
                <ul>
                    <li><strong>Acessar:</strong> Saber quais dados temos.</li>
                    <li><strong>Corrigir:</strong> Atualizar seus dados se estiverem errados.</li>
                    <li><strong>Excluir:</strong> Solicitar a remoção dos seus dados *após* a finalização da rifa da qual participou.</li>
                </ul>
                <p>Para qualquer uma dessas solicitações, basta entrar em contato conosco pelo WhatsApp.</p>

                <h2>7. Segurança</h2>
                <p>Usamos o Supabase como nosso provedor de banco de dados, que aplica medidas de segurança robustas para proteger as informações da rifa. O acesso ao painel de administração é restrito por senha.</p>
                <p>Qualquer dúvida, fale conosco!</p>

                <p style={{ marginTop: '20px' }}><em>Última atualização: 06 de novembro de 2025.</em></p>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link href="/" className="btn btn-secundario">
                        &larr; Voltar ao Início
                    </Link>
                </div>
            </div>
        </main>
    );
}
