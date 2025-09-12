// produto.js (VERSÃO FINAL COM URL DO RENDER)

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
let galeriaAtual = {
    imagens: [],
    indice: 0
};

// --- ELEMENTOS DO DOM ---
const carrinhoContador = document.querySelector('.carrinho-contador');
const detalheProdutoContainer = document.getElementById('detalhe-produto');
const modalCompraContainer = document.getElementById('modal-compra-container');
const modalCompraFecharBtn = document.getElementById('modal-compra-fechar');
const modalConfirmarCompraBtn = document.getElementById('modal-confirmar-compra-btn');
const modalFormaPagamento = document.getElementById('modal-forma-pagamento');
const modalOpcoesParcelamento = document.getElementById('modal-opcoes-parcelamento');

// --- FUNÇÕES DO CARRINHO ---
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
    carrinhoContador.classList.add('animar-pop');
    setTimeout(() => {
        carrinhoContador.classList.remove('animar-pop');
    }, 300);
}

// --- FUNÇÕES DA GALERIA DE IMAGENS E ZOOM ---
function mudarImagemGaleria(passo) {
    const totalImagens = galeriaAtual.imagens.length;
    if (totalImagens <= 1) return;

    galeriaAtual.indice = (galeriaAtual.indice + passo + totalImagens) % totalImagens;

    const imagemPrincipalEl = document.getElementById('produto-imagem-principal');
    const zoomResultEl = document.getElementById('img-zoom-result');
    const novaImagemSrc = galeriaAtual.imagens[galeriaAtual.indice];

    imagemPrincipalEl.src = novaImagemSrc;
    if (zoomResultEl) {
        zoomResultEl.style.backgroundImage = `url('${novaImagemSrc}')`;
    }

    document.querySelectorAll('.miniatura-img').forEach((miniatura, index) => {
        miniatura.classList.toggle('ativa', index === galeriaAtual.indice);
    });
}

function selecionarMiniatura(index) {
    galeriaAtual.indice = index;
    mudarImagemGaleria(0);
}

function iniciarZoom(img, result) {
    if (!result) return;
    result.style.display = 'none';

    const container = img.parentElement;
    container.addEventListener('mousemove', moverLupa);
    container.addEventListener('mouseenter', () => result.style.display = 'block');
    container.addEventListener('mouseleave', () => result.style.display = 'none');

    function moverLupa(e) {
        e.preventDefault();
        const pos = getCursorPos(e);
        const resultWidth = result.offsetWidth;
        const resultHeight = result.offsetHeight;

        result.style.backgroundSize = (img.width * 2) + "px " + (img.height * 2) + "px";
        result.style.backgroundPosition = "-" + (pos.x * 2 - resultWidth / 2) + "px -" + (pos.y * 2 - resultHeight / 2) + "px";
    }

    function getCursorPos(e) {
        const a = img.getBoundingClientRect();
        let x = e.pageX - a.left - window.pageXOffset;
        let y = e.pageY - a.top - window.pageYOffset;
        return { x: x, y: y };
    }
}

