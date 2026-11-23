import {NextRequest, NextResponse} from 'next/server';
import {SHOWS, type Episode} from '../../../lib/podcasts';
import {readFeed, type FeedResult} from '../../../lib/rss';

/**
 * Episodios de podcasts en español desde sus RSS oficiales.
 * - /api/podcasts            → novedades de todos los podcasts (historial diario, lo más nuevo primero)
 * - /api/podcasts?show=id    → episodios de un podcast (con ?page=)
 * Se actualiza solo: caché de 3 h en el servidor/CDN, así el historial siempre trae los episodios del día.
 */
const TTL = 3 * 3600 * 1000;
const memo = new Map<string, {at: number; data: FeedResult}>();

async function feed(id: string, limit = 60): Promise<FeedResult> {
  const show = SHOWS.find(s => s.id === id);
  if (!show) throw new Error('show');
  const hit = memo.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  try {
    const data = await readFeed(show, limit);
    memo.set(id, {at: Date.now(), data});
    return data;
  } catch (e) {
    if (hit) return hit.data; // si el feed falla, usa la última copia
    throw e;
  }
}

const headers = {'Cache-Control': 'public, s-maxage=10800, stale-while-revalidate=86400'};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('show');
  if (id) {
    const page = Math.max(1, Math.min(4, Number(sp.get('page')) || 1));
    const size = 15;
    try {
      const {image, episodes} = await feed(id);
      return NextResponse.json({image, episodes: episodes.slice((page - 1) * size, page * size), page, more: episodes.length > page * size}, {headers});
    } catch {
      return NextResponse.json({image: '', episodes: [], page: 1, more: false, error: 'No pudimos cargar este podcast ahora. Intenta más tarde.'}, {status: 502});
    }
  }

  const days = Math.max(1, Math.min(30, Number(sp.get('days')) || 14));
  const since = Date.now() - days * 86400000;
  const results = await Promise.allSettled(SHOWS.map(s => feed(s.id)));
  const images: Record<string, string> = {};
  let all: Episode[] = [];
  results.forEach((r, k) => {
    if (r.status !== 'fulfilled') return;
    images[SHOWS[k].id] = r.value.image;
    all = all.concat(r.value.episodes.filter(e => new Date(e.date).getTime() >= since).slice(0, 6));
  });
  all.sort((a, b) => b.date.localeCompare(a.date));
  return NextResponse.json({updatedAt: new Date().toISOString(), images, episodes: all.slice(0, 60), failed: results.filter(r => r.status === 'rejected').length}, {headers});
}
