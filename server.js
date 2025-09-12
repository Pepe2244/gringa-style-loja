// server.js (VERSÃO FINAL PARA HOSPEDAGEM)
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Importamos o cors
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000; // O Render vai nos dar a porta, ou usamos a 3000 localmente

// --- CONFIGURAÇÃO DO CLOUDINARY ---
// Coloque aqui as credenciais que você pegou no painel do Cloudinary.
cloudinary.config({
    cloud_name: 'dvkyqex1r',
    api_key: '739538816326296',
    api_secret: 'PSqjve6rLVaEIAMlmOau9Ak5UQY'
});

// Configura o multer para usar o Cloudinary como nosso "disco rígido" na nuvem
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gringa-style-produtos', // Nome da pasta que será criada no Cloudinary
        format: async (req, file) => 'jpg', // Formato padrão das imagens
        public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0], // Cria um nome de arquivo único
    },
});
const upload = multer({ storage: storage });


// --- MIDDLEWARES ---
app.use(express.json());

// ATENÇÃO: Deixe esta variável como um placeholder por enquanto.
// Vamos preenchê-la com a URL do seu site no Netlify mais tarde.
const netlifyURL = 'https://gringa-style.netlify.app';
app.use(cors({
    origin: [netlifyURL, 'http://localhost:3000', 'http://127.0.0.1:5500'] // Permite acesso do seu futuro site, localmente e via Live Server
}));

// Serve os arquivos estáticos (imagens que já estavam na pasta /imagens)
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

const produtosFilePath = path.join(__dirname, 'produtos.json');

const lerProdutos = () => {
    try {
        const data = fs.readFileSync(produtosFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("ERRO AO LER O ARQUIVO produtos.json:", error);
        throw new Error("Não foi possível ler a base de dados.");
    }
};

const escreverProdutos = (produtos) => {
    try {
        fs.writeFileSync(produtosFilePath, JSON.stringify(produtos, null, 4), 'utf8');
    } catch (error) {
        console.error("ERRO AO ESCREVER NO ARQUIVO produtos.json:", error);
        throw new Error("Não foi possível salvar na base de dados. Verifique as permissões do arquivo.");
    }
};

// --- ROTAS DA API ---

// ROTA DE UPLOAD AGORA ENVIA PARA O CLOUDINARY
app.post('/api/upload', upload.array('imagens', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }
    // Retorna as URLs seguras das imagens no Cloudinary
    const filePaths = req.files.map(file => file.path);
    res.status(200).json(filePaths);
});

// ROTA GET: Fornece a lista completa de produtos
app.get('/api/produtos', (req, res) => {
    try {
        const produtos = lerProdutos();
        res.status(200).json(produtos);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ROTA POST: Adiciona um novo produto
app.post('/api/produtos', (req, res) => {
    try {
        const produtos = lerProdutos();
        const novoProduto = req.body;
        const maxId = produtos.reduce((max, p) => p.id > max ? p.id : max, 0);
        novoProduto.id = maxId + 1;
        novoProduto.emEstoque = typeof novoProduto.emEstoque !== 'undefined' ? novoProduto.emEstoque : true;
        produtos.push(novoProduto);
        escreverProdutos(produtos);
        res.status(201).json(novoProduto);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ROTA PUT: Edita um produto existente
app.put('/api/produtos/:id', (req, res) => {
    try {
        const produtoId = parseInt(req.params.id);
        const dadosAtualizados = req.body;
        let produtos = lerProdutos();
        const produtoIndex = produtos.findIndex(p => p.id === produtoId);

        if (produtoIndex === -1) {
            return res.status(404).send('Produto não encontrado.');
        }
        produtos[produtoIndex] = { ...produtos[produtoIndex], ...dadosAtualizados };
        escreverProdutos(produtos);
        res.status(200).json(produtos[produtoIndex]);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ROTA DELETE: Remove um produto
app.delete('/api/produtos/:id', (req, res) => {
    try {
        const produtoId = parseInt(req.params.id);
        let produtos = lerProdutos();
        const produtosFiltrados = produtos.filter(p => p.id !== produtoId);

        if (produtos.length === produtosFiltrados.length) {
            return res.status(404).send('Produto não encontrado.');
        }
        escreverProdutos(produtosFiltrados);
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ROTA POST: Atualiza o status de estoque
app.post('/api/produtos/:id/estoque', (req, res) => {
    try {
        const produtoId = parseInt(req.params.id);
        const { emEstoque } = req.body;
        let produtos = lerProdutos();
        const produtoIndex = produtos.findIndex(p => p.id === produtoId);

        if (produtoIndex === -1) {
            return res.status(404).send('Produto não encontrado.');
        }
        produtos[produtoIndex].emEstoque = emEstoque;
        escreverProdutos(produtos);
        res.status(200).json(produtos[produtoIndex]);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});