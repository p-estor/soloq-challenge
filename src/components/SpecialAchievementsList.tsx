'use client';

import React, { useState, useEffect } from 'react';
import { Skull, Zap, Flame, Shield, Eye, EyeOff } from 'lucide-react';
import FallbackImage from '@/components/FallbackImage';

interface Winner {
  player: {
    id: string;
    gameName: string;
    alias: string | null;
    profileIconId: number;
  };
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

interface Props {
  achievements: Achievement[];
}

const IconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  penta_1: Skull,
  baron_steal: Zap,
  win_streak_10: Flame,
  enemy_jungle_stealer: Shield,
  vision_god: Eye,
  ward_slayer: EyeOff,
};

export default function SpecialAchievementsList({ achievements }: Props) {
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    const checkTheme = () =>
      setIsPro(document.documentElement.getAttribute('data-theme') === 'pro');
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
      gap: '1.5rem',
    }}>
      {/* Scrollbar Customization Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}} />

      {achievements.map((achievement) => {
        const IconComponent = IconMap[achievement.id] || Skull;
        const isUnlocked = achievement.status === 'Desbloqueado';

        const firstWinner = achievement.winners[0];
        const remainingWinners = achievement.winners.slice(1);

        return (
          <div
            key={achievement.id}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              opacity: isUnlocked ? 1 : 0.5,
              border: isPro ? '1px solid var(--border-normal)' : (isUnlocked ? `1px solid ${achievement.color}33` : '1px solid var(--border-normal)'),
              boxShadow: isPro ? 'none' : (isUnlocked ? achievement.shadow : 'none'),
              transition: 'all 0.3s ease',
              '--hover-border-color': achievement.color,
              '--hover-shadow': achievement.shadow,
            } as React.CSSProperties}
          >
            {/* Header */}
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '12px',
                background: isPro ? 'rgba(255, 255, 255, 0.05)' : (isUnlocked ? `${achievement.color}15` : 'rgba(255, 255, 255, 0.03)'),
                color: isUnlocked ? achievement.color : 'var(--text-muted)',
                border: isPro ? '1px solid var(--border-normal)' : (isUnlocked ? `1px solid ${achievement.color}30` : '1px solid var(--border-normal)'),
                flexShrink: 0,
              }}>
                <IconComponent size={24} />
              </div>
              <div style={{ flex: 1, minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{achievement.title}</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: isUnlocked ? 'var(--win-color)' : 'var(--text-muted)' }}>
                    {achievement.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {achievement.description}
                </p>
              </div>
            </div>

            {/* Winners Section */}
            <div style={{ borderTop: '1px solid var(--border-normal)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* 1. First Achiever Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Primer desbloqueo:
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(5, 8, 12, 0.4)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-normal)',
                  height: '56px',
                  boxSizing: 'border-box',
                  justifyContent: !firstWinner ? 'center' : 'flex-start',
                }}>
                  {firstWinner ? (
                    <>
                      <FallbackImage
                        src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${firstWinner.championName}.png`}
                        alt={firstWinner.championName}
                        width={32}
                        height={32}
                        style={{ borderRadius: '50%', border: `1.5px solid ${achievement.color}` }}
                        fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {firstWinner.player.alias || firstWinner.player.gameName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          Desbloqueado el {formatDate(firstWinner.date)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      width: '100%',
                    }}>
                      Esperando primer desbloqueo...
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Next Achievers Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Siguientes desbloqueos:
                </div>
                <div style={{
                  background: 'rgba(5, 8, 12, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-normal)',
                  height: '56px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: remainingWinners.length === 0 ? 'center' : 'flex-start',
                  overflowY: remainingWinners.length > 1 ? 'auto' : 'hidden',
                }}
                className="custom-scrollbar"
                >
                  {remainingWinners.length === 0 ? (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      boxSizing: 'border-box',
                    }}>
                      Esperando siguiente desbloqueo...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      {remainingWinners.map((winner, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          boxSizing: 'border-box',
                          width: '100%',
                          height: '54px',
                          flexShrink: 0,
                        }}>
                          <FallbackImage
                            src={`https://ddragon.leagueoflegends.com/cdn/16.10.1/img/champion/${winner.championName}.png`}
                            alt={winner.championName}
                            width={32}
                            height={32}
                            style={{ borderRadius: '50%', border: '1.5px solid var(--border-normal)' }}
                            fallbackSrc="https://ddragon.leagueoflegends.com/cdn/16.10.1/img/profileicon/29.png"
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {winner.player.alias || winner.player.gameName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                              Desbloqueado el {formatDate(winner.date)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}
