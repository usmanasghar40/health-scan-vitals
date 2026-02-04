import React, { useState } from 'react';
import { LabResult } from '@/types/health';
import LabResultCard from './LabResultCard';
import { ChevronDown, ChevronUp, Beaker, Heart, Droplets, Zap, Shield, Pill, Activity } from 'lucide-react';

interface LabPanelSectionProps {
  title: string;
  description: string;
  results: LabResult[];
  icon: 'beaker' | 'heart' | 'droplets' | 'zap' | 'shield' | 'pill' | 'activity';
  color: string;
}

const iconMap = {
  beaker: Beaker,
  heart: Heart,
  droplets: Droplets,
  zap: Zap,
  shield: Shield,
  pill: Pill,
  activity: Activity
};

const LabPanelSection: React.FC<LabPanelSectionProps> = ({ 
  title, 
  description, 
  results, 
  icon,
  color 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = iconMap[icon];

  const normalCount = results.filter(r => r.status === 'normal' || r.status === 'optimal').length;
  const abnormalCount = results.length - normalCount;

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                {normalCount} Normal
              </span>
              {abnormalCount > 0 && (
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                  {abnormalCount} Abnormal
                </span>
              )}
            </div>
            {isExpanded ? 
              <ChevronUp className="w-5 h-5 text-slate-400" /> : 
              <ChevronDown className="w-5 h-5 text-slate-400" />
            }
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {isExpanded && (
        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result, index) => (
            <LabResultCard key={`${result.name}-${index}`} result={result} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LabPanelSection;
