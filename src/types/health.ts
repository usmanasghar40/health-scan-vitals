export interface VitalSign {
  name: string;
  value: number | string;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'optimal';
  normalRange: string;
  description: string;
}

export interface LabResult {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'critical' | 'optimal';
  normalRange: string;
  category: string;
  description: string;
}

export interface ScanResult {
  area: string;
  plaqueDetected: boolean;
  plaqueLevel: 'none' | 'minimal' | 'moderate' | 'significant';
  arterialHealth: number;
  bloodFlow: 'normal' | 'reduced' | 'restricted';
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface HealthSummary {
  overallScore: number;
  cardiovascularRisk: 'low' | 'moderate' | 'high';
  metabolicHealth: 'optimal' | 'good' | 'fair' | 'poor';
  inflammationLevel: 'low' | 'moderate' | 'elevated';
  recommendations: string[];
}

// EHR Import Types
export interface EHRSource {
  id: string;
  name: string;
  type: 'ehr' | 'lab' | 'pharmacy' | 'imaging';
  logo?: string;
  connected: boolean;
  lastSync?: Date;
}

export interface ImportedLabResult extends LabResult {
  id: string;
  source: string;
  importDate: Date;
  collectionDate: Date;
  orderingProvider?: string;
  labFacility?: string;
  urgency: 'routine' | 'urgent' | 'critical';
  interpretation?: LabInterpretation;
}

export interface LabInterpretation {
  summary: string;
  urgencyLevel: 'normal' | 'monitor' | 'urgent' | 'critical';
  recommendations: string[];
  followUpRequired: boolean;
  followUpTimeframe?: string;
  relatedConditions?: string[];
  lifestyleRecommendations?: string[];
  providerNotes?: string;
}

export interface ImportSession {
  id: string;
  source: string;
  importDate: Date;
  totalTests: number;
  normalResults: number;
  abnormalResults: number;
  criticalResults: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: ImportedLabResult[];
}

// HIPAA Compliance Types
export interface HIPAAConsent {
  id: string;
  consentType: 'data_collection' | 'data_sharing' | 'research' | 'marketing';
  granted: boolean;
  grantedDate?: Date;
  expirationDate?: Date;
  description: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'view' | 'export' | 'import' | 'share' | 'delete' | 'update';
  resource: string;
  userId: string;
  ipAddress?: string;
  details?: string;
}

export interface PrivacySettings {
  dataRetentionDays: number;
  autoDeleteEnabled: boolean;
  encryptionEnabled: boolean;
  twoFactorEnabled: boolean;
  shareWithProviders: boolean;
  anonymousAnalytics: boolean;
}

export interface DataExportRequest {
  id: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'ready' | 'expired';
  format: 'pdf' | 'json' | 'fhir' | 'csv';
  downloadUrl?: string;
  expirationDate?: Date;
}



// Review of Systems Types
export interface ROSQuestion {
  id: string;
  system: string;
  question: string;
  type: 'boolean' | 'scale' | 'multiple' | 'text' | 'frequency' | 'multiselect' | 'duration';
  options?: string[];
  scaleLabels?: { low: string; high: string };
  frequencyOptions?: string[];
  conditionalOn?: string; // Show only if this question ID is answered positively
  helpText?: string;
  category?: string; // Sub-category within the section
  required?: boolean;
  validatedInstrument?: string; // Reference to validated psychometric instrument
}

export interface ROSAnswer {
  questionId: string;
  answer: boolean | number | string | string[];
  notes?: string;
  severity?: number;
  duration?: string;
}

export interface ROSSection {
  id: string;
  name: string;
  icon: string;
  description?: string;
  instructions?: string;
  questions: ROSQuestion[];
  subSections?: { id: string; name: string; description?: string }[];
}


export interface ReviewOfSystems {
  id: string;
  patientId: string;
  completedAt: Date;
  answers: ROSAnswer[];
  status: 'in_progress' | 'completed' | 'provider_reviewed';
  providerReviewedAt?: Date;
  providerReviewedBy?: string;
}

// Clinical Diagnosis Types
export interface DifferentialDiagnosis {
  id: string;
  condition: string;
  icdCode: string;
  probability: 'high' | 'moderate' | 'low';
  supportingSymptoms: string[];
  rulingOutFactors: string[];
  recommendedTests: string[];
  urgency: 'routine' | 'urgent' | 'emergent';
}

export interface LabRecommendation {
  id: string;
  testName: string;
  testCode: string;
  reason: string;
  priority: 'routine' | 'urgent' | 'stat';
  relatedDiagnoses: string[];
  estimatedCost?: number;
  fastingRequired?: boolean;
}

export interface ClinicalAssessment {
  id: string;
  patientId: string;
  rosId: string;
  vitalsId?: string;
  createdAt: Date;
  differentialDiagnoses: DifferentialDiagnosis[];
  recommendedLabs: LabRecommendation[];
  aiSummary: string;
  status: 'pending_provider_review' | 'provider_approved' | 'provider_modified' | 'rejected';
  providerNotes?: string;
}

// Physical Examination Types
export interface PhysicalExamFinding {
  system: string;
  finding: string;
  status: 'normal' | 'abnormal' | 'not_examined';
  notes?: string;
}

export interface PhysicalExamination {
  id: string;
  patientId: string;
  assessmentId: string;
  providerId: string;
  providerName: string;
  providerCredentials: string;
  examinedAt: Date;
  generalAppearance: string;
  findings: PhysicalExamFinding[];
  additionalNotes?: string;
  status: 'in_progress' | 'completed';
}

// Treatment Plan Types
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  instructions: string;
  warnings?: string[];
  interactions?: string[];
}

export interface LifestyleRecommendation {
  id: string;
  category: 'diet' | 'exercise' | 'sleep' | 'stress' | 'habits' | 'other';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  details: string;
  resources?: string[];
}

export interface OrthomolecularRecommendation {
  id: string;
  supplement: string;
  dosage: string;
  frequency: string;
  reason: string;
  contraindications?: string[];
  interactions?: string[];
  evidenceLevel: 'strong' | 'moderate' | 'emerging';
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  assessmentId: string;
  physicalExamId: string;
  providerId: string;
  providerName: string;
  createdAt: Date;
  medications: Medication[];
  lifestyleRecommendations: LifestyleRecommendation[];
  orthomolecularRecommendations: OrthomolecularRecommendation[];
  followUpInstructions: string;
  followUpDate?: Date;
  status: 'draft' | 'finalized' | 'patient_acknowledged';
  patientAcknowledgedAt?: Date;
}

// Clinical Workflow State
export interface ClinicalWorkflowState {
  currentStep: 'vitals' | 'ros' | 'diagnosis' | 'provider_review' | 'physical_exam' | 'treatment_plan' | 'complete';
  vitalsCompleted: boolean;
  rosCompleted: boolean;
  diagnosisGenerated: boolean;
  providerReviewed: boolean;
  physicalExamCompleted: boolean;
  treatmentPlanFinalized: boolean;
  ros?: ReviewOfSystems;
  assessment?: ClinicalAssessment;
  physicalExam?: PhysicalExamination;
  treatmentPlan?: TreatmentPlan;
}
