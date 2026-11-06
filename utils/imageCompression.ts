export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    const isImageByMime = file.type && file.type.toLowerCase().includes('image');
    const isImageByExt = /\.(jpe?g|png|webp|avif|bmp|gif)$/i.test(file.name);

    if (!isImageByMime && !isImageByExt) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Tenta salvar como WebP primeiro
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            // Se falhar o WebP, tenta JPEG
                            canvas.toBlob(
                                (fallbackBlob) => {
                                    if (!fallbackBlob) {
                                        resolve(file);
                                        return;
                                    }
                                    const baseName = file.name.replace(/\.[^/.]+$/, "");
                                    resolve(new File([fallbackBlob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
                                },
                                'image/jpeg',
                                quality
                            );
                            return;
                        }

                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        const newFile = new File([blob], `${baseName}.webp`, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}
