'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { trackImageZoom } from '@/utils/analytics';

interface ImageZoomProps {
    src: string;
    alt: string;
    imageIndex?: number;
    productId?: number;
}

export default function ImageZoom({ src, alt, imageIndex = 0, productId }: ImageZoomProps) {
    const [isZoomed, setIsZoomed] = useState(false);

    const handleZoomClick = () => {
        setIsZoomed(true);
        if (productId) {
            trackImageZoom(productId, imageIndex);
        }
    };

    return (
        <>
            {/* Zoom Button */}
            <button
                onClick={handleZoomClick}
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(255, 165, 0, 0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 165, 0, 1)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 165, 0, 0.8)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Ampliar imagem"
                title="Clique para ampliar"
            >
                <ZoomIn size={20} color="white" />
            </button>

            {/* Zoom Modal */}
            <AnimatePresence>
                {isZoomed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomed(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.95)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                position: 'relative',
                                width: '90%',
                                maxWidth: '900px',
                                height: '90vh',
                                maxHeight: '900px'
                            }}
                        >
                            <Image
                                src={src}
                                alt={alt}
                                fill
                                sizes="900px"
                                style={{
                                    objectFit: 'contain'
                                }}
                                priority
                            />

                            {/* Close Button */}
                            <button
                                onClick={() => setIsZoomed(false)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: 'rgba(255, 165, 0, 0.8)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(4px)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255, 165, 0, 1)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255, 165, 0, 0.8)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                aria-label="Fechar zoom"
                            >
                                <X size={24} color="white" />
                            </button>

                            {/* Info Text */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: '#ddd',
                                    fontSize: '0.9rem',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    padding: '10px 15px',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                Clique para fechar ou pressione ESC
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
