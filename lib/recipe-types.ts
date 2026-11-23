export type RecipeSummary = {
  id: string;
  title: string;
  image: string;
  category: string;
  origin: string;
  provider: 'local' | 'themealdb';
};
export type Recipe = RecipeSummary & {
  source: string;
  video: string;
  instructions: string;
  steps: string[];
  ingredients: {name: string; amount: string}[];
  translated: boolean;
};
