document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PADRÃO DE HEADER E FOOTER ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('menu-aberto');
    });

    const atalhoAdmin = document.getElementById('ano-rodape');
    if (atalhoAdmin) {
        let clickCount = 0;
        let clickTimer = null;
        atalhoAdmin.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
            if (clickCount === 2) {
                window.location.href = 'admin.html';
            }
        });
    }

    // --- FUNÇÕES DE CENSURA (REUTILIZADAS) ---
    function censurarNome(nome) {
        if (!nome) return '';
        const partes = nome.trim().split(' ').filter(p => p.length > 0);
        if (partes.length <= 1) {
            return nome;
        }
        const primeiroNome = partes[0];
        const sobrenomesCensurados = partes.slice(1).map(parte => {
            return parte.charAt(0) + '*'.repeat(parte.length - 1);
        }).join(' ');
        return `${primeiroNome} ${sobrenomesCensurados}`;
    }

    function censurarNumero(numero, totalDigitos) {
        if (numero === null || numero === undefined) return '';
        const numeroString = String(numero).padStart(totalDigitos, '0');
        const metadeVisivel = Math.ceil(numeroString.length / 2);
        return numeroString.substring(0, metadeVisivel) + '*'.repeat(numeroString.length - metadeVisivel);
    }

    // --- LÓGICA PRINCIPAL DA PÁGINA DE HISTÓRICO ---
    async function carregarHistorico() {
        const listaEl = document.getElementById('historico-lista');
        try {
            const [rifasRes, premiosRes] = await Promise.all([
                supabase
                    .from('rifas')
                    .select('*')
                    .eq('status', 'finalizada')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('premios')
                    .select('*')
                    .not('vencedor_nome', 'is', null) 
                    .order('ordem', { ascending: true })
            ]);

            if (rifasRes.error) throw rifasRes.error;
            if (premiosRes.error) throw premiosRes.error;

            const rifasFinalizadas = rifasRes.data;
            const todosPremiosSorteados = premiosRes.data;

            if (rifasFinalizadas.length === 0) {
                listaEl.innerHTML = '<p style="text-align: center;">Nenhuma rifa foi finalizada ainda.</p>';
                return;
            }

            listaEl.innerHTML = ''; 
            let rifasExibidas = 0;

            rifasFinalizadas.forEach(rifa => {
                const premiosDaRifa = todosPremiosSorteados.filter(p => p.rifa_id === rifa.id);

                if (premiosDaRifa.length > 0) {
                    rifasExibidas++;
                    const totalDigitos = String(rifa.total_numeros - 1).length;

                    // NOVO: Cria a lista de vencedores com imagem
                    const vencedoresHTML = premiosDaRifa.map(premio => {

                        // ==============================================
                        // === INÍCIO DA MODIFICAÇÃO DE OTIMIZAÇÃO ===
                        // ==============================================
                        const imgUrlOriginal = premio.imagem_url;
                        const imgUrlOtimizada = imgUrlOriginal
                            ? `${imgUrlOriginal}?format=webp&width=100&quality=75` // 100px (próximo de 80px)
                            : '';

                        // Adiciona a imagem se ela existir
                        const imagemHTML = imgUrlOriginal
                            ? `<img src="${imgUrlOtimizada}" alt="${premio.descricao}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px; float: left;">`
                            : '';
                        // ==============================================
                        // === FIM DA MODIFICAÇÃO DE OTIMIZAÇÃO ===
                        // ==============================================

                        return `
                        <div class="vencedor-info" style="margin-top: 10px; overflow: hidden; text-align: left;">
                            ${imagemHTML}
                            <div style="overflow: hidden;">
                                <strong style="color: #fff; font-size: 1.1em;">${premio.ordem}º Prêmio:</strong> ${premio.descricao} <br>
                                <strong>Vencedor(a):</strong> ${censurarNome(premio.vencedor_nome)} <br>
                                <strong>Número:</strong> ${censurarNumero(premio.vencedor_numero, totalDigitos)}
                            </div>
                        </div>
                        `;
                    }).join('');

                    const cardHTML = `
                        <div class="rifa-encerrada-card">
                            <h3>${rifa.nome_premio}</h3>
                            <p>Sorteio realizado. Total de ${rifa.total_numeros} números concorreram.</p>
                            ${vencedoresHTML} 
                        </div>
                    `;
                    listaEl.insertAdjacentHTML('beforeend', cardHTML);
                }
            });

            if (rifasExibidas === 0) {
                 listaEl.innerHTML = '<p style="text-align: center;">Nenhuma rifa finalizada teve seus prêmios sorteados ainda.</p>';
            }

        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            listaEl.innerHTML = '<p style="text-align: center; color: red;">Não foi possível carregar o histórico.</p>';
        }
    }

    carregarHistorico();
});

