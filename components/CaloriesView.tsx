'use client';
import {useEffect, useRef, useState} from 'react';
import {Barcode, ChevronLeft, ChevronRight, Info, Loader2, Plus, Search, Trash2, X} from 'lucide-react';
import type {Food} from '../lib/foods';
import type {Program} from '../lib/program';
import {Ring} from './ProgramView';

export type FoodEntry = {id: string; meal: string; name: string; portion: string; qty: number; kcal: number; p: number; c: number; f: number};
export type FoodLog = Record<string, FoodEntry[]>;

const MEALS = ['Desayuno', 'Almuerzo', 'Once', 'Cena', 'Colaciones'];
const QTY = [0.5, 1, 1.5, 2, 3];
const fmt = (n: number) => Math.round(n).toLocaleString('es-CL');
const iso = (d: Date) => d.toLocaleDateString('en-CA');
const shift = (date: string, n: number) => iso(new Date(new Date(date + 'T12:00:00').getTime() + n * 86400000));
const label = (date: string) => {
  const t = iso(new Date());
  if (date === t) return 'Hoy';
  if (date === shift(t, -1)) return 'Ayer';
  return new Date(date + 'T12:00:00').toLocaleDateString('es-CL', {weekday: 'long', day: 'numeric', month: 'short'});
};
export const totals = (list: FoodEntry[] = []) => list.reduce((a, e) => ({kcal: a.kcal + e.kcal, p: a.p + e.p, c: a.c + e.c, f: a.f + e.f}), {kcal: 0, p: 0, c: 0, f: 0});

function defaultMeal() {
  const h = new Date().getHours();
  return h < 11 ? 'Desayuno' : h < 16 ? 'Almuerzo' : h < 19 ? 'Once' : 'Cena';
}

