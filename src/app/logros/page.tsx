import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Trophy, Award, Skull, Clock, Flame, Zap, Shield, HelpCircle, Users } from 'lucide-react';
import FallbackImage from '@/components/FallbackImage';
import { calculateFirstToStreak } from '@/lib/achievements';


export const revalidate = 60; // Revalidate this page every 60 seconds

export const metadata: Metadata = {
  title: 'Logros y Récords | Chupachotas SoloQ',
  description: 'Logros, medallas e hitos de los invocadores en el SoloQ Challenge.',
};

export default async function AchievementsPage() {
  // 1. Fetch data for real achievements / records from the DB

  // A. El más Viciado (Player with most games played in the challenge)
  const matchesCountByPlayer = await prisma.match.groupBy({
    by: ['playerId'],
    where: { isRemake: false },
    _count: {
      id: true,
    },
  });

  let mostActivePlayer = null;
  let maxGames = 0;

  if (matchesCountByPlayer.length > 0) {
    const sortedActive = [...matchesCountByPlayer].sort((a, b) => b._count.id - a._count.id);
    const topActive = sortedActive[0];
    mostActivePlayer = await prisma.player.findUnique({ where: { id: topActive.playerId } });
    maxGames = topActive._count.id;
  }

  // B. El Terror de la Grieta (Highest kills in a single match)
  const topKillsMatch = await prisma.match.findFirst({
    where: { isRemake: false },
    orderBy: { kills: 'desc' },
    include: { player: true },
  });

  // C. El Inmortal (Best deathless game win)
  const topDeathlessMatch = await prisma.match.findFirst({
    where: { deaths: 0, win: true, isRemake: false },
    orderBy: { kills: 'desc' },
    include: { player: true },
  });

  // D. El Speedrunner (Fastest win, duration > 900s to avoid remakes)
  const fastestWinMatch = await prisma.match.findFirst({
    where: { win: true, gameDuration: { gt: 900 }, isRemake: false },
    orderBy: { gameDuration: 'asc' },
    include: { player: true },
  });

  // E. El Farmer del Año (Highest CS per minute, game duration > 900s)
  const allMatches = await prisma.match.findMany({
    where: { gameDuration: { gt: 900 }, isRemake: false },
    include: { player: true },
  });
  
  let bestFarmerMatch = null;
  let maxCsPerMin = 0;
  for (const match of allMatches) {
    const csPerMin = match.cs / (match.gameDuration / 60);
    if (csPerMin > maxCsPerMin) {
      maxCsPerMin = csPerMin;
      bestFarmerMatch = match;
    }
  }

  // F. El Sacrificado (Most deaths in a single match)
  const topDeathsMatch = await prisma.match.findFirst({
    where: { isRemake: false },
    orderBy: { deaths: 'desc' },
    include: { player: true },
  });

  // Helper to format match duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // 2. Fetch special achievements status dynamically from the database
  const firstPentaMatch = await prisma.match.findFirst({
    where: { pentaKills: { gt: 0 }, isRemake: false },
    orderBy: { gameCreation: 'asc' },
    include: { player: true },
  });

  const firstStealMatch = await prisma.match.findFirst({
    where: { objectivesStolen: { gt: 0 }, isRemake: false },
    orderBy: { gameCreation: 'asc' },
    include: { player: true },
  });

  const playersForStreak = await prisma.player.findMany({
    include: {
      matches: {
        where: { isRemake: false },
        orderBy: { gameCreation: 'asc' },
      }
    }
  });

  const { player: streakWinner, date: streakDate } = calculateFirstToStreak(playersForStreak, 10);


  // Helper to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exampleAchievements = [
    {
      id: 'penta_1',
      title: 'Primera Pentakill',
      description: '¡Conseguir la primera Pentakill de todo el torneo!',
      icon: Skull,
      color: 'var(--accent-gold)',
      shadow: 'var(--shadow-gold)',
      unlockedBy: firstPentaMatch ? (firstPentaMatch.player.alias || firstPentaMatch.player.gameName) : null,
      detail: firstPentaMatch 
        ? `Desbloqueado el ${formatDate(firstPentaMatch.gameCreation)} con ${firstPentaMatch.championName}` 
        : 'Recompensa especial en el servidor',
      status: firstPentaMatch ? 'Desbloqueado' : 'Bloqueado',
    },
    {
      id: 'baron_steal',
      title: 'Ojo de Halcón',
      description: 'Robar un Barón Nashor o Dragón Anciano de forma heroica (objetivos robados).',
      icon: Zap,
      color: 'var(--accent-cyan)',
      shadow: 'var(--shadow-neon)',
      unlockedBy: firstStealMatch ? (firstStealMatch.player.alias || firstStealMatch.player.gameName) : null,
      detail: firstStealMatch 
        ? `Desbloqueado el ${formatDate(firstStealMatch.gameCreation)} con ${firstStealMatch.championName}` 
        : 'Recompensa especial en el servidor',
      status: firstStealMatch ? 'Desbloqueado' : 'Bloqueado',
    },
    {
      id: 'win_streak_10',
      title: 'Imparable',
      description: 'Alcanzar una racha de 10 victorias consecutivas.',
      icon: Flame,
      color: 'var(--loss-color)',
      shadow: 'rgba(239, 68, 68, 0.2)',
      unlockedBy: streakWinner ? (streakWinner.alias || streakWinner.gameName) : null,
      detail: streakWinner && streakDate
        ? `Desbloqueado el ${formatDate(streakDate)}` 
        : 'Recompensa especial en el servidor',
      status: streakWinner ? 'Desbloqueado' : 'Bloqueado',
    },
  ];

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', transition: 'opacity 0.2s' }}>
          ← Volver a la Clasificación
        </Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, var(--text-primary), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Sala de Logros e Hitos
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Récords históricos del SoloQ Challenge calculados en tiempo real y hazañas épicas de los invocadores.
        </p>
      </div>

      {/* Grid: Récords del Servidor */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-normal)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Trophy size={20} style={{ color: 'var(--accent-gold)' }} /> Récords del Servidor (Tiempo Real)
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '4rem'
      }}>
        {/* El más viciado */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(0, 210, 255, 0.08)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 210, 255, 0.15)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Flame size={12} /> ACTIVIDAD
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Récord de Partidas</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>El Más Viciado</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              El invocador que más veces ha entrado a la Grieta del Invocador durante este SoloQ Challenge.
            </p>
          </div>
          {mostActivePlayer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5, 8, 12, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-normal)' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', position: 'relative' }}>
                <FallbackImage
                  src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/${mostActivePlayer.profileIconId}.png`}
                  alt={mostActivePlayer.gameName}
                  width={40}
                  height={40}
                  style={{ borderRadius: '6px', border: '1px solid var(--border-normal)' }}
                  fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {mostActivePlayer.alias || mostActivePlayer.gameName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {maxGames} partidas jugadas
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin datos aún</div>
          )}
        </div>

        {/* Terror de la Grieta */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--loss-color)', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Skull size={12} /> COMBATE
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Más Asesinatos</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>El Terror de la Grieta</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              La partida individual con el número más alto de asesinatos conseguidos por un jugador.
            </p>
          </div>
          {topKillsMatch ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5, 8, 12, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-normal)' }}>
              <FallbackImage
                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${topKillsMatch.championName}.png`}
                alt={topKillsMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {topKillsMatch.player.alias || topKillsMatch.player.gameName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--loss-color)', fontWeight: 600 }}>
                  {topKillsMatch.kills} asesinatos ({topKillsMatch.championName})
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin datos aún</div>
          )}
        </div>

        {/* El Inmortal */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--win-color)', border: '1px solid rgba(16, 185, 129, 0.15)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Shield size={12} /> CONTROL
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Partida Perfecta</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>El Inmortal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              La victoria más destacada con cero muertes en el marcador personal del invocador.
            </p>
          </div>
          {topDeathlessMatch ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5, 8, 12, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-normal)' }}>
              <FallbackImage
                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${topDeathlessMatch.championName}.png`}
                alt={topDeathlessMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {topDeathlessMatch.player.alias || topDeathlessMatch.player.gameName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--win-color)', fontWeight: 600 }}>
                  {topDeathlessMatch.kills}/0/{topDeathlessMatch.assists} ({topDeathlessMatch.championName})
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin datos aún</div>
          )}
        </div>

        {/* El Speedrunner */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.08)', color: 'var(--accent-purple)', border: '1px solid rgba(168, 85, 247, 0.15)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} /> VELOCIDAD
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Victoria más Rápida</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>El Speedrunner</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              La victoria más rápida lograda en el servidor (excluyendo remakes menores a 15 min).
            </p>
          </div>
          {fastestWinMatch ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5, 8, 12, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-normal)' }}>
              <FallbackImage
                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${fastestWinMatch.championName}.png`}
                alt={fastestWinMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {fastestWinMatch.player.alias || fastestWinMatch.player.gameName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                  {formatDuration(fastestWinMatch.gameDuration)} ({fastestWinMatch.championName})
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin datos aún</div>
          )}
        </div>

        {/* El Farmer del Año */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(200, 170, 110, 0.08)', color: 'var(--accent-gold)', border: '1px solid rgba(200, 170, 110, 0.15)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Award size={12} /> HABILIDAD
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mayor CS/min</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>El Farmer del Año</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              La partida con el promedio más alto de súbditos asesinados por minuto.
            </p>
          </div>
          {bestFarmerMatch ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5, 8, 12, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-normal)' }}>
              <FallbackImage
                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${bestFarmerMatch.championName}.png`}
                alt={bestFarmerMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {bestFarmerMatch.player.alias || bestFarmerMatch.player.gameName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  {maxCsPerMin.toFixed(1)} CS/min ({bestFarmerMatch.cs} CS en total)
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin datos aún</div>
          )}
        </div>

        {/* El Sacrificado */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--loss-color)', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <HelpCircle size={12} /> HUMOR
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Más Muertes</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>El Sacrificado</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              La partida individual donde un invocador sumó más muertes en su contador personal.
            </p>
          </div>
          {topDeathsMatch ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(5, 8, 12, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-normal)' }}>
              <FallbackImage
                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${topDeathsMatch.championName}.png`}
                alt={topDeathsMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {topDeathsMatch.player.alias || topDeathsMatch.player.gameName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--loss-color)', fontWeight: 600 }}>
                  {topDeathsMatch.deaths} muertes ({topDeathsMatch.championName})
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin datos aún</div>
          )}
        </div>
      </div>

      {/* Grid: Logros Ficticios/Ejemplo */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-normal)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={20} style={{ color: 'var(--accent-cyan)' }} /> Logros Especiales del Desafío
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {exampleAchievements.map((achievement) => {
          const IconComponent = achievement.icon;
          const isUnlocked = achievement.status === 'Desbloqueado';
          return (
            <div
              key={achievement.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                gap: '1.25rem',
                opacity: isUnlocked ? 1 : 0.5,
                border: isUnlocked ? `1px solid ${achievement.color}33` : '1px solid var(--border-normal)',
                boxShadow: isUnlocked ? achievement.shadow : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '12px',
                background: isUnlocked ? `${achievement.color}15` : 'rgba(255, 255, 255, 0.03)',
                color: isUnlocked ? achievement.color : 'var(--text-muted)',
                border: isUnlocked ? `1px solid ${achievement.color}30` : '1px solid var(--border-normal)',
                flexShrink: 0,
              }}>
                <IconComponent size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{achievement.title}</h3>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: isUnlocked ? 'var(--win-color)' : 'var(--text-muted)' }}>
                      {achievement.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                    {achievement.description}
                  </p>
                </div>
                {isUnlocked ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-normal)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    Desbloqueado por: <strong style={{ color: 'var(--text-primary)' }}>{achievement.unlockedBy}</strong>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--accent-gold)', marginTop: '0.1rem' }}>{achievement.detail}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-normal)', paddingTop: '0.5rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {achievement.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
