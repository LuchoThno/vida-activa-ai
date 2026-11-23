# Vida Activa — MVP web

Aplicación responsive con Next.js App Router y TypeScript para registrar peso, explorar recetas y ejercicios publicados en la web, y seguir una rutina suave de 7 días.

## Inicio

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para producción, `npm run build && npm start`, o importa el repositorio en Vercel.

## Fuentes externas (todo en español)

- **Recetas — TheMealDB + traducción automática**: `/api/recipes?q=salmón` acepta búsquedas en español (diccionario de ingredientes y categorías + traducción de palabras desconocidas), consulta la web y devuelve títulos traducidos. `/api/recipes/{id}` entrega la receta completa traducida (ingredientes con medidas, pasos numerados, foto, video de YouTube y fuente). `/api/recipes/random` da una receta sorpresa. Se suman las recetas originales de Vida Activa.
  - Traducción: OpenAI (`OPENAI_API_KEY`) si está configurada; si no, MyMemory (gratuito). Cada fragmento se guarda en la caché de Vercel 30 días, así cada receta se traduce una sola vez. `MYMEMORY_EMAIL` amplía la cuota gratuita.
- **Ejercicios — wger.de en español**: `/api/exercises?q=&category=&bodyweight=1&page=` usa las ~650 traducciones oficiales al español de la comunidad wger, con imagen, video, categoría y equipamiento en español, búsqueda, filtros y paginación (caché 24 h). Licencia CC-BY-SA.

## Programa de metas y contador de calorías

- **Mi programa** (`lib/program.ts`): asistente que calcula calorías diarias (Mifflin-St Jeor, déficit máximo de 500 kcal y mínimo de 1.200/1.500 kcal), proteínas, carbohidratos, grasas, agua y pasos; arma la semana de entrenamiento según días, minutos, nivel, lugar y molestias (rodillas, espalda, hombros, corazón); hábitos diarios, hitos cada 4 semanas, fases de progresión y puntaje de cumplimiento con racha. No acepta metas bajo un IMC de 18,5 ni menores de 18 años.
- **Calorías**: registro por comida (desayuno, almuerzo, once, cena, colaciones) con ~90 alimentos chilenos comunes (`lib/foods.ts`) + productos envasados de Open Food Facts (`/api/foods`), lector de código de barras en Android/Chrome, entrada manual y tendencia de 7 días.
- Se guarda en la columna `extras` (jsonb) de `wellness_data`. Si la columna no existe, la app guarda en el dispositivo y avisa. Migración: `alter table public.wellness_data add column if not exists extras jsonb not null default '{}'::jsonb;`

## Videos dentro de la app

- Reproductor integrado (YouTube sin cookies o MP4 de wger). Las recetas usan el video de TheMealDB; las guías iniciales y el programa tienen videos en español seleccionados.
- Opcional `YOUTUBE_API_KEY` (YouTube Data API v3, gratuita): busca y reproduce dentro de la app un video en español para cualquier ejercicio que no tenga uno propio.

## Voz natural

- Motor propio (`lib/speech.ts`): elige la voz en español más natural del dispositivo (voces “Natural/Online” de Edge, “Mejoradas/Premium” de Apple, Google español) y descarta voces robóticas; velocidad pausada por defecto (0,85) y ajustable; lee frase por frase con pausas naturales; normaliza medidas (“1/2 taza” → “media taza”, “2×8” → “2 series de 8”, “25–30 min” → “25 a 30 minutos”).
- Barra de audio flotante con pausa/continuar, progreso y ajustes de voz (se guardan en el dispositivo).
- **Voz IA opcional**: con `OPENAI_API_KEY` en Vercel se activa `/api/tts` (gpt-4o-mini-tts, voz cálida y pausada en español). Solo para usuarios con sesión iniciada y con límite por minuto. Si falla, se usa la voz del dispositivo.

## Datos y seguridad

- Registro de peso, favoritos y sesiones en `localStorage`, sin cuentas ni envío al servidor. No se incluyen registros de peso precargados: cada persona comienza sin mediciones y puede guardar sus propios datos en su navegador.
- Las rutas de API tienen timeout, consultas acotadas y caché. En producción agregar control de tráfico/rate limiting, observabilidad, consentimiento y políticas de privacidad.
- Es una herramienta de bienestar, no prescribe dietas médicas. Los ejercicios son orientativos y se recomienda evaluación clínica según riesgo individual.
- Calorías y macronutrientes se muestran **no disponibles** cuando la fuente no los proporciona verificados.

