import { VitalSign, LabResult, ScanResult, HealthSummary } from '@/types/health';

export const vitalSigns: VitalSign[] = [
  {
    name: 'Heart Rate',
    value: 72,
    unit: 'bpm',
    status: 'normal',
    normalRange: '60-100 bpm',
    description: 'Your heart rate is within the normal resting range, indicating good cardiovascular fitness.'
  },
  {
    name: 'Blood Pressure',
    value: '118/76',
    unit: 'mmHg',
    status: 'optimal',
    normalRange: '<120/80 mmHg',
    description: 'Your blood pressure is optimal. This reduces your risk of heart disease and stroke.'
  },
  {
    name: 'O2 Saturation',
    value: 98,
    unit: '%',
    status: 'normal',
    normalRange: '95-100%',
    description: 'Excellent oxygen saturation indicating healthy lung function and efficient oxygen transport.'
  },
  {
    name: 'Blood Glucose',
    value: 95,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '70-100 mg/dL (fasting)',
    description: 'Your fasting blood glucose is normal, suggesting good insulin sensitivity and metabolic health.'
  },
  {
    name: 'Body Temperature',
    value: 98.4,
    unit: '°F',
    status: 'normal',
    normalRange: '97.8-99.1°F',
    description: 'Normal body temperature indicating no signs of fever or infection.'
  },
  {
    name: 'Respiratory Rate',
    value: 16,
    unit: 'breaths/min',
    status: 'normal',
    normalRange: '12-20 breaths/min',
    description: 'Your breathing rate is normal, indicating healthy respiratory function.'
  }
];

export const cardiovascularMarkers: LabResult[] = [
  {
    name: 'Oxidized LDL',
    value: 42,
    unit: 'U/L',
    status: 'normal',
    normalRange: '<60 U/L',
    category: 'Cardiovascular',
    description: 'Oxidized LDL is a key marker for atherosclerosis risk. Your level is within the healthy range, indicating low oxidative stress on your cholesterol particles.'
  },
  {
    name: 'Homocysteine',
    value: 8.5,
    unit: 'µmol/L',
    status: 'normal',
    normalRange: '5-15 µmol/L',
    category: 'Cardiovascular',
    description: 'Homocysteine is an amino acid that, when elevated, increases cardiovascular risk. Your level is optimal.'
  },
  {
    name: 'hs-CRP',
    value: 0.8,
    unit: 'mg/L',
    status: 'normal',
    normalRange: '<1.0 mg/L (low risk)',
    category: 'Inflammation',
    description: 'High-sensitivity C-reactive protein measures systemic inflammation. Your low level indicates minimal cardiovascular inflammation risk.'
  },
  {
    name: 'ESR',
    value: 12,
    unit: 'mm/hr',
    status: 'normal',
    normalRange: '0-22 mm/hr (men), 0-29 mm/hr (women)',
    category: 'Inflammation',
    description: 'Erythrocyte sedimentation rate measures inflammation. Your level is normal, suggesting no significant inflammatory conditions.'
  },
  {
    name: 'Total Cholesterol',
    value: 185,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '<200 mg/dL',
    category: 'Lipid Panel',
    description: 'Your total cholesterol is in the desirable range, contributing to lower cardiovascular disease risk.'
  },
  {
    name: 'LDL Cholesterol',
    value: 98,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '<100 mg/dL (optimal)',
    category: 'Lipid Panel',
    description: 'LDL or "bad" cholesterol is near optimal levels. Lower LDL reduces plaque buildup in arteries.'
  },
  {
    name: 'HDL Cholesterol',
    value: 62,
    unit: 'mg/dL',
    status: 'optimal',
    normalRange: '>60 mg/dL (protective)',
    category: 'Lipid Panel',
    description: 'HDL or "good" cholesterol is at a protective level. High HDL helps remove LDL from arteries.'
  },
  {
    name: 'Triglycerides',
    value: 125,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '<150 mg/dL',
    category: 'Lipid Panel',
    description: 'Your triglyceride level is normal. Elevated triglycerides can increase heart disease risk.'
  }
];

