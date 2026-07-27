'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, ShieldAlert, CheckCircle2, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'message' | 'escalation' | 'system';
  read: boolean;
  link: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'WhatsApp API Connected',
      description: 'Official Meta Cloud API gateway is active and ready.',
      time: 'Just now',
      type: 'system',
      read: false,
      link: '/settings/numbers',
    },
    {
      id: '2',
      title: 'AI Auto-Response Active',
      description: 'AI agent is configured to handle customer inquiries 24/7.',
      time: '10m ago',
      type: 'message',
      read: false,
      link: '/conversations',
    },
    {
      id: '3',
      title: 'System Operational',
      description: 'All message pipelines & Supabase databases are healthy.',
      time: '1h ago',
      type: 'system',
      read: true,
      link: '/audit-log',
    },
  ]);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Optionally fetch real notifications from Supabase
  useEffect(() => {
    async function fetchRealNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();

        if (!business) return;

        // Fetch recent escalated conversations
        const { data: escalations } = await supabase
          .from('conversations')
          .select('id, customer_number, updated_at')
          .eq('business_id', business.id)
          .eq('status', 'escalated')
          .order('updated_at', { ascending: false })
          .limit(3);

        if (escalations && escalations.length > 0) {
          const escNotifs: NotificationItem[] = escalations.map(e => ({
            id: `esc-${e.id}`,
            title: 'Human Escalation Requested',
            description: `Customer ${e.customer_number || 'user'} requested human assistance.`,
            time: new Date(e.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'escalation',
            read: false,
            link: '/conversations',
          }));

          setNotifications(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = escNotifs.filter(n => !existingIds.has(n.id));
            return [...fresh, ...prev];
          });
        }
      } catch (err) {
        console.warn('Real notification fetch note:', err);
      }
    }

    fetchRealNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markSingleAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-[#0D0F1A] border border-[#1E2340] hover:bg-[#1A1F3A] hover:border-[#4F6EF7]/50 text-[#94A3B8] hover:text-white transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#A78BFA]" />
        
        {/* Unread Badge Indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4D6D] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF4D6D] text-[9px] font-bold text-white items-center justify-center font-mono">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Floating Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0E1020] border border-[#1E2340] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Popover Header */}
          <div className="p-4 border-b border-[#1E2340] flex items-center justify-between bg-[#131629]/80">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#4F6EF7]" />
              <span className="font-headline font-bold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono bg-[#4F6EF7]/20 text-[#4F6EF7] px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[#64748B] hover:text-[#22D3A0] flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[#64748B] hover:text-[#FF4D6D] flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1E2340]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#22D3A0] mx-auto opacity-80" />
                <p className="text-xs font-headline font-semibold text-white">All caught up!</p>
                <p className="text-[11px] text-[#64748B]">No unread notifications at the moment.</p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => markSingleAsRead(item.id)}
                  className={`p-4 transition-colors relative flex items-start gap-3 cursor-pointer ${
                    item.read ? 'bg-[#0E1020] opacity-75' : 'bg-[#131629]/60 hover:bg-[#1A1F3A]'
                  }`}
                >
                  {/* Type Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {item.type === 'escalation' ? (
                      <div className="w-8 h-8 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 flex items-center justify-center text-[#FF4D6D]">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    ) : item.type === 'message' ? (
                      <div className="w-8 h-8 rounded-xl bg-[#4F6EF7]/10 border border-[#4F6EF7]/20 flex items-center justify-center text-[#4F6EF7]">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-[#22D3A0]/10 border border-[#22D3A0]/20 flex items-center justify-center text-[#22D3A0]">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-headline font-bold text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] font-mono text-[#64748B]">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-normal line-clamp-2">
                      {item.description}
                    </p>
                    <Link
                      href={item.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4F6EF7] hover:text-[#3D5FE6] mt-1"
                    >
                      View Details <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>

                  {/* Unread indicator dot */}
                  {!item.read && (
                    <div className="w-2 h-2 rounded-full bg-[#4F6EF7] flex-shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer link */}
          <div className="p-3 bg-[#07080F] border-t border-[#1E2340] text-center">
            <Link
              href="/audit-log"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-mono text-[#64748B] hover:text-white transition-colors"
            >
              View Full Activity Log →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
