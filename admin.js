// admin.js (VERSÃO FINAL COM CORREÇÃO DE UPLOAD E ERRO DETALHADO)
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://gringa-style-backend.onrender.com';

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

    async function carregarProdutos() {
        try {
            const response = await fetch(`${API_URL}/api/produtos`);
            if (!response.ok) throw new Error('Falha ao buscar produtos.');
            todosOsProdutos = await response.json();
            renderizarTabela(todosOsProdutos);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            tabelaCorpo.innerHTML = '<tr><td colspan="4">Erro ao carregar produtos. Verifique se o servidor está rodando.</td></tr>';
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
            } else {
                document.getElementById('imagens-atuais-preview').textContent = 'Nenhuma imagem cadastrada.';
            }

            if (produto.video) {
                document.getElementById('video-atual-preview').innerHTML = `<video src="${produto.video}" width="150" controls style="border-radius: 4px;"></video>`;
            } else {
                document.getElementById('video-atual-preview').textContent = 'Nenhum vídeo cadastrado.';
            }

        } else {
            modalTitulo.textContent = 'Adicionar Novo Produto';
            document.getElementById('produto-id').value = '';
            document.getElementById('imagens-atuais-preview').textContent = 'Nenhuma imagem cadastrada.';
            document.getElementById('video-atual-preview').textContent = 'Nenhum vídeo cadastrado.';
        }
        modalContainer.classList.add('visivel');
    }

    function fecharModal() {
        modalContainer.classList.remove('visivel');
    }

    async function salvarProduto(event) {
        event.preventDefault();

        const id = document.getElementById('produto-id').value;
        const inputMedia = document.getElementById('produto-media-upload');
        let newImages = [];
        let newVideo = null;

        // 1. FAZ O UPLOAD DOS NOVOS ARQUIVOS (SE HOUVER)
        if (inputMedia.files.length > 0) {
            const formData = new FormData();
            for (const file of inputMedia.files) {
                formData.append('media', file);
            }
            try {
                const responseUpload = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData
                });

                // Tenta ler a resposta como JSON, mesmo se for um erro
                const responseData = await responseUpload.json();

                if (!responseUpload.ok) {
                    // Se a resposta não foi OK, lança um erro com a mensagem do servidor
                    throw new Error(responseData.error || 'Falha no upload dos arquivos.');
                }

                // Processa a resposta para separar imagens e vídeos
                responseData.forEach(file => {
                    if (file.type === 'image') {
                        newImages.push(file.url);
                    } else if (file.type === 'video') {
                        newVideo = file.url;
                    }
                });

            } catch (error) {
                // *** MUDANÇA PRINCIPAL AQUI: EXIBE O ERRO DETALHADO ***
                console.error('Erro no upload:', error);
                alert(`Não foi possível fazer o upload.\n\nDetalhes do erro: ${error.message}`);
                return;
            }
        }

        // 2. MONTA O OBJETO DO PRODUTO PARA SALVAR
        const produtoData = {
            nome: document.getElementById('produto-nome').value,
            preco: parseFloat(document.getElementById('produto-preco').value),
            descricao: document.getElementById('produto-descricao').value,
            imagens: [],
            video: null
        };

        // 3. LÓGICA PARA MANTER OU SUBSTITUIR MÍDIAS
        const produtoExistente = id ? todosOsProdutos.find(p => p.id == id) : null;
        produtoData.imagens = newImages.length > 0 ? newImages : (produtoExistente ? produtoExistente.imagens : []);
        produtoData.video = newVideo ? newVideo : (produtoExistente ? produtoExistente.video : null);

        // 4. ENVIA OS DADOS PARA O SERVIDOR (CRIAR OU ATUALIZAR)
        const url = id ? `${API_URL}/api/produtos/${id}` : `${API_URL}/api/produtos`;
        const method = id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Falha na requisição com status ${response.status}`);
            }

            fecharModal();
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert(`Não foi possível salvar o produto.\n\nDetalhes: ${error.message}`);
        }
    }

    async function excluirProduto(id) {
        if (!confirm('Tem certeza de que deseja excluir este produto? A ação não pode ser desfeita.')) {
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/produtos/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao excluir o produto.');
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Não foi possível excluir o produto.');
        }
    }

    async function atualizarEstoque(id, novoStatus) {
        try {
            const response = await fetch(`${API_URL}/api/produtos/${id}/estoque`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emEstoque: novoStatus }),
            });
            if (!response.ok) throw new Error('Falha ao atualizar o estoque.');
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao atualizar estoque:', error);
            alert('Ocorreu um erro na comunicação com o servidor.');
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