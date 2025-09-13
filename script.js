const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

hamburgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('menu-aberto');
});

let todosOsProdutos = [];
let carrinho = [];
let galeriaModal = {
    imagens: [],
    indiceAtual: 0
};

const vitrineProdutos = document.getElementById('vitrine-produtos');
const modalContainer = document.getElementById('modal-container');
const modalFecharBtn = document.getElementById('modal-fechar');
const modalImg = document.getElementById('modal-img');
const modalTitulo = document.getElementById('modal-titulo');
const modalDescricao = document.getElementById('modal-descricao');
const modalPreco = document.getElementById('modal-preco');
const modalAdicionarCarrinhoBtn = document.getElementById('modal-adicionar-carrinho');
const modalComprarWhatsappBtn = document.getElementById('modal-comprar-whatsapp');
const carrinhoContador = document.querySelector('.carrinho-contador');
const modalSetaEsq = document.getElementById('modal-seta-esq');
const modalSetaDir = document.getElementById('modal-seta-dir');
const modalVariantesContainer = document.getElementById('modal-variantes-container');
const modalCompraContainer = document.getElementById('modal-compra-container');
const modalCompraFecharBtn = document.getElementById('modal-compra-fechar');
const modalConfirmarCompraBtn = document.getElementById('modal-confirmar-compra-btn');
const modalFormaPagamento = document.getElementById('modal-forma-pagamento');
const modalOpcoesParcelamento = document.getElementById('modal-opcoes-parcelamento');

async function carregarProdutos() {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            throw error;
        }

        todosOsProdutos = data;
        renderizarVitrine();
    } catch (error) {
        console.error("Erro ao carregar produtos do Supabase:", error);
        vitrineProdutos.innerHTML = "<p style='color: white; text-align: center;'>Não foi possível carregar os produtos. Tente novamente mais tarde.</p>";
    }
}

function renderizarVitrine() {
    vitrineProdutos.innerHTML = '';
    todosOsProdutos.forEach(produto => {
        let mediaHTML = '';
        if (produto.video) {
            mediaHTML = `<video src="${produto.video}" class="card-video" loop muted autoplay playsinline preload="metadata"></video>`;
        }
        else if (produto.imagens && produto.imagens.length > 0) {
            mediaHTML = produto.imagens.map((imagem, index) =>
                `<img src="${imagem}" alt="${produto.nome}" class="card-imagem ${index === 0 ? 'visivel' : ''}">`
            ).join('');
        }
        else {
            mediaHTML = `<img src="imagens/placeholder.png" alt="${produto.nome}" class="card-imagem visivel">`;
        }

        const statusEstoqueHTML = produto.emEstoque
            ? '<span class="status-estoque em-estoque">Em Estoque</span>'
            : '<span class="status-estoque fora-de-estoque">Fora de Estoque</span>';

        const botoesDesabilitados = !produto.emEstoque ? 'disabled' : '';
        const textoBotaoPrincipal = !produto.emEstoque ? 'Indisponível' : 'Compra Rápida';

        const cardProdutoHTML = `
            <div class="produto-card" data-produto-id="${produto.id}">
                ${statusEstoqueHTML}
                <div class="card-imagem-container">
                    ${mediaHTML}
                </div>
                <div class="produto-info">
                    <h3>${produto.nome}</h3>
                    <p class="preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                    <div class="produto-botoes">
                        <button class="btn btn-quick-view" data-id="${produto.id}" ${botoesDesabilitados}>${textoBotaoPrincipal}</button>
                        <a href="produto.html?id=${produto.id}" class="btn btn-secundario">Ver Detalhes</a>
                    </div>
                </div>
            </div>
        `;
        vitrineProdutos.insertAdjacentHTML('beforeend', cardProdutoHTML);
    });
    iniciarCarrosseis();
}

function iniciarCarrosseis() {
    const cards = document.querySelectorAll('.produto-card');
    cards.forEach(card => {
        const imagens = card.querySelectorAll('.card-imagem');
        const video = card.querySelector('.card-video');
        if (video || imagens.length <= 1) return;

        let indiceAtual = 0;
        let intervalId = setInterval(() => {
            imagens[indiceAtual].classList.remove('visivel');
            indiceAtual = (indiceAtual + 1) % imagens.length;
            imagens[indiceAtual].classList.add('visivel');
        }, 2000);

        card.addEventListener('mouseenter', () => clearInterval(intervalId));

        card.addEventListener('mouseleave', () => {
            intervalId = setInterval(() => {
                imagens[indiceAtual].classList.remove('visivel');
                indiceAtual = (indiceAtual + 1) % imagens.length;
                imagens[indiceAtual].classList.add('visivel');
            }, 2000);
        });
    });
}

