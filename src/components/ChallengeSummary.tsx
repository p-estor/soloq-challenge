'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, Award, Target, Skull, ShieldAlert, HeartOff, ZapOff, Scissors, Heart } from 'lucide-react';
import FallbackImage from './FallbackImage';
import { DDRAGON_VERSION } from '@/lib/riot';

interface Player {
  id: string;
  gameName: string;
  alias: string | null;
  tagLine: string;
  wins: number;
  losses: number;
  streak: number;
  tier: string;
  rank: string;
  leaguePoints: number;
  progressLp: number;
  winrate: number;
  profileIconId: number;
}

interface RecordKillsMatch {
  alias: string | null;
  gameName: string;
  championName: string;
  profileIconId: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface RecordDeathlessMatch {
  alias: string | null;
  gameName: string;
  championName: string;
  profileIconId: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface RecordSpeedrunMatch {
  alias: string | null;
  gameName: string;
  championName: string;
  profileIconId: number;
  gameDuration: number;
}

interface BestFarmer {
  alias: string | null;
  gameName: string;
  championName: string;
  profileIconId: number;
  csPerMin: number;
  cs: number;
}

interface RecordDeathsMatch {
  alias: string | null;
  gameName: string;
  championName: string;
  profileIconId: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface ChallengeSummaryProps {
  players: Player[];
  totalPentakills: number;
  totalSteals: number;
  recordKillsMatch: RecordKillsMatch | null;
  recordDeathlessMatch: RecordDeathlessMatch | null;
  recordSpeedrunMatch: RecordSpeedrunMatch | null;
  bestFarmer: BestFarmer | null;
  recordDeathsMatch: RecordDeathsMatch | null;
}

export default function ChallengeSummary({ 
  players, 
  totalPentakills, 
  totalSteals, 
  recordKillsMatch,
  recordDeathlessMatch,
  recordSpeedrunMatch,
  bestFarmer,
  recordDeathsMatch
}: ChallengeSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const targetDate = new Date('2026-07-07T23:59:59');
    const checkExpiry = () => {
      setIsExpired(new Date() >= targetDate);
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

  if (players.length === 0) return null;

  // 1. Podio (Top 3 definitivo/actual por progreso LP)
  const podiumPlayers = [...players]
    .sort((a, b) => b.progressLp - a.progressLp)
    .slice(0, 3);

  // 2. Jugador más viciado ("El Quemado")
  const mostGamesPlayer = [...players]
    .map(p => ({ ...p, totalGames: p.wins + p.losses }))
    .sort((a, b) => b.totalGames - a.totalGames)[0];

  // 3. Mejor racha activa ("El Imparable")
  const bestStreakPlayer = [...players]
    .sort((a, b) => b.streak - a.streak)[0];

  // 4. Mayor escalador absoluto de LP
  const topClimber = [...players]
    .sort((a, b) => b.progressLp - a.progressLp)[0];

  // 5. Estadísticas de Comunidad
  const totalGamesPlayed = players.reduce((sum, p) => sum + p.wins + p.losses, 0);
  const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
  const avgWinrate = totalGamesPlayed > 0 ? Math.round((totalWins / totalGamesPlayed) * 100) : 0;

  // Helper para dar formato a la duración
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
      <button 
        onClick={() => isExpired && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          cursor: isExpired ? 'pointer' : 'default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 0,
          textAlign: 'left'
        }}
      >
        <h2 style={{ 
          fontSize: '1.2rem', 
          fontWeight: 800, 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <Trophy className="animate-pulse-glow" style={{ color: 'var(--accent-gold-bright)', width: '1.25rem', height: '1.25rem' }} />
          Premios y Récords Finales del Reto
          {!isExpired && (
            <span style={{ 
              fontSize: '0.68rem', 
              background: 'rgba(244,208,63,0.1)', 
              color: 'var(--accent-gold-bright)', 
              padding: '0.15rem 0.5rem', 
              borderRadius: '20px', 
              border: '1px solid rgba(244,208,63,0.3)',
              marginLeft: '0.5rem',
              letterSpacing: '0.05em',
              fontWeight: 800
            }}>
              PRÓXIMAMENTE
            </span>
          )}
        </h2>
        {isExpired && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isOpen ? 'Ocultar ▲' : 'Mostrar ▼'}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Podio Visual */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              🏆 Podio de Honor (Máximo Progreso de LP)
            </h3>
            <div className="podium-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: '1rem',
              padding: '1.5rem 0',
              flexWrap: 'wrap'
            }}>
              {/* 2º Puesto */}
              {podiumPlayers[1] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${podiumPlayers[1].profileIconId}.png`}
                    alt={podiumPlayers[1].alias || podiumPlayers[1].gameName}
                    width={48}
                    height={48}
                    style={{ borderRadius: '50%', border: '2px solid #a6a6a6', marginBottom: '0.5rem' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {podiumPlayers[1].alias || podiumPlayers[1].gameName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{podiumPlayers[1].progressLp} LP</div>
                  <div style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    height: '60px',
                    background: 'linear-gradient(180deg, #7f8c8d 0%, #34495e 100%)',
                    borderRadius: '6px 6px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.25rem'
                  }}>2</div>
                </div>
              )}

              {/* 1º Puesto */}
              {podiumPlayers[0] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '150px' }}>
                  <Trophy style={{ color: 'var(--accent-gold-bright)', width: '1.5rem', height: '1.5rem', marginBottom: '0.25rem' }} />
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${podiumPlayers[0].profileIconId}.png`}
                    alt={podiumPlayers[0].alias || podiumPlayers[0].gameName}
                    width={56}
                    height={56}
                    style={{ borderRadius: '50%', border: '3px solid var(--accent-gold-bright)', marginBottom: '0.5rem', boxShadow: '0 0 10px rgba(241,196,15,0.3)' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {podiumPlayers[0].alias || podiumPlayers[0].gameName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold-bright)', fontWeight: 700 }}>+{podiumPlayers[0].progressLp} LP</div>
                  <div style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    height: '90px',
                    background: 'linear-gradient(180deg, var(--accent-gold-bright) 0%, var(--accent-gold) 100%)',
                    borderRadius: '6px 6px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 900,
                    fontSize: '1.5rem'
                  }}>1</div>
                </div>
              )}

              {/* 3º Puesto */}
              {podiumPlayers[2] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${podiumPlayers[2].profileIconId}.png`}
                    alt={podiumPlayers[2].alias || podiumPlayers[2].gameName}
                    width={48}
                    height={48}
                    style={{ borderRadius: '50%', border: '2px solid #ca6f1e', marginBottom: '0.5rem' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {podiumPlayers[2].alias || podiumPlayers[2].gameName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{podiumPlayers[2].progressLp} LP</div>
                  <div style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    height: '40px',
                    background: 'linear-gradient(180deg, #ca6f1e 0%, #873600 100%)',
                    borderRadius: '6px 6px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.15rem'
                  }}>3</div>
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0 }} />

          {/* Récords Históricos del Servidor */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              🎖️ Récords del Servidor (Tiempo Real)
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {/* El más Viciado */}
              {mostGamesPlayer && (
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${mostGamesPlayer.profileIconId}.png`}
                    alt={mostGamesPlayer.alias || mostGamesPlayer.gameName}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Flame style={{ color: 'var(--loss-color)', width: '0.95rem', height: '0.95rem' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>El más Viciado</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.15rem' }}>{mostGamesPlayer.alias || mostGamesPlayer.gameName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Jugó un total de <strong style={{ color: 'var(--text-primary)' }}>{mostGamesPlayer.wins + mostGamesPlayer.losses} partidas</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Récord Kills */}
              {recordKillsMatch && (
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${recordKillsMatch.profileIconId}.png`}
                    alt={recordKillsMatch.alias || recordKillsMatch.gameName}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Skull style={{ color: 'var(--accent-gold)', width: '0.95rem', height: '0.95rem' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Terror de la Grieta</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.15rem' }}>{recordKillsMatch.alias || recordKillsMatch.gameName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Marcó <strong style={{ color: 'var(--text-primary)' }}>{recordKillsMatch.kills} kills</strong> con {recordKillsMatch.championName} ({recordKillsMatch.kills}/{recordKillsMatch.deaths}/{recordKillsMatch.assists})
                    </div>
                  </div>
                </div>
              )}

              {/* El Inmortal */}
              {recordDeathlessMatch && (
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${recordDeathlessMatch.profileIconId}.png`}
                    alt={recordDeathlessMatch.alias || recordDeathlessMatch.gameName}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Heart style={{ color: 'var(--win-color)', width: '0.95rem', height: '0.95rem' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>El Inmortal</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.15rem' }}>{recordDeathlessMatch.alias || recordDeathlessMatch.gameName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Victoria impecable: <strong style={{ color: 'var(--win-color)' }}>{recordDeathlessMatch.kills} kills y 0 muertes</strong> con {recordDeathlessMatch.championName}
                    </div>
                  </div>
                </div>
              )}

              {/* El Farmer */}
              {bestFarmer && (
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${bestFarmer.profileIconId}.png`}
                    alt={bestFarmer.alias || bestFarmer.gameName}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Scissors style={{ color: 'var(--accent-cyan)', width: '0.95rem', height: '0.95rem' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Farmer del Año</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.15rem' }}>{bestFarmer.alias || bestFarmer.gameName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Farmeó <strong style={{ color: 'var(--text-primary)' }}>{bestFarmer.csPerMin} CS/min</strong> ({bestFarmer.cs} minions) con {bestFarmer.championName}
                    </div>
                  </div>
                </div>
              )}

              {/* El Speedrunner */}
              {recordSpeedrunMatch && (
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${recordSpeedrunMatch.profileIconId}.png`}
                    alt={recordSpeedrunMatch.alias || recordSpeedrunMatch.gameName}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <TrendingUp style={{ color: 'var(--accent-purple)', width: '0.95rem', height: '0.95rem' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>El Speedrunner</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.15rem' }}>{recordSpeedrunMatch.alias || recordSpeedrunMatch.gameName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Ganó su partida en tan solo <strong style={{ color: 'var(--text-primary)' }}>{formatDuration(recordSpeedrunMatch.gameDuration)}</strong> con {recordSpeedrunMatch.championName}
                    </div>
                  </div>
                </div>
              )}

              {/* El Sacrificado */}
              {recordDeathsMatch && (
                <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <FallbackImage
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${recordDeathsMatch.profileIconId}.png`}
                    alt={recordDeathsMatch.alias || recordDeathsMatch.gameName}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    fallbackSrc={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/29.png`}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <HeartOff style={{ color: 'var(--loss-color)', width: '0.95rem', height: '0.95rem' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>El Sacrificado</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.15rem' }}>{recordDeathsMatch.alias || recordDeathsMatch.gameName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Murió <strong style={{ color: 'var(--loss-color)' }}>{recordDeathsMatch.deaths} veces</strong> en una sola partida con {recordDeathsMatch.championName}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: 0 }} />

          {/* Estadísticas de la Comunidad */}
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              📊 Hitos Colectivos del Servidor
            </h3>
            <div style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Partidas Totales</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }} className="mono">
                  {totalGamesPlayed}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Winrate Promedio</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }} className="mono">
                  {avgWinrate}%
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Pentakills del Servidor</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold-bright)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} className="mono">
                  <Award style={{ width: '1.25rem', height: '1.25rem' }} />
                  {totalPentakills}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Objetivos Robados</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--win-color)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} className="mono">
                  <ShieldAlert style={{ width: '1.25rem', height: '1.25rem' }} />
                  {totalSteals}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
