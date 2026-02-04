import React, { useState } from 'react';
import { VitalSign } from '@/types/health';
import { Heart, Activity, Droplets, Thermometer, Wind, Zap } from 'lucide-react';

interface VitalCardProps {
  vital: VitalSign;
  index: number;
}

const iconMap: { [key: string]: React.ReactNode } = {
  'Heart Rate': <Heart className="w-6 h-6" />,
  'Blood Pressure': <Activity className="w-6 h-6" />,
  'O2 Saturation': <Wind className="w-6 h-6" />,
  'Blood Glucose': <Droplets className="w-6 h-6" />,
  'Body Temperature': <Thermometer className="w-6 h-6" />,
  'Respiratory Rate': <Zap className="w-6 h-6" />
};

const statusColors = {
  optimal: 'from-emerald-500 to-green-500',
  normal: 'from-blue-500 to-cyan-500',
  warning: 'from-amber-500 to-yellow-500',
  critical: 'from-red-500 to-rose-500'
};

const statusBg = {
  optimal: 'bg-emerald-500/10 border-emerald-500/30',
  normal: 'bg-blue-500/10 border-blue-500/30',
  warning: 'bg-amber-500/10 border-amber-500/30',
  critical: 'bg-red-500/10 border-red-500/30'
};

const VitalCard: React.FC<VitalCardProps> = ({ vital, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${statusBg[vital.status]} backdrop-blur-sm p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${statusColors[vital.status]} text-white`}>
          {iconMap[vital.name] || <Activity className="w-6 h-6" />}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-gradient-to-r ${statusColors[vital.status]} text-white`}>
          {vital.status}
        </span>
      </div>
      
      <h3 className="text-sm font-medium text-slate-400 mb-1">{vital.name}</h3>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-white">{vital.value}</span>
        <span className="text-sm text-slate-400">{vital.unit}</span>
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-xs text-slate-400">Normal: {vital.normalRange}</p>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
          <p className="text-sm text-slate-300 leading-relaxed">{vital.description}</p>
        </div>
      )}
    </div>
  );
};

export default VitalCard;
