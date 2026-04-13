import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, BarChart3, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground selection:bg-primary selection:text-white overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-magenta/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-pink-500/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] flex items-center justify-center shadow-lg shadow-magenta/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#2D3748]">J-Ledger</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-foreground transition-colors">
            Architecture
          </a>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full border border-border hover:bg-secondary transition-colors text-foreground"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-accent mb-8">
          <Zap className="w-3 h-3 fill-current" />
          <span>v1.0 is now live for enterprise</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8 max-w-4xl text-[#2D3748]">
          Modern Ledger <br />
          <span className="bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] bg-clip-text text-transparent">
            Infrastructure
          </span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
          The ultimate engine for high-frequency financial operations. Built with double-entry
          integrity, cloud-native scalability, and developer-first simplicity.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] hover:opacity-90 shadow-xl shadow-magenta/20 border-0 text-white"
            >
              Launch Admin Portal
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            className="h-14 px-8 text-lg font-medium rounded-full text-foreground hover:bg-secondary"
          >
            View Documentation
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-border/50"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-[#2D3748]">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Double-Entry Core</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every transaction is verified with immutable double-entry records, ensuring zero
              discrepancy across your entire system.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-magenta)] bg-opacity-10 flex items-center justify-center text-[var(--color-magenta)]">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Cloud-Native Scale</h3>
            <p className="text-muted-foreground leading-relaxed">
              Engineered with Spring Boot, Kafka, and Redis to handle millions of transactions per
              second with low latency.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Real-time Insights</h3>
            <p className="text-muted-foreground leading-relaxed">
              Comprehensive admin dashboard with live charts, reconciliation reports, and deep dives
              into every ledger entry.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Section - Abstract Architecture */}
      <section
        id="architecture"
        className="relative z-10 bg-[#FAF5FF]/30 border-y border-border py-32 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-[#2D3748]">
              Engineered for <br />
              <span className="text-accent underline decoration-[#BF3FFF]/30 underline-offset-8">
                Reliability
              </span>
            </h2>
            <div className="space-y-6">
              {[
                'Microservice-based modular architecture',
                'Idempotent transaction processing',
                'Event-driven synchronization with Kafka',
                'Strict double-entry validation at database level',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-magenta)]"></div>
                  </div>
                  <span className="text-lg font-medium text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-pink)] blur-2xl opacity-10"></div>
            <div className="relative bg-white border border-border rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full uppercase tracking-wider">
                  core-service-v1.log
                </div>
              </div>
              <div className="font-mono text-sm space-y-2 text-muted-foreground">
                <p className="text-accent">
                  {'['}INFO{']'} Initializing transaction context...
                </p>
                <p className="text-emerald-600">
                  {'['}SUCCESS{']'} Account 1421 balance updated.
                </p>
                <p className="text-[var(--color-magenta)]">
                  {'['}EVENT{']'} Kafka producer published: TX_COMMITTED
                </p>
                <p className="text-muted-foreground opacity-50">
                  {'['}INFO{']'} Ledger sweep completed in 12ms.
                </p>
                <p className="text-emerald-600">
                  {'['}SUCCESS{']'} Reconciliation status: PERFECT_MATCH
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 text-center">
        <p className="text-muted-foreground text-sm">
          © 2026 J-Ledger Infrastructure. Built for the future of fintech.
        </p>
      </footer>
    </div>
  );
}
