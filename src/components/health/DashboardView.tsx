import React from 'react';
import VitalCard from './VitalCard';
import OverallHealthScore from './OverallHealthScore';
import { vitalSigns, cardiovascularMarkers, scanResults, healthSummary } from '@/data/healthData';
import { Activity, Heart, Zap, TrendingUp, Clock, Calendar, Upload, Shield, Lock, ArrowRight, ClipboardList, Stethoscope, Mic, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  onStartScan: () => void;
  onStartClinical?: () => void;
  onStartScribe?: () => void;
}


const DashboardView: React.FC<DashboardViewProps> = ({ onStartScan, onStartClinical, onStartScribe }) => {
  const quickStats = [
    { label: 'Last Scan', value: 'Today', icon: Clock, color: 'text-cyan-400' },
    { label: 'Next Checkup', value: 'Jan 15', icon: Calendar, color: 'text-purple-400' },
    { label: 'Health Trend', value: '+5%', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Active Alerts', value: '0', icon: Zap, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      {/* HIPAA Compliance Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                HIPAA Compliant Platform
                <Lock className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-slate-400 text-sm">
                Your health data is encrypted and protected. Import labs from any EHR or laboratory portal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400">SOC 2 Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Scribe CTA */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                AI Medical Scribe
                <span className="text-xs px-2 py-0.5 bg-violet-500/30 text-violet-300 rounded-full">NEW</span>
              </h3>
              <p className="text-slate-400 text-sm max-w-lg">
                Intelligent voice-to-text medical documentation. Records provider-patient conversations, 
                generates SOAP notes, and extracts physical exam findings automatically. Supports 25+ language inputs 
                with all documentation output in English for US patients.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded">Voice Recording</span>
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">SOAP Notes</span>
                <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-400 rounded">English Output</span>
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">Physical Exam</span>
              </div>

            </div>
          </div>
          <button
            onClick={onStartScribe}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
          >
            <Mic className="w-5 h-5" />
            Open Scribe
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Clinical Workflow CTA */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Start Clinical Assessment</h3>
              <p className="text-slate-400 text-sm max-w-lg">
                Complete a comprehensive Review of Systems questionnaire, receive AI-powered differential 
                diagnoses, and get provider-approved treatment plans including medications, lifestyle 
                modifications, and orthomolecular recommendations.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Review of Systems</span>
                <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-400 rounded">AI Diagnosis</span>
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">Provider Review</span>
                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">Treatment Plan</span>
              </div>
            </div>
          </div>
          <button
            onClick={onStartClinical}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25"
          >
            <Stethoscope className="w-5 h-5" />
            Begin Assessment
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>


      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-700/50 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Health Score */}
      <OverallHealthScore summary={healthSummary} />

      {/* Vitals Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Current Vitals
          </h2>
          <span className="text-sm text-slate-400">Updated just now</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vitalSigns.map((vital, index) => (
            <VitalCard key={vital.name} vital={vital} index={index} />
          ))}
        </div>
      </div>

      {/* Cardiovascular Markers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Cardiovascular Markers
          </h2>
          <button 
            onClick={onStartScan}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Run New Scan
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardiovascularMarkers.slice(0, 4).map((marker) => (
            <div key={marker.name} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <p className="text-sm text-slate-400 mb-1">{marker.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{marker.value}</span>
                <span className="text-sm text-slate-400">{marker.unit}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Normal: {marker.normalRange}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Scan Results */}
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          Recent Scan Results
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scanResults.slice(0, 2).map((result) => (
            <div key={result.area} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{result.area}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  result.plaqueLevel === 'none' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {result.plaqueLevel === 'none' ? 'Clear' : result.plaqueLevel}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                      style={{ width: `${result.arterialHealth}%` }}
                    />
                  </div>
                </div>
                <span className="text-lg font-bold text-white">{result.arterialHealth}%</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Blood Flow: {result.bloodFlow}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Security Notice */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">Your Data is Protected</h4>
            <p className="text-slate-400 text-sm">
              All health data is encrypted in transit and at rest using AES-256 encryption. 
              We maintain HIPAA compliance and Business Associate Agreements (BAAs) with all 
              third-party services. Access to your data is logged and auditable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
