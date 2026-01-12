import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasTursoUrl = !!process.env.TURSO_DATABASE_URL;
  const hasTursoToken = !!process.env.TURSO_AUTH_TOKEN;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

  const isConfigured = hasTursoUrl && hasTursoToken && hasNextAuthSecret;

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasTursoUrl,
      hasTursoToken,
      hasNextAuthSecret,
      tursoUrlPrefix: process.env.TURSO_DATABASE_URL
        ? process.env.TURSO_DATABASE_URL.substring(0, 30) + '...'
        : null,
    },
    { status: isConfigured ? 200 : 503 }
  );
}
