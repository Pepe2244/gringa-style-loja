import React from 'react';

/**
 * MOTOR DE DADOS ESTRUTURADOS - GRINGA STYLE
 * Gera JSON-LD estrito para o Google Search Console e Merchant Center.
 */

interface Question {
  q: string;
  a: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

const SITE_URL = 'https://gringastylebr.com.br';

const cleanText = (text?: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
};

// 1. LocalBusiness: Valida que a Gringa Style é uma empresa real com endereço e contato
export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/#store`,
    "name": "Gringa Style",
    "url": SITE_URL,
    "logo": `${SITE_URL}/imagens/logo_gringa_style.png`,
    "image": `${SITE_URL}/imagens/logo_gringa_style.png`,
    "description": "Equipamentos de alta performance para soldadores profissionais. Máscaras personalizadas em fibra de vidro, tochas e vestuário.",
    "telephone": "+5515998092548",
    "email": "contato@gringastylebr.com.br",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rua Judith Carolinelli Vilaça, 505",
      "addressLocality": "Itapetininga",
      "addressRegion": "SP",
      "postalCode": "18208-450",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -23.5917,
      "longitude": -48.0531
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

// 2. WebSite: Habilita busca interna e autoridade de domínio no Google
export const WebSiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "name": "Gringa Style",
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/busca?q={search_term_string}`,
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

// 3. FAQ: Para exibir acordeões de perguntas frequentes na SERP
export const FAQSchema = ({ questions }: { questions: Question[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": cleanText(item.a)
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

// 4. Organization: Autoridade institucional e canais de contato
export const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    "name": "Gringa Style",
    "url": SITE_URL,
    "logo": `${SITE_URL}/imagens/logo_gringa_style.png`,
    "image": `${SITE_URL}/imagens/logo_gringa_style.png`,
    "description": "Equipamentos profissionais para soldadores exigentes. Máscaras personalizadas, vestuário streetwear e acessórios de solda.",
    "telephone": "+5515998092548",
    "email": "contato@gringastylebr.com.br",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rua Judith Carolinelli Vilaça, 505",
      "addressLocality": "Itapetininga",
      "addressRegion": "SP",
      "postalCode": "18208-450",
      "addressCountry": "BR"
    },
    "sameAs": [
      "https://www.instagram.com/gringastyle_br"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "telephone": "+5515998092548",
      "email": "contato@gringastylebr.com.br",
      "availableLanguage": ["Portuguese"]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 5. Product: Schema dinâmico com Rich Snippets completos
export interface ProductData {
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
  const precoNumerico = Number(product.preco_promocional || product.preco) || 0;
  const precoFormatado = precoNumerico.toFixed(2);
  const productUrl = `${SITE_URL}/produto/${product.slug || product.id}`;
  const hasPromo = !!product.preco_promocional && product.preco_promocional < product.preco;

  const validUntilDate = new Date();
  validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);

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
        'maxValue': 10,
        'unitCode': 'DAY'
      }
    }
  };

  const seller = {
    '@type': 'Organization',
    'name': 'Gringa Style',
    'url': SITE_URL
  };

  const baseOffer = {
    '@type': 'Offer',
    'url': productUrl,
    'priceCurrency': 'BRL',
    'price': precoFormatado,
    'itemCondition': 'https://schema.org/NewCondition',
    'availability': product.em_estoque ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    'priceValidUntil': validUntilDate.toISOString().split('T')[0],
    'hasMerchantReturnPolicy': merchantReturnPolicy,
    'shippingDetails': shippingDetails,
    'seller': seller
  };

  const brandName = product.marca || 'Gringa Style';
  const gtin = product.gtin13 ? { gtin13: product.gtin13 } : {};
  const hasValidRatings = Boolean(product.avaliacoes && product.totalAvaliacoes && product.totalAvaliacoes > 0);

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    'name': product.nome,
    'description': cleanText(product.descricao) || `Compre ${product.nome} com melhor preço e envio rápido na Gringa Style.`,
    'image': [imageUrl],
    'url': productUrl,
    'sku': String(product.id),
    'mpn': String(product.id),
    'brand': {
      '@type': 'Brand',
      'name': brandName
    },
    ...gtin,
    'offers': product.variants ? {
      '@type': 'AggregateOffer',
      'priceCurrency': 'BRL',
      'lowPrice': precoFormatado,
      'highPrice': Number(product.preco).toFixed(2),
      'offerCount': Array.isArray(product.variants?.opcoes) ? product.variants.opcoes.length : 1,
      'offers': [baseOffer]
    } : baseOffer,
    ...(hasPromo && {
      'priceSpecification': [
        {
          '@type': 'PriceSpecification',
          'price': Number(product.preco).toFixed(2),
          'priceCurrency': 'BRL',
          'priceType': 'ListPrice'
        },
        {
          '@type': 'PriceSpecification',
          'price': precoFormatado,
          'priceCurrency': 'BRL',
          'priceType': 'SalePrice'
        }
      ]
    }),
    ...(hasValidRatings && {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': Number(product.avaliacoes).toFixed(1),
        'reviewCount': String(product.totalAvaliacoes),
        'bestRating': '5'
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 6. ItemList: Para vitrines, categorias e páginas de busca
export interface ItemListProduct {
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

    const precoNumerico = Number(product.preco_promocional && product.preco_promocional < product.preco
      ? product.preco_promocional
      : product.preco) || 0;

    const productUrl = `${SITE_URL}/produto/${product.slug || product.id}`;

    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        'name': product.nome,
        'image': imageUrl,
        'description': cleanText(product.descricao) || `Compre ${product.nome} na Gringa Style`,
        'sku': String(product.id),
        'mpn': String(product.id),
        'url': productUrl,
        'brand': {
          '@type': 'Brand',
          'name': 'Gringa Style'
        },
        ...(product.gtin13 ? { gtin13: product.gtin13 } : {}),
        'offers': {
          '@type': 'Offer',
          'url': productUrl,
          'priceCurrency': 'BRL',
          'price': precoNumerico.toFixed(2),
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': product.em_estoque ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
      }
    };
  });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': listItems,
    'url': pageUrl.startsWith('http') ? pageUrl : `${SITE_URL}${pageUrl}`
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 7. Breadcrumb: Navegação hierárquica na SERP
export const BreadcrumbSchema = ({ items }: { items: BreadcrumbItem[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// 8. WebPage: Schema para páginas institucionais
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
    "description": cleanText(page.description),
    "url": page.url.startsWith('http') ? page.url : `${SITE_URL}${page.url}`,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Gringa Style",
      "url": SITE_URL
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

// 9. CollectionPage: Schema para páginas de categoria e listagens
interface CollectionPageData {
  name: string;
  description: string;
  url: string;
  products?: ItemListProduct[];
}

export const CollectionPageSchema = ({ page }: { page: CollectionPageData }) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": page.name,
    "description": cleanText(page.description),
    "url": page.url.startsWith('http') ? page.url : `${SITE_URL}${page.url}`,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Gringa Style",
      "url": SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "Gringa Style",
      "url": SITE_URL
    }
  };

  if (page.products && page.products.length > 0) {
    schema["mainEntity"] = {
      "@type": "ItemList",
      "itemListElement": page.products.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${SITE_URL}/produto/${product.slug || product.id}`
      }))
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
