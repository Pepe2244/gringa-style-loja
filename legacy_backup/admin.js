document.addEventListener('DOMContentLoaded', () => {

    const SUPABASE_URL = 'https://lijsjlkgydlszdhmsppt.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_euV1pDAaO_nv3b3i6Sls-w_cfoAYbbh';

    const supabase = window.supabase;

    const senhaCorreta = "gringa123";
    let senha = prompt("Digite a senha de administrador para acessar o painel:");

    if (!senha || senha.toLowerCase() !== senhaCorreta) {
        alert("Senha incorreta! Acesso negado.");
        document.body.innerHTML = "<h1 style='color: white; text-align: center; margin-top: 50px;'>Acesso Negado</h1>";
        return;
    }

    const toastContainer = document.getElementById('toast-container');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-modal-message');
    const confirmBtnOk = document.getElementById('confirm-btn-ok');
    const confirmBtnCancel = document.getElementById('confirm-btn-cancelar');

    let confirmResolve = null;

    function showToast(message, type = 'sucesso') {
        if (!toastContainer) {
            console.error('Elemento toast-container não encontrado.');
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
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

    function showConfirm(message) {
        return new Promise((resolve) => {
            confirmMessage.textContent = message;
            confirmModal.classList.add('visivel');
            confirmResolve = resolve;
        });
    }

    confirmBtnOk.addEventListener('click', () => {
        if (confirmResolve) confirmResolve(true);
        confirmModal.classList.remove('visivel');
    });

    confirmBtnCancel.addEventListener('click', () => {
        if (confirmResolve) confirmResolve(false);
        confirmModal.classList.remove('visivel');
    });

    let todosOsProdutos = [];
    const tabelaCorpoProdutos = document.getElementById('tabela-estoque-corpo');
    const modalProduto = document.getElementById('modal-produto');
    const modalTituloProduto = document.getElementById('modal-titulo-form');
    const formProduto = document.getElementById('form-produto');
    const btnAdicionarNovo = document.getElementById('btn-adicionar-novo');
    const btnCancelarProduto = document.getElementById('btn-cancelar');
    const btnFecharModalProduto = document.getElementById('modal-fechar');
    const btnSalvarProduto = document.getElementById('btn-salvar');
    const inputMediaUpload = document.getElementById('produto-media-upload');
    const novasMidiasPreview = document.getElementById('novas-midias-preview');
    const midiasAtuaisPreview = document.getElementById('midias-atuais-preview');

    async function carregarProdutos() {
        if (!tabelaCorpoProdutos) return;
        tabelaCorpoProdutos.innerHTML = '<tr><td colspan="4">Carregando produtos...</td></tr>';
        btnSalvarProduto.disabled = false;
        btnSalvarProduto.textContent = 'Salvar';
        try {
            const { data, error } = await supabase.from('produtos').select('*').order('id');
            if (error) throw error;
            todosOsProdutos = data;
            renderizarTabelaProdutos(todosOsProdutos);
        } catch (error) {
            console.error('Erro ao carregar produtos (com chave pública):', error);
            tabelaCorpoProdutos.innerHTML = '<tr><td colspan="4">Erro ao carregar produtos. Verifique o console.</td></tr>';
        }
    }

    function renderizarTabelaProdutos(produtos) {
        tabelaCorpoProdutos.innerHTML = '';
        if (produtos.length === 0) {
            tabelaCorpoProdutos.innerHTML = '<tr><td colspan="4">Nenhum produto criado ainda.</td></tr>';
            return;
        }
        produtos.forEach(produto => {
            const statusTexto = produto.emEstoque ? "Em Estoque" : "Fora de Estoque";
            const isChecked = produto.emEstoque ? "checked" : "";
            const linha = `
                <tr data-id="${produto.id}">
                    <td data-label="Produto">${produto.nome}</td>
                    <td data-label="Status">${statusTexto}</td>
                    <td data-label="Disponibilidade">
                        <label class="switch">
                            <input type="checkbox" class="toggle-estoque" ${isChecked}>
                            <span class="slider"></span>
                        </label>
                    </td>
                    <td data-label="Ações" class="acoes-btn">
                        <button class="btn-admin btn-editar">Editar</button>
                        <button class="btn-admin btn-excluir">Excluir</button>
                    </td>
                </tr>
            `;
            tabelaCorpoProdutos.insertAdjacentHTML('beforeend', linha);
        });
    }

    function abrirModalProduto(produto = null) {
        formProduto.reset();
        midiasAtuaisPreview.innerHTML = '';
        novasMidiasPreview.innerHTML = '';
        document.getElementById('produto-estoque').checked = true;

        if (produto) {
            modalTituloProduto.textContent = 'Editar Produto';
            document.getElementById('produto-id').value = produto.id;
            document.getElementById('produto-nome').value = produto.nome;
            document.getElementById('produto-preco').value = produto.preco;
            document.getElementById('produto-preco-promocional').value = produto.preco_promocional || '';
            document.getElementById('produto-descricao').value = produto.descricao;
            document.getElementById('produto-estoque').checked = produto.emEstoque;
            document.getElementById('produto-estoque').checked = produto.emEstoque;
            document.getElementById('produto-categoria').value = produto.categoria_id || '';
            document.getElementById('produto-tags').value = produto.tags ? produto.tags.join(', ') : '';

            if (produto.variants && produto.variants.tipo && produto.variants.opcoes) {
                document.getElementById('produto-variant-tipo').value = produto.variants.tipo;
                document.getElementById('produto-variant-opcoes').value = produto.variants.opcoes.join(', ');
            } else {
                document.getElementById('produto-variant-tipo').value = '';
                document.getElementById('produto-variant-opcoes').value = '';
            }

            if (produto.media_urls && produto.media_urls.length > 0) {
                let previewHTML = '';
                produto.media_urls.forEach(url => {
                    if (url.includes('.mp4') || url.includes('.webm')) {
                        previewHTML += `<video src="${url}" width="150" controls style="border-radius: 4px; margin-right: 5px;"></video>`;
                    } else {
                        previewHTML += `<img src="${url}" width="70" style="margin-right: 5px; border-radius: 4px;">`;
                    }
                });
                midiasAtuaisPreview.innerHTML = previewHTML;
            }
        } else {
            modalTituloProduto.textContent = 'Adicionar Novo Produto';
            document.getElementById('produto-id').value = '';
        }
        modalProduto.classList.add('visivel');
    }

    function fecharModalProduto() {
        modalProduto.classList.remove('visivel');
        formProduto.reset();
        midiasAtuaisPreview.innerHTML = '';
        novasMidiasPreview.innerHTML = '';
        document.getElementById('produto-id').value = '';
        document.getElementById('produto-variant-tipo').value = '';
        document.getElementById('produto-variant-opcoes').value = '';
        document.getElementById('produto-tags').value = '';
        document.getElementById('produto-categoria').value = '';
        document.getElementById('produto-estoque').checked = true;
    }

    async function salvarProduto(event) {
        event.preventDefault();
        btnSalvarProduto.disabled = true;
        btnSalvarProduto.textContent = 'Salvando...';

        const id = document.getElementById('produto-id').value;
        const produtoExistente = id ? todosOsProdutos.find(p => p.id == id) : null;
        let urlsFinais = [];

        if (inputMediaUpload.files.length > 0) {
            for (const file of inputMediaUpload.files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage.from('gringa-style-produtos').upload(filePath, file);

                if (uploadError) {
                    showToast(`Erro no upload: ${uploadError.message}`, 'erro');
                    btnSalvarProduto.disabled = false;
                    btnSalvarProduto.textContent = 'Salvar';
                    return;
                }

                const { data } = supabase.storage.from('gringa-style-produtos').getPublicUrl(filePath);
                urlsFinais.push(data.publicUrl);
            }
        } else if (produtoExistente) {
            urlsFinais = produtoExistente.media_urls || [];
        }

        const variantTipo = document.getElementById('produto-variant-tipo').value.trim();
        const variantOpcoesString = document.getElementById('produto-variant-opcoes').value.trim();
        let variantsJSON = null;

        if (variantTipo && variantOpcoesString) {
            const opcoes = variantOpcoesString.split(',').map(opt => opt.trim()).filter(Boolean);
            if (opcoes.length > 0) {
                variantsJSON = {
                    tipo: variantTipo,
                    opcoes: opcoes
                };
            } else {
                showToast('O campo "Opções" das variantes parece estar preenchido, mas não encontramos nenhuma opção válida.', 'erro');
                btnSalvarProduto.disabled = false;
                btnSalvarProduto.textContent = 'Salvar';
                return;
            }
        } else if (variantTipo || variantOpcoesString) {
            showToast('Para cadastrar variantes, ambos os campos "Tipo da Variante" e "Opções" devem ser preenchidos.', 'erro');
            btnSalvarProduto.disabled = false;
            btnSalvarProduto.textContent = 'Salvar';
            return;
        }

        const precoValor = parseFloat(document.getElementById('produto-preco').value) || 0;
        const precoPromocionalEl = document.getElementById('produto-preco-promocional');
        const precoPromocionalValor = precoPromocionalEl.value ? parseFloat(precoPromocionalEl.value) : null;

        const produtoData = {
            nome: document.getElementById('produto-nome').value,
            preco: precoValor,
            preco_promocional: precoPromocionalValor,
            descricao: document.getElementById('produto-descricao').value,
            media_urls: urlsFinais,
            emEstoque: document.getElementById('produto-estoque').checked,
            tags: document.getElementById('produto-tags').value.split(',').map(tag => tag.trim()).filter(Boolean),
            categoria_id: document.getElementById('produto-categoria').value || null,
            variants: variantsJSON
        };

        // --- INÍCIO DA LÓGICA DE NOTIFICAÇÃO DE MUDANÇA DE PREÇO ---
        if (id && produtoExistente) {
            const oldPromo = parseFloat(produtoExistente.preco_promocional) || 0;
            const newPromo = parseFloat(produtoData.preco_promocional) || 0;
            const oldPrice = parseFloat(produtoExistente.preco) || 0;
            const newPrice = parseFloat(produtoData.preco) || 0;

            const linkProduto = `/produto.html?id=${id}`;

            if (newPromo > 0 && newPromo !== oldPromo) {
                // 1. Promoção Adicionada ou Alterada
                const titulo = '🔥 PROMOÇÃO ATIVADA!';
                const mensagem = `O produto "${produtoData.nome}" está em promoção por R$${newPromo.toFixed(2).replace('.', ',')}!`;
                criarRascunhoPush(titulo, mensagem, linkProduto);

            } else if (newPromo === 0 && oldPromo > 0) {
                // 2. Promoção Removida
                const titulo = 'Promoção Encerrada';
                const mensagem = `A promoção do produto "${produtoData.nome}" foi encerrada.`;
                criarRascunhoPush(titulo, mensagem, linkProduto);

            } else if (newPrice !== oldPrice && newPromo === oldPromo) {
                // 3. Preço Base Alterado (e a promoção não mudou)
                const titulo = 'Mudança de Preço';
                const mensagem = `O preço de "${produtoData.nome}" foi atualizado para R$${newPrice.toFixed(2).replace('.', ',')}.`;
                criarRascunhoPush(titulo, mensagem, linkProduto);
            }

            // Checagem de estoque (caso tenha mudado pelo modal e não pelo toggle)
            if (produtoData.emEstoque !== produtoExistente.emEstoque) {
                if (produtoData.emEstoque === true) {
                    const titulo = '🛍️ De volta ao estoque!';
                    const mensagem = `O produto "${produtoData.nome}" está disponível novamente! Garanta o seu.`;
                    criarRascunhoPush(titulo, mensagem, linkProduto);
                } else {
                    const titulo = '😥 Produto Esgotado!';
                    const mensagem = `O produto "${produtoData.nome}" esgotou!`;
                    criarRascunhoPush(titulo, mensagem, linkProduto);
                }
            }
        }
        // --- FIM DA LÓGICA DE NOTIFICAÇÃO ---


        try {
            let error;
            if (id) {
                const { error: updateError } = await supabase.from('produtos').update(produtoData).eq('id', id);
                error = updateError;
            } else {
                const { data: insertData, error: insertError } = await supabase.from('produtos').insert([produtoData]).select().single();
                error = insertError;
                if (!error && insertData) {
                    // Notificação para PRODUTO NOVO
                    const tituloNovo = '🔥 Novidade na Loja!';
                    const msgNovo = `O produto "${insertData.nome}" já está disponível. Venha conferir!`;
                    criarRascunhoPush(tituloNovo, msgNovo, `/produto.html?id=${insertData.id}`);
                }
            }
            if (error) throw error;
            showToast(id ? 'Produto atualizado!' : 'Produto criado com sucesso!', 'sucesso');
            fecharModalProduto();
            carregarProdutos();
        } catch (error) {
            showToast(`Não foi possível salvar o produto. Detalhes: ${error.message}`, 'erro');
        } finally {
            btnSalvarProduto.disabled = false;
            btnSalvarProduto.textContent = 'Salvar';
        }
    }

    async function excluirProduto(id) {
        if (!(await showConfirm('Tem certeza de que deseja excluir este produto?'))) return;
        try {
            const { error } = await supabase.from('produtos').delete().eq('id', id);
            if (error) throw error;
            showToast('Produto excluído.', 'sucesso');
            carregarProdutos();
        } catch (error) {
            showToast('Não foi possível excluir o produto.', 'erro');
        }
    }

    async function atualizarEstoque(id, novoStatus) {
        try {
            const { error } = await supabase.from('produtos').update({ emEstoque: novoStatus }).eq('id', id);
            if (error) throw error;

            // --- INÍCIO DA NOVA LÓGICA DE NOTIFICAÇÃO DE ESTOQUE ---
            const produto = todosOsProdutos.find(p => p.id === id);
            if (produto) {
                const linkProduto = `/produto.html?id=${id}`;
                if (novoStatus === true) {
                    // Item voltou ao estoque
                    const titulo = '🛍️ De volta ao estoque!';
                    const mensagem = `O produto "${produto.nome}" está disponível novamente! Garanta o seu.`;
                    criarRascunhoPush(titulo, mensagem, linkProduto);
                } else {
                    // Item esgotou
                    const titulo = '😥 Produto Esgotado!';
                    const mensagem = `O produto "${produto.nome}" esgotou!`;
                    criarRascunhoPush(titulo, mensagem, linkProduto);
                }
            }
            // --- FIM DA NOVA LÓGICA DE NOTIFICAÇÃO DE ESTOQUE ---

        } catch (error) {
            showToast('Ocorreu um erro na comunicação com o servidor.', 'erro');
            carregarProdutos();
        }
    }

    if (inputMediaUpload) {
        inputMediaUpload.addEventListener('change', (event) => {
            novasMidiasPreview.innerHTML = '';
            const files = event.target.files;
            for (const file of files) {
                const previewUrl = URL.createObjectURL(file);
                let previewElement;
                if (file.type.startsWith('image/')) {
                    previewElement = document.createElement('img');
                    previewElement.src = previewUrl;
                    previewElement.style.width = '70px';
                } else if (file.type.startsWith('video/')) {
                    previewElement = document.createElement('video');
                    previewElement.src = previewUrl;
                    previewElement.controls = true;
                    previewElement.style.width = '150px';
                }
                if (previewElement) {
                    previewElement.style.borderRadius = '4px';
                    novasMidiasPreview.appendChild(previewElement);
                }
            }
        });
    }

    if (btnAdicionarNovo) btnAdicionarNovo.addEventListener('click', () => abrirModalProduto());
    if (btnCancelarProduto) btnCancelarProduto.addEventListener('click', fecharModalProduto);
    if (btnFecharModalProduto) btnFecharModalProduto.addEventListener('click', fecharModalProduto);
    if (formProduto) formProduto.addEventListener('submit', salvarProduto);

    if (tabelaCorpoProdutos) {
        tabelaCorpoProdutos.addEventListener('click', (event) => {
            const linha = event.target.closest('tr');
            if (!linha) return;
            const id = parseInt(linha.dataset.id);
            const produto = todosOsProdutos.find(p => p.id === id);

            if (event.target.classList.contains('btn-editar')) {
                abrirModalProduto(produto);
            }
            if (event.target.classList.contains('btn-excluir')) {
                excluirProduto(id);
            }
        });

        tabelaCorpoProdutos.addEventListener('change', (event) => {
            if (event.target.classList.contains('toggle-estoque')) {
                const linha = event.target.closest('tr');
                if (!linha) return;
                const id = parseInt(linha.dataset.id);
                const novoStatus = event.target.checked;
                atualizarEstoque(id, novoStatus);
            }
        });
    }

    const btnCriarRifa = document.getElementById('btn-criar-rifa');
    const modalRifa = document.getElementById('modal-rifa');
    const modalRifaFechar = document.getElementById('modal-rifa-fechar');
    const formRifa = document.getElementById('form-rifa');

    const tabelaRifasCorpo = document.getElementById('tabela-rifas-corpo');

    const btnRifaCancelar = document.getElementById('btn-rifa-cancelar');
    const btnRifaSalvar = document.getElementById('btn-rifa-salvar');
    const modalGerenciarRifa = document.getElementById('modal-gerenciar-rifa');
    const modalGerenciarFechar = document.getElementById('modal-gerenciar-fechar');

    const btnAdicionarPremio = document.getElementById('btn-adicionar-premio');
    const listaPremiosDinamica = document.getElementById('lista-premios-dinamica');

    let todasAsRifas = [];

    async function carregarRifas() {
        if (!tabelaRifasCorpo) return;
        tabelaRifasCorpo.innerHTML = '<tr><td colspan="4">Carregando rifas...</td></tr>';
        const { data: rifas, error } = await supabase.from('rifas').select('*').order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao carregar rifas:', error);
            tabelaRifasCorpo.innerHTML = '<tr><td colspan="4">Erro ao carregar rifas.</td></tr>';
            return;
        }
        todasAsRifas = rifas;
        if (rifas.length === 0) {
            tabelaRifasCorpo.innerHTML = '<tr><td colspan="4">Nenhuma rifa criada ainda.</td></tr>';
            return;
        }

        tabelaRifasCorpo.innerHTML = '';
        rifas.forEach(rifa => {
            const progresso = rifa.numeros_vendidos ? rifa.numeros_vendidos.length : 0;
            const porcentagem = (progresso / rifa.total_numeros) * 100;
            const isAtiva = rifa.status === 'ativa';
            const rifaHTML = `
                <tr data-rifa-id="${rifa.id}">
                    <td data-label="Rifa">${rifa.nome_premio}</td>
                    <td data-label="Progresso">${progresso} / ${rifa.total_numeros} (${porcentagem.toFixed(1)}%)</td>
                    <td data-label="Status">
                        <label class="switch">
                            <input type="checkbox" class="toggle-status-rifa" ${isAtiva ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span style="margin-left: 10px;">${isAtiva ? 'Ativa' : 'Finalizada'}</span>
                    </td>
                    <td data-label="Ações" class="acoes-btn">
                        <button class="btn-admin btn-sortear" onclick="abrirModalSorteio(${rifa.id})">Sortear</button>
                        <button class="btn-admin btn-gerenciar" onclick="abrirModalGerenciarRifa(${rifa.id}, '${rifa.nome_premio.replace(/'/g, "\\'")}')">Participantes</button>
                        <button class="btn-admin btn-editar" onclick="abrirModalEditarRifa(${rifa.id})">Editar</button>
                        <button class="btn-admin btn-excluir" onclick="excluirRifa(${rifa.id})">Excluir</button>
                    </td>
                </tr>
            `;
            tabelaRifasCorpo.insertAdjacentHTML('beforeend', rifaHTML);
        });
    }

    window.abrirModalGerenciarRifa = async function (rifaId, nomeRifa) {
        document.getElementById('modal-gerenciar-titulo').textContent = `Gerenciar Rifa: ${nomeRifa}`;
        const listaPendentes = document.getElementById('lista-pendentes');
        const listaConfirmados = document.getElementById('lista-confirmados');
        listaPendentes.innerHTML = '<li>Carregando...</li>';
        listaConfirmados.innerHTML = '<li>Carregando...</li>';
        modalGerenciarRifa.classList.add('visivel');

        const { data: participantes, error } = await supabase.from('participantes').select('*').eq('rifa_id', rifaId).order('created_at');
        if (error) {
            showToast('Erro ao buscar participantes.', 'erro');
            return;
        }

        listaPendentes.innerHTML = '';
        listaConfirmados.innerHTML = '';

        participantes.forEach(p => {
            const numeros = p.numeros_escolhidos.join(', ');
            const numerosArrayLiteral = JSON.stringify(p.numeros_escolhidos);
            let botoesParticipante = '';

            if (p.status_pagamento === 'pendente') {
                botoesParticipante = `
                    <button class="btn-admin btn-adicionar" style="margin-top:5px; width: 100%;" 
                            onclick="confirmarPagamento(event, ${p.id}, ${rifaId}, ${numerosArrayLiteral})">
                            Confirmar Pagamento
                    </button>
                    <button class="btn-admin btn-excluir" style="margin-top:5px; width: 100%;"
                            onclick="cancelarReserva(event, ${p.id}, ${rifaId}, ${numerosArrayLiteral})">
                            Cancelar Reserva
                    </button>
                `;
            }

            const itemHTML = `
                <li id="participante-${p.id}" class="participante-item" style="display:block;">
                    <strong>${p.nome_cliente}</strong> (ID: ${p.id})<br>
                    <small>Tel: ${p.telefone} | Números: ${numeros}</small>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                       ${botoesParticipante}
                    </div>
                </li>
            `;

            if (p.status_pagamento === 'pendente') {
                listaPendentes.insertAdjacentHTML('beforeend', itemHTML);
            } else {
                listaConfirmados.insertAdjacentHTML('beforeend', itemHTML);
            }
        });

        if (listaPendentes.innerHTML === '') {
            listaPendentes.innerHTML = '<li>Nenhum pagamento pendente.</li>';
        }
        if (listaConfirmados.innerHTML === '') {
            listaConfirmados.innerHTML = '<li>Nenhum pagamento confirmado.</li>';
        }
    }

    window.cancelarReserva = async function (event, participanteId, rifaId, numerosParam) {
        if (!(await showConfirm(`Tem certeza que deseja cancelar a reserva do participante ${participanteId}?\nIsso liberará seus números.`))) return;

        const btn = event.target;
        btn.disabled = true;
        btn.textContent = 'Cancelando...';
        try {
            const { error } = await supabase.rpc('cancelar_reserva', {
                participante_id_param: participanteId,
                rifa_id_param: rifaId,
                numeros_param: numerosParam
            });
            if (error) throw error;
            showToast('Reserva cancelada com sucesso! Os números estão disponíveis novamente.', 'sucesso');
            const itemRemovido = document.getElementById(`participante-${participanteId}`);
            if (itemRemovido) itemRemovido.remove();
            carregarRifas();
        } catch (error) {
            showToast('Erro ao cancelar reserva: ' + error.message, 'erro');
            btn.disabled = false;
            btn.textContent = 'Cancelar Reserva';
        }
    }

    window.confirmarPagamento = async function (event, participanteId, rifaId, numerosParam) {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = 'Confirmando...';
        try {
            const { error } = await supabase.rpc('confirmar_pagamento', {
                participante_id_param: participanteId,
                rifa_id_param: rifaId,
                numeros_param: numerosParam
            });
            if (error) throw error;
            showToast('Pagamento confirmado com sucesso!', 'sucesso');
            const itemMovido = document.getElementById(`participante-${participanteId}`);
            const botoes = itemMovido.querySelector('div[style*="flex-direction"]');
            if (botoes) botoes.remove();

            const listaConfirmados = document.getElementById('lista-confirmados');
            const placeholder = listaConfirmados.querySelector('li');
            if (placeholder && placeholder.textContent === 'Nenhum pagamento confirmado.') {
                placeholder.remove();
            }

            listaConfirmados.appendChild(itemMovido);
            carregarRifas();
        } catch (error) {
            showToast('Erro ao confirmar pagamento: ' + error.message, 'erro');
            btn.disabled = false;
            btn.textContent = 'Confirmar Pagamento';
        }
    }

    if (modalGerenciarFechar) modalGerenciarFechar.addEventListener('click', () => modalGerenciarRifa.classList.remove('visivel'));

    if (btnAdicionarPremio) btnAdicionarPremio.addEventListener('click', () => {
        adicionarCampoPremio();
    });

    if (listaPremiosDinamica) listaPremiosDinamica.addEventListener('click', (e) => {
        if (e.target.classList.contains('remover-premio-btn')) {
            e.target.closest('.premio-item').remove();
            atualizarIndicesPremios();
        }
    });

    function adicionarCampoPremio(premio = { id: '', descricao: '', imagem_url: '' }) {
        const index = listaPremiosDinamica.children.length + 1;
        const itemId = `premio-item-${Date.now()}`;

        const itemHTML = `
            <div class="premio-item" 
                 data-index="${index}" 
                 data-premio-id="${premio.id || ''}" 
                 data-imagem-atual="${premio.imagem_url || ''}">

                <div class="premio-item-header">
                    <label>Prêmio ${index}º</label>
                    <button type="button" class="btn-admin btn-excluir remover-premio-btn" style="padding: 5px 10px; font-size: 14px;">Remover</button>
                </div>

                <div class="premio-item-body">
                    <div class="premio-campo-descricao">
                        <label for="${itemId}-desc">Descrição do Prêmio</label>
                        <input type="text" id="${itemId}-desc" class="premio-descricao" placeholder="Ex: Máscara de Solda" value="${premio.descricao}" required>
                    </div>
                    <div class="premio-campo-imagem">
                        <label for="${itemId}-img">Foto do Prêmio</label>
                        <input type="file" id="${itemId}-img" class="premio-imagem-upload" accept="image/*" data-preview-target="${itemId}-preview">
                        <div id="${itemId}-preview" class="premio-imagem-preview">
                            ${premio.imagem_url ? `<img src="${premio.imagem_url}" alt="Preview">` : '<span>Preview</span>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        listaPremiosDinamica.insertAdjacentHTML('beforeend', itemHTML);

        document.getElementById(`${itemId}-img`).addEventListener('change', (e) => {
            const file = e.target.files[0];
            const previewEl = document.getElementById(e.target.dataset.previewTarget);
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewEl.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                }
                reader.readAsDataURL(file);
            } else {
                previewEl.innerHTML = '<span>Preview</span>';
            }
        });
    }

    function atualizarIndicesPremios() {
        listaPremiosDinamica.querySelectorAll('.premio-item').forEach((item, index) => {
            item.dataset.index = index + 1;
            item.querySelector('.premio-item-header label').textContent = `Prêmio ${index + 1}º`;
        });
    }
    if (btnCriarRifa) btnCriarRifa.addEventListener('click', () => {
        formRifa.reset();
        document.getElementById('rifa-id').value = '';
        document.getElementById('modal-rifa-titulo').textContent = 'Criar Nova Rifa';
        document.getElementById('rifa-imagem-atual-preview').innerHTML = '';
        listaPremiosDinamica.innerHTML = '';
        adicionarCampoPremio();
        modalRifa.classList.add('visivel');
    });

    window.abrirModalEditarRifa = async function (rifaId) {
        const rifa = todasAsRifas.find(r => r.id === rifaId);
        if (!rifa) return;

        formRifa.reset();
        listaPremiosDinamica.innerHTML = '';
        document.getElementById('rifa-id').value = rifa.id;
        document.getElementById('rifa-nome-premio').value = rifa.nome_premio;
        document.getElementById('rifa-descricao').value = rifa.descricao;
        document.getElementById('rifa-preco-numero').value = rifa.preco_numero;
        document.getElementById('rifa-total-numeros').value = rifa.total_numeros;

        const previewDiv = document.getElementById('rifa-imagem-atual-preview');
        previewDiv.innerHTML = '';
        if (rifa.imagem_premio_url) {
            previewDiv.innerHTML = `<img src="${rifa.imagem_premio_url}" width="100" style="border-radius: 4px;">`;
        }

        const { data: premios, error } = await supabase
            .from('premios')
            .select('*')
            .eq('rifa_id', rifaId)
            .order('ordem', { ascending: true });

        if (error) {
            showToast("Erro ao buscar os prêmios desta rifa.", 'erro');
        } else {
            if (premios.length > 0) {
                premios.forEach(premio => adicionarCampoPremio(premio));
            } else {
                adicionarCampoPremio();
            }
        }

        document.getElementById('modal-rifa-titulo').textContent = 'Editar Rifa';
        modalRifa.classList.add('visivel');
    }

    if (modalRifaFechar) modalRifaFechar.addEventListener('click', () => modalRifa.classList.remove('visivel'));
    if (btnRifaCancelar) btnRifaCancelar.addEventListener('click', () => modalRifa.classList.remove('visivel'));

    if (formRifa) formRifa.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnRifaSalvar.disabled = true;
        btnRifaSalvar.textContent = 'Salvando...';

        const id = document.getElementById('rifa-id').value;
        const rifaExistente = id ? todasAsRifas.find(r => r.id == id) : null;
        let rifaIdSalva = id;

        const arquivoCapa = document.getElementById('rifa-imagem-upload').files[0];
        let imagemCapaUrl = rifaExistente ? rifaExistente.imagem_premio_url : null;

        if (arquivoCapa) {
            const nomeArquivo = `capa-${Date.now()}-${arquivoCapa.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage.from('imagens-rifas').upload(nomeArquivo, arquivoCapa);
            if (uploadError) {
                showToast('Erro ao fazer upload da imagem de capa: ' + uploadError.message, 'erro');
                btnRifaSalvar.disabled = false;
                btnRifaSalvar.textContent = 'Salvar Rifa';
                return;
            }
            const { data: urlData } = supabase.storage.from('imagens-rifas').getPublicUrl(nomeArquivo);
            imagemCapaUrl = urlData.publicUrl;
        }

        const dadosRifa = {
            nome_premio: document.getElementById('rifa-nome-premio').value,
            descricao: document.getElementById('rifa-descricao').value,
            preco_numero: parseFloat(document.getElementById('rifa-preco-numero').value),
            total_numeros: parseInt(document.getElementById('rifa-total-numeros').value),
            imagem_premio_url: imagemCapaUrl
        };

        try {
            if (id) {
                const { error: updateError } = await supabase.from('rifas').update(dadosRifa).eq('id', id);
                if (updateError) throw updateError;
            } else {
                dadosRifa.status = 'ativa';
                const { data: insertData, error: insertError } = await supabase.from('rifas').insert([dadosRifa]).select('id').single();
                if (insertError) throw insertError;
                rifaIdSalva = insertData.id;

                // Notificação para NOVA RIFA
                const tituloRifa = '🍀 Nova Rifa no Ar!';
                const msgRifa = `A rifa "${dadosRifa.nome_premio}" já começou. Garanta seus números!`;
                criarRascunhoPush(tituloRifa, msgRifa, `/rifa.html`);
            }

            const camposPremios = listaPremiosDinamica.querySelectorAll('.premio-item');
            const premiosParaAtualizar = [];
            const premiosParaInserir = [];
            const idsPremiosNoForm = [];

            await Promise.all(Array.from(camposPremios).map(async (item, index) => {
                const descricaoInput = item.querySelector('.premio-descricao');
                const inputFile = item.querySelector('.premio-imagem-upload');
                const imagemAtual = item.dataset.imagemAtual || null;

                let imagem_url_final = imagemAtual;

                if (inputFile.files[0]) {
                    const arquivoPremio = inputFile.files[0];
                    const nomeArquivoPremio = `premio-${rifaIdSalva}-${Date.now()}-${arquivoPremio.name}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage.from('imagens-premios').upload(nomeArquivoPremio, arquivoPremio);

                    if (uploadError) {
                        throw new Error(`Erro ao fazer upload da imagem do prêmio ${index + 1}: ${uploadError.message}`);
                    }
                    const { data: urlData } = supabase.storage.from('imagens-premios').getPublicUrl(nomeArquivoPremio);
                    imagem_url_final = urlData.publicUrl;
                }

                if (descricaoInput.value.trim() !== '') {
                    const premioData = {
                        rifa_id: rifaIdSalva,
                        descricao: descricaoInput.value,
                        ordem: index + 1,
                        imagem_url: imagem_url_final
                    };

                    const premioId = item.dataset.premioId;

                    if (premioId) {
                        premioData.id = parseInt(premioId);
                        premiosParaAtualizar.push(premioData);
                        idsPremiosNoForm.push(premioId);
                    } else {
                        premiosParaInserir.push(premioData);
                    }
                }
            }));

            if (premiosParaAtualizar.length === 0 && premiosParaInserir.length === 0) {
                throw new Error("Adicione pelo menos um prêmio.");
            }

            const { data: premiosExistentes } = await supabase.from('premios').select('id').eq('rifa_id', rifaIdSalva);
            const idsPremiosExistentes = premiosExistentes.map(p => String(p.id));
            const idsParaDeletar = idsPremiosExistentes.filter(id => !idsPremiosNoForm.includes(id));

            if (idsParaDeletar.length > 0) {
                const { error: deleteError } = await supabase.from('premios').delete().in('id', idsParaDeletar);
                if (deleteError) throw new Error("Erro ao deletar prêmios antigos: " + deleteError.message);
            }

            if (premiosParaAtualizar.length > 0) {
                const { error: updateError } = await supabase.from('premios').upsert(premiosParaAtualizar);
                if (updateError) throw new Error("Erro ao atualizar prêmios: " + updateError.message);
            }

            if (premiosParaInserir.length > 0) {
                const { error: insertError } = await supabase.from('premios').insert(premiosParaInserir);
                if (insertError) throw new Error("Erro ao inserir novos prêmios: " + insertError.message);
            }

            showToast(`Rifa ${id ? 'atualizada' : 'criada'} com sucesso!`, 'sucesso');
            modalRifa.classList.remove('visivel');
            carregarRifas();

        } catch (error) {
            showToast('Erro ao salvar a rifa: ' + error.message, 'erro');
        } finally {
            btnRifaSalvar.disabled = false;
            btnRifaSalvar.textContent = 'Salvar Rifa';
        }
    });

    window.excluirRifa = async function (rifaId) {
        if (!(await showConfirm('Tem certeza que deseja excluir esta rifa? ATENÇÃO: Todos os participantes E PRÊMIOS dela também serão excluídos.'))) return;

        const { error: delRifaError } = await supabase.from('rifas').delete().eq('id', rifaId);
        if (delRifaError) {
            showToast('Erro ao excluir a rifa: ' + delRifaError.message + "\n\nVerifique se o CASCADE está habilitado na tabela 'premios' e 'participantes'.", 'erro');
            return;
        }
        showToast('Rifa excluída com sucesso!', 'sucesso');
        carregarRifas();
    }

    if (tabelaRifasCorpo) tabelaRifasCorpo.addEventListener('change', async (event) => {
        if (event.target.classList.contains('toggle-status-rifa')) {
            const linha = event.target.closest('tr');
            const rifaId = parseInt(linha.dataset.rifaId);
            const novoStatus = event.target.checked ? 'ativa' : 'finalizada';

            const { error } = await supabase.from('rifas').update({ status: novoStatus }).eq('id', rifaId);
            if (error) {
                showToast('Erro ao atualizar o status da rifa.', 'erro');
                carregarRifas();
            } else {
                const statusTextoEl = linha.querySelector('span[style*="margin-left"]');
                statusTextoEl.textContent = novoStatus === 'ativa' ? 'Ativa' : 'Finalizada';
            }
        }
    });

    const modalSorteio = document.getElementById('modal-sorteio');
    const modalSorteioFechar = document.getElementById('modal-sorteio-fechar');
    const sorteioNomePremioEl = document.getElementById('sorteio-nome-premio');
    const sorteioAnimacaoEl = document.getElementById('sorteio-animacao');
    const sorteioListaPremiosEl = document.getElementById('sorteio-lista-premios');

    window.abrirModalSorteio = async function (rifaId) {
        const rifa = todasAsRifas.find(r => r.id === rifaId);
        if (!rifa) {
            showToast('Rifa não encontrada!', 'erro');
            return;
        }

        sorteioNomePremioEl.textContent = rifa.nome_premio;
        sorteioAnimacaoEl.style.display = 'none';
        sorteioAnimacaoEl.textContent = '000';
        sorteioListaPremiosEl.innerHTML = '<li>Carregando prêmios...</li>';
        modalSorteio.classList.add('visivel');

        const { data: premios, error } = await supabase
            .from('premios')
            .select('*')
            .eq('rifa_id', rifaId)
            .order('ordem', { ascending: true });

        if (error) {
            sorteioListaPremiosEl.innerHTML = '<li>Erro ao carregar prêmios.</li>';
            return;
        }

        if (premios.length === 0) {
            sorteioListaPremiosEl.innerHTML = '<li>Esta rifa não tem prêmios cadastrados.</li>';
            return;
        }

        sorteioListaPremiosEl.innerHTML = '';
        const totalDigitos = String(rifa.total_numeros - 1).length;

        premios.forEach(premio => {
            let conteudoPremio = '';
            if (premio.vencedor_nome) {
                conteudoPremio = `
                    <div class="premio-sorteio-info">
                        <strong>${premio.ordem}º Prêmio:</strong> ${premio.descricao}
                        <div class="vencedor-destaque">
                            <strong>Vencedor(a):</strong> ${premio.vencedor_nome}<br>
                            <strong>Número:</strong> ${String(premio.vencedor_numero).padStart(totalDigitos, '0')}
                        </div>
                    </div>
                `;
            } else {
                conteudoPremio = `
                    <div class="premio-sorteio-info">
                        <strong>${premio.ordem}º Prêmio:</strong> ${premio.descricao}
                        <div id="resultado-premio-${premio.id}"></div>
                    </div>
                    <button id="btn-sortear-premio-${premio.id}" class="btn-admin btn-adicionar" 
                            onclick="realizarSorteioPremio(${rifa.id}, ${premio.id}, '${premio.descricao.replace(/'/g, "\\'")}', ${rifa.total_numeros})">
                        Sortear este prêmio
                    </button>
                `;
            }
            sorteioListaPremiosEl.innerHTML += `<li class="premio-sorteio-item">${conteudoPremio}</li>`;
        });
    }

    window.realizarSorteioPremio = async function (rifaId, premioId, premioDescricao, totalNumeros) {

        const btn = document.getElementById(`btn-sortear-premio-${premioId}`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Sorteando...';
        }

        sorteioAnimacaoEl.style.display = 'block';
        sorteioAnimacaoEl.textContent = '000';

        const { data: participantesPagos, error: pError } = await supabase
            .from('participantes')
            .select('nome_cliente, numeros_escolhidos')
            .eq('rifa_id', rifaId)
            .eq('status_pagamento', 'pago');

        if (pError) {
            showToast('Erro ao buscar os participantes. Tente novamente.', 'erro');
            if (btn) btn.disabled = false;
            return;
        }

        if (participantesPagos.length === 0) {
            sorteioAnimacaoEl.textContent = '😢';
            showToast('Não há participantes com pagamento confirmado para realizar o sorteio.', 'erro');
            if (btn) btn.disabled = false;
            return;
        }

        const { data: premiosSorteados, error: prError } = await supabase
            .from('premios')
            .select('vencedor_numero')
            .eq('rifa_id', rifaId)
            .not('vencedor_numero', 'is', null);

        if (prError) {
            showToast('Erro ao verificar números já sorteados.', 'erro');
            if (btn) btn.disabled = false;
            return;
        }

        const numerosJaSorteados = new Set(premiosSorteados.map(p => p.vencedor_numero));

        const globo = [];
        participantesPagos.forEach(p => {
            p.numeros_escolhidos.forEach(numero => {
                if (!numerosJaSorteados.has(numero)) {
                    globo.push({ numero: numero, dono: p.nome_cliente });
                }
            });
        });

        if (globo.length === 0) {
            sorteioAnimacaoEl.textContent = '🏁';
            showToast('Todos os números pagos já foram premiados!', 'sucesso');
            if (btn) btn.style.display = 'none';
            return;
        }

        const totalDigitos = String(totalNumeros - 1).length;
        let animacaoIntervalo = setInterval(() => {
            const numeroAleatorio = globo[Math.floor(Math.random() * globo.length)];
            sorteioAnimacaoEl.textContent = String(numeroAleatorio.numero).padStart(totalDigitos, '0');
        }, 100);

        setTimeout(async () => {
            clearInterval(animacaoIntervalo);
            const indiceVencedor = Math.floor(Math.random() * globo.length);
            const vencedor = globo[indiceVencedor];

            const { error: updateError } = await supabase
                .from('premios')
                .update({
                    vencedor_nome: vencedor.dono,
                    vencedor_numero: vencedor.numero
                })
                .eq('id', premioId);

            if (updateError) {
                showToast("Ocorreu um erro ao salvar o vencedor. Por favor, verifique o console e tente novamente.", 'erro');
                if (btn) btn.disabled = false;
                return;
            }

            // --- NOVA LÓGICA DE NOTIFICAÇÃO DE VENCEDOR ---
            const linkRifa = `/acompanhar_rifa.html?id=${rifaId}`;
            const tituloSorteio = '🎉 Temos um Vencedor!';
            const numeroFormatado = String(vencedor.numero).padStart(totalDigitos, '0');
            const mensagemSorteio = `Parabéns ${vencedor.dono}! Você ganhou "${premioDescricao}" com o número ${numeroFormatado}.`;
            criarRascunhoPush(tituloSorteio, mensagemSorteio, linkRifa);
            // --- FIM DA NOVA LÓGICA ---

            sorteioAnimacaoEl.style.display = 'none';
            if (btn) btn.style.display = 'none';

            const resultadoEl = document.getElementById(`resultado-premio-${premioId}`);
            if (resultadoEl) {
                resultadoEl.innerHTML = `
                    <div class="vencedor-destaque">
                        <strong>Vencedor(a):</strong> ${vencedor.dono}<br>
                        <strong>Número:</strong> ${numeroFormatado}
                    </div>
                `;
            }

            carregarRifas();

        }, 3000);
    }

    if (modalSorteioFechar) modalSorteioFechar.addEventListener('click', () => modalSorteio.classList.remove('visivel'));
    let todosOsCupons = [];
    const tabelaCuponsCorpo = document.getElementById('tabela-cupons-corpo');
    const modalCupom = document.getElementById('modal-cupom');
    const modalCupomTitulo = document.getElementById('modal-cupom-titulo');
    const modalCupomFechar = document.getElementById('modal-cupom-fechar');
    const formCupom = document.getElementById('form-cupom');
    const btnAdicionarCupom = document.getElementById('btn-adicionar-cupom');
    const btnCupomCancelar = document.getElementById('btn-cupom-cancelar');
    const btnCupomSalvar = document.getElementById('btn-cupom-salvar');
    const selectTipoAplicacao = document.getElementById('cupom-tipo-aplicacao');
    const campoProdutosAplicaveis = document.getElementById('campo-produtos-aplicaveis');
    const selectProdutosAplicaveis = document.getElementById('cupom-produtos-aplicaveis');

    async function carregarCupons() {
        if (!tabelaCuponsCorpo) return;
        tabelaCuponsCorpo.innerHTML = '<tr><td colspan="6">Carregando cupons...</td></tr>';
        try {
            const { data, error } = await supabase.from('cupons').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            todosOsCupons = data;
            renderizarTabelaCupons(todosOsCupons);
        } catch (error) {
            console.error('Erro ao carregar cupons:', error);
            tabelaCuponsCorpo.innerHTML = '<tr><td colspan="6">Erro ao carregar cupons.</td></tr>';
        }
    }

    function renderizarTabelaCupons(cupons) {
        tabelaCuponsCorpo.innerHTML = '';
        if (cupons.length === 0) {
            tabelaCuponsCorpo.innerHTML = '<tr><td colspan="6">Nenhum cupom criado ainda.</td></tr>';
            return;
        }

        cupons.forEach(cupom => {
            const tipo = cupom.tipo_desconto === 'percentual' ? '%' : 'Fixo (R$)';
            const valor = cupom.tipo_desconto === 'percentual' ? `${cupom.valor_desconto}%` : `R$ ${cupom.valor_desconto.toFixed(2)}`;

            const usos = cupom.usos_atuais || 0;
            const limite = cupom.limite_uso;
            const usoTexto = `${usos} / ${limite || '∞'}`;
            let barraUsoHTML = `<span>${usoTexto}</span>`;

            if (limite && limite > 0) {
                const porcentagem = Math.min((usos / limite) * 100, 100);
                const isFull = usos >= limite;
                const barClass = isFull ? 'progress-bar full' : 'progress-bar';

                barraUsoHTML = `
                    <div class="progress-bar-container" title="${usoTexto}">
                      <div class="${barClass}" style="width: ${porcentagem}%;">
                        ${usoTexto}
                      </div>
                    </div>
                `;
            }
            const isChecked = cupom.ativo ? "checked" : "";
            const statusTexto = cupom.ativo ? "Ativo" : "Inativo";

            const linha = `
                <tr data-cupom-id="${cupom.id}">
                    <td data-label="Código"><strong>${cupom.codigo}</strong></td>
                    <td data-label="Tipo">${tipo}</td>
                    <td data-label="Valor">${valor}</td>
                    <td data-label="Uso">${barraUsoHTML}</td>
                    <td data-label="Status">
                        <label class="switch">
                            <input type="checkbox" class="toggle-status-cupom" ${isChecked}>
                            <span class="slider"></span>
                        </label>
                        <span style="margin-left: 10px;">${statusTexto}</span>
                    </td>
                    <td data-label="Ações" class="acoes-btn">
                        <button class="btn-admin btn-editar">Editar</button>
                        <button class="btn-admin btn-excluir">Excluir</button>
                    </td>
                </tr>
            `;
            tabelaCuponsCorpo.insertAdjacentHTML('beforeend', linha);
        });
    }

    function popularSelectProdutos(produtosSelecionadosIds = []) {
        selectProdutosAplicaveis.innerHTML = '';
        if (todosOsProdutos.length === 0) {
            selectProdutosAplicaveis.innerHTML = '<option disabled>Carregue os produtos primeiro...</option>';
            return;
        }

        todosOsProdutos.forEach(produto => {
            const isSelected = produtosSelecionadosIds.includes(produto.id);
            const option = document.createElement('option');
            option.value = produto.id;
            option.textContent = produto.nome;
            option.selected = isSelected;
            selectProdutosAplicaveis.appendChild(option);
        });
    }

    function abrirModalCupom(cupom = null) {
        formCupom.reset();
        campoProdutosAplicaveis.style.display = 'none';

        if (cupom) {
            modalCupomTitulo.textContent = 'Editar Cupom';
            document.getElementById('cupom-id').value = cupom.id;
            document.getElementById('cupom-codigo').value = cupom.codigo;
            document.getElementById('cupom-tipo-desconto').value = cupom.tipo_desconto;
            document.getElementById('cupom-valor-desconto').value = cupom.valor_desconto;
            document.getElementById('cupom-tipo-aplicacao').value = cupom.tipo_aplicacao;
            document.getElementById('cupom-data-validade').value = cupom.data_validade ? cupom.data_validade.slice(0, 16) : '';
            document.getElementById('cupom-limite-uso').value = cupom.limite_uso || '';

            popularSelectProdutos(cupom.produtos_aplicaveis || []);

            if (cupom.tipo_aplicacao === 'produto') {
                campoProdutosAplicaveis.style.display = 'block';
            }

        } else {
            modalCupomTitulo.textContent = 'Adicionar Novo Cupom';
            document.getElementById('cupom-id').value = '';
            popularSelectProdutos();
        }

        modalCupom.classList.add('visivel');
    }

    function fecharModalCupom() {
        modalCupom.classList.remove('visivel');
    }

    if (selectTipoAplicacao) selectTipoAplicacao.addEventListener('change', () => {
        if (selectTipoAplicacao.value === 'produto') {
            campoProdutosAplicaveis.style.display = 'block';
        } else {
            campoProdutosAplicaveis.style.display = 'none';
        }
    });

    async function salvarCupom(event) {
        event.preventDefault();
        btnCupomSalvar.disabled = true;
        btnCupomSalvar.textContent = 'Salvando...';

        const id = document.getElementById('cupom-id').value;
        const tipoAplicacao = document.getElementById('cupom-tipo-aplicacao').value;

        let produtosIdsSelecionados = null;
        if (tipoAplicacao === 'produto') {
            produtosIdsSelecionados = Array.from(selectProdutosAplicaveis.selectedOptions).map(option => parseInt(option.value, 10));
            if (produtosIdsSelecionados.length === 0) {
                showToast('Você escolheu "Produtos Específicos" mas não selecionou nenhum produto.', 'erro');
                btnCupomSalvar.disabled = false;
                btnCupomSalvar.textContent = 'Salvar Cupom';
                return;
            }
        }

        const dataValidade = document.getElementById('cupom-data-validade').value || null;
        const limiteUso = document.getElementById('cupom-limite-uso').value || null;

        const cupomData = {
            codigo: document.getElementById('cupom-codigo').value.toUpperCase().trim(),
            tipo_desconto: document.getElementById('cupom-tipo-desconto').value,
            valor_desconto: parseFloat(document.getElementById('cupom-valor-desconto').value),
            tipo_aplicacao: tipoAplicacao,
            produtos_aplicaveis: produtosIdsSelecionados,
            data_validade: dataValidade,
            limite_uso: limiteUso ? parseInt(limiteUso) : null,
        };

        try {
            let error;
            if (id) {
                const { error: updateError } = await supabase.from('cupons').update(cupomData).eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('cupons').insert([cupomData]);
                error = insertError;

                // Notificação para NOVO CUPOM
                const tituloCupom = '🎁 Cupom Liberado!';
                const msgCupom = `Use o código "${cupomData.codigo}" no seu carrinho. Aproveite!`;
                criarRascunhoPush(tituloCupom, msgCupom, `/carrinho.html`);
            }

            if (error) {
                if (error.code === '23505') {
                    throw new Error(`O código de cupom "${cupomData.codigo}" já existe.`);
                }
                throw error;
            }
            showToast(id ? 'Cupom atualizado!' : 'Cupom criado!', 'sucesso');
            fecharModalCupom();
            carregarCupons();

        } catch (error) {
            showToast(`Não foi possível salvar o cupom. Detalhes: ${error.message}`, 'erro');
        } finally {
            btnCupomSalvar.disabled = false;
            btnCupomSalvar.textContent = 'Salvar Cupom';
        }
    }

    async function excluirCupom(cupomId) {
        if (!(await showConfirm('Tem certeza de que deseja excluir este cupom? Esta ação não pode ser desfeita.'))) return;

        try {
            const { error } = await supabase.from('cupons').delete().eq('id', cupomId);
            if (error) throw error;
            showToast('Cupom excluído.', 'sucesso');
            carregarCupons();
        } catch (error) {
            showToast('Não foi possível excluir o cupom.', 'erro');
        }
    }

    async function atualizarStatusCupom(cupomId, novoStatus) {
        try {
            const { error } = await supabase.from('cupons').update({ ativo: novoStatus }).eq('id', cupomId);
            if (error) throw error;

            const linha = tabelaCuponsCorpo.querySelector(`tr[data-cupom-id="${cupomId}"]`);
            if (linha) {
                const statusTextoEl = linha.querySelector('span[style*="margin-left"]');
                statusTextoEl.textContent = novoStatus ? 'Ativo' : 'Inativo';
            }

            // --- NOVA LÓGICA DE NOTIFICAÇÃO DE CUPOM DESATIVADO ---
            if (novoStatus === false) { // Se o cupom foi DESATIVADO
                const cupom = todosOsCupons.find(c => c.id == cupomId);
                if (cupom) {
                    const titulo = '👎 Cupom Desativado';
                    const mensagem = `O cupom "${cupom.codigo}" não está mais ativo.`;
                    criarRascunhoPush(titulo, mensagem, '/carrinho.html');
                }
            }
            // --- FIM DA NOVA LÓGICA ---

        } catch (error) {
            showToast('Ocorreu um erro ao atualizar o status do cupom.', 'erro');
            carregarCupons();
        }
    }

    if (btnAdicionarCupom) btnAdicionarCupom.addEventListener('click', () => abrirModalCupom());
    if (btnCupomCancelar) btnCupomCancelar.addEventListener('click', fecharModalCupom);
    if (modalCupomFechar) modalCupomFechar.addEventListener('click', fecharModalCupom);
    if (formCupom) formCupom.addEventListener('submit', salvarCupom);

    if (tabelaCuponsCorpo) {
        tabelaCuponsCorpo.addEventListener('click', (event) => {
            const linha = event.target.closest('tr');
            if (!linha) return;

            const cupomId = linha.dataset.cupomId;
            const cupom = todosOsCupons.find(c => c.id == cupomId);
            if (!cupom) return;

            if (event.target.classList.contains('btn-editar')) {
                abrirModalCupom(cupom);
            }
            if (event.target.classList.contains('btn-excluir')) {
                excluirCupom(cupomId);
            }
        });

        tabelaCuponsCorpo.addEventListener('change', (event) => {
            if (event.target.classList.contains('toggle-status-cupom')) {
                const cupomId = event.target.closest('tr').dataset.cupomId;
                const novoStatus = event.target.checked;
                atualizarStatusCupom(cupomId, novoStatus);
            }
        });
    }

    let todasAsCampanhas = [];
    let campanhaAtivaId = null;
    const tabelaCampanhasCorpo = document.getElementById('tabela-campanhas-corpo');
    const btnNovaCampanha = document.getElementById('btn-nova-campanha');
    const modalCampanha = document.getElementById('modal-campanha');
    const modalCampanhaTitulo = document.getElementById('modal-campanha-titulo');
    const modalCampanhaFechar = document.getElementById('modal-campanha-fechar');
    const btnCampanhaCancelar = document.getElementById('btn-campanha-cancelar');
    const formCampanha = document.getElementById('form-campanha');
    const btnCampanhaSalvar = document.getElementById('btn-campanha-salvar');
    const bannerUploadInput = document.getElementById('campanha-banner-upload');
    const bannerPreview = document.getElementById('campanha-banner-preview');

    const corFundoInput = document.getElementById('campanha-cor-fundo');
    const corFundoHex = document.getElementById('campanha-cor-fundo-hex');
    const corTextoInput = document.getElementById('campanha-cor-texto');
    const corTextoHex = document.getElementById('campanha-cor-texto-hex');
    const corDestaqueInput = document.getElementById('campanha-cor-destaque');
    const corDestaqueHex = document.getElementById('campanha-cor-destaque-hex');
    const validacaoContrasteEl = document.getElementById('validacao-contraste');

    function hexToRgb(hex) {
        if (!hex) hex = '#000000';
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = "0x" + hex[1] + hex[1];
            g = "0x" + hex[2] + hex[2];
            b = "0x" + hex[3] + hex[3];
        } else if (hex.length == 7) {
            r = "0x" + hex[1] + hex[2];
            g = "0x" + hex[3] + hex[4];
            b = "0x" + hex[5] + hex[6];
        }
        return [parseInt(r), parseInt(g), parseInt(b)];
    }

    function getLuminance(r, g, b) {
        const a = [r, g, b].map(function (v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrastRatio(hex1, hex2) {
        const rgb1 = hexToRgb(hex1);
        const rgb2 = hexToRgb(hex2);
        const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    function validarContraste() {
        if (!validacaoContrasteEl) return;
        const corTexto = corTextoInput.value;
        const corDestaque = corDestaqueInput.value;
        const ratio = getContrastRatio(corTexto, corDestaque);

        validacaoContrasteEl.textContent = `Contraste: ${ratio.toFixed(2)}:1 - `;
        if (ratio >= 4.5) {
            validacaoContrasteEl.textContent += "Ótimo (AA)";
            validacaoContrasteEl.style.color = "#28a745";
        } else if (ratio >= 3) {
            validacaoContrasteEl.textContent += "Aceitável (AA Large)";
            validacaoContrasteEl.style.color = "#ffc107";
        } else {
            validacaoContrasteEl.textContent += "Ruim (Reprovado)";
            validacaoContrasteEl.style.color = "#dc3545";
        }
    }

    if (corTextoInput && corDestaqueInput) {
        [corTextoInput, corDestaqueInput].forEach(input => input.addEventListener('input', validarContraste));
    }

    if (corFundoInput && corTextoInput && corDestaqueInput) {
        [corFundoInput, corTextoInput, corDestaqueInput].forEach(picker => {
            const hexInput = document.getElementById(picker.id + '-hex');
            if (hexInput) {
                hexInput.value = picker.value;
                picker.addEventListener('input', () => hexInput.value = picker.value);
                hexInput.addEventListener('input', () => picker.value = hexInput.value);
            }
        });
    }

    if (bannerUploadInput) bannerUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                bannerPreview.innerHTML = `<img src="${event.target.result}" style="width: 100%; object-fit: contain; max-height: 100px;">`;
            }
            reader.readAsDataURL(file);
        } else {
            bannerPreview.innerHTML = '';
        }
    });

    async function carregarCampanhas() {
        if (!tabelaCampanhasCorpo) return;
        tabelaCampanhasCorpo.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
        try {
            const { data: config, error: configError } = await supabase
                .from('configuracoes_site')
                .select('campanha_ativa_id')
                .limit(1)
                .single();

            if (configError && configError.code !== 'PGRST116') {
                throw configError;
            }
            campanhaAtivaId = config ? config.campanha_ativa_id : null;

            const { data: campanhas, error: campanhasError } = await supabase
                .from('campanhas')
                .select('*')
                .order('created_at', { ascending: false });

            if (campanhasError) throw campanhasError;
            todasAsCampanhas = campanhas;
            renderizarTabelaCampanhas(todasAsCampanhas, campanhaAtivaId);
        } catch (error) {
            console.error('Erro ao carregar campanhas:', error);
            tabelaCampanhasCorpo.innerHTML = '<tr><td colspan="3">Erro ao carregar campanhas.</td></tr>';
        }
    }

    function renderizarTabelaCampanhas(campanhas, idAtiva) {
        tabelaCampanhasCorpo.innerHTML = '';
        if (campanhas.length === 0) {
            tabelaCampanhasCorpo.innerHTML = '<tr><td colspan="3">Nenhuma campanha criada.</td></tr>';
            return;
        }

        campanhas.forEach(campanha => {
            const isAtiva = campanha.id === idAtiva;
            const statusHTML = isAtiva
                ? `<span style="color: var(--cor-sucesso); font-weight: bold;">Ativa</span>`
                : 'Inativa';

            const botaoAtivar = isAtiva
                ? `<button class="btn-admin btn-excluir btn-desativar-campanha" data-id="${campanha.id}">Desativar</button>`
                : `<button class="btn-admin btn-adicionar btn-ativar-campanha" data-id="${campanha.id}">Ativar</button>`;

            const linha = `
                <tr data-id="${campanha.id}">
                    <td data-label="Nome">${campanha.nome_campanha}</td>
                    <td data-label="Status">${statusHTML}</td>
                    <td data-label="Ações" class="acoes-btn">
                        ${botaoAtivar}
                        <button class="btn-admin btn-editar btn-editar-campanha" data-id="${campanha.id}">Editar</button>
                        <button class="btn-admin btn-excluir btn-excluir-campanha" data-id="${campanha.id}">Excluir</button>
                    </td>
                </tr>
            `;
            tabelaCampanhasCorpo.insertAdjacentHTML('beforeend', linha);
        });
    }

    function abrirModalCampanha(campanha = null) {
        formCampanha.reset();
        bannerPreview.innerHTML = '';
        document.getElementById('campanha-id').value = '';
        corFundoInput.value = '#1A1A1A';
        corFundoHex.value = '#1A1A1A';
        corTextoInput.value = '#1A1A1A';
        corTextoHex.value = '#1A1A1A';
        corDestaqueInput.value = '#FFA500';
        corDestaqueHex.value = '#FFA500';
        validacaoContrasteEl.textContent = '';

        if (campanha) {
            modalCampanhaTitulo.textContent = 'Editar Campanha';
            document.getElementById('campanha-id').value = campanha.id;
            document.getElementById('campanha-nome').value = campanha.nome_campanha;
            document.getElementById('campanha-aviso-deslizante').value = campanha.aviso_deslizante_texto || '';

            if (campanha.banner_url) {
                bannerPreview.innerHTML = `<img src="${campanha.banner_url}" style="width: 100%; object-fit: contain; max-height: 100px;">`;
            }

            corFundoInput.value = campanha.cor_fundo || '#1A1A1A';
            corFundoHex.value = campanha.cor_fundo || '#1A1A1A';
            corTextoInput.value = campanha.cor_texto || '#1A1A1A';
            corTextoHex.value = campanha.cor_texto || '#1A1A1A';
            corDestaqueInput.value = campanha.cor_destaque || '#FFA500';
            corDestaqueHex.value = campanha.cor_destaque || '#FFA500';
            validarContraste();
        } else {
            modalCampanhaTitulo.textContent = 'Criar Nova Campanha';
        }
        modalCampanha.classList.add('visivel');
    }

    function fecharModalCampanha() {
        modalCampanha.classList.remove('visivel');
    }

    async function salvarCampanha(event) {
        event.preventDefault();
        btnCampanhaSalvar.disabled = true;
        btnCampanhaSalvar.textContent = 'Salvando...';

        const id = document.getElementById('campanha-id').value;
        const campanhaExistente = id ? todasAsCampanhas.find(c => c.id == id) : null;
        let bannerUrlFinal = campanhaExistente ? campanhaExistente.banner_url : null;
        const arquivoBanner = bannerUploadInput.files[0];

        if (arquivoBanner) {
            const nomeArquivo = `banner-${Date.now()}-${arquivoBanner.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('banners-campanhas')
                .upload(nomeArquivo, arquivoBanner);

            if (uploadError) {
                showToast('Erro ao fazer upload do banner: ' + uploadError.message, 'erro');
                btnCampanhaSalvar.disabled = false;
                btnCampanhaSalvar.textContent = 'Salvar Campanha';
                return;
            }

            const { data: urlData } = supabase.storage.from('banners-campanhas').getPublicUrl(nomeArquivo);
            bannerUrlFinal = urlData.publicUrl;
        }

        const dadosCampanha = {
            nome_campanha: document.getElementById('campanha-nome').value,
            banner_url: bannerUrlFinal,
            aviso_deslizante_texto: document.getElementById('campanha-aviso-deslizante').value || null,
            cor_fundo: corFundoInput.value,
            cor_texto: corTextoInput.value,
            cor_destaque: corDestaqueInput.value
        };

        try {
            let error;
            if (id) {
                const { error: updateError } = await supabase.from('campanhas').update(dadosCampanha).eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('campanhas').insert([dadosCampanha]);
                error = insertError;
            }
            if (error) throw error;

            showToast(id ? 'Campanha atualizada!' : 'Campanha criada!', 'sucesso');
            fecharModalCampanha();
            carregarCampanhas();
        } catch (error) {
            showToast('Não foi possível salvar a campanha: ' + error.message, 'erro');
        } finally {
            btnCampanhaSalvar.disabled = false;
            btnCampanhaSalvar.textContent = 'Salvar Campanha';
        }
    }

    async function ativarCampanha(id) {
        if (!(await showConfirm('Tem certeza que deseja ativar esta campanha?\nQualquer outra campanha ativa será desativada.'))) return;

        try {
            const { error } = await supabase
                .from('configuracoes_site')
                .update({ campanha_ativa_id: id })
                .eq('id', 1);

            if (error && error.code === 'PGRST116') {
                const { error: insertError } = await supabase
                    .from('configuracoes_site')
                    .insert({ id: 1, campanha_ativa_id: id });
                if (insertError) throw insertError;
            } else if (error) {
                throw error;
            }

            // --- NOVA LÓGICA DE NOTIFICAÇÃO DE CAMPANHA ATIVA ---
            const campanha = todasAsCampanhas.find(c => c.id === id);
            if (campanha) {
                const titulo = '📣 Campanha Nova no Ar!';
                const mensagem = `A campanha "${campanha.nome_campanha}" está ativa! Confira as novidades no site.`;
                criarRascunhoPush(titulo, mensagem, '/'); // Link para a home
            }
            // --- FIM DA NOVA LÓGICA ---

            showToast('Campanha ativada com sucesso!', 'sucesso');
            carregarCampanhas();
        } catch (error) {
            showToast('Erro ao ativar campanha: ' + error.message, 'erro');
        }
    }

    async function desativarCampanha(id) {
        if (!(await showConfirm('Desativar esta campanha?'))) return;
        try {
            const { error } = await supabase
                .from('configuracoes_site')
                .update({ campanha_ativa_id: null })
                .eq('id', 1);
            if (error) throw error;

            showToast('Campanha desativada.', 'sucesso');
            carregarCampanhas();
        } catch (error) {
            showToast('Erro ao desativar campanha: ' + error.message, 'erro');
        }
    }

    async function excluirCampanha(id) {
        if (!(await showConfirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.'))) return;

        if (id === campanhaAtivaId) {
            await desativarCampanha(id);
        }

        try {
            const { error } = await supabase.from('campanhas').delete().eq('id', id);
            if (error) throw error;

            showToast('Campanha excluída.', 'sucesso');
            carregarCampanhas();
        } catch (error) {
            showToast('Erro ao excluir campanha: ' + error.message, 'erro');
        }
    }

    if (btnNovaCampanha) btnNovaCampanha.addEventListener('click', () => abrirModalCampanha());
    if (modalCampanhaFechar) modalCampanhaFechar.addEventListener('click', fecharModalCampanha);
    if (btnCampanhaCancelar) btnCampanhaCancelar.addEventListener('click', fecharModalCampanha);
    if (formCampanha) formCampanha.addEventListener('submit', salvarCampanha);

    if (tabelaCampanhasCorpo) tabelaCampanhasCorpo.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('btn-ativar-campanha')) {
            ativarCampanha(parseInt(id));
        }
        if (e.target.classList.contains('btn-desativar-campanha')) {
            desativarCampanha(parseInt(id));
        }
        if (e.target.classList.contains('btn-editar-campanha')) {
            const campanha = todasAsCampanhas.find(c => c.id == id);
            abrirModalCampanha(campanha);
        }
        if (e.target.classList.contains('btn-excluir-campanha')) {
            excluirCampanha(parseInt(id));
        }
    });

    const listaRascunhos = document.getElementById('lista-rascunhos');
    const formNotificacaoManual = document.getElementById('form-notificacao-manual');
    const btnEnviarNotificacao = document.getElementById('btn-enviar-notificacao');

    async function carregarRascunhosPush() {
        if (!listaRascunhos) return;
        listaRascunhos.innerHTML = '<li>Carregando rascunhos...</li>';
        try {
            const { data, error } = await supabase
                .from('notificacoes_push_queue')
                .select('*')
                .eq('status', 'rascunho')
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderizarRascunhos(data);
        } catch (error) {
            console.error('Erro ao carregar rascunhos:', error);
            listaRascunhos.innerHTML = '<li>Erro ao carregar rascunhos.</li>';
        }
    }

    function renderizarRascunhos(rascunhos) {
        listaRascunhos.innerHTML = '';
        if (rascunhos.length === 0) {
            listaRascunhos.innerHTML = '<li>Nenhum rascunho automático.</li>';
            return;
        }

        rascunhos.forEach(r => {
            const itemHTML = `
                <li class="notificacao-item" data-id="${r.id}">
                    <h4>${r.titulo}</h4>
                    <p>${r.mensagem}</p>
                    <small>Link: ${r.link_url || '/'}</small>
                    <div class="acoes-btn" style="margin-top: 10px;">
                        <button class="btn-admin btn-adicionar btn-aprovar-push" data-id="${r.id}">Aprovar e Enviar</button>
                        <button class="btn-admin btn-excluir btn-excluir-push" data-id="${r.id}">Excluir</button>
                    </div>
                </li>
            `;
            listaRascunhos.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

    /**
     * ATUALIZADO: Cria um rascunho de notificação push.
     * @param {string} titulo O título da notificação.
     * @param {string} mensagem O corpo da notificação.
     * @param {string} link O link para onde o usuário será direcionado.
     */
    async function criarRascunhoPush(titulo, mensagem, link) {
        let link_url = link || '/';

        if (!titulo || !mensagem) {
            console.error("Tentativa de criar rascunho de push sem título ou mensagem.");
            return;
        }

        try {
            const { error } = await supabase
                .from('notificacoes_push_queue')
                .insert({
                    titulo: titulo,
                    mensagem: mensagem,
                    link_url: link_url,
                    status: 'rascunho'
                });

            if (error) throw error;

            // Recarrega a lista de rascunhos para mostrar o novo item
            if (listaRascunhos) {
                carregarRascunhosPush();
            }
        } catch (error) {
            console.error('Erro ao criar rascunho de push:', error);
            // Não mostramos toast aqui para não poluir a interface do admin
        }
    }

    async function aprovarEnvioPush(id) {
        if (!(await showConfirm('Aprovar e enviar esta notificação para todos os assinantes?'))) return;

        try {
            const { error } = await supabase
                .from('notificacoes_push_queue')
                .update({ status: 'aprovado' })
                .eq('id', id);

            if (error) throw error;
            showToast('Notificação aprovada! Será enviada em breve.', 'sucesso');
            carregarRascunhosPush();
        } catch (error) {
            showToast('Erro ao aprovar notificação: ' + error.message, 'erro');
        }
    }

    async function excluirRascunhoPush(id) {
        if (!(await showConfirm('Excluir este rascunho?'))) return;
        try {
            const { error } = await supabase
                .from('notificacoes_push_queue')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Rascunho excluído.', 'sucesso');
            carregarRascunhosPush();
        } catch (error) {
            showToast('Erro ao excluir rascunho: ' + error.message, 'erro');
        }
    }

    async function enviarNotificacaoManual(event) {
        event.preventDefault();
        if (!(await showConfirm('Enviar esta notificação manual para TODOS os assinantes agora?'))) return;

        btnEnviarNotificacao.disabled = true;
        btnEnviarNotificacao.textContent = 'Enviando...';

        const titulo = document.getElementById('notificacao-titulo').value;
        const mensagem = document.getElementById('notificacao-mensagem').value;
        const link = document.getElementById('notificacao-link').value || '/';

        try {
            const { error } = await supabase
                .from('notificacoes_push_queue')
                .insert({
                    titulo: titulo,
                    mensagem: mensagem,
                    link_url: link,
                    status: 'aprovado'
                });

            if (error) throw error;

            showToast('Notificação manual enviada para a fila!', 'sucesso');
            formNotificacaoManual.reset();
        } catch (error) {
            showToast('Erro ao enviar notificação manual: ' + error.message, 'erro');
        } finally {
            btnEnviarNotificacao.disabled = false;
            btnEnviarNotificacao.textContent = 'Enviar para Todos Assinantes';
        }
    }

    if (listaRascunhos) listaRascunhos.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('btn-aprovar-push')) {
            aprovarEnvioPush(parseInt(id));
        }
        if (e.target.classList.contains('btn-excluir-push')) {
            excluirRascunhoPush(parseInt(id));
        }
    });

    if (formNotificacaoManual) formNotificacaoManual.addEventListener('submit', enviarNotificacaoManual);

    carregarProdutos();
    carregarRifas();
    carregarProdutos();
    carregarRifas();

    // --- Lógica de Categorias ---
    const tabelaCategoriasCorpo = document.getElementById('tabela-categorias-corpo');
    const btnAdicionarCategoria = document.getElementById('btn-adicionar-categoria');
    const inputNovaCategoria = document.getElementById('nova-categoria-nome');
    const selectProdutoCategoria = document.getElementById('produto-categoria');

    async function carregarCategorias() {
        if (!tabelaCategoriasCorpo) return;
        tabelaCategoriasCorpo.innerHTML = '<tr><td colspan="2">Carregando...</td></tr>';

        const { data: categorias, error } = await supabase.from('categorias').select('*').order('nome');

        if (error) {
            console.error('Erro ao carregar categorias:', error);
            tabelaCategoriasCorpo.innerHTML = '<tr><td colspan="2">Erro ao carregar.</td></tr>';
            return;
        }

        renderizarTabelaCategorias(categorias);
        atualizarSelectCategorias(categorias);
    }

    function renderizarTabelaCategorias(categorias) {
        tabelaCategoriasCorpo.innerHTML = '';
        if (categorias.length === 0) {
            tabelaCategoriasCorpo.innerHTML = '<tr><td colspan="2">Nenhuma categoria encontrada.</td></tr>';
            return;
        }

        categorias.forEach(cat => {
            const linha = `
                <tr>
                    <td>${cat.nome}</td>
                    <td>
                        <button class="btn-admin btn-excluir" onclick="excluirCategoria(${cat.id})">Excluir</button>
                    </td>
                </tr>
            `;
            tabelaCategoriasCorpo.insertAdjacentHTML('beforeend', linha);
        });
    }

    function atualizarSelectCategorias(categorias) {
        if (!selectProdutoCategoria) return;
        const valorAtual = selectProdutoCategoria.value;
        selectProdutoCategoria.innerHTML = '<option value="">Selecione uma categoria...</option>';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            selectProdutoCategoria.appendChild(option);
        });
        selectProdutoCategoria.value = valorAtual;
    }

    if (btnAdicionarCategoria) {
        btnAdicionarCategoria.addEventListener('click', async () => {
            const nome = inputNovaCategoria.value.trim();
            if (!nome) {
                showToast('Digite o nome da categoria.', 'erro');
                return;
            }

            btnAdicionarCategoria.disabled = true;
            btnAdicionarCategoria.textContent = '...';

            try {
                const { error } = await supabase.from('categorias').insert([{ nome }]);
                if (error) throw error;
                showToast('Categoria adicionada!', 'sucesso');
                inputNovaCategoria.value = '';
                carregarCategorias();
            } catch (error) {
                showToast('Erro ao adicionar categoria: ' + error.message, 'erro');
            } finally {
                btnAdicionarCategoria.disabled = false;
                btnAdicionarCategoria.textContent = 'Adicionar';
            }
        });
    }

    window.excluirCategoria = async function (id) {
        if (!(await showConfirm('Tem certeza?'))) return;
        try {
            const { error } = await supabase.from('categorias').delete().eq('id', id);
            if (error) {
                if (error.code === '23503') { // Foreign key violation
                    showToast('Não é possível excluir: Existem produtos nesta categoria.', 'erro');
                } else {
                    throw error;
                }
                return;
            }
            showToast('Categoria excluída.', 'sucesso');
            carregarCategorias();
        } catch (error) {
            showToast('Erro ao excluir categoria: ' + error.message, 'erro');
        }
    }

    // --- Lógica de Configurações ---
    const btnSalvarConfig = document.getElementById('btn-salvar-config');
    const inputDiasNovo = document.getElementById('config-dias-novo');

    async function carregarConfiguracoes() {
        if (!inputDiasNovo) return;
        const { data, error } = await supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle();
        if (data) {
            inputDiasNovo.value = data.valor;
        }
    }

    if (btnSalvarConfig) {
        btnSalvarConfig.addEventListener('click', async () => {
            const dias = inputDiasNovo.value;
            if (!dias) {
                showToast('Preencha o campo de dias.', 'erro');
                return;
            }

            btnSalvarConfig.disabled = true;
            btnSalvarConfig.textContent = 'Salvando...';

            try {
                const { error } = await supabase.from('configuracoes').upsert({ chave: 'dias_novo', valor: dias });
                if (error) throw error;
                showToast('Configurações salvas!', 'sucesso');
            } catch (error) {
                showToast('Erro ao salvar: ' + error.message, 'erro');
            } finally {
                btnSalvarConfig.disabled = false;
                btnSalvarConfig.textContent = 'Salvar Configurações';
            }
        });
    }
    carregarCupons();
    carregarCampanhas();
    carregarRascunhosPush();

    // Inicialização tardia para garantir que elementos existam
    carregarCategorias();
    carregarConfiguracoes();
});