import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';
import { isAdminAuthenticated } from '@/lib/admin-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 64 * 1024;

function matchesFileSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === 'image/png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  if (contentType === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (contentType === 'image/gif') return ['GIF87a', 'GIF89a'].includes(String.fromCharCode(...bytes.slice(0, 6)));
  if (contentType === 'image/avif') {
    const brand = String.fromCharCode(...bytes.slice(4, 12));
    return brand.startsWith('ftypavif') || brand.startsWith('ftypavis');
  }
  if (contentType === 'video/mp4') return String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';
  if (contentType === 'video/webm') return [0x1a, 0x45, 0xdf, 0xa3].every((byte, index) => bytes[index] === byte);
  return false;
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

    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'video/mp4',
      'video/webm',
    ]);
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: 'Formato de arquivo não permitido.' }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!matchesFileSignature(buffer, file.type)) {
      return NextResponse.json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' }, { status: 415 });
    }

    const publicUrl = await uploadToR2(buffer, file.name, file.type);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Erro no upload R2:', error);
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }
}