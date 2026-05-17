import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/jwt';
import { login } from '@/app/actions/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { AUTH_COOKIE_NAME } from '@/lib/api-config';

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token && !error) {
    const payload = await verifyToken(token);
    if (payload) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 text-foreground">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
        {/* Left Side: Illustration Image */}
        <div className="hidden lg:flex w-1/2 bg-muted items-center justify-center relative overflow-hidden">
          <img
            src="/login/Data_security_05.jpg"
            alt="Data Security"
            className="absolute inset-0 w-full h-full object-cover dark:opacity-80"
          />
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="flex items-center justify-end gap-6 text-right">
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground mt-1">
                  Sign in to the P-wallet Admin Portal
                </p>
              </div>
              <img
                src="/logo/logo-text.png"
                alt="P-wallet Logo"
                className="h-20 object-contain dark:invert mix-blend-multiply dark:mix-blend-normal contrast-[1.1] brightness-[1.05]"
              />
            </div>

            <LoginForm action={login} />
          </div>
        </div>
      </div>
    </div>
  );
}
