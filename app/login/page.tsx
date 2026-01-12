'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberEmail') === 'true';
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const checkServerDiagnostics = async () => {
    try {
      const healthRes = await fetch('/api/health', { cache: 'no-store' });
      if (!healthRes.ok) {
        return { type: 'NOT_CONFIGURED' as const };
      }

      const debugRes = await fetch('/api/debug', { cache: 'no-store' });
      const debug = await debugRes.json().catch(() => null);

      if (!debug) {
        return { type: 'UNKNOWN' as const };
      }

      if (debug.tursoConnection === 'FAILED') {
        const errorMessage = String(debug.tursoError || '');
        if (errorMessage.toLowerCase().includes('no such table')) {
          return { type: 'DB_SCHEMA_MISSING' as const };
        }
        return { type: 'DB_CONNECTION_FAILED' as const };
      }

      const rawUserCount = debug.userCount ?? debug.prismaUserCount;
      const userCount =
        typeof rawUserCount === 'bigint'
          ? Number(rawUserCount)
          : typeof rawUserCount === 'number'
            ? rawUserCount
            : typeof rawUserCount === 'string'
              ? Number(rawUserCount)
              : null;

      if (userCount === 0) {
        return { type: 'DB_EMPTY' as const };
      }

      return { type: 'OK' as const };
    } catch {
      return { type: 'UNKNOWN' as const };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const diagnostics = await checkServerDiagnostics();

        if (diagnostics.type === 'NOT_CONFIGURED') {
          toast.error('Server database is not configured. Check /api/health');
        } else if (diagnostics.type === 'DB_SCHEMA_MISSING') {
          toast.error('Database schema is missing. Run setup-turso.js');
        } else if (diagnostics.type === 'DB_CONNECTION_FAILED') {
          toast.error('Cannot connect to database. Check Turso env settings.');
        } else if (diagnostics.type === 'DB_EMPTY') {
          toast.error('Database is empty. Run setup-turso.js or create-admin-turso.js');
        } else if (result.error === 'CredentialsSignin') {
          toast.error('Invalid email or password');
        } else {
          toast.error('Login failed due to a server error');
        }
      } else {
        // Save email if remember is checked
        if (rememberEmail) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberEmail', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberEmail');
        }
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (error) {
      const diagnostics = await checkServerDiagnostics();

      if (diagnostics.type === 'NOT_CONFIGURED') {
        toast.error('Server database is not configured. Check /api/health');
      } else if (diagnostics.type === 'DB_SCHEMA_MISSING') {
        toast.error('Database schema is missing. Run setup-turso.js');
      } else if (diagnostics.type === 'DB_CONNECTION_FAILED') {
        toast.error('Cannot connect to database. Check Turso env settings.');
      } else if (diagnostics.type === 'DB_EMPTY') {
        toast.error('Database is empty. Run setup-turso.js or create-admin-turso.js');
      } else {
        toast.error('An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              BBQ Chicken
            </h1>
            <h2 className="text-xl text-gray-600">Store Launch Ops</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="password123"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">Remember email</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setResetEmail(email);
                }}
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600">Keep me signed in</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 mb-2 font-semibold">
              Demo Accounts:
            </p>
            <p className="text-xs text-gray-600">
              Admin: admin@example.com / password123
            </p>
            <p className="text-xs text-gray-600">
              PM: pm@example.com / password123
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!resetEmail) {
                    toast.error('Please enter your email');
                    return;
                  }
                  setResetSending(true);
                  try {
                    const res = await fetch('/api/auth/forgot-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: resetEmail }),
                    });
                    if (res.ok) {
                      toast.success('Password reset instructions sent to your email');
                      setShowForgotPassword(false);
                    } else {
                      const data = await res.json();
                      toast.error(data.error || 'Failed to send reset email');
                    }
                  } catch {
                    toast.error('Failed to send reset email');
                  } finally {
                    setResetSending(false);
                  }
                }}
                disabled={resetSending}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
              >
                {resetSending ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Email sending requires SMTP configuration. Contact admin if you don't receive the email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
