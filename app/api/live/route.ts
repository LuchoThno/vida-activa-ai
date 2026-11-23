import {NextResponse} from 'next/server';
import {STATIONS} from '../../../lib/podcasts';

/**
 * Radios en directo. Refresca la URL de cada estación desde radio-browser.info (directorio abierto)
 * y descarta las que no estén en línea o no usen HTTPS. Caché de 1 día.
 */
export async function GET() {
  const uuids = STATIONS.map(s => s.uuid).join(',');
  let fresh: Record<string, {url: string; ok: boolean}> = {};
  try {
    const r = await fetch('https://de1.api.radio-browser.info/json/stations/byuuid?uuids=' + uuids, {
      headers: {'User-Agent': 'VidaActivaAI/1.0'},
      next: {revalidate: 86400},
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d: any[] = await r.json();
      fresh = Object.fromEntries(d.map(x => [x.stationuuid, {url: String(x.url_resolved || x.url || ''), ok: x.lastcheckok === 1}]));
    }
  } catch {
    /* sin directorio: se usan las URL guardadas */
  }
  const stations = STATIONS.map(s => {
    const f = fresh[s.uuid];
    const url = f && /^https:\/\//i.test(f.url) ? f.url : s.url;
    return {...s, url, online: f ? f.ok : true};
  });
  return NextResponse.json({stations}, {headers: {'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'}});
}
