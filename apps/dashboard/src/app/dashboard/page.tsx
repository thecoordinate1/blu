import Link from 'next/link';

export default function DashboardPage() {
  const stats = [
    { name: 'Active Conversations', value: '42', change: '+12%', isPositive: true, description: 'vs yesterday' },
    { name: 'Escalation Rate', value: '4.8%', change: '-1.2%', isPositive: true, description: 'vs last week' },
    { name: 'Avg Response Time', value: '1.4s', change: '-0.3s', isPositive: true, description: 'API processing speed' },
    { name: 'Messages Processed', value: '1,284', change: '+24%', isPositive: true, description: 'today' },
  ];

  const recentConvs = [
    { id: '1', contact: '+260 97 1234567', preview: 'Hi, I would like to check on my order...', time: '5m ago', status: 'active' },
    { id: '2', contact: '+260 97 9991111', preview: 'This is urgent, please connect me to a manager.', time: '12m ago', status: 'escalated' },
    { id: '3', contact: '+260 95 4443322', preview: 'Can I add another item to my booking?', time: '30m ago', status: 'active' },
    { id: '4', contact: '+260 96 7778888', preview: 'Thank you for the updates! Have a nice day.', time: '1h ago', status: 'closed' },
    { id: '5', contact: '+260 97 2223344', preview: 'Wait, so the order is cancelled?', time: '2h ago', status: 'active' },
  ];

  const recentActions = [
    { id: 'a1', type: 'db_read:select', details: 'Queried table "orders" for order_id #8812', status: 'success', time: '3m ago' },
    { id: 'a2', type: 'escalate', details: 'Escalated conversation due to anger keywords', status: 'success', time: '12m ago' },
    { id: 'a3', type: 'db_write:update', details: 'Queued confirmation request for order cancellation', status: 'pending', time: '15m ago' },
    { id: 'a4', type: 'gemini_reason', details: 'LLM reasoning call (confidence: 0.94)', status: 'success', time: '25m ago' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-100 to-indigo-400">
          Agent Performance
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Overview of operations, database actions, and recent customer interactions.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            {/* Ambient Background glow */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300" />
            
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</span>
              <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                stat.isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Conversations Column */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-4 border-b border-[#1e1e2e]">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-2.5" />
              Recent Conversations
            </h2>
            <Link href="/conversations" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              View All
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {recentConvs.map((conv) => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-[#1e1e2e]/60 hover:bg-[#12121a]/80 hover:border-[#2e2e42] transition-all group"
              >
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="font-semibold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {conv.contact}
                  </span>
                  <span className="text-xs text-slate-400 truncate mt-1">
                    {conv.preview}
                  </span>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="text-[10px] text-slate-500">{conv.time}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border uppercase ${
                    conv.status === 'active'
                      ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                      : conv.status === 'escalated'
                      ? 'bg-amber-500/5 text-amber-400 border-amber-500/10 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {conv.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Live Action Feed Column */}
        <div className="glass-card rounded-2xl p-6 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-4 border-b border-[#1e1e2e]">
            <h2 className="text-lg font-bold text-white flex items-center">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2.5" />
              Agent Action Log
            </h2>
            <Link href="/audit-log" className="text-xs font-semibold text-slate-400 hover:text-slate-300">
              Audit Logs
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            {recentActions.map((action) => (
              <div key={action.id} className="relative pl-6 pb-2 border-l border-[#1e1e2e] last:border-0 last:pb-0">
                {/* Timeline node */}
                <span className={`absolute -left-[6px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0f] ${
                  action.type.startsWith('db_read') ? 'bg-indigo-500' : action.type === 'escalate' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{action.type}</span>
                  <span className="text-[10px] text-slate-500">{action.time}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{action.details}</p>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${action.status === 'success' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-[10px] text-slate-500 capitalize">{action.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
