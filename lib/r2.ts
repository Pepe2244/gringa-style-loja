import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadToR2(fileBuffer: Buffer, fileName: string, contentType: string) {
  const key = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
  
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}