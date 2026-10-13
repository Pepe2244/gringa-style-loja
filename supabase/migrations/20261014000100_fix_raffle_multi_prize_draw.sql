BEGIN;

-- Correção da procedure de sorteio de rifas para permitir múltiplos prêmios
-- Anteriormente, ao sortear o primeiro prêmio a rifa era marcada como 'finalizada',
-- impedindo o sorteio do 2º, 3º e demais prêmios subsequentes.

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
        numero_vencedor = COALESCE(numero_vencedor, v_winner.number)
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

REVOKE ALL ON FUNCTION public.admin_draw_raffle_winner(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_draw_raffle_winner(integer, integer) TO service_role;

COMMIT;
