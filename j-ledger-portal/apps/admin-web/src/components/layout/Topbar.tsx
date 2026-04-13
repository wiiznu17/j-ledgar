'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { PanelLeft, LogOut } from 'lucide-react';

interface TopbarProps {
  title?: string;
  onToggle?: () => void;
  onLogout?: (formData: FormData) => void;
}

export function Topbar({ title = 'J-Ledger Admin', onToggle, onLogout }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between pl-4 pr-8 flex-shrink-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-slate-500 hover:text-slate-900 transition-colors"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center text-xl font-bold text-[#2D3748]">
          <span className="lg:hidden">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {onLogout && (
          <form action={onLogout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
