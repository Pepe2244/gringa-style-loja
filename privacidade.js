document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO HEADER (MENU E CARRINHO) ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    const carrinhoContador = document.querySelector('.carrinho-contador');

    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('menu-aberto');
    });

    // Atualiza o contador (na página de privacidade, o carrinho não é carregado,
    // mas o contador é exibido no header)
    try {
        const carrinhoSalvo = localStorage.getItem('carrinhoGringaStyle');
        if (carrinhoSalvo) {
            const carrinho = JSON.parse(carrinhoSalvo);
            // Reduz para obter a soma total de itens (quantidades) no carrinho
            const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
            carrinhoContador.textContent = totalItens;
        } else {
            carrinhoContador.textContent = 0;
        }
    } catch (e) {
        // Caso o localStorage esteja corrompido ou inacessível
        carrinhoContador.textContent = 0;
    }


    // --- LÓGICA DO LINK GLOBAL "ACOMPANHAR RIFA" ---
    // (Avisamos no HTML que o script do Supabase precisa estar presente)
    async function configurarLinkAcompanharRifa() {
        // Verifica se o elemento e o objeto Supabase (que é global) existem
        const link = document.getElementById('header-link-acompanhar');
        if (!link || typeof supabase === 'undefined') return;

        try {
            // Busca apenas o ID da rifa ativa para configurar o link
            const { data, error } = await supabase
                .from('rifas')
                .select('id')
                .eq('status', 'ativa')
                .limit(1)
                .maybeSingle(); // CORREÇÃO: Alterado de .single() para .maybeSingle()

            if (data && !error) {
                link.href = `acompanhar_rifa.html?id=${data.id}`;
                link.style.display = 'block'; // Mostra o link se houver rifa ativa
            } else {
                link.style.display = 'none'; // Esconde se não houver
            }
        } catch (error) {
            console.error("Erro ao buscar rifa ativa para o header:", error);
            link.style.display = 'none';
        }
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
    configurarLinkAcompanharRifa();
});