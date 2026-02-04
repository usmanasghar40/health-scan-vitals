import React, { useState, useEffect } from 'react';
import ScanAnimation, { ScanResultData } from './ScanAnimation';
import { invokeFunction } from '@/lib/api';
import { Heart, Activity, Info, CheckCircle, ArrowRight, ClipboardList, TrendingUp, AlertTriangle, Clock, Database, Brain, Loader2, RefreshCw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface ScanViewProps {
  onScanComplete?: () => void;
}

interface DerivedMetrics {
  sdnn: number;
  pnn50: number;
  minIBI: number;
  maxIBI: number;
  ibiRange: number;
  totalIBIs: number;
}

const ScanView: React.FC<ScanViewProps> = ({ onScanComplete }) => {
  const [scanType, setScanType] = useState<'heart' | 'peripheral'>('heart');
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResultData | null>(null);
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [derivedMetrics, setDerivedMetrics] = useState<DerivedMetrics | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  const handleScanComplete = async (results: ScanResultData) => {
    console.log('ScanView received results:', results);
    setScanResults(results);
    setShowResults(true);
    setIsScanning(false);
    setAiAnalysis(null);
    setDerivedMetrics(null);
    setAnalysisError(null);
    
    // Automatically trigger AI analysis if scan was successful
    if (results.scanSuccessful && results.heartRate > 0) {
      await analyzeResults(results);
    }
  };

  // Calculate derived metrics locally
  const calculateDerivedMetrics = (ibis: number[]): DerivedMetrics | null => {
    if (!ibis || ibis.length < 3) return null;
    
    // SDNN - Standard Deviation of NN intervals
    const mean = ibis.reduce((a, b) => a + b, 0) / ibis.length;
    const variance = ibis.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / ibis.length;
    const sdnn = Math.round(Math.sqrt(variance));
    
    // pNN50 - Percentage of successive differences > 50ms
    let nn50Count = 0;
    for (let i = 1; i < ibis.length; i++) {
      if (Math.abs(ibis[i] - ibis[i - 1]) > 50) {
        nn50Count++;
      }
    }
    const pnn50 = Math.round((nn50Count / (ibis.length - 1)) * 100);
    
    // Min/Max IBI
    const minIBI = Math.round(Math.min(...ibis));
    const maxIBI = Math.round(Math.max(...ibis));
    
    return {
      sdnn,
      pnn50,
      minIBI,
      maxIBI,
      ibiRange: maxIBI - minIBI,
      totalIBIs: ibis.length
    };
  };

  const analyzeResults = async (results: ScanResultData) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Calculate derived metrics locally first
    const localMetrics = calculateDerivedMetrics(results.ibis);
    if (localMetrics) {
      setDerivedMetrics(localMetrics);
    }
    
    try {
      const { data, error } = await invokeFunction('analyze-heart-scan', {
        ...results,
        scanType,
        derivedMetrics: localMetrics
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setAiAnalysis(data.analysis);
        if (data.derivedMetrics) {
          setDerivedMetrics(data.derivedMetrics);
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze results');
      
      // Generate a local analysis if API fails
      if (results.heartRate > 0) {
        const localAnalysis = generateLocalAnalysis(results, localMetrics);
        setAiAnalysis(localAnalysis);
        setAnalysisError(null);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate analysis locally if API fails
  const generateLocalAnalysis = (results: ScanResultData, metrics: DerivedMetrics | null): string => {
    const { heartRate, heartRateVariability, beatsDetected, meanIBI, signalQuality } = results;
    
    let analysis = `## Heart Rate Analysis\n\n`;
    analysis += `Your heart rate was measured at **${heartRate} BPM** based on ${beatsDetected} detected heartbeats.\n\n`;
    
    // Heart rate interpretation
    if (heartRate < 60) {
      analysis += `This is considered **bradycardia** (slower than normal resting heart rate). `;
      analysis += `This can be normal for athletes or during sleep, but consult a doctor if you experience symptoms.\n\n`;
    } else if (heartRate <= 100) {
      analysis += `This is within the **normal resting heart rate range** (60-100 BPM). `;
      analysis += `A lower resting heart rate generally indicates better cardiovascular fitness.\n\n`;
    } else {
      analysis += `This is considered **tachycardia** (faster than normal resting heart rate). `;
      analysis += `This can be caused by stress, caffeine, or physical activity. Consult a doctor if persistent.\n\n`;
    }
    
    analysis += `## Heart Rate Variability (HRV)\n\n`;
    analysis += `Your HRV (RMSSD) was measured at **${heartRateVariability} ms**.\n\n`;
    
    if (heartRateVariability < 20) {
      analysis += `This indicates **low HRV**, which may suggest stress, fatigue, or reduced autonomic flexibility. `;
    } else if (heartRateVariability < 50) {
      analysis += `This indicates **normal HRV** for most adults. `;
    } else {
      analysis += `This indicates **high HRV**, which is generally associated with good cardiovascular health and fitness. `;
    }
    analysis += `HRV naturally varies based on age, fitness level, and current state.\n\n`;
    
    analysis += `## Inter-Beat Interval Analysis\n\n`;
    analysis += `- **Mean IBI**: ${meanIBI} ms (time between heartbeats)\n`;
    analysis += `- **Formula Used**: BPM = 60000 / ${meanIBI} = ${heartRate}\n`;
    
    if (metrics) {
      analysis += `- **SDNN**: ${metrics.sdnn} ms (overall variability)\n`;
      analysis += `- **pNN50**: ${metrics.pnn50}% (parasympathetic activity indicator)\n`;
      analysis += `- **IBI Range**: ${metrics.minIBI} - ${metrics.maxIBI} ms\n`;
    }
    
    analysis += `\n## Signal Quality\n\n`;
    analysis += `Signal quality was **${signalQuality}%** (${signalQuality >= 70 ? 'Good' : signalQuality >= 40 ? 'Fair' : 'Poor'}).\n\n`;
    
    analysis += `## Recommendations\n\n`;
    analysis += `1. For best results, ensure you're lying still on a flat surface\n`;
    analysis += `2. Place the phone directly on bare skin over your heart\n`;
    analysis += `3. Avoid scanning immediately after exercise or caffeine\n`;
    analysis += `4. Take multiple readings at different times for comparison\n\n`;
    
    analysis += `## Disclaimer\n\n`;
    analysis += `This measurement is for informational purposes only and is not a medical diagnosis. `;
    analysis += `Always consult a healthcare professional for medical advice.`;
    
    return analysis;
  };

  const scanTypes = [
    {
      id: 'heart',
      title: 'Cardiovascular Scan',
      description: 'Detect heartbeat vibrations using motion sensors to measure heart rate via Seismocardiography (SCG)',
      icon: Heart,
      color: 'from-rose-500 to-pink-500'
    },
    {
      id: 'peripheral',
      title: 'Peripheral Pulse Scan',
      description: 'Analyze pulse vibrations from your fingertip to measure heart rate via Ballistocardiography (BCG)',
      icon: Activity,
      color: 'from-cyan-500 to-blue-500'
    }
  ];

  const scanInstructions = scanType === 'heart' ? [
    'Find a quiet place and lie down on a flat surface',
    'Tap "Start 60s Scan" - you\'ll have 5 seconds to position your phone',
    'Place your phone flat on your bare chest (screen facing up)',
    'Keep your body completely still during the entire 60-second scan',
    'Breathe normally but minimize all movement',
    'The algorithm will filter and analyze your heartbeat vibrations'
  ] : [
    'Find a quiet place and sit comfortably',
    'Tap "Start 60s Scan" - you\'ll have 5 seconds to position your phone',
    'Rest your arm on a table or flat surface',
    'Place your fingertip firmly on the back of your phone',
    'Keep your hand and arm completely still for 60 seconds',
    'The algorithm will detect pulse vibrations from your fingertip'
  ];

  // Format markdown-like text to JSX
  const formatAnalysis = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-slate-300">
            {listItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Headers
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-white mt-6 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            {trimmedLine.replace('## ', '').replace(/\*\*/g, '')}
          </h3>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={index} className="text-md font-semibold text-cyan-400 mt-4 mb-2">
            {trimmedLine.replace('### ', '').replace(/\*\*/g, '')}
          </h4>
        );
      } else if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-xl font-bold text-white mt-4 mb-4">
            {trimmedLine.replace('# ', '').replace(/\*\*/g, '')}
          </h2>
        );
      }
      // List items
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        inList = true;
        listItems.push(trimmedLine.substring(2).replace(/\*\*/g, ''));
      }
      // Numbered list
      else if (/^\d+\.\s/.test(trimmedLine)) {
        flushList();
        elements.push(
          <p key={index} className="text-slate-300 mb-2 pl-4">
            <span className="text-cyan-400 font-semibold">{trimmedLine.match(/^\d+/)?.[0]}.</span>
            {' '}{trimmedLine.replace(/^\d+\.\s/, '').replace(/\*\*/g, '')}
          </p>
        );
      }
      // Bold text handling for regular paragraphs
      else if (trimmedLine.length > 0) {
        flushList();
        // Handle bold text with **
        const formattedText = trimmedLine.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        elements.push(
          <p key={index} className="text-slate-300 mb-3">
            {formattedText}
          </p>
        );
      }
      // Empty line
      else if (trimmedLine === '' && !inList) {
        // Skip empty lines
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-500/10 p-6">
        <div className="absolute -top-20 -right-16 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Health Scan
          </span>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Run a guided scan to capture your vital signals
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Choose a scan type, follow the on-screen steps, and get a detailed readout with AI-assisted insights.
          </p>
        </div>
      </div>

      {/* Main Scan Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
        {/* Scan Interface */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/60 p-6 shadow-xl shadow-slate-900/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
            {scanType === 'heart' ? 'Cardiovascular Scan' : 'Peripheral Pulse Scan'}
            </h3>
            <span className="text-xs text-slate-500">60s guided scan</span>
          </div>
          <ScanAnimation 
            scanType={scanType}
            onComplete={handleScanComplete}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        </div>

        {/* Instructions */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            Scan Instructions
          </h3>
          <ul className="space-y-3">
            {scanInstructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-slate-300">{instruction}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-sm text-amber-400">
              <strong>Note:</strong> This scan uses Seismocardiography (SCG) technology via your device's motion sensors. 
              It can only measure heart rate and heart rate variability. Always consult a healthcare professional for medical diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {showResults && scanResults && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4">Scan Results</h2>
          
          {/* Success/Failure Banner */}
          {scanResults.scanSuccessful && scanResults.heartRate > 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-semibold">Heartbeat Detected Successfully</p>
                  <p className="text-emerald-400/70 text-sm">
                    Detected {scanResults.beatsDetected} heartbeats during the {scanResults.scanDuration}s scan. 
                    BPM calculated from mean IBI of {scanResults.meanIBI}ms.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-amber-400 font-semibold">No Heartbeat Detected</p>
                  <p className="text-amber-400/70 text-sm">
                    Could not reliably detect heartbeat pattern. Ensure phone is flat on chest and stay completely still for the full 60 seconds.
                    {scanResults.beatsDetected > 0 && ` (${scanResults.beatsDetected} partial beats detected)`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Results - Large Display */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Measured Data
            </h3>
            
            {/* Primary Metrics - Heart Rate and HRV - LARGE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-2xl p-8 text-center">
                <Heart className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                <p className={`text-7xl font-bold ${scanResults.heartRate > 0 ? 'text-white' : 'text-slate-500'}`}>
                  {scanResults.heartRate > 0 ? scanResults.heartRate : '--'}
                </p>
                <p className="text-slate-400 mt-3 text-lg">Heart Rate (BPM)</p>
                {scanResults.heartRate > 0 ? (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-emerald-400 text-sm font-mono">
                      BPM = 60000 / {scanResults.meanIBI}ms = {scanResults.heartRate}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Calculated from Inter-Beat Intervals</p>
                  </div>
                ) : (
                  <p className="text-amber-400 text-sm mt-3">Not detected - try again</p>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8 text-center">
                <Activity className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <p className={`text-7xl font-bold ${scanResults.heartRateVariability > 0 ? 'text-white' : 'text-slate-500'}`}>
                  {scanResults.heartRateVariability > 0 ? scanResults.heartRateVariability : '--'}
                </p>
                <p className="text-slate-400 mt-3 text-lg">HRV - RMSSD (ms)</p>
                {scanResults.heartRateVariability > 0 ? (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-emerald-400 text-sm">
                      {scanResults.heartRateVariability < 20 ? 'Low' : scanResults.heartRateVariability < 50 ? 'Normal' : 'High'} variability
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Root Mean Square of Successive Differences</p>
                  </div>
                ) : (
                  <p className="text-amber-400 text-sm mt-3">Insufficient data</p>
                )}
              </div>
            </div>

            {/* Derived Metrics */}
            {derivedMetrics && derivedMetrics.sdnn > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{derivedMetrics.sdnn}</p>
                  <p className="text-xs text-slate-400">SDNN (ms)</p>
                  <p className="text-xs text-slate-500 mt-1">Std Dev of IBIs</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{derivedMetrics.pnn50}%</p>
                  <p className="text-xs text-slate-400">pNN50</p>
                  <p className="text-xs text-slate-500 mt-1">Successive diff &gt;50ms</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{derivedMetrics.minIBI}-{derivedMetrics.maxIBI}</p>
                  <p className="text-xs text-slate-400">IBI Range (ms)</p>
                  <p className="text-xs text-slate-500 mt-1">Min to Max</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{derivedMetrics.totalIBIs}</p>
                  <p className="text-xs text-slate-400">Valid IBIs</p>
                  <p className="text-xs text-slate-500 mt-1">After outlier removal</p>
                </div>
              </div>
            )}

            {/* Secondary Metrics - Scan Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <Heart className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{scanResults.beatsDetected}</p>
                <p className="text-xs text-slate-400">Beats Detected</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{scanResults.signalQuality}%</p>
                <p className="text-xs text-slate-400">Signal Quality</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{scanResults.scanDuration}s</p>
                <p className="text-xs text-slate-400">Scan Duration</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <Database className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{scanResults.dataPointsCollected}</p>
                <p className="text-xs text-slate-400">Data Points</p>
              </div>
            </div>

            {/* Signal Quality Bar */}
            <div className="mt-6 p-4 bg-slate-700/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Signal Quality</span>
                <span className={`text-sm font-medium ${
                  scanResults.signalQuality >= 70 ? 'text-emerald-400' : 
                  scanResults.signalQuality >= 40 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {scanResults.signalQuality >= 70 ? 'Good' : 
                   scanResults.signalQuality >= 40 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    scanResults.signalQuality >= 70 ? 'bg-emerald-500' : 
                    scanResults.signalQuality >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${scanResults.signalQuality}%` }}
                />
              </div>
            </div>

            {/* Raw IBI Data Toggle */}
            {scanResults.ibis && scanResults.ibis.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {showRawData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showRawData ? 'Hide' : 'Show'} Raw IBI Data ({scanResults.ibis.length} intervals)
                </button>
                {showRawData && (
                  <div className="mt-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-2">Inter-Beat Intervals (milliseconds):</p>
                    <div className="font-mono text-xs text-slate-400 break-all max-h-32 overflow-y-auto">
                      {scanResults.ibis.map(ibi => Math.round(ibi)).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                AI Health Analysis
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              {scanResults.heartRate > 0 && !isAnalyzing && (
                <button
                  onClick={() => analyzeResults(scanResults)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-analyze
                </button>
              )}
            </div>

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                  <Brain className="w-5 h-5 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-purple-400 mt-4 font-medium">Analyzing your scan data...</p>
                <p className="text-slate-400 text-sm mt-2">Our AI is reviewing your heart rate, HRV, and IBI patterns</p>
              </div>
            )}

            {analysisError && !aiAnalysis && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{analysisError}</p>
                <button
                  onClick={() => scanResults && analyzeResults(scanResults)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            )}

            {aiAnalysis && !isAnalyzing && (
              <div className="prose prose-invert max-w-none">
                {formatAnalysis(aiAnalysis)}
              </div>
            )}

            {!scanResults.heartRate && !isAnalyzing && !aiAnalysis && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <p className="text-amber-400 font-medium">Unable to Analyze</p>
                <p className="text-slate-400 text-sm mt-2">
                  AI analysis requires a successful scan with detected heartbeats. Please try scanning again.
                </p>
              </div>
            )}
          </div>

          {/* What This Scan Cannot Measure */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Limitations
            </h3>
            <p className="text-slate-400 mb-4">
              This scan uses your phone's accelerometer to detect heartbeat vibrations. It can <strong className="text-white">only</strong> measure:
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>Heart Rate (BPM)</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>Heart Rate Variability (HRV)</span>
              </li>
            </ul>
            <p className="text-slate-400 mb-3">
              The following metrics <strong className="text-amber-400">cannot</strong> be measured with an accelerometer:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'Blood Pressure',
                'Oxygen Saturation (SpO2)',
                'Blood Glucose',
                'Cholesterol',
                'Arterial Plaque',
                'Blood Flow',
                'Arterial Stiffness',
                'Respiratory Rate',
                'Stress Level'
              ].map((metric) => (
                <div key={metric} className="flex items-center gap-2 text-slate-500 text-sm">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{metric}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400">
                <strong>For accurate health measurements:</strong> Please consult a healthcare professional or use FDA-approved medical devices.
              </p>
            </div>
          </div>

          {/* Tips for Better Results */}
          {!scanResults.scanSuccessful && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                Tips for Better Results
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Place the phone directly on bare skin for better vibration detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Lie completely flat and avoid any movement during the scan</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Ensure you're in a quiet environment without vibrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Try positioning the phone slightly to the left of center on your chest</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Breathe normally but try to minimize chest movement</span>
                </li>
              </ul>
            </div>
          )}
          
          {/* Continue to Clinical Assessment CTA */}
          {onScanComplete && scanResults.scanSuccessful && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Continue to Clinical Assessment</h3>
                    <p className="text-slate-400 text-sm">
                      Your heart rate has been recorded. Continue with the Review of Systems questionnaire 
                      for a more comprehensive health assessment.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onScanComplete}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScanView;
