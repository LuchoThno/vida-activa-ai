/**
 * Traducción de contenido web al español (solo servidor).
 * 1) Si existe OPENAI_API_KEY → traducción de alta calidad con gpt-4o-mini.
 * 2) Si no → MyMemory (servicio público gratuito, traducción neuronal).
 *    Opcional: MYMEMORY_EMAIL amplía la cuota diaria gratuita de 5.000 a 50.000 caracteres.
 * Cada fragmento traducido se guarda en la caché de datos de Next/Vercel (30 días),
 * así cada receta se traduce una sola vez.
 */
const MONTH = 60 * 60 * 24 * 30;
const memory = new Map<string, string>();

function chunkLines(lines: string[], maxBytes = 450): string[][] {
  const out: string[][] = [];
  let cur: string[] = [];
  let size = 0;
  for (const l of lines) {
    const b = new TextEncoder().encode(l).length + 1;
    if (cur.length && size + b > maxBytes) {
      out.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(l);
    size += b;
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Divide una línea larga en frases para no superar el límite por solicitud. */
function splitLong(line: string, maxBytes = 440): string[] {
  if (new TextEncoder().encode(line).length <= maxBytes) return [line];
  const parts = line.match(/[^.!?]+[.!?]*\s*/g) || [line];
  const out: string[] = [];
  let buf = '';
  for (const p of parts) {
    if (new TextEncoder().encode(buf + p).length > maxBytes && buf) {
      out.push(buf.trim());
      buf = p;
    } else buf += p;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.flatMap(x => (new TextEncoder().encode(x).length > maxBytes ? [x.slice(0, 400)] : [x]));
}

async function myMemory(text: string, from: string, to: string): Promise<string | null> {
  const params = new URLSearchParams({q: text, langpair: `${from}|${to}`});
  if (process.env.MYMEMORY_EMAIL) params.set('de', process.env.MYMEMORY_EMAIL);
  try {
    const r = await fetch('https://api.mymemory.translated.net/get?' + params, {
      next: {revalidate: MONTH},
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d?.quotaFinished || Number(d?.responseStatus) !== 200) return null;
    const t = String(d?.responseData?.translatedText || '');
    if (!t || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) return null;
    return t.replace(/ /g, ' ');
  } catch {
    return null;
  }
}

async function openAI(lines: string[], to: string): Promise<string[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATE_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        response_format: {type: 'json_object'},
        messages: [
          {
            role: 'system',
            content:
              to === 'es'
                ? 'Traduce al español latinoamericano (usa términos de Chile cuando existan: palta, choclo, zapallo, porotos, betarraga, frutilla). ' +
                  'Usa el tuteo en instrucciones. Mantén números y medidas, convierte unidades inglesas solo si es obvio. ' +
                  'Devuelve JSON {"t": [..]} con el mismo número de elementos y en el mismo orden.'
                : 'Translate to English. Return JSON {"t": [..]} with the same number of items in the same order.',
          },
          {role: 'user', content: JSON.stringify({t: lines})},
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const parsed = JSON.parse(d?.choices?.[0]?.message?.content || '{}');
    return Array.isArray(parsed.t) && parsed.t.length === lines.length ? parsed.t.map(String) : null;
  } catch {
    return null;
  }
}

/**
 * Traduce una lista de textos. Devuelve el mismo largo; si algo falla
 * se conserva el texto original y `ok` queda en false.
 */
export async function translateLines(lines: string[], from = 'en', to = 'es'): Promise<{lines: string[]; ok: boolean}> {
  const result = [...lines];
  const pending: number[] = [];
  lines.forEach((l, i) => {
    const k = `${from}>${to}:${l}`;
    if (!l.trim()) return;
    if (memory.has(k)) result[i] = memory.get(k)!;
    else pending.push(i);
  });
  if (!pending.length) return {lines: result, ok: true};

  const src = pending.map(i => lines[i]);
  const ai = await openAI(src, to);
  if (ai) {
    pending.forEach((i, j) => {
      result[i] = ai[j];
      memory.set(`${from}>${to}:${lines[i]}`, ai[j]);
    });
    return {lines: result, ok: true};
  }

  let ok = true;
  // Cada línea se divide en frases cortas y se agrupan en lotes separados por salto de línea.
  const pieces: {owner: number; text: string}[] = [];
  pending.forEach(i => splitLong(lines[i].replace(/\s*\n+\s*/g, ' ')).forEach(t => pieces.push({owner: i, text: t})));
  const translated = new Array<string>(pieces.length);
  const batches = chunkLines(pieces.map(p => p.text));
  let offset = 0;
  const jobs = batches.map(batch => {
    const start = offset;
    offset += batch.length;
    return (async () => {
      const t = await myMemory(batch.join('\n'), from, to === 'es' ? 'es-CL' : to);
      const parts = t?.split('\n');
      if (parts && parts.length === batch.length) {
        parts.forEach((p, j) => (translated[start + j] = p.trim()));
        return;
      }
      // el lote no conservó las líneas: traducir una por una
      await Promise.all(
        batch.map(async (line, j) => {
          const one = await myMemory(line, from, to === 'es' ? 'es-CL' : to);
          if (!one) ok = false;
          translated[start + j] = one?.trim() || line;
        }),
      );
    })();
  });
  await Promise.all(jobs);

  const joined = new Map<number, string[]>();
  pieces.forEach((p, k) => joined.set(p.owner, [...(joined.get(p.owner) || []), translated[k] ?? p.text]));
  for (const [i, parts] of joined) {
    result[i] = parts.join(' ');
    if (ok) memory.set(`${from}>${to}:${lines[i]}`, result[i]);
  }
  return {lines: result, ok};
}

export async function translateText(text: string, from = 'en', to = 'es') {
  const {lines, ok} = await translateLines([text], from, to);
  return {text: lines[0], ok};
}
