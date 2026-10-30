
BEGIN;

-- ------------------------------------------------------------------------------
-- 1. EXTENSÕES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABELAS DO SISTEMA
-- ------------------------------------------------------------------------------

-- Categorias de Produtos
CREATE TABLE IF NOT EXISTS public.categorias (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    nome TEXT NOT NULL UNIQUE
);

-- Catálogo de Produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    preco_promocional NUMERIC(10,2),
    preco_pix NUMERIC(10,2),
    categoria_id BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    em_estoque BOOLEAN NOT NULL DEFAULT true,
    imagens TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    video TEXT,
    variants JSONB,
    produtos_relacionados_ids BIGINT[] DEFAULT '{}'
);

-- Campanhas de Marketing e Banners
CREATE TABLE IF NOT EXISTS public.campanhas (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    nome_campanha TEXT NOT NULL,
    banner_url TEXT,
    aviso_deslizante_texto TEXT,
    cor_fundo TEXT NOT NULL DEFAULT '#000000',
    cor_texto TEXT NOT NULL DEFAULT '#ffffff',
    cor_destaque TEXT NOT NULL DEFAULT '#d97706'
);

-- Configurações Gerais do Site
CREATE TABLE IF NOT EXISTS public.configuracoes_site (
    id BIGSERIAL PRIMARY KEY,
    campanha_ativa_id BIGINT REFERENCES public.campanhas(id) ON DELETE SET NULL
);

-- Configurações do Sistema em Chave-Valor
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao TEXT
);

-- Sistema de Rifas
CREATE TABLE IF NOT EXISTS public.rifas (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    nome_premio TEXT NOT NULL,
    descricao TEXT NOT NULL,
    preco_numero NUMERIC(10,2) NOT NULL,
    preco_numero_desconto_quantidade INTEGER,
    preco_numero_desconto NUMERIC(10,2),
    total_numeros INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'finalizada', 'cancelada')),
    imagem_premio_url TEXT,
    data_sorteio TIMESTAMPTZ,
    numeros_vendidos INTEGER[] DEFAULT '{}',
    numeros_reservados INTEGER[] DEFAULT '{}',
    numero_vencedor INTEGER
);

