import { NextResponse } from 'next/server';

const SUPERFRETE_TOKEN =
    process.env.SUPERFRETE_TOKEN ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzMyNjQ1NjQsInN1YiI6Imo2SXRKM3J4QXVXeEdCdzlHOERxc1BxdTY0eTIifQ.V8I1ZQySq2xJihO9Q7HtEh0iP4St22j7-06vyAgTHCg';

const ORIGIN_CEP = '18207185'; // Itapetininga Centro

// Credenciais dos Correios (CWS)
// Gere em: https://cws.correios.com.br/ → Gestão de Acesso a APIs
const CORREIOS_TOKEN = process.env.CORREIOS_TOKEN || '';
const CORREIOS_CARTAO = process.env.CORREIOS_CARTAO || ''; // Número do Cartão de Postagem

// Serviços do Exporta Fácil por código (para exibição ao cliente)
const CORREIOS_SERVICOS = [
    { codigo: '45209', nome: 'Exporta Fácil Econômico' },
    { codigo: '45110', nome: 'Exporta Fácil Expresso (EMS)' },
];

// Códigos de países aceitos pela API dos Correios (coPaisDestino)
// Tabela completa: https://cws.correios.com.br (manual da API)
const COUNTRY_CODES: Record<string, string> = {
    US: '249', // EUA
    PT: '620', // Portugal
    DE: '276', // Alemanha
    ES: '724', // Espanha
    FR: '250', // França
    IT: '380', // Itália
    GB: '826', // Reino Unido
    NL: '528', // Países Baixos
    BE: '056', // Bélgica
    AR: '032', // Argentina
    CL: '152', // Chile
    MX: '484', // México
    JP: '392', // Japão
    AU: '036', // Austrália
    CA: '124', // Canadá
    INT: '249', // Fallback genérico → EUA
};

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

        console.log(`[Shipping] Product: ${product_name}, isMask: ${isMask}, Origin CEP: ${effectiveOriginCep}`);

        // ─── Lógica Nacional – SuperFrete ─────────────────────────────────────
        if (country === 'BR') {
            const sfRes = await fetch('https://api.superfrete.com/api/v0/calculator', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${SUPERFRETE_TOKEN}`,
                },
                body: JSON.stringify({
                    from: { postal_code: effectiveOriginCep },
                    to: { postal_code: to_postal_code.replace(/\D/g, '') },
                    services: '1,2', // 1 = PAC, 2 = SEDEX
                    options: { own_hand: false, receipt: false, insurance_value: 0 },
                    package: { format: 1, weight: '1.00', length: 35, height: 35, width: 35 },
                }),
            });

            const sfData = await sfRes.json();

            if (!sfRes.ok) {
                console.error('SuperFrete API Error:', sfData);
                return NextResponse.json(
                    { error: 'Erro na API do SuperFrete' },
                    { status: sfRes.status }
                );
            }

            return NextResponse.json(sfData);
        }

        // ─── Lógica Internacional – Correios Exporta Fácil ────────────────────
        const coPaisDestino = COUNTRY_CODES[country] ?? COUNTRY_CODES.INT;

        // Sem token → devolve estimativa fixa para não quebrar o site
        if (!CORREIOS_TOKEN) {
            console.warn('[Shipping] Token dos Correios não configurado. Usando mock.');
            return NextResponse.json([
                { id: 991, name: 'Exporta Fácil Econômico (est.)', price: '320.00', delivery_time: 20 },
                { id: 992, name: 'Exporta Fácil Expresso EMS (est.)', price: '400.00', delivery_time: 8 },
            ]);
        }

        // Consulta cada serviço em paralelo
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
                                psObjeto: '2000',    // 1 kg em gramas
                                tpObjeto: '2',       // 2 = Caixa/Pacote
                                comprimento: '25',
                                largura: '15',
                                altura: '10',
                                coServico: servico.codigo,
                            }),
                        }
                    );

                    if (!correiosRes.ok) return null;
                    const data = await correiosRes.json();

                    // A API devolve pcFinal (preço final em reais)
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

        // Fallback se nenhum serviço retornar
        if (validos.length === 0) {
            return NextResponse.json([
                { id: 991, name: 'Exporta Fácil Econômico (est.)', price: '320.00', delivery_time: 20 },
                { id: 992, name: 'Exporta Fácil Expresso EMS (est.)', price: '400.00', delivery_time: 8 },
            ]);
        }

        return NextResponse.json(validos);
    } catch (error) {
        console.error('Erro na rota de frete:', error);
        return NextResponse.json({ error: 'Erro interno ao calcular frete' }, { status: 500 });
    }
}
