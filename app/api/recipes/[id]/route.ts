import {NextRequest, NextResponse} from 'next/server';
import {localRecipes} from '../../../../lib/local-recipes';
import type {Recipe} from '../../../../lib/recipe-types';
import {translateLines} from '../../../../lib/translate';
import {AREA_ES, CATEGORY_ES} from '../../../../lib/food-dictionary';

const API = 'https://www.themealdb.com/api/json/v1/1/';

function cleanSteps(raw: string): string[] {
  return raw
    .replace(/\r/g, '')
    .split(/\n+/)
    .map(s => s.replace(/^\s*(step\s*\d+[:.)]?|\d+[.)]|[-•*▢])\s*/i, '').trim())
    .filter(s => s.length > 2 && !/^step\s*\d*$/i.test(s))
    .flatMap(s => (s.length > 420 ? s.match(/[^.!?]+[.!?]+\s*/g)?.map(x => x.trim()) || [s] : [s]));
}

export async function GET(_req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params;
  if (id === 'random' || /^\d{1,8}$/.test(id)) {
    let meal: any = null;
    try {
      const r = await fetch(API + (id === 'random' ? 'random.php' : 'lookup.php?i=' + id), {
        ...(id === 'random' ? {cache: 'no-store' as const} : {next: {revalidate: 86400 * 7}}),
        signal: AbortSignal.timeout(8000),
      });
      meal = r.ok ? (await r.json())?.meals?.[0] : null;
    } catch {}
    if (!meal) return NextResponse.json({error: 'No se pudo obtener la receta desde la web.'}, {status: 502});

    const ingredients: {name: string; amount: string}[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = String(meal['strIngredient' + i] || '').trim();
      if (name) ingredients.push({name, amount: String(meal['strMeasure' + i] || '').trim()});
    }
    const steps = cleanSteps(String(meal.strInstructions || ''));
    // Ingrediente y medida se traducen juntos ("2 cloves garlic" → "2 dientes de ajo")
    const ingLines = ingredients.map(x => `${x.amount} ${x.name}`.trim());
    const {lines, ok} = await translateLines([meal.strMeal, ...ingLines, ...steps]);
    const title = lines[0];
    const ingEs = lines.slice(1, 1 + ingLines.length);
    const stepsEs = lines.slice(1 + ingLines.length);

    const recipe: Recipe = {
      id: String(meal.idMeal),
      title,
      image: meal.strMealThumb || '',
      category: CATEGORY_ES[meal.strCategory] || meal.strCategory || 'Receta',
      origin: AREA_ES[meal.strArea] || meal.strArea || '',
      source: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
      video: meal.strYoutube || '',
      provider: 'themealdb',
      instructions: stepsEs.join('\n'),
      steps: stepsEs,
      ingredients: ingEs.map(l => ({name: l.charAt(0).toUpperCase() + l.slice(1), amount: ''})),
      translated: ok,
    };
    return NextResponse.json(recipe, {
      headers: {'Cache-Control': id === 'random' ? 'no-store' : 'public, s-maxage=86400, stale-while-revalidate=604800'},
    });
  }
  const local = localRecipes.find(r => r.id === id);
  if (!local) return NextResponse.json({error: 'Receta no encontrada'}, {status: 404});
  const {keywords, ...recipe} = local;
  return NextResponse.json(recipe);
}
