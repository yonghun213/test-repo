import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import crypto from 'crypto';

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
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Check if user exists
    const result = await db.execute({
      sql: 'SELECT id, email, name FROM User WHERE email = ?',
      args: [email],
    });

    if (result.rows.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    // Store reset token in database
    // First, check if PasswordResetToken table exists, if not we'll create a simple in-memory solution
    try {
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "token" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "expiresAt" TEXT NOT NULL,
          "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        args: [],
      });

      // Delete any existing tokens for this user
      await db.execute({
        sql: 'DELETE FROM "PasswordResetToken" WHERE userId = ?',
        args: [user.id as string],
      });

      // Insert new token
      await db.execute({
        sql: 'INSERT INTO "PasswordResetToken" (id, token, userId, expiresAt) VALUES (?, ?, ?, ?)',
        args: [crypto.randomUUID(), resetToken, user.id as string, resetExpiry],
      });
    } catch (tableError) {
      console.error('Failed to create/use PasswordResetToken table:', tableError);
      // Continue anyway - we'll just log the token for manual recovery
    }

    // Log the reset link (in production, this would be sent via email)
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`
========================================
PASSWORD RESET REQUEST
========================================
User: ${user.email}
Reset Link: ${resetLink}
Token: ${resetToken}
Expires: ${resetExpiry}
========================================
Note: In production, configure SMTP to send this via email.
========================================
    `);

    // In a real implementation, you would send an email here
    // For now, we'll return success and log the token
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In dev mode, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { devToken: resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