export const cbcResults: LabResult[] = [
  {
    name: 'White Blood Cells (WBC)',
    value: 6.8,
    unit: 'K/µL',
    status: 'normal',
    normalRange: '4.5-11.0 K/µL',
    category: 'CBC',
    description: 'WBCs fight infection. Your count is normal, indicating a healthy immune system.'
  },
  {
    name: 'Red Blood Cells (RBC)',
    value: 4.9,
    unit: 'M/µL',
    status: 'normal',
    normalRange: '4.5-5.5 M/µL (men), 4.0-5.0 M/µL (women)',
    category: 'CBC',
    description: 'RBCs carry oxygen throughout your body. Your count is healthy.'
  },
  {
    name: 'Hemoglobin',
    value: 14.5,
    unit: 'g/dL',
    status: 'normal',
    normalRange: '13.5-17.5 g/dL (men), 12.0-16.0 g/dL (women)',
    category: 'CBC',
    description: 'Hemoglobin carries oxygen in red blood cells. Your level indicates good oxygen-carrying capacity.'
  },
  {
    name: 'Hematocrit',
    value: 43,
    unit: '%',
    status: 'normal',
    normalRange: '38.3-48.6% (men), 35.5-44.9% (women)',
    category: 'CBC',
    description: 'Hematocrit measures the percentage of blood volume occupied by red blood cells.'
  },
  {
    name: 'Platelets',
    value: 245,
    unit: 'K/µL',
    status: 'normal',
    normalRange: '150-400 K/µL',
    category: 'CBC',
    description: 'Platelets help blood clot. Your count is within the normal range.'
  },
  {
    name: 'MCV',
    value: 88,
    unit: 'fL',
    status: 'normal',
    normalRange: '80-100 fL',
    category: 'CBC',
    description: 'Mean corpuscular volume measures the average size of your red blood cells.'
  },
  {
    name: 'MCH',
    value: 29.5,
    unit: 'pg',
    status: 'normal',
    normalRange: '27-33 pg',
    category: 'CBC',
    description: 'Mean corpuscular hemoglobin measures the average amount of hemoglobin per red blood cell.'
  },
  {
    name: 'MCHC',
    value: 33.5,
    unit: 'g/dL',
    status: 'normal',
    normalRange: '32-36 g/dL',
    category: 'CBC',
    description: 'Mean corpuscular hemoglobin concentration measures hemoglobin concentration in red blood cells.'
  },
  {
    name: 'RDW',
    value: 12.8,
    unit: '%',
    status: 'normal',
    normalRange: '11.5-14.5%',
    category: 'CBC',
    description: 'Red cell distribution width measures variation in red blood cell size.'
  },
  {
    name: 'Neutrophils',
    value: 58,
    unit: '%',
    status: 'normal',
    normalRange: '40-70%',
    category: 'CBC Differential',
    description: 'Neutrophils are the most common type of white blood cell and fight bacterial infections.'
  },
  {
    name: 'Lymphocytes',
    value: 32,
    unit: '%',
    status: 'normal',
    normalRange: '20-40%',
    category: 'CBC Differential',
    description: 'Lymphocytes fight viral infections and produce antibodies.'
  },
  {
    name: 'Monocytes',
    value: 6,
    unit: '%',
    status: 'normal',
    normalRange: '2-8%',
    category: 'CBC Differential',
    description: 'Monocytes help fight infection and clean up dead cells.'
  }
];

