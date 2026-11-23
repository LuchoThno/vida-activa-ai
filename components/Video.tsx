'use client';
import {useEffect, useState, useSyncExternalStore} from 'react';
import {ExternalLink, Loader2, Play, Video as VideoIcon, X} from 'lucide-react';
import {stopSpeech} from '../lib/speech';
import {pauseAudio} from '../lib/player';
import {videoById, youtubeThumb, youtubeWatchUrl, type VideoInfo} from '../lib/videos';

/**
 * Reproductor de video dentro de la app (YouTube embebido sin cookies o archivo MP4).
 * El video se ve dentro de la app y siempre se ofrece el enlace original para abrirlo afuera.
 */
export type VideoRequest = {title: string; youtube?: string; mp4?: string; query?: string; channel?: string; source?: string};

let current: VideoRequest | null = null;
const listeners = new Set<() => void>();
export function openVideo(v: VideoRequest) {
  stopSpeech();
  pauseAudio();
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

/** Miniatura clicable: reproduce dentro de la app y muestra el enlace a YouTube. */
export function VideoCard({video, title, label}: {video: VideoInfo; title?: string; label?: string}) {
  const t = title || video.title;
  return (
    <div className="vcard">
      <button type="button" className="vcard-thumb" onClick={() => openVideo({title: t, youtube: video.id, channel: video.channel})} aria-label={'Reproducir: ' + t}>
        <img src={youtubeThumb(video.id)} alt="" loading="lazy" />
        <span className="vcard-play">
          <Play size={20} fill="currentColor" />
        </span>
        {video.duration && <span className="vcard-dur">{video.duration}</span>}
      </button>
      <div className="vcard-body">
        {label && <span className="eyebrow">{label}</span>}
        <strong>{t}</strong>
        <span className="muted small">{video.channel}</span>
        <a className="fine vcard-ext" href={youtubeWatchUrl(video.id)} target="_blank" rel="noopener noreferrer">
          Ver en YouTube <ExternalLink size={12} />
        </a>
      </div>
    </div>
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
  const channel = v.channel || videoById(id)?.channel;
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
        {(id || v.mp4) && (
          <div className="video-foot">
            <span className="video-credit">{channel ? 'Video de ' + channel : v.mp4 ? 'Video de wger.de (CC-BY-SA)' : 'Video de YouTube'}</span>
            <a className="btn btn-white btn-sm" href={id ? youtubeWatchUrl(id) : v.source || v.mp4} target="_blank" rel="noopener noreferrer">
              {id ? 'Abrir en YouTube' : 'Ver fuente original'} <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
