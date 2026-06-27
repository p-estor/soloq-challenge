import React from 'react';
import { prisma } from '@/lib/db';
import { getGlobalLp, DDRAGON_VERSION } from '@/lib/riot';
import LeaderboardTable, { ProcessedPlayer, ProcessedMatch } from '@/components/LeaderboardTable';
import LeaderboardPro from '@/components/LeaderboardPro';
import { Users, Swords, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import FallbackImage from '@/components/FallbackImage';
import Countdown from '@/components/Countdown';

export const revalidate = 60; // Revalidate this page every 60 seconds

// Translate rank tiers to Spanish
function translateTier(tier: string): string {
  const normTier = tier.toUpperCase();
  const translations: Record<string, string> = {
    IRON: 'Hierro',
    BRONZE: 'Bronce',
    SILVER: 'Plata',
    GOLD: 'Oro',
    PLATINUM: 'Platino',
    EMERALD: 'Esmeralda',
    DIAMOND: 'Diamante',
    MASTER: 'Master',
    GRANDMASTER: 'Grandmaster',
    CHALLENGER: 'Challenger',
    UNRANKED: 'Sin Clasificar'
  };
  return translations[normTier] || tier;
}

// Time ago helper
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'Hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export default async function LeaderboardPage() {
  // 1. Fetch players and recent matches from DB
  const rawPlayers = await prisma.player.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const rawMatches = await prisma.match.findMany({
    orderBy: { gameCreation: 'desc' },
    take: 50,
    include: {
      player: {
        select: {
          gameName: true,
          alias: true,
          tagLine: true,
        },
      },
    },
  });

  const totalMatchesCount = rawPlayers.reduce((sum, p) => sum + p.wins + p.losses, 0);

  // 2. Process player stats
  const processedPlayers: ProcessedPlayer[] = rawPlayers.map((player) => {
    const currentGlobalLp = getGlobalLp(player.tier, player.rank, player.leaguePoints);
    const startGlobalLp = getGlobalLp(player.startTier, player.startRank, player.startLp);
    const progressLp = currentGlobalLp - startGlobalLp;
    
    const totalGames = player.wins + player.losses;
    const winrate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0;

    return {
      id: player.id,
      gameName: player.gameName,
      tagLine: player.tagLine,
      alias: player.alias,
      puuid: player.puuid,
      profileIconId: player.profileIconId,
      tier: player.tier,
      rank: player.rank,
      leaguePoints: player.leaguePoints,
      wins: player.wins,
      losses: player.losses,
      streak: player.streak,
      startTier: player.startTier,
      startRank: player.startRank,
      startLp: player.startLp,
      lastUpdated: player.lastUpdated.toISOString(),
      currentGlobalLp,
      startGlobalLp,
      progressLp,
      winrate,
      isHighElo: player.isHighElo,
    };
  });

  const processedMatches = rawMatches.map((match) => ({
    id: match.id,
    matchId: match.matchId,
    playerId: match.playerId,
    championId: match.championId,
    championName: match.championName,
    win: match.win,
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    cs: match.cs,
    gameDuration: match.gameDuration,
    gameCreation: match.gameCreation.toISOString(),
    queueId: match.queueId,
    isRemake: match.isRemake,
    player: {
      gameName: match.player.gameName,
      alias: match.player.alias,
      tagLine: match.player.tagLine,
    },
  }));

  // Sort processed players by rank descending for displaying top indicators
  const sortedByRank = [...processedPlayers].sort((a, b) => {
    if (b.currentGlobalLp !== a.currentGlobalLp) {
      return b.currentGlobalLp - a.currentGlobalLp;
    }
    const netA = a.wins - a.losses;
    const netB = b.wins - b.losses;
    if (netB !== netA) {
      return netB - netA;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return b.winrate - a.winrate;
  });

  const sortedByClimb = [...processedPlayers].sort((a, b) => {
    if (b.progressLp !== a.progressLp) {
      return b.progressLp - a.progressLp;
    }
    const netA = a.wins - a.losses;
    const netB = b.wins - b.losses;
    if (netB !== netA) {
      return netB - netA;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return b.winrate - a.winrate;
  });

  const topRankPlayer = sortedByRank[0];
  const topClimber = sortedByClimb[0];

  return (
    <>
    <div>
      <Countdown 
        targetDate="2026-07-07T23:59:59" 
        eventName="SoloQ Challenge" 
        title="Fin del SoloQ Challenge"
        badgeText="7 de Julio, 2026 - 23:59"
      />

      {/* Hero Stats Section */}
      <div className="hero-stats-section">

        {/* Leader Hero Card */}
        <div className="glass-panel leader-hero-card">
          <div className="leader-hero-tag">👑 Líder Actual</div>
          {topRankPlayer ? (
            <div className="leader-hero-body">
              <FallbackImage
                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${topRankPlayer.profileIconId}.png`}
                alt={topRankPlayer.alias || topRankPlayer.gameName}
                width={72}
                height={72}
                className="leader-hero-icon"
                fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
              />
              <div className="leader-hero-info">
                <div className="leader-hero-name">
                  {topRankPlayer.alias || topRankPlayer.gameName}
                </div>
                <div className="leader-hero-riotid">
                  {topRankPlayer.gameName}#{topRankPlayer.tagLine}
                </div>
                <div className="leader-hero-rank">
                  {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(topRankPlayer.tier.toUpperCase())
                    ? topRankPlayer.tier
                    : `${translateTier(topRankPlayer.tier)} ${topRankPlayer.rank}`}
                  {' · '}
                  <span className="leader-hero-lp mono">{topRankPlayer.leaguePoints} LP</span>
                </div>
              </div>
              <div className="leader-hero-stats">
                <div className="leader-hero-stat">
                  <span className="leader-stat-label">Progreso</span>
                  <span className={`leader-stat-value mono ${topRankPlayer.progressLp >= 0 ? 'climb-positive' : 'climb-negative'}`}>
                    {topRankPlayer.progressLp >= 0 ? '+' : ''}{topRankPlayer.progressLp} LP
                  </span>
                </div>
                <div className="leader-hero-stat">
                  <span className="leader-stat-label">Récord</span>
                  <span className="leader-stat-value mono">
                    <span style={{ color: 'var(--win-color)' }}>{topRankPlayer.wins}V</span>
                    {' '}
                    <span style={{ color: 'var(--loss-color)' }}>{topRankPlayer.losses}D</span>
                  </span>
                </div>
                <div className="leader-hero-stat">
                  <span className="leader-stat-label">Winrate</span>
                  <span className="leader-stat-value mono">{topRankPlayer.winrate}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="leader-hero-empty">Sin datos del líder</div>
          )}
        </div>

        {/* Mini Stats Column */}
        <div className="mini-stats-column">
          <div className="glass-panel mini-stat-card">
            <div className="stat-icon-wrapper"><Users size={18} /></div>
            <div className="stat-info">
              <span className="stat-label">Participantes</span>
              <span className="stat-value mono">{processedPlayers.length}</span>
            </div>
          </div>

          <div className="glass-panel mini-stat-card">
            <div className="stat-icon-wrapper"><Swords size={18} /></div>
            <div className="stat-info">
              <span className="stat-label">Partidas Jugadas</span>
              <span className="stat-value mono">{totalMatchesCount}</span>
            </div>
          </div>

          <div className="glass-panel mini-stat-card">
            <div className="stat-icon-wrapper" style={{ color: 'var(--win-color)', borderColor: 'rgba(16,185,129,0.3)' }}>
              <TrendingUp size={18} />
            </div>
            <div className="stat-info" style={{ minWidth: 0 }}>
              <span className="stat-label">Máx. Escalador</span>
              <span className="stat-value" style={{ fontSize: '1rem', minWidth: 0 }}>
                {topClimber && topClimber.progressLp > 0 ? (
                  <>
                    <span className="stat-value-name">{topClimber.alias || topClimber.gameName}</span>
                    <span className="mono" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--win-color)' }}>
                      +{topClimber.progressLp} LP
                    </span>
                  </>
                ) : 'Nadie'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Sistema de renderizado dual basado en CSS wrappers */}
      <div className="classic-wrapper">
        <LeaderboardTable players={processedPlayers} matches={processedMatches} />
      </div>
      <div className="pro-wrapper">
        <LeaderboardPro players={processedPlayers} matches={processedMatches} />
      </div>
    </div>

    {/* Footer */}
    <footer style={{
      marginTop: '3rem',
      paddingBottom: '2rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/privacy" className="footer-link">Política de Privacidad</Link>
        <span style={{ color: 'var(--border-color)', fontSize: '0.8rem' }}>·</span>
        <Link href="/tos" className="footer-link">Términos de Servicio</Link>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.6, margin: 0 }}>
        Chupachotas SoloQ no está respaldado por Riot Games. Los datos de League of Legends son propiedad de Riot Games.
      </p>
    </footer>
    </>
  );
}
