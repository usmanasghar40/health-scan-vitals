import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import {
  Pill, Search, Plus, AlertTriangle, CheckCircle2, Clock, FileText,
  Send, Printer, X, ChevronDown, ChevronRight, User, Building2,
  Phone, MapPin, RefreshCw, Shield, AlertCircle, Info, History,
  Edit, Trash2, Copy, Star, Filter, Calendar, Package, Zap
} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  genericName: string;
  drugClass: string;
  strength: string[];
  forms: string[];
  isControlled: boolean;
  schedule?: string;
  commonDosages: string[];
  warnings: string[];
  interactions: string[];
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  medication: string;
  genericName: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions: string;
  pharmacy: Pharmacy;
  status: 'draft' | 'pending' | 'sent' | 'filled' | 'cancelled';
  prescribedAt: Date;
  prescribedBy: string;
  isControlled: boolean;
  priorAuthRequired: boolean;
  priorAuthStatus?: 'pending' | 'approved' | 'denied';
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax: string;
  isPreferred: boolean;
  acceptsEPrescribe: boolean;
}

// Mock medication database
const medicationDatabase: Medication[] = [
  {
    id: 'med-001',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    drugClass: 'ACE Inhibitor',
    strength: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
    forms: ['Tablet'],
    isControlled: false,
    commonDosages: ['10mg once daily', '20mg once daily', '40mg once daily'],
    warnings: ['Monitor potassium levels', 'May cause dry cough', 'Avoid in pregnancy'],
    interactions: ['Potassium supplements', 'NSAIDs', 'Lithium']
  },
  {
    id: 'med-002',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    drugClass: 'Biguanide',
    strength: ['500mg', '850mg', '1000mg'],
    forms: ['Tablet', 'Extended-Release Tablet'],
    isControlled: false,
    commonDosages: ['500mg twice daily', '1000mg twice daily', '850mg twice daily'],
    warnings: ['Risk of lactic acidosis', 'Hold before contrast procedures', 'Monitor renal function'],
    interactions: ['Contrast dye', 'Alcohol', 'Carbonic anhydrase inhibitors']
  },
  {
    id: 'med-003',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    drugClass: 'HMG-CoA Reductase Inhibitor',
    strength: ['10mg', '20mg', '40mg', '80mg'],
    forms: ['Tablet'],
    isControlled: false,
    commonDosages: ['20mg once daily at bedtime', '40mg once daily at bedtime', '80mg once daily at bedtime'],
    warnings: ['Monitor liver function', 'May cause muscle pain', 'Avoid grapefruit juice'],
    interactions: ['Gemfibrozil', 'Niacin', 'Cyclosporine', 'Clarithromycin']
  },
  {
    id: 'med-004',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    drugClass: 'Calcium Channel Blocker',
    strength: ['2.5mg', '5mg', '10mg'],
    forms: ['Tablet'],
    isControlled: false,
    commonDosages: ['5mg once daily', '10mg once daily'],
    warnings: ['May cause peripheral edema', 'Use caution in heart failure'],
    interactions: ['Simvastatin (limit dose)', 'CYP3A4 inhibitors']
  },
  {
    id: 'med-005',
    name: 'Hydrocodone/Acetaminophen',
    genericName: 'Hydrocodone/APAP',
    drugClass: 'Opioid Analgesic',
    strength: ['5/325mg', '7.5/325mg', '10/325mg'],
    forms: ['Tablet'],
    isControlled: true,
    schedule: 'Schedule II',
    commonDosages: ['1-2 tablets every 4-6 hours as needed for pain'],
    warnings: ['Risk of addiction', 'Respiratory depression', 'Max 4g acetaminophen/day'],
    interactions: ['Benzodiazepines', 'Alcohol', 'Other CNS depressants', 'MAOIs']
  },
  {
    id: 'med-006',
    name: 'Alprazolam',
    genericName: 'Alprazolam',
    drugClass: 'Benzodiazepine',
    strength: ['0.25mg', '0.5mg', '1mg', '2mg'],
    forms: ['Tablet', 'Extended-Release Tablet', 'Oral Solution'],
    isControlled: true,
    schedule: 'Schedule IV',
    commonDosages: ['0.25-0.5mg three times daily', '0.5-1mg at bedtime'],
    warnings: ['Risk of dependence', 'Avoid abrupt discontinuation', 'Respiratory depression with opioids'],
    interactions: ['Opioids', 'Alcohol', 'CYP3A4 inhibitors', 'Ketoconazole']
  },
  {
    id: 'med-007',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    drugClass: 'Proton Pump Inhibitor',
    strength: ['10mg', '20mg', '40mg'],
    forms: ['Capsule', 'Delayed-Release Tablet'],
    isControlled: false,
    commonDosages: ['20mg once daily before breakfast', '40mg once daily'],
    warnings: ['Long-term use may affect magnesium levels', 'C. diff risk', 'Bone fracture risk'],
    interactions: ['Clopidogrel', 'Methotrexate', 'Tacrolimus']
  },
  {
    id: 'med-008',
    name: 'Levothyroxine',
    genericName: 'Levothyroxine Sodium',
    drugClass: 'Thyroid Hormone',
    strength: ['25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg', '150mcg'],
    forms: ['Tablet'],
    isControlled: false,
    commonDosages: ['50-100mcg once daily on empty stomach', '1.6mcg/kg/day'],
    warnings: ['Take on empty stomach', 'Wait 4 hours before calcium/iron', 'Monitor TSH'],
    interactions: ['Calcium supplements', 'Iron supplements', 'Antacids', 'Warfarin']
  }
];

