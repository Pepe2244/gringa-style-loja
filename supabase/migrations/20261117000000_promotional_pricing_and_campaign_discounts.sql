-- Migration: 20261117000000_promotional_pricing_and_campaign_discounts.sql
-- Description: Add promotional period to produtos and scheduling/discount parameters to campanhas

-- 1. Campos de período promocional na tabela produtos
ALTER TABLE public.produtos
    ADD COLUMN IF NOT EXISTS inicio_promocao TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS fim_promocao TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.produtos.inicio_promocao IS 'Data/hora de início da vigência do preço promocional';
COMMENT ON COLUMN public.produtos.fim_promocao IS 'Data/hora de término da vigência do preço promocional';

-- 2. Campos de vigência, regras de desconto e escopo na tabela campanhas
ALTER TABLE public.campanhas
    ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS tipo_desconto TEXT CHECK (tipo_desconto IS NULL OR tipo_desconto IN ('percentual', 'fixo')) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS produtos_aplicaveis BIGINT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS aplicar_em_todos BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS produtos_descontos JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.campanhas.data_inicio IS 'Data/hora de início da campanha promocional';
COMMENT ON COLUMN public.campanhas.data_fim IS 'Data/hora de término da campanha promocional';
COMMENT ON COLUMN public.campanhas.tipo_desconto IS 'Tipo de desconto aplicado pela campanha: percentual ou fixo';
COMMENT ON COLUMN public.campanhas.valor_desconto IS 'Valor nominal ou porcentagem do desconto da campanha';
COMMENT ON COLUMN public.campanhas.produtos_aplicaveis IS 'Array de IDs de produtos elegíveis ao desconto da campanha';
COMMENT ON COLUMN public.campanhas.aplicar_em_todos IS 'Flag indicando se a campanha aplica o desconto em todos os produtos da loja';
COMMENT ON COLUMN public.campanhas.produtos_descontos IS 'Array JSON com regras de desconto individuais por produto: [{ produto_id, tipo, valor }]';

-- 3. Índices para otimizar consultas por período e campanhas
CREATE INDEX IF NOT EXISTS idx_produtos_promocao_datas 
    ON public.produtos (inicio_promocao, fim_promocao) 
    WHERE preco_promocional IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campanhas_datas 
    ON public.campanhas (data_inicio, data_fim);
