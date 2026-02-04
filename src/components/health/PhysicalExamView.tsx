import React, { useMemo, useState } from 'react';
import { 
  Stethoscope, CheckCircle2, AlertCircle, Edit3, Save,
  User, Eye, Heart, Wind, Activity, Hand, Brain
} from 'lucide-react';
import { ClinicalAssessment, PhysicalExamination, ROSAnswer } from '@/types/health';
import { physicalExamSystems, reviewOfSystemsSections } from '@/data/rosData';

interface PhysicalExamViewProps {
  assessment: ClinicalAssessment;
  rosAnswers?: ROSAnswer[];
  onComplete: (exam: PhysicalExamination) => void;
}

const mapRosSystemToExam = (system: string) => {
  switch (system) {
    case 'constitutional':
    case 'hematologic':
    case 'endocrine':
    case 'immunologic':
    case 'allergic':
    case 'sleep':
    case 'lifestyle':
    case 'environmental':
      return 'general';
    case 'heent':
      return 'heent';
    case 'cardiovascular':
      return 'cardiovascular';
    case 'respiratory':
      return 'respiratory';
    case 'gastrointestinal':
    case 'genitourinary':
      return 'abdomen';
    case 'musculoskeletal':
      return 'musculoskeletal';
    case 'skin':
      return 'skin';
    case 'neurological':
      return 'neurological';
    case 'psychiatric':
      return 'psychiatric';
    default:
      return 'general';
  }
};

const isPositiveAnswer = (answer: ROSAnswer['answer']) => {
  if (answer === true) return true;
  if (typeof answer === 'number') return answer >= 7;
  if (Array.isArray(answer)) {
    return answer.length > 0 && !answer.includes('None') && !answer.includes('None of these');
  }
  if (typeof answer === 'string') return answer.trim().length > 0;
  return false;
};

const buildInitialFindings = (rosAnswers?: ROSAnswer[]) => {
  if (!rosAnswers || rosAnswers.length === 0) {
    return physicalExamSystems.reduce((acc, system) => ({
      ...acc,
      [system.id]: {
        system: system.name,
        finding: system.defaultFinding,
        status: 'normal' as const,
        notes: ''
      }
    }), {});
  }

  const questionMap = new Map<string, { system: string; question: string }>();
  reviewOfSystemsSections.forEach(section => {
    section.questions.forEach(question => {
      questionMap.set(question.id, { system: question.system, question: question.question });
    });
  });

  const positivesBySystem: Record<string, string[]> = {};
  rosAnswers.forEach(answer => {
    const info = questionMap.get(answer.questionId);
    if (!info || !isPositiveAnswer(answer.answer)) return;
    const examSystem = mapRosSystemToExam(info.system);
    positivesBySystem[examSystem] = positivesBySystem[examSystem] || [];
    positivesBySystem[examSystem].push(info.question);
  });

  return physicalExamSystems.reduce((acc, system) => {
    const positives = positivesBySystem[system.id] || [];
    const summary = positives.length > 0
      ? `Patient reports: ${positives.slice(0, 3).join('; ')}${positives.length > 3 ? ` (+${positives.length - 3} more)` : ''}`
      : system.defaultFinding;
    return {
      ...acc,
      [system.id]: {
        system: system.name,
        finding: summary,
        status: positives.length > 0 ? 'abnormal' as const : 'normal' as const,
        notes: ''
      }
    };
  }, {});
};

const PhysicalExamView: React.FC<PhysicalExamViewProps> = ({ assessment, rosAnswers, onComplete }) => {
  const [generalAppearance, setGeneralAppearance] = useState('Well-appearing adult in no acute distress');
  const derivedFindings = useMemo(() => buildInitialFindings(rosAnswers), [rosAnswers]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'abnormal': return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
      case 'not_examined': return 'bg-slate-600/20 border-slate-500/30 text-slate-400';
      default: return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
    }
  };

  const getSystemIcon = (systemId: string) => {
    const icons: { [key: string]: React.FC<{ className?: string }> } = {
      general: User,
      heent: Eye,
      neck: User,
      cardiovascular: Heart,
      respiratory: Wind,
      abdomen: Activity,
      extremities: Hand,
      skin: Hand,
      neurological: Brain,
      psychiatric: Brain,
      musculoskeletal: Activity
    };
    return icons[systemId] || User;
  };

  const handleComplete = () => {
    const exam: PhysicalExamination = {
      id: `exam-${Date.now()}`,
      patientId: 'patient-001',
      assessmentId: assessment.id,
      providerId: 'provider-001',
      providerName: 'Dr. Provider',
      providerCredentials: 'MD',
      examinedAt: new Date(),
      generalAppearance,
      findings: Object.values(derivedFindings),
      additionalNotes,
      status: 'completed'
    };
    onComplete(exam);
  };


  const abnormalCount = Object.values(derivedFindings).filter(f => f.status === 'abnormal').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">Physical Examination</h3>
            <p className="text-slate-400">
              Review patient-reported systems and document physical examination notes.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Approved Diagnoses</p>
            <p className="text-lg font-semibold text-white">{assessment.differentialDiagnoses.length}</p>
          </div>
        </div>
      </div>

      {/* General Appearance */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          General Appearance
        </h4>
        <textarea
          value={generalAppearance}
          onChange={(e) => setGeneralAppearance(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
          placeholder="Describe the patient's general appearance..."
        />
      </div>

      {/* System Examination (Patient Submission) */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-white">System Examination (Patient Submission)</h4>
            <p className="text-sm text-slate-400">
              Generated from the patient’s Review of Systems answers.
            </p>
          </div>
          {abnormalCount > 0 && (
            <span className="text-sm text-amber-400 bg-amber-500/20 px-3 py-1 rounded-lg">
              {abnormalCount} Abnormal Finding{abnormalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {physicalExamSystems.map((system) => {
            const finding = derivedFindings[system.id];
            const Icon = getSystemIcon(system.id);
            return (
              <div
                key={system.id}
                className={`rounded-xl border transition-all ${getStatusColor(finding.status)}`}
              >
                <div className="w-full p-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-white">{system.name}</h5>
                      <p className="text-sm opacity-80">{finding.finding}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    finding.status === 'abnormal' ? 'bg-amber-500/30' :
                    finding.status === 'not_examined' ? 'bg-slate-500/30' :
                    'bg-emerald-500/30'
                  }`}>
                    {finding.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-cyan-400" />
          Additional Clinical Notes
        </h4>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
          placeholder="Document any additional findings, clinical impressions, or notes..."
        />
      </div>

      {/* Summary */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Examination Summary</h4>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">
              {Object.values(derivedFindings).filter(f => f.status === 'normal').length}
            </p>
            <p className="text-sm text-slate-400">Normal</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">
              {Object.values(derivedFindings).filter(f => f.status === 'abnormal').length}
            </p>
            <p className="text-sm text-slate-400">Abnormal</p>
          </div>
          <div className="bg-slate-600/20 border border-slate-500/30 rounded-xl p-4 text-center">
            <Edit3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-400">
              {Object.values(derivedFindings).filter(f => f.status === 'not_examined').length}
            </p>
            <p className="text-sm text-slate-400">Not Examined</p>
          </div>
        </div>

        <button
          onClick={handleComplete}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Complete Physical Exam & Generate Treatment Plan
        </button>
      </div>
    </div>
  );
};

export default PhysicalExamView;
