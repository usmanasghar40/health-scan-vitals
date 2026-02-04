import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { apiGet, invokeFunction } from '@/lib/api';
import { 
  Users, Search, Plus, X, Pill, Calendar, Clock, 
  ChevronRight, AlertCircle, Check, Trash2, Edit2, User
} from 'lucide-react';

interface Patient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile?: {
    date_of_birth?: string;
    gender?: string;
    blood_type?: string;
    allergies?: string[];
    conditions?: string[];
  };
}

interface Medication {
  id: string;
  patient_id: string;
  provider_id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  provider_first_name?: string;
  provider_last_name?: string;
  provider_specialty?: string;
}

interface LabResult {
  id: string;
  user_id: string;
  test_date: string;
  test_name: string;
  test_value: number;
  unit: string;
  category: string;
  status: string;
  normal_range: string;
}

const MyPatientsView: React.FC = () => {
  const { currentUser } = useUser();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [medicationForm, setMedicationForm] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    instructions: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadPatients();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientMedications(selectedPatient.id);
      loadPatientLabs(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const { data, error } = await invokeFunction('user-management', {
        action: 'getProviderPatients', data: { providerId: currentUser.id }
      });

      if (!error && data?.success) {
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Error loading patients:', err);
    }
    setLoading(false);
  };

  const loadPatientMedications = async (patientId: string) => {
    if (!currentUser) return;

    setLoadingMedications(true);
    try {
      const { data, error } = await invokeFunction('user-management', {
        action: 'getPatientMedicationsAll', 
        data: { patientId } 
      });

      if (!error && data?.success) {
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error('Error loading medications:', err);
    }
    setLoadingMedications(false);
  };

  const loadPatientLabs = async (patientId: string) => {
    setLoadingLabs(true);
    try {
      const data = await apiGet(`/labs?userId=${patientId}&limit=50`);
      setLabResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading lab results:', err);
    }
    setLoadingLabs(false);
  };

  const handleAddMedication = async () => {
    if (!currentUser || !selectedPatient || !medicationForm.medicationName.trim()) {
      setError('Please enter a medication name');
      return;
    }

    setError(null);
    try {
      const { data, error } = await invokeFunction('user-management', {
        action: 'addMedication',
        data: {
          patientId: selectedPatient.id,
          providerId: currentUser.id,
          medicationName: medicationForm.medicationName.trim(),
          dosage: medicationForm.dosage || null,
          frequency: medicationForm.frequency || null,
          startDate: medicationForm.startDate || null,
          endDate: medicationForm.endDate || null,
          instructions: medicationForm.instructions || null
        }
      });

      if (!error && data?.success) {
        setSuccess('Medication added successfully');
        setShowAddMedication(false);
        resetForm();
        loadPatientMedications(selectedPatient.id);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data?.error || 'Failed to add medication');
      }
    } catch (err) {
      setError('Failed to add medication');
    }
  };

  const handleUpdateMedication = async () => {
    if (!editingMedication || !medicationForm.medicationName.trim()) {
      setError('Please enter a medication name');
      return;
    }

    setError(null);
    try {
      const { data, error } = await invokeFunction('user-management', {
        action: 'updateMedication',
        data: {
          medicationId: editingMedication.id,
          updates: {
            medication_name: medicationForm.medicationName.trim(),
            dosage: medicationForm.dosage || null,
            frequency: medicationForm.frequency || null,
            start_date: medicationForm.startDate || null,
            end_date: medicationForm.endDate || null,
            instructions: medicationForm.instructions || null
          }
        }
      });

      if (!error && data?.success) {
        setSuccess('Medication updated successfully');
        setEditingMedication(null);
        resetForm();
        if (selectedPatient) {
          loadPatientMedications(selectedPatient.id);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data?.error || 'Failed to update medication');
      }
    } catch (err) {
      setError('Failed to update medication');
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    try {
      const { data, error } = await invokeFunction('user-management', {
        action: 'deleteMedication', data: { medicationId }
      });

      if (!error && data?.success) {
        setSuccess('Medication deleted');
        if (selectedPatient) {
          loadPatientMedications(selectedPatient.id);
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to delete medication');
    }
  };

  const handleToggleMedicationStatus = async (medication: Medication) => {
    try {
      const { data, error } = await invokeFunction('user-management', {
        action: 'updateMedication',
        data: {
          medicationId: medication.id,
          updates: { is_active: !medication.is_active }
        }
      });

      if (!error && data?.success) {
        if (selectedPatient) {
          loadPatientMedications(selectedPatient.id);
        }
      }
    } catch (err) {
      console.error('Error toggling medication status:', err);
    }
  };

  const startEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setMedicationForm({
      medicationName: medication.medication_name,
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      startDate: medication.start_date || '',
      endDate: medication.end_date || '',
      instructions: medication.instructions || ''
    });
  };

  const resetForm = () => {
    setMedicationForm({
      medicationName: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      instructions: ''
    });
    setError(null);
  };

  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true;
    const name = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || patient.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLabStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-emerald-400 bg-emerald-500/20';
      case 'low': return 'text-amber-400 bg-amber-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'critical': return 'text-rose-400 bg-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sign in Required</h3>
          <p className="text-slate-400">Please sign in to view your patients</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Patients</h1>
          <p className="text-slate-400 mt-1">Manage your patients and their medications</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold mb-3">Patients ({patients.length})</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">No patients found</p>
                <p className="text-sm text-slate-500 mt-1">Patients will appear here after they book appointments with you</p>
              </div>
            ) : (
              filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 ${
                    selectedPatient?.id === patient.id ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{patient.first_name} {patient.last_name}</p>
                    <p className="text-sm text-slate-400 truncate">{patient.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Patient Details & Medications */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <>
              {/* Patient Info Card */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h2>
                    <p className="text-slate-400">{selectedPatient.email}</p>
                    {selectedPatient.phone && (
                      <p className="text-slate-400">{selectedPatient.phone}</p>
                    )}
                  </div>
                </div>

                {selectedPatient.profile && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedPatient.profile.date_of_birth && (
                      <div>
                        <p className="text-slate-500 text-sm">Date of Birth</p>
                        <p className="text-white">{formatDate(selectedPatient.profile.date_of_birth)}</p>
                      </div>
                    )}
                    {selectedPatient.profile.gender && (
                      <div>
                        <p className="text-slate-500 text-sm">Gender</p>
                        <p className="text-white capitalize">{selectedPatient.profile.gender}</p>
                      </div>
                    )}
                    {selectedPatient.profile.blood_type && (
                      <div>
                        <p className="text-slate-500 text-sm">Blood Type</p>
                        <p className="text-white">{selectedPatient.profile.blood_type}</p>
                      </div>
                    )}
                    {selectedPatient.profile.allergies && selectedPatient.profile.allergies.length > 0 && (
                      <div>
                        <p className="text-slate-500 text-sm">Allergies</p>
                        <p className="text-rose-400">{selectedPatient.profile.allergies.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Medications Section */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-white font-semibold">Medications</h3>
                  </div>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddMedication(true);
                    }}
                    className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Medication
                  </button>
                </div>

                <div className="p-4">
                  {loadingMedications ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 bg-slate-900/50 rounded-lg animate-pulse">
                          <div className="h-5 bg-slate-700 rounded w-1/3 mb-2" />
                          <div className="h-4 bg-slate-700 rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : medications.length === 0 ? (
                    <div className="text-center py-8">
                      <Pill className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No medications prescribed</p>
                      <p className="text-sm text-slate-500 mt-1">Click "Add Medication" to prescribe</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medications.map(med => (
                        <div
                          key={med.id}
                          className={`p-4 rounded-xl border transition-all ${
                            med.is_active
                              ? 'bg-slate-900/50 border-slate-700/50'
                              : 'bg-slate-900/30 border-slate-700/30 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{med.medication_name}</h4>
                                {!med.is_active && (
                                  <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">Inactive</span>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                {med.dosage && (
                                  <div className="text-slate-400">
                                    <span className="text-slate-500">Dosage:</span> {med.dosage}
                                  </div>
                                )}
                                {med.frequency && (
                                  <div className="text-slate-400">
                                    <span className="text-slate-500">Frequency:</span> {med.frequency}
                                  </div>
                                )}
                                {(med.provider_first_name || med.provider_last_name) && (
                                  <div className="text-slate-400">
                                    <span className="text-slate-500">Prescribed by:</span>{' '}
                                    Dr. {med.provider_first_name} {med.provider_last_name}
                                    {med.provider_specialty ? ` (${med.provider_specialty})` : ''}
                                  </div>
                                )}
                              </div>
                              {med.instructions && (
                                <p className="mt-2 text-sm text-slate-500">{med.instructions}</p>
                              )}
                              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                {med.start_date && (
                                  <span>Start: {formatDate(med.start_date)}</span>
                                )}
                                {med.end_date && (
                                  <span>End: {formatDate(med.end_date)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleMedicationStatus(med)}
                                className={`p-2 rounded-lg transition-colors ${
                                  med.is_active
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                }`}
                                title={med.is_active ? 'Mark as inactive' : 'Mark as active'}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEditMedication(med)}
                                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedication(med.id)}
                                className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lab Results Section */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-white font-semibold">Lab Results</h3>
                  </div>
                </div>

                <div className="p-4">
                  {loadingLabs ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 bg-slate-900/50 rounded-lg animate-pulse">
                          <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-slate-700 rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : labResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No lab results on file</p>
                      <p className="text-sm text-slate-500 mt-1">Results will appear here once available</p>
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
                              <td className="py-3 text-slate-400">{formatDate(result.test_date)}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${getLabStatusColor(result.status)}`}>
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
            </>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <User className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Patient</h3>
              <p className="text-slate-400">Choose a patient from the list to view their details and manage medications</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Medication Modal */}
      {(showAddMedication || editingMedication) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingMedication ? 'Edit Medication' : 'Add Medication'}
              </h3>
              <button
                onClick={() => {
                  setShowAddMedication(false);
                  setEditingMedication(null);
                  resetForm();
                }}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Medication Name *</label>
                <input
                  type="text"
                  value={medicationForm.medicationName}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, medicationName: e.target.value }))}
                  placeholder="e.g., Lisinopril"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Dosage</label>
                  <input
                    type="text"
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 10mg"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Frequency</label>
                  <input
                    type="text"
                    value={medicationForm.frequency}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="e.g., Once daily"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={medicationForm.startDate}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={medicationForm.endDate}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Instructions</label>
                <textarea
                  value={medicationForm.instructions}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="e.g., Take with food, avoid alcohol..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddMedication(false);
                    setEditingMedication(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingMedication ? handleUpdateMedication : handleAddMedication}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  {editingMedication ? 'Update Medication' : 'Add Medication'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPatientsView;
