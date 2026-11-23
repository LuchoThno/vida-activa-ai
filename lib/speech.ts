'use client';
/**
 * Motor de lectura en voz alta para Vida Activa AI.
 *
 * - Elige automáticamente la voz en español más natural disponible en el dispositivo
 *   (voces "Natural/Online" de Edge, "Premium/Mejorada" de Apple, Google español, etc.)
 *   y evita voces de novedad que suenan robóticas.
 * - Normaliza el texto para que se lea como lo diría una persona
 *   ("1/2 taza" → "media taza", "2×8" → "2 series de 8", "25–30 min" → "25 a 30 minutos").
 * - Divide el texto en frases cortas y agrega pausas naturales entre ellas
 *   (además evita el corte de Chrome en textos largos).
 * - Velocidad configurable (por defecto más pausada que la del navegador).
 * - Si el servidor tiene configurada una voz IA (OPENAI_API_KEY), puede usarla
 *   para una narración todavía más natural, con respaldo automático a la voz del dispositivo.
 */
import {useSyncExternalStore} from 'react';

export type SpeechEngine = 'auto' | 'browser' | 'ai';
export type SpeechPrefs = {voiceURI: string | null; rate: number; engine: SpeechEngine};
export type SpeechState = {
  speaking: boolean;
  paused: boolean;
  label: string;
  current: string;
  index: number;
  total: number;
  engine: 'browser' | 'ai' | null;
  supported: boolean;
  aiAvailable: boolean;
  voices: {uri: string; name: string; lang: string; recommended: boolean}[];
  prefs: SpeechPrefs;
};

const PREFS_KEY = 'va-speech-prefs';
const DEFAULT_PREFS: SpeechPrefs = {voiceURI: null, rate: 0.85, engine: 'auto'};

const NOVELTY = /(compact|eloquence|grandma|grandpa|abuel|rocko|shelley|flo\b|reed|sandy|eddy|bells|bubbles|bad news|good news|jester|organ|trinoids|whisper|zarvox|superstar|wobble|cellos|boing|albert|bahh|fred|junior|ralph|kathy)/i;
const QUALITY = /(natural|neural|online|premium|enhanced|mejorad|wavenet|studio|siri)/i;
const LANG_PREF = ['es-cl', 'es-419', 'es-us', 'es-mx', 'es-ar', 'es-co', 'es-pe', 'es-es'];

function scoreVoice(v: SpeechSynthesisVoice): number {
  const lang = v.lang.toLowerCase().replace('_', '-');
  if (!lang.startsWith('es')) return -1;
  const n = v.name;
  let s = 0;
  if (QUALITY.test(n)) s += 50;
  if (/google/i.test(n)) s += 22;
  if (/microsoft/i.test(n) && !QUALITY.test(n)) s -= 6; // voces SAPI antiguas suenan robóticas
  if (NOVELTY.test(n)) s -= 80;
  const i = LANG_PREF.indexOf(lang);
  s += i >= 0 ? 16 - i * 2 : 2;
  if (v.localService === false) s += 4;
  return s;
}

// ---------- Normalización del texto ----------
const FRACTIONS: [RegExp, string][] = [
  [/\b1\s*\/\s*2\b|½/g, 'media'],
  [/\b1\s*\/\s*4\b|¼/g, 'un cuarto de'],
  [/\b3\s*\/\s*4\b|¾/g, 'tres cuartos de'],
  [/\b1\s*\/\s*3\b|⅓/g, 'un tercio de'],
  [/\b2\s*\/\s*3\b|⅔/g, 'dos tercios de'],
];

