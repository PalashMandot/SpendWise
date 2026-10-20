import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Wallet, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      showToast('Welcome back to SpendWise!', 'success');
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@spendwise.io');
    setPassword('demo123456');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-glow-brand mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Spend<span className="text-emerald-400">Wise</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Intelligent expense tracking & budget forecasting
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8 border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <h3 className="text-base font-semibold text-white">Sign In</h3>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              title="Autofill sample login credentials"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Demo Credentials</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to SpendWise
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
