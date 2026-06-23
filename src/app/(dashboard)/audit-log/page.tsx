'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionType = 'order' | 'payment' | 'customer' | 'message' | 'refund' | 'booking';
type ActionStatus = 'success' | 'failed' | 'awaiting_confirm';

interface AuditEntry {
  id: string;
  time: string;
  type: ActionType;
  status: ActionStatus;
  customer: string;
  details: string;
  payload: any;
}

const mockAuditLog: AuditEntry[] = [
  { id: '1', time: '2 min ago', type: 'order', status: 'success', customer: '+260 771 234 567', details: 'New order #8219 placed — ZMW 2,400', payload: { 'Order Number': '#8219-BA', 'Customer': 'Jackson Phiri', 'Items': '1x Solar Kit Pro, 1x Smart Light Bulb', 'Shipping Address': 'Plot 480, Kasama Road, Lusaka', 'Delivery Status': 'Assigned to Courier' } },
  { id: '2', time: '14 min ago', type: 'customer', status: 'success', customer: '+260 779 958 123', details: 'Customer flagged for follow-up — requires manual review', payload: { 'Reason': 'Customer requested support agent or query failed criteria check', 'Flagged By': 'AI Assistant (Confidence score: 0.42)', 'Action': 'Transferred to Customer Messages Queue' } },
  { id: '3', time: '1 hour ago', type: 'payment', status: 'failed', customer: '+260 772 144 987', details: 'Payment declined — card expired', payload: { 'Transaction ID': 'TXN_48210984', 'Amount': 'ZMW 1,200', 'Gateway': 'Mobile Money (Airtel)', 'Failure Code': 'CARD_EXPIRED_OR_INSUFFICIENT_FUNDS' } },
  { id: '4', time: '3 hours ago', type: 'booking', status: 'success', customer: '+260 770 001 456', details: 'Booking confirmed — appointment Fri 2pm', payload: { 'Booking ID': 'BKG-9921', 'Service': 'Solar Panel Repair & Maintenance Assessment', 'Technician': 'Mulenga B.', 'Scheduled Date': 'Friday, June 26th @ 14:00' } },
];

const typeColors: Record<ActionType, string> = {
  order: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  payment: 'bg-green-500/10 text-green-400 border-green-500/20',
  customer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  message: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  refund: 'bg-red-500/10 text-red-400 border-red-500/20',
  booking: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function AuditLogPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Activity</h1>
        <p className="text-muted-foreground text-sm">Recent business activity and events.</p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0E1020] border border-[#1E2340] p-2 rounded-xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#3A4060]" />
          <Input 
            placeholder="Search by customer, order, or event..." 
            className="pl-10 bg-transparent border-none focus-visible:ring-0 text-sm placeholder:text-[#3A4060]" 
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#131629] border border-[#1E2340] rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-white transition-colors">
            <Filter className="w-3 h-3" /> EVENT TYPE: ALL
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#131629] border border-[#1E2340] rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-white transition-colors">
            <Download className="w-3 h-3" /> EXPORT LOGS
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="liquid-glass-panel overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1E2340] bg-[#131629]/50">
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Time</th>
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Event</th>
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Customer</th>
                <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Details</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2340]">
              {mockAuditLog.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr 
                    onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                    className={cn(
                      "hover:bg-[#1A1F3A] cursor-pointer transition-colors group",
                      expandedRow === entry.id && "bg-[#1A1F3A]"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-white font-mono">{entry.time}</span>
                        <span className="text-[9px] text-[#3A4060] font-mono uppercase">UTC+2</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border",
                        typeColors[entry.type]
                      )}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {entry.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                        {entry.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        {entry.status === 'awaiting_confirm' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        <span className={cn(
                          "text-[10px] font-mono uppercase tracking-widest",
                          entry.status === 'success' ? "text-green-400" : entry.status === 'failed' ? "text-red-400" : "text-amber-400"
                        )}>
                          {entry.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{entry.customer}</td>
                    <td className="p-4 text-xs text-white line-clamp-1">{entry.details}</td>
                    <td className="p-4">
                      <ChevronRight className={cn(
                        "w-4 h-4 text-[#3A4060] transition-transform",
                        expandedRow === entry.id && "rotate-90 text-white"
                      )} />
                    </td>
                  </tr>
                  {expandedRow === entry.id && (
                    <tr className="bg-[#07080F]/50">
                      <td colSpan={6} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">Event Details</h4>
                            {entry.status === 'failed' && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono uppercase">
                                <AlertTriangle className="w-3 h-3" /> Error detected in transaction
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-[#0E1020] border border-[#1E2340] rounded-lg space-y-2">
                            {Object.entries(entry.payload).map(([key, val]: any) => (
                              <div key={key} className="flex text-xs font-mono">
                                <span className="text-[#64748B] w-48 font-semibold">{key}:</span>
                                <span className="text-white flex-1">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                  </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center p-4">
        <button className="text-[11px] font-headline font-bold text-muted-foreground hover:text-white transition-colors tracking-widest uppercase">
          Load Previous Logs
        </button>
      </div>
    </div>
  );
}
