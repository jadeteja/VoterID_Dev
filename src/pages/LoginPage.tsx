import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vote, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('officer@ward81.gov.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!email.includes('@')) {
        throw new Error('Please enter a valid official email address');
      }
      await login(email, role);
      navigate('/search');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F8FC]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
            <Vote className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Ward 81 Voter Search
          </h1>
          <p className="text-sm font-telugu text-blue-800 font-semibold">
            వార్డు 81 ఓటర్ల శోధన – విజయవాడ మున్సిపల్ కార్పొరేషన్
          </p>
          <p className="text-xs text-slate-400">
            Authorized Personnel Only • అధికారిక వినియోగదారుల లాగిన్
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Email / ఈమెయిల్
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@ward81.gov.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password / పాస్‌వర్డ్
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Access Role / పాత్ర
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="admin">Administrator (ఎలక్షన్ అధికారి - పూర్తి అనుమతులు)</option>
              <option value="search_user">Search User (బూత్ ఏజెంట్ - శోధన మాత్రమే)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#123D73] hover:bg-blue-800 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span>{isLoading ? 'Signing In...' : 'Sign In / లాగిన్ అవ్వండి'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
          Security policy enforced. All database reads are recorded to audit logs.
        </div>
      </div>
    </div>
  );
};
