import { NextResponse } from 'next/server';
import { syncAllPlayers } from '@/lib/sync';
import { timingSafeCompare } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  // Custom header check as well
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const expectedToken = process.env.SYNC_TOKEN;

  // Enforce security: SYNC_TOKEN must be configured and matched using timing-safe comparison
  if (!expectedToken) {
    return NextResponse.json({ error: 'SYNC_TOKEN is not configured on the server' }, { status: 500 });
  }

  const isTokenValid =
    (token ? timingSafeCompare(token, expectedToken) : false) ||
    (bearerToken ? timingSafeCompare(bearerToken, expectedToken) : false);

  if (!isTokenValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAllPlayers();
    return NextResponse.json({
      message: 'Synchronization completed',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Synchronization failed', details: err.message || err },
      { status: 500 }
    );
  }
}

// Support POST request as well
export async function POST(request: Request) {
  return GET(request);
}
