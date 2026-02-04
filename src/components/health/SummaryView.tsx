import React, { useEffect, useState } from 'react';
import HealthSummaryTable from './HealthSummaryTable';
import OverallHealthScore from './OverallHealthScore';
import { 
  vitalSigns, 
  healthSummary 
} from '@/data/healthData';
import { BarChart3, FileText, Download, Share2, Printer, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { InsuranceInfo } from './InsuranceView';
import { useUser } from '@/contexts/UserContext';
import { getLabResults } from '@/lib/healthDatabase';
import { LabResult } from '@/types/health';

interface PortableHealthRecord {
  exportDate: string;
  patientInfo: {
    name: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string;
  };
  insurance: InsuranceInfo[];
  vitalSigns: typeof vitalSigns;
  labResults: any[];
  healthSummary: typeof healthSummary;
  medications: { name: string; dosage: string; frequency: string }[];
  allergies: string[];
  conditions: string[];
}

const SummaryView: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { currentUser } = useUser();
  const [labResults, setLabResults] = useState<LabResult[]>([]);

  useEffect(() => {
    const loadLabs = async () => {
      if (!currentUser?.id) {
        setLabResults([]);
        return;
      }
      try {
        const data = await getLabResults(currentUser.id, undefined, 200);
        const mapped = (Array.isArray(data) ? data : []).map((result: any) => ({
          name: result.test_name,
          value: result.test_value,
          unit: result.unit,
          status: result.status,
          normalRange: result.normal_range,
          category: result.category,
          description: ''
        }));
        setLabResults(mapped);
      } catch (err) {
        console.error('Failed to load lab results:', err);
      }
    };

    loadLabs();
  }, [currentUser?.id]);

  // Sample insurance data (in production, this would come from context/state)
  const sampleInsurance: InsuranceInfo[] = [
    {
      id: '1',
      type: 'primary',
      providerName: 'Blue Cross Blue Shield',
      planName: 'PPO Gold Plan',
      policyNumber: 'BCBS-2024-789456',
      groupNumber: 'GRP-123456',
      memberId: 'XYZ123456789',
      subscriberName: 'Sarah Johnson',
      subscriberDOB: '1985-03-15',
      relationship: 'self',
      effectiveDate: '2024-01-01',
      copay: '$25 PCP / $50 Specialist',
      deductible: '$500 Individual / $1,500 Family',
      coinsurance: '80/20 after deductible',
      phoneNumber: '1-800-555-1234',
      isVerified: true,
      lastUpdated: new Date()
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Health Summary',
        text: 'Check out my comprehensive health report',
        url: window.location.href
      });
    }
  };

  const exportPortableHealthRecord = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Create the portable health record
      const healthRecord: PortableHealthRecord = {
        exportDate: new Date().toISOString(),
        patientInfo: {
          name: 'Sarah Johnson',
          dateOfBirth: '1985-03-15',
          gender: 'Female',
          bloodType: 'O+'
        },
        insurance: sampleInsurance.map(ins => ({
          ...ins,
          // Remove card images from export for privacy/size
          frontCardImage: ins.frontCardImage ? '[Image Available]' : undefined,
          backCardImage: ins.backCardImage ? '[Image Available]' : undefined
        })) as InsuranceInfo[],
        vitalSigns: vitalSigns,
        labResults: labResults,
        healthSummary: healthSummary,
        medications: [
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
          { name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily' },
          { name: 'Omega-3 Fish Oil', dosage: '1000mg', frequency: 'Twice daily' }
        ],
        allergies: ['Penicillin', 'Sulfa drugs'],
        conditions: ['Hypertension (controlled)', 'Vitamin D deficiency']
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(healthRecord, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-record-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    
    try {
      // In production, this would use a PDF generation library
      // For now, we'll trigger print which allows saving as PDF
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Complete Health Summary
          </h2>
          <p className="text-slate-400 mt-1">Comprehensive overview of all health metrics and test results</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Portable Health Record Export */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Portable Health Record</h3>
              <p className="text-slate-300 text-sm">
                Export your complete health record including insurance information, lab results, 
                medications, and health summary to share with new healthcare providers.
              </p>
            </div>
          </div>
          <button
            onClick={exportPortableHealthRecord}
            disabled={isExporting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              exportSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:from-emerald-600 hover:to-cyan-700'
            } disabled:opacity-50`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export Health Record
              </>
            )}
          </button>
        </div>
        
        {/* What's Included */}
        <div className="mt-4 pt-4 border-t border-emerald-500/20">
          <p className="text-xs text-slate-400 mb-2">Includes:</p>
          <div className="flex flex-wrap gap-2">
            {['Insurance Info', 'Vital Signs', 'Lab Results', 'Medications', 'Allergies', 'Health Summary'].map(item => (
              <span key={item} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Health Score */}
      <OverallHealthScore summary={healthSummary} />

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-xl p-5">
          <h4 className="text-rose-400 font-medium mb-2">Cardiovascular</h4>
          <p className="text-3xl font-bold text-white mb-1">Excellent</p>
          <p className="text-sm text-slate-400">All markers within optimal range</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-5">
          <h4 className="text-blue-400 font-medium mb-2">Metabolic</h4>
          <p className="text-3xl font-bold text-white mb-1">Optimal</p>
          <p className="text-sm text-slate-400">Healthy glucose and insulin levels</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-xl p-5">
          <h4 className="text-purple-400 font-medium mb-2">Thyroid</h4>
          <p className="text-3xl font-bold text-white mb-1">Normal</p>
          <p className="text-sm text-slate-400">Balanced hormone levels</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-5">
          <h4 className="text-emerald-400 font-medium mb-2">Immune</h4>
          <p className="text-3xl font-bold text-white mb-1">Strong</p>
          <p className="text-sm text-slate-400">No autoimmune markers detected</p>
        </div>
      </div>

      {/* Insurance Summary Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Insurance Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleInsurance.map(ins => (
            <div key={ins.id} className="bg-slate-900/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium">
                  {ins.type.toUpperCase()}
                </span>
                {ins.isVerified && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <h4 className="text-white font-medium">{ins.providerName}</h4>
              <p className="text-slate-400 text-sm">{ins.planName}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500">Policy #</p>
                  <p className="text-white font-mono">{ins.policyNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500">Group #</p>
                  <p className="text-white font-mono">{ins.groupNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Summary Table */}
      <HealthSummaryTable vitals={vitalSigns} labResults={labResults} />

      {/* Key Findings */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Key Findings & Clinical Notes
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2" />
            <div>
              <h4 className="font-medium text-emerald-400">Cardiovascular Health</h4>
              <p className="text-sm text-slate-300 mt-1">
                Excellent cardiovascular profile with optimal cholesterol ratios. LDL is well-controlled 
                and HDL is at a protective level. No significant plaque formation detected in arterial scans.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
            <div>
              <h4 className="font-medium text-blue-400">Metabolic Function</h4>
              <p className="text-sm text-slate-300 mt-1">
                Blood glucose and HbA1c indicate excellent glycemic control. Fasting insulin is optimal, 
                suggesting good insulin sensitivity. Kidney and liver function markers are all within normal limits.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-2" />
            <div>
              <h4 className="font-medium text-purple-400">Inflammatory Markers</h4>
              <p className="text-sm text-slate-300 mt-1">
                hs-CRP and ESR are both low, indicating minimal systemic inflammation. This is associated 
                with reduced risk of chronic diseases and cardiovascular events.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Personalized Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthSummary.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <p className="text-slate-300 text-sm">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
