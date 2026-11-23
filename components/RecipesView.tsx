'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, ChefHat, Globe2, Heart, Info, Loader2, Search, Shuffle, Utensils, Video, X} from 'lucide-react';
import type {Recipe, RecipeSummary} from '../lib/recipe-types';
import {RECIPE_SHORTCUTS} from '../lib/food-dictionary';
import {ListenButton} from './Audio';
import {stopSpeech} from '../lib/speech';

const safeLink = (url: string) => (/^https:\/\//i.test(url) ? url : '#');

export default function RecipesView({favorites, onToggleFavorite}: {favorites: string[]; onToggleFavorite: (id: string) => void}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('pollo');
  const [items, setItems] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translated, setTranslated] = useState(true);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const req = useRef(0);

  async function search(q: string) {
    const id = ++req.current;
    setActive(q);
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/recipes?q=' + encodeURIComponent(q));
      const d = await r.json();
      if (id !== req.current) return;
      setItems(d.items || []);
      setTranslated(d.translated !== false);
      if (d.error) setError(d.error);
    } catch {
      if (id === req.current) {
        setItems([]);
        setError('No fue posible conectar con el servicio de recetas.');
      }
    } finally {
      if (id === req.current) setLoading(false);
    }
  }

  async function showFavorites() {
    const id = ++req.current;
    setActive('__fav');
    setLoading(true);
    setError('');
    const list = await Promise.all(
      favorites.slice(-18).map(f =>
        fetch('/api/recipes/' + encodeURIComponent(f))
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    );
    if (id !== req.current) return;
    setItems(list.filter(Boolean).map((r: Recipe) => ({id: r.id, title: r.title, image: r.image, category: r.category, origin: r.origin, provider: r.provider})));
    setLoading(false);
  }

  async function open(id: string) {
    setOpening(id);
    try {
      const r = await fetch('/api/recipes/' + encodeURIComponent(id));
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setChecked([]);
      setSelected(d);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'No se pudo abrir la receta.');
    } finally {
      setOpening(null);
    }
  }

  function close() {
    stopSpeech();
    setSelected(null);
  }

  useEffect(() => {
    search('pollo');
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selected]);

  const recipeSpeech = selected
    ? `${selected.title}. Ingredientes: ${selected.ingredients.map(v => `${v.amount} ${v.name}`.trim()).join('. ')}. Preparación. ${selected.steps
        .map((s, i) => `Paso ${i + 1}. ${s}`)
        .join(' ')}`
    : '';

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Recetas de todo el mundo · en español</div>
        <h1>
          Comer rico también es <em>cuidarte.</em>
        </h1>
        <p className="lead">Busca en español entre cientos de recetas publicadas en la web, con fotos, ingredientes, pasos y videos. Las traducimos automáticamente para ti.</p>
      </header>

      <form
        className="search"
        onSubmit={e => {
          e.preventDefault();
          if (query.trim()) search(query.trim());
        }}
      >
        <Search size={20} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="¿Qué quieres cocinar? Ej: salmón, lentejas, pollo al curry…" aria-label="Buscar recetas" />
        <button className="btn btn-primary" type="submit">
          Buscar
        </button>
      </form>

      <div className="chips" role="toolbar" aria-label="Categorías de recetas">
        {RECIPE_SHORTCUTS.map(c => (
          <button key={c.q} className={'chip' + (active === c.q ? ' on' : '')} onClick={() => search(c.q)}>
            <span aria-hidden>{c.emoji}</span> {c.label}
          </button>
        ))}
        <button className="chip" onClick={() => open('random')} disabled={!!opening}>
          <Shuffle size={15} /> Sorpréndeme
        </button>
        {favorites.length > 0 && (
          <button className={'chip' + (active === '__fav' ? ' on' : '')} onClick={showFavorites}>
            <Heart size={15} /> Mis favoritas ({favorites.length})
          </button>
        )}
      </div>

      {error && <div className="alert alert-warn">{error}</div>}
      {!translated && !loading && (
        <div className="alert">
          <Info size={16} /> Algunas recetas se muestran en su idioma original porque el servicio de traducción alcanzó su límite diario.
        </div>
      )}

      {loading ? (
        <div className="grid">
          {Array.from({length: 6}).map((_, i) => (
            <div className="card skeleton" key={i}>
              <div className="card-img" />
              <div className="card-body">
                <i />
                <i />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <ChefHat size={40} strokeWidth={1.4} />
          <p>No encontramos recetas para esa búsqueda. Prueba con un ingrediente: “pollo”, “zapallo”, “garbanzos”.</p>
        </div>
      ) : (
        <div className="grid">
          {items.map(m => (
            <article className="card" key={m.provider + m.id}>
              <button className="card-img" onClick={() => open(m.id)} aria-label={'Abrir ' + m.title}>
                {m.image ? <img src={m.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <div className="img-fallback"><Utensils size={34} /></div>}
                {m.provider === 'local' && <span className="badge">Vida Activa</span>}
                {opening === m.id && (
                  <span className="card-loading">
                    <Loader2 className="spin" size={26} />
                  </span>
                )}
              </button>
              <div className="card-body">
                <div className="meta">
                  {m.category}
                  {m.origin ? ' · ' + m.origin : ''}
                </div>
                <h3>{m.title}</h3>
                <div className="card-foot">
                  <button className="link-btn" onClick={() => open(m.id)}>
                    Ver receta <ArrowUpRight size={15} />
                  </button>
                  <button
                    className={'heart' + (favorites.includes(m.id) ? ' saved' : '')}
                    onClick={() => onToggleFavorite(m.id)}
                    aria-label={favorites.includes(m.id) ? 'Quitar de favoritas' : 'Guardar en favoritas'}
                  >
                    <Heart size={19} fill={favorites.includes(m.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <a className="web-more" href={'https://www.google.com/search?q=' + encodeURIComponent('receta saludable ' + (active === '__fav' ? '' : active))} target="_blank" rel="noopener noreferrer">
        <Globe2 size={17} /> Buscar más recetas de “{active === '__fav' ? 'cocina saludable' : active}” en la web en español <ArrowUpRight size={15} />
      </a>
      <p className="fine">Recetas web: TheMealDB, traducidas automáticamente al español (puede haber pequeñas imprecisiones). No mostramos calorías sin una base nutricional verificada.</p>

      {selected && (
        <div className="overlay" onClick={close}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e => e.stopPropagation()}>
            <button className="icon-btn sheet-close" onClick={close} aria-label="Cerrar">
              <X size={20} />
            </button>
            {selected.image ? (
              <div className="sheet-cover">
                <img src={selected.image} alt={selected.title} referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="sheet-cover sheet-cover-empty">
                <ChefHat size={56} strokeWidth={1.2} />
              </div>
            )}
            <div className="sheet-body">
              <div className="meta">
                {selected.category}
                {selected.origin ? ' · ' + selected.origin : ''}
              </div>
              <h2>{selected.title}</h2>
              <div className="actions">
                <ListenButton text={recipeSpeech} label={'Receta: ' + selected.title} className="btn btn-primary">
                  Escuchar receta
                </ListenButton>
                {selected.video && (
                  <a className="btn btn-soft" href={safeLink(selected.video)} target="_blank" rel="noopener noreferrer">
                    <Video size={17} /> Ver video
                  </a>
                )}
                {selected.source && (
                  <a className="btn btn-ghost" href={safeLink(selected.source)} target="_blank" rel="noopener noreferrer">
                    Fuente original <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
              {!selected.translated && <div className="alert">Parte de esta receta quedó en su idioma original: el traductor alcanzó su límite diario.</div>}
              <div className="recipe-cols">
                <section>
                  <h3>Ingredientes</h3>
                  <ul className="ingredients">
                    {selected.ingredients.map((v, i) => (
                      <li key={i}>
                        <label>
                          <input type="checkbox" checked={checked.includes(i)} onChange={() => setChecked(c => (c.includes(i) ? c.filter(x => x !== i) : [...c, i]))} />
                          <span>
                            {v.amount && <b>{v.amount} </b>}
                            {v.name}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>Preparación</h3>
                  <ol className="steps">
                    {selected.steps.map((s, i) => (
                      <li key={i}>
                        <span className="step-n">{i + 1}</span>
                        <p>{s}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
              <div className="alert">
                <Info size={16} /> Porciones y necesidades varían según cada persona. Si sigues una dieta indicada por un profesional, adapta ingredientes y cantidades.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
