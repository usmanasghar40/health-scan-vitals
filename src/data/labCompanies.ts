// Laboratory Companies Database
export interface LabCompany {
  id: string;
  name: string;
  shortName: string;
  type: 'major' | 'functional' | 'specialty' | 'european';
  region: 'us' | 'europe' | 'global';
  description: string;
  website: string;
  logo?: string;
  specialties: string[];
  turnaroundTime: string;
  electronicOrdering: boolean;
  rupaHealth: boolean;
  categories: string[];
}

export interface LabTest {
  id: string;
  name: string;
  code: string;
  labCompanyId: string;
  category: string;
  subcategory?: string;
  description: string;
  sampleType: string[];
  fastingRequired: boolean;
  turnaroundTime: string;
  price?: number;
  cptCode?: string;
  icd10Codes?: string[];
  specialInstructions?: string;
  biomarkers?: string[];
}

export interface LabTestCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories?: string[];
}

// Major US Laboratory Companies
export const labCompanies: LabCompany[] = [
  // Major US Labs
  {
    id: 'quest',
    name: 'Quest Diagnostics',
    shortName: 'Quest',
    type: 'major',
    region: 'us',
    description: 'Leading diagnostic information services provider in the United States',
    website: 'https://www.questdiagnostics.com',
    specialties: ['Clinical Chemistry', 'Hematology', 'Microbiology', 'Toxicology'],
    turnaroundTime: '1-3 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Chemistry', 'Hematology', 'Urinalysis', 'Immunology', 'Microbiology', 'Toxicology', 'Molecular']
  },
  {
    id: 'labcorp',
    name: 'Laboratory Corporation of America',
    shortName: 'LabCorp',
    type: 'major',
    region: 'us',
    description: 'Global life sciences company providing vital information for health and wellness',
    website: 'https://www.labcorp.com',
    specialties: ['Clinical Chemistry', 'Genetics', 'Oncology', 'Drug Development'],
    turnaroundTime: '1-3 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Chemistry', 'Hematology', 'Genetics', 'Oncology', 'Endocrinology', 'Immunology']
  },
  {
    id: 'bioreference',
    name: 'BioReference Laboratories',
    shortName: 'BioReference',
    type: 'major',
    region: 'us',
    description: 'Full-service clinical laboratory with specialized testing capabilities',
    website: 'https://www.bioreference.com',
    specialties: ['Oncology', 'Genetics', 'Women\'s Health', 'Urology'],
    turnaroundTime: '1-5 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Oncology', 'Genetics', 'Women\'s Health', 'Urology', 'Chemistry']
  },
  {
    id: 'sonic',
    name: 'Sonic Healthcare USA',
    shortName: 'Sonic',
    type: 'major',
    region: 'us',
    description: 'International healthcare company providing laboratory and pathology services',
    website: 'https://www.sonichealthcareusa.com',
    specialties: ['Pathology', 'Clinical Chemistry', 'Genetics'],
    turnaroundTime: '1-3 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Pathology', 'Chemistry', 'Hematology', 'Microbiology']
  },
  {
    id: 'arup',
    name: 'ARUP Laboratories',
    shortName: 'ARUP',
    type: 'major',
    region: 'us',
    description: 'National reference laboratory and academic enterprise of the University of Utah',
    website: 'https://www.aruplab.com',
    specialties: ['Esoteric Testing', 'Genetics', 'Toxicology', 'Immunology'],
    turnaroundTime: '1-7 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Esoteric', 'Genetics', 'Toxicology', 'Immunology', 'Molecular']
  },
  {
    id: 'mayo',
    name: 'Mayo Clinic Laboratories',
    shortName: 'Mayo',
    type: 'major',
    region: 'us',
    description: 'Reference laboratory of Mayo Clinic offering specialized diagnostic testing',
    website: 'https://www.mayocliniclabs.com',
    specialties: ['Rare Diseases', 'Genetics', 'Autoimmune', 'Oncology'],
    turnaroundTime: '1-14 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Genetics', 'Autoimmune', 'Oncology', 'Endocrinology', 'Rare Diseases']
  },

  // European Labs
  {
    id: 'synlab',
    name: 'SYNLAB International',
    shortName: 'SYNLAB',
    type: 'major',
    region: 'europe',
    description: 'Leading European provider of medical diagnostic services',
    website: 'https://www.synlab.com',
    specialties: ['Clinical Chemistry', 'Pathology', 'Genetics'],
    turnaroundTime: '1-5 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Chemistry', 'Pathology', 'Genetics', 'Microbiology', 'Immunology']
  },
  {
    id: 'eurofins',
    name: 'Eurofins Clinical Diagnostics',
    shortName: 'Eurofins',
    type: 'major',
    region: 'europe',
    description: 'International group of laboratories providing testing and support services',
    website: 'https://www.eurofins.com',
    specialties: ['Genomics', 'Food Testing', 'Environment', 'Clinical'],
    turnaroundTime: '1-7 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Genomics', 'Chemistry', 'Toxicology', 'Microbiology']
  },
  {
    id: 'unilabs',
    name: 'Unilabs',
    shortName: 'Unilabs',
    type: 'major',
    region: 'europe',
    description: 'European leader in clinical laboratory testing and medical imaging',
    website: 'https://www.unilabs.com',
    specialties: ['Clinical Chemistry', 'Imaging', 'Pathology'],
    turnaroundTime: '1-5 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Chemistry', 'Pathology', 'Imaging', 'Hematology']
  },
  {
    id: 'cerba',
    name: 'Cerba Healthcare',
    shortName: 'Cerba',
    type: 'major',
    region: 'europe',
    description: 'Leading European medical biology group',
    website: 'https://www.cerbahealthcare.com',
    specialties: ['Specialized Biology', 'Genetics', 'Oncology'],
    turnaroundTime: '1-7 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Genetics', 'Oncology', 'Specialized Biology', 'Chemistry']
  },

  // Functional Medicine Labs - RUPA Health Partners
  {
    id: 'genova',
    name: 'Genova Diagnostics',
    shortName: 'Genova',
    type: 'functional',
    region: 'us',
    description: 'Pioneer in functional and integrative medicine testing',
    website: 'https://www.gdx.net',
    specialties: ['GI Health', 'Hormones', 'Metabolomics', 'Nutrient Status'],
    turnaroundTime: '7-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['GI Health', 'Hormones', 'Metabolomics', 'Nutrients', 'Detoxification', 'Cardiovascular']
  },
  {
    id: 'doctorsdata',
    name: 'Doctor\'s Data',
    shortName: 'Doctor\'s Data',
    type: 'functional',
    region: 'us',
    description: 'Specializing in functional testing for environmental exposure and nutritional status',
    website: 'https://www.doctorsdata.com',
    specialties: ['Heavy Metals', 'GI Health', 'Nutrients', 'Metabolic'],
    turnaroundTime: '7-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Heavy Metals', 'GI Health', 'Nutrients', 'Metabolic', 'Toxic Elements']
  },
  {
    id: 'mymycolab',
    name: 'MyMycoLab',
    shortName: 'MyMycoLab',
    type: 'functional',
    region: 'us',
    description: 'Specialized laboratory for mold and mycotoxin testing',
    website: 'https://www.mymycolab.com',
    specialties: ['Mycotoxins', 'Mold Exposure', 'Environmental Illness'],
    turnaroundTime: '7-10 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Mycotoxins', 'Environmental Toxins', 'Mold Testing']
  },
  {
    id: 'cellbiolabs',
    name: 'Cell Biolabs',
    shortName: 'Cell Biolabs',
    type: 'functional',
    region: 'us',
    description: 'Research and clinical testing for cellular health and oxidative stress',
    website: 'https://www.cellbiolabs.com',
    specialties: ['Oxidative Stress', 'Cellular Health', 'Antioxidants'],
    turnaroundTime: '7-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Oxidative Stress', 'Cellular Health', 'Antioxidants', 'Inflammation']
  },
  {
    id: 'dutch',
    name: 'DUTCH Test (Precision Analytical)',
    shortName: 'DUTCH',
    type: 'functional',
    region: 'us',
    description: 'Dried Urine Test for Comprehensive Hormones - advanced hormone testing',
    website: 'https://dutchtest.com',
    specialties: ['Hormones', 'Adrenal', 'Organic Acids', 'Neurotransmitters'],
    turnaroundTime: '7-10 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Hormones', 'Adrenal', 'Organic Acids', 'Neurotransmitters', 'Melatonin']
  },
  {
    id: 'vibrant',
    name: 'Vibrant Wellness',
    shortName: 'Vibrant',
    type: 'functional',
    region: 'us',
    description: 'Advanced biomarker testing using proprietary technology',
    website: 'https://www.vibrant-wellness.com',
    specialties: ['Food Sensitivity', 'Gut Health', 'Autoimmune', 'Metabolic'],
    turnaroundTime: '5-10 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Food Sensitivity', 'Gut Zoomer', 'Autoimmune', 'Metabolic', 'Wheat Zoomer', 'Neural Zoomer']
  },
  {
    id: 'greatplains',
    name: 'Great Plains Laboratory',
    shortName: 'GPL',
    type: 'functional',
    region: 'us',
    description: 'Specializing in metabolic, nutritional, and environmental testing',
    website: 'https://www.greatplainslaboratory.com',
    specialties: ['Organic Acids', 'Mycotoxins', 'GPL-TOX', 'Nutritional'],
    turnaroundTime: '7-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Organic Acids', 'Mycotoxins', 'Toxic Chemicals', 'Nutritional', 'Metals']
  },
  {
    id: 'zrt',
    name: 'ZRT Laboratory',
    shortName: 'ZRT',
    type: 'functional',
    region: 'us',
    description: 'Pioneer in saliva and dried blood spot hormone testing',
    website: 'https://www.zrtlab.com',
    specialties: ['Hormones', 'Thyroid', 'Adrenal', 'Cardiometabolic'],
    turnaroundTime: '5-7 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Hormones', 'Thyroid', 'Adrenal', 'Cardiometabolic', 'Neurotransmitters', 'Heavy Metals']
  },
  {
    id: 'dsl',
    name: 'Diagnostic Solutions Laboratory',
    shortName: 'DSL',
    type: 'functional',
    region: 'us',
    description: 'Advanced stool testing and GI health assessment',
    website: 'https://www.diagnosticsolutionslab.com',
    specialties: ['GI-MAP', 'Gut Health', 'Microbiome', 'Parasitology'],
    turnaroundTime: '10-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['GI Health', 'Microbiome', 'Parasitology', 'Pathogens', 'Digestive Function']
  },
  {
    id: 'cyrex',
    name: 'Cyrex Laboratories',
    shortName: 'Cyrex',
    type: 'functional',
    region: 'us',
    description: 'Clinical immunology laboratory specializing in autoimmune testing',
    website: 'https://www.cyrexlabs.com',
    specialties: ['Autoimmune', 'Gluten Sensitivity', 'Cross-Reactivity', 'Barrier Permeability'],
    turnaroundTime: '10-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Autoimmune', 'Gluten', 'Food Reactivity', 'Barrier Function', 'Chemical Sensitivity']
  },
  {
    id: 'mosaic',
    name: 'Mosaic Diagnostics',
    shortName: 'Mosaic',
    type: 'functional',
    region: 'us',
    description: 'Comprehensive metabolic and environmental testing',
    website: 'https://mosaicdx.com',
    specialties: ['Organic Acids', 'Mycotoxins', 'Environmental Toxins', 'Nutritional'],
    turnaroundTime: '7-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Organic Acids', 'Mycotoxins', 'Environmental', 'Nutritional', 'Metals']
  },
  {
    id: 'ayumetrix',
    name: 'Ayumetrix',
    shortName: 'Ayumetrix',
    type: 'functional',
    region: 'us',
    description: 'Saliva hormone testing and wellness panels',
    website: 'https://www.ayumetrix.com',
    specialties: ['Hormones', 'Saliva Testing', 'Wellness'],
    turnaroundTime: '5-7 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Hormones', 'Adrenal', 'Thyroid', 'Wellness']
  },
  {
    id: 'accessmedical',
    name: 'Access Medical Labs',
    shortName: 'Access Medical',
    type: 'functional',
    region: 'us',
    description: 'Comprehensive clinical and specialty testing',
    website: 'https://www.accessmedlab.com',
    specialties: ['Clinical Chemistry', 'Hormones', 'Allergy', 'Toxicology'],
    turnaroundTime: '3-7 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Chemistry', 'Hormones', 'Allergy', 'Toxicology', 'Infectious Disease']
  },
  {
    id: 'dunwoody',
    name: 'Dunwoody Labs',
    shortName: 'Dunwoody',
    type: 'functional',
    region: 'us',
    description: 'Functional immunology and food sensitivity testing',
    website: 'https://www.dunwoodylabs.com',
    specialties: ['Food Sensitivity', 'Immunology', 'Gut Health'],
    turnaroundTime: '7-10 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Food Sensitivity', 'Immunology', 'Gut Health', 'Inflammation']
  },
  {
    id: 'realtime',
    name: 'RealTime Laboratories',
    shortName: 'RealTime',
    type: 'functional',
    region: 'us',
    description: 'Mycotoxin testing and environmental illness assessment',
    website: 'https://www.realtimelab.com',
    specialties: ['Mycotoxins', 'Mold', 'Environmental Illness'],
    turnaroundTime: '7-10 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Mycotoxins', 'Mold', 'Environmental']
  },
  {
    id: 'immunosciences',
    name: 'Immunosciences Lab',
    shortName: 'ISL',
    type: 'functional',
    region: 'us',
    description: 'Advanced immunological and autoimmune testing',
    website: 'https://www.immuno-sci-lab.com',
    specialties: ['Autoimmune', 'Immunology', 'Lyme Disease', 'Viral'],
    turnaroundTime: '7-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Autoimmune', 'Immunology', 'Infectious Disease', 'Viral Reactivation']
  },
  {
    id: 'boston-heart',
    name: 'Boston Heart Diagnostics',
    shortName: 'Boston Heart',
    type: 'specialty',
    region: 'us',
    description: 'Advanced cardiovascular diagnostics and risk assessment',
    website: 'https://www.bostonheartdiagnostics.com',
    specialties: ['Cardiovascular', 'Lipidology', 'Genetics'],
    turnaroundTime: '5-7 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Cardiovascular', 'Lipid', 'Genetics', 'Inflammation']
  },
  {
    id: 'cleveland-heartlab',
    name: 'Cleveland HeartLab',
    shortName: 'Cleveland HeartLab',
    type: 'specialty',
    region: 'us',
    description: 'Cardiovascular disease risk assessment and prevention',
    website: 'https://www.clevelandheartlab.com',
    specialties: ['Cardiovascular', 'Inflammation', 'Metabolic'],
    turnaroundTime: '5-7 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Cardiovascular', 'Inflammation', 'Metabolic', 'TMAO']
  },
  {
    id: 'spectracell',
    name: 'SpectraCell Laboratories',
    shortName: 'SpectraCell',
    type: 'functional',
    region: 'us',
    description: 'Micronutrient testing and cardiovascular risk panels',
    website: 'https://www.spectracell.com',
    specialties: ['Micronutrients', 'Cardiovascular', 'Telomere'],
    turnaroundTime: '10-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Micronutrients', 'Cardiovascular', 'Telomere', 'Genetics']
  },
  {
    id: 'igenex',
    name: 'IGeneX',
    shortName: 'IGeneX',
    type: 'specialty',
    region: 'us',
    description: 'Tick-borne disease testing and Lyme disease specialty',
    website: 'https://igenex.com',
    specialties: ['Lyme Disease', 'Tick-Borne', 'Co-infections'],
    turnaroundTime: '7-14 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Lyme Disease', 'Tick-Borne', 'Co-infections', 'Immunology']
  },
  {
    id: 'arminlabs',
    name: 'ArminLabs',
    shortName: 'ArminLabs',
    type: 'specialty',
    region: 'europe',
    description: 'European specialty lab for tick-borne diseases and chronic infections',
    website: 'https://www.arminlabs.com',
    specialties: ['Lyme Disease', 'Chronic Infections', 'Immunology'],
    turnaroundTime: '10-14 days',
    electronicOrdering: true,
    rupaHealth: false,
    categories: ['Lyme Disease', 'Chronic Infections', 'Immunology', 'EBV', 'Viral']
  },
  {
    id: 'infiniti',
    name: 'Infinity DNA',
    shortName: 'Infinity',
    type: 'specialty',
    region: 'us',
    description: 'Pharmacogenomic and genetic testing',
    website: 'https://www.infinitydna.com',
    specialties: ['Pharmacogenomics', 'Genetics', 'Drug Metabolism'],
    turnaroundTime: '7-10 days',
    electronicOrdering: true,
    rupaHealth: true,
    categories: ['Pharmacogenomics', 'Genetics', 'Drug Metabolism']
  }
];

