import React, { useState } from 'react';
import { LabResult } from '@/types/health';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface LabResultCardProps {
  result: LabResult;
}

const statusColors = {
  normal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  optimal: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  low: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30'
};

const statusLabels = {
  normal: 'Normal',
  optimal: 'Optimal',
  low: 'Low',
  high: 'High',
  critical: 'Critical'
};

const LabResultCard: React.FC<LabResultCardProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getProgressWidth = () => {
    if (result.status === 'optimal' || result.status === 'normal') return '75%';
    if (result.status === 'low') return '25%';
    if (result.status === 'high') return '90%';
    return '95%';
  };

  const getProgressColor = () => {
    if (result.status === 'optimal') return 'bg-gradient-to-r from-cyan-500 to-blue-500';
    if (result.status === 'normal') return 'bg-gradient-to-r from-emerald-500 to-green-500';
    if (result.status === 'low') return 'bg-gradient-to-r from-amber-500 to-yellow-500';
    if (result.status === 'high') return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-white">{result.name}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[result.status]}`}>
              {statusLabels[result.status]}
            </span>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-white">{result.value}</span>
          <span className="text-sm text-slate-400">{result.unit}</span>
        </div>

        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: getProgressWidth() }}
          />
        </div>

        <p className="text-xs text-slate-400 mt-2">Reference: {result.normalRange}</p>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 animate-fadeIn">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300 leading-relaxed">{result.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabResultCard;
