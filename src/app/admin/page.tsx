import React from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (sessionToken) {
    try {
      isAuthenticated = verifyAdminSessionToken(sessionToken);
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Fetch all players ordered by gameName/alias
  const players = await prisma.player.findMany({
    orderBy: { gameName: 'asc' },
    select: {
      id: true,
      gameName: true,
      tagLine: true,
      alias: true,
      tier: true,
      rank: true,
      leaguePoints: true,
      isHighElo: true,
      mainGameName: true,
      mainTagLine: true,
      mainTier: true,
      mainRank: true,
      mainLp: true,
    },
  });

  return <AdminDashboard players={players} />;
}
