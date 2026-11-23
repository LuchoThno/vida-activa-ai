import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Vida Activa AI — Bienestar y hábitos',
    short_name: 'Vida Activa',
    description: 'Recetas, ejercicios, seguimiento de progreso y motivación en español.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fbfcfa',
    theme_color: '#438f74',
    lang: 'es-CL',
    categories: ['health', 'fitness', 'lifestyle'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  };
}
