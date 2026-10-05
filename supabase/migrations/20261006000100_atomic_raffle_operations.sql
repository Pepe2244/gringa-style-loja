BEGIN;

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
       OR COALESCE(p_raffle->>'status', 'ativa') NOT IN ('ativa', 'finalizada', 'cancelada') THEN
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
BEGIN
    SELECT status INTO v_status
    FROM public.rifas
    WHERE id = p_rifa_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rifa não encontrada.';
    END IF;
    IF v_status <> 'ativa' THEN
        RAISE EXCEPTION 'A rifa não está ativa ou já foi sorteada.';
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
      AND participant.status_pagamento = 'pago';
    IF v_ticket_count = 0 THEN
        RAISE EXCEPTION 'Nenhum número pago encontrado para esta rifa.';
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
    ORDER BY participant.id, ticket_number
    OFFSET v_offset
    LIMIT 1;

    UPDATE public.premios
    SET vencedor_nome = v_winner.nome,
        vencedor_numero = v_winner.number,
        vencedor_telefone = v_winner.telefone
    WHERE id = p_premio_id AND rifa_id = p_rifa_id;

    UPDATE public.rifas
    SET status = 'finalizada',
        numero_vencedor = v_winner.number
    WHERE id = p_rifa_id;

    RETURN jsonb_build_object(
        'participant_id', v_winner.id,
        'name', v_winner.nome,
        'phone', v_winner.telefone,
        'number', v_winner.number
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_participant_status(integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_save_raffle_with_prizes(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_raffle(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_draw_raffle_winner(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_participant_status(integer, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_raffle_with_prizes(jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_raffle(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_draw_raffle_winner(integer, integer) TO service_role;

COMMIT;
