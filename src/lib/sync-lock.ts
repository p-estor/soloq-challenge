import { prisma } from './db';

export const SYNC_LOCK_KEY = 'SYNC_LOCK';
export const LOCK_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

export interface SyncLockData {
  lockedAt: number;
  pid: number;
  initiator?: string;
}

export interface SettingsStoreLike {
  findUnique(args: { where: { key: string } }): Promise<{ key: string; value: string } | null>;
  upsert(args: {
    where: { key: string };
    create: { key: string; value: string };
    update: { value: string };
  }): Promise<{ key: string; value: string }>;
  delete(args: { where: { key: string } }): Promise<{ key: string; value: string }>;
}

/**
 * Attempts to acquire the synchronization lock in the Settings table.
 * If a lock exists and is younger than LOCK_EXPIRATION_MS, acquisition fails.
 * If lock exists but has expired (process died/stale), it overrides it.
 */
export async function acquireSyncLock(
  initiator = 'system',
  store: SettingsStoreLike = prisma.settings,
  now = Date.now()
): Promise<boolean> {
  const existing = await store.findUnique({
    where: { key: SYNC_LOCK_KEY },
  });

  if (existing?.value) {
    try {
      const data = JSON.parse(existing.value) as SyncLockData;
      if (typeof data.lockedAt === 'number' && now - data.lockedAt < LOCK_EXPIRATION_MS) {
        return false;
      }
      console.warn(
        `[SyncLock] Lock de sincronización expirado (iniciado hace ${Math.round(
          (now - data.lockedAt) / 1000 / 60
        )} min). Sobrescribiendo lock huérfano.`
      );
    } catch {
      // Corrupt lock value, allow override
    }
  }

  const lockData: SyncLockData = {
    lockedAt: now,
    pid: process.pid,
    initiator,
  };

  await store.upsert({
    where: { key: SYNC_LOCK_KEY },
    create: {
      key: SYNC_LOCK_KEY,
      value: JSON.stringify(lockData),
    },
    update: {
      value: JSON.stringify(lockData),
    },
  });

  return true;
}

/**
 * Releases the synchronization lock from the Settings table.
 */
export async function releaseSyncLock(
  store: SettingsStoreLike = prisma.settings
): Promise<void> {
  try {
    await store.delete({
      where: { key: SYNC_LOCK_KEY },
    });
  } catch {
    // If lock was already removed or didn't exist, ignore
  }
}
