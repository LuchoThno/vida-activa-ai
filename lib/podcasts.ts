/**
 * Podcasts y radios en directo de Vida Activa AI.
 *
 * Selección (noviembre 2026) a partir de los rankings de Apple Podcasts Chile (Salud y fitness),
 * listas de iVoox, Feedspot y medios especializados. Solo podcasts en español con episodios
 * publicados en los últimos meses. Los episodios se leen desde el RSS oficial de cada podcast
 * (feeds públicos) y se reproducen dentro de la app; los derechos pertenecen a sus creadores.
 */

export type PodcastCategory = 'Mente' | 'Sueño y calma' | 'Salud y nutrición' | 'Motivación';

export type PodcastShow = {
  id: string;
  title: string;
  author: string;
  category: PodcastCategory;
  desc: string;
  feed: string; // RSS oficial
  apple: number; // id de Apple Podcasts (enlace externo)
};

export const SHOWS: PodcastShow[] = [
  {id: 'entiende-tu-mente', title: 'Entiende Tu Mente', author: 'Molo Cebrián, Luis Muiño y Mónica González', category: 'Mente', desc: 'Psicología cotidiana para entender emociones, hábitos y decisiones. Uno de los podcasts de psicología más escuchados en español.', feed: 'https://feeds.acast.com/public/shows/69779e4cf4b515342e3b249c', apple: 1229124446},
  {id: 'psicologia-al-desnudo', title: 'Psicología al Desnudo', author: 'Marina Mammoliti', category: 'Mente', desc: 'Ansiedad, autoestima, vínculos y bienestar emocional explicados con claridad.', feed: 'https://anchor.fm/s/28fef6f0/podcast/rss', apple: 1559468560},
  {id: 'somos-estupendas', title: 'Somos Estupendas', author: 'Somos Estupendas', category: 'Mente', desc: 'Salud mental y terapia para vivir con más equilibrio en el día a día.', feed: 'https://anchor.fm/s/eaa81908/podcast/rss', apple: 1514416057},
  {id: 'pildoras-psicologia', title: 'Píldoras de Psicología', author: 'Alberto Soler', category: 'Mente', desc: 'Psicología práctica y basada en evidencia, en episodios breves.', feed: 'https://feeds.acast.com/public/shows/63a19761ff4a5000115227ba', apple: 1456144183},
  {id: 've-a-terapia', title: 'VE A TERAPIA', author: 'Nathalia Molina', category: 'Mente', desc: 'Conversaciones sobre salud mental, sanación y relaciones.', feed: 'https://feeds.simplecast.com/v5SZO635', apple: 1548469186},
  {id: 'durmiendo', title: 'Durmiendo', author: 'Sergio Venegas · Dudas Media', category: 'Sueño y calma', desc: 'Historias narradas con voz suave para conciliar el sueño. Nº 1 en Salud y fitness en Chile.', feed: 'https://feeds.acast.com/public/shows/617c55401963060013cd08cb', apple: 1565189361},
  {id: 'medita-podcast', title: 'Medita Podcast', author: 'Mar del Cerro', category: 'Sueño y calma', desc: 'Meditaciones guiadas y mindfulness para bajar el estrés.', feed: 'https://feeds.acast.com/public/shows/639c4dfe509aef00119ebdf7', apple: 1234030579},
  {id: 'fitness-revolucionario', title: 'Radio Fitness Revolucionario', author: 'Marcos Vázquez', category: 'Salud y nutrición', desc: 'Entrenamiento, nutrición, sueño y longevidad con base científica.', feed: 'https://www.fitnessrevolucionario.com/feed/podcast', apple: 881260378},
  {id: 'supracortical', title: 'Supracortical', author: 'Sonoro', category: 'Salud y nutrición', desc: 'Ciencia del cerebro y la salud para tomar mejores decisiones cada día.', feed: 'https://feeds.megaphone.fm/SONORO1724669663', apple: 1508610057},
  {id: 'mi-dieta-cojea', title: 'Mi Dieta Cojea', author: 'Aitor Sánchez', category: 'Salud y nutrición', desc: 'Nutrición sin mitos: cómo comer mejor de forma sencilla.', feed: 'https://feeds.ivoox.com/feed_fg_f1135597_filtro_1.xml', apple: 1174444963},
  {id: 'biopotencial', title: 'Biopotencial', author: 'Pau Ninja', category: 'Salud y nutrición', desc: 'Hábitos, energía y salud metabólica explicados en lenguaje simple.', feed: 'https://pau.ninja/salud/podcast-feed/', apple: 1821495237},
  {id: 'por-el-placer-de-vivir', title: 'Por el Placer de Vivir', author: 'Dr. César Lozano', category: 'Motivación', desc: 'Un episodio nuevo cada día con mensajes para vivir con más alegría.', feed: 'https://feeds.simplecast.com/8YhIPHu1', apple: 1468806244},
  {id: 'se-regalan-dudas', title: 'Se Regalan Dudas', author: 'Ashley Frangie y Lety Sahagún', category: 'Motivación', desc: 'Amor propio, crecimiento personal y bienestar emocional.', feed: 'https://feeds.acast.com/public/shows/617c0d208afe370012ddf145', apple: 1416903369},
];

