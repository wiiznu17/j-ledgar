import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe,
  Wallet,
  Landmark,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF6] text-[#1A1A1A] selection:bg-[#FFD600] selection:text-[#1A1A1A] font-sans pb-20">
      {/* Comic-style Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a10_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a10_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border-4 border-[#1A1A1A] px-4 py-2 shadow-[4px_4px_0px_0px_#1A1A1A] transform -rotate-1">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Image
              src="/icon.png"
              alt="P-Wallet Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#1A1A1A]">
            P-Wallet{' '}
            <span className="text-xs font-bold px-2 py-0.5 bg-[#FF3B93] text-white border-2 border-[#1A1A1A] ml-1 uppercase">
              Admin
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm font-bold">
          <a
            href="#features"
            className="hidden md:block hover:text-[#FF3B93] transition-colors bg-white border-4 border-[#1A1A1A] px-4 py-2 shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
          >
            Features
          </a>
          <a
            href="#architecture"
            className="hidden md:block hover:text-[#00E5FF] transition-colors bg-white border-4 border-[#1A1A1A] px-4 py-2 shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
          >
            Architecture
          </a>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-[#FFD600] text-[#1A1A1A] border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all flex items-center gap-2"
          >
            <Key className="w-4 h-4 stroke-[3]" />
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00E5FF] border-4 border-[#1A1A1A] text-sm font-black text-[#1A1A1A] mb-8 shadow-[4px_4px_0px_0px_#1A1A1A] transform rotate-1">
          <Zap className="w-4 h-4 fill-current stroke-[2.5]" />
          <span className="uppercase tracking-wide">
            v1.0 Enterprise Core Ecosystem
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8 max-w-5xl text-[#1A1A1A] uppercase">
          Next-Gen <br />
          <span className="bg-[#FF3B93] text-white px-4 py-1 border-4 border-[#1A1A1A] inline-block shadow-[8px_8px_0px_0px_#1A1A1A] transform -rotate-1 my-2">
            E-Wallet
          </span>{' '}
          <br />
          Infrastructure
        </h1>

        <p className="text-xl md:text-2xl font-bold text-[#4A4A4A] max-w-3xl mb-12 leading-relaxed bg-white border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_0px_#1A1A1A]">
          The central hub for high-velocity e-wallet control operations.
          Engineered with bulletproof double-entry ledger security and real-time
          transaction tracking modules.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="h-16 px-10 text-xl font-black bg-[#00FF66] text-[#1A1A1A] border-4 border-[#1A1A1A] rounded-none shadow-[6px_6px_0px_0px_#1A1A1A] hover:bg-[#00FF66] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
            >
              LAUNCH ADMIN PORTAL
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t-4 border-[#1A1A1A]"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[6px_6px_0px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all">
            <div className="w-14 h-14 bg-[#FFD600] border-4 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] mb-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
              <Wallet className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-4">
              Wallet Lifecycle
            </h3>
            <p className="text-base font-bold text-[#4A4A4A] leading-relaxed">
              Complete management over user balances, direct top-ups,
              person-to-person (P2P) transfers, bank connections, and instant
              identity KYC validation flows.
            </p>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[6px_6px_0px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all">
            <div className="w-14 h-14 bg-[#FF3B93] border-4 border-[#1A1A1A] flex items-center justify-center text-white mb-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
              <Landmark className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-4">
              Double-Entry Core
            </h3>
            <p className="text-base font-bold text-[#4A4A4A] leading-relaxed">
              Every financial ledger entry is mirrored and verified
              automatically. Immutable double-entry records protect the platform
              against audit mismatches.
            </p>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[6px_6px_0px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all">
            <div className="w-14 h-14 bg-[#00E5FF] border-4 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] mb-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
              <BarChart3 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-4">Settlements</h3>
            <p className="text-base font-bold text-[#4A4A4A] leading-relaxed">
              Integrated merchant gateway tracking pipelines, dynamic commission
              rate modifiers, and continuous, automated platform reconciliation
              run-sheets.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Section - Abstract Architecture */}
      <section
        id="architecture"
        className="relative z-10 bg-[#FAF5FF] border-y-4 border-[#1A1A1A] py-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-8 h-8 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] flex items-center justify-center">
                <Image
                  src="/icon.png"
                  alt="P-Wallet Core"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-black uppercase tracking-wider bg-[#FFD600] px-2 py-0.5 border-2 border-[#1A1A1A]">
                P-Wallet Core Engine
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8 uppercase leading-tight">
              High-Frequency <br />
              <span className="bg-[#00E5FF] px-2 border-2 border-[#1A1A1A] inline-block shadow-[4px_4px_0px_0px_#1A1A1A]">
                Engine Integrity
              </span>
            </h2>

            <div className="space-y-4">
              {[
                'Fraud pattern behavior matching & anti-money laundering analytics',
                'Strict idempotent transaction enforcement blocks duplicate requests',
                'Event-driven data replication pipeline optimized via distributed Kafka clusters',
                'Automated backup schemas with dynamic API gateway network rate limiters',
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_0px_#1A1A1A]"
                >
                  <div className="w-6 h-6 border-2 border-[#1A1A1A] bg-[#FF3B93] flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white"></div>
                  </div>
                  <span className="text-base font-bold text-[#1A1A1A]">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-white border-4 border-[#1A1A1A] p-6 shadow-[8px_8px_0px_0px_#1A1A1A]">
              <div className="flex items-center justify-between border-b-4 border-[#1A1A1A] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#1A1A1A] bg-[#FF3B93]"></div>
                  <div className="w-4 h-4 rounded-full border-2 border-[#1A1A1A] bg-[#FFD600]"></div>
                  <div className="w-4 h-4 rounded-full border-2 border-[#1A1A1A] bg-[#00FF66]"></div>
                </div>
                <div className="text-xs font-black text-[#1A1A1A] bg-[#00E5FF] px-3 py-1 border-2 border-[#1A1A1A] uppercase tracking-wider">
                  pwallet-core-bff.log
                </div>
              </div>

              <div className="font-mono text-sm space-y-3 font-bold text-[#1A1A1A]">
                <p className="text-[#FF3B93]">
                  [INFO] Initializing e-wallet financial context...
                </p>
                <p className="text-[#008F39]">
                  [SUCCESS] KYC identity validation token verified.
                </p>
                <p className="text-[#008F39]">
                  [SUCCESS] Double-entry matching: Account Ledger updated
                  perfectly.
                </p>
                <p className="text-[#A300D9]">
                  [EVENT] Kafka published to topic: WALLET_TRANSFER_COMMITTED
                </p>
                <p className="text-[#4A4A4A] opacity-70">
                  [INFO] Redis Idempotency key checked: No duplication detected.
                </p>
                <p className="text-[#008F39] bg-[#00FF66]/20 px-1 border border-[#008F39] inline-block">
                  [SUCCESS] Daily reconciliation match status: 100%
                  PERFECT_MATCH
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pt-16 text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-4 bg-white border-2 border-[#1A1A1A] px-3 py-1 shadow-[2px_2px_0px_0px_#1A1A1A]">
          <Image
            src="/icon.png"
            alt="P-Wallet Footer Logo"
            width={18}
            height={18}
            className="grayscale"
          />
          <span className="font-black text-xs tracking-tight text-[#1A1A1A] uppercase">
            P-Wallet Admin Hub
          </span>
        </div>
        <p className="text-[#4A4A4A] font-bold text-xs">
          © 2026 P-Wallet Infrastructure. Built for high-performance enterprise
          e-wallet operations.
        </p>
      </footer>
    </div>
  );
}
