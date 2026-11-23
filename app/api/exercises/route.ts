import {NextRequest, NextResponse} from 'next/server';
import {normalizeQuery} from '../../../lib/food-dictionary';

/**
 * Biblioteca de ejercicios de wger.de en ESPAÑOL (idioma 4).
 * Se usan las traducciones oficiales en español de la comunidad wger (~650 ejercicios),
 * junto con imágenes, videos, categoría y equipamiento. Caché de 24 h.
 */
const BASE = 'https://wger.de/api/v2/';
const DAY = 86400;

const CATEGORY_ES: Record<number, string> = {
  10: 'Abdomen', 8: 'Brazos', 12: 'Espalda', 14: 'Pantorrillas', 15: 'Cardio', 11: 'Pecho', 9: 'Piernas', 13: 'Hombros',
};
const EQUIPMENT_ES: Record<number, string> = {
  1: 'Barra', 8: 'Banco', 12: 'Polea', 3: 'Mancuernas', 4: 'Colchoneta', 9: 'Banco inclinado', 10: 'Pesa rusa',
  6: 'Barra de dominadas', 11: 'Banda elástica', 2: 'Barra Z', 5: 'Pelota suiza', 7: 'Peso corporal',
};

type WgerExercise = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  image: string;
  video: string;
  category: string;
  equipment: string;
  bodyweight: boolean;
  source: string;
};

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
function textOf(html: string) {
  return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function stepsOf(html: string): string[] {
  const li = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => textOf(m[1])).filter(Boolean);
  if (li.length > 1) return li;
  const plain = textOf(html);
  return (plain.match(/[^.!?]+[.!?]+/g) || (plain ? [plain] : [])).map(s => s.trim()).filter(s => s.length > 3);
}

async function getJSON(path: string) {
  const r = await fetch(BASE + path, {next: {revalidate: DAY}, signal: AbortSignal.timeout(12000)});
  if (!r.ok) throw new Error('wger ' + r.status);
  return r.json();
}

let memo: {at: number; items: WgerExercise[]} | null = null;

async function loadAll(): Promise<WgerExercise[]> {
  if (memo && Date.now() - memo.at < DAY * 1000) return memo.items;
  const [tr, ex, img, vid] = await Promise.all([
    getJSON('exercise-translation/?language=4&limit=1000&format=json'),
    getJSON('exercise/?limit=1000&format=json'),
    getJSON('exerciseimage/?is_main=True&limit=1000&format=json').catch(() => ({results: []})),
    getJSON('video/?limit=1000&format=json').catch(() => ({results: []})),
  ]);
  const exById = new Map<number, any>((ex.results || []).map((e: any) => [e.id, e]));
  const imgBy = new Map<number, string>();
  for (const i of img.results || []) if (i.image && !imgBy.has(i.exercise)) imgBy.set(i.exercise, i.image);
  const vidBy = new Map<number, string>();
  for (const v of vid.results || []) if (v.video && !vidBy.has(v.exercise)) vidBy.set(v.exercise, v.video);

  const seen = new Map<string, WgerExercise>();
  for (const t of tr.results || []) {
    const name = textOf(String(t.name || ''));
    if (!name) continue;
    const e = exById.get(t.exercise);
    const eq: number[] = e?.equipment || [];
    const item: WgerExercise = {
      id: String(t.exercise),
      title: name.charAt(0).toUpperCase() + name.slice(1),
      description: textOf(String(t.description || '')),
      steps: stepsOf(String(t.description || '')),
      image: imgBy.get(t.exercise) || '',
      video: vidBy.get(t.exercise) || '',
      category: CATEGORY_ES[e?.category] || 'General',
      equipment: eq.map(id => EQUIPMENT_ES[id]).filter(Boolean).join(', ') || 'Sin material',
      bodyweight: (!eq.length || eq.every(id => id === 4 || id === 7 || id === 11 || id === 5)) && !/m[aá]quina|polea|barra|mancuerna|kettlebell|pesa rusa|banco|smith|prensa|press de banca/i.test(name),
      source: `https://wger.de/es/exercise/${t.exercise}/view/`,
    };
    const key = normalizeQuery(item.title);
    const prev = seen.get(key);
    const quality = (x: WgerExercise) => (x.image ? 2 : 0) + (x.description.length > 40 ? 1 : 0) + (x.video ? 1 : 0);
    if (!prev || quality(item) > quality(prev)) seen.set(key, item);
  }
  const items = [...seen.values()].sort(
    (a, b) => Number(!!b.image) - Number(!!a.image) || Number(b.description.length > 40) - Number(a.description.length > 40) || a.title.localeCompare(b.title, 'es'),
  );
  memo = {at: Date.now(), items};
  return items;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = normalizeQuery(sp.get('q') || '').slice(0, 50);
  const category = sp.get('category') || 'Todos';
  const onlyBody = sp.get('bodyweight') === '1';
  const page = Math.max(1, Math.min(50, Number(sp.get('page')) || 1));
  const size = 18;
  try {
    const all = await loadAll();
    const filtered = all.filter(
      x =>
        (category === 'Todos' || x.category === category) &&
        (!onlyBody || x.bodyweight) &&
        (!q || q.split(' ').every(w => normalizeQuery(x.title + ' ' + x.category + ' ' + x.equipment).includes(w))),
    );
    return NextResponse.json(
      {
        items: filtered.slice((page - 1) * size, page * size),
        total: filtered.length,
        page,
        pages: Math.max(1, Math.ceil(filtered.length / size)),
        categories: ['Todos', ...Object.values(CATEGORY_ES).sort((a, b) => a.localeCompare(b, 'es'))],
        source: 'wger.de (contenido en español, licencia CC-BY-SA)',
      },
      {headers: {'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'}},
    );
  } catch {
    return NextResponse.json({items: [], total: 0, page: 1, pages: 1, categories: ['Todos'], error: 'No se pudo conectar con la biblioteca de ejercicios.'}, {status: 503});
  }
}
