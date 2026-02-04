import React, { useEffect, useState, useRef } from 'react';
import { 
  Upload, FileText, Link2, CheckCircle, AlertCircle, Clock, 
  Building2, Stethoscope, TestTube, Pill, X, ChevronRight,
  Shield, Lock, RefreshCw, Download, Eye, Loader2, Sparkles,
  FileUp, Zap, ExternalLink, Key, Trash2
} from 'lucide-react';
import { EHRSource, ImportSession, ImportedLabResult, LabInterpretation } from '@/types/health';
import LabInterpretationPanel from './LabInterpretationPanel';
import { apiDelete, invokeFunction } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { getLabResults, saveMultipleLabResults } from '@/lib/healthDatabase';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

const ehrSources: EHRSource[] = [
  { id: 'epic', name: 'Epic MyChart', type: 'ehr', connected: false },
  { id: 'cerner', name: 'Cerner Health', type: 'ehr', connected: false },
  { id: 'allscripts', name: 'Allscripts', type: 'ehr', connected: false },
  { id: 'meditech', name: 'MEDITECH', type: 'ehr', connected: false },
  { id: 'athena', name: 'athenahealth', type: 'ehr', connected: false },
  { id: 'nextgen', name: 'NextGen Healthcare', type: 'ehr', connected: false },
];

const labSources: EHRSource[] = [
  { id: 'labcorp', name: 'LabCorp', type: 'lab', connected: false },
  { id: 'quest', name: 'Quest Diagnostics', type: 'lab', connected: false },
  { id: 'bioreference', name: 'BioReference', type: 'lab', connected: false },
  { id: 'sonora', name: 'Sonora Quest', type: 'lab', connected: false },
  { id: 'mayo', name: 'Mayo Clinic Labs', type: 'lab', connected: false },
  { id: 'arup', name: 'ARUP Laboratories', type: 'lab', connected: false },
];

interface ParsedLabResult {
  id?: string;
  name: string;
  value: number | string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  category: string;
}

interface AIInterpretation {
  overallSummary: string;
  urgencyLevel: 'routine' | 'monitor' | 'urgent' | 'critical';
  interpretations: {
    testName: string;
    interpretation: string;
    clinicalSignificance: string;
    recommendations: string[];
    followUpRequired: boolean;
    followUpTimeframe?: string;
    relatedConditions: string[];
    lifestyleFactors: string[];
  }[];
  generalRecommendations: string[];
  warningFlags: string[];
}

