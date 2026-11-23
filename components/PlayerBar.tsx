'use client';
import {ExternalLink, Loader2, Pause, Play, RotateCcw, RotateCw, X} from 'lucide-react';
import {pauseAudio, resumeAudio, seek, setRate, skip, stopAudio, usePlayer} from '../lib/player';
import {useSpeech} from '../lib/speech';
import {formatDuration} from '../lib/podcasts';

const RATES = [0.8, 1, 1.25, 1.5, 2];

/** Barra de reproducción fija: el podcast o la radio sigue sonando mientras navegas por la app. */
export function PlayerBar() {
  const p = usePlayer();
  const speech = useSpeech();
  if (!p.track || speech.speaking) return null;
  const t = p.track;
  const live = t.kind === 'live';
  return (
    <div className="player-bar" role="region" aria-label="Reproductor de audio">
      {t.image ? <img className="pb-art" src={t.image} alt="" /> : <div className="pb-art" />}
      <div className="pb-main">
        <div className="pb-meta">
          <span className="pb-sub">
            {live && <span className="live-dot">EN DIRECTO</span>}
            {t.subtitle}
          </span>
          <strong title={t.title}>{t.title}</strong>
        </div>
        {!live && (
          <div className="pb-seek">
            <span>{formatDuration(p.position) || '0:00'}</span>
            <input type="range" min={0} max={p.duration || t.duration || 0} step={1} value={Math.min(p.position, p.duration || t.duration || 0)} onChange={e => seek(Number(e.target.value))} aria-label="Avance del episodio" />
            <span>{formatDuration(p.duration || t.duration || 0)}</span>
          </div>
        )}
        {p.error && <span className="pb-error">{p.error}</span>}
      </div>
      <div className="pb-controls">
        {!live && (
          <button className="icon-btn" onClick={() => skip(-15)} aria-label="Retroceder 15 segundos">
            <RotateCcw size={17} />
          </button>
        )}
        <button className="icon-btn pb-play" onClick={() => (p.playing ? pauseAudio() : resumeAudio())} aria-label={p.playing ? 'Pausar' : 'Reproducir'}>
          {p.loading ? <Loader2 className="spin" size={20} /> : p.playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        {!live && (
          <button className="icon-btn" onClick={() => skip(30)} aria-label="Adelantar 30 segundos">
            <RotateCw size={17} />
          </button>
        )}
        {!live && (
          <select className="pb-rate" value={p.rate} onChange={e => setRate(Number(e.target.value))} aria-label="Velocidad">
            {RATES.map(r => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        )}
        {t.link && (
          <a className="icon-btn" href={t.link} target="_blank" rel="noopener noreferrer" aria-label="Abrir en la plataforma original" title="Abrir afuera">
            <ExternalLink size={16} />
          </a>
        )}
        <button className="icon-btn" onClick={stopAudio} aria-label="Cerrar reproductor">
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
