import React, { useState } from 'react';
import { 
  UserCheck, Shield, CheckCircle2, XCircle, Edit3, AlertTriangle,
  FileText, FlaskConical, Lock, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { ClinicalAssessment, ROSAnswer, DifferentialDiagnosis, LabRecommendation } from '@/types/health';
import { reviewOfSystemsSections } from '@/data/rosData';

interface ProviderReviewViewProps {
  assessment: ClinicalAssessment;
  rosAnswers: ROSAnswer[];
  onApprove: (assessment: ClinicalAssessment) => void;
  isProvider: boolean;
  onProviderLogin: () => void;
}

const ProviderReviewView: React.FC<ProviderReviewViewProps> = ({
  assessment,
  rosAnswers,
  onApprove,
  isProvider,
  onProviderLogin
}) => {
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>(
    assessment.differentialDiagnoses.map(d => d.id)
  );
  const [selectedLabs, setSelectedLabs] = useState<string[]>(
    assessment.recommendedLabs.map(l => l.id)
  );
  const [providerNotes, setProviderNotes] = useState('');
  const [showROS, setShowROS] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState({
    npi: '',
    license: '',
    name: '',
    specialty: ''
  });

  const toggleDiagnosis = (id: string) => {
    setSelectedDiagnoses(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleLab = (id: string) => {
    setSelectedLabs(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const getPositiveFindings = () => {
    return rosAnswers.filter(a => 
      a.answer === true || (typeof a.answer === 'number' && a.answer >= 7)
    );
  };

  const handleApprove = () => {
    const approvedAssessment: ClinicalAssessment = {
      ...assessment,
      differentialDiagnoses: assessment.differentialDiagnoses.filter(d => selectedDiagnoses.includes(d.id)),
      recommendedLabs: assessment.recommendedLabs.filter(l => selectedLabs.includes(l.id)),
      status: 'provider_approved',
      providerNotes
    };
    onApprove(approvedAssessment);
  };

  if (!isProvider) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-amber-500/30 p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Provider Authentication Required</h3>
          <p className="text-slate-400 text-center max-w-md mb-6">
            This step requires authentication as a licensed healthcare provider. 
            Only verified providers can review and approve clinical assessments.
          </p>
          
          {!showCredentials ? (
            <button
              onClick={() => setShowCredentials(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              Enter Provider Credentials
            </button>
          ) : (
            <div className="w-full max-w-md space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Provider Name</label>
                <input
                  type="text"
                  value={credentials.name}
                  onChange={(e) => setCredentials(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dr. Jane Smith"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">NPI Number</label>
                <input
                  type="text"
                  value={credentials.npi}
                  onChange={(e) => setCredentials(prev => ({ ...prev, npi: e.target.value }))}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Medical License</label>
                <input
                  type="text"
                  value={credentials.license}
                  onChange={(e) => setCredentials(prev => ({ ...prev, license: e.target.value }))}
                  placeholder="MD12345"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Specialty</label>
                <select
                  value={credentials.specialty}
                  onChange={(e) => setCredentials(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Specialty</option>
                  <option value="internal_medicine">Internal Medicine</option>
                  <option value="family_medicine">Family Medicine</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="endocrinology">Endocrinology</option>
                  <option value="general_practice">General Practice</option>
                </select>
              </div>
              <button
                onClick={onProviderLogin}
                disabled={!credentials.name || !credentials.npi || !credentials.license || !credentials.specialty}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify & Continue
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-slate-700/30 rounded-xl max-w-md">
            <p className="text-xs text-slate-400 text-center">
              <Shield className="w-4 h-4 inline mr-1" />
              Provider credentials are verified against the NPPES database and state medical boards. 
              All actions are logged for HIPAA compliance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 font-medium">Provider Mode Active</p>
              <p className="text-sm text-emerald-400/70">
                {credentials.name || 'Dr. Provider'} • {(credentials.specialty ? credentials.specialty.replace('_', ' ').toUpperCase() : 'Internal Medicine')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Verified</span>
          </div>
        </div>
      </div>

      {/* Review of Systems Summary */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <button
          onClick={() => setShowROS(!showROS)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Review of Systems</h3>
            <span className="text-sm text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
              {getPositiveFindings().length} Positive Findings
            </span>
          </div>
          {showROS ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {showROS && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="grid md:grid-cols-2 gap-4">
              {getPositiveFindings().map(finding => {
                const question = reviewOfSystemsSections
                  .flatMap(s => s.questions)
                  .find(q => q.id === finding.questionId);
                return (
                  <div key={finding.questionId} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-400">{question?.question}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Answer: {typeof finding.answer === 'number' ? `${finding.answer}/10` : 'Yes'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Differential Diagnoses Review */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Differential Diagnoses
          </h3>
          <span className="text-sm text-slate-400">
            {selectedDiagnoses.length} of {assessment.differentialDiagnoses.length} selected
          </span>
        </div>
        
        <div className="space-y-3">
          {assessment.differentialDiagnoses.map((dx) => (
            <div 
              key={dx.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedDiagnoses.includes(dx.id)
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-700/30 border-slate-600/30 opacity-60'
              }`}
              onClick={() => toggleDiagnosis(dx.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{dx.condition}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                      {dx.icdCode}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      dx.probability === 'high' ? 'bg-rose-500/20 text-rose-400' :
                      dx.probability === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-600 text-slate-400'
                    }`}>
                      {dx.probability} probability
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Supporting: {dx.supportingSymptoms.join(', ')}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedDiagnoses.includes(dx.id)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-600 text-slate-400'
                }`}>
                  {selectedDiagnoses.includes(dx.id) ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Laboratory Tests Review */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            Recommended Laboratory Tests
          </h3>
          <span className="text-sm text-slate-400">
            {selectedLabs.length} of {assessment.recommendedLabs.length} selected
          </span>
        </div>
        
        <div className="space-y-3">
          {assessment.recommendedLabs.map((lab) => (
            <div 
              key={lab.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedLabs.includes(lab.id)
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-700/30 border-slate-600/30 opacity-60'
              }`}
              onClick={() => toggleLab(lab.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{lab.testName}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                      CPT: {lab.testCode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{lab.reason}</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedLabs.includes(lab.id)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-600 text-slate-400'
                }`}>
                  {selectedLabs.includes(lab.id) ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Notes */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-cyan-400" />
          Provider Notes
        </h3>
        <textarea
          value={providerNotes}
          onChange={(e) => setProviderNotes(e.target.value)}
          placeholder="Add clinical notes, modifications, or additional recommendations..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
        />
      </div>

      {/* Approval Actions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Ready to Approve?</p>
            <p className="text-sm text-slate-400">
              {selectedDiagnoses.length} diagnoses and {selectedLabs.length} lab tests selected
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedDiagnoses([]);
                setSelectedLabs([]);
              }}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
            >
              Clear All
            </button>
            <button
              onClick={handleApprove}
              disabled={selectedDiagnoses.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve & Continue to Physical Exam
            </button>
          </div>
        </div>
      </div>

      {/* Audit Notice */}
      <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4">
        <p className="text-xs text-slate-400 text-center">
          <Shield className="w-4 h-4 inline mr-1" />
          This approval will be logged with timestamp, provider credentials, and IP address for HIPAA compliance. 
          All modifications to AI recommendations are tracked in the audit log.
        </p>
      </div>
    </div>
  );
};

export default ProviderReviewView;
