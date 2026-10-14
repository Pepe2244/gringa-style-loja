import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function optimizeImages() {
  const dir = path.join(process.cwd(), 'public', 'imagens');

  console.log('--- Otimizando Imagens Críticas ---');

  // 1. logo_gringa_style.png
  const logoBuf = await sharp(path.join(dir, 'logo_gringa_style.png'))
    .resize(960, 960, { fit: 'inside' })
    .png({ compressionLevel: 9, quality: 85, effort: 8 })
    .toBuffer();
  fs.writeFileSync(path.join(dir, 'logo_gringa_style.png'), logoBuf);
  console.log('logo_gringa_style.png otimizado:', (logoBuf.length / 1024).toFixed(1), 'KB');

  // 2. gringa_style_logo.png
  fs.writeFileSync(path.join(dir, 'gringa_style_logo.png'), logoBuf);
  console.log('gringa_style_logo.png otimizado:', (logoBuf.length / 1024).toFixed(1), 'KB');

  // 3. unnamed.png
  const unnamedBuf = await sharp(path.join(dir, 'unnamed.png'))
    .resize(960, 960, { fit: 'inside' })
    .png({ compressionLevel: 9, quality: 85, effort: 8 })
    .toBuffer();
  fs.writeFileSync(path.join(dir, 'unnamed.png'), unnamedBuf);
  console.log('unnamed.png otimizado:', (unnamedBuf.length / 1024).toFixed(1), 'KB');

  // 4. x.png
  const xBuf = await sharp(path.join(dir, 'x.png'))
    .resize(960, 960, { fit: 'inside' })
    .png({ compressionLevel: 9, quality: 85, effort: 8 })
    .toBuffer();
  fs.writeFileSync(path.join(dir, 'x.png'), xBuf);
  console.log('x.png otimizado:', (xBuf.length / 1024).toFixed(1), 'KB');

  // 5. este
  const esteBuf = await sharp(path.join(dir, 'este'))
    .resize(960, 960, { fit: 'inside' })
    .png({ compressionLevel: 9, quality: 85, effort: 8 })
    .toBuffer();
  fs.writeFileSync(path.join(dir, 'este'), esteBuf);
  console.log('este otimizado:', (esteBuf.length / 1024).toFixed(1), 'KB');

  // 6. favicon.svg
  const favPng = fs.readFileSync(path.join(process.cwd(), 'public', 'favicon-96x96.png'));
  const favB64 = favPng.toString('base64');
  const favSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><image width="96" height="96" href="data:image/png;base64,${favB64}"/></svg>`;
  fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), favSvg, 'utf-8');
  console.log('favicon.svg otimizado:', (Buffer.byteLength(favSvg) / 1024).toFixed(1), 'KB');

  console.log('--- Otimização Concluída com Sucesso ---');
}

optimizeImages().catch((err) => {
  console.error('Erro na otimização:', err);
  process.exit(1);
});
