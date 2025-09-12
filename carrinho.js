// carrinho.js (VERSÃO FINAL COM URL DO RENDER)

// ATUALIZADO COM A URL REAL DO SEU BACKEND!
const API_URL = 'https://gringa-style-backend.onrender.com';

// --- LÓGICA DO MENU HAMBÚRGUER ---
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

hamburgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('menu-aberto');
});

let todosOsProdutos = [];
let carrinho = [];

// --- ELEMENTOS DO DOM ---
const listaItensCarrinho = document.getElementById('lista-itens-carrinho');
const subtotalEl = document.getElementById('subtotal-valor');
const totalEl = document.getElementById('total-valor');
const carrinhoVazioMsg = document.getElementById('carrinho-vazio-msg');
const finalizarPedidoBtn = document.getElementById('finalizar-pedido-btn');
const carrinhoContador = document.querySelector('.carrinho-contador');
const formaPagamentoSelect = document.getElementById('forma-pagamento');
const opcoesParcelamentoDiv = document.getElementById('opcoes-parcelamento');
const numeroParcelasSelect = document.getElementById('numero-parcelas');
const nomeClienteInput = document.getElementById('nome-cliente');

// --- FUNÇÕES DE MANIPULAÇÃO DO CARRINHO (LocalStorage) ---
function salvarCarrinho() {
    localStorage.setItem('carrinhoGringaStyle', JSON.stringify(carrinho));
}

function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinhoGringaStyle');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
}

function atualizarContadorCarrinho() {
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    carrinhoContador.textContent = totalItens;
}

// --- LÓGICA PRINCIPAL DA PÁGINA DO CARRINHO ---
async function carregarPaginaCarrinho() {
    carregarCarrinho();
    try {
        const response = await fetch(`${API_URL}/api/produtos`);
        if (!response.ok) throw new Error('Falha ao buscar produtos.');
        todosOsProdutos = await response.json();

        renderizarItensCarrinho();

    } catch (error) {
        console.error("Erro ao carregar dados para o carrinho:", error);
        listaItensCarrinho.innerHTML = "<p>Não foi possível carregar as informações dos produtos. Tente novamente.</p>";
    }
}

function renderizarItensCarrinho() {
    listaItensCarrinho.innerHTML = '';

    const carrinhoValido = carrinho.filter(item =>
        item && item.idProduto && todosOsProdutos.some(p => p.id === item.idProduto)
    );

    if (carrinhoValido.length !== carrinho.length) {
        carrinho = carrinhoValido;
        salvarCarrinho();
    }

    if (carrinho.length === 0) {
        carrinhoVazioMsg.style.display = 'block';
        document.querySelector('.resumo-carrinho').style.display = 'none';
    } else {
        carrinhoVazioMsg.style.display = 'none';
        document.querySelector('.resumo-carrinho').style.display = 'block';
        finalizarPedidoBtn.disabled = false;

        carrinho.forEach(item => {
            const produto = todosOsProdutos.find(p => p.id === item.idProduto);
            if (!produto) return;

            const subtotalItem = item.quantidade * produto.preco;
            let nomeProdutoExibido = produto.nome;
            let imagemExibida = produto.imagens.length > 0 ? produto.imagens[0] : 'imagens/placeholder.png';

            if (item.variante && produto.variantes) {
                nomeProdutoExibido += ` <span class="variante-carrinho">(${produto.variantes.titulo}: ${item.variante.nome})</span>`;
                imagemExibida = item.variante.imagem;
            }

            const itemHTML = `
                <div class="item-carrinho" data-item-id="${item.idUnico}">
                    <img src="${imagemExibida}" alt="${produto.nome}" class="item-carrinho-img">
                    <div class="item-carrinho-info">
                        <h3>${nomeProdutoExibido}</h3>
                        <p>Preço: R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div class="item-carrinho-quantidade">
                        <button class="btn-quantidade" data-acao="diminuir">-</button>
                        <input type="number" value="${item.quantidade}" min="1" class="input-quantidade">
                        <button class="btn-quantidade" data-acao="aumentar">+</button>
                    </div>
                    <p class="item-carrinho-subtotal">R$ ${subtotalItem.toFixed(2).replace('.', ',')}</p>
                    <button class="btn-remover">&times;</button>
                </div>
            `;
            listaItensCarrinho.insertAdjacentHTML('beforeend', itemHTML);
        });
    }
    calcularTotal();
    atualizarContadorCarrinho();
}

