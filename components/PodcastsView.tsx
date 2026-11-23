'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {ChevronDown, Clock, ExternalLink, Headphones, History, Loader2, Pause, Play, Radio, RefreshCw, Trash2, X} from 'lucide-react';
import {CATEGORIES, SHOWS, STATIONS, appleUrl, dayLabel, formatDuration, type Episode, type LiveStation, type PodcastShow} from '../lib/podcasts';
import {clearHistory, playTrack, removeFromHistory, usePlayer, type Track} from '../lib/player';
import {stopSpeech} from '../lib/speech';

const showById = (id: string) => SHOWS.find(s => s.id === id);
const episodeTrack = (e: Episode): Track => {
  const s = showById(e.show);
  return {id: e.id, kind: 'episode', title: e.title, subtitle: e.showTitle, src: e.audio, image: e.image, link: e.link || (s ? appleUrl(s) : undefined), date: e.date, duration: e.duration};
};
const liveTrack = (s: LiveStation): Track => ({id: 'live:' + s.id, kind: 'live', title: s.title, subtitle: 'Radio en directo · ' + s.mood, src: s.url, link: s.site});
const play = (t: Track) => {
  stopSpeech();
  playTrack(t);
};

function PlayBtn({track, small}: {track: Track; small?: boolean}) {
  const p = usePlayer();
  const active = p.track?.id === track.id;
  const playing = active && p.playing;
  return (
    <button className={'play-btn' + (small ? ' sm' : '') + (active ? ' on' : '')} onClick={() => play(track)} aria-label={(playing ? 'Pausar: ' : 'Escuchar: ') + track.title}>
      {active && p.loading ? <Loader2 className="spin" size={small ? 15 : 18} /> : playing ? <Pause size={small ? 15 : 18} /> : <Play size={small ? 15 : 18} />}
    </button>
  );
}

