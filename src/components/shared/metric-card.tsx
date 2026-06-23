'use client';

import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  icon?: LucideIcon;
  color?: string;
  accent?: 'blue' | 'green' | 'amber' | 'purple';
  className?: string;
}

export function MetricCard({ label, value, trend, subtitle, icon: Icon, color, accent, className }: MetricCardProps) {
  return (
    <div
      className={cn("liquid-glass p-6", className)}
      data-accent={accent}
    >
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#8893a7] uppercase tracking-widest">{label}</span>
          {Icon && (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: color ? `${color}18` : 'rgba(79,110,247,0.1)' }}
            >
              <Icon className="w-4 h-4" style={{ color: color || '#4F6EF7' }} />
            </div>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-headline text-[28px] font-bold tracking-tight text-white leading-none">{value}</span>
            {subtitle && (
              <span className="text-[10px] text-[#64748B] font-mono mt-1">{subtitle}</span>
            )}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-[11px] font-medium font-mono px-2 py-1 rounded-full mb-1",
              trend.positive
                ? "text-[#22D3A0] bg-[#22D3A0]/10"
                : "text-[#FF4D6D] bg-[#FF4D6D]/10"
            )}>
              {trend.positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {trend.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}