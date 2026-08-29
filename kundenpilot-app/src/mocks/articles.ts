export interface MockArticle {
  id: string;
  name: string;
  priceCents: number;
  category: string;
}

// Sortiment eines typischen Einzelhandelsgeschäfts ("Citykauf") für Mock-Bons.
export const MOCK_ARTICLES: MockArticle[] = [
  { id: 'art_1', name: 'Bio-Vollmilch 1L', priceCents: 129, category: 'Molkerei' },
  { id: 'art_2', name: 'Roggenmischbrot', priceCents: 289, category: 'Bäckerei' },
  { id: 'art_3', name: 'Freilandeier 10er', priceCents: 349, category: 'Molkerei' },
  { id: 'art_4', name: 'Äpfel Elstar 1kg', priceCents: 249, category: 'Obst & Gemüse' },
  { id: 'art_5', name: 'Kaffee ganze Bohne 500g', priceCents: 899, category: 'Getränke' },
  { id: 'art_6', name: 'Bio-Bananen 1kg', priceCents: 199, category: 'Obst & Gemüse' },
  { id: 'art_7', name: 'Hähnchenbrustfilet 500g', priceCents: 549, category: 'Fleisch & Fisch' },
  { id: 'art_8', name: 'Nudeln Penne 500g', priceCents: 99, category: 'Trockenware' },
  { id: 'art_9', name: 'Tomaten Rispe 500g', priceCents: 229, category: 'Obst & Gemüse' },
  { id: 'art_10', name: 'Rotwein Merlot 0,75L', priceCents: 749, category: 'Getränke' },
  { id: 'art_11', name: 'Bio-Joghurt Natur 500g', priceCents: 159, category: 'Molkerei' },
  { id: 'art_12', name: 'Vollkornmehl 1kg', priceCents: 179, category: 'Trockenware' },
  { id: 'art_13', name: 'Butter 250g', priceCents: 219, category: 'Molkerei' },
  { id: 'art_14', name: 'Orangensaft 1L', priceCents: 249, category: 'Getränke' },
  { id: 'art_15', name: 'Bio-Zucchini 500g', priceCents: 169, category: 'Obst & Gemüse' },
];

export function randomArticles(count: number): MockArticle[] {
  const shuffled = [...MOCK_ARTICLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
