# SEO Validation Snippet

Use este snippet para validar os dados estruturados do site no Google Rich Results Test ou no Search Console.

Copie o conteúdo abaixo e cole na ferramenta de teste de rich results ou no validador de dados estruturados.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Máscara de Solda Personalizada Gringa Style",
  "description": "Máscara de solda TIG personalizada com proteção e estilo para profissionais.",
  "image": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png",
  "sku": "GS-001",
  "mpn": "GS-2026",
  "url": "https://gringa-style.netlify.app/produto/mascara-personalizada",
  "brand": {
    "@type": "Brand",
    "name": "Gringa Style"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://gringa-style.netlify.app/produto/mascara-personalizada",
    "priceCurrency": "BRL",
    "price": "249.90",
    "priceValidUntil": "2027-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Gringa Style",
      "url": "https://gringa-style.netlify.app",
      "logo": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png"
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "BR",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 14,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/CustomerResponsibility"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0.00",
        "currency": "BRL"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "BR"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 2,
          "unitCode": "d"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 3,
          "maxValue": 12,
          "unitCode": "d"
        }
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "27"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Cliente Gringa Style"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "reviewBody": "Produto excelente, acabamento de qualidade e entrega rápida. Recomendo!"
    }
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Gringa Style",
  "image": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png",
  "logo": "https://gringa-style.netlify.app/imagens/logo_gringa_style.png",
  "url": "https://gringa-style.netlify.app",
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
}
</script>
```