export function normalizeForSpeech(input: string): string {
  let t = ' ' + input + ' ';
  t = t.replace(/https?:\/\/\S+/g, ' ');
  t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ');
  t = t.replace(/(\d+)\s*[×x]\s*(\d+)/g, '$1 series de $2');
  t = t.replace(/(\d+)\s*[–—-]\s*(\d+)/g, '$1 a $2');
  for (const [re, word] of FRACTIONS) t = t.replace(re, word);
  t = t.replace(/de\s+de\b/g, 'de');
  t = t.replace(/(\d)\s*°\s*[cC]\b/g, '$1 grados');
  t = t.replace(/(\d)\s*°\s*[fF]\b/g, '$1 grados Fahrenheit');
  t = t.replace(/(\d)\s*°/g, '$1 grados');
  t = t.replace(/(\d)\s*kg\b/gi, '$1 kilos');
  t = t.replace(/(\d)\s*g\b/g, '$1 gramos');
  t = t.replace(/(\d)\s*ml\b/gi, '$1 mililitros');
  t = t.replace(/(\d)\s*l\b/g, '$1 litros');
  t = t.replace(/(\d)\s*min\b/gi, '$1 minutos');
  t = t.replace(/(\d)\s*seg\b/gi, '$1 segundos');
  t = t.replace(/\bcdta?s?\b\.?/gi, m => (/cdta/i.test(m) ? 'cucharadita' : 'cucharada'));
  t = t.replace(/\bmedia\s+(\w+)/g, 'media $1');
  t = t.replace(/\s*·\s*/g, ', ');
  t = t.replace(/\s*\|\s*/g, '. ');
  t = t.replace(/[“”"«»*_#>]/g, '');
  t = t.replace(/\s*\n+\s*/g, '. ');
  t = t.replace(/\.\s*\./g, '.');
  t = t.replace(/\s{2,}/g, ' ');
  return t.trim();
}

/** Divide en frases cortas; cada frase lleva la pausa que corresponde después. */
export function splitIntoChunks(text: string, max = 200): {text: string; pause: number}[] {
  const clean = normalizeForSpeech(text);
  const sentences = clean.match(/[^.!?…;]+[.!?…;]*/g) || [clean];
  const out: {text: string; pause: number}[] = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    const pause = /[.!?…]$/.test(s) ? 420 : /;$/.test(s) ? 300 : 260;
    if (s.length <= max) {
      out.push({text: s, pause});
      continue;
    }
    // frase larga: cortar en comas
    const parts = s.split(/,\s*/);
    let buf = '';
    for (const p of parts) {
      if ((buf + ', ' + p).length > max && buf) {
        out.push({text: buf + ',', pause: 180});
        buf = p;
      } else buf = buf ? buf + ', ' + p : p;
    }
    if (buf) out.push({text: buf, pause});
  }
  return out;
}

// ---------- Estado global ----------
type Listener = () => void;
const listeners = new Set<Listener>();
let state: SpeechState = {
  speaking: false,
  paused: false,
  label: '',
  current: '',
  index: 0,
  total: 0,
  engine: null,
  supported: false,
  aiAvailable: false,
  voices: [],
  prefs: DEFAULT_PREFS,
};
function set(patch: Partial<SpeechState>) {
  state = {...state, ...patch};
  listeners.forEach(l => l());
}

let initialized = false;
let queue: {text: string; pause: number}[] = [];
let generation = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let audio: HTMLAudioElement | null = null;
let aiQueue: Promise<string | null>[] = [];
let tokenProvider: (() => Promise<string | null>) | null = null;

export function setSpeechTokenProvider(fn: () => Promise<string | null>) {
  tokenProvider = fn;
}

function loadPrefs(): SpeechPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return {...DEFAULT_PREFS, ...JSON.parse(raw)};
  } catch {}
  return DEFAULT_PREFS;
}

function refreshVoices() {
  if (!('speechSynthesis' in window)) return;
  const all = window.speechSynthesis.getVoices();
  const ranked = all
    .map(v => ({v, s: scoreVoice(v)}))
    .filter(x => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  const best = ranked[0]?.v;
  set({
    voices: ranked.map(({v, s}) => ({
      uri: v.voiceURI,
      name: v.name.replace(/\s+/g, ' ').trim(),
      lang: v.lang,
      recommended: v === best || s >= 50,
    })),
  });
}

function init() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  set({supported, prefs: loadPrefs()});
  if (supported) {
    refreshVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
    // algunos navegadores cargan las voces tarde
    setTimeout(refreshVoices, 400);
    setTimeout(refreshVoices, 1500);
  }
  fetch('/api/tts')
    .then(r => (r.ok ? r.json() : null))
    .then(d => set({aiAvailable: !!d?.enabled}))
    .catch(() => {});
}

function pickVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices();
  const chosen = state.prefs.voiceURI && all.find(v => v.voiceURI === state.prefs.voiceURI);
  if (chosen) return chosen;
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const v of all) {
    const s = scoreVoice(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

export function updateSpeechPrefs(patch: Partial<SpeechPrefs>) {
  const prefs = {...state.prefs, ...patch};
  prefs.rate = Math.min(1.3, Math.max(0.6, Number(prefs.rate) || DEFAULT_PREFS.rate));
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
  set({prefs});
  if (audio) audio.playbackRate = aiPlaybackRate();
}

function aiPlaybackRate() {
  // la voz IA ya es pausada; se ajusta proporcionalmente a la preferencia
  return Math.min(1.4, Math.max(0.7, state.prefs.rate / 0.85));
}

function clearTimers() {
  if (timer) clearTimeout(timer);
  timer = null;
}

export function stopSpeech() {
  generation++;
  clearTimers();
  queue = [];
  aiQueue = [];
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  if (audio) {
    audio.pause();
    audio.src = '';
    audio = null;
  }
  set({speaking: false, paused: false, label: '', current: '', index: 0, total: 0, engine: null});
}

// ---------- Voz del dispositivo ----------
function speakBrowserFrom(i: number, gen: number) {
  if (gen !== generation) return;
  if (i >= queue.length) {
    stopSpeech();
    return;
  }
  const chunk = queue[i];
  const u = new SpeechSynthesisUtterance(chunk.text);
  const voice = pickVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else u.lang = 'es-CL';
  u.rate = state.prefs.rate;
  u.pitch = 1;
  u.volume = 1;
  let advanced = false;
  const next = () => {
    if (advanced || gen !== generation) return;
    advanced = true;
    if (state.paused) return;
    timer = setTimeout(() => speakBrowserFrom(i + 1, gen), chunk.pause);
  };
  u.onend = next;
  u.onerror = e => {
    if ((e as SpeechSynthesisErrorEvent).error === 'interrupted' || (e as SpeechSynthesisErrorEvent).error === 'canceled') return;
    next();
  };
  set({index: i, current: chunk.text});
  window.speechSynthesis.speak(u);
}

// ---------- Voz IA (opcional, servidor) ----------
function groupForAI(chunks: {text: string; pause: number}[], max = 450) {
  const groups: string[] = [];
  let buf = '';
  for (const c of chunks) {
    if ((buf + ' ' + c.text).length > max && buf) {
      groups.push(buf);
      buf = c.text;
    } else buf = buf ? buf + ' ' + c.text : c.text;
  }
  if (buf) groups.push(buf);
  return groups;
}

async function fetchAI(text: string): Promise<string | null> {
  const token = tokenProvider ? await tokenProvider() : null;
  const r = await fetch('/api/tts', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {})},
    body: JSON.stringify({text}),
  });
  if (!r.ok) return null;
  const blob = await r.blob();
  return URL.createObjectURL(blob);
}

async function speakAI(groups: string[], gen: number): Promise<boolean> {
  aiQueue = groups.map((g, i) => (i < 2 ? fetchAI(g) : (null as unknown as Promise<string | null>)));
  for (let i = 0; i < groups.length; i++) {
    if (gen !== generation) return true;
    if (!aiQueue[i]) aiQueue[i] = fetchAI(groups[i]);
    if (i + 1 < groups.length && !aiQueue[i + 1]) aiQueue[i + 1] = fetchAI(groups[i + 1]);
    const url = await aiQueue[i].catch(() => null);
    if (gen !== generation) return true;
    if (!url) return i > 0; // si falla al inicio, se usa la voz del dispositivo
    set({index: i, current: groups[i], total: groups.length});
    await new Promise<void>(resolve => {
      const a = new Audio(url);
      audio = a;
      a.playbackRate = aiPlaybackRate();
      a.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
    await new Promise(r => setTimeout(r, 250));
  }
  if (gen === generation) stopSpeech();
  return true;
}

/** Lee un texto en voz alta. `label` se muestra en la barra de audio. */
export async function speak(text: string, label = 'Lectura') {
  init();
  stopSpeech();
  const chunks = splitIntoChunks(text.slice(0, 15000));
  if (!chunks.length) return;
  const gen = ++generation;
  queue = chunks;
  const wantAI = state.aiAvailable && state.prefs.engine !== 'browser';
  if (wantAI) {
    set({speaking: true, paused: false, label, total: chunks.length, index: 0, engine: 'ai', current: 'Preparando voz natural…'});
    const ok = await speakAI(groupForAI(chunks), gen);
    if (ok || gen !== generation) return;
  }
  if (!state.supported) {
    stopSpeech();
    return;
  }
  set({speaking: true, paused: false, label, total: chunks.length, index: 0, engine: 'browser'});
  // Chrome a veces necesita una pausa tras cancel()
  timer = setTimeout(() => speakBrowserFrom(0, gen), 120);
}

export function pauseSpeech() {
  if (!state.speaking || state.paused) return;
  clearTimers();
  if (state.engine === 'ai' && audio) audio.pause();
  else if ('speechSynthesis' in window) {
    // pause() es poco fiable en Android: se cancela y se retoma desde la frase actual
    generation++;
    window.speechSynthesis.cancel();
  }
  set({paused: true});
}

export function resumeSpeech() {
  if (!state.speaking || !state.paused) return;
  set({paused: false});
  if (state.engine === 'ai' && audio) audio.play().catch(() => {});
  else {
    const gen = ++generation;
    speakBrowserFrom(state.index, gen);
  }
}

export function previewVoice() {
  speak('Hola. Así suena esta voz. Respira con calma, y avancemos juntos, paso a paso.', 'Prueba de voz');
}

function subscribe(l: Listener) {
  init();
  listeners.add(l);
  return () => listeners.delete(l);
}
const serverState: SpeechState = state;
export function useSpeech(): SpeechState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}
