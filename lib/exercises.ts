import {ROUTINES, TECHNIQUE} from './videos';

export const weeklyPlan=[
 {day:'Lunes',label:'Caminar + movilidad',duration:'25–30 min',details:'Caminata cómoda de 20 minutos + 5 minutos de movilidad suave.'},
 {day:'Martes',label:'Fuerza inicial',duration:'20–25 min',details:'Sentarse y levantarse de silla 2×8, flexiones contra pared 2×8, remo con banda 2×10. Descanso entre series.'},
 {day:'Miércoles',label:'Caminar',duration:'25–30 min',details:'Paseo a ritmo en el que puedas conversar.'},
 {day:'Jueves',label:'Recuperación activa',duration:'15–20 min',details:'Caminata suave y movilidad sin dolor.'},
 {day:'Viernes',label:'Fuerza inicial',duration:'20–25 min',details:'Repite ejercicios de martes, sin forzar ni contener la respiración.'},
 {day:'Sábado',label:'Caminar',duration:'30 min',details:'Caminata cómoda, fraccionada si es necesario.'},
 {day:'Domingo',label:'Descanso',duration:'Opcional',details:'Descanso o paseo suave si te sientes bien.'},
];
export const demoExercises=[
 {id:'local-1',title:'Sentarse y levantarse de una silla',description:'Usa una silla estable. Levántate lentamente y vuelve a sentarte, sin dolor.',category:'Piernas',equipment:'Silla',image:'',video:'',source:'https://www.youtube.com/results?search_query=chair+sit+to+stand+exercise'},
 {id:'local-2',title:'Flexiones contra pared',description:'Manos apoyadas sobre una pared, flexiona los brazos y regresa de forma controlada.',category:'Tren superior',equipment:'Pared',image:'',video:'',source:'https://www.youtube.com/results?search_query=wall+push+ups+exercise'},
 {id:'local-3',title:'Caminata moderada',description:'Camina a un ritmo que te permita hablar con comodidad.',category:'Cardio',equipment:'Calzado cómodo',image:'',video:'',source:'https://www.youtube.com/results?search_query=walking+exercise+beginner'},
];

const g = (id: string, video: {id: string}, title: string, category: 'Cardio' | 'Fuerza' | 'Movilidad', minutes: number, equipment: string, description: string, steps: string[]) => ({
  id,
  youtube: video.id,
  title,
  category,
  level: 'Inicial',
  minutes,
  equipment,
  description,
  steps,
  videoSearch: title + ' ejercicio técnica',
});

