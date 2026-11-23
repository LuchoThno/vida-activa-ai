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

export const guidedExercises=[
{id:'guide-walk',title:'Caminata cómoda',category:'Cardio',level:'Inicial',minutes:15,equipment:'Calzado cómodo',description:'Camina a un ritmo que permita conversar sin jadear. Puedes dividir el tiempo en bloques de cinco minutos.',steps:['Camina suave durante tres minutos para entrar en calor.','Mantén un ritmo que permita hablar con frases completas.','Reduce el ritmo durante los últimos dos minutos.'],videoSearch:'caminata ejercicio principiantes técnica'},
{id:'guide-chair',title:'Sentarse y levantarse',category:'Fuerza',level:'Inicial',minutes:8,equipment:'Silla firme',description:'Fortalece piernas con una silla estable y sin ruedas.',steps:['Coloca los pies separados al ancho de caderas.','Levántate de la silla sin impulsarte bruscamente.','Vuelve a sentarte de forma lenta. Realiza una serie de seis a ocho repeticiones.'],videoSearch:'sentarse levantarse silla ejercicio adultos'},
{id:'guide-wall',title:'Flexiones contra la pared',category:'Fuerza',level:'Inicial',minutes:8,equipment:'Pared',description:'Trabajo suave de brazos y pecho sin acostarse en el suelo.',steps:['Apoya las palmas a la altura del pecho sobre una pared firme.','Flexiona los codos acercando el pecho sin perder el control.','Empuja lentamente hasta volver a la posición inicial. Haz seis a ocho repeticiones.'],videoSearch:'flexiones pared principiantes técnica'},
{id:'guide-mobility',title:'Movilidad de hombros',category:'Movilidad',level:'Inicial',minutes:6,equipment:'Ninguno',description:'Movimientos suaves para mejorar comodidad y amplitud sin dolor.',steps:['Ponte de pie o siéntate con la espalda cómoda.','Eleva y baja los hombros lentamente cinco veces.','Haz círculos pequeños hacia atrás y adelante, sin forzar.'],videoSearch:'movilidad hombros suave principiantes'},
{id:'guide-balance',title:'Equilibrio con apoyo',category:'Movilidad',level:'Inicial',minutes:6,equipment:'Silla estable',description:'Entrena estabilidad cerca de un apoyo seguro.',steps:['Colócate junto a una silla firme o una encimera.','Sujétate y eleva ligeramente un talón.','Alterna con control durante treinta segundos, descansando si lo necesitas.'],videoSearch:'equilibrio con apoyo silla principiantes'},
{id:'guide-stretch',title:'Estiramiento suave de pantorrillas',category:'Movilidad',level:'Inicial',minutes:5,equipment:'Pared',description:'Movilidad ligera después de caminar.',steps:['Apoya las manos en una pared.','Da un paso atrás con una pierna manteniendo el talón apoyado.','Mantén quince segundos sin rebotes y cambia de lado.'],videoSearch:'estiramiento pantorrillas pared principiantes'}
];
