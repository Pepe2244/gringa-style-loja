import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  // Otimização de rede para evitar conexões penduradas e melhorar o TTFB
  requestHandler: {
    connectionTimeout: 5000,
    socketTimeout: 5000,
  } as any,
});

export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string) {
  // Limpeza de caracteres especiais do nome do arquivo para evitar erros de URL
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${Date.now()}-${sanitizedFileName}`;
  
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}
