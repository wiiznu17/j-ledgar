'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Zap,
  BarChart3,
  Wallet,
  Landmark,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingPage() {
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
            Workflow
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
            Internal Operations Dashboard
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8 max-w-5xl text-[#1A1A1A] uppercase">
          P-Wallet <br />
          <span className="bg-[#FF3B93] text-white px-4 py-1 border-4 border-[#1A1A1A] inline-block shadow-[8px_8px_0px_0px_#1A1A1A] transform -rotate-1 my-2">
            Admin Portal
          </span>{' '}
          <br />
          For Daily Operations
        </h1>

        <p className="text-xl md:text-2xl font-bold text-[#4A4A4A] max-w-3xl mb-12 leading-relaxed bg-white border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_0px_#1A1A1A]">
          A centralized workspace for operations teams to review transactions,
          handle exceptions, and monitor daily reconciliation status in
          P-Wallet.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="h-16 px-10 text-xl font-black bg-[#00FF66] text-[#1A1A1A] border-4 border-[#1A1A1A] rounded-none shadow-[6px_6px_0px_0px_#1A1A1A] hover:bg-[#00FF66] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
            >
              Sign In To Admin
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
              Transaction Monitoring
            </h3>
            <p className="text-base font-bold text-[#4A4A4A] leading-relaxed">
              Track incoming and outgoing transactions by time range, search by
              account or reference ID, and follow up on incomplete records.
            </p>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[6px_6px_0px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all">
            <div className="w-14 h-14 bg-[#FF3B93] border-4 border-[#1A1A1A] flex items-center justify-center text-white mb-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
              <Landmark className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-4">
              Ledger Verification
            </h3>
            <p className="text-base font-bold text-[#4A4A4A] leading-relaxed">
              Validate debit and credit pairs for each ledger record and flag
              entries that require additional review before period close.
            </p>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[6px_6px_0px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all">
            <div className="w-14 h-14 bg-[#00E5FF] border-4 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] mb-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
              <BarChart3 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-4">Reconciliation</h3>
            <p className="text-base font-bold text-[#4A4A4A] leading-relaxed">
              Review daily reconciliation summaries with mismatch status so
              teams can investigate and resolve issues in the same cycle.
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
                P-Wallet Operations
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8 uppercase leading-tight">
              Workflow <br />
              <span className="bg-[#00E5FF] px-2 border-2 border-[#1A1A1A] inline-block shadow-[4px_4px_0px_0px_#1A1A1A]">
                Used By Ops Team
              </span>
            </h2>

            <div className="space-y-4">
              {[
                'Filter and verify records from a centralized operations dashboard',
                'Confirm ledger accuracy before approving the next workflow step',
                'Track pending items and mismatch reasons on a daily basis',
                'Use logs and audit trails to support historical investigations',
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
                  admin-activity.log
                </div>
              </div>

              <div className="font-mono text-sm space-y-3 font-bold text-[#1A1A1A]">
                <p className="text-[#FF3B93]">
                  [INFO] Opened transaction monitor for business date 2026-05-21
                </p>
                <p className="text-[#008F39]">
                  [SUCCESS] Ledger pair check completed: 1,248 / 1,248 entries
                </p>
                <p className="text-[#008F39]">
                  [SUCCESS] Reconciliation batch #R20260521-01 marked as complete
                </p>
                <p className="text-[#A300D9]">
                  [EVENT] Exported mismatch report to internal audit queue
                </p>
                <p className="text-[#4A4A4A] opacity-70">
                  [INFO] Operator review trace saved for compliance
                </p>
                <p className="text-[#008F39] bg-[#00FF66]/20 px-1 border border-[#008F39] inline-block">
                  [SUCCESS] Daily close checklist: PASSED
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
            P-Wallet Admin Portal
          </span>
        </div>
        <p className="text-[#4A4A4A] font-bold text-xs">
          © 2026 P-Wallet. Internal tool for operations and finance teams.
        </p>
      </footer>
    </div>
  );
}
