/**
 * Exibe uma notificação toast.
 * @param {string} message A mensagem para exibir.
 * @param {'sucesso' | 'erro'} type O tipo de toast.
 */
function showToast(message, type = 'sucesso') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification';

    // Adiciona a classe de erro se o tipo for 'erro'
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

function getPrecoFinal(produto) {
    if (!produto.preco_promocional || produto.preco_promocional >= (produto.preco || 0)) {
        return produto.preco || 0;
    }
    return produto.preco_promocional;
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

let cupomAplicado = null; 
const cupomInput = document.getElementById('cupom-input');
const btnAplicarCupom = document.getElementById('btn-aplicar-cupom');
const cupomMensagemEl = document.getElementById('cupom-mensagem');
const cupomDescontoLinha = document.getElementById('cupom-desconto-linha');
const cupomDescontoValorEl = document.getElementById('cupom-desconto-valor');

const listaItensCarrinho = document.getElementById('lista-itens-carrinho');
const subtotalEl = document.getElementById('subtotal-valor');
const totalEl = document.getElementById('total-valor');
const carrinhoVazioContainer = document.getElementById('carrinho-vazio-container');
const finalizarPedidoBtn = document.getElementById('finalizar-pedido-btn');
const carrinhoContador = document.querySelector('.carrinho-contador');
const formaPagamentoSelect = document.getElementById('forma-pagamento');
const opcoesParcelamentoDiv = document.getElementById('opcoes-parcelamento');
const numeroParcelasSelect = document.getElementById('numero-parcelas');
const nomeClienteInput = document.getElementById('nome-cliente');
const carrinhoContainerEl = document.querySelector('.resumo-carrinho');
const carrinhoVazioEl = document.getElementById('carrinho-vazio-container');

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

async function carregarPaginaCarrinho() {
    carregarCarrinho();
    if (!window.supabase) {
        console.error("Supabase não carregado.");
        if (listaItensCarrinho) listaItensCarrinho.innerHTML = "<p>Erro ao conectar com o banco de dados.</p>";
        return;
    }

    try {
        const { data, error } = await window.supabase
            .from('produtos')
            .select('*');

        if (error) throw error;

        todosOsProdutos = data;
        renderizarItensCarrinho();

    } catch (error) {
        console.error("Erro ao carregar dados para o carrinho:", error);
        if (listaItensCarrinho) listaItensCarrinho.innerHTML = "<p>Não foi possível carregar as informações dos produtos. Tente novamente.</p>";
    }
}

function renderizarItensCarrinho() {
    if (!listaItensCarrinho) return;

    listaItensCarrinho.innerHTML = '';
    limparCupom(false); 

    const carrinhoValido = carrinho.filter(item =>
        item && item.produto_id && todosOsProdutos.some(p => p.id === item.produto_id)
    );

    if (carrinhoValido.length !== carrinho.length) {
        carrinho = carrinhoValido;
        salvarCarrinho();
    }

    if (carrinho.length === 0) {
        if(carrinhoVazioContainer) carrinhoVazioContainer.style.display = 'block'; 
        if(carrinhoContainerEl) carrinhoContainerEl.style.display = 'none'; 
    } else {
        if(carrinhoVazioContainer) carrinhoVazioContainer.style.display = 'none'; 
        if(carrinhoContainerEl) carrinhoContainerEl.style.display = 'block'; 
        if(finalizarPedidoBtn) finalizarPedidoBtn.disabled = false;

        carrinho.forEach((item, index) => {
            const produto = todosOsProdutos.find(p => p.id === item.produto_id);
            if (!produto) return;

            const precoFinalItem = getPrecoFinal(produto);

            const mediaUrls = produto.media_urls || produto.imagens || [];
            const videoUrl = produto.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));
            const imageUrl = mediaUrls.find(url => !url.includes('.mp4') && !url.includes('.webm')) || 'imagens/placeholder.png';

            let mediaHTML;
            if (videoUrl) {
                mediaHTML = `<video class="item-carrinho-video item-carrinho-img" src="${videoUrl}" autoplay loop muted playsinline></video>`;
            } else {
                const imgUrlOtimizada = `${imageUrl}?format=webp&width=100&quality=70`;
                mediaHTML = `<img src="${imgUrlOtimizada}" alt="${produto.nome}" class="item-carrinho-img">`;
            }

            let varianteHTML = '';
            if (item.variante) {
                varianteHTML = `<p class="variante-carrinho" style="font-size: 0.9em; color: #ccc;">${item.variante.tipo}: ${item.variante.opcao}</p>`;
            }

            const precoFormatado = `R$ ${precoFinalItem.toFixed(2).replace('.', ',')}`;

            const itemHTML = `
            <div class="item-carrinho" data-cart-index="${index}">
               <a href="produto.html?id=${item.produto_id}">
                   ${mediaHTML}
               </a>
               <div class="item-carrinho-detalhes" style="flex: 1; min-width: 150px;">
                   <a href="produto.html?id=${item.produto_id}" style="text-decoration: none;">
                       <h3>${produto.nome}</h3>
                   </a>
                   ${varianteHTML}
                   <p>${precoFormatado}</p>
                   <div class="item-carrinho-acoes" style="display: flex; gap: 10px; margin-top: 10px;">
                       <input type="number" class="input-quantidade" value="${item.quantidade}" min="1" data-cart-index="${index}" style="width: 60px;">
                       <button class="btn-remover" data-cart-index="${index}" style="background: none; border: none; color: #dc3545; font-size: 1.2rem; cursor: pointer;"><i class="fas fa-trash"></i></button>
                   </div>
               </div>
            </div>
            `;
            listaItensCarrinho.insertAdjacentHTML('beforeend', itemHTML);
        });
    }
    calcularTotal();
    atualizarContadorCarrinho();
}


