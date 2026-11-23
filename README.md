# Vida Activa — MVP web

Aplicación responsive con Next.js App Router y TypeScript para registrar peso, explorar recetas y ejercicios publicados en la web, y seguir una rutina suave de 7 días.

## Inicio

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para producción, `npm run build && npm start`, o importa el repositorio en Vercel.

## Fuentes externas

- **TheMealDB**: `/api/recipes?q=chicken` obtiene resultados, imágenes, ingredientes, instrucciones y enlaces reales a YouTube cuando la fuente los publica. Usa API pública de demostración; verifica licencias/condiciones antes de monetizar.
- **wger**: `/api/exercises` obtiene la colección pública con traducciones y medios según disponibilidad. Si no responde, se muestran 3 ejercicios locales explícitamente identificados como respaldo.

No se realiza scraping de sitios arbitrarios. Las URL externas se conservan como enlaces y los medios de terceros se cargan desde origen. Nunca se inventan calorías, videos, ni métricas.

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
4. No se requieren variables de entorno para la versión inicial.
5. Revisar `/api/recipes?q=chicken` y `/api/exercises` en la URL publicada. Las fuentes externas pueden estar temporalmente inaccesibles.
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
