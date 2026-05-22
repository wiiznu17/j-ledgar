'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authRequester } from '@/lib/requesters';
import { showSuccess, showError } from '@/lib/swal';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Circle,
  Eye,
  EyeOff,
} from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setIsValid(false);
      return;
    }

    const validate = async () => {
      try {
        await authRequester.validateResetToken(token);
        setIsValid(true);
      } catch (e) {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!isPasswordValid) {
      showError('Weak Password', 'Please meet all password requirements');
      return;
    }

    if (password !== confirmPassword) {
      showError('Mismatch', 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authRequester.confirmPasswordReset({ token, password });
      setIsSuccess(true);
      showSuccess(
        'Success',
        'Your password has been updated. You can now log in.',
      );
    } catch (e) {
      showError(
        'Failed',
        'Could not reset password. The link may have expired.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-muted/30 text-foreground">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold animate-pulse">
            Verifying secure link...
          </p>
        </div>
      </div>
    );
  }

  if (!isValid && !isSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-muted/30 text-foreground animate-fade-in">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="flex flex-col lg:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
          {/* Left Side: Illustration Image */}
          <div className="hidden lg:flex w-1/2 bg-muted items-center justify-center relative overflow-hidden">
            <img
              src="/login/Data_security_05.jpg"
              alt="Data Security"
              className="absolute inset-0 w-full h-full object-cover dark:opacity-80"
            />
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
            <div className="max-w-sm w-full mx-auto space-y-8">
              <div className="flex items-center justify-end gap-6 text-right">
                <div className="flex flex-col">
                  <span className="text-rose-500 font-bold text-xs uppercase tracking-widest">
                    Security Alert
                  </span>
                  <h1 className="text-3xl font-bold text-foreground mt-1">
                    Expired Link
                  </h1>
                </div>
                <img
                  src="/logo/logo-text.png"
                  alt="Logo"
                  className="h-20 object-contain dark:invert mix-blend-multiply dark:mix-blend-normal contrast-[1.1] brightness-[1.05]"
                />
              </div>

              <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This password reset link is no longer valid. Please request a
                  new one from the administrator or your login page.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-border font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => router.push('/login')}
              >
                Return to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-muted/30 text-foreground animate-fade-in">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="flex flex-col lg:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
          {/* Left Side: Illustration Image */}
          <div className="hidden lg:flex w-1/2 bg-muted items-center justify-center relative overflow-hidden">
            <img
              src="/login/Data_security_05.jpg"
              alt="Data Security"
              className="absolute inset-0 w-full h-full object-cover dark:opacity-80"
            />
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
            <div className="max-w-sm w-full mx-auto space-y-8">
              <div className="flex items-center justify-end gap-6 text-right">
                <div className="flex flex-col">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
                    Success
                  </span>
                  <h1 className="text-3xl font-bold text-foreground mt-1">
                    Password Updated
                  </h1>
                </div>
                <img
                  src="/logo/logo-text.png"
                  alt="Logo"
                  className="h-20 object-contain dark:invert mix-blend-multiply dark:mix-blend-normal contrast-[1.1] brightness-[1.05]"
                />
              </div>

              <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your security credentials have been successfully updated. You
                  can now access your account with the new password.
                </p>
              </div>

              <Button
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold transition-all active:scale-[0.98] border-0 shadow-sm"
                onClick={() => router.push('/login')}
              >
                Log in to Portal <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 text-foreground animate-fade-in">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      <div className="flex flex-col lg:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
        {/* Left Side: Illustration Image */}
        <div className="hidden lg:flex w-1/2 bg-muted items-center justify-center relative overflow-hidden">
          <img
            src="/login/Data_security_05.jpg"
            alt="Data Security"
            className="absolute inset-0 w-full h-full object-cover dark:opacity-80"
          />
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="flex items-center justify-end gap-6 text-right">
              <div className="flex flex-col">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
                  J-Ledger Secure
                </span>
                <h1 className="text-3xl font-bold text-foreground mt-1">
                  Reset Password
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Create a new secure password for your account
                </p>
              </div>
              <img
                src="/logo/logo-text.png"
                alt="Logo"
                className="h-20 object-contain dark:invert mix-blend-multiply dark:mix-blend-normal contrast-[1.1] brightness-[1.05]"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-card text-foreground border-border rounded-xl focus:border-ring focus:ring-1 focus:ring-ring font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Rules Checklist */}
                <div className="mt-3 grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-2xl border border-border">
                  <RuleItem label="8+ Characters" met={passwordRules.length} />
                  <RuleItem label="Uppercase" met={passwordRules.upper} />
                  <RuleItem label="Lowercase" met={passwordRules.lower} />
                  <RuleItem label="Special Char" met={passwordRules.special} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-card text-foreground border-border rounded-xl focus:border-ring focus:ring-1 focus:ring-ring font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold transition-all active:scale-[0.98] border-0 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function RuleItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
      ) : (
        <Circle className="w-3 h-3 text-muted-foreground/40" />
      )}
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${met ? 'text-emerald-600' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
    </div>
  );
}
