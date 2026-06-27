'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import FallbackImage from './FallbackImage';
import TierIcon from './TierIcon';
import { DDRAGON_VERSION } from '@/lib/riot';

interface Match {
  id: string;
  matchId: string;
  playerId: string;
  championId: number;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gameDuration: number;
  gameCreation: string;
  queueId: number;
  isRemake?: boolean;
}

interface Snapshot {
  timestamp: string;
  globalLp: number;
  tier: string;
  rank: string;
  leaguePoints: number;
}

interface PlayerProfileProProps {
  player: {
    gameName: string;
    alias: string | null;
    tagLine: string;
    profileIconId: number;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  };
  matches: Match[];
  snapshots: Snapshot[];
  progressLp: number;
  overallWinrate: number;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

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

export default function PlayerProfilePro({ player, matches, snapshots, progressLp, overallWinrate }: PlayerProfileProProps) {
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => match.queueId === 420 || match.queueId === 440);
  }, [matches]);

  const { topChampions } = useMemo(() => {
    const champStatsMap: Record<string, { name: string; games: number; wins: number; kills: number; deaths: number; assists: number }> = {};
    
    filteredMatches.forEach((match) => {
      if (match.isRemake) return;
      if (!champStatsMap[match.championName]) {
        champStatsMap[match.championName] = { name: match.championName, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
      }
      const stats = champStatsMap[match.championName];
      stats.games++;
      if (match.win) stats.wins++;
      stats.kills += match.kills;
      stats.deaths += match.deaths;
      stats.assists += match.assists;
    });

    const sortedChamps = Object.values(champStatsMap)
      .sort((a, b) => b.games - a.games)
      .slice(0, 5)
      .map((c) => ({
        ...c,
        winrate: Math.round((c.wins / c.games) * 100),
        kda: c.deaths === 0 ? 'Perfect' : ((c.kills + c.assists) / c.deaths).toFixed(2),
      }));

    return { topChampions: sortedChamps };
  }, [filteredMatches]);

  return (
    <div className="pro-profile-container">
      {/* Top Bar */}
      <div className="pro-profile-header">
        <div className="pro-profile-header-left">
          <Link href="/" className="pro-back-btn" title="Volver a la clasificación">
            <ChevronLeft size={18} />
          </Link>
          <FallbackImage
            src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.profileIconId}.png`}
            alt={player.gameName}
            className="pro-profile-icon"
            fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
          />
          <div className="pro-profile-info">
            <h1 className="pro-profile-name">{player.alias || player.gameName}</h1>
            <a 
              href={`${process.env.NEXT_PUBLIC_TRACKER_URL || 'http://localhost:5173'}/euw/${player.gameName}-${player.tagLine}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pro-tracker-link"
            >
              Tracker <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="pro-profile-header-right">
          <div className="pro-stat-block">
            <span className="pro-stat-label">RANK</span>
            <div className="pro-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TierIcon tier={player.tier} size={20} />
              {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier.toUpperCase()) 
                ? player.tier 
                : `${translateTier(player.tier)} ${player.rank}`}
            </div>
          </div>
          <div className="pro-stat-block">
            <span className="pro-stat-label">LP</span>
            <span className="pro-stat-value">{player.leaguePoints}</span>
          </div>
          <div className="pro-stat-block">
            <span className="pro-stat-label">PROGRESO</span>
            <span className={`pro-stat-value ${progressLp > 0 ? 'win' : progressLp < 0 ? 'loss' : ''}`}>
              {progressLp > 0 ? `+${progressLp}` : progressLp}
            </span>
          </div>
          <div className="pro-stat-block">
            <span className="pro-stat-label">WINRATE</span>
            <span className={`pro-stat-value ${overallWinrate >= 50 ? 'win' : 'loss'}`}>{overallWinrate}%</span>
          </div>
          <div className="pro-stat-block">
            <span className="pro-stat-label">PARTIDAS</span>
            <span className="pro-stat-value">{player.wins + player.losses}</span>
          </div>
        </div>
      </div>

      <div className="pro-profile-content">
        {/* Matches Table */}
        <div className="pro-matches-section">
          <div className="pro-table-header">
            <div className="pro-col-champ">Campeón</div>
            <div className="pro-col-kda">KDA</div>
            <div className="pro-col-cs">CS</div>
            <div className="pro-col-time">Hace</div>
          </div>
          <div className="pro-matches-list">
            {filteredMatches.length === 0 ? (
              <div className="pro-empty-state">No hay partidas registradas.</div>
            ) : (
              filteredMatches.map(match => {
                const kda = match.deaths > 0 ? ((match.kills + match.assists) / match.deaths).toFixed(2) : 'Perfect';
                return (
                  <div key={match.id} className="pro-match-row">
                    <div className={`pro-match-indicator ${match.isRemake ? 'remake' : match.win ? 'win' : 'loss'}`} />
                    <div className="pro-col-champ" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <FallbackImage
                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${match.championName}.png`}
                        alt={match.championName}
                        className="pro-match-champ-icon"
                        fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="pro-match-champ-name">{match.championName}</span>
                        <span className={`pro-match-badge ${match.isRemake ? 'remake' : match.win ? 'win' : 'loss'}`}>
                          {match.isRemake ? 'REMAKE' : match.win ? 'VICTORIA' : 'DERROTA'}
                        </span>
                      </div>
                    </div>
                    <div className="pro-col-kda">
                      <span className="pro-kda-stats mono">{match.kills}/{match.deaths}/{match.assists}</span>
                      <span className="pro-kda-ratio">{kda} KDA</span>
                    </div>
                    <div className="pro-col-cs">
                      <span className="mono">{match.cs}</span>
                    </div>
                    <div className="pro-col-time">
                      <span>{timeAgo(match.gameCreation)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Champs Sidebar */}
        <div className="pro-champs-sidebar">
          <h3 className="pro-sidebar-title">CAMPEONES MÁS JUGADOS</h3>
          <div className="pro-champs-list">
            {topChampions.map(champ => (
              <div key={champ.name} className="pro-champ-row">
                <FallbackImage
                  src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champ.name}.png`}
                  alt={champ.name}
                  className="pro-sidebar-champ-icon"
                  fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                />
                <div className="pro-champ-info">
                  <span className="pro-champ-name">{champ.name}</span>
                  <span className="pro-champ-games">{champ.games} partidas</span>
                </div>
                <div className="pro-champ-stats">
                  <span className={`pro-champ-wr ${champ.winrate >= 50 ? 'win' : 'loss'}`}>{champ.winrate}%</span>
                  <span className="pro-champ-kda">{champ.kda} KDA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