function abrirModal(produtoId) {
    const produto = todosOsProdutos.find(p => p.id === produtoId);
    if (!produto) return;

    galeriaModal.imagens = [];
    modalVariantesContainer.innerHTML = '';

    modalTitulo.textContent = produto.nome;
    modalDescricao.textContent = produto.descricao;
    modalPreco.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
    modalAdicionarCarrinhoBtn.dataset.id = produto.id;
    modalComprarWhatsappBtn.dataset.id = produto.id;

    if (produto.variantes) {
        galeriaModal.imagens = produto.variantes.opcoes.map(v => v.imagem);

        let variantesHTML = `<label for="modal-variante-select">${produto.variantes.titulo}</label>`;
        variantesHTML += `<select id="modal-variante-select" class="select-variante">`;
        produto.variantes.opcoes.forEach((opcao, index) => {
            variantesHTML += `<option value="${index}">${opcao.nome}</option>`;
        });
        variantesHTML += `</select>`;
        modalVariantesContainer.innerHTML = variantesHTML;

        document.getElementById('modal-variante-select').addEventListener('change', (e) => {
            const novoIndice = parseInt(e.target.value);
            galeriaModal.indiceAtual = novoIndice;
            mudarImagemModal(0);
        });

    } else {
        galeriaModal.imagens = produto.imagens;
    }

    galeriaModal.indiceAtual = 0;
    mudarImagemModal(0);

    if (galeriaModal.imagens.length > 1) {
        modalSetaEsq.style.display = 'block';
        modalSetaDir.style.display = 'block';
    } else {
        modalSetaEsq.style.display = 'none';
        modalSetaDir.style.display = 'none';
    }

    modalContainer.classList.add('visivel');
}

function mudarImagemModal(direcao) {
    const totalImagens = galeriaModal.imagens.length;
    if (totalImagens === 0) {
        modalImg.src = 'imagens/placeholder.png';
        return;
    }

    galeriaModal.indiceAtual = (galeriaModal.indiceAtual + direcao + totalImagens) % totalImagens;
    modalImg.src = galeriaModal.imagens[galeriaModal.indiceAtual];

    const varianteSelect = document.getElementById('modal-variante-select');
    if (varianteSelect) {
        varianteSelect.value = galeriaModal.indiceAtual;
    }
}

function fecharModal() {
    modalContainer.classList.remove('visivel');
}

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

    if (totalItens > 0) {
        carrinhoContador.classList.add('animar-pop');
        setTimeout(() => {
            carrinhoContador.classList.remove('animar-pop');
        }, 300);
    }
}

function adicionarAoCarrinho(produtoId, varianteSelecionada = null) {
    const itemId = varianteSelecionada ? `${produtoId}-${varianteSelecionada.nome}` : `${produtoId}`;

    const itemExistente = carrinho.find(item => item.idUnico === itemId);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            idProduto: produtoId,
            idUnico: itemId,
            variante: varianteSelecionada,
            quantidade: 1
        });
    }
    salvarCarrinho();
    atualizarContadorCarrinho();
}

function abrirModalCompraDireta(produto, varianteSelecionada = null) {
    const resumoProdutoEl = document.getElementById('modal-compra-resumo-produto');
    let nomeProdutoExibido = produto.nome;
    if (varianteSelecionada) {
        nomeProdutoExibido += ` (${varianteSelecionada.nome})`;
    }

    resumoProdutoEl.innerHTML = `
        <p><strong>Produto:</strong> ${nomeProdutoExibido}</p>
        <p><strong>Preço:</strong> R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
    `;

    modalConfirmarCompraBtn.dataset.id = produto.id;
    modalCompraContainer.classList.add('visivel');
}

function fecharModalCompraDireta() {
    modalCompraContainer.classList.remove('visivel');
}

