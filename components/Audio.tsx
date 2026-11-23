'use client';
import {useState} from 'react';
import {Pause, Play, Settings2, Square, Volume2, Sparkles, X} from 'lucide-react';
import {pauseSpeech, previewVoice, resumeSpeech, speak, stopSpeech, updateSpeechPrefs, useSpeech} from '../lib/speech';

/** Botón para escuchar un texto. Si ya está sonando ese mismo texto, lo detiene. */
export function ListenButton({text, label, children, className = 'btn btn-soft'}: {text: string; label: string; children?: React.ReactNode; className?: string}) {
  const s = useSpeech();
  const active = s.speaking && s.label === label;
  return (
    <button
      type="button"
      className={className + (active ? ' is-playing' : '')}
      disabled={!s.supported && !s.aiAvailable}
      onClick={() => (active ? stopSpeech() : speak(text, label))}
      aria-pressed={active}
    >
      {active ? <Square size={16} /> : <Volume2 size={17} />}
      {className.includes('icon-btn') ? <span className="sr-only">{active ? 'Detener' : 'Escuchar'}</span> : active ? 'Detener' : children || 'Escuchar'}
    </button>
  );
}

const RATES = [
  {v: 0.7, label: 'Muy pausada'},
  {v: 0.8, label: 'Pausada'},
  {v: 0.85, label: 'Natural'},
  {v: 0.95, label: 'Normal'},
  {v: 1.1, label: 'Rápida'},
];

export function VoiceSettings({onClose}: {onClose?: () => void}) {
  const s = useSpeech();
  const autoName = s.voices.find(v => v.recommended)?.name;
  return (
    <div className="voice-settings" role="dialog" aria-label="Ajustes de voz">
      <div className="vs-head">
        <strong>Ajustes de voz</strong>
        {onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar ajustes">
            <X size={18} />
          </button>
        )}
      </div>
      {s.aiAvailable && (
        <label className="vs-row">
          <span>
            <Sparkles size={15} /> Voz natural con IA
          </span>
          <select value={s.prefs.engine} onChange={e => updateSpeechPrefs({engine: e.target.value as 'auto' | 'browser'})}>
            <option value="auto">Activada (recomendado)</option>
            <option value="browser">Usar voz del dispositivo</option>
          </select>
        </label>
      )}
      <label className="vs-row">
        <span>Voz del dispositivo</span>
        <select value={s.prefs.voiceURI || ''} onChange={e => updateSpeechPrefs({voiceURI: e.target.value || null})}>
          <option value="">Automática{autoName ? ` · ${autoName}` : ''}</option>
          {s.voices.map(v => (
            <option key={v.uri} value={v.uri}>
              {v.recommended ? '★ ' : ''}
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </label>
      <div className="vs-row">
        <span>Velocidad</span>
        <div className="seg">
          {RATES.map(r => (
            <button key={r.v} className={Math.abs(s.prefs.rate - r.v) < 0.02 ? 'on' : ''} onClick={() => updateSpeechPrefs({rate: r.v})}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <button className="btn btn-soft" onClick={previewVoice}>
        <Volume2 size={16} /> Probar voz
      </button>
      <p className="fine">
        {s.voices.length === 0
          ? 'Tu dispositivo no ofrece voces en español. Puedes instalarlas en la configuración de idioma del sistema.'
          : 'Las voces marcadas con ★ son las más naturales disponibles. En Windows, Edge ofrece voces “Natural” muy realistas; en iPhone puedes descargar voces “Mejoradas” en Ajustes › Accesibilidad › Contenido leído.'}
      </p>
    </div>
  );
}

/** Barra flotante con lo que se está leyendo, pausa y ajustes. */
export function AudioBar() {
  const s = useSpeech();
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="vs-pop">
          <VoiceSettings onClose={() => setOpen(false)} />
        </div>
      )}
      {s.speaking ? (
        <div className="audio-bar" role="status" aria-live="polite">
          <div className="eq" aria-hidden>
            <i className={s.paused ? 'paused' : ''} />
            <i className={s.paused ? 'paused' : ''} />
            <i className={s.paused ? 'paused' : ''} />
          </div>
          <div className="ab-text">
            <small>
              {s.label}
              {s.engine === 'ai' ? ' · voz IA' : ''}
            </small>
            <span>{s.current}</span>
            <div className="ab-progress">
              <b style={{width: `${s.total ? ((s.index + 1) / s.total) * 100 : 0}%`}} />
            </div>
          </div>
          <button className="icon-btn" onClick={() => (s.paused ? resumeSpeech() : pauseSpeech())} aria-label={s.paused ? 'Continuar' : 'Pausar'}>
            {s.paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button className="icon-btn" onClick={() => setOpen(o => !o)} aria-label="Ajustes de voz">
            <Settings2 size={18} />
          </button>
          <button className="icon-btn" onClick={stopSpeech} aria-label="Detener">
            <Square size={16} />
          </button>
        </div>
      ) : null}
    </>
  );
}
