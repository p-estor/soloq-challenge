'use client';

import React, { useMemo } from 'react';
import FallbackImage from './FallbackImage';
import { Swords, Award, TrendingUp } from 'lucide-react';
import LPChart from './LPChart';
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
  gameCreation: string; // Serialized Date ISO string
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

interface PlayerStatsAndMatchesProps {
  matches: Match[];
  snapshots: Snapshot[];
}

// Time format helper
function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

// Duration format helper
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Translate queue ID to name
function getQueueName(queueId: number): string {
  const queueMap: Record<number, string> = {
    420: 'SoloQ',
    440: 'FlexQ',
    400: 'Normal Draft',
    430: 'Normal Blind',
    490: 'Quickplay',
  };
  return queueMap[queueId] || 'Partida';
}

export default function PlayerStatsAndMatches({ matches, snapshots }: PlayerStatsAndMatchesProps) {
  // 1. Filter matches to only include ranked matches (SoloQ 420 and FlexQ 440)
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => match.queueId === 420 || match.queueId === 440);
  }, [matches]);

  // 2. Recalculate stats for the filtered matches
  const { topChampions, overallWins, overallLosses, winrate } = useMemo(() => {
    const champStatsMap: Record<
      string,
      {
        name: string;
        games: number;
        wins: number;
        kills: number;
        deaths: number;
        assists: number;
        championId: number;
      }
    > = {};

    let wins = 0;
    let losses = 0;

    filteredMatches.forEach((match) => {
      if (match.isRemake) return;

      if (match.win) wins++;
      else losses++;

      if (!champStatsMap[match.championName]) {
        champStatsMap[match.championName] = {
          name: match.championName,
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          championId: match.championId,
        };
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
      .map((c) => {
        const wr = Math.round((c.wins / c.games) * 100);
        const avgKills = (c.kills / c.games).toFixed(1);
        const avgDeaths = (c.deaths / c.games).toFixed(1);
        const avgAssists = (c.assists / c.games).toFixed(1);
        const kdaRatio =
          c.deaths === 0
            ? 'Perfect'
            : ((c.kills + c.assists) / c.deaths).toFixed(2);
        return {
          ...c,
          winrate: wr,
          avgKills,
          avgDeaths,
          avgAssists,
          kdaRatio,
        };
      });

    const total = wins + losses;
    const wr = total > 0 ? Math.round((wins / total) * 100) : 0;

    return {
      topChampions: sortedChamps,
      overallWins: wins,
      overallLosses: losses,
      winrate: wr,
    };
  }, [filteredMatches]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Grid de contenido */}
      <div className="player-widgets-grid">
        {/* Historial de Partidas (Columna Izquierda) */}
        <div className="player-column-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel widget-card player-matches-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="widget-title" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                <Swords size={18} style={{ color: 'var(--accent-cyan)' }} />
                Historial de Clasificatorias
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span>Partidas: <strong style={{ color: 'var(--text-primary)' }}>{overallWins + overallLosses}</strong></span>
                <span style={{ color: 'var(--border-normal)' }}>|</span>
                <span>Winrate: <strong style={{ color: winrate >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>{winrate}%</strong> ({overallWins}V - {overallLosses}D)</span>
              </div>
            </div>

            <div className="player-match-list">
              {filteredMatches.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <Swords className="empty-icon" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No se encontraron partidas.</p>
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const csPerMin = (match.cs / (match.gameDuration / 60)).toFixed(1);
                  const isRemake = match.isRemake;
                  return (
                    <div
                      key={match.id}
                      className="player-match-card"
                    >
                      <div className={isRemake ? 'match-remake-border' : match.win ? 'match-win-border' : 'match-loss-border'} />

                      <div className="match-champ-info">
                        <FallbackImage
                          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${match.championName}.png`}
                          alt={match.championName}
                          className="match-champ-icon"
                          fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                        />
                        <div className="match-champ-meta">
                          <span className="match-champ-name">{match.championName}</span>
                          <span className="match-game-type">{getQueueName(match.queueId)}</span>
                        </div>
                      </div>

                      <div className="match-outcome">
                        <span className={`outcome-text ${isRemake ? 'outcome-remake' : match.win ? 'outcome-win' : 'outcome-loss'}`}>
                          {isRemake ? 'Remake' : match.win ? 'Victoria' : 'Derrota'}
                        </span>
                        <span className="match-duration">{formatDuration(match.gameDuration)}</span>
                      </div>

                      <div className="match-kda-info">
                        <span className="match-kda">
                          {match.kills} / <span style={{ color: 'var(--loss-color)' }}>{match.deaths}</span> / {match.assists}
                        </span>
                        <span className="match-kda-ratio">
                          KDA: {match.deaths === 0 ? 'Perfecto' : ((match.kills + match.assists) / match.deaths).toFixed(2)}
                        </span>
                      </div>

                      <div className="match-cs-info">
                        <span className="match-cs">{match.cs} CS</span>
                        <span className="match-cs-min">{csPerMin}/min</span>
                      </div>

                      <div className="match-time-cell">
                        <span className="match-time">{formatTimeAgo(match.gameCreation)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha (Campeones y Gráfica) */}
        <div className="player-column-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Campeones Más Jugados */}
          <div className="glass-panel widget-card" style={{ padding: '1.25rem' }}>
            <h3 className="widget-title" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Award size={18} style={{ color: 'var(--accent-purple)' }} />
              Campeones Más Jugados
            </h3>

            <div className="champs-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topChampions.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No hay campeones para mostrar.</p>
                </div>
              ) : (
                topChampions.map((champ) => (
                  <div key={champ.name} className="champ-stat-row">
                    <div className="champ-stat-left">
                      <FallbackImage
                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champ.name}.png`}
                        alt={champ.name}
                        className="champ-stat-icon"
                        fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                      />
                      <div>
                        <span className="champ-stat-name">{champ.name}</span>
                        <span className="champ-stat-games" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {champ.games} partida{champ.games > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="champ-stat-right" style={{ textAlign: 'right' }}>
                      <span
                        className="champ-stat-winrate"
                        style={{ color: champ.winrate >= 50 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 700 }}
                      >
                        {champ.winrate}% WR
                      </span>
                      <span className="champ-stat-kda" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {champ.avgKills}/{champ.avgDeaths}/{champ.avgAssists} KDA
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Gráfica de Progreso */}
          <div className="glass-panel widget-card player-chart-card" style={{ padding: '1.25rem' }}>
            <h3 className="widget-title" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--accent-gold)' }} />
              Progreso de LP
            </h3>
            <div className="chart-container" style={{ minHeight: '200px' }}>
              <LPChart snapshots={snapshots} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
