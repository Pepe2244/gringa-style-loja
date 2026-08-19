import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const publicUrl = await uploadToR2(buffer, file.name, file.type);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Erro no upload R2:', error);
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }
}