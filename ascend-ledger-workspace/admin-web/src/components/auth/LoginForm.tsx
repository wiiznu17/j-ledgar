import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail } from 'lucide-react';

interface LoginFormProps {
  action: (formData: FormData) => void;
}

export function LoginForm({ action }: LoginFormProps) {
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
              placeholder="admin@jledger.com"
              required
              className="pl-10 h-12 border-border focus:border-ring focus:ring-1 focus:ring-ring"
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
              type="password"
              placeholder="••••••••"
              required
              className="pl-10 h-12 border-border focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <a href="#" className="font-medium text-accent hover:text-accent/80">
            Forgot password?
          </a>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] hover:opacity-90 transition-opacity border-0"
      >
        Sign in
      </Button>
    </form>
  );
}
