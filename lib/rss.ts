import type {Episode, PodcastShow} from './podcasts';

/** Lector de RSS de podcasts (lado servidor). Lee solo el comienzo del feed: los episodios más nuevos van primero. */
const MAX_BYTES = 700_000;

async function readHead(url: string): Promise<string> {
  const r = await fetch(url, {
    cache: 'no-store',
    headers: {'User-Agent': 'VidaActivaAI/1.0 (+podcast reader)', Accept: 'application/rss+xml, application/xml, text/xml'},
    signal: AbortSignal.timeout(12000),
    redirect: 'follow',
  });
  if (!r.ok || !r.body) throw new Error('feed ' + r.status);
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let out = '';
  let bytes = 0;
  while (bytes < MAX_BYTES) {
    const {done, value} = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    out += dec.decode(value, {stream: true});
  }
  reader.cancel().catch(() => {});
  return out;
}

const decode = (s: string) =>
  s
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const text = (html: string) => decode(decode(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1].trim()) : '';
}
function attr(xml: string, name: string, a: string): string {
  const m = xml.match(new RegExp(`<${name}\\b[^>]*\\b${a}=["']([^"']+)["']`, 'i'));
  return m ? decode(m[1]) : '';
}
function seconds(d: string): number {
  if (!d) return 0;
  if (/^\d+$/.test(d)) return Number(d);
  const p = d.split(':').map(Number);
  if (p.some(isNaN)) return 0;
  return p.reduce((acc, n) => acc * 60 + n, 0);
}
function shortId(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export type FeedResult = {image: string; episodes: Episode[]};

export async function readFeed(show: PodcastShow, limit = 30): Promise<FeedResult> {
  return parseFeed(await readHead(show.feed), show, limit);
}

export function parseFeed(xml: string, show: Pick<PodcastShow, 'id' | 'title'>, limit = 30): FeedResult {
  const head = xml.split(/<item[\s>]/i)[0];
  const image = attr(head, 'itunes:image', 'href') || tag(tag(head, 'image'), 'url');
  const items = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].slice(0, limit);
  const episodes: Episode[] = [];
  for (const [it] of items) {
    const audio = attr(it, 'enclosure', 'url');
    if (!/^https:\/\//i.test(audio)) continue; // solo HTTPS (evita contenido mixto)
    const date = new Date(tag(it, 'pubDate'));
    const guid = tag(it, 'guid') || audio;
    episodes.push({
      id: show.id + ':' + shortId(guid),
      show: show.id,
      showTitle: show.title,
      title: text(tag(it, 'title')) || 'Episodio',
      date: isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString(),
      audio,
      duration: seconds(tag(it, 'itunes:duration')),
      image: attr(it, 'itunes:image', 'href') || image,
      desc: text(tag(it, 'itunes:summary') || tag(it, 'description')).slice(0, 280),
      link: tag(it, 'link'),
    });
  }
  return {image, episodes};
}
