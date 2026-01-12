import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';

function getDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return null;
  }

  return createClient({ url, authToken });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ valid: false, error: 'Database not configured' });
    }

    // Check if token exists and is not expired
    const result = await db.execute({
      sql: `SELECT * FROM "PasswordResetToken" WHERE token = ? AND expiresAt > datetime('now')`,
      args: [token],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to verify token' });
  }
}
