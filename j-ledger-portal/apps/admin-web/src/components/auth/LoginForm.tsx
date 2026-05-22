'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

interface LoginFormProps {
  action: (formData: FormData) => void;
}

export function LoginForm({ action }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="h-5 w-5" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              required
              className="pl-10 h-12 bg-card text-foreground border-border focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              className="pl-10 pr-10 h-12 bg-card text-foreground border-border focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-border bg-card text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-foreground"
          >
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <a
            href="#"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-12 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-xs transition-all active:scale-[0.98] border-0 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Signing in...
        </>
      ) : (
        'Sign in'
      )}
    </Button>
  );
}
