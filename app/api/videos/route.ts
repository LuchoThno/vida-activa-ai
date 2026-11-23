import {NextRequest, NextResponse} from 'next/server';

/**
 * Busca un video en español para reproducirlo dentro de la app.
 * Requiere YOUTUBE_API_KEY (YouTube Data API v3, gratuita). Sin la clave responde enabled:false
 * y la app ofrece abrir la búsqueda en YouTube.
 */
export async function GET(req: NextRequest) {
  const key = process.env.YOUTUBE_API_KEY;
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  if (!key) return NextResponse.json({enabled: false, items: []});
  if (!q) return NextResponse.json({enabled: true, items: []});
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '4',
    q,
    relevanceLanguage: 'es',
    regionCode: 'CL',
    safeSearch: 'strict',
    videoEmbeddable: 'true',
    key,
  });
  try {
    const r = await fetch('https://www.googleapis.com/youtube/v3/search?' + params, {next: {revalidate: 86400 * 30}, signal: AbortSignal.timeout(8000)});
    if (!r.ok) return NextResponse.json({enabled: true, items: []}, {status: 502});
    const d = await r.json();
    const items = (d.items || []).map((x: any) => ({id: x.id?.videoId, title: x.snippet?.title, channel: x.snippet?.channelTitle})).filter((x: any) => x.id);
    return NextResponse.json({enabled: true, items}, {headers: {'Cache-Control': 'public, s-maxage=86400'}});
  } catch {
    return NextResponse.json({enabled: true, items: []}, {status: 502});
  }
}