// Mock pharmacies
const pharmacies: Pharmacy[] = [
  { id: 'pharm-001', name: 'CVS Pharmacy #4521', address: '123 Main St, Boston, MA 02101', phone: '(617) 555-0101', fax: '(617) 555-0102', isPreferred: true, acceptsEPrescribe: true },
  { id: 'pharm-002', name: 'Walgreens #7892', address: '456 Oak Ave, Boston, MA 02102', phone: '(617) 555-0201', fax: '(617) 555-0202', isPreferred: false, acceptsEPrescribe: true },
  { id: 'pharm-003', name: 'Rite Aid #3456', address: '789 Elm St, Cambridge, MA 02139', phone: '(617) 555-0301', fax: '(617) 555-0302', isPreferred: false, acceptsEPrescribe: true },
  { id: 'pharm-004', name: 'Costco Pharmacy', address: '321 Commerce Way, Somerville, MA 02143', phone: '(617) 555-0401', fax: '(617) 555-0402', isPreferred: false, acceptsEPrescribe: true },
  { id: 'pharm-005', name: 'Mass General Hospital Pharmacy', address: '55 Fruit St, Boston, MA 02114', phone: '(617) 555-0501', fax: '(617) 555-0502', isPreferred: false, acceptsEPrescribe: true },
];