// --- LÓGICA PRINCIPAL DA PÁGINA DE PRODUTO ---
async function carregarPaginaProduto() {
    try {
        const response = await fetch(`${API_URL}/api/produtos`);
        if (!response.ok) throw new Error('Falha ao buscar produtos.');
        todosOsProdutos = await response.json();

        const urlParams = new URLSearchParams(window.location.search);
        const produtoId = parseInt(urlParams.get('id'));
        const produto = todosOsProdutos.find(p => p.id === produtoId);

        if (produto) {
            renderizarDetalhes(produto);
        } else {
            detalheProdutoContainer.innerHTML = '<p>Produto não encontrado.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar página do produto:", error);
        detalheProdutoContainer.innerHTML = '<p>Não foi possível carregar as informações do produto.</p>';
    }
}

function renderizarDetalhes(produto) {
    document.title = `${produto.nome} - Gringa Style`;

    galeriaAtual.imagens = produto.variantes ? produto.variantes.opcoes.map(v => v.imagem) : produto.imagens;
    galeriaAtual.indice = 0;

    let variantesHTML = '';
    if (produto.variantes) {
        variantesHTML = `
            <div class="variantes-container">
                <label for="variante-select">${produto.variantes.titulo}</label>
                <select id="variante-select" class="select-variante">
                    ${produto.variantes.opcoes.map((opcao, index) => `<option value="${index}">${opcao.nome}</option>`).join('')}
                </select>
            </div>
        `;
    }

    const miniaturasHTML = galeriaAtual.imagens.map((imgSrc, index) => `
        <img src="${imgSrc}" alt="Miniatura ${index + 1}" class="miniatura-img ${index === 0 ? 'ativa' : ''}" data-index="${index}">
    `).join('');

    const statusEstoqueHTML = produto.emEstoque
        ? '<p class="status-estoque-detalhe em-estoque">Disponível em estoque</p>'
        : '<p class="status-estoque-detalhe fora-de-estoque">Produto esgotado</p>';

    const botoesDesabilitados = !produto.emEstoque ? 'disabled' : '';

    const produtoHTML = `
        <div class="produto-detalhe-coluna-img">
            <div class="container-imagem-zoom">
                <img id="produto-imagem-principal" src="${galeriaAtual.imagens.length > 0 ? galeriaAtual.imagens[0] : 'imagens/placeholder.png'}" alt="${produto.nome}">
                <div id="img-zoom-result"></div>
                <button id="produto-seta-esq" class="produto-seta">&lt;</button>
                <button id="produto-seta-dir" class="produto-seta">&gt;</button>
            </div>
            <div class="produto-miniaturas">
                ${miniaturasHTML}
            </div>
        </div>
        <div class="produto-detalhe-coluna-info">
            <h1>${produto.nome}</h1>
            ${statusEstoqueHTML}
            <p class="produto-detalhe-descricao">${produto.descricao}</p>
            <div class="produto-detalhe-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
            ${variantesHTML}
            <div class="produto-detalhe-botoes">
                <button class="btn btn-adicionar-pagina-produto" data-id="${produto.id}" ${botoesDesabilitados}>Adicionar ao Carrinho</button>
                <button class="btn btn-secundario btn-comprar-agora" data-id="${produto.id}" ${botoesDesabilitados}>Comprar via WhatsApp</button>
            </div>
        </div>
    `;
    detalheProdutoContainer.innerHTML = produtoHTML;

    adicionarEventListenersProduto();

    const imgPrincipal = document.getElementById('produto-imagem-principal');
    const zoomResult = document.getElementById('img-zoom-result');
    imgPrincipal.onload = () => {
        if (zoomResult) {
            zoomResult.style.backgroundImage = `url('${imgPrincipal.src}')`;
            iniciarZoom(imgPrincipal, zoomResult);
        }
    };
    if (imgPrincipal.complete) {
        imgPrincipal.onload();
    }
}

function adicionarEventListenersProduto() {
    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = parseInt(urlParams.get('id'));
    const produto = todosOsProdutos.find(p => p.id === produtoId);

    document.getElementById('produto-seta-esq').addEventListener('click', () => mudarImagemGaleria(-1));
    document.getElementById('produto-seta-dir').addEventListener('click', () => mudarImagemGaleria(1));

    document.querySelectorAll('.miniatura-img').forEach(miniatura => {
        miniatura.addEventListener('click', (e) => {
            selecionarMiniatura(parseInt(e.target.dataset.index));
        });
    });

    if (produto && produto.variantes) {
        document.getElementById('variante-select').addEventListener('change', (e) => {
            const indiceSelecionado = parseInt(e.target.value);
            selecionarMiniatura(indiceSelecionado);
        });
    }
}


// --- FUNÇÕES DO MODAL DE COMPRA DIRETA ---
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
        const select = document.getElementById('variante-select');
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

// --- EVENT LISTENERS GLOBAIS ---
detalheProdutoContainer.addEventListener('click', (e) => {
    if (!e.target.dataset.id) return;
    const produtoId = parseInt(e.target.dataset.id);
    if (isNaN(produtoId)) return;

    const produto = todosOsProdutos.find(p => p.id === produtoId);
    if (!produto) return;

    let varianteSelecionada = null;
    if (produto.variantes) {
        const select = document.getElementById('variante-select');
        if (select) {
            const indiceVariante = parseInt(select.value);
            varianteSelecionada = produto.variantes.opcoes[indiceVariante];
        }
    }

    if (e.target.classList.contains('btn-adicionar-pagina-produto')) {
        adicionarAoCarrinho(produtoId, varianteSelecionada);
        e.target.textContent = 'Adicionado!';
        setTimeout(() => {
            e.target.textContent = 'Adicionar ao Carrinho';
        }, 1500);
    }

    if (e.target.classList.contains('btn-comprar-agora')) {
        abrirModalCompraDireta(produto, varianteSelecionada);
    }
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


// --- INICIALIZAÇÃO ---
carregarCarrinho();
atualizarContadorCarrinho();
carregarPaginaProduto();

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