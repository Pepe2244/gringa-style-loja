'use client';

import React from 'react';
import { FAQSchema } from '@/components/SEO/StructuredData';

interface FAQItem {
  q: string;
  a: string;
}

interface ProductFAQProps {
  faqs: FAQItem[];
}

const ProductFAQ: React.FC<ProductFAQProps> = ({ faqs }) => {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <>
      <FAQSchema questions={faqs} />
      <div 
        className="product-faq-section" 
        style={{ 
          marginTop: '50px', 
          background: '#111', 
          padding: '35px', 
          borderRadius: '12px', 
          border: '1px solid #27272a', 
          textAlign: 'left' 
        }}
      >
        <h3 
          style={{ 
            fontSize: '1.8rem', 
            marginBottom: '25px', 
            color: 'white', 
            borderBottom: '2px solid var(--cor-destaque)', 
            paddingBottom: '12px', 
            display: 'inline-block',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Perguntas Frequentes
        </h3>

        {faqs.map((faq, index) => {
          const isLast = index === faqs.length - 1;
          return (
            <details 
              key={index} 
              style={{ 
                marginBottom: isLast ? '0px' : '20px', 
                borderBottom: isLast ? 'none' : '1px solid #27272a', 
                paddingBottom: isLast ? '5px' : '15px' 
              }}
            >
              <summary 
                style={{ 
                  color: 'var(--cor-destaque)', 
                  fontWeight: 'bold', 
                  fontSize: '1.2rem', 
                  cursor: 'pointer', 
                  listStyle: 'none', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}
              >
                <span style={{ marginRight: '10px' }}>›</span> {faq.q}
              </summary>
              <p 
                style={{ 
                  color: '#ccc', 
                  lineHeight: '1.7', 
                  marginTop: '12px', 
                  paddingLeft: '20px' 
                }}
              >
                {faq.a}
              </p>
            </details>
          );
        })}
      </div>
    </>
  );
};

export default ProductFAQ;