'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import TierIcon from './TierIcon';
import FallbackImage from './FallbackImage';
import { ProcessedPlayer, ProcessedMatch } from './LeaderboardTable';

interface LeaderboardProProps {
  players: ProcessedPlayer[];
  matches: ProcessedMatch[];
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

export default function LeaderboardPro({ players, matches }: LeaderboardProProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedPlayers = useMemo(() => {
    return players
      .filter((player) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          player.gameName.toLowerCase().includes(term) ||
          player.tagLine.toLowerCase().includes(term) ||
          (player.alias && player.alias.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (b.currentGlobalLp !== a.currentGlobalLp) return b.currentGlobalLp - a.currentGlobalLp;
        const netA = a.wins - a.losses;
        const netB = b.wins - b.losses;
        if (netB !== netA) return netB - netA;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winrate - a.winrate;
      });
  }, [players, searchTerm]);

  return (
    <div className="pro-leaderboard-container">
      {/* Header & Controls */}
      <div className="pro-controls">
        <div className="pro-search-box">
          <Search size={16} className="pro-search-icon" />
          <input
            type="text"
            placeholder="Buscar invocador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pro-search-input"
          />
        </div>
      </div>

      <div className="pro-grid-layout">
        {/* Left Column: The Table */}
        <div className="pro-table-column">
          <div className="pro-table-wrapper">
            <table className="pro-table">
              <thead>
                <tr>
                  <th className="th-rank">#</th>
                  <th className="th-player">Invocador</th>
                  <th className="th-tier">Rango</th>
                  <th className="th-lp">LP</th>
                  <th className="th-winrate">Win Rate</th>
                  <th className="th-recent">Partidas</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPlayers.map((player, index) => {
                  const playerMatches = matches.filter(m => m.playerId === player.id).slice(0, 5);
                  return (
                    <tr key={player.id} className="pro-row">
                      <td className="td-rank mono">{index + 1}</td>
                      <td className="td-player">
                        <Link href={`/player/${player.puuid}`} className="pro-player-link">
                          <FallbackImage
                            src={`https://ddragon.leagueoflegends.com/cdn/16.12.1/img/profileicon/${player.profileIconId}.png`}
                            alt={player.gameName}
                            className="pro-avatar"
                            fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.12.1/img/profileicon/29.png"
                          />
                          <div className="pro-player-names">
                            <span className="pro-alias">{player.alias || player.gameName}</span>
                            <span className="pro-riotid">{player.gameName}#{player.tagLine}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="td-tier">
                        <div className="pro-tier-display">
                          <TierIcon tier={player.tier} size={24} className="pro-tier-icon" />
                          <span className="pro-tier-text">
                            {player.tier} {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier.toUpperCase()) ? '' : player.rank}
                          </span>
                        </div>
                      </td>
                      <td className="td-lp mono">{player.leaguePoints}</td>
                      <td className="td-winrate">
                        <div className="pro-winrate-wrapper">
                          <span className="mono">{player.winrate}%</span>
                          <span className="pro-winrate-record">{player.wins}W {player.losses}L</span>
                        </div>
                        <div className="pro-winrate-bar-bg">
                          <div className="pro-winrate-bar-fill" style={{ width: `${player.winrate}%` }}></div>
                        </div>
                      </td>
                      <td className="td-recent">
                        <div className="pro-recent-matches">
                          {playerMatches.map((m, i) => (
                            <div key={i} className={`pro-match-dot ${m.win ? 'win' : 'loss'}`} title={m.championName}></div>
                          ))}
                          {playerMatches.length === 0 && <span className="pro-no-matches">-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredAndSortedPlayers.length === 0 && (
              <div className="pro-empty-state">No se encontraron jugadores.</div>
            )}
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="pro-feed-column">
          <div className="pro-feed-header">
            <h3>Actividad Reciente</h3>
          </div>
          <div className="pro-feed-list">
            {matches.slice(0, 15).map((match) => (
              <a
                key={match.id}
                href={`${process.env.NEXT_PUBLIC_TRACKER_URL || 'https://tracker.chupachotas.es'}/euw/${match.player.gameName}-${match.player.tagLine}?match=${match.matchId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pro-feed-item"
              >
                <div className={`pro-feed-indicator ${match.isRemake ? 'remake' : match.win ? 'win' : 'loss'}`} />
                <FallbackImage
                  src={`https://ddragon.leagueoflegends.com/cdn/16.12.1/img/champion/${match.championName}.png`}
                  alt={match.championName}
                  className="pro-feed-champ-icon"
                  fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.12.1/img/profileicon/29.png"
                />
                <div className="pro-feed-content">
                  <div className="pro-feed-top">
                    <span className="pro-feed-name">{match.player.alias || match.player.gameName}</span>
                    <span className={`pro-feed-badge ${match.isRemake ? 'remake' : match.win ? 'win' : 'loss'}`}>
                      {match.isRemake ? 'R' : match.win ? 'V' : 'D'}
                    </span>
                  </div>
                  <div className="pro-feed-bottom">
                    <span className="pro-feed-champ">{match.championName}</span>
                    <span className="pro-feed-time">{timeAgo(match.gameCreation)}</span>
                  </div>
                </div>
              </a>
            ))}
            {matches.length === 0 && (
              <div className="pro-empty-state" style={{ padding: '2rem 1rem' }}>Sin actividad reciente.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