// Test Categories
export const testCategories: LabTestCategory[] = [
  {
    id: 'chemistry',
    name: 'Clinical Chemistry',
    icon: 'Flask',
    description: 'Basic metabolic panels, liver function, kidney function',
    subcategories: ['Basic Metabolic', 'Comprehensive Metabolic', 'Liver Function', 'Kidney Function', 'Electrolytes']
  },
  {
    id: 'hematology',
    name: 'Hematology',
    icon: 'Droplets',
    description: 'Complete blood counts, coagulation studies',
    subcategories: ['CBC', 'Coagulation', 'Iron Studies', 'Hemoglobin']
  },
  {
    id: 'hormones',
    name: 'Hormones & Endocrine',
    icon: 'Activity',
    description: 'Thyroid, sex hormones, adrenal, pituitary',
    subcategories: ['Thyroid', 'Sex Hormones', 'Adrenal', 'Pituitary', 'Metabolic Hormones']
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    icon: 'Heart',
    description: 'Lipid panels, cardiac markers, inflammation',
    subcategories: ['Lipid Panel', 'Cardiac Markers', 'Inflammation', 'Advanced Lipids', 'Homocysteine']
  },
  {
    id: 'gi-health',
    name: 'GI & Digestive Health',
    icon: 'Utensils',
    description: 'Stool analysis, microbiome, digestive function',
    subcategories: ['Stool Analysis', 'Microbiome', 'Parasitology', 'H. Pylori', 'SIBO']
  },
  {
    id: 'autoimmune',
    name: 'Autoimmune & Immunology',
    icon: 'Shield',
    description: 'ANA, autoantibodies, immune function',
    subcategories: ['ANA Panel', 'Thyroid Antibodies', 'Celiac', 'Rheumatoid', 'Immune Function']
  },
  {
    id: 'food-sensitivity',
    name: 'Food Sensitivity & Allergy',
    icon: 'Apple',
    description: 'IgG, IgE, food reactivity panels',
    subcategories: ['IgG Food Panel', 'IgE Allergy', 'Gluten Reactivity', 'Cross-Reactivity']
  },
  {
    id: 'toxins',
    name: 'Toxins & Environmental',
    icon: 'AlertTriangle',
    description: 'Heavy metals, mycotoxins, environmental chemicals',
    subcategories: ['Heavy Metals', 'Mycotoxins', 'Environmental Chemicals', 'Pesticides', 'Plastics']
  },
  {
    id: 'nutrients',
    name: 'Nutritional & Vitamins',
    icon: 'Pill',
    description: 'Vitamin levels, minerals, micronutrients',
    subcategories: ['Vitamins', 'Minerals', 'Amino Acids', 'Fatty Acids', 'Antioxidants']
  },
  {
    id: 'infectious',
    name: 'Infectious Disease',
    icon: 'Bug',
    description: 'Viral, bacterial, parasitic infections',
    subcategories: ['Viral', 'Bacterial', 'Lyme Disease', 'STI', 'Respiratory']
  },
  {
    id: 'genetics',
    name: 'Genetics & Genomics',
    icon: 'Dna',
    description: 'Genetic testing, pharmacogenomics, hereditary',
    subcategories: ['Pharmacogenomics', 'MTHFR', 'Hereditary', 'Cancer Genetics', 'Carrier Screening']
  },
  {
    id: 'organic-acids',
    name: 'Organic Acids & Metabolomics',
    icon: 'Beaker',
    description: 'Metabolic markers, mitochondrial function',
    subcategories: ['OAT', 'Mitochondrial', 'Neurotransmitter Metabolites', 'Detoxification']
  }
];

