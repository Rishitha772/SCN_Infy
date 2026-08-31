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

  const [provider, setProvider] = useState<'email' | 'gmail' | 'outlook'>('email');
  const [showOAuthModal, setShowOAuthModal] = useState(false);

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

  const getPlaceholder = () => {
    switch (provider) {
      case 'gmail': return 'dr.singhal@gmail.com';
      case 'outlook': return 'dr.singhal@outlook.com';
      default: return 'dr.singhal@university.edu';
    }
  };

  const getLabel = () => {
    switch (provider) {
      case 'gmail': return 'Gmail Address';
      case 'outlook': return 'Outlook Address';
      default: return 'Institutional Email';
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

        {/* Auth Provider Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-655 dark:text-slate-400 font-medium">Sign in with</label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { id: 'email' as const, label: 'Email', icon: '✉️' },
              { id: 'gmail' as const, label: 'Gmail', icon: '🌐' },
              { id: 'outlook' as const, label: 'Outlook', icon: '📧' }
            ].map(prov => (
              <button
                key={prov.id}
                type="button"
                onClick={() => {
                  setProvider(prov.id);
                  setError('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  provider === prov.id
                    ? 'bg-white dark:bg-slate-800 text-navy-650 dark:text-navy-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-250'
                }`}
              >
                <span className="text-xs">{prov.icon}</span>
                <span>{prov.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Social Fast Signin Option */}
        {provider !== 'email' && (
          <button
            type="button"
            onClick={() => setShowOAuthModal(true)}
            className={`w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              provider === 'gmail' 
                ? 'text-red-650 dark:text-red-400 border-red-100 dark:border-red-900/30 bg-red-50/20' 
                : 'text-sky-655 dark:text-sky-400 border-sky-100 dark:border-sky-900/30 bg-sky-50/20'
            }`}
          >
            <span>{provider === 'gmail' ? '🌐' : '📧'}</span>
            <span>Fast Sign in with {provider === 'gmail' ? 'Google' : 'Microsoft'}</span>
          </button>
        )}

        {/* Demo Helper Alert Box */}
        {provider === 'email' && (
          <div className="p-3 bg-navy-50/60 dark:bg-navy-950/30 border border-navy-100 dark:border-navy-900/50 rounded-lg text-[11px] text-navy-600 dark:text-navy-400 leading-relaxed animate-fade-in">
            <span className="font-bold">Demo Accounts Password: </span> 
            <code className="bg-navy-100 dark:bg-navy-900/60 px-1 py-0.5 rounded font-mono">password123</code>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Singhal: <code className="font-mono">dr.singhal@university.edu</code> (PI/Researcher)</li>
              <li>Khandesh: <code className="font-mono">dr.khandesh@university.edu</code> (Researcher)</li>
              <li>Admin: <code className="font-mono">admin@university.edu</code> (System Admin)</li>
            </ul>
          </div>
        )}

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
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{getLabel()}</label>
            <input 
              type="email" 
              required
              placeholder={`e.g. ${getPlaceholder()}`}
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

      {/* Floating simulated OAuth Consent Modal */}
      {showOAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">{provider === 'gmail' ? '🌐' : '📧'}</span>
                <h3 className="font-bold text-sm text-slate-850 dark:text-slate-100">
                  Sign in with {provider === 'gmail' ? 'Google' : 'Microsoft'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowOAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              SCN Portal requests permission to authenticate using your registered social profile:
            </p>
            
            <div className="space-y-2">
              {[
                { name: 'Dr. Jane Doe', email: provider === 'gmail' ? 'jane.doe@gmail.com' : 'jane.doe@outlook.com' },
                { name: 'Dr. Singhal', email: provider === 'gmail' ? 'dr.singhal@gmail.com' : 'dr.singhal@outlook.com' },
                { name: 'Dr. Khandesh', email: provider === 'gmail' ? 'dr.khandesh@gmail.com' : 'dr.khandesh@outlook.com' }
              ].map((account, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={async () => {
                    setEmail(account.email);
                    setPassword('password123'); // Autofill default password
                    setShowOAuthModal(false);
                  }}
                  className="w-full p-3 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-55 dark:hover:bg-slate-900/80 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-950/40 text-navy-600 dark:text-navy-400 flex items-center justify-center font-bold text-xs uppercase">
                    {account.name.split(' ').pop()?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-850 dark:text-slate-200">{account.name}</p>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400">{account.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="pt-2 text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed text-center">
              By continuing, you authorize SCN Portal to retrieve session credentials.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
