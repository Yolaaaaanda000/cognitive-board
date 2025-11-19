
import React from 'react';
import { Message, Role } from '../types';
import { BOARD_MEMBERS } from '../constants';

interface MessageBubbleProps {
  message: Message;
}

// Helper to parse the specific "【Agent Name】" format returned by the model
const formatModelText = (text: string) => {
  // Split by the agent delimiter pattern: **【Agent Name】**:
  const parts = text.split(/(\*\*【[^】]+】\*\*:)/g);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (!part.trim()) return null;

        // Check if this part is a header
        const headerMatch = part.match(/\*\*【([^】]+)】\*\*:/);
        
        if (headerMatch) {
           const agentName = headerMatch[1];
           const agent = BOARD_MEMBERS.find(m => 
             agentName.toLowerCase().includes(m.name.toLowerCase()) || 
             agentName.toLowerCase().includes(m.title.toLowerCase()) ||
             (m.id === 'manager' && agentName.toLowerCase().includes('manager'))
           );
           
           const isManager = agent?.id === 'manager';

           return (
             <div key={index} className="flex items-center gap-2 mt-4 mb-1">
               <span className="text-lg">{agent?.icon || '🤖'}</span>
               <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${isManager ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                 {agentName}
               </span>
             </div>
           );
        }

        // Regular text content
        return (
          <div key={index} className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {part.replace(/^\n+/, '').replace(/\n+$/, '')}
          </div>
        );
      })}
    </div>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in-up`}>
      <div 
        className={`
          max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-4 shadow-sm
          ${isUser 
            ? 'bg-black text-white rounded-br-none' 
            : 'bg-white border border-gray-100 rounded-bl-none shadow-md'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div>
            {formatModelText(message.content)}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse align-middle"></span>
            )}
          </div>
        )}
        <div className={`text-[10px] mt-2 opacity-40 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;