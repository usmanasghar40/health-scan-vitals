import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, AlertCircle, Heart, Activity, Waves, X, Vibrate, AlertTriangle, Smartphone, RotateCw } from 'lucide-react';

interface ScanAnimationProps {
  scanType: 'heart' | 'peripheral';
  onComplete: (results: ScanResultData) => void;
  isScanning: boolean;
  setIsScanning: (value: boolean) => void;
}

// ONLY include metrics that can ACTUALLY be measured from accelerometer
export interface ScanResultData {
  heartRate: number; // 0 if not detected
  heartRateVariability: number; // RMSSD in ms, 0 if not detected
  beatsDetected: number; // actual count of peaks detected
  signalQuality: number; // percentage based on data quality
  scanDuration: number; // how long the scan ran in seconds
  dataPointsCollected: number; // number of sensor readings
  scanSuccessful: boolean; // whether we got a valid reading
  meanIBI: number; // mean inter-beat interval in ms
  ibis: number[]; // all valid IBIs for HRV analysis
}

interface RawSample {
  timestamp: number;
  x: number;
  y: number;
  z: number;
}

type ScanPhase = 'idle' | 'preparing' | 'scanning' | 'analyzing' | 'complete' | 'failed';
type OrientationStatus = 'unknown' | 'horizontal' | 'not_horizontal';

// Signal processing constants
const SCAN_DURATION_SECONDS = 60; // 1 minute scan
const MIN_BPM = 40;
const MAX_BPM = 180;
const MIN_IBI_MS = (60 / MAX_BPM) * 1000; // ~333ms
const MAX_IBI_MS = (60 / MIN_BPM) * 1000; // ~1500ms

// Filter coefficients
const HIGH_PASS_ALPHA = 0.94; // ~0.5 Hz cutoff at 50Hz sample rate
const LOW_PASS_ALPHA = 0.3;  // ~3 Hz cutoff for smoothing

