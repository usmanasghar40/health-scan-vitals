import React from 'react';
import { ScanResult } from '@/types/health';
import { Heart, Activity, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface ScanResultsPanelProps {
  results: ScanResult[];
}

const ScanResultsPanel: React.FC<ScanResultsPanelProps> = ({ results }) => {
  const getHealthColor = (health: number) => {
    if (health >= 90) return 'from-emerald-500 to-green-500';
    if (health >= 70) return 'from-amber-500 to-yellow-500';
    return 'from-red-500 to-rose-500';
  };

  const getPlaqueColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'minimal': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'moderate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'significant': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getFlowColor = (flow: string) => {
    switch (flow) {
      case 'normal': return 'text-emerald-400';
      case 'reduced': return 'text-amber-400';
      case 'restricted': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div 
          key={result.area}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getHealthColor(result.arterialHealth)}`}>
                  {result.area.includes('Coronary') || result.area.includes('Heart') ? 
                    <Heart className="w-5 h-5 text-white" /> : 
                    <Activity className="w-5 h-5 text-white" />
                  }
                </div>
                <div>
                  <h4 className="font-semibold text-white">{result.area}</h4>
                  <p className="text-sm text-slate-400">Arterial Health Assessment</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{result.arterialHealth}%</div>
                <p className="text-xs text-slate-400">Health Score</p>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mb-4">
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${getHealthColor(result.arterialHealth)} transition-all duration-500`}
                  style={{ width: `${result.arterialHealth}%` }}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Plaque Level</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getPlaqueColor(result.plaqueLevel)}`}>
                  {result.plaqueLevel}
                </span>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Blood Flow</p>
                <span className={`text-sm font-medium capitalize ${getFlowColor(result.bloodFlow)}`}>
                  {result.bloodFlow}
                </span>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Plaque Detected</p>
                <span className={`text-sm font-medium ${result.plaqueDetected ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {result.plaqueDetected ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="border-t border-slate-700/50 pt-4">
              <h5 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                Recommendations
              </h5>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScanResultsPanel;
