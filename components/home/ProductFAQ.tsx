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
    <div className="my-12 px-4 sm:px-0">
      <FAQSchema questions={faqs} />
      
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-white font-teko tracking-wide uppercase">
          Perguntas Frequentes
        </h3>
        <p className="text-zinc-400 text-sm sm:text-base mt-1">
          Tire suas dúvidas sobre o produto, especificações e prazos.
        </p>
      </div>

      <div className="space-y-6 max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <details 
            key={index} 
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg transition-all duration-200 hover:border-zinc-700"
          >
            <summary className="font-semibold text-lg text-amber-500 cursor-pointer flex justify-between items-center select-none focus:outline-none">
              <span className="pr-4">{faq.q}</span>
              <span className="text-amber-500 font-bold transition-transform duration-200 group-open:rotate-180">
                ↓
              </span>
            </summary>
            <p className="mt-4 text-zinc-300 text-sm sm:text-base leading-relaxed border-t border-zinc-800/80 pt-4">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
};

export default ProductFAQ;