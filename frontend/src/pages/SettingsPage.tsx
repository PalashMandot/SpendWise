import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi, seedApi } from '../services/api';
import { Button } from '../components/common/Button';
import {
  User,
  Lock,
  Globe,
  Database,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sandbox State
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      const updated = await authApi.updateProfile({ full_name: fullName, currency });
      updateUser(updated);
      showToast('Profile settings saved successfully!', 'success');
    } catch {
      showToast('Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      showToast('Password updated securely!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      const res = await seedApi.seedDemoData();
      showToast(res.message || 'Demo data loaded successfully!', 'success');
    } catch {
      showToast('Failed to seed demo data.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('WARNING: This will permanently erase all transactions, budgets, custom categories, and recurring rules. Proceed?')) {
      return;
    }

    try {
      setIsResetting(true);
      await seedApi.resetData();
      showToast('All financial records have been reset to empty state.', 'info');
    } catch {
      showToast('Failed to reset account data.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Manage your personal security credentials, currency preferences, and demo sandbox data
        </p>
      </div>

      {/* Profile & Currency */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Profile Details</h3>
            <p className="text-xs text-slate-400">Update your public name and primary display currency</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Display Currency
            </label>
            <div className="relative max-w-xs">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
              Save Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* Password Security */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Security & Password</h3>
            <p className="text-xs text-slate-400">Ensure your account uses a strong, unique password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full sm:max-w-md px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="secondary" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Sandbox & Data Management */}
      <div className="glass-card p-6 border-slate-800">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sandbox & Portfolio Controls</h3>
            <p className="text-xs text-slate-400">Generate realistic sample demo records or wipe account data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-white">Seed Realistic Demo Data</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Populates 3 months of past income, leases, groceries, utility bills, and budgets.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemoData}
              isLoading={isSeeding}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              className="shrink-0 border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
            >
              Seed Demo Data
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-rose-300">Wipe & Reset All Records</h4>
              <p className="text-xs text-rose-400/80 mt-0.5">
                Permanently clears all transactions, monthly budgets, custom categories, and schedules for this user.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleResetData}
              isLoading={isResetting}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Reset All Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
