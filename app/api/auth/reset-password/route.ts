import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

function getDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return null;
  }

  return createClient({ url, authToken });
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Find valid token
    const tokenResult = await db.execute({
      sql: `SELECT * FROM "PasswordResetToken" WHERE token = ? AND expiresAt > datetime('now')`,
      args: [token],
    });

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const resetToken = tokenResult.rows[0];
    const userId = resetToken.userId as string;

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await db.execute({
      sql: 'UPDATE "User" SET password = ?, updatedAt = datetime("now") WHERE id = ?',
      args: [hashedPassword, userId],
    });

    // Delete used token
    await db.execute({
      sql: 'DELETE FROM "PasswordResetToken" WHERE token = ?',
      args: [token],
    });

    console.log(`Password reset successful for user ${userId}`);

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
