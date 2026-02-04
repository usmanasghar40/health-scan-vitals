import React, { useState, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import {
  labCompanies,
  labTests,
  testCategories,
  commonDiagnosisCodes,
  LabCompany,
  LabTest,
  LabOrder,
  LabOrderStatus
} from '@/data/labCompanies';
import {
  Search,
  Filter,
  Plus,
  Minus,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Building2,
  FlaskConical,
  FileText,
  Clock,
  DollarSign,
  AlertCircle,
  Beaker,
  Heart,
  Shield,
  Bug,
  Dna,
  Pill,
  Apple,
  AlertTriangle,
  Activity,
  Droplets,
  Send,
  Save,
  Printer,
  History,
  User,
  Stethoscope,
  Globe,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';

interface LabOrderFormProps {
  onOrderComplete?: (order: LabOrder) => void;
  initialPatientId?: string;
}

const LabOrderForm: React.FC<LabOrderFormProps> = ({ onOrderComplete, initialPatientId }) => {
  const { patientSummaries, currentUser } = useUser();
  
  // State management
  const [currentStep, setCurrentStep] = useState<'patient' | 'lab' | 'tests' | 'diagnosis' | 'review'>('patient');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [selectedLabCompany, setSelectedLabCompany] = useState<LabCompany | null>(null);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<{ code: string; description: string }[]>([]);
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Search and filter states
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [diagnosisSearchQuery, setDiagnosisSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [labTypeFilter, setLabTypeFilter] = useState<'all' | 'major' | 'functional' | 'specialty' | 'european'>('all');
  const [showRupaOnly, setShowRupaOnly] = useState(false);
  
  // Order history state
  const [savedOrders, setSavedOrders] = useState<LabOrder[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // Get selected patient
  const selectedPatient = patientSummaries.find(ps => ps.patient.id === selectedPatientId)?.patient;

  // Filter lab companies
  const filteredLabCompanies = useMemo(() => {
    return labCompanies.filter(lab => {
      const matchesSearch = lab.name.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
        lab.shortName.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
        lab.specialties.some(s => s.toLowerCase().includes(labSearchQuery.toLowerCase()));
      
      const matchesType = labTypeFilter === 'all' || lab.type === labTypeFilter;
      const matchesRupa = !showRupaOnly || lab.rupaHealth;
      
      return matchesSearch && matchesType && matchesRupa;
    });
  }, [labSearchQuery, labTypeFilter, showRupaOnly]);

  // Filter tests by selected lab and category
  const filteredTests = useMemo(() => {
    if (!selectedLabCompany) return [];
    
    return labTests.filter(test => {
      const matchesLab = test.labCompanyId === selectedLabCompany.id;
      const matchesSearch = test.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
        test.code.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
        test.biomarkers?.some(b => b.toLowerCase().includes(testSearchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || test.category === selectedCategory;
      
      return matchesLab && matchesSearch && matchesCategory;
    });
  }, [selectedLabCompany, testSearchQuery, selectedCategory]);

  // Filter diagnoses
  const filteredDiagnoses = useMemo(() => {
    return commonDiagnosisCodes.filter(d =>
      d.code.toLowerCase().includes(diagnosisSearchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(diagnosisSearchQuery.toLowerCase())
    );
  }, [diagnosisSearchQuery]);

  // Calculate totals
  const totalPrice = selectedTests.reduce((sum, test) => sum + (test.price || 0), 0);
  const requiresFasting = selectedTests.some(test => test.fastingRequired);
  const longestTurnaround = selectedTests.reduce((max, test) => {
    const days = parseInt(test.turnaroundTime) || 0;
    return days > max ? days : max;
  }, 0);

  // Get category icon
  const getCategoryIcon = (categoryId: string) => {
    const icons: Record<string, React.ReactNode> = {
      'chemistry': <FlaskConical className="w-5 h-5" />,
      'hematology': <Droplets className="w-5 h-5" />,
      'hormones': <Activity className="w-5 h-5" />,
      'cardiovascular': <Heart className="w-5 h-5" />,
      'gi-health': <Beaker className="w-5 h-5" />,
      'autoimmune': <Shield className="w-5 h-5" />,
      'food-sensitivity': <Apple className="w-5 h-5" />,
      'toxins': <AlertTriangle className="w-5 h-5" />,
      'nutrients': <Pill className="w-5 h-5" />,
      'infectious': <Bug className="w-5 h-5" />,
      'genetics': <Dna className="w-5 h-5" />,
      'organic-acids': <Beaker className="w-5 h-5" />
    };
    return icons[categoryId] || <FlaskConical className="w-5 h-5" />;
  };

  // Handle test selection
  const toggleTest = (test: LabTest) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      }
      return [...prev, test];
    });
  };

  // Handle diagnosis selection
  const toggleDiagnosis = (diagnosis: { code: string; description: string }) => {
    setSelectedDiagnoses(prev => {
      const exists = prev.find(d => d.code === diagnosis.code);
      if (exists) {
        return prev.filter(d => d.code !== diagnosis.code);
      }
      return [...prev, diagnosis];
    });
  };

  // Submit order
  const submitOrder = () => {
    if (!selectedPatient || !selectedLabCompany || selectedTests.length === 0) return;

    const newOrder: LabOrder = {
      id: `ORD-${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      providerId: currentUser?.id || '',
      providerName: `${currentUser?.firstName} ${currentUser?.lastName}`,
      labCompanyId: selectedLabCompany.id,
      labCompanyName: selectedLabCompany.name,
      tests: selectedTests,
      diagnosisCodes: selectedDiagnoses,
      urgency,
      fastingRequired: requiresFasting,
      specialInstructions,
      status: 'submitted',
      createdAt: new Date(),
      submittedAt: new Date(),
      estimatedTurnaround: `${longestTurnaround} days`,
      totalPrice,
      notes: orderNotes,
      requisitionNumber: `REQ-${Date.now().toString(36).toUpperCase()}`
    };

    setSavedOrders(prev => [newOrder, ...prev]);
    onOrderComplete?.(newOrder);
    
    // Reset form
    setCurrentStep('patient');
    setSelectedPatientId('');
    setSelectedLabCompany(null);
    setSelectedTests([]);
    setSelectedDiagnoses([]);
    setUrgency('routine');
    setSpecialInstructions('');
    setOrderNotes('');
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: 'patient', label: 'Patient', icon: User },
      { id: 'lab', label: 'Laboratory', icon: Building2 },
      { id: 'tests', label: 'Tests', icon: FlaskConical },
      { id: 'diagnosis', label: 'Diagnosis', icon: FileText },
      { id: 'review', label: 'Review', icon: CheckCircle2 }
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => {
                  if (index <= currentIndex || (step.id === 'lab' && selectedPatientId)) {
                    setCurrentStep(step.id as any);
                  }
                }}
                className={`flex flex-col items-center gap-2 ${
                  isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-cyan-500/20 border-2 border-cyan-500' :
                  isCompleted ? 'bg-emerald-500/20 border-2 border-emerald-500' :
                  'bg-slate-800 border border-slate-700'
                }`}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span className="text-sm font-medium">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  index < currentIndex ? 'bg-emerald-500' : 'bg-slate-700'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Render patient selection step
  const renderPatientStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Select Patient</h2>
        <p className="text-slate-400">Choose the patient for this lab order</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patientSummaries.map((ps) => (
          <button
            key={ps.patient.id}
            onClick={() => {
              setSelectedPatientId(ps.patient.id);
              setCurrentStep('lab');
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPatientId === ps.patient.id
                ? 'bg-cyan-500/20 border-cyan-500'
                : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {ps.patient.firstName[0]}{ps.patient.lastName[0]}
              </div>
              <div>
                <h3 className="text-white font-semibold">{ps.patient.firstName} {ps.patient.lastName}</h3>
                <p className="text-slate-500 text-sm">{ps.patient.medicalRecordNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-2 py-0.5 rounded-lg ${
                ps.riskLevel === 'high' ? 'bg-rose-500/20 text-rose-400' :
                ps.riskLevel === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {ps.riskLevel.toUpperCase()} RISK
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Render lab selection step
  const renderLabStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Select Laboratory</h2>
          <p className="text-slate-400">Choose from major labs, functional medicine labs, or specialty labs</p>
        </div>
        {selectedPatient && (
          <div className="text-right">
            <p className="text-slate-400 text-sm">Patient</p>
            <p className="text-white font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search laboratories..."
            value={labSearchQuery}
            onChange={(e) => setLabSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'major', 'functional', 'specialty', 'european'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setLabTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                labTypeFilter === type
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={showRupaOnly}
            onChange={(e) => setShowRupaOnly(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-slate-300">RUPA Health Only</span>
          <Sparkles className="w-4 h-4 text-purple-400" />
        </label>
      </div>

      {/* Lab Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
        {filteredLabCompanies.map((lab) => (
          <button
            key={lab.id}
            onClick={() => {
              setSelectedLabCompany(lab);
              setSelectedTests([]);
              setSelectedCategory(null);
              setCurrentStep('tests');
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedLabCompany?.id === lab.id
                ? 'bg-cyan-500/20 border-cyan-500'
                : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  lab.type === 'major' ? 'bg-blue-500/20 text-blue-400' :
                  lab.type === 'functional' ? 'bg-emerald-500/20 text-emerald-400' :
                  lab.type === 'specialty' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {lab.region === 'europe' ? <Globe className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{lab.shortName}</h3>
                  <p className="text-slate-500 text-xs">{lab.name}</p>
                </div>
              </div>
              {lab.rupaHealth && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> RUPA
                </span>
              )}
            </div>
            
            <p className="text-slate-400 text-sm mb-3 line-clamp-2">{lab.description}</p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {lab.specialties.slice(0, 3).map((spec, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full">
                  {spec}
                </span>
              ))}
              {lab.specialties.length > 3 && (
                <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded-full">
                  +{lab.specialties.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lab.turnaroundTime}
              </span>
              <span className={`px-2 py-0.5 rounded ${
                lab.type === 'major' ? 'bg-blue-500/10 text-blue-400' :
                lab.type === 'functional' ? 'bg-emerald-500/10 text-emerald-400' :
                lab.type === 'specialty' ? 'bg-purple-500/10 text-purple-400' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                {lab.type.toUpperCase()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredLabCompanies.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No laboratories found matching your criteria</p>
        </div>
      )}
    </div>
  );

  // Render test selection step
  const renderTestsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Select Tests</h2>
          <p className="text-slate-400">
            Ordering from <span className="text-cyan-400 font-medium">{selectedLabCompany?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-sm">Selected Tests</p>
            <p className="text-white font-bold text-xl">{selectedTests.length}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Est. Total</p>
            <p className="text-emerald-400 font-bold text-xl">${totalPrice}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <div className="w-64 shrink-0">
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Categories</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                !selectedCategory ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
              <span>All Tests</span>
            </button>
            {testCategories.map((cat) => {
              const testsInCategory = labTests.filter(t => 
                t.labCompanyId === selectedLabCompany?.id && t.category === cat.id
              ).length;
              
              if (testsInCategory === 0) return null;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === cat.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  <span className="flex-1">{cat.name}</span>
                  <span className="text-xs text-slate-500">{testsInCategory}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tests List */}
        <div className="flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tests, codes, or biomarkers..."
              value={testSearchQuery}
              onChange={(e) => setTestSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
            {filteredTests.map((test) => {
              const isSelected = selectedTests.some(t => t.id === test.id);
              
              return (
                <div
                  key={test.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-semibold">{test.name}</h4>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded font-mono">
                          {test.code}
                        </span>
                        {test.fastingRequired && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                            Fasting
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{test.description}</p>
                      
                      {test.biomarkers && test.biomarkers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {test.biomarkers.slice(0, 6).map((marker, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded">
                              {marker}
                            </span>
                          ))}
                          {test.biomarkers.length > 6 && (
                            <span className="px-2 py-0.5 bg-slate-700/50 text-slate-500 text-xs rounded">
                              +{test.biomarkers.length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {test.turnaroundTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {test.sampleType.join(', ')}
                        </span>
                        {test.price && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <DollarSign className="w-3 h-3" />
                            {test.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTest(test)}
                      className={`ml-4 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTests.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tests found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Tests Summary */}
      {selectedTests.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Selected Tests ({selectedTests.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedTests.map((test) => (
              <span
                key={test.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm"
              >
                {test.name}
                <button
                  onClick={() => toggleTest(test)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('lab')}
          className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
        >
          Back to Labs
        </button>
        <button
          onClick={() => setCurrentStep('diagnosis')}
          disabled={selectedTests.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Diagnosis
        </button>
      </div>
    </div>
  );

  // Render diagnosis step
  const renderDiagnosisStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Add Diagnosis Codes</h2>
        <p className="text-slate-400">Select ICD-10 codes to support medical necessity</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search diagnosis codes..."
          value={diagnosisSearchQuery}
          onChange={(e) => setDiagnosisSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Selected Diagnoses */}
      {selectedDiagnoses.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <h3 className="text-emerald-400 font-semibold mb-3">Selected Diagnoses ({selectedDiagnoses.length})</h3>
          <div className="space-y-2">
            {selectedDiagnoses.map((dx) => (
              <div
                key={dx.code}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded font-mono text-sm">
                    {dx.code}
                  </span>
                  <span className="text-white">{dx.description}</span>
                </div>
                <button
                  onClick={() => toggleDiagnosis(dx)}
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosis List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
        {filteredDiagnoses.map((dx) => {
          const isSelected = selectedDiagnoses.some(d => d.code === dx.code);
          
          return (
            <button
              key={dx.code}
              onClick={() => toggleDiagnosis(dx)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded font-mono text-sm ${
                  isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                }`}>
                  {dx.code}
                </span>
                <span className={isSelected ? 'text-white' : 'text-slate-300'}>{dx.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Order Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Urgency</label>
          <div className="flex gap-2">
            {(['routine', 'urgent', 'stat'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUrgency(u)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  urgency === u
                    ? u === 'stat' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' :
                      u === 'urgent' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-sm mb-2 block">Special Instructions</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special instructions for the lab..."
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-20"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('tests')}
          className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
        >
          Back to Tests
        </button>
        <button
          onClick={() => setCurrentStep('review')}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
        >
          Review Order
        </button>
      </div>
    </div>
  );

  // Render review step
  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Review Lab Order</h2>
        <p className="text-slate-400">Please review the order details before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Name</p>
                <p className="text-white font-medium">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">MRN</p>
                <p className="text-white font-medium">{selectedPatient?.medicalRecordNumber}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Date of Birth</p>
                <p className="text-white font-medium">{selectedPatient?.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Gender</p>
                <p className="text-white font-medium capitalize">{selectedPatient?.gender}</p>
              </div>
            </div>
          </div>

          {/* Lab Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Laboratory
            </h3>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedLabCompany?.type === 'major' ? 'bg-blue-500/20 text-blue-400' :
                selectedLabCompany?.type === 'functional' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-medium">{selectedLabCompany?.name}</p>
                <p className="text-slate-400 text-sm">{selectedLabCompany?.type.toUpperCase()} LAB</p>
              </div>
            </div>
          </div>

          {/* Tests */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              Ordered Tests ({selectedTests.length})
            </h3>
            <div className="space-y-3">
              {selectedTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{test.name}</p>
                    <p className="text-slate-500 text-sm">{test.code} • {test.sampleType.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    {test.price && <p className="text-emerald-400 font-medium">${test.price}</p>}
                    <p className="text-slate-500 text-sm">{test.turnaroundTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnoses */}
          {selectedDiagnoses.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Diagnosis Codes
              </h3>
              <div className="space-y-2">
                {selectedDiagnoses.map((dx) => (
                  <div key={dx.code} className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded font-mono text-sm">
                      {dx.code}
                    </span>
                    <span className="text-slate-300">{dx.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Order Notes</h3>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Add any additional notes for this order..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-24"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-xl p-6 sticky top-6">
            <h3 className="text-white font-bold text-lg mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tests</span>
                <span className="text-white font-medium">{selectedTests.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Urgency</span>
                <span className={`px-2 py-0.5 rounded text-sm ${
                  urgency === 'stat' ? 'bg-rose-500/20 text-rose-400' :
                  urgency === 'urgent' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {urgency.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Est. Turnaround</span>
                <span className="text-white">{longestTurnaround}+ days</span>
              </div>
              {requiresFasting && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 text-sm">Fasting Required</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Estimated Total</span>
                  <span className="text-emerald-400 font-bold text-2xl">${totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={submitOrder}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all font-medium"
              >
                <Send className="w-5 h-5" />
                Submit Order
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save as Draft
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <Printer className="w-5 h-5" />
                Print Requisition
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('diagnosis')}
          className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
        >
          Back to Diagnosis
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-cyan-400" />
            Laboratory Order Form
          </h1>
          <p className="text-slate-400 mt-1">Order tests from major labs, functional medicine labs, and specialty laboratories</p>
        </div>
        <button
          onClick={() => setShowOrderHistory(!showOrderHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <History className="w-5 h-5" />
          Order History
          {savedOrders.length > 0 && (
            <span className="w-5 h-5 bg-cyan-500 text-white text-xs rounded-full flex items-center justify-center">
              {savedOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Order History Modal */}
      {showOrderHistory && savedOrders.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {savedOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{order.patientName}</p>
                  <p className="text-slate-500 text-sm">{order.labCompanyName} • {order.tests.length} tests</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                  <p className="text-slate-500 text-sm mt-1">{order.requisitionNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
        {currentStep === 'patient' && renderPatientStep()}
        {currentStep === 'lab' && renderLabStep()}
        {currentStep === 'tests' && renderTestsStep()}
        {currentStep === 'diagnosis' && renderDiagnosisStep()}
        {currentStep === 'review' && renderReviewStep()}
      </div>
    </div>
  );
};

export default LabOrderForm;
