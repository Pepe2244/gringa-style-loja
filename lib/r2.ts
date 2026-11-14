import 'server-only';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let clientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (clientInstance) return clientInstance;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Configuração de credenciais do Cloudflare R2 incompleta.');
  }

  clientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return clientInstance;
}

export const r2Client = {
  send: (cmd: PutObjectCommand) => getR2Client().send(cmd),
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string) {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!bucket || !publicUrl) {
    throw new Error('Configuração de armazenamento R2 incompleta.');
  }

  const ext = MIME_TO_EXTENSION[contentType];
  if (!ext) {
    throw new Error(`Tipo de conteúdo não suportado para upload: ${contentType}`);
  }

  // Remove qualquer extensão original e deriva a extensão final estritamente do MIME detectado
  const rawBaseName = fileName.replace(/\.[^/.]+$/, '');
  const sanitizedBaseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'arquivo';
  const key = `${Date.now()}-${sanitizedBaseName}${ext}`;
  
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${publicUrl.replace(/\/+$/, '')}/${key}`;
}
