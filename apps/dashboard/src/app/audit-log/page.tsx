'use client';

import { useState } from 'react';

export default function AuditLogPage() {
  const [filterType, setFilterType] = useState<string>('all');

  const logs = [
    { id: 'l1', time: '2026-06-11T16:48:23Z', type: 'db_write:update', details: 'Updated status = "cancelled" for order #8812', status: 'success' },
    { id: 'l2', time: '2026-06-11T16:48:01Z', type: 'escalate', details: 'Escalated conversation +260979991111 due to keyword matches', status: 'success' },
    { id: 'l3', time: '2026-06-11T16:45:55Z', type: 'db_read:select', details: 'Queried table "orders" matching order_id = #8812', status: 'success' },
    { id: 'l4', time: '2026-06-11T16:45:10Z', type: 'gemini_raw', details: 'AI prompt reasoning for conversation +260971234567', status: 'success' },
    { id: 'l5', time: '2026-06-11T16:30:15Z', type: 'db_read:select', details: 'Queried table "inventory" matching product = "widget"', status: 'success' },
    { id: 'l6', time: '2026-06-11T16:15:00Z', type: 'db_write:insert', details: 'Inserted new row in table "customers" for Jane Doe', status: 'success' },
  ];

  const filteredLogs = logs.filter((log) => filterType === 'all' || log.type.includes(filterType));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Immutable log of all autonomous agent read, write, and API actions.
          </p>
        </div>

        {/* Filter Selection */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 text-xs rounded-xl glass-input w-full sm:w-48 cursor-pointer"
        >
          <option value="all">All Actions</option>
          <option value="db_read">Database Reads</option>
          <option value="db_write">Database Writes</option>
          <option value="escalate">Escalations</option>
          <option value="gemini">Gemini API Calls</option>
        </select>
      </div>

      {/* Table container */}
      <div className="glass-panel border border-[#1e1e2e] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e2e] bg-[#12121a]/55">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]/40">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#12121a]/30 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                    {new Date(log.time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.type.includes('db_write') 
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/10'
                        : log.type.includes('db_read')
                        ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                        : log.type === 'escalate'
                        ? 'text-rose-400 bg-rose-500/10 border border-rose-500/10'
                        : 'text-slate-400 bg-slate-800 border border-slate-700'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300 leading-normal max-w-sm sm:max-w-md truncate md:whitespace-normal">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-xs whitespace-nowrap">
                    <span className="flex items-center text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
