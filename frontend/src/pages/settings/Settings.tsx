import React, { useState } from 'react';
import { useAuth } from '../../contexts/Auth';
import { UserService } from '../../services/userService';
import { AuthService } from '../../services/authService';
import { UserRole } from '../../types';
import { 
  Key, Mail, Trash2, CheckCircle, 
  AlertCircle, Lock, Shield, Send, Check 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();

  // Password Update
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Email Change Flow
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // Role Request
  const [requestedRole, setRequestedRole] = useState<UserRole>(UserRole.REVIEWER);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSuccess, setRoleSuccess] = useState('');
  const [roleError, setRoleError] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (password.length < 8) {
      setPwdError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setPwdError("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setPwdError("Passwords do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      await UserService.updateMe({ password: password as any });
      setPwdSuccess("Password updated successfully!");
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    const domainPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|org|ac\.[a-z]{2}|gov)$/;
    if (!domainPattern.test(newEmail)) {
      setEmailError("New email must be from a recognized research institution domain.");
      return;
    }

    setEmailLoading(true);
    try {
      await AuthService.requestEmailChange({ new_email: newEmail as any });
      setEmailChangeRequested(true);
      alert(`[DEMO SYSTEM] Simulated OTP email change code sent to ${newEmail}. Check popup/console.`);
    } catch (err: any) {
      setEmailError(err.message || "Failed to initiate email change.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (emailCode.length !== 6) {
      setEmailError("Verification code must be exactly 6 digits.");
      return;
    }

    setEmailLoading(true);
    try {
      await AuthService.verifyEmailChange({ email: newEmail as any, code: emailCode });
      setEmailSuccess("Email updated successfully! Please re-authenticate under your new credentials.");
      
      setTimeout(() => {
        logout(); // Logout to let them log in with new email
      }, 2500);

    } catch (err: any) {
      setEmailError(err.message || "Invalid or expired verification code.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError('');
    setRoleSuccess('');
    setRoleLoading(true);

    try {
      const res = await UserService.requestRoleChange(requestedRole);
      setRoleSuccess(res.message);
      await refreshUser();
    } catch (err: any) {
      setRoleError(err.message || "Failed to submit role change request.");
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete your account and all associated profile details. This cannot be undone. Are you sure you want to proceed?")) return;
    try {
      await UserService.deleteMe();
      logout();
    } catch {
      alert("Failed to delete account.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security & Settings</h1>
        <p className="text-slate-500 text-sm">Review profile roles, update credentials, or upgrade permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Password and Email change */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Password update card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Key className="w-4.5 h-4.5 text-navy-550" /> Update Password</h3>
            
            {pwdError && (
              <div className="p-2.5 bg-red-50 text-red-650 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{pwdError}</span>
              </div>
            )}
            
            {pwdSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Min 8 chars"
                    required
                    className="w-full px-4.5 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={pwdLoading}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="Re-type"
                    required
                    className="w-full px-4.5 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={pwdLoading}
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={pwdLoading}
                className="py-2 px-4 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" /> Update Credentials
              </button>
            </form>
          </div>

          {/* Email Update Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Mail className="w-4.5 h-4.5 text-navy-550" /> Change Institutional Email</h3>
            
            {emailError && (
              <div className="p-2.5 bg-red-50 text-red-655 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{emailError}</span>
              </div>
            )}
            
            {emailSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {!emailChangeRequested ? (
              <form onSubmit={handleRequestEmailChange} className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">New Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. new.email@university.edu"
                    required
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    disabled={emailLoading}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={emailLoading}
                  className="py-2 px-4 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Request Email Update (Send OTP)
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailChange} className="space-y-4 max-w-md animate-scale-in">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500">Enter the 6-digit confirmation code simulated and sent to {newEmail}:</p>
                  <input 
                    type="text" 
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full text-center px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-955 rounded-xl text-lg tracking-[0.3em] font-mono focus:outline-none"
                    value={emailCode}
                    onChange={e => setEmailCode(e.target.value.replace(/\D/g, ''))}
                    disabled={emailLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    disabled={emailLoading || emailCode.length !== 6}
                    className="py-2 px-4 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Confirm Update
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEmailChangeRequested(false)}
                    className="py-2 px-4 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Right Column: Roles, Banish, delete */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active status & Role Upgrade card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Shield className="w-4.5 h-4.5 text-navy-550" /> Account Upgrade</h3>
            
            <div className="text-xs space-y-2 border-b border-slate-100 dark:border-slate-850 pb-3 leading-normal">
              <p>Current Role: <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{user?.role.replace('_', ' ')}</span></p>
              <p>Verified: <span className="font-semibold text-emerald-600">{user?.is_verified ? 'Yes' : 'No'}</span></p>
              <p>Status: <span className="font-semibold text-blue-600 capitalize">{user?.status}</span></p>
              {user?.requested_role && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-700 dark:text-amber-400">
                  Pending Upgrade Request: <span className="font-bold capitalize">{user.requested_role}</span>
                </div>
              )}
            </div>

            {roleError && (
              <div className="p-2.5 bg-red-50 text-red-650 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{roleError}</span>
              </div>
            )}

            {roleSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs flex gap-2">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{roleSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRequestRoleChange} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400 block font-medium">Request Upgrade To</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                  value={requestedRole}
                  onChange={e => setRequestedRole(e.target.value as any)}
                  disabled={roleLoading}
                >
                  <option value={UserRole.RESEARCHER}>Researcher</option>
                  <option value={UserRole.REVIEWER}>Reviewer</option>
                  <option value={UserRole.INSTITUTION_ADMIN}>Institution Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={roleLoading || user?.role === requestedRole}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Submit Upgrade Request
              </button>
            </form>
          </div>

          {/* Delete Account */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-red-200/50 dark:border-red-950/40 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-red-650 flex items-center gap-1.5"><Trash2 className="w-4.5 h-4.5" /> Danger Zone</h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Deleting your account removes all authorization nodes, publications credits, and profile directories from SCN permanently.
            </p>
            <button 
              onClick={handleDeleteAccount}
              className="w-full py-2 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Permanently Delete Account
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
