import React, { useState } from 'react';
import { LogIn, ShieldAlert, Building2, UserCheck, KeyRound, HelpCircle } from 'lucide-react';
import { User, AuthState } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoAcc, setShowDemoAcc] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and security password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication aborted by system');
      }

      // Success callback
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Connection failed. Ensure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (mEmail: string, mPass: string) => {
    setEmail(mEmail);
    setPassword(mPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-indigo-200 shadow-lg text-white">
            <Building2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          Organization Expense Tracker
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Secure Internal Gated Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-700 font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Security Password
                </label>
              </div>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                id="btn-login-submit"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying Credentials...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Gate Access
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Preset Demo Credentials helper */}
          {showDemoAcc && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3 bg-slate-50 py-1.5 px-2.5 rounded-lg w-max border border-slate-200/50">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pre-Configured Credentials (Multi-Tenancy Demo)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <span className="font-bold text-slate-700 block mb-1.5 text-[11px] uppercase tracking-wider text-indigo-600">Acme Corp (Org A)</span>
                  <button
                    type="button"
                    onClick={() => fillCredentials('accountant@acme.com', 'password123')}
                    className="w-full text-left py-1 text-slate-600 hover:text-indigo-600 font-medium flex items-center justify-between"
                  >
                    <span>💼 Accountant</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">Fill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('employee@acme.com', 'password123')}
                    className="w-full text-left py-1 text-slate-600 hover:text-indigo-600 font-medium flex items-center justify-between mt-1"
                  >
                    <span>👤 Employee</span>
                    <span className="text-[10px] bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded">Fill</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <span className="font-bold text-slate-700 block mb-1.5 text-[11px] uppercase tracking-wider text-emerald-600">Globex (Org B)</span>
                  <button
                    type="button"
                    onClick={() => fillCredentials('accountant@globex.com', 'password123')}
                    className="w-full text-left py-1 text-slate-600 hover:text-emerald-600 font-medium flex items-center justify-between"
                  >
                    <span>💼 Accountant</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">Fill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('employee@globex.com', 'password123')}
                    className="w-full text-left py-1 text-slate-600 hover:text-emerald-600 font-medium flex items-center justify-between mt-1"
                  >
                    <span>👤 Employee</span>
                    <span className="text-[10px] bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded">Fill</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
