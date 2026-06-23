'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, User, Bot, ExternalLink, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ConversationsPage() {
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [outboundText, setOutboundText] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const selectedConvoRef = useRef<any>(null);

  // Fallback mock data
  const mockConversations = [
    { id: '1', customer_number: '+260 771 234 567', last_message: 'I need help with my package tracking...', status: 'active', last_message_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(), direction: 'inbound', topic: 'Order #8219' },
    { id: '2', customer_number: '+260 779 958 123', last_message: 'This is the third time I ask!!', status: 'escalated', last_message_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(), direction: 'inbound', topic: 'Order #4110' },
    { id: '3', customer_number: '+260 772 144 987', last_message: 'Thank you for your help!', status: 'resolved', last_message_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), direction: 'outbound', topic: 'Product Inquiry' },
    { id: '4', customer_number: '+260 770 001 456', last_message: 'What are your store hours?', status: 'active', last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), direction: 'inbound', topic: 'General Inquiry' },
  ];

  const mockMessagesMap: Record<string, any[]> = {
    '1': [
      { id: 'm1', role: 'user', content: 'Hello, I bought a package last week but it hasn\'t arrived yet. Can you check?', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: 'm2', role: 'agent', content: 'I\'d be happy to help with that! Could you please provide your order ID?', created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
      { id: 'm3', role: 'user', content: 'My order ID is #8219-BA.', created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
      { id: 'm4', role: 'agent', content: 'Checking that for you... One moment.', created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
    ],
    '2': [
      { id: 'm5', role: 'user', content: 'This is the third time I ask!! Why is my webhook not responding?', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: 'm6', role: 'system', content: 'Needs your attention — customer request requires manual review', created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString() },
    ]
  };

  const getCustomerInfo = (number: string) => {
    if (number.includes('234')) {
      return { totalOrders: 3, ltv: 'ZMW 4,500', lastVisit: '2 hours ago' };
    } else if (number.includes('958')) {
      return { totalOrders: 1, ltv: 'ZMW 850', lastVisit: '14 mins ago' };
    } else if (number.includes('144')) {
      return { totalOrders: 12, ltv: 'ZMW 18,200', lastVisit: '1 hour ago' };
    } else {
      return { totalOrders: 0, ltv: 'ZMW 0', lastVisit: '3 hours ago' };
    }
  };

  const customerInfo = selectedConvo ? getCustomerInfo(selectedConvo.customer_number) : null;

  // 1. Fetch User Business ID
  useEffect(() => {
    async function loadBusiness() {
      try {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id')
          .limit(1)
          .maybeSingle();
        
        if (businessData) {
          setBusinessId(businessData.id);
          fetchConversations(businessData.id);
        } else {
          // If user hasn't created a business, fallback to mock data
          setConversations(mockConversations);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        setConversations(mockConversations);
        setLoading(false);
      }
    }
    loadBusiness();
  }, []);

  // 2. Fetch Conversations belonging to the business
  async function fetchConversations(activeBusId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          customer_number,
          status,
          last_message_at,
          summary,
          messages (
            content,
            role,
            created_at
          )
        `)
        .eq('business_id', activeBusId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map((c: any) => {
          const sortedMsgs = (c.messages || []).sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latestMsg = sortedMsgs[0];
          return {
            id: c.id,
            customer_number: c.customer_number,
            last_message: latestMsg?.content || c.summary || 'No messages yet',
            direction: latestMsg?.role === 'user' ? 'inbound' : 'outbound',
            status: c.status,
            last_message_at: c.last_message_at,
            topic: c.summary || 'Product Inquiry',
          };
        });
        setConversations(formatted);
      } else {
        setConversations(mockConversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations(mockConversations);
    } finally {
      setLoading(false);
    }
  }

  // 3. Fetch Messages for selected conversation
  async function fetchMessages(convoId: string) {
    if (['1', '2', '3', '4'].includes(convoId)) {
      setMessages(mockMessagesMap[convoId] || []);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const mappedMessages = (data || []).map((m: any) => {
        if (m.role === 'system' && (m.content.includes('Low AI confidence') || m.content.includes('escalated'))) {
          return {
            ...m,
            content: 'Needs your attention — customer request requires manual review'
          };
        }
        return m;
      });

      setMessages(mappedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }

  // Update selectedConvo Ref and load corresponding messages
  useEffect(() => {
    selectedConvoRef.current = selectedConvo;
    if (selectedConvo) {
      fetchMessages(selectedConvo.id);
    } else {
      setMessages([]);
    }
  }, [selectedConvo]);

  // 4. Real-time Subscriptions using WebSockets
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel('realtime-conversations-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `business_id=eq.${businessId}` },
        () => {
          fetchConversations(businessId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `business_id=eq.${businessId}` },
        (payload) => {
          if (selectedConvoRef.current && payload.new.conversation_id === selectedConvoRef.current.id) {
            fetchMessages(selectedConvoRef.current.id);
          }
          fetchConversations(businessId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  // 5. Send outbound reply message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outboundText.trim() || !selectedConvo) return;

    const messageText = outboundText;
    setOutboundText('');

    // If it's a mock convo, append locally
    if (['1', '2', '3', '4'].includes(selectedConvo.id)) {
      const newMockMsg = {
        id: `m-mock-${Date.now()}`,
        role: 'agent',
        content: messageText,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMockMsg]);
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConvo.id,
          business_id: businessId!,
          role: 'agent',
          content: messageText
        });
      
      if (error) throw error;
      fetchMessages(selectedConvo.id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // 6. Update Conversation status (escalated or resolved)
  const handleUpdateStatus = async (status: 'escalated' | 'resolved' | 'active') => {
    if (!selectedConvo) return;

    // Handle mock convos locally
    if (['1', '2', '3', '4'].includes(selectedConvo.id)) {
      setSelectedConvo((prev: any) => ({ ...prev, status }));
      setConversations(prev => prev.map(c => c.id === selectedConvo.id ? { ...c, status } : c));
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', selectedConvo.id);

      if (error) throw error;
      setSelectedConvo((prev: any) => ({ ...prev, status }));
      fetchConversations(businessId!);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Formatting helpers
  function formatTime(dateString: string) {
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
      
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  function formatMessageTime(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  const filteredConversations = conversations.filter(chat => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Open') return chat.status === 'active';
    if (activeTab === 'Needs Attention') return chat.status === 'escalated';
    if (activeTab === 'Resolved') return chat.status === 'resolved';
    return true;
  });

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-headline font-bold text-white">Customer Messages</h1>
        <p className="text-[#64748B] text-sm">View and manage customer inquiries</p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0E1020] border border-[#1E2340] p-2 rounded-xl">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#3A4060]" />
          <Input 
            placeholder="Search by phone number or message..." 
            className="pl-10 bg-transparent border-none focus-visible:ring-0 text-sm placeholder:text-[#3A4060]" 
          />
        </div>
        <div className="flex gap-1 h-9 bg-[#07080F] p-1 rounded-lg border border-[#1E2340]">
          {['All', 'Open', 'Needs Attention', 'Resolved'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 text-[11px] font-headline font-bold rounded-md transition-all",
                activeTab === tab ? "bg-[#1A1F3A] text-white shadow-sm" : "text-[#64748B] hover:text-[#E2E8F0]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden relative">
        {/* Table Area */}
        <div className={cn(
          "flex-1 liquid-glass-panel overflow-hidden flex flex-col",
          selectedConvo && "hidden lg:flex"
        )}>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#1E2340] bg-[#131629]/50">
                  <th className="p-4 w-12"><Input type="checkbox" className="w-4 h-4 rounded border-[#1E2340] bg-transparent" /></th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Customer</th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Order / Topic</th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Last Message</th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Time</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2340]">
                {filteredConversations.map((chat) => (
                  <tr 
                    key={chat.id} 
                    onClick={() => setSelectedConvo(chat)}
                    className={cn(
                      "hover:bg-[#1A1F3A] cursor-pointer transition-colors group",
                      selectedConvo?.id === chat.id && "bg-[#1A1F3A]",
                      chat.status === 'escalated' && "bg-[#FF4D6D]/5"
                    )}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Input type="checkbox" className="w-4 h-4 rounded border-[#1E2340] bg-transparent" />
                    </td>
                    <td className="p-4 font-mono text-sm text-white">{chat.customer_number}</td>
                    <td className="p-4 text-xs text-[#A78BFA] font-medium">{chat.topic || 'Product Inquiry'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-[#E2E8F0] line-clamp-1">
                        {chat.direction === 'inbound' ? <span className="text-[#A78BFA]">←</span> : <span className="text-[#4F6EF7]">→</span>}
                        {chat.last_message}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={chat.status as any} /></td>
                    <td className="p-4 text-[10px] font-mono text-[#64748B]">{formatTime(chat.last_message_at)}</td>
                    <td className="p-4">
                      <ChevronRight className="w-4 h-4 text-[#3A4060] group-hover:text-white transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="p-4 border-t border-[#1E2340] flex justify-center">
            <button className="text-[11px] font-headline font-bold text-[#64748B] hover:text-white transition-colors">LOAD MORE CONVERSATIONS</button>
          </div>
        </div>

        {/* Selected Convo Side Panel */}
        {selectedConvo && (
          <div className="w-full lg:w-[420px] liquid-glass-panel flex flex-col animate-in slide-in-from-right-4 duration-300">
            {/* Panel Header */}
            <div className="p-6 border-b border-[#1E2340] bg-[#131629]/50 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-mono text-lg font-bold text-white tracking-tight">{selectedConvo.customer_number}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B] uppercase">
                    <StatusBadge status={selectedConvo.status} className="h-4 px-2" />
                    <span>·</span>
                    <span>{messages.length} Messages</span>
                  </div>
                </div>
                <button onClick={() => setSelectedConvo(null)} className="text-[#3A4060] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Stats Panel */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#07080F]/50 border border-[#1E2340] rounded-xl text-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-[#64748B] uppercase">Total Orders</span>
                  <span className="text-xs font-bold text-white mt-0.5">{customerInfo?.totalOrders}</span>
                </div>
                <div className="flex flex-col border-x border-[#1E2340]">
                  <span className="text-[9px] font-mono text-[#64748B] uppercase">LTV</span>
                  <span className="text-xs font-bold text-[#22D3A0] mt-0.5">{customerInfo?.ltv}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-[#64748B] uppercase">Last Visit</span>
                  <span className="text-xs font-bold text-[#A78BFA] mt-0.5">{customerInfo?.lastVisit}</span>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#07080F]/50">
              {messages.map((msg) => {
                const isAgent = msg.role === 'agent';
                const isSystem = msg.role === 'system';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D] px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider text-center max-w-[90%]">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col gap-1",
                    isAgent ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm",
                      isAgent 
                        ? "bg-[#4F6EF7] text-white rounded-tr-none" 
                        : "bg-[#131629] border border-[#1E2340] text-[#E2E8F0] rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      {isAgent ? <Bot className="w-3 h-3 text-[#A78BFA]" /> : <User className="w-3 h-3 text-[#64748B]" />}
                      <span className="text-[9px] font-mono text-[#3A4060]">{formatMessageTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input Box */}
            {selectedConvo.status !== 'resolved' && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#1E2340] bg-[#131629]/50 flex gap-2">
                <input
                  type="text"
                  value={outboundText}
                  onChange={(e) => setOutboundText(e.target.value)}
                  placeholder="Type a response..."
                  className="flex-1 bg-[#07080F]/50 border border-[#1E2340] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4F6EF7] placeholder:text-[#3A4060]"
                />
                <button 
                  type="submit" 
                  className="p-2 bg-[#4F6EF7] hover:bg-[#4F6EF7]/80 rounded-lg text-white transition-all shadow-[0_0_10px_rgba(79,110,247,0.3)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Actions Bar */}
            <div className="p-6 border-t border-[#1E2340] bg-[#131629]/50 space-y-4">
              <div className="flex gap-2">
                {selectedConvo.status !== 'escalated' && (
                  <button 
                    onClick={() => handleUpdateStatus('escalated')}
                    className="flex-1 py-2.5 bg-[#FF4D6D22] border border-[#FF4D6D44] text-[#FF4D6D] rounded-lg text-[10px] font-headline font-bold uppercase hover:bg-[#FF4D6D33] transition-all"
                  >
                    Flag for Follow-up
                  </button>
                )}
                {selectedConvo.status !== 'resolved' ? (
                  <button 
                    onClick={() => handleUpdateStatus('resolved')}
                    className="flex-1 py-2.5 bg-[#1E2340] border border-[#2E3560] text-white rounded-lg text-[10px] font-headline font-bold uppercase hover:bg-[#2E3560] transition-all"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpdateStatus('active')}
                    className="w-full py-2.5 bg-[#22D3A0]/10 border border-[#22D3A0]/30 text-[#22D3A0] rounded-lg text-[10px] font-headline font-bold uppercase hover:bg-[#22D3A0]/20 transition-all"
                  >
                    Reopen Conversation
                  </button>
                )}
              </div>
              <Link 
                href={`/conversations/${selectedConvo.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#4F6EF7] text-white rounded-lg text-xs font-headline font-bold hover:bg-[#4F6EF7]/80 transition-all shadow-[0_0_15px_-5px_#4F6EF7]"
              >
                OPEN FULL VIEW <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}