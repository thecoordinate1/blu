export default function AnalyticsPage() {
  const cards = [
    { name: 'Resolution Rate', value: '94.2%', description: 'Conversations resolved by bot' },
    { name: 'Human Handoffs', value: '24', description: 'Conversations escalated to owner' },
    { name: 'Token Usage', value: '45.2K', description: 'Total Gemini 2.0 tokens today' },
    { name: 'Active Webhooks', value: '2', description: 'Healthy WhatsApp endpoints' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor response latencies, conversation metrics, and API token usage.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.name} className="glass-card rounded-2xl p-6">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.name}</span>
            <span className="block text-3xl font-extrabold text-white mt-3 tracking-tight">{card.value}</span>
            <p className="text-xs text-slate-400 mt-2">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Placeholder Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1 */}
        <div className="glass-card rounded-2xl p-6 h-80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Conversation Volume (Last 7 Days)</h3>
            <span className="text-[10px] text-slate-500 block mt-1">Inbound WhatsApp message frequencies</span>
          </div>

          <div className="flex-1 flex items-center justify-center border border-dashed border-[#1e1e2e] rounded-xl my-4 bg-[#12121a]/20">
            <div className="text-center space-y-1">
              <svg className="w-8 h-8 mx-auto text-slate-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h4 className="text-xs font-semibold text-slate-400">Traffic chart loading...</h4>
              <p className="text-[10px] text-slate-500">Retrieving conversation logs from Supabase</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Last sync: Just now</span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />
              Real-time update active
            </span>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="glass-card rounded-2xl p-6 h-80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">System Latency (Response Time)</h3>
            <span className="text-[10px] text-slate-500 block mt-1">Hono server processing speed</span>
          </div>

          <div className="flex-1 flex items-center justify-center border border-dashed border-[#1e1e2e] rounded-xl my-4 bg-[#12121a]/20">
            <div className="text-center space-y-1">
              <svg className="w-8 h-8 mx-auto text-slate-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-xs font-semibold text-slate-400">Latency distribution loading...</h4>
              <p className="text-[10px] text-slate-500">Compiling Sentry performance logs</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Target threshold: &lt; 2.0s</span>
            <span className="flex items-center text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
              SLA Compliant
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
