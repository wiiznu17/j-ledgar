'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authRequester } from '@/lib/requesters';
import { showSuccess, showError } from '@/lib/swal';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, ArrowRight, Loader2, Sparkles, UserCircle, Check, X, Circle } from 'lucide-react';

export default function SetupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        await authRequester.validateInviteToken(token);
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
      await authRequester.activateAccount({ token, password });
      setIsSuccess(true);
      showSuccess('Welcome!', 'Your account has been activated. Welcome to the team!');
    } catch (e) {
      showError('Failed', 'Could not activate account. The invitation link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Verifying invitation...</p>
      </div>
    );
  }

  if (!isValid && !isSuccess) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <div className="h-2 bg-rose-500" />
          <CardHeader className="pt-10 pb-6 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Expired Invitation</CardTitle>
            <CardDescription className="text-slate-500 mt-2 px-4">
              This invitation link is no longer valid or has expired. Please contact your system administrator to request a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10 px-8">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-slate-200 font-bold text-slate-600"
              onClick={() => router.push('/login')}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardHeader className="pt-10 pb-6 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Account Activated!</CardTitle>
            <CardDescription className="text-slate-500 mt-2 px-4">
              Welcome aboard! Your administrator account is now active and ready. You can now log in to the portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10 px-8">
            <Button 
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200"
              onClick={() => router.push('/login')}
            >
              Enter Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
      
      <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden bg-white relative z-10">
        <div className="h-2 bg-indigo-600" />
        <CardHeader className="pt-10 pb-4 px-8">
          <div className="flex items-center gap-2 text-indigo-600 mb-6">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-black text-sm uppercase tracking-widest">J-Ledger Onboarding</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight text-center md:text-left">Welcome to the Team!</CardTitle>
          <CardDescription className="text-slate-500 text-center md:text-left">
            You've been invited as an administrator. Please set up your password to activate your account.
          </CardDescription>
          
          {email && (
            <div className="mt-6 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <UserCircle className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-xs font-bold text-slate-600 truncate">{email}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-slate-200 rounded-xl focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              {/* Password Rules Checklist */}
              <div className="mt-3 grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <RuleItem label="8+ Characters" met={passwordRules.length} />
                <RuleItem label="Uppercase" met={passwordRules.upper} />
                <RuleItem label="Lowercase" met={passwordRules.lower} />
                <RuleItem label="Special Char" met={passwordRules.special} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 border-slate-200 rounded-xl focus:ring-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Activate Account'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
      ) : (
        <Circle className="w-3 h-3 text-slate-300" />
      )}
      <span className={`text-[10px] font-bold uppercase tracking-wider ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}
