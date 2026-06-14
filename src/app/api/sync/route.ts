import { NextResponse } from 'next/server';
import { syncAllPlayers } from '@/lib/sync';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  // Custom header check as well
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const expectedToken = process.env.SYNC_TOKEN;

  // If SYNC_TOKEN is defined in env, enforce security
  if (expectedToken && token !== expectedToken && bearerToken !== expectedToken) {
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
