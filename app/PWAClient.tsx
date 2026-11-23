'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export default function PWAClient() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const standalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & {standalone?: boolean}).standalone));
    setInstalled(standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); setShowHelp(false); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') setPromptEvent(null);
    } else {
      setShowHelp(true);
    }
  }

  return (
    <div className="pwa-install-widget">
      <button className="pwa-install-btn" type="button" onClick={install} aria-label="Instalar Vida Activa en el celular">📲 Instalar app</button>
      {showHelp && (
        <div className="pwa-install-dialog" role="dialog" aria-modal="true" aria-label="Cómo instalar Vida Activa">
          <button type="button" className="pwa-install-close" onClick={() => setShowHelp(false)} aria-label="Cerrar">×</button>
          <strong>Instala Vida Activa AI</strong>
          {isIOS ? (
            <p>En tu iPhone, abre esta página en <b>Safari</b>, toca <b>Compartir</b> y selecciona <b>Agregar a pantalla de inicio</b>.</p>
          ) : (
            <p>En Android, abre esta página en <b>Chrome</b>, pulsa el menú <b>⋮</b> y elige <b>Instalar aplicación</b> o <b>Agregar a pantalla principal</b>.</p>
          )}
          <p className="pwa-install-note">Necesitas HTTPS y una primera visita con conexión. Las recetas, imágenes y videos externos requieren internet.</p>
        </div>
      )}
    </div>
  );
}