function gerarMensagemWhatsAppProdutoUnico() {
    const nomeClienteInput = document.getElementById('modal-nome-cliente');
    const nomeCliente = nomeClienteInput.value.trim();

    if (nomeCliente === "") {
        alert("Por favor, preencha seu nome para continuar.");
        nomeClienteInput.focus();
        return;
    }

    const produtoId = parseInt(modalConfirmarCompraBtn.dataset.id);
    const produto = todosOsProdutos.find(p => p.id === produtoId);
    let varianteSelecionada = null;

    if (produto.variantes) {
        const select = document.getElementById('modal-variante-select');
        const indiceVariante = parseInt(select.value);
        varianteSelecionada = produto.variantes.opcoes[indiceVariante];
    }

    const numeroWhatsapp = "5515998608170";
    let mensagem = `Olá Gringa Style!\n\nMeu nome é *${nomeCliente}* e gostaria de comprar o seguinte item:\n\n`;

    let nomeProdutoMsg = produto.nome;
    if (varianteSelecionada) {
        nomeProdutoMsg += ` (${varianteSelecionada.nome})`;
    }
    mensagem += `• *Produto:* ${nomeProdutoMsg}\n`;
    mensagem += `• *Valor:* R$ ${produto.preco.toFixed(2).replace('.', ',')}\n\n`;

    const formaPagamento = document.getElementById('modal-forma-pagamento').value;

    if (formaPagamento === 'Cartão de Crédito') {
        const parcelas = document.getElementById('modal-numero-parcelas').value;
        mensagem += `*Pagamento:* ${formaPagamento} em ${parcelas}\n\n`;
        mensagem += `_Aguardo o link para pagamento. (Sei que as taxas serão calculadas na próxima etapa)_`;
    } else {
        mensagem += `*Pagamento:* ${formaPagamento}\n\n`;
        mensagem += `_Aguardo a chave PIX para o pagamento. Obrigado!_`;
    }

    const linkWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkWhatsapp, '_blank');
    fecharModalCompraDireta();
}

vitrineProdutos.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-quick-view')) {
        const produtoId = parseInt(event.target.dataset.id);
        abrirModal(produtoId);
    }
});

modalFecharBtn.addEventListener('click', fecharModal);
modalContainer.addEventListener('click', (event) => {
    if (event.target === modalContainer) {
        fecharModal();
    }
});
modalAdicionarCarrinhoBtn.addEventListener('click', () => {
    const produtoId = parseInt(modalAdicionarCarrinhoBtn.dataset.id);
    const produto = todosOsProdutos.find(p => p.id === produtoId);
    let varianteSelecionada = null;

    if (produto.variantes) {
        const select = document.getElementById('modal-variante-select');
        const indiceVariante = parseInt(select.value);
        varianteSelecionada = produto.variantes.opcoes[indiceVariante];
    }

    adicionarAoCarrinho(produtoId, varianteSelecionada);
    fecharModal();
});
modalSetaEsq.addEventListener('click', () => mudarImagemModal(-1));
modalSetaDir.addEventListener('click', () => mudarImagemModal(1));

modalComprarWhatsappBtn.addEventListener('click', (e) => {
    const produtoId = parseInt(e.target.dataset.id);
    const produto = todosOsProdutos.find(p => p.id === produtoId);
    let varianteSelecionada = null;
    if (produto.variantes) {
        const select = document.getElementById('modal-variante-select');
        const indiceVariante = parseInt(select.value);
        varianteSelecionada = produto.variantes.opcoes[indiceVariante];
    }
    fecharModal();
    abrirModalCompraDireta(produto, varianteSelecionada);
});

modalCompraFecharBtn.addEventListener('click', fecharModalCompraDireta);
modalCompraContainer.addEventListener('click', (e) => {
    if (e.target === modalCompraContainer) {
        fecharModalCompraDireta();
    }
});
modalFormaPagamento.addEventListener('change', () => {
    modalOpcoesParcelamento.style.display = modalFormaPagamento.value === 'Cartão de Crédito' ? 'block' : 'none';
});
modalConfirmarCompraBtn.addEventListener('click', gerarMensagemWhatsAppProdutoUnico);

carregarCarrinho();
atualizarContadorCarrinho();
carregarProdutos();

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

            if (clickCount === 2) {
                window.location.href = 'admin.html';
            }
        });
    }
});