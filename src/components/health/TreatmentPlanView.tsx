import React, { useState, useEffect } from 'react';
import { 
  FileText, Pill, Heart, Leaf, AlertTriangle, CheckCircle2, Loader2,
  Calendar, Download, Printer, ChevronDown, ChevronUp,
  Brain, Activity, Shield, Utensils, Moon, Dumbbell
} from 'lucide-react';
import { apiPost, apiPatch, invokeFunction } from '@/lib/api';
import html2pdf from 'html2pdf.js';
import { 
  ClinicalAssessment, PhysicalExamination, TreatmentPlan,
  Medication, LifestyleRecommendation, OrthomolecularRecommendation, ROSAnswer
} from '@/types/health';
import { reviewOfSystemsSections } from '@/data/rosData';
import { useUser } from '@/contexts/UserContext';

interface TreatmentPlanViewProps {
  assessment?: ClinicalAssessment;
  physicalExam?: PhysicalExamination;
  initialPlan?: TreatmentPlan;
  rosAnswers?: ROSAnswer[];
  planContext?: {
    clinicalAssessmentId?: string | null;
    patientId?: string | null;
    providerId?: string | null;
  };
  onFinalize: (plan: TreatmentPlan) => void;
}

const normalizePlanDates = (plan: TreatmentPlan): TreatmentPlan => ({
  ...plan,
  createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
  patientAcknowledgedAt: plan.patientAcknowledgedAt ? new Date(plan.patientAcknowledgedAt) : undefined,
});

