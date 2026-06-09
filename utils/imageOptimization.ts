import { useState, useEffect } from 'react';

// Tipos para configuração de imagem
export interface ImageOptimizationConfig {
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

// Hook para detectar capacidades do navegador
export function useBrowserCapabilities() {
    const [capabilities, setCapabilities] = useState({
        supportsWebP: false,
        supportsAVIF: false,
        connectionSpeed: 'fast',
        saveData: false,
        devicePixelRatio: 1
    });

    useEffect(() => {
        const checkCapabilities = async () => {
            // Verificar suporte a WebP
            const webpSupport = await checkWebPSupport();

            // Verificar suporte a AVIF
            const avifSupport = await checkAVIFSupport();

            // Verificar conexão
            const connection = (navigator as any).connection ||
                             (navigator as any).mozConnection ||
                             (navigator as any).webkitConnection;

            const connectionInfo = {
                effectiveType: connection?.effectiveType || '4g',
                saveData: connection?.saveData || false
            };

            // Determinar velocidade de conexão
            let connectionSpeed = 'fast';
            if (connectionInfo.saveData) {
                connectionSpeed = 'save-data';
            } else if (connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g') {
                connectionSpeed = 'slow';
            } else if (connectionInfo.effectiveType === '3g') {
                connectionSpeed = 'medium';
            }

            setCapabilities({
                supportsWebP: webpSupport,
                supportsAVIF: avifSupport,
                connectionSpeed,
                saveData: connectionInfo.saveData,
                devicePixelRatio: window.devicePixelRatio || 1
            });
        };

        checkCapabilities();
    }, []);

    return capabilities;
}

// Verificar suporte a WebP
async function checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => resolve(webP.height === 2);
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
}

// Verificar suporte a AVIF
async function checkAVIFSupport(): Promise<boolean> {
    return new Promise((resolve) => {
        const avif = new Image();
        avif.onload = avif.onerror = () => resolve(avif.height === 2);
        avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
}

// Gerar URL otimizada baseada nas capacidades
export function generateOptimizedImageUrl(
    originalUrl: string,
    config: ImageOptimizationConfig = {},
    capabilities = { supportsWebP: true, supportsAVIF: false, connectionSpeed: 'fast', saveData: false, devicePixelRatio: 1 }
): string {
    // Se for uma URL externa ou já otimizada, retornar como está
    if (!originalUrl || originalUrl.startsWith('http') && !originalUrl.includes('supabase')) {
        return originalUrl;
    }

    // Configuração baseada nas capacidades do navegador
    const format = config.format ||
        (capabilities.supportsAVIF ? 'avif' :
         capabilities.supportsWebP ? 'webp' : 'jpg');

    // Ajustar qualidade baseada na conexão
    let quality = config.quality || 80;
    if (capabilities.saveData) {
        quality = Math.max(quality - 30, 50);
    } else if (capabilities.connectionSpeed === 'slow') {
        quality = Math.max(quality - 20, 60);
    } else if (capabilities.connectionSpeed === 'medium') {
        quality = Math.max(quality - 10, 70);
    }

    // Ajustar dimensões para dispositivos de alta densidade
    const width = config.width;
    const height = config.height;

    if (capabilities.devicePixelRatio > 1 && !width && !height) {
        // Para telas retina, podemos manter o tamanho original
        // pois o navegador fará o downsampling
    }

    // Construir parâmetros de transformação
    const transformParams = new URLSearchParams();

    if (width) transformParams.set('width', width.toString());
    if (height) transformParams.set('height', height.toString());
    if (config.fit) transformParams.set('fit', config.fit);
    transformParams.set('quality', quality.toString());
    transformParams.set('format', format);

    // Para Supabase Storage, usar a API de transformação
    if (originalUrl.includes('supabase')) {
        const url = new URL(originalUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'object') + 2;
        const objectPath = pathParts.slice(bucketIndex).join('/');

        return `${url.origin}/storage/v1/object/public/${pathParts[bucketIndex - 1]}/${objectPath}?${transformParams.toString()}`;
    }

    // Para outras URLs, adicionar parâmetros como query string
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${transformParams.toString()}`;
}

// Hook para otimização automática de imagens
export function useImageOptimization() {
    const capabilities = useBrowserCapabilities();

    const optimizeImage = (url: string, config?: ImageOptimizationConfig) => {
        return generateOptimizedImageUrl(url, config, capabilities);
    };

    return { optimizeImage, capabilities };
}

// Componente para preload de imagens críticas
export function ImagePreloader({ images }: { images: string[] }) {
    useEffect(() => {
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, [images]);

    return null;
}

// Utilitário para compressão de imagens no upload
export async function compressImage(
    file: File,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
    } = {}
): Promise<File> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calcular novas dimensões
            const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'jpeg' } = options;

            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // Desenhar e comprimir
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: `image/${format}`,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Falha na compressão'));
                    }
                },
                `image/${format}`,
                quality
            );
        };

        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = URL.createObjectURL(file);
    });
}

// Hook para compressão automática durante upload
export function useImageCompression() {
    const compress = async (file: File, options?: Parameters<typeof compressImage>[1]) => {
        try {
            const compressed = await compressImage(file, options);
            return compressed;
        } catch (error) {
            console.warn('Compressão falhou, usando arquivo original:', error);
            return file;
        }
    };

    return { compress };
}