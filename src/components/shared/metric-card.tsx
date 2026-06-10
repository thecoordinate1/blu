'use client';

import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: string;
  className?: string;
}

export function MetricCard({ label, value, trend, color, className }: MetricCardProps) {
  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-widest">{label}</span>
        <div className="flex items-end justify-between">
          <span className="font-headline text-2xl font-bold tracking-tight">{value}</span>
          {trend && (
            <div className={cn(
              "flex items-center text-[11px] font-medium font-mono mb-1",
              trend.positive ? "text-[#22D3A0]" : "text-[#FF4D6D]"
            )}>
              {trend.positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {trend.value}
            </div>
          )}
        </div>
      </div>
      {/* Decorative sparkline placeholder */}
      <div className="mt-4 h-1 w-full bg-[#1A1F3A] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full" 
          style={{ 
            width: '60%', 
            backgroundColor: color || 'var(--accent-custom)',
            opacity: 0.5
          }} 
        />
      </div>
    </div>
  );
}