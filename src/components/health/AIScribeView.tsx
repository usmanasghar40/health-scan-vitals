import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import AIScribeModal from './AIScribeModal';
import { useUser } from '@/contexts/UserContext';

const AIScribeView: React.FC = () => {
  const { userRole } = useUser();
  const [isOpen, setIsOpen] = useState(true);

  if (userRole !== 'provider') {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 text-center">
        <h2 className="text-xl font-semibold text-white">AI Scribe</h2>
        <p className="text-slate-400 mt-2">AI Scribe is available for providers during appointments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-cyan-400" />
              AI Scribe
            </h2>
            <p className="text-slate-400 text-sm">AI Scribe opens directly without appointments.</p>
          </div>
        </div>
      </div>

      {isOpen && <AIScribeModal onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default AIScribeView;
