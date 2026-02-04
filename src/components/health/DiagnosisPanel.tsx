import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, AlertTriangle, AlertCircle, CheckCircle2, Loader2,
  FlaskConical, Clock, FileText, ChevronDown, ChevronUp, Brain, Heart, Activity, Leaf
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';
import { ROSAnswer, ClinicalAssessment, DifferentialDiagnosis, LabRecommendation, VitalSign } from '@/types/health';
import { reviewOfSystemsSections, calculatePSSScore, calculatePHQ2Score, calculateGAD2Score, calculateACEScore } from '@/data/rosData';

interface DiagnosisPanelProps {
  rosAnswers: ROSAnswer[];
  vitals: VitalSign[];
  onDiagnosisGenerated: (assessment: ClinicalAssessment) => void;
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ rosAnswers, vitals, onDiagnosisGenerated }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<ClinicalAssessment | null>(null);
  const [expandedDiagnosis, setExpandedDiagnosis] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>('all');

  useEffect(() => {
    generateDiagnosis();
  }, []);

  // Analyze ROS answers to generate context-aware diagnoses
  const analyzeROSAnswers = () => {
    const answerMap = Object.fromEntries(rosAnswers.map(a => [a.questionId, a.answer]));
    
    // Calculate psychometric scores
    const pssScore = calculatePSSScore(answerMap);
    const phq2Score = calculatePHQ2Score(answerMap);
    const gad2Score = calculateGAD2Score(answerMap);
    const aceScore = calculateACEScore(answerMap);
    
    // Analyze different domains
    const findings = {
      hormonal: {
        estrogenDominance: false,
        progesteroneDeficiency: false,
        symptoms: [] as string[]
      },
      environmental: {
        toxinExposure: false,
        heavyMetalRisk: false,
        symptoms: [] as string[]
      },
      stress: {
        highStress: pssScore > 20,
        burnout: false,
        symptoms: [] as string[]
      },
      psychosocial: {
        depression: phq2Score >= 3,
        anxiety: gad2Score >= 3,
        trauma: aceScore >= 4,
        symptoms: [] as string[]
      },
      dietary: {
        poorDiet: false,
        nutritionalDeficiency: false,
        symptoms: [] as string[]
      },
      metabolic: {
        symptoms: [] as string[]
      }
    };

    // Analyze hormonal symptoms
    const hormonalQuestions = reviewOfSystemsSections.find(s => s.id === 'hormonal')?.questions || [];
    hormonalQuestions.forEach(q => {
      if (answerMap[q.id] === true) {
        if (q.category === 'estrogen' || ['horm-7', 'horm-8', 'horm-9', 'horm-10', 'horm-11', 'horm-12', 'horm-13', 'horm-14', 'horm-15', 'horm-16', 'horm-17', 'horm-18'].includes(q.id)) {
          findings.hormonal.estrogenDominance = true;
          findings.hormonal.symptoms.push(q.question);
        }
        if (q.category === 'progesterone' || ['horm-19', 'horm-20', 'horm-21', 'horm-22', 'horm-23', 'horm-24', 'horm-25'].includes(q.id)) {
          findings.hormonal.progesteroneDeficiency = true;
          findings.hormonal.symptoms.push(q.question);
        }
      }
    });

    // Analyze environmental exposures
    const envQuestions = reviewOfSystemsSections.find(s => s.id === 'environmental')?.questions || [];
    envQuestions.forEach(q => {
      if (answerMap[q.id] === true || (typeof answerMap[q.id] === 'string' && !['Never', 'No'].includes(answerMap[q.id] as string))) {
        if (q.category === 'heavy_metals' || ['env-29', 'env-30', 'env-32', 'env-33', 'env-34', 'env-35a'].includes(q.id)) {
          findings.environmental.heavyMetalRisk = true;
        }
        findings.environmental.toxinExposure = true;
        findings.environmental.symptoms.push(q.question);
      }
    });

    // Analyze stress symptoms
    if (answerMap['stress-19'] === true) findings.stress.burnout = true;
    const stressSymptoms = answerMap['stress-17'] as string[] || [];
    findings.stress.symptoms = stressSymptoms;

    // Analyze dietary patterns
    const dietQuestions = reviewOfSystemsSections.find(s => s.id === 'dietary')?.questions || [];
    const dietScore = answerMap['diet-31'] as number || 5;
    if (dietScore < 5) findings.dietary.poorDiet = true;

    return { findings, pssScore, phq2Score, gad2Score, aceScore };
  };

  const generateDiagnosis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Format vitals for the API
      const vitalsData = {
        heartRate: vitals.find(v => v.name === 'Heart Rate')?.value || 72,
        systolic: 120,
        diastolic: 80,
        temperature: vitals.find(v => v.name === 'Temperature')?.value || 98.6,
        respiratoryRate: vitals.find(v => v.name === 'Respiratory Rate')?.value || 16,
        o2Saturation: vitals.find(v => v.name === 'O2 Saturation')?.value || 98,
        bloodGlucose: vitals.find(v => v.name === 'Blood Glucose')?.value || 95,
      };

      const { data, error: fnError } = await invokeFunction('clinical-diagnosis', {
        action: 'generate_diagnosis',
        rosAnswers,
        vitals: vitalsData
      });

      if (fnError) throw fnError;

      // Create assessment object
      const newAssessment: ClinicalAssessment = {
        id: `assessment-${Date.now()}`,
        patientId: 'patient-001',
        rosId: `ros-${Date.now()}`,
        createdAt: new Date(),
        differentialDiagnoses: data.differentialDiagnoses || [],
        recommendedLabs: data.recommendedLabs || [],
        aiSummary: data.aiSummary || 'Assessment generated successfully.',
        status: 'pending_provider_review'
      };

      setAssessment(newAssessment);
    } catch (err: any) {
      console.error('Diagnosis generation error:', err);
      
      // Generate comprehensive fallback assessment based on ROS analysis
      const { findings, pssScore, phq2Score, gad2Score, aceScore } = analyzeROSAnswers();
      
      const differentialDiagnoses: DifferentialDiagnosis[] = [];
      const recommendedLabs: LabRecommendation[] = [];

      // Add diagnoses based on findings
      
      // Hormonal diagnoses
      if (findings.hormonal.estrogenDominance) {
        differentialDiagnoses.push({
          id: 'dx-estrogen',
          condition: 'Estrogen Dominance / Relative Progesterone Deficiency',
          icdCode: 'E28.9',
          probability: 'high',
          supportingSymptoms: findings.hormonal.symptoms.slice(0, 5),
          rulingOutFactors: ['Hormone levels needed for confirmation', 'Rule out thyroid dysfunction', 'Consider liver function'],
          recommendedTests: ['Estradiol', 'Progesterone', 'FSH', 'LH', 'SHBG', 'Testosterone'],
          urgency: 'routine'
        });
      }

      if (findings.hormonal.progesteroneDeficiency) {
        differentialDiagnoses.push({
          id: 'dx-progesterone',
          condition: 'Progesterone Deficiency',
          icdCode: 'E28.39',
          probability: 'moderate',
          supportingSymptoms: ['Sleep disturbances', 'Anxiety', 'Irregular cycles', 'Infertility concerns'],
          rulingOutFactors: ['Luteal phase testing needed', 'Consider adrenal function'],
          recommendedTests: ['Day 21 Progesterone', 'Pregnenolone', 'Cortisol'],
          urgency: 'routine'
        });
      }

      // Environmental/Toxin diagnoses
      if (findings.environmental.heavyMetalRisk) {
        differentialDiagnoses.push({
          id: 'dx-heavymetal',
          condition: 'Heavy Metal Toxicity',
          icdCode: 'T56.9',
          probability: 'moderate',
          supportingSymptoms: ['Environmental exposure history', 'Neurological symptoms', 'Fatigue'],
          rulingOutFactors: ['Provoked urine testing may be needed', 'Consider occupational history'],
          recommendedTests: ['Blood Lead', 'Blood Mercury', 'Urine Heavy Metals Panel', 'RBC Elements'],
          urgency: 'routine'
        });
      }

      if (findings.environmental.toxinExposure) {
        differentialDiagnoses.push({
          id: 'dx-toxin',
          condition: 'Environmental Toxin Exposure',
          icdCode: 'T65.9',
          probability: 'moderate',
          supportingSymptoms: findings.environmental.symptoms.slice(0, 4),
          rulingOutFactors: ['Specific toxin identification needed', 'Consider home/work environment assessment'],
          recommendedTests: ['Liver Function Tests', 'Kidney Function', 'Organic Acids Test', 'GPL-TOX Panel'],
          urgency: 'routine'
        });
      }

      // Stress-related diagnoses
      if (findings.stress.highStress) {
        differentialDiagnoses.push({
          id: 'dx-stress',
          condition: 'Chronic Stress Syndrome',
          icdCode: 'F43.8',
          probability: pssScore > 26 ? 'high' : 'moderate',
          supportingSymptoms: ['High perceived stress score', 'Physical stress symptoms', 'Sleep disturbances', 'Fatigue'],
          rulingOutFactors: ['Rule out adrenal dysfunction', 'Consider thyroid function'],
          recommendedTests: ['Cortisol (AM/PM)', 'DHEA-S', 'Cortisol Awakening Response', 'Neurotransmitter Panel'],
          urgency: 'routine'
        });
      }

      if (findings.stress.burnout) {
        differentialDiagnoses.push({
          id: 'dx-burnout',
          condition: 'Burnout Syndrome',
          icdCode: 'Z73.0',
          probability: 'high',
          supportingSymptoms: ['Emotional exhaustion', 'Cynicism', 'Reduced effectiveness', 'Physical symptoms'],
          rulingOutFactors: ['Differentiate from major depression', 'Consider occupational factors'],
          recommendedTests: ['Adrenal Function Panel', 'Vitamin B Panel', 'Magnesium RBC'],
          urgency: 'routine'
        });
      }

      // Psychosocial diagnoses
      if (findings.psychosocial.depression) {
        differentialDiagnoses.push({
          id: 'dx-depression',
          condition: 'Major Depressive Disorder',
          icdCode: 'F32.9',
          probability: 'high',
          supportingSymptoms: ['Positive PHQ-2 screen', 'Anhedonia', 'Depressed mood'],
          rulingOutFactors: ['Full PHQ-9 assessment recommended', 'Rule out medical causes', 'Consider bipolar screening'],
          recommendedTests: ['TSH', 'Vitamin D', 'Vitamin B12', 'Folate', 'Iron Panel'],
          urgency: 'urgent'
        });
      }

      if (findings.psychosocial.anxiety) {
        differentialDiagnoses.push({
          id: 'dx-anxiety',
          condition: 'Generalized Anxiety Disorder',
          icdCode: 'F41.1',
          probability: 'high',
          supportingSymptoms: ['Positive GAD-2 screen', 'Excessive worry', 'Difficulty controlling worry'],
          rulingOutFactors: ['Full GAD-7 assessment recommended', 'Rule out thyroid dysfunction', 'Consider panic disorder'],
          recommendedTests: ['TSH', 'Free T4', 'Magnesium', 'GABA/Glutamate ratio'],
          urgency: 'urgent'
        });
      }

      if (findings.psychosocial.trauma) {
        differentialDiagnoses.push({
          id: 'dx-trauma',
          condition: 'Trauma-Related Disorder / Complex PTSD',
          icdCode: 'F43.10',
          probability: 'moderate',
          supportingSymptoms: ['Multiple adverse childhood experiences', 'Trauma history', 'Hypervigilance'],
          rulingOutFactors: ['Full trauma assessment recommended', 'Consider somatic symptoms', 'Evaluate dissociation'],
          recommendedTests: ['Cortisol Pattern', 'Inflammatory Markers (hs-CRP, IL-6)', 'HRV Assessment'],
          urgency: 'routine'
        });
      }

      // Dietary/Nutritional diagnoses
      if (findings.dietary.poorDiet) {
        differentialDiagnoses.push({
          id: 'dx-nutrition',
          condition: 'Nutritional Deficiency Syndrome',
          icdCode: 'E63.9',
          probability: 'moderate',
          supportingSymptoms: ['Poor dietary quality', 'Fatigue', 'Cognitive symptoms'],
          rulingOutFactors: ['Specific deficiencies need identification', 'Consider malabsorption'],
          recommendedTests: ['Comprehensive Metabolic Panel', 'Vitamin D', 'B12', 'Folate', 'Iron Panel', 'Zinc', 'Magnesium RBC'],
          urgency: 'routine'
        });
      }

      // Always include baseline metabolic assessment
      differentialDiagnoses.push({
        id: 'dx-metabolic',
        condition: 'Metabolic Syndrome Evaluation',
        icdCode: 'E88.81',
        probability: 'moderate',
        supportingSymptoms: ['Cardiovascular risk assessment', 'Metabolic health screening'],
        rulingOutFactors: ['Full lipid panel needed', 'Glucose tolerance assessment'],
        recommendedTests: ['Lipid Panel', 'HbA1c', 'Fasting Insulin', 'hs-CRP'],
        urgency: 'routine'
      });

      // Generate comprehensive lab recommendations
      recommendedLabs.push(
        {
          id: 'lab-cmp',
          testName: 'Comprehensive Metabolic Panel (CMP)',
          testCode: '80053',
          reason: 'Evaluate kidney function, electrolytes, glucose, and liver enzymes',
          priority: 'routine',
          relatedDiagnoses: ['Metabolic Syndrome', 'Nutritional Assessment'],
          fastingRequired: true
        },
        {
          id: 'lab-cbc',
          testName: 'Complete Blood Count with Differential',
          testCode: '85025',
          reason: 'Evaluate blood cell counts, anemia, and immune function',
          priority: 'routine',
          relatedDiagnoses: ['General Assessment', 'Anemia Workup'],
          fastingRequired: false
        },
        {
          id: 'lab-thyroid',
          testName: 'Comprehensive Thyroid Panel',
          testCode: '84439',
          reason: 'TSH, Free T4, Free T3, TPO Antibodies - evaluate thyroid function',
          priority: 'routine',
          relatedDiagnoses: ['Fatigue Workup', 'Metabolic Assessment'],
          fastingRequired: false
        }
      );

      // Add hormone panel if hormonal symptoms present
      if (findings.hormonal.estrogenDominance || findings.hormonal.progesteroneDeficiency) {
        recommendedLabs.push({
          id: 'lab-hormones',
          testName: 'Female Hormone Panel',
          testCode: '84402',
          reason: 'Estradiol, Progesterone, FSH, LH, SHBG, Testosterone - evaluate hormonal balance',
          priority: 'routine',
          relatedDiagnoses: ['Estrogen Dominance', 'Progesterone Deficiency'],
          fastingRequired: false
        });
      }

      // Add heavy metal testing if exposure risk
      if (findings.environmental.heavyMetalRisk) {
        recommendedLabs.push({
          id: 'lab-metals',
          testName: 'Heavy Metals Panel (Blood)',
          testCode: '83655',
          reason: 'Lead, Mercury, Arsenic, Cadmium - evaluate toxic metal exposure',
          priority: 'routine',
          relatedDiagnoses: ['Heavy Metal Toxicity', 'Environmental Exposure'],
          fastingRequired: false
        });
      }

      // Add stress markers if high stress
      if (findings.stress.highStress) {
        recommendedLabs.push({
          id: 'lab-cortisol',
          testName: 'Cortisol (AM/PM) with DHEA-S',
          testCode: '82533',
          reason: 'Evaluate adrenal function and stress response',
          priority: 'routine',
          relatedDiagnoses: ['Chronic Stress', 'Adrenal Dysfunction'],
          fastingRequired: false
        });
      }

      // Add inflammatory markers
      recommendedLabs.push({
        id: 'lab-inflammation',
        testName: 'Inflammatory Markers Panel',
        testCode: '86140',
        reason: 'hs-CRP, ESR, Homocysteine - evaluate systemic inflammation',
        priority: 'routine',
        relatedDiagnoses: ['Cardiovascular Risk', 'Chronic Inflammation'],
        fastingRequired: false
      });

      // Add nutritional markers
      recommendedLabs.push({
        id: 'lab-vitamins',
        testName: 'Nutritional Markers Panel',
        testCode: '84207',
        reason: 'Vitamin D, B12, Folate, Iron Panel, Ferritin, Magnesium RBC',
        priority: 'routine',
        relatedDiagnoses: ['Nutritional Deficiency', 'Fatigue Workup'],
        fastingRequired: false
      });

      // Add lipid panel
      recommendedLabs.push({
        id: 'lab-lipid',
        testName: 'Advanced Lipid Panel',
        testCode: '80061',
        reason: 'Total Cholesterol, LDL, HDL, Triglycerides, LDL Particle Number',
        priority: 'routine',
        relatedDiagnoses: ['Cardiovascular Risk', 'Metabolic Syndrome'],
        fastingRequired: true
      });

      // Generate AI summary
      const summaryParts = [];
      summaryParts.push('Based on comprehensive review of systems analysis including validated psychometric assessments:');
      
      if (pssScore > 20) summaryParts.push(`High perceived stress (PSS score: ${pssScore}/40).`);
      if (phq2Score >= 3) summaryParts.push('Positive depression screen - further evaluation recommended.');
      if (gad2Score >= 3) summaryParts.push('Positive anxiety screen - further evaluation recommended.');
      if (aceScore >= 4) summaryParts.push(`Significant adverse childhood experiences (ACE score: ${aceScore}/10) - trauma-informed approach recommended.`);
      if (findings.hormonal.estrogenDominance) summaryParts.push('Symptoms consistent with estrogen dominance pattern.');
      if (findings.environmental.heavyMetalRisk) summaryParts.push('Environmental exposure history warrants toxicological evaluation.');
      
      summaryParts.push('Provider review is required before proceeding with testing or treatment.');

      const fallbackAssessment: ClinicalAssessment = {
        id: `assessment-${Date.now()}`,
        patientId: 'patient-001',
        rosId: `ros-${Date.now()}`,
        createdAt: new Date(),
        differentialDiagnoses,
        recommendedLabs,
        aiSummary: summaryParts.join(' '),
        status: 'pending_provider_review'
      };
      
      setAssessment(fallbackAssessment);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergent': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'urgent': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      default: return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'high': return 'text-rose-400';
      case 'moderate': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  const getCategoryIcon = (condition: string) => {
    if (condition.toLowerCase().includes('estrogen') || condition.toLowerCase().includes('progesterone') || condition.toLowerCase().includes('hormone')) {
      return <Activity className="w-4 h-4" />;
    }
    if (condition.toLowerCase().includes('stress') || condition.toLowerCase().includes('burnout')) {
      return <Brain className="w-4 h-4" />;
    }
    if (condition.toLowerCase().includes('depression') || condition.toLowerCase().includes('anxiety') || condition.toLowerCase().includes('trauma')) {
      return <Heart className="w-4 h-4" />;
    }
    if (condition.toLowerCase().includes('toxin') || condition.toLowerCase().includes('metal') || condition.toLowerCase().includes('environmental')) {
      return <Leaf className="w-4 h-4" />;
    }
    return <Stethoscope className="w-4 h-4" />;
  };

  const handleContinue = () => {
    if (assessment) {
      onDiagnosisGenerated(assessment);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Analyzing Comprehensive Assessment</h3>
          <p className="text-slate-400 text-center max-w-md">
            Our AI is analyzing your review of systems including hormonal patterns, environmental exposures, 
            stress levels, psychosocial factors, and dietary habits to generate personalized differential 
            diagnoses and laboratory recommendations...
          </p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-red-500/30 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Analysis Failed</h3>
          <p className="text-slate-400 text-center mb-4">{error || 'Unable to generate diagnosis'}</p>
          <button
            onClick={generateDiagnosis}
            className="px-6 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Group diagnoses by category
  const diagnosisCategories = {
    hormonal: assessment.differentialDiagnoses.filter(d => 
      d.condition.toLowerCase().includes('estrogen') || 
      d.condition.toLowerCase().includes('progesterone') ||
      d.condition.toLowerCase().includes('hormone')
    ),
    environmental: assessment.differentialDiagnoses.filter(d => 
      d.condition.toLowerCase().includes('toxin') || 
      d.condition.toLowerCase().includes('metal') ||
      d.condition.toLowerCase().includes('environmental')
    ),
    stress: assessment.differentialDiagnoses.filter(d => 
      d.condition.toLowerCase().includes('stress') || 
      d.condition.toLowerCase().includes('burnout')
    ),
    psychosocial: assessment.differentialDiagnoses.filter(d => 
      d.condition.toLowerCase().includes('depression') || 
      d.condition.toLowerCase().includes('anxiety') ||
      d.condition.toLowerCase().includes('trauma')
    ),
    metabolic: assessment.differentialDiagnoses.filter(d => 
      d.condition.toLowerCase().includes('metabolic') || 
      d.condition.toLowerCase().includes('nutrition')
    ),
  };

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Comprehensive Clinical Assessment Summary</h3>
            <p className="text-slate-300">{assessment.aiSummary}</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setExpandedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            expandedCategory === 'all' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          All Diagnoses ({assessment.differentialDiagnoses.length})
        </button>
        {diagnosisCategories.hormonal.length > 0 && (
          <button
            onClick={() => setExpandedCategory('hormonal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              expandedCategory === 'hormonal' ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Activity className="w-4 h-4" />
            Hormonal ({diagnosisCategories.hormonal.length})
          </button>
        )}
        {diagnosisCategories.environmental.length > 0 && (
          <button
            onClick={() => setExpandedCategory('environmental')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              expandedCategory === 'environmental' ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Leaf className="w-4 h-4" />
            Environmental ({diagnosisCategories.environmental.length})
          </button>
        )}
        {diagnosisCategories.stress.length > 0 && (
          <button
            onClick={() => setExpandedCategory('stress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              expandedCategory === 'stress' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Brain className="w-4 h-4" />
            Stress ({diagnosisCategories.stress.length})
          </button>
        )}
        {diagnosisCategories.psychosocial.length > 0 && (
          <button
            onClick={() => setExpandedCategory('psychosocial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              expandedCategory === 'psychosocial' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Heart className="w-4 h-4" />
            Psychosocial ({diagnosisCategories.psychosocial.length})
          </button>
        )}
      </div>

      {/* Differential Diagnoses */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Differential Diagnoses
        </h3>
        
        <div className="space-y-3">
          {(expandedCategory === 'all' 
            ? assessment.differentialDiagnoses 
            : diagnosisCategories[expandedCategory as keyof typeof diagnosisCategories] || []
          ).map((dx, index) => (
            <div 
              key={dx.id}
              className={`rounded-xl border transition-all ${getUrgencyColor(dx.urgency)}`}
            >
              <button
                onClick={() => setExpandedDiagnosis(expandedDiagnosis === dx.id ? null : dx.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700/50">
                    {getCategoryIcon(dx.condition)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white">{dx.condition}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                        {dx.icdCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-sm font-medium ${getProbabilityColor(dx.probability)}`}>
                        {dx.probability.charAt(0).toUpperCase() + dx.probability.slice(1)} Probability
                      </span>
                      <span className="text-xs text-slate-400">
                        {dx.urgency.charAt(0).toUpperCase() + dx.urgency.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedDiagnosis === dx.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {expandedDiagnosis === dx.id && (
                <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-emerald-400 mb-2">Supporting Symptoms</h5>
                      <ul className="space-y-1">
                        {dx.supportingSymptoms.map((symptom, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-1 flex-shrink-0" />
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-amber-400 mb-2">Ruling Out Factors</h5>
                      <ul className="space-y-1">
                        {dx.rulingOutFactors.map((factor, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-400 mt-1 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-cyan-400 mb-2">Recommended Tests</h5>
                    <div className="flex flex-wrap gap-2">
                      {dx.recommendedTests.map((test, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                          {test}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Labs */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-cyan-400" />
          Recommended Laboratory Tests
        </h3>
        
        <div className="space-y-3">
          {assessment.recommendedLabs.map((lab) => (
            <div 
              key={lab.id}
              className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium text-white">{lab.testName}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                      CPT: {lab.testCode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{lab.reason}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      lab.priority === 'stat' ? 'bg-red-500/20 text-red-400' :
                      lab.priority === 'urgent' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {(lab.priority || 'routine').toUpperCase()}
                    </span>
                    {lab.fastingRequired && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Fasting Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Review Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium">Provider Review Required</p>
            <p className="text-sm text-amber-400/80 mt-1">
              These AI-generated diagnoses and laboratory recommendations are based on validated psychometric 
              instruments and comprehensive symptom analysis. However, they must be reviewed and approved by 
              a licensed healthcare provider before any tests can be ordered or treatments initiated. The 
              provider will also conduct a physical examination before finalizing the treatment plan.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
        >
          Continue to Provider Review
        </button>
      </div>
    </div>
  );
};

export default DiagnosisPanel;
