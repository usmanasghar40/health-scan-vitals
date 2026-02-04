import React, { useEffect, useState } from 'react';
import { 
  Activity, ClipboardList, Stethoscope, UserCheck, FileText, CheckCircle2,
  ChevronRight, AlertTriangle, Shield, Lock
} from 'lucide-react';
import ReviewOfSystemsView from './ReviewOfSystemsView';
import DiagnosisPanel from './DiagnosisPanel';
import ProviderReviewView from './ProviderReviewView';
import PhysicalExamView from './PhysicalExamView';
import TreatmentPlanView from './TreatmentPlanView';
import { ClinicalWorkflowState, ROSAnswer, ClinicalAssessment, PhysicalExamination, TreatmentPlan } from '@/types/health';
import { vitalSigns } from '@/data/healthData';
import { reviewOfSystemsSections } from '@/data/rosData';
import { useUser, ProviderWithUser } from '@/contexts/UserContext';
import { apiGet, apiPost } from '@/lib/api';

interface ClinicalWorkflowViewProps {
  initialVitalsCompleted?: boolean;
}

const ClinicalWorkflowView: React.FC<ClinicalWorkflowViewProps> = ({ initialVitalsCompleted = false }) => {
  const { userRole, getProviders, currentUser } = useUser();
  const isProvider = userRole === 'provider';
  const isPatient = !isProvider;
  const initialStep: ClinicalWorkflowState['currentStep'] = isProvider
    ? 'provider_review'
    : (initialVitalsCompleted ? 'ros' : 'vitals');

  const [workflowState, setWorkflowState] = useState<ClinicalWorkflowState>({
    currentStep: initialStep,
    vitalsCompleted: initialVitalsCompleted,
    rosCompleted: false,
    diagnosisGenerated: false,
    providerReviewed: false,
    physicalExamCompleted: false,
    treatmentPlanFinalized: false,
  });

  const [rosAnswers, setRosAnswers] = useState<ROSAnswer[]>([]);
  const [vitals, setVitals] = useState(vitalSigns.map(vital => ({ ...vital })));
  const [assessment, setAssessment] = useState<ClinicalAssessment | null>(null);
  const [physicalExam, setPhysicalExam] = useState<PhysicalExamination | null>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [hasPatientAssessment, setHasPatientAssessment] = useState(false);
  const [providers, setProviders] = useState<ProviderWithUser[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [rosUpdateRequested, setRosUpdateRequested] = useState(false);
  const [rosRecordUpdatedAt, setRosRecordUpdatedAt] = useState<string | null>(null);
  const [showRosGate, setShowRosGate] = useState(false);
  const [patientAssessments, setPatientAssessments] = useState<any[]>([]);
  const [patientPlans, setPatientPlans] = useState<any[]>([]);
  const [patientDataLoading, setPatientDataLoading] = useState(false);
  const [selectedAssessmentMeta, setSelectedAssessmentMeta] = useState<{
    clinicalAssessmentId: string | null;
    patientId: string | null;
    providerId: string | null;
  }>({ clinicalAssessmentId: null, patientId: null, providerId: null });
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [selectedPlanRos, setSelectedPlanRos] = useState<ROSAnswer[]>([]);
  const handleVitalChange = (index: number, value: string) => {
    setVitals(prev => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  };

  const selectedProvider = providers.find(provider => provider.user_id === selectedProviderId);


  const steps = isProvider
    ? [
        { id: 'provider_review', label: 'Provider Review', icon: UserCheck, description: 'Healthcare provider confirmation' },
        { id: 'physical_exam', label: 'Physical Exam', icon: Stethoscope, description: 'Provider physical examination' },
        { id: 'treatment_plan', label: 'Treatment Plan', icon: FileText, description: 'Final recommendations' },
      ]
    : [
        { id: 'vitals', label: 'Vitals', icon: Activity, description: 'Complete vital signs scan' },
        { id: 'ros', label: 'Review of Systems', icon: ClipboardList, description: 'Answer health questionnaire' },
        { id: 'diagnosis', label: 'AI Diagnosis', icon: Stethoscope, description: 'AI-generated differential diagnosis' },
      ];

  const parseMaybeJson = (value: any) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (err) {
        return null;
      }
    }
    return value;
  };

  const buildFullRosAnswers = (answers: ROSAnswer[]) => {
    const answerMap = new Map(answers.map(answer => [answer.questionId, answer]));
    const fullList: ROSAnswer[] = [];
    reviewOfSystemsSections.forEach(section => {
      section.questions.forEach(question => {
        const existing = answerMap.get(question.id);
        fullList.push({
          questionId: question.id,
          answer: (existing?.answer ?? null) as any,
          notes: existing?.notes,
          severity: existing?.severity,
          duration: existing?.duration,
        });
      });
    });
    return fullList;
  };

  const applyAssessmentSelection = (item: any) => {
    const ros = parseMaybeJson(item.ros_answers) || [];
    const assessmentData = parseMaybeJson(item.assessment);
    if (!assessmentData || !Array.isArray(ros)) {
      setHasPatientAssessment(false);
      return;
    }
    setRosAnswers(buildFullRosAnswers(ros));
    setAssessment(assessmentData);
    setSelectedAssessmentMeta({
      clinicalAssessmentId: item.id || null,
      patientId: item.patient_id || null,
      providerId: item.provider_id || null,
    });
    setHasPatientAssessment(true);
    setWorkflowState(prev => ({
      ...prev,
      vitalsCompleted: true,
      rosCompleted: true,
      diagnosisGenerated: true,
      currentStep: 'provider_review',
    }));
  };

  const normalizePlanRow = (row: any): TreatmentPlan => {
    const parsed = parseMaybeJson(row.plan) || {};
    const providerName = parsed.providerName
      || [row.provider_first_name, row.provider_last_name].filter(Boolean).join(' ')
      || 'Provider';
    return {
      ...parsed,
      id: row.id || parsed.id,
      providerName,
      status: row.status || parsed.status,
      createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(row.created_at || Date.now()),
      patientAcknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : (parsed.patientAcknowledgedAt ? new Date(parsed.patientAcknowledgedAt) : undefined),
    };
  };

  useEffect(() => {
    if (!isProvider || !currentUser?.id) return;
    const loadAssessments = async () => {
      setAssessmentsLoading(true);
      try {
        const data = await apiGet(`/clinical-assessments?providerId=${currentUser.id}`);
        const list = Array.isArray(data) ? data : [];
        setAssessments(list);
        if (list.length > 0) {
          const initial = list[0];
          setSelectedAssessmentId(initial.id);
          applyAssessmentSelection(initial);
        } else {
          setHasPatientAssessment(false);
        }
      } catch (err) {
        console.error('Failed to load clinical assessments:', err);
        setAssessments([]);
        setHasPatientAssessment(false);
      } finally {
        setAssessmentsLoading(false);
      }
    };
    loadAssessments();
  }, [currentUser?.id, isProvider]);

  useEffect(() => {
    if (!isPatient) return;
    const savedProvider = localStorage.getItem('clinical_selected_provider');
    if (savedProvider) {
      setSelectedProviderId(savedProvider);
    }
    if (!currentUser?.id) return;
    const loadProviders = async () => {
      setProvidersLoading(true);
      try {
        const data = await getProviders();
        setProviders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load providers:', err);
        setProviders([]);
      } finally {
        setProvidersLoading(false);
      }
    };
    loadProviders();
  }, [currentUser?.id, getProviders, isPatient]);

  useEffect(() => {
    if (!isPatient || !currentUser?.id || rosUpdateRequested) return;
    apiGet(`/patient-ros?patientId=${currentUser.id}`)
      .then((data) => {
        if (!data?.ros_answers) return;
        const parsed = parseMaybeJson(data.ros_answers) || [];
        const full = buildFullRosAnswers(parsed);
        setRosAnswers(full);
        setRosRecordUpdatedAt(data.updated_at || null);
      })
      .catch((err) => {
        console.error('Failed to load saved ROS:', err);
      });
  }, [currentUser?.id, isPatient, rosUpdateRequested]);

  useEffect(() => {
    if (!isPatient || !currentUser?.id) return;
    setPatientDataLoading(true);
    Promise.all([
      apiGet(`/clinical-assessments?patientId=${currentUser.id}`),
      apiGet(`/treatment-plans?patientId=${currentUser.id}`)
    ])
      .then(([assessmentsData, plansData]) => {
        setPatientAssessments(Array.isArray(assessmentsData) ? assessmentsData : []);
        setPatientPlans(Array.isArray(plansData) ? plansData : []);
      })
      .catch((err) => {
        console.error('Failed to load patient clinical data:', err);
        setPatientAssessments([]);
        setPatientPlans([]);
      })
      .finally(() => {
        setPatientDataLoading(false);
      });
  }, [currentUser?.id, isPatient, pendingSubmission]);

  const getStepStatus = (stepId: string) => {
    const stepOrder = isProvider
      ? ['provider_review', 'physical_exam', 'treatment_plan']
      : ['vitals', 'ros', 'diagnosis'];
    if (workflowState.currentStep === 'complete') return 'completed';
    const currentIndex = stepOrder.indexOf(workflowState.currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const handleVitalsComplete = () => {
    if (isPatient && rosAnswers.length > 0 && !rosUpdateRequested) {
      setShowRosGate(true);
      return;
    }
    setWorkflowState(prev => ({
      ...prev,
      vitalsCompleted: true,
      currentStep: rosAnswers.length > 0 && !rosUpdateRequested ? 'diagnosis' : 'ros'
    }));
  };

  const handleROSComplete = (answers: ROSAnswer[]) => {
    const full = buildFullRosAnswers(answers);
    setRosAnswers(full);
    setWorkflowState(prev => ({
      ...prev,
      rosCompleted: true,
      currentStep: 'diagnosis'
    }));
    if (isPatient && currentUser?.id) {
      apiPost('/patient-ros', {
        patientId: currentUser.id,
        rosAnswers: full,
      })
        .then((data) => {
          setRosRecordUpdatedAt(data?.updated_at || null);
          setRosUpdateRequested(false);
        })
        .catch((err: any) => {
          console.error('Failed to save ROS:', err);
        });
    }
  };

  const handleDiagnosisGenerated = (newAssessment: ClinicalAssessment) => {
    setAssessment(newAssessment);
    const updatedState = {
      diagnosisGenerated: true,
      assessment: newAssessment,
      rosCompleted: true,
      vitalsCompleted: true,
    };
    if (isPatient) {
      setPendingSubmission(true);
      setWorkflowState(prev => ({
        ...prev,
        ...updatedState,
        currentStep: 'diagnosis',
      }));
      return;
    }
    setWorkflowState(prev => ({
      ...prev,
      ...updatedState,
      currentStep: 'provider_review'
    }));
  };

  const handleSubmitAssessment = () => {
    if (!selectedProviderId) {
      setProviderError('Please select a doctor before submitting your assessment.');
      return;
    }
    if (!currentUser?.id) {
      setProviderError('Please sign in before submitting your assessment.');
      return;
    }
    apiPost('/clinical-assessments', {
      patientId: currentUser.id,
      providerId: selectedProviderId,
      rosAnswers: buildFullRosAnswers(rosAnswers),
      assessment,
      vitals,
    })
      .then(() => {
        localStorage.setItem('clinical_selected_provider', selectedProviderId);
        setProviderError(null);
        setPendingSubmission(false);
        setWorkflowState(prev => ({
          ...prev,
          currentStep: 'complete',
        }));
      })
      .catch((err: any) => {
        setProviderError(err?.message || 'Failed to submit assessment.');
      });
  };

  const handleProviderApproval = (approvedAssessment: ClinicalAssessment) => {
    setAssessment(approvedAssessment);
    setWorkflowState(prev => ({
      ...prev,
      providerReviewed: true,
      assessment: approvedAssessment,
      currentStep: 'physical_exam'
    }));
  };

  const handlePhysicalExamComplete = (exam: PhysicalExamination) => {
    setPhysicalExam(exam);
    setWorkflowState(prev => ({
      ...prev,
      physicalExamCompleted: true,
      physicalExam: exam,
      currentStep: 'treatment_plan'
    }));
  };

  const handleTreatmentPlanFinalized = (plan: TreatmentPlan) => {
    setTreatmentPlan(plan);
    setWorkflowState(prev => ({
      ...prev,
      treatmentPlanFinalized: true,
      treatmentPlan: plan,
      currentStep: 'complete'
    }));
  };

  const renderCurrentStep = () => {
    switch (workflowState.currentStep) {
      case 'vitals':
        return (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Complete Vital Signs</h3>
            <p className="text-slate-400 mb-6">
              Please complete a vital signs scan before proceeding with the Review of Systems questionnaire.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {vitals.slice(0, 6).map((vital, index) => (
                <div key={index} className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-2">{vital.name}</p>
                  <div className="flex items-center gap-2">
                    <input
                      value={String(vital.value ?? '')}
                      onChange={(event) => handleVitalChange(index, event.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-white text-base font-semibold focus:outline-none focus:border-cyan-500"
                      placeholder="Enter value"
                    />
                    <span className="text-sm text-slate-400 whitespace-nowrap">{vital.unit}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Normal: {vital.normalRange}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleVitalsComplete}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              Confirm Vitals & Continue
            </button>
            {showRosGate && (
              <div className="mt-6 rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-200 mb-4">
                  You already have a saved Review of Systems. Would you like to update it or continue to AI Diagnosis?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setRosUpdateRequested(true);
                      setShowRosGate(false);
                      setWorkflowState(prev => ({ ...prev, currentStep: 'ros' }));
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all"
                  >
                    Update Review of Systems
                  </button>
                  <button
                    onClick={() => {
                      setShowRosGate(false);
                      setWorkflowState(prev => ({
                        ...prev,
                        vitalsCompleted: true,
                        currentStep: 'diagnosis',
                      }));
                    }}
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all"
                  >
                    Continue to AI Diagnosis
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'ros':
        return (
          <ReviewOfSystemsView
            onComplete={handleROSComplete}
            initialAnswers={rosAnswers.length > 0 ? rosAnswers : undefined}
          />
        );

      case 'diagnosis':
        return (
          <div className="space-y-6">
            <DiagnosisPanel 
              rosAnswers={rosAnswers} 
              vitals={vitals}
              onDiagnosisGenerated={handleDiagnosisGenerated}
            />

            {isPatient && pendingSubmission && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Submit to a Provider</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Choose the doctor who should receive this AI diagnosis for review.
                </p>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="min-w-[240px]">
                    <select
                      value={selectedProviderId}
                      onChange={(event) => {
                        setSelectedProviderId(event.target.value);
                        setProviderError(null);
                        localStorage.setItem('clinical_selected_provider', event.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">
                        {providersLoading ? 'Loading providers...' : 'Select a provider'}
                      </option>
                      {providers.map((provider) => (
                        <option key={provider.user_id} value={provider.user_id}>
                          {provider.user.first_name} {provider.user.last_name} • {provider.specialty || 'General'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleSubmitAssessment}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
                  >
                    Submit to Provider
                  </button>
                </div>
                {selectedProvider && (
                  <div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
                    Submitting to <span className="text-cyan-300">Dr. {selectedProvider.user.first_name} {selectedProvider.user.last_name}</span>
                    {selectedProvider.specialty ? ` (${selectedProvider.specialty})` : ''}.
                  </div>
                )}
                {rosRecordUpdatedAt && (
                  <div className="mt-3 text-xs text-slate-400">
                    ROS last updated: {new Date(rosRecordUpdatedAt).toLocaleString()}
                  </div>
                )}
                {providerError && (
                  <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
                    {providerError}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'provider_review':
        if (!assessment || !rosAnswers.length) {
          return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/40 flex items-center justify-center">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Awaiting Patient Assessment</h3>
              <p className="text-slate-400">
                Ask the patient to complete Vitals, Review of Systems, and AI Diagnosis.
                Their results will appear here for provider review.
              </p>
            </div>
          );
        }
        return (
          <ProviderReviewView 
            assessment={assessment!}
            rosAnswers={rosAnswers}
            onApprove={handleProviderApproval}
            isProvider={true}
            onProviderLogin={() => {}}
          />
        );

      case 'physical_exam':
        return (
          <PhysicalExamView 
            assessment={assessment!}
            rosAnswers={rosAnswers}
            onComplete={handlePhysicalExamComplete}
          />
        );

      case 'treatment_plan':
        if (!assessment || !physicalExam) {
          return null;
        }
        return (
          <TreatmentPlanView 
            assessment={assessment!}
            physicalExam={physicalExam!}
            rosAnswers={rosAnswers}
            planContext={{
              clinicalAssessmentId: selectedAssessmentMeta.clinicalAssessmentId,
              patientId: selectedAssessmentMeta.patientId,
              providerId: selectedAssessmentMeta.providerId,
            }}
            onFinalize={handleTreatmentPlanFinalized}
          />
        );

      case 'complete':
        return (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {isProvider ? 'Clinical Workflow Complete' : 'Assessment Submitted'}
            </h3>
            <p className="text-slate-400 mb-6">
              {isProvider
                ? 'Your treatment plan has been finalized and approved by your healthcare provider.'
                : 'Your AI diagnosis has been sent to the provider for review and next steps.'}
            </p>
            {isProvider ? (
              <>
                <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-300">
                    <strong>Next Steps:</strong> Follow the treatment plan recommendations. 
                    Contact your healthcare provider if you have questions or experience any warning signs.
                  </p>
                </div>
                <button
                  onClick={() => setWorkflowState(prev => ({ ...prev, currentStep: 'treatment_plan' }))}
                  className="px-6 py-3 bg-cyan-500/20 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/30 transition-all"
                >
                  View Treatment Plan
                </button>
              </>
            ) : (
              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-sm text-slate-300">
                  <strong>Next Steps:</strong> Wait for provider review. You will see updates in your
                  notifications and messages.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Clinical Assessment Workflow</h2>
          <p className="text-slate-400 mt-1">
            Complete each step for a comprehensive health evaluation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-medium">Provider Verified</span>
          </div>
        </div>
      </div>

      {/* Provider Mode Status */}
      {isProvider && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium">Provider Review Queue</p>
                <p className="text-sm text-slate-400">
                  {hasPatientAssessment
                    ? 'Patient assessment loaded. Continue with provider review.'
                    : 'Waiting for a patient assessment to be submitted.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Provider Mode</span>
            </div>
          </div>
        </div>
      )}

      {isProvider && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Patient Assessments</h3>
            <span className="text-xs text-slate-400">
              {assessmentsLoading ? 'Loading...' : `${assessments.length} submissions`}
            </span>
          </div>
          {assessments.length === 0 && !assessmentsLoading ? (
            <p className="text-sm text-slate-400">No assessments submitted yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {assessments.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedAssessmentId(item.id);
                    applyAssessmentSelection(item);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedAssessmentId === item.id
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-white'
                      : 'border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-slate-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {item.patient_first_name || 'Patient'} {item.patient_last_name || ''}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'Submission'}
                      </p>
                    </div>
                    <span className="text-xs uppercase text-slate-400">
                      {item.status || 'submitted'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isPatient && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Clinical Assessments</h3>
            <span className="text-xs text-slate-400">
              {patientDataLoading ? 'Loading...' : `${patientAssessments.length} submissions`}
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-300 mb-2">Pending provider review</p>
              {patientAssessments.filter(item => (item.status || 'submitted') === 'submitted').length === 0 ? (
                <p className="text-xs text-slate-500">No pending reviews.</p>
              ) : (
                <div className="space-y-2">
                  {patientAssessments
                    .filter(item => (item.status || 'submitted') === 'submitted')
                    .map(item => (
                      <div key={item.id} className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>
                            Pending review by Dr. {item.provider_first_name || ''} {item.provider_last_name || ''}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Submitted'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-2">Approved treatment plans</p>
              {patientPlans.length === 0 ? (
                <p className="text-xs text-slate-500">No finalized plans yet.</p>
              ) : (
                <div className="space-y-2">
                  {patientPlans.map(plan => (
                    <div key={plan.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
                      <div className="flex items-center justify-between">
                        <span>
                          Plan from Dr. {plan.provider_first_name || ''} {plan.provider_last_name || ''}
                        </span>
                        <span className="text-xs text-emerald-200">
                          {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : 'Finalized'}
                        </span>
                      </div>
                      <div className="text-xs text-emerald-200 mt-1">
                        Status: {plan.status || 'finalized'}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const normalized = normalizePlanRow(plan);
                            setSelectedPlan(normalized);
                            const assessment = patientAssessments.find(item => item.id === plan.clinical_assessment_id);
                            const ros = assessment ? buildFullRosAnswers(parseMaybeJson(assessment.ros_answers) || []) : [];
                            setSelectedPlanRos(ros);
                          }}
                          className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 transition-all"
                        >
                          View Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedPlan && (
              <div className="mt-6">
                <TreatmentPlanView
                  initialPlan={selectedPlan}
                  rosAnswers={selectedPlanRos}
                  onFinalize={(plan) => setSelectedPlan(plan)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex flex-wrap gap-2 md:gap-0 md:flex-nowrap items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const status = getStepStatus(step.id);
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    status === 'current' ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/50' :
                    'bg-slate-700/50 text-slate-500'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${
                      status === 'completed' ? 'text-emerald-400' :
                      status === 'current' ? 'text-cyan-400' :
                      'text-slate-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className={`hidden md:block w-5 h-5 ${
                    getStepStatus(steps[index + 1].id) !== 'pending' ? 'text-emerald-400' : 'text-slate-600'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Warning Banner */}
      {workflowState.currentStep !== 'complete' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium">Clinical Decision Support Notice</p>
              <p className="text-sm text-amber-400/80 mt-1">
                This system provides clinical decision support only. All diagnoses, laboratory recommendations, 
                and treatment plans must be reviewed and approved by a licensed healthcare provider before 
                any action is taken. Do not rely solely on AI-generated recommendations for medical decisions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>
  );
};

export default ClinicalWorkflowView;
