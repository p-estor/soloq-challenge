import { prisma } from './db';

export const DEFAULT_CHALLENGE_START_DATE = '2026-06-07T00:00:00+02:00';
export const DEFAULT_CHALLENGE_END_DATE = '2026-07-07T23:59:59+02:00';

export interface ChallengeDates {
  startDate: Date;
  endDate: Date;
}

/**
 * Resolves the challenge start and end dates with the following priority:
 * 1. Database `Settings` table (`CHALLENGE_START_DATE`, `CHALLENGE_END_DATE`)
 * 2. Environment variables (`process.env.CHALLENGE_START_DATE`, `process.env.CHALLENGE_END_DATE`)
 * 3. Default constant dates
 */
export async function getChallengeDates(): Promise<ChallengeDates> {
  let startStr = process.env.CHALLENGE_START_DATE;
  let endStr = process.env.CHALLENGE_END_DATE;

  try {
    const [startSetting, endSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'CHALLENGE_START_DATE' } }),
      prisma.settings.findUnique({ where: { key: 'CHALLENGE_END_DATE' } }),
    ]);

    if (startSetting?.value) {
      startStr = startSetting.value;
    }
    if (endSetting?.value) {
      endStr = endSetting.value;
    }
  } catch (err) {
    console.warn('[Config] Failed to fetch challenge dates from database Settings, falling back to env/defaults:', err);
  }

  const startDate = new Date(startStr || DEFAULT_CHALLENGE_START_DATE);
  const endDate = new Date(endStr || DEFAULT_CHALLENGE_END_DATE);

  return {
    startDate,
    endDate,
  };
}
