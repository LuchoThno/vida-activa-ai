/**
 * Creador de programas de metas de Vida Activa AI.
 * Cálculos basados en guías generales (Mifflin-St Jeor, recomendaciones OMS de actividad física,
 * pérdida de peso gradual de ~0,25–0,5 kg por semana). Orientativo: no reemplaza a un profesional.
 */

export type Sex = 'F' | 'M';
export type Goal = 'bajar' | 'mantener' | 'fuerza' | 'energia';
export type ProgramInput = {
  sex: Sex;
  age: number;
  height: number; // cm
  weight: number; // kg
  target: number; // kg
  goal: Goal;
  activity: 1 | 2 | 3 | 4;
  days: number; // 2–6
  minutes: number; // por sesión
  level: 'inicial' | 'intermedio';
  place: 'casa' | 'gimnasio';
  limits: string[]; // rodillas | espalda | hombros | corazon
};
export type SessionItem = {name: string; detail: string; video?: string};
export type Session = {day: string; type: 'Fuerza' | 'Cardio' | 'Movilidad' | 'Descanso'; title: string; minutes: number; items: SessionItem[]};
export type Habit = {id: string; label: string; detail: string};
export type Program = {
  createdAt: string;
  input: ProgramInput;
  bmi: number;
  bmr: number;
  tdee: number;
  kcal: number;
  kcalFloor: number;
  protein: number;
  carbs: number;
  fat: number;
  waterL: number;
  stepsStart: number;
  stepsGoal: number;
  weeklyChange: number; // kg/semana (negativo = bajar)
  weeks: number;
  targetDate: string;
  milestones: {date: string; weight: number; label: string}[];
  week: Session[];
  phases: {weeks: string; title: string; detail: string}[];
  habits: Habit[];
  notes: string[];
};

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const GOALS: {id: Goal; label: string; desc: string}[] = [
  {id: 'bajar', label: 'Bajar de peso', desc: 'Perder grasa de forma gradual y sostenible'},
  {id: 'mantener', label: 'Mantener y sentirme mejor', desc: 'Comer equilibrado y moverme más'},
  {id: 'fuerza', label: 'Ganar fuerza', desc: 'Más músculo y firmeza, sin extremos'},
  {id: 'energia', label: 'Más energía y salud', desc: 'Resistencia, movilidad y hábitos'},
];
export const ACTIVITY = [
  {id: 1, label: 'Sedentaria', desc: 'Trabajo sentado, poco movimiento', f: 1.2},
  {id: 2, label: 'Ligera', desc: 'Camino algo, 1–2 días de ejercicio', f: 1.375},
  {id: 3, label: 'Moderada', desc: '3–5 días de ejercicio', f: 1.55},
  {id: 4, label: 'Alta', desc: 'Trabajo físico o ejercicio casi diario', f: 1.725},
] as const;

const round = (n: number, step = 1) => Math.round(n / step) * step;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const iso = (d: Date) => d.toLocaleDateString('en-CA');

export function bmiOf(weight: number, height: number) {
  return weight / (height / 100) ** 2;
}
export function healthyRange(height: number) {
  const h = (height / 100) ** 2;
  return {min: Math.ceil(18.5 * h), max: Math.floor(24.9 * h)};
}

export function validate(i: ProgramInput): string | null {
  if (i.age < 18) return 'El programa automático es para personas adultas. Para menores de 18 años, consulta con un profesional de salud.';
  if (i.age > 100 || i.height < 120 || i.height > 230 || i.weight < 30 || i.weight > 350) return 'Revisa edad, estatura y peso: algún dato está fuera de rango.';
  if (i.goal === 'bajar') {
    if (i.target >= i.weight) return 'Para bajar de peso, la meta debe ser menor a tu peso actual.';
    if (bmiOf(i.target, i.height) < 18.5)
      return `Esa meta quedaría bajo un peso saludable para tu estatura. Elige una meta de al menos ${healthyRange(i.height).min} kg o conversa con un profesional.`;
  }
  return null;
}

