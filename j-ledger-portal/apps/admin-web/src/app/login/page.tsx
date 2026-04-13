import { login } from '@/app/actions/auth';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-white border border-border">
        
        {/* Left Side: Vector/Illustration Placeholder */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-secondary to-white items-center justify-center p-12 border-r border-border relative overflow-hidden">
          {/* Abstract SVG representing fintech/desk/UI */}
          <div className="relative z-10 w-full max-w-sm">
            <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-xl">
              <rect x="50" y="80" width="300" height="200" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="4"/>
              <rect x="80" y="110" width="240" height="20" rx="4" fill="#FAF5FF"/>
              <rect x="80" y="150" width="100" height="80" rx="8" fill="#3182CE" fillOpacity="0.1"/>
              <rect x="190" y="150" width="130" height="30" rx="4" fill="#F7FAFC"/>
              <rect x="190" y="190" width="130" height="40" rx="4" fill="#BF3FFF" fillOpacity="0.1"/>
              <circle cx="200" cy="270" r="40" fill="#E32D93" fillOpacity="0.8"/>
              <path d="M185 270L195 280L215 260" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
              <p className="text-muted-foreground mt-2">Sign in to the J-Ledger Admin Portal</p>
            </div>

            <LoginForm action={login} />
          </div>
        </div>
      </div>
    </div>
  );
}

