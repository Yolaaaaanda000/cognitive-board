import React from 'react';
import { BOARD_MEMBERS } from '../constants';

const BoardSidebar: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          The Board
        </h2>
        <p className="text-xs text-gray-500 mt-1">Your Personal Cognitive Directors</p>
      </div>
      
      <div className="p-4 space-y-3">
        {BOARD_MEMBERS.map((member) => (
          <div 
            key={member.id}
            className={`p-3 rounded-xl border transition-all hover:shadow-sm cursor-default ${member.color} bg-opacity-30 border-opacity-40`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">{member.icon}</span>
              <div>
                <h3 className="font-semibold text-sm">{member.name}</h3>
                <p className="text-[10px] uppercase tracking-wider opacity-75 font-bold">{member.title}</p>
              </div>
            </div>
            <p className="text-xs opacity-90 pl-8 leading-relaxed">
              {member.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 bg-gray-50 text-center text-xs text-gray-400 border-t border-gray-100">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default BoardSidebar;