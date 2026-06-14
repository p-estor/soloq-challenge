import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Chupachotas SoloQ',
  description: 'Política de privacidad de Chupachotas SoloQ Challenge.',
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem', color: 'var(--text-primary)' }}>
      <Link href="/" style={{ color: 'var(--accent-gold)', fontSize: '0.9rem', display: 'inline-block', marginBottom: '2rem' }}>
        ← Volver al inicio
      </Link>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Política de Privacidad</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Última actualización: 25 de mayo de 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>1. Información que recopilamos</h2>
          <p>
            Chupachotas SoloQ Challenge recopila únicamente datos públicos de League of Legends obtenidos a través
            de la API oficial de Riot Games. Esto incluye: nombre de invocador (Riot ID), rango, estadísticas de
            partidas clasificatorias y el icono de perfil. No recopilamos ningún dato personal identificable de los
            usuarios que visitan la web.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>2. Uso de los datos</h2>
          <p>
            Los datos recogidos se usan exclusivamente para mostrar una tabla de clasificación privada entre un
            grupo de jugadores participantes que han dado su consentimiento explícito al registrarse en el
            challenge. Los datos no se venden, comparten ni ceden a terceros.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>3. API de Riot Games</h2>
          <p>
            Esta aplicación utiliza la API de Riot Games pero no está respaldada ni patrocinada por Riot Games.
            Chupachotas SoloQ no es una aplicación oficial de Riot Games. Los datos de League of Legends son
            propiedad de Riot Games.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>4. Cookies</h2>
          <p>
            Esta aplicación no utiliza cookies de seguimiento ni publicidad. Únicamente se pueden usar cookies
            de sesión estrictamente necesarias para el funcionamiento del panel de administración.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>5. Eliminación de datos</h2>
          <p>
            Si eres un jugador registrado y deseas que tus datos sean eliminados de la plataforma, puedes
            solicitarlo contactando al administrador. Los datos serán eliminados de forma permanente en un plazo
            máximo de 7 días.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>6. Contacto</h2>
          <p>
            Para cualquier consulta relacionada con la privacidad, puedes contactar a través de la web en{' '}
            <a href="https://chupachotas.es" style={{ color: 'var(--accent-gold)' }}>chupachotas.es</a>.
          </p>
        </section>

      </div>
    </main>
  );
}