/* -------- Ejercicios por tipo -------- */
function strength(i: ProgramInput, week: number): SessionItem[] {
  const sets = i.level === 'inicial' ? 2 : 3;
  const reps = i.level === 'inicial' ? '8–10' : '10–12';
  const knees = i.limits.includes('rodillas');
  const back = i.limits.includes('espalda');
  const shoulders = i.limits.includes('hombros');
  const s = (n: string, d: string, video?: string): SessionItem => ({name: n, detail: d, video});
  if (i.place === 'gimnasio') {
    return [
      knees ? s('Puente de glúteos', `${sets}×12`) : s('Prensa de piernas', `${sets}×${reps}`),
      shoulders ? s('Remo en polea baja', `${sets}×${reps}`) : s('Press de pecho en máquina', `${sets}×${reps}`),
      s('Jalón al pecho', `${sets}×${reps}`),
      back ? s('Bird-dog (cuadrupedia)', `${sets}×8 por lado`) : s('Peso muerto rumano con mancuernas', `${sets}×${reps}, espalda neutra`),
      s('Curl femoral en máquina', `${sets}×${reps}`),
      s('Plancha', `${sets}×${i.level === 'inicial' ? '20' : '30'} s`),
    ];
  }
  if (i.level === 'inicial') {
    return [
      knees ? s('Sentarse y levantarse de silla alta', `${sets}×6–8, rango cómodo`, '5fcd0pPWLEQ') : s('Sentarse y levantarse de una silla', `${sets}×${reps}`, '5fcd0pPWLEQ'),
      s('Flexiones contra la pared', `${sets}×${reps}`, '23NYAAo1usA'),
      s('Puente de glúteos', `${sets}×10`),
      s('Remo con banda elástica o mochila', `${sets}×10`),
      back ? s('Bird-dog (cuadrupedia)', `${sets}×6 por lado`) : s('Plancha apoyando rodillas', `${sets}×20 s`),
    ];
  }
  return [
    knees ? s('Puente de glúteos a una pierna', `${sets}×8 por lado`) : s('Sentadilla', `${sets}×${reps}`),
    shoulders ? s('Flexiones contra la pared', `${sets}×12`, '23NYAAo1usA') : s('Flexiones inclinadas (manos en mesa)', `${sets}×${reps}`),
    knees ? s('Elevación de talones', `${sets}×15`) : s('Zancadas hacia atrás', `${sets}×8 por lado`),
    s('Remo con mochila o banda', `${sets}×12`),
    s('Puente de glúteos', `${sets}×15`),
    back ? s('Bird-dog (cuadrupedia)', `${sets}×8 por lado`) : s('Plancha', `${sets}×30 s`),
  ];
}
function cardio(i: ProgramInput): SessionItem[] {
  const heart = i.limits.includes('corazon');
  const knees = i.limits.includes('rodillas');
  const intense = i.level === 'intermedio' && !heart;
  return [
    {name: 'Calentamiento: caminata suave', detail: '5 min', video: 'SOUVx8oFL88'},
    knees
      ? {name: intense ? 'Bicicleta o elíptica a ritmo moderado' : 'Bicicleta estática o caminata suave', detail: `${Math.max(10, i.minutes - 10)} min`}
      : {name: intense ? 'Caminata rápida con intervalos (2 min rápido / 2 min suave)' : 'Caminata a ritmo conversacional', detail: `${Math.max(10, i.minutes - 10)} min`, video: 'SOUVx8oFL88'},
    {name: 'Vuelta a la calma y estiramiento de pantorrillas', detail: '5 min', video: 'qxVUlsEeDbM'},
  ];
}
function mobility(): SessionItem[] {
  return [
    {name: 'Movilidad de hombros', detail: '5 min', video: 'bFWrgXEJ3rQ'},
    {name: 'Equilibrio con apoyo en silla', detail: '3×30 s por pierna', video: 'sLhdz-cGz3U'},
    {name: 'Gato-vaca (movilidad de columna)', detail: '2×8 lento'},
    {name: 'Estiramiento de pantorrillas', detail: '2×20 s por lado', video: 'qxVUlsEeDbM'},
    {name: 'Respiración profunda', detail: '2 min'},
  ];
}

