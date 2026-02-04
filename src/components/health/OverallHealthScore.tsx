import React from 'react';
import { HealthSummary } from '@/types/health';
import { Heart, Activity, Flame, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface OverallHealthScoreProps {
  summary: HealthSummary;
}

const OverallHealthScore: React.FC<OverallHealthScoreProps> = ({ summary }) => {
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (summary.overallScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 85) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'from-emerald-500 to-green-500' };
    if (score >= 70) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'from-amber-500 to-yellow-500' };
    return { stroke: '#ef4444', text: 'text-red-400', bg: 'from-red-500 to-rose-500' };
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'moderate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'optimal': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'good': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'fair': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'poor': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const scoreColors = getScoreColor(summary.overallScore);

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Circular Score */}
        <div className="relative">
          <svg className="w-52 h-52 transform -rotate-90">
            <circle
              cx="104"
              cy="104"
              r="90"
              stroke="#334155"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="104"
              cy="104"
              r="90"
              stroke={scoreColors.stroke}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 10px ${scoreColors.stroke}40)`
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${scoreColors.text}`}>{summary.overallScore}</span>
            <span className="text-slate-400 text-sm">Health Score</span>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Health Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-rose-400" />
                <span className="text-sm text-slate-400">Cardiovascular Risk</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getRiskColor(summary.cardiovascularRisk)}`}>
                {summary.cardiovascularRisk}
              </span>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Metabolic Health</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getHealthColor(summary.metabolicHealth)}`}>
                {summary.metabolicHealth}
              </span>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-slate-400">Inflammation Level</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getRiskColor(summary.inflammationLevel)}`}>
                {summary.inflammationLevel}
              </span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Key Insights & Recommendations
            </h4>
            <div className="space-y-2">
              {summary.recommendations.slice(0, 4).map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallHealthScore;
