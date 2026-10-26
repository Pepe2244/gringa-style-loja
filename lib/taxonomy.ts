/**
 * TAXONOMIA OFICIAL DE PRODUTOS - GRINGA STYLE
 * Mapeamento padronizado para Google Merchant Center, Meta Catalog, Pinterest e Schema.org (JSON-LD)
 * Elimina categorizações errôneas (como "CDs/DVDs") e assegura relevância em SERP e Shopping.
 */

export interface ProductTaxonomy {
  googleCategoryId: string;
  googleCategoryPath: string;
  schemaCategory: string;
  productType: string;
}

export function getProductTaxonomy(nome?: string | null, categoriaNome?: string | null): ProductTaxonomy {
  const nameNorm = (nome || '').toLowerCase();
  const catNorm = (categoriaNome || '').toLowerCase();
  const text = `${catNorm} ${nameNorm}`;

  // 1. Máscaras de solda e lentes de proteção
  if (text.includes('máscara') || text.includes('mascara') || text.includes('lente')) {
    return {
      googleCategoryId: '499927',
      googleCategoryPath: 'Business & Industrial > Work Safety Protective Gear > Welding Helmets',
      schemaCategory: 'Equipamentos de Proteção Individual > Máscaras de Solda',
      productType: 'Equipamentos > Máscaras de Solda',
    };
  }

  // 2. Óculos de proteção ocular
  if (text.includes('óculos') || text.includes('oculos') || text.includes('steelflex') || text.includes('rayban')) {
    return {
      googleCategoryId: '2227',
      googleCategoryPath: 'Business & Industrial > Work Safety Protective Gear > Protective Eyewear',
      schemaCategory: 'Equipamentos de Proteção Individual > Óculos de Proteção',
      productType: 'Equipamentos > Óculos de Proteção',
    };
  }

  // 3. Calçados de proteção / Botas / Botinas
  if (text.includes('bota') || text.includes('botina') || text.includes('calçado') || text.includes('calcado')) {
    return {
      googleCategoryId: '187',
      googleCategoryPath: 'Apparel & Accessories > Shoes',
      schemaCategory: 'Calçados de Segurança > Botinas e Botas EPI',
      productType: 'Equipamentos > Botinas de Segurança',
    };
  }

  // 4. Vestuário / Camisas de Soldador / Camisetas
  if (text.includes('camisa') || text.includes('camiseta') || text.includes('vestuário') || text.includes('vestuario') || text.includes('roupa')) {
    return {
      googleCategoryId: '212',
      googleCategoryPath: 'Apparel & Accessories > Clothing > Shirts & Tops',
      schemaCategory: 'Vestuário de Trabalho > Camisas e Camisetas de Soldador',
      productType: 'Vestuário > Camisas de Soldador',
    };
  }

  // 5. Bonés e chapéus
  if (text.includes('boné') || text.includes('bone') || text.includes('snapback') || text.includes('chapéu')) {
    return {
      googleCategoryId: '173',
      googleCategoryPath: 'Apparel & Accessories > Clothing Accessories > Hats',
      schemaCategory: 'Vestuário e Acessórios > Bonés',
      productType: 'Vestuário > Bonés',
    };
  }

  // 6. Mochilas e bolsas técnicas
  if (text.includes('mochila') || text.includes('bolsa') || text.includes('case')) {
    return {
      googleCategoryId: '100',
      googleCategoryPath: 'Luggage & Bags > Backpacks',
      schemaCategory: 'Acessórios > Mochilas Técnicas',
      productType: 'Acessórios > Mochilas',
    };
  }

  // 7. Tochas TIG, cabos anatômicos e consumíveis
  if (text.includes('tocha') || text.includes('tig') || text.includes('consumíveis') || text.includes('consumiveis') || text.includes('cabo')) {
    return {
      googleCategoryId: '1238',
      googleCategoryPath: 'Hardware > Tools > Welding Guns & Plasma Cutters',
      schemaCategory: 'Ferramentas e Equipamentos > Solda > Tochas e Consumíveis TIG',
      productType: 'Equipamentos > Tochas e Consumíveis TIG',
    };
  }

  // 8. Kits combinados
  if (text.includes('kit') || text.includes('combo')) {
    return {
      googleCategoryId: '2226',
      googleCategoryPath: 'Business & Industrial > Work Safety Protective Gear',
      schemaCategory: 'Equipamentos de Proteção Individual > Kits de Soldador',
      productType: 'Kits > Equipamentos de Solda',
    };
  }

  // Padrão seguro para ferramentas e proteção industrial
  return {
    googleCategoryId: '2226',
    googleCategoryPath: 'Business & Industrial > Work Safety Protective Gear',
    schemaCategory: 'Equipamentos de Proteção Individual e Soldagem',
    productType: `Equipamentos > ${categoriaNome || 'Diversos'}`,
  };
}
