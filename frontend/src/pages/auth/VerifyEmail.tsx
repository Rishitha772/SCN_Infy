import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { GitFork, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { AuthService } from '../../services/authService';

export const VerifyEmail: React.FC = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Resend Countdown
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError("Verification code must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ email, code });
      setSuccess("Your email has been verified successfully! SCN administrators have been notified to review your credentials.");
      
      // Auto-approve simulation logic:
      // If they register with 'admin@university.edu' or something similar, it might be fast, but for general testing, we can let them log in after approval.
      // We will tell them to go to login. (Admin approval can be done in the Admin Dashboard, which makes the simulation incredibly realistic!).
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setCountdown(60);
    try {
      // Re-trigger registration email OTP simulation
      await AuthService.register({
        email,
        password: "password123" as any, // dummy mixin for trigger
        requested_role: 'researcher' as any
      });
      alert(`[DEMO SYSTEM] A new code has been simulated for ${email}. Check console/popup.`);
    } catch (err: any) {
      setError("Failed to resend code.");
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
          <h2 className="text-2xl font-bold tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-slate-550 leading-relaxed px-4">
            We sent a 6-digit confirmation code to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>.
          </p>
        </div>

        {/* Success / Error Boxes */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-650 dark:text-emerald-400 space-y-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{success}</span>
              </div>
            </div>
            
            {/* Demo Notice for approval */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-normal">
              <span className="font-bold">Developer Notice: </span>
              In this demo workspace, you can log in as the default Administrator (<code className="font-mono">admin@university.edu</code> / password: <code className="font-mono">password123</code>) to approve pending registrations immediately.
            </div>

            <Link 
              to="/login"
              className="w-full py-2.5 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-navy-500/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">6-Digit Verification Code</label>
              <input 
                type="text" 
                required
                maxLength={6}
                placeholder="000000"
                className="w-full text-center px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xl tracking-[0.4em] font-mono focus:border-navy-500 focus:outline-none transition-colors"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </div>

            <button 
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2.5 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-navy-500/10 flex items-center justify-center gap-2 transition-all mt-4"
            >
              {loading ? 'Verifying...' : 'Confirm Verification Code'}
            </button>

            <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-100 dark:border-slate-850">
              <Link to="/login" className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Link>
              {countdown > 0 ? (
                <span className="text-slate-400">Resend in {countdown}s</span>
              ) : (
                <button 
                  type="button" 
                  onClick={handleResend}
                  className="font-semibold text-navy-600 dark:text-navy-400 hover:underline"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
