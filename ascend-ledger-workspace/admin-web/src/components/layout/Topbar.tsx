'use client';

import { ThemeToggle } from '@/components/theme-toggle';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title = 'J-Ledger Admin' }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 flex-shrink-0">
      <div className="flex items-center text-xl font-bold text-foreground">
        <span className="lg:hidden">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
