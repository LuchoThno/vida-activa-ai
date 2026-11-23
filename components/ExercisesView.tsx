'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Check, ChevronDown, Dumbbell, Info, Search, Timer} from 'lucide-react';
import {guidedExercises, guidedRoutines} from '../lib/exercises';
import {videoFor} from '../lib/videos';
import {ListenButton} from './Audio';
import {VideoButton, VideoCard} from './Video';

type WebExercise = {id: string; title: string; description: string; steps: string[]; image: string; video: string; category: string; equipment: string; source: string};
const safeLink = (url: string) => (/^https:\/\//i.test(url) ? url : '#');

export default function ExercisesView({done, onToggleDone}: {done: string[]; onToggleDone: (id: string) => void}) {
  const [filter, setFilter] = useState('Todos');
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [rFilter, setRFilter] = useState('Todas');

  const [items, setItems] = useState<WebExercise[]>([]);
  const [cats, setCats] = useState<string[]>(['Todos']);
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [bodyweight, setBodyweight] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const req = useRef(0);

  async function load(p = 1) {
    const id = ++req.current;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({category: cat, q: applied, page: String(p), bodyweight: bodyweight ? '1' : '0'});
    try {
      const r = await fetch('/api/exercises?' + params);
      const d = await r.json();
      if (id !== req.current) return;
      setItems(prev => (p === 1 ? d.items || [] : [...prev, ...(d.items || [])]));
      setCats(d.categories || ['Todos']);
      setPage(d.page || 1);
      setPages(d.pages || 1);
      setTotal(d.total || 0);
      if (d.error) setError(d.error);
    } catch {
      if (id === req.current) setError('No fue posible conectar con la biblioteca de ejercicios.');
    } finally {
      if (id === req.current) setLoading(false);
    }
  }
  useEffect(() => {
    load(1);
  }, [cat, applied, bodyweight]);

  const guides = guidedExercises.filter(e => filter === 'Todos' || e.category === filter);

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Entrenamiento guiado en español</div>
        <h1>
          Muévete a <em>tu ritmo.</em>
        </h1>
        <p className="lead">Rutinas suaves con instrucciones por voz y una biblioteca de cientos de ejercicios explicados en español.</p>
      </header>

      <div className="alert alert-info">
        <Info size={18} />
        <span>Empieza con sesiones cortas y cómodas. Si tienes problemas cardíacos o respiratorios, consulta antes de aumentar la intensidad. Detente ante dolor en el pecho, mareos o falta de aire inusual.</span>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Completados</span>
          <strong>{done.length}</strong>
          <p>Ejercicios marcados</p>
        </div>
        <div className="stat">
          <span>Biblioteca en español</span>
          <strong>{total || '—'}</strong>
          <p>Ejercicios disponibles</p>
        </div>
        <div className="stat">
          <span>Intensidad sugerida</span>
          <strong className="sm">Suave</strong>
          <p>Debes poder conversar mientras lo haces</p>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Sigue el video en tiempo real</div>
            <h2>Rutinas guiadas</h2>
          </div>
          <div className="chips compact">
            {['Todas', ...guidedRoutines.map(r => r.group)].map(c => (
              <button key={c} className={'chip' + (rFilter === c ? ' on' : '')} onClick={() => setRFilter(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small">Videos en español seleccionados de fisioterapeutas y entrenadores. Se reproducen aquí mismo; usa “Ver en YouTube” si prefieres abrirlos afuera.</p>
        <div className="vgrid">
          {guidedRoutines
            .filter(r => rFilter === 'Todas' || r.group === rFilter)
            .flatMap(r => r.items.map(v => <VideoCard key={r.group + v.id} video={v} label={r.group} />))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Para empezar</div>
            <h2>Guías paso a paso</h2>
          </div>
          <div className="chips compact">
            {['Todos', 'Cardio', 'Fuerza', 'Movilidad'].map(c => (
              <button key={c} className={'chip' + (filter === c ? ' on' : '')} onClick={() => setFilter(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid">
          {guides.map(e => {
            const isDone = done.includes(e.id);
            const isOpen = openGuide === e.id;
            return (
              <article className={'card guide' + (isDone ? ' done' : '')} key={e.id}>
                <div className="card-body">
                  <div className="guide-top">
                    <span className="pill">{e.category}</span>
                    <span className="muted">
                      <Timer size={14} /> {e.minutes} min
                    </span>
                  </div>
                  <h3>{e.title}</h3>
                  <p className="desc">{e.description}</p>
                  <p className="muted small">Material: {e.equipment}</p>
                  {isOpen && (
                    <ol className="steps compact">
                      {e.steps.map((s, i) => (
                        <li key={i}>
                          <span className="step-n">{i + 1}</span>
                          <p>{s}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="card-actions">
                    <button className="btn btn-ghost" onClick={() => setOpenGuide(isOpen ? null : e.id)}>
                      {isOpen ? 'Ocultar pasos' : 'Ver pasos'} <ChevronDown size={15} className={isOpen ? 'rot' : ''} />
                    </button>
                    <ListenButton text={`${e.title}. ${e.description} ${e.steps.map((s, i) => `Paso ${i + 1}. ${s}`).join(' ')}`} label={'Guía: ' + e.title}>
                      Escuchar
                    </ListenButton>
                  </div>
                  <div className="card-actions">
                    <VideoButton req={{title: e.title, youtube: e.youtube, query: e.videoSearch}}>Ver video</VideoButton>
                    <button className={'done-btn' + (isDone ? ' on' : '')} onClick={() => onToggleDone(e.id)}>
                      <Check size={15} /> {isDone ? 'Completado' : 'Marcar hecho'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Biblioteca web · wger</div>
            <h2>Explora más ejercicios</h2>
          </div>
        </div>
        <form
          className="search"
          onSubmit={e => {
            e.preventDefault();
            setApplied(q.trim());
          }}
        >
          <Search size={20} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Busca: sentadilla, plancha, estiramiento…" aria-label="Buscar ejercicios" />
          <button className="btn btn-primary" type="submit">
            Buscar
          </button>
        </form>
        <div className="chips">
          {cats.map(c => (
            <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
          <label className={'chip toggle' + (bodyweight ? ' on' : '')}>
            <input type="checkbox" checked={bodyweight} onChange={e => setBodyweight(e.target.checked)} /> Sin máquinas (en casa)
          </label>
        </div>
        {error && <div className="alert alert-warn">{error} Las guías de arriba siguen disponibles.</div>}
        {!loading && !error && <p className="muted small">{total} ejercicios encontrados</p>}
        <div className="grid">
          {items.map(m => {
            const isOpen = expanded === m.id;
            const isDone = done.includes('wger-' + m.id);
            return (
              <article className={'card' + (isDone ? ' done' : '')} key={m.id}>
                <div className="card-img contain">
                  {m.image ? (
                    <img src={m.image} alt={m.title} loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="img-fallback">
                      <Dumbbell size={34} />
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <div className="meta">
                    {m.category} · {m.equipment}
                  </div>
                  <h3>{m.title}</h3>
                  {m.description ? (
                    isOpen ? (
                      m.steps.length > 1 ? (
                        <ol className="steps compact">
                          {m.steps.map((s, i) => (
                            <li key={i}>
                              <span className="step-n">{i + 1}</span>
                              <p>{s}</p>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="desc">{m.description}</p>
                      )
                    ) : (
                      <p className="desc clamp">{m.description}</p>
                    )
                  ) : (
                    <p className="desc muted">Revisa la ficha original o un video para ver la técnica.</p>
                  )}
                  <div className="card-actions">
                    {m.description && (
                      <button className="btn btn-ghost" onClick={() => setExpanded(isOpen ? null : m.id)}>
                        {isOpen ? 'Menos' : 'Ver pasos'} <ChevronDown size={15} className={isOpen ? 'rot' : ''} />
                      </button>
                    )}
                    {m.description && (
                      <ListenButton text={`${m.title}. ${m.steps.length > 1 ? m.steps.map((s, i) => `Paso ${i + 1}. ${s}`).join(' ') : m.description}`} label={'Ejercicio: ' + m.title}>
                        Escuchar
                      </ListenButton>
                    )}
                  </div>
                  <div className="card-actions">
                    <VideoButton
                      req={
                        m.video
                          ? {title: m.title, mp4: m.video, source: m.source}
                          : videoFor(m.title, true)
                            ? {title: m.title, youtube: videoFor(m.title, true)!.id}
                            : {title: m.title, query: m.title + ' ejercicio técnica correcta'}
                      }
                    >
                      Ver video
                    </VideoButton>
                    <button className={'done-btn' + (isDone ? ' on' : '')} onClick={() => onToggleDone('wger-' + m.id)}>
                      <Check size={15} /> {isDone ? 'Hecho' : 'Marcar'}
                    </button>
                  </div>
                  <a className="fine src" href={safeLink(m.source)} target="_blank" rel="noopener noreferrer">
                    Ficha en wger <ArrowUpRight size={12} />
                  </a>
                </div>
              </article>
            );
          })}
          {loading &&
            Array.from({length: 3}).map((_, i) => (
              <div className="card skeleton" key={'s' + i}>
                <div className="card-img" />
                <div className="card-body">
                  <i />
                  <i />
                </div>
              </div>
            ))}
        </div>
        {!loading && page < pages && (
          <div className="center">
            <button className="btn btn-soft" onClick={() => load(page + 1)}>
              Cargar más ejercicios
            </button>
          </div>
        )}
        <p className="fine">Biblioteca de ejercicios: wger.de, textos en español aportados por su comunidad (licencia CC-BY-SA). Las guías iniciales son contenido propio de Vida Activa AI.</p>
      </section>
    </>
  );
}
