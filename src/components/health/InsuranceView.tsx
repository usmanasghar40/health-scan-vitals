import React, { useState, useRef } from 'react';
import { 
  Shield, CreditCard, Upload, Camera, X, CheckCircle, 
  AlertCircle, Edit3, Save, Trash2, Plus, Eye, Download,
  Building2, FileText, Calendar, User, Phone, Loader2
} from 'lucide-react';

export interface InsuranceInfo {
  id: string;
  type: 'primary' | 'secondary' | 'tertiary';
  providerName: string;
  planName: string;
  policyNumber: string;
  groupNumber: string;
  memberId: string;
  subscriberName: string;
  subscriberDOB: string;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: string;
  terminationDate?: string;
  copay?: string;
  deductible?: string;
  coinsurance?: string;
  phoneNumber: string;
  claimsAddress?: string;
  frontCardImage?: string;
  backCardImage?: string;
  isVerified: boolean;
  lastUpdated: Date;
}

interface InsuranceViewProps {
  onInsuranceUpdate?: (insurance: InsuranceInfo[]) => void;
}

const InsuranceView: React.FC<InsuranceViewProps> = ({ onInsuranceUpdate }) => {
  const [insuranceList, setInsuranceList] = useState<InsuranceInfo[]>([
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
      claimsAddress: 'P.O. Box 12345, Chicago, IL 60601',
      isVerified: true,
      lastUpdated: new Date()
    }
  ]);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCardType, setUploadingCardType] = useState<'front' | 'back' | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  const [viewingCard, setViewingCard] = useState<{ type: 'front' | 'back'; image: string } | null>(null);
  
  const frontCardInputRef = useRef<HTMLInputElement>(null);
  const backCardInputRef = useRef<HTMLInputElement>(null);

  const [newInsurance, setNewInsurance] = useState<Partial<InsuranceInfo>>({
    type: 'primary',
    relationship: 'self',
    isVerified: false
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    cardType: 'front' | 'back',
    insuranceId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadingCardType(cardType);

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        setInsuranceList(prev => prev.map(ins => {
          if (ins.id === insuranceId) {
            return {
              ...ins,
              [cardType === 'front' ? 'frontCardImage' : 'backCardImage']: base64,
              lastUpdated: new Date()
            };
          }
          return ins;
        }));
        
        setIsUploading(false);
        setUploadingCardType(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
      setUploadingCardType(null);
    }
  };

  const handleAddInsurance = () => {
    if (!newInsurance.providerName || !newInsurance.policyNumber) return;

    const insurance: InsuranceInfo = {
      id: `ins-${Date.now()}`,
      type: newInsurance.type || 'primary',
      providerName: newInsurance.providerName || '',
      planName: newInsurance.planName || '',
      policyNumber: newInsurance.policyNumber || '',
      groupNumber: newInsurance.groupNumber || '',
      memberId: newInsurance.memberId || '',
      subscriberName: newInsurance.subscriberName || '',
      subscriberDOB: newInsurance.subscriberDOB || '',
      relationship: newInsurance.relationship || 'self',
      effectiveDate: newInsurance.effectiveDate || '',
      terminationDate: newInsurance.terminationDate,
      copay: newInsurance.copay,
      deductible: newInsurance.deductible,
      coinsurance: newInsurance.coinsurance,
      phoneNumber: newInsurance.phoneNumber || '',
      claimsAddress: newInsurance.claimsAddress,
      isVerified: false,
      lastUpdated: new Date()
    };

    setInsuranceList(prev => [...prev, insurance]);
    setNewInsurance({
      type: 'secondary',
      relationship: 'self',
      isVerified: false
    });
    setShowAddForm(false);
    
    if (onInsuranceUpdate) {
      onInsuranceUpdate([...insuranceList, insurance]);
    }
  };

  const handleDeleteInsurance = (id: string) => {
    setInsuranceList(prev => prev.filter(ins => ins.id !== id));
    if (onInsuranceUpdate) {
      onInsuranceUpdate(insuranceList.filter(ins => ins.id !== id));
    }
  };

  const handleUpdateInsurance = (id: string, updates: Partial<InsuranceInfo>) => {
    setInsuranceList(prev => prev.map(ins => {
      if (ins.id === id) {
        return { ...ins, ...updates, lastUpdated: new Date() };
      }
      return ins;
    }));
  };

  const exportInsuranceForRecord = () => {
    const exportData = insuranceList.map(ins => ({
      type: ins.type,
      provider: ins.providerName,
      plan: ins.planName,
      policyNumber: ins.policyNumber,
      groupNumber: ins.groupNumber,
      memberId: ins.memberId,
      subscriberName: ins.subscriberName,
      relationship: ins.relationship,
      effectiveDate: ins.effectiveDate,
      phoneNumber: ins.phoneNumber
    }));

    return exportData;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'secondary': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'tertiary': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Insurance Information</h2>
              <p className="text-slate-300">
                Manage your health insurance details and upload insurance card images. 
                This information is included in your portable health record for easy sharing with new providers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Insurance
          </button>
        </div>
      </div>

      {/* Insurance Cards List */}
      <div className="space-y-4">
        {insuranceList.map((insurance) => (
          <div
            key={insurance.id}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
          >
            {/* Card Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(insurance.type)}`}>
                    {insurance.type.charAt(0).toUpperCase() + insurance.type.slice(1)} Insurance
                  </div>
                  {insurance.isVerified && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(isEditing === insurance.id ? null : insurance.id)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInsurance(insurance.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Insurance Details */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-6 h-6 text-cyan-400" />
                    <div>
                      <h3 className="text-xl font-semibold text-white">{insurance.providerName}</h3>
                      <p className="text-slate-400 text-sm">{insurance.planName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Policy Number</p>
                      <p className="text-white font-mono text-sm">{insurance.policyNumber}</p>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Group Number</p>
                      <p className="text-white font-mono text-sm">{insurance.groupNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Member ID</p>
                      <p className="text-white font-mono text-sm">{insurance.memberId || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Subscriber</p>
                      <p className="text-white text-sm">{insurance.subscriberName}</p>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Relationship</p>
                      <p className="text-white text-sm capitalize">{insurance.relationship}</p>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Effective Date</p>
                      <p className="text-white text-sm">{insurance.effectiveDate}</p>
                    </div>
                  </div>

                  {(insurance.copay || insurance.deductible || insurance.coinsurance) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {insurance.copay && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                          <p className="text-xs text-emerald-400 mb-1">Copay</p>
                          <p className="text-white text-sm">{insurance.copay}</p>
                        </div>
                      )}
                      {insurance.deductible && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                          <p className="text-xs text-amber-400 mb-1">Deductible</p>
                          <p className="text-white text-sm">{insurance.deductible}</p>
                        </div>
                      )}
                      {insurance.coinsurance && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-xs text-blue-400 mb-1">Coinsurance</p>
                          <p className="text-white text-sm">{insurance.coinsurance}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{insurance.phoneNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Insurance Card Images */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Insurance Card Images
                  </h4>
                  
                  {/* Front Card */}
                  <div className="relative">
                    <input
                      ref={frontCardInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'front', insurance.id)}
                      className="hidden"
                    />
                    {insurance.frontCardImage ? (
                      <div className="relative group">
                        <img
                          src={insurance.frontCardImage}
                          alt="Insurance Card Front"
                          className="w-full h-32 object-cover rounded-lg border border-slate-600"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingCard({ type: 'front', image: insurance.frontCardImage! })}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => frontCardInputRef.current?.click()}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            <Camera className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleUpdateInsurance(insurance.id, { frontCardImage: undefined })}
                            className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                          Front
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => frontCardInputRef.current?.click()}
                        disabled={isUploading && uploadingCardType === 'front'}
                        className="w-full h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all"
                      >
                        {isUploading && uploadingCardType === 'front' ? (
                          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-slate-500" />
                            <span className="text-xs text-slate-500">Upload Front</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Back Card */}
                  <div className="relative">
                    <input
                      ref={backCardInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'back', insurance.id)}
                      className="hidden"
                    />
                    {insurance.backCardImage ? (
                      <div className="relative group">
                        <img
                          src={insurance.backCardImage}
                          alt="Insurance Card Back"
                          className="w-full h-32 object-cover rounded-lg border border-slate-600"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingCard({ type: 'back', image: insurance.backCardImage! })}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => backCardInputRef.current?.click()}
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            <Camera className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleUpdateInsurance(insurance.id, { backCardImage: undefined })}
                            className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                          Back
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => backCardInputRef.current?.click()}
                        disabled={isUploading && uploadingCardType === 'back'}
                        className="w-full h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all"
                      >
                        {isUploading && uploadingCardType === 'back' ? (
                          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-slate-500" />
                            <span className="text-xs text-slate-500">Upload Back</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing === insurance.id && (
              <div className="p-6 bg-slate-900/30 border-t border-slate-700/50">
                <h4 className="text-lg font-semibold text-white mb-4">Edit Insurance Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Provider Name</label>
                    <input
                      type="text"
                      value={insurance.providerName}
                      onChange={(e) => handleUpdateInsurance(insurance.id, { providerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Plan Name</label>
                    <input
                      type="text"
                      value={insurance.planName}
                      onChange={(e) => handleUpdateInsurance(insurance.id, { planName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Policy Number</label>
                    <input
                      type="text"
                      value={insurance.policyNumber}
                      onChange={(e) => handleUpdateInsurance(insurance.id, { policyNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Group Number</label>
                    <input
                      type="text"
                      value={insurance.groupNumber}
                      onChange={(e) => handleUpdateInsurance(insurance.id, { groupNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Member ID</label>
                    <input
                      type="text"
                      value={insurance.memberId}
                      onChange={(e) => handleUpdateInsurance(insurance.id, { memberId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={insurance.phoneNumber}
                      onChange={(e) => handleUpdateInsurance(insurance.id, { phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setIsEditing(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Insurance Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Add Insurance</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Insurance Type *</label>
                  <select
                    value={newInsurance.type}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="tertiary">Tertiary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Relationship *</label>
                  <select
                    value={newInsurance.relationship}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, relationship: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="self">Self</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Insurance Provider *</label>
                  <input
                    type="text"
                    value={newInsurance.providerName || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, providerName: e.target.value }))}
                    placeholder="e.g., Blue Cross Blue Shield"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={newInsurance.planName || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, planName: e.target.value }))}
                    placeholder="e.g., PPO Gold Plan"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Policy Number *</label>
                  <input
                    type="text"
                    value={newInsurance.policyNumber || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, policyNumber: e.target.value }))}
                    placeholder="Policy #"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Group Number</label>
                  <input
                    type="text"
                    value={newInsurance.groupNumber || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, groupNumber: e.target.value }))}
                    placeholder="Group #"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Member ID</label>
                  <input
                    type="text"
                    value={newInsurance.memberId || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, memberId: e.target.value }))}
                    placeholder="Member ID"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Subscriber Name</label>
                  <input
                    type="text"
                    value={newInsurance.subscriberName || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, subscriberName: e.target.value }))}
                    placeholder="Full name on card"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Subscriber DOB</label>
                  <input
                    type="date"
                    value={newInsurance.subscriberDOB || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, subscriberDOB: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={newInsurance.effectiveDate || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newInsurance.phoneNumber || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="1-800-XXX-XXXX"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Copay</label>
                  <input
                    type="text"
                    value={newInsurance.copay || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, copay: e.target.value }))}
                    placeholder="$25 PCP"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Deductible</label>
                  <input
                    type="text"
                    value={newInsurance.deductible || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, deductible: e.target.value }))}
                    placeholder="$500"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Coinsurance</label>
                  <input
                    type="text"
                    value={newInsurance.coinsurance || ''}
                    onChange={(e) => setNewInsurance(prev => ({ ...prev, coinsurance: e.target.value }))}
                    placeholder="80/20"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInsurance}
                disabled={!newInsurance.providerName || !newInsurance.policyNumber}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Insurance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingCard && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingCard(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setViewingCard(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={viewingCard.image}
              alt={`Insurance Card ${viewingCard.type}`}
              className="w-full h-auto rounded-lg"
            />
            <p className="text-center text-white mt-4 capitalize">
              {viewingCard.type} of Insurance Card
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">Portable Health Record</h4>
            <p className="text-slate-400 text-sm">
              Your insurance information is automatically included when you export your portable health record. 
              This makes it easy to share with new healthcare providers, ensuring they have all the information 
              needed for billing and coverage verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceView;