/** Guías paso a paso; cada una con un video en español seleccionado (ver lib/videos.ts). */
export const guidedExercises = [
  g('guide-warm', ROUTINES.calentamiento, 'Calentamiento sin saltos', 'Movilidad', 5, 'Ninguno', 'Prepara articulaciones y músculos antes de cualquier sesión, sin impacto.', ['Mueve cuello, hombros y brazos con círculos lentos.', 'Marcha en el lugar subiendo suavemente las rodillas.', 'Termina con giros suaves de cintura y movilidad de tobillos.']),
  g('guide-walk', ROUTINES.caminata20, 'Caminata en casa', 'Cardio', 20, 'Calzado cómodo', 'Camina a un ritmo que permita conversar sin jadear. Puedes seguir el video o caminar al aire libre.', ['Camina suave durante tres minutos para entrar en calor.', 'Mantén un ritmo que permita hablar con frases completas.', 'Reduce el ritmo durante los últimos dos minutos.']),
  g('guide-walk-tech', TECHNIQUE.caminarTecnica, 'Caminar con buena postura', 'Cardio', 5, 'Calzado cómodo', 'Pisada de talón a punta, mirada al frente y brazos relajados para caminar más y sin molestias.', ['Mira al frente y mantén los hombros relajados.', 'Apoya primero el talón y rueda el pie hasta la punta.', 'Balancea los brazos de forma natural, con los codos levemente flexionados.']),
  g('guide-chair', TECHNIQUE.silla, 'Sentarse y levantarse', 'Fuerza', 8, 'Silla firme', 'Fortalece piernas con una silla estable y sin ruedas.', ['Coloca los pies separados al ancho de caderas.', 'Levántate de la silla sin impulsarte bruscamente.', 'Vuelve a sentarte de forma lenta. Realiza una serie de seis a ocho repeticiones.']),
  g('guide-wall', TECHNIQUE.flexionPared, 'Flexiones contra la pared', 'Fuerza', 8, 'Pared', 'Trabajo suave de brazos y pecho sin acostarse en el suelo.', ['Apoya las palmas a la altura del pecho sobre una pared firme.', 'Flexiona los codos acercando el pecho sin perder el control.', 'Empuja lentamente hasta volver a la posición inicial. Haz seis a ocho repeticiones.']),
  g('guide-bridge', TECHNIQUE.puente, 'Puente de glúteos', 'Fuerza', 6, 'Colchoneta', 'Fortalece glúteos y la parte posterior del muslo, y protege la zona lumbar.', ['Acuéstate boca arriba con rodillas dobladas y pies apoyados.', 'Aprieta glúteos y eleva la cadera hasta alinear rodillas, cadera y hombros.', 'Baja lento. Haz ocho a diez repeticiones sin arquear la espalda.']),
  g('guide-row', TECHNIQUE.remoBanda, 'Remo con banda elástica', 'Fuerza', 6, 'Banda elástica o mochila', 'Fortalece la espalda y mejora la postura.', ['Fija la banda a la altura del pecho o pisa sus extremos.', 'Tira hacia atrás llevando los codos pegados al cuerpo.', 'Junta los omóplatos un segundo y vuelve lento. Haz diez repeticiones.']),
  g('guide-squat', TECHNIQUE.sentadilla, 'Sentadilla', 'Fuerza', 6, 'Ninguno (o una silla detrás)', 'El ejercicio base para piernas. Aprende la técnica correcta antes de sumar repeticiones.', ['Pies al ancho de hombros, puntas levemente hacia afuera.', 'Baja llevando la cadera atrás, como si fueras a sentarte, con el pecho erguido.', 'Sube empujando el suelo con todo el pie. Las rodillas siguen la línea de los pies.']),
  g('guide-birddog', TECHNIQUE.birdDog, 'Bird-dog (cuadrupedia)', 'Fuerza', 5, 'Colchoneta', 'Estabilidad de tronco y espalda, ideal si tienes molestias lumbares.', ['Apóyate en manos y rodillas, espalda neutra.', 'Estira un brazo y la pierna contraria sin girar la cadera.', 'Mantén dos segundos y cambia de lado. Seis a ocho por lado.']),
  g('guide-plank', TECHNIQUE.planchaRodillas, 'Plancha con rodillas apoyadas', 'Fuerza', 4, 'Colchoneta', 'Fortalece el abdomen de forma segura; avanza a plancha completa cuando te sientas firme.', ['Apoya antebrazos y rodillas, codos bajo los hombros.', 'Alinea cabeza, espalda y cadera, sin hundir la zona lumbar.', 'Mantén veinte segundos respirando con normalidad.']),
  g('guide-calf', TECHNIQUE.talones, 'Elevación de talones', 'Fuerza', 4, 'Pared o silla para apoyo', 'Fortalece pantorrillas y tobillos, mejora el equilibrio al caminar.', ['Apóyate en una pared o silla.', 'Sube en puntas de pie lentamente.', 'Baja controlando el movimiento. Haz doce a quince repeticiones.']),
  g('guide-mobility', TECHNIQUE.hombros, 'Movilidad de hombros', 'Movilidad', 6, 'Ninguno', 'Movimientos suaves para mejorar comodidad y amplitud sin dolor.', ['Ponte de pie o siéntate con la espalda cómoda.', 'Eleva y baja los hombros lentamente cinco veces.', 'Haz círculos pequeños hacia atrás y adelante, sin forzar.']),
  g('guide-catcow', TECHNIQUE.gatoVaca, 'Gato-vaca (movilidad de columna)', 'Movilidad', 4, 'Colchoneta', 'Moviliza la columna y alivia la rigidez de espalda.', ['Apóyate en manos y rodillas.', 'Redondea la espalda llevando el mentón al pecho.', 'Luego arquea suavemente mirando al frente. Ocho repeticiones lentas.']),
  g('guide-balance', TECHNIQUE.equilibrio, 'Equilibrio con apoyo', 'Movilidad', 6, 'Silla estable', 'Entrena estabilidad cerca de un apoyo seguro.', ['Colócate junto a una silla firme o una encimera.', 'Sujétate y eleva ligeramente un talón.', 'Alterna con control durante treinta segundos, descansando si lo necesitas.']),
  g('guide-stretch', TECHNIQUE.pantorrillas, 'Estiramiento de pantorrillas', 'Movilidad', 5, 'Pared', 'Movilidad ligera después de caminar.', ['Apoya las manos en una pared.', 'Da un paso atrás con una pierna manteniendo el talón apoyado.', 'Mantén quince a veinte segundos sin rebotes y cambia de lado.']),
  g('guide-breath', TECHNIQUE.respiracion, 'Respiración diafragmática', 'Movilidad', 3, 'Ninguno', 'Relaja, baja el estrés y ayuda a recuperarte después de entrenar.', ['Siéntate o acuéstate cómodo, una mano en el pecho y otra en el abdomen.', 'Inhala por la nariz inflando el abdomen; el pecho casi no se mueve.', 'Exhala lento por la boca. Repite durante dos o tres minutos.']),
];

/** Rutinas completas para seguir en video, agrupadas para la sección "Rutinas guiadas". */
export const guidedRoutines = [
  {group: 'Cardio', items: [ROUTINES.caminata20, ROUTINES.caminataRapida, ROUTINES.caminata30, ROUTINES.caminata10k, ROUTINES.cardioSinSaltos]},
  {group: 'Fuerza', items: [ROUTINES.fuerzaCasa, ROUTINES.fuerzaSilla, ROUTINES.gimnasio]},
  {group: 'Movilidad', items: [ROUTINES.calentamiento, ROUTINES.yoga, ROUTINES.equilibrio, ROUTINES.estiramientoCorto, ROUTINES.estiramiento10]},
  {group: 'Cuidado', items: [ROUTINES.espalda, ROUTINES.rodillas, ROUTINES.rodillasCorto]},
];