const ScanAnimation: React.FC<ScanAnimationProps> = ({
  scanType,
  onComplete,
  isScanning,
  setIsScanning
}) => {
  const [progress, setProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [signalQuality, setSignalQuality] = useState(0);
  const [liveHeartRate, setLiveHeartRate] = useState(0);
  const [peakCount, setPeakCount] = useState(0);
  const [beatAnimation, setBeatAnimation] = useState(false);
  const [sensorStatus, setSensorStatus] = useState<'waiting' | 'active' | 'no_signal' | 'error'>('waiting');
  const [sampleCount, setSampleCount] = useState(0);
  const [prepCountdown, setPrepCountdown] = useState(5);
  const [orientationStatus, setOrientationStatus] = useState<OrientationStatus>('unknown');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveHRV, setLiveHRV] = useState(0);
  const [liveMeanIBI, setLiveMeanIBI] = useState(0);

  // Raw data collection
  const rawSamplesRef = useRef<RawSample[]>([]);

  // Filtered signal for display
  const filteredSignalRef = useRef<number[]>([]);

  // Peak detection results
  const peakTimesRef = useRef<number[]>([]);
  const peakIndicesRef = useRef<number[]>([]);

  // Store computed IBIs
  const computedIBIsRef = useRef<number[]>([]);

  // Filter state (for real-time IIR filtering)
  const highPassStateRef = useRef<number>(0);
  const lowPassStateRef = useRef<number>(0);
  const prevRawValueRef = useRef<number>(0);

  // Refs for intervals and listeners
  const motionListenerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanStartTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  const lastRenderTimeRef = useRef<number>(0);
  const receivedRealDataRef = useRef(false);
  const isHorizontalRef = useRef(false);

  // Store final results when scan completes
  const finalResultsRef = useRef<ScanResultData | null>(null);

  // Store live values in refs so they persist
  const liveHeartRateRef = useRef<number>(0);
  const liveHRVRef = useRef<number>(0);
  const liveMeanIBIRef = useRef<number>(0);
  const peakCountRef = useRef<number>(0);
  const signalQualityRef = useRef<number>(0);

  // Snapshot of last known good values - updated whenever we have valid readings
  const lastGoodSnapshotRef = useRef<{
    heartRate: number;
    hrv: number;
    meanIBI: number;
    peakCount: number;
    quality: number;
    ibis: number[];
  } | null>(null);

  const heartSteps = [
    'Collecting accelerometer data...',
    'Removing gravity component...',
    'Applying band-pass filter (0.8-3.0 Hz)...',
    'Detecting heartbeat peaks...',
    'Computing inter-beat intervals...',
    'Calculating heart rate from IBI...',
    'Analyzing heart rate variability...',
    'Validating measurements...'
  ];

  const peripheralSteps = [
    'Collecting accelerometer data...',
    'Removing gravity component...',
    'Applying band-pass filter...',
    'Detecting pulse peaks...',
    'Computing inter-beat intervals...',
    'Calculating pulse rate...',
    'Analyzing variability...',
    'Validating measurements...'
  ];

  const steps = scanType === 'heart' ? heartSteps : peripheralSteps;

  // Check if phone is horizontal (lying flat on chest)
  const checkOrientation = useCallback((x: number, y: number, z: number): boolean => {
    const absZ = Math.abs(z);
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    // Phone is horizontal if Z has most gravity (>7) and X,Y are small (<4)
    return absZ > 7 && absX < 4 && absY < 4;
  }, []);

  // High-pass filter (removes DC/gravity, cutoff ~0.5 Hz)
  // y[n] = α * (y[n-1] + x[n] - x[n-1])
  const applyHighPassFilter = useCallback((currentValue: number): number => {
    const filtered = HIGH_PASS_ALPHA * (highPassStateRef.current + currentValue - prevRawValueRef.current);
    highPassStateRef.current = filtered;
    prevRawValueRef.current = currentValue;
    return filtered;
  }, []);

  // Low-pass filter (smoothing, cutoff ~3 Hz)
  // y[n] = α * x[n] + (1-α) * y[n-1]
  const applyLowPassFilter = useCallback((currentValue: number): number => {
    const filtered = LOW_PASS_ALPHA * currentValue + (1 - LOW_PASS_ALPHA) * lowPassStateRef.current;
    lowPassStateRef.current = filtered;
    return filtered;
  }, []);

  // Band-pass filter: high-pass then low-pass
  const applyBandPassFilter = useCallback((rawValue: number): number => {
    const highPassed = applyHighPassFilter(rawValue);
    const bandPassed = applyLowPassFilter(highPassed);
    return bandPassed;
  }, [applyHighPassFilter, applyLowPassFilter]);

  // Peak detection on the filtered signal
  // Returns indices of detected peaks
  const detectPeaks = useCallback((signal: number[], minDistance: number, threshold: number): number[] => {
    if (signal.length < 5) return [];

    const peaks: number[] = [];

    for (let i = 2; i < signal.length - 2; i++) {
      const current = signal[i];
      const prev1 = signal[i - 1];
      const prev2 = signal[i - 2];
      const next1 = signal[i + 1];
      const next2 = signal[i + 2];

      // Local maximum: current is greater than neighbors
      const isLocalMax = current > prev1 && current > prev2 && current > next1 && current > next2;

      // Above threshold
      const isAboveThreshold = current > threshold;

      // Check minimum distance from last peak
      const lastPeakIdx = peaks.length > 0 ? peaks[peaks.length - 1] : -minDistance - 1;
      const hasMinDistance = (i - lastPeakIdx) >= minDistance;

      if (isLocalMax && isAboveThreshold && hasMinDistance) {
        peaks.push(i);
      }
    }

    return peaks;
  }, []);

  // Calculate IBIs from peak times
  const calculateIBIs = useCallback((peakTimes: number[]): number[] => {
    if (peakTimes.length < 2) return [];

    const ibis: number[] = [];
    for (let i = 1; i < peakTimes.length; i++) {
      const ibi = peakTimes[i] - peakTimes[i - 1];
      // Only include physiologically plausible IBIs
      if (ibi >= MIN_IBI_MS && ibi <= MAX_IBI_MS) {
        ibis.push(ibi);
      }
    }
    return ibis;
  }, []);

  // Remove outlier IBIs (> 2 std dev from mean)
  const removeOutlierIBIs = useCallback((ibis: number[]): number[] => {
    if (ibis.length < 3) return ibis;

    const mean = ibis.reduce((a, b) => a + b, 0) / ibis.length;
    const variance = ibis.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / ibis.length;
    const stdDev = Math.sqrt(variance);

    // Remove IBIs more than 2 std dev from mean
    return ibis.filter(ibi => Math.abs(ibi - mean) <= 2 * stdDev);
  }, []);

  // Calculate BPM from IBIs using the formula: BPM = 60000 / mean_IBI_ms
  const calculateBPMFromIBIs = useCallback((ibis: number[]): { bpm: number; meanIBI: number } => {
    if (ibis.length < 2) return { bpm: 0, meanIBI: 0 };

    const cleanedIBIs = removeOutlierIBIs(ibis);
    if (cleanedIBIs.length < 2) return { bpm: 0, meanIBI: 0 };

    const meanIBI = cleanedIBIs.reduce((a, b) => a + b, 0) / cleanedIBIs.length;
    const bpm = Math.round(60000 / meanIBI);

    // Validate BPM is in physiological range
    if (bpm < MIN_BPM || bpm > MAX_BPM) return { bpm: 0, meanIBI: 0 };

    return { bpm, meanIBI: Math.round(meanIBI) };
  }, [removeOutlierIBIs]);

  // Calculate HRV (RMSSD) from IBIs
  const calculateHRV = useCallback((ibis: number[]): number => {
    if (ibis.length < 3) return 0;

    const cleanedIBIs = removeOutlierIBIs(ibis);
    if (cleanedIBIs.length < 3) return 0;

    // RMSSD: Root Mean Square of Successive Differences
    let sumSquaredDiff = 0;
    for (let i = 1; i < cleanedIBIs.length; i++) {
      const diff = cleanedIBIs[i] - cleanedIBIs[i - 1];
      sumSquaredDiff += diff * diff;
    }

    const rmssd = Math.sqrt(sumSquaredDiff / (cleanedIBIs.length - 1));
    return Math.round(rmssd);
  }, [removeOutlierIBIs]);

  // Waveform animation - displays ONLY real filtered sensor data
  const animateWaveform = useCallback(() => {
    if (!isScanningRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      animationFrameRef.current = requestAnimationFrame(animateWaveform);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(animateWaveform);
      return;
    }

    const now = performance.now();
    if (now - lastRenderTimeRef.current < 33) { // ~30fps
      animationFrameRef.current = requestAnimationFrame(animateWaveform);
      return;
    }
    lastRenderTimeRef.current = now;

    const width = canvas.width;
    const height = canvas.height;
    const data = filteredSignalRef.current;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center baseline
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Orientation warning
    if (!isHorizontalRef.current && receivedRealDataRef.current) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KEEP PHONE FLAT ON CHEST', width / 2, 20);
    }

    // No data message
    if (data.length < 2) {
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(34, 211, 238, 0.5)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for sensor data...', width / 2, height / 2 - 20);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.fillText('Keep phone flat on chest', width / 2, height / 2 + 25);

      animationFrameRef.current = requestAnimationFrame(animateWaveform);
      return;
    }

    // Calculate display scaling
    const maxPoints = 300; // Show last 6 seconds at 50Hz
    const displayData = data.slice(-maxPoints);

    // Dynamic scaling based on signal amplitude
    const absValues = displayData.map(Math.abs);
    const maxAbs = Math.max(...absValues, 0.001);
    const scale = (height * 0.4) / maxAbs;

    const centerY = height / 2;
    const pointSpacing = width / (maxPoints - 1);

    // Check signal quality
    const isSignalWeak = maxAbs < 0.0005;

    // Draw glow
    ctx.shadowColor = isSignalWeak ? 'rgba(251, 191, 36, 0.6)' : 'rgba(34, 211, 238, 0.6)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = isSignalWeak ? 'rgba(251, 191, 36, 0.3)' : 'rgba(34, 211, 238, 0.3)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i < displayData.length; i++) {
      const x = i * pointSpacing;
      const y = centerY - displayData[i] * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw main line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isSignalWeak ? '#fbbf24' : '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < displayData.length; i++) {
      const x = i * pointSpacing;
      const y = centerY - displayData[i] * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw dot at end
    if (displayData.length > 0) {
      const lastX = (displayData.length - 1) * pointSpacing;
      const lastY = centerY - displayData[displayData.length - 1] * scale;

      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.fillStyle = isSignalWeak ? 'rgba(251, 191, 36, 0.3)' : 'rgba(34, 211, 238, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isSignalWeak ? '#fbbf24' : '#22d3ee';
      ctx.fill();
    }

    // Weak signal warning
    if (isSignalWeak && data.length > 100) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Low signal - ensure phone is flat on chest', width / 2, height - 10);
    }

    animationFrameRef.current = requestAnimationFrame(animateWaveform);
  }, []);

  // Process collected data and detect peaks
  const processData = useCallback(() => {
    const samples = rawSamplesRef.current;
    setSampleCount(samples.length);

    if (samples.length < 10) {
      if (Date.now() - scanStartTimeRef.current > 3000 && !receivedRealDataRef.current) {
        setSensorStatus('no_signal');
      }
      return;
    }

    receivedRealDataRef.current = true;
    setSensorStatus('active');

    if (!isHorizontalRef.current) {
      setOrientationStatus('not_horizontal');
      // Still process data even if not perfectly horizontal
    } else {
      setOrientationStatus('horizontal');
    }

    // Get filtered signal
    const signal = filteredSignalRef.current;
    if (signal.length < 50) return; // Need at least 1 second of data

    // Calculate dynamic threshold for peak detection
    // Use recent signal amplitude
    const recentSignal = signal.slice(-250); // Last 5 seconds
    const absValues = recentSignal.map(Math.abs);
    const maxAmp = Math.max(...absValues);
    const threshold = maxAmp * 0.35; // 35% of max amplitude

    // Minimum samples between peaks (at max 180 BPM, ~50Hz sampling)
    // minDistance = sampleRate * 60 / maxBPM = 50 * 60 / 180 ≈ 17 samples
    const estimatedSampleRate = samples.length / ((Date.now() - scanStartTimeRef.current) / 1000);
    const minPeakDistance = Math.floor(estimatedSampleRate * 60 / MAX_BPM);

    // Detect peaks in the entire signal
    const peakIndices = detectPeaks(signal, Math.max(minPeakDistance, 10), threshold);
    peakIndicesRef.current = peakIndices;

    // Convert peak indices to timestamps
    if (peakIndices.length > 0 && samples.length > 0) {
      const peakTimes: number[] = [];
      for (const idx of peakIndices) {
        if (idx < samples.length) {
          peakTimes.push(samples[idx].timestamp);
        }
      }

      // Check for new peaks (trigger beat animation)
      if (peakTimes.length > peakTimesRef.current.length) {
        setBeatAnimation(true);
        setTimeout(() => setBeatAnimation(false), 150);
      }

      peakTimesRef.current = peakTimes;
      setPeakCount(peakTimes.length);
      peakCountRef.current = peakTimes.length;

      // Calculate IBIs and BPM
      const ibis = calculateIBIs(peakTimes);
      computedIBIsRef.current = ibis; // Store for final results

      const { bpm, meanIBI } = calculateBPMFromIBIs(ibis);
      setLiveHeartRate(bpm);
      liveHeartRateRef.current = bpm;
      setLiveMeanIBI(meanIBI);
      liveMeanIBIRef.current = meanIBI;

      // Calculate HRV
      const hrv = calculateHRV(ibis);
      setLiveHRV(hrv);
      liveHRVRef.current = hrv;

      // Calculate signal quality
      let quality = 0;
      if (samples.length > 100) quality += 20;
      if (samples.length > 500) quality += 10;
      if (peakTimes.length >= 3) quality += 30;
      if (bpm > 0) quality += 40;
      setSignalQuality(Math.min(100, quality));
      signalQualityRef.current = Math.min(100, quality);

      // IMPORTANT: Store a snapshot of good values whenever we have valid data
      // This ensures we don't lose data even if the final processData call fails
      if (bpm > 0 && peakTimes.length >= 3) {
        lastGoodSnapshotRef.current = {
          heartRate: bpm,
          hrv: hrv,
          meanIBI: meanIBI,
          peakCount: peakTimes.length,
          quality: Math.min(100, quality),
          ibis: [...ibis]
        };
        console.log('Snapshot saved:', lastGoodSnapshotRef.current);
      }
    }
  }, [detectPeaks, calculateIBIs, calculateBPMFromIBIs, calculateHRV]);

  // Handle motion event - collect and filter data in real-time
  const handleMotionEvent = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;

    if (!acceleration) return;

    const x = acceleration.x || 0;
    const y = acceleration.y || 0;
    const z = acceleration.z || 0;

    // Skip if all zeros (no real data)
    if (x === 0 && y === 0 && z === 0) return;

    // Check orientation
    const isHorizontal = checkOrientation(x, y, z);
    isHorizontalRef.current = isHorizontal;

    // Always collect data, but track orientation status
    if (!isHorizontal) {
      setOrientationStatus('not_horizontal');
    } else {
      setOrientationStatus('horizontal');
    }

    const now = Date.now();

    // Store raw sample
    rawSamplesRef.current.push({ timestamp: now, x, y, z });

    // Apply band-pass filter to Z-axis (most sensitive when phone is flat)
    // Z-axis captures the vertical chest movement from heartbeat
    const filteredValue = applyBandPassFilter(z);
    filteredSignalRef.current.push(filteredValue);

    receivedRealDataRef.current = true;

    // Keep last 60 seconds of data (don't trim during scan)
    // Only trim if we have way too much data (>120 seconds worth at 100Hz)
    if (rawSamplesRef.current.length > 12000) {
      rawSamplesRef.current = rawSamplesRef.current.slice(-6000);
      filteredSignalRef.current = filteredSignalRef.current.slice(-6000);
    }
  }, [checkOrientation, applyBandPassFilter]);

  // Generate final scan results - called when scan completes
  // Generate final scan results - called when scan completes
  // IMPORTANT: Use stored ref values as primary source, they were calculated during the scan
  const generateScanResults = useCallback((): ScanResultData => {
    const scanDuration = Math.round((Date.now() - scanStartTimeRef.current) / 1000);
    const dataPoints = rawSamplesRef.current.length;

    // PRIMARY: Use the live values that were displayed during the scan
    // These were calculated and stored in refs during processData()
    let finalBPM = liveHeartRateRef.current;
    let finalHRV = liveHRVRef.current;
    let finalMeanIBI = liveMeanIBIRef.current;
    let finalPeakCount = peakCountRef.current;
    let finalIBIs = [...computedIBIsRef.current];
    let quality = signalQualityRef.current;

    // FALLBACK: If refs are empty, try recalculating from peak times
    if (finalBPM === 0 && peakTimesRef.current.length >= 2) {
      console.log('Refs empty, recalculating from peakTimesRef...');
      const peakTimes = [...peakTimesRef.current];
      const ibis = calculateIBIs(peakTimes);
      const cleanedIBIs = removeOutlierIBIs(ibis);
      const { bpm, meanIBI } = calculateBPMFromIBIs(ibis);
      const hrv = calculateHRV(ibis);

      if (bpm > 0) {
        finalBPM = bpm;
        finalHRV = hrv;
        finalMeanIBI = meanIBI;
        finalPeakCount = peakTimes.length;
        finalIBIs = cleanedIBIs.length > 0 ? cleanedIBIs : ibis;
      }
    }

    // Calculate final signal quality if not set
    if (quality === 0) {
      if (dataPoints > 500) quality += 20;
      if (dataPoints > 2000) quality += 10;
      if (finalPeakCount >= 3) quality += 30;
      if (finalBPM > 0) quality += 40;
    }

    // Success criteria: at least 3 beats detected and valid BPM
    const scanSuccessful = finalBPM > 0 && finalPeakCount >= 3;

    console.log('=== FINAL SCAN RESULTS ===');
    console.log('From refs (primary):', {
      liveHeartRateRef: liveHeartRateRef.current,
      liveHRVRef: liveHRVRef.current,
      liveMeanIBIRef: liveMeanIBIRef.current,
      peakCountRef: peakCountRef.current,
      computedIBIsLength: computedIBIsRef.current.length,
      signalQualityRef: signalQualityRef.current
    });
    console.log('Final values:', {
      finalBPM,
      finalHRV,
      finalMeanIBI,
      finalPeakCount,
      finalIBIsLength: finalIBIs.length,
      quality,
      scanSuccessful,
      scanDuration,
      dataPoints
    });

    return {
      heartRate: finalBPM,
      heartRateVariability: finalHRV,
      beatsDetected: finalPeakCount,
      signalQuality: Math.min(100, quality),
      scanDuration,
      dataPointsCollected: dataPoints,
      scanSuccessful,
      meanIBI: finalMeanIBI,
      ibis: finalIBIs
    };
  }, [calculateIBIs, removeOutlierIBIs, calculateBPMFromIBIs, calculateHRV]);


  // Stop all sensors and intervals
  const stopAll = useCallback(() => {
    isScanningRef.current = false;

    if (motionListenerRef.current) {
      window.removeEventListener('devicemotion', motionListenerRef.current);
      motionListenerRef.current = null;
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (prepIntervalRef.current) {
      clearInterval(prepIntervalRef.current);
      prepIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Check if in iframe
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Start preparation phase (5 second countdown)
  const startPreparation = async () => {
    if (!window.isSecureContext) {
      setSensorError('Motion sensors require HTTPS.');
      setScanPhase('failed');
      return;
    }

    if (typeof DeviceMotionEvent === 'undefined') {
      setSensorError('Motion sensors not available on this device.');
      setScanPhase('failed');
      return;
    }

    // Request permission for iOS
    const requestPermissionFn = (DeviceMotionEvent as any).requestPermission;
    if (typeof requestPermissionFn === 'function') {
      try {
        const result = await requestPermissionFn();
        if (result !== 'granted') {
          setSensorError('Motion sensor access denied. Please reload and allow access.');
          setScanPhase('failed');
          return;
        }
      } catch (err) {
        setSensorError('Could not request sensor permission: ' + (err as Error).message);
        setScanPhase('failed');
        return;
      }
    }

    // Start 5-second countdown
    setScanPhase('preparing');
    setPrepCountdown(5);

    prepIntervalRef.current = setInterval(() => {
      setPrepCountdown(prev => {
        if (prev <= 1) {
          if (prepIntervalRef.current) {
            clearInterval(prepIntervalRef.current);
            prepIntervalRef.current = null;
          }
          startActualScan();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start the actual 60-second scan
  const startActualScan = () => {
    // Reset all state
    setProgress(0);
    setCurrentStep(0);
    setSensorError(null);
    setSignalQuality(0);
    setLiveHeartRate(0);
    setLiveHRV(0);
    setLiveMeanIBI(0);
    setPeakCount(0);
    setSensorStatus('waiting');
    setSampleCount(0);
    setOrientationStatus('unknown');
    setElapsedSeconds(0);

    // Reset data refs
    rawSamplesRef.current = [];
    filteredSignalRef.current = [];
    peakTimesRef.current = [];
    peakIndicesRef.current = [];
    computedIBIsRef.current = [];
    highPassStateRef.current = 0;
    lowPassStateRef.current = 0;
    prevRawValueRef.current = 0;
    finalResultsRef.current = null;

    // Reset live value refs
    liveHeartRateRef.current = 0;
    liveHRVRef.current = 0;
    liveMeanIBIRef.current = 0;
    peakCountRef.current = 0;
    signalQualityRef.current = 0;

    scanStartTimeRef.current = Date.now();
    receivedRealDataRef.current = false;
    isHorizontalRef.current = false;

    isScanningRef.current = true;
    setScanPhase('scanning');
    setIsScanning(true);

    // Start waveform animation
    animationFrameRef.current = requestAnimationFrame(animateWaveform);

    // Add motion listener
    motionListenerRef.current = handleMotionEvent;
    window.addEventListener('devicemotion', motionListenerRef.current);

    // Check for policy blocking after 3 seconds
    setTimeout(() => {
      if (rawSamplesRef.current.length === 0 && isScanningRef.current) {
        setSensorStatus('error');
        if (isInIframe) {
          setSensorError('Motion sensors blocked in iframe. Open in a new tab.');
        } else {
          setSensorError('Motion sensors appear to be blocked.');
        }
      }
    }, 3000);

    // Process data every 100ms
    analysisIntervalRef.current = setInterval(() => {
      processData();
    }, 100);

    // Progress update every 100ms (60 second total = 600 ticks)
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - scanStartTimeRef.current) / 1000;
      setElapsedSeconds(Math.floor(elapsed));

      const newProgress = Math.min(100, (elapsed / SCAN_DURATION_SECONDS) * 100);
      setProgress(newProgress);
      setCurrentStep(Math.min(Math.floor((newProgress / 100) * steps.length), steps.length - 1));

      if (newProgress >= 100) {
        // Stop the progress interval immediately to prevent multiple calls
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

        // Run one final data processing to ensure we have the latest values
        processData();

        // IMPORTANT: Generate and store results BEFORE entering analyzing phase
        // This ensures we capture the data while it's still fresh
        const results = generateScanResults();
        finalResultsRef.current = results;
        console.log('Scan complete, captured results:', results);
        setScanPhase('analyzing');
      }
    }, 100);
  };

  // Handle analyzing phase completion
  useEffect(() => {
    if (scanPhase === 'analyzing') {
      const timeout = setTimeout(() => {
        stopAll();

        // Use the pre-captured results - they should always be available
        const results = finalResultsRef.current;

        if (results) {
          console.log('Delivering pre-captured results to parent:', results);
          setScanPhase('complete');
          setIsScanning(false);
          onComplete(results);
        } else {
          // Fallback: generate results now (shouldn't happen normally)
          console.warn('No pre-captured results, generating now...');
          const fallbackResults = generateScanResults();
          console.log('Delivering fallback results to parent:', fallbackResults);
          setScanPhase('complete');
          setIsScanning(false);
          onComplete(fallbackResults);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [scanPhase, generateScanResults, onComplete, setIsScanning, stopAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  const resetScan = () => {
    stopAll();
    setProgress(0);
    setCurrentStep(0);
    setScanPhase('idle');
    setIsScanning(false);
    setSignalQuality(0);
    setLiveHeartRate(0);
    setLiveHRV(0);
    setLiveMeanIBI(0);
    setPeakCount(0);
    setSensorError(null);
    setSensorStatus('waiting');
    setSampleCount(0);
    setOrientationStatus('unknown');
    setPrepCountdown(5);
    setElapsedSeconds(0);
    rawSamplesRef.current = [];
    filteredSignalRef.current = [];
    peakTimesRef.current = [];
    computedIBIsRef.current = [];
    receivedRealDataRef.current = false;
    isHorizontalRef.current = false;
    finalResultsRef.current = null;
    liveHeartRateRef.current = 0;
    liveHRVRef.current = 0;
    liveMeanIBIRef.current = 0;
    peakCountRef.current = 0;
    signalQualityRef.current = 0;
  };

  const pauseScan = () => {
    setIsScanning(false);
    isScanningRef.current = false;
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const resumeScan = () => {
    setIsScanning(true);
    isScanningRef.current = true;
    animationFrameRef.current = requestAnimationFrame(animateWaveform);

    const remainingTime = SCAN_DURATION_SECONDS - elapsedSeconds;
    const startProgress = progress;
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const additionalElapsed = (Date.now() - startTime) / 1000;
      const totalElapsed = elapsedSeconds + additionalElapsed;
      setElapsedSeconds(Math.floor(totalElapsed));

      const newProgress = Math.min(100, (totalElapsed / SCAN_DURATION_SECONDS) * 100);
      setProgress(newProgress);
      setCurrentStep(Math.min(Math.floor((newProgress / 100) * steps.length), steps.length - 1));

      if (newProgress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        processData();
        const results = generateScanResults();
        finalResultsRef.current = results;
        setScanPhase('analyzing');
      }
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const heartImage = 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=600&fit=crop';
  const armImage = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=600&fit=crop';

  return (
    <div className="relative">
      {/* Preparation Phase - 5 second countdown */}
      {scanPhase === 'preparing' && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 border border-cyan-500/30 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto rounded-full border-4 border-cyan-500/30 flex items-center justify-center bg-slate-800/50">
                <span className="text-6xl font-bold text-cyan-400 animate-pulse">{prepCountdown}</span>
              </div>
              <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-cyan-400 animate-ping opacity-20" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">Get Ready</h3>

            <div className="space-y-3 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Smartphone className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                <p className="text-sm text-cyan-300">
                  <strong>Lie down</strong> and place phone <strong>flat on your chest</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <RotateCw className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-300">
                  Keep phone <strong>horizontal</strong> (screen facing up)
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Heart className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300">
                  <strong>Stay completely still</strong> for 60 seconds
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mt-4">
              Scanning will begin automatically...
            </p>

            <button
              onClick={resetScan}
              className="mt-4 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scanning State */}
      {scanPhase === 'scanning' && (
        <div className="mb-6">
          {/* Orientation Warning */}
          {orientationStatus === 'not_horizontal' && (
            <div className="mb-4 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl animate-pulse">
              <div className="flex items-center gap-3">
                <RotateCw className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-amber-400 font-semibold">Keep Phone Horizontal!</p>
                  <p className="text-amber-400/80 text-sm">Place phone flat on your chest, screen facing up</p>
                </div>
              </div>
            </div>
          )}

          {/* Timer and BPM Display */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 mb-4">
            {/* Timer */}
            <div className="text-center mb-4">
              <div className="text-3xl font-mono font-bold text-cyan-400">
                {formatTime(elapsedSeconds)} / {formatTime(SCAN_DURATION_SECONDS)}
              </div>
              <p className="text-slate-400 text-sm">Scan Duration</p>
            </div>

            <div className="flex items-center justify-center gap-6">
              {/* Animated Heart */}
              <div className={`relative transition-transform duration-150 ${beatAnimation ? 'scale-125' : 'scale-100'}`}>
                <div className={`absolute inset-0 rounded-full blur-xl ${liveHeartRate > 0 ? 'bg-rose-500/20 animate-pulse' : 'bg-slate-500/10'}`} />
                <Heart
                  className={`w-16 h-16 relative z-10 ${liveHeartRate > 0 ? 'text-rose-500' : 'text-slate-600'} ${beatAnimation ? 'fill-rose-500' : ''}`}
                  fill={beatAnimation ? 'currentColor' : 'none'}
                />
              </div>

              {/* BPM Value */}
              <div className="text-center">
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold font-mono tracking-tight ${liveHeartRate > 0 ? 'text-white' : 'text-slate-500'}`}>
                    {liveHeartRate > 0 ? liveHeartRate : '--'}
                  </span>
                  <span className="text-2xl text-slate-400 font-medium">BPM</span>
                </div>
                <p className={`text-sm mt-1 ${liveHeartRate > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {liveHeartRate > 0 ? `IBI: ${liveMeanIBI}ms` : 'Detecting heartbeat...'}
                </p>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-700/50">
              <div className="text-center">
                <Activity className={`w-5 h-5 mx-auto mb-1 ${peakCount > 0 ? 'text-cyan-400' : 'text-slate-600'}`} />
                <p className={`text-lg font-semibold ${peakCount > 0 ? 'text-white' : 'text-slate-500'}`}>
                  {peakCount > 0 ? peakCount : '--'}
                </p>
                <p className="text-xs text-slate-500">Beats</p>
              </div>
              <div className="text-center">
                <Waves className={`w-5 h-5 mx-auto mb-1 ${liveHRV > 0 ? 'text-purple-400' : 'text-slate-600'}`} />
                <p className={`text-lg font-semibold ${liveHRV > 0 ? 'text-white' : 'text-slate-500'}`}>
                  {liveHRV > 0 ? liveHRV : '--'}
                </p>
                <p className="text-xs text-slate-500">HRV (ms)</p>
              </div>
              <div className="text-center">
                <Waves className={`w-5 h-5 mx-auto mb-1 ${signalQuality > 30 ? 'text-emerald-400' : 'text-slate-600'}`} />
                <p className={`text-lg font-semibold ${signalQuality > 30 ? 'text-white' : 'text-slate-500'}`}>
                  {signalQuality > 0 ? Math.round(signalQuality) + '%' : '--'}
                </p>
                <p className="text-xs text-slate-500">Quality</p>
              </div>
              <div className="text-center">
                {orientationStatus === 'horizontal' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                )}
                <p className={`text-lg font-semibold ${orientationStatus === 'horizontal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {orientationStatus === 'horizontal' ? 'OK' : 'Tilt'}
                </p>
                <p className="text-xs text-slate-500">Position</p>
              </div>
            </div>
          </div>

          {/* Live Waveform */}
          <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">Band-Pass Filtered Signal (0.8-3.0 Hz)</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${sensorStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  sensorStatus === 'no_signal' ? 'bg-red-500/20 text-red-400' :
                    sensorStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                }`}>
                {sensorStatus === 'active' && <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Receiving</>}
                {sensorStatus === 'waiting' && <><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Waiting</>}
                {sensorStatus === 'no_signal' && <><AlertTriangle className="w-3 h-3" /> No Signal</>}
                {sensorStatus === 'error' && <><AlertCircle className="w-3 h-3" /> Error</>}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={180}
              className="w-full h-[180px]"
            />
            <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Samples: {sampleCount}</span>
                <span className={sampleCount > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                  {sampleCount > 0 ? 'Real sensor data (filtered)' : 'No data'}
                </span>
              </div>
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-xs text-slate-400 text-center">
              <strong className="text-cyan-400">Algorithm:</strong> High-pass filter (0.5 Hz) → Band-pass (0.8-3.0 Hz) → Peak detection → IBI calculation → BPM = 60000 / mean(IBI)
            </p>
          </div>

          {/* Sensor errors */}
          {sensorError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">Sensor Error</p>
                  <p className="text-xs text-red-400/70">{sensorError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main scan visualization for non-scanning states */}
      {(scanPhase === 'idle' || scanPhase === 'analyzing' || scanPhase === 'complete' || scanPhase === 'failed') && (
        <div className="relative aspect-square max-w-md mx-auto mb-4 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-700/50">
          {scanPhase === 'idle' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-500/10" />
              <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
              <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" />
              <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-300">Ready to Scan</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10">
                  {scanType === 'heart' ? (
                    <Heart className="h-8 w-8 text-rose-400" />
                  ) : (
                    <Activity className="h-8 w-8 text-cyan-400" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Vibrate className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">60-Second Seismocardiography Scan</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Uses IBI-based heart rate calculation from accelerometer data
                  </p>
                </div>
              </div>
            </>
          )}

          {scanPhase === 'analyzing' && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-20">
              <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                <Heart className="w-6 h-6 text-rose-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-cyan-400 font-medium text-lg mb-2">Analyzing Results</p>
              <p className="text-slate-400 text-sm">Computing final BPM from IBIs...</p>
              {liveHeartRate > 0 && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-emerald-400 text-sm">
                    Detected: <strong>{liveHeartRate} BPM</strong> from {peakCount} beats
                  </p>
                </div>
              )}
            </div>
          )}

          {scanPhase === 'complete' && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center z-20">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-semibold text-lg">Scan Complete</p>
                <p className="text-emerald-400/70 text-sm">Results are ready</p>
              </div>
            </div>
          )}

          {scanPhase === 'failed' && (
            <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-20">
              <div className="text-center px-6">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 font-semibold text-lg mb-2">Scan Failed</p>
                <p className="text-slate-400 text-sm">{sensorError || 'Could not access motion sensors'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress bar for scanning */}
      {scanPhase === 'scanning' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">{steps[currentStep]}</span>
            <span className="text-cyan-400 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex justify-center gap-3 flex-wrap">
        {scanPhase === 'idle' && (
          <button
            onClick={startPreparation}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-cyan-500/25"
          >
            <Play className="w-5 h-5" />
            Start 60s Scan
          </button>
        )}

        {scanPhase === 'scanning' && isScanning && (
          <>
            <button
              onClick={pauseScan}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all duration-300"
            >
              <Pause className="w-5 h-5" />
              Pause
            </button>
            <button
              onClick={resetScan}
              className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-all duration-300"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </>
        )}

        {scanPhase === 'scanning' && !isScanning && (
          <>
            <button
              onClick={resumeScan}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
            >
              <Play className="w-5 h-5" />
              Resume
            </button>
            <button
              onClick={resetScan}
              className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-all duration-300"
            >
              <RotateCcw className="w-5 h-5" />
              Cancel
            </button>
          </>
        )}

        {(scanPhase === 'complete' || scanPhase === 'failed') && (
          <button
            onClick={resetScan}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
          >
            <RotateCcw className="w-5 h-5" />
            New Scan
          </button>
        )}
      </div>

      {/* Iframe Warning */}
      {scanPhase === 'idle' && isInIframe && (
        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-400 mb-2">Preview Mode Detected</p>
              <p className="text-xs text-orange-400/80 mb-3">
                Motion sensors are blocked in iframe preview. Open in a new tab to use the scanner.
              </p>
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {scanPhase === 'idle' && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            How the 60-Second Scan Works
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-white">Data Collection</strong> - Accelerometer samples at ~50Hz for 60 seconds
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-white">High-Pass Filter</strong> - Removes gravity (cutoff ~0.5 Hz)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-white">Band-Pass Filter</strong> - Isolates heart rate band (0.8-3.0 Hz = 48-180 BPM)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xs font-bold">4</span>
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-white">Peak Detection</strong> - Finds heartbeat peaks with minimum distance constraint
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-xs font-bold">5</span>
              </div>
              <p className="text-sm text-slate-400">
                <strong className="text-white">IBI Calculation</strong> - BPM = 60000 / mean(inter-beat intervals)
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-400">
              <strong>Important:</strong> Lie down, place phone flat on chest, and stay completely still.
              If no heartbeat pattern is detected, results will show "--". This uses real sensor data only.
            </p>
          </div>
        </div>
      )}

      {/* Scanning tips */}
      {scanPhase === 'scanning' && signalQuality < 30 && progress > 20 && sampleCount > 0 && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-400 text-center">
            <strong>Tip:</strong> Ensure phone is flat on chest. Stay very still and breathe normally.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScanAnimation;
