import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

/**
 * Voz natural opcional con IA (OpenAI gpt-4o-mini-tts).
 * Se activa solo si existe la variable de entorno OPENAI_API_KEY en Vercel.
 * Sin esa variable, la app usa automáticamente la mejor voz en español del dispositivo.
 * Solo usuarios con sesión iniciada pueden generar audio (evita abuso de la clave).
 */
const MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE || 'nova';
const INSTRUCTIONS =
  'Habla en español latinoamericano neutro, con acento cercano al chileno. Tono cálido, tranquilo y cercano, ' +
  'como una instructora de bienestar amable. Ritmo pausado y natural, con pequeñas pausas entre frases. ' +
  'Pronuncia los números y medidas de forma natural. Nunca suenes robótica ni apurada.';

const hits = new Map<string, {n: number; t: number}>();
function rateLimited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.t > 60_000) {
    hits.set(key, {n: 1, t: now});
    return false;
  }
  h.n++;
  return h.n > 40;
}

export async function GET() {
  return NextResponse.json({enabled: !!process.env.OPENAI_API_KEY});
}

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error: 'Voz IA no configurada'}, {status: 404});

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!url || !anon || !token) return NextResponse.json({error: 'Inicia sesión para usar la voz IA'}, {status: 401});
  const {data, error} = await createClient(url, anon, {auth: {persistSession: false}}).auth.getUser(token);
  if (error || !data.user) return NextResponse.json({error: 'Sesión no válida'}, {status: 401});
  if (rateLimited(data.user.id)) return NextResponse.json({error: 'Demasiadas solicitudes'}, {status: 429});

  let text = '';
  try {
    text = String((await req.json())?.text || '').trim().slice(0, 1200);
  } catch {}
  if (!text) return NextResponse.json({error: 'Texto vacío'}, {status: 400});

  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model: MODEL, voice: VOICE, input: text, instructions: INSTRUCTIONS, response_format: 'mp3'}),
    signal: AbortSignal.timeout(25000),
  }).catch(() => null);
  if (!r || !r.ok) return NextResponse.json({error: 'No se pudo generar el audio'}, {status: 502});
  return new NextResponse(r.body, {headers: {'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400'}});
}