function mostrarMensagemCupom(mensagem, tipo = 'erro') {
    if (!cupomMensagemEl) return;
    cupomMensagemEl.textContent = mensagem;
    if (tipo === 'erro') {
        cupomMensagemEl.className = 'cupom-mensagem erro';
    } else {
        cupomMensagemEl.className = 'cupom-mensagem sucesso';
    }
}

function limparCupom(recalcular = true) {
    cupomAplicado = null;
    if(cupomInput) cupomInput.value = '';
    if(cupomInput) cupomInput.disabled = false;
    if(btnAplicarCupom) btnAplicarCupom.textContent = 'Aplicar';
    if(btnAplicarCupom) btnAplicarCupom.disabled = false;

    if(cupomMensagemEl) cupomMensagemEl.textContent = '';
    if(cupomDescontoLinha) cupomDescontoLinha.style.display = 'none';

    if (recalcular) {
        calcularTotal();
    }
}

async function handleAplicarCupom() {
    if (!cupomInput || !btnAplicarCupom || !window.supabase) return;

    const codigo = cupomInput.value.trim().toUpperCase();
    if (codigo === '') {
        mostrarMensagemCupom('Digite um código de cupom.');
        return;
    }

    btnAplicarCupom.disabled = true;
    btnAplicarCupom.textContent = 'Validando...';
    mostrarMensagemCupom('', 'sucesso'); 

    const itensParaValidar = carrinho.map(item => {
        const produto = todosOsProdutos.find(p => p.id === item.produto_id);
        return {
            produto_id: produto.id, 
            quantidade: item.quantidade,
            preco_unitario: getPrecoFinal(produto)
        };
    });

    try {
        const { data, error } = await window.supabase.functions.invoke('validar-cupom', {
            body: {
                codigo_cupom: codigo,
                itens_carrinho: itensParaValidar
            }
        });

        if (error) {
            throw new Error(`Erro do servidor: ${error.message}`);
        }

        if (data.valido) {
            cupomAplicado = data.cupom; 
            mostrarMensagemCupom(data.mensagem, 'sucesso');
            cupomInput.disabled = true; 
            btnAplicarCupom.textContent = 'Remover'; 
            btnAplicarCupom.disabled = false;
            btnAplicarCupom.onclick = () => {
                limparCupom();
                btnAplicarCupom.onclick = handleAplicarCupom; 
            };

            const totalLinhaEl = totalEl.parentElement;
            if (cupomDescontoLinha) cupomDescontoLinha.classList.add('highlight-success');
            if (totalLinhaEl) totalLinhaEl.classList.add('highlight-success');

            setTimeout(() => {
                if (cupomDescontoLinha) cupomDescontoLinha.classList.remove('highlight-success');
                if (totalLinhaEl) totalLinhaEl.classList.remove('highlight-success');
            }, 1500); 

        } else {
            cupomAplicado = null;
            mostrarMensagemCupom(data.mensagem, 'erro');
            btnAplicarCupom.disabled = false;
            btnAplicarCupom.textContent = 'Aplicar';
        }

    } catch (err) {
        console.error('Erro ao chamar a Edge Function:', err);
        cupomAplicado = null;
        mostrarMensagemCupom('Não foi possível validar o cupom. Tente novamente.', 'erro');
        btnAplicarCupom.disabled = false;
        btnAplicarCupom.textContent = 'Aplicar';
    }

    calcularTotal();
}