export const cmpResults: LabResult[] = [
  {
    name: 'Glucose',
    value: 92,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '70-100 mg/dL',
    category: 'Metabolic',
    description: 'Fasting glucose is normal, indicating healthy blood sugar regulation.'
  },
  {
    name: 'BUN',
    value: 15,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '7-20 mg/dL',
    category: 'Kidney',
    description: 'Blood urea nitrogen is normal, indicating healthy kidney function.'
  },
  {
    name: 'Creatinine',
    value: 0.95,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '0.7-1.3 mg/dL',
    category: 'Kidney',
    description: 'Creatinine level indicates normal kidney filtration function.'
  },
  {
    name: 'eGFR',
    value: 98,
    unit: 'mL/min/1.73m²',
    status: 'normal',
    normalRange: '>90 mL/min/1.73m²',
    category: 'Kidney',
    description: 'Estimated glomerular filtration rate shows excellent kidney function.'
  },
  {
    name: 'Sodium',
    value: 140,
    unit: 'mEq/L',
    status: 'normal',
    normalRange: '136-145 mEq/L',
    category: 'Electrolytes',
    description: 'Sodium level is normal, important for fluid balance and nerve function.'
  },
  {
    name: 'Potassium',
    value: 4.2,
    unit: 'mEq/L',
    status: 'normal',
    normalRange: '3.5-5.0 mEq/L',
    category: 'Electrolytes',
    description: 'Potassium is essential for heart and muscle function. Your level is optimal.'
  },
  {
    name: 'Chloride',
    value: 102,
    unit: 'mEq/L',
    status: 'normal',
    normalRange: '98-106 mEq/L',
    category: 'Electrolytes',
    description: 'Chloride helps maintain proper fluid balance and acid-base balance.'
  },
  {
    name: 'CO2',
    value: 24,
    unit: 'mEq/L',
    status: 'normal',
    normalRange: '23-29 mEq/L',
    category: 'Electrolytes',
    description: 'Carbon dioxide level indicates normal acid-base balance.'
  },
  {
    name: 'Calcium',
    value: 9.5,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '8.5-10.5 mg/dL',
    category: 'Minerals',
    description: 'Calcium is vital for bones, muscles, and nerve function. Your level is healthy.'
  },
  {
    name: 'Total Protein',
    value: 7.2,
    unit: 'g/dL',
    status: 'normal',
    normalRange: '6.0-8.3 g/dL',
    category: 'Liver',
    description: 'Total protein level indicates healthy liver function and nutritional status.'
  },
  {
    name: 'Albumin',
    value: 4.3,
    unit: 'g/dL',
    status: 'normal',
    normalRange: '3.5-5.0 g/dL',
    category: 'Liver',
    description: 'Albumin is made by the liver and indicates good liver function and nutrition.'
  },
  {
    name: 'Bilirubin',
    value: 0.8,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '0.1-1.2 mg/dL',
    category: 'Liver',
    description: 'Bilirubin is a waste product from red blood cell breakdown. Normal level indicates healthy liver.'
  },
  {
    name: 'ALT',
    value: 25,
    unit: 'U/L',
    status: 'normal',
    normalRange: '7-56 U/L',
    category: 'Liver',
    description: 'Alanine aminotransferase is a liver enzyme. Normal level indicates healthy liver.'
  },
  {
    name: 'AST',
    value: 22,
    unit: 'U/L',
    status: 'normal',
    normalRange: '10-40 U/L',
    category: 'Liver',
    description: 'Aspartate aminotransferase is found in liver and heart. Normal level is reassuring.'
  }
];

export const thyroidResults: LabResult[] = [
  {
    name: 'TSH',
    value: 2.1,
    unit: 'mIU/L',
    status: 'normal',
    normalRange: '0.4-4.0 mIU/L',
    category: 'Thyroid',
    description: 'Thyroid-stimulating hormone is optimal, indicating balanced thyroid function.'
  },
  {
    name: 'Free T4',
    value: 1.2,
    unit: 'ng/dL',
    status: 'normal',
    normalRange: '0.8-1.8 ng/dL',
    category: 'Thyroid',
    description: 'Free thyroxine is the active thyroid hormone. Your level is healthy.'
  },
  {
    name: 'Free T3',
    value: 3.1,
    unit: 'pg/mL',
    status: 'normal',
    normalRange: '2.3-4.2 pg/mL',
    category: 'Thyroid',
    description: 'Free triiodothyronine is the most active thyroid hormone. Level is optimal.'
  },
  {
    name: 'Reverse T3',
    value: 15,
    unit: 'ng/dL',
    status: 'normal',
    normalRange: '9.2-24.1 ng/dL',
    category: 'Thyroid',
    description: 'Reverse T3 is an inactive form of thyroid hormone. Normal level indicates good conversion.'
  },
  {
    name: 'TPO Antibodies',
    value: 12,
    unit: 'IU/mL',
    status: 'normal',
    normalRange: '<35 IU/mL',
    category: 'Thyroid Autoimmune',
    description: 'Thyroid peroxidase antibodies are negative, indicating no autoimmune thyroid disease.'
  },
  {
    name: 'Thyroglobulin Ab',
    value: 8,
    unit: 'IU/mL',
    status: 'normal',
    normalRange: '<20 IU/mL',
    category: 'Thyroid Autoimmune',
    description: 'Thyroglobulin antibodies are negative, ruling out Hashimoto\'s thyroiditis.'
  }
];

