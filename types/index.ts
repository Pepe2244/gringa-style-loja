export interface Product {
    id: number;
    nome: string;
    descricao: string;
    preco: number;
    preco_promocional?: number;
    emEstoque: boolean;
    media_urls?: string[];
    imagens?: string[]; // Legacy support
    video?: string;
    categoria_id?: number;
    tags?: string[];
    created_at?: string;
    variants?: {
        tipo: string;
        opcoes: string[];
    };
}

export interface Category {
    id: number;
    nome: string;
}

export interface CartItem {
    produto_id: number;
    quantidade: number;
    variante?: {
        tipo: string;
        opcao: string;
    } | null;
}

export interface Rifa {
    id: number;
    nome_premio: string;
    descricao: string;
    preco_numero: number;
    total_numeros: number;
    imagem_premio_url: string;
    status: 'ativa' | 'finalizada' | 'cancelada';
    numeros_vendidos: number[];
    numeros_reservados: number[];
    data_sorteio?: string;
    ganhador_numero?: number;
    ganhador_nome?: string;
}

export interface Premio {
    id: number;
    rifa_id: number;
    ordem: number;
    descricao: string;
    imagem_url?: string;
    vencedor_nome?: string;
    vencedor_numero?: number;
    ganhador_nome?: string; // Legacy support
    ganhador_numero?: number; // Legacy support
}
