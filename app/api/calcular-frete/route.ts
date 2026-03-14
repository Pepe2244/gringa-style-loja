import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { cep_destino, peso = 0.3, largura = 11, altura = 2, comprimento = 16 } = body;

        const cepLimpo = String(cep_destino || '').replace(/\D/g, '');
        if (cepLimpo.length !== 8) {
            return NextResponse.json({ error: 'CEP inválido. Informe 8 dígitos.' }, { status: 400 });
        }

        const token = process.env.SUPER_FRETE_TOKEN;
        const cepOrigem = process.env.CEP_ORIGEM;

        if (!token || !cepOrigem) {
            return NextResponse.json({ error: 'Configuração de frete ausente no servidor.' }, { status: 500 });
        }

        const response = await fetch('https://www.superfrete.com/api/v0/calculator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                from: { postal_code: cepOrigem },
                to: { postal_code: cepLimpo },
                services: '1,2,17',
                package: {
                    weight: peso,
                    width: largura,
                    height: altura,
                    length: comprimento,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('SuperFrete API error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Não foi possível calcular o frete para este CEP. Verifique e tente novamente.' },
                { status: 400 }
            );
        }

        const data = await response.json();

        const opcoes = Array.isArray(data)
            ? data.filter((s: any) => !s.error && s.price).map((s: any) => ({
                id: s.id,
                nome: s.name,
                preco: parseFloat(s.price),
                prazo: s.custom_delivery_time || s.delivery_time || '?',
            }))
            : [];

        if (opcoes.length === 0) {
            return NextResponse.json({ error: 'Nenhuma opção de frete disponível para este CEP.' }, { status: 400 });
        }

        return NextResponse.json({ opcoes });
    } catch (error) {
        console.error('Erro ao calcular frete:', error);
        return NextResponse.json({ error: 'Erro interno ao calcular frete.' }, { status: 500 });
    }
}
