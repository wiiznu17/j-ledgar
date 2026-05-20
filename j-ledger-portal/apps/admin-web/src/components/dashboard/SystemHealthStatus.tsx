import { Activity } from 'lucide-react';

interface SystemHealthStatusProps {
  isOnline: boolean;
  className?: string;
}

export function SystemHealthStatus({
  isOnline,
  className,
}: SystemHealthStatusProps) {
  return (
    <div
      className={`flex items-center gap-2.5 h-11 px-4 rounded-lg border text-sm font-medium transition-all duration-300 shadow-sm ${
        isOnline
          ? 'bg-emerald-50/60 border-emerald-500 text-emerald-800 hover:bg-emerald-100/40'
          : 'bg-rose-50/60 border-rose-500 text-rose-800 hover:bg-rose-100/40'
      } ${className}`}
    >
      {/* Blinking Pulse Dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isOnline ? 'bg-emerald-400' : 'bg-rose-400'
          }`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isOnline ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        ></span>
      </span>

      <span>System Health</span>

      <Activity
        className={`h-4 w-4 ml-0.5 ${isOnline ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`}
      />
    </div>
  );
}
