import dotenv from 'dotenv';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import sharp from 'sharp';

dotenv.config({ path: '.env.local' });

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME || 'gringa-imagens';

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error('Credenciais R2 ausentes no .env.local');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function run() {
  console.log(`Verificando bucket ${bucket}...`);
  let continuationToken = undefined;
  let totalSavedBytes = 0;
  let processedCount = 0;
  let skippedCount = 0;

  do {
    const listRes = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }));

    const contents = listRes.Contents || [];
    for (const item of contents) {
      const key = item.Key;
      const size = item.Size || 0;

      // Se não for imagem ou se já for menor que 350KB, pula
      const isImage = key.match(/\.(webp|png|jpe?g|avif)$/i);
      if (!isImage || size < 350 * 1024) {
        skippedCount++;
        continue;
      }

      console.log(`\nOtimizando: ${key} (${(size / 1024).toFixed(1)} KB)...`);

      try {
        const getRes = await s3.send(new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }));

        const originalBuffer = await streamToBuffer(getRes.Body);

        const optimizedBuffer = await sharp(originalBuffer)
          .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80, effort: 5 })
          .toBuffer();

        const newSize = optimizedBuffer.length;
        const saved = size - newSize;

        if (saved > 0) {
          await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: optimizedBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          }));

          totalSavedBytes += saved;
          processedCount++;
          console.log(`  -> Reduzido para ${(newSize / 1024).toFixed(1)} KB (Economia: ${(saved / 1024).toFixed(1)} KB, -${((saved / size) * 100).toFixed(0)}%)`);
        } else {
          console.log(`  -> Já estava no melhor tamanho possível.`);
          skippedCount++;
        }
      } catch (err) {
        console.error(`  -> Erro ao processar ${key}:`, err.message);
      }
    }

    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  console.log('\n======================================');
  console.log(`Concluído!`);
  console.log(`Imagens comprimidas: ${processedCount}`);
  console.log(`Imagens ignoradas/já leves: ${skippedCount}`);
  console.log(`Total economizado: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log('======================================');
}

run().catch((err) => {
  console.error('Falha geral:', err);
  process.exit(1);
});

