'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDbNotConfigured =
    (error as any)?.code === 'DB_NOT_CONFIGURED' ||
    error.message?.includes('DB_NOT_CONFIGURED') ||
    error.message?.includes('Database is not configured');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
        <p className="text-xl text-gray-600 mb-4">
          {isDbNotConfigured ? 'Database is not configured' : 'Something went wrong'}
        </p>
        {isDbNotConfigured && (
          <div className="max-w-xl mx-auto mb-8 text-left bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              Set these environment variables and redeploy:
            </p>
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
NEXTAUTH_SECRET
            </pre>
            <p className="text-xs text-gray-500 mt-3">
              You can also open <span className="font-mono">/api/health</span> to verify configuration.
            </p>
          </div>
        )}
        <button
          onClick={reset}
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
