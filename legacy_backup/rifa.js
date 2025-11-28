document.addEventListener('DOMContentLoaded', async () => {
    const rifaContainer = document.getElementById('rifa-container');
    let numerosSelecionados = [];
    let rifaAtiva = null;

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

    // --- LÓGICA DO HEADER (MENU E CARRINHO) ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            navMenu.classList.toggle('menu-aberto');
        });
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
                .maybeSingle(); 

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

    // NOVO: Atualizado para buscar rifa e prêmios
    async function carregarRifaAtiva() {
        if (!rifaContainer) return; // Se não estiver na página da rifa, não faz nada
        if (!window.supabase) {
            rifaContainer.innerHTML = `<p style="text-align: center; color: red;">Erro: Supabase não carregado.</p>`;
            return;
        }

        try {
            // 1. Busca a rifa ativa
            // CORREÇÃO AQUI: Alterado de .single() para .maybeSingle() para evitar o erro 406
            const { data: rifa, error: rifaError } = await window.supabase
                .from('rifas')
                .select('*')
                .eq('status', 'ativa')
                .limit(1)
                .maybeSingle(); 

            if (rifaError) {
                throw rifaError;
            }

            if (!rifa) {
                // Se não houver rifa, lançamos um erro "controlado" para cair no catch e mostrar a UI de "sem rifa"
                throw new Error("Nenhuma rifa ativa encontrada.");
            }

            rifaAtiva = rifa;

            // 2. Busca os prêmios associados a essa rifa
            const { data: premios, error: premiosError } = await window.supabase
                .from('premios')
                .select('*')
                .eq('rifa_id', rifa.id)
                .order('ordem', { ascending: true });

            if (premiosError) {
                throw new Error("Erro ao buscar os prêmios da rifa.");
            }

            // 3. Renderiza a rifa com os prêmios
            renderizarRifa(rifaAtiva, premios);

        } catch (error) {
            // Se o erro for "Nenhuma rifa ativa", mostramos a mensagem amigável
            // Se for outro erro técnico, mostramos no console
            if (error.message !== "Nenhuma rifa ativa encontrada.") {
                console.error('Erro técnico ao buscar rifa:', error);
            }
            
            rifaContainer.innerHTML = `
                <div class="rifa-card" style="text-align: center;">
                    <h1 class="titulo-secao">Nenhuma Rifa Ativa no Momento</h1>
                    <p style="font-size: 1.1em;">Fique de olho! Em breve teremos novidades e mais prêmios incríveis por aqui.</p>
                    <br>
                    <a href="historico.html" class="btn btn-secundario">Ver Ganhadores Anteriores</a>
                </div>`;
        }
    }

    // NOVO: Função agora recebe 'rifa' e 'premios'
    function renderizarRifa(rifa, premios) {
        if (!rifaContainer) return;

        const totalDigitos = String(rifa.total_numeros - 1).length;
        let numerosHTML = '';
        const numerosVendidosSet = new Set(rifa.numeros_vendidos || []);
        const numerosReservadosSet = new Set(rifa.numeros_reservados || []);

        for (let i = 0; i < rifa.total_numeros; i++) {
            const numeroFormatado = String(i).padStart(totalDigitos, '0');
            const isOcupado = numerosVendidosSet.has(i) || numerosReservadosSet.has(i);
            numerosHTML += `<div class="numero-rifa ${isOcupado ? 'ocupado' : ''}" data-numero="${i}">${numeroFormatado}</div>`;
        }

        const isEsgotado = (numerosVendidosSet.size) >= rifa.total_numeros;

        // NOVO: Cria a lista de prêmios em HTML
        let premiosHTML = '';
        if (premios.length > 0) {
            premiosHTML = `
                <div class="lista-premios-rifa">
                    <h4>Prêmios desta Rifa:</h4>
                    <ul style="list-style: none; padding-left: 0; text-align: left; max-width: 400px; margin: 10px auto; background-color: #111; padding: 15px; border-radius: 5px;">
                        ${premios.map(p => `
                            <li style="margin-bottom: 8px;">
                                <strong style="color: var(--cor-destaque);">${p.ordem}º Prêmio:</strong> ${p.descricao}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        // FIM DA NOVIDADE

        // ==============================================
        // === INÍCIO DA MODIFICAÇÃO DE OTIMIZAÇÃO ===
        // ==============================================
        // Otimiza a imagem de capa da rifa
        const placeholderImg = 'imagens/placeholder.png';
        const imgUrlOriginal = rifa.imagem_premio_url;
        const imgUrlOtimizada = imgUrlOriginal
            ? `${imgUrlOriginal}?format=webp&width=600&quality=80`
            : placeholderImg;
        // ==============================================
        // === FIM DA MODIFICAÇÃO DE OTIMIZAÇÃO ===
        // ==============================================

        const rifaHTML = `
            <div class="rifa-card">
                <h1 class="titulo-secao">${rifa.nome_premio}</h1>

                <img src="${imgUrlOtimizada}" alt="Prêmio da Rifa" class="rifa-imagem-premio">

                ${premiosHTML}

                <p class="rifa-descricao">${rifa.descricao}</p>
                <p class="rifa-preco">Apenas R$ ${rifa.preco_numero.toFixed(2).replace('.', ',')} por número!</p>
                <a href="acompanhar_rifa.html?id=${rifa.id}" class="btn btn-secundario" style="margin-bottom: 20px;">Ver Participantes</a>

                ${isEsgotado ? '<div class="aviso-esgotado">RIFA ESGOTADA! Obrigado a todos que participaram. O sorteio será realizado em breve!</div>' : '<h3>Escolha seus números da sorte:</h3>'}

                <div class="numeros-grid ${isEsgotado ? 'desabilitado' : ''}">${numerosHTML}</div>

                ${!isEsgotado ? `
                    <div class="resumo-selecao" style="display: none;">
                        <h4>Resumo da sua Seleção</h4>
                        <p>Números selecionados: <strong id="numeros-selecionados-lista">Nenhum</strong></p>
                        <p>Total a pagar: <strong id="total-a-pagar">R$ 0,00</strong></p>
                        <div class="form-cliente">
                            <input type="text" id="nome-cliente" class="input-cliente" placeholder="Seu nome completo" required>
                            <input type="tel" id="telefone-cliente" class="input-cliente" placeholder="Seu WhatsApp (DDD + Número)" required>
                            <button id="btn-reservar" class="btn btn-finalizar">Reservar e Pagar</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        rifaContainer.innerHTML = rifaHTML;

        if (!isEsgotado) {
            adicionarEventListenersGrid();
        }
    }

    function adicionarEventListenersGrid() {
        const grid = document.querySelector('.numeros-grid');
        const btnReservar = document.getElementById('btn-reservar');

        if (grid) {
            grid.addEventListener('click', (e) => {
                if (e.target.classList.contains('numero-rifa') && !e.target.classList.contains('ocupado')) {
                    const numero = parseInt(e.target.dataset.numero, 10);
                    e.target.classList.toggle('selecionado');

                    if (numerosSelecionados.includes(numero)) {
                        numerosSelecionados = numerosSelecionados.filter(n => n !== numero);
                    } else {
                        numerosSelecionados.push(numero);
                    }
                    atualizarResumo();
                }
            });
        }

        if(btnReservar) {
            btnReservar.addEventListener('click', reservarNumeros);
        }
    }

    function atualizarResumo() {
        const resumoEl = document.querySelector('.resumo-selecao');
        if (!resumoEl) return;

        if (numerosSelecionados.length > 0) {
            numerosSelecionados.sort((a, b) => a - b);
            const totalDigitos = String(rifaAtiva.total_numeros - 1).length;

            document.getElementById('numeros-selecionados-lista').textContent = numerosSelecionados.map(n => String(n).padStart(totalDigitos, '0')).join(', ');
            const totalPagar = numerosSelecionados.length * rifaAtiva.preco_numero;
            document.getElementById('total-a-pagar').textContent = `R$ ${totalPagar.toFixed(2).replace('.', ',')}`;
            resumoEl.style.display = 'block';
        } else {
            resumoEl.style.display = 'none';
        }
    }

    async function reservarNumeros() {
        const nomeEl = document.getElementById('nome-cliente');
        const telefoneEl = document.getElementById('telefone-cliente');
        const nome = nomeEl.value.trim();
        const telefone = telefoneEl.value.trim();

        if (!nome || !telefone || numerosSelecionados.length === 0) {
            // CORREÇÃO: Trocado alert por showToast
            showToast('Por favor, preencha seu nome, telefone e selecione pelo menos um número.', 'erro');
            return;
        }

        const btn = document.getElementById('btn-reservar');
        btn.disabled = true;
        btn.textContent = 'Reservando...';

        try {
            const { data, error } = await window.supabase.rpc('reservar_numeros_rifa', {
                id_rifa_param: rifaAtiva.id,
                numeros_escolhidos_param: numerosSelecionados,
                nome_cliente_param: nome,
                telefone_param: telefone
            });

            if (error) {
                throw error;
            }

            const novoParticipanteId = data[0].participante_id;
            window.location.href = `pagamento.html?participante_id=${novoParticipanteId}`;

        } catch (error) {
            console.error('Erro detalhado na reserva:', error); 
            if (error.message && error.message.includes('já foi reservado')) {
                // CORREÇÃO: Trocado alert por showToast
                showToast('Um dos números escolhidos já foi reservado. Atualize e tente de novo.', 'erro');
            } else {
                // CORREÇÃO: Trocado alert por showToast
                showToast('Ocorreu um erro ao tentar reservar seus números. Tente novamente.', 'erro');
            }

            btn.disabled = false;
            btn.textContent = 'Reservar e Pagar';
            setTimeout(() => {
                location.reload();
            }, 1500);
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

    // --- CHAMADAS INICIAIS ---
    configurarLinkAcompanharRifa();
    carregarRifaAtiva();
});