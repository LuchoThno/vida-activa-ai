import type { Metadata, Viewport } from 'next';
import './style.css';
import './pwa.css';
import PWAClient from './PWAClient';

export const metadata: Metadata = {
  title: 'Vida Activa AI | Alimentación y movimiento',
  description: 'Explora recetas, ejercicios, registra tu progreso y escucha motivación en español.',
  applicationName: 'Vida Activa AI',
  appleWebApp: { capable: true, title: 'Vida Activa', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/pwa-icon/192', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/pwa-icon/180', sizes: '180x180', type: 'image/png' }]
  }
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#438f74'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}<PWAClient /></body></html>;
}
