'use client';
import {useSyncExternalStore} from 'react';

/**
 * Reproductor de audio global (podcasts y radios en directo).
 * Un solo <audio> para toda la app: sigue sonando al cambiar de sección, guarda el progreso
 * de cada episodio y lleva el historial de lo escuchado en el dispositivo.
 */
export type Track = {
  id: string;
  kind: 'episode' | 'live';
  title: string;
  subtitle: string; // podcast o radio
  src: string;
  image?: string;
  link?: string; // enlace externo (sitio o plataforma)
  date?: string;
  duration?: number;
};
export type HistoryItem = Track & {position: number; listenedAt: string; finished: boolean};

type State = {track: Track | null; playing: boolean; loading: boolean; position: number; duration: number; rate: number; error: string; history: HistoryItem[]};

const HISTORY_KEY = 'va-audio-history';
const RATE_KEY = 'va-audio-rate';
let audio: HTMLAudioElement | null = null;
let state: State = {track: null, playing: false, loading: false, position: 0, duration: 0, rate: 1, error: '', history: []};
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = {...state, ...patch};
  listeners.forEach(l => l());
};

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveHistory(h: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 60)));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

let lastSave = 0;
function remember(force = false) {
  const t = state.track;
  if (!t || !audio) return;
  if (!force && Date.now() - lastSave < 5000) return;
  lastSave = Date.now();
  const dur = audio.duration && isFinite(audio.duration) ? audio.duration : t.duration || 0;
  const position = t.kind === 'live' ? 0 : audio.currentTime;
  const item: HistoryItem = {...t, duration: dur || t.duration, position, listenedAt: new Date().toISOString(), finished: dur > 0 && position >= dur - 30};
  const history = [item, ...state.history.filter(h => h.id !== t.id)].slice(0, 60);
  saveHistory(history);
  set({history});
}

function ensure(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'none';
  state = {...state, history: load<HistoryItem[]>(HISTORY_KEY, []), rate: load<number>(RATE_KEY, 1)};
  audio.addEventListener('playing', () => set({playing: true, loading: false, error: ''}));
  audio.addEventListener('pause', () => {
    set({playing: false});
    remember(true);
  });
  audio.addEventListener('waiting', () => set({loading: true}));
  audio.addEventListener('canplay', () => set({loading: false}));
  audio.addEventListener('timeupdate', () => {
    set({position: audio!.currentTime, duration: isFinite(audio!.duration) ? audio!.duration : 0});
    remember();
  });
  audio.addEventListener('ended', () => {
    remember(true);
    set({playing: false});
  });
  audio.addEventListener('error', () => set({playing: false, loading: false, error: state.track?.kind === 'live' ? 'La radio no responde ahora. Prueba otra estación.' : 'No se pudo reproducir este episodio. Ábrelo en la plataforma.'}));
  window.addEventListener('pagehide', () => remember(true));
  return audio;
}

function mediaSession(t: Track) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({title: t.title, artist: t.subtitle, album: 'Vida Activa AI', artwork: t.image ? [{src: t.image, sizes: '512x512'}] : []});
    navigator.mediaSession.setActionHandler('play', () => resumeAudio());
    navigator.mediaSession.setActionHandler('pause', () => pauseAudio());
    navigator.mediaSession.setActionHandler('seekbackward', t.kind === 'live' ? null : () => skip(-15));
    navigator.mediaSession.setActionHandler('seekforward', t.kind === 'live' ? null : () => skip(30));
  } catch {
    /* navegador sin soporte completo */
  }
}

export function playTrack(t: Track) {
  const a = ensure();
  if (!a) return;
  if (state.track?.id === t.id) {
    if (a.paused) resumeAudio();
    else pauseAudio();
    return;
  }
  remember(true);
  a.src = t.src;
  a.playbackRate = t.kind === 'live' ? 1 : state.rate;
  const saved = state.history.find(h => h.id === t.id);
  set({track: t, loading: true, error: '', position: 0, duration: t.duration || 0});
  if (t.kind === 'episode' && saved && !saved.finished && saved.position > 10) {
    a.addEventListener('loadedmetadata', () => (a.currentTime = saved.position), {once: true});
  }
  mediaSession(t);
  a.play().catch(() => set({loading: false, playing: false}));
}
export function pauseAudio() {
  audio?.pause();
}
export function resumeAudio() {
  if (!audio || !state.track) return;
  if (state.track.kind === 'live') {
    audio.src = state.track.src; // vuelve al directo, no a lo que quedó en memoria
  }
  audio.play().catch(() => {});
}
export function stopAudio() {
  remember(true);
  audio?.pause();
  if (audio) audio.removeAttribute('src');
  set({track: null, playing: false, loading: false, position: 0, duration: 0});
}
export function skip(sec: number) {
  if (!audio || state.track?.kind !== 'episode') return;
  audio.currentTime = Math.max(0, Math.min((audio.duration || Infinity) - 1, audio.currentTime + sec));
}
export function seek(sec: number) {
  if (audio && state.track?.kind === 'episode') audio.currentTime = sec;
}
export function setRate(rate: number) {
  set({rate});
  if (audio && state.track?.kind === 'episode') audio.playbackRate = rate;
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify(rate));
  } catch {}
}
export function clearHistory() {
  saveHistory([]);
  set({history: []});
}
export function removeFromHistory(id: string) {
  const history = state.history.filter(h => h.id !== id);
  saveHistory(history);
  set({history});
}

const server: State = {track: null, playing: false, loading: false, position: 0, duration: 0, rate: 1, error: '', history: []};
export function usePlayer(): State {
  return useSyncExternalStore(
    l => {
      ensure();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => server,
  );
}
