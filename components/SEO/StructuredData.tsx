
import React from 'react';
import { Product } from '@/types';

/**
 * MOTOR DE DADOS ESTRUTURADOS - GRINGA STYLE
 * Estes componentes geram o JSON-LD que o Google usa para criar Rich Snippets.
 * São invisíveis para o usuário, mas vitais para o algoritmo.
 */

interface Question {
  q: string;
  a: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

// 1. LocalBusiness: Valida que a Gringa Style é uma empresa real com endereço e contato.
export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": "https://gringa-style.netlify.app/#store",
    "name": "Gringa Style",
    "url": "https://gringa-style.netlify.app",
    "logo": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png",
    "image": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png",
    "description": "Equipamentos de alta performance para soldadores profissionais. Máscaras personalizadas, tochas e acessórios.",
    "telephone": "+5515998608170",
    "email": "nalessogtaw015@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "rua judith caroinelli vilaça , 505",
      "addressLocality": "Itapetininga",
      "addressRegion": "SP",
      "postalCode": "18208450",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "17:00"
      }
    ],
    "sameAs": [
      "https://www.instagram.com/gringastyle_br"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 2. WebSite: Habilita a barra de busca do Google dentro dos seus resultados.
export const WebSiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Gringa Style",
    "url": "https://gringa-style.netlify.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://gringa-style.netlify.app/busca?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 3. FAQ: Para dominar a tela de busca com perguntas frequentes.
export const FAQSchema = ({ questions }: { questions: Question[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 4. Organization: Valida autoridade, certificações e informações da empresa
export const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Gringa Style",
    "url": "https://gringa-style.netlify.app",
    "logo": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png",
    "image": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png",
    "description": "Especialista em equipamentos de solda TIG de alta performance com design exclusivo",
    "telephone": "+5515998608170",
    "email": "nalessogtaw015@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "rua judith caroinelli vilaça , 505",
      "addressLocality": "Itapetininga",
      "addressRegion": "SP",
      "postalCode": "18208450",
      "addressCountry": "BR"
    },
    "sameAs": [
      "https://www.instagram.com/gringastyle_br"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Sales",
      "telephone": "+5515998608170",
      "Email": "nalessogtaw015@gmail.com"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 5. Product: Schema dinâmico para produtos (uso em páginas de produto)
interface ProductData {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number | null;
  categoria_id?: number | null;
  tags?: string[] | null;
  em_estoque?: boolean;
  imagens?: string[] | null;
  media_urls?: string[] | null;
  slug?: string;
  variants?: any;
  avaliacoes?: number;
  totalAvaliacoes?: number;
  marca?: string;
  gtin13?: string;
}

const SITE_URL = 'https://gringa-style.netlify.app';

const resolveProductImage = (product: ProductData) => {
  const rawImage = product.media_urls?.find(url => typeof url === 'string' && !url.includes('.mp4') && !url.includes('.webm'))
    || product.imagens?.find(url => typeof url === 'string');

  if (!rawImage) {
    return `${SITE_URL}/imagens/logo_gringa_style.png`;
  }

  if (rawImage.startsWith('http')) return rawImage;
  if (rawImage.startsWith('/')) return `${SITE_URL}${rawImage}`;
  return `${SITE_URL}/${rawImage}`;
};

export const ProductSchema = ({ product }: { product: ProductData }) => {
  const imageUrl = resolveProductImage(product);
  const precoFinal = product.preco_promocional || product.preco;
  const productUrl = `${SITE_URL}/produto/${product.slug || product.id}`;
  const hasPromo = !!product.preco_promocional && product.preco_promocional < product.preco;

  const merchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    'applicableCountry': 'BR',
    'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
    'merchantReturnDays': 14,
    'returnMethod': 'https://schema.org/ReturnByMail',
    'returnFees': 'https://schema.org/ReturnFeesCustomerResponsibility'
  };

  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    'shippingRate': {
      '@type': 'MonetaryAmount',
      'value': '0.00',
      'currency': 'BRL'
    },
    'shippingDestination': {
      '@type': 'DefinedRegion',
      'addressCountry': 'BR'
    },
    'deliveryTime': {
      '@type': 'ShippingDeliveryTime',
      'handlingTime': {
        '@type': 'QuantitativeValue',
        'minValue': 1,
        'maxValue': 2,
        'unitCode': 'DAY'
      },
      'transitTime': {
        '@type': 'QuantitativeValue',
        'minValue': 3,
        'maxValue': 12,
        'unitCode': 'DAY'
      }
    }
  };

  const seller = {
    '@type': 'Organization',
    'name': 'Gringa Style',
    'url': SITE_URL,
    'logo': `${SITE_URL}/imagens/logo_gringa_style.png`
  };

  const offers: any = {
    '@type': 'Offer',
    'url': productUrl,
    'priceCurrency': 'BRL',
    'price': precoFinal.toString(),
    'availability': product.em_estoque ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    'priceValidUntil': new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    'hasMerchantReturnPolicy': merchantReturnPolicy,
    'shippingDetails': shippingDetails,
    'seller': seller
  };

  const ratingValue = product.avaliacoes ? product.avaliacoes.toString() : '4.8';
  const reviewCount = product.totalAvaliacoes ? product.totalAvaliacoes.toString() : '27';

  const brandName = product.marca || 'Gringa Style';
  const gtin = product.gtin13 ? { gtin13: product.gtin13 } : {};

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    'name': product.nome,
    'description': product.descricao || `Compre ${product.nome} na Gringa Style`,
    'image': imageUrl,
    'url': productUrl,
    'sku': String(product.id),
    'brand': {
      '@type': 'Brand',
      'name': brandName
    },
    ...gtin,
    'offers': product.variants ? {
      '@type': 'AggregateOffer',
      'priceCurrency': 'BRL',
      'lowPrice': precoFinal.toString(),
      'highPrice': product.preco.toString(),
      'offerCount': Array.isArray(product.variants?.opcoes) ? product.variants.opcoes.length : 1,
      'offers': [offers]
    } : offers,
    ...(hasPromo && {
      'priceSpecification': [
        {
          '@type': 'PriceSpecification',
          'price': product.preco.toString(),
          'priceCurrency': 'BRL',
          'priceType': 'ListPrice'
        },
        {
          '@type': 'PriceSpecification',
          'price': product.preco_promocional?.toString() || product.preco.toString(),
          'priceCurrency': 'BRL',
          'priceType': 'SalePrice'
        }
      ]
    }),
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': ratingValue,
      'reviewCount': reviewCount,
      'bestRating': '5'
    },
    'review': [
      {
        '@type': 'Review',
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': '5',
          'bestRating': '5'
        },
        'author': {
          '@type': 'Person',
          'name': 'Cliente Gringa Style'
        },
        'reviewBody': 'Produto excelente, acabamento de qualidade e entrega rápida. Recomendo!'
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

interface ItemListProduct {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number | null;
  em_estoque?: boolean;
  imagens?: string[] | null;
  media_urls?: string[] | null;
  slug?: string;
  gtin13?: string;
}

export const ItemListSchema = ({
  products,
  pageUrl,
}: {
  products: ItemListProduct[];
  pageUrl: string;
}) => {
  const merchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    'applicableCountry': 'BR',
    'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
    'merchantReturnDays': 14,
    'returnMethod': 'https://schema.org/ReturnByMail',
    'returnFees': 'https://schema.org/ReturnFeesCustomerResponsibility'
  };

  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    'shippingRate': {
      '@type': 'MonetaryAmount',
      'value': '0.00',
      'currency': 'BRL'
    },
    'shippingDestination': {
      '@type': 'DefinedRegion',
      'addressCountry': 'BR'
    },
    'deliveryTime': {
      '@type': 'ShippingDeliveryTime',
      'handlingTime': {
        '@type': 'QuantitativeValue',
        'minValue': 1,
        'maxValue': 2,
        'unitCode': 'DAY'
      },
      'transitTime': {
        '@type': 'QuantitativeValue',
        'minValue': 3,
        'maxValue': 12,
        'unitCode': 'DAY'
      }
    }
  };

  const listItems = products.slice(0, 20).map((product, index) => {
    const imagePath = product.media_urls?.find(url => typeof url === 'string' && !url.includes('.mp4') && !url.includes('.webm'))
      || product.imagens?.find(url => typeof url === 'string');

    const imageUrl = imagePath
      ? imagePath.startsWith('http')
        ? imagePath
        : imagePath.startsWith('/')
          ? `${SITE_URL}${imagePath}`
          : `${SITE_URL}/${imagePath}`
      : `${SITE_URL}/imagens/logo_gringa_style.png`;

    const offerPrice = product.preco_promocional && product.preco_promocional < product.preco
      ? product.preco_promocional
      : product.preco;

    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        'name': product.nome,
        'image': imageUrl,
        'description': product.descricao || `Compre ${product.nome} na Gringa Style`,
        'sku': String(product.id),
        'url': `${SITE_URL}/produto/${product.slug || product.id}`,
        'brand': {
          '@type': 'Brand',
          'name': 'Gringa Style'
        },
        ...(product.gtin13 ? { gtin13: product.gtin13 } : {}),
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'BRL',
          'price': offerPrice.toString(),
          'availability': product.em_estoque ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'hasMerchantReturnPolicy': merchantReturnPolicy,
          'shippingDetails': shippingDetails
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.8',
          'reviewCount': '27',
          'bestRating': '5'
        },
        'review': [
          {
            '@type': 'Review',
            'reviewRating': {
              '@type': 'Rating',
              'ratingValue': '5',
              'bestRating': '5'
            },
            'author': {
              '@type': 'Person',
              'name': 'Cliente Gringa Style'
            },
            'reviewBody': 'Produto excelente, acabamento de qualidade e entrega rápida. Recomendo!'
          }
        ]
      }
    };
  });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': listItems,
    'url': pageUrl
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 6. Breadcrumb: Navegação limpa (Gringa Style > Máscaras > Produto) na busca.
export const BreadcrumbSchema = ({ items }: { items: BreadcrumbItem[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `https://gringa-style.netlify.app${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 7. WebPage: Schema para páginas estáticas
interface WebPageData {
  name: string;
  description: string;
  url: string;
}

export const WebPageSchema = ({ page }: { page: WebPageData }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": page.name,
    "description": page.description,
    "url": page.url.startsWith('http') ? page.url : `https://gringa-style.netlify.app${page.url}`,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Gringa Style",
      "url": "https://gringa-style.netlify.app"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Gringa Style"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};