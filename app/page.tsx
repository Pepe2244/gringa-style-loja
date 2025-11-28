'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import Modal from '@/components/Modal';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function Home() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortType, setSortType] = useState('padrao');
  const [diasNovo, setDiasNovo] = useState(7);

  // Modals State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{ tipo: string; opcao: string } | null>(null);

  // Purchase Modal State
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [installments, setInstallments] = useState('1x');

  // Details Modal Gallery State
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, sortType, products]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, configRes] = await Promise.all([
        supabase.from('produtos').select('*').order('id', { ascending: true }),
        supabase.from('categorias').select('*').order('nome'),
        supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle()
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (configRes.data) setDiasNovo(parseInt(configRes.data.valor));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrecoFinal = (p: Product) => {
    if (!p.preco_promocional || p.preco_promocional >= p.preco) {
      return p.preco;
    }
    return p.preco_promocional;
  };

  const applyFilters = () => {
    let result = products.filter(product => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        product.nome.toLowerCase().includes(term) ||
        product.descricao.toLowerCase().includes(term) ||
        (product.tags && product.tags.join(' ').toLowerCase().includes(term));

      const matchCategory = selectedCategory ? product.categoria_id === selectedCategory : true;

      return matchSearch && matchCategory;
    });

    // Sorting
    if (sortType === 'menor-preco') {
      result.sort((a, b) => getPrecoFinal(a) - getPrecoFinal(b));
    } else if (sortType === 'maior-preco') {
      result.sort((a, b) => getPrecoFinal(b) - getPrecoFinal(a));
    } else if (sortType === 'az') {
      result.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (sortType === 'za') {
      result.sort((a, b) => b.nome.localeCompare(a.nome));
    } else {
      // Default: Newest first logic
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - diasNovo);

      result.sort((a, b) => {
        const aNew = a.created_at && new Date(a.created_at) > limitDate;
        const bNew = b.created_at && new Date(b.created_at) > limitDate;

        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        return a.nome.localeCompare(b.nome);
      });
    }

    setFilteredProducts(result);
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setCurrentModalImageIndex(0);

    if (product.variants) {
      setIsDetailsModalOpen(true);
    } else {
      setIsPurchaseModalOpen(true);
    }
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    let variantToAdd = null;
    if (selectedProduct.variants && selectedProduct.variants.opcoes.length > 0) {
      // If variants exist, we need to check if one is selected.
      // For simplicity in this migration, we'll assume the first one if not set, 
      // or we should have a state for it in the modal.
      // The original script reads from the DOM select element.
      // We need to bind this to state.
      if (!selectedVariant) {
        // Default to first option if not selected
        variantToAdd = {
          tipo: selectedProduct.variants.tipo,
          opcao: selectedProduct.variants.opcoes[0]
        };
      } else {
        variantToAdd = selectedVariant;
      }
    }

    const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
    const itemIndex = carrinho.findIndex((item: any) =>
      item.produto_id === selectedProduct.id &&
      JSON.stringify(item.variante) === JSON.stringify(variantToAdd)
    );

    if (itemIndex > -1) {
      carrinho[itemIndex].quantidade++;
    } else {
      carrinho.push({
        produto_id: selectedProduct.id,
        quantidade: 1,
        variante: variantToAdd
      });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    window.dispatchEvent(new Event('cart-updated'));
    setIsDetailsModalOpen(false);
    showToast('Produto adicionado ao carrinho!', 'success');
  };

  const handleDirectPurchase = () => {
    if (!selectedProduct || !clientName.trim()) {
      showToast('Por favor, preencha seu nome.', 'error');
      return;
    }

    const precoFinal = getPrecoFinal(selectedProduct);
    let message = `Olá, Gringa Style! 👋\n\nMeu nome é *${clientName}* e eu gostaria de comprar este item:\n\n`;
    message += `*Produto:* ${selectedProduct.nome}`;
    if (selectedVariant) {
      message += ` (${selectedVariant.tipo}: ${selectedVariant.opcao})`;
    }
    message += `\n*Valor:* R$ ${precoFinal.toFixed(2).replace('.', ',')}\n\n`;

    if (precoFinal < selectedProduct.preco) {
      message += `_(Valor promocional)_\n\n`;
    }

    if (paymentMethod === 'Cartão de Crédito') {
      message += `*Pagamento:* ${paymentMethod} em ${installments}\n\nAguardo o link para pagamento.`;
    } else {
      message += `*Pagamento:* ${paymentMethod}\n\nAguardo a chave PIX.`;
    }

    window.open(`https://wa.me/5515998608170?text=${encodeURIComponent(message)}`, '_blank');
    setIsPurchaseModalOpen(false);
  };

  // Modal Image Navigation
  const getModalImages = () => {
    if (!selectedProduct) return [];
    const mediaUrls = selectedProduct.media_urls || selectedProduct.imagens || [];
    return mediaUrls.filter(url => !url.includes('.mp4') && !url.includes('.webm'));
  };

  const modalImages = getModalImages();

  return (
    <main>
      <div className="container">
        <h1 className="titulo-secao">Nossos Produtos</h1>

        <div className="search-container">
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="search"
              id="search-input"
              placeholder="Buscar por máscara, tocha, lente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                style={{ display: 'block' }}
                onClick={() => setSearchTerm('')}
              >
                <X size={20} />
              </button>
            )}
          </div>

          <select
            id="categoria-select"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
            style={{ padding: '10px', borderRadius: '25px', border: 'none', background: '#333', color: 'white', marginLeft: '10px', cursor: 'pointer' }}
          >
            <option value="">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>

          <select
            id="sort-select"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            style={{ padding: '10px', borderRadius: '25px', border: 'none', background: '#333', color: 'white', marginLeft: '10px', cursor: 'pointer' }}
          >
            <option value="padrao">Ordenar por</option>
            <option value="menor-preco">Menor Preço</option>
            <option value="maior-preco">Maior Preço</option>
            <option value="az">Nome (A-Z)</option>
            <option value="za">Nome (Z-A)</option>
          </select>
        </div>

        <div id="vitrine-produtos" className="vitrine" style={{ minHeight: '300px' }}>
          {loading ? (
            <p style={{ color: 'white', textAlign: 'center' }}>Carregando produtos...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', fontSize: '1.2em' }}>Nenhum produto encontrado para sua busca.</p>
          ) : (
            filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                diasNovo={diasNovo}
                onQuickView={handleQuickView}
              />
            ))
          )}
        </div>

        <section id="sobre" className="secao-info">
          <h2 className="titulo-secao">Sobre a Gringa Style</h2>
          <p>
            Somos especializados em equipamentos para solda TIG. A Gringa Style oferece máscaras de solda
            personalizadas, tochas TIG profissionais e lentes de alta performance.
            Nossos produtos unem estilo único e proteção máxima para o soldador moderno.
          </p>
        </section>

        <section id="contato" className="secao-info">
          <h2 className="titulo-secao">Entre em Contato</h2>
          <p>
            Pronto para elevar o nível da sua solda? Fale conosco pelo WhatsApp para um atendimento rápido.
            Entregamos para todo o Brasil.
          </p>
        </section>
      </div>

      {/* Product Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)}>
        {selectedProduct && (
          <>
            <div className="modal-imagem">
              {(() => {
                const mediaUrls = selectedProduct.media_urls || selectedProduct.imagens || [];
                const videoUrl = selectedProduct.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));

                if (videoUrl) {
                  return <video src={videoUrl} className="card-video" autoPlay loop muted playsInline />;
                }

                const images = getModalImages();
                const currentImage = images.length > 0 ? images[currentModalImageIndex] : '/imagens/gringa_style_logo.png';

                return (
                  <div style={{ position: 'relative' }}>
                    <img src={currentImage} alt={selectedProduct.nome} style={{ width: '100%', borderRadius: '5px' }} />
                    {images.length > 1 && (
                      <>
                        <button
                          className="modal-seta"
                          id="modal-seta-esq"
                          style={{ display: 'block' }}
                          onClick={() => setCurrentModalImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        >
                          &lt;
                        </button>
                        <button
                          className="modal-seta"
                          id="modal-seta-dir"
                          style={{ display: 'block' }}
                          onClick={() => setCurrentModalImageIndex((prev) => (prev + 1) % images.length)}
                        >
                          &gt;
                        </button>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="modal-conteudo">
              <h2 className="modal-titulo">{selectedProduct.nome}</h2>
              <p>{selectedProduct.descricao}</p>

              {selectedProduct.variants && selectedProduct.variants.opcoes.length > 0 && (
                <div className="variantes-container">
                  <label>{selectedProduct.variants.tipo}:</label>
                  <select
                    className="select-variante"
                    onChange={(e) => setSelectedVariant({ tipo: selectedProduct.variants!.tipo, opcao: e.target.value })}
                    value={selectedVariant?.opcao || selectedProduct.variants.opcoes[0]}
                  >
                    {selectedProduct.variants.opcoes.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              <p className="modal-preco">
                {getPrecoFinal(selectedProduct) < selectedProduct.preco ? (
                  <>
                    <span className="preco-antigo">De R$ {selectedProduct.preco.toFixed(2).replace('.', ',')}</span>{' '}
                    <span className="preco-novo">Por R$ {getPrecoFinal(selectedProduct).toFixed(2).replace('.', ',')}</span>
                  </>
                ) : (
                  `R$ ${selectedProduct.preco.toFixed(2).replace('.', ',')}`
                )}
              </p>

              <div className="produto-botoes">
                <button className="btn" onClick={addToCart}>Adicionar ao Carrinho</button>
                <button className="btn btn-secundario" onClick={() => {
                  setIsDetailsModalOpen(false);
                  setIsPurchaseModalOpen(true);
                }}>Comprar via WhatsApp</button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Direct Purchase Modal */}
      <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} className="modal-compra-direta">
        {selectedProduct && (
          <>
            <h2 className="modal-titulo">Finalizar Pedido</h2>
            <div id="modal-compra-resumo-produto">
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {/* Simplified image preview for purchase modal */}
                <img
                  src={(selectedProduct.media_urls?.find(u => !u.includes('.mp4')) || '/imagens/gringa_style_logo.png')}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }}
                  alt={selectedProduct.nome}
                />
                <div>
                  <h3>{selectedProduct.nome}</h3>
                  {selectedVariant && <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{selectedVariant.tipo}: {selectedVariant.opcao}</p>}
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--cor-destaque)' }}>
                    R$ {getPrecoFinal(selectedProduct).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>

            <div className="campo-cliente">
              <label htmlFor="modal-nome-cliente">Seu Nome Completo</label>
              <input
                type="text"
                id="modal-nome-cliente"
                className="input-cliente"
                placeholder="Digite seu nome"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div className="resumo-pagamento">
              <label htmlFor="modal-forma-pagamento">Forma de Pagamento</label>
              <select
                id="modal-forma-pagamento"
                className="select-pagamento"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
              </select>
            </div>

            {paymentMethod === 'Cartão de Crédito' && (
              <div className="resumo-pagamento">
                <label htmlFor="modal-numero-parcelas">Parcelas</label>
                <select
                  id="modal-numero-parcelas"
                  className="select-pagamento"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                >
                  <option value="1x">1x sem juros</option>
                  <option value="2x">2x</option>
                  <option value="3x">3x</option>
                  <option value="12x">12x</option>
                </select>
              </div>
            )}

            <button className="btn btn-finalizar" onClick={handleDirectPurchase}>Confirmar Pedido no WhatsApp</button>
          </>
        )}
      </Modal>
    </main>
  );
}