export const CATEGORIES: PodcastCategory[] = ['Mente', 'Sueño y calma', 'Salud y nutrición', 'Motivación'];
export const appleUrl = (s: PodcastShow) => `https://podcasts.apple.com/cl/podcast/id${s.apple}`;

export type Episode = {
  id: string; // show:guid
  show: string;
  showTitle: string;
  title: string;
  date: string; // ISO
  audio: string;
  duration: number; // segundos (0 si no se sabe)
  image: string;
  desc: string;
  link: string;
};

/* -------- Radios en directo (streaming 24/7) -------- */
export type LiveStation = {id: string; uuid: string; title: string; mood: string; desc: string; url: string; site: string};

/** Estaciones verificadas en radio-browser.info (HTTPS y activas). La URL se refresca en /api/live. */
export const STATIONS: LiveStation[] = [
  {id: 'lluvia', uuid: '95277bca-2c9a-4c08-b2e7-0854e5793f8e', title: 'Lluvia relajante', mood: 'Dormir', desc: 'Sonido de lluvia continuo para dormir o concentrarte.', url: 'https://maggie.torontocast.com:2020/stream/natureradiorain', site: 'https://www.natureradio.ca'},
  {id: 'naturaleza', uuid: 'bf5b804b-45ba-41ed-a1a7-41e0544e08e9', title: 'Radio Naturaleza', mood: 'Meditar', desc: 'Bosque, agua y aves en directo para meditar o descansar.', url: 'https://stream.zeno.fm/3ac97ysh6f0uv.aac', site: 'https://zeno.fm'},
  {id: 'naturaleza-dormir', uuid: '77eaf32d-241f-4f25-b7d6-347783cd4471', title: 'Naturaleza para dormir', mood: 'Dormir', desc: 'Sonidos suaves de la naturaleza toda la noche, sin anuncios ni voces.', url: 'https://az1.mediacp.eu/listen/natureradiosleep/radio.mp3', site: 'https://www.radio-browser.info/history/77eaf32d-241f-4f25-b7d6-347783cd4471'},
  {id: 'drone-zone', uuid: '960eb2e9-0601-11e8-ae97-52543be04c81', title: 'Drone Zone · SomaFM', mood: 'Respirar', desc: 'Ambiente profundo y lento para respiración y estiramientos.', url: 'https://ice6.somafm.com/dronezone-128-mp3', site: 'https://somafm.com/dronezone/'},
  {id: 'groove-salad', uuid: '960cf833-0601-11e8-ae97-52543be04c81', title: 'Groove Salad · SomaFM', mood: 'Caminar', desc: 'Chill-out con ritmo suave, ideal para caminar o cocinar.', url: 'https://ice4.somafm.com/groovesalad-128-mp3', site: 'https://somafm.com/groovesalad/'},
  {id: 'chillhop', uuid: 'c1484aa5-b758-47a1-b098-69db58d6fb78', title: 'Chillhop', mood: 'Concentrarte', desc: 'Lo-fi tranquilo para trabajar o leer.', url: 'https://ilm.stream18.radiohost.de/ilm_ilovechillhop_mp3-192', site: 'https://www.ilovemusic.de'},
];

/* -------- Utilidades -------- */
export function formatDuration(sec: number) {
  if (!sec || !isFinite(sec)) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const key = (x: Date) => x.toLocaleDateString('en-CA');
  const yesterday = new Date(now.getTime() - 86400000);
  if (key(d) === key(now)) return 'Hoy';
  if (key(d) === key(yesterday)) return 'Ayer';
  return d.toLocaleDateString('es-CL', {weekday: 'long', day: 'numeric', month: 'long'});
}