const PrescriptionView: React.FC = () => {
  const { currentUser, patientSummaries } = useUser();
  const [activeView, setActiveView] = useState<'new' | 'history' | 'pending' | 'templates'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showMedicationSearch, setShowMedicationSearch] = useState(false);
  const [showPharmacySelect, setShowPharmacySelect] = useState(false);
  const [showInteractionAlert, setShowInteractionAlert] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [prescriptionSent, setPrescriptionSent] = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedStrength, setSelectedStrength] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [refills, setRefills] = useState('0');
  const [instructions, setInstructions] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(pharmacies[0]);
  const [dispenseAsWritten, setDispenseAsWritten] = useState(false);

  // Mock prescription history
  const [prescriptionHistory] = useState<Prescription[]>([
    {
      id: 'rx-001',
      patientId: 'patient-001',
      patientName: 'Sarah Johnson',
      medication: 'Lisinopril',
      genericName: 'Lisinopril',
      strength: '20mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: '90 days',
      quantity: 90,
      refills: 3,
      instructions: 'Take one tablet by mouth once daily in the morning.',
      pharmacy: pharmacies[0],
      status: 'filled',
      prescribedAt: new Date('2024-12-15'),
      prescribedBy: 'Dr. Emily Chen',
      isControlled: false,
      priorAuthRequired: false
    },
    {
      id: 'rx-002',
      patientId: 'patient-001',
      patientName: 'Sarah Johnson',
      medication: 'Metformin',
      genericName: 'Metformin HCl',
      strength: '1000mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Twice daily',
      duration: '90 days',
      quantity: 180,
      refills: 3,
      instructions: 'Take one tablet by mouth twice daily with meals.',
      pharmacy: pharmacies[0],
      status: 'filled',
      prescribedAt: new Date('2024-12-15'),
      prescribedBy: 'Dr. Emily Chen',
      isControlled: false,
      priorAuthRequired: false
    },
    {
      id: 'rx-003',
      patientId: 'patient-002',
      patientName: 'Michael Chen',
      medication: 'Atorvastatin',
      genericName: 'Atorvastatin Calcium',
      strength: '40mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Once daily at bedtime',
      duration: '90 days',
      quantity: 90,
      refills: 3,
      instructions: 'Take one tablet by mouth at bedtime.',
      pharmacy: pharmacies[1],
      status: 'sent',
      prescribedAt: new Date('2024-12-20'),
      prescribedBy: 'Dr. Emily Chen',
      isControlled: false,
      priorAuthRequired: false
    },
    {
      id: 'rx-004',
      patientId: 'patient-003',
      patientName: 'Robert Williams',
      medication: 'Hydrocodone/Acetaminophen',
      genericName: 'Hydrocodone/APAP',
      strength: '5/325mg',
      form: 'Tablet',
      dosage: '1-2 tablets',
      frequency: 'Every 4-6 hours as needed',
      duration: '7 days',
      quantity: 20,
      refills: 0,
      instructions: 'Take 1-2 tablets by mouth every 4-6 hours as needed for pain. Do not exceed 8 tablets in 24 hours.',
      pharmacy: pharmacies[2],
      status: 'pending',
      prescribedAt: new Date('2024-12-24'),
      prescribedBy: 'Dr. Emily Chen',
      isControlled: true,
      priorAuthRequired: false
    }
  ]);

  const filteredMedications = medicationDatabase.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.drugClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMedication = (med: Medication) => {
    setSelectedMedication(med);
    setShowMedicationSearch(false);
    setSearchQuery('');
    setSelectedStrength(med.strength[0]);
    setSelectedForm(med.forms[0]);
    
    // Check for interactions
    if (med.interactions.length > 0) {
      setShowInteractionAlert(true);
    }
  };

  const handleSendPrescription = () => {
    setShowConfirmation(false);
    setPrescriptionSent(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setPrescriptionSent(false);
      setSelectedMedication(null);
      setSelectedPatient('');
      setDosage('');
      setFrequency('');
      setDuration('');
      setQuantity('');
      setRefills('0');
      setInstructions('');
    }, 3000);
  };

  const getStatusColor = (status: Prescription['status']) => {
    switch (status) {
      case 'filled': return 'bg-emerald-500/20 text-emerald-400';
      case 'sent': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'cancelled': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            E-Prescribe
          </h1>
          <p className="text-slate-400 mt-1">Manage and send electronic prescriptions</p>
        </div>
        
        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl">
          {[
            { id: 'new', label: 'New Rx', icon: Plus },
            { id: 'pending', label: 'Pending', icon: Clock },
            { id: 'history', label: 'History', icon: History },
            { id: 'templates', label: 'Templates', icon: Copy }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeView === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      {prescriptionSent && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="text-emerald-400 font-medium">Prescription Sent Successfully!</p>
            <p className="text-emerald-400/70 text-sm">
              The prescription has been electronically transmitted to {selectedPharmacy?.name}
            </p>
          </div>
        </div>
      )}

      {activeView === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Prescription Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Patient
              </h2>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select a patient...</option>
                {patientSummaries.map((ps) => (
                  <option key={ps.patient.id} value={ps.patient.id}>
                    {ps.patient.firstName} {ps.patient.lastName} - {ps.patient.medicalRecordNumber}
                  </option>
                ))}
              </select>

              {selectedPatient && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {patientSummaries.find(ps => ps.patient.id === selectedPatient)?.patient.firstName}{' '}
                        {patientSummaries.find(ps => ps.patient.id === selectedPatient)?.patient.lastName}
                      </p>
                      <p className="text-slate-500 text-sm">
                        DOB: {patientSummaries.find(ps => ps.patient.id === selectedPatient)?.patient.dateOfBirth?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      View Medication History
                    </button>
                  </div>
                  
                  {/* Current Medications */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Current Medications:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg">Lisinopril 20mg</span>
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg">Metformin 1000mg</span>
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg">Aspirin 81mg</span>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="mt-3">
                    <p className="text-slate-400 text-sm mb-2">Allergies:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Penicillin
                      </span>
                      <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Sulfa
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Medication Selection */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-400" />
                Medication
              </h2>

              {!selectedMedication ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search medications by name, generic, or drug class..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowMedicationSearch(true);
                    }}
                    onFocus={() => setShowMedicationSearch(true)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  
                  {showMedicationSearch && searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
                      {filteredMedications.length > 0 ? (
                        filteredMedications.map((med) => (
                          <button
                            key={med.id}
                            onClick={() => handleSelectMedication(med)}
                            className="w-full p-4 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium">{med.name}</p>
                                <p className="text-slate-400 text-sm">{med.genericName}</p>
                                <p className="text-slate-500 text-xs mt-1">{med.drugClass}</p>
                              </div>
                              {med.isControlled && (
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
                                  {med.schedule}
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-400">
                          No medications found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Medication */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-emerald-400 font-semibold text-lg">{selectedMedication.name}</p>
                        <p className="text-slate-400">{selectedMedication.genericName}</p>
                        <p className="text-slate-500 text-sm mt-1">{selectedMedication.drugClass}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedMedication.isControlled && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {selectedMedication.schedule}
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedMedication(null)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Strength & Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Strength</label>
                      <select
                        value={selectedStrength}
                        onChange={(e) => setSelectedStrength(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      >
                        {selectedMedication.strength.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Form</label>
                      <select
                        value={selectedForm}
                        onChange={(e) => setSelectedForm(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      >
                        {selectedMedication.forms.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dosage & Frequency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g., 1 tablet"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select frequency...</option>
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="Four times daily">Four times daily</option>
                        <option value="Every 4-6 hours as needed">Every 4-6 hours as needed</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="Every 12 hours">Every 12 hours</option>
                        <option value="At bedtime">At bedtime</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  </div>

                  {/* Common Dosages */}
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Common dosages:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMedication.commonDosages.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            // Parse and apply common dosage
                            setDosage('1 tablet');
                            setFrequency(d.includes('twice') ? 'Twice daily' : d.includes('bedtime') ? 'At bedtime' : 'Once daily');
                          }}
                          className="px-3 py-1.5 bg-slate-700/50 text-slate-300 text-sm rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration, Quantity, Refills */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="7 days">7 days</option>
                        <option value="10 days">10 days</option>
                        <option value="14 days">14 days</option>
                        <option value="30 days">30 days</option>
                        <option value="60 days">60 days</option>
                        <option value="90 days">90 days</option>
                        <option value="Ongoing">Ongoing</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Quantity</label>
                      <input
                        type="number"
                        placeholder="e.g., 30"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Refills</label>
                      <select
                        value={refills}
                        onChange={(e) => setRefills(e.target.value)}
                        disabled={selectedMedication.isControlled && selectedMedication.schedule === 'Schedule II'}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                      {selectedMedication.isControlled && selectedMedication.schedule === 'Schedule II' && (
                        <p className="text-amber-400 text-xs mt-1">No refills for Schedule II</p>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Patient Instructions (Sig)</label>
                    <textarea
                      placeholder="Enter detailed instructions for the patient..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* DAW */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispenseAsWritten}
                      onChange={(e) => setDispenseAsWritten(e.target.checked)}
                      className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300">Dispense as Written (No Generic Substitution)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Pharmacy Selection */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Pharmacy
              </h2>

              {selectedPharmacy ? (
                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{selectedPharmacy.name}</p>
                        {selectedPharmacy.isPreferred && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Preferred
                          </span>
                        )}
                        {selectedPharmacy.acceptsEPrescribe && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            E-Prescribe
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-slate-400 text-sm">
                        <MapPin className="w-4 h-4" />
                        {selectedPharmacy.address}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-slate-500 text-sm">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedPharmacy.phone}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPharmacySelect(true)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPharmacySelect(true)}
                  className="w-full p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                >
                  Select a pharmacy
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Drug Warnings */}
            {selectedMedication && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Warnings
                </h3>
                <div className="space-y-3">
                  {selectedMedication.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drug Interactions */}
            {selectedMedication && selectedMedication.interactions.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-rose-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Potential Interactions
                </h3>
                <div className="space-y-2">
                  {selectedMedication.interactions.map((interaction, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-rose-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {interaction}
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-sm text-rose-400 hover:text-rose-300 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  View detailed interaction report
                </button>
              </div>
            )}

            {/* Prescription Summary */}
            {selectedMedication && selectedPatient && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Prescription Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Medication</span>
                    <span className="text-white font-medium">{selectedMedication.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Strength</span>
                    <span className="text-white">{selectedStrength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Form</span>
                    <span className="text-white">{selectedForm}</span>
                  </div>
                  {dosage && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dosage</span>
                      <span className="text-white">{dosage}</span>
                    </div>
                  )}
                  {frequency && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Frequency</span>
                      <span className="text-white">{frequency}</span>
                    </div>
                  )}
                  {quantity && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantity</span>
                      <span className="text-white">{quantity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Refills</span>
                    <span className="text-white">{refills}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowConfirmation(true)}
                    disabled={!dosage || !frequency || !quantity}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    Send Prescription
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
                    <Printer className="w-5 h-5" />
                    Print Prescription
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
                    <Copy className="w-5 h-5" />
                    Save as Template
                  </button>
                </div>
              </div>
            )}

            {/* Prescriber Info */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Prescriber</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-medium">
                  EC
                </div>
                <div>
                  <p className="text-white font-medium">Dr. Emily Chen, MD</p>
                  <p className="text-slate-400 text-sm">NPI: 1234567890</p>
                  <p className="text-slate-500 text-xs">DEA: AC1234567</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription History View */}
      {activeView === 'history' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search prescriptions..."
                  className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Sync with PDMP
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Patient</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Medication</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Dosage</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Pharmacy</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptionHistory.map((rx) => (
                  <tr key={rx.id} className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-4">
                      <p className="text-white font-medium">{rx.patientName}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <p className="text-white">{rx.medication} {rx.strength}</p>
                        {rx.isControlled && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">C-II</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">{rx.genericName}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-300">{rx.dosage} {rx.frequency}</p>
                      <p className="text-slate-500 text-xs">Qty: {rx.quantity} | Refills: {rx.refills}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-300 text-sm">{rx.pharmacy.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-300 text-sm">{rx.prescribedAt.toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(rx.status)}`}>
                        {rx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Prescriptions View */}
      {activeView === 'pending' && (
        <div className="space-y-4">
          {prescriptionHistory.filter(rx => rx.status === 'pending' || rx.status === 'sent').map((rx) => (
            <div key={rx.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    rx.status === 'pending' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                  }`}>
                    {rx.status === 'pending' ? (
                      <Clock className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Send className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{rx.medication} {rx.strength}</h3>
                      {rx.isControlled && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
                          Controlled
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400">for {rx.patientName}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {rx.dosage} {rx.frequency} | Qty: {rx.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(rx.status)}`}>
                    {rx.status === 'pending' ? 'Awaiting Signature' : 'Sent to Pharmacy'}
                  </span>
                  <p className="text-slate-500 text-sm mt-2">{rx.pharmacy.name}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                <p className="text-slate-500 text-sm">
                  Prescribed: {rx.prescribedAt.toLocaleDateString()} by {rx.prescribedBy}
                </p>
                <div className="flex items-center gap-2">
                  {rx.status === 'pending' && (
                    <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                      Sign & Send
                    </button>
                  )}
                  <button className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates View */}
      {activeView === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Hypertension Starter', meds: ['Lisinopril 10mg', 'HCTZ 12.5mg'], uses: 45 },
            { name: 'Diabetes Management', meds: ['Metformin 500mg', 'Glipizide 5mg'], uses: 38 },
            { name: 'Lipid Control', meds: ['Atorvastatin 20mg'], uses: 52 },
            { name: 'Anxiety Protocol', meds: ['Sertraline 50mg', 'Hydroxyzine 25mg'], uses: 23 },
            { name: 'Pain Management', meds: ['Ibuprofen 800mg', 'Cyclobenzaprine 10mg'], uses: 31 },
            { name: 'Infection - UTI', meds: ['Nitrofurantoin 100mg'], uses: 28 },
          ].map((template, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-slate-500 text-sm">{template.uses} uses</span>
              </div>
              <h3 className="text-white font-semibold mb-2">{template.name}</h3>
              <div className="space-y-1">
                {template.meds.map((med, j) => (
                  <p key={j} className="text-slate-400 text-sm flex items-center gap-2">
                    <Pill className="w-3 h-3" />
                    {med}
                  </p>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2">
                <button className="flex-1 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm">
                  Use Template
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Add New Template */}
          <button className="bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-emerald-400">
            <Plus className="w-8 h-8" />
            <span>Create New Template</span>
          </button>
        </div>
      )}

      {/* Pharmacy Selection Modal */}
      {showPharmacySelect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Select Pharmacy</h2>
              <button onClick={() => setShowPharmacySelect(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search pharmacies..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pharmacies.map((pharmacy) => (
                  <button
                    key={pharmacy.id}
                    onClick={() => {
                      setSelectedPharmacy(pharmacy);
                      setShowPharmacySelect(false);
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      selectedPharmacy?.id === pharmacy.id
                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                        : 'bg-slate-900/50 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{pharmacy.name}</p>
                          {pharmacy.isPreferred && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                              Preferred
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{pharmacy.address}</p>
                        <p className="text-slate-500 text-sm">{pharmacy.phone}</p>
                      </div>
                      {pharmacy.acceptsEPrescribe && (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          E-Prescribe
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Confirm Prescription</h2>
            </div>
            <div className="p-6">
              <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient</span>
                    <span className="text-white font-medium">
                      {patientSummaries.find(ps => ps.patient.id === selectedPatient)?.patient.firstName}{' '}
                      {patientSummaries.find(ps => ps.patient.id === selectedPatient)?.patient.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Medication</span>
                    <span className="text-white">{selectedMedication?.name} {selectedStrength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sig</span>
                    <span className="text-white">{dosage} {frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantity</span>
                    <span className="text-white">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Refills</span>
                    <span className="text-white">{refills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pharmacy</span>
                    <span className="text-white">{selectedPharmacy?.name}</span>
                  </div>
                </div>
              </div>

              {selectedMedication?.isControlled && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-medium">Controlled Substance Notice</p>
                      <p className="text-amber-400/70 text-sm mt-1">
                        This prescription will be reported to the state PDMP. Your DEA number will be included.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-slate-400 text-sm mb-6">
                By clicking "Sign & Send", you are electronically signing this prescription and authorizing 
                its transmission to the selected pharmacy.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendPrescription}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  <Send className="w-5 h-5" />
                  Sign & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionView;
