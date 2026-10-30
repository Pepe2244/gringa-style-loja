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

export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string) {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!bucket || !publicUrl) {
    throw new Error('Configuração de armazenamento R2 incompleta.');
  }

  // Limpeza de caracteres especiais do nome do arquivo para evitar erros de URL
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${Date.now()}-${sanitizedFileName}`;
  
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
