import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { to_postal_code } = await request.json();

        if (!to_postal_code) {
            return NextResponse.json({ error: 'CEP de destino não fornecido' }, { status: 400 });
        }

        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzMyNjQ1NjQsInN1YiI6Imo2SXRKM3J4QXVXeEdCdzlHOERxc1BxdTY0eTIifQ.V8I1ZQySq2xJihO9Q7HtEh0iP4St22j7-06vyAgTHCg';

        const payload = {
            from: { postal_code: "18207185" }, // Origem Itapetininga Centro
            to: { postal_code: to_postal_code.replace(/\D/g, '') },
            services: "1,2", // 1 = PAC, 2 = SEDEX
            options: {
                own_hand: false,
                receipt: false,
                insurance_value: 0
            },
            package: {
                format: 1, // 1 Caixa
                weight: "1.00",
                length: 35,
                height: 35,
                width: 35
            }
        };

        const response = await fetch('https://api.superfrete.com/api/v0/calculator', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('SuperFrete API Error:', data);
            return NextResponse.json({ error: 'Erro na API do SuperFrete' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro na rota de frete:', error);
        return NextResponse.json({ error: 'Erro interno ao calcular frete' }, { status: 500 });
    }
}
