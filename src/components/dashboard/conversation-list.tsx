import React from 'react';
import { Badge } from '@/components/ui/badge';

const mockConversations = [
  { id: '1', phone: '+1 555 010 2341', status: 'active', lastMsg: 'I need to track my order.', time: '2m ago' },
  { id: '2', phone: '+44 20 7946 0958', status: 'escalated', lastMsg: 'This is the third time I ask!!', time: '14m ago' },
  { id: '3', phone: '+1 202 555 0144', status: 'resolved', lastMsg: 'Thank you for your help!', time: '1h ago' },
];

export function ConversationList() {
  return (
    <div className="divide-y divide-white/5">
      {mockConversations.map((chat) => (
        <div 
          key={chat.id} 
          className="p-4 hover:bg-white/5 cursor-pointer transition-all flex justify-between items-start group"
        >
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sm text-white group-hover:text-primary transition-colors">{chat.phone}</span>
            <p className="text-xs text-muted-foreground line-clamp-1">{chat.lastMsg}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] text-muted-foreground uppercase">{chat.time}</span>
            <Badge 
              variant={chat.status === 'escalated' ? 'destructive' : chat.status === 'resolved' ? 'secondary' : 'default'}
              className="text-[9px] px-1 py-0 h-4"
            >
              {chat.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
