import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos de Servicio | Chupachotas SoloQ',
  description: 'Términos de servicio de Chupachotas SoloQ Challenge.',
};

export default function TosPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem', color: 'var(--text-primary)' }}>
      <Link href="/" style={{ color: 'var(--accent-gold)', fontSize: '0.9rem', display: 'inline-block', marginBottom: '2rem' }}>
        ← Volver al inicio
      </Link>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Términos de Servicio</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Última actualización: 25 de mayo de 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>1. Descripción del servicio</h2>
          <p>
            Chupachotas SoloQ Challenge es una aplicación web privada que muestra una tabla de clasificación de
            League of Legends para un grupo cerrado de jugadores. El acceso a los datos es público y de solo
            lectura. La gestión de jugadores está restringida al administrador.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>2. Uso aceptable</h2>
          <p>
            Al acceder a esta plataforma, el usuario acepta no intentar acceder a funcionalidades restringidas,
            no realizar scraping masivo de datos, y no utilizar la información mostrada con fines comerciales.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>3. Propiedad intelectual</h2>
          <p>
            Los activos de League of Legends (imágenes de campeones, iconos, nombres) son propiedad de Riot Games.
            Esta aplicación los usa dentro del marco permitido por la API de Riot Games para desarrolladores.
            El código y el diseño propio de la plataforma son propiedad del autor.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>4. Exención de responsabilidad</h2>
          <p>
            Los datos mostrados dependen de la disponibilidad de la API de Riot Games y pueden no estar
            actualizados en todo momento. El administrador no se hace responsable de decisiones tomadas
            basándose en los datos mostrados en la plataforma.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>5. Modificaciones</h2>
          <p>
            El administrador se reserva el derecho de modificar estos términos en cualquier momento.
            Los cambios serán efectivos desde el momento de su publicación en esta página.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>6. Riot Games</h2>
          <p>
            Chupachotas SoloQ no está respaldado ni patrocinado por Riot Games. Para consultar los
            términos de uso de la API de Riot Games, visita{' '}
            <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)' }}>
              developer.riotgames.com
            </a>.
          </p>
        </section>

      </div>
    </main>
  );
}
