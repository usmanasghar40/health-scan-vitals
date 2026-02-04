import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Calendar, DollarSign, Pill, Activity,
  BarChart3, PieChart, FileText, ChevronDown, ChevronRight, AlertCircle,
  CheckCircle2, XCircle, Clock, Target, Heart, Brain, Zap, Users,
  Download, Filter, RefreshCw, Info, ArrowRight, ArrowUp, ArrowDown
} from 'lucide-react';

interface Visit {
  id: string;
  visitNumber: number;
  date: string;
  type: 'baseline' | '3-month' | '6-month' | '12-month';
  rosScores: {
    pss: number;
    phq2: number;
    gad2: number;
    ace: number;
    qualityOfLife: number;
    energyLevel: number;
    painLevel: number;
    sleepQuality: number;
  };
  symptoms: {
    category: string;
    symptom: string;
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    improved: boolean | null;
  }[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    monthlyCoast: number;
    adherence: number;
    startDate: string;
  }[];
  vitals: {
    bloodPressure: string;
    heartRate: number;
    weight: number;
    bmi: number;
  };
}

interface OutcomeMetric {
  name: string;
  baseline: number;
  current: number;
  target: number;
  unit: string;
  improved: boolean;
  percentChange: number;
}

// Sample patient visit data
const sampleVisits: Visit[] = [
  {
    id: 'visit-1',
    visitNumber: 1,
    date: '2024-06-15',
    type: 'baseline',
    rosScores: {
      pss: 28,
      phq2: 4,
      gad2: 5,
      ace: 3,
      qualityOfLife: 4,
      energyLevel: 3,
      painLevel: 7,
      sleepQuality: 4,
    },
    symptoms: [
      { category: 'Constitutional', symptom: 'Fatigue', severity: 'severe', improved: null },
      { category: 'Cardiovascular', symptom: 'Chest discomfort', severity: 'moderate', improved: null },
      { category: 'Musculoskeletal', symptom: 'Joint pain', severity: 'severe', improved: null },
      { category: 'Neurological', symptom: 'Headaches', severity: 'moderate', improved: null },
      { category: 'Psychiatric', symptom: 'Anxiety', severity: 'severe', improved: null },
      { category: 'Gastrointestinal', symptom: 'Heartburn', severity: 'moderate', improved: null },
      { category: 'Sleep', symptom: 'Insomnia', severity: 'severe', improved: null },
    ],
    medications: [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', monthlyCoast: 15, adherence: 85, startDate: '2024-06-15' },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', monthlyCoast: 12, adherence: 80, startDate: '2024-06-15' },
    ],
    vitals: {
      bloodPressure: '148/92',
      heartRate: 88,
      weight: 198,
      bmi: 31.2,
    },
  },
  {
    id: 'visit-2',
    visitNumber: 2,
    date: '2024-09-15',
    type: '3-month',
    rosScores: {
      pss: 22,
      phq2: 3,
      gad2: 3,
      ace: 3,
      qualityOfLife: 6,
      energyLevel: 5,
      painLevel: 5,
      sleepQuality: 6,
    },
    symptoms: [
      { category: 'Constitutional', symptom: 'Fatigue', severity: 'moderate', improved: true },
      { category: 'Cardiovascular', symptom: 'Chest discomfort', severity: 'mild', improved: true },
      { category: 'Musculoskeletal', symptom: 'Joint pain', severity: 'moderate', improved: true },
      { category: 'Neurological', symptom: 'Headaches', severity: 'mild', improved: true },
      { category: 'Psychiatric', symptom: 'Anxiety', severity: 'moderate', improved: true },
      { category: 'Gastrointestinal', symptom: 'Heartburn', severity: 'mild', improved: true },
      { category: 'Sleep', symptom: 'Insomnia', severity: 'moderate', improved: true },
    ],
    medications: [
      { name: 'Lisinopril', dosage: '20mg', frequency: 'Once daily', monthlyCoast: 18, adherence: 92, startDate: '2024-06-15' },
      { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', monthlyCoast: 15, adherence: 88, startDate: '2024-06-15' },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', monthlyCoast: 22, adherence: 90, startDate: '2024-09-15' },
    ],
    vitals: {
      bloodPressure: '138/86',
      heartRate: 82,
      weight: 192,
      bmi: 30.3,
    },
  },
  {
    id: 'visit-3',
    visitNumber: 3,
    date: '2024-12-15',
    type: '6-month',
    rosScores: {
      pss: 16,
      phq2: 2,
      gad2: 2,
      ace: 3,
      qualityOfLife: 7,
      energyLevel: 7,
      painLevel: 3,
      sleepQuality: 7,
    },
    symptoms: [
      { category: 'Constitutional', symptom: 'Fatigue', severity: 'mild', improved: true },
      { category: 'Cardiovascular', symptom: 'Chest discomfort', severity: 'none', improved: true },
      { category: 'Musculoskeletal', symptom: 'Joint pain', severity: 'mild', improved: true },
      { category: 'Neurological', symptom: 'Headaches', severity: 'none', improved: true },
      { category: 'Psychiatric', symptom: 'Anxiety', severity: 'mild', improved: true },
      { category: 'Gastrointestinal', symptom: 'Heartburn', severity: 'none', improved: true },
      { category: 'Sleep', symptom: 'Insomnia', severity: 'mild', improved: true },
    ],
    medications: [
      { name: 'Lisinopril', dosage: '20mg', frequency: 'Once daily', monthlyCoast: 18, adherence: 95, startDate: '2024-06-15' },
      { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', monthlyCoast: 15, adherence: 94, startDate: '2024-06-15' },
      { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily', monthlyCoast: 25, adherence: 93, startDate: '2024-09-15' },
      { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', monthlyCoast: 5, adherence: 96, startDate: '2024-12-15' },
    ],
    vitals: {
      bloodPressure: '128/82',
      heartRate: 76,
      weight: 185,
      bmi: 29.2,
    },
  },
];

// 12-month projected visit
const projectedVisit: Visit = {
  id: 'visit-4',
  visitNumber: 4,
  date: '2025-06-15',
  type: '12-month',
  rosScores: {
    pss: 12,
    phq2: 1,
    gad2: 1,
    ace: 3,
    qualityOfLife: 8,
    energyLevel: 8,
    painLevel: 2,
    sleepQuality: 8,
  },
  symptoms: [
    { category: 'Constitutional', symptom: 'Fatigue', severity: 'none', improved: true },
    { category: 'Cardiovascular', symptom: 'Chest discomfort', severity: 'none', improved: true },
    { category: 'Musculoskeletal', symptom: 'Joint pain', severity: 'mild', improved: true },
    { category: 'Neurological', symptom: 'Headaches', severity: 'none', improved: true },
    { category: 'Psychiatric', symptom: 'Anxiety', severity: 'none', improved: true },
    { category: 'Gastrointestinal', symptom: 'Heartburn', severity: 'none', improved: true },
    { category: 'Sleep', symptom: 'Insomnia', severity: 'none', improved: true },
  ],
  medications: [
    { name: 'Lisinopril', dosage: '20mg', frequency: 'Once daily', monthlyCoast: 18, adherence: 97, startDate: '2024-06-15' },
    { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', monthlyCoast: 15, adherence: 96, startDate: '2024-06-15' },
    { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily', monthlyCoast: 25, adherence: 95, startDate: '2024-09-15' },
    { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', monthlyCoast: 5, adherence: 98, startDate: '2024-12-15' },
  ],
  vitals: {
    bloodPressure: '122/78',
    heartRate: 72,
    weight: 178,
    bmi: 28.1,
  },
};

const PharmacoeconomicsView: React.FC = () => {
  const [selectedVisitPair, setSelectedVisitPair] = useState<[string, string]>(['visit-1', 'visit-3']);
  const [activeSection, setActiveSection] = useState<'overview' | 'symptoms' | 'medications' | 'economics'>('overview');
  const [showProjected, setShowProjected] = useState(false);

  const allVisits = showProjected ? [...sampleVisits, projectedVisit] : sampleVisits;
  
  const visit1 = allVisits.find(v => v.id === selectedVisitPair[0]) || sampleVisits[0];
  const visit2 = allVisits.find(v => v.id === selectedVisitPair[1]) || sampleVisits[sampleVisits.length - 1];

  // Calculate outcome metrics
  const outcomeMetrics: OutcomeMetric[] = useMemo(() => [
    {
      name: 'Perceived Stress (PSS)',
      baseline: visit1.rosScores.pss,
      current: visit2.rosScores.pss,
      target: 13,
      unit: '/40',
      improved: visit2.rosScores.pss < visit1.rosScores.pss,
      percentChange: ((visit1.rosScores.pss - visit2.rosScores.pss) / visit1.rosScores.pss) * 100,
    },
    {
      name: 'Depression Screen (PHQ-2)',
      baseline: visit1.rosScores.phq2,
      current: visit2.rosScores.phq2,
      target: 2,
      unit: '/6',
      improved: visit2.rosScores.phq2 < visit1.rosScores.phq2,
      percentChange: ((visit1.rosScores.phq2 - visit2.rosScores.phq2) / visit1.rosScores.phq2) * 100,
    },
    {
      name: 'Anxiety Screen (GAD-2)',
      baseline: visit1.rosScores.gad2,
      current: visit2.rosScores.gad2,
      target: 2,
      unit: '/6',
      improved: visit2.rosScores.gad2 < visit1.rosScores.gad2,
      percentChange: ((visit1.rosScores.gad2 - visit2.rosScores.gad2) / visit1.rosScores.gad2) * 100,
    },
    {
      name: 'Quality of Life',
      baseline: visit1.rosScores.qualityOfLife,
      current: visit2.rosScores.qualityOfLife,
      target: 8,
      unit: '/10',
      improved: visit2.rosScores.qualityOfLife > visit1.rosScores.qualityOfLife,
      percentChange: ((visit2.rosScores.qualityOfLife - visit1.rosScores.qualityOfLife) / visit1.rosScores.qualityOfLife) * 100,
    },
    {
      name: 'Energy Level',
      baseline: visit1.rosScores.energyLevel,
      current: visit2.rosScores.energyLevel,
      target: 8,
      unit: '/10',
      improved: visit2.rosScores.energyLevel > visit1.rosScores.energyLevel,
      percentChange: ((visit2.rosScores.energyLevel - visit1.rosScores.energyLevel) / visit1.rosScores.energyLevel) * 100,
    },
    {
      name: 'Pain Level',
      baseline: visit1.rosScores.painLevel,
      current: visit2.rosScores.painLevel,
      target: 2,
      unit: '/10',
      improved: visit2.rosScores.painLevel < visit1.rosScores.painLevel,
      percentChange: ((visit1.rosScores.painLevel - visit2.rosScores.painLevel) / visit1.rosScores.painLevel) * 100,
    },
    {
      name: 'Sleep Quality',
      baseline: visit1.rosScores.sleepQuality,
      current: visit2.rosScores.sleepQuality,
      target: 8,
      unit: '/10',
      improved: visit2.rosScores.sleepQuality > visit1.rosScores.sleepQuality,
      percentChange: ((visit2.rosScores.sleepQuality - visit1.rosScores.sleepQuality) / visit1.rosScores.sleepQuality) * 100,
    },
  ], [visit1, visit2]);

  // Calculate QALY improvement
  const qalyCalculation = useMemo(() => {
    const baselineUtility = visit1.rosScores.qualityOfLife / 10;
    const currentUtility = visit2.rosScores.qualityOfLife / 10;
    const timePeriod = (new Date(visit2.date).getTime() - new Date(visit1.date).getTime()) / (365 * 24 * 60 * 60 * 1000);
    const qalyGained = (currentUtility - baselineUtility) * timePeriod;
    return {
      baselineUtility,
      currentUtility,
      timePeriod,
      qalyGained,
    };
  }, [visit1, visit2]);

  // Calculate medication costs
  const medicationCosts = useMemo(() => {
    const baselineMonthlyCost = visit1.medications.reduce((sum, med) => sum + med.monthlyCoast, 0);
    const currentMonthlyCost = visit2.medications.reduce((sum, med) => sum + med.monthlyCoast, 0);
    const monthsBetween = Math.round((new Date(visit2.date).getTime() - new Date(visit1.date).getTime()) / (30 * 24 * 60 * 60 * 1000));
    const totalCost = ((baselineMonthlyCost + currentMonthlyCost) / 2) * monthsBetween;
    
    return {
      baselineMonthlyCost,
      currentMonthlyCost,
      monthsBetween,
      totalCost,
      costPerQaly: qalyCalculation.qalyGained > 0 ? totalCost / qalyCalculation.qalyGained : 0,
    };
  }, [visit1, visit2, qalyCalculation]);

  // Symptom comparison
  const symptomComparison = useMemo(() => {
    return visit2.symptoms.map(s2 => {
      const s1 = visit1.symptoms.find(s => s.symptom === s2.symptom);
      const severityScore = { none: 0, mild: 1, moderate: 2, severe: 3 };
      const baselineSeverity = s1 ? severityScore[s1.severity] : 0;
      const currentSeverity = severityScore[s2.severity];
      
      return {
        ...s2,
        baselineSeverity: s1?.severity || 'none',
        change: baselineSeverity - currentSeverity,
        status: currentSeverity < baselineSeverity ? 'improved' : currentSeverity > baselineSeverity ? 'worsened' : 'unchanged',
      };
    });
  }, [visit1, visit2]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'none': return 'text-emerald-400 bg-emerald-500/20';
      case 'mild': return 'text-yellow-400 bg-yellow-500/20';
      case 'moderate': return 'text-amber-400 bg-amber-500/20';
      case 'severe': return 'text-rose-400 bg-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getChangeIcon = (status: string) => {
    switch (status) {
      case 'improved': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'worsened': return <TrendingDown className="w-4 h-4 text-rose-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Pharmacoeconomics & Outcomes Analysis
          </h1>
          <p className="text-slate-400 mt-1">Track treatment effectiveness and cost-benefit analysis over time</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showProjected}
              onChange={(e) => setShowProjected(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
            />
            Show 12-Month Projection
          </label>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Visit Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Compare Visits</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-slate-400 mb-2 block">First Visit (Baseline)</label>
            <select
              value={selectedVisitPair[0]}
              onChange={(e) => setSelectedVisitPair([e.target.value, selectedVisitPair[1]])}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              {allVisits.map(v => (
                <option key={v.id} value={v.id}>
                  Visit {v.visitNumber} - {v.type.replace('-', ' ')} ({new Date(v.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          
          <ArrowRight className="w-6 h-6 text-slate-500 hidden sm:block" />
          
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-slate-400 mb-2 block">Second Visit (Follow-up)</label>
            <select
              value={selectedVisitPair[1]}
              onChange={(e) => setSelectedVisitPair([selectedVisitPair[0], e.target.value])}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              {allVisits.map(v => (
                <option key={v.id} value={v.id}>
                  Visit {v.visitNumber} - {v.type.replace('-', ' ')} ({new Date(v.date).toLocaleDateString()})
                  {v.type === '12-month' && showProjected ? ' (Projected)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'symptoms', label: 'Symptom Analysis', icon: Heart },
          { id: 'medications', label: 'Medication Tracking', icon: Pill },
          { id: 'economics', label: 'Economic Analysis', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-emerald-400 text-sm font-medium">
                  +{Math.round(qalyCalculation.qalyGained * 1000) / 1000} QALY
                </span>
              </div>
              <h3 className="text-slate-400 text-sm">Quality-Adjusted Life Years</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {Math.round(qalyCalculation.currentUtility * 100)}%
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Utility score (was {Math.round(qalyCalculation.baselineUtility * 100)}%)
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <span className={`text-sm font-medium ${
                  outcomeMetrics.filter(m => m.improved).length > outcomeMetrics.length / 2
                    ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {outcomeMetrics.filter(m => m.improved).length}/{outcomeMetrics.length} Improved
                </span>
              </div>
              <h3 className="text-slate-400 text-sm">Outcome Metrics</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {Math.round(outcomeMetrics.reduce((sum, m) => sum + Math.abs(m.percentChange), 0) / outcomeMetrics.length)}%
              </p>
              <p className="text-slate-500 text-xs mt-1">Average improvement</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Pill className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-purple-400 text-sm font-medium">
                  {visit2.medications.length} Active
                </span>
              </div>
              <h3 className="text-slate-400 text-sm">Medications</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {Math.round(visit2.medications.reduce((sum, m) => sum + m.adherence, 0) / visit2.medications.length)}%
              </p>
              <p className="text-slate-500 text-xs mt-1">Average adherence</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-amber-400 text-sm font-medium">
                  ${medicationCosts.currentMonthlyCost}/mo
                </span>
              </div>
              <h3 className="text-slate-400 text-sm">Total Treatment Cost</h3>
              <p className="text-2xl font-bold text-white mt-1">
                ${Math.round(medicationCosts.totalCost)}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Over {medicationCosts.monthsBetween} months
              </p>
            </div>
          </div>

          {/* Outcomes Summary Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Outcomes Summary Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Metric</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Baseline</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Current</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Target</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Change</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outcomeMetrics.map((metric, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-3 px-4 text-white font-medium">{metric.name}</td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {metric.baseline}{metric.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={metric.improved ? 'text-emerald-400' : 'text-amber-400'}>
                          {metric.current}{metric.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-cyan-400">
                        {metric.target}{metric.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`flex items-center justify-center gap-1 ${
                          metric.improved ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {metric.improved ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                          {Math.abs(Math.round(metric.percentChange))}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {metric.improved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Improved
                          </span>
                        ) : metric.current === metric.baseline ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-500/20 text-slate-400 rounded-lg text-sm">
                            <Minus className="w-4 h-4" />
                            Unchanged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Needs Attention
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vitals Comparison */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              Vital Signs Comparison
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Blood Pressure', baseline: visit1.vitals.bloodPressure, current: visit2.vitals.bloodPressure, unit: 'mmHg', improved: parseInt(visit2.vitals.bloodPressure) < parseInt(visit1.vitals.bloodPressure) },
                { label: 'Heart Rate', baseline: visit1.vitals.heartRate, current: visit2.vitals.heartRate, unit: 'bpm', improved: visit2.vitals.heartRate < visit1.vitals.heartRate },
                { label: 'Weight', baseline: visit1.vitals.weight, current: visit2.vitals.weight, unit: 'lbs', improved: visit2.vitals.weight < visit1.vitals.weight },
                { label: 'BMI', baseline: visit1.vitals.bmi, current: visit2.vitals.bmi, unit: '', improved: visit2.vitals.bmi < visit1.vitals.bmi },
              ].map((vital, index) => (
                <div key={index} className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-2">{vital.label}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-slate-500 text-xs">Baseline</p>
                      <p className="text-white">{vital.baseline} {vital.unit}</p>
                    </div>
                    <div className="text-center px-2">
                      {vital.improved ? (
                        <ArrowDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowUp className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Current</p>
                      <p className={vital.improved ? 'text-emerald-400' : 'text-amber-400'}>
                        {vital.current} {vital.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Symptoms Section */}
      {activeSection === 'symptoms' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Symptom Improvement Analysis
            </h3>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">
                  {symptomComparison.filter(s => s.status === 'improved').length}
                </p>
                <p className="text-sm text-emerald-400">Improved</p>
              </div>
              <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-slate-400">
                  {symptomComparison.filter(s => s.status === 'unchanged').length}
                </p>
                <p className="text-sm text-slate-400">Unchanged</p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-rose-400">
                  {symptomComparison.filter(s => s.status === 'worsened').length}
                </p>
                <p className="text-sm text-rose-400">Worsened</p>
              </div>
            </div>

            {/* Symptom Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Symptom</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Baseline</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Current</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {symptomComparison.map((symptom, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-3 px-4 text-slate-300">{symptom.category}</td>
                      <td className="py-3 px-4 text-white font-medium">{symptom.symptom}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getSeverityColor(symptom.baselineSeverity)}`}>
                          {symptom.baselineSeverity.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getSeverityColor(symptom.severity)}`}>
                          {symptom.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {getChangeIcon(symptom.status)}
                          <span className={`text-sm ${
                            symptom.status === 'improved' ? 'text-emerald-400' :
                            symptom.status === 'worsened' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {symptom.status === 'improved' ? `+${symptom.change} levels` :
                             symptom.status === 'worsened' ? `${symptom.change} levels` : 'No change'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Symptom Trend Visualization */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Symptom Severity Over Time</h3>
            <div className="space-y-4">
              {symptomComparison.map((symptom, index) => {
                const severityScore = { none: 0, mild: 25, moderate: 50, severe: 100 };
                const baselineWidth = severityScore[symptom.baselineSeverity as keyof typeof severityScore];
                const currentWidth = severityScore[symptom.severity];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{symptom.symptom}</span>
                      <span className={`text-sm ${
                        symptom.status === 'improved' ? 'text-emerald-400' :
                        symptom.status === 'worsened' ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {symptom.baselineSeverity} → {symptom.severity}
                      </span>
                    </div>
                    <div className="relative h-6 bg-slate-700/50 rounded-full overflow-hidden">
                      {/* Baseline bar */}
                      <div 
                        className="absolute top-0 left-0 h-3 bg-slate-500/50 rounded-full"
                        style={{ width: `${baselineWidth}%` }}
                      />
                      {/* Current bar */}
                      <div 
                        className={`absolute bottom-0 left-0 h-3 rounded-full ${
                          symptom.status === 'improved' ? 'bg-emerald-500' :
                          symptom.status === 'worsened' ? 'bg-rose-500' : 'bg-slate-500'
                        }`}
                        style={{ width: `${currentWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-slate-500/50 rounded" /> Baseline
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-500 rounded" /> Improved
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-rose-500 rounded" /> Worsened
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Medications Section */}
      {activeSection === 'medications' && (
        <div className="space-y-6">
          {/* Medication Timeline */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-400" />
              Medication Timeline & Adherence
            </h3>
            
            <div className="space-y-4">
              {visit2.medications.map((med, index) => {
                const baselineMed = visit1.medications.find(m => m.name === med.name);
                const isNew = !baselineMed;
                const dosageChanged = baselineMed && baselineMed.dosage !== med.dosage;
                
                return (
                  <div key={index} className="bg-slate-900/50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isNew ? 'bg-cyan-500/20' : dosageChanged ? 'bg-amber-500/20' : 'bg-purple-500/20'
                        }`}>
                          <Pill className={`w-6 h-6 ${
                            isNew ? 'text-cyan-400' : dosageChanged ? 'text-amber-400' : 'text-purple-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold">{med.name}</h4>
                            {isNew && (
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                                New
                              </span>
                            )}
                            {dosageChanged && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                Dosage Adjusted
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mt-1">
                            {med.dosage} - {med.frequency}
                          </p>
                          {dosageChanged && baselineMed && (
                            <p className="text-slate-500 text-xs mt-1">
                              Previously: {baselineMed.dosage}
                            </p>
                          )}
                          <p className="text-slate-500 text-xs mt-1">
                            Started: {new Date(med.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-sm">Adherence:</span>
                          <span className={`font-semibold ${
                            med.adherence >= 90 ? 'text-emerald-400' :
                            med.adherence >= 80 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {med.adherence}%
                          </span>
                        </div>
                        <div className="w-32 h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              med.adherence >= 90 ? 'bg-emerald-500' :
                              med.adherence >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${med.adherence}%` }}
                          />
                        </div>
                        <p className="text-slate-500 text-xs mt-2">
                          ${med.monthlyCoast}/month
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Medication Cost Comparison */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Medication Cost Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Baseline Monthly Cost</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${medicationCosts.baselineMonthlyCost}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {visit1.medications.length} medications
                </p>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Current Monthly Cost</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${medicationCosts.currentMonthlyCost}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {visit2.medications.length} medications
                </p>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Cost Change</p>
                <p className={`text-2xl font-bold mt-1 ${
                  medicationCosts.currentMonthlyCost > medicationCosts.baselineMonthlyCost
                    ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {medicationCosts.currentMonthlyCost > medicationCosts.baselineMonthlyCost ? '+' : '-'}
                  ${Math.abs(medicationCosts.currentMonthlyCost - medicationCosts.baselineMonthlyCost)}
                </p>
                <p className="text-slate-500 text-xs mt-1">per month</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Economics Section */}
      {activeSection === 'economics' && (
        <div className="space-y-6">
          {/* QALY Analysis */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Quality-Adjusted Life Year (QALY) Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Baseline Utility</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(qalyCalculation.baselineUtility).toFixed(2)}
                </p>
                <p className="text-slate-500 text-xs mt-1">Quality of life score</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Current Utility</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {(qalyCalculation.currentUtility).toFixed(2)}
                </p>
                <p className="text-slate-500 text-xs mt-1">Quality of life score</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Time Period</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(qalyCalculation.timePeriod).toFixed(2)}
                </p>
                <p className="text-slate-500 text-xs mt-1">Years</p>
              </div>
              
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-emerald-400 text-sm">QALY Gained</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  +{(qalyCalculation.qalyGained).toFixed(4)}
                </p>
                <p className="text-emerald-400/70 text-xs mt-1">Quality-adjusted life years</p>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Understanding QALY</p>
                  <p className="text-slate-400 text-sm mt-1">
                    QALY (Quality-Adjusted Life Year) combines quantity and quality of life into a single metric. 
                    A QALY of 1.0 represents one year of perfect health. Your improvement of {(qalyCalculation.qalyGained).toFixed(4)} QALY 
                    means you've gained the equivalent of {Math.round(qalyCalculation.qalyGained * 365)} days of perfect health 
                    over the treatment period.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost-Effectiveness Analysis */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Cost-Effectiveness Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Total Treatment Cost</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${Math.round(medicationCosts.totalCost)}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Over {medicationCosts.monthsBetween} months
                </p>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Cost per QALY</p>
                <p className={`text-2xl font-bold mt-1 ${
                  medicationCosts.costPerQaly < 50000 ? 'text-emerald-400' :
                  medicationCosts.costPerQaly < 100000 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  ${Math.round(medicationCosts.costPerQaly).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {medicationCosts.costPerQaly < 50000 ? 'Highly cost-effective' :
                   medicationCosts.costPerQaly < 100000 ? 'Cost-effective' : 'Above threshold'}
                </p>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Willingness-to-Pay Threshold</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  $50,000
                </p>
                <p className="text-slate-500 text-xs mt-1">Standard US threshold</p>
              </div>
            </div>

            {/* Cost-Effectiveness Verdict */}
            <div className={`rounded-xl p-4 ${
              medicationCosts.costPerQaly < 50000 
                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                : medicationCosts.costPerQaly < 100000
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-rose-500/10 border border-rose-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {medicationCosts.costPerQaly < 50000 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : medicationCosts.costPerQaly < 100000 ? (
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <p className={`font-semibold ${
                    medicationCosts.costPerQaly < 50000 ? 'text-emerald-400' :
                    medicationCosts.costPerQaly < 100000 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {medicationCosts.costPerQaly < 50000 
                      ? 'Treatment is Highly Cost-Effective' 
                      : medicationCosts.costPerQaly < 100000
                        ? 'Treatment is Moderately Cost-Effective'
                        : 'Treatment May Not Be Cost-Effective'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    At ${Math.round(medicationCosts.costPerQaly).toLocaleString()} per QALY, this treatment 
                    {medicationCosts.costPerQaly < 50000 
                      ? ' falls well below the standard willingness-to-pay threshold of $50,000/QALY, indicating excellent value for the health outcomes achieved.'
                      : medicationCosts.costPerQaly < 100000
                        ? ' is between the standard ($50,000) and extended ($100,000) thresholds, suggesting reasonable value.'
                        : ' exceeds typical cost-effectiveness thresholds. Consider discussing alternatives with your healthcare provider.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Summary */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Return on Investment Summary
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Investment Area</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Cost</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Outcome</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-white">Medication Therapy</td>
                    <td className="py-3 px-4 text-right text-slate-300">${Math.round(medicationCosts.totalCost)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">+{(qalyCalculation.qalyGained).toFixed(4)} QALY</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded-lg text-sm ${
                        medicationCosts.costPerQaly < 50000 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {medicationCosts.costPerQaly < 50000 ? 'Excellent' : 'Good'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-white">Symptom Reduction</td>
                    <td className="py-3 px-4 text-right text-slate-300">Included</td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      {symptomComparison.filter(s => s.status === 'improved').length}/{symptomComparison.length} improved
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-1 rounded-lg text-sm bg-emerald-500/20 text-emerald-400">
                        Excellent
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-white">Mental Health</td>
                    <td className="py-3 px-4 text-right text-slate-300">Included</td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      PSS: {visit1.rosScores.pss} → {visit2.rosScores.pss}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-1 rounded-lg text-sm bg-emerald-500/20 text-emerald-400">
                        Excellent
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-semibold">Overall Treatment Value</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">${Math.round(medicationCosts.totalCost)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                      {Math.round(outcomeMetrics.reduce((sum, m) => sum + Math.abs(m.percentChange), 0) / outcomeMetrics.length)}% avg improvement
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-3 py-1 rounded-lg text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 font-semibold">
                        High Value
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Visit Interval Legend */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-slate-400">Baseline Visit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-slate-400">3-Month Follow-up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-400">6-Month Follow-up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-400">12-Month Follow-up</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacoeconomicsView;
