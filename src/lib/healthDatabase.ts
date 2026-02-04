import { apiDelete, apiGet, apiPatch, apiPost } from './api';

export interface VitalMeasurement {
  id?: string;
  user_id: string;
  measurement_date: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  o2_saturation: number | null;
  blood_glucose: number | null;
  body_temperature: number | null;
  respiratory_rate: number | null;
  notes?: string;
}

export interface LabResultRecord {
  id?: string;
  user_id: string;
  test_date: string;
  test_name: string;
  test_value: number;
  unit: string;
  category: string;
  status: string;
  normal_range: string;
}

export interface ScanResultRecord {
  id?: string;
  user_id: string;
  scan_date: string;
  scan_type: string;
  area: string;
  plaque_detected: boolean;
  plaque_level: string;
  arterial_health: number;
  blood_flow: string;
  notes?: string;
}

export interface HealthGoal {
  id?: string;
  user_id: string;
  goal_type: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  notes?: string;
}

const DEFAULT_USER_ID = 'default_user';

// Vital Measurements
export async function getVitalMeasurements(userId: string = DEFAULT_USER_ID, limit: number = 30) {
  return apiGet(`/vitals?userId=${encodeURIComponent(userId)}&limit=${limit}`);
}

export async function saveVitalMeasurement(measurement: Omit<VitalMeasurement, 'id'>) {
  return apiPost(`/vitals`, { ...measurement, user_id: measurement.user_id || DEFAULT_USER_ID });
}

// Lab Results
export async function getLabResults(userId: string = DEFAULT_USER_ID, testName?: string, limit: number = 50) {
  const params = new URLSearchParams({
    userId,
    limit: String(limit),
  });
  if (testName) params.set('testName', testName);
  return apiGet(`/labs?${params.toString()}`);
}

export async function saveLabResult(result: Omit<LabResultRecord, 'id'>) {
  return apiPost(`/labs`, { ...result, user_id: result.user_id || DEFAULT_USER_ID });
}

export async function saveMultipleLabResults(results: Omit<LabResultRecord, 'id'>[]) {
  const resultsWithUser = results.map(r => ({ ...r, user_id: r.user_id || DEFAULT_USER_ID }));
  return apiPost(`/labs/bulk`, resultsWithUser);
}

// Scan Results
export async function getScanResults(userId: string = DEFAULT_USER_ID, scanType?: string, limit: number = 20) {
  const params = new URLSearchParams({
    userId,
    limit: String(limit),
  });
  if (scanType) params.set('scanType', scanType);
  return apiGet(`/scans?${params.toString()}`);
}

export async function saveScanResult(result: Omit<ScanResultRecord, 'id'>) {
  return apiPost(`/scans`, { ...result, user_id: result.user_id || DEFAULT_USER_ID });
}

// Health Goals
export async function getHealthGoals(userId: string = DEFAULT_USER_ID, status?: string) {
  const params = new URLSearchParams({ userId });
  if (status) params.set('status', status);
  return apiGet(`/goals?${params.toString()}`);
}

export async function saveHealthGoal(goal: Omit<HealthGoal, 'id'>) {
  return apiPost(`/goals`, { ...goal, user_id: goal.user_id || DEFAULT_USER_ID });
}

export async function updateHealthGoal(id: string, updates: Partial<HealthGoal>) {
  return apiPatch(`/goals/${id}`, { ...updates, updated_at: new Date().toISOString() });
}

export async function deleteHealthGoal(id: string) {
  await apiDelete(`/goals/${id}`);
}

// Get unique test names for filtering
export async function getUniqueTestNames(userId: string = DEFAULT_USER_ID) {
  return apiGet(`/labs/test-names?userId=${encodeURIComponent(userId)}`);
}

// Get data for date range comparison
export async function getLabResultsByDateRange(
  userId: string = DEFAULT_USER_ID,
  startDate: string,
  endDate: string,
  testName?: string
) {
  const params = new URLSearchParams({
    userId,
    startDate,
    endDate
  });
  if (testName) params.set('testName', testName);
  return apiGet(`/labs/range?${params.toString()}`);
}

export async function getVitalsByDateRange(
  userId: string = DEFAULT_USER_ID,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    userId,
    startDate,
    endDate
  });
  return apiGet(`/vitals/range?${params.toString()}`);
}