function calcularTotal() {
    const subtotal = carrinho.reduce((total, item) => {
        const produto = todosOsProdutos.find(p => p.id === item.produto_id);
        return produto ? total + (getPrecoFinal(produto) * item.quantidade) : total;
    }, 0);

    let desconto = 0;

    if (cupomAplicado) {
        desconto = cupomAplicado.desconto_calculado;

        if (desconto > subtotal) {
            desconto = subtotal;
        }

        if(cupomDescontoValorEl) cupomDescontoValorEl.textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
        if(cupomDescontoLinha) cupomDescontoLinha.style.display = 'flex';

    } else {
        if(cupomDescontoLinha) cupomDescontoLinha.style.display = 'none';
    }

    const totalFinal = subtotal - desconto;
    if(subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if(totalEl) totalEl.textContent = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
}

function atualizarQuantidade(cartIndex, novaQuantidade) {
   const itemNoCarrinho = carrinho[cartIndex];
   if (!itemNoCarrinho) return;

   if (novaQuantidade <= 0) {
       carrinho.splice(cartIndex, 1);
       renderizarItensCarrinho(); 
   } else {
       itemNoCarrinho.quantidade = novaQuantidade;
       salvarCarrinho();

       if (cupomAplicado) {
           limparCupom(false);
           if(cupomMensagemEl) {
               cupomMensagemEl.textContent = 'Cupom removido. Por favor, aplique novamente.';
               cupomMensagemEl.className = 'cupom-mensagem erro';
           }
       }

       calcularTotal();
       atualizarContadorCarrinho();
   }

   if (carrinho.length === 0) {
       if(carrinhoVazioEl) carrinhoVazioEl.style.display = 'block';
       if(carrinhoContainerEl) carrinhoContainerEl.style.display = 'none';
   }
}


function gerarMensagemWhatsApp() {
    if (!nomeClienteInput) return;

    const nomeCliente = nomeClienteInput.value.trim();
    if (nomeCliente === "") {
        // CORREÇÃO: Trocando alert por showToast
        showToast("Por favor, preencha seu nome para continuar.", "erro");
        nomeClienteInput.focus();
        return;
    }

    const numeroWhatsapp = "5515998608170";
    let mensagem = `Olá Gringa Style!\n\Meu nome é *${nomeCliente}* e gostaria de confirmar meu pedido:\n\n`;

    let subtotalPedido = 0;

    carrinho.forEach(item => {
        const produto = todosOsProdutos.find(p => p.id === item.produto_id);
        if (produto) {
            const precoFinalItem = getPrecoFinal(produto);
            subtotalPedido += item.quantidade * precoFinalItem;
            const varianteInfo = item.variante ? ` (${item.variante.tipo}: ${item.variante.opcao})` : '';

            mensagem += `*Produto:* ${produto.nome}${varianteInfo}\n`;
            mensagem += `*Quantidade:* ${item.quantidade}\n`;
            mensagem += `*Valor:* R$ ${(precoFinalItem * item.quantidade).toFixed(2).replace('.', ',')}\n\n`;
        }
    });

    mensagem += `*Subtotal:* R$ ${subtotalPedido.toFixed(2).replace('.', ',')}\n`;

    let descontoTotal = 0;
    if (cupomAplicado) {
        descontoTotal = cupomAplicado.desconto_calculado;
        mensagem += `*Desconto (${cupomAplicado.codigo}):* - R$ ${descontoTotal.toFixed(2).replace('.', ',')}\n`;
    }

    const totalFinal = subtotalPedido - descontoTotal;
    const formaPagamento = formaPagamentoSelect.value;

    if (formaPagamento === 'Cartão de Crédito') {
        const parcelas = numeroParcelasSelect.value;
        mensagem += `*Total (Cartão):* R$ ${totalFinal.toFixed(2).replace('.', ',')}\n`;
        mensagem += `*Pagamento:* ${formaPagamento} em ${parcelas}\n\n`;
        mensagem += `_Aguardo o link para pagamento. (Sei que as taxas serão calculadas na próxima etapa)_`;
    } else {
        mensagem += `*Total (PIX):* R$ ${totalFinal.toFixed(2).replace('.', ',')}\n\n`;
        mensagem += `_Aguardo a chave PIX para o pagamento. Obrigado!_`;
    }

    const linkWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(linkWhatsapp, '_blank');
}

if(listaItensCarrinho) {
    listaItensCarrinho.addEventListener('click', (e) => {
       const cartIndex = e.target.closest('[data-cart-index]')?.dataset.cartIndex;
       if (cartIndex === undefined) return;

       if (e.target.classList.contains('btn-remover') || e.target.closest('.btn-remover')) {
           atualizarQuantidade(parseInt(cartIndex), 0);
       }
    });

    listaItensCarrinho.addEventListener('change', (e) => {
       if (e.target.classList.contains('input-quantidade')) {
           const cartIndex = e.target.dataset.cartIndex;
           if (cartIndex === undefined) return;

           const novaQuantidade = parseInt(e.target.value);
           if (!isNaN(novaQuantidade) && novaQuantidade > 0) {
               atualizarQuantidade(parseInt(cartIndex), novaQuantidade);
           } else if (!isNaN(novaQuantidade) && novaQuantidade <= 0) {
               e.target.value = 1; 
               atualizarQuantidade(parseInt(cartIndex), 1);
           }
       }
    });
}


if(formaPagamentoSelect) {
    formaPagamentoSelect.addEventListener('change', () => {
        if(opcoesParcelamentoDiv) opcoesParcelamentoDiv.style.display = formaPagamentoSelect.value === 'Cartão de Crédito' ? 'block' : 'none';
    });
}

if(finalizarPedidoBtn) {
    finalizarPedidoBtn.addEventListener('click', gerarMensagemWhatsApp);
}

if(btnAplicarCupom) {
    btnAplicarCupom.addEventListener('click', handleAplicarCupom);
}

document.addEventListener('DOMContentLoaded', () => {
    configurarLinkAcompanharRifa();
    carregarPaginaCarrinho();

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