'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Conversation {
  id: string;
  business_id: string;
  contact_wa_id: string;
  status: 'active' | 'escalated' | 'closed';
  last_message_at: string;
  escalation_reason: string | null;
  agent_context: any;
  created_at: string;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    business_id: 'b1',
    contact_wa_id: '+260 97 1234567',
    status: 'active',
    last_message_at: new Date().toISOString(),
    escalation_reason: null,
    agent_context: { summary: 'Checking order status' },
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    business_id: 'b1',
    contact_wa_id: '+260 97 9991111',
    status: 'escalated',
    last_message_at: new Date().toISOString(),
    escalation_reason: 'Frustrated customer',
    agent_context: { summary: 'Demanding immediate escalation' },
    created_at: new Date().toISOString(),
  },
];

/**
 * Custom React hook that subscribes to live Supabase Postgres updates
 * for the conversation tables and syncs state in real time.
 */
export function useRealtimeConversations(businessId: string) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);

  useEffect(() => {
    if (!businessId || businessId === 'mock') return;

    // Load initial data
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', businessId)
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setConversations(data as Conversation[]);
      }
    };

    fetchInitialData();

    // Subscribe to changes
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          console.log('[realtime] Received conversation update:', payload);

          setConversations((prev) => {
            const updatedIndex = prev.findIndex((c) => c.id === (payload.new as any).id);

            // Handle INSERT
            if (payload.eventType === 'INSERT') {
              return [payload.new as Conversation, ...prev];
            }

            // Handle UPDATE
            if (payload.eventType === 'UPDATE') {
              if (updatedIndex === -1) return prev;
              const copy = [...prev];
              copy[updatedIndex] = payload.new as Conversation;
              return copy.sort(
                (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            }

            // Handle DELETE
            if (payload.eventType === 'DELETE') {
              return prev.filter((c) => c.id !== (payload.old as any).id);
            }

            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  return conversations;
}
