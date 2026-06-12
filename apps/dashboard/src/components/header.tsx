'use client';

export default function Header() {
  return (
    <header className="flex-shrink-0 h-20 glass-panel border-b border-[#1e1e2e] flex items-center justify-between px-6 md:px-8 z-10">
      {/* Search Bar / Context */}
      <div className="flex items-center w-96">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search conversations, logs, settings..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input placeholder-slate-500 text-slate-200"
          />
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center space-x-6">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Agent Active</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl border border-[#1e1e2e] hover:bg-[#1b1b26]/50 text-slate-400 hover:text-slate-100 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[#0a0a0f]" />
        </button>

        {/* Environment badge */}
        <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wide text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full uppercase">
          Dev / Staging
        </span>
      </div>
    </header>
  );
}
