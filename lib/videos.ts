/**
 * Catálogo curado de videos en español para Vida Activa AI.
 *
 * Selección (noviembre 2026): búsqueda en YouTube en español priorizando fisioterapeutas,
 * sociedades médicas y entrenadores con buena técnica y muchas visualizaciones.
 * Todos se verificaron como embebibles (oEmbed OK) para reproducirse dentro de la app,
 * y cada uno conserva su enlace original en YouTube con el crédito del canal.
 */

export type VideoInfo = {
  id: string; // id de YouTube (11 caracteres)
  title: string; // título descriptivo en español
  channel: string; // crédito del canal
  duration?: string; // m:ss
  kind: 'tecnica' | 'rutina';
};

const v = (id: string, title: string, channel: string, duration: string, kind: VideoInfo['kind'] = 'tecnica'): VideoInfo => ({id, title, channel, duration, kind});

/* ---------- Técnica por ejercicio ---------- */
export const TECHNIQUE = {
  silla: v('5fcd0pPWLEQ', 'Sentarse y levantarse de una silla', 'Sociedad Española de Reumatología', '1:16'),
  flexionPared: v('23NYAAo1usA', 'Flexiones en la pared', 'Javier Giménez', '3:42'),
  flexionInclinada: v('uCTbmCjiF7Y', 'Flexiones inclinadas', 'Instituto de Entrenamiento', '0:26'),
  puente: v('oDXM-a-gBt8', 'Puente de glúteos', 'Móveo Fisioterapia', '1:47'),
  puenteUnaPierna: v('pBM5Mwk6KL0', 'Puente con elevación de una pierna', 'Sociedad Española de Reumatología', '1:25'),
  remoBanda: v('cRmuo81YQes', 'Remo de pie con banda elástica', 'Proet Ejercicio Terapéutico', '0:15'),
  remoMochila: v('nx-HswVw9fw', 'Remo con mochila', 'Garzafox Team', '0:30'),
  birdDog: v('hUIrLbMnglY', 'Bird-dog (perro-pájaro)', 'FisioVanguardia', '6:15'),
  planchaRodillas: v('Po0yoKpRjNM', 'Plancha con apoyo de rodillas', 'Proet Ejercicio Terapéutico', '0:12'),
  plancha: v('qVnZtJGK4zY', 'Plancha abdominal para principiantes', 'Javier Giménez', '2:57'),
  sentadilla: v('BjixzWEw4EY', 'Sentadillas bien y mal hechas', 'FisioOnline', '4:56'),
  talones: v('aAniiWqBuOY', 'Elevación de talones', 'Dr. Oscar Ares', '0:29'),
  zancada: v('Xcfs_3DMKlc', 'Zancada correcta en cámara lenta', 'Bestcycling', '0:46'),
  prensa: v('xvCynwyNoP4', 'Cómo usar la prensa de piernas', 'Andrés Vázquez', '3:34'),
  pressPecho: v('N7DjfGB8-xY', 'Press de pecho en máquina', 'Fitness Consciente', '2:33'),
  remoPolea: v('gfc5NDJrVOk', 'Remo sentado en polea: posición correcta', 'Entrenamiento Diferente', '1:13'),
  jalon: v('x2Y6Mb41zjY', 'Jalón al pecho', 'Andrés Vázquez', '3:48'),
  pesoMuerto: v('yxLk9X5C7RU', 'Peso muerto rumano con mancuernas sin dolor de espalda', 'Dr. Víctor López', '2:59'),
  curlFemoral: v('kmtn5RJkvVE', 'Curl femoral acostado', 'Fitness Consciente', '1:48'),
  gatoVaca: v('J99uL4J5khE', 'Ejercicio del gato-camello', 'Sociedad Española de Reumatología', '1:22'),
  respiracion: v('TuPaMCsnxes', 'Respiración diafragmática', 'Marcos Sacristán · Fisioterapia a tu alcance', '3:18'),
  hombros: v('bFWrgXEJ3rQ', 'Movilidad del hombro', 'Hospital General de Valencia', '8:13'),
  equilibrio: v('sLhdz-cGz3U', 'Equilibrio con ayuda de una silla', 'Sikana Español', '2:12'),
  pantorrillas: v('nJNGMK7_Pj4', 'Estiramiento de gemelo y sóleo', 'FisioClinics', '1:22'),
  caminarTecnica: v('zzX2wSnp-aY', 'Cómo caminar correctamente', 'Fisiokorb', '5:46'),
  bicicleta: v('deKw7ml6vsY', 'Ajustar la bicicleta estática', 'Menjasa Dietistas', '3:30'),
  eliptica: v('Sbv44Rf-5U0', 'Cómo usar la elíptica correctamente', 'fitnessdigital', '3:31'),
} satisfies Record<string, VideoInfo>;

