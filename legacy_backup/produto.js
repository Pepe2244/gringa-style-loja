function getPrecoFinal(produto) {
    if (produto.preco_promocional && produto.preco_promocional < produto.preco) {
        return produto.preco_promocional;
    }
    return produto.preco;
}

const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('menu-aberto');
    });
}

let todosOsProdutos = [];
let carrinho = [];
let galeriaAtual = {
    imagens: [],
    indice: 0
};

const carrinhoContador = document.querySelector('.carrinho-contador');
const detalheProdutoContainer = document.getElementById('detalhe-produto');

const relatedProductsContainer = document.getElementById('related-products');
const relatedList = document.getElementById('related-list');

const modalCompraContainer = document.getElementById('modal-compra-container');
const modalCompraFecharBtn = document.getElementById('modal-compra-fechar');
const modalConfirmarCompraBtn = document.getElementById('modal-confirmar-compra-btn');
const modalFormaPagamento = document.getElementById('modal-forma-pagamento');
const modalOpcoesParcelamento = document.getElementById('modal-opcoes-parcelamento');
const resumoProdutoEl = document.getElementById('modal-compra-resumo-produto');

function showToast(message, type = 'sucesso') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification';

    if (type === 'erro') {
        toast.classList.add('erro');
    }

    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100); 

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentElement) {
                toast.remove();
            }
        });
    }, 3000);
}

async function configurarLinkAcompanharRifa() {
    const link = document.getElementById('header-link-acompanhar');
    if (!link || !window.supabase) return;
    try {
        const { data, error } = await window.supabase
            .from('rifas')
            .select('id')
            .eq('status', 'ativa')
            .limit(1)
            .maybeSingle(); // CORREÇÃO: Alterado de .single() para .maybeSingle()

        if (data && !error) {
            link.href = `acompanhar_rifa.html?id=${data.id}`;
            link.style.display = 'block';
        } else {
            link.style.display = 'none';
        }
    } catch (error) {
        console.error("Erro ao buscar rifa ativa para o header:", error);
        link.style.display = 'none';
    }
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
    if (!carrinhoContador) return;
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    carrinhoContador.textContent = totalItens;
}

function adicionarAoCarrinho(produtoId, variante) {
   carregarCarrinho();

   const itemExistente = carrinho.find(item =>
       item.produto_id === produtoId &&
       JSON.stringify(item.variante) === JSON.stringify(variante)
   );

   if (itemExistente) {
       itemExistente.quantidade++;
   } else {
       carrinho.push({
           produto_id: produtoId,
           quantidade: 1,
           variante: variante
       });
   }

   salvarCarrinho();
   atualizarContadorCarrinho();
   if(carrinhoContador) {
       carrinhoContador.classList.add('animar-pop');
        setTimeout(() => {
            carrinhoContador.classList.remove('animar-pop');
        }, 300);
   }
}

function mudarImagemGaleria(passo) {
    const totalImagens = galeriaAtual.imagens.length;
    if (totalImagens <= 1) return;

    galeriaAtual.indice = (galeriaAtual.indice + passo + totalImagens) % totalImagens;

    const imagemPrincipalEl = document.getElementById('produto-imagem-principal');
    if (!imagemPrincipalEl) return;

    const novaImagemSrc = galeriaAtual.imagens[galeriaAtual.indice];
    const imgUrlOtimizada = `${novaImagemSrc}?format=webp&width=600&quality=80`;
    imagemPrincipalEl.src = imgUrlOtimizada;

    document.querySelectorAll('.miniatura-img').forEach((miniatura, index) => {
        miniatura.classList.toggle('ativa', index === galeriaAtual.indice);
    });
}

function selecionarMiniatura(index) {
    galeriaAtual.indice = index;
    mudarImagemGaleria(0);
}

// --- NOVA FUNÇÃO SEO: INJETAR DADOS ESTRUTURADOS (SCHEMA.ORG) ---
function atualizarSchemaProduto(produto) {
    const preco = getPrecoFinal(produto);
    const disponibilidade = produto.emEstoque ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    
    // Constrói a URL absoluta da imagem principal
    let imagemUrl = "";
    if (produto.media_urls && produto.media_urls.length > 0) {
        // Se for URL relativa, adiciona o domínio. Se for absoluta (Cloudinary/Supabase), mantém.
        if (produto.media_urls[0].startsWith('http')) {
            imagemUrl = produto.media_urls[0];
        } else {
            imagemUrl = window.location.origin + '/' + produto.media_urls[0];
        }
    }

    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": produto.nome,
        "image": [imagemUrl],
        "description": produto.descricao.replace(/<[^>]*>?/gm, ''), // Remove HTML da descrição
        "sku": produto.id,
        "brand": {
            "@type": "Brand",
            "name": "Gringa Style"
        },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "BRL",
            "price": preco.toFixed(2),
            "priceValidUntil": "2025-12-31",
            "availability": disponibilidade,
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    // Remove script antigo se existir
    const oldScript = document.getElementById('json-ld-produto');
    if (oldScript) oldScript.remove();

    // Cria e injeta o novo script
    const script = document.createElement('script');
    script.id = 'json-ld-produto';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
}
// --- FIM DA FUNÇÃO SEO ---

