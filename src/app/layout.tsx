import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Trophy, Award, Swords } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';


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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('chupachotas-theme');
                  if (savedTheme === 'pro') {
                    document.documentElement.setAttribute('data-theme', 'pro');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <header className="main-header">
          <div className="nav-container">
            <Link href="/" className="logo-section">
              <svg viewBox="0 0 40 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon animate-pulse-glow" aria-hidden="true">
                <polygon points="20,2 38,20 20,20 2,20" fill="var(--accent-cyan)"/>
                <polygon points="20,22 38,22 20,40 2,22" fill="var(--accent-purple)"/>
              </svg>
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
              <a 
                href={process.env.NEXT_PUBLIC_TRACKER_URL || 'https://tracker.chupachotas.es'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="nav-link"
              >
                <Swords className="nav-link-icon" /> Tracker
              </a>
              <a 
                href="https://paypal.me/pestordev" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="nav-link nav-donate-btn"
              >
                ☕ Donar
              </a>
              
              <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
                <ThemeSwitcher />
              </div>
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
