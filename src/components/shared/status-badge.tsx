'use client';

import { cn } from '@/lib/utils';

type StatusType = 'active' | 'escalated' | 'paused' | 'closed' | 'success' | 'failed' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: 'Active', dot: 'bg-[#22D3A0]', bg: 'bg-[#22D3A022]', text: 'text-[#22D3A0]' },
  escalated: { label: 'Escalated', dot: 'bg-[#FF4D6D]', bg: 'bg-[#FF4D6D22]', text: 'text-[#FF4D6D]' },
  paused: { label: 'Paused', dot: 'bg-[#F5A623]', bg: 'bg-[#F5A62322]', text: 'text-[#F5A623]' },
  closed: { label: 'Closed', dot: 'bg-[#64748B]', bg: 'bg-[#64748B22]', text: 'text-[#64748B]' },
  success: { label: 'Success', dot: 'bg-[#22D3A0]', bg: 'bg-[#22D3A022]', text: 'text-[#22D3A0]' },
  failed: { label: 'Failed', dot: 'bg-[#FF4D6D]', bg: 'bg-[#FF4D6D22]', text: 'text-[#FF4D6D]' },
  pending: { label: 'Pending', dot: 'bg-[#A78BFA]', bg: 'bg-[#A78BFA22]', text: 'text-[#A78BFA]' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <div className={cn(
      "status-pill",
      config.bg,
      config.text,
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </div>
  );
}