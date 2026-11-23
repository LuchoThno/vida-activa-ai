'use client';
import {useState} from 'react';
import {Check, ChevronDown, Droplets, Flag, Footprints, Info, RefreshCw, Sparkles, Target, Trophy, Flame} from 'lucide-react';
import {ACTIVITY, DAYS, GOALS, buildProgram, guideFor, compliance, healthyRange, todayISO, validate, weekDates, type HabitLog, type Program, type ProgramInput, type SessionLog} from '../lib/program';
import {ListenButton} from './Audio';
import {VideoButton, VideoCard} from './Video';
import {videoById, videoFor, youtubeWatchUrl} from '../lib/videos';
import {ExternalLink} from 'lucide-react';

const fmt = (n: number, d = 0) => n.toLocaleString('es-CL', {maximumFractionDigits: d});
const fmtDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-CL', {day: 'numeric', month: 'long', year: 'numeric'});
const LIMITS = [
  {id: 'rodillas', label: 'Rodillas'},
  {id: 'espalda', label: 'Espalda'},
  {id: 'hombros', label: 'Hombros'},
  {id: 'corazon', label: 'Corazón o respiración'},
];

export function Ring({value, size = 120, stroke = 11, label, sub, color = 'var(--brand)'}: {value: number; size?: number; stroke?: number; label: string; sub?: string; color?: string}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{width: size, height: size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--mint)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{transition: 'stroke-dashoffset .5s'}} />
      </svg>
      <div className="ring-label">
        <strong>{label}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function Wizard({initial, currentWeight, onCreate, onCancel}: {initial?: ProgramInput; currentWeight?: number; onCreate: (p: Program) => void; onCancel?: () => void}) {
  const [f, setF] = useState<ProgramInput>(
    initial || {sex: 'F', age: 40, height: 165, weight: currentWeight || 75, target: currentWeight ? Math.round(currentWeight * 0.93) : 70, goal: 'bajar', activity: 1, days: 3, minutes: 30, level: 'inicial', place: 'casa', limits: []},
  );
  const [error, setError] = useState('');
  const set = <K extends keyof ProgramInput>(k: K, v: ProgramInput[K]) => setF(x => ({...x, [k]: v}));
  const num = (k: 'age' | 'height' | 'weight' | 'target') => ({
    value: Number.isFinite(f[k]) ? String(f[k]) : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value.replace(',', '.'))),
    inputMode: 'decimal' as const,
  });
  const range = healthyRange(f.height || 165);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {...f, target: f.goal === 'bajar' || f.goal === 'fuerza' ? f.target : f.weight};
    const err = validate(input);
    if (err) {
      setError(err);
      return;
    }
    onCreate(buildProgram(input));
  }

  return (
    <form className="wizard" onSubmit={submit}>
      <section className="panel">
        <h2>1. ¿Cuál es tu meta?</h2>
        <div className="choice-grid">
          {GOALS.map(g => (
            <button type="button" key={g.id} className={'choice' + (f.goal === g.id ? ' on' : '')} onClick={() => set('goal', g.id)}>
              <strong>{g.label}</strong>
              <span>{g.desc}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>2. Tus datos</h2>
        <div className="form-grid">
          <label className="field">
            <span>Sexo biológico (para el cálculo)</span>
            <div className="seg">
              <button type="button" className={f.sex === 'F' ? 'on' : ''} onClick={() => set('sex', 'F')}>
                Mujer
              </button>
              <button type="button" className={f.sex === 'M' ? 'on' : ''} onClick={() => set('sex', 'M')}>
                Hombre
              </button>
            </div>
          </label>
          <label className="field">
            <span>Edad</span>
            <input {...num('age')} />
          </label>
          <label className="field">
            <span>Estatura (cm)</span>
            <input {...num('height')} />
          </label>
          <label className="field">
            <span>Peso actual (kg)</span>
            <input {...num('weight')} />
          </label>
          {(f.goal === 'bajar' || f.goal === 'fuerza') && (
            <label className="field">
              <span>Peso meta (kg)</span>
              <input {...num('target')} />
              <small className="muted">Rango saludable para tu estatura: {range.min}–{range.max} kg</small>
            </label>
          )}
        </div>
      </section>
      <section className="panel">
        <h2>3. Tu actividad y tiempo</h2>
        <div className="choice-grid four">
          {ACTIVITY.map(a => (
            <button type="button" key={a.id} className={'choice' + (f.activity === a.id ? ' on' : '')} onClick={() => set('activity', a.id)}>
              <strong>{a.label}</strong>
              <span>{a.desc}</span>
            </button>
          ))}
        </div>
        <div className="form-grid">
          <div className="field">
            <span>Días de ejercicio por semana</span>
            <div className="seg">
              {[2, 3, 4, 5, 6].map(d => (
                <button type="button" key={d} className={f.days === d ? 'on' : ''} onClick={() => set('days', d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Minutos por sesión</span>
            <div className="seg">
              {[15, 20, 30, 45, 60].map(m => (
                <button type="button" key={m} className={f.minutes === m ? 'on' : ''} onClick={() => set('minutes', m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Nivel</span>
            <div className="seg">
              <button type="button" className={f.level === 'inicial' ? 'on' : ''} onClick={() => set('level', 'inicial')}>
                Estoy empezando
              </button>
              <button type="button" className={f.level === 'intermedio' ? 'on' : ''} onClick={() => set('level', 'intermedio')}>
                Ya entreno
              </button>
            </div>
          </div>
          <div className="field">
            <span>¿Dónde entrenarás?</span>
            <div className="seg">
              <button type="button" className={f.place === 'casa' ? 'on' : ''} onClick={() => set('place', 'casa')}>
                En casa
              </button>
              <button type="button" className={f.place === 'gimnasio' ? 'on' : ''} onClick={() => set('place', 'gimnasio')}>
                Gimnasio
              </button>
            </div>
          </div>
        </div>
        <div className="field">
          <span>¿Algo que debamos cuidar?</span>
          <div className="seg">
            {LIMITS.map(l => (
              <button type="button" key={l.id} className={f.limits.includes(l.id) ? 'on' : ''} onClick={() => set('limits', f.limits.includes(l.id) ? f.limits.filter(x => x !== l.id) : [...f.limits, l.id])}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      {error && <div className="alert alert-warn">{error}</div>}
      <div className="wizard-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="btn btn-primary" type="submit">
          <Sparkles size={17} /> Crear mi programa
        </button>
      </div>
      <p className="fine">El cálculo usa la fórmula Mifflin-St Jeor y recomendaciones generales de actividad física. Es orientativo y no reemplaza la evaluación de un profesional de salud.</p>
    </form>
  );
}

export default function ProgramView({
  program,
  onSave,
  habits,
  setHabits,
  sessions,
  setSessions,
  currentWeight,
  todayKcal,
}: {
  program: Program | null;
  onSave: (p: Program | null) => void;
  habits: HabitLog;
  setHabits: (fn: (h: HabitLog) => HabitLog) => void;
  sessions: SessionLog;
  setSessions: (fn: (s: SessionLog) => SessionLog) => void;
  currentWeight?: number;
  todayKcal: number;
}) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<number | null>((new Date().getDay() + 6) % 7);

  if (!program || editing)
    return (
      <>
        <header className="page-head">
          <div className="eyebrow">Creador de programa</div>
          <h1>
            Tu meta, con un <em>plan completo.</em>
          </h1>
          <p className="lead">Responde unas preguntas y armamos tu programa: calorías y proteínas diarias, entrenamiento semanal con videos, hábitos y fechas de control.</p>
        </header>
        <Wizard initial={program?.input} currentWeight={currentWeight} onCancel={program ? () => setEditing(false) : undefined} onCreate={p => (onSave(p), setEditing(false))} />
      </>
    );

  const p = program;
  const today = todayISO();
  const dates = weekDates();
  const todayIdx = (new Date().getDay() + 6) % 7;
  const c = compliance(p, habits, sessions);
  const doneToday = habits[today] || [];
  const toggleHabit = (id: string) => setHabits(h => ({...h, [today]: doneToday.includes(id) ? doneToday.filter(x => x !== id) : [...doneToday, id]}));
  const goalLabel = GOALS.find(g => g.id === p.input.goal)?.label;
  const progressKg = currentWeight !== undefined && p.weeklyChange ? Math.max(0, Math.min(1, (p.input.weight - currentWeight) / (p.input.weight - p.input.target))) : 0;

  const speech = `Tu programa: ${goalLabel}. Tu meta diaria es de ${p.kcal} calorías, con ${p.protein} gramos de proteína. Toma ${fmt(p.waterL, 1)} litros de agua y camina al menos ${p.stepsStart} pasos. Esta semana tienes ${c.sessionsPlanned} sesiones de ejercicio. Hoy, ${DAYS[todayIdx]}, te toca: ${p.week[todayIdx].title}. ${p.week[todayIdx].items.map(i => i.name + ', ' + i.detail).join('. ')}.`;

  return (
    <>
      <header className="page-head row">
        <div>
          <div className="eyebrow">Mi programa · {goalLabel}</div>
          <h1>
            Paso a paso, <em>hacia tu meta.</em>
          </h1>
          <p className="lead">
            Creado el {fmtDate(p.createdAt.slice(0, 10))}.{' '}
            {p.weeklyChange ? `Meta estimada: ${fmt(p.input.target, 1)} kg el ${fmtDate(p.targetDate)} (≈ ${fmt(Math.abs(p.weeklyChange), 2)} kg por semana).` : `Revisión sugerida el ${fmtDate(p.targetDate)}.`}
          </p>
        </div>
        <div className="actions">
          <ListenButton text={speech} label="Mi programa">
            Escuchar mi programa
          </ListenButton>
          <button className="btn btn-ghost" onClick={() => setEditing(true)}>
            <RefreshCw size={16} /> Ajustar programa
          </button>
        </div>
      </header>

      <section className="program-top">
        <div className="panel score">
          <Ring value={c.score / 100} label={c.score + '%'} sub="cumplimiento" size={132} />
          <div>
            <div className="eyebrow">Esta semana</div>
            <p>
              <b>
                {c.sessionsDone}/{c.sessionsPlanned}
              </b>{' '}
              sesiones · <b>{c.habitPct}%</b> de hábitos
            </p>
            <p className="streak">
              <Flame size={17} /> Racha: <b>{c.streak}</b> {c.streak === 1 ? 'día' : 'días'}
            </p>
            {c.score >= 80 ? <p className="ok">¡Excelente semana! 🎉</p> : <p className="muted small">Cada hábito cuenta. Hoy es un buen día para sumar uno más.</p>}
          </div>
        </div>
        <div className="kpis">
          <div className="kpi">
            <Target size={18} />
            <span>Calorías diarias</span>
            <strong>{fmt(p.kcal)}</strong>
            <small>
              Hoy: {fmt(todayKcal)} · mínimo {fmt(p.kcalFloor)}
            </small>
          </div>
          <div className="kpi">
            <Sparkles size={18} />
            <span>Proteína · Carb. · Grasa</span>
            <strong>
              {p.protein}g · {p.carbs}g · {p.fat}g
            </strong>
            <small>Distribuidas en el día</small>
          </div>
          <div className="kpi">
            <Droplets size={18} />
            <span>Agua</span>
            <strong>{fmt(p.waterL, 1)} L</strong>
            <small>Más si hace calor o entrenas</small>
          </div>
          <div className="kpi">
            <Footprints size={18} />
            <span>Pasos</span>
            <strong>{fmt(p.stepsStart)}</strong>
            <small>Subir hasta {fmt(p.stepsGoal)}</small>
          </div>
        </div>
      </section>

      <div className="two">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Hoy</div>
              <h2>Hábitos del día</h2>
            </div>
            <span className="pill">
              {doneToday.length}/{p.habits.length}
            </span>
          </div>
          <ul className="habits">
            {p.habits.map(h => (
              <li key={h.id}>
                <button className={doneToday.includes(h.id) ? 'on' : ''} onClick={() => toggleHabit(h.id)} aria-pressed={doneToday.includes(h.id)}>
                  <span className="hcheck">{doneToday.includes(h.id) && <Check size={15} />}</span>
                  <span>
                    <b>{h.label}</b>
                    <small>{h.detail}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Hitos</div>
              <h2>Camino a tu meta</h2>
            </div>
            <Trophy size={20} className="muted" />
          </div>
          {p.weeklyChange !== 0 && (
            <div className="goal-bar">
              <div className="bar big">
                <b style={{width: `${progressKg * 100}%`}} />
              </div>
              <span>
                {fmt(p.input.weight, 1)} kg → <b>{currentWeight !== undefined ? fmt(currentWeight, 1) : '—'} kg</b> → {fmt(p.input.target, 1)} kg
              </span>
            </div>
          )}
          <ol className="milestones">
            {p.milestones.map(m => (
              <li key={m.date} className={m.date <= today ? 'past' : ''}>
                <Flag size={15} />
                <span>
                  <b>{m.label}</b> · {fmtDate(m.date)}
                </span>
                {p.weeklyChange !== 0 && <em>{fmt(m.weight, 1)} kg</em>}
              </li>
            ))}
          </ol>
          <p className="fine">Registra tu peso cada semana en “Inicio” para comparar con estos hitos. Es normal que el avance no sea lineal.</p>
        </section>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Entrenamiento</div>
            <h2>Tu semana</h2>
          </div>
        </div>
        <div className="schedule">
          {p.week.map((s, k) => {
            const date = dates[k];
            const done = !!sessions[date];
            const isOpen = open === k;
            return (
              <div className={'day prog' + (done ? ' done' : '') + (k === todayIdx ? ' today' : '') + (s.type === 'Descanso' ? ' rest' : '')} key={s.day}>
                <div className="day-row">
                  <div className="day-n">{s.day.slice(0, 3)}</div>
                  <button className="day-info as-btn" onClick={() => setOpen(isOpen ? null : k)} aria-expanded={isOpen}>
                    <span>
                      {k === todayIdx ? 'Hoy · ' : ''}
                      {s.type} · {s.minutes} min
                    </span>
                    <h3>{s.title}</h3>
                    <p>{s.items.length} actividades</p>
                  </button>
                  <ChevronDown size={18} className={'muted' + (isOpen ? ' rot' : '')} />
                  {s.type !== 'Descanso' && (
                    <button onClick={() => setSessions(x => ({...x, [date]: !done}))} aria-label={(done ? 'Desmarcar ' : 'Marcar ') + s.day} className="check">
                      {done && <Check size={18} />}
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="day-detail">
                    {(() => {
                      const g = videoById(s.guide || guideFor(s.type, p.input));
                      return g ? <VideoCard video={g} label={s.type === 'Descanso' ? 'Opcional · estiramiento guiado' : 'Sesión guiada · síguela en video'} /> : null;
                    })()}
                    <ul>
                      {s.items.map((it, j) => {
                        const vid = it.video || videoFor(it.name)?.id;
                        return (
                          <li key={j}>
                            <span>
                              <b>{it.name}</b> · {it.detail}
                            </span>
                            {vid ? (
                              <span className="item-actions">
                                <VideoButton req={{title: it.name, youtube: vid}}>Técnica</VideoButton>
                                <a href={youtubeWatchUrl(vid)} target="_blank" rel="noopener noreferrer" aria-label={'Abrir en YouTube: ' + it.name} title="Abrir en YouTube">
                                  <ExternalLink size={14} />
                                </a>
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                    <ListenButton text={`${s.day}. ${s.title}. ${s.items.map(i => i.name + ', ' + i.detail).join('. ')}`} label={'Sesión: ' + s.day}>
                      Escuchar sesión
                    </ListenButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="phases">
          {p.phases.map(ph => (
            <div className="panel phase" key={ph.title}>
              <span className="pill">{ph.weeks}</span>
              <h3>{ph.title}</h3>
              <p className="desc">{ph.detail}</p>
            </div>
          ))}
        </div>
      </section>
      {p.notes.map(n => (
        <div className="alert" key={n}>
          <Info size={16} /> {n}
        </div>
      ))}
    </>
  );
}