function EpisodeRow({e, showName = true}: {e: Episode; showName?: boolean}) {
  const p = usePlayer();
  const saved = p.history.find(h => h.id === e.id);
  const pct = saved?.duration ? Math.min(100, (saved.position / saved.duration) * 100) : 0;
  const t = episodeTrack(e);
  return (
    <li className="ep-row">
      {e.image ? <img className="ep-art" src={e.image} alt="" loading="lazy" /> : <div className="ep-art" />}
      <div className="ep-info">
        {showName && <span className="ep-show">{e.showTitle}</span>}
        <strong>{e.title}</strong>
        <span className="muted small">
          {new Date(e.date).toLocaleDateString('es-CL', {day: 'numeric', month: 'short'})}
          {e.duration ? ' · ' + formatDuration(e.duration) : ''}
          {saved?.finished ? ' · Escuchado' : pct > 2 ? ` · Vas en ${formatDuration(saved!.position)}` : ''}
        </span>
        {pct > 2 && !saved?.finished && (
          <span className="ep-progress">
            <span style={{width: pct + '%'}} />
          </span>
        )}
      </div>
      <div className="ep-actions">
        <PlayBtn track={t} />
        {t.link && (
          <a href={t.link} target="_blank" rel="noopener noreferrer" className="ep-ext" aria-label={'Abrir afuera: ' + e.title} title="Abrir en la plataforma">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </li>
  );
}

function ShowPanel({show, image, onClose}: {show: PodcastShow; image?: string; onClose: () => void}) {
  const [eps, setEps] = useState<Episode[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }, []);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/podcasts?show=${show.id}&page=${page}`)
      .then(r => r.json())
      .then(d => {
        setEps(x => (page === 1 ? d.episodes || [] : [...x, ...(d.episodes || [])]));
        setMore(!!d.more);
        setError(d.error || '');
      })
      .catch(() => setError('No pudimos cargar los episodios.'))
      .finally(() => setLoading(false));
  }, [show.id, page]);
  return (
    <div className="panel show-panel" ref={ref}>
      <div className="show-head">
        {image && <img src={image} alt="" />}
        <div>
          <span className="pill">{show.category}</span>
          <h3>{show.title}</h3>
          <p className="muted small">{show.author}</p>
          <a className="link-btn" href={appleUrl(show)} target="_blank" rel="noopener noreferrer">
            Ver en Apple Podcasts <ExternalLink size={13} />
          </a>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar episodios">
          <X size={18} />
        </button>
      </div>
      {error && <p className="muted">{error}</p>}
      <ul className="ep-list">
        {eps.map(e => (
          <EpisodeRow key={e.id} e={e} showName={false} />
        ))}
      </ul>
      {loading ? (
        <p className="muted center">
          <Loader2 className="spin" size={18} /> Cargando episodios…
        </p>
      ) : (
        more && (
          <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)}>
            Ver episodios anteriores <ChevronDown size={15} />
          </button>
        )
      )}
    </div>
  );
}

export default function PodcastsView() {
  const p = usePlayer();
  const [feed, setFeed] = useState<{updatedAt: string; images: Record<string, string>; episodes: Episode[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<(LiveStation & {online?: boolean})[]>(STATIONS);
  const [cat, setCat] = useState<'Todos' | (typeof CATEGORIES)[number]>('Todos');
  const [openShow, setOpenShow] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  async function load(force = false) {
    setLoading(true);
    try {
      const d = await fetch('/api/podcasts' + (force ? '?t=' + Date.now() : ''), {cache: force ? 'reload' : 'default'}).then(r => r.json());
      setFeed(d);
    } catch {
      /* sin conexión: se muestra lo que haya */
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    fetch('/api/live')
      .then(r => r.json())
      .then(d => d.stations?.length && setStations(d.stations))
      .catch(() => {});
    // Si la app queda abierta y cambia el día, el historial de novedades se actualiza solo
    let day = new Date().toDateString();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && new Date().toDateString() !== day) {
        day = new Date().toDateString();
        load(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(onVisible, 30 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  const episodes = useMemo(() => (feed?.episodes || []).filter(e => cat === 'Todos' || showById(e.show)?.category === cat), [feed, cat]);
  const groups = useMemo(() => {
    const out: {label: string; items: Episode[]}[] = [];
    for (const e of showAll ? episodes : episodes.slice(0, 15)) {
      const label = dayLabel(e.date);
      const g = out.find(x => x.label === label);
      g ? g.items.push(e) : out.push({label, items: [e]});
    }
    return out;
  }, [episodes, showAll]);
  const shows = SHOWS.filter(s => cat === 'Todos' || s.category === cat);
  const current = openShow ? showById(openShow) : null;

  return (
    <>
      {/* ---------- En directo ---------- */}
      <div className="section-head">
        <div>
          <div className="eyebrow">
            <Radio size={14} /> Radio en directo · 24 horas
          </div>
          <h2>Escucha en vivo para relajarte o caminar</h2>
        </div>
      </div>
      <div className="live-grid">
        {stations.map(s => {
          const t = liveTrack(s);
          const active = p.track?.id === t.id && p.playing;
          return (
            <article className={'live-card' + (active ? ' on' : '')} key={s.id}>
              <div className="live-top">
                <span className="live-dot">{active ? 'SONANDO' : 'EN VIVO'}</span>
                <span className="pill">{s.mood}</span>
              </div>
              <h3>{s.title}</h3>
              <p className="desc">{s.desc}</p>
              <div className="live-actions">
                <PlayBtn track={t} />
                <a className="fine" href={s.site} target="_blank" rel="noopener noreferrer">
                  Sitio de la radio <ExternalLink size={12} />
                </a>
              </div>
              {active && (
                <span className="eq" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </article>
          );
        })}
      </div>

      {/* ---------- Novedades (historial diario) ---------- */}
      <div className="section-head">
        <div>
          <div className="eyebrow">
            <Clock size={14} /> Se actualiza cada día
          </div>
          <h2>Episodios nuevos</h2>
        </div>
        <div className="chips compact">
          {(['Todos', ...CATEGORIES] as const).map(c => (
            <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="panel feed-panel">
        <div className="feed-status">
          <span className="muted small">
            {feed?.updatedAt ? `Actualizado ${new Date(feed.updatedAt).toLocaleString('es-CL', {weekday: 'long', hour: '2-digit', minute: '2-digit'})} · últimas 2 semanas` : 'Buscando episodios nuevos…'}
          </span>
          <button className="link-btn" onClick={() => load(true)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualizar
          </button>
        </div>
        {loading && !feed ? (
          <p className="muted center">
            <Loader2 className="spin" size={18} /> Cargando los episodios del día…
          </p>
        ) : groups.length ? (
          groups.map(g => (
            <div key={g.label} className="feed-day">
              <h4>{g.label}</h4>
              <ul className="ep-list">
                {g.items.map(e => (
                  <EpisodeRow key={e.id} e={e} />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="muted">No hay episodios nuevos en esta categoría estas dos semanas.</p>
        )}
        {episodes.length > 15 && (
          <button className="btn btn-ghost" onClick={() => setShowAll(x => !x)}>
            {showAll ? 'Ver menos' : `Ver los ${episodes.length} episodios`} <ChevronDown size={15} className={showAll ? 'rot' : ''} />
          </button>
        )}
      </div>

      {/* ---------- Historial personal ---------- */}
      {p.history.length > 0 && (
        <>
          <div className="section-head">
            <div>
              <div className="eyebrow">
                <History size={14} /> En este dispositivo
              </div>
              <h2>Tu historial</h2>
            </div>
            <button className="link-btn" onClick={clearHistory}>
              <Trash2 size={14} /> Borrar historial
            </button>
          </div>
          <ul className="ep-list panel history-list">
            {p.history.slice(0, 12).map(h => {
              const pct = h.duration ? Math.min(100, (h.position / h.duration) * 100) : 0;
              return (
                <li className="ep-row" key={h.id}>
                  {h.image ? <img className="ep-art" src={h.image} alt="" loading="lazy" /> : <div className="ep-art icon-art">{h.kind === 'live' ? <Radio size={20} /> : <Headphones size={20} />}</div>}
                  <div className="ep-info">
                    <span className="ep-show">{h.subtitle}</span>
                    <strong>{h.title}</strong>
                    <span className="muted small">
                      {new Date(h.listenedAt).toLocaleDateString('es-CL', {weekday: 'short', day: 'numeric', month: 'short'})}
                      {h.kind === 'episode' ? (h.finished ? ' · Terminado' : h.position > 5 ? ` · Quedaste en ${formatDuration(h.position)}` : '') : ' · En directo'}
                    </span>
                    {h.kind === 'episode' && !h.finished && pct > 2 && (
                      <span className="ep-progress">
                        <span style={{width: pct + '%'}} />
                      </span>
                    )}
                  </div>
                  <div className="ep-actions">
                    <PlayBtn track={h} />
                    <button className="ep-ext" onClick={() => removeFromHistory(h.id)} aria-label={'Quitar del historial: ' + h.title}>
                      <X size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ---------- Catálogo ---------- */}
      <div className="section-head">
        <div>
          <div className="eyebrow">Podcasts en español</div>
          <h2>Los más escuchados en bienestar</h2>
        </div>
      </div>
      {current && <ShowPanel key={current.id} show={current} image={feed?.images?.[current.id]} onClose={() => setOpenShow(null)} />}
      <div className="grid">
        {shows.map(s => (
          <article className={'card podcast' + (openShow === s.id ? ' selected' : '')} key={s.id}>
            <div className="card-body">
              {feed?.images?.[s.id] ? (
                <img className="pod-art" src={feed.images[s.id]} alt="" loading="lazy" />
              ) : (
                <div className="pod-icon">
                  <Headphones size={22} />
                </div>
              )}
              <span className="pill">{s.category}</span>
              <h3>{s.title}</h3>
              <p className="meta">{s.author}</p>
              <p className="desc">{s.desc}</p>
              <div className="card-actions">
                <button
                  className="btn btn-soft"
                  onClick={() => setOpenShow(s.id)}
                >
                  <Play size={15} /> Episodios
                </button>
                <a href={appleUrl(s)} target="_blank" rel="noopener noreferrer" className="link-btn">
                  Abrir afuera <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="fine">
        Los episodios se reproducen dentro de la app desde el RSS oficial de cada podcast; los derechos pertenecen a sus creadores. Radios en directo vía radio-browser.info. Estos contenidos acompañan hábitos saludables y no reemplazan una atención profesional.
      </p>
    </>
  );
}
