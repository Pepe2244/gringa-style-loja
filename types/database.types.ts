export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            produtos: {
                Row: {
                    id: number
                    created_at: string
                    nome: string
                    descricao: string
                    preco: number
                    preco_promocional: number | null
                    categoria_id: number | null
                    tags: string[] | null
                    em_estoque: boolean
                    imagens: string[] | null
                    media_urls: string[] | null
                    video: string | null
                    variants: Json | null
                    produtos_relacionados_ids: number[] | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    nome: string
                    descricao: string
                    preco: number
                    preco_promocional?: number | null
                    categoria_id?: number | null
                    tags?: string[] | null
                    em_estoque?: boolean
                    imagens?: string[] | null
                    media_urls?: string[] | null
                    video?: string | null
                    variants?: Json | null
                    produtos_relacionados_ids?: number[] | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    nome?: string
                    descricao?: string
                    preco?: number
                    preco_promocional?: number | null
                    categoria_id?: number | null
                    tags?: string[] | null
                    em_estoque?: boolean
                    imagens?: string[] | null
                    media_urls?: string[] | null
                    video?: string | null
                    variants?: Json | null
                    produtos_relacionados_ids?: number[] | null
                }
            }
            categorias: {
                Row: {
                    id: number
                    created_at: string
                    nome: string
                }
                Insert: {
                    id?: number
                    created_at?: string
                    nome: string
                }
                Update: {
                    id?: number
                    created_at?: string
                    nome?: string
                }
            }
            rifas: {
                Row: {
                    id: number
                    created_at: string
                    nome_premio: string
                    descricao: string
                    preco_numero: number
                    total_numeros: number
                    status: 'ativa' | 'finalizada' | 'cancelada'
                    imagem_premio_url: string | null
                    data_sorteio: string | null
                    numeros_vendidos: number[] | null
                    numeros_reservados: number[] | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    nome_premio: string
                    descricao: string
                    preco_numero: number
                    total_numeros: number
                    status?: 'ativa' | 'finalizada' | 'cancelada'
                    imagem_premio_url?: string | null
                    data_sorteio?: string | null
                    numeros_vendidos?: number[] | null
                    numeros_reservados?: number[] | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    nome_premio?: string
                    descricao?: string
                    preco_numero?: number
                    total_numeros?: number
                    status?: 'ativa' | 'finalizada' | 'cancelada'
                    imagem_premio_url?: string | null
                    data_sorteio?: string | null
                    numeros_vendidos?: number[] | null
                    numeros_reservados?: number[] | null
                }
            }
            participantes_rifa: {
                Row: {
                    id: number
                    created_at: string
                    rifa_id: number
                    nome: string
                    telefone: string
                    numeros_escolhidos: number[]
                    status_pagamento: 'pendente' | 'pago' | 'cancelado'
                    total_pago: number
                }
                Insert: {
                    id?: number
                    created_at?: string
                    rifa_id: number
                    nome: string
                    telefone: string
                    numeros_escolhidos: number[]
                    status_pagamento?: 'pendente' | 'pago' | 'cancelado'
                    total_pago: number
                }
                Update: {
                    id?: number
                    created_at?: string
                    rifa_id?: number
                    nome?: string
                    telefone?: string
                    numeros_escolhidos?: number[]
                    status_pagamento?: 'pendente' | 'pago' | 'cancelado'
                    total_pago?: number
                }
            }
            premios: {
                Row: {
                    id: number
                    created_at: string
                    rifa_id: number
                    ordem: number
                    descricao: string
                    imagem_url: string | null
                    vencedor_nome: string | null
                    vencedor_numero: number | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    rifa_id: number
                    ordem: number
                    descricao: string
                    imagem_url?: string | null
                    vencedor_nome?: string | null
                    vencedor_numero?: number | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    rifa_id?: number
                    ordem?: number
                    descricao?: string
                    imagem_url?: string | null
                    vencedor_nome?: string | null
                    vencedor_numero?: number | null
                }
            }
            configuracoes: {
                Row: {
                    id: number
                    created_at: string
                    chave: string
                    valor: string
                    descricao: string | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    chave: string
                    valor: string
                    descricao?: string | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    chave?: string
                    valor?: string
                    descricao?: string | null
                }
            }
            notificacoes_push_queue: {
                Row: {
                    id: number
                    created_at: string
                    titulo: string
                    mensagem: string
                    link_url: string | null
                    status: 'rascunho' | 'enviada' | 'falha'
                }
                Insert: {
                    id?: number
                    created_at?: string
                    titulo: string
                    mensagem: string
                    link_url?: string | null
                    status?: 'rascunho' | 'enviada' | 'falha'
                }
                Update: {
                    id?: number
                    created_at?: string
                    titulo?: string
                    mensagem?: string
                    link_url?: string | null
                    status?: 'rascunho' | 'enviada' | 'falha'
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            reservar_numeros_rifa: {
                Args: {
                    id_rifa_param: number
                    numeros_escolhidos_param: number[]
                    nome_cliente_param: string
                    telefone_param: string
                }
                Returns: {
                    participante_id: number
                    status: string
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
