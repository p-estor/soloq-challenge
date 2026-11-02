import { describe, it, expect, beforeEach } from 'vitest';
import {
  acquireSyncLock,
  releaseSyncLock,
  SYNC_LOCK_KEY,
  LOCK_EXPIRATION_MS,
  SettingsStoreLike,
} from './sync-lock';

class MockSettingsStore implements SettingsStoreLike {
  private data = new Map<string, string>();

  async findUnique({ where }: { where: { key: string } }) {
    const val = this.data.get(where.key);
    if (!val) return null;
    return { key: where.key, value: val };
  }

  async upsert({
    where,
    create,
    update,
  }: {
    where: { key: string };
    create: { key: string; value: string };
    update: { value: string };
  }) {
    const existing = this.data.get(where.key);
    const value = existing ? update.value : create.value;
    this.data.set(where.key, value);
    return { key: where.key, value };
  }

  async delete({ where }: { where: { key: string } }) {
    const existing = this.data.get(where.key);
    if (!existing) {
      throw new Error('Record not found');
    }
    this.data.delete(where.key);
    return { key: where.key, value: existing };
  }

  getRaw(key: string) {
    return this.data.get(key);
  }
}

describe('sync-lock', () => {
  let mockStore: MockSettingsStore;

  beforeEach(() => {
    mockStore = new MockSettingsStore();
  });

  it('adquiere el lock exitosamente cuando no existe lock previo', async () => {
    const acquired = await acquireSyncLock('test-cron', mockStore);
    expect(acquired).toBe(true);

    const stored = mockStore.getRaw(SYNC_LOCK_KEY);
    expect(stored).toBeDefined();
    const data = JSON.parse(stored!);
    expect(data.initiator).toBe('test-cron');
    expect(typeof data.lockedAt).toBe('number');
  });

  it('rechaza adquirir el lock si ya existe uno activo (menor a 15 min)', async () => {
    const now = 10000000;
    // Primer proceso adquiere lock
    const firstAcquire = await acquireSyncLock('proc-1', mockStore, now);
    expect(firstAcquire).toBe(true);

    // Segundo proceso intenta adquirirlo 5 minutos después
    const fiveMinutesLater = now + 5 * 60 * 1000;
    const secondAcquire = await acquireSyncLock('proc-2', mockStore, fiveMinutesLater);
    expect(secondAcquire).toBe(false);

    // El lock original no debe haberse sobrescrito
    const stored = JSON.parse(mockStore.getRaw(SYNC_LOCK_KEY)!);
    expect(stored.initiator).toBe('proc-1');
  });

  it('sobrescribe el lock huérfano si ha caducado (más de 15 min)', async () => {
    const now = 10000000;
    // Primer proceso adquiere lock
    await acquireSyncLock('crashed-process', mockStore, now);

    // Segundo proceso intenta adquirirlo 16 minutos después (pasado LOCK_EXPIRATION_MS)
    const sixteenMinutesLater = now + LOCK_EXPIRATION_MS + 1000;
    const secondAcquire = await acquireSyncLock('new-cron', mockStore, sixteenMinutesLater);
    expect(secondAcquire).toBe(true);

    const stored = JSON.parse(mockStore.getRaw(SYNC_LOCK_KEY)!);
    expect(stored.initiator).toBe('new-cron');
    expect(stored.lockedAt).toBe(sixteenMinutesLater);
  });

  it('libera el lock correctamente permitiendo que otro proceso lo adquiera', async () => {
    await acquireSyncLock('proc-1', mockStore);
    expect(mockStore.getRaw(SYNC_LOCK_KEY)).toBeDefined();

    await releaseSyncLock(mockStore);
    expect(mockStore.getRaw(SYNC_LOCK_KEY)).toBeUndefined();

    // Ahora otro proceso puede adquirirlo sin problemas
    const acquiredAgain = await acquireSyncLock('proc-2', mockStore);
    expect(acquiredAgain).toBe(true);
  });

  it('releaseSyncLock no falla si el lock ya no existía', async () => {
    await expect(releaseSyncLock(mockStore)).resolves.not.toThrow();
  });
});
