'use client';
import {useEffect, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {getSupabase} from '../lib/supabase';
import {
  Apple, ArrowUpRight, CalendarDays, Check, Home, Target, Dumbbell, ExternalLink, Headphones, Heart, Info, LogOut, Plus, Scale, Settings2, Shuffle, Utensils, Volume2, Square,
} from 'lucide-react';
import {weeklyPlan} from '../lib/exercises';
import {setSpeechTokenProvider, speak, stopSpeech, useSpeech} from '../lib/speech';
import {AudioBar, ListenButton, VoiceSettings} from '../components/Audio';
import RecipesView from '../components/RecipesView';
import ExercisesView from '../components/ExercisesView';
import ProgramView, {Ring} from '../components/ProgramView';
import CaloriesView, {totals, type FoodLog} from '../components/CaloriesView';
import {VideoModal} from '../components/Video';
import {compliance, todayISO, type HabitLog, type Program, type SessionLog} from '../lib/program';

type Weight = {date: string; kg: number};
type Profile = {id: string; name: string; initial: string};

const menu = [
  {id: 'overview', name: 'Inicio', short: 'Inicio', icon: Home},
  {id: 'program', name: 'Mi programa', short: 'Programa', icon: Target},
  {id: 'calories', name: 'Calorías', short: 'Calorías', icon: Apple},
  {id: 'recipes', name: 'Recetas', short: 'Recetas', icon: Utensils},
  {id: 'exercises', name: 'Ejercicios', short: 'Ejercicios', icon: Dumbbell},
  {id: 'motivation', name: 'Motivación y audio', short: 'Audio', icon: Headphones},
] as const;
type Extras = {program: Program | null; habits: HabitLog; sessions: SessionLog; food: FoodLog};
const EMPTY_EXTRAS: Extras = {program: null, habits: {}, sessions: {}, food: {}};
const localExtrasKey = (id: string) => 'va-extras:' + id;
type Tab = (typeof menu)[number]['id'];

const reflections = [
  {author: 'James Clear', theme: 'Hábitos pequeños', message: 'No necesitas transformar toda tu vida hoy. Una acción sencilla, repetida con cariño, puede convertirse en el comienzo de un hábito que dure.'},
  {author: 'Carol Dweck', theme: 'Mentalidad de crecimiento', message: 'Una dificultad no define lo que eres capaz de hacer. Mira qué puedes aprender de ella, y vuelve a intentarlo con un paso que esté a tu alcance.'},
  {author: 'Viktor Frankl', theme: 'Sentido y propósito', message: 'Recuerda qué es lo importante para ti. Cuando tus decisiones tienen sentido, es más fácil seguir adelante, incluso en los días difíciles.'},
  {author: 'Brené Brown', theme: 'Autocompasión', message: 'El progreso no exige perfección. Puedes reconocer tus errores, tratarte con respeto, y seguir avanzando.'},
  {author: 'Stephen Covey', theme: 'Decisiones cotidianas', message: 'Concéntrate en lo que sí puedes hacer hoy: preparar una comida rica, caminar unos minutos, o descansar a tiempo.'},
  {author: 'Angela Duckworth', theme: 'Constancia', message: 'Tu valor no depende de qué tan rápido avances. La constancia también se construye con pausas, ajustes, y nuevos intentos.'},
];
const podcasts = [
  {title: 'Entiende tu mente', topic: 'Psicología cotidiana y hábitos', desc: 'Conversaciones breves para comprender emociones, decisiones y bienestar.', url: 'https://entiendetumente.info/', tag: 'Hábitos'},
  {title: 'Psicología al Desnudo', topic: 'Salud emocional y autoconocimiento', desc: 'Episodios de Marina Mammoliti sobre emociones, vínculos y bienestar.', url: 'https://www.psimammoliti.com/recursos/podcasts', tag: 'Autoconocimiento'},
  {title: 'Se Regalan Dudas', topic: 'Crecimiento personal', desc: 'Diálogos sobre amor propio, bienestar emocional y relaciones.', url: 'https://www.seregalandudas.com/', tag: 'Bienestar'},
];

const formatKg = (n: number) => n.toLocaleString('es-CL', {maximumFractionDigits: 1});
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
};

