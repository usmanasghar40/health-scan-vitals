import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Calendar, Upload, Stethoscope, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { getLabResults, LabResultRecord } from '@/lib/healthDatabase';

interface LabsViewProps {
  onNavigateToImport?: () => void;
}

const LabsView: React.FC<LabsViewProps> = ({ onNavigateToImport }) => {
  const { currentUser } = useUser();
  const [labResults, setLabResults] = useState<LabResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLabs = async () => {
      if (!currentUser?.id) {
        setLabResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await getLabResults(currentUser.id, undefined, 200);
        const raw = Array.isArray(data) ? data : [];
        const seen = new Map<string, LabResultRecord>();
        raw.forEach(result => {
          const key = [
            result.test_name,
            result.test_date,
            result.test_value,
            result.unit,
            result.status,
            result.normal_range
          ].join('|');
          if (!seen.has(key)) {
            seen.set(key, result);
          }
        });
        setLabResults(Array.from(seen.values()));
      } catch (err) {
        console.error('Error loading lab results:', err);
        setError('Unable to load lab results.');
      } finally {
        setIsLoading(false);
      }
    };

    loadLabs();
  }, [currentUser?.id]);

  const { totalTests, normalTests, abnormalTests, uniqueTests } = useMemo(() => {
    const total = labResults.length;
    const normal = labResults.filter(r => r.status === 'normal' || r.status === 'optimal').length;
    const unique = new Set(labResults.map(r => r.test_name)).size;
    return { totalTests: total, normalTests: normal, abnormalTests: total - normal, uniqueTests: unique };
  }, [labResults]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'optimal':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'low':
        return 'text-amber-400 bg-amber-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'critical':
        return 'text-rose-400 bg-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Laboratory Results
          </h2>
          <p className="text-slate-400 mt-1">Complete blood work and diagnostic panels</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">HIPAA Compliant</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Import CTA Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Import Your Lab Results</h3>
              <p className="text-slate-400 text-sm">
                Connect to your EHR (Epic, Cerner) or lab portal (LabCorp, Quest) to import results 
                for AI-powered interpretation and personalized recommendations.
              </p>
            </div>
          </div>
          <button 
            onClick={onNavigateToImport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all whitespace-nowrap"
          >
            <Stethoscope className="w-5 h-5" />
            Import & Analyze
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <p className="text-sm text-slate-400 mb-1">Total Tests</p>
          <p className="text-2xl font-bold text-white">{totalTests}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <p className="text-sm text-slate-400 mb-1">Normal Results</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-emerald-400">{normalTests}</p>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <p className="text-sm text-slate-400 mb-1">Abnormal Results</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-amber-400">{abnormalTests}</p>
            {abnormalTests > 0 && <AlertCircle className="w-5 h-5 text-amber-400" />}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <p className="text-sm text-slate-400 mb-1">Unique Tests</p>
          <p className="text-2xl font-bold text-white">{uniqueTests}</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400">
          {error}
        </div>
      )}

      {/* Overall Assessment */}
      {!isLoading && totalTests > 0 && (
        abnormalTests === 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                  All Results Within Normal Range
                </h3>
                <p className="text-slate-300 text-sm">
                  All {totalTests} test results are within normal limits. Continue your current
                  health regimen and follow up as recommended by your healthcare provider.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-400 mb-2">
                  Review Recommended
                </h3>
                <p className="text-slate-300 text-sm">
                  {abnormalTests} result(s) are outside the normal range. We recommend discussing these
                  results with your healthcare provider for proper evaluation.
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Lab Results */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Your Lab Results</h3>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 bg-slate-900/50 rounded-lg animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : totalTests === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No lab results yet</p>
              <p className="text-sm text-slate-500 mt-1">Import a report to add results to your profile</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2">Test</th>
                    <th className="pb-2">Result</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labResults.map(result => (
                    <tr key={result.id} className="border-t border-slate-700/50">
                      <td className="py-3 text-white">{result.test_name}</td>
                      <td className="py-3 text-slate-300">
                        {result.test_value} {result.unit}
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(result.test_date).toLocaleDateString('en-US')}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
        <h4 className="font-semibold text-white mb-2">Important Information</h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          These laboratory results are provided for informational purposes. Reference ranges may vary 
          between laboratories. Always discuss your results with a qualified healthcare provider who 
          can interpret them in the context of your overall health, medical history, and current 
          medications. Some values may require follow-up testing for confirmation.
        </p>
      </div>

      {/* HIPAA Notice */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">HIPAA Compliant Storage</h4>
            <p className="text-slate-400 text-sm">
              Your lab results are encrypted and stored in compliance with HIPAA regulations. 
              Access is logged and auditable. You can export or delete your data at any time 
              from the Privacy settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabsView;
