document.addEventListener('DOMContentLoaded', () => {
    const senhaCorreta = "gringa123";
    let senha = prompt("Digite a senha de administrador para acessar o painel:");

    if (senha !== senhaCorreta) {
        alert("Senha incorreta! Acesso negado.");
        document.body.innerHTML = "<h1 style='color: white; text-align: center; margin-top: 50px;'>Acesso Negado</h1>";
        return;
    }

    let todosOsProdutos = [];
    const tabelaCorpo = document.getElementById('tabela-estoque-corpo');
    const modalContainer = document.getElementById('modal-produto');
    const modalTitulo = document.getElementById('modal-titulo-form');
    const formProduto = document.getElementById('form-produto');
    const btnAdicionarNovo = document.getElementById('btn-adicionar-novo');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnFecharModal = document.getElementById('modal-fechar');
    const btnSalvar = document.getElementById('btn-salvar');

    async function carregarProdutos() {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar';
        try {
            const { data, error } = await supabase.from('produtos').select('*').order('id');
            if (error) throw error;
            todosOsProdutos = data;
            renderizarTabela(todosOsProdutos);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            tabelaCorpo.innerHTML = '<tr><td colspan="4">Erro ao carregar produtos. Verifique o console.</td></tr>';
        }
    }

    function renderizarTabela(produtos) {
        tabelaCorpo.innerHTML = '';
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
            tabelaCorpo.insertAdjacentHTML('beforeend', linha);
        });
    }

    function abrirModal(produto = null) {
        formProduto.reset();
        document.getElementById('imagens-atuais-preview').innerHTML = '';
        document.getElementById('video-atual-preview').innerHTML = '';

        if (produto) {
            modalTitulo.textContent = 'Editar Produto';
            document.getElementById('produto-id').value = produto.id;
            document.getElementById('produto-nome').value = produto.nome;
            document.getElementById('produto-preco').value = produto.preco;
            document.getElementById('produto-descricao').value = produto.descricao;

            if (produto.imagens && produto.imagens.length > 0) {
                const previewHTML = produto.imagens.map(img => `<img src="${img}" width="70" style="margin-right: 5px; border-radius: 4px;">`).join('');
                document.getElementById('imagens-atuais-preview').innerHTML = previewHTML;
            }
            if (produto.video) {
                document.getElementById('video-atual-preview').innerHTML = `<video src="${produto.video}" width="150" controls style="border-radius: 4px;"></video>`;
            }
        } else {
            modalTitulo.textContent = 'Adicionar Novo Produto';
            document.getElementById('produto-id').value = '';
        }
        modalContainer.classList.add('visivel');
    }

    function fecharModal() {
        modalContainer.classList.remove('visivel');
    }

    async function salvarProduto(event) {
        event.preventDefault();
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const id = document.getElementById('produto-id').value;
        const inputMedia = document.getElementById('produto-media-upload');
        let newImageUrls = [];
        let newVideoUrl = null;

        if (inputMedia.files.length > 0) {
            for (const file of inputMedia.files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('gringa-style-produtos')
                    .upload(filePath, file);

                if (uploadError) {
                    alert(`Erro no upload: ${uploadError.message}`);
                    console.error('Erro no upload:', uploadError);
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Salvar';
                    return;
                }

                const { data } = supabase.storage
                    .from('gringa-style-produtos')
                    .getPublicUrl(filePath);

                const publicUrl = data.publicUrl;

                if (file.type.startsWith('image/')) {
                    newImageUrls.push(publicUrl);
                } else if (file.type.startsWith('video/')) {
                    newVideoUrl = publicUrl;
                }
            }
        }

        const produtoData = {
            nome: document.getElementById('produto-nome').value,
            preco: parseFloat(document.getElementById('produto-preco').value),
            descricao: document.getElementById('produto-descricao').value,
        };

        const produtoExistente = id ? todosOsProdutos.find(p => p.id == id) : null;

        if (newImageUrls.length > 0 || newVideoUrl) {
            produtoData.imagens = newImageUrls;
            produtoData.video = newVideoUrl;
        } else if (produtoExistente) {
            produtoData.imagens = produtoExistente.imagens;
            produtoData.video = produtoExistente.video;
        } else {
            produtoData.imagens = [];
            produtoData.video = null;
        }

        try {
            let error;
            if (id) {
                const { error: updateError } = await supabase
                    .from('produtos')
                    .update(produtoData)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('produtos')
                    .insert([produtoData]);
                error = insertError;
            }

            if (error) throw error;

            fecharModal();
            carregarProdutos();

        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert(`Não foi possível salvar o produto.\n\nDetalhes: ${error.message}`);
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar';
        }
    }

    async function excluirProduto(id) {
        if (!confirm('Tem certeza de que deseja excluir este produto?')) return;
        try {
            const { error } = await supabase.from('produtos').delete().eq('id', id);
            if (error) throw error;
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Não foi possível excluir o produto.');
        }
    }

    async function atualizarEstoque(id, novoStatus) {
        try {
            const { error } = await supabase
                .from('produtos')
                .update({ emEstoque: novoStatus })
                .eq('id', id);
            if (error) throw error;
            const linha = tabelaCorpo.querySelector(`tr[data-id="${id}"]`);
            if (linha) {
                linha.querySelector('td[data-label="Status"]').textContent = novoStatus ? "Em Estoque" : "Fora de Estoque";
            }
        } catch (error) {
            console.error('Erro ao atualizar estoque:', error);
            alert('Ocorreu um erro na comunicação com o servidor.');
            carregarProdutos();
        }
    }

    btnAdicionarNovo.addEventListener('click', () => abrirModal());
    btnCancelar.addEventListener('click', fecharModal);
    btnFecharModal.addEventListener('click', fecharModal);
    formProduto.addEventListener('submit', salvarProduto);

    tabelaCorpo.addEventListener('click', (event) => {
        const linha = event.target.closest('tr');
        if (!linha) return;
        const id = parseInt(linha.dataset.id);
        const produto = todosOsProdutos.find(p => p.id === id);

        if (event.target.classList.contains('btn-editar')) {
            abrirModal(produto);
        }
        if (event.target.classList.contains('btn-excluir')) {
            excluirProduto(id);
        }
        if (event.target.classList.contains('toggle-estoque')) {
            const novoStatus = event.target.checked;
            atualizarEstoque(id, novoStatus);
        }
    });

    carregarProdutos();
});