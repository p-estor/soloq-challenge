'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Flame, Snowflake, Award, Zap, Swords, Clock } from 'lucide-react';
import TierIcon from './TierIcon';
import FallbackImage from './FallbackImage';

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
function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'Hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export interface ProcessedPlayer {
  id: string;
  gameName: string;
  tagLine: string;
  alias: string | null;
  puuid: string;
  profileIconId: number;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  streak: number;
  startTier: string;
  startRank: string;
  startLp: number;
  lastUpdated: string;
  currentGlobalLp: number;
  startGlobalLp: number;
  progressLp: number;
  winrate: number;
  isHighElo: boolean;
}

export interface ProcessedMatch {
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
  gameCreation: string; // ISO string
  queueId: number;
  isRemake?: boolean;
  player: {
    gameName: string;
    alias: string | null;
    tagLine: string;
  };
}

interface LeaderboardTableProps {
  players: ProcessedPlayer[];
  matches: ProcessedMatch[];
}

export default function LeaderboardTable({ players, matches }: LeaderboardTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eloTab, setEloTab] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    return players
      .filter((player) => {
        if (eloTab !== 'ALL') {
          const targetIsHighElo = eloTab === 'HIGH';
          if (player.isHighElo !== targetIsHighElo) return false;
        }

        const name = `${player.gameName}#${player.tagLine}`.toLowerCase();
        const alias = (player.alias || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || alias.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
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
  }, [players, searchTerm, eloTab]);

  // Filter matches based on the selected eloTab
  const filteredMatches = useMemo(() => {
    const activePlayerIds = new Set(
      players
        .filter(p => eloTab === 'ALL' || p.isHighElo === (eloTab === 'HIGH'))
        .map(p => p.id)
    );

    return matches
      .filter(match => activePlayerIds.has(match.playerId))
      .slice(0, 20); // only show the 20 most recent filtered matches
  }, [matches, players, eloTab]);

  // Helper to format LP Progress string
  const renderProgress = (progressLp: number) => {
    if (progressLp > 0) {
      return <span className="progress-cell progress-positive">+{progressLp} LP</span>;
    }
    if (progressLp < 0) {
      return <span className="progress-cell progress-negative">{progressLp} LP</span>;
    }
    return <span className="progress-cell progress-neutral">0 LP</span>;
  };

  // Helper to render streaks
  const renderStreak = (streak: number) => {
    if (streak >= 3) {
      return (
        <span className="streak-badge streak-win">
          <Flame size={12} fill="currentColor" /> {streak} Win streak
        </span>
      );
    }
    if (streak <= -3) {
      return (
        <span className="streak-badge streak-loss">
          <Snowflake size={12} /> {Math.abs(streak)} Loss streak
        </span>
      );
    }
    return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  };

  return (
    <div className="layout-split">
      {/* Left column: Leaderboard */}
      <div>
        <div className="leaderboard-header-row" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, whiteSpace: 'nowrap' }}>
            Tabla de Clasificación
          </h2>
          {players.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} /> Actualizado: {timeAgo(players[0].lastUpdated)}
            </span>
          )}
        </div>

        <div className="glass-panel" style={{ minHeight: '680px', display: 'flex', flexDirection: 'column' }}>
          {/* Filters and search */}
          <div className="controls-bar">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Buscar invocador..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-tabs">
              <button
                onClick={() => setEloTab('ALL')}
                className={`filter-tab ${eloTab === 'ALL' ? 'active' : ''}`}
              >
                👥 Todos
              </button>
              <button
                onClick={() => setEloTab('HIGH')}
                className={`filter-tab ${eloTab === 'HIGH' ? 'active' : ''}`}
              >
                🛡️ High Elo
              </button>
              <button
                onClick={() => setEloTab('LOW')}
                className={`filter-tab ${eloTab === 'LOW' ? 'active' : ''}`}
              >
                ⚔️ Low Elo
              </button>
            </div>
          </div>

          {/* Table container */}
          <div className="table-container">
            {filteredAndSortedPlayers.length === 0 ? (
              <div className="empty-state">
                <Award className="empty-icon" />
                <p>No se encontraron invocadores.</p>
              </div>
            ) : (
              <>
                <table className="leaderboard-table hide-mobile">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>Pos</th>
                      <th>Invocador</th>
                      <th>Liga</th>
                      <th>Progreso</th>
                      <th>Winrate</th>
                      <th className="hide-mobile">Racha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedPlayers.map((player, index) => {
                      const isTop3 = index < 3 && searchTerm === '';
                      const rankClass = isTop3 ? `top-rank-${index + 1}` : '';
                      const pos = index + 1;

                      return (
                        <tr key={player.id} className={rankClass}>
                          <td className="rank-col">
                            <span className="rank-number">{pos}</span>
                          </td>
                          <td>
                            <div className="player-info-cell">
                              <div className="summoner-icon-container">
                                <img
                                  src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/${player.profileIconId}.png`}
                                  alt="Profile Icon"
                                  className="summoner-icon"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png';
                                  }}
                                />
                              </div>
                              <div className="summoner-names">
                                <Link href={`/player/${player.puuid}`} className="summoner-alias">
                                  {player.alias || player.gameName}
                                </Link>
                                <span className="summoner-riotid">
                                  {player.gameName}#{player.tagLine}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="rank-display-cell">
                              <span className="hide-mobile">
                                <TierIcon tier={player.tier} size={36} />
                              </span>
                              <div className="rank-details">
                                <span className="rank-tier">
                                  {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier.toUpperCase()) 
                                    ? player.tier 
                                    : `${translateTier(player.tier)} ${player.rank}`}
                                </span>
                                <span className="rank-lp">{player.leaguePoints} LP</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            {renderProgress(player.progressLp)}
                          </td>
                          <td>
                            <div className="winrate-cell">
                              <div className="winrate-stats">
                                <span className="winrate-percent">{player.winrate}%</span>
                                <span>
                                  {player.wins}V - {player.losses}D
                                </span>
                              </div>
                              <div className="winrate-bar-bg">
                                <div
                                  className="winrate-bar-fill"
                                  style={{ width: `${player.winrate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="hide-mobile">
                            {renderStreak(player.streak)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile Card List */}
                <div className="leaderboard-mobile-list show-mobile">
                  {filteredAndSortedPlayers.map((player, index) => {
                    const pos = index + 1;
                    const isTop3 = index < 3 && searchTerm === '';
                    const rankClass = isTop3 ? `top-rank-${index + 1}` : '';

                    return (
                      <Link href={`/player/${player.puuid}`} key={player.id} className={`mobile-player-card ${rankClass}`}>
                        <div className="mobile-card-header">
                          <div className="mobile-pos-name">
                            <span className="mobile-rank-number">{pos}</span>
                            <div className="summoner-icon-container" style={{ width: '2rem', height: '2rem' }}>
                              <img
                                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/${player.profileIconId}.png`}
                                alt="Profile"
                                className="summoner-icon"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png';
                                }}
                              />
                            </div>
                            <div className="summoner-names">
                              <span className="summoner-alias" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                {player.alias || player.gameName}
                              </span>
                              <span className="summoner-riotid" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                {player.gameName}#{player.tagLine}
                              </span>
                            </div>
                          </div>
                          <div className="mobile-progress-badge">
                            {renderProgress(player.progressLp)}
                          </div>
                        </div>
                        
                        <div className="mobile-card-stats">
                          <div className="mobile-stat-col">
                            <span className="mobile-stat-label">LIGA</span>
                            <span className="mobile-stat-value">
                              {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier.toUpperCase()) 
                                ? player.tier 
                                : `${translateTier(player.tier)} ${player.rank}`}
                              <span className="mobile-stat-sub"> ({player.leaguePoints} LP)</span>
                            </span>
                          </div>
                          
                          <div className="mobile-stat-col">
                            <span className="mobile-stat-label">WINRATE</span>
                            <span className="mobile-stat-value">
                              {player.winrate}%
                              <span className="mobile-stat-sub"> ({player.wins}V - {player.losses}D)</span>
                            </span>
                          </div>
                          
                          {player.streak !== 0 && (
                            <div className="mobile-stat-col">
                              <span className="mobile-stat-label">RACHA</span>
                              <span className="mobile-stat-value" style={{ display: 'flex', alignItems: 'center' }}>
                                {renderStreak(player.streak)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right column: Activity feed */}
      <div className="sidebar-wrapper">
        <div className="sidebar-inner">

          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', height: '2.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <Zap className="sidebar-title-icon animate-pulse-glow" style={{ color: 'var(--accent-purple)', width: '1.25rem', height: '1.25rem' }} />
              Actividad Reciente
            </h2>
          </div>

          <div className="glass-panel sidebar-panel" style={{ flex: 1 }}>
            <div className="match-feed">
              {filteredMatches.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <Swords size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>No hay partidas recientes registradas.</p>
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <a
                    key={match.id}
                    href={`${process.env.NEXT_PUBLIC_TRACKER_URL || 'https://tracker.chupachotas.es'}/euw/${match.player.gameName}-${match.player.tagLine}?match=${match.matchId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`feed-item ${match.isRemake ? 'feed-remake' : match.win ? 'feed-win' : 'feed-loss'}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="feed-left">
                      <FallbackImage
                        src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${match.championName}.png`}
                        alt={match.championName}
                        className="champ-icon"
                        fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
                      />
                      <div className="feed-details">
                        <span className="feed-player">
                          {match.player.alias || match.player.gameName}
                        </span>
                        <span className="feed-stats">
                          {match.kills}/{match.deaths}/{match.assists} ({Math.round(match.gameDuration / 60)}m)
                        </span>
                      </div>
                    </div>
                    <div className="feed-right">
                      <span className={`feed-result ${match.isRemake ? 'result-remake' : match.win ? 'result-win' : 'result-loss'}`}>
                        {match.isRemake ? 'REMAKE' : match.win ? 'VICTORIA' : 'DERROTA'}
                      </span>
                      <span className="feed-time">{timeAgo(match.gameCreation)}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
