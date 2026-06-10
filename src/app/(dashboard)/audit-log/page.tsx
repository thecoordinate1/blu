'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionType = 'query' | 'insert' | 'update' | 'delete' | 'escalate' | 'notify';
type ActionStatus = 'success' | 'failed' | 'awaiting_confirm';

interface AuditEntry {
  id: string;
  time: string;
  type: ActionType;
  status: ActionStatus;
  conversation: string;
  details: string;
  payload: any;
}

const mockAuditLog: AuditEntry[] = [
  { id: '1', time: '2 min ago', type: 'query', status: 'success', conversation: '+260 7XX XXX 234', details: 'Fetched order #8219-BA', payload: { order_id: "8219-BA", customer_id: "cust_992", status: "processing" } },
  { id: '2', time: '14 min ago', type: 'escalate', status: 'success', conversation: '+260 7XX XXX 958', details: 'Triggered by low confidence (0.42)', payload: { trigger: "confidence_threshold", value: 0.42, agent_state: "REASONING" } },
  { id: '3', time: '1 hour ago', type: 'update', status: 'failed', conversation: '+260 7XX XXX 144', details: 'Failed to update shipping address', payload: { error: "INVALID_ZIP_CODE", zip: "ABC-123", field: "shipping_address" } },
  { id: '4', time: '3 hours ago', type: 'notify', status: 'awaiting_confirm', conversation: '+260 7XX XXX 001', details: 'Payment confirmation requested', payload: { method: "Lenco", amount: 2500, currency: "ZMW" } },
];

const typeColors: Record<ActionType, string> = {
  query: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  insert: 'bg-green-500/10 text-green-400 border-green-500/20',
  update: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  delete: 'bg-red-500/10 text-red-400 border-red-500/20',
  escalate: 'bg-red-500/10 text-red-400 border-red-500/20',
  notify: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function AuditLogPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground text-sm">A complete record of every action performed by your AI agent.</p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0E1020] border border-[#1E2340] p-2 rounded-xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#3A4060]" />
          <Input 
            placeholder="Search by conversation ID or action..." 
            className="pl-10 bg-transparent border-none focus-visible:ring-0 text-sm placeholder:text-[#3A4060]" 
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#131629] border border-[#1E2340] rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-white transition-colors">
            <Filter className="w-3 h-3" /> TYPE: ALL
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#131629] border border-[#1E2340] rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-white transition-colors">
            <Download className="w-3 h-3" /> EXPORT LOGS
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1E2340] bg-[#131629]/50">
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Time</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Action Type</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Status</th>
              <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Conversation</th>
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
                  <td className="p-4 font-mono text-xs text-muted-foreground">{entry.conversation}</td>
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
                          <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">Payload Data</h4>
                          {entry.status === 'failed' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono uppercase">
                              <AlertTriangle className="w-3 h-3" /> Error detected in execution
                            </div>
                          )}
                        </div>
                        <pre className="p-4 bg-[#0E1020] border border-[#1E2340] rounded-lg overflow-x-auto">
                          <code className="text-[11px] font-mono text-accent">
                            {JSON.stringify(entry.payload, null, 2)}
                          </code>
                        </pre>
                      </div>
                    </td>
                </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center p-4">
        <button className="text-[11px] font-headline font-bold text-muted-foreground hover:text-white transition-colors tracking-widest uppercase">
          Load Previous Logs
        </button>
      </div>
    </div>
  );
}
