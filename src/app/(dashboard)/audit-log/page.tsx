'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, Bot, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

type ActionType = 'auto_reply' | 'escalation' | 'status_change' | 'payment';
type ActionStatus = 'pending' | 'success' | 'failed';

interface AuditEntry {
  id: string;
  executed_at: string;
  action_type: ActionType;
  status: ActionStatus;
  conversation_id: string;
  payload: any;
}

const typeColors: Record<string, string> = {
  auto_reply: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  escalation: 'bg-red-500/10 text-red-400 border-red-500/20',
  status_change: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  payment: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const typeLabels: Record<string, string> = {
  auto_reply: 'AI Reply',
  escalation: 'Escalation',
  status_change: 'Status Change',
  payment: 'Payment',
};

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return dateString;
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export default function AuditLogPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    async function loadAuditLog() {
      try {
        const { data: biz } = await supabase
          .from('businesses')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (!biz) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('agent_actions')
          .select('id, conversation_id, action_type, payload, status, executed_at')
          .eq('business_id', biz.id)
          .order('executed_at', { ascending: false })
          .limit(50);

        if (error) {
          // Table might not exist yet — show empty state
          console.warn('agent_actions query failed (table may not exist):', error.message);
          setAuditLog([]);
        } else {
          setAuditLog(data || []);
        }
      } catch (err) {
        console.error('Error loading audit log:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAuditLog();
  }, []);

  const filteredLog = auditLog.filter(entry => {
    const matchesType = filterType === 'all' || entry.action_type === filterType;
    const matchesSearch = !searchQuery || 
      JSON.stringify(entry.payload).toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Activity</h1>
        <p className="text-muted-foreground text-sm">Recent bot activity and agent actions.</p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0E1020] border border-[#1E2340] p-2 rounded-xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#3A4060]" />
          <Input 
            placeholder="Search by action or payload content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-transparent border-none focus-visible:ring-0 text-sm placeholder:text-[#3A4060]" 
          />
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 h-8 bg-[#07080F] p-1 rounded-lg border border-[#1E2340]">
            {[
              { value: 'all', label: 'All' },
              { value: 'auto_reply', label: 'Replies' },
              { value: 'escalation', label: 'Escalations' },
              { value: 'status_change', label: 'Status' },
              { value: 'payment', label: 'Payments' },
            ].map(opt => (
              <button 
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={cn(
                  "px-3 text-[10px] font-headline font-bold rounded-md transition-all",
                  filterType === opt.value ? "bg-[#1A1F3A] text-white" : "text-[#64748B] hover:text-[#E2E8F0]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div className="liquid-glass-panel p-12 text-center">
          <div className="animate-pulse text-[#64748B] font-mono text-sm">Loading activity log...</div>
        </div>
      ) : filteredLog.length === 0 ? (
        <div className="liquid-glass-panel p-12 text-center space-y-3">
          <Bot className="w-10 h-10 text-[#3A4060] mx-auto" />
          <h3 className="text-sm font-headline font-bold text-white">No activity yet</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Agent actions will appear here once the bot starts processing WhatsApp messages. Send a message to your bot to see it in action.
          </p>
        </div>
      ) : (
        <div className="liquid-glass-panel overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1E2340] bg-[#131629]/50">
                  <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Time</th>
                  <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Action</th>
                  <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Details</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2340]">
                {filteredLog.map((entry) => (
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
                          <span className="text-xs text-white font-mono">{formatTime(entry.executed_at)}</span>
                          <span className="text-[9px] text-[#3A4060] font-mono">
                            {new Date(entry.executed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border",
                          typeColors[entry.action_type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        )}>
                          {typeLabels[entry.action_type] || entry.action_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {entry.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                          {entry.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                          {entry.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                          <span className={cn(
                            "text-[10px] font-mono uppercase tracking-widest",
                            entry.status === 'success' ? "text-green-400" : entry.status === 'failed' ? "text-red-400" : "text-amber-400"
                          )}>
                            {entry.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-white line-clamp-1">
                        {entry.payload?.message || entry.payload?.reason || entry.payload?.reply?.substring(0, 80) || 'Action recorded'}
                      </td>
                      <td className="p-4">
                        <ChevronRight className={cn(
                          "w-4 h-4 text-[#3A4060] transition-transform",
                          expandedRow === entry.id && "rotate-90 text-white"
                        )} />
                      </td>
                    </tr>
                    {expandedRow === entry.id && (
                      <tr className="bg-[#07080F]/50">
                        <td colSpan={5} className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">Event Details</h4>
                              {entry.status === 'failed' && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono uppercase">
                                  <AlertTriangle className="w-3 h-3" /> Action failed
                                </div>
                              )}
                            </div>
                            <div className="p-4 bg-[#0E1020] border border-[#1E2340] rounded-lg space-y-2">
                              <div className="flex text-xs font-mono">
                                <span className="text-[#64748B] w-48 font-semibold">Conversation ID:</span>
                                <span className="text-white flex-1 truncate">{entry.conversation_id}</span>
                              </div>
                              <div className="flex text-xs font-mono">
                                <span className="text-[#64748B] w-48 font-semibold">Executed At:</span>
                                <span className="text-white flex-1">{new Date(entry.executed_at).toLocaleString()}</span>
                              </div>
                              {Object.entries(entry.payload || {}).map(([key, val]: any) => (
                                <div key={key} className="flex text-xs font-mono">
                                  <span className="text-[#64748B] w-48 font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="text-white flex-1 break-all">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
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
      )}
    </div>
  );
}