export const ironResults: LabResult[] = [
  {
    name: 'Serum Iron',
    value: 95,
    unit: 'µg/dL',
    status: 'normal',
    normalRange: '60-170 µg/dL',
    category: 'Iron Studies',
    description: 'Serum iron level is healthy, indicating adequate iron in your blood.'
  },
  {
    name: 'Ferritin',
    value: 85,
    unit: 'ng/mL',
    status: 'normal',
    normalRange: '30-300 ng/mL (men), 15-150 ng/mL (women)',
    category: 'Iron Studies',
    description: 'Ferritin reflects iron stores in your body. Your stores are adequate.'
  },
  {
    name: 'TIBC',
    value: 320,
    unit: 'µg/dL',
    status: 'normal',
    normalRange: '250-370 µg/dL',
    category: 'Iron Studies',
    description: 'Total iron-binding capacity is normal, indicating healthy iron transport.'
  },
  {
    name: 'Transferrin Saturation',
    value: 30,
    unit: '%',
    status: 'normal',
    normalRange: '20-50%',
    category: 'Iron Studies',
    description: 'Transferrin saturation shows how much iron is bound to transferrin. Level is optimal.'
  }
];

export const autoimmuneResults: LabResult[] = [
  {
    name: 'ANA',
    value: 0,
    unit: 'titer',
    status: 'normal',
    normalRange: 'Negative (<1:40)',
    category: 'Autoimmune',
    description: 'Antinuclear antibodies are negative, indicating no systemic autoimmune disease markers.'
  },
  {
    name: 'Rheumatoid Factor',
    value: 8,
    unit: 'IU/mL',
    status: 'normal',
    normalRange: '<14 IU/mL',
    category: 'Autoimmune',
    description: 'Rheumatoid factor is negative, ruling out rheumatoid arthritis.'
  },
  {
    name: 'Anti-CCP',
    value: 5,
    unit: 'U/mL',
    status: 'normal',
    normalRange: '<20 U/mL',
    category: 'Autoimmune',
    description: 'Anti-cyclic citrullinated peptide is negative, further ruling out RA.'
  },
  {
    name: 'Complement C3',
    value: 125,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '90-180 mg/dL',
    category: 'Autoimmune',
    description: 'Complement C3 is part of the immune system. Normal level indicates no active inflammation.'
  },
  {
    name: 'Complement C4',
    value: 28,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '10-40 mg/dL',
    category: 'Autoimmune',
    description: 'Complement C4 is normal, suggesting no autoimmune complement consumption.'
  }
];

