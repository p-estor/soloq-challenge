'use client';

import React, { useState } from 'react';
import { Trophy, Award, Skull, Clock, Flame, Zap, Shield, HelpCircle, Users, Eye, EyeOff, LucideIcon } from 'lucide-react';
import FallbackImage from './FallbackImage';

interface PlayerInfo {
  id: string;
  gameName: string;
  alias: string | null;
  profileIconId: number;
}

interface ServerRecords {
  mostActive: { player: PlayerInfo; maxGames: number } | null;
  topKills: { player: PlayerInfo; kills: number; championName: string } | null;
  topDeathless: { player: PlayerInfo; kills: number; assists: number; championName: string } | null;
  fastestWin: { player: PlayerInfo; gameDuration: number; championName: string } | null;
  bestFarmer: { player: PlayerInfo; maxCsPerMin: number; cs: number; championName: string } | null;
  topDeaths: { player: PlayerInfo; deaths: number; championName: string } | null;
}

interface Winner {
  player: PlayerInfo;
  date: string;
  championName: string;
  detail: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  color: string;
  shadow: string;
  winners: Winner[];
  status: string;
}

interface AchievementsProProps {
  serverRecords: ServerRecords;
  achievements: Achievement[];
}

const IconMap: Record<string, LucideIcon> = {
  penta_1: Skull,
  baron_steal: Zap,
  win_streak_10: Flame,
  enemy_jungle_stealer: Shield,
  vision_god: Eye,
  ward_slayer: EyeOff,
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AchievementsPro({ serverRecords, achievements }: AchievementsProProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const renderServerRecordRow = (title: string, desc: string, icon: React.ReactNode, value: React.ReactNode, player: PlayerInfo | undefined, championName?: string) => {
    return (
      <div className="pro-record-row">
        <div className="pro-record-icon">{icon}</div>
        <div className="pro-record-info">
          <div className="pro-record-title">{title}</div>
          <div className="pro-record-desc">{desc}</div>
        </div>
        {player ? (
          <div className="pro-record-player">
            <FallbackImage
              src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/${player.profileIconId}.png`}
              alt={player.gameName}
              className="pro-record-avatar"
              fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
            />
            <div className="pro-record-player-meta">
              <span className="pro-record-name">{player.alias || player.gameName}</span>
              <span className="pro-record-value">{value}</span>
            </div>
            {championName && (
              <FallbackImage
                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${championName}.png`}
                alt={championName}
                className="pro-record-champ"
                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
              />
            )}
          </div>
        ) : (
          <div className="pro-record-empty">Sin datos aún</div>
        )}
      </div>
    );
  };

  return (
    <div className="pro-achievements-container">
      {/* Top Header */}
      <div className="pro-achievements-header">
        <h1 className="pro-achievements-title">RÉCORDS Y LOGROS</h1>
        <p className="pro-achievements-subtitle">Datos en tiempo real de la temporada actual.</p>
      </div>

      <div className="pro-achievements-layout">
        {/* Server Records */}
        <div className="pro-section">
          <div className="pro-section-header">
            <span>RÉCORDS DEL SERVIDOR</span>
          </div>
          <div className="pro-records-list">
            {renderServerRecordRow(
              'El Más Viciado',
              'Mayor cantidad de partidas jugadas.',
              <Flame size={16} style={{ color: 'var(--accent-cyan)' }} />,
              serverRecords.mostActive ? `${serverRecords.mostActive.maxGames} partidas` : '',
              serverRecords.mostActive?.player
            )}
            {renderServerRecordRow(
              'El Terror de la Grieta',
              'Partida con más asesinatos.',
              <Skull size={16} style={{ color: 'var(--loss-color)' }} />,
              serverRecords.topKills ? `${serverRecords.topKills.kills} asesinatos` : '',
              serverRecords.topKills?.player,
              serverRecords.topKills?.championName
            )}
            {renderServerRecordRow(
              'El Inmortal',
              'Victoria perfecta con cero muertes.',
              <Shield size={16} style={{ color: 'var(--win-color)' }} />,
              serverRecords.topDeathless ? `${serverRecords.topDeathless.kills}/0/${serverRecords.topDeathless.assists}` : '',
              serverRecords.topDeathless?.player,
              serverRecords.topDeathless?.championName
            )}
            {renderServerRecordRow(
              'El Speedrunner',
              'Victoria más rápida (sin remakes).',
              <Clock size={16} style={{ color: 'var(--accent-purple)' }} />,
              serverRecords.fastestWin ? formatDuration(serverRecords.fastestWin.gameDuration) : '',
              serverRecords.fastestWin?.player,
              serverRecords.fastestWin?.championName
            )}
            {renderServerRecordRow(
              'El Farmer del Año',
              'Mayor CS por minuto promedio.',
              <Award size={16} style={{ color: 'var(--accent-gold)' }} />,
              serverRecords.bestFarmer ? `${serverRecords.bestFarmer.maxCsPerMin.toFixed(1)} CS/min (${serverRecords.bestFarmer.cs} total)` : '',
              serverRecords.bestFarmer?.player,
              serverRecords.bestFarmer?.championName
            )}
            {renderServerRecordRow(
              'El Sacrificado',
              'Partida con más muertes.',
              <HelpCircle size={16} style={{ color: 'var(--loss-color)' }} />,
              serverRecords.topDeaths ? `${serverRecords.topDeaths.deaths} muertes` : '',
              serverRecords.topDeaths?.player,
              serverRecords.topDeaths?.championName
            )}
          </div>
        </div>

        {/* Special Achievements Table */}
        <div className="pro-section">
          <div className="pro-section-header">
            <span>LOGROS ESPECIALES</span>
          </div>
          <div className="pro-achievements-table">
            <div className="pro-table-header">
              <div className="pro-col-ach">Logro</div>
              <div className="pro-col-status">Estado</div>
              <div className="pro-col-winners">Invocadores</div>
            </div>
            <div className="pro-table-body">
              {achievements.map(ach => {
                const IconComponent = IconMap[ach.id] || Skull;
                const isUnlocked = ach.status === 'Desbloqueado';
                const isExpanded = expandedId === ach.id;
                const hasWinners = ach.winners.length > 0;

                return (
                  <div key={ach.id} className="pro-ach-row-container">
                    <div 
                      className={`pro-ach-row ${hasWinners ? 'clickable' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
                      onClick={() => hasWinners && setExpandedId(isExpanded ? null : ach.id)}
                    >
                      <div className="pro-col-ach">
                        <IconComponent size={16} color={isUnlocked ? ach.color : 'var(--text-muted)'} />
                        <div className="pro-ach-info">
                          <span className="pro-ach-title">{ach.title}</span>
                          <span className="pro-ach-desc">{ach.description}</span>
                        </div>
                      </div>
                      <div className="pro-col-status">
                        <span className={`pro-status-badge ${isUnlocked ? 'unlocked' : 'locked'}`}>
                          {ach.status}
                        </span>
                      </div>
                      <div className="pro-col-winners">
                        {hasWinners ? (
                          <div className="pro-winners-preview">
                            <span className="pro-winners-count">{ach.winners.length} desbloqueo{ach.winners.length !== 1 ? 's' : ''}</span>
                            {ach.winners.slice(0, 3).map((w, idx) => (
                              <FallbackImage
                                key={idx}
                                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${w.championName}.png`}
                                alt={w.championName}
                                className="pro-winner-mini-icon"
                                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
                              />
                            ))}
                            {ach.winners.length > 3 && <span className="pro-winners-more">+{ach.winners.length - 3}</span>}
                          </div>
                        ) : (
                          <span className="pro-empty-winners">-</span>
                        )}
                      </div>
                    </div>
                    {/* Expanded details */}
                    {isExpanded && hasWinners && (
                      <div className="pro-ach-expanded">
                        <div className="pro-expanded-grid">
                          {ach.winners.map((w, idx) => (
                            <div key={idx} className="pro-winner-card">
                              <FallbackImage
                                src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${w.championName}.png`}
                                alt={w.championName}
                                className="pro-winner-card-champ"
                                fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
                              />
                              <div className="pro-winner-card-info">
                                <span className="pro-winner-card-name">{w.player.alias || w.player.gameName}</span>
                                <span className="pro-winner-card-date">{formatDate(w.date)}</span>
                              </div>
                              <span className="pro-winner-card-detail">{w.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
