import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  LogIn,
  UserPlus,
  AlertCircle,
  ArrowRight,
  LogOut,
  KeyRound,
  CheckCircle2,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Professional Neumorphic Soft UI Authentication Portal for Renuvia Recycling
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, resetPassword, logout, user, userProfile } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetSuccessMessage('');

    if (mode === 'forgot') {
      if (!email || !email.includes('@')) {
        setErrorMessage('Please enter a valid work email address.');
        return;
      }

      setLoading(true);
      try {
        await resetPassword(email);
        setResetSuccessMessage(`Password reset link sent to ${email}. Please check your inbox.`);
        toast.success('Password reset email sent successfully.');
      } catch (err) {
        console.error('Password reset error:', err);
        let msg = err.message;
        if (err.code === 'auth/user-not-found') {
          msg = 'No registered user found with this email address.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Invalid email address format.';
        }
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        if (!displayName.trim()) {
          setErrorMessage('Please provide your full name.');
          setLoading(false);
          return;
        }
        await signup(email, password, displayName, 'employee');
        toast.success('Account created successfully! Welcome to Renuvia CRM.');
      } else {
        await login(email, password);
        toast.success('Signed in successfully.');
      }
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Auth error:', err);
      let msg = err.message;

      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        msg = 'Email/Password sign-in provider is disabled in Firebase Console. Please verify Authentication settings.';
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'Invalid email or password. Please verify your credentials or register below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please log in instead.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily restricted due to multiple failed login attempts. Please try again shortly or reset your password.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This account has been deactivated. Please contact your Renuvia Administrator.';
      }

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 antialiased selection:bg-accent selection:text-white">
      <div className="w-full max-w-md bg-background shadow-neu-flat rounded-[32px] p-8 sm:p-10 relative transition-all">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-background shadow-neu-pressed flex items-center justify-center p-3 mb-4 mx-auto transition-transform hover:scale-105 duration-300">
            <img src="/logo.svg" alt="Renuvia Recycling" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
            Renuvia Recycling
          </h1>
          <p className="text-xs font-display font-bold text-accent tracking-widest uppercase mt-1">
            Certified E-Waste & Corporate ITAD Portal
          </p>
        </div>

        {/* Active Session Notice if already logged in */}
        {user && (
          <div className="p-4 bg-background shadow-neu-pressed-sm rounded-2xl text-xs font-body mb-6 flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-sm text-foreground">
                Active Session: {user.displayName || user.email}
              </div>
              <div className="text-muted text-[11px] capitalize">Role: {userProfile?.role || 'Staff'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs py-1 px-3"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
              <button
                type="button"
                onClick={() => logout()}
                className="w-8 h-8 rounded-xl bg-background shadow-neu-flat-sm hover:shadow-neu-flat text-danger flex items-center justify-center transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-background shadow-neu-pressed-sm rounded-2xl text-xs font-body text-danger flex items-start gap-2.5 mb-6 border-l-4 border-danger">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert (e.g. password reset) */}
        {resetSuccessMessage && (
          <div className="p-4 bg-background shadow-neu-pressed-sm rounded-2xl text-xs font-body text-accent flex items-start gap-2.5 mb-6 border-l-4 border-accent">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
            <span className="leading-relaxed">{resetSuccessMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input
              label="Your Full Name"
              required
              placeholder="e.g. Rajiv Sharma"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}

          <Input
            label="Corporate Email Address"
            type="email"
            required
            placeholder="e.g. compliance@renuvia.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-display font-bold text-xs uppercase tracking-wider text-foreground/80">
                  Password:
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage('');
                      setResetSuccessMessage('');
                    }}
                    className="text-[11px] font-body text-accent hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background text-foreground shadow-neu-pressed rounded-2xl px-4 py-2.5 text-sm font-body border-0 outline-none transition-all placeholder:text-muted/60 focus:shadow-neu-pressed-deep focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="p-4 bg-background shadow-neu-pressed-sm rounded-2xl text-xs font-body text-muted leading-relaxed">
              <span className="font-bold text-foreground block mb-1">🔒 Corporate Access Control:</span>
              New user registrations undergo administrative review before customer lead data access is provisioned.
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            icon={mode === 'register' ? UserPlus : mode === 'forgot' ? KeyRound : LogIn}
            disabled={loading}
            className="w-full text-sm font-bold py-3 mt-4"
          >
            {loading
              ? 'Verifying with Firebase...'
              : mode === 'register'
              ? 'Register Authorized Account'
              : mode === 'forgot'
              ? 'Send Password Reset Link'
              : 'Sign In to Workspace'}
          </Button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="mt-6 pt-4 border-t border-muted/15 flex flex-col items-center gap-2 text-center">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setResetSuccessMessage('');
              }}
              className="text-xs font-body text-accent hover:underline font-bold"
            >
              New team member? Request Account Access
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setResetSuccessMessage('');
              }}
              className="text-xs font-body text-accent hover:underline font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[11px] font-body text-muted mt-2">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>256-Bit SSL Encrypted • Corporate ITAD & E-Waste Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
