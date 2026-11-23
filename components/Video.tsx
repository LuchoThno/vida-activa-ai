'use client';
import {useEffect, useState, useSyncExternalStore} from 'react';
import {ExternalLink, Loader2, Video as VideoIcon, X} from 'lucide-react';
import {stopSpeech} from '../lib/speech';

/** Reproductor de video dentro de la app (YouTube embebido o archivo MP4). */
export type VideoRequest = {title: string; youtube?: string; mp4?: string; query?: string};

let current: VideoRequest | null = null;
const listeners = new Set<() => void>();
export function openVideo(v: VideoRequest) {
  stopSpeech();
  current = v;
  listeners.forEach(l => l());
}
export function closeVideo() {
  current = null;
  listeners.forEach(l => l());
}
function useCurrent() {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
}

export function youtubeId(url = ''): string | undefined {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m?.[1];
}

const searchUrl = (q: string) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

export function VideoButton({req, className = 'link-btn', children}: {req: VideoRequest; className?: string; children?: React.ReactNode}) {
  return (
    <button type="button" className={className} onClick={() => openVideo(req)}>
      <VideoIcon size={16} /> {children || 'Ver video'}
    </button>
  );
}

export function VideoModal() {
  const v = useCurrent();
  const [id, setId] = useState<string | undefined>();
  const [state, setState] = useState<'idle' | 'loading' | 'none'>('idle');

  useEffect(() => {
    if (!v) return;
    setId(v.youtube);
    setState('idle');
    if (!v.youtube && !v.mp4 && v.query) {
      setState('loading');
      fetch('/api/videos?q=' + encodeURIComponent(v.query))
        .then(r => r.json())
        .then(d => {
          const first = d.items?.[0]?.id;
          if (first) {
            setId(first);
            setState('idle');
          } else setState('none');
        })
        .catch(() => setState('none'));
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeVideo();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [v]);

  if (!v) return null;
  return (
    <div className="overlay video-overlay" onClick={closeVideo}>
      <div className="video-box" role="dialog" aria-modal="true" aria-label={'Video: ' + v.title} onClick={e => e.stopPropagation()}>
        <div className="video-head">
          <strong>{v.title}</strong>
          <button className="icon-btn" onClick={closeVideo} aria-label="Cerrar video">
            <X size={18} />
          </button>
        </div>
        <div className="video-frame">
          {v.mp4 ? (
            <video src={v.mp4} controls autoPlay playsInline />
          ) : id ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&hl=es&cc_lang_pref=es&playsinline=1`}
              title={v.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : state === 'loading' ? (
            <div className="video-msg">
              <Loader2 className="spin" size={28} /> Buscando un video en español…
            </div>
          ) : (
            <div className="video-msg">
              <p>No hay un video integrado para este ejercicio todavía.</p>
              <a className="btn btn-white" href={searchUrl(v.query || v.title)} target="_blank" rel="noopener noreferrer">
                Buscar en YouTube <ExternalLink size={15} />
              </a>
            </div>
          )}
        </div>
        {id && (
          <a className="fine video-ext" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
            ¿No se reproduce? Ábrelo en YouTube <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
