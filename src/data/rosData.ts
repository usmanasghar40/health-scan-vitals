import { ROSSection } from '@/types/health';

// Frequency options used across multiple sections (based on validated instruments)
const standardFrequencyOptions = ['Never', 'Rarely (1-2 times/month)', 'Sometimes (weekly)', 'Often (several times/week)', 'Always (daily)'];
const exposureFrequencyOptions = ['Never', 'Rarely', 'Monthly', 'Weekly', 'Daily'];
const durationOptions = ['Less than 1 month', '1-6 months', '6-12 months', '1-5 years', 'More than 5 years'];

export const reviewOfSystemsSections: ROSSection[] = [
  // ============================================
  // SECTION 1: CONSTITUTIONAL / GENERAL
  // ============================================
  {
    id: 'constitutional',
    name: 'Constitutional / General',
    icon: 'User',
    description: 'General health and well-being assessment',
    instructions: 'Please answer the following questions about your general health status.',
    questions: [
      { id: 'const-1', system: 'constitutional', question: 'Have you experienced unexplained weight loss or gain (more than 10 lbs) in the past 3 months?', type: 'boolean', required: true },
      { id: 'const-1a', system: 'constitutional', question: 'If yes, approximately how much weight change?', type: 'text', conditionalOn: 'const-1' },
      { id: 'const-2', system: 'constitutional', question: 'Do you have fever or chills?', type: 'boolean', required: true },
      { id: 'const-3', system: 'constitutional', question: 'Do you experience fatigue or weakness?', type: 'boolean', required: true },
      { id: 'const-3a', system: 'constitutional', question: 'How long have you experienced fatigue?', type: 'multiple', options: durationOptions, conditionalOn: 'const-3' },
      { id: 'const-4', system: 'constitutional', question: 'Have you noticed night sweats?', type: 'boolean', required: true },
      { id: 'const-5', system: 'constitutional', question: 'Rate your overall energy level', type: 'scale', scaleLabels: { low: 'Very Low (1)', high: 'Excellent (10)' }, required: true },
      { id: 'const-6', system: 'constitutional', question: 'How would you rate your overall quality of life?', type: 'scale', scaleLabels: { low: 'Very Poor (1)', high: 'Excellent (10)' }, required: true },
      { id: 'const-7', system: 'constitutional', question: 'Have you experienced any recent changes in your appetite?', type: 'multiple', options: ['No change', 'Increased appetite', 'Decreased appetite', 'Variable/unpredictable'] },
    ]
  },

  // ============================================
  // SECTION 2: HEAD, EYES, EARS, NOSE, THROAT
  // ============================================
  {
    id: 'heent',
    name: 'Head, Eyes, Ears, Nose, Throat',
    icon: 'Eye',
    description: 'Assessment of head and sensory organs',
    questions: [
      { id: 'heent-1', system: 'heent', question: 'Do you experience frequent headaches?', type: 'boolean', required: true },
      { id: 'heent-1a', system: 'heent', question: 'How often do you experience headaches?', type: 'frequency', frequencyOptions: standardFrequencyOptions, conditionalOn: 'heent-1' },
      { id: 'heent-1b', system: 'heent', question: 'Rate the typical severity of your headaches', type: 'scale', scaleLabels: { low: 'Mild (1)', high: 'Severe (10)' }, conditionalOn: 'heent-1' },
      { id: 'heent-2', system: 'heent', question: 'Have you noticed any vision changes (blurring, double vision, loss of vision)?', type: 'boolean', required: true },
      { id: 'heent-3', system: 'heent', question: 'Do you have hearing loss or ringing in ears (tinnitus)?', type: 'boolean', required: true },
      { id: 'heent-4', system: 'heent', question: 'Do you have frequent nosebleeds or chronic sinus problems?', type: 'boolean' },
      { id: 'heent-5', system: 'heent', question: 'Do you have sore throat or difficulty swallowing?', type: 'boolean' },
      { id: 'heent-6', system: 'heent', question: 'Have you noticed any lumps or swelling in your neck?', type: 'boolean', required: true },
      { id: 'heent-7', system: 'heent', question: 'Do you experience dizziness or vertigo?', type: 'boolean' },
      { id: 'heent-8', system: 'heent', question: 'Do you have dry eyes or excessive tearing?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 3: CARDIOVASCULAR
  // ============================================
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    icon: 'Heart',
    description: 'Heart and blood vessel health assessment',
    questions: [
      { id: 'cv-1', system: 'cardiovascular', question: 'Do you experience chest pain, pressure, or discomfort?', type: 'boolean', required: true },
      { id: 'cv-1a', system: 'cardiovascular', question: 'When does the chest pain typically occur?', type: 'multiselect', options: ['At rest', 'With exertion', 'After eating', 'When lying down', 'With emotional stress'], conditionalOn: 'cv-1' },
      { id: 'cv-2', system: 'cardiovascular', question: 'Do you have palpitations or awareness of irregular heartbeat?', type: 'boolean', required: true },
      { id: 'cv-3', system: 'cardiovascular', question: 'Do you experience shortness of breath with exertion?', type: 'boolean', required: true },
      { id: 'cv-3a', system: 'cardiovascular', question: 'How much activity causes shortness of breath?', type: 'multiple', options: ['Vigorous exercise only', 'Moderate activity (walking uphill)', 'Light activity (walking on flat ground)', 'Minimal activity (getting dressed)', 'At rest'], conditionalOn: 'cv-3' },
      { id: 'cv-4', system: 'cardiovascular', question: 'Do you have swelling in your legs, ankles, or feet?', type: 'boolean', required: true },
      { id: 'cv-5', system: 'cardiovascular', question: 'Do you experience dizziness, lightheadedness, or fainting?', type: 'boolean' },
      { id: 'cv-6', system: 'cardiovascular', question: 'Have you been diagnosed with high blood pressure?', type: 'boolean', required: true },
      { id: 'cv-7', system: 'cardiovascular', question: 'Do you experience leg pain or cramping when walking (claudication)?', type: 'boolean' },
      { id: 'cv-8', system: 'cardiovascular', question: 'Do you need to sleep propped up on pillows to breathe comfortably?', type: 'boolean' },
      { id: 'cv-9', system: 'cardiovascular', question: 'Have you noticed any blue discoloration of your lips or fingertips?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 4: RESPIRATORY
  // ============================================
  {
    id: 'respiratory',
    name: 'Respiratory',
    icon: 'Wind',
    description: 'Lung and breathing assessment',
    questions: [
      { id: 'resp-1', system: 'respiratory', question: 'Do you have a persistent cough?', type: 'boolean', required: true },
      { id: 'resp-1a', system: 'respiratory', question: 'How long have you had this cough?', type: 'multiple', options: durationOptions, conditionalOn: 'resp-1' },
      { id: 'resp-1b', system: 'respiratory', question: 'Is your cough productive (bringing up mucus)?', type: 'boolean', conditionalOn: 'resp-1' },
      { id: 'resp-2', system: 'respiratory', question: 'Do you cough up blood or blood-tinged sputum?', type: 'boolean', required: true },
      { id: 'resp-3', system: 'respiratory', question: 'Do you experience wheezing?', type: 'boolean' },
      { id: 'resp-4', system: 'respiratory', question: 'Do you have shortness of breath at rest?', type: 'boolean', required: true },
      { id: 'resp-5', system: 'respiratory', question: 'Do you use supplemental oxygen at home?', type: 'boolean' },
      { id: 'resp-6', system: 'respiratory', question: 'Have you been diagnosed with asthma, COPD, or other lung conditions?', type: 'boolean' },
      { id: 'resp-7', system: 'respiratory', question: 'Do you snore loudly or has anyone observed you stop breathing during sleep?', type: 'boolean' },
      { id: 'resp-8', system: 'respiratory', question: 'Have you been exposed to asbestos, silica, coal dust, or other occupational lung hazards?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 5: GASTROINTESTINAL
  // ============================================
  {
    id: 'gastrointestinal',
    name: 'Gastrointestinal',
    icon: 'Utensils',
    description: 'Digestive system assessment',
    questions: [
      { id: 'gi-1', system: 'gastrointestinal', question: 'Do you have abdominal pain or discomfort?', type: 'boolean', required: true },
      { id: 'gi-1a', system: 'gastrointestinal', question: 'Where is the pain located?', type: 'multiselect', options: ['Upper abdomen', 'Lower abdomen', 'Right side', 'Left side', 'Around navel', 'Entire abdomen'], conditionalOn: 'gi-1' },
      { id: 'gi-2', system: 'gastrointestinal', question: 'Do you experience nausea or vomiting?', type: 'boolean' },
      { id: 'gi-3', system: 'gastrointestinal', question: 'Do you have diarrhea?', type: 'boolean' },
      { id: 'gi-3a', system: 'gastrointestinal', question: 'How often do you experience diarrhea?', type: 'frequency', frequencyOptions: standardFrequencyOptions, conditionalOn: 'gi-3' },
      { id: 'gi-4', system: 'gastrointestinal', question: 'Do you have constipation?', type: 'boolean' },
      { id: 'gi-5', system: 'gastrointestinal', question: 'Have you noticed blood in your stool or black/tarry stools?', type: 'boolean', required: true },
      { id: 'gi-6', system: 'gastrointestinal', question: 'Do you have heartburn or acid reflux?', type: 'boolean' },
      { id: 'gi-6a', system: 'gastrointestinal', question: 'How often do you experience heartburn?', type: 'frequency', frequencyOptions: standardFrequencyOptions, conditionalOn: 'gi-6' },
      { id: 'gi-7', system: 'gastrointestinal', question: 'Do you have difficulty swallowing or food getting stuck?', type: 'boolean' },
      { id: 'gi-8', system: 'gastrointestinal', question: 'Do you experience bloating or excessive gas?', type: 'boolean' },
      { id: 'gi-9', system: 'gastrointestinal', question: 'Have you noticed any yellowing of your skin or eyes (jaundice)?', type: 'boolean' },
      { id: 'gi-10', system: 'gastrointestinal', question: 'Do you have food intolerances or sensitivities?', type: 'boolean' },
      { id: 'gi-10a', system: 'gastrointestinal', question: 'Which foods cause problems?', type: 'text', conditionalOn: 'gi-10' },
    ]
  },

  // ============================================
  // SECTION 6: GENITOURINARY
  // ============================================
  {
    id: 'genitourinary',
    name: 'Genitourinary',
    icon: 'Droplet',
    description: 'Urinary and reproductive system assessment',
    questions: [
      { id: 'gu-1', system: 'genitourinary', question: 'Do you have painful urination (dysuria)?', type: 'boolean', required: true },
      { id: 'gu-2', system: 'genitourinary', question: 'Do you have frequent urination?', type: 'boolean' },
      { id: 'gu-2a', system: 'genitourinary', question: 'How many times do you urinate during the day?', type: 'multiple', options: ['1-4 times', '5-7 times', '8-10 times', 'More than 10 times'], conditionalOn: 'gu-2' },
      { id: 'gu-3', system: 'genitourinary', question: 'Do you have blood in your urine?', type: 'boolean', required: true },
      { id: 'gu-4', system: 'genitourinary', question: 'Do you experience urinary incontinence (leakage)?', type: 'boolean' },
      { id: 'gu-5', system: 'genitourinary', question: 'Do you wake up at night to urinate (nocturia)?', type: 'boolean' },
      { id: 'gu-5a', system: 'genitourinary', question: 'How many times per night?', type: 'multiple', options: ['1 time', '2 times', '3 times', '4 or more times'], conditionalOn: 'gu-5' },
      { id: 'gu-6', system: 'genitourinary', question: 'Do you have difficulty starting or maintaining urine stream?', type: 'boolean' },
      { id: 'gu-7', system: 'genitourinary', question: 'Have you had kidney stones?', type: 'boolean' },
      { id: 'gu-8', system: 'genitourinary', question: 'Do you have any sexual dysfunction concerns?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 7: MUSCULOSKELETAL
  // ============================================
  {
    id: 'musculoskeletal',
    name: 'Musculoskeletal',
    icon: 'Bone',
    description: 'Bones, joints, and muscle assessment',
    questions: [
      { id: 'msk-1', system: 'musculoskeletal', question: 'Do you have joint pain or stiffness?', type: 'boolean', required: true },
      { id: 'msk-1a', system: 'musculoskeletal', question: 'Which joints are affected?', type: 'multiselect', options: ['Hands/fingers', 'Wrists', 'Elbows', 'Shoulders', 'Neck', 'Back', 'Hips', 'Knees', 'Ankles', 'Feet/toes'], conditionalOn: 'msk-1' },
      { id: 'msk-1b', system: 'musculoskeletal', question: 'Is the stiffness worse in the morning?', type: 'boolean', conditionalOn: 'msk-1' },
      { id: 'msk-1c', system: 'musculoskeletal', question: 'How long does morning stiffness last?', type: 'multiple', options: ['Less than 30 minutes', '30-60 minutes', '1-2 hours', 'More than 2 hours'], conditionalOn: 'msk-1b' },
      { id: 'msk-2', system: 'musculoskeletal', question: 'Do you have muscle pain or weakness?', type: 'boolean' },
      { id: 'msk-3', system: 'musculoskeletal', question: 'Do you have back pain?', type: 'boolean', required: true },
      { id: 'msk-3a', system: 'musculoskeletal', question: 'Where is your back pain located?', type: 'multiselect', options: ['Upper back', 'Middle back', 'Lower back', 'Radiates to legs', 'Radiates to arms'], conditionalOn: 'msk-3' },
      { id: 'msk-4', system: 'musculoskeletal', question: 'Have you had any recent injuries or falls?', type: 'boolean' },
      { id: 'msk-5', system: 'musculoskeletal', question: 'Do you have joint swelling, redness, or warmth?', type: 'boolean' },
      { id: 'msk-6', system: 'musculoskeletal', question: 'Do you have limited range of motion in any joints?', type: 'boolean' },
      { id: 'msk-7', system: 'musculoskeletal', question: 'Do you experience muscle cramps or spasms?', type: 'boolean' },
      { id: 'msk-8', system: 'musculoskeletal', question: 'Have you been diagnosed with osteoporosis or osteopenia?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 8: SKIN / INTEGUMENTARY
  // ============================================
  {
    id: 'skin',
    name: 'Skin / Integumentary',
    icon: 'Hand',
    description: 'Skin, hair, and nail assessment',
    questions: [
      { id: 'skin-1', system: 'skin', question: 'Do you have any rashes?', type: 'boolean', required: true },
      { id: 'skin-1a', system: 'skin', question: 'Where is the rash located?', type: 'text', conditionalOn: 'skin-1' },
      { id: 'skin-2', system: 'skin', question: 'Do you have itching (pruritus)?', type: 'boolean' },
      { id: 'skin-2a', system: 'skin', question: 'Is the itching localized or generalized?', type: 'multiple', options: ['Localized to one area', 'Several areas', 'Generalized/whole body'], conditionalOn: 'skin-2' },
      { id: 'skin-3', system: 'skin', question: 'Have you noticed any new moles or changes in existing moles?', type: 'boolean', required: true },
      { id: 'skin-4', system: 'skin', question: 'Do you have dry skin?', type: 'boolean' },
      { id: 'skin-5', system: 'skin', question: 'Do you bruise easily?', type: 'boolean' },
      { id: 'skin-6', system: 'skin', question: 'Do you have any wounds that are slow to heal?', type: 'boolean' },
      { id: 'skin-7', system: 'skin', question: 'Have you noticed hair loss or changes in hair texture?', type: 'boolean' },
      { id: 'skin-8', system: 'skin', question: 'Do you have nail changes (brittleness, discoloration, ridges)?', type: 'boolean' },
      { id: 'skin-9', system: 'skin', question: 'Do you have acne or other skin conditions?', type: 'boolean' },
      { id: 'skin-10', system: 'skin', question: 'Have you had significant sun exposure or sunburns?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 9: NEUROLOGICAL
  // ============================================
  {
    id: 'neurological',
    name: 'Neurological',
    icon: 'Brain',
    description: 'Nervous system assessment',
    questions: [
      { id: 'neuro-1', system: 'neurological', question: 'Do you have numbness or tingling (paresthesias)?', type: 'boolean', required: true },
      { id: 'neuro-1a', system: 'neurological', question: 'Where do you experience numbness or tingling?', type: 'multiselect', options: ['Hands', 'Feet', 'Arms', 'Legs', 'Face', 'Other'], conditionalOn: 'neuro-1' },
      { id: 'neuro-2', system: 'neurological', question: 'Do you experience tremors or shaking?', type: 'boolean' },
      { id: 'neuro-3', system: 'neurological', question: 'Do you have memory problems or difficulty concentrating?', type: 'boolean', required: true },
      { id: 'neuro-3a', system: 'neurological', question: 'How would you rate your memory concerns?', type: 'scale', scaleLabels: { low: 'Mild (1)', high: 'Severe (10)' }, conditionalOn: 'neuro-3' },
      { id: 'neuro-4', system: 'neurological', question: 'Do you have difficulty with balance or coordination?', type: 'boolean' },
      { id: 'neuro-5', system: 'neurological', question: 'Have you experienced seizures or convulsions?', type: 'boolean', required: true },
      { id: 'neuro-6', system: 'neurological', question: 'Do you have weakness in your arms or legs?', type: 'boolean' },
      { id: 'neuro-7', system: 'neurological', question: 'Do you have difficulty speaking or finding words?', type: 'boolean' },
      { id: 'neuro-8', system: 'neurological', question: 'Do you experience "brain fog" or mental cloudiness?', type: 'boolean' },
      { id: 'neuro-9', system: 'neurological', question: 'Have you had any episodes of loss of consciousness?', type: 'boolean' },
      { id: 'neuro-10', system: 'neurological', question: 'Do you have restless legs or uncomfortable sensations in your legs at rest?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 10: ENDOCRINE / METABOLIC
  // ============================================
  {
    id: 'endocrine',
    name: 'Endocrine / Metabolic',
    icon: 'Zap',
    description: 'Hormone and metabolism assessment',
    questions: [
      { id: 'endo-1', system: 'endocrine', question: 'Do you have increased thirst (polydipsia)?', type: 'boolean', required: true },
      { id: 'endo-2', system: 'endocrine', question: 'Do you have heat intolerance (feeling too hot)?', type: 'boolean' },
      { id: 'endo-3', system: 'endocrine', question: 'Do you have cold intolerance (feeling too cold)?', type: 'boolean' },
      { id: 'endo-4', system: 'endocrine', question: 'Have you noticed changes in your hair, skin, or nails?', type: 'boolean' },
      { id: 'endo-5', system: 'endocrine', question: 'Have you been diagnosed with diabetes?', type: 'boolean', required: true },
      { id: 'endo-5a', system: 'endocrine', question: 'What type of diabetes?', type: 'multiple', options: ['Type 1', 'Type 2', 'Gestational', 'Prediabetes', 'Not sure'], conditionalOn: 'endo-5' },
      { id: 'endo-6', system: 'endocrine', question: 'Do you have thyroid problems?', type: 'boolean' },
      { id: 'endo-6a', system: 'endocrine', question: 'What thyroid condition?', type: 'multiple', options: ['Hypothyroidism (underactive)', 'Hyperthyroidism (overactive)', 'Hashimoto\'s', 'Graves\' disease', 'Thyroid nodules', 'Other'], conditionalOn: 'endo-6' },
      { id: 'endo-7', system: 'endocrine', question: 'Have you experienced unexplained changes in your weight?', type: 'boolean' },
      { id: 'endo-8', system: 'endocrine', question: 'Do you have excessive sweating?', type: 'boolean' },
      { id: 'endo-9', system: 'endocrine', question: 'Have you been diagnosed with adrenal problems?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 11: HEMATOLOGIC / LYMPHATIC
  // ============================================
  {
    id: 'hematologic',
    name: 'Hematologic / Lymphatic',
    icon: 'Droplets',
    description: 'Blood and lymph system assessment',
    questions: [
      { id: 'heme-1', system: 'hematologic', question: 'Do you bruise or bleed easily?', type: 'boolean', required: true },
      { id: 'heme-2', system: 'hematologic', question: 'Have you noticed swollen lymph nodes (glands)?', type: 'boolean', required: true },
      { id: 'heme-2a', system: 'hematologic', question: 'Where are the swollen lymph nodes?', type: 'multiselect', options: ['Neck', 'Under jaw', 'Armpits', 'Groin', 'Other'], conditionalOn: 'heme-2' },
      { id: 'heme-3', system: 'hematologic', question: 'Do you have a history of blood clots?', type: 'boolean', required: true },
      { id: 'heme-4', system: 'hematologic', question: 'Have you been diagnosed with anemia?', type: 'boolean' },
      { id: 'heme-5', system: 'hematologic', question: 'Do you have prolonged bleeding after cuts or dental work?', type: 'boolean' },
      { id: 'heme-6', system: 'hematologic', question: 'Have you ever needed a blood transfusion?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 12: ALLERGIC / IMMUNOLOGIC
  // ============================================
  {
    id: 'allergic',
    name: 'Allergic / Immunologic',
    icon: 'Shield',
    description: 'Allergy and immune system assessment',
    questions: [
      { id: 'allergy-1', system: 'allergic', question: 'Do you have seasonal allergies (hay fever)?', type: 'boolean' },
      { id: 'allergy-2', system: 'allergic', question: 'Do you have food allergies?', type: 'boolean' },
      { id: 'allergy-2a', system: 'allergic', question: 'Which foods are you allergic to?', type: 'text', conditionalOn: 'allergy-2' },
      { id: 'allergy-3', system: 'allergic', question: 'Do you have drug allergies?', type: 'boolean', required: true },
      { id: 'allergy-3a', system: 'allergic', question: 'Which medications are you allergic to?', type: 'text', conditionalOn: 'allergy-3' },
      { id: 'allergy-4', system: 'allergic', question: 'Do you get frequent infections?', type: 'boolean' },
      { id: 'allergy-4a', system: 'allergic', question: 'What types of infections?', type: 'multiselect', options: ['Upper respiratory (colds)', 'Sinus infections', 'Ear infections', 'Urinary tract infections', 'Skin infections', 'Other'], conditionalOn: 'allergy-4' },
      { id: 'allergy-5', system: 'allergic', question: 'Have you been diagnosed with an autoimmune condition?', type: 'boolean' },
      { id: 'allergy-5a', system: 'allergic', question: 'Which autoimmune condition(s)?', type: 'text', conditionalOn: 'allergy-5' },
      { id: 'allergy-6', system: 'allergic', question: 'Do you have eczema, hives, or allergic skin reactions?', type: 'boolean' },
      { id: 'allergy-7', system: 'allergic', question: 'Have you ever had anaphylaxis (severe allergic reaction)?', type: 'boolean', required: true },
    ]
  },

  // ============================================
  // SECTION 13: HORMONAL HEALTH (ESTROGEN/PROGESTERONE)
  // ============================================
  {
    id: 'hormonal',
    name: 'Hormonal Health',
    icon: 'Activity',
    description: 'Assessment of hormonal balance including estrogen dominance and progesterone deficiency symptoms',
    instructions: 'These questions help identify potential hormonal imbalances. Answer based on your experience over the past 3 months.',
    subSections: [
      { id: 'menstrual', name: 'Menstrual Health', description: 'For individuals who menstruate' },
      { id: 'estrogen', name: 'Estrogen-Related Symptoms', description: 'Signs of estrogen excess' },
      { id: 'progesterone', name: 'Progesterone-Related Symptoms', description: 'Signs of progesterone deficiency' },
    ],
    questions: [
      // Menstrual Health
      { id: 'horm-1', system: 'hormonal', category: 'menstrual', question: 'Do you currently menstruate?', type: 'boolean', required: true },
      { id: 'horm-2', system: 'hormonal', category: 'menstrual', question: 'Are your menstrual cycles regular (21-35 days)?', type: 'boolean', conditionalOn: 'horm-1' },
      { id: 'horm-3', system: 'hormonal', category: 'menstrual', question: 'How heavy is your menstrual flow?', type: 'multiple', options: ['Light (1-2 pads/tampons per day)', 'Moderate (3-4 per day)', 'Heavy (5+ per day or soaking through)', 'Very heavy with clots'], conditionalOn: 'horm-1' },
      { id: 'horm-4', system: 'hormonal', category: 'menstrual', question: 'Do you experience painful periods (dysmenorrhea)?', type: 'boolean', conditionalOn: 'horm-1' },
      { id: 'horm-4a', system: 'hormonal', category: 'menstrual', question: 'Rate the severity of menstrual pain', type: 'scale', scaleLabels: { low: 'Mild (1)', high: 'Debilitating (10)' }, conditionalOn: 'horm-4' },
      { id: 'horm-5', system: 'hormonal', category: 'menstrual', question: 'How many days does your period typically last?', type: 'multiple', options: ['1-3 days', '4-5 days', '6-7 days', '8+ days'], conditionalOn: 'horm-1' },
      { id: 'horm-6', system: 'hormonal', category: 'menstrual', question: 'Do you have spotting between periods?', type: 'boolean', conditionalOn: 'horm-1' },
      
      // Estrogen Dominance Symptoms
      { id: 'horm-7', system: 'hormonal', category: 'estrogen', question: 'Do you experience breast tenderness or swelling?', type: 'boolean' },
      { id: 'horm-7a', system: 'hormonal', category: 'estrogen', question: 'When does breast tenderness occur?', type: 'multiple', options: ['Before period', 'During period', 'Throughout cycle', 'Random times'], conditionalOn: 'horm-7' },
      { id: 'horm-8', system: 'hormonal', category: 'estrogen', question: 'Do you have fibrocystic breasts (lumpy, tender breasts)?', type: 'boolean' },
      { id: 'horm-9', system: 'hormonal', category: 'estrogen', question: 'Have you been diagnosed with uterine fibroids?', type: 'boolean' },
      { id: 'horm-10', system: 'hormonal', category: 'estrogen', question: 'Have you been diagnosed with endometriosis?', type: 'boolean' },
      { id: 'horm-11', system: 'hormonal', category: 'estrogen', question: 'Do you experience bloating, especially before your period?', type: 'boolean' },
      { id: 'horm-12', system: 'hormonal', category: 'estrogen', question: 'Do you have weight gain, particularly around hips, thighs, and abdomen?', type: 'boolean' },
      { id: 'horm-13', system: 'hormonal', category: 'estrogen', question: 'Do you experience water retention or puffiness?', type: 'boolean' },
      { id: 'horm-14', system: 'hormonal', category: 'estrogen', question: 'Do you have mood swings, irritability, or emotional sensitivity?', type: 'boolean' },
      { id: 'horm-15', system: 'hormonal', category: 'estrogen', question: 'Do you experience headaches or migraines related to your cycle?', type: 'boolean' },
      { id: 'horm-16', system: 'hormonal', category: 'estrogen', question: 'Do you have brain fog or difficulty concentrating before your period?', type: 'boolean' },
      { id: 'horm-17', system: 'hormonal', category: 'estrogen', question: 'Have you noticed increased cellulite or varicose veins?', type: 'boolean' },
      { id: 'horm-18', system: 'hormonal', category: 'estrogen', question: 'Do you have gallbladder problems or have had your gallbladder removed?', type: 'boolean' },
      
      // Progesterone Deficiency Symptoms
      { id: 'horm-19', system: 'hormonal', category: 'progesterone', question: 'Do you have difficulty falling or staying asleep?', type: 'boolean' },
      { id: 'horm-20', system: 'hormonal', category: 'progesterone', question: 'Do you experience anxiety or nervousness?', type: 'boolean' },
      { id: 'horm-21', system: 'hormonal', category: 'progesterone', question: 'Have you had difficulty getting pregnant or maintaining pregnancy?', type: 'boolean' },
      { id: 'horm-22', system: 'hormonal', category: 'progesterone', question: 'Do you have a short luteal phase (less than 10 days from ovulation to period)?', type: 'boolean' },
      { id: 'horm-23', system: 'hormonal', category: 'progesterone', question: 'Do you experience hot flashes or night sweats?', type: 'boolean' },
      { id: 'horm-24', system: 'hormonal', category: 'progesterone', question: 'Do you have low libido (decreased sex drive)?', type: 'boolean' },
      { id: 'horm-25', system: 'hormonal', category: 'progesterone', question: 'Do you experience vaginal dryness?', type: 'boolean' },
      { id: 'horm-26', system: 'hormonal', category: 'progesterone', question: 'Are you currently in perimenopause or menopause?', type: 'boolean' },
      { id: 'horm-27', system: 'hormonal', category: 'progesterone', question: 'Do you use hormonal birth control or hormone replacement therapy?', type: 'boolean' },
      { id: 'horm-27a', system: 'hormonal', category: 'progesterone', question: 'What type of hormonal therapy?', type: 'text', conditionalOn: 'horm-27' },
      
      // Additional hormonal questions
      { id: 'horm-28', system: 'hormonal', question: 'Do you have acne, especially along the jawline or chin?', type: 'boolean' },
      { id: 'horm-29', system: 'hormonal', question: 'Do you have excess facial or body hair (hirsutism)?', type: 'boolean' },
      { id: 'horm-30', system: 'hormonal', question: 'Have you been diagnosed with PCOS (Polycystic Ovary Syndrome)?', type: 'boolean' },
      { id: 'horm-31', system: 'hormonal', question: 'Rate the overall severity of your PMS/PMDD symptoms', type: 'scale', scaleLabels: { low: 'None/Minimal (1)', high: 'Severe/Debilitating (10)' } },
    ]
  },

  // ============================================
  // SECTION 14: ENVIRONMENTAL TOXINS EXPOSURE
  // ============================================
  {
    id: 'environmental',
    name: 'Environmental Toxins Exposure',
    icon: 'AlertTriangle',
    description: 'Assessment of exposure to environmental toxins, chemicals, and pollutants',
    instructions: 'Environmental exposures can significantly impact health. Please answer honestly about your current and past exposures.',
    subSections: [
      { id: 'occupational', name: 'Occupational Exposures', description: 'Work-related chemical and toxin exposure' },
      { id: 'home', name: 'Home Environment', description: 'Residential exposure risks' },
      { id: 'personal', name: 'Personal Care & Lifestyle', description: 'Consumer product exposures' },
      { id: 'heavy_metals', name: 'Heavy Metal Exposure', description: 'Sources of heavy metal contamination' },
    ],
    questions: [
      // Occupational Exposures
      { id: 'env-1', system: 'environmental', category: 'occupational', question: 'What is your current or most recent occupation?', type: 'text', required: true },
      { id: 'env-2', system: 'environmental', category: 'occupational', question: 'Are you exposed to chemicals, solvents, or industrial substances at work?', type: 'boolean' },
      { id: 'env-2a', system: 'environmental', category: 'occupational', question: 'What substances are you exposed to?', type: 'text', conditionalOn: 'env-2' },
      { id: 'env-3', system: 'environmental', category: 'occupational', question: 'Do you work with or around pesticides, herbicides, or insecticides?', type: 'boolean' },
      { id: 'env-3a', system: 'environmental', category: 'occupational', question: 'How often are you exposed to pesticides?', type: 'frequency', frequencyOptions: exposureFrequencyOptions, conditionalOn: 'env-3' },
      { id: 'env-4', system: 'environmental', category: 'occupational', question: 'Are you exposed to dust, fumes, or airborne particles at work?', type: 'boolean' },
      { id: 'env-5', system: 'environmental', category: 'occupational', question: 'Do you work with paints, coatings, adhesives, or varnishes?', type: 'boolean' },
      { id: 'env-6', system: 'environmental', category: 'occupational', question: 'Are you exposed to radiation at work (medical, industrial, or nuclear)?', type: 'boolean' },
      { id: 'env-7', system: 'environmental', category: 'occupational', question: 'Do you work in healthcare with exposure to chemotherapy drugs or sterilizing agents?', type: 'boolean' },
      { id: 'env-8', system: 'environmental', category: 'occupational', question: 'Do you wear appropriate protective equipment (PPE) at work?', type: 'multiple', options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never', 'Not applicable'] },
      
      // Home Environment
      { id: 'env-9', system: 'environmental', category: 'home', question: 'What year was your home built?', type: 'multiple', options: ['Before 1950', '1950-1978', '1979-1990', '1991-2000', 'After 2000', 'Unknown'] },
      { id: 'env-10', system: 'environmental', category: 'home', question: 'Has your home been tested for lead paint?', type: 'multiple', options: ['Yes, lead found', 'Yes, no lead found', 'No, never tested', 'Unknown'] },
      { id: 'env-11', system: 'environmental', category: 'home', question: 'Has your home been tested for radon?', type: 'multiple', options: ['Yes, elevated levels', 'Yes, normal levels', 'No, never tested', 'Unknown'] },
      { id: 'env-12', system: 'environmental', category: 'home', question: 'Do you have visible mold in your home?', type: 'boolean' },
      { id: 'env-12a', system: 'environmental', category: 'home', question: 'Have you experienced water damage or flooding in your home?', type: 'boolean' },
      { id: 'env-13', system: 'environmental', category: 'home', question: 'What is your primary water source?', type: 'multiple', options: ['Municipal/city water', 'Well water', 'Bottled water', 'Filtered tap water', 'Other'] },
      { id: 'env-14', system: 'environmental', category: 'home', question: 'Do you use a water filter?', type: 'boolean' },
      { id: 'env-14a', system: 'environmental', category: 'home', question: 'What type of water filter?', type: 'multiple', options: ['Pitcher filter', 'Faucet filter', 'Under-sink filter', 'Whole house filter', 'Reverse osmosis', 'Other'], conditionalOn: 'env-14' },
      { id: 'env-15', system: 'environmental', category: 'home', question: 'Do you live near industrial facilities, highways, or agricultural areas?', type: 'multiselect', options: ['Industrial/manufacturing facility', 'Major highway or freeway', 'Agricultural fields', 'Mining operations', 'Landfill or waste facility', 'None of these'] },
      { id: 'env-16', system: 'environmental', category: 'home', question: 'Do you use air fresheners, scented candles, or plug-in fragrances?', type: 'frequency', frequencyOptions: exposureFrequencyOptions },
      { id: 'env-17', system: 'environmental', category: 'home', question: 'Do you use conventional cleaning products (non-natural)?', type: 'frequency', frequencyOptions: exposureFrequencyOptions },
      { id: 'env-18', system: 'environmental', category: 'home', question: 'Do you have non-stick cookware (Teflon)?', type: 'boolean' },
      { id: 'env-19', system: 'environmental', category: 'home', question: 'Do you microwave food in plastic containers?', type: 'frequency', frequencyOptions: exposureFrequencyOptions },
      { id: 'env-20', system: 'environmental', category: 'home', question: 'Do you store food in plastic containers?', type: 'frequency', frequencyOptions: exposureFrequencyOptions },
      
      // Personal Care & Lifestyle
      { id: 'env-21', system: 'environmental', category: 'personal', question: 'Do you use conventional (non-organic) personal care products?', type: 'boolean' },
      { id: 'env-22', system: 'environmental', category: 'personal', question: 'Do you use antiperspirants containing aluminum?', type: 'boolean' },
      { id: 'env-23', system: 'environmental', category: 'personal', question: 'Do you use hair dyes or chemical hair treatments?', type: 'frequency', frequencyOptions: ['Never', 'Once a year', 'Every few months', 'Monthly', 'More frequently'] },
      { id: 'env-24', system: 'environmental', category: 'personal', question: 'Do you get manicures/pedicures at nail salons?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Monthly', 'Every 2 weeks', 'Weekly'] },
      { id: 'env-25', system: 'environmental', category: 'personal', question: 'Do you smoke or use tobacco products?', type: 'boolean' },
      { id: 'env-25a', system: 'environmental', category: 'personal', question: 'How much do you smoke?', type: 'multiple', options: ['Less than 5 cigarettes/day', '5-10 cigarettes/day', '10-20 cigarettes/day', 'More than 20 cigarettes/day', 'Cigars/pipe', 'Chewing tobacco'], conditionalOn: 'env-25' },
      { id: 'env-26', system: 'environmental', category: 'personal', question: 'Are you exposed to secondhand smoke?', type: 'frequency', frequencyOptions: exposureFrequencyOptions },
      { id: 'env-27', system: 'environmental', category: 'personal', question: 'Do you vape or use e-cigarettes?', type: 'boolean' },
      { id: 'env-28', system: 'environmental', category: 'personal', question: 'Do you use recreational drugs?', type: 'boolean' },
      
      // Heavy Metal Exposure
      { id: 'env-29', system: 'environmental', category: 'heavy_metals', question: 'Do you have amalgam (silver) dental fillings?', type: 'boolean' },
      { id: 'env-29a', system: 'environmental', category: 'heavy_metals', question: 'How many amalgam fillings do you have?', type: 'multiple', options: ['1-2', '3-5', '6-10', 'More than 10'], conditionalOn: 'env-29' },
      { id: 'env-30', system: 'environmental', category: 'heavy_metals', question: 'How often do you eat large fish (tuna, swordfish, shark, king mackerel)?', type: 'frequency', frequencyOptions: ['Never', 'Rarely (few times/year)', 'Monthly', 'Weekly', 'Multiple times per week'] },
      { id: 'env-31', system: 'environmental', category: 'heavy_metals', question: 'Do you eat rice frequently?', type: 'frequency', frequencyOptions: exposureFrequencyOptions, helpText: 'Rice can contain arsenic' },
      { id: 'env-32', system: 'environmental', category: 'heavy_metals', question: 'Have you ever worked with or been exposed to lead?', type: 'boolean' },
      { id: 'env-33', system: 'environmental', category: 'heavy_metals', question: 'Do you use imported pottery, ceramics, or cookware?', type: 'boolean', helpText: 'Some imported items may contain lead' },
      { id: 'env-34', system: 'environmental', category: 'heavy_metals', question: 'Do you use herbal remedies or supplements from overseas?', type: 'boolean', helpText: 'Some may contain heavy metals' },
      { id: 'env-35', system: 'environmental', category: 'heavy_metals', question: 'Have you ever had your blood or urine tested for heavy metals?', type: 'boolean' },
      { id: 'env-35a', system: 'environmental', category: 'heavy_metals', question: 'Were any heavy metals elevated?', type: 'boolean', conditionalOn: 'env-35' },
      { id: 'env-35b', system: 'environmental', category: 'heavy_metals', question: 'Which heavy metals were elevated?', type: 'text', conditionalOn: 'env-35a' },
      
      // Symptoms potentially related to toxin exposure
      { id: 'env-36', system: 'environmental', question: 'Do you have chemical sensitivities (reactions to perfumes, cleaning products, etc.)?', type: 'boolean' },
      { id: 'env-37', system: 'environmental', question: 'Do you experience symptoms that improve when away from home or work?', type: 'boolean' },
      { id: 'env-38', system: 'environmental', question: 'Rate your overall concern about environmental toxin exposure', type: 'scale', scaleLabels: { low: 'Not concerned (1)', high: 'Very concerned (10)' } },
    ]
  },

  // ============================================
  // SECTION 15: DIETARY ASSESSMENT
  // ============================================
  {
    id: 'dietary',
    name: 'Dietary Assessment',
    icon: 'Apple',
    description: 'Comprehensive assessment of dietary habits, food quality, and nutritional status',
    instructions: 'Please answer based on your typical eating patterns over the past month.',
    subSections: [
      { id: 'eating_patterns', name: 'Eating Patterns', description: 'Meal timing and habits' },
      { id: 'food_quality', name: 'Food Quality', description: 'Types of foods consumed' },
      { id: 'specific_foods', name: 'Specific Food Groups', description: 'Consumption of key food categories' },
      { id: 'substances', name: 'Substances', description: 'Caffeine, alcohol, and other substances' },
    ],
    questions: [
      // Eating Patterns
      { id: 'diet-1', system: 'dietary', category: 'eating_patterns', question: 'How many meals do you typically eat per day?', type: 'multiple', options: ['1 meal', '2 meals', '3 meals', '4+ meals', 'Grazing/no set meals'], required: true },
      { id: 'diet-2', system: 'dietary', category: 'eating_patterns', question: 'Do you eat breakfast?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'] },
      { id: 'diet-3', system: 'dietary', category: 'eating_patterns', question: 'Do you eat late at night (within 2 hours of bedtime)?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-4', system: 'dietary', category: 'eating_patterns', question: 'Do you skip meals?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-5', system: 'dietary', category: 'eating_patterns', question: 'Do you eat while distracted (TV, phone, computer)?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-6', system: 'dietary', category: 'eating_patterns', question: 'Do you practice any form of intermittent fasting?', type: 'boolean' },
      { id: 'diet-6a', system: 'dietary', category: 'eating_patterns', question: 'What type of fasting?', type: 'text', conditionalOn: 'diet-6' },
      { id: 'diet-7', system: 'dietary', category: 'eating_patterns', question: 'Do you follow a specific diet?', type: 'multiselect', options: ['No specific diet', 'Vegetarian', 'Vegan', 'Keto/Low-carb', 'Paleo', 'Mediterranean', 'Gluten-free', 'Dairy-free', 'FODMAP', 'Other'] },
      
      // Food Quality
      { id: 'diet-8', system: 'dietary', category: 'food_quality', question: 'How often do you eat processed or packaged foods?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-9', system: 'dietary', category: 'food_quality', question: 'How often do you eat fast food or takeout?', type: 'frequency', frequencyOptions: ['Never', 'Rarely (1-2x/month)', 'Sometimes (weekly)', 'Often (2-3x/week)', 'Daily'] },
      { id: 'diet-10', system: 'dietary', category: 'food_quality', question: 'How often do you cook meals at home?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'] },
      { id: 'diet-11', system: 'dietary', category: 'food_quality', question: 'Do you buy organic produce?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'] },
      { id: 'diet-12', system: 'dietary', category: 'food_quality', question: 'Do you buy grass-fed/pasture-raised animal products?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always', 'N/A - vegetarian/vegan'] },
      { id: 'diet-13', system: 'dietary', category: 'food_quality', question: 'Do you read food labels and ingredient lists?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'] },
      { id: 'diet-14', system: 'dietary', category: 'food_quality', question: 'Do you consume artificial sweeteners (aspartame, sucralose, etc.)?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-15', system: 'dietary', category: 'food_quality', question: 'Do you consume foods with artificial colors or preservatives?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      
      // Specific Food Groups
      { id: 'diet-16', system: 'dietary', category: 'specific_foods', question: 'How many servings of vegetables do you eat daily?', type: 'multiple', options: ['0-1 servings', '2-3 servings', '4-5 servings', '6+ servings'] },
      { id: 'diet-17', system: 'dietary', category: 'specific_foods', question: 'How many servings of fruit do you eat daily?', type: 'multiple', options: ['0-1 servings', '2-3 servings', '4-5 servings', '6+ servings'] },
      { id: 'diet-18', system: 'dietary', category: 'specific_foods', question: 'How often do you eat whole grains (brown rice, quinoa, oats)?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-19', system: 'dietary', category: 'specific_foods', question: 'How often do you eat refined grains (white bread, white rice, pasta)?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-20', system: 'dietary', category: 'specific_foods', question: 'How often do you eat red meat?', type: 'frequency', frequencyOptions: ['Never', 'Rarely (1-2x/month)', 'Sometimes (weekly)', 'Often (2-3x/week)', 'Daily'] },
      { id: 'diet-21', system: 'dietary', category: 'specific_foods', question: 'How often do you eat fish or seafood?', type: 'frequency', frequencyOptions: ['Never', 'Rarely (1-2x/month)', 'Sometimes (weekly)', 'Often (2-3x/week)', 'Daily'] },
      { id: 'diet-22', system: 'dietary', category: 'specific_foods', question: 'How often do you eat legumes (beans, lentils)?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-23', system: 'dietary', category: 'specific_foods', question: 'How often do you eat nuts and seeds?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-24', system: 'dietary', category: 'specific_foods', question: 'How often do you eat fermented foods (yogurt, kefir, sauerkraut, kimchi)?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'diet-25', system: 'dietary', category: 'specific_foods', question: 'How much added sugar do you consume daily?', type: 'multiple', options: ['Very little/none', 'Moderate (1-2 treats)', 'High (multiple sugary items)', 'Very high (sugary drinks + sweets)'] },
      { id: 'diet-26', system: 'dietary', category: 'specific_foods', question: 'How often do you drink sugar-sweetened beverages (soda, juice, energy drinks)?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Daily', 'Multiple times daily'] },
      { id: 'diet-27', system: 'dietary', category: 'specific_foods', question: 'How many glasses of water do you drink daily?', type: 'multiple', options: ['0-2 glasses', '3-4 glasses', '5-6 glasses', '7-8 glasses', '9+ glasses'] },
      
      // Substances
      { id: 'diet-28', system: 'dietary', category: 'substances', question: 'How much caffeine do you consume daily?', type: 'multiple', options: ['None', '1 cup coffee/tea', '2-3 cups', '4-5 cups', '6+ cups'], required: true },
      { id: 'diet-29', system: 'dietary', category: 'substances', question: 'Do you consume alcohol?', type: 'boolean', required: true },
      { id: 'diet-29a', system: 'dietary', category: 'substances', question: 'How many alcoholic drinks do you have per week?', type: 'multiple', options: ['1-3 drinks', '4-7 drinks', '8-14 drinks', '15+ drinks'], conditionalOn: 'diet-29' },
      { id: 'diet-29b', system: 'dietary', category: 'substances', question: 'What type of alcohol do you typically consume?', type: 'multiselect', options: ['Beer', 'Wine', 'Spirits/liquor', 'Mixed drinks'], conditionalOn: 'diet-29' },
      { id: 'diet-30', system: 'dietary', category: 'substances', question: 'Do you take any dietary supplements?', type: 'boolean' },
      { id: 'diet-30a', system: 'dietary', category: 'substances', question: 'Which supplements do you take?', type: 'text', conditionalOn: 'diet-30' },
      
      // Overall dietary assessment
      { id: 'diet-31', system: 'dietary', question: 'Rate your overall diet quality', type: 'scale', scaleLabels: { low: 'Very Poor (1)', high: 'Excellent (10)' }, required: true },
      { id: 'diet-32', system: 'dietary', question: 'Do you have any eating disorder history or disordered eating patterns?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 16: LIFESTYLE ASSESSMENT
  // ============================================
  {
    id: 'lifestyle',
    name: 'Lifestyle Assessment',
    icon: 'Activity',
    description: 'Assessment of physical activity, sleep, and daily habits',
    instructions: 'Please answer based on your typical patterns over the past month.',
    subSections: [
      { id: 'exercise', name: 'Physical Activity', description: 'Exercise and movement habits' },
      { id: 'sleep', name: 'Sleep', description: 'Sleep quality and habits' },
      { id: 'habits', name: 'Daily Habits', description: 'Screen time, sedentary behavior' },
    ],
    questions: [
      // Physical Activity
      { id: 'life-1', system: 'lifestyle', category: 'exercise', question: 'How many days per week do you engage in moderate exercise (brisk walking, cycling)?', type: 'multiple', options: ['0 days', '1-2 days', '3-4 days', '5-6 days', '7 days'], required: true },
      { id: 'life-2', system: 'lifestyle', category: 'exercise', question: 'How many days per week do you engage in vigorous exercise (running, HIIT, sports)?', type: 'multiple', options: ['0 days', '1-2 days', '3-4 days', '5-6 days', '7 days'] },
      { id: 'life-3', system: 'lifestyle', category: 'exercise', question: 'How long is your typical exercise session?', type: 'multiple', options: ['Less than 15 minutes', '15-30 minutes', '30-45 minutes', '45-60 minutes', 'More than 60 minutes'] },
      { id: 'life-4', system: 'lifestyle', category: 'exercise', question: 'Do you do strength/resistance training?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', '1-2x/week', '3-4x/week', '5+x/week'] },
      { id: 'life-5', system: 'lifestyle', category: 'exercise', question: 'Do you practice yoga, stretching, or flexibility exercises?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', '1-2x/week', '3-4x/week', 'Daily'] },
      { id: 'life-6', system: 'lifestyle', category: 'exercise', question: 'How would you describe your overall activity level?', type: 'multiple', options: ['Sedentary (desk job, little movement)', 'Lightly active (some walking)', 'Moderately active (regular exercise)', 'Very active (intense daily exercise)', 'Extremely active (athlete/physical job)'] },
      { id: 'life-7', system: 'lifestyle', category: 'exercise', question: 'Do you have any physical limitations that affect your ability to exercise?', type: 'boolean' },
      { id: 'life-7a', system: 'lifestyle', category: 'exercise', question: 'What limitations do you have?', type: 'text', conditionalOn: 'life-7' },
      
      // Sleep
      { id: 'life-8', system: 'lifestyle', category: 'sleep', question: 'How many hours of sleep do you typically get per night?', type: 'multiple', options: ['Less than 5 hours', '5-6 hours', '6-7 hours', '7-8 hours', '8-9 hours', 'More than 9 hours'], required: true },
      { id: 'life-9', system: 'lifestyle', category: 'sleep', question: 'Rate your overall sleep quality', type: 'scale', scaleLabels: { low: 'Very Poor (1)', high: 'Excellent (10)' }, required: true, validatedInstrument: 'PSQI-derived' },
      { id: 'life-10', system: 'lifestyle', category: 'sleep', question: 'Do you have difficulty falling asleep?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'life-11', system: 'lifestyle', category: 'sleep', question: 'Do you wake up during the night?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'life-12', system: 'lifestyle', category: 'sleep', question: 'Do you wake up feeling refreshed?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'] },
      { id: 'life-13', system: 'lifestyle', category: 'sleep', question: 'Do you use electronic devices within 1 hour of bedtime?', type: 'frequency', frequencyOptions: standardFrequencyOptions },
      { id: 'life-14', system: 'lifestyle', category: 'sleep', question: 'Do you have a consistent sleep schedule (same bedtime/wake time)?', type: 'boolean' },
      { id: 'life-15', system: 'lifestyle', category: 'sleep', question: 'Do you use sleep aids (medications, supplements, alcohol)?', type: 'boolean' },
      { id: 'life-15a', system: 'lifestyle', category: 'sleep', question: 'What sleep aids do you use?', type: 'text', conditionalOn: 'life-15' },
      { id: 'life-16', system: 'lifestyle', category: 'sleep', question: 'Have you been diagnosed with a sleep disorder?', type: 'boolean' },
      { id: 'life-16a', system: 'lifestyle', category: 'sleep', question: 'Which sleep disorder?', type: 'multiselect', options: ['Sleep apnea', 'Insomnia', 'Restless leg syndrome', 'Narcolepsy', 'Other'], conditionalOn: 'life-16' },
      
      // Daily Habits
      { id: 'life-17', system: 'lifestyle', category: 'habits', question: 'How many hours per day do you spend sitting?', type: 'multiple', options: ['Less than 4 hours', '4-6 hours', '6-8 hours', '8-10 hours', 'More than 10 hours'] },
      { id: 'life-18', system: 'lifestyle', category: 'habits', question: 'How many hours per day do you spend on screens (TV, computer, phone)?', type: 'multiple', options: ['Less than 2 hours', '2-4 hours', '4-6 hours', '6-8 hours', 'More than 8 hours'] },
      { id: 'life-19', system: 'lifestyle', category: 'habits', question: 'Do you take breaks to move/stretch during prolonged sitting?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'] },
      { id: 'life-20', system: 'lifestyle', category: 'habits', question: 'How often do you spend time outdoors in nature?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Weekly', 'Several times/week', 'Daily'] },
      { id: 'life-21', system: 'lifestyle', category: 'habits', question: 'Do you get regular sun exposure (10-30 min without sunscreen)?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Usually', 'Daily'] },
    ]
  },

  // ============================================
  // SECTION 17: STRESS ASSESSMENT (PSS-Based)
  // ============================================
  {
    id: 'stress',
    name: 'Stress Assessment',
    icon: 'Flame',
    description: 'Assessment of stress levels and coping mechanisms based on validated instruments',
    instructions: 'The following questions ask about your feelings and thoughts during the past month. For each question, indicate how often you felt or thought a certain way.',
    validatedInstrument: 'Perceived Stress Scale (PSS-10) adapted',
    questions: [
      // PSS-derived questions
      { id: 'stress-1', system: 'stress', question: 'In the past month, how often have you been upset because of something that happened unexpectedly?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], required: true, validatedInstrument: 'PSS' },
      { id: 'stress-2', system: 'stress', question: 'In the past month, how often have you felt that you were unable to control the important things in your life?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], required: true, validatedInstrument: 'PSS' },
      { id: 'stress-3', system: 'stress', question: 'In the past month, how often have you felt nervous and stressed?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], required: true, validatedInstrument: 'PSS' },
      { id: 'stress-4', system: 'stress', question: 'In the past month, how often have you felt confident about your ability to handle your personal problems?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], validatedInstrument: 'PSS', helpText: 'Positive coping indicator' },
      { id: 'stress-5', system: 'stress', question: 'In the past month, how often have you felt that things were going your way?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], validatedInstrument: 'PSS', helpText: 'Positive coping indicator' },
      { id: 'stress-6', system: 'stress', question: 'In the past month, how often have you found that you could not cope with all the things that you had to do?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], required: true, validatedInstrument: 'PSS' },
      { id: 'stress-7', system: 'stress', question: 'In the past month, how often have you been able to control irritations in your life?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], validatedInstrument: 'PSS', helpText: 'Positive coping indicator' },
      { id: 'stress-8', system: 'stress', question: 'In the past month, how often have you felt that you were on top of things?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], validatedInstrument: 'PSS', helpText: 'Positive coping indicator' },
      { id: 'stress-9', system: 'stress', question: 'In the past month, how often have you been angered because of things that happened that were outside of your control?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], validatedInstrument: 'PSS' },
      { id: 'stress-10', system: 'stress', question: 'In the past month, how often have you felt difficulties were piling up so high that you could not overcome them?', type: 'frequency', frequencyOptions: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], required: true, validatedInstrument: 'PSS' },
      
      // Stressor identification
      { id: 'stress-11', system: 'stress', question: 'What are your primary sources of stress? (Select all that apply)', type: 'multiselect', options: ['Work/career', 'Finances', 'Health concerns', 'Family relationships', 'Romantic relationship', 'Parenting', 'Caregiving for others', 'Social relationships', 'Major life changes', 'World events/news', 'Time pressure', 'Loneliness/isolation', 'Other'], required: true },
      { id: 'stress-12', system: 'stress', question: 'Rate your current overall stress level', type: 'scale', scaleLabels: { low: 'No stress (1)', high: 'Extreme stress (10)' }, required: true },
      { id: 'stress-13', system: 'stress', question: 'How long have you been experiencing significant stress?', type: 'multiple', options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year', 'Chronic/ongoing'] },
      
      // Coping mechanisms
      { id: 'stress-14', system: 'stress', question: 'How do you typically cope with stress? (Select all that apply)', type: 'multiselect', options: ['Exercise', 'Meditation/mindfulness', 'Deep breathing', 'Talking to friends/family', 'Professional therapy/counseling', 'Journaling', 'Hobbies/creative activities', 'Spending time in nature', 'Prayer/spiritual practice', 'Eating', 'Alcohol', 'Smoking/vaping', 'Drugs', 'Shopping', 'Social media/TV', 'Avoidance/withdrawal', 'Other'] },
      { id: 'stress-15', system: 'stress', question: 'Do you practice any relaxation techniques?', type: 'boolean' },
      { id: 'stress-15a', system: 'stress', question: 'Which relaxation techniques?', type: 'multiselect', options: ['Meditation', 'Deep breathing exercises', 'Progressive muscle relaxation', 'Yoga', 'Tai chi/Qigong', 'Guided imagery', 'Biofeedback', 'Other'], conditionalOn: 'stress-15' },
      { id: 'stress-16', system: 'stress', question: 'How often do you practice relaxation techniques?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Weekly', 'Several times/week', 'Daily'], conditionalOn: 'stress-15' },
      
      // Physical manifestations of stress
      { id: 'stress-17', system: 'stress', question: 'Do you experience physical symptoms when stressed? (Select all that apply)', type: 'multiselect', options: ['Headaches', 'Muscle tension', 'Stomach problems', 'Chest tightness', 'Rapid heartbeat', 'Sweating', 'Trembling', 'Fatigue', 'Sleep problems', 'Appetite changes', 'None'] },
      { id: 'stress-18', system: 'stress', question: 'Do you grind your teeth or clench your jaw?', type: 'boolean' },
      { id: 'stress-19', system: 'stress', question: 'Have you experienced burnout (emotional exhaustion, cynicism, reduced effectiveness)?', type: 'boolean' },
    ]
  },

  // ============================================
  // SECTION 18: PSYCHOSOCIAL ASSESSMENT
  // ============================================
  {
    id: 'psychosocial',
    name: 'Psychosocial Assessment',
    icon: 'Users',
    description: 'Assessment of mental health, social support, and life experiences',
    instructions: 'These questions help us understand your emotional well-being and social environment. Your answers are confidential.',
    subSections: [
      { id: 'mental_health', name: 'Mental Health', description: 'Depression and anxiety screening' },
      { id: 'social_support', name: 'Social Support', description: 'Relationships and community' },
      { id: 'adverse_experiences', name: 'Life Experiences', description: 'Significant life events and trauma' },
      { id: 'current_situation', name: 'Current Situation', description: 'Living conditions and safety' },
    ],
    questions: [
      // Mental Health (PHQ-2 and GAD-2 screening)
      { id: 'psych-1', system: 'psychosocial', category: 'mental_health', question: 'Over the past 2 weeks, how often have you had little interest or pleasure in doing things?', type: 'frequency', frequencyOptions: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'], required: true, validatedInstrument: 'PHQ-2' },
      { id: 'psych-2', system: 'psychosocial', category: 'mental_health', question: 'Over the past 2 weeks, how often have you felt down, depressed, or hopeless?', type: 'frequency', frequencyOptions: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'], required: true, validatedInstrument: 'PHQ-2' },
      { id: 'psych-3', system: 'psychosocial', category: 'mental_health', question: 'Over the past 2 weeks, how often have you felt nervous, anxious, or on edge?', type: 'frequency', frequencyOptions: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'], required: true, validatedInstrument: 'GAD-2' },
      { id: 'psych-4', system: 'psychosocial', category: 'mental_health', question: 'Over the past 2 weeks, how often have you been unable to stop or control worrying?', type: 'frequency', frequencyOptions: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'], required: true, validatedInstrument: 'GAD-2' },
      { id: 'psych-5', system: 'psychosocial', category: 'mental_health', question: 'Have you had thoughts of harming yourself or that you would be better off dead?', type: 'boolean', required: true, helpText: 'If yes, please seek immediate help from a mental health professional or call 988 (Suicide & Crisis Lifeline)' },
      { id: 'psych-6', system: 'psychosocial', category: 'mental_health', question: 'Have you been diagnosed with any mental health conditions?', type: 'boolean' },
      { id: 'psych-6a', system: 'psychosocial', category: 'mental_health', question: 'Which conditions?', type: 'multiselect', options: ['Depression', 'Anxiety disorder', 'Bipolar disorder', 'PTSD', 'OCD', 'ADHD', 'Eating disorder', 'Personality disorder', 'Schizophrenia/psychotic disorder', 'Other'], conditionalOn: 'psych-6' },
      { id: 'psych-7', system: 'psychosocial', category: 'mental_health', question: 'Are you currently receiving mental health treatment?', type: 'boolean' },
      { id: 'psych-7a', system: 'psychosocial', category: 'mental_health', question: 'What type of treatment?', type: 'multiselect', options: ['Therapy/counseling', 'Medication', 'Support groups', 'Other'], conditionalOn: 'psych-7' },
      { id: 'psych-8', system: 'psychosocial', category: 'mental_health', question: 'Rate your overall emotional well-being', type: 'scale', scaleLabels: { low: 'Very Poor (1)', high: 'Excellent (10)' }, required: true },
      
      // Social Support
      { id: 'psych-9', system: 'psychosocial', category: 'social_support', question: 'Do you have people you can count on for emotional support?', type: 'boolean', required: true },
      { id: 'psych-10', system: 'psychosocial', category: 'social_support', question: 'How many close friends or family members do you have that you can confide in?', type: 'multiple', options: ['None', '1-2 people', '3-5 people', '6-10 people', 'More than 10 people'] },
      { id: 'psych-11', system: 'psychosocial', category: 'social_support', question: 'How often do you feel lonely or isolated?', type: 'frequency', frequencyOptions: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'], validatedInstrument: 'UCLA Loneliness Scale-derived' },
      { id: 'psych-12', system: 'psychosocial', category: 'social_support', question: 'How satisfied are you with your social relationships?', type: 'scale', scaleLabels: { low: 'Very Dissatisfied (1)', high: 'Very Satisfied (10)' } },
      { id: 'psych-13', system: 'psychosocial', category: 'social_support', question: 'Are you in a romantic relationship?', type: 'boolean' },
      { id: 'psych-13a', system: 'psychosocial', category: 'social_support', question: 'How satisfied are you with your relationship?', type: 'scale', scaleLabels: { low: 'Very Dissatisfied (1)', high: 'Very Satisfied (10)' }, conditionalOn: 'psych-13' },
      { id: 'psych-14', system: 'psychosocial', category: 'social_support', question: 'Are you involved in community activities, religious/spiritual groups, or clubs?', type: 'boolean' },
      { id: 'psych-15', system: 'psychosocial', category: 'social_support', question: 'Do you have a sense of purpose or meaning in your life?', type: 'scale', scaleLabels: { low: 'Not at all (1)', high: 'Very much (10)' } },
      
      // Adverse Childhood Experiences (ACE-derived)
      { id: 'psych-16', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, did you experience emotional abuse (being put down, humiliated, threatened)?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-17', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, did you experience physical abuse?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-18', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, did you experience sexual abuse?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-19', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, did you often feel unsupported, unloved, or that your family didn\'t look out for each other?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-20', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, did you often lack enough to eat, have to wear dirty clothes, or feel unprotected?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-21', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, were your parents separated or divorced?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-22', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, was a household member depressed, mentally ill, or did they attempt suicide?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-23', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, was a household member a problem drinker or drug user?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-24', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, was a household member incarcerated?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-25', system: 'psychosocial', category: 'adverse_experiences', question: 'Before age 18, did you witness domestic violence in your home?', type: 'boolean', validatedInstrument: 'ACE' },
      { id: 'psych-26', system: 'psychosocial', category: 'adverse_experiences', question: 'As an adult, have you experienced trauma (assault, accident, disaster, combat, etc.)?', type: 'boolean' },
      { id: 'psych-26a', system: 'psychosocial', category: 'adverse_experiences', question: 'Do you experience symptoms related to this trauma (flashbacks, nightmares, avoidance)?', type: 'boolean', conditionalOn: 'psych-26' },
      { id: 'psych-27', system: 'psychosocial', category: 'adverse_experiences', question: 'Have you experienced significant grief or loss?', type: 'boolean' },
      { id: 'psych-27a', system: 'psychosocial', category: 'adverse_experiences', question: 'How recent was this loss?', type: 'multiple', options: ['Within past month', '1-6 months ago', '6-12 months ago', '1-2 years ago', 'More than 2 years ago'], conditionalOn: 'psych-27' },
      
      // Current Situation
      { id: 'psych-28', system: 'psychosocial', category: 'current_situation', question: 'What is your current living situation?', type: 'multiple', options: ['Own home', 'Renting', 'Living with family', 'Living with roommates', 'Temporary housing', 'Homeless/unstable housing'], required: true },
      { id: 'psych-29', system: 'psychosocial', category: 'current_situation', question: 'Do you feel safe in your current living environment?', type: 'boolean', required: true },
      { id: 'psych-30', system: 'psychosocial', category: 'current_situation', question: 'Are you currently employed?', type: 'multiple', options: ['Full-time employed', 'Part-time employed', 'Self-employed', 'Unemployed - seeking work', 'Unemployed - not seeking', 'Student', 'Retired', 'Disabled/unable to work', 'Homemaker/caregiver'] },
      { id: 'psych-31', system: 'psychosocial', category: 'current_situation', question: 'Do you have concerns about meeting basic needs (food, housing, utilities)?', type: 'boolean' },
      { id: 'psych-32', system: 'psychosocial', category: 'current_situation', question: 'Do you have health insurance?', type: 'boolean' },
      { id: 'psych-33', system: 'psychosocial', category: 'current_situation', question: 'Do you have reliable transportation?', type: 'boolean' },
      { id: 'psych-34', system: 'psychosocial', category: 'current_situation', question: 'Are you currently in an abusive relationship (physical, emotional, financial)?', type: 'boolean', helpText: 'If yes, please know that help is available. National Domestic Violence Hotline: 1-800-799-7233' },
      { id: 'psych-35', system: 'psychosocial', category: 'current_situation', question: 'Do you have any legal issues that are causing stress?', type: 'boolean' },
      { id: 'psych-36', system: 'psychosocial', category: 'current_situation', question: 'Are you a caregiver for someone else (child, elderly parent, disabled family member)?', type: 'boolean' },
      { id: 'psych-36a', system: 'psychosocial', category: 'current_situation', question: 'How much does caregiving impact your own health and well-being?', type: 'scale', scaleLabels: { low: 'Minimal impact (1)', high: 'Significant impact (10)' }, conditionalOn: 'psych-36' },
      
      // Overall psychosocial assessment
      { id: 'psych-37', system: 'psychosocial', question: 'Rate your overall life satisfaction', type: 'scale', scaleLabels: { low: 'Very Dissatisfied (1)', high: 'Very Satisfied (10)' }, required: true },
      { id: 'psych-38', system: 'psychosocial', question: 'Is there anything else about your mental health or social situation you would like us to know?', type: 'text' },
    ]
  },

  // ============================================
  // SECTION 19: PSYCHIATRIC / MENTAL HEALTH (Original - Enhanced)
  // ============================================
  {
    id: 'psychiatric',
    name: 'Psychiatric Symptoms',
    icon: 'Brain',
    description: 'Additional psychiatric symptom assessment',
    questions: [
      { id: 'psych-add-1', system: 'psychiatric', question: 'Do you have difficulty concentrating or making decisions?', type: 'boolean' },
      { id: 'psych-add-2', system: 'psychiatric', question: 'Do you experience racing thoughts?', type: 'boolean' },
      { id: 'psych-add-3', system: 'psychiatric', question: 'Do you have periods of unusually high energy, decreased need for sleep, or grandiosity?', type: 'boolean' },
      { id: 'psych-add-4', system: 'psychiatric', question: 'Do you experience panic attacks (sudden intense fear with physical symptoms)?', type: 'boolean' },
      { id: 'psych-add-5', system: 'psychiatric', question: 'Do you have specific phobias that interfere with daily life?', type: 'boolean' },
      { id: 'psych-add-6', system: 'psychiatric', question: 'Do you have intrusive, unwanted thoughts that cause distress?', type: 'boolean' },
      { id: 'psych-add-7', system: 'psychiatric', question: 'Do you feel compelled to perform certain rituals or behaviors repeatedly?', type: 'boolean' },
      { id: 'psych-add-8', system: 'psychiatric', question: 'Do you hear voices or see things that others don\'t?', type: 'boolean' },
      { id: 'psych-add-9', system: 'psychiatric', question: 'Do you have beliefs that others might consider unusual or paranoid?', type: 'boolean' },
      { id: 'psych-add-10', system: 'psychiatric', question: 'Do you engage in self-harm behaviors?', type: 'boolean' },
    ]
  },
];

export const physicalExamSystems = [
  { id: 'general', name: 'General Appearance', defaultFinding: 'Well-appearing, no acute distress' },
  { id: 'heent', name: 'HEENT', defaultFinding: 'Normocephalic, PERRLA, TMs clear, oropharynx clear' },
  { id: 'neck', name: 'Neck', defaultFinding: 'Supple, no lymphadenopathy, no thyromegaly' },
  { id: 'cardiovascular', name: 'Cardiovascular', defaultFinding: 'Regular rate and rhythm, no murmurs, rubs, or gallops' },
  { id: 'respiratory', name: 'Respiratory', defaultFinding: 'Clear to auscultation bilaterally, no wheezes or crackles' },
  { id: 'abdomen', name: 'Abdomen', defaultFinding: 'Soft, non-tender, non-distended, normoactive bowel sounds' },
  { id: 'extremities', name: 'Extremities', defaultFinding: 'No edema, no cyanosis, pulses 2+ bilaterally' },
  { id: 'skin', name: 'Skin', defaultFinding: 'Warm, dry, no rashes or lesions' },
  { id: 'neurological', name: 'Neurological', defaultFinding: 'Alert and oriented x3, CN II-XII intact, strength 5/5 all extremities' },
  { id: 'psychiatric', name: 'Psychiatric', defaultFinding: 'Normal mood and affect, appropriate behavior' },
  { id: 'musculoskeletal', name: 'Musculoskeletal', defaultFinding: 'Full ROM all joints, no tenderness or deformity' },
];

// Scoring functions for validated instruments
export const calculatePSSScore = (answers: { [key: string]: any }): number => {
  // PSS-10 scoring: questions 4, 5, 7, 8 are reverse scored
  const positiveItems = ['stress-1', 'stress-2', 'stress-3', 'stress-6', 'stress-9', 'stress-10'];
  const negativeItems = ['stress-4', 'stress-5', 'stress-7', 'stress-8'];
  const frequencyToScore: { [key: string]: number } = {
    'Never': 0, 'Almost never': 1, 'Sometimes': 2, 'Fairly often': 3, 'Very often': 4
  };
  
  let score = 0;
  positiveItems.forEach(id => {
    if (answers[id]) score += frequencyToScore[answers[id]] || 0;
  });
  negativeItems.forEach(id => {
    if (answers[id]) score += 4 - (frequencyToScore[answers[id]] || 0);
  });
  
  return score;
};

export const calculatePHQ2Score = (answers: { [key: string]: any }): number => {
  const items = ['psych-1', 'psych-2'];
  const frequencyToScore: { [key: string]: number } = {
    'Not at all': 0, 'Several days': 1, 'More than half the days': 2, 'Nearly every day': 3
  };
  
  return items.reduce((score, id) => score + (frequencyToScore[answers[id]] || 0), 0);
};

export const calculateGAD2Score = (answers: { [key: string]: any }): number => {
  const items = ['psych-3', 'psych-4'];
  const frequencyToScore: { [key: string]: number } = {
    'Not at all': 0, 'Several days': 1, 'More than half the days': 2, 'Nearly every day': 3
  };
  
  return items.reduce((score, id) => score + (frequencyToScore[answers[id]] || 0), 0);
};

export const calculateACEScore = (answers: { [key: string]: any }): number => {
  const aceItems = [
    'psych-16', 'psych-17', 'psych-18', 'psych-19', 'psych-20',
    'psych-21', 'psych-22', 'psych-23', 'psych-24', 'psych-25'
  ];
  
  return aceItems.reduce((score, id) => score + (answers[id] === true ? 1 : 0), 0);
};

export const interpretPSSScore = (score: number): string => {
  if (score <= 13) return 'Low stress';
  if (score <= 26) return 'Moderate stress';
  return 'High perceived stress';
};

export const interpretPHQ2Score = (score: number): string => {
  return score >= 3 ? 'Positive screen for depression - further evaluation recommended' : 'Negative screen';
};

export const interpretGAD2Score = (score: number): string => {
  return score >= 3 ? 'Positive screen for anxiety - further evaluation recommended' : 'Negative screen';
};

export const interpretACEScore = (score: number): string => {
  if (score === 0) return 'No reported adverse childhood experiences';
  if (score <= 3) return 'Some adverse childhood experiences - may benefit from trauma-informed care';
  return 'Multiple adverse childhood experiences - strongly recommend trauma-informed care approach';
};
