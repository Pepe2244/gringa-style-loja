import { NextResponse } from 'next/server';

const SUPERFRETE_TOKEN =
    process.env.SUPERFRETE_TOKEN ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzMyNjQ1NjQsInN1YiI6Imo2SXRKM3J4QXVXeEdCdzlHOERxc1BxdTY0eTIifQ.V8I1ZQySq2xJihO9Q7HtEh0iP4St22j7-06vyAgTHCg';

const ORIGIN_CEP = '18207185'; // Itapetininga Centro

// Credenciais dos Correios (CWS)
const CORREIOS_TOKEN = process.env.CORREIOS_TOKEN || '';
const CORREIOS_CARTAO = process.env.CORREIOS_CARTAO || '';

const CORREIOS_SERVICOS = [
    { codigo: '45209', nome: 'Exporta Fácil Econômico' },
    { codigo: '45110', nome: 'Exporta Fácil Expresso (EMS)' },
];

const COUNTRY_CODES: Record<string, string> = {
    US: '249',
    PT: '620',
    DE: '276',
    ES: '724',
    FR: '250',
    IT: '380',
    GB: '826',
    NL: '528',
    BE: '056',
    AR: '032',
    CL: '152',
    MX: '484',
    JP: '392',
    AU: '036',
    CA: '124',
    INT: '249',
};

// Fallback Seguro Nacional (Garante checkout fluido se a SuperFrete falhar)
function getNationalFallback() {
    return [
        {
            id: 1,
            name: 'PAC (Correios)',
            price: '28.90',
            discount: '0.00',
            currency: 'R$',
            delivery_time: 6,
            delivery_range: { min: 5, max: 8 },
            packages: [],
            additional_services: { receipt: false, own_hand: false, collect: false },
            company: { id: 1, name: 'Correios', picture: 'https://app.superfrete.com/images/correios.png' },
            has_error: false
        },
        {
            id: 2,
            name: 'SEDEX (Correios)',
            price: '46.50',
            discount: '0.00',
            currency: 'R$',
            delivery_time: 2,
            delivery_range: { min: 1, max: 3 },
            packages: [],
            additional_services: { receipt: false, own_hand: false, collect: false },
            company: { id: 1, name: 'Correios', picture: 'https://app.superfrete.com/images/correios.png' },
            has_error: false
        }
    ];
}

export async function POST(request: Request) {
    try {
        const payloadJson = await request.json();
        const { to_postal_code, country = 'BR', product_name } = payloadJson;

        if (!to_postal_code) {
            return NextResponse.json(
                { error: 'CEP/Postal Code de destino não fornecido' },
                { status: 400 }
            );
        }

        // Determinar CEP de origem (Máscaras saem de Três Lagoas/MS)
        const MASKS_ORIGIN_CEP = '79631170'; 
        const isMask = product_name && (
            product_name.toLowerCase().includes('mascara') || 
            product_name.toLowerCase().includes('máscara')
        );
        const effectiveOriginCep = isMask ? MASKS_ORIGIN_CEP : ORIGIN_CEP;

        // ─── Lógica Nacional – SuperFrete com Fallback Automático ──────────────
        if (country === 'BR') {
            const cleanDestinationCep = to_postal_code.replace(/\D/g, '');

            if (cleanDestinationCep.length !== 8) {
                return NextResponse.json(
                    { error: 'CEP de destino inválido' },
                    { status: 400 }
                );
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

                const sfRes = await fetch('https://api.superfrete.com/api/v0/calculator', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        from: { postal_code: effectiveOriginCep },
                        to: { postal_code: cleanDestinationCep },
                        services: '1,2', // 1 = PAC, 2 = SEDEX
                        options: { own_hand: false, receipt: false, insurance_value: 0 },
                        package: { format: 1, weight: '0.80', length: 25, height: 20, width: 20 },
                    }),
                });

                clearTimeout(timeoutId);

                if (sfRes.ok) {
                    const sfData = await sfRes.json();
                    if (Array.isArray(sfData) && sfData.length > 0 && !sfData[0].has_error) {
                        return NextResponse.json(sfData);
                    }
                }
                
                console.warn('[Shipping] SuperFrete indisponível ou recusada. Usando fallback padrão.');
                return NextResponse.json(getNationalFallback());
            } catch (err) {
                console.warn('[Shipping] Timeout/Falha na SuperFrete. Acionando fallback.');
                return NextResponse.json(getNationalFallback());
            }
        }

        // ─── Lógica Internacional – Correios Exporta Fácil ────────────────────
        const coPaisDestino = COUNTRY_CODES[country] ?? COUNTRY_CODES.INT;

        if (!CORREIOS_TOKEN) {
            return NextResponse.json([
                { id: 991, name: 'Exporta Fácil Econômico (est.)', price: '320.00', delivery_time: 20 },
                { id: 992, name: 'Exporta Fácil Expresso EMS (est.)', price: '400.00', delivery_time: 8 },
            ]);
        }

        const resultados = await Promise.all(
            CORREIOS_SERVICOS.map(async (servico, idx) => {
                try {
                    const correiosRes = await fetch(
                        'https://api.correios.com.br/preco/v1/internacional',
                        {
                            method: 'POST',
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${CORREIOS_TOKEN}`,
                            },
                            body: JSON.stringify({
                                coPaisDestino,
                                nuCepOrigem: effectiveOriginCep,
                                nuCartaoPostagem: CORREIOS_CARTAO,
                                psObjeto: '2000',
                                tpObjeto: '2',
                                comprimento: '25',
                                largura: '15',
                                altura: '10',
                                coServico: servico.codigo,
                            }),
                        }
                    );

                    if (!correiosRes.ok) return null;
                    const data = await correiosRes.json();

                    const preco = data.pcFinal ?? data.vlTotal ?? data.preco;
                    const prazo = data.prazoEntrega ?? data.nuPrazoEntrega ?? 20;

                    if (!preco) return null;

                    return {
                        id: 991 + idx,
                        name: servico.nome,
                        price: String(preco).replace(',', '.'),
                        delivery_time: parseInt(String(prazo), 10),
                    };
                } catch {
                    return null;
                }
            })
        );

        const validos = resultados.filter(Boolean);

        if (validos.length === 0) {
            return NextResponse.json([
                { id: 991, name: 'Exporta Fácil Econômico (est.)', price: '320.00', delivery_time: 20 },
                { id: 992, name: 'Exporta Fácil Expresso EMS (est.)', price: '400.00', delivery_time: 8 },
            ]);
        }

        return NextResponse.json(validos);
    } catch (error) {
        console.error('Erro na rota de frete:', error);
        return NextResponse.json(getNationalFallback());
    }
}