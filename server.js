const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
    cloud_name: 'dvkyqex1r',
    api_key: '739538816326296',
    api_secret: 'PSqjve6rLVaEIAMlmOau9Ak5UQY'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gringa-style-produtos',
        resource_type: 'auto',
        public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0],
    },
    transformation: function (req, file) {
        if (file.mimetype.startsWith('video')) {
            return {
                width: 800,
                quality: "auto:good",
                crop: "limit",
                fetch_format: "auto",
                audio_codec: "none"
            };
        } else if (file.mimetype.startsWith('image')) {
            return {
                width: 800,
                quality: "auto",
                fetch_format: "auto",
                crop: "limit"
            };
        }
    }
});
const upload = multer({ storage: storage });

const allowedOrigins = [
    'https://gringa-style.netlify.app',
    'https://68c4735049234f000822595d--gringa-style.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/imagens', express.static(path.join(__dirname, 'imagens')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

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
        throw new Error("Não foi possível salvar na base de dados.");
    }
};

app.post('/api/upload', (req, res) => {
    const uploader = upload.array('media', 10);

    uploader(req, res, function (err) {
        if (err) {
            console.error("Erro no upload para o Cloudinary:", err.message);
            return res.status(500).json({
                success: false,
                message: 'Falha no upload para o Cloudinary.',
                error: err.message
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo foi enviado.' });
        }

        const filesInfo = req.files.map(file => ({
            url: file.path,
            type: file.mimetype.split('/')[0]
        }));

        res.status(200).json(filesInfo);
    });
});

app.get('/api/produtos', (req, res) => {
    try {
        const produtos = lerProdutos();
        res.status(200).json(produtos);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

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
    console.log(`Servidor rodando na porta ${PORT}`);
});