## Próximas tareas en Codex

1. Autenticación (Clerk o Auth.js) y almacenamiento privado por usuario en PostgreSQL con consentimiento.
2. Editar y personalizar el plan semanal por nivel, lesiones y aprobación del médico; añadir adaptación progresiva.
3. Integrar base nutricional confiable (USDA FoodData Central u otra API licenciada) con unidades, porciones y atribución.
4. Crear buscador en español y etiquetas dietarias; traducción visible sin alterar los datos fuente.
5. Añadir filtros por dificultad y equipamiento a wger, paginación real y atribución/licencias de medios.
6. Tests de rutas, seguridad, accesibilidad, privacidad y gestión de fallas de API.

## Despliegue en Vercel

1. Subir el contenido de esta carpeta (con `package.json` en la raíz del repositorio) a GitHub.
2. En https://vercel.com/new importar el repositorio.
3. Framework: `Next.js`, Root Directory: `./`, Build Command: `npm run build`.
4. Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; opcionales `OPENAI_API_KEY` (voz IA y mejor traducción) y `MYMEMORY_EMAIL`.
5. Revisar `/api/recipes?q=pollo` y `/api/exercises` en la URL publicada. Las fuentes externas pueden estar temporalmente inaccesibles.
6. Antes de agregar usuarios, peso u otra información personal en servidor, implementar cuentas, privacidad y medidas de seguridad.

En Netlify también puede importarse el mismo repositorio con el soporte oficial de Next.js. No usar despliegue estático (`output: export`) porque se necesitan rutas de API.

## Motivación y podcasts en español

- Nueva pestaña **Motivación y audio** con seis reflexiones originales sobre hábitos, constancia y autocompasión, relacionadas con ideas de autores reconocidos sin atribuirles citas textuales inventadas.
- Botón **Escuchar mensaje** con síntesis de voz `SpeechSynthesis` del navegador, y botones de detener/cambiar mensaje. Depende de voces instaladas en el equipo; si no se ofrece síntesis, el texto permanece accesible. No requiere API de voz ni envía el mensaje a nuestro servidor (la implementación concreta de voces depende del navegador/SO).
- Directorio de podcasts oficiales: Entiende tu mente, Psicología al Desnudo y Se Regalan Dudas. Los enlaces abren las plataformas originales, sin descargar ni redistribuir audio protegido.
- Mejoras futuras: selección de voz/velocidad, episodios con RSS permitido y embeds oficiales tras revisar licencias, favoritos personales y accesibilidad.


## Instalar como app en iPhone y Android (PWA)

Tras desplegar en **HTTPS** (por ejemplo Vercel), abrir la URL:

- **iPhone:** Safari → Compartir → **Agregar a pantalla de inicio** → Agregar. Se abre en modo app y con su propio icono.
- **Android:** Chrome → menú ⋮ → **Instalar aplicación** o **Agregar a pantalla principal**. Puede mostrarse también el botón «📲 Instalar app».
- **Escritorio:** navegadores compatibles pueden mostrar la opción de instalar.

Se incluyeron `app/manifest.ts`, iconos PNG generados dinámicamente (`/pwa-icon/180`, `/pwa-icon/192`, `/pwa-icon/512`), `public/sw.js`, `app/offline/page.tsx` y un botón de instalación con guía para iOS.

**Conexión:** el service worker guarda una versión pública básica de inicio y la página sin conexión; no almacena respuestas de las APIs ni datos personales. Las recetas, imágenes, videos, podcasts y datos nuevos requieren conexión. El peso y los hábitos continúan guardados localmente en cada dispositivo; **no se sincronizan entre iPhone y Android**.

### Comprobaciones de publicación
1. `npm install && npm run build`
2. Abrir `/manifest.webmanifest` y revisar los iconos `/pwa-icon/192`, `/pwa-icon/512`, `/pwa-icon/180`
3. Confirmar que `/sw.js` responde correctamente por HTTPS
4. En Android revisar Chrome → Instalar aplicación; en iPhone Safari → Agregar a pantalla de inicio
5. Activar modo avión tras haber visitado la app y confirmar la pantalla offline; volver a internet para recetas/videos