function calcularTotal() {
    const subtotal = carrinho.reduce((total, item) => {
        const produto = todosOsProdutos.find(p => p.id === item.idProduto);
        return produto ? total + (produto.preco * item.quantidade) : total;
    }, 0);

    subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    totalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

function atualizarQuantidade(itemId, novaQuantidade) {
    const itemNoCarrinho = carrinho.find(item => item.idUnico === itemId);
    if (itemNoCarrinho) {
        if (novaQuantidade > 0) {
            itemNoCarrinho.quantidade = novaQuantidade;
        } else {
            carrinho = carrinho.filter(item => item.idUnico !== itemId);
        }
        salvarCarrinho();
        renderizarItensCarrinho();
    }
}

function gerarMensagemWhatsApp() {
    const nomeCliente = nomeClienteInput.value.trim();
    if (nomeCliente === "") {
        alert("Por favor, preencha seu nome para continuar.");
        nomeClienteInput.focus();
        return;
    }

    const numeroWhatsapp = "5515998608170";
    let mensagem = `Olá Gringa Style!\n\nMeu nome é *${nomeCliente}* e gostaria de confirmar meu pedido:\n\n`;
    let totalPedido = 0;
    let listaItensMsg = "*RESUMO DO PEDIDO*\n";

    carrinho.forEach(item => {
        const produto = todosOsProdutos.find(p => p.id === item.idProduto);
        if (produto) {
            totalPedido += item.quantidade * produto.preco;
            let nomeProdutoMsg = produto.nome;
            if (item.variante) {
                nomeProdutoMsg += ` (${item.variante.nome})`;
            }
            listaItensMsg += `• ${nomeProdutoMsg} (${item.quantidade}x)\n`;
        }
    });

    mensagem += listaItensMsg + "\n";
    const formaPagamento = formaPagamentoSelect.value;

    if (formaPagamento === 'Cartão de Crédito') {
        const parcelas = numeroParcelasSelect.value;
        mensagem += `*Valor dos Produtos:* R$ ${totalPedido.toFixed(2).replace('.', ',')}\n`;
        mensagem += `*Pagamento:* ${formaPagamento} em ${parcelas}\n\n`;
        mensagem += `_Aguardo o link para pagamento. (Sei que as taxas serão calculadas na próxima etapa)_`;
    } else {
        mensagem += `*Valor Total (PIX):* R$ ${totalPedido.toFixed(2).replace('.', ',')}\n\n`;
        mensagem += `_Aguardo a chave PIX para o pagamento. Obrigado!_`;
    }

    const linkWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkWhatsapp, '_blank');
}

// --- EVENT LISTENERS ---
listaItensCarrinho.addEventListener('click', (e) => {
    const itemCarrinhoEl = e.target.closest('.item-carrinho');
    if (!itemCarrinhoEl) return;
    const itemId = itemCarrinhoEl.dataset.itemId;
    const itemNoCarrinho = carrinho.find(item => item.idUnico === itemId);
    if (!itemNoCarrinho) return;

    if (e.target.classList.contains('btn-quantidade')) {
        const acao = e.target.dataset.acao;
        if (acao === 'aumentar') {
            atualizarQuantidade(itemId, itemNoCarrinho.quantidade + 1);
        } else if (acao === 'diminuir') {
            atualizarQuantidade(itemId, itemNoCarrinho.quantidade - 1);
        }
    }
    if (e.target.classList.contains('btn-remover')) {
        atualizarQuantidade(itemId, 0);
    }
});

listaItensCarrinho.addEventListener('change', (e) => {
    if (e.target.classList.contains('input-quantidade')) {
        const itemCarrinhoEl = e.target.closest('.item-carrinho');
        if (!itemCarrinhoEl) return;
        const itemId = itemCarrinhoEl.dataset.itemId;
        const novaQuantidade = parseInt(e.target.value);
        if (!isNaN(novaQuantidade)) {
            atualizarQuantidade(itemId, novaQuantidade);
        }
    }
});

formaPagamentoSelect.addEventListener('change', () => {
    opcoesParcelamentoDiv.style.display = formaPagamentoSelect.value === 'Cartão de Crédito' ? 'block' : 'none';
});

finalizarPedidoBtn.addEventListener('click', gerarMensagemWhatsApp);

// --- INICIALIZAÇÃO ---
carregarPaginaCarrinho();

// --- ATALHO SECRETO PARA O PAINEL DE ADMIN ---
document.addEventListener('DOMContentLoaded', () => {
    const atalhoAdmin = document.getElementById('ano-rodape');
    if (atalhoAdmin) {
        let clickCount = 0;
        let clickTimer = null;

        atalhoAdmin.addEventListener('click', () => {
            clickCount++;

            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 2000);

            if (clickCount === 5) {
                window.location.href = 'admin.html';
            }
        });
    }
});