function weekTemplate(i: ProgramInput): Session[] {
  const n = Math.min(6, Math.max(2, Math.round(i.days)));
  const slots: Record<number, number[]> = {2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]};
  const typesByGoal: Record<Goal, Session['type'][]> = {
    bajar: ['Fuerza', 'Cardio', 'Fuerza', 'Cardio', 'Cardio', 'Movilidad'],
    mantener: ['Fuerza', 'Cardio', 'Movilidad', 'Fuerza', 'Cardio', 'Movilidad'],
    fuerza: ['Fuerza', 'Cardio', 'Fuerza', 'Movilidad', 'Fuerza', 'Cardio'],
    energia: ['Cardio', 'Fuerza', 'Movilidad', 'Cardio', 'Fuerza', 'Movilidad'],
  };
  const order = typesByGoal[i.goal];
  // Asegura al menos una sesión de fuerza con 2 días (recomendación OMS: fuerza ≥2 días/semana cuando sea posible)
  const chosen = n === 2 ? ['Fuerza', 'Cardio'] : order.slice(0, n);
  const week: Session[] = DAYS.map(day => ({day, type: 'Descanso', title: 'Descanso activo', minutes: 15, items: [{name: 'Paseo suave opcional', detail: '10–15 min'}, {name: 'Dormir 7–8 horas', detail: 'Recuperación'}]}));
  slots[n].forEach((d, k) => {
    const type = chosen[k] as Session['type'];
    week[d] = {
      day: DAYS[d],
      type,
      title: type === 'Fuerza' ? (i.place === 'gimnasio' ? 'Fuerza en gimnasio' : 'Fuerza en casa') : type === 'Cardio' ? 'Cardio' : 'Movilidad y equilibrio',
      minutes: type === 'Movilidad' ? Math.min(20, i.minutes) : i.minutes,
      items: type === 'Fuerza' ? strength(i, 1) : type === 'Cardio' ? cardio(i) : mobility(),
    };
  });
  return week;
}

export function buildProgram(i: ProgramInput, start = new Date()): Program {
  const bmr = 10 * i.weight + 6.25 * i.height - 5 * i.age + (i.sex === 'M' ? 5 : -161);
  const factor = ACTIVITY.find(a => a.id === i.activity)?.f ?? 1.2;
  // el programa suma actividad: se considera un nivel más si entrena 4+ días
  const tdee = bmr * (i.days >= 4 && i.activity < 4 ? (ACTIVITY.find(a => a.id === i.activity + 1)?.f ?? factor) : factor);
  const floor = Math.max(i.sex === 'M' ? 1500 : 1200, round(bmr, 10));
  let kcal = tdee;
  let weeklyChange = 0;
  if (i.goal === 'bajar') {
    const deficit = Math.min(500, tdee * 0.2);
    kcal = Math.max(floor, tdee - deficit);
    weeklyChange = -Math.min(0.5, ((tdee - kcal) * 7) / 7700);
    if (weeklyChange > -0.1) weeklyChange = -0.1;
  } else if (i.goal === 'fuerza') {
    kcal = tdee + 200;
    weeklyChange = i.target > i.weight ? 0.15 : 0;
  }
  kcal = round(kcal, 10);
  const proteinPerKg = i.goal === 'mantener' || i.goal === 'energia' ? 1.2 : 1.6;
  const refWeight = bmiOf(i.weight, i.height) > 30 ? healthyRange(i.height).max + 10 : i.weight; // evita metas de proteína excesivas
  const protein = round(Math.min(refWeight * proteinPerKg, (kcal * 0.3) / 4));
  const fat = round((kcal * 0.28) / 9);
  const carbs = round((kcal - protein * 4 - fat * 9) / 4);

  const diff = i.target - i.weight;
  const weeks = weeklyChange !== 0 && Math.sign(diff) === Math.sign(weeklyChange) ? Math.ceil(Math.abs(diff / weeklyChange)) : 12;
  const targetDate = iso(addDays(start, weeks * 7));
  const milestones: Program['milestones'] = [];
  for (let w = 4; w < weeks; w += 4) {
    milestones.push({date: iso(addDays(start, w * 7)), weight: Math.round((i.weight + weeklyChange * w) * 10) / 10, label: `Semana ${w}`});
    if (milestones.length >= 8) break;
  }
  milestones.push({date: targetDate, weight: weeklyChange ? i.target : i.weight, label: weeklyChange ? 'Meta' : 'Revisión del programa'});

  const stepsStart = [0, 4000, 6000, 8000, 9000][i.activity];
  const stepsGoal = Math.min(10000, stepsStart + 3000);
  const waterL = Math.round(Math.min(3.5, Math.max(1.5, (i.weight > 100 ? 100 : i.weight) * 0.033)) * 10) / 10;

  const habits: Habit[] = [
    {id: 'agua', label: `Tomar ${waterL.toLocaleString('es-CL')} L de agua`, detail: 'Lleva una botella contigo'},
    {id: 'pasos', label: `Caminar ${stepsStart.toLocaleString('es-CL')} pasos o más`, detail: `Sube 500 pasos cada semana hasta ${stepsGoal.toLocaleString('es-CL')}`},
    {id: 'verduras', label: '5 porciones de frutas y verduras', detail: 'Media plato de verduras en almuerzo y cena'},
    {id: 'proteina', label: 'Proteína en cada comida', detail: `Meta diaria ≈ ${protein} g`},
    {id: 'registro', label: 'Registrar lo que como', detail: 'Usa el contador de calorías'},
    {id: 'sueno', label: 'Dormir 7–8 horas', detail: 'Horario regular para acostarte'},
    {id: 'azucar', label: 'Sin bebidas azucaradas', detail: 'Agua, té o bebidas sin azúcar'},
  ];

  const notes = [
    'Es un programa orientativo. Si tienes una enfermedad, tomas medicamentos o estás embarazada, valídalo con tu equipo de salud.',
    'Debes poder conversar durante el cardio. Detente ante dolor en el pecho, mareo o falta de aire inusual.',
    i.goal === 'bajar' ? `No comas menos de ${floor.toLocaleString('es-CL')} kcal al día: comer muy poco hace perder músculo y energía.` : 'Ajusta las porciones según tu hambre y tu energía.',
  ];
  if (i.limits.includes('corazon')) notes.unshift('Indicaste una condición cardíaca o respiratoria: consulta a tu médico antes de comenzar y mantén siempre intensidad suave.');

  return {
    createdAt: new Date().toISOString(),
    input: i,
    bmi: Math.round(bmiOf(i.weight, i.height) * 10) / 10,
    bmr: round(bmr),
    tdee: round(tdee, 10),
    kcal,
    kcalFloor: floor,
    protein,
    carbs,
    fat,
    waterL,
    stepsStart,
    stepsGoal,
    weeklyChange: Math.round(weeklyChange * 100) / 100,
    weeks,
    targetDate,
    milestones,
    week: weekTemplate(i),
    phases: [
      {weeks: 'Semanas 1–2', title: 'Adaptación', detail: 'Aprende la técnica con poco esfuerzo. Termina cada sesión sintiendo que podías hacer un poco más.'},
      {weeks: 'Semanas 3–6', title: 'Progresión', detail: 'Suma 1 serie o 2 repeticiones por ejercicio, y 5 minutos al cardio, si te sientes bien.'},
      {weeks: 'Semana 7 en adelante', title: 'Consolidación', detail: 'Mantén la rutina, varía ejercicios y revisa tu meta con el registro de peso cada 2 semanas.'},
    ],
    habits,
    notes,
  };
}

