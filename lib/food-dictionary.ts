/** Vocabulario para buscar en español en fuentes web en inglés y mostrar categorías en español. */

export const CATEGORY_ES: Record<string, string> = {
  Beef: 'Carne de vacuno',
  Breakfast: 'Desayuno',
  Chicken: 'Pollo',
  Dessert: 'Postre',
  Goat: 'Cabrito',
  Lamb: 'Cordero',
  Miscellaneous: 'Variadas',
  Pasta: 'Pastas',
  Pork: 'Cerdo',
  Seafood: 'Pescados y mariscos',
  Side: 'Acompañamiento',
  Starter: 'Entrada',
  Vegan: 'Vegana',
  Vegetarian: 'Vegetariana',
};

export const AREA_ES: Record<string, string> = {
  Algerian: 'Argelia', American: 'Estados Unidos', Argentinian: 'Argentina', Australian: 'Australia',
  British: 'Reino Unido', Canadian: 'Canadá', Chinese: 'China', Croatian: 'Croacia', Dutch: 'Países Bajos',
  Egyptian: 'Egipto', Filipino: 'Filipinas', French: 'Francia', Greek: 'Grecia', Indian: 'India',
  Irish: 'Irlanda', Italian: 'Italia', Jamaican: 'Jamaica', Japanese: 'Japón', Kenyan: 'Kenia',
  Malaysian: 'Malasia', Mexican: 'México', Moroccan: 'Marruecos', Norwegian: 'Noruega', Polish: 'Polonia',
  Portuguese: 'Portugal', Russian: 'Rusia', 'Saudi Arabian': 'Arabia Saudita', Slovakian: 'Eslovaquia',
  Spanish: 'España', Syrian: 'Siria', Thai: 'Tailandia', Tunisian: 'Túnez', Turkish: 'Turquía',
  Ukrainian: 'Ucrania', Uruguayan: 'Uruguay', Venezulan: 'Venezuela', Venezuelan: 'Venezuela',
  Vietnamese: 'Vietnam', Unknown: 'Internacional',
};

/** Palabras en español → categoría de TheMealDB */
export const QUERY_CATEGORY: Record<string, string> = {
  postre: 'Dessert', postres: 'Dessert', dulce: 'Dessert', dulces: 'Dessert',
  desayuno: 'Breakfast', desayunos: 'Breakfast', once: 'Breakfast',
  vegetariano: 'Vegetarian', vegetariana: 'Vegetarian', vegetarianas: 'Vegetarian', vegetarianos: 'Vegetarian',
  vegano: 'Vegan', vegana: 'Vegan', veganas: 'Vegan', veganos: 'Vegan',
  mariscos: 'Seafood', marisco: 'Seafood', pescados: 'Seafood',
  pasta: 'Pasta', pastas: 'Pasta', fideos: 'Pasta', tallarines: 'Pasta',
  entrada: 'Starter', entradas: 'Starter',
  acompañamiento: 'Side', acompañamientos: 'Side', guarnicion: 'Side', guarnición: 'Side',
  cordero: 'Lamb', cerdo: 'Pork', chancho: 'Pork', vacuno: 'Beef', carne: 'Beef', res: 'Beef', cabrito: 'Goat',
};

/** Palabras en español → término en inglés para buscar por nombre o ingrediente. */
export const QUERY_TERM: Record<string, string> = {
  pollo: 'chicken', pechuga: 'chicken breast', pavo: 'turkey', pato: 'duck',
  pescado: 'fish', salmon: 'salmon', salmón: 'salmon', atun: 'tuna', atún: 'tuna', merluza: 'cod', bacalao: 'cod',
  reineta: 'fish', trucha: 'trout', camaron: 'prawns', camarón: 'prawns', camarones: 'prawns', gambas: 'prawns',
  langostinos: 'prawns', calamar: 'squid', calamares: 'squid', choritos: 'mussels', mejillones: 'mussels',
  carne: 'beef', vacuno: 'beef', res: 'beef', cerdo: 'pork', chancho: 'pork', cordero: 'lamb',
  tocino: 'bacon', salchicha: 'sausage', jamon: 'ham', jamón: 'ham',
  huevo: 'egg', huevos: 'egg', queso: 'cheese', arroz: 'rice', pasta: 'pasta', fideos: 'pasta', lasaña: 'lasagne',
  papa: 'potato', papas: 'potato', patata: 'potato', patatas: 'potato', camote: 'sweet potato',
  tomate: 'tomato', tomates: 'tomato', cebolla: 'onion', ajo: 'garlic', zanahoria: 'carrot',
  zapallo: 'pumpkin', calabaza: 'pumpkin', zapallito: 'courgette', zucchini: 'courgette', berenjena: 'aubergine',
  pimenton: 'pepper', pimentón: 'pepper', pimiento: 'pepper', champiñon: 'mushroom', champiñones: 'mushroom',
  hongos: 'mushroom', espinaca: 'spinach', espinacas: 'spinach', brocoli: 'broccoli', brócoli: 'broccoli',
  coliflor: 'cauliflower', repollo: 'cabbage', lechuga: 'lettuce', palta: 'avocado', aguacate: 'avocado',
  choclo: 'corn', maiz: 'corn', maíz: 'corn', porotos: 'beans', frijoles: 'beans', judias: 'beans',
  lentejas: 'lentils', garbanzos: 'chickpeas', quinoa: 'quinoa', avena: 'oats',
  manzana: 'apple', platano: 'banana', plátano: 'banana', banana: 'banana', frutilla: 'strawberries',
  fresas: 'strawberries', limon: 'lemon', limón: 'lemon', naranja: 'orange', coco: 'coconut',
  chocolate: 'chocolate', pan: 'bread', torta: 'cake', pastel: 'cake', queque: 'cake', galletas: 'biscuits',
  sopa: 'soup', crema: 'soup', ensalada: 'salad', ensaladas: 'salad', curry: 'curry', tacos: 'taco',
  pizza: 'pizza', hamburguesa: 'burger', hamburguesas: 'burger', guiso: 'stew', estofado: 'stew',
  tarta: 'tart', pie: 'pie', empanada: 'pie', empanadas: 'pie', panqueques: 'pancakes', panqueque: 'pancakes',
  yogur: 'yogurt', yogurt: 'yogurt', leche: 'milk', mantequilla: 'butter',
};

export function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function normalizeQuery(q: string) {
  return stripAccents(q.toLocaleLowerCase('es-CL')).replace(/[^a-zñ0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Atajos que se muestran como chips en la pantalla de recetas. */
export const RECIPE_SHORTCUTS = [
  {label: 'Pollo', q: 'pollo', emoji: '🍗'},
  {label: 'Pescado', q: 'pescado', emoji: '🐟'},
  {label: 'Vegetariana', q: 'vegetariana', emoji: '🥦'},
  {label: 'Ensaladas', q: 'ensalada', emoji: '🥗'},
  {label: 'Sopas', q: 'sopa', emoji: '🍲'},
  {label: 'Pastas', q: 'pasta', emoji: '🍝'},
  {label: 'Desayunos', q: 'desayuno', emoji: '🥣'},
  {label: 'Legumbres', q: 'lentejas', emoji: '🫘'},
  {label: 'Carne', q: 'carne', emoji: '🥩'},
  {label: 'Postres', q: 'postre', emoji: '🍰'},
];