const TreatmentPlanView: React.FC<TreatmentPlanViewProps> = ({ assessment, physicalExam, initialPlan, rosAnswers, planContext, onFinalize }) => {
  const { userRole } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('medications');
  const [patientAcknowledged, setPatientAcknowledged] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setTreatmentPlan(normalizePlanDates(initialPlan));
      setIsLoading(false);
      return;
    }
    if (!assessment || !physicalExam) {
      setIsLoading(false);
      return;
    }
    generateTreatmentPlan();
  }, [assessment, initialPlan, physicalExam]);

  const formatRosAnswer = (answer: ROSAnswer['answer']) => {
    if (answer === null || answer === undefined || answer === '') return 'Not answered';
    if (typeof answer === 'boolean') return answer ? 'Yes' : 'No';
    if (typeof answer === 'number') return String(answer);
    if (Array.isArray(answer)) {
      return answer.length > 0 ? answer.join(', ') : 'Not answered';
    }
    return String(answer);
  };

  const buildRosEntries = () => {
    const answerMap = new Map((rosAnswers || []).map(item => [item.questionId, item.answer]));
    const entries: Array<{ section: string; question: string; answer: string }> = [];
    reviewOfSystemsSections.forEach(section => {
      section.questions.forEach(question => {
        const answer = formatRosAnswer(answerMap.get(question.id) as any);
        entries.push({ section: section.name, question: question.question, answer });
      });
    });
    return entries;
  };

  const buildReportText = () => {
    const lines: string[] = [];
    lines.push('Comprehensive Treatment Plan');
    lines.push(`Provider: ${treatmentPlan?.providerName || 'Provider'}`);
    lines.push(`Date: ${treatmentPlan?.createdAt.toLocaleDateString() || ''}`);
    lines.push('');
    lines.push('Medications & Referrals:');
    if (treatmentPlan?.medications.length) {
      treatmentPlan.medications.forEach((med, index) => {
        lines.push(`${index + 1}. ${med.name}`);
        lines.push(`   Dosage: ${med.dosage} | Frequency: ${med.frequency} | Duration: ${med.duration}`);
        lines.push(`   Instructions: ${med.instructions}`);
        if (med.warnings?.length) lines.push(`   Warnings: ${med.warnings.join(', ')}`);
        lines.push('');
      });
    } else {
      lines.push('   None');
      lines.push('');
    }

    lines.push('Lifestyle Modifications:');
    if (treatmentPlan?.lifestyleRecommendations.length) {
      treatmentPlan.lifestyleRecommendations.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec.recommendation}`);
        lines.push(`   Priority: ${rec.priority.toUpperCase()} | Category: ${rec.category}`);
        lines.push(`   Details: ${rec.details}`);
        if (rec.resources?.length) lines.push(`   Resources: ${rec.resources.join(', ')}`);
        lines.push('');
      });
    } else {
      lines.push('   None');
      lines.push('');
    }

    lines.push('Supplements:');
    if (treatmentPlan?.orthomolecularRecommendations.length) {
      treatmentPlan.orthomolecularRecommendations.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.supplement}`);
        lines.push(`   Dosage: ${item.dosage} | Frequency: ${item.frequency}`);
        lines.push(`   Reason: ${item.reason}`);
        lines.push(`   Evidence: ${item.evidenceLevel.toUpperCase()}`);
        if (item.contraindications?.length) lines.push(`   Contraindications: ${item.contraindications.join(', ')}`);
        if (item.interactions?.length) lines.push(`   Interactions: ${item.interactions.join(', ')}`);
        lines.push('');
      });
    } else {
      lines.push('   None');
      lines.push('');
    }

    lines.push('Follow Up:');
    lines.push(treatmentPlan?.followUpInstructions || '');
    lines.push('');
    lines.push('Review of Systems (All Questions):');
    const grouped = buildRosEntries().reduce((acc, entry) => {
      acc[entry.section] = acc[entry.section] || [];
      acc[entry.section].push(entry);
      return acc;
    }, {} as Record<string, Array<{ section: string; question: string; answer: string }>>);
    Object.entries(grouped).forEach(([sectionName, items]) => {
      lines.push('');
      lines.push(`=== ${sectionName} ===`);
      items.forEach((entry, index) => {
        lines.push(`${index + 1}. ${entry.question}`);
        lines.push(`   Answer: ${entry.answer}`);
      });
    });
    return lines.join('\n');
  };

  const buildReportHtml = () => {
    if (!treatmentPlan) return '';
    const rosGroups = buildRosEntries().reduce((acc, entry) => {
      acc[entry.section] = acc[entry.section] || [];
      acc[entry.section].push(entry);
      return acc;
    }, {} as Record<string, Array<{ section: string; question: string; answer: string }>>);
    const rosHtml = Object.entries(rosGroups).map(([sectionName, items]) => `
      <div class="ros-group">
        <div class="ros-group-title">${sectionName}</div>
        <div class="ros-list">
          ${items.map((entry, index) => `
            <div class="ros-item">
              <div class="ros-q">${index + 1}. ${entry.question}</div>
              <div class="ros-a">${entry.answer}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    const medsHtml = treatmentPlan.medications.length
      ? treatmentPlan.medications.map((med, index) => `
          <div class="detail-card">
            <div class="detail-title">
              <span class="badge badge-rose">${index + 1}</span>
              <span>${med.name}</span>
            </div>
            <div class="detail-grid">
              <div><span class="label">Dosage</span><span class="value">${med.dosage}</span></div>
              <div><span class="label">Frequency</span><span class="value">${med.frequency}</span></div>
              <div><span class="label">Duration</span><span class="value">${med.duration}</span></div>
            </div>
            <p class="detail-note"><strong>Instructions:</strong> ${med.instructions}</p>
            ${med.warnings?.length ? `<p class="detail-warning"><strong>Warnings:</strong> ${med.warnings.join(', ')}</p>` : ''}
          </div>
        `).join('')
      : '<p class="empty">None</p>';

    const lifestyleHtml = treatmentPlan.lifestyleRecommendations.length
      ? treatmentPlan.lifestyleRecommendations.map((rec, index) => `
          <div class="detail-card">
            <div class="detail-title">
              <span class="badge badge-emerald">${index + 1}</span>
              <span>${rec.recommendation}</span>
            </div>
            <div class="detail-grid">
              <div><span class="label">Priority</span><span class="value">${rec.priority.toUpperCase()}</span></div>
              <div><span class="label">Category</span><span class="value">${rec.category}</span></div>
            </div>
            <p class="detail-note"><strong>Details:</strong> ${rec.details}</p>
            ${rec.resources?.length ? `<p class="detail-note"><strong>Resources:</strong> ${rec.resources.join(', ')}</p>` : ''}
          </div>
        `).join('')
      : '<p class="empty">None</p>';

    const supplementsHtml = treatmentPlan.orthomolecularRecommendations.length
      ? treatmentPlan.orthomolecularRecommendations.map((item, index) => `
          <div class="detail-card">
            <div class="detail-title">
              <span class="badge badge-purple">${index + 1}</span>
              <span>${item.supplement}</span>
            </div>
            <div class="detail-grid">
              <div><span class="label">Dosage</span><span class="value">${item.dosage}</span></div>
              <div><span class="label">Frequency</span><span class="value">${item.frequency}</span></div>
              <div><span class="label">Evidence</span><span class="value">${item.evidenceLevel.toUpperCase()}</span></div>
            </div>
            <p class="detail-note"><strong>Reason:</strong> ${item.reason}</p>
            ${item.contraindications?.length ? `<p class="detail-warning"><strong>Contraindications:</strong> ${item.contraindications.join(', ')}</p>` : ''}
            ${item.interactions?.length ? `<p class="detail-warning"><strong>Interactions:</strong> ${item.interactions.join(', ')}</p>` : ''}
          </div>
        `).join('')
      : '<p class="empty">None</p>';

    return `
      <div class="hero">
        <div class="hero-card">
          <div class="eyebrow">Comprehensive Treatment Plan</div>
          <h1>Personalized Care Summary</h1>
          <p class="subtitle">A structured plan based on clinical review, diagnostics, and patient-reported history.</p>
          <div class="hero-grid">
            <div>
              <span class="meta-label">Provider</span>
              <span class="meta-value">${treatmentPlan.providerName}</span>
            </div>
            <div>
              <span class="meta-label">Date</span>
              <span class="meta-value">${treatmentPlan.createdAt.toLocaleDateString()}</span>
            </div>
            <div>
              <span class="meta-label">Plan Status</span>
              <span class="meta-value">Draft</span>
            </div>
          </div>
        </div>
        <div class="meta-card">
          <div class="meta-highlight">
            <span class="meta-label">Focus Areas</span>
            <span class="meta-value">Medication, Lifestyle, Supplements</span>
          </div>
          <div>
            <span class="meta-label">Care Note</span>
            <span class="meta-value">Review with your provider</span>
          </div>
        </div>
      </div>

      <div class="pill-row">
        <span class="pill pill-rose">${treatmentPlan.medications.length} Medications/Referrals</span>
        <span class="pill pill-emerald">${treatmentPlan.lifestyleRecommendations.length} Lifestyle Modifications</span>
        <span class="pill pill-purple">${treatmentPlan.orthomolecularRecommendations.length} Supplements</span>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-icon rose"></span>
          <h2>Medications & Referrals</h2>
        </div>
        <div class="detail-stack">${medsHtml}</div>
      </div>
      <div class="section">
        <div class="section-header">
          <span class="section-icon emerald"></span>
          <h2>Lifestyle Modifications</h2>
        </div>
        <div class="detail-stack">${lifestyleHtml}</div>
      </div>
      <div class="section">
        <div class="section-header">
          <span class="section-icon purple"></span>
          <h2>Supplements</h2>
        </div>
        <div class="detail-stack">${supplementsHtml}</div>
      </div>
      <div class="section">
        <div class="section-header">
          <span class="section-icon slate"></span>
          <h2>Follow Up</h2>
        </div>
        <p>${treatmentPlan.followUpInstructions}</p>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-icon slate"></span>
          <h2>Review of Systems (All Questions)</h2>
        </div>
        <div class="ros-list">${rosHtml}</div>
      </div>
    `;
  };

  const getReportStyles = () => `
    :root {
      color-scheme: light;
    }
    body {
      font-family: "Inter", "Segoe UI", Arial, sans-serif;
      padding: 36px;
      color: #0f172a;
      background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    }
    .page {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 28px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
      padding: 36px 40px 44px;
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-bottom: 18px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 12px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: #0ea5e9;
      font-weight: 700;
    }
    h1 { font-size: 30px; margin: 6px 0 8px; color: #0f172a; }
    h2 { font-size: 17px; margin: 0; color: #0f172a; }
    p { margin: 0 0 8px; line-height: 1.6; color: #334155; }
    ul { padding-left: 18px; margin: 0; }
    li { margin-bottom: 12px; color: #334155; }
    .meta {
      font-size: 12px;
      color: #64748b;
      text-align: right;
      line-height: 1.6;
    }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      margin: 8px 0 18px;
    }
    .hero-card {
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 60%, #ffffff 100%);
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 18px 20px;
      flex: 1;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 11px;
      color: #0ea5e9;
      font-weight: 600;
    }
    .subtitle { max-width: 460px; }
    .meta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 14px 16px;
      min-width: 220px;
      display: grid;
      gap: 12px;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
    }
    .meta-highlight {
      background: #ecfeff;
      border: 1px solid #bae6fd;
      border-radius: 14px;
      padding: 10px 12px;
    }
    .meta-label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .meta-value {
      display: block;
      font-size: 13px;
      color: #0f172a;
      font-weight: 600;
    }
    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
    }
    .pill {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid transparent;
    }
    .pill-rose { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
    .pill-emerald { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .pill-purple { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
    .section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px 18px;
      margin-top: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
      position: relative;
      overflow: hidden;
    }
    .section::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background: linear-gradient(180deg, #38bdf8 0%, #6366f1 100%);
      opacity: 0.35;
    }
    .detail-stack { display: grid; gap: 12px; }
    .detail-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 14px 16px;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .detail-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 10px;
    }
    .label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .value {
      display: block;
      font-size: 13px;
      color: #0f172a;
      font-weight: 600;
    }
    .detail-note {
      font-size: 13px;
      color: #475569;
      margin: 6px 0 0;
    }
    .detail-warning {
      font-size: 12px;
      color: #b45309;
      margin: 6px 0 0;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      padding: 8px 10px;
      border-radius: 10px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-rose { background: #ffe4e6; color: #be123c; }
    .badge-emerald { background: #d1fae5; color: #047857; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }
    .empty { color: #94a3b8; font-style: italic; }
    @page { margin: 24mm; }
    @media print {
      body { background: #ffffff; }
      .page { box-shadow: none; border: none; }
      .section, .detail-card { page-break-inside: avoid; break-inside: avoid; }
      h1, h2 { page-break-after: avoid; }
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .section-icon {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      display: inline-block;
    }
    .section-icon.rose { background: #fb7185; }
    .section-icon.emerald { background: #34d399; }
    .section-icon.purple { background: #a78bfa; }
    .section-icon.slate { background: #94a3b8; }
    .ros-list {
      display: grid;
      gap: 10px;
    }
    .ros-group {
      display: grid;
      gap: 10px;
      margin-bottom: 12px;
    }
    .ros-group-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.02em;
      padding: 6px 10px;
      background: #e2e8f0;
      border-radius: 10px;
      display: inline-block;
    }
    .ros-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ros-q {
      font-size: 12px;
      color: #0f172a;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .ros-a {
      font-size: 12px;
      color: #64748b;
    }
  `;

  const buildReportDocument = () => {
    const reportHtml = buildReportHtml();
    return `
      <html>
        <head>
          <title>Treatment Plan</title>
          <style>${getReportStyles()}</style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div>
                <div class="brand">PEHD</div>
              </div>
              <div class="meta">
                Generated for patient care<br/>
                Confidential
              </div>
            </div>
            ${reportHtml}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!treatmentPlan) return;
    const documentHtml = buildReportDocument();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;
    iframeDoc.open();
    iframeDoc.write(documentHtml);
    iframeDoc.close();
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 500);
    };
  };

  const handleDownload = () => {
    if (!treatmentPlan) return;
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = '860px';
    wrapper.style.opacity = '0.01';
    wrapper.style.zIndex = '-1';
    wrapper.style.pointerEvents = 'none';
    wrapper.innerHTML = `
      <style>${getReportStyles()}</style>
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">PEHD</div>
          </div>
          <div class="meta">
            Generated for patient care<br/>
            Confidential
          </div>
        </div>
        ${buildReportHtml()}
      </div>
    `;
    document.body.appendChild(wrapper);

    const runExport = () => {
      const target = wrapper.querySelector('.page') || wrapper;
      const height = wrapper.scrollHeight || target.scrollHeight || 1200;
      html2pdf()
        .from(target)
        .set({
          margin: 10,
          filename: `treatment-plan-${new Date().toISOString().split('T')[0]}.pdf`,
          html2canvas: { scale: 2, useCORS: true, windowWidth: 860, windowHeight: height },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save()
        .finally(() => {
          wrapper.remove();
        });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runExport);
    });
  };

  const handleDownloadText = () => {
    if (!treatmentPlan) return;
    const text = buildReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `treatment-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Analyze diagnoses to customize treatment plan
  const analyzeDiagnoses = () => {
    const conditions = assessment.differentialDiagnoses.map(d => d.condition.toLowerCase());
    return {
      hasHormonal: conditions.some(c => c.includes('estrogen') || c.includes('progesterone') || c.includes('hormone')),
      hasEnvironmental: conditions.some(c => c.includes('toxin') || c.includes('metal') || c.includes('environmental')),
      hasStress: conditions.some(c => c.includes('stress') || c.includes('burnout')),
      hasPsychosocial: conditions.some(c => c.includes('depression') || c.includes('anxiety') || c.includes('trauma')),
      hasMetabolic: conditions.some(c => c.includes('metabolic') || c.includes('diabetes') || c.includes('lipid')),
      hasNutritional: conditions.some(c => c.includes('nutrition') || c.includes('deficiency'))
    };
  };

  const generateTreatmentPlan = async () => {
    if (!assessment || !physicalExam) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await invokeFunction('clinical-diagnosis', {
        action: 'generate_treatment',
        diagnoses: assessment.differentialDiagnoses,
        physicalExam: physicalExam.findings,
        patientData: {
          generalAppearance: physicalExam.generalAppearance,
          additionalNotes: physicalExam.additionalNotes
        }
      });

      if (error) throw error;

      const plan: TreatmentPlan = {
        id: `plan-${Date.now()}`,
        patientId: 'patient-001',
        assessmentId: assessment.id,
        physicalExamId: physicalExam.id,
        providerId: physicalExam.providerId,
        providerName: physicalExam.providerName,
        createdAt: new Date(),
        medications: data.medications || [],
        lifestyleRecommendations: data.lifestyleRecommendations || [],
        orthomolecularRecommendations: data.orthomolecularRecommendations || [],
        followUpInstructions: data.followUpInstructions || 'Follow up in 2-4 weeks or sooner if symptoms worsen.',
        status: 'draft'
      };

      setTreatmentPlan(plan);
    } catch (err) {
      console.error('Treatment plan generation error:', err);
      
      const findings = analyzeDiagnoses();
      
      // Build comprehensive treatment plan based on diagnoses
      const medications: Medication[] = [];
      const lifestyleRecommendations: LifestyleRecommendation[] = [];
      const orthomolecularRecommendations: OrthomolecularRecommendation[] = [];

      // Hormonal Support
      if (findings.hasHormonal) {
        orthomolecularRecommendations.push(
          {
            id: 'ortho-dim',
            supplement: 'DIM (Diindolylmethane)',
            dosage: '200mg',
            frequency: 'Once daily with food',
            reason: 'Supports healthy estrogen metabolism by promoting conversion to beneficial estrogen metabolites. Helps address estrogen dominance symptoms.',
            contraindications: ['Pregnancy', 'Hormone-sensitive cancers without provider approval'],
            interactions: ['May affect hormone medications'],
            evidenceLevel: 'moderate'
          },
          {
            id: 'ortho-vitex',
            supplement: 'Vitex (Chaste Tree Berry)',
            dosage: '400mg',
            frequency: 'Once daily in the morning',
            reason: 'Supports progesterone production and hormonal balance. May help with PMS symptoms and cycle regularity.',
            contraindications: ['Pregnancy', 'Hormone-sensitive conditions', 'Dopamine-related medications'],
            interactions: ['Birth control pills', 'Dopamine agonists'],
            evidenceLevel: 'moderate'
          },
          {
            id: 'ortho-b6',
            supplement: 'Vitamin B6 (P5P form)',
            dosage: '50mg',
            frequency: 'Once daily',
            reason: 'Supports progesterone production and helps reduce estrogen dominance symptoms. Essential for neurotransmitter synthesis.',
            contraindications: ['High doses may cause neuropathy'],
            interactions: ['Levodopa'],
            evidenceLevel: 'strong'
          }
        );

        lifestyleRecommendations.push({
          id: 'life-hormone-diet',
          category: 'diet',
          recommendation: 'Hormone-Balancing Diet Protocol',
          priority: 'high',
          details: 'Increase cruciferous vegetables (broccoli, cauliflower, Brussels sprouts) for natural DIM. Consume fiber-rich foods (30g/day) to support estrogen elimination. Include flaxseeds (2 tbsp ground daily) for lignans. Reduce alcohol, caffeine, and sugar. Choose organic produce and grass-fed meats to minimize xenoestrogen exposure. Avoid plastic food containers.',
          resources: ['Hormone Reset Diet Guide', 'Clean Eating for Hormonal Health']
        });
      }

      // Environmental Detox Support
      if (findings.hasEnvironmental) {
        orthomolecularRecommendations.push(
          {
            id: 'ortho-nac',
            supplement: 'N-Acetyl Cysteine (NAC)',
            dosage: '600mg',
            frequency: 'Twice daily',
            reason: 'Precursor to glutathione, the body\'s master antioxidant. Supports liver detoxification and heavy metal chelation.',
            contraindications: ['Active bleeding', 'Asthma (may worsen in some)'],
            interactions: ['Nitroglycerin', 'Blood thinners'],
            evidenceLevel: 'strong'
          },
          {
            id: 'ortho-chlorella',
            supplement: 'Chlorella',
            dosage: '3g',
            frequency: 'Once daily with food',
            reason: 'Binds to heavy metals and toxins in the gut, supporting their elimination. Rich in chlorophyll for cellular detoxification.',
            contraindications: ['Autoimmune conditions', 'Iodine sensitivity'],
            interactions: ['Warfarin', 'Immunosuppressants'],
            evidenceLevel: 'moderate'
          },
          {
            id: 'ortho-milk-thistle',
            supplement: 'Milk Thistle (Silymarin)',
            dosage: '300mg (80% silymarin)',
            frequency: 'Twice daily',
            reason: 'Supports liver function and regeneration. Enhances Phase I and Phase II liver detoxification pathways.',
            contraindications: ['Ragweed allergy'],
            interactions: ['Medications metabolized by liver'],
            evidenceLevel: 'strong'
          }
        );

        lifestyleRecommendations.push({
          id: 'life-detox',
          category: 'habits',
          recommendation: 'Environmental Toxin Reduction Protocol',
          priority: 'high',
          details: 'Switch to natural cleaning products and personal care items. Use glass or stainless steel for food storage. Install water filtration (reverse osmosis recommended). Use HEPA air purifiers. Remove shoes at door. Sweat regularly through exercise or sauna (infrared sauna 2-3x/week if available). Consider professional home assessment for mold/lead if indicated.',
          resources: ['EWG Healthy Living App', 'Think Dirty App for Product Safety']
        });
      }

      // Stress & Adrenal Support
      if (findings.hasStress) {
        orthomolecularRecommendations.push(
          {
            id: 'ortho-ashwagandha',
            supplement: 'Ashwagandha (KSM-66)',
            dosage: '600mg',
            frequency: 'Once daily in the evening',
            reason: 'Adaptogenic herb that helps regulate cortisol levels, reduce stress and anxiety, and support adrenal function. Improves stress resilience.',
            contraindications: ['Thyroid disorders (may increase thyroid hormones)', 'Pregnancy', 'Autoimmune conditions'],
            interactions: ['Thyroid medications', 'Sedatives'],
            evidenceLevel: 'strong'
          },
          {
            id: 'ortho-rhodiola',
            supplement: 'Rhodiola Rosea',
            dosage: '400mg',
            frequency: 'Once daily in the morning',
            reason: 'Adaptogen that enhances mental performance, reduces fatigue, and improves stress tolerance. Supports cognitive function under stress.',
            contraindications: ['Bipolar disorder', 'Pregnancy'],
            interactions: ['Antidepressants', 'Stimulants'],
            evidenceLevel: 'strong'
          },
          {
            id: 'ortho-phosphatidylserine',
            supplement: 'Phosphatidylserine',
            dosage: '100mg',
            frequency: 'Three times daily',
            reason: 'Helps regulate cortisol response, supports cognitive function, and reduces stress-related cognitive decline.',
            contraindications: ['Blood thinning medications'],
            interactions: ['Anticoagulants'],
            evidenceLevel: 'moderate'
          },
          {
            id: 'ortho-ltheanine',
            supplement: 'L-Theanine',
            dosage: '200mg',
            frequency: 'Twice daily or as needed',
            reason: 'Promotes relaxation without sedation. Increases alpha brain waves, reduces anxiety, and improves focus. Can be taken with caffeine to reduce jitters.',
            contraindications: ['None significant'],
            interactions: ['Blood pressure medications'],
            evidenceLevel: 'strong'
          }
        );

        lifestyleRecommendations.push(
          {
            id: 'life-stress-mgmt',
            category: 'stress',
            recommendation: 'Comprehensive Stress Management Protocol',
            priority: 'high',
            details: 'Practice daily relaxation: 10-20 minutes of meditation, deep breathing (4-7-8 technique), or progressive muscle relaxation. Consider HeartMath or biofeedback training. Limit news/social media consumption. Schedule regular breaks during work (Pomodoro technique). Establish firm work-life boundaries. Consider therapy (CBT, EMDR) if needed.',
            resources: ['Calm or Headspace App', 'HeartMath Inner Balance']
          },
          {
            id: 'life-sleep-stress',
            category: 'sleep',
            recommendation: 'Sleep Optimization for Stress Recovery',
            priority: 'high',
            details: 'Maintain consistent sleep schedule (same time daily, including weekends). Create dark, cool (65-68°F) sleep environment. No screens 1-2 hours before bed (or use blue light blockers). Avoid caffeine after 12pm. Consider magnesium glycinate before bed. Morning sunlight exposure within 30 minutes of waking to regulate circadian rhythm.',
            resources: ['Sleep Foundation Guidelines', 'Oura Ring or Whoop for tracking']
          }
        );
      }

      // Psychosocial Support
      if (findings.hasPsychosocial) {
        medications.push({
          id: 'med-referral',
          name: 'Mental Health Referral',
          dosage: 'N/A',
          frequency: 'As scheduled',
          duration: 'Ongoing',
          route: 'other',
          instructions: 'Referral to licensed mental health professional for comprehensive evaluation and therapy. Consider CBT, EMDR, or other evidence-based therapies based on assessment.',
          warnings: ['This is a referral, not a medication'],
        });

        orthomolecularRecommendations.push(
          {
            id: 'ortho-omega3',
            supplement: 'Omega-3 Fish Oil (EPA/DHA)',
            dosage: '2000-3000mg EPA+DHA',
            frequency: 'Once daily with food',
            reason: 'High EPA content supports mood and reduces inflammation. Multiple studies show benefit for depression and anxiety. Essential for brain health.',
            contraindications: ['Fish allergy', 'Bleeding disorders'],
            interactions: ['Blood thinners'],
            evidenceLevel: 'strong'
          },
          {
            id: 'ortho-d3-mood',
            supplement: 'Vitamin D3',
            dosage: '5000 IU',
            frequency: 'Once daily with fat-containing meal',
            reason: 'Vitamin D deficiency is strongly associated with depression and anxiety. Supports neurotransmitter synthesis and immune function.',
            contraindications: ['Hypercalcemia', 'Kidney disease'],
            interactions: ['Thiazide diuretics'],
            evidenceLevel: 'strong'
          },
          {
            id: 'ortho-sam-e',
            supplement: 'SAMe (S-Adenosyl Methionine)',
            dosage: '400mg',
            frequency: 'Twice daily on empty stomach',
            reason: 'Supports methylation, neurotransmitter synthesis, and has demonstrated antidepressant effects in clinical trials.',
            contraindications: ['Bipolar disorder', 'Parkinson\'s disease'],
            interactions: ['Antidepressants (serotonin syndrome risk)', 'Levodopa'],
            evidenceLevel: 'strong'
          }
        );

        lifestyleRecommendations.push(
          {
            id: 'life-social',
            category: 'habits',
            recommendation: 'Social Connection & Support Building',
            priority: 'high',
            details: 'Schedule regular social activities (minimum 2x/week). Join support groups or community activities aligned with interests. Limit isolation. Consider volunteering. Maintain regular contact with supportive friends/family. If trauma history present, consider trauma-informed therapy (EMDR, Somatic Experiencing).',
            resources: ['NAMI Support Groups', 'Psychology Today Therapist Finder']
          },
          {
            id: 'life-exercise-mood',
            category: 'exercise',
            recommendation: 'Exercise as Medicine for Mental Health',
            priority: 'high',
            details: 'Aim for 30+ minutes of moderate exercise 5 days/week. Exercise is as effective as antidepressants for mild-moderate depression. Include both cardio and strength training. Outdoor exercise (green exercise) provides additional mental health benefits. Yoga and tai chi specifically beneficial for anxiety.',
            resources: ['Exercise and Mental Health - Harvard', 'Yoga for Anxiety - NIH']
          }
        );
      }

      // Metabolic Support
      if (findings.hasMetabolic) {
        orthomolecularRecommendations.push(
          {
            id: 'ortho-berberine',
            supplement: 'Berberine',
            dosage: '500mg',
            frequency: 'Three times daily with meals',
            reason: 'Supports healthy blood glucose and lipid levels. Activates AMPK pathway. Comparable to metformin in some studies for glucose control.',
            contraindications: ['Pregnancy', 'Liver disease'],
            interactions: ['Diabetes medications', 'Cyclosporine'],
            evidenceLevel: 'strong'
          },
          {
            id: 'ortho-chromium',
            supplement: 'Chromium Picolinate',
            dosage: '500mcg',
            frequency: 'Once daily with food',
            reason: 'Enhances insulin sensitivity and supports healthy blood sugar metabolism. May reduce carbohydrate cravings.',
            contraindications: ['Kidney disease'],
            interactions: ['Insulin', 'Diabetes medications'],
            evidenceLevel: 'moderate'
          },
          {
            id: 'ortho-alpha-lipoic',
            supplement: 'Alpha Lipoic Acid',
            dosage: '600mg',
            frequency: 'Once daily on empty stomach',
            reason: 'Powerful antioxidant that supports glucose metabolism, nerve health, and liver function. Both water and fat soluble.',
            contraindications: ['Thiamine deficiency'],
            interactions: ['Diabetes medications', 'Thyroid medications'],
            evidenceLevel: 'strong'
          }
        );

        lifestyleRecommendations.push({
          id: 'life-metabolic-diet',
          category: 'diet',
          recommendation: 'Metabolic Health Diet Protocol',
          priority: 'high',
          details: 'Focus on low glycemic index foods. Prioritize protein at each meal (palm-sized portion). Include healthy fats (olive oil, avocado, nuts). Limit refined carbohydrates and added sugars. Consider time-restricted eating (12-16 hour overnight fast). Increase fiber to 30-40g daily. Stay hydrated (half body weight in ounces of water).',
          resources: ['Glycemic Index Foundation', 'Metabolic Health Summit Resources']
        });
      }

      // Always include foundational support
      orthomolecularRecommendations.push(
        {
          id: 'ortho-mag',
          supplement: 'Magnesium Glycinate',
          dosage: '400mg',
          frequency: 'Once daily at bedtime',
          reason: 'Most adults are deficient. Supports 300+ enzymatic reactions, cardiovascular health, blood pressure, glucose metabolism, sleep, and stress response.',
          contraindications: ['Kidney disease', 'Heart block'],
          interactions: ['Certain antibiotics', 'Bisphosphonates'],
          evidenceLevel: 'strong'
        },
        {
          id: 'ortho-multi',
          supplement: 'High-Quality Multivitamin',
          dosage: 'As directed',
          frequency: 'Once daily with food',
          reason: 'Foundation of nutritional support. Choose methylated B vitamins (methylfolate, methylcobalamin) for optimal absorption.',
          contraindications: ['Check for specific ingredient sensitivities'],
          interactions: ['Blood thinners (vitamin K)'],
          evidenceLevel: 'moderate'
        },
        {
          id: 'ortho-probiotic',
          supplement: 'Multi-Strain Probiotic',
          dosage: '50+ billion CFU',
          frequency: 'Once daily',
          reason: 'Supports gut-brain axis, immune function, and nutrient absorption. Gut health is foundational to overall health.',
          contraindications: ['Severe immunocompromise'],
          interactions: ['Antibiotics (separate by 2 hours)'],
          evidenceLevel: 'strong'
        }
      );

      // Always include foundational lifestyle recommendations
      lifestyleRecommendations.push(
        {
          id: 'life-hydration',
          category: 'habits',
          recommendation: 'Optimal Hydration Protocol',
          priority: 'medium',
          details: 'Drink half your body weight in ounces of filtered water daily. Add electrolytes if needed (especially with exercise). Limit caffeine to 1-2 cups before noon. Reduce alcohol consumption. Start day with 16oz water before coffee.',
          resources: ['Hydration Calculator', 'LMNT or Nuun Electrolytes']
        },
        {
          id: 'life-movement',
          category: 'exercise',
          recommendation: 'Daily Movement Protocol',
          priority: 'medium',
          details: 'Move every 30-60 minutes if sedentary job. Aim for 8,000-10,000 steps daily. Include resistance training 2-3x/week. Stretch or do yoga 2-3x/week. Find enjoyable activities to ensure consistency.',
          resources: ['Movement Snacks Guide', 'Beginner Strength Training']
        }
      );

      // Generate follow-up instructions based on findings
      const followUpParts = ['Schedule follow-up appointment in 4-6 weeks to review progress and lab results.'];
      if (findings.hasHormonal) followUpParts.push('Hormone levels will be rechecked at follow-up.');
      if (findings.hasEnvironmental) followUpParts.push('Consider repeat toxin testing in 3-6 months after detox protocol.');
      if (findings.hasPsychosocial) followUpParts.push('Mental health follow-up recommended within 2 weeks.');
      followUpParts.push('Return sooner if experiencing: severe symptoms, adverse reactions to supplements, or worsening mental health. Bring supplement list and any tracking data to follow-up visit.');

      const fallbackPlan: TreatmentPlan = {
        id: `plan-${Date.now()}`,
        patientId: 'patient-001',
        assessmentId: assessment.id,
        physicalExamId: physicalExam.id,
        providerId: physicalExam.providerId,
        providerName: physicalExam.providerName,
        createdAt: new Date(),
        medications,
        lifestyleRecommendations,
        orthomolecularRecommendations,
        followUpInstructions: followUpParts.join(' '),
        status: 'draft'
      };

      setTreatmentPlan(fallbackPlan);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = () => {
    if (!treatmentPlan) return;
    if (userRole === 'provider') {
      apiPost('/treatment-plans', {
        clinicalAssessmentId: planContext?.clinicalAssessmentId || null,
        patientId: planContext?.patientId || treatmentPlan.patientId,
        providerId: planContext?.providerId || treatmentPlan.providerId,
        plan: treatmentPlan,
      })
        .then((saved) => {
          const finalizedPlan: TreatmentPlan = {
            ...treatmentPlan,
            id: saved?.id || treatmentPlan.id,
            status: 'finalized',
          };
          onFinalize(finalizedPlan);
        })
        .catch((err: any) => {
          console.error('Failed to finalize treatment plan:', err);
        });
      return;
    }

    if (userRole === 'patient' && patientAcknowledged && treatmentPlan.id) {
      apiPatch(`/treatment-plans/${treatmentPlan.id}/acknowledge`, {})
        .then((updated) => {
          const acknowledgedPlan: TreatmentPlan = {
            ...treatmentPlan,
            status: 'patient_acknowledged',
            patientAcknowledgedAt: updated?.acknowledged_at ? new Date(updated.acknowledged_at) : new Date(),
          };
          onFinalize(acknowledgedPlan);
        })
        .catch((err: any) => {
          console.error('Failed to acknowledge treatment plan:', err);
        });
    }
  };

  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'strong': return 'bg-emerald-500/20 text-emerald-400';
      case 'moderate': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/20 text-rose-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diet': return <Utensils className="w-4 h-4" />;
      case 'exercise': return <Dumbbell className="w-4 h-4" />;
      case 'sleep': return <Moon className="w-4 h-4" />;
      case 'stress': return <Brain className="w-4 h-4" />;
      case 'habits': return <Activity className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Generating Comprehensive Treatment Plan</h3>
          <p className="text-slate-400 text-center max-w-md">
            Creating personalized medication, lifestyle, and orthomolecular recommendations based on your 
            hormonal, environmental, stress, psychosocial, and metabolic assessment findings...
          </p>
        </div>
      </div>
    );
  }

  if (!treatmentPlan) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Comprehensive Treatment Plan</h3>
              <p className="text-slate-400">
                Approved by {treatmentPlan.providerName} on {treatmentPlan.createdAt.toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {treatmentPlan.medications.length > 0 && (
                  <span className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 rounded">
                    {treatmentPlan.medications.length} Medications/Referrals
                  </span>
                )}
                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                  {treatmentPlan.lifestyleRecommendations.length} Lifestyle Modifications
                </span>
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                  {treatmentPlan.orthomolecularRecommendations.length} Supplements
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadText}
              className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
              title="Download .txt"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Medications/Referrals */}
      {treatmentPlan.medications.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'medications' ? null : 'medications')}
            className="w-full p-6 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Pill className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Medications & Referrals</h4>
                <p className="text-sm text-slate-400">{treatmentPlan.medications.length} items</p>
              </div>
            </div>
            {expandedSection === 'medications' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {expandedSection === 'medications' && (
            <div className="px-6 pb-6 space-y-4">
              {treatmentPlan.medications.map((med) => (
                <div key={med.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-white text-lg">{med.name}</h5>
                      {med.dosage !== 'N/A' && (
                        <p className="text-cyan-400">{med.dosage} - {med.frequency}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-600 text-slate-300 rounded">
                      {med.duration}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{med.instructions}</p>
                  {med.warnings && med.warnings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {med.warnings.map((warning, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {warning}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lifestyle Recommendations */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'lifestyle' ? null : 'lifestyle')}
          className="w-full p-6 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Lifestyle Modifications</h4>
              <p className="text-sm text-slate-400">{treatmentPlan.lifestyleRecommendations.length} recommendations</p>
            </div>
          </div>
          {expandedSection === 'lifestyle' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {expandedSection === 'lifestyle' && (
          <div className="px-6 pb-6 space-y-4">
            {treatmentPlan.lifestyleRecommendations.map((rec) => (
              <div key={rec.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center text-slate-300">
                      {getCategoryIcon(rec.category)}
                    </div>
                    <h5 className="font-semibold text-white">{rec.recommendation}</h5>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-cyan-400 uppercase tracking-wide">{rec.category}</span>
                <p className="text-slate-300 text-sm mt-2">{rec.details}</p>
                {rec.resources && rec.resources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rec.resources.map((resource, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                        {resource}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orthomolecular Recommendations */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'orthomolecular' ? null : 'orthomolecular')}
          className="w-full p-6 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Orthomolecular / Nutritional Support</h4>
              <p className="text-sm text-slate-400">{treatmentPlan.orthomolecularRecommendations.length} supplements</p>
            </div>
          </div>
          {expandedSection === 'orthomolecular' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {expandedSection === 'orthomolecular' && (
          <div className="px-6 pb-6 space-y-4">
            {treatmentPlan.orthomolecularRecommendations.map((rec) => (
              <div key={rec.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <h5 className="font-semibold text-white">{rec.supplement}</h5>
                    <p className="text-purple-400">{rec.dosage} - {rec.frequency}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getEvidenceColor(rec.evidenceLevel)}`}>
                    {rec.evidenceLevel.toUpperCase()} EVIDENCE
                  </span>
                </div>
                <p className="text-slate-300 text-sm mt-2">{rec.reason}</p>
                {rec.contraindications && rec.contraindications.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 mb-1">Contraindications:</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.contraindications.map((contra, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                          {contra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {rec.interactions && rec.interactions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Interactions:</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.interactions.map((interaction, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                          {interaction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up Instructions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h4 className="text-lg font-semibold text-white">Follow-up Instructions</h4>
        </div>
        <p className="text-slate-300">{treatmentPlan.followUpInstructions}</p>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Important Information</p>
            <p className="text-sm text-blue-400/80 mt-1">
              This treatment plan addresses root causes identified through comprehensive assessment including 
              hormonal balance, environmental exposures, stress levels, psychosocial factors, and nutritional status. 
              Supplements should be introduced gradually (one new supplement every 3-5 days) to identify any sensitivities. 
              Quality matters - choose professional-grade supplements from reputable sources.
            </p>
          </div>
        </div>
      </div>

      {userRole === 'patient' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-amber-500/30 p-6">
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="acknowledge"
              checked={patientAcknowledged}
              onChange={(e) => setPatientAcknowledged(e.target.checked)}
              className="w-5 h-5 mt-1 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="acknowledge" className="text-slate-300 text-sm cursor-pointer">
              <strong className="text-white">Patient Acknowledgment:</strong> I have reviewed and understand the comprehensive 
              treatment plan above, including all medications, lifestyle modifications, and nutritional supplements. 
              I understand this plan has been reviewed and approved by my healthcare provider. I agree to follow the 
              recommendations and will introduce supplements gradually as directed. I will contact my healthcare provider 
              if I have questions, experience any adverse effects, or if my symptoms worsen.
            </label>
          </div>
        </div>
      )}

      {/* Finalize Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-600 transition-all flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print Plan
        </button>
        <button
          onClick={handleFinalize}
          disabled={userRole === 'patient' && !patientAcknowledged}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          {userRole === 'provider' ? 'Finalize & Notify Patient' : 'Acknowledge & Complete'}
        </button>
      </div>
    </div>
  );
};

export default TreatmentPlanView;