function WeightChart({data}: {data: Weight[]}) {
  if (!data.length) return <div className="chart-empty">Registra tu primera medición para ver tu evolución aquí.</div>;
  const W = 560, H = 200, P = 18;
  const max = Math.max(...data.map(d => d.kg)) + 1;
  const min = Math.min(...data.map(d => d.kg)) - 1;
  const x = (i: number) => (data.length > 1 ? P + (i * (W - 2 * P)) / (data.length - 1) : W / 2);
  const y = (kg: number) => P + ((max - kg) / (max - min || 1)) * (H - 2 * P);
  const line = data.map((d, i) => `${x(i)},${y(d.kg)}`).join(' ');
  const area = `${x(0)},${H} ${line} ${x(data.length - 1)},${H}`;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Gráfico de evolución de peso">
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--brand)" stopOpacity=".25" />
            <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--line)" />
        ))}
        {data.length > 1 && <polygon points={area} fill="url(#g)" />}
        {data.length > 1 && <polyline points={line} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
        {data.map((d, i) => (
          <circle key={d.date} cx={x(i)} cy={y(d.kg)} r="4.5" fill="#fff" stroke="var(--brand)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="chart-x">
        {data.slice(-6).map(d => (
          <span key={d.date}>
            {d.date.slice(8, 10)}/{d.date.slice(5, 7)} · <b>{formatKg(d.kg)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function Dashboard({profile, user, onSignOut}: {profile: Profile; user: User; onSignOut: () => void}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [syncStatus, setSyncStatus] = useState('Cargando tus datos…');
  const [ready, setReady] = useState(false);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [exerciseDone, setExerciseDone] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extras>(EMPTY_EXTRAS);
  const [extrasInDb, setExtrasInDb] = useState(true);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [weightMsg, setWeightMsg] = useState('');
  const [reflectionIndex, setReflectionIndex] = useState(0);
  const [showVoice, setShowVoice] = useState(false);
  const speech = useSpeech();

  useEffect(() => {
    setDateInput(new Date().toLocaleDateString('en-CA'));
    const supabase = getSupabase();
    if (!supabase) return;
    setSpeechTokenProvider(async () => (await supabase.auth.getSession()).data.session?.access_token || null);
    let cancelled = false;
    (async () => {
      let {data, error} = await supabase.from('wellness_data').select('weights,checks,favorites,exercises_done,extras').eq('user_id', user.id).maybeSingle();
      let hasExtras = true;
      if (error && /extras/i.test(error.message)) {
        // la base aún no tiene la columna "extras": se guarda en este dispositivo
        hasExtras = false;
        ({data, error} = await supabase.from('wellness_data').select('weights,checks,favorites,exercises_done').eq('user_id', user.id).maybeSingle());
      }
      if (cancelled) return;
      setExtrasInDb(hasExtras);
      let ex: Partial<Extras> | null = hasExtras ? (data as {extras?: Partial<Extras>} | null)?.extras || null : null;
      if (!ex || !Object.keys(ex).length) {
        try {
          ex = JSON.parse(localStorage.getItem(localExtrasKey(user.id)) || 'null');
        } catch {}
      }
      if (ex) setExtras({...EMPTY_EXTRAS, ...ex});
      if (error) {
        setSyncStatus('No se pudo cargar tu información: ' + error.message);
        return;
      }
      if (data) {
        if (Array.isArray(data.weights)) setWeights(data.weights);
        if (Array.isArray(data.checks)) setChecked(data.checks);
        if (Array.isArray(data.favorites)) setFavorites(data.favorites);
        if (Array.isArray(data.exercises_done)) setExerciseDone(data.exercises_done);
      }
      setSyncStatus('Sincronizado');
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    if (!ready) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const t = setTimeout(async () => {
      setSyncStatus('Guardando…');
      try {
        localStorage.setItem(localExtrasKey(user.id), JSON.stringify(extras));
      } catch {}
      const base = {user_id: user.id, weights, checks: checked, favorites, exercises_done: exerciseDone, updated_at: new Date().toISOString()};
      let {error} = await supabase.from('wellness_data').upsert((extrasInDb ? {...base, extras} : base) as Record<string, unknown>, {onConflict: 'user_id'});
      if (error && extrasInDb && /extras/i.test(error.message)) {
        setExtrasInDb(false);
        ({error} = await supabase.from('wellness_data').upsert(base, {onConflict: 'user_id'}));
      }
      setSyncStatus(error ? 'No se pudo guardar: ' + error.message : 'Sincronizado');
    }, 700);
    return () => clearTimeout(t);
  }, [weights, checked, favorites, exerciseDone, extras, extrasInDb, ready, user.id]);

  useEffect(() => {
    stopSpeech();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, [tab]);

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) => setter(v => (v.includes(id) ? v.filter(x => x !== id) : [...v, id]));

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.at(-1)?.kg;
  const first = sorted[0]?.kg;
  const delta = current !== undefined && first !== undefined ? +(first - current).toFixed(1) : undefined;
  const todayIndex = (new Date().getDay() + 6) % 7;
  const program = extras.program;
  const plan = program ? program.week[todayIndex] : null;
  const today = plan ? {day: plan.day, label: plan.title, duration: plan.type === 'Descanso' ? 'Descanso' : plan.minutes + ' min', details: plan.items.map(i => i.name).join(' · ')} : weeklyPlan[todayIndex];
  const todayDate = todayISO();
  const todayDone = program ? !!extras.sessions[todayDate] : checked.includes(today.day);
  const toggleToday = () => (program ? setExtras(x => ({...x, sessions: {...x.sessions, [todayDate]: !x.sessions[todayDate]}})) : toggleIn(setChecked)(today.day));
  const kcalToday = totals(extras.food[todayDate]).kcal;
  const comp = program ? compliance(program, extras.habits, extras.sessions) : null;
  const goHome = () => {
    setTab('overview');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  function addWeight() {
    const n = Number(weightInput.replace(',', '.'));
    if (!Number.isFinite(n) || n < 25 || n > 350) {
      setWeightMsg('Ingresa un peso válido entre 25 y 350 kg.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      setWeightMsg('Elige una fecha válida.');
      return;
    }
    setWeights(prev => [...prev.filter(x => x.date !== dateInput), {date: dateInput, kg: n}]);
    setWeightInput('');
    setWeightMsg('¡Medición guardada!');
    setTimeout(() => setWeightMsg(''), 2500);
  }

  function readSection() {
    if (speech.speaking && speech.label === 'Sección') return stopSpeech();
    const el = document.querySelector('.content');
    const clone = el?.cloneNode(true) as HTMLElement | undefined;
    clone?.querySelectorAll('button,input,select,svg,a,.fine,.skeleton,label').forEach(x => x.remove());
    clone?.querySelectorAll('h1,h2,h3,p,li,div').forEach(x => x.append('. '));
    speak(clone?.textContent || '', 'Sección');
  }

  const reflection = reflections[reflectionIndex];

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="brand" onClick={goHome} aria-label="Ir al inicio">
          <span className="brand-icon">
            <Heart size={20} fill="currentColor" />
          </span>
          <span className="brand-text">
            <b>
              vida<span>activa</span>
            </b>
            <small>Tu bienestar, a tu ritmo</small>
          </span>
        </button>
        <nav aria-label="Secciones">
          {menu.map(({id, name, icon: Icon}) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
              <Icon size={19} />
              {name}
            </button>
          ))}
        </nav>
        <div className="side-card">
          <div className="eyebrow">Hoy te toca</div>
          <strong>{today.label}</strong>
          <p>
            {today.duration} · {today.details}
          </p>
          <button className="link-btn" onClick={() => setTab('program')}>
            {program ? 'Ver mi programa' : 'Crear mi programa'} <ArrowUpRight size={14} />
          </button>
        </div>
        <button className="side-out" onClick={onSignOut}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </aside>

      <main>
        <header className="topbar">
          <button className="topbar-brand" onClick={goHome} aria-label="Ir al inicio">
            <span className="brand-icon sm">
              <Heart size={16} fill="currentColor" />
            </span>
            <b>
              vida<span>activa</span>
            </b>
          </button>
          <div className="hello">
            <span className={'dot' + (syncStatus === 'Sincronizado' ? '' : ' warn')} title={syncStatus} />
            {greeting()}, <b>{profile.name}</b>
          </div>
          <div className="top-actions">
            <button className={'btn btn-soft sm' + (speech.speaking && speech.label === 'Sección' ? ' is-playing' : '')} onClick={readSection} disabled={!speech.supported && !speech.aiAvailable}>
              {speech.speaking && speech.label === 'Sección' ? <Square size={15} /> : <Volume2 size={16} />}
              <span className="hide-sm">{speech.speaking && speech.label === 'Sección' ? 'Detener' : 'Escuchar sección'}</span>
            </button>
            <button className="icon-btn" onClick={() => setShowVoice(v => !v)} aria-label="Ajustes de voz" title="Ajustes de voz">
              <Settings2 size={18} />
            </button>
            <div className="avatar" title={profile.name}>
              {profile.initial}
            </div>
            <button className="icon-btn show-sm" onClick={onSignOut} aria-label="Cerrar sesión">
              <LogOut size={17} />
            </button>
          </div>
          {showVoice && (
            <div className="vs-pop top">
              <VoiceSettings onClose={() => setShowVoice(false)} />
            </div>
          )}
        </header>

        <div className="content">
          {ready && !extrasInDb && (tab === 'program' || tab === 'calories') && (
            <div className="alert alert-warn">
              <Info size={16} /> Tu programa y comidas se están guardando solo en este dispositivo mientras se actualiza la base de datos.
            </div>
          )}
          {!ready && (
            <div className="alert">
              <Info size={16} /> {syncStatus}
            </div>
          )}

          {tab === 'overview' && (
            <>
              <section className="hero">
                <div>
                  <div className="eyebrow light">Resumen personal</div>
                  <h1>
                    Tu progreso, <em>paso a paso.</em>
                  </h1>
                  <p>Más que un número: hábitos pequeños para sentirte mejor cada día.</p>
                  <div className="hero-actions">
                    <button className="btn btn-white" onClick={() => setTab('recipes')}>
                      <Utensils size={17} /> Buscar recetas
                    </button>
                    <button className="btn btn-outline-light" onClick={() => setTab('exercises')}>
                      <Dumbbell size={17} /> Ejercicios
                    </button>
                  </div>
                </div>
                <div className="hero-today">
                  <small>Hoy · {today.day}</small>
                  <strong>{today.label}</strong>
                  <span>{today.duration}</span>
                  {today.duration !== 'Descanso' && (
                    <button className={'done-btn light' + (todayDone ? ' on' : '')} onClick={toggleToday}>
                      <Check size={15} /> {todayDone ? 'Hecho hoy' : 'Marcar como hecho'}
                    </button>
                  )}
                  <button className="link-btn light" onClick={() => setTab('program')}>
                    {program ? 'Ver sesión' : 'Crear mi programa'} <ArrowUpRight size={14} />
                  </button>
                </div>
              </section>

              <div className="stats">
                <div className="stat">
                  <span>Peso actual</span>
                  <strong>
                    {current === undefined ? '—' : formatKg(current)} <small>kg</small>
                  </strong>
                  <p>Última medición</p>
                </div>
                <div className="stat">
                  <span>Cambio acumulado</span>
                  <strong className={delta !== undefined && delta > 0 ? 'good' : ''}>
                    {delta === undefined ? '—' : `${delta > 0 ? '−' : delta < 0 ? '+' : ''}${formatKg(Math.abs(delta))}`} <small>kg</small>
                  </strong>
                  <p>Desde tu primer registro</p>
                </div>
                <div className="stat">
                  <span>Semana activa</span>
                  <strong>
                    {comp ? comp.sessionsDone : checked.length}
                    <small> / {comp ? comp.sessionsPlanned : 7} sesiones</small>
                  </strong>
                  <div className="bar">
                    <b style={{width: `${comp ? (comp.sessionsDone / (comp.sessionsPlanned || 1)) * 100 : (checked.length / 7) * 100}%`}} />
                  </div>
                </div>
              </div>

              <div className="two even">
                <button className="panel mini-card" onClick={() => setTab('calories')}>
                  <Ring value={kcalToday / (program?.kcal || 2000)} size={92} stroke={9} label={Math.round(kcalToday).toLocaleString('es-CL')} sub="kcal" />
                  <span>
                    <span className="eyebrow">Calorías de hoy</span>
                    <b>{program ? `Meta: ${program.kcal.toLocaleString('es-CL')} kcal` : 'Registra lo que comes'}</b>
                    <small>{kcalToday ? `Te quedan ${Math.max(0, Math.round((program?.kcal || 2000) - kcalToday)).toLocaleString('es-CL')} kcal` : 'Toca para agregar tu primera comida'}</small>
                  </span>
                  <ArrowUpRight size={18} className="muted" />
                </button>
                <button className="panel mini-card" onClick={() => setTab('program')}>
                  <Ring value={(comp?.score || 0) / 100} size={92} stroke={9} label={comp ? comp.score + '%' : '—'} sub="metas" color="var(--peach)" />
                  <span>
                    <span className="eyebrow">Mi programa</span>
                    <b>{comp ? `Racha de ${comp.streak} ${comp.streak === 1 ? 'día' : 'días'}` : 'Crea tu programa de metas'}</b>
                    <small>{comp ? `${(extras.habits[todayDate] || []).length}/${program!.habits.length} hábitos hoy` : 'Calorías, entrenamiento, hábitos e hitos'}</small>
                  </span>
                  <ArrowUpRight size={18} className="muted" />
                </button>
              </div>

              <div className="two">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <div className="eyebrow">Seguimiento</div>
                      <h2>Evolución de peso</h2>
                    </div>
                    <Scale size={20} className="muted" />
                  </div>
                  <WeightChart data={sorted} />
                  <p className="fine">La balanza fluctúa día a día: compara promedios semanales y observa también tu energía y tu fuerza.</p>
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <div className="eyebrow">Nueva medición</div>
                      <h2>Registra tu peso</h2>
                    </div>
                    <Plus size={20} className="muted" />
                  </div>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      addWeight();
                    }}
                  >
                    <label className="field">
                      <span>Fecha</span>
                      <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Peso (kg)</span>
                      <input inputMode="decimal" placeholder="Ej. 72,5" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
                    </label>
                    <button className="btn btn-primary full" disabled={!ready} type="submit">
                      Guardar medición <ArrowUpRight size={16} />
                    </button>
                  </form>
                  {weightMsg && (
                    <p className="form-msg" role="status">
                      {weightMsg}
                    </p>
                  )}
                  <p className="fine">🔒 Tus datos quedan en tu cuenta privada y se sincronizan entre tus dispositivos.</p>
                </section>
              </div>
            </>
          )}

          {tab === 'recipes' && <RecipesView favorites={favorites} onToggleFavorite={toggleIn(setFavorites)} />}
          {tab === 'exercises' && <ExercisesView done={exerciseDone} onToggleDone={toggleIn(setExerciseDone)} />}

          {tab === 'program' && (
            <ProgramView
              program={program}
              onSave={p => setExtras(x => ({...x, program: p}))}
              habits={extras.habits}
              setHabits={fn => setExtras(x => ({...x, habits: fn(x.habits)}))}
              sessions={extras.sessions}
              setSessions={fn => setExtras(x => ({...x, sessions: fn(x.sessions)}))}
              currentWeight={current}
              todayKcal={kcalToday}
            />
          )}
          {tab === 'calories' && <CaloriesView log={extras.food} setLog={fn => setExtras(x => ({...x, food: fn(x.food)}))} program={program} onCreateProgram={() => setTab('program')} />}

          {tab === 'motivation' && (
            <>
              <header className="page-head">
                <div className="eyebrow">Un espacio para volver a empezar</div>
                <h1>
                  Tu bienestar también <em>se escucha.</em>
                </h1>
                <p className="lead">Reflexiones breves narradas con voz cálida y pausada, más podcasts en español sobre hábitos y bienestar.</p>
              </header>
              <section className="quote-card">
                <div className="quote-top">
                  <span className="pill light">{reflection.theme}</span>
                  <span className="muted-light">
                    {reflectionIndex + 1} / {reflections.length}
                  </span>
                </div>
                <p className="quote">“{reflection.message}”</p>
                <p className="quote-note">Reflexión original inspirada en ideas de {reflection.author}. No es una cita textual.</p>
                <div className="hero-actions">
                  <ListenButton text={reflection.message} label="Reflexión" className="btn btn-white">
                    Escuchar reflexión
                  </ListenButton>
                  <button
                    className="btn btn-outline-light"
                    onClick={() => {
                      stopSpeech();
                      setReflectionIndex(i => (i + 1) % reflections.length);
                    }}
                  >
                    <Shuffle size={17} /> Otra reflexión
                  </button>
                </div>
              </section>
              <div className="panel voice-panel">
                <VoiceSettings />
              </div>
              <div className="section-head">
                <div>
                  <div className="eyebrow">Podcasts en español</div>
                  <h2>Escucha y aprende a tu ritmo</h2>
                </div>
              </div>
              <div className="grid">
                {podcasts.map(p => (
                  <article className="card podcast" key={p.title}>
                    <div className="card-body">
                      <div className="pod-icon">
                        <Headphones size={22} />
                      </div>
                      <span className="pill">{p.tag}</span>
                      <h3>{p.title}</h3>
                      <p className="meta">{p.topic}</p>
                      <p className="desc">{p.desc}</p>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="link-btn">
                        Escuchar en la plataforma <ExternalLink size={14} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              <p className="fine">Los podcasts pertenecen a sus creadores; abrimos sus sitios oficiales. Estas reflexiones son apoyo para hábitos saludables, no un tratamiento psicológico.</p>
            </>
          )}
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Secciones">
        {menu.map(({id, short, icon: Icon}) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon size={21} />
            <span>{short}</span>
          </button>
        ))}
      </nav>
      <AudioBar />
      <VideoModal />
    </div>
  );
}

export default function Page() {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoadingAuth(false);
      return;
    }
    let active = true;
    supabase.auth
      .getUser()
      .then(({data}) => {
        if (active) {
          setUser(data.user);
          setLoadingAuth(false);
        }
      })
      .catch(() => active && setLoadingAuth(false));
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (active) {
        setUser(session?.user || null);
        setLoadingAuth(false);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        if (name.trim().length < 2) {
          setMessage('Escribe un nombre de al menos dos caracteres.');
          return;
        }
        const {error} = await supabase.auth.signUp({email: email.trim(), password, options: {data: {display_name: name.trim().slice(0, 40)}}});
        if (error) throw error;
        setMessage('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
      } else {
        const {error} = await supabase.auth.signInWithPassword({email: email.trim(), password});
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo completar la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  if (!supabase)
    return (
      <div className="auth">
        <div className="auth-card">
          <h1>
            Vida Activa <em>Familia</em>
          </h1>
          <div className="alert">
            <Info size={18} /> Para habilitar cuentas privadas, configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel. Consulta FAMILY_AUTH_SETUP.md.
          </div>
        </div>
      </div>
    );
  if (loadingAuth)
    return (
      <div className="auth">
        <div className="loader-heart">
          <Heart size={34} fill="currentColor" />
        </div>
      </div>
    );
  if (user) {
    const display = String(user.user_metadata?.display_name || user.email?.split('@')[0] || 'Hola');
    return <Dashboard key={user.id} user={user} profile={{id: user.id, name: display, initial: display.charAt(0).toUpperCase()}} onSignOut={() => supabase.auth.signOut()} />;
  }
  return (
    <div className="auth">
      <div className="auth-art" aria-hidden>
        <div className="brand-icon lg">
          <Heart size={30} fill="currentColor" />
        </div>
        <h2>Come rico, muévete a tu ritmo y escucha lo que te hace bien.</h2>
        <ul>
          <li>
            <Utensils size={18} /> Recetas de todo el mundo, en español
          </li>
          <li>
            <Dumbbell size={18} /> Cientos de ejercicios guiados
          </li>
          <li>
            <Headphones size={18} /> Instrucciones y reflexiones por voz
          </li>
        </ul>
      </div>
      <div className="auth-card">
        <div className="eyebrow">Vida Activa AI · Familia</div>
        <h1>
          Tu bienestar, <em>tu cuenta.</em>
        </h1>
        <p className="lead">Cada integrante usa su propia cuenta y conserva sus registros privados en todos sus dispositivos.</p>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => (setMode('login'), setMessage(''))}>
            Iniciar sesión
          </button>
          <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => (setMode('signup'), setMessage(''))}>
            Crear cuenta
          </button>
        </div>
        <form onSubmit={submitAuth}>
          {mode === 'signup' && (
            <label className="field">
              <span>Nombre o apodo</span>
              <input required minLength={2} maxLength={40} value={name} onChange={e => setName(e.target.value)} />
            </label>
          )}
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <button className="btn btn-primary full" disabled={busy} type="submit">
            {busy ? 'Procesando…' : mode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme'}
          </button>
        </form>
        {message && (
          <p role="status" className="form-msg">
            {message}
          </p>
        )}
        <p className="fine">Los datos de cada cuenta se aíslan con reglas de acceso en la base de datos. No compartas tu contraseña.</p>
      </div>
    </div>
  );
}
