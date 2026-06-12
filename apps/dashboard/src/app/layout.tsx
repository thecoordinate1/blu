import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'Blu_bot Dashboard | Autonomous WhatsApp Agent',
  description: 'Multi-tenant WhatsApp AI Agent SaaS platform by Bluetick Technology Ltd',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-100 bg-[#0a0a0f]">
        <div className="flex h-screen overflow-hidden">
          {/* Collapsible Sidebar */}
          <Sidebar />

          {/* Main Layout Area */}
          <div className="flex flex-col flex-1 w-0 overflow-hidden">
            <Header />
            
            {/* Scrollable Content Container */}
            <main className="flex-1 relative overflow-y-auto focus:outline-none bg-[#0a0a0f]/50 p-6 md:p-8">
              <div className="max-w-7xl mx-auto animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
