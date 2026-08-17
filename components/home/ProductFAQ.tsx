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
    <div className="my-8">
      <FAQSchema questions={faqs} />
      <h3 className="text-2xl font-bold text-white mb-4 font-teko tracking-wide">Perguntas Frequentes</h3>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <summary className="font-semibold text-lg text-amber-500 cursor-pointer">
              {faq.q}
            </summary>
            <p className="mt-2 text-gray-300">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
};

export default ProductFAQ;