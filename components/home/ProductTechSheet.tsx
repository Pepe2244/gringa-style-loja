import React from 'react';

interface TechSheetProps {
  specs: Record<string, string>;
}

const ProductTechSheet: React.FC<TechSheetProps> = ({ specs }) => {
  if (!specs || Object.keys(specs).length === 0) {
    return null;
  }

  return (
    <div className="my-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
      <h3 className="text-2xl font-bold text-white mb-4 font-teko tracking-wide">Ficha Técnica</h3>
      <ul className="space-y-2">
        {Object.entries(specs).map(([key, value]) => (
          <li key={key} className="flex justify-between border-b border-gray-700 py-2 text-gray-300">
            <span className="font-semibold text-gray-200">{key}:</span>
            <span>{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductTechSheet;