import React, { useState } from 'react';
import { 
  Download, FileText, Calendar, Video, Stethoscope, 
  ClipboardList, FlaskConical, Pill, Activity, Heart,
  Shield, Check, ChevronDown, ChevronRight, Printer,
  Share2, Usb, FolderArchive, FileJson, File,
  Clock, User, MapPin, AlertCircle, Info
} from 'lucide-react';

import { useUser } from '@/contexts/UserContext';

interface VisitRecord {
  id: string;
  date: string;
  provider: {
    name: string;
    specialty: string;
    facility: string;
  };
  type: 'telehealth' | 'in-person';
  chiefComplaint: string;
  diagnosis: string[];
  treatmentPlan: string[];
  prescriptions: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  labsOrdered: string[];
  followUp: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
    bmi: number;
  };
  questionnaires: {
    name: string;
    score: number;
    interpretation: string;
  }[];
  notes: string;
  status: 'completed' | 'pending-labs' | 'follow-up-scheduled';
}

const visitRecords: VisitRecord[] = [
  {
    id: 'visit-001',
    date: '2025-12-20',
    provider: {
      name: 'Dr. Emily Chen',
      specialty: 'Internal Medicine',
      facility: 'PEHD Telehealth'
    },
    type: 'telehealth',
    chiefComplaint: 'Annual wellness exam, fatigue, mild headaches',
    diagnosis: ['Essential Hypertension (I10)', 'Type 2 Diabetes Mellitus (E11.9)', 'Vitamin D Deficiency (E55.9)'],
    treatmentPlan: [
      'Continue current antihypertensive regimen',
      'Increase Metformin to 1000mg twice daily',
      'Start Vitamin D3 2000 IU daily',
      'Lifestyle modifications: increase physical activity, reduce sodium intake'
    ],
    prescriptions: [
      { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', duration: '90 days' },
      { name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily', duration: '90 days' }
    ],
    labsOrdered: ['Comprehensive Metabolic Panel', 'HbA1c', 'Lipid Panel', 'Vitamin D Level'],
    followUp: '3 months',
    vitals: {
      bloodPressure: '138/88',
      heartRate: 78,
      temperature: 98.6,
      weight: 185,
      height: 68,
      bmi: 28.1
    },
    questionnaires: [
      { name: 'PHQ-2 (Depression)', score: 1, interpretation: 'Minimal symptoms' },
      { name: 'GAD-2 (Anxiety)', score: 2, interpretation: 'Mild symptoms' },
      { name: 'PSS (Stress)', score: 14, interpretation: 'Moderate stress' }
    ],
    notes: 'Patient reports improved energy with current medication regimen. Blood pressure slightly elevated today. Discussed importance of medication adherence and lifestyle modifications. Patient motivated to make changes.',
    status: 'pending-labs'
  },
  {
    id: 'visit-002',
    date: '2025-09-15',
    provider: {
      name: 'Dr. Michael Roberts',
      specialty: 'Cardiology',
      facility: 'Heart Health Clinic'
    },
    type: 'in-person',
    chiefComplaint: 'Follow-up for hypertension management, occasional palpitations',
    diagnosis: ['Essential Hypertension (I10)', 'Benign Palpitations (R00.2)'],
    treatmentPlan: [
      'Continue Lisinopril 20mg daily',
      'Add Amlodipine 5mg daily for better BP control',
      'Echocardiogram ordered to evaluate heart function',
      'Reduce caffeine intake'
    ],
    prescriptions: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '90 days' }
    ],
    labsOrdered: ['Echocardiogram', 'EKG', 'BNP'],
    followUp: '6 months',
    vitals: {
      bloodPressure: '142/92',
      heartRate: 82,
      temperature: 98.4,
      weight: 188,
      height: 68,
      bmi: 28.6
    },
    questionnaires: [
      { name: 'PHQ-2 (Depression)', score: 0, interpretation: 'No symptoms' },
      { name: 'GAD-2 (Anxiety)', score: 1, interpretation: 'Minimal symptoms' }
    ],
    notes: 'Patient with persistently elevated blood pressure despite Lisinopril. Adding calcium channel blocker for improved control. Palpitations likely benign but ordering echo for reassurance. Patient counseled on reducing caffeine.',
    status: 'completed'
  },
  {
    id: 'visit-003',
    date: '2025-06-10',
    provider: {
      name: 'Dr. Sarah Williams',
      specialty: 'Endocrinology',
      facility: 'PEHD Telehealth'
    },
    type: 'telehealth',
    chiefComplaint: 'Diabetes management, elevated HbA1c',
    diagnosis: ['Type 2 Diabetes Mellitus (E11.9)', 'Obesity (E66.9)'],
    treatmentPlan: [
      'Increase Metformin to 850mg twice daily',
      'Dietary counseling referral',
      'Blood glucose monitoring twice daily',
      'Weight loss goal: 10 lbs in 3 months'
    ],
    prescriptions: [
      { name: 'Metformin', dosage: '850mg', frequency: 'Twice daily', duration: '90 days' }
    ],
    labsOrdered: ['HbA1c', 'Fasting Glucose', 'Lipid Panel'],
    followUp: '3 months',
    vitals: {
      bloodPressure: '134/86',
      heartRate: 76,
      temperature: 98.6,
      weight: 192,
      height: 68,
      bmi: 29.2
    },
    questionnaires: [
      { name: 'PHQ-2 (Depression)', score: 2, interpretation: 'Mild symptoms' },
      { name: 'Diabetes Distress Scale', score: 2.1, interpretation: 'Moderate distress' }
    ],
    notes: 'HbA1c elevated at 7.8%. Increasing Metformin dose and emphasizing lifestyle modifications. Patient expressing frustration with weight management. Referred to nutritionist for support.',
    status: 'completed'
  }
];

interface VisitSummaryViewProps {
  onNavigate?: (tab: string) => void;
}

const VisitSummaryView: React.FC<VisitSummaryViewProps> = ({ onNavigate }) => {
  const { currentUser } = useUser();
  const [expandedVisit, setExpandedVisit] = useState<string | null>(visitRecords[0]?.id);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf' | 'all'>('all');
  const [exportOptions, setExportOptions] = useState({
    visitNotes: true,
    questionnaires: true,
    labResults: true,
    medications: true,
    vitals: true,
    diagnoses: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    setExportComplete(true);
  };

  const generateExportData = () => {
    const data = {
      patient: {
        name: `${currentUser?.firstName} ${currentUser?.lastName}`,
        dateOfBirth: currentUser?.dateOfBirth,
        medicalRecordNumber: 'PEHD-2024-001234',
        exportDate: new Date().toISOString()
      },
      visits: exportOptions.visitNotes ? visitRecords : [],
      questionnaires: exportOptions.questionnaires ? visitRecords.flatMap(v => v.questionnaires) : [],
      medications: exportOptions.medications ? visitRecords.flatMap(v => v.prescriptions) : [],
      vitals: exportOptions.vitals ? visitRecords.map(v => ({ date: v.date, ...v.vitals })) : [],
      diagnoses: exportOptions.diagnoses ? [...new Set(visitRecords.flatMap(v => v.diagnosis))] : []
    };
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Visit History & Records
          </h1>
          <p className="text-slate-400 mt-1">View your visit summaries and download your portable health record</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
        >
          <Download className="w-5 h-5" />
          Export Health Record
        </button>
      </div>

      {/* Portable Health Record Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Usb className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Your Portable Health Record</h3>
            <p className="text-slate-300 text-sm mb-4">
              Download your complete health data including visit notes, questionnaire responses, lab results, 
              and medications. All records are in English for seamless use across any US healthcare provider. 
              Save to a USB drive and take it to any provider - no more repeating your medical history at every appointment!
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 rounded-lg">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400">Encrypted</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg">
                <FolderArchive className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">English Documentation</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Visit Records */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent Visits</h2>
        
        {visitRecords.map((visit) => (
          <div 
            key={visit.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
          >
            {/* Visit Header */}
            <button
              onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  visit.type === 'telehealth' ? 'bg-purple-500/20' : 'bg-cyan-500/20'
                }`}>
                  {visit.type === 'telehealth' ? (
                    <Video className="w-6 h-6 text-purple-400" />
                  ) : (
                    <MapPin className="w-6 h-6 text-cyan-400" />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-semibold">{visit.provider.name}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-xs ${
                      visit.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      visit.status === 'pending-labs' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {visit.status === 'pending-labs' ? 'Pending Labs' : 
                       visit.status === 'follow-up-scheduled' ? 'Follow-up Scheduled' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{visit.provider.specialty}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(visit.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="capitalize">{visit.type}</span>
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${
                expandedVisit === visit.id ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Expanded Visit Details */}
            {expandedVisit === visit.id && (
              <div className="px-6 pb-6 border-t border-slate-700/50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Chief Complaint */}
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        Chief Complaint
                      </h4>
                      <p className="text-slate-300 text-sm">{visit.chiefComplaint}</p>
                    </div>

                    {/* Diagnoses */}
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-cyan-400" />
                        Diagnoses
                      </h4>
                      <div className="space-y-1">
                        {visit.diagnosis.map((dx, idx) => (
                          <p key={idx} className="text-slate-300 text-sm">{dx}</p>
                        ))}
                      </div>
                    </div>

                    {/* Treatment Plan */}
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-400" />
                        Treatment Plan
                      </h4>
                      <ul className="space-y-1">
                        {visit.treatmentPlan.map((item, idx) => (
                          <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prescriptions */}
                    {visit.prescriptions.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Pill className="w-4 h-4 text-purple-400" />
                          Prescriptions
                        </h4>
                        <div className="space-y-2">
                          {visit.prescriptions.map((rx, idx) => (
                            <div key={idx} className="bg-slate-900/50 rounded-lg p-3">
                              <p className="text-white font-medium">{rx.name} {rx.dosage}</p>
                              <p className="text-slate-400 text-sm">{rx.frequency} for {rx.duration}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Vitals */}
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-rose-400" />
                        Vitals
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">Blood Pressure</p>
                          <p className="text-white font-medium">{visit.vitals.bloodPressure} mmHg</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">Heart Rate</p>
                          <p className="text-white font-medium">{visit.vitals.heartRate} bpm</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">Weight</p>
                          <p className="text-white font-medium">{visit.vitals.weight} lbs</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-slate-400 text-xs">BMI</p>
                          <p className="text-white font-medium">{visit.vitals.bmi}</p>
                        </div>
                      </div>
                    </div>

                    {/* Questionnaire Scores */}
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-blue-400" />
                        Questionnaire Scores
                      </h4>
                      <div className="space-y-2">
                        {visit.questionnaires.map((q, idx) => (
                          <div key={idx} className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm">{q.name}</p>
                              <p className="text-slate-400 text-xs">{q.interpretation}</p>
                            </div>
                            <span className="text-lg font-bold text-cyan-400">{q.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Labs Ordered */}
                    {visit.labsOrdered.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-amber-400" />
                          Labs Ordered
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {visit.labsOrdered.map((lab, idx) => (
                            <span key={idx} className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-lg">
                              {lab}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up */}
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Follow-up
                      </h4>
                      <p className="text-slate-300 text-sm">{visit.followUp}</p>
                    </div>
                  </div>
                </div>

                {/* Provider Notes */}
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    Provider Notes
                  </h4>
                  <p className="text-slate-300 text-sm bg-slate-900/50 rounded-lg p-4">{visit.notes}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Provider Encouragement Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">For Healthcare Providers</h3>
            <p className="text-slate-300 text-sm mb-4">
              Join the PEHD network to provide consistent, coordinated care. When patients bring their 
              portable health record, you'll have instant access to their complete medical history, 
              questionnaire responses, and previous visit notes - saving time and improving outcomes.
            </p>
            <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
              Learn More About PEHD for Providers
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Download className="w-6 h-6 text-cyan-400" />
                Export Health Record
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Download your portable health data to take to any provider
              </p>
            </div>

            {!exportComplete ? (
              <div className="p-6 space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="text-white font-medium mb-3 block">Export Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setExportFormat('json')}
                      className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        exportFormat === 'json'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <FileJson className="w-6 h-6" />
                      <span className="text-sm font-medium">JSON</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        exportFormat === 'pdf'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <File className="w-6 h-6" />

                      <span className="text-sm font-medium">PDF</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('all')}
                      className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        exportFormat === 'all'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <FolderArchive className="w-6 h-6" />
                      <span className="text-sm font-medium">All</span>
                    </button>
                  </div>
                </div>

                {/* Data Selection */}
                <div>
                  <label className="text-white font-medium mb-3 block">Include Data</label>
                  <div className="space-y-2">
                    {[
                      { key: 'visitNotes', label: 'Visit Notes & Summaries', icon: FileText },
                      { key: 'questionnaires', label: 'Questionnaire Responses', icon: ClipboardList },
                      { key: 'labResults', label: 'Lab Results', icon: FlaskConical },
                      { key: 'medications', label: 'Medications & Prescriptions', icon: Pill },
                      { key: 'vitals', label: 'Vital Signs History', icon: Activity },
                      { key: 'diagnoses', label: 'Diagnoses & Conditions', icon: Stethoscope }
                    ].map(({ key, label, icon: Icon }) => (
                      <label 
                        key={key}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-300">{label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={exportOptions[key as keyof typeof exportOptions]}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* USB Tip */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-start gap-3">
                  <Usb className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 text-sm font-medium">USB Flash Drive Ready</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Save your exported file to a USB drive and bring it to any healthcare appointment. 
                      Providers can view your complete history without you repeating information.
                    </p>
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Health Record
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Download Complete!</h3>
                  <p className="text-slate-400">Your portable health record has been downloaded</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 text-left">
                  <p className="text-white font-medium mb-2">Next Steps:</p>
                  <ol className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>
                      Save the file to your USB flash drive
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>
                      Bring the USB drive to your next appointment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</span>
                      Ask your provider to review your PEHD health record
                    </li>
                  </ol>
                </div>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportComplete(false);
                  }}
                  className="w-full py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                >
                  Done
                </button>
              </div>
            )}

            {/* Close Button */}
            {!exportComplete && (
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitSummaryView;
