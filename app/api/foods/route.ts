import {NextRequest, NextResponse} from 'next/server';
import {LOCAL_FOODS, type Food} from '../../../lib/foods';
import {normalizeQuery} from '../../../lib/food-dictionary';

/**
 * Búsqueda de alimentos: base local (alimentos chilenos comunes) + Open Food Facts
 * (productos envasados con información nutricional declarada, base abierta y colaborativa).
 * ?code=7802900002107 busca un producto por código de barras.
 */
const UA = {'User-Agent': 'VidaActivaAI/1.0 (bienestar; contacto via GitHub LuchoThno/vida-activa-ai)'};

function fromOFF(p: any): Food | null {
  const n = p?.nutriments || {};
  const kcal100 = Number(n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : NaN));
  const name = String(p?.product_name_es || p?.product_name || '').trim();
  if (!name || !Number.isFinite(kcal100) || kcal100 < 0 || kcal100 > 950) return null;
  const brand = Array.isArray(p.brands) ? p.brands[0] : String(p.brands || '').split(',')[0];
  const sq = Number(p.serving_quantity);
  const hasServing = Number.isFinite(sq) && sq > 0 && sq < 1500;
  const factor = hasServing ? sq / 100 : 1;
  const r = (x: unknown) => Math.round((Number(x) || 0) * factor * 10) / 10;
  return {
    id: 'off' + p.code,
    name,
    brand: brand?.trim() || undefined,
    portion: hasServing ? `1 porción (${p.serving_size || sq + ' g'})` : '100 g',
    kcal: Math.round(kcal100 * factor),
    p: r(n.proteins_100g),
    c: r(n.carbohydrates_100g),
    f: r(n.fat_100g),
    cat: 'Productos envasados',
    source: 'off',
  };
}

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('code') || '').replace(/\D/g, '').slice(0, 14);
  if (code) {
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,product_name_es,brands,nutriments,serving_size,serving_quantity`, {
        headers: UA,
        next: {revalidate: 86400 * 7},
        signal: AbortSignal.timeout(9000),
      });
      const d = await r.json();
      const food = d?.product ? fromOFF({...d.product, code}) : null;
      return NextResponse.json({items: food ? [food] : [], error: food ? undefined : 'No encontramos ese código o no tiene información nutricional.'});
    } catch {
      return NextResponse.json({items: [], error: 'No se pudo consultar el código de barras.'}, {status: 502});
    }
  }

  const q = normalizeQuery(req.nextUrl.searchParams.get('q') || '').slice(0, 50);
  const local = LOCAL_FOODS.filter(f => !q || q.split(' ').every(w => normalizeQuery(f.name + ' ' + f.cat).includes(w))).slice(0, 30);
  let off: Food[] = [];
  if (q.length >= 3) {
    try {
      const params = new URLSearchParams({
        q,
        page_size: '24',
        langs: 'es',
        fields: 'code,product_name,product_name_es,brands,nutriments,serving_size,serving_quantity,countries_tags',
      });
      const r = await fetch('https://search.openfoodfacts.org/search?' + params, {headers: UA, next: {revalidate: 86400}, signal: AbortSignal.timeout(8000)});
      if (r.ok) {
        const d = await r.json();
        const hits: any[] = d?.hits || [];
        // primero los productos vendidos en Chile
        hits.sort((a, b) => Number((b.countries_tags || []).includes('en:chile')) - Number((a.countries_tags || []).includes('en:chile')));
        const seen = new Set<string>();
        off = hits
          .map(fromOFF)
          .filter((x): x is Food => !!x)
          .filter(x => {
            const k = normalizeQuery(x.name + (x.brand || ''));
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .slice(0, 15);
      }
    } catch {}
  }
  return NextResponse.json({items: [...local, ...off]}, {headers: {'Cache-Control': 'public, s-maxage=3600'}});
}
