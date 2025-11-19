document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO HEADER (MENU E CARRINHO) ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('menu-aberto');
    });
    const carrinhoContador = document.querySelector('.carrinho-contador');
    carrinhoContador.textContent = 0;

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

    // --- FUNÇÕES DE CENSURA (Sem alteração) ---
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

    // --- LÓGICA PRINCIPAL DA PÁGINA DE ACOMPANHAMENTO ---
    async function carregarDadosAcompanhamento() {
        const loadingEl = document.getElementById('loading-acompanhar');
        const conteudoEl = document.getElementById('conteudo-acompanhar');
        const params = new URLSearchParams(window.location.search);
        const rifaId = params.get('id');

        if (!rifaId) {
            loadingEl.innerHTML = '<p style="text-align: center; color: red;">ID da rifa não encontrado.</p>';
            return;
        }

        try {
            const [rifaRes, participantesRes, premiosRes] = await Promise.all([
                supabase.from('rifas').select('*').eq('id', rifaId).single(),
                supabase.from('participantes').select('*').eq('rifa_id', rifaId).eq('status_pagamento', 'pago').order('nome_cliente'),
                supabase.from('premios').select('*').eq('rifa_id', rifaId).order('ordem', { ascending: true })
            ]);

            if (rifaRes.error) throw rifaRes.error;
            if (participantesRes.error) throw participantesRes.error;
            if (premiosRes.error) throw premiosRes.error;

            const rifa = rifaRes.data;
            const participantes = participantesRes.data;
            const premios = premiosRes.data; 

            const totalDigitos = String(rifa.total_numeros - 1).length;

            // NOVO: Lógica atualizada para exibir imagem do prêmio
            const vencedoresListaEl = document.getElementById('vencedores-lista');
            vencedoresListaEl.innerHTML = ''; 
            let algumVencedorSorteado = false;

            premios.forEach(premio => {
                if (premio.vencedor_nome && premio.vencedor_numero !== null) {
                    algumVencedorSorteado = true;

                    // ==============================================
                    // === INÍCIO DA MODIFICAÇÃO DE OTIMIZAÇÃO ===
                    // ==============================================
                    const imgUrlOriginal = premio.imagem_url;
                    const imgUrlOtimizada = imgUrlOriginal
                        ? `${imgUrlOriginal}?format=webp&width=100&quality=75`
                        : '';

                    // Adiciona a imagem se ela existir
                    const imagemHTML = imgUrlOriginal 
                        ? `<img src="${imgUrlOtimizada}" alt="${premio.descricao}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; margin-right: 15px; float: left;">`
                        : '';
                    // ==============================================
                    // === FIM DA MODIFICAÇÃO DE OTIMIZAÇÃO ===
                    // ==============================================

                    const itemVencedorHTML = `
                        <div class="vencedor-item" style="overflow: hidden;"> ${imagemHTML}
                            <div style="overflow: hidden;"> <strong>${premio.ordem}º Prêmio:</strong> (${premio.descricao})
                                <p>Vencedor(a): ${censurarNome(premio.vencedor_nome)}</p>
                                <p>Número: ${censurarNumero(premio.vencedor_numero, totalDigitos)}</p>
                            </div>
                        </div>
                    `;
                    vencedoresListaEl.insertAdjacentHTML('beforeend', itemVencedorHTML);
                }
            });

            if (algumVencedorSorteado) {
                document.getElementById('vencedor-container').style.display = 'block';
            }
            // FIM DA NOVIDADE

            document.getElementById('rifa-nome-premio').textContent = `Acompanhando Rifa: ${rifa.nome_premio}`;
            const vendidos = rifa.numeros_vendidos.length;
            const total = rifa.total_numeros;
            const porcentagem = total > 0 ? (vendidos / total) * 100 : 0;
            document.getElementById('numeros-vendidos').textContent = vendidos;
            document.getElementById('total-numeros').textContent = total;
            document.getElementById('rifa-progresso-barra').style.width = `${porcentagem}%`;
            document.getElementById('rifa-progresso-barra').textContent = `${porcentagem.toFixed(0)}%`;

            const listaParticipantesEl = document.getElementById('lista-participantes');
            if (participantes.length === 0) {
                listaParticipantesEl.innerHTML = '<p>Ainda não há participantes com pagamento confirmado.</p>';
            } else {
                listaParticipantesEl.innerHTML = ''; 
                participantes.forEach(p => {
                    const numerosFormatados = p.numeros_escolhidos.map(n => String(n).padStart(totalDigitos, '0')).join(', ');
                    const numerosParaBusca = `,${p.numeros_escolhidos.join(',')},`;
                    const nomeCensurado = censurarNome(p.nome_cliente);

                    const itemHTML = `
                        <li class="participante-item" data-numeros="${numerosParaBusca}">
                            <span class="participante-nome">${nomeCensurado}</span>
                            <span class="participante-numeros">Números: ${numerosFormatados}</span>
                        </li>
                    `;
                    listaParticipantesEl.insertAdjacentHTML('beforeend', itemHTML);
                });
            }

            loadingEl.style.display = 'none';
            conteudoEl.style.display = 'block';

            document.getElementById('filtro-numero').addEventListener('input', (e) => {
                const termoBusca = e.target.value;
                document.querySelectorAll('.participante-item').forEach(item => {
                    if (termoBusca === '') {
                        item.style.display = 'flex';
                        return;
                    }
                    const numerosItem = item.dataset.numeros;
                    if (numerosItem.includes(`,${termoBusca},`)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

        } catch (error) {
            console.error('Erro ao carregar dados da rifa:', error);
            loadingEl.innerHTML = `<p style="text-align: center; color: red;">Erro ao carregar dados: ${error.message}</p>`;
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
    carregarDadosAcompanhamento();
});