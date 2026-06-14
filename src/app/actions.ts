'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { riot } from '@/lib/riot';
import { syncPlayer, syncAllPlayers } from '@/lib/sync';

// Basic admin password check
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'soloq-admin-123';

// Verify if current user is admin
async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  return session === 'authenticated';
}

export async function loginAdminAction(password: string): Promise<{ success: boolean; error?: string }> {
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return { success: true };
  }
  return { success: false, error: 'Contraseña incorrecta' };
}

export async function logoutAdminAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export async function checkAdminStatusAction(): Promise<boolean> {
  return await isAdmin();
}

export async function addPlayerAction(
  gameName: string,
  tagLine: string,
  alias?: string,
  isHighElo: boolean = false,
  mainGameName?: string,
  mainTagLine?: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) {
    return { success: false, error: 'No autorizado' };
  }

  const cleanGameName = gameName.trim();
  const cleanTagLine = tagLine.trim().replace(/^#/, ''); // Remove leading '#' if typed

  if (!cleanGameName || !cleanTagLine) {
    return { success: false, error: 'El nombre y el tag de Riot ID son obligatorios' };
  }

  try {
    // 1. Check if player already exists
    const existingPlayer = await prisma.player.findFirst({
      where: {
        gameName: cleanGameName,
        tagLine: cleanTagLine,
      },
    });

    if (existingPlayer) {
      return { success: false, error: 'Este jugador ya está registrado' };
    }

    // 2. Fetch PUUID from Riot API
    const riotAccount = await riot.getAccountByRiotId(cleanGameName, cleanTagLine);
    
    // 3. Create player in database
    const newPlayer = await prisma.player.create({
      data: {
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        puuid: riotAccount.puuid,
        alias: alias?.trim() || null,
        isHighElo,
        mainGameName: mainGameName?.trim() || null,
        mainTagLine: mainTagLine?.trim() || null,
      },
    });

    // 4. Run initial sync to fetch rank and matches
    await syncPlayer(newPlayer.id);

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error adding player:', err);
    return { 
      success: false, 
      error: err.message || 'Error al conectar con la API de Riot o guardar el jugador' 
    };
  }
}

export async function deletePlayerAction(playerId: string): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    await prisma.player.delete({
      where: { id: playerId },
    });
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting player:', err);
    return { success: false, error: 'Error al eliminar al jugador' };
  }
}

export async function syncPlayerAction(playerId: string): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    await syncPlayer(playerId);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error syncing player:', err);
    return { success: false, error: err.message || 'Error al sincronizar jugador' };
  }
}

export async function syncAllPlayersAction(): Promise<{ success: boolean; count: number; error?: string }> {
  if (!(await isAdmin())) {
    return { success: false, count: 0, error: 'No autorizado' };
  }

  try {
    const result = await syncAllPlayers();
    revalidatePath('/');
    return { success: true, count: result.count };
  } catch (err: any) {
    console.error('Error syncing all players:', err);
    return { success: false, count: 0, error: err.message || 'Error al sincronizar' };
  }
}

export async function togglePlayerEloAction(playerId: string): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { isHighElo: true },
    });

    if (!player) {
      return { success: false, error: 'Jugador no encontrado' };
    }

    await prisma.player.update({
      where: { id: playerId },
      data: { isHighElo: !player.isHighElo },
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error toggling player Elo:', err);
    return { success: false, error: err.message || 'Error al cambiar el nivel del jugador' };
  }
}

export async function updatePlayerMainAccountAction(
  playerId: string,
  mainGameName: string,
  mainTagLine: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) {
    return { success: false, error: 'No autorizado' };
  }

  const cleanMainGameName = mainGameName.trim();
  const cleanMainTagLine = mainTagLine.trim().replace(/^#/, '');

  try {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        mainGameName: cleanMainGameName || null,
        mainTagLine: cleanMainTagLine || null,
        mainTier: null,
        mainRank: null,
        mainLp: null,
      },
    });

    // Run sync in the background for this player to populate main account elo immediately
    await syncPlayer(playerId);

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error updating player main account:', err);
    return { success: false, error: err.message || 'Error al actualizar cuenta principal' };
  }
}
