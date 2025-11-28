document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO HEADER (MENU E CARRINHO) ---
    function inicializarHeader() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const navMenu = document.getElementById('nav-menu');
        hamburgerBtn.addEventListener('click', () => {
            navMenu.classList.toggle('menu-aberto');
        });

        const carrinhoContador = document.querySelector('.carrinho-contador');
        carrinhoContador.textContent = 0; 
    }

    // --- LÓGICA DO LINK GLOBAL "ACOMPANHAR RIFA" ---
    async function configurarLinkAcompanharRifa() {
        const link = document.getElementById('header-link-acompanhar');
        if (!link) return;
        try {
            const { data, error } = await supabase
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

    // --- LÓGICA PRINCIPAL DA PÁGINA DE PAGAMENTO ---
    async function carregarDadosPagamento() {
        const loadingEl = document.getElementById('loading-pagamento');
        const conteudoEl = document.getElementById('conteudo-pagamento');
        const params = new URLSearchParams(window.location.search);
        const participanteId = params.get('participante_id');

        if (!participanteId) {
            loadingEl.innerHTML = '<p style="text-align: center; color: red;">Erro: ID da reserva não encontrado. Por favor, tente novamente.</p>';
            return;
        }

        try {
            const { data: participante, error: participanteError } = await supabase
                .from('participantes')
                .select('*')
                .eq('id', participanteId)
                .single();

            if (participanteError) throw participanteError;

            const { data: rifa, error: rifaError } = await supabase
                .from('rifas')
                .select('id, nome_premio, preco_numero, total_numeros')
                .eq('id', participante.rifa_id)
                .single();

            if (rifaError) throw rifaError;

            renderizarPagina(participante, rifa);

        } catch (error) {
            console.error('Erro ao carregar dados do pagamento:', error);
            loadingEl.innerHTML = `<p style="text-align: center; color: red;">Não foi possível carregar os dados da sua reserva. Erro: ${error.message}</p>`;
        }
    }

    function renderizarPagina(participante, rifa) {
        const loadingEl = document.getElementById('loading-pagamento');
        const conteudoEl = document.getElementById('conteudo-pagamento');

        const totalPagar = participante.numeros_escolhidos.length * rifa.preco_numero;
        const totalFormatado = `R$ ${totalPagar.toFixed(2).replace('.', ',')}`;
        const totalDigitos = String(rifa.total_numeros - 1).length;
        const numerosFormatados = participante.numeros_escolhidos
            .map(n => String(n).padStart(totalDigitos, '0'))
            .join(', ');

        document.getElementById('cliente-nome').textContent = participante.nome_cliente;
        document.getElementById('numeros-reservados').textContent = numerosFormatados;
        document.getElementById('total-pagar').textContent = totalFormatado;
        document.getElementById('pedido-id').textContent = `ID do Pedido: ${participante.id}`;

        const numeroWhatsapp = "5515998608170";
        const mensagemWhatsapp = `Olá! Estou enviando o comprovante do PIX referente à rifa "${rifa.nome_premio}".\n\n*ID do Pedido: ${participante.id}*`;
        const linkWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagemWhatsapp)}`;
        document.getElementById('btn-whatsapp').href = linkWhatsapp;

        document.getElementById('link-acompanhar').href = `acompanhar_rifa.html?id=${rifa.id}`;

        loadingEl.style.display = 'none';
        conteudoEl.style.display = 'block';
    }

    // --- ATALHO SECRETO DO ADMIN ---
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

    // --- INICIALIZAÇÃO ---
    inicializarHeader();
    configurarLinkAcompanharRifa();
    carregarDadosPagamento();
});