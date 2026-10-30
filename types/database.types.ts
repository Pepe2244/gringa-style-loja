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
                    slug: string
                    descricao: string
                    preco: number
                    preco_promocional: number | null
                    preco_pix: number | null
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
                    slug: string
                    descricao: string
                    preco: number
                    preco_promocional?: number | null
                    preco_pix?: number | null
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
                    slug?: string
                    descricao?: string
                    preco?: number
                    preco_promocional?: number | null
                    preco_pix?: number | null
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
            campanhas: {
                Row: {
                    id: number
                    created_at: string
                    nome_campanha: string
                    banner_url: string | null
                    aviso_deslizante_texto: string | null
                    cor_fundo: string
                    cor_texto: string
                    cor_destaque: string
                }
                Insert: {
                    id?: number
                    created_at?: string
                    nome_campanha: string
                    banner_url?: string | null
                    aviso_deslizante_texto?: string | null
                    cor_fundo?: string
                    cor_texto?: string
                    cor_destaque?: string
                }
                Update: {
                    id?: number
                    created_at?: string
                    nome_campanha?: string
                    banner_url?: string | null
                    aviso_deslizante_texto?: string | null
                    cor_fundo?: string
                    cor_texto?: string
                    cor_destaque?: string
                }
            }
            configuracoes_site: {
                Row: {
                    id: number
                    campanha_ativa_id: number | null
                }
                Insert: {
                    id?: number
                    campanha_ativa_id?: number | null
                }
                Update: {
                    id?: number
                    campanha_ativa_id?: number | null
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
                    preco_numero_desconto_quantidade: number | null
                    preco_numero_desconto: number | null
                    total_numeros: number
                    status: 'ativa' | 'finalizada' | 'cancelada'
                    imagem_premio_url: string | null
                    data_sorteio: string | null
                    numeros_vendidos: number[] | null
                    numeros_reservados: number[] | null
                    numero_vencedor: number | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    nome_premio: string
                    descricao: string
                    preco_numero: number
                    preco_numero_desconto_quantidade?: number | null
                    preco_numero_desconto?: number | null
                    total_numeros: number
                    status?: 'ativa' | 'finalizada' | 'cancelada'
                    imagem_premio_url?: string | null
                    data_sorteio?: string | null
                    numeros_vendidos?: number[] | null
                    numeros_reservados?: number[] | null
                    numero_vencedor?: number | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    nome_premio?: string
                    descricao?: string
                    preco_numero?: number
                    preco_numero_desconto_quantidade?: number | null
                    preco_numero_desconto?: number | null
                    total_numeros?: number
                    status?: 'ativa' | 'finalizada' | 'cancelada'
                    imagem_premio_url?: string | null
                    data_sorteio?: string | null
                    numeros_vendidos?: number[] | null
                    numeros_reservados?: number[] | null
                    numero_vencedor?: number | null
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
                    vencedor_telefone: string | null
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
                    vencedor_telefone?: string | null
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
                    vencedor_telefone?: string | null
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
            cupons: {
                Row: {
                    id: number
                    created_at: string
                    codigo: string
                    tipo_desconto: 'percentual' | 'fixo'
                    valor_desconto: number
                    ativo: boolean
                    valor_minimo_pedido: number | null
                    data_validade: string | null
                    quantidade_usos: number
                    limite_usos: number | null
                    tipo_aplicacao?: string | null
                    produtos_aplicaveis?: number[] | null
                    metodo_pagamento_restrito?: string | null
                    limite_uso?: number | null
                    usos_atuais?: number | null
                    valor_minimo?: number | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    codigo: string
                    tipo_desconto: 'percentual' | 'fixo'
                    valor_desconto: number
                    ativo?: boolean
                    valor_minimo_pedido?: number | null
                    data_validade?: string | null
                    quantidade_usos?: number
                    limite_usos?: number | null
                    tipo_aplicacao?: string | null
                    produtos_aplicaveis?: number[] | null
                    metodo_pagamento_restrito?: string | null
                    limite_uso?: number | null
                    usos_atuais?: number | null
                    valor_minimo?: number | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    codigo?: string
                    tipo_desconto?: 'percentual' | 'fixo'
                    valor_desconto?: number
                    ativo?: boolean
                    valor_minimo_pedido?: number | null
                    data_validade?: string | null
                    quantidade_usos?: number
                    limite_usos?: number | null
                    tipo_aplicacao?: string | null
                    produtos_aplicaveis?: number[] | null
                    metodo_pagamento_restrito?: string | null
                    limite_uso?: number | null
                    usos_atuais?: number | null
                    valor_minimo?: number | null
                }
            }
            analytics_sessions: {
                Row: {
                    id: number
                    session_id: string
                    created_at: string
                    start_time: string
                    end_time: string
                    duration: number
                    page_views: number
                    user_agent: string
                    referrer: string
                    device_type: string
                    screen_resolution: string
                    timezone: string
                }
                Insert: {
                    id?: number
                    session_id: string
                    created_at?: string
                    start_time: string
                    end_time: string
                    duration: number
                    page_views: number
                    user_agent: string
                    referrer: string
                    device_type: string
                    screen_resolution: string
                    timezone: string
                }
                Update: {
                    id?: number
                    session_id?: string
                    created_at?: string
                    start_time?: string
                    end_time?: string
                    duration?: number
                    page_views?: number
                    user_agent?: string
                    referrer?: string
                    device_type?: string
                    screen_resolution?: string
                    timezone?: string
                }
            }
            analytics_events: {
                Row: {
                    id: number
                    session_id: string
                    event_type: string
                    event_category: string
                    event_action: string
                    event_label: string | null
                    event_value: number
                    custom_parameters: Json
                    timestamp: string
                    created_at: string
                }
                Insert: {
                    id?: number
                    session_id: string
                    event_type: string
                    event_category: string
                    event_action: string
                    event_label?: string | null
                    event_value?: number
                    custom_parameters?: Json
                    timestamp?: string
                    created_at?: string
                }
                Update: {
                    id?: number
                    session_id?: string
                    event_type?: string
                    event_category?: string
                    event_action?: string
                    event_label?: string | null
                    event_value?: number
                    custom_parameters?: Json
                    timestamp?: string
                    created_at?: string
                }
            }
            analytics_daily_metrics: {
                Row: {
                    id: number
                    date: string
                    total_sessions: number
                    total_page_views: number
                    total_duration: number
                    unique_users: number
                    bounce_rate: number
                    device_types: Json
                    top_pages: Json
                    conversion_rate: number
                    avg_session_duration: number
                    total_revenue: number
                }
                Insert: {
                    id?: number
                    date: string
                    total_sessions?: number
                    total_page_views?: number
                    total_duration?: number
                    unique_users?: number
                    bounce_rate?: number
                    device_types?: Json
                    top_pages?: Json
                    conversion_rate?: number
                    avg_session_duration?: number
                    total_revenue?: number
                }
                Update: {
                    id?: number
                    date?: string
                    total_sessions?: number
                    total_page_views?: number
                    total_duration?: number
                    unique_users?: number
                    bounce_rate?: number
                    device_types?: Json
                    top_pages?: Json
                    conversion_rate?: number
                    avg_session_duration?: number
                    total_revenue?: number
                }
            }
            b2b_assets: {
                Row: {
                    id: number
                    created_at: string
                    titulo: string
                    descricao: string | null
                    tipo: string
                    url: string
                    tamanho_bytes: number | null
                    ordem: number
                    section?: string | null
                    title?: string | null
                    secondary_url?: string | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    titulo?: string
                    descricao?: string | null
                    tipo?: string
                    url: string
                    tamanho_bytes?: number | null
                    ordem?: number
                    section?: string | null
                    title?: string | null
                    secondary_url?: string | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    titulo?: string
                    descricao?: string | null
                    tipo?: string
                    url?: string
                    tamanho_bytes?: number | null
                    ordem?: number
                    section?: string | null
                    title?: string | null
                    secondary_url?: string | null
                }
            }
            push_subscriptions: {
                Row: {
                    id: number
                    endpoint: string
                    auth: string
                    p256dh: string
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    endpoint: string
                    auth: string
                    p256dh: string
                    user_agent?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    endpoint?: string
                    auth?: string
                    p256dh?: string
                    user_agent?: string | null
                    created_at?: string
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
            admin_draw_raffle_winner: {
                Args: {
                    p_rifa_id: number
                    p_premio_id: number
                }
                Returns: Record<string, unknown>
            }
            admin_set_raffle_winner_by_number: {
                Args: {
                    p_rifa_id: number
                    p_premio_id: number
                    p_numero: number
                }
                Returns: Record<string, unknown>
            }
            admin_update_participant_status: {
                Args: {
                    p_rifa_id: number
                    p_participante_id: number
                    p_status: string
                }
                Returns: void
            }
            admin_save_raffle_with_prizes: {
                Args: {
                    p_raffle: Record<string, unknown>
                    p_prizes: Record<string, unknown>[]
                }
                Returns: number
            }
            admin_delete_raffle: {
                Args: {
                    p_rifa_id: number
                }
                Returns: void
            }
            increment_daily_metrics: {
                Args: {
                    p_date: string
                    p_is_new_session: boolean
                    p_page_views: number
                    p_duration: number
                    p_device_type: string
                    p_has_conversion: boolean
                    p_pages: string[]
                }
                Returns: void
            }
            increment_coupon_usage: {
                Args: {
                    p_codigo: string
                }
                Returns: {
                    success: boolean
                    error?: string
                    count?: number
                }
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}