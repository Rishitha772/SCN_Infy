import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { GitFork, AlertTriangle } from 'lucide-react';
import { UserRole } from '../../types';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>(UserRole.RESEARCHER);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validations (mimicking backend validators)
    const domainPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|org|ac\.[a-z]{2}|gov)$/;
    if (!domainPattern.test(email)) {
      setError("Email must be an institutional domain ending with .edu, .org, ac.xx, or .gov.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Pass requested_role
      await register({
        email,
        password: password as any, // mixin
        requested_role: requestedRole
      });

      // Save user's temporary name in localStorage to create profile later!
      localStorage.setItem(`pending_name_${email}`, name);

      // Route to Verify Email View
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-navy-600 dark:text-navy-400 text-lg mb-1">
            <GitFork className="w-5 h-5 text-navy-500 animate-pulse" />
            <span>SCN Portal</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Create Academic Account</h2>
          <p className="text-xs text-slate-500 font-medium">Verify your institutional domain to begin collaborations.</p>
        </div>

        {/* Errors Box */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Dr. Jane Doe"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Institutional Email</label>
            <input 
              type="email" 
              required
              placeholder="e.g. jane.doe@university.edu"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
              <input 
                type="password" 
                required
                placeholder="Min 8 chars"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirm Password</label>
              <input 
                type="password" 
                required
                placeholder="Confirm"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-medium block">Requested Platform Role</label>
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[
                { role: UserRole.RESEARCHER, label: 'Researcher' },
                { role: UserRole.REVIEWER, label: 'Reviewer' },
                { role: UserRole.INSTITUTION_ADMIN, label: 'Inst Admin' }
              ].map(item => (
                <button
                  type="button"
                  key={item.role}
                  onClick={() => setRequestedRole(item.role)}
                  className={`py-2 px-1 border rounded-xl text-xs font-semibold capitalize transition-all ${
                    requestedRole === item.role
                      ? 'border-navy-600 bg-navy-50 dark:bg-navy-950/20 text-navy-650 dark:text-navy-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
              * Note: System Admin accounts cannot be self-requested. Accounts remain in pending queue until approved by System Admin.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-navy-500/10 flex items-center justify-center gap-2 transition-all mt-6"
          >
            {loading ? 'Submitting registration...' : 'Verify Domain (Send OTP)'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-850 text-xs">
          <span className="text-slate-400">Already registered? </span>
          <Link to="/login" className="font-semibold text-navy-600 dark:text-navy-400 hover:underline">Sign In</Link>
        </div>

      </div>
    </div>
  );
};