// Sample Lab Tests (comprehensive list)
export const labTests: LabTest[] = [
  // Quest/LabCorp Standard Tests
  {
    id: 'cmp',
    name: 'Comprehensive Metabolic Panel (CMP)',
    code: 'CMP-14',
    labCompanyId: 'quest',
    category: 'chemistry',
    subcategory: 'Comprehensive Metabolic',
    description: 'Measures glucose, electrolytes, kidney and liver function',
    sampleType: ['Blood'],
    fastingRequired: true,
    turnaroundTime: '1-2 days',
    price: 35,
    cptCode: '80053',
    biomarkers: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium', 'Total Protein', 'Albumin', 'Bilirubin', 'ALP', 'AST', 'ALT']
  },
  {
    id: 'bmp',
    name: 'Basic Metabolic Panel (BMP)',
    code: 'BMP-8',
    labCompanyId: 'quest',
    category: 'chemistry',
    subcategory: 'Basic Metabolic',
    description: 'Basic assessment of glucose, electrolytes, and kidney function',
    sampleType: ['Blood'],
    fastingRequired: true,
    turnaroundTime: '1-2 days',
    price: 25,
    cptCode: '80048',
    biomarkers: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium']
  },
  {
    id: 'cbc',
    name: 'Complete Blood Count with Differential',
    code: 'CBC-DIFF',
    labCompanyId: 'quest',
    category: 'hematology',
    subcategory: 'CBC',
    description: 'Comprehensive blood cell analysis including white cell differential',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '1 day',
    price: 20,
    cptCode: '85025',
    biomarkers: ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'RDW', 'Platelets', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils']
  },
  {
    id: 'lipid-panel',
    name: 'Lipid Panel',
    code: 'LIPID',
    labCompanyId: 'labcorp',
    category: 'cardiovascular',
    subcategory: 'Lipid Panel',
    description: 'Standard cholesterol and triglyceride assessment',
    sampleType: ['Blood'],
    fastingRequired: true,
    turnaroundTime: '1-2 days',
    price: 30,
    cptCode: '80061',
    biomarkers: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'VLDL', 'TC/HDL Ratio']
  },
  {
    id: 'tsh',
    name: 'TSH (Thyroid Stimulating Hormone)',
    code: 'TSH',
    labCompanyId: 'quest',
    category: 'hormones',
    subcategory: 'Thyroid',
    description: 'Primary screening test for thyroid function',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '1-2 days',
    price: 35,
    cptCode: '84443',
    biomarkers: ['TSH']
  },
  {
    id: 'thyroid-panel',
    name: 'Comprehensive Thyroid Panel',
    code: 'THYROID-COMP',
    labCompanyId: 'labcorp',
    category: 'hormones',
    subcategory: 'Thyroid',
    description: 'Complete thyroid assessment including antibodies',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '2-3 days',
    price: 150,
    cptCode: '84436',
    biomarkers: ['TSH', 'Free T4', 'Free T3', 'Total T4', 'Total T3', 'Reverse T3', 'TPO Antibodies', 'Thyroglobulin Antibodies']
  },
  {
    id: 'hba1c',
    name: 'Hemoglobin A1c',
    code: 'HBA1C',
    labCompanyId: 'quest',
    category: 'chemistry',
    subcategory: 'Basic Metabolic',
    description: 'Average blood sugar over 2-3 months',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '1-2 days',
    price: 40,
    cptCode: '83036',
    biomarkers: ['HbA1c', 'Estimated Average Glucose']
  },
  {
    id: 'vitamin-d',
    name: 'Vitamin D, 25-Hydroxy',
    code: 'VIT-D',
    labCompanyId: 'quest',
    category: 'nutrients',
    subcategory: 'Vitamins',
    description: 'Measures vitamin D status',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '2-3 days',
    price: 55,
    cptCode: '82306',
    biomarkers: ['25-OH Vitamin D']
  },
  {
    id: 'iron-panel',
    name: 'Iron Panel with Ferritin',
    code: 'IRON-PANEL',
    labCompanyId: 'labcorp',
    category: 'hematology',
    subcategory: 'Iron Studies',
    description: 'Comprehensive iron status assessment',
    sampleType: ['Blood'],
    fastingRequired: true,
    turnaroundTime: '1-2 days',
    price: 65,
    cptCode: '83540',
    biomarkers: ['Serum Iron', 'TIBC', 'Transferrin Saturation', 'Ferritin']
  },
  {
    id: 'crp-hs',
    name: 'C-Reactive Protein, High Sensitivity',
    code: 'CRP-HS',
    labCompanyId: 'quest',
    category: 'cardiovascular',
    subcategory: 'Inflammation',
    description: 'Sensitive marker of inflammation and cardiovascular risk',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '1-2 days',
    price: 45,
    cptCode: '86141',
    biomarkers: ['hs-CRP']
  },

  // Genova Diagnostics Tests
  {
    id: 'gi-effects',
    name: 'GI Effects Comprehensive Profile',
    code: 'GI-EFFECTS',
    labCompanyId: 'genova',
    category: 'gi-health',
    subcategory: 'Stool Analysis',
    description: 'Comprehensive stool analysis for digestive function, microbiome, and pathogens',
    sampleType: ['Stool'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 499,
    specialInstructions: 'Collect samples over 3 days. Avoid probiotics 2 weeks before.',
    biomarkers: ['Pancreatic Elastase', 'Fecal Fat', 'Calprotectin', 'Secretory IgA', 'Beta-glucuronidase', 'Occult Blood', 'Beneficial Bacteria', 'Dysbiotic Bacteria', 'Parasites', 'Yeast/Fungi']
  },
  {
    id: 'nutreval',
    name: 'NutrEval FMV',
    code: 'NUTREVAL',
    labCompanyId: 'genova',
    category: 'nutrients',
    subcategory: 'Comprehensive',
    description: 'Comprehensive nutritional evaluation including vitamins, minerals, amino acids, and metabolic markers',
    sampleType: ['Blood', 'Urine'],
    fastingRequired: true,
    turnaroundTime: '10-14 days',
    price: 599,
    biomarkers: ['Vitamins', 'Minerals', 'Amino Acids', 'Fatty Acids', 'Organic Acids', 'Oxidative Stress Markers']
  },
  {
    id: 'one-day-hormone',
    name: 'ONE Day Hormone Check',
    code: 'ONE-DAY',
    labCompanyId: 'genova',
    category: 'hormones',
    subcategory: 'Comprehensive',
    description: 'Comprehensive dried urine hormone panel',
    sampleType: ['Dried Urine'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 399,
    biomarkers: ['Estrogens', 'Progesterone', 'Testosterone', 'DHEA', 'Cortisol', 'Melatonin', 'Organic Acids']
  },

  // DUTCH Tests
  {
    id: 'dutch-complete',
    name: 'DUTCH Complete',
    code: 'DUTCH-COMP',
    labCompanyId: 'dutch',
    category: 'hormones',
    subcategory: 'Comprehensive',
    description: 'Most comprehensive hormone test including metabolites and adrenal markers',
    sampleType: ['Dried Urine'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 499,
    specialInstructions: 'Collect 4-5 samples over 24 hours. Women should test days 19-22 of cycle.',
    biomarkers: ['Estrone', 'Estradiol', 'Estriol', '2-OH-E1', '4-OH-E1', '16-OH-E1', 'Progesterone Metabolites', 'Testosterone', 'DHT', 'DHEA-S', 'Cortisol x4', 'Cortisone', 'Melatonin', 'Organic Acids']
  },
  {
    id: 'dutch-plus',
    name: 'DUTCH Plus',
    code: 'DUTCH-PLUS',
    labCompanyId: 'dutch',
    category: 'hormones',
    subcategory: 'Adrenal',
    description: 'DUTCH Complete with Cortisol Awakening Response',
    sampleType: ['Dried Urine', 'Saliva'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 599,
    biomarkers: ['All DUTCH Complete markers', 'Cortisol Awakening Response (5 saliva samples)']
  },
  {
    id: 'dutch-sex-hormone',
    name: 'DUTCH Sex Hormone Metabolites',
    code: 'DUTCH-SHM',
    labCompanyId: 'dutch',
    category: 'hormones',
    subcategory: 'Sex Hormones',
    description: 'Focused sex hormone and metabolite assessment',
    sampleType: ['Dried Urine'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 299,
    biomarkers: ['Estrogens', 'Estrogen Metabolites', 'Progesterone', 'Testosterone', 'DHEA']
  },

  // Doctor's Data Tests
  {
    id: 'toxic-metals-urine',
    name: 'Toxic & Essential Elements - Urine',
    code: 'TEE-URINE',
    labCompanyId: 'doctorsdata',
    category: 'toxins',
    subcategory: 'Heavy Metals',
    description: 'Comprehensive heavy metal and essential mineral assessment',
    sampleType: ['Urine'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 199,
    specialInstructions: 'Can be done as provoked or unprovoked collection.',
    biomarkers: ['Aluminum', 'Antimony', 'Arsenic', 'Cadmium', 'Lead', 'Mercury', 'Nickel', 'Tin', 'Essential Elements']
  },
  {
    id: 'gi-360',
    name: 'GI360 Microbiome Profile',
    code: 'GI360',
    labCompanyId: 'doctorsdata',
    category: 'gi-health',
    subcategory: 'Microbiome',
    description: 'Advanced microbiome analysis using PCR and culture',
    sampleType: ['Stool'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 449,
    biomarkers: ['Microbiome Diversity', 'Beneficial Bacteria', 'Opportunistic Bacteria', 'Parasites', 'Yeast', 'Digestive Markers']
  },
  {
    id: 'hair-elements',
    name: 'Hair Elements Analysis',
    code: 'HAIR-ELEM',
    labCompanyId: 'doctorsdata',
    category: 'toxins',
    subcategory: 'Heavy Metals',
    description: 'Long-term exposure assessment for toxic and essential elements',
    sampleType: ['Hair'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 149,
    biomarkers: ['Toxic Elements', 'Essential Elements', 'Element Ratios']
  },

  // Vibrant Wellness Tests
  {
    id: 'gut-zoomer',
    name: 'Gut Zoomer 3.0',
    code: 'GUT-ZOOM',
    labCompanyId: 'vibrant',
    category: 'gi-health',
    subcategory: 'Microbiome',
    description: 'Most comprehensive microbiome analysis available',
    sampleType: ['Stool'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 499,
    biomarkers: ['300+ Microorganisms', 'Pathogens', 'Parasites', 'Viruses', 'Fungi', 'Antibiotic Resistance Genes', 'Digestive Function']
  },
  {
    id: 'wheat-zoomer',
    name: 'Wheat Zoomer',
    code: 'WHEAT-ZOOM',
    labCompanyId: 'vibrant',
    category: 'food-sensitivity',
    subcategory: 'Gluten Reactivity',
    description: 'Comprehensive wheat and gluten sensitivity assessment',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '5-7 days',
    price: 299,
    biomarkers: ['Wheat Peptides', 'Gluten Peptides', 'Intestinal Permeability', 'Celiac Markers', 'Wheat Germ Agglutinin']
  },
  {
    id: 'food-sensitivity-96',
    name: 'Food Sensitivity Complete',
    code: 'FS-COMPLETE',
    labCompanyId: 'vibrant',
    category: 'food-sensitivity',
    subcategory: 'IgG Food Panel',
    description: '96 food IgG and IgA antibody panel',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '5-7 days',
    price: 399,
    biomarkers: ['96 Foods - IgG', '96 Foods - IgA']
  },
  {
    id: 'neural-zoomer',
    name: 'Neural Zoomer Plus',
    code: 'NEURAL-ZOOM',
    labCompanyId: 'vibrant',
    category: 'autoimmune',
    subcategory: 'Neurological',
    description: 'Comprehensive neurological autoimmune assessment',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 599,
    biomarkers: ['48 Neurological Antibodies', 'Blood-Brain Barrier', 'Peripheral Nerve', 'Autonomic', 'Enteric']
  },

  // Great Plains Laboratory Tests
  {
    id: 'oat',
    name: 'Organic Acids Test (OAT)',
    code: 'OAT',
    labCompanyId: 'greatplains',
    category: 'organic-acids',
    subcategory: 'OAT',
    description: 'Comprehensive metabolic snapshot including yeast, bacteria, and mitochondrial markers',
    sampleType: ['Urine'],
    fastingRequired: true,
    turnaroundTime: '10-14 days',
    price: 349,
    specialInstructions: 'First morning urine. Fast overnight.',
    biomarkers: ['76 Metabolic Markers', 'Yeast/Fungal', 'Bacterial', 'Oxalates', 'Mitochondrial', 'Neurotransmitter Metabolites', 'Nutritional']
  },
  {
    id: 'mycotox',
    name: 'MycoTOX Profile',
    code: 'MYCOTOX',
    labCompanyId: 'greatplains',
    category: 'toxins',
    subcategory: 'Mycotoxins',
    description: 'Comprehensive mycotoxin screening',
    sampleType: ['Urine'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 399,
    biomarkers: ['Aflatoxin M1', 'Ochratoxin A', 'Sterigmatocystin', 'Roridin E', 'Verrucarin A', 'Enniatin B1', 'Zearalenone', 'Gliotoxin', 'Mycophenolic Acid', 'Dihydrocitrinone', 'Chaetoglobosin A']
  },
  {
    id: 'gpl-tox',
    name: 'GPL-TOX (Toxic Non-Metal Chemicals)',
    code: 'GPL-TOX',
    labCompanyId: 'greatplains',
    category: 'toxins',
    subcategory: 'Environmental Chemicals',
    description: 'Environmental chemical and pesticide exposure assessment',
    sampleType: ['Urine'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 299,
    biomarkers: ['Phthalates', 'Vinyl Chloride', 'Benzene', 'Xylene', 'Styrene', 'Organophosphates', 'Pyrethrins', 'MTBE', 'Perchlorate', 'Diphenyl Phosphate', 'Acrylamide', 'Tiglylglycine']
  },

  // Cyrex Tests
  {
    id: 'cyrex-array2',
    name: 'Array 2 - Intestinal Antigenic Permeability Screen',
    code: 'CYREX-2',
    labCompanyId: 'cyrex',
    category: 'autoimmune',
    subcategory: 'Barrier Function',
    description: 'Intestinal permeability (leaky gut) assessment',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 325,
    biomarkers: ['Actomyosin IgG', 'Actomyosin IgA', 'Occludin/Zonulin IgG', 'Occludin/Zonulin IgA', 'Lipopolysaccharides IgG', 'Lipopolysaccharides IgA']
  },
  {
    id: 'cyrex-array3',
    name: 'Array 3X - Wheat/Gluten Proteome Reactivity',
    code: 'CYREX-3X',
    labCompanyId: 'cyrex',
    category: 'food-sensitivity',
    subcategory: 'Gluten Reactivity',
    description: 'Most comprehensive gluten sensitivity assessment',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 425,
    biomarkers: ['Native + Deamidated Gliadin', 'Wheat Germ Agglutinin', 'Glutenin', 'Gluteomorphin', 'Prodynorphin', 'Transglutaminase-2', 'Transglutaminase-3', 'Transglutaminase-6']
  },
  {
    id: 'cyrex-array4',
    name: 'Array 4 - Gluten-Associated Cross-Reactive Foods',
    code: 'CYREX-4',
    labCompanyId: 'cyrex',
    category: 'food-sensitivity',
    subcategory: 'Cross-Reactivity',
    description: 'Foods that cross-react with gluten',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 425,
    biomarkers: ['Dairy', 'Grains', 'Yeast', 'Coffee', 'Chocolate', 'Eggs', 'Corn', 'Rice', 'Potato', 'Soy', 'Millet', 'Hemp', 'Amaranth', 'Quinoa', 'Tapioca', 'Teff', 'Sorghum', 'Buckwheat']
  },
  {
    id: 'cyrex-array5',
    name: 'Array 5 - Multiple Autoimmune Reactivity Screen',
    code: 'CYREX-5',
    labCompanyId: 'cyrex',
    category: 'autoimmune',
    subcategory: 'Comprehensive',
    description: 'Predictive autoimmune screening for 24 tissues',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 675,
    biomarkers: ['24 Tissue Antibodies', 'Brain', 'Thyroid', 'Gut', 'Adrenal', 'Joints', 'Heart', 'Liver', 'Pancreas', 'Ovary/Testis']
  },

  // Diagnostic Solutions Lab Tests
  {
    id: 'gi-map',
    name: 'GI-MAP',
    code: 'GI-MAP',
    labCompanyId: 'dsl',
    category: 'gi-health',
    subcategory: 'Stool Analysis',
    description: 'DNA-based stool analysis for pathogens and microbiome',
    sampleType: ['Stool'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 399,
    biomarkers: ['H. pylori + Virulence Factors', 'Parasites', 'Bacteria', 'Viruses', 'Fungi', 'Opportunistic Bacteria', 'Autoimmune Triggers', 'Digestive Markers']
  },
  {
    id: 'gi-map-zonulin',
    name: 'GI-MAP + Zonulin',
    code: 'GI-MAP-Z',
    labCompanyId: 'dsl',
    category: 'gi-health',
    subcategory: 'Stool Analysis',
    description: 'GI-MAP with intestinal permeability marker',
    sampleType: ['Stool'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 449,
    biomarkers: ['All GI-MAP markers', 'Zonulin']
  },

  // ZRT Laboratory Tests
  {
    id: 'zrt-saliva-hormone',
    name: 'Saliva Hormone Profile',
    code: 'ZRT-SALIVA',
    labCompanyId: 'zrt',
    category: 'hormones',
    subcategory: 'Sex Hormones',
    description: 'Saliva-based sex hormone assessment',
    sampleType: ['Saliva'],
    fastingRequired: false,
    turnaroundTime: '5-7 days',
    price: 199,
    biomarkers: ['Estradiol', 'Progesterone', 'Testosterone', 'DHEA-S', 'Cortisol']
  },
  {
    id: 'zrt-thyroid',
    name: 'Thyroid Panel (Blood Spot)',
    code: 'ZRT-THYROID',
    labCompanyId: 'zrt',
    category: 'hormones',
    subcategory: 'Thyroid',
    description: 'Comprehensive thyroid assessment via blood spot',
    sampleType: ['Blood Spot'],
    fastingRequired: false,
    turnaroundTime: '5-7 days',
    price: 175,
    biomarkers: ['TSH', 'Free T4', 'Free T3', 'TPO Antibodies']
  },
  {
    id: 'zrt-cardiometabolic',
    name: 'CardioMetabolic Profile',
    code: 'ZRT-CARDIO',
    labCompanyId: 'zrt',
    category: 'cardiovascular',
    subcategory: 'Comprehensive',
    description: 'Cardiovascular and metabolic risk assessment',
    sampleType: ['Blood Spot'],
    fastingRequired: true,
    turnaroundTime: '5-7 days',
    price: 225,
    biomarkers: ['Lipid Panel', 'HbA1c', 'Insulin', 'hs-CRP', 'Homocysteine']
  },

  // Boston Heart Tests
  {
    id: 'boston-hdl-map',
    name: 'HDL Map',
    code: 'BH-HDL',
    labCompanyId: 'boston-heart',
    category: 'cardiovascular',
    subcategory: 'Advanced Lipids',
    description: 'Advanced HDL particle analysis',
    sampleType: ['Blood'],
    fastingRequired: true,
    turnaroundTime: '5-7 days',
    price: 150,
    biomarkers: ['HDL Subfractions', 'HDL Function', 'Cholesterol Efflux']
  },
  {
    id: 'boston-fatty-acid',
    name: 'Fatty Acid Balance',
    code: 'BH-FA',
    labCompanyId: 'boston-heart',
    category: 'cardiovascular',
    subcategory: 'Fatty Acids',
    description: 'Omega-3 and omega-6 fatty acid analysis',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '5-7 days',
    price: 125,
    biomarkers: ['Omega-3 Index', 'AA/EPA Ratio', 'Omega-6/Omega-3 Ratio']
  },

  // Cleveland HeartLab Tests
  {
    id: 'cleveland-tmao',
    name: 'TMAO',
    code: 'CHL-TMAO',
    labCompanyId: 'cleveland-heartlab',
    category: 'cardiovascular',
    subcategory: 'TMAO',
    description: 'Gut-derived cardiovascular risk marker',
    sampleType: ['Blood'],
    fastingRequired: true,
    turnaroundTime: '5-7 days',
    price: 99,
    biomarkers: ['TMAO']
  },
  {
    id: 'cleveland-mpomass',
    name: 'MPO Mass',
    code: 'CHL-MPO',
    labCompanyId: 'cleveland-heartlab',
    category: 'cardiovascular',
    subcategory: 'Inflammation',
    description: 'Myeloperoxidase - vascular inflammation marker',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '5-7 days',
    price: 89,
    biomarkers: ['MPO']
  },

  // IGeneX Tests
  {
    id: 'igenex-lyme',
    name: 'Lyme ImmunoBlot (IgG/IgM)',
    code: 'IGX-LYME',
    labCompanyId: 'igenex',
    category: 'infectious',
    subcategory: 'Lyme Disease',
    description: 'Comprehensive Lyme disease testing',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '7-14 days',
    price: 450,
    biomarkers: ['Borrelia burgdorferi IgG', 'Borrelia burgdorferi IgM', 'Multiple Borrelia Species']
  },
  {
    id: 'igenex-tickborne',
    name: 'Tick-Borne Disease Panel',
    code: 'IGX-TBD',
    labCompanyId: 'igenex',
    category: 'infectious',
    subcategory: 'Tick-Borne',
    description: 'Comprehensive tick-borne illness panel',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '7-14 days',
    price: 1200,
    biomarkers: ['Borrelia', 'Babesia', 'Bartonella', 'Ehrlichia', 'Anaplasma', 'Rickettsia']
  },

  // SpectraCell Tests
  {
    id: 'spectracell-mnt',
    name: 'Micronutrient Test (MNT)',
    code: 'SC-MNT',
    labCompanyId: 'spectracell',
    category: 'nutrients',
    subcategory: 'Comprehensive',
    description: 'Intracellular micronutrient analysis',
    sampleType: ['Blood'],
    fastingRequired: true,
    turnaroundTime: '10-14 days',
    price: 390,
    biomarkers: ['31 Vitamins', 'Minerals', 'Amino Acids', 'Antioxidants', 'Metabolites', 'SPECTROX (Total Antioxidant Function)', 'Immunidex']
  },
  {
    id: 'spectracell-telomere',
    name: 'Telomere Test',
    code: 'SC-TELO',
    labCompanyId: 'spectracell',
    category: 'genetics',
    subcategory: 'Telomere',
    description: 'Cellular aging assessment via telomere length',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 290,
    biomarkers: ['Telomere Length', 'Telomere Score']
  },

  // MyMycoLab Tests
  {
    id: 'mymyco-complete',
    name: 'Complete Mycotoxin Panel',
    code: 'MMC-COMPLETE',
    labCompanyId: 'mymycolab',
    category: 'toxins',
    subcategory: 'Mycotoxins',
    description: 'Comprehensive mycotoxin exposure assessment',
    sampleType: ['Urine'],
    fastingRequired: false,
    turnaroundTime: '7-10 days',
    price: 399,
    biomarkers: ['Aflatoxins', 'Ochratoxin A', 'Trichothecenes', 'Gliotoxin', 'Zearalenone', 'Fumonisins', 'Citrinin']
  },

  // European Lab Tests
  {
    id: 'armin-lyme',
    name: 'Lyme Borreliosis Panel',
    code: 'ARM-LYME',
    labCompanyId: 'arminlabs',
    category: 'infectious',
    subcategory: 'Lyme Disease',
    description: 'European Lyme disease specialty testing',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 550,
    biomarkers: ['Borrelia EliSpot', 'Borrelia Serology', 'CD57', 'Multiple Borrelia Species']
  },
  {
    id: 'armin-ebv',
    name: 'EBV Panel',
    code: 'ARM-EBV',
    labCompanyId: 'arminlabs',
    category: 'infectious',
    subcategory: 'Viral',
    description: 'Comprehensive Epstein-Barr virus assessment',
    sampleType: ['Blood'],
    fastingRequired: false,
    turnaroundTime: '10-14 days',
    price: 350,
    biomarkers: ['EBV EliSpot', 'EBV Serology', 'EBV PCR']
  }
];

// Common ICD-10 Diagnosis Codes for Lab Orders
export const commonDiagnosisCodes = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'E03.9', description: 'Hypothyroidism, unspecified' },
  { code: 'E05.90', description: 'Thyrotoxicosis, unspecified' },
  { code: 'D50.9', description: 'Iron deficiency anemia, unspecified' },
  { code: 'E55.9', description: 'Vitamin D deficiency, unspecified' },
  { code: 'K21.0', description: 'Gastro-esophageal reflux disease with esophagitis' },
  { code: 'K58.9', description: 'Irritable bowel syndrome without diarrhea' },
  { code: 'K90.0', description: 'Celiac disease' },
  { code: 'M79.3', description: 'Panniculitis, unspecified' },
  { code: 'R53.83', description: 'Other fatigue' },
  { code: 'G93.32', description: 'Myalgic encephalomyelitis/chronic fatigue syndrome' },
  { code: 'A69.20', description: 'Lyme disease, unspecified' },
  { code: 'B44.9', description: 'Aspergillosis, unspecified' },
  { code: 'T78.1', description: 'Other adverse food reactions' },
  { code: 'Z13.220', description: 'Encounter for screening for lipoid disorders' },
  { code: 'Z13.29', description: 'Encounter for screening for other suspected endocrine disorder' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings' },
  { code: 'R73.09', description: 'Other abnormal glucose' },
  { code: 'R79.89', description: 'Other specified abnormal findings of blood chemistry' },
  { code: 'N18.3', description: 'Chronic kidney disease, stage 3' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E66.9', description: 'Obesity, unspecified' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'G47.00', description: 'Insomnia, unspecified' },
  { code: 'L70.0', description: 'Acne vulgaris' },
  { code: 'N95.1', description: 'Menopausal and female climacteric states' },
  { code: 'E29.1', description: 'Testicular hypofunction' },
  { code: 'R63.4', description: 'Abnormal weight loss' }
];

// Lab Order Status Types
export type LabOrderStatus = 'draft' | 'pending' | 'submitted' | 'received' | 'processing' | 'completed' | 'cancelled';

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  labCompanyId: string;
  labCompanyName: string;
  tests: LabTest[];
  diagnosisCodes: { code: string; description: string }[];
  urgency: 'routine' | 'urgent' | 'stat';
  fastingRequired: boolean;
  specialInstructions?: string;
  status: LabOrderStatus;
  createdAt: Date;
  submittedAt?: Date;
  receivedAt?: Date;
  completedAt?: Date;
  estimatedTurnaround?: string;
  totalPrice?: number;
  notes?: string;
  requisitionNumber?: string;
}
