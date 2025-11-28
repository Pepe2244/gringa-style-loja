document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    const vitrineProdutos = document.getElementById('vitrine-produtos');

    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');

    const modalContainer = document.getElementById('modal-container');
    const modalFecharBtn = document.getElementById('modal-fechar');
    const modalMediaContainer = document.getElementById('modal-media-container');
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
    const resumoProdutoEl = document.getElementById('modal-compra-resumo-produto');


    let todosOsProdutos = [];
    let carrinho = [];
    let galeriaModal = {
        imagens: [],
        indiceAtual: 0
    };
    let categoriaSelecionada = null;
    let diasNovo = 7; // Default
    let categorias = [];

    function getPrecoFinal(produto) {
        if (!produto.preco_promocional || produto.preco_promocional >= (produto.preco || 0)) {
            return produto.preco || 0;
        }
        return produto.preco_promocional;
    }

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

    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('menu-aberto');
    });

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
            console.error("Erro ao buscar rifa ativa para o header:", error.message);
            link.style.display = 'none';
        }
    }

    async function carregarProdutos() {
        if (!window.supabase) {
            vitrineProdutos.innerHTML = "<p style='color: white; text-align: center;'>Erro: Supabase não está definido.</p>";
            return;
        }
        try {
            const { data, error } = await window.supabase
                .from('produtos')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            todosOsProdutos = data;

            aplicarFiltros();
        } catch (error) {
            console.error("Erro ao carregar produtos do Supabase:", error);
            vitrineProdutos.innerHTML = "<p style='color: white; text-align: center;'>Não foi possível carregar os produtos. Tente novamente mais tarde.</p>";
        }
    }

    async function carregarCategorias() {
        if (!window.supabase) return;
        const { data, error } = await window.supabase.from('categorias').select('*').order('nome');
        if (!error && data) {
            categorias = data;
            renderizarBotoesCategorias();
        }
    }

    async function carregarConfiguracoes() {
        if (!window.supabase) return;
        const { data, error } = await window.supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle();
        if (!error && data) {
            diasNovo = parseInt(data.valor);
        }
    }

    function renderizarBotoesCategorias() {
        const select = document.getElementById('categoria-select');
        if (!select) return;

        select.innerHTML = '<option value="">Todas as Categorias</option>';

        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            if (categoriaSelecionada == cat.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    window.filtrarPorCategoria = function (id) {
        categoriaSelecionada = id ? parseInt(id) : null;
        aplicarFiltros();
    }

    function aplicarFiltros() {
        const termoBusca = searchInput.value.toLowerCase().trim();
        const sortTipo = document.getElementById('sort-select').value;

        let produtosFiltrados = todosOsProdutos.filter(produto => {
            const nome = produto.nome.toLowerCase();
            const descricao = produto.descricao.toLowerCase();
            const tags = produto.tags ? produto.tags.join(' ').toLowerCase() : '';

            const matchBusca = nome.includes(termoBusca) || descricao.includes(termoBusca) || tags.includes(termoBusca);
            const matchCategoria = categoriaSelecionada ? produto.categoria_id === categoriaSelecionada : true;

            return matchBusca && matchCategoria;
        });

        // Ordenação
        if (sortTipo === 'menor-preco') {
            produtosFiltrados.sort((a, b) => getPrecoFinal(a) - getPrecoFinal(b));
        } else if (sortTipo === 'maior-preco') {
            produtosFiltrados.sort((a, b) => getPrecoFinal(b) - getPrecoFinal(a));
        } else if (sortTipo === 'az') {
            produtosFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
        } else if (sortTipo === 'za') {
            produtosFiltrados.sort((a, b) => b.nome.localeCompare(a.nome));
        } else {
            // Padrão: Novos primeiro, depois alfabética
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - diasNovo);

            produtosFiltrados.sort((a, b) => {
                const aNovo = a.created_at && new Date(a.created_at) > dataLimite;
                const bNovo = b.created_at && new Date(b.created_at) > dataLimite;

                if (aNovo && !bNovo) return -1;
                if (!aNovo && bNovo) return 1;

                // Se ambos forem novos ou ambos não forem, ordena por nome
                return a.nome.localeCompare(b.nome);
            });
        }

        renderizarVitrine(produtosFiltrados);
    }

    function renderizarVitrine(produtos) {
        vitrineProdutos.innerHTML = '';

        if (produtos.length === 0) {
            vitrineProdutos.innerHTML = "<p style='color: white; text-align: center; font-size: 1.2em;'>Nenhum produto encontrado para sua busca.</p>";
            return;
        }

        produtos.forEach(produto => {
            let mediaHTML = '';
            const mediaUrls = produto.media_urls || produto.imagens || [];
            const videoUrl = produto.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));
            const imageUrls = mediaUrls.filter(url => !url.includes('.mp4') && !url.includes('.webm'));

            if (videoUrl) {
                mediaHTML = `<video src="${videoUrl}" class="card-video" loop muted autoplay playsinline preload="metadata"></video>`;
            } else if (imageUrls.length > 0) {
                mediaHTML = imageUrls.map((imagem, index) => {
                    const imgUrlOtimizada = `${imagem}?format=webp&width=400&quality=75`;
                    return `<img src="${imgUrlOtimizada}" alt="${produto.nome}" class="card-imagem ${index === 0 ? 'visivel' : ''}">`;
                }).join('');
            } else {
                mediaHTML = `<img src="imagens/gringa_style_logo.png" alt="${produto.nome}" class="card-imagem visivel">`;
            }

            let precoHTML = '';
            const precoNormal = produto.preco ? produto.preco.toFixed(2).replace('.', ',') : '0,00';
            const precoFinal = getPrecoFinal(produto);

            if (precoFinal < produto.preco) {
                const precoPromo = precoFinal.toFixed(2).replace('.', ',');
                precoHTML = `
                    <p class="preco">
                        <span class="preco-antigo">De R$ ${precoNormal}</span>
                        <span class="preco-novo">Por R$ ${precoPromo}</span>
                    </p>
                `;
            } else {
                precoHTML = `<p class="preco">R$ ${precoFinal.toFixed(2).replace('.', ',')}</p>`;
            }

            const emEstoque = produto.emEstoque !== null ? produto.emEstoque : true;
            const statusEstoqueHTML = emEstoque ? '<span class="status-estoque em-estoque">Em Estoque</span>' : '<span class="status-estoque fora-de-estoque">Fora de Estoque</span>';
            const botoesDesabilitados = !emEstoque ? 'disabled' : '';
            const textoBotaoPrincipal = !emEstoque ? 'Indisponível' : (produto.variants ? 'Ver Opções' : 'Compra Rápida');

            // Lógica do selo NOVO
            let novoBadgeHTML = '';
            if (produto.created_at) {
                const dataCriacao = new Date(produto.created_at);
                const dataLimite = new Date();
                dataLimite.setDate(dataLimite.getDate() - diasNovo);
                if (dataCriacao > dataLimite) {
                    novoBadgeHTML = '<span class="badge-novo">NOVO</span>';
                }
            }

            const cardProdutoHTML = `
                <div class="produto-card" data-produto-id="${produto.id}">
                    ${novoBadgeHTML}
                    ${statusEstoqueHTML}
                    <div class="card-imagem-container">${mediaHTML}</div>
                    <div class="produto-info">
                        <h3>${produto.nome}</h3>
                        ${precoHTML} <div class="produto-botoes">
                            <button class="btn btn-quick-view" data-id="${produto.id}" ${botoesDesabilitados}>${textoBotaoPrincipal}</button>
                            <a href="produto.html?id=${produto.id}" class="btn btn-secundario">Ver Detalhes</a>
                        </div>
                    </div>
                </div>`;
            vitrineProdutos.insertAdjacentHTML('beforeend', cardProdutoHTML);
        });
        iniciarCarrosseis();
    }

    function iniciarCarrosseis() {
        document.querySelectorAll('.produto-card').forEach(card => {
            const video = card.querySelector('.card-video');
            if (video) {
                video.play().catch(error => { });
                return;
            }
            const imagens = card.querySelectorAll('.card-imagem');
            if (imagens.length <= 1) return;
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
        modalMediaContainer.innerHTML = '';

        modalTitulo.textContent = produto.nome;
        modalDescricao.textContent = produto.descricao;

        const precoFinal = getPrecoFinal(produto);
        if (precoFinal < produto.preco) {
            modalPreco.innerHTML = `<span class="preco-antigo">De R$ ${produto.preco.toFixed(2).replace('.', ',')}</span> <span class="preco-novo">Por R$ ${precoFinal.toFixed(2).replace('.', ',')}</span>`;
        } else {
            modalPreco.innerHTML = `R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
        }

        modalAdicionarCarrinhoBtn.dataset.id = produto.id;
        modalComprarWhatsappBtn.dataset.id = produto.id;

        const mediaUrls = produto.media_urls || produto.imagens || [];
        const videoUrl = produto.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));
        const imageUrls = mediaUrls.filter(url => !url.includes('.mp4') && !url.includes('.webm'));

        if (videoUrl) {
            modalMediaContainer.innerHTML = `<video src="${videoUrl}" class="card-video" autoplay loop muted playsinline preload="metadata"></video>`;
            modalSetaEsq.style.display = 'none';
            modalSetaDir.style.display = 'none';
        } else {
            galeriaModal.imagens = imageUrls.length > 0 ? imageUrls : ['imagens/gringa_style_logo.png'];
            galeriaModal.indiceAtual = 0;
            mudarImagemModal(0);
            modalSetaEsq.style.display = galeriaModal.imagens.length > 1 ? 'block' : 'none';
            modalSetaDir.style.display = galeriaModal.imagens.length > 1 ? 'block' : 'none';
        }

        if (produto.variants && produto.variants.tipo && produto.variants.opcoes && produto.variants.opcoes.length > 0) {
            let variantesHTML = `
               <label for="modal-select-variante">${produto.variants.tipo}:</label>
               <select id="modal-select-variante" class="select-variante">
           `;
            produto.variants.opcoes.forEach(opcao => {
                variantesHTML += `<option value="${opcao}">${opcao}</option>`;
            });
            variantesHTML += `</select>`;
            modalVariantesContainer.innerHTML = variantesHTML;
            modalVariantesContainer.style.display = 'block';
        } else {
            modalVariantesContainer.innerHTML = '';
            modalVariantesContainer.style.display = 'none';
        }

        modalContainer.classList.add('visivel');
    }

    function mudarImagemModal(direcao) {
        if (galeriaModal.imagens.length === 0) {
            modalMediaContainer.innerHTML = `<img id="modal-img" src="imagens/gringa_style_logo.png" alt="Imagem do Produto">`;
            return;
        }
        galeriaModal.indiceAtual = (galeriaModal.indiceAtual + direcao + galeriaModal.imagens.length) % galeriaModal.imagens.length;

        const imagemOriginal = galeriaModal.imagens[galeriaModal.indiceAtual];
        const imagemOtimizada = `${imagemOriginal}?format=webp&width=600&quality=80`;
        modalMediaContainer.innerHTML = `<img id="modal-img" src="${imagemOtimizada}" alt="Imagem do Produto">`;
    }

    function fecharModal() {
        modalContainer.classList.remove('visivel');
    }

    function salvarCarrinho() {
        localStorage.setItem('carrinhoGringaStyle', JSON.stringify(carrinho));
    }

    function carregarCarrinho() {
        const carrinhoSalvo = localStorage.getItem('carrinhoGringaStyle');
        if (carrinhoSalvo) carrinho = JSON.parse(carrinhoSalvo);
    }

    function atualizarContadorCarrinho() {
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        carrinhoContador.textContent = totalItens;
        if (totalItens > 0) {
            carrinhoContador.classList.add('animar-pop');
            setTimeout(() => carrinhoContador.classList.remove('animar-pop'), 300);
        }
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
    }

    function abrirModalCompraDireta(produto, variante) {
        const precoFinal = getPrecoFinal(produto);
        const precoFormatado = `R$ ${precoFinal.toFixed(2).replace('.', ',')}`;

        const mediaUrls = produto.media_urls || produto.imagens || [];
        const videoUrl = produto.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));
        const imageUrl = mediaUrls.find(url => !url.includes('.mp4') && !url.includes('.webm')) || 'imagens/gringa_style_logo.png';

        let varianteHTML = '';
        if (variante) {
            varianteHTML = `<p style="font-size: 0.9rem; color: #ccc; margin-top: 5px;">${variante.tipo}: ${variante.opcao}</p>`;
        }

        let mediaHTML = '';
        const style = "width: 80px; height: 80px; object-fit: cover; border-radius: 5px; float: left; margin-right: 15px;";

        if (videoUrl) {
            mediaHTML = `<video src="${videoUrl}" style="${style}" autoplay loop muted playsinline></video>`;
        } else {
            mediaHTML = `<img src="${imageUrl}" alt="${produto.nome}" style="${style}">`;
        }

        resumoProdutoEl.innerHTML = `
           ${mediaHTML}
           <div style="overflow: hidden;">
               <h3>${produto.nome}</h3>
               ${varianteHTML}
               <p style="font-size: 1.2rem; font-weight: bold; color: var(--cor-destaque); margin-top: 5px;">${precoFormatado}</p>
           </div>
       `;
        modalConfirmarCompraBtn.dataset.produtoId = produto.id;
        modalConfirmarCompraBtn.dataset.variante = JSON.stringify(variante);
        modalCompraContainer.classList.add('visivel');
    }

    function fecharModalCompraDireta() {
        modalCompraContainer.classList.remove('visivel');
    }

    function gerarMensagemWhatsAppProdutoUnico() {
        const nomeClienteInput = document.getElementById('modal-nome-cliente');
        const nomeCliente = nomeClienteInput.value.trim();
        if (nomeCliente === "") {
            showToast("Por favor, preencha seu nome para continuar.", "erro");
            nomeClienteInput.focus();
            return;
        }

        const produtoId = parseInt(modalConfirmarCompraBtn.dataset.produtoId);
        const produto = todosOsProdutos.find(p => p.id === produtoId);
        const variante = JSON.parse(modalConfirmarCompraBtn.dataset.variante || 'null');

        const precoFinal = getPrecoFinal(produto);

        let varianteInfo = '';
        if (variante) {
            varianteInfo = ` (${variante.tipo}: ${variante.opcao})`;
        }

        let mensagem = `Olá, Gringa Style! 👋\n\nMeu nome é *${nomeCliente}* e eu gostaria de comprar este item:\n\n`;
        mensagem += `*Produto:* ${produto.nome}${varianteInfo}\n`;
        mensagem += `*Valor:* R$ ${precoFinal.toFixed(2).replace('.', ',')}\n\n`;

        if (precoFinal < produto.preco) {
            mensagem += `_(Valor promocional de R$ ${precoFinal.toFixed(2).replace('.', ',')})_\n\n`;
        }

        const formaPagamento = document.getElementById('modal-forma-pagamento').value;

        if (formaPagamento === 'Cartão de Crédito') {
            const parcelas = document.getElementById('modal-numero-parcelas').value;
            mensagem += `*Pagamento:* ${formaPagamento} em ${parcelas}\n\nAguardo o link para pagamento. (Sei que as taxas serão calculadas na próxima etapa)`;
        } else {
            mensagem += `*Pagamento:* ${formaPagamento}\n\nAguardo a chave PIX para o pagamento. Obrigado!`;
        }

        window.open(`https://wa.me/5515998608170?text=${encodeURIComponent(mensagem)}`, '_blank');
        fecharModalCompraDireta();
    }

    vitrineProdutos.addEventListener('click', (event) => {
        const quickViewButton = event.target.closest('.btn-quick-view');
        if (quickViewButton) {
            const produtoId = parseInt(quickViewButton.dataset.id);
            if (isNaN(produtoId)) return;
            const produto = todosOsProdutos.find(p => p.id === produtoId);
            if (!produto) return;

            if (produto.variants) {
                abrirModal(produtoId);
            } else {
                abrirModalCompraDireta(produto, null);
            }
        }
    });

    modalFecharBtn.addEventListener('click', fecharModal);
    modalContainer.addEventListener('click', (event) => { if (event.target === modalContainer) fecharModal(); });

    modalAdicionarCarrinhoBtn.addEventListener('click', () => {
        const produtoId = parseInt(modalAdicionarCarrinhoBtn.dataset.id);
        const produto = todosOsProdutos.find(p => p.id === produtoId);
        if (!produto) return;

        let varianteSelecionada = null;
        const selectVariante = document.getElementById('modal-select-variante');

        if (produto.variants && produto.variants.opcoes && produto.variants.opcoes.length > 0) {
            const label = document.querySelector('#modal-variantes-container label');
            if (label && selectVariante) {
                varianteSelecionada = {
                    tipo: label.textContent.replace(':', ''),
                    opcao: selectVariante.value
                };
            }
        }

        adicionarAoCarrinho(produtoId, varianteSelecionada);
        showToast('Produto adicionado ao carrinho!');
        fecharModal();
    });

    modalSetaEsq.addEventListener('click', () => mudarImagemModal(-1));
    modalSetaDir.addEventListener('click', () => mudarImagemModal(1));

    modalComprarWhatsappBtn.addEventListener('click', () => {
        const produtoId = parseInt(modalComprarWhatsappBtn.dataset.id);
        const produto = todosOsProdutos.find(p => p.id === produtoId);
        if (!produto) return;

        let varianteSelecionada = null;
        const selectVariante = document.getElementById('modal-select-variante');

        if (produto.variants && produto.variants.opcoes && produto.variants.opcoes.length > 0) {
            const label = document.querySelector('#modal-variantes-container label');
            if (label && selectVariante) {
                varianteSelecionada = {
                    tipo: label.textContent.replace(':', ''),
                    opcao: selectVariante.value
                };
            }
        }

        abrirModalCompraDireta(produto, varianteSelecionada);
        fecharModal();
    });

    modalCompraFecharBtn.addEventListener('click', fecharModalCompraDireta);
    modalCompraContainer.addEventListener('click', (e) => { if (e.target === modalCompraContainer) fecharModalCompraDireta(); });
    modalFormaPagamento.addEventListener('change', () => { modalOpcoesParcelamento.style.display = modalFormaPagamento.value === 'Cartão de Crédito' ? 'block' : 'none'; });
    modalConfirmarCompraBtn.addEventListener('click', gerarMensagemWhatsAppProdutoUnico);

    const atalhoAdmin = document.getElementById('ano-rodape');
    if (atalhoAdmin) {
        let clickCount = 0;
        let clickTimer = null;
        atalhoAdmin.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
            if (clickCount === 2) window.location.href = 'admin.html';
        });
    }

    searchInput.addEventListener('input', () => {
        const termoBusca = searchInput.value.toLowerCase().trim();
        if (termoBusca.length > 0) {
            searchClearBtn.style.display = 'block';
        } else {
            searchClearBtn.style.display = 'none';
        }
        aplicarFiltros();
    });

    document.getElementById('sort-select').addEventListener('change', aplicarFiltros);
    const categoriaSelect = document.getElementById('categoria-select');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', (e) => {
            window.filtrarPorCategoria(e.target.value);
        });
    }

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';

        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        searchInput.dispatchEvent(inputEvent);

        searchInput.focus();
    });

    carregarCarrinho();
    atualizarContadorCarrinho();
    carregarProdutos();
    carregarCategorias();
    carregarConfiguracoes();
    configurarLinkAcompanharRifa();
});