import type {Metadata} from 'next';
import './style.css';
export const metadata: Metadata={title:'Vida Activa | Alimentación y movimiento',description:'Explora recetas, ejercicios y registra tu progreso con fuentes verificables.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
