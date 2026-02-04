import React, { useState } from 'react';
import { 
  ArrowLeft, AlertTriangle, CheckCircle, AlertCircle, Clock,
  Phone, Calendar, FileText, Download, Share2, Printer,
  ChevronDown, ChevronUp, Stethoscope, Heart, Activity,
  TrendingUp, TrendingDown, Minus, MessageSquare, Shield
} from 'lucide-react';
import { ImportSession, ImportedLabResult } from '@/types/health';

interface LabInterpretationPanelProps {
  session: ImportSession;
  onBack: () => void;
}

const LabInterpretationPanel: React.FC<LabInterpretationPanelProps> = ({ session, onBack }) => {
  const [expandedResults, setExpandedResults] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'urgent' | 'normal'>('all');

  const toggleExpand = (id: string) => {
    setExpandedResults(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'urgent': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'high':
      case 'low': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      default: return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
  };

  const filteredResults = session.results.filter(result => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return result.urgency === 'critical';
    if (activeFilter === 'urgent') return result.urgency === 'urgent';
    return result.urgency === 'routine';
  });

  const hasCritical = session.criticalResults > 0;
  const hasUrgent = session.abnormalResults > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Import
        </button>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors">
            <Share2 className="w-4 h-4" />
            Share with Provider
          </button>
        </div>
      </div>

      {/* Overall Assessment Banner */}
      {hasCritical ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-400 mb-2">
                CRITICAL: Immediate Medical Attention Required
              </h3>
              <p className="text-slate-300 mb-4">
                {session.criticalResults} critical result(s) detected that require urgent follow-up 
                with your healthcare provider within 24-48 hours. Please review the detailed 
                recommendations below and contact your provider immediately.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  <Phone className="w-4 h-4" />
                  Contact Provider Now
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Schedule Urgent Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : hasUrgent ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-400 mb-2">
                Follow-Up Recommended
              </h3>
              <p className="text-slate-300 mb-4">
                {session.abnormalResults} abnormal result(s) detected. While not immediately critical, 
                these findings should be discussed with your healthcare provider within 2-4 weeks 
                for proper evaluation and management decisions.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Schedule Follow-Up
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Message Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-emerald-400 mb-2">
                All Results Within Normal Range
              </h3>
              <p className="text-slate-300 mb-4">
                Great news! All {session.totalTests} test results are within normal limits. 
                Continue your current health regimen and schedule routine follow-up as needed.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                <Calendar className="w-4 h-4" />
                Schedule Routine Check-Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-1">Total Tests</p>
          <p className="text-2xl font-bold text-white">{session.totalTests}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-1">Normal</p>
          <p className="text-2xl font-bold text-emerald-400">{session.normalResults}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-1">Abnormal</p>
          <p className="text-2xl font-bold text-amber-400">{session.abnormalResults}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-400">{session.criticalResults}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Results', count: session.totalTests },
          { id: 'critical', label: 'Critical', count: session.criticalResults },
          { id: 'urgent', label: 'Needs Attention', count: session.abnormalResults },
          { id: 'normal', label: 'Normal', count: session.normalResults }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeFilter === filter.id
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            isExpanded={expandedResults.includes(result.id)}
            onToggle={() => toggleExpand(result.id)}
          />
        ))}
      </div>

      {/* Provider Communication Section */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-cyan-400" />
          Healthcare Provider Communication
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Send Message</p>
              <p className="text-slate-400 text-sm">Secure messaging</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Book Appointment</p>
              <p className="text-slate-400 text-sm">Schedule visit</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Share Results</p>
              <p className="text-slate-400 text-sm">HIPAA compliant</p>
            </div>
          </button>
        </div>
      </div>

      {/* HIPAA Notice */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">HIPAA Compliant Analysis</h4>
            <p className="text-slate-400 text-sm">
              This interpretation is generated using AI technology and is intended for informational 
              purposes only. It does not replace professional medical advice. All data is processed 
              in compliance with HIPAA regulations and is encrypted end-to-end. Always consult with 
              your healthcare provider for medical decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Result Card Component
interface ResultCardProps {
  result: ImportedLabResult;
  isExpanded: boolean;
  onToggle: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, isExpanded, onToggle }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'border-red-500/50 bg-red-500/5';
      case 'high':
      case 'low': return 'border-amber-500/50 bg-amber-500/5';
      default: return 'border-slate-700/50';
    }
  };

  const getValueTrend = (status: string) => {
    if (status === 'high') return <TrendingUp className="w-4 h-4 text-amber-400" />;
    if (status === 'low') return <TrendingDown className="w-4 h-4 text-amber-400" />;
    return <Minus className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className={`bg-slate-800/50 rounded-xl border ${getStatusColor(result.status)} overflow-hidden`}>
      {/* Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            result.status === 'critical' ? 'bg-red-500/20' :
            result.status === 'high' || result.status === 'low' ? 'bg-amber-500/20' :
            'bg-emerald-500/20'
          }`}>
            {result.status === 'critical' ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : result.status === 'high' || result.status === 'low' ? (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <p className="text-white font-medium">{result.name}</p>
            <p className="text-slate-400 text-sm">{result.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <p className={`text-lg font-bold ${
                result.status === 'critical' ? 'text-red-400' :
                result.status === 'high' || result.status === 'low' ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {result.value} {result.unit}
              </p>
              {getValueTrend(result.status)}
            </div>
            <p className="text-slate-500 text-xs">Normal: {result.normalRange}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            result.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
            result.urgency === 'urgent' ? 'bg-amber-500/20 text-amber-400' :
            'bg-emerald-500/20 text-emerald-400'
          }`}>
            {result.urgency === 'critical' ? 'Critical' :
             result.urgency === 'urgent' ? 'Follow-Up Needed' : 'Normal'}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && result.interpretation && (
        <div className="border-t border-slate-700/50 p-4 space-y-4">
          {/* Interpretation Summary */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">AI Interpretation</h4>
            <p className="text-slate-400 text-sm">{result.interpretation.summary}</p>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {result.interpretation.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                    result.urgency === 'critical' ? 'bg-red-400' :
                    result.urgency === 'urgent' ? 'bg-amber-400' :
                    'bg-emerald-400'
                  }`} />
                  <span className="text-slate-400">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow-Up */}
          {result.interpretation.followUpRequired && (
            <div className={`p-3 rounded-lg ${
              result.urgency === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
              'bg-amber-500/10 border border-amber-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${
                  result.urgency === 'critical' ? 'text-red-400' : 'text-amber-400'
                }`} />
                <span className={`text-sm font-medium ${
                  result.urgency === 'critical' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  Follow-Up Required: {result.interpretation.followUpTimeframe}
                </span>
              </div>
            </div>
          )}

          {/* Related Conditions */}
          {result.interpretation.relatedConditions && result.interpretation.relatedConditions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Related Conditions to Discuss</h4>
              <div className="flex flex-wrap gap-2">
                {result.interpretation.relatedConditions.map((condition, index) => (
                  <span key={index} className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle Recommendations */}
          {result.interpretation.lifestyleRecommendations && result.interpretation.lifestyleRecommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Lifestyle Recommendations</h4>
              <ul className="space-y-1">
                {result.interpretation.lifestyleRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Heart className="w-4 h-4 text-pink-400 mt-0.5" />
                    <span className="text-slate-400">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source Info */}
          <div className="pt-3 border-t border-slate-700/50 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Source: {result.source}</span>
            <span>Lab: {result.labFacility}</span>
            <span>Provider: {result.orderingProvider}</span>
            <span>Collected: {result.collectionDate.toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabInterpretationPanel;