/* -------- Cumplimiento -------- */
export type HabitLog = Record<string, string[]>; // fecha → hábitos cumplidos
export type SessionLog = Record<string, boolean>; // fecha → sesión hecha

export function weekDates(ref = new Date()) {
  const monday = addDays(ref, -((ref.getDay() + 6) % 7));
  return DAYS.map((_, k) => iso(addDays(monday, k)));
}
export function todayISO() {
  return iso(new Date());
}

export function compliance(p: Program, habits: HabitLog, sessions: SessionLog, ref = new Date()) {
  const dates = weekDates(ref);
  const today = iso(ref);
  const planned = p.week.map((s, k) => ({date: dates[k], s})).filter(x => x.s.type !== 'Descanso');
  const sessionsDone = planned.filter(x => sessions[x.date]).length;
  const elapsed = dates.filter(d => d <= today);
  const habitPct = elapsed.length ? elapsed.reduce((acc, d) => acc + (habits[d]?.length || 0) / p.habits.length, 0) / elapsed.length : 0;
  const sessionPct = planned.length ? sessionsDone / planned.length : 0;
  let streak = 0;
  for (let k = 0; k < 365; k++) {
    const d = iso(addDays(ref, -k));
    const ok = (habits[d]?.length || 0) / p.habits.length >= 0.6 || sessions[d];
    if (ok) streak++;
    else if (k > 0) break;
  }
  return {score: Math.round((habitPct * 0.6 + sessionPct * 0.4) * 100), habitPct: Math.round(habitPct * 100), sessionsDone, sessionsPlanned: planned.length, streak};
}