function AddFood({meal, onAdd, onClose}: {meal: string; onAdd: (e: FoodEntry) => void; onClose: () => void}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [pick, setPick] = useState<Food | null>(null);
  const [qty, setQty] = useState(1);
  const [m, setM] = useState(meal);
  const [custom, setCustom] = useState({name: '', kcal: ''});
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reqId = useRef(0);

  async function load(url: string) {
    const id = ++reqId.current;
    setLoading(true);
    setMsg('');
    try {
      const d = await fetch(url).then(r => r.json());
      if (id !== reqId.current) return;
      setItems(d.items || []);
      if (d.error) setMsg(d.error);
    } catch {
      if (id === reqId.current) setMsg('No se pudo buscar. Revisa tu conexión.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(() => load('/api/foods?q=' + encodeURIComponent(q)), q ? 350 : 0);
    return () => clearTimeout(t);
  }, [q]);

  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window;
  async function scan() {
    if (!canScan) return;
    setScanning(true);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // @ts-expect-error BarcodeDetector aún no está en los tipos de TS
      const det = new window.BarcodeDetector({formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']});
      for (let i = 0; i < 200 && videoRef.current; i++) {
        const codes = await det.detect(videoRef.current).catch(() => []);
        if (codes[0]?.rawValue) {
          setQ('');
          await load('/api/foods?code=' + codes[0].rawValue);
          break;
        }
        await new Promise(r => setTimeout(r, 150));
      }
    } catch {
      setMsg('No se pudo usar la cámara.');
    } finally {
      stream?.getTracks().forEach(t => t.stop());
      setScanning(false);
    }
  }

  function add(food: Food, n: number) {
    onAdd({id: crypto.randomUUID(), meal: m, name: food.brand ? `${food.name} (${food.brand})` : food.name, portion: food.portion, qty: n, kcal: food.kcal * n, p: food.p * n, c: food.c * n, f: food.f * n});
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet food-sheet" role="dialog" aria-modal="true" aria-label="Agregar alimento" onClick={e => e.stopPropagation()}>
        <div className="sheet-body">
          <div className="vs-head">
            <h2>Agregar a {m}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
          <div className="seg">
            {MEALS.map(x => (
              <button key={x} className={m === x ? 'on' : ''} onClick={() => setM(x)}>
                {x}
              </button>
            ))}
          </div>
          {pick ? (
            <div className="pick">
              <h3>{pick.brand ? `${pick.name} · ${pick.brand}` : pick.name}</h3>
              <p className="muted small">
                {pick.portion} = {fmt(pick.kcal)} kcal · P {pick.p} g · C {pick.c} g · G {pick.f} g
              </p>
              <div className="field">
                <span>¿Cuántas porciones?</span>
                <div className="seg">
                  {QTY.map(n => (
                    <button key={n} className={qty === n ? 'on' : ''} onClick={() => setQty(n)}>
                      {n.toLocaleString('es-CL')}
                    </button>
                  ))}
                </div>
              </div>
              <p className="big-kcal">{fmt(pick.kcal * qty)} kcal</p>
              <div className="actions">
                <button className="btn btn-ghost" onClick={() => setPick(null)}>
                  Volver
                </button>
                <button className="btn btn-primary" onClick={() => add(pick, qty)}>
                  <Plus size={16} /> Agregar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="search">
                <Search size={19} />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Busca: marraqueta, palta, yogur Soprole…" aria-label="Buscar alimento" />
                {canScan && (
                  <button className="icon-btn" onClick={scan} aria-label="Escanear código de barras" title="Escanear código de barras">
                    <Barcode size={18} />
                  </button>
                )}
              </div>
              {scanning && (
                <div className="scanner">
                  <video ref={videoRef} playsInline muted />
                  <span>Apunta al código de barras…</span>
                </div>
              )}
              {msg && <div className="alert alert-warn">{msg}</div>}
              {loading && (
                <p className="muted small">
                  <Loader2 className="spin" size={14} /> Buscando…
                </p>
              )}
              <ul className="food-list">
                {items.map(f => (
                  <li key={f.id}>
                    <button onClick={() => (setPick(f), setQty(1))}>
                      <span>
                        <b>{f.name}</b>
                        <small>
                          {f.brand ? f.brand + ' · ' : ''}
                          {f.portion}
                          {f.source === 'off' ? ' · Open Food Facts' : ''}
                        </small>
                      </span>
                      <em>{fmt(f.kcal)} kcal</em>
                    </button>
                    <button className="icon-btn" onClick={() => add(f, 1)} aria-label={'Agregar ' + f.name}>
                      <Plus size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <details className="custom">
                <summary>¿No lo encuentras? Agrégalo manualmente</summary>
                <div className="form-grid">
                  <label className="field">
                    <span>Nombre</span>
                    <input value={custom.name} onChange={e => setCustom(c => ({...c, name: e.target.value}))} />
                  </label>
                  <label className="field">
                    <span>Calorías (kcal)</span>
                    <input inputMode="numeric" value={custom.kcal} onChange={e => setCustom(c => ({...c, kcal: e.target.value}))} />
                  </label>
                </div>
                <button
                  className="btn btn-soft"
                  disabled={!custom.name.trim() || !(Number(custom.kcal) >= 0)}
                  onClick={() => add({id: 'c', name: custom.name.trim().slice(0, 60), portion: '1 porción', kcal: Math.min(3000, Number(custom.kcal) || 0), p: 0, c: 0, f: 0, cat: '', source: 'local'}, 1)}
                >
                  <Plus size={16} /> Agregar
                </button>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CaloriesView({log, setLog, program, onCreateProgram}: {log: FoodLog; setLog: (fn: (l: FoodLog) => FoodLog) => void; program: Program | null; onCreateProgram: () => void}) {
  const [date, setDate] = useState(iso(new Date()));
  const [adding, setAdding] = useState<string | null>(null);
  const list = log[date] || [];
  const t = totals(list);
  const goal = program?.kcal || 2000;
  const left = goal - t.kcal;
  const last7 = Array.from({length: 7}, (_, k) => shift(iso(new Date()), k - 6));
  const maxBar = Math.max(goal, ...last7.map(d => totals(log[d]).kcal)) * 1.1;

  function addEntry(e: FoodEntry) {
    setLog(l => {
      const next = {...l, [date]: [...(l[date] || []), e]};
      // conserva solo los últimos 90 días
      const keys = Object.keys(next).sort();
      while (keys.length > 90) delete next[keys.shift()!];
      return next;
    });
    setAdding(null);
  }
  const remove = (id: string) => setLog(l => ({...l, [date]: (l[date] || []).filter(x => x.id !== id)}));

  const macro = (name: string, val: number, target: number | undefined, color: string) => (
    <div className="macro">
      <div>
        <span>{name}</span>
        <b>
          {fmt(val)}
          {target ? ` / ${target}` : ''} g
        </b>
      </div>
      <div className="bar">
        <b style={{width: `${target ? Math.min(100, (val / target) * 100) : 0}%`, background: color}} />
      </div>
    </div>
  );

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">Contador de calorías</div>
        <h1>
          Lo que comes, <em>con calma.</em>
        </h1>
        <p className="lead">Registra tus comidas con alimentos chilenos comunes o productos envasados (también por código de barras). Es una guía, no una obsesión: lo importante es la tendencia.</p>
      </header>

      <div className="date-nav">
        <button className="icon-btn" onClick={() => setDate(shift(date, -1))} aria-label="Día anterior">
          <ChevronLeft size={18} />
        </button>
        <strong>{label(date)}</strong>
        <button className="icon-btn" onClick={() => setDate(shift(date, 1))} disabled={date >= iso(new Date())} aria-label="Día siguiente">
          <ChevronRight size={18} />
        </button>
      </div>

      <section className="panel cal-summary">
        <Ring value={t.kcal / goal} size={150} stroke={13} label={fmt(t.kcal)} sub={`de ${fmt(goal)} kcal`} color={t.kcal > goal * 1.1 ? 'var(--peach)' : 'var(--brand)'} />
        <div className="cal-side">
          <p className="cal-left">{left >= 0 ? <>Te quedan <b>{fmt(left)} kcal</b></> : <>Superaste tu meta por <b>{fmt(-left)} kcal</b>. No pasa nada: mañana es otro día.</>}</p>
          {macro('Proteína', t.p, program?.protein, '#2f8a67')}
          {macro('Carbohidratos', t.c, program?.carbs, '#f4a26b')}
          {macro('Grasas', t.f, program?.fat, '#7a9bd1')}
          {!program && (
            <div className="alert">
              <Info size={16} />
              <span>
                Usamos 2.000 kcal de referencia.{' '}
                <button className="link-btn" onClick={onCreateProgram}>
                  Crea tu programa
                </button>{' '}
                para calcular tu meta personal.
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="meals">
        {MEALS.map(meal => {
          const items = list.filter(e => e.meal === meal);
          const mt = totals(items);
          return (
            <section className="panel meal" key={meal}>
              <div className="panel-head">
                <h3>{meal}</h3>
                <span className="muted small">{fmt(mt.kcal)} kcal</span>
              </div>
              {items.length > 0 && (
                <ul className="entries">
                  {items.map(e => (
                    <li key={e.id}>
                      <span>
                        <b>{e.name}</b>
                        <small>
                          {e.qty !== 1 ? e.qty.toLocaleString('es-CL') + ' × ' : ''}
                          {e.portion}
                        </small>
                      </span>
                      <em>{fmt(e.kcal)}</em>
                      <button className="icon-btn sm" onClick={() => remove(e.id)} aria-label={'Quitar ' + e.name}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button className="link-btn" onClick={() => setAdding(meal)}>
                <Plus size={15} /> Agregar alimento
              </button>
            </section>
          );
        })}
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">Últimos 7 días</div>
            <h2>Tu tendencia</h2>
          </div>
        </div>
        <div className="bars7">
          {last7.map(d => {
            const k = totals(log[d]).kcal;
            return (
              <button key={d} className={'b7' + (d === date ? ' on' : '')} onClick={() => setDate(d)}>
                <div className="b7-track">
                  <i className="b7-goal" style={{bottom: `${(goal / maxBar) * 100}%`}} />
                  <b style={{height: `${(k / maxBar) * 100}%`}} className={k > goal * 1.1 ? 'over' : ''} />
                </div>
                <small>{new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {weekday: 'short'})}</small>
                <span>{k ? fmt(k) : '—'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <button className="fab" onClick={() => setAdding(defaultMeal())} aria-label="Agregar alimento">
        <Plus size={24} />
      </button>
      {adding && <AddFood meal={adding} onAdd={addEntry} onClose={() => setAdding(null)} />}
      <p className="fine">Valores aproximados: alimentos comunes según tablas de referencia (USDA) y productos envasados según Open Food Facts (base colaborativa, revisa la etiqueta). Si sigues un tratamiento o dieta indicada por un profesional, prioriza sus indicaciones.</p>
    </>
  );
}