-- Prêmios das Rifas (Suporta múltiplos prêmios por rifa)
CREATE TABLE IF NOT EXISTS public.premios (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    rifa_id BIGINT NOT NULL REFERENCES public.rifas(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL DEFAULT 1,
    descricao TEXT NOT NULL,
    imagem_url TEXT,
    vencedor_nome TEXT,
    vencedor_numero INTEGER,
    vencedor_telefone TEXT
);

-- Participantes e Reservas de Rifas
CREATE TABLE IF NOT EXISTS public.participantes_rifa (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    rifa_id BIGINT NOT NULL REFERENCES public.rifas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    numeros_escolhidos INTEGER[] NOT NULL DEFAULT '{}',
    status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado')),
    total_pago NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Cupons de Desconto
CREATE TABLE IF NOT EXISTS public.cupons (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    codigo TEXT NOT NULL UNIQUE,
    tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('percentual', 'fixo')),
    valor_desconto NUMERIC(10,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    valor_minimo_pedido NUMERIC(10,2),
    data_validade TIMESTAMPTZ,
    quantidade_usos INTEGER NOT NULL DEFAULT 0,
    limite_usos INTEGER,
    limite_uso INTEGER,
    usos_atuais INTEGER NOT NULL DEFAULT 0,
    valor_minimo NUMERIC(10,2),
    tipo_aplicacao TEXT DEFAULT 'total',
    produtos_aplicaveis BIGINT[] DEFAULT '{}',
    metodo_pagamento_restrito TEXT
);

-- B2B Assets (Mídias e Banners de Serviços B2B / Soldas Especiais)
CREATE TABLE IF NOT EXISTS public.b2b_assets (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    titulo TEXT,
    descricao TEXT,
    tipo TEXT,
    url TEXT NOT NULL,
    tamanho_bytes BIGINT,
    ordem INTEGER DEFAULT 0,
    section TEXT,
    title TEXT,
    secondary_url TEXT
);

-- Pedidos da Loja
CREATE TABLE IF NOT EXISTS public.pedidos (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    codigo_pedido TEXT UNIQUE,
    cliente_nome TEXT NOT NULL,
    cliente_email TEXT,
    cliente_telefone TEXT NOT NULL,
    endereco_entrega JSONB,
    itens JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    desconto NUMERIC(10,2) DEFAULT 0,
    frete NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    metodo_pagamento TEXT NOT NULL,
    status_pagamento TEXT NOT NULL DEFAULT 'pendente',
    cupom_aplicado TEXT
);

-- Fila de Notificações Web Push
CREATE TABLE IF NOT EXISTS public.notificacoes_push_queue (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    link_url TEXT,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aprovado', 'enviada', 'falha')),
    enviado_em TIMESTAMPTZ,
    erro_log TEXT
);

-- Inscrições Web Push (Navegadores de Usuários)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    auth TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sessões de Analytics
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    page_views INTEGER NOT NULL DEFAULT 1,
    user_agent TEXT,
    referrer TEXT,
    device_type TEXT,
    screen_resolution TEXT,
    timezone TEXT
);

-- Eventos de Analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES public.analytics_sessions(session_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_label TEXT,
    event_value NUMERIC(10,2) DEFAULT 0,
    custom_parameters JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Métricas Agregadas Diárias de Analytics
CREATE TABLE IF NOT EXISTS public.analytics_daily_metrics (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_page_views INTEGER NOT NULL DEFAULT 0,
    total_duration NUMERIC NOT NULL DEFAULT 0,
    unique_users INTEGER NOT NULL DEFAULT 0,
    bounce_rate NUMERIC NOT NULL DEFAULT 0,
    device_types JSONB NOT NULL DEFAULT '{}'::jsonb,
    top_pages JSONB NOT NULL DEFAULT '{}'::jsonb,
    conversion_rate NUMERIC NOT NULL DEFAULT 0,
    avg_session_duration NUMERIC NOT NULL DEFAULT 0,
    total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE E INTEGRIDADE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON public.produtos(slug);
CREATE INDEX IF NOT EXISTS idx_produtos_em_estoque ON public.produtos(em_estoque);
CREATE INDEX IF NOT EXISTS idx_rifas_status ON public.rifas(status);
CREATE INDEX IF NOT EXISTS idx_premios_rifa_id ON public.premios(rifa_id, ordem);
CREATE INDEX IF NOT EXISTS idx_participantes_rifa ON public.participantes_rifa(rifa_id, status_pagamento);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_queue_status ON public.notificacoes_push_queue(status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

-- ------------------------------------------------------------------------------
-- 4. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'produtos',
        'categorias',
        'campanhas',
        'configuracoes_site',
        'configuracoes',
        'rifas',
        'premios',
        'b2b_assets',
        'cupons',
        'participantes_rifa',
        'notificacoes_push_queue',
        'pedidos',
        'analytics_sessions',
        'analytics_events',
        'analytics_daily_metrics',
        'push_subscriptions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        END IF;
    END LOOP;
END
$$;

-- ------------------------------------------------------------------------------
-- 5. CONTROLE DE PRIVILÉGIOS (LEAST PRIVILEGE) E POLÍTICAS RLS
-- ------------------------------------------------------------------------------

-- 5.1 Revoga privilégios excessivos e concede controle total ao service_role
DO $$
DECLARE
    tbl text;
    all_tables text[] := ARRAY[
        'produtos', 'categorias', 'campanhas', 'configuracoes_site', 'configuracoes',
        'rifas', 'premios', 'b2b_assets', 'cupons', 'participantes_rifa',
        'notificacoes_push_queue', 'pedidos', 'analytics_sessions', 'analytics_events',
        'analytics_daily_metrics', 'push_subscriptions'
    ];
BEGIN
    FOREACH tbl IN ARRAY all_tables LOOP
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', tbl);
            EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', tbl);
        END IF;
    END LOOP;
END
$$;

-- Permite uso das sequências pelo service_role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5.2 Concessão de leitura pública (SELECT) apenas para tabelas do catálogo público
DO $$
DECLARE
    tbl text;
    public_tables text[] := ARRAY[
        'produtos', 'categorias', 'campanhas', 'configuracoes_site', 'rifas', 'b2b_assets'
    ];
BEGIN
    FOREACH tbl IN ARRAY public_tables LOOP
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', tbl);
            EXECUTE format('DROP POLICY IF EXISTS public_read_%I ON public.%I', tbl, tbl);
            EXECUTE format('CREATE POLICY public_read_%I ON public.%I FOR SELECT TO anon, authenticated USING (true)', tbl, tbl);
        END IF;
    END LOOP;
END
$$;

-- 5.3 Política Restrita para Configurações (Apenas chave 'dias_novo' pública)
DO $$
BEGIN
    IF to_regclass('public.configuracoes') IS NOT NULL THEN
        GRANT SELECT ON TABLE public.configuracoes TO anon, authenticated;
        DROP POLICY IF EXISTS public_read_configuracoes_dias_novo ON public.configuracoes;
        CREATE POLICY public_read_configuracoes_dias_novo ON public.configuracoes FOR SELECT TO anon, authenticated USING (chave = 'dias_novo');
        DROP POLICY IF EXISTS restrict_configuracoes_dias_novo ON public.configuracoes;
        CREATE POLICY restrict_configuracoes_dias_novo ON public.configuracoes AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chave = 'dias_novo');
    END IF;
END
$$;

-- 5.4 Proteção de Dados Sensíveis de Prêmios (Colunas de Vencedores Ocultas do Público)
DO $$
BEGIN
    IF to_regclass('public.premios') IS NOT NULL THEN
        REVOKE SELECT (vencedor_nome, vencedor_numero, vencedor_telefone) ON TABLE public.premios FROM PUBLIC, anon, authenticated;
        GRANT SELECT (id, rifa_id, ordem, descricao, imagem_url) ON TABLE public.premios TO anon, authenticated;
        DROP POLICY IF EXISTS public_read_premios ON public.premios;
        CREATE POLICY public_read_premios ON public.premios FOR SELECT TO anon, authenticated USING (true);
    END IF;
END
$$;

-- 5.5 Storage Objects (Proteção contra escrita não autorizada)
DO $$
BEGIN
    IF to_regclass('storage.objects') IS NOT NULL THEN
        REVOKE INSERT, UPDATE, DELETE ON TABLE storage.objects FROM PUBLIC, anon, authenticated;
        GRANT INSERT, UPDATE, DELETE ON TABLE storage.objects TO service_role;
    END IF;
END
$$;

-- ------------------------------------------------------------------------------
-- 6. PROCEDURES E FUNÇÕES ATÔMICAS (BUSINESS LOGIC)
-- ------------------------------------------------------------------------------

-- 6.1 Atualização Atômica de Participante de Rifa
CREATE OR REPLACE FUNCTION public.admin_update_participant_status(
    p_rifa_id integer,
    p_participante_id integer,
    p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_status text;
    v_numbers integer[];
    v_sold integer[];
    v_reserved integer[];
BEGIN
    IF p_status IS NULL OR p_status NOT IN ('pago', 'cancelado') THEN
        RAISE EXCEPTION 'Status de pagamento inválido.';
    END IF;

    SELECT COALESCE(numeros_vendidos, '{}'), COALESCE(numeros_reservados, '{}')
    INTO v_sold, v_reserved
    FROM public.rifas
    WHERE id = p_rifa_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rifa não encontrada.';
    END IF;

    SELECT status_pagamento, COALESCE(numeros_escolhidos, '{}')
    INTO v_current_status, v_numbers
    FROM public.participantes_rifa
    WHERE id = p_participante_id AND rifa_id = p_rifa_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Participante não encontrado nesta rifa.';
    END IF;
    IF cardinality(v_numbers) = 0 THEN
        RAISE EXCEPTION 'O participante não possui números reservados.';
    END IF;

    IF v_current_status IS DISTINCT FROM p_status THEN
        IF p_status = 'pago' THEN
            IF v_numbers && v_sold THEN
                RAISE EXCEPTION 'Um ou mais números já estão vendidos.';
            END IF;
            IF EXISTS (
                SELECT 1
                FROM public.participantes_rifa AS other_participant
                CROSS JOIN LATERAL unnest(COALESCE(other_participant.numeros_escolhidos, '{}')) AS number_value
                WHERE other_participant.rifa_id = p_rifa_id
                  AND other_participant.id <> p_participante_id
                  AND other_participant.status_pagamento IN ('pendente', 'pago')
                  AND number_value = ANY(v_numbers)
            ) THEN
                RAISE EXCEPTION 'Um ou mais números não pertencem mais a esta reserva.';
            END IF;
            v_sold := ARRAY(
                SELECT DISTINCT number_value
                FROM unnest(v_sold || v_numbers) AS number_value
                ORDER BY number_value
            );
        ELSIF v_current_status = 'pago' THEN
            v_sold := ARRAY(
                SELECT number_value
                FROM unnest(v_sold) AS number_value
                WHERE NOT number_value = ANY(v_numbers)
                ORDER BY number_value
            );
        END IF;

        v_reserved := ARRAY(
            SELECT number_value
            FROM unnest(v_reserved) AS number_value
            WHERE NOT number_value = ANY(v_numbers)
            ORDER BY number_value
        );

        UPDATE public.participantes_rifa
        SET status_pagamento = p_status
        WHERE id = p_participante_id AND rifa_id = p_rifa_id;

        UPDATE public.rifas
        SET numeros_vendidos = v_sold,
            numeros_reservados = v_reserved
        WHERE id = p_rifa_id;
    END IF;
END;
$$;

-- 6.2 Salvamento Atômico de Rifa com Prêmios (Suporta 'pausada', 'ativa', etc.)
CREATE OR REPLACE FUNCTION public.admin_save_raffle_with_prizes(
    p_raffle jsonb,
    p_prizes jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id integer;
    v_requested_id integer;
    v_prize jsonb;
    v_prize_id integer;
    v_order integer;
    v_rows integer;
    v_prize_ids integer[];
BEGIN
    IF jsonb_typeof(p_raffle) <> 'object' OR jsonb_typeof(p_prizes) <> 'array' THEN
        RAISE EXCEPTION 'Dados da rifa ou dos prêmios inválidos.';
    END IF;
    IF jsonb_array_length(p_prizes) > 20 THEN
        RAISE EXCEPTION 'Uma rifa pode ter no máximo 20 prêmios.';
    END IF;
    IF NULLIF(btrim(p_raffle->>'nome_premio'), '') IS NULL
       OR length(p_raffle->>'nome_premio') > 200
       OR NULLIF(btrim(p_raffle->>'descricao'), '') IS NULL
       OR length(p_raffle->>'descricao') > 5000
       OR (p_raffle->>'preco_numero')::numeric IS NULL
       OR (p_raffle->>'preco_numero')::numeric <= 0
       OR (p_raffle->>'total_numeros')::integer IS NULL
       OR (p_raffle->>'total_numeros')::integer < 1
       OR (p_raffle->>'total_numeros')::integer > 1000000
       OR COALESCE(p_raffle->>'status', 'ativa') NOT IN ('ativa', 'pausada', 'finalizada', 'cancelada') THEN
        RAISE EXCEPTION 'Preço, quantidade de números, nome, descrição ou status da rifa inválido.';
    END IF;

    v_requested_id := NULLIF(p_raffle->>'id', '')::integer;

    IF v_requested_id IS NULL THEN
        INSERT INTO public.rifas (
            nome_premio, descricao, preco_numero,
            preco_numero_desconto_quantidade, preco_numero_desconto,
            total_numeros, imagem_premio_url, status
        )
        VALUES (
            p_raffle->>'nome_premio',
            p_raffle->>'descricao',
            (p_raffle->>'preco_numero')::numeric,
            NULLIF(p_raffle->>'preco_numero_desconto_quantidade', '')::integer,
            NULLIF(p_raffle->>'preco_numero_desconto', '')::numeric,
            (p_raffle->>'total_numeros')::integer,
            p_raffle->>'imagem_premio_url',
            COALESCE(p_raffle->>'status', 'ativa')
        )
        RETURNING id INTO v_id;
    ELSE
        SELECT id INTO v_id FROM public.rifas WHERE id = v_requested_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Rifa não encontrada.';
        END IF;
        UPDATE public.rifas
        SET nome_premio = p_raffle->>'nome_premio',
            descricao = p_raffle->>'descricao',
            preco_numero = (p_raffle->>'preco_numero')::numeric,
            preco_numero_desconto_quantidade = NULLIF(p_raffle->>'preco_numero_desconto_quantidade', '')::integer,
            preco_numero_desconto = NULLIF(p_raffle->>'preco_numero_desconto', '')::numeric,
            total_numeros = (p_raffle->>'total_numeros')::integer,
            imagem_premio_url = p_raffle->>'imagem_premio_url',
            status = COALESCE(p_raffle->>'status', 'ativa')
        WHERE id = v_id;
    END IF;

    SELECT COALESCE(array_agg((prize->>'id')::integer), '{}')
    INTO v_prize_ids
    FROM jsonb_array_elements(p_prizes) AS prize
    WHERE NULLIF(prize->>'id', '') IS NOT NULL;

    IF cardinality(v_prize_ids) <> cardinality(ARRAY(SELECT DISTINCT unnest(v_prize_ids))) THEN
        RAISE EXCEPTION 'Há prêmios duplicados na solicitação.';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM unnest(v_prize_ids) AS incoming_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.premios
            WHERE id = incoming_id AND rifa_id = v_id
        )
    ) THEN
        RAISE EXCEPTION 'Um prêmio informado não pertence a esta rifa.';
    END IF;

    DELETE FROM public.premios
    WHERE rifa_id = v_id
      AND NOT (id = ANY(v_prize_ids));

    FOR v_prize, v_order IN
        SELECT value, ordinal::integer
        FROM jsonb_array_elements(p_prizes) WITH ORDINALITY AS prizes(value, ordinal)
    LOOP
        IF NULLIF(btrim(v_prize->>'descricao'), '') IS NULL THEN
            RAISE EXCEPTION 'A descrição de cada prêmio é obrigatória.';
        END IF;

        v_prize_id := NULLIF(v_prize->>'id', '')::integer;
        IF v_prize_id IS NULL THEN
            INSERT INTO public.premios (rifa_id, ordem, descricao, imagem_url)
            VALUES (v_id, v_order, btrim(v_prize->>'descricao'), v_prize->>'imagem_url');
        ELSE
            UPDATE public.premios
            SET ordem = v_order,
                descricao = btrim(v_prize->>'descricao'),
                imagem_url = v_prize->>'imagem_url'
            WHERE id = v_prize_id AND rifa_id = v_id;
            GET DIAGNOSTICS v_rows = ROW_COUNT;
            IF v_rows = 0 THEN
                RAISE EXCEPTION 'Prêmio não encontrado nesta rifa.';
            END IF;
        END IF;
    END LOOP;

    RETURN v_id;
END;
$$;

-- 6.3 Exclusão Atômica de Rifa
CREATE OR REPLACE FUNCTION public.admin_delete_raffle(p_rifa_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM 1 FROM public.rifas WHERE id = p_rifa_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rifa não encontrada.';
    END IF;
    DELETE FROM public.participantes_rifa WHERE rifa_id = p_rifa_id;
    DELETE FROM public.premios WHERE rifa_id = p_rifa_id;
    DELETE FROM public.rifas WHERE id = p_rifa_id;
END;
$$;

-- 6.4 Sorteio Criptográfico com Suporte a Múltiplos Prêmios
CREATE OR REPLACE FUNCTION public.admin_draw_raffle_winner(
    p_rifa_id integer,
    p_premio_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status text;
    v_ticket_count bigint;
    v_random_limit bigint;
    v_random_value bigint;
    v_offset bigint;
    v_winner record;
    v_remaining_prizes integer;
    v_raffle_finalized boolean;
BEGIN
    SELECT status INTO v_status
    FROM public.rifas
    WHERE id = p_rifa_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rifa não encontrada.';
    END IF;
    IF v_status = 'cancelada' THEN
        RAISE EXCEPTION 'A rifa está cancelada.';
    END IF;

    PERFORM 1 FROM public.premios WHERE id = p_premio_id AND rifa_id = p_rifa_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prêmio não encontrado nesta rifa.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.premios WHERE id = p_premio_id AND vencedor_nome IS NOT NULL) THEN
        RAISE EXCEPTION 'Este prêmio já possui um vencedor.';
    END IF;

    SELECT count(*)
    INTO v_ticket_count
    FROM public.participantes_rifa AS participant
    CROSS JOIN LATERAL unnest(COALESCE(participant.numeros_escolhidos, '{}')) AS ticket_number
    WHERE participant.rifa_id = p_rifa_id
      AND participant.status_pagamento = 'pago'
      AND ticket_number NOT IN (
          SELECT vencedor_numero 
          FROM public.premios 
          WHERE rifa_id = p_rifa_id AND vencedor_numero IS NOT NULL
      );
    IF v_ticket_count = 0 THEN
        RAISE EXCEPTION 'Nenhum número pago disponível para este sorteio (todos já foram contemplados ou não há números pagos).';
    END IF;
    IF v_ticket_count > 4294967296 THEN
        RAISE EXCEPTION 'A quantidade de números pagos excede o limite do sorteio.';
    END IF;

    v_random_limit := (4294967296 / v_ticket_count) * v_ticket_count;
    LOOP
        v_random_value := ('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint;
        EXIT WHEN v_random_value < v_random_limit;
    END LOOP;
    v_offset := v_random_value % v_ticket_count;

    SELECT participant.id, participant.nome, participant.telefone, ticket_number AS number
    INTO v_winner
    FROM public.participantes_rifa AS participant
    CROSS JOIN LATERAL unnest(COALESCE(participant.numeros_escolhidos, '{}')) AS ticket_number
    WHERE participant.rifa_id = p_rifa_id
      AND participant.status_pagamento = 'pago'
      AND ticket_number NOT IN (
          SELECT vencedor_numero 
          FROM public.premios 
          WHERE rifa_id = p_rifa_id AND vencedor_numero IS NOT NULL
      )
    ORDER BY participant.id, ticket_number
    OFFSET v_offset
    LIMIT 1;

    -- Atualiza o vencedor do prêmio específico
    UPDATE public.premios
    SET vencedor_nome = v_winner.nome,
        vencedor_numero = v_winner.number,
        vencedor_telefone = v_winner.telefone
    WHERE id = p_premio_id AND rifa_id = p_rifa_id;

    -- Conta quantos prêmios ainda faltam sortear nesta rifa
    SELECT count(*)
    INTO v_remaining_prizes
    FROM public.premios
    WHERE rifa_id = p_rifa_id
      AND vencedor_nome IS NULL;

    v_raffle_finalized := (v_remaining_prizes = 0);

    -- Atualiza a rifa: finaliza apenas se todos os prêmios foram sorteados
    UPDATE public.rifas
    SET status = CASE WHEN v_raffle_finalized THEN 'finalizada' ELSE status END,
        numero_vencedor = COALESCE(
            (SELECT vencedor_numero FROM public.premios WHERE rifa_id = p_rifa_id AND ordem = 1),
            numero_vencedor,
            v_winner.number
        )
    WHERE id = p_rifa_id;

    RETURN jsonb_build_object(
        'participant_id', v_winner.id,
        'name', v_winner.nome,
        'phone', v_winner.telefone,
        'number', v_winner.number,
        'remaining_prizes', v_remaining_prizes,
        'raffle_finalized', v_raffle_finalized
    );
END;
$$;

-- 6.5 Incremento Atômico de Métricas de Analytics
CREATE OR REPLACE FUNCTION public.increment_daily_metrics(
    p_date date,
    p_is_new_session boolean,
    p_page_views integer DEFAULT 1,
    p_duration integer DEFAULT 0,
    p_device_type text DEFAULT 'desktop',
    p_has_conversion boolean DEFAULT false,
    p_pages text[] DEFAULT ARRAY[]::text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_page text;
    v_bounce integer := CASE WHEN p_page_views = 1 THEN 1 ELSE 0 END;
    v_conversion integer := CASE WHEN p_has_conversion THEN 1 ELSE 0 END;
BEGIN
    INSERT INTO public.analytics_daily_metrics (
        date,
        total_sessions,
        total_page_views,
        total_duration,
        bounce_rate,
        device_types,
        top_pages,
        conversion_rate,
        avg_session_duration,
        total_revenue
    )
    VALUES (
        p_date,
        CASE WHEN p_is_new_session THEN 1 ELSE 0 END,
        CASE WHEN p_is_new_session THEN p_page_views ELSE 0 END,
        p_duration,
        CASE WHEN p_is_new_session THEN v_bounce ELSE 0 END,
        jsonb_build_object(COALESCE(p_device_type, 'desktop'), 1),
        '{}'::jsonb,
        CASE WHEN p_is_new_session THEN v_conversion ELSE 0 END,
        p_duration,
        0
    )
    ON CONFLICT (date) DO UPDATE
    SET
        total_sessions = CASE 
            WHEN p_is_new_session THEN public.analytics_daily_metrics.total_sessions + 1 
            ELSE public.analytics_daily_metrics.total_sessions 
        END,
        total_page_views = public.analytics_daily_metrics.total_page_views + (
            CASE WHEN p_is_new_session THEN p_page_views ELSE 0 END
        ),
        total_duration = CASE
            WHEN p_is_new_session THEN public.analytics_daily_metrics.total_duration + p_duration
            ELSE GREATEST(public.analytics_daily_metrics.total_duration, p_duration)
        END,
        device_types = CASE
            WHEN p_is_new_session AND p_device_type IS NOT NULL THEN
                jsonb_set(
                    public.analytics_daily_metrics.device_types,
                    ARRAY[p_device_type],
                    to_jsonb(COALESCE((public.analytics_daily_metrics.device_types->>p_device_type)::int, 0) + 1)
                )
            ELSE public.analytics_daily_metrics.device_types
        END,
        avg_session_duration = CASE 
            WHEN public.analytics_daily_metrics.total_sessions + (CASE WHEN p_is_new_session THEN 1 ELSE 0 END) > 0 THEN
                (public.analytics_daily_metrics.total_duration + p_duration) / 
                (public.analytics_daily_metrics.total_sessions + (CASE WHEN p_is_new_session THEN 1 ELSE 0 END))
            ELSE 0
        END;

    -- Atualizar contagem de top_pages de forma segura
    IF p_pages IS NOT NULL AND array_length(p_pages, 1) > 0 THEN
        FOREACH v_page IN ARRAY p_pages LOOP
            IF v_page IS NOT NULL AND length(v_page) > 0 AND v_page NOT IN ('__proto__', 'constructor', 'prototype') THEN
                UPDATE public.analytics_daily_metrics
                SET top_pages = jsonb_set(
                    COALESCE(top_pages, '{}'::jsonb),
                    ARRAY[substring(v_page from 1 for 150)],
                    to_jsonb(COALESCE((top_pages->>substring(v_page from 1 for 150))::int, 0) + 1)
                )
                WHERE date = p_date;
            END IF;
        END LOOP;
    END IF;
END;
$$;

-- 6.6 Incremento Atômico de Uso de Cupom (Lock Exclusivo e Concorrência Segura)
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_coupon record;
    v_limit integer;
    v_current integer;
    v_next integer;
BEGIN
    -- Seleciona com lock exclusivo de linha (FOR UPDATE) para evitar race conditions
    SELECT id, codigo, ativo, data_validade, limite_uso, limite_usos, usos_atuais, quantidade_usos
    INTO v_coupon
    FROM public.cupons
    WHERE UPPER(TRIM(codigo)) = UPPER(TRIM(p_codigo))
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cupom não encontrado.');
    END IF;

    IF v_coupon.ativo = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este cupom está inativo.');
    END IF;

    IF v_coupon.data_validade IS NOT NULL AND v_coupon.data_validade < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Este cupom está expirado.');
    END IF;

    v_limit := COALESCE(v_coupon.limite_uso, v_coupon.limite_usos);
    v_current := COALESCE(v_coupon.usos_atuais, v_coupon.quantidade_usos, 0);

    IF v_limit IS NOT NULL AND v_limit > 0 AND v_current >= v_limit THEN
        RETURN jsonb_build_object('success', false, 'error', 'Limite de utilização do cupom atingido.');
    END IF;

    v_next := v_current + 1;

    UPDATE public.cupons
    SET usos_atuais = v_next,
        quantidade_usos = v_next
    WHERE id = v_coupon.id;

    RETURN jsonb_build_object('success', true, 'count', v_next);
END;
$$;

-- 6.7 Reserva Atômica de Números de Rifa (Concorrência Segura, Lock Exclusivo FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reservar_numeros_rifa(
    id_rifa_param integer,
    numeros_escolhidos_param integer[],
    nome_cliente_param text,
    telefone_param text
)
RETURNS TABLE (
    participante_id bigint,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rifa record;
    v_num integer;
    v_clean_nome text;
    v_clean_telefone text;
    v_participante_id bigint;
    v_preco numeric(10,2);
    v_total_calculado numeric(10,2);
BEGIN
    IF id_rifa_param IS NULL OR id_rifa_param <= 0 THEN
        RAISE EXCEPTION 'Identificador da rifa inválido.';
    END IF;

    IF numeros_escolhidos_param IS NULL OR cardinality(numeros_escolhidos_param) = 0 THEN
        RAISE EXCEPTION 'Selecione ao menos um número.';
    END IF;

    IF cardinality(numeros_escolhidos_param) > 100 THEN
        RAISE EXCEPTION 'Limite máximo de 100 números por reserva excedido.';
    END IF;

    v_clean_nome := NULLIF(btrim(nome_cliente_param), '');
    IF v_clean_nome IS NULL OR length(v_clean_nome) < 2 OR length(v_clean_nome) > 120 THEN
        RAISE EXCEPTION 'Informe um nome válido.';
    END IF;

    v_clean_telefone := NULLIF(btrim(telefone_param), '');
    IF v_clean_telefone IS NULL OR NOT (v_clean_telefone ~ '^[+\d ()-]{8,24}$') THEN
        RAISE EXCEPTION 'Informe um telefone válido.';
    END IF;

    SELECT id, status, total_numeros, preco_numero, preco_numero_desconto_quantidade, preco_numero_desconto,
           COALESCE(numeros_vendidos, '{}') AS numeros_vendidos,
           COALESCE(numeros_reservados, '{}') AS numeros_reservados
    INTO v_rifa
    FROM public.rifas
    WHERE id = id_rifa_param
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rifa não encontrada.';
    END IF;

    IF v_rifa.status <> 'ativa' THEN
        RAISE EXCEPTION 'Esta rifa não está mais ativa para novas reservas.';
    END IF;

    IF (SELECT count(DISTINCT n) FROM unnest(numeros_escolhidos_param) AS n) <> cardinality(numeros_escolhidos_param) THEN
        RAISE EXCEPTION 'Números duplicados na seleção.';
    END IF;

    FOREACH v_num IN ARRAY numeros_escolhidos_param LOOP
        IF v_num < 0 OR v_num >= v_rifa.total_numeros THEN
            RAISE EXCEPTION 'Número % fora do intervalo da rifa (0 a %).', v_num, (v_rifa.total_numeros - 1);
        END IF;

        IF v_num = ANY(v_rifa.numeros_vendidos) THEN
            RAISE EXCEPTION 'O número % já foi vendido.', v_num;
        END IF;

        IF v_num = ANY(v_rifa.numeros_reservados) THEN
            RAISE EXCEPTION 'O número % já está reservado por outro participante.', v_num;
        END IF;
    END LOOP;

    IF v_rifa.preco_numero_desconto_quantidade IS NOT NULL 
       AND v_rifa.preco_numero_desconto IS NOT NULL 
       AND v_rifa.preco_numero_desconto_quantidade > 0 
       AND cardinality(numeros_escolhidos_param) >= v_rifa.preco_numero_desconto_quantidade THEN
        v_preco := v_rifa.preco_numero_desconto;
    ELSE
        v_preco := v_rifa.preco_numero;
    END IF;
    v_total_calculado := cardinality(numeros_escolhidos_param) * v_preco;

    INSERT INTO public.participantes_rifa (
        rifa_id,
        nome,
        telefone,
        numeros_escolhidos,
        status_pagamento,
        total_pago
    )
    VALUES (
        id_rifa_param,
        v_clean_nome,
        v_clean_telefone,
        numeros_escolhidos_param,
        'pendente',
        v_total_calculado
    )
    RETURNING id INTO v_participante_id;

    UPDATE public.rifas
    SET numeros_reservados = array_cat(COALESCE(numeros_reservados, '{}'), numeros_escolhidos_param)
    WHERE id = id_rifa_param;

    RETURN QUERY
    SELECT v_participante_id, 'pendente'::text;
END;
$$;

-- 6.8 Atribuição de Vencedor por Número da Loteria Federal
CREATE OR REPLACE FUNCTION public.admin_set_raffle_winner_by_number(
    p_rifa_id integer,
    p_premio_id integer,
    p_numero integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status text;
    v_winner record;
    v_remaining_prizes integer;
    v_raffle_finalized boolean;
BEGIN
    SELECT status INTO v_status
    FROM public.rifas
    WHERE id = p_rifa_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rifa não encontrada.';
    END IF;

    IF v_status = 'cancelada' THEN
        RAISE EXCEPTION 'A rifa está cancelada.';
    END IF;

    PERFORM 1 FROM public.premios WHERE id = p_premio_id AND rifa_id = p_rifa_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prêmio não encontrado nesta rifa.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.premios WHERE id = p_premio_id AND vencedor_nome IS NOT NULL) THEN
        RAISE EXCEPTION 'Este prêmio já possui um vencedor.';
    END IF;

    SELECT participant.id, participant.nome, participant.telefone
    INTO v_winner
    FROM public.participantes_rifa AS participant
    WHERE participant.rifa_id = p_rifa_id
      AND participant.status_pagamento = 'pago'
      AND p_numero = ANY(participant.numeros_escolhidos)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nenhum participante pago comprou o número % nesta rifa.', p_numero;
    END IF;

    UPDATE public.premios
    SET vencedor_numero = p_numero,
        vencedor_nome = v_winner.nome,
        vencedor_telefone = v_winner.telefone
    WHERE id = p_premio_id;

    SELECT count(*)
    INTO v_remaining_prizes
    FROM public.premios
    WHERE rifa_id = p_rifa_id
      AND vencedor_numero IS NULL;

    v_raffle_finalized := (v_remaining_prizes = 0);

    IF v_raffle_finalized THEN
        UPDATE public.rifas
        SET status = 'finalizada',
            numero_vencedor = p_numero,
            data_sorteio = timezone('utc'::text, now())
        WHERE id = p_rifa_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'name', v_winner.nome,
        'phone', v_winner.telefone,
        'number', p_numero,
        'remaining_prizes', v_remaining_prizes,
        'raffle_finalized', v_raffle_finalized
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. BLINDAGEM DE EXECUÇÃO DE FUNÇÕES (ESTRITAMENTE SERVICE_ROLE)
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_update_participant_status(integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_save_raffle_with_prizes(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_raffle(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_draw_raffle_winner(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_raffle_winner_by_number(integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_daily_metrics(date, boolean, integer, integer, text, boolean, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reservar_numeros_rifa(integer, integer[], text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_update_participant_status(integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_raffle_with_prizes(jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_raffle(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_draw_raffle_winner(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_raffle_winner_by_number(integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_daily_metrics(date, boolean, integer, integer, text, boolean, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reservar_numeros_rifa(integer, integer[], text, text) TO service_role;

COMMIT;