export const functionalMedicineResults: LabResult[] = [
  {
    name: 'Vitamin D (25-OH)',
    value: 55,
    unit: 'ng/mL',
    status: 'optimal',
    normalRange: '40-80 ng/mL (optimal)',
    category: 'Vitamins',
    description: 'Vitamin D level is optimal. This supports bone health, immune function, and mood.'
  },
  {
    name: 'Vitamin B12',
    value: 650,
    unit: 'pg/mL',
    status: 'normal',
    normalRange: '400-1100 pg/mL',
    category: 'Vitamins',
    description: 'B12 is essential for nerve function and red blood cell production. Level is healthy.'
  },
  {
    name: 'Folate',
    value: 15,
    unit: 'ng/mL',
    status: 'normal',
    normalRange: '>5.4 ng/mL',
    category: 'Vitamins',
    description: 'Folate is important for DNA synthesis and cell division. Your level is excellent.'
  },
  {
    name: 'Magnesium (RBC)',
    value: 5.5,
    unit: 'mg/dL',
    status: 'normal',
    normalRange: '4.2-6.8 mg/dL',
    category: 'Minerals',
    description: 'RBC magnesium is a better indicator than serum. Your level supports muscle and nerve function.'
  },
  {
    name: 'Zinc',
    value: 95,
    unit: 'µg/dL',
    status: 'normal',
    normalRange: '60-120 µg/dL',
    category: 'Minerals',
    description: 'Zinc is vital for immune function, wound healing, and taste. Level is optimal.'
  },
  {
    name: 'Omega-3 Index',
    value: 8.2,
    unit: '%',
    status: 'optimal',
    normalRange: '>8% (optimal)',
    category: 'Fatty Acids',
    description: 'Omega-3 index is optimal, indicating good cardiovascular protection and anti-inflammatory status.'
  },
  {
    name: 'HbA1c',
    value: 5.2,
    unit: '%',
    status: 'normal',
    normalRange: '<5.7%',
    category: 'Metabolic',
    description: 'Hemoglobin A1c reflects 3-month average blood sugar. Your level indicates excellent glucose control.'
  },
  {
    name: 'Insulin (Fasting)',
    value: 5.5,
    unit: 'µIU/mL',
    status: 'optimal',
    normalRange: '2.6-24.9 µIU/mL (optimal <10)',
    category: 'Metabolic',
    description: 'Fasting insulin is optimal, indicating excellent insulin sensitivity with low diabetes risk.'
  },
  {
    name: 'DHEA-S',
    value: 350,
    unit: 'µg/dL',
    status: 'normal',
    normalRange: '100-500 µg/dL (varies by age)',
    category: 'Hormones',
    description: 'DHEA-S is a precursor hormone. Your level suggests healthy adrenal function.'
  },
  {
    name: 'Cortisol (AM)',
    value: 15,
    unit: 'µg/dL',
    status: 'normal',
    normalRange: '6-23 µg/dL (morning)',
    category: 'Hormones',
    description: 'Morning cortisol is normal, indicating healthy stress response and adrenal function.'
  }
];

export const scanResults: ScanResult[] = [
  {
    area: 'Coronary Arteries',
    plaqueDetected: false,
    plaqueLevel: 'none',
    arterialHealth: 95,
    bloodFlow: 'normal',
    recommendations: [
      'Continue heart-healthy diet rich in omega-3 fatty acids',
      'Maintain regular cardiovascular exercise',
      'Annual follow-up scan recommended'
    ]
  },
  {
    area: 'Carotid Arteries',
    plaqueDetected: false,
    plaqueLevel: 'minimal',
    arterialHealth: 92,
    bloodFlow: 'normal',
    recommendations: [
      'Monitor blood pressure regularly',
      'Limit sodium intake to <2300mg daily',
      'Consider Mediterranean diet for optimal arterial health'
    ]
  },
  {
    area: 'Radial Artery',
    plaqueDetected: false,
    plaqueLevel: 'none',
    arterialHealth: 98,
    bloodFlow: 'normal',
    recommendations: [
      'Excellent peripheral arterial health',
      'Continue current lifestyle habits',
      'Stay hydrated for optimal blood viscosity'
    ]
  },
  {
    area: 'Ulnar Artery',
    plaqueDetected: false,
    plaqueLevel: 'none',
    arterialHealth: 97,
    bloodFlow: 'normal',
    recommendations: [
      'Peripheral circulation is excellent',
      'Regular hand exercises support arterial health',
      'Avoid prolonged cold exposure'
    ]
  }
];

export const healthSummary: HealthSummary = {
  overallScore: 92,
  cardiovascularRisk: 'low',
  metabolicHealth: 'optimal',
  inflammationLevel: 'low',
  recommendations: [
    'Your cardiovascular health is excellent with no significant plaque detected',
    'All inflammatory markers are within optimal ranges',
    'Metabolic panel shows healthy organ function',
    'Continue current diet and exercise regimen',
    'Schedule annual comprehensive health screening',
    'Consider stress management techniques for long-term wellness'
  ]
};
