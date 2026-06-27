import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getGlobalLp, DDRAGON_VERSION } from '@/lib/riot';
import TierIcon from '@/components/TierIcon';
import { Swords, Award, TrendingUp, Calendar, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import FallbackImage from '@/components/FallbackImage';
import PlayerStatsAndMatches from '@/components/PlayerStatsAndMatches';
import PlayerProfilePro from '@/components/PlayerProfilePro';

export const revalidate = 30; // Revalidate player details every 30 seconds

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

// Friendly rank formatter (e.g. 2496 -> D4-96)
function getFriendlyRankAndLp(globalLp: number): string {
  const tiers = [
    { base: 0, prefix: 'I' },
    { base: 400, prefix: 'B' },
    { base: 800, prefix: 'S' },
    { base: 1200, prefix: 'G' },
    { base: 1600, prefix: 'P' },
    { base: 2000, prefix: 'E' },
    { base: 2400, prefix: 'D' },
    { base: 2800, prefix: 'M' }
  ];
  
  if (globalLp >= 2800) {
    return `M-${globalLp - 2800}`;
  }
  const t = tiers.slice().reverse().find(tier => globalLp >= tier.base);
  if (t && t.prefix !== 'I') {
    const div = Math.floor((globalLp - t.base) / 100);
    const divNum = Math.min(4, Math.max(1, 4 - div));
    const lp = (globalLp - t.base) % 100;
    return `${t.prefix}${divNum}-${lp}`;
  }
  return `${globalLp} LP`;
}

// Generate progress bar steps data
function getProgressBarData(tier: string, rank: string, lp: number) {
  const normTier = tier.toUpperCase();
  const normRank = rank.toUpperCase();
  
  const tierAbbr: Record<string, string> = {
    IRON: 'I', BRONZE: 'B', SILVER: 'S', GOLD: 'G', 
    PLATINUM: 'P', EMERALD: 'E', DIAMOND: 'D', 
    MASTER: 'M', GRANDMASTER: 'GM', CHALLENGER: 'CH'
  };
  
  const nextTierAbbr: Record<string, string> = {
    IRON: 'B', BRONZE: 'S', SILVER: 'G', GOLD: 'P', 
    PLATINUM: 'E', EMERALD: 'D', DIAMOND: 'M', 
    MASTER: 'GM', GRANDMASTER: 'CH', CHALLENGER: 'CH'
  };

  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(normTier)) {
    return {
      steps: [
        { label: 'M', active: normTier === 'MASTER', completed: true },
        { label: 'GM', active: normTier === 'GRANDMASTER', completed: normTier === 'GRANDMASTER' || normTier === 'CHALLENGER' },
        { label: 'CH', active: normTier === 'CHALLENGER', completed: normTier === 'CHALLENGER' }
      ],
      percent: normTier === 'MASTER' ? 25 : normTier === 'GRANDMASTER' ? 65 : 100
    };
  }
  
  const prefix = tierAbbr[normTier] || '';
  const nextPrefix = nextTierAbbr[normTier] || 'M';
  
  const rankOrder = ['IV', 'III', 'II', 'I'];
  const currentDivIdx = rankOrder.indexOf(normRank);
  
  const steps = [
    { label: `${prefix}4`, active: normRank === 'IV', completed: true },
    { label: `${prefix}3`, active: normRank === 'III', completed: currentDivIdx >= 1 },
    { label: `${prefix}2`, active: normRank === 'II', completed: currentDivIdx >= 2 },
    { label: `${prefix}1`, active: normRank === 'I', completed: currentDivIdx >= 3 },
    { label: nextPrefix, active: false, completed: false }
  ];
  
  // Percentage through this division + previous divisions in the same tier
  const completedDivisionsLp = (currentDivIdx >= 0 ? currentDivIdx * 100 : 0) + lp;
  const percent = Math.min(100, Math.max(0, (completedDivisionsLp / 400) * 100));
  
  return { steps, percent };
}