/* ---------- Rutinas guiadas (para seguir en tiempo real) ---------- */
export const ROUTINES = {
  calentamiento: v('o4uTSB22yEI', 'Calentamiento sin saltos (5 min)', 'Siéntete Bien', '7:14', 'rutina'),
  caminata20: v('v2hTF4yVStQ', 'Caminata en casa 20 min, bajo impacto', 'Mariness Fit', '21:04', 'rutina'),
  caminataRapida: v('SOUVx8oFL88', 'Caminata rápida en casa 20 min', 'Sergio Orduz', '23:23', 'rutina'),
  caminata30: v('0u48QeaK9cE', 'Caminata rápida 30 min (intervalos)', 'BoomBox', '33:19', 'rutina'),
  caminata10k: v('kpVFan1Mxo4', 'Caminata en casa: 10.000 pasos', 'Siéntete Bien', '39:11', 'rutina'),
  cardioSinSaltos: v('WNz9C_vyIB0', 'Cardio sin saltos 20 min', 'Siéntete Joven', '22:20', 'rutina'),
  fuerzaCasa: v('y9-_6xBgJbE', 'Rutina de fuerza para principiantes en casa (20 min)', 'Chuy Almada', '22:37', 'rutina'),
  fuerzaSilla: v('67wl05H1K3U', 'Rutina de fuerza en silla', 'Mariana Quevedo · Fisioterapia', '19:58', 'rutina'),
  gimnasio: v('ygFvuqi5b7M', 'Cómo empezar en el gimnasio: rutina completa', 'Entrenador Principiante', '4:54', 'rutina'),
  equilibrio: v('AffM2oqQ-n8', '5 ejercicios de equilibrio con silla', 'Mariana Quevedo · Fisioterapia', '11:08', 'rutina'),
  yoga: v('ql7_vkIEpTQ', 'Yoga para principiantes (15 min)', 'Xuan Lan Yoga', '16:21', 'rutina'),
  espalda: v('GsLwcITrSck', '4 ejercicios para el dolor lumbar', 'Fisioincorpore', '6:56', 'rutina'),
  rodillas: v('dZir7lsW05Q', 'Ejercicios para fortalecer las rodillas', 'Marcos Sacristán · Fisioterapia a tu alcance', '28:45', 'rutina'),
  rodillasCorto: v('d3-xcdzVLZk', 'Plan de fortalecimiento de rodilla', 'Fundación Valle del Lili', '2:03', 'rutina'),
  estiramientoCorto: v('pF46ZFaR7Ag', 'Estiramientos después de entrenar (3 min)', 'gymvirtual', '3:02', 'rutina'),
  estiramiento10: v('02scBFmuoPA', 'Estiramiento completo después del ejercicio (10 min)', 'Anabel Otero', '13:09', 'rutina'),
} satisfies Record<string, VideoInfo>;

const ALL: VideoInfo[] = [...Object.values(TECHNIQUE), ...Object.values(ROUTINES)];
export function videoById(id?: string): VideoInfo | undefined {
  return id ? ALL.find(x => x.id === id) : undefined;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Reglas por palabra clave (el orden importa: lo más específico primero). */
const RULES: [RegExp, VideoInfo][] = [
  [/intervalo/, ROUTINES.caminata30],
  [/eliptica/, TECHNIQUE.eliptica],
  [/bicicleta/, TECHNIQUE.bicicleta],
  [/calentamiento/, ROUTINES.calentamiento],
  [/vuelta a la calma|pantorrilla|gemelo/, TECHNIQUE.pantorrillas],
  [/estiramiento final|estiramientos/, ROUTINES.estiramientoCorto],
  [/caminata a ritmo|caminata comoda|caminata rapida/, ROUTINES.caminata20],
  [/paseo|caminar|caminata/, TECHNIQUE.caminarTecnica],
  [/silla|sentarse/, TECHNIQUE.silla],
  [/flexion.*pared/, TECHNIQUE.flexionPared],
  [/flexion.*(inclinad|mesa|banco)/, TECHNIQUE.flexionInclinada],
  [/puente.*una pierna/, TECHNIQUE.puenteUnaPierna],
  [/puente/, TECHNIQUE.puente],
  [/remo.*polea/, TECHNIQUE.remoPolea],
  [/remo.*banda/, TECHNIQUE.remoBanda],
  [/remo.*(mochila|botella)/, TECHNIQUE.remoMochila],
  [/bird.?dog|cuadrupedia|perro.?pajaro/, TECHNIQUE.birdDog],
  [/plancha.*rodilla/, TECHNIQUE.planchaRodillas],
  [/plancha/, TECHNIQUE.plancha],
  [/sentadilla/, TECHNIQUE.sentadilla],
  [/talon/, TECHNIQUE.talones],
  [/zancada/, TECHNIQUE.zancada],
  [/prensa/, TECHNIQUE.prensa],
  [/press.*pecho/, TECHNIQUE.pressPecho],
  [/jalon/, TECHNIQUE.jalon],
  [/peso muerto/, TECHNIQUE.pesoMuerto],
  [/curl femoral/, TECHNIQUE.curlFemoral],
  [/gato|camello/, TECHNIQUE.gatoVaca],
  [/respiracion/, TECHNIQUE.respiracion],
  [/hombro/, TECHNIQUE.hombros],
  [/equilibrio/, TECHNIQUE.equilibrio],
];

/** Video recomendado para un ejercicio a partir de su nombre en español. */
export function videoFor(name: string, strict = false): VideoInfo | undefined {
  const n = norm(name);
  // En la biblioteca externa (wger) evita asociar variantes con otro material o técnica distinta
  if (strict && /barra|kettlebell|pesa rusa|smith|bulgara|frontal|salto|lateral|declinad|unilateral|disco/.test(n)) return undefined;
  return RULES.find(([re]) => re.test(n))?.[1];
}

export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
