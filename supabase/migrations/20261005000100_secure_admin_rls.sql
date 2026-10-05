BEGIN;

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
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
    ]
    LOOP
        IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        ELSE
            RAISE NOTICE 'Ignorando public.%: tabela não existe neste projeto.', table_name;
        END IF;
    END LOOP;
END
$$;

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'produtos',
        'categorias',
        'campanhas',
        'configuracoes_site',
        'configuracoes',
        'rifas',
        'b2b_assets'
    ]
    LOOP
        IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
            EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', table_name);
            EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', table_name);
        END IF;
    END LOOP;

    FOREACH table_name IN ARRAY ARRAY[
        'cupons',
        'participantes_rifa',
        'notificacoes_push_queue',
        'pedidos',
        'analytics_sessions',
        'analytics_events',
        'analytics_daily_metrics',
        'push_subscriptions'
    ]
    LOOP
        IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
            EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', table_name);
        END IF;
    END LOOP;
END
$$;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

DO $$
BEGIN
    IF to_regclass('public.produtos') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS public_read_produtos ON public.produtos';
        EXECUTE 'CREATE POLICY public_read_produtos ON public.produtos FOR SELECT TO anon, authenticated USING (true)';
    END IF;

    IF to_regclass('public.categorias') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS public_read_categorias ON public.categorias';
        EXECUTE 'CREATE POLICY public_read_categorias ON public.categorias FOR SELECT TO anon, authenticated USING (true)';
    END IF;

    IF to_regclass('public.campanhas') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS public_read_campanhas ON public.campanhas';
        EXECUTE 'CREATE POLICY public_read_campanhas ON public.campanhas FOR SELECT TO anon, authenticated USING (true)';
    END IF;

    IF to_regclass('public.configuracoes_site') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS public_read_configuracoes_site ON public.configuracoes_site';
        EXECUTE 'CREATE POLICY public_read_configuracoes_site ON public.configuracoes_site FOR SELECT TO anon, authenticated USING (true)';
    END IF;

    IF to_regclass('public.configuracoes') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS public_read_configuracoes_dias_novo ON public.configuracoes';
        EXECUTE 'CREATE POLICY public_read_configuracoes_dias_novo ON public.configuracoes FOR SELECT TO anon, authenticated USING (chave = ''dias_novo'')';
        EXECUTE 'DROP POLICY IF EXISTS restrict_configuracoes_dias_novo ON public.configuracoes';
        EXECUTE 'CREATE POLICY restrict_configuracoes_dias_novo ON public.configuracoes AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chave = ''dias_novo'')';
    END IF;

    IF to_regclass('public.rifas') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS public_read_rifas ON public.rifas';
        EXECUTE 'CREATE POLICY public_read_rifas ON public.rifas FOR SELECT TO anon, authenticated USING (true)';
    END IF;

    IF to_regclass('public.b2b_assets') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS public_read_b2b_assets ON public.b2b_assets';
        EXECUTE 'CREATE POLICY public_read_b2b_assets ON public.b2b_assets FOR SELECT TO anon, authenticated USING (true)';
    END IF;

    IF to_regclass('public.premios') IS NOT NULL THEN
        EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.premios FROM PUBLIC, anon, authenticated';
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.premios TO service_role';
        EXECUTE 'REVOKE SELECT (vencedor_nome, vencedor_numero, vencedor_telefone) ON TABLE public.premios FROM PUBLIC, anon, authenticated';
        EXECUTE 'GRANT SELECT (id, rifa_id, ordem, descricao, imagem_url) ON TABLE public.premios TO anon, authenticated';
        EXECUTE 'DROP POLICY IF EXISTS public_read_premios ON public.premios';
        EXECUTE 'CREATE POLICY public_read_premios ON public.premios FOR SELECT TO anon, authenticated USING (true)';
    END IF;
END
$$;

DO $$
BEGIN
    IF to_regclass('storage.objects') IS NOT NULL THEN
        REVOKE INSERT, UPDATE, DELETE ON TABLE storage.objects FROM PUBLIC, anon, authenticated;
        GRANT INSERT, UPDATE, DELETE ON TABLE storage.objects TO service_role;
    END IF;
END
$$;

DO $$
DECLARE
    function_signature regprocedure;
BEGIN
    FOR function_signature IN
        SELECT procedure.oid::regprocedure
        FROM pg_proc AS procedure
        JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
        WHERE namespace.nspname = 'public'
          AND procedure.proname = 'reservar_numeros_rifa'
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', function_signature);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', function_signature);
    END LOOP;
END
$$;

COMMIT;
