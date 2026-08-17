import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="produto-card animate-pulse" style={{ borderColor: 'transparent' }}>
      <div className="card-imagem-container bg-gray-700">
        {/* Espaço reservado para a imagem com aspect-ratio definido no CSS */}
      </div>
      <div className="produto-info" style={{ transform: 'translateY(0)', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
        <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="produto-botoes">
          <div className="btn bg-gray-600 h-11 w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;