interface PlayerPageProps {
  params: Promise<{
    puuid: string;
  }>;
}

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { puuid } = await params;

  // 1. Fetch player details
  const player = await prisma.player.findUnique({
    where: { puuid },
    include: {
      snapshots: {
        orderBy: { timestamp: 'asc' },
      },
      matches: {
        orderBy: { gameCreation: 'desc' },
        take: 150,
      },
    },
  });

  if (!player) {
    notFound();
  }

  // 2. Computed values
  const currentGlobalLp = getGlobalLp(player.tier, player.rank, player.leaguePoints);
  const startGlobalLp = getGlobalLp(player.startTier, player.startRank, player.startLp);
  const progressLp = currentGlobalLp - startGlobalLp;
  
  const totalGames = player.wins + player.losses;
  const overallWinrate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0;

  // Last 30d LP gain (fallback to overall progress if snapshot is too old or missing)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const snap30d = player.snapshots.find(s => new Date(s.timestamp) >= thirtyDaysAgo) || player.snapshots[0];
  const last30dLp = snap30d ? currentGlobalLp - snap30d.globalLp : progressLp;

  // Peak Rank
  const maxSnapshotLp = player.snapshots.length > 0 
    ? Math.max(...player.snapshots.map(s => s.globalLp)) 
    : currentGlobalLp;
  const peakGlobalLp = Math.max(currentGlobalLp, maxSnapshotLp);

  // Progress bar steps and fill percentage
  const { steps: progressSteps, percent: progressPercent } = getProgressBarData(player.tier, player.rank, player.leaguePoints);

  // Serialize matches to plain objects for Client Component
  const serializedMatches = player.matches.map(match => ({
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
  }));

  // Serialize snapshots to plain objects for Client Component
  const serializedSnapshots = player.snapshots.map(snap => ({
    timestamp: snap.timestamp.toISOString(),
    globalLp: snap.globalLp,
    tier: snap.tier,
    rank: snap.rank,
    leaguePoints: snap.leaguePoints,
  }));

  return (
    <div>
      {/* CLASSIC WRAPPER */}
      <div className="classic-wrapper">
        {/* Back button */}
      <Link href="/" className="player-profile-back">
        <ChevronLeft size={16} /> Volver a la clasificación
      </Link>

      {/* Player Profile Header Card */}
      <div className="glass-panel player-header player-profile-header-card">
        <FallbackImage
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.profileIconId}.png`}
          alt="Profile Icon"
          className="player-big-icon"
          fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
        />
        <div className="player-meta player-meta-info">
          <div className="player-name-row player-name-container">
            <div className="player-name-stack">
              <h1 className="player-title-alias">{player.alias || player.gameName}</h1>
              <span className="player-title-riotid">
                {player.gameName}#{player.tagLine}
              </span>
            </div>
            <a 
              href={`${process.env.NEXT_PUBLIC_TRACKER_URL || 'http://localhost:5173'}/euw/${player.gameName}-${player.tagLine}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rift-tracker-redirect-btn"
            >
              🔍 Análisis Detallado (chupachotas.tracker)
            </a>
          </div>
          
          <div className="player-status-row">
            <div className="status-item">
              <Award size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>Liga Actual: <strong className="player-status-highlight">
                {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier.toUpperCase()) 
                  ? player.tier 
                  : `${translateTier(player.tier)} ${player.rank}`} ({player.leaguePoints} LP)
              </strong></span>
            </div>
            <div className="status-item">
              <Calendar size={16} style={{ color: 'var(--accent-gold)' }} />
              <span>Liga Inicial: <strong className="player-status-highlight">
                {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.startTier.toUpperCase()) 
                  ? player.startTier 
                  : `${translateTier(player.startTier)} ${player.startRank}`} ({player.startLp} LP)
              </strong></span>
            </div>
            <div className="status-item">
              <Swords size={16} style={{ color: 'var(--accent-purple)' }} />
              <span>Partidas: <strong className="player-status-highlight">{totalGames} ({overallWinrate}% WR)</strong></span>
            </div>
            {progressLp !== 0 && (
              <div className="status-item">
                <TrendingUp size={16} style={{ color: progressLp > 0 ? 'var(--win-color)' : 'var(--loss-color)' }} />
                <span>Progreso: <strong style={{ color: progressLp > 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{progressLp > 0 ? `+${progressLp}` : progressLp} LP</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progression & Rank Summary Widget */}
      <div className="glass-panel solo-rank-card player-progression-card">
        <span className="solo-rank-tag">Solo</span>
        
        <div className="rank-info-header">
          <div className="rank-info-left">
            <TierIcon tier={player.tier} size={64} className="rank-icon-svg" />
            <div className="rank-info-text">
              <h3 className="rank-title">
                {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier.toUpperCase()) 
                  ? player.tier 
                  : `${translateTier(player.tier)} ${player.rank}`}
              </h3>
              <span className="rank-lp-text">{player.leaguePoints} LP</span>
            </div>
          </div>
          
          <div className="rank-info-right">
            <span className="rank-winrate-stats">
              {player.wins}W {player.losses}L
            </span>
            <span className="rank-winrate-percent">
              Win Rate {overallWinrate}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="rank-progress-container">
          <div className="rank-progress-track">
            <div className="rank-progress-fill" style={{ width: `${progressPercent}%` }} />
            <div className="rank-progress-steps">
              {progressSteps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`rank-progress-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
                >
                  <span className="rank-progress-label">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Stats (Last 30d & Peak) */}
        <div className="rank-performance-stats player-perf-stats-container">
          <div className="performance-item">
            <span className="performance-label">Last 30d</span>
            <span className={`performance-value ${last30dLp > 0 ? 'climb-positive' : last30dLp < 0 ? 'climb-negative' : 'climb-neutral'}`}>
              {last30dLp > 0 ? `▲ +${last30dLp}` : last30dLp < 0 ? `▼ ${last30dLp}` : `0`} LP
            </span>
          </div>
          
          <div className="performance-item">
            <span className="performance-label">PEAK</span>
            <span className="performance-value-peak">
              {getFriendlyRankAndLp(peakGlobalLp)}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic matches and stats section */}
      <PlayerStatsAndMatches matches={serializedMatches} snapshots={serializedSnapshots} />
      </div>

      {/* PRO WRAPPER */}
      <div className="pro-wrapper">
        <PlayerProfilePro 
          player={player}
          matches={serializedMatches}
          snapshots={serializedSnapshots}
          progressLp={progressLp}
          overallWinrate={overallWinrate}
        />
      </div>
    </div>
  );
}
