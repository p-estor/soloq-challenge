'use client';

import React, { useState, useTransition } from 'react';
import { 
  addPlayerAction, 
  deletePlayerAction, 
  syncPlayerAction, 
  syncAllPlayersAction, 
  logoutAdminAction,
  togglePlayerEloAction,
  updatePlayerMainAccountAction
} from '@/app/actions';
import { UserPlus, Trash2, RefreshCw, LogOut, ShieldAlert, Award, Edit2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

interface Player {
  id: string;
  gameName: string;
  tagLine: string;
  alias: string | null;
  tier: string;
  rank: string;
  leaguePoints: number;
  isHighElo: boolean;
  mainGameName: string | null;
  mainTagLine: string | null;
  mainTier: string | null;
  mainRank: string | null;
  mainLp: number | null;
}

interface AdminDashboardProps {
  players: Player[];
}

export default function AdminDashboard({ players }: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncingPlayerId, setSyncingPlayerId] = useState<string | null>(null);

  // Form states for adding player
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [alias, setAlias] = useState('');
  const [isHighElo, setIsHighElo] = useState(false);
  const [mainGameName, setMainGameName] = useState('');
  const [mainTagLine, setMainTagLine] = useState('');

  // Inline editing states for main account
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editMainGameName, setEditMainGameName] = useState('');
  const [editMainTagLine, setEditMainTagLine] = useState('');

  // Notification states
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      setMessage(null);
      const res = await addPlayerAction(
        gameName, 
        tagLine, 
        alias, 
        isHighElo, 
        mainGameName || undefined, 
        mainTagLine || undefined
      );
      if (res.success) {
        showMessage(`Jugador ${gameName}#${tagLine} añadido e inicializado correctamente.`, 'success');
        setGameName('');
        setTagLine('');
        setAlias('');
        setIsHighElo(false);
        setMainGameName('');
        setMainTagLine('');
        router.refresh();
      } else {
        showMessage(res.error || 'Error al añadir el jugador.', 'error');
      }
    });
  };

  const handleToggleElo = async (id: string, name: string) => {
    startTransition(async () => {
      const res = await togglePlayerEloAction(id);
      if (res.success) {
        showMessage(`Nivel de Elo de ${name} actualizado.`, 'success');
        router.refresh();
      } else {
        showMessage(res.error || 'Error al cambiar el nivel de Elo.', 'error');
      }
    });
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${name}? Se borrarán también sus partidas e historial.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deletePlayerAction(id);
      if (res.success) {
        showMessage(`Jugador ${name} eliminado.`, 'success');
        router.refresh();
      } else {
        showMessage(res.error || 'Error al eliminar jugador.', 'error');
      }
    });
  };

  const handleSyncPlayer = async (id: string, name: string) => {
    if (syncingPlayerId) return;
    setSyncingPlayerId(id);
    setMessage(null);

    try {
      const res = await syncPlayerAction(id);
      if (res.success) {
        showMessage(`Datos de ${name} sincronizados correctamente.`, 'success');
        router.refresh();
      } else {
        showMessage(res.error || `Error al sincronizar a ${name}.`, 'error');
      }
    } catch {
      showMessage('Error inesperado de red al sincronizar.', 'error');
    } finally {
      setSyncingPlayerId(null);
    }
  };

  const handleSyncAll = async () => {
    if (isPending) return;
    setMessage(null);

    startTransition(async () => {
      const res = await syncAllPlayersAction();
      if (res.success) {
        showMessage(`Sincronización global completada. Se actualizaron ${res.count} jugadores.`, 'success');
        router.refresh();
      } else {
        showMessage(res.error || 'Error en la sincronización global.', 'error');
      }
    });
  };

  const startEditMain = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditMainGameName(player.mainGameName || '');
    setEditMainTagLine(player.mainTagLine || '');
  };

  const cancelEditMain = () => {
    setEditingPlayerId(null);
    setEditMainGameName('');
    setEditMainTagLine('');
  };

  const saveEditMain = async (playerId: string, name: string) => {
    startTransition(async () => {
      const res = await updatePlayerMainAccountAction(playerId, editMainGameName, editMainTagLine);
      if (res.success) {
        showMessage(`Cuenta principal de ${name} actualizada correctamente.`, 'success');
        setEditingPlayerId(null);
        router.refresh();
      } else {
        showMessage(res.error || 'Error al actualizar la cuenta principal.', 'error');
      }
    });
  };

  const handleLogout = async () => {
    await logoutAdminAction();
    router.refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Dashboard Top bar */}
      <div className="glass-panel admin-card" style={{ marginBottom: 0 }}>
        <div className="admin-header">
          <div className="admin-title">
            <ShieldAlert style={{ color: 'var(--loss-color)' }} />
            Panel de Administración
            <span className="admin-badge">Admin Session</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={handleSyncAll} 
              disabled={isPending || !!syncingPlayerId}
              className="btn btn-primary"
            >
              <RefreshCw size={14} className={isPending ? 'spinner' : ''} />
              Sincronizar Todos
            </button>
            
            <button onClick={handleLogout} className="btn btn-secondary btn-danger">
              <LogOut size={14} />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className={`alert-box ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        {/* Add Player Form */}
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-normal)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          Agregar Invocador al Reto
        </h4>

        <form onSubmit={handleAddPlayer}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre de Riot ID (Reto)</label>
              <input
                type="text"
                placeholder="Ej. Faker"
                required
                className="form-input"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Tag (#) (Reto)</label>
              <input
                type="text"
                placeholder="Ej. T1"
                required
                className="form-input"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alias / Apodo</label>
              <input
                type="text"
                placeholder="Ej. Faker el Dios"
                className="form-input"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre de Riot ID (Main Account)</label>
              <input
                type="text"
                placeholder="Ej. Hide on bush"
                className="form-input"
                value={mainGameName}
                onChange={(e) => setMainGameName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Tag (#) (Main Account)</label>
              <input
                type="text"
                placeholder="Ej. KR1"
                className="form-input"
                value={mainTagLine}
                onChange={(e) => setMainTagLine(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '100%', paddingTop: '1.8rem' }}>
              <input
                type="checkbox"
                id="isHighEloCheckbox"
                checked={isHighElo}
                onChange={(e) => setIsHighElo(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
              />
              <label htmlFor="isHighEloCheckbox" className="form-label" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
                ¿Es High Elo?
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isPending || !gameName || !tagLine} 
              className="btn btn-primary"
              style={{ width: '100%', gridColumn: 'span 2' }}
            >
              <UserPlus size={16} />
              Agregar Invocador
            </button>
          </div>
        </form>
      </div>

      {/* Players List Admin Card */}
      <div className="glass-panel widget-card">
        <h3 className="widget-title">
          <Award size={18} style={{ color: 'var(--accent-cyan)' }} />
          Participantes Registrados ({players.length})
        </h3>

        <div className="table-container">
          {players.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No hay invocadores registrados en el reto todavía.</p>
            </div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Invocador</th>
                  <th>Riot ID</th>
                  <th>Rango Reto</th>
                  <th>Cuenta Principal (Main)</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'right', width: '220px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const displayName = player.alias || player.gameName;
                  const isSyncing = syncingPlayerId === player.id;
                  const isEditingMain = editingPlayerId === player.id;
                  
                  return (
                    <tr key={player.id}>
                      <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {displayName}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {player.gameName}#{player.tagLine}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>
                          {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier.toUpperCase()) 
                            ? player.tier 
                            : `${translateTier(player.tier)} ${player.rank}`} ({player.leaguePoints} LP)
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {isEditingMain ? (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="Nombre"
                              className="form-input"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '90px', margin: 0 }}
                              value={editMainGameName}
                              onChange={(e) => setEditMainGameName(e.target.value)}
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>#</span>
                            <input
                              type="text"
                              placeholder="Tag"
                              className="form-input"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '50px', margin: 0 }}
                              value={editMainTagLine}
                              onChange={(e) => setEditMainTagLine(e.target.value)}
                            />
                            <button
                              onClick={() => saveEditMain(player.id, displayName)}
                              disabled={isPending}
                              className="btn btn-primary"
                              style={{ padding: '0.25rem', borderRadius: '4px' }}
                              title="Guardar"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={cancelEditMain}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem', borderRadius: '4px' }}
                              title="Cancelar"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {player.mainGameName ? (
                              <span>
                                <strong>{player.mainGameName}#{player.mainTagLine}</strong>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {player.mainTier ? (
                                    <>
                                      {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.mainTier.toUpperCase()) 
                                        ? player.mainTier 
                                        : `${translateTier(player.mainTier)} ${player.mainRank}`} ({player.mainLp} LP)
                                    </>
                                  ) : (
                                    'Sin rango cargado'
                                  )}
                                </span>
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin configurar</span>
                            )}
                            <button
                              onClick={() => startEditMain(player)}
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}
                              title="Editar Cuenta Principal"
                            >
                              <Edit2 size={10} /> Editar
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleElo(player.id, displayName)}
                          disabled={isPending}
                          className="btn"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                            backgroundColor: player.isHighElo ? 'rgba(6, 182, 212, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                            color: player.isHighElo ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                            border: '1px solid ' + (player.isHighElo ? 'rgba(6, 182, 212, 0.4)' : 'rgba(107, 114, 128, 0.3)'),
                            cursor: 'pointer',
                          }}
                          title="Haz clic para alternar nivel de Elo"
                        >
                          {player.isHighElo ? '🛡️ High Elo' : '⚔️ Low Elo'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleSyncPlayer(player.id, displayName)}
                            disabled={isPending || !!syncingPlayerId}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            <RefreshCw size={12} className={isSyncing ? 'spinner' : ''} />
                            Actualizar
                          </button>
                          
                          <button
                            onClick={() => handleDeletePlayer(player.id, displayName)}
                            disabled={isPending || !!syncingPlayerId}
                            className="btn btn-secondary btn-danger"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            <Trash2 size={12} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
