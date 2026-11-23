import {NextRequest, NextResponse} from 'next/server';
import {localRecipes} from '../../../lib/local-recipes';
import type {RecipeSummary} from '../../../lib/recipe-types';
import {translateLines, translateText} from '../../../lib/translate';
import {AREA_ES, CATEGORY_ES, QUERY_CATEGORY, QUERY_TERM, normalizeQuery, stripAccents} from '../../../lib/food-dictionary';

const API = 'https://www.themealdb.com/api/json/v1/1/';
const DAY = 86400;
const STOP = new Set(['de', 'del', 'con', 'al', 'a', 'la', 'el', 'las', 'los', 'y', 'en', 'para', 'sin', 'un', 'una', 'receta', 'recetas', 'rica', 'rico', 'facil', 'sana', 'sano', 'saludable', 'saludables']);
const CAT = Object.fromEntries(Object.entries(QUERY_CATEGORY).map(([k, v]) => [stripAccents(k), v]));
const TERM = Object.fromEntries(Object.entries(QUERY_TERM).map(([k, v]) => [stripAccents(k), v]));

type Meal = {idMeal: string; strMeal: string; strMealThumb?: string; strCategory?: string; strArea?: string};

const diag: string[] = [];
async function get(path: string): Promise<Meal[]> {
  try {
    const r = await fetch(API + path, {next: {revalidate: DAY}, signal: AbortSignal.timeout(8000), headers: {Accept: 'application/json', 'User-Agent': 'VidaActivaAI/1.0 (+https://vercel.app)'}});
    if (!r.ok) {
      diag.push(path + ' → HTTP ' + r.status);
      console.warn('[recipes] TheMealDB', path, r.status);
      return [];
    }
    const d = await r.json();
    return Array.isArray(d?.meals) ? d.meals : [];
  } catch (e) {
    diag.push(path + ' → ' + (e instanceof Error ? e.message : 'error'));
    console.warn('[recipes] TheMealDB error', path, e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('q') || '').slice(0, 60);
  const q = normalizeQuery(raw) || 'pollo';
  const words = q.split(' ').filter(w => w && !STOP.has(w));

  const categories = new Set<string>();
  const terms = new Set<string>();
  const unknown: string[] = [];
  for (const w of words) {
    if (CAT[w]) categories.add(CAT[w]);
    if (TERM[w]) terms.add(TERM[w]);
    if (!CAT[w] && !TERM[w] && w.length > 2) unknown.push(w);
  }
  if (unknown.length) {
    const {text} = await translateText(unknown.join(' '), 'es', 'en');
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'with', 'recipe'].includes(w))
      .forEach(w => terms.add(w));
  }

  const jobs: Promise<{meals: Meal[]; weight: number; cat?: string}>[] = [];
  for (const c of categories) jobs.push(get('filter.php?c=' + encodeURIComponent(c)).then(meals => ({meals, weight: 1, cat: c})));
  for (const t of terms) {
    jobs.push(get('search.php?s=' + encodeURIComponent(t)).then(meals => ({meals, weight: 2})));
    jobs.push(get('filter.php?i=' + encodeURIComponent(t.replace(/\s+/g, '_'))).then(meals => ({meals, weight: 1.5})));
  }
  const results = await Promise.all(jobs);
  const sourceDown = jobs.length > 0 && results.every(r => r.meals.length === 0);

  const score = new Map<string, {meal: Meal; s: number; cat?: string}>();
  for (const {meals, weight, cat} of results) {
    for (const m of meals) {
      const prev = score.get(m.idMeal);
      const titleHits = [...terms].filter(t => m.strMeal.toLowerCase().includes(t)).length;
      const s = weight + titleHits;
      if (prev) {
        prev.s += s;
        prev.cat ||= cat;
        prev.meal = {...prev.meal, ...m};
      } else score.set(m.idMeal, {meal: m, s, cat});
    }
  }
  const top = [...score.values()].sort((a, b) => b.s - a.s).slice(0, 24);

  const {lines: titles, ok} = await translateLines(top.map(t => t.meal.strMeal));
  const web: RecipeSummary[] = top.map((t, i) => {
    const cat = t.meal.strCategory || t.cat || '';
    return {
      id: t.meal.idMeal,
      title: titles[i],
      image: t.meal.strMealThumb ? t.meal.strMealThumb + '/medium' : '',
      category: CATEGORY_ES[cat] || 'Receta',
      origin: t.meal.strArea ? AREA_ES[t.meal.strArea] || t.meal.strArea : '',
      provider: 'themealdb',
    };
  });

  const local = localRecipes
    .filter(r => words.some(w => normalizeQuery(r.title + ' ' + r.category + ' ' + r.keywords).includes(w)))
    .map(({id, title, image, category, origin, provider}) => ({id, title, image, category, origin, provider}));

  return NextResponse.json(
    {
      items: [...local, ...web],
      translated: ok,
      error: sourceDown && !local.length ? 'La fuente web de recetas no respondió. Intenta nuevamente en unos minutos.' : undefined,
      source: 'TheMealDB (traducido al español) + recetas originales de Vida Activa AI',
      ...(req.nextUrl.searchParams.get('debug') === '1' ? {diag: diag.splice(0)} : {}),
    },
    {headers: {'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'}},
  );
}