const ImportView: React.FC = () => {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<'connect' | 'upload' | 'manual' | 'history'>('connect');
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New states for lab parsing
  const [parsedResults, setParsedResults] = useState<ParsedLabResult[]>([]);
  const [savedResults, setSavedResults] = useState<ParsedLabResult[]>([]);
  const [aiInterpretation, setAiInterpretation] = useState<AIInterpretation | null>(null);
  const [isParsingPDF, setIsParsingPDF] = useState(false);
  const [isInterpretingResults, setIsInterpretingResults] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [labCredentials, setLabCredentials] = useState<{ username: string; password: string }>({ username: '', password: '' });
  const [showCredentialsModal, setShowCredentialsModal] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedResults = async () => {
      if (!currentUser?.id) {
        setSavedResults([]);
        return;
      }
      try {
        const data = await getLabResults(currentUser.id, undefined, 200);
        const mapped = (Array.isArray(data) ? data : []).map((result: any) => ({
          id: result.id,
          name: result.test_name,
          value: result.test_value,
          unit: result.unit,
          normalRange: result.normal_range,
          status: result.status,
          category: result.category
        }));
        setSavedResults(mapped);
      } catch (err) {
        console.error('Failed to load saved lab results:', err);
      }
    };

    loadSavedResults();
  }, [currentUser?.id]);

  const handleConnect = async (sourceId: string) => {
    // For lab portals, show credentials modal
    if (labSources.find(s => s.id === sourceId)) {
      setShowCredentialsModal(sourceId);
      return;
    }
    
    setIsConnecting(sourceId);
    // Simulate OAuth connection for EHR
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectedSources(prev => [...prev, sourceId]);
    setIsConnecting(null);
  };

  const handleLabPortalConnect = async (sourceId: string) => {
    setShowCredentialsModal(null);
    setIsConnecting(sourceId);
    
    try {
      const { data, error } = await invokeFunction('lab-interpreter', {
        action: 'connect_lab_portal',
        provider: sourceId,
        credentials: labCredentials
      });

      if (error) throw error;

      if (data.success) {
        setConnectedSources(prev => [...prev, sourceId]);
        
        // Convert results to ImportedLabResult format
        const importedResults: ImportedLabResult[] = data.results.map((r: any, idx: number) => ({
          id: `${sourceId}-${idx}-${Date.now()}`,
          name: r.name,
          value: typeof r.value === 'number' ? r.value : parseFloat(r.value) || 0,
          unit: r.unit,
          status: r.status,
          normalRange: r.normalRange,
          category: r.category,
          description: '',
          source: sourceId,
          importDate: new Date(),
          collectionDate: new Date(),
          urgency: r.status === 'critical' ? 'critical' : r.status === 'high' || r.status === 'low' ? 'urgent' : 'routine'
        }));

        // Create import session
        const session: ImportSession = {
          id: `session-${Date.now()}`,
          source: sourceId,
          importDate: new Date(),
          totalTests: importedResults.length,
          normalResults: importedResults.filter(r => r.status === 'normal').length,
          abnormalResults: importedResults.filter(r => r.status === 'high' || r.status === 'low').length,
          criticalResults: importedResults.filter(r => r.status === 'critical').length,
          status: 'completed',
          results: importedResults
        };

        setImportSessions(prev => [session, ...prev]);
        setParsedResults(data.results);
        await persistLabResults(data.results, data.parsed?.collectionDate);
        await refreshSavedResults();
        
        // Auto-interpret results
        await interpretResults(data.results, sourceId);
      } else {
        setParseError(data?.error || 'Lab portal integration is not available.');
      }
    } catch (error: any) {
      console.error('Lab portal connection error:', error);
      setParseError(error.message || 'Failed to connect to lab portal');
    } finally {
      setIsConnecting(null);
      setLabCredentials({ username: '', password: '' });
    }
  };

  const handleDisconnect = (sourceId: string) => {
    setConnectedSources(prev => prev.filter(id => id !== sourceId));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    
    // Process PDF files
    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        await processPDFFile(file);
      }
    }
  };

  const processPDFFile = async (file: File) => {
    setIsParsingPDF(true);
    setParseError(null);
    
    try {
      // Read file as text (for PDFs with embedded text)
      // In production, you'd use a PDF parsing library or OCR service
      const text = await extractTextFromPDF(file);
      
      if (!text || text.trim().length < 50) {
        throw new Error('Could not extract text from PDF. If this is a scanned image, enable OCR or upload a text-based PDF.');
      }

      const { data, error } = await invokeFunction('lab-interpreter', {
        action: 'parse_lab_text',
        labText: text
      });

      if (error) throw error;

      if (data.success && data.parsed) {
        const results = data.parsed.results || [];
        setParsedResults(results);
        await persistLabResults(results, data.parsed?.collectionDate);
        await refreshSavedResults();
        
        // Convert to ImportedLabResult format
        const importedResults: ImportedLabResult[] = results.map((r: any, idx: number) => ({
          id: `pdf-${idx}-${Date.now()}`,
          name: r.name,
          value: typeof r.value === 'number' ? r.value : parseFloat(r.value) || 0,
          unit: r.unit,
          status: r.status,
          normalRange: r.normalRange,
          category: r.category,
          description: '',
          source: file.name,
          importDate: new Date(),
          collectionDate: data.parsed.collectionDate ? new Date(data.parsed.collectionDate) : new Date(),
          labFacility: data.parsed.labFacility,
          orderingProvider: data.parsed.orderingProvider,
          urgency: r.status === 'critical' ? 'critical' : r.status === 'high' || r.status === 'low' ? 'urgent' : 'routine'
        }));

        // Create import session
        const session: ImportSession = {
          id: `session-${Date.now()}`,
          source: file.name,
          importDate: new Date(),
          totalTests: importedResults.length,
          normalResults: importedResults.filter(r => r.status === 'normal').length,
          abnormalResults: importedResults.filter(r => r.status === 'high' || r.status === 'low').length,
          criticalResults: importedResults.filter(r => r.status === 'critical').length,
          status: 'completed',
          results: importedResults
        };

        setImportSessions(prev => [session, ...prev]);
        
        // Auto-interpret results
        if (results.length > 0) {
          await interpretResults(results, file.name);
        }
      } else {
        setParseError(data?.error || 'Unable to parse lab results from this PDF.');
      }
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      setParseError(error.message || 'Failed to parse PDF file');
    } finally {
      setIsParsingPDF(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str || '')
        .join(' ')
        .trim();
      if (pageText) {
        text += `${pageText}\n`;
      }
    }

    return text.trim();
  };

  const interpretResults = async (results: ParsedLabResult[], source: string) => {
    setIsInterpretingResults(true);
    
    try {
      const { data, error } = await invokeFunction('lab-interpreter', {
        action: 'interpret_results',
        labResults: results,
        source
      });

      if (error) throw error;

      if (data?.success && data?.interpretation) {
        setAiInterpretation(data.interpretation);
      }
    } catch (error: any) {
      console.error('Interpretation error:', error);
    } finally {
      setIsInterpretingResults(false);
    }
  };

  const refreshSavedResults = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await getLabResults(currentUser.id, undefined, 200);
      const mapped = (Array.isArray(data) ? data : []).map((result: any) => ({
        id: result.id,
        name: result.test_name,
        value: result.test_value,
        unit: result.unit,
        normalRange: result.normal_range,
        status: result.status,
        category: result.category
      }));
      setSavedResults(mapped);
    } catch (err) {
      console.error('Failed to refresh saved lab results:', err);
    }
  };


  const persistLabResults = async (results: ParsedLabResult[], collectionDate?: string) => {
    if (!currentUser?.id) {
      setParseError('Please sign in to save lab results to your profile.');
      return;
    }

    const testDate = collectionDate
      ? new Date(collectionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const payload = results.map(result => ({
      user_id: currentUser.id,
      test_date: testDate,
      test_name: result.name,
      test_value: typeof result.value === 'number' ? result.value : parseFloat(String(result.value)) || 0,
      unit: result.unit,
      category: result.category,
      status: result.status,
      normal_range: result.normalRange
    }));

    try {
      const saved = await saveMultipleLabResults(payload);
      const mapped = (Array.isArray(saved) ? saved : []).map((result: any) => ({
        id: result.id,
        name: result.test_name,
        value: result.test_value,
        unit: result.unit,
        normalRange: result.normal_range,
        status: result.status,
        category: result.category
      }));
      if (mapped.length > 0) {
        setParsedResults(mapped);
      }
      await refreshSavedResults();
    } catch (err) {
      console.error('Failed to save lab results:', err);
      setParseError('Unable to save lab results. Please try again.');
    }
  };

  const handleDeleteLab = async (resultId?: string) => {
    if (!resultId) return;
    try {
      await apiDelete(`/labs/${resultId}`);
      setParsedResults(prev => prev.filter(r => r.id !== resultId));
      setSavedResults(prev => prev.filter(r => r.id !== resultId));
    } catch (err) {
      console.error('Failed to delete lab result:', err);
      setParseError('Unable to delete lab result.');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-emerald-400 bg-emerald-500/20';
      case 'low': return 'text-amber-400 bg-amber-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'critical': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'monitor': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'urgent': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-violet-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Upload className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Import Lab Results</h2>
            <p className="text-slate-300">
              Connect to major lab portals (Quest, LabCorp) or upload PDF lab reports. 
              Our AI will parse your results and provide personalized interpretations.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { id: 'connect', label: 'Connect Labs', icon: Link2 },
          { id: 'upload', label: 'Upload PDF', icon: FileUp },
          { id: 'history', label: 'Import History', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {parseError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error Processing Lab Results</p>
              <p className="text-red-300/70 text-sm mt-1">{parseError}</p>
            </div>
            <button
              onClick={() => setParseError(null)}
              className="ml-auto p-1 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Connect Labs Tab */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          {/* Lab Portals */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-violet-400" />
              Laboratory Portals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labSources.map(source => {
                const isConnected = connectedSources.includes(source.id);
                const isLoading = isConnecting === source.id;
                
                return (
                  <div
                    key={source.id}
                    className={`bg-slate-800/50 border rounded-xl p-4 transition-all ${
                      isConnected ? 'border-emerald-500/50' : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isConnected ? 'bg-emerald-500/20' : 'bg-slate-700'
                        }`}>
                          <TestTube className={`w-5 h-5 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{source.name}</h4>
                          <p className="text-xs text-slate-500">Laboratory</p>
                        </div>
                      </div>
                      {isConnected && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    
                    {isConnected ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConnect(source.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors text-sm"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Sync
                        </button>
                        <button
                          onClick={() => handleDisconnect(source.id)}
                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(source.id)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Connect
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* EHR Systems */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Electronic Health Records
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ehrSources.map(source => {
                const isConnected = connectedSources.includes(source.id);
                const isLoading = isConnecting === source.id;
                
                return (
                  <div
                    key={source.id}
                    className={`bg-slate-800/50 border rounded-xl p-4 transition-all ${
                      isConnected ? 'border-emerald-500/50' : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isConnected ? 'bg-emerald-500/20' : 'bg-slate-700'
                        }`}>
                          <Building2 className={`w-5 h-5 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{source.name}</h4>
                          <p className="text-xs text-slate-500">EHR System</p>
                        </div>
                      </div>
                      {isConnected && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleConnect(source.id)}
                      disabled={isLoading || isConnected}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isConnected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500 text-white hover:bg-cyan-600'
                      } disabled:opacity-50`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : isConnected ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload PDF Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-violet-500/50 hover:bg-slate-800/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
                <FileUp className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">Upload Lab Report PDF</p>
                <p className="text-slate-400 text-sm">
                  Drag and drop or click to select PDF files from Quest, LabCorp, or other labs
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="w-4 h-4" />
                Your data is encrypted and HIPAA compliant
              </div>
            </div>
          </div>

          {/* Processing Indicator */}
          {isParsingPDF && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <div>
                  <p className="text-white font-medium">Processing Lab Report...</p>
                  <p className="text-slate-400 text-sm">Extracting lab values and analyzing results</p>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-medium">Uploaded Files</h4>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-violet-400" />
                    <div>
                      <p className="text-white text-sm">{file.name}</p>
                      <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {importSessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No import history yet</p>
              <p className="text-slate-500 text-sm">Connect to a lab portal or upload a PDF to get started</p>
            </div>
          ) : (
            importSessions.map(session => (
              <div
                key={session.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <TestTube className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium capitalize">{session.source}</h4>
                      <p className="text-xs text-slate-500">
                        {new Date(session.importDate).toLocaleDateString()} at{' '}
                        {new Date(session.importDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    session.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {session.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{session.totalTests}</p>
                    <p className="text-xs text-slate-500">Total Tests</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{session.normalResults}</p>
                    <p className="text-xs text-slate-500">Normal</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">{session.abnormalResults}</p>
                    <p className="text-xs text-slate-500">Abnormal</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{session.criticalResults}</p>
                    <p className="text-xs text-slate-500">Critical</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSession(session)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Results
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Parsed Results Display */}
      {(parsedResults.length > 0 || savedResults.length > 0) && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TestTube className="w-5 h-5 text-violet-400" />
              Parsed Lab Results ({parsedResults.length > 0 ? parsedResults.length : savedResults.length} tests)
            </h3>
            {!aiInterpretation && !isInterpretingResults && (
              <button
                onClick={() => interpretResults(parsedResults.length > 0 ? parsedResults : savedResults, 'stored')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Get AI Interpretation
              </button>
            )}
          </div>
          
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm">
                    <th className="pb-3 pr-4">Test Name</th>
                    <th className="pb-3 pr-4">Result</th>
                    <th className="pb-3 pr-4">Reference Range</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {(parsedResults.length > 0 ? parsedResults : savedResults).map((result, index) => (
                    <tr key={index} className="text-sm">
                      <td className="py-3 pr-4 text-white font-medium">{result.name}</td>
                      <td className="py-3 pr-4 text-white font-mono">
                        {result.value} {result.unit}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{result.normalRange}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{result.category}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteLab(result.id)}
                          disabled={!result.id}
                          className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                            result.id
                              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI Interpretation */}
      {isInterpretingResults && (
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-violet-400" />
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin absolute -bottom-1 -right-1" />
            </div>
            <div>
              <p className="text-white font-medium">AI Analyzing Results...</p>
              <p className="text-slate-400 text-sm">Generating personalized interpretation and recommendations</p>
            </div>
          </div>
        </div>
      )}

      {aiInterpretation && (
        <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-violet-500/20 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              AI-Powered Interpretation
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(aiInterpretation.urgencyLevel)}`}>
              {aiInterpretation.urgencyLevel.toUpperCase()}
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Overall Summary */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">Overall Summary</h4>
              <p className="text-slate-300">{aiInterpretation.overallSummary}</p>
            </div>

            {/* Warning Flags */}
            {aiInterpretation.warningFlags && aiInterpretation.warningFlags.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Important Findings
                </h4>
                <ul className="space-y-2">
                  {aiInterpretation.warningFlags.map((flag, index) => (
                    <li key={index} className="text-red-300 text-sm flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Individual Interpretations */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Detailed Analysis</h4>
              {aiInterpretation.interpretations.map((interp, index) => (
                <div key={index} className="bg-slate-800/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-white font-medium">{interp.testName}</h5>
                    {interp.followUpRequired && (
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                        Follow-up: {interp.followUpTimeframe}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{interp.interpretation}</p>
                  
                  {interp.clinicalSignificance && (
                    <div className="mb-3">
                      <p className="text-slate-400 text-xs mb-1">Clinical Significance:</p>
                      <p className="text-slate-300 text-sm">{interp.clinicalSignificance}</p>
                    </div>
                  )}
                  
                  {interp.recommendations && interp.recommendations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-slate-400 text-xs mb-1">Recommendations:</p>
                      <ul className="space-y-1">
                        {interp.recommendations.map((rec, i) => (
                          <li key={i} className="text-emerald-400 text-sm flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {interp.lifestyleFactors && interp.lifestyleFactors.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Lifestyle Factors:</p>
                      <div className="flex flex-wrap gap-2">
                        {interp.lifestyleFactors.map((factor, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* General Recommendations */}
            {aiInterpretation.generalRecommendations && aiInterpretation.generalRecommendations.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <h4 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  General Recommendations
                </h4>
                <ul className="space-y-2">
                  {aiInterpretation.generalRecommendations.map((rec, index) => (
                    <li key={index} className="text-emerald-300 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-slate-800/30 rounded-lg p-3 text-xs text-slate-500">
              <p>
                <strong>Disclaimer:</strong> This AI-generated interpretation is for informational purposes only 
                and should not replace professional medical advice. Always consult with your healthcare provider 
                about your lab results and any health concerns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lab Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-violet-400" />
                  Connect to {labSources.find(s => s.id === showCredentialsModal)?.name}
                </h3>
                <button
                  onClick={() => setShowCredentialsModal(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-400 text-sm">
                Enter your {labSources.find(s => s.id === showCredentialsModal)?.name} patient portal credentials 
                to securely import your lab results.
              </p>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={labCredentials.username}
                  onChange={(e) => setLabCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={labCredentials.password}
                  onChange={(e) => setLabCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-4 h-4" />
                Your credentials are encrypted and never stored
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCredentialsModal(null)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLabPortalConnect(showCredentialsModal)}
                disabled={!labCredentials.username || !labCredentials.password}
                className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Session Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  Import Results - {selectedSession.source}
                </h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm">
                      <th className="pb-3 pr-4">Test Name</th>
                      <th className="pb-3 pr-4">Result</th>
                      <th className="pb-3 pr-4">Reference Range</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {selectedSession.results.map((result, index) => (
                      <tr key={index} className="text-sm">
                        <td className="py-3 pr-4 text-white font-medium">{result.name}</td>
                        <td className="py-3 pr-4 text-white font-mono">
                          {result.value} {result.unit}
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{result.normalRange}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{result.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportView;
