import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';
import { isAdminAuthenticated } from '@/lib/admin-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 64 * 1024;

// Função que descobre o formato REAL através dos primeiros bytes do arquivo
function detectMimeType(bytes: Uint8Array): string | null {
  // JPEG: Inicia com FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg';
  }

  // PNG: Inicia com 89 50 4E 47 0D 0A 1A 0A
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSig.every((b, i) => bytes[i] === b)) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'image/webp';
  }

  // GIF: GIF87a ou GIF89a
  const gif = String.fromCharCode(...bytes.slice(0, 6));
  if (gif === 'GIF87a' || gif === 'GIF89a') {
    return 'image/gif';
  }

  // Formatos baseados em container ISO/IEC (MP4, AVIF, HEIC do iPhone)
  const ftyp = String.fromCharCode(...bytes.slice(4, 8));
  if (ftyp === 'ftyp') {
    const brand = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase();
    if (brand.startsWith('avif') || brand.startsWith('avis')) return 'image/avif';
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('mif1')) return 'image/heic';
    return 'video/mp4';
  }

  // WebM: 1A 45 DF A3
  const webmSig = [0x1a, 0x45, 0xdf, 0xa3];
  if (webmSig.every((b, i) => bytes[i] === b)) {
    return 'video/webm';
  }

  return null;
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
    return NextResponse.json({ error: 'Arquivo excede o tamanho máximo de 10 MB.' }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'O arquivo deve ter até 10 MB.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Detecta o tipo real a partir dos bytes da imagem
    const detectedType = detectMimeType(buffer);

    if (!detectedType) {
      return NextResponse.json({ error: 'O conteúdo do arquivo não corresponde a um formato de mídia válido.' }, { status: 415 });
    }

    // Usa o tipo detectado real para salvar corretamente no R2
    const finalContentType = detectedType;

    const publicUrl = await uploadToR2(buffer, file.name, finalContentType);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Erro no upload R2:', error);
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }
}
