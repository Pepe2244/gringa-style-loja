import { NextResponse } from 'next/server';
import {
    quoteShipping,
    getShippingFallback,
    ShippingInputError,
    type ShippingQuoteInput,
} from '@/lib/shipping';

export async function POST(request: Request) {
    let countryForFallback = 'BR';
    let postalForFallback: string | undefined;
    try {
        const payloadJson: unknown = await request.json();
        if (!payloadJson || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
            return NextResponse.json({ error: 'Dados de frete inválidos.' }, { status: 400 });
        }
        const input = payloadJson as ShippingQuoteInput;
        if (typeof input.country === 'string' && input.country.trim()) {
            countryForFallback = input.country.trim().toUpperCase() === 'BRASIL' ? 'BR' : input.country.trim().toUpperCase();
        }
        if (typeof input.to_postal_code === 'string') {
            postalForFallback = input.to_postal_code;
        }

        const options = await quoteShipping(input);
        return NextResponse.json(options);
    } catch (error) {
        if (error instanceof ShippingInputError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Erro na rota de frete:', error);
        return NextResponse.json(getShippingFallback(countryForFallback, postalForFallback));
    }
}
