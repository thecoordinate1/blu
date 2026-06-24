'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  BarChart3, 
  UserCircle,
  Zap,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Database,
  History
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { supabase } from '@/lib/supabase/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState('Acme Corp');
  const [planName, setPlanName] = useState('Growth Plan');
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesLimit, setMessagesLimit] = useState(1000);

  useEffect(() => {
    async function loadBusiness() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('name, subscription_tier, messages_used, messages_limit')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();

      if (business) {
        if (business.name) setBusinessName(business.name);
        if (business.subscription_tier) {
          const tier = business.subscription_tier.charAt(0).toUpperCase() + business.subscription_tier.slice(1);
          setPlanName(`${tier} Plan`);
        }
        if (business.messages_used !== undefined && business.messages_used !== null) {
          setMessagesUsed(business.messages_used);
        }
        if (business.messages_limit !== undefined && business.messages_limit !== null) {
          setMessagesLimit(business.messages_limit);
        }
      }
    }

    loadBusiness();
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: MessageSquare, label: 'Customers', href: '/conversations', badge: 3 },
    { icon: BarChart3, label: 'Business Analytics', href: '/analytics' },
    { icon: History, label: 'Activity', href: '/audit-log' },
  ];

  const settingsItems = [
    { label: 'Business Profile', href: '/settings/general' },
    { label: 'Channels', href: '/settings/numbers' },
    { label: 'AI Assistant', href: '/settings/persona' },
    { label: 'Notifications', href: '/settings/escalation' },
    { label: 'Billing', href: '/settings/billing' },
  ];

  const initials = businessName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AC';

  const usagePercent = messagesLimit > 0 
    ? Math.min(100, Math.round((messagesUsed / messagesLimit) * 100))
    : 0;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#07080F] font-body overflow-hidden">
        <Sidebar className="border-r border-[#1E2340] bg-[#0E1020]">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#4F6EF7] rounded-lg flex items-center justify-center">
                <Zap className="text-white w-5 h-5 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-lg tracking-tight text-white leading-none">Blu_bot</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22D3A0] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#22D3A0] uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild className={cn(
                    "hover:bg-[#1A1F3A] transition-all duration-200 h-10 px-4 group",
                    pathname === item.href && "sidebar-item-active"
                  )}>
                    <Link href={item.href} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("w-4 h-4", pathname === item.href ? "text-white" : "text-[#64748B]")} />
                        <span className={cn("text-xs font-headline font-semibold", pathname === item.href ? "text-white" : "text-[#64748B]")}>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-[#FF4D6D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <div className="px-4 py-4">
                <div className="h-[1px] w-full bg-[#1E2340]" />
              </div>

              <div className="px-4 mb-2">
                <span className="text-[10px] font-headline font-bold text-[#3A4060] uppercase tracking-widest">Settings</span>
              </div>

              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild className={cn(
                    "hover:bg-[#1A1F3A] transition-all duration-200 h-9 px-4",
                    pathname === item.href && "sidebar-item-active"
                  )}>
                    <Link href={item.href} className="flex items-center gap-3">
                      <span className={cn("text-xs font-medium", pathname === item.href ? "text-white" : "text-[#64748B]")}>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto">
            <div className="p-3 rounded-xl bg-[#131629] border border-[#1E2340] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#4F6EF7]/20 flex items-center justify-center text-[#4F6EF7] font-bold text-xs">
                  {initials}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white leading-tight">{businessName}</span>
                  <span className="text-[9px] font-mono text-[#A78BFA] uppercase">{planName}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-[#64748B]">
                  <span>MESSAGES</span>
                  <span>{messagesUsed.toLocaleString()} / {messagesLimit.toLocaleString()}</span>
                </div>
                <div className="h-1 w-full bg-[#1E2340] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F6EF7] rounded-full" style={{ width: `${usagePercent}%` }} />
                </div>
              </div>
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] hover:text-white transition-colors w-full pt-1"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 overflow-y-auto relative w-full">
          {/* Mobile Top Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1E2340] bg-[#0E1020] lg:hidden">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white hover:bg-[#1A1F3A]" />
              <span className="font-headline font-bold text-sm tracking-tight text-white">Blu_bot</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#4F6EF7]/20 flex items-center justify-center text-[#4F6EF7] font-bold text-xs">
              AC
            </div>
          </div>
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}