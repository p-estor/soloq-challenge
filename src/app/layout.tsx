import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Trophy, ShieldAlert, Award } from 'lucide-react';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chupachotas SoloQ Challenge',
  description: 'Clasificación en tiempo real del SoloQ Challenge del servidor de Discord Chupachotas.',
  metadataBase: new URL('https://www.chupachotas.es'),
  openGraph: {
    title: 'Chupachotas SoloQ Challenge',
    description: 'Clasificación en tiempo real del SoloQ Challenge del servidor de Discord Chupachotas.',
    url: 'https://www.chupachotas.es',
    siteName: 'Chupachotas SoloQ Challenge',
    images: [
      {
        url: '/logo.png',
        width: 275,
        height: 275,
        alt: 'Chupachotas SoloQ Challenge Logo',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Chupachotas SoloQ Challenge',
    description: 'Clasificación en tiempo real del SoloQ Challenge del servidor de Discord Chupachotas.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={outfit.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <header className="main-header">
          <div className="nav-container">
            <Link href="/" className="logo-section">
              <Trophy className="logo-icon animate-pulse-glow" />
              <div className="logo-text">
                <span className="logo-highlight">CHUPACHOTAS</span>
                <span className="logo-sub">SOLOQ CHALLENGE</span>
              </div>
            </Link>
            
            <nav className="nav-links">
              <Link href="/" className="nav-link">
                <Trophy className="nav-link-icon" /> Clasificación
              </Link>
              <Link href="/logros" className="nav-link">
                <Award className="nav-link-icon" /> Logros
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="app-container">
          {children}
        </main>
        
        <footer className="main-footer">
          <p>© {new Date().getFullYear()} Chupachotas SoloQ Challenge. Todos los derechos reservados.</p>
          <p className="footer-credits">Desarrollado con pasión para League of Legends EUW</p>
        </footer>
      </body>
    </html>
  );
}
