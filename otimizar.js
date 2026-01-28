const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

// CONFIGURAÇÃO COM SERVICE ROLE (MODO DEUS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🚀 Iniciando Otimização Brutal [SERVICE ROLE MODE] - Gringa Style");

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = [
    'banners-campanhas',
    'imagens-premios',
    'imagens-rifas',
    'gringa-style-produtos'
];

// Extensões que o Sharp consegue processar
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff'];

async function processAllBuckets() {
    for (const bucketName of BUCKETS) {
        console.log(`\n--- Varrendo Bucket: [${bucketName}] ---`);

        const { data: files, error } = await supabase.storage.from(bucketName).list();

        if (error) {
            console.error(`❌ Erro no bucket ${bucketName}:`, error.message);
            continue;
        }

        if (!files || files.length === 0) {
            console.log(`ℹ️ Bucket vazio.`);
            continue;
        }

        for (const file of files) {
            if (file.name.includes('.emptyFolderPlaceholder')) continue;

            const ext = path.extname(file.name).toLowerCase();

            // Pula vídeos e outros formatos não suportados
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                console.log(`⏩ Pulando (não é imagem): ${file.name}`);
                continue;
            }

            console.log(`🔄 Otimizando: ${file.name}...`);

            try {
                // 1. Download
                const { data: blob, error: dlError } = await supabase.storage.from(bucketName).download(file.name);
                if (dlError) throw dlError;

                // 2. Otimização (WebP + 1200px)
                const arrayBuffer = await blob.arrayBuffer();
                const optimized = await sharp(Buffer.from(arrayBuffer))
                    .resize(1200, null, { withoutEnlargement: true })
                    .webp({ quality: 75 })
                    .toBuffer();

                // 3. Upload com Upsert (A Service Role garante a sobrescrita)
                const { error: upError } = await supabase.storage.from(bucketName).upload(file.name, optimized, {
                    contentType: 'image/webp',
                    upsert: true
                });

                if (upError) throw upError;
                console.log(`✅ ${file.name} finalizado.`);

            } catch (err) {
                console.error(`⚠️ Falha em ${file.name}:`, err.message);
            }
        }
    }
    console.log("\n✨ Otimização concluída. Agora os buckets estão magros.");
    console.log("Dica: Os vídeos (.mp4) foram ignorados. Remova-os manualmente ou hospede-os em um CDN externo para zerar o Egress.");
}

processAllBuckets();