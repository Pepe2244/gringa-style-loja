'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useImageOptimization } from '../utils/imageOptimization';

interface Product {
    id: string;
    nome: string;
    preco: number;
    preco_original?: number;
    imagem_principal: string;
    categoria: string;
    tags: string[];
    rating?: number;
    total_vendas?: number;
}

interface RecommendationEngineProps {
    currentProductId: string;
    currentCategory: string;
    currentTags: string[];
    cartItems?: Product[];
    userHistory?: string[];
    maxRecommendations?: number;
    type: 'upsell' | 'cross-sell' | 'related' | 'frequently-bought-together';
}

export default function RecommendationEngine({
    currentProductId,
    currentCategory,
    currentTags,
    cartItems = [],
    userHistory = [],
    maxRecommendations = 4,
    type
}: RecommendationEngineProps) {
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { optimizeImage } = useImageOptimization();

    const getFallbackRecommendations = useCallback(async (): Promise<Product[]> => {
        // Buscar produtos da mesma categoria como fallback
        try {
            const response = await fetch(`/api/produtos?categoria=${encodeURIComponent(currentCategory)}&limit=${maxRecommendations}&exclude=${currentProductId}`);
            if (response.ok) {
                const data = await response.json();
                return data.produtos || [];
            }
        } catch (error) {
            console.error('Erro no fallback de recomendações:', error);
        }
        return [];
    }, [currentCategory, currentProductId, maxRecommendations]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);

                // Buscar produtos relacionados baseado no tipo de recomendação
                const response = await fetch('/api/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId: currentProductId,
                        category: currentCategory,
                        tags: currentTags,
                        cartItems: cartItems.map(item => item.id),
                        userHistory,
                        type,
                        limit: maxRecommendations
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setRecommendations(data.products || []);
                } else {
                    // Fallback para recomendações básicas
                    setRecommendations(await getFallbackRecommendations());
                }
            } catch (error) {
                console.error('Erro ao buscar recomendações:', error);
                setRecommendations(await getFallbackRecommendations());
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [currentProductId, currentCategory, currentTags, cartItems, userHistory, type, maxRecommendations, getFallbackRecommendations]);

    const getRecommendationTitle = () => {
        switch (type) {
            case 'upsell':
                return 'Produtos Premium';
            case 'cross-sell':
                return 'Produtos Complementares';
            case 'related':
                return 'Produtos Relacionados';
            case 'frequently-bought-together':
                return 'Frequentemente Comprados Juntos';
            default:
                return 'Recomendações';
        }
    };

    const getRecommendationReason = (product: Product) => {
        switch (type) {
            case 'upsell':
                return product.preco > 0 ? 'Produto premium' : 'Alta qualidade';
            case 'cross-sell':
                return 'Complementa seu produto';
            case 'related':
                return 'Mesma categoria';
            case 'frequently-bought-together':
                return 'Clientes também compraram';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="recommendation-engine">
                <h3 className="recommendation-title">{getRecommendationTitle()}</h3>
                <div className="recommendation-grid">
                    {Array.from({ length: maxRecommendations }).map((_, index) => (
                        <div key={index} className="recommendation-skeleton">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-text"></div>
                            <div className="skeleton-text short"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="recommendation-engine">
            <h3 className="recommendation-title">{getRecommendationTitle()}</h3>
            <div className="recommendation-grid">
                {recommendations.map((product) => (
                    <Link
                        key={product.id}
                        href={`/produto/${product.id}`}
                        className="recommendation-card"
                    >
                        <div className="recommendation-image">
                            <img
                                src={optimizeImage(product.imagem_principal, {
                                    width: 200,
                                    height: 200,
                                    fit: 'cover'
                                })}
                                alt={product.nome}
                                loading="lazy"
                            />
                        </div>
                        <div className="recommendation-info">
                            <h4 className="recommendation-name">{product.nome}</h4>
                            <div className="recommendation-price">
                                {product.preco_original && product.preco_original > product.preco && (
                                    <span className="original-price">
                                        R$ {product.preco_original.toFixed(2)}
                                    </span>
                                )}
                                <span className="current-price">
                                    R$ {product.preco.toFixed(2)}
                                </span>
                            </div>
                            {product.rating && (
                                <div className="recommendation-rating">
                                    ⭐ {product.rating.toFixed(1)}
                                </div>
                            )}
                            <div className="recommendation-reason">
                                {getRecommendationReason(product)}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <style jsx>{`
                .recommendation-engine {
                    margin: 2rem 0;
                    padding: 1.5rem;
                    background: var(--cor-fundo-secundario, #f8f9fa);
                    border-radius: 12px;
                    border: 1px solid var(--cor-borda, #e9ecef);
                }

                .recommendation-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--cor-texto, #333);
                    margin-bottom: 1rem;
                    text-align: center;
                }

                .recommendation-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .recommendation-card {
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    text-decoration: none;
                    color: inherit;
                }

                .recommendation-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }

                .recommendation-image {
                    position: relative;
                    width: 100%;
                    height: 150px;
                    overflow: hidden;
                }

                .recommendation-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.2s ease;
                }

                .recommendation-card:hover .recommendation-image img {
                    transform: scale(1.05);
                }

                .recommendation-info {
                    padding: 0.75rem;
                }

                .recommendation-name {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--cor-texto, #333);
                    margin-bottom: 0.5rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.3;
                }

                .recommendation-price {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }

                .original-price {
                    font-size: 0.8rem;
                    color: var(--cor-texto-secundario, #666);
                    text-decoration: line-through;
                }

                .current-price {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--cor-destaque, #ff6b35);
                }

                .recommendation-rating {
                    font-size: 0.8rem;
                    color: var(--cor-texto-secundario, #666);
                    margin-bottom: 0.25rem;
                }

                .recommendation-reason {
                    font-size: 0.75rem;
                    color: var(--cor-texto-secundario, #666);
                    font-style: italic;
                }

                .recommendation-skeleton {
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .skeleton-image {
                    width: 100%;
                    height: 150px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }

                .skeleton-text {
                    height: 16px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    margin: 0.75rem;
                    border-radius: 4px;
                }

                .skeleton-text.short {
                    width: 60%;
                    height: 12px;
                    margin: 0.5rem 0.75rem;
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                @media (max-width: 768px) {
                    .recommendation-grid {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 0.75rem;
                    }

                    .recommendation-engine {
                        margin: 1rem 0;
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}