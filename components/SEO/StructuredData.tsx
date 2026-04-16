
import React from 'react';

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
      "streetAddress": "rua judith caroinelli vilaça , 505", // ATENÇÃO: Altere para o endereço real do Merchant Center
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
      "https://www.instagram.com/gringastyle_",
      
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

// 4. Breadcrumb: Navegação limpa (Gringa Style > Máscaras > Produto) na busca.
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