async function carregarPaginaProduto() {
    if (!detalheProdutoContainer) return; 

    if (!window.supabase) {
        detalheProdutoContainer.innerHTML = '<p>Erro: Supabase não carregado.</p>';
        return;
    }

    try {
        const { data, error } = await window.supabase
            .from('produtos')
            .select('*');

        if (error) throw error;

        todosOsProdutos = data;
        const urlParams = new URLSearchParams(window.location.search);
        const produtoId = parseInt(urlParams.get('id'));
        const produto = todosOsProdutos.find(p => p.id === produtoId);

        if (produto) {
            // SEO: Atualiza Título e Descrição da Página
            document.title = `${produto.nome} | Gringa Style`;
            const metaDescricao = document.getElementById('meta-descricao-produto');
            if (metaDescricao) {
               const descricaoLimpa = produto.descricao.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
               metaDescricao.setAttribute('content', `${produto.nome}: ${descricaoLimpa.substring(0, 150)}... - Compre agora na Gringa Style.`);
            }

            // SEO: Injeta o Schema
            atualizarSchemaProduto(produto);

            renderizarDetalhes(produto);
            renderizarProdutosRelacionados(produto.id);
        } else {
            detalheProdutoContainer.innerHTML = '<p>Produto não encontrado.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar página do produto:", error);
        detalheProdutoContainer.innerHTML = '<p>Não foi possível carregar as informações do produto.</p>';
    }
}

function renderizarProdutosRelacionados(produtoAtualId) {
    if (!relatedList || !relatedProductsContainer) return;

    const outrosProdutos = todosOsProdutos.filter(p => p.id !== produtoAtualId);

    const produtosRelacionados = outrosProdutos.sort(() => 0.5 - Math.random()).slice(0, 4);

    if (produtosRelacionados.length > 0) {
        relatedList.innerHTML = ''; 

        produtosRelacionados.forEach(produto => {
            const precoFinalRelacionado = getPrecoFinal(produto);

            let mediaHTML = '';
            const mediaUrls = produto.media_urls || produto.imagens; 
            const videoUrl = produto.video;

            if (videoUrl) {
                mediaHTML = `<video class="related-product-media" src="${videoUrl}" loop muted autoplay playsinline preload="metadata"></video>`;
            } else if (mediaUrls && mediaUrls.length > 0) {
                const imgUrlOtimizada = `${mediaUrls[0]}?format=webp&width=200&quality=75`;
                mediaHTML = `<img class="related-product-media" src="${imgUrlOtimizada}" alt="${produto.nome}">`;
            } else {
                mediaHTML = `<img class="related-product-media" src="imagens/gringa_style_logo.png" alt="${produto.nome}">`;
            }

            const cardHTML = `
                <a href="produto.html?id=${produto.id}" class="related-product-card">
                    ${mediaHTML}
                    <h4>${produto.nome}</h4>
                    <p>R$ ${precoFinalRelacionado.toFixed(2).replace('.', ',')}</p>
                </a>
            `;

            relatedList.insertAdjacentHTML('beforeend', cardHTML);
        });

        relatedProductsContainer.style.display = 'block'; 
    } else {
        relatedProductsContainer.style.display = 'none'; 
    }
}

function renderizarDetalhes(produto) {
    if (!detalheProdutoContainer) return;

    const mediaUrls = produto.media_urls || produto.imagens || [];
    galeriaAtual.imagens = mediaUrls;
    galeriaAtual.indice = 0;

    let variantesHTML = '';
    const variantesContainer = document.createElement('div');
    variantesContainer.className = 'produto-variantes';
    variantesContainer.id = 'variantes-container';

    if (produto.variants && produto.variants.tipo && produto.variants.opcoes && produto.variants.opcoes.length > 0) {
       let innerVariantesHTML = `
           <label for="select-variante">${produto.variants.tipo}:</label>
           <select id="select-variante" class="select-variante">
       `;
       produto.variants.opcoes.forEach(opcao => {
           innerVariantesHTML += `<option value="${opcao}">${opcao}</option>`;
       });
       innerVariantesHTML += `</select>`;
       variantesContainer.innerHTML = innerVariantesHTML;
       variantesHTML = variantesContainer.outerHTML;
    } else {
       variantesContainer.style.display = 'none';
       variantesHTML = variantesContainer.outerHTML;
    }

    let mediaPrincipalHTML = '';
    if (produto.video) {
        mediaPrincipalHTML = `<video src="${produto.video}" controls loop muted autoplay playsinline class="video-principal" preload="metadata"></video>`;
    } else if (galeriaAtual.imagens.length > 0) {
        const imgUrlOtimizada = `${galeriaAtual.imagens[0]}?format=webp&width=600&quality=80`;
        mediaPrincipalHTML = `
            <div class="container-imagem-zoom">
                <img id="produto-imagem-principal" src="${imgUrlOtimizada}" alt="${produto.nome}">
                <button id="produto-seta-esq" class="produto-seta">&lt;</button>
                <button id="produto-seta-dir" class="produto-seta">&gt;</button>
            </div>`;
    } else {
        mediaPrincipalHTML = `<img id="produto-imagem-principal" src="imagens/gringa_style_logo.png" alt="${produto.nome}">`;
    }

    const miniaturasHTML = galeriaAtual.imagens.map((imgSrc, index) => {
        const imgUrlOtimizada = `${imgSrc}?format=webp&width=100&quality=70`;
        return `<img src="${imgUrlOtimizada}" alt="Miniatura ${index + 1}" class="miniatura-img ${index === 0 ? 'ativa' : ''}" data-index="${index}">`;
    }).join('');

    const statusEstoqueHTML = produto.emEstoque
        ? '<p class="status-estoque-detalhe em-estoque">Disponível em estoque</p>'
        : '<p class="status-estoque-detalhe fora-de-estoque">Produto esgotado</p>';

    let precoHTML = '';
    const precoFinal = getPrecoFinal(produto);
    if (precoFinal < produto.preco) {
        precoHTML = `
            <div class="produto-detalhe-preco">
                <span class="preco-antigo" style="font-size: 0.7em;">De R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
                <span class="preco-novo">Por R$ ${precoFinal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    } else {
        precoHTML = `<div class="produto-detalhe-preco">R$ ${precoFinal.toFixed(2).replace('.', ',')}</p>`;
    }

    const botoesDesabilitados = !produto.emEstoque ? 'disabled' : '';

    const produtoHTML = `
        <div class="produto-detalhe-coluna-img">
            ${mediaPrincipalHTML}
            <div class="produto-miniaturas">
                ${miniaturasHTML}
            </div>
        </div>
        <div class="produto-detalhe-coluna-info">
            <h1>${produto.nome}</h1>
            ${statusEstoqueHTML}
            <p class="produto-detalhe-descricao">${produto.descricao}</p>
            ${precoHTML} 
            ${variantesHTML}
            <div class="produto-detalhe-botoes">
                <button class="btn btn-adicionar btn-adicionar-pagina-produto" data-id="${produto.id}" ${botoesDesabilitados}>Adicionar ao Carrinho</button>
                <button class="btn btn-secundario btn-comprar-agora" data-id="${produto.id}" ${botoesDesabilitados}>Comprar via WhatsApp</button>
            </div>
        </div>
    `;
    detalheProdutoContainer.innerHTML = produtoHTML;

    adicionarEventListenersProduto();
}

function adicionarEventListenersProduto() {
    const setaEsq = document.getElementById('produto-seta-esq');
    const setaDir = document.getElementById('produto-seta-dir');
    if (setaEsq && setaDir) {
        setaEsq.addEventListener('click', () => mudarImagemGaleria(-1));
        setaDir.addEventListener('click', () => mudarImagemGaleria(1));
    }

    document.querySelectorAll('.miniatura-img').forEach(miniatura => {
        miniatura.addEventListener('click', (e) => {
            selecionarMiniatura(parseInt(e.target.dataset.index));
        });
    });
}

function abrirModalCompraDireta(produto, variante) {
   if (!resumoProdutoEl || !modalConfirmarCompraBtn || !modalCompraContainer) return;

   const precoFinal = getPrecoFinal(produto);
   const precoFormatado = `R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
   const mediaUrls = produto.media_urls || produto.imagens || [];
   const imagemUrl = mediaUrls.length > 0 ? mediaUrls[0] : 'imagens/gringa_style_logo.png';

   let varianteHTML = '';
   if (variante) {
       varianteHTML = `<p style="font-size: 0.9rem; color: #ccc; margin-top: 5px;">${variante.tipo}: ${variante.opcao}</p>`;
   }

   resumoProdutoEl.innerHTML = `
       <img src="${imagemUrl}" alt="${produto.nome}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; float: left; margin-right: 15px;">
       <div style="overflow: hidden;">
           <h3>${produto.nome}</h3>
           ${varianteHTML}
           <p style="font-size: 1.2rem; font-weight: bold; color: var(--cor-destaque); margin-top: 5px;">${precoFormatado}</p>
       </div>
   `;

    modalConfirmarCompraBtn.dataset.id = produto.id;
    modalCompraContainer.classList.add('visivel');
}


function fecharModalCompraDireta() {
    if(modalCompraContainer) modalCompraContainer.classList.remove('visivel');
}

function gerarMensagemWhatsAppProdutoUnico() {
    const nomeClienteInput = document.getElementById('modal-nome-cliente');
    if (!nomeClienteInput || !modalConfirmarCompraBtn) return;

    const nomeCliente = nomeClienteInput.value.trim();

    if (nomeCliente === "") {
        showToast("Por favor, preencha seu nome para continuar.", "erro");
        nomeClienteInput.focus();
        return;
    }

    const produtoId = parseInt(modalConfirmarCompraBtn.dataset.id);
    const produto = todosOsProdutos.find(p => p.id === produtoId);
    if (!produto) {
        showToast("Erro ao encontrar produto. Tente novamente.", "erro");
        return;
    }

    let varianteInfo = '';
    const selectVariante = document.getElementById('select-variante');
    if (selectVariante && selectVariante.value && produto.variants) {
       const tipo = produto.variants.tipo;
       const opcao = selectVariante.value;
       varianteInfo = ` (${tipo}: ${opcao})`;
    }

    const precoFinal = getPrecoFinal(produto);
    const numeroWhatsapp = "5515998608170";

    let mensagem = `Olá, Gringa Style! 👋\n\nMeu nome é *${nomeCliente}* e eu gostaria de comprar este item:\n\n`;
    mensagem += `*Produto:* ${produto.nome}${varianteInfo}\n`;
    mensagem += `*Valor:* R$ ${precoFinal.toFixed(2).replace('.', ',')}\n\n`;

    if (precoFinal < produto.preco) {
        mensagem += `_(Valor promocional de R$ ${precoFinal.toFixed(2).replace('.', ',')})_\n\n`;
    }

    const formaPagamentoEl = document.getElementById('modal-forma-pagamento');
    const formaPagamento = formaPagamentoEl ? formaPagamentoEl.value : 'PIX';

    if (formaPagamento === 'Cartão de Crédito') {
        const parcelasEl = document.getElementById('modal-numero-parcelas');
        const parcelas = parcelasEl ? parcelasEl.value : '1x';
        mensagem += `*Pagamento:* ${formaPagamento} em ${parcelas}\n\n`;
        mensagem += `*Aguardo o link para pagamento. (Sei que as taxas serão calculadas na próxima etapa)*`;
    } else {
        mensagem += `*Pagamento:* ${formaPagamento}\n\n`;
        mensagem += `*Aguardo a chave PIX para o pagamento. Obrigado!*`;
    }

    const linkWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkWhatsapp, '_blank');
    fecharModalCompraDireta();
}

if(detalheProdutoContainer) {
    detalheProdutoContainer.addEventListener('click', (e) => {
       const btnAdicionar = e.target.closest('.btn-adicionar');
       const btnComprar = e.target.closest('.btn-comprar-agora');
       const targetButton = btnAdicionar || btnComprar;

       if (!targetButton || !targetButton.dataset.id) return;

       const produtoId = parseInt(targetButton.dataset.id);
       const produto = todosOsProdutos.find(p => p.id === produtoId);
       if (!produto) return;

       let varianteSelecionada = null;
       const selectVariante = document.getElementById('select-variante');

       if (produto.variants && produto.variants.opcoes && produto.variants.opcoes.length > 0) {
           const label = document.querySelector('#variantes-container label');
           if (label && selectVariante) {
               varianteSelecionada = {
                   tipo: label.textContent.replace(':', ''),
                   opcao: selectVariante.value
               };
           }
       }

       if (btnAdicionar) {
           adicionarAoCarrinho(produtoId, varianteSelecionada);
           showToast('Produto adicionado ao carrinho!');
       }

       if (btnComprar) {
           abrirModalCompraDireta(produto, varianteSelecionada);
       }
    });
}


if(modalCompraFecharBtn) modalCompraFecharBtn.addEventListener('click', fecharModalCompraDireta);
if(modalCompraContainer) modalCompraContainer.addEventListener('click', (e) => {
    if (e.target === modalCompraContainer) {
        fecharModalCompraDireta();
    }
});
if(modalFormaPagamento) modalFormaPagamento.addEventListener('change', () => {
    if(modalOpcoesParcelamento) modalOpcoesParcelamento.style.display = modalFormaPagamento.value === 'Cartão de Crédito' ? 'block' : 'none';
});
if(modalConfirmarCompraBtn) modalConfirmarCompraBtn.addEventListener('click', gerarMensagemWhatsAppProdutoUnico);

document.addEventListener('DOMContentLoaded', () => {
    configurarLinkAcompanharRifa();
    carregarCarrinho();
    atualizarContadorCarrinho();
    carregarPaginaProduto(); 

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