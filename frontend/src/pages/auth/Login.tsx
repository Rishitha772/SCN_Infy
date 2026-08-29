import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { GitFork, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password, requested_role: 'researcher' as any });
      // Redirect to OTP entry view
      navigate(`/verify-login?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-navy-600 dark:text-navy-400 text-lg mb-2">
            <GitFork className="w-5 h-5 text-navy-500 animate-pulse" />
            <span>SCN Portal</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Sign In to SCN</h2>
          <p className="text-xs text-slate-500">Access your academic and collaboration workspace.</p>
        </div>

        {/* Demo Helper Alert Box */}
        <div className="p-3 bg-navy-50/60 dark:bg-navy-950/30 border border-navy-100 dark:border-navy-900/50 rounded-lg text-[11px] text-navy-600 dark:text-navy-400 leading-relaxed">
          <span className="font-bold">Demo Accounts Password: </span> 
          <code className="bg-navy-100 dark:bg-navy-900/60 px-1 py-0.5 rounded font-mono">password123</code>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li>Singhal: <code className="font-mono">dr.singhal@university.edu</code> (PI/Researcher)</li>
            <li>Khandesh: <code className="font-mono">dr.khandesh@university.edu</code> (Researcher)</li>
            <li>Admin: <code className="font-mono">admin@university.edu</code> (System Admin)</li>
          </ul>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Institutional Email</label>
            <input 
              type="email" 
              required
              placeholder="e.g. dr.singhal@university.edu"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
              <button 
                type="button"
                className="text-[10px] text-navy-500 hover:underline"
                onClick={() => alert("Please consult database administrator. Default passwords are password123.")}
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-450 hover:text-slate-650"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-navy-500/10 flex items-center justify-center gap-2 transition-all mt-6"
          >
            {loading ? 'Validating credentials...' : 'Continue to Login OTP'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-850 text-xs">
          <span className="text-slate-400">New to the platform? </span>
          <Link to="/register" className="font-semibold text-navy-600 dark:text-navy-400 hover:underline">Create an Account</Link>
        </div>

      </div>
    </div>
  );
};
