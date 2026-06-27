import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Trophy, Award, Skull, Clock, Flame, Zap, Shield, HelpCircle, Users, Eye, EyeOff } from 'lucide-react';
import FallbackImage from '@/components/FallbackImage';
import { calculateStreakWinners } from '@/lib/achievements';
import SpecialAchievementsList from '@/components/SpecialAchievementsList';
import AchievementsPro from '@/components/AchievementsPro';
import { DDRAGON_VERSION } from '@/lib/riot';




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
  const pentaMatches = await prisma.match.findMany({
    where: { pentaKills: { gt: 0 }, isRemake: false },
    orderBy: { gameCreation: 'asc' },
    include: { player: true },
  });

  const pentaWinnersMap = new Map<string, { player: any, date: Date, championName: string, detail: string }>();
  for (const m of pentaMatches) {
    if (!pentaWinnersMap.has(m.playerId)) {
      pentaWinnersMap.set(m.playerId, {
        player: m.player,
        date: m.gameCreation,
        championName: m.championName,
        detail: `Pentakill con ${m.championName}`,
      });
    }
  }
  const pentaWinners = Array.from(pentaWinnersMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  const stealMatches = await prisma.match.findMany({
    where: { objectivesStolen: { gt: 0 }, isRemake: false },
    orderBy: { gameCreation: 'asc' },
    include: { player: true },
  });

  const stealWinnersMap = new Map<string, { player: any, date: Date, championName: string, detail: string }>();
  for (const m of stealMatches) {
    if (!stealWinnersMap.has(m.playerId)) {
      stealWinnersMap.set(m.playerId, {
        player: m.player,
        date: m.gameCreation,
        championName: m.championName,
        detail: `Robo con ${m.championName}`,
      });
    }
  }
  const stealWinners = Array.from(stealWinnersMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  const playersForStreak = await prisma.player.findMany({
    include: {
      matches: {
        where: { isRemake: false },
        orderBy: { gameCreation: 'asc' },
      }
    }
  });

  const streakWinnersData = calculateStreakWinners(playersForStreak, 10);
  const streakWinners = streakWinnersData.map(w => ({
    player: w.player,
    date: w.date,
    championName: w.championName,
    detail: `Racha con ${w.championName}`,
  }));

  // New Achievement 1: Lo mío es mío y lo tuyo también (>= 20 enemy jungle kills)
  const jungleMatches = await prisma.match.findMany({
    where: { enemyJungleMonsterKills: { gte: 20 }, isRemake: false },
    orderBy: { gameCreation: 'asc' },
    include: { player: true },
  });

  const jungleWinnersMap = new Map<string, { player: any, date: Date, championName: string, detail: string }>();
  for (const m of jungleMatches) {
    if (!jungleWinnersMap.has(m.playerId)) {
      jungleWinnersMap.set(m.playerId, {
        player: m.player,
        date: m.gameCreation,
        championName: m.championName,
        detail: `Robados ${m.enemyJungleMonsterKills} monstruos`,
      });
    }
  }
  const jungleWinners = Array.from(jungleWinnersMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  // New Achievement 2: Faro (>= 100 vision score)
  const visionMatches = await prisma.match.findMany({
    where: { visionScore: { gte: 100 }, isRemake: false },
    orderBy: { gameCreation: 'asc' },
    include: { player: true },
  });

  const visionWinnersMap = new Map<string, { player: any, date: Date, championName: string, detail: string }>();
  for (const m of visionMatches) {
    if (!visionWinnersMap.has(m.playerId)) {
      visionWinnersMap.set(m.playerId, {
        player: m.player,
        date: m.gameCreation,
        championName: m.championName,
        detail: `Puntuación de visión: ${m.visionScore}`,
      });
    }
  }
  const visionWinners = Array.from(visionWinnersMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  // New Achievement 3: Luces fuera (>= 15 wards killed)
  const wardMatches = await prisma.match.findMany({
    where: { wardsKilled: { gte: 15 }, isRemake: false },
    orderBy: { gameCreation: 'asc' },
    include: { player: true },
  });

  const wardWinnersMap = new Map<string, { player: any, date: Date, championName: string, detail: string }>();
  for (const m of wardMatches) {
    if (!wardWinnersMap.has(m.playerId)) {
      wardWinnersMap.set(m.playerId, {
        player: m.player,
        date: m.gameCreation,
        championName: m.championName,
        detail: `Destruidos ${m.wardsKilled} centinelas`,
      });
    }
  }
  const wardWinners = Array.from(wardWinnersMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

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
      title: 'Pentakill',
      description: 'Conseguir una Pentakill en el torneo.',
      icon: Skull,
      color: 'var(--accent-gold)',
      shadow: 'var(--shadow-gold)',
      winners: pentaWinners,
      status: pentaWinners.length > 0 ? 'Desbloqueado' : 'Bloqueado',
    },
    {
      id: 'baron_steal',
      title: 'Ojo de Halcón',
      description: 'Robar un Barón Nashor o Dragón Anciano (objetivo robado).',
      icon: Zap,
      color: 'var(--accent-cyan)',
      shadow: 'var(--shadow-neon)',
      winners: stealWinners,
      status: stealWinners.length > 0 ? 'Desbloqueado' : 'Bloqueado',
    },
    {
      id: 'win_streak_10',
      title: 'Imparable',
      description: 'Alcanzar una racha de 10 victorias consecutivas.',
      icon: Flame,
      color: 'var(--loss-color)',
      shadow: '0 0 20px rgba(239, 68, 68, 0.2)',
      winners: streakWinners,
      status: streakWinners.length > 0 ? 'Desbloqueado' : 'Bloqueado',
    },
    {
      id: 'enemy_jungle_stealer',
      title: 'Lo mío es mío',
      description: 'Robar 20 o más monstruos de la jungla enemiga en una sola partida.',
      icon: Shield,
      color: 'var(--accent-gold)',
      shadow: '0 0 20px rgba(200, 170, 110, 0.2)',
      winners: jungleWinners,
      status: jungleWinners.length > 0 ? 'Desbloqueado' : 'Bloqueado',
    },
    {
      id: 'vision_god',
      title: 'Faro',
      description: 'Conseguir una puntuación de visión de 100 o más en una sola partida.',
      icon: Eye,
      color: 'var(--accent-cyan)',
      shadow: '0 0 20px rgba(0, 210, 255, 0.2)',
      winners: visionWinners,
      status: visionWinners.length > 0 ? 'Desbloqueado' : 'Bloqueado',
    },
    {
      id: 'ward_slayer',
      title: 'Luces fuera',
      description: 'Destruir 15 o más centinelas (wards) enemigos en una sola partida.',
      icon: EyeOff,
      color: 'var(--accent-purple)',
      shadow: '0 0 20px rgba(168, 85, 247, 0.2)',
      winners: wardWinners,
      status: wardWinners.length > 0 ? 'Desbloqueado' : 'Bloqueado',
    },
  ];


  return (
    <main className="logros-page">
      {/* CLASSIC WRAPPER */}
      <div className="classic-wrapper">
        {/* Header */}
      <div className="logros-header">
        <Link href="/" className="logros-back-link">
          ← Volver a la Clasificación
        </Link>
        <h1 className="logros-title">
          Sala de Logros e Hitos
        </h1>
        <p className="logros-subtitle">
          Récords históricos del SoloQ Challenge calculados en tiempo real y hazañas épicas de los invocadores.
        </p>
      </div>

      {/* Grid: Récords del Servidor */}
      <h2 className="logros-section-title">
        <Trophy size={20} style={{ color: 'var(--accent-gold)' }} /> Récords del Servidor (Tiempo Real)
      </h2>

      <div className="logros-records-grid">
        {/* El más viciado */}
        <div className="glass-panel" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
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
                  src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${mostActivePlayer.profileIconId}.png`}
                  alt={mostActivePlayer.gameName}
                  width={40}
                  height={40}
                  style={{ borderRadius: '6px', border: '1px solid var(--border-normal)' }}
                  fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
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
        <div className="glass-panel" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
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
                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${topKillsMatch.championName}.png`}
                alt={topKillsMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
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
        <div className="glass-panel" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
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
                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${topDeathlessMatch.championName}.png`}
                alt={topDeathlessMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
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
        <div className="glass-panel" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
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
                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${fastestWinMatch.championName}.png`}
                alt={fastestWinMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
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
        <div className="glass-panel" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
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
                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${bestFarmerMatch.championName}.png`}
                alt={bestFarmerMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
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
        <div className="glass-panel" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
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
                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${topDeathsMatch.championName}.png`}
                alt={topDeathsMatch.championName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid var(--border-normal)' }}
                fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
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
      <h2 className="logros-section-title">
        <Award size={20} style={{ color: 'var(--accent-cyan)' }} /> Logros Especiales del Desafío
      </h2>

      {(() => {
        const serializedAchievements = exampleAchievements.map(ach => ({
          id: ach.id,
          title: ach.title,
          description: ach.description,
          color: ach.color,
          shadow: ach.shadow,
          status: ach.status,
          winners: ach.winners.map(w => ({
            player: {
              id: w.player.id,
              gameName: w.player.gameName,
              alias: w.player.alias,
              profileIconId: w.player.profileIconId,
            },
            date: w.date.toISOString(),
            championName: w.championName,
            detail: w.detail,
          }))
        }));

        return <SpecialAchievementsList achievements={serializedAchievements} />;
      })()}
      </div>

      {/* PRO WRAPPER */}
      <div className="pro-wrapper">
        {(() => {
          const serverRecords = {
            mostActive: mostActivePlayer ? { player: mostActivePlayer, maxGames } : null,
            topKills: topKillsMatch ? { player: topKillsMatch.player, kills: topKillsMatch.kills, championName: topKillsMatch.championName } : null,
            topDeathless: topDeathlessMatch ? { player: topDeathlessMatch.player, kills: topDeathlessMatch.kills, assists: topDeathlessMatch.assists, championName: topDeathlessMatch.championName } : null,
            fastestWin: fastestWinMatch ? { player: fastestWinMatch.player, gameDuration: fastestWinMatch.gameDuration, championName: fastestWinMatch.championName } : null,
            bestFarmer: bestFarmerMatch ? { player: bestFarmerMatch.player, maxCsPerMin, cs: bestFarmerMatch.cs, championName: bestFarmerMatch.championName } : null,
            topDeaths: topDeathsMatch ? { player: topDeathsMatch.player, deaths: topDeathsMatch.deaths, championName: topDeathsMatch.championName } : null,
          };

          const serializedAchievements = exampleAchievements.map(ach => ({
            id: ach.id,
            title: ach.title,
            description: ach.description,
            color: ach.color,
            shadow: ach.shadow,
            status: ach.status,
            winners: ach.winners.map(w => ({
              player: {
                id: w.player.id,
                gameName: w.player.gameName,
                alias: w.player.alias,
                profileIconId: w.player.profileIconId,
              },
              date: w.date.toISOString(),
              championName: w.championName,
              detail: w.detail,
            }))
          }));

          return <AchievementsPro serverRecords={serverRecords} achievements={serializedAchievements} />;
        })()}
      </div>
    </main>
  );
}
