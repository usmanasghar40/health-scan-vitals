import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  History, TrendingUp, TrendingDown, Calendar, Filter, 
  ChevronDown, RefreshCw, Target, Award, ArrowRight
} from 'lucide-react';
import { 
  getVitalMeasurements, 
  getLabResults, 
  getScanResults,
  getHealthGoals,
  VitalMeasurement,
  LabResultRecord,
  ScanResultRecord,
  HealthGoal
} from '@/lib/healthDatabase';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
type ChartType = 'vitals' | 'labs' | 'scans' | 'goals';

const HistoryView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartType, setChartType] = useState<ChartType>('vitals');
  const [selectedMetric, setSelectedMetric] = useState<string>('heart_rate');
  const [vitalsData, setVitalsData] = useState<VitalMeasurement[]>([]);
  const [labsData, setLabsData] = useState<LabResultRecord[]>([]);
  const [scansData, setScansData] = useState<ScanResultRecord[]>([]);
  const [goalsData, setGoalsData] = useState<HealthGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState<string>('LDL Cholesterol');

  const vitalMetrics = [
    { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: '#f43f5e' },
    { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', color: '#8b5cf6' },
    { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', color: '#a855f7' },
    { key: 'o2_saturation', label: 'O2 Saturation', unit: '%', color: '#22d3ee' },
    { key: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', color: '#f59e0b' },
    { key: 'body_temperature', label: 'Temperature', unit: '°F', color: '#ef4444' },
    { key: 'respiratory_rate', label: 'Respiratory Rate', unit: '/min', color: '#10b981' },
  ];

  const labTests = [
    'LDL Cholesterol', 'HDL Cholesterol', 'Total Cholesterol', 'hs-CRP', 'HbA1c'
  ];

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vitals, labs, scans, goals] = await Promise.all([
        getVitalMeasurements('default_user', 50),
        getLabResults('default_user', undefined, 100),
        getScanResults('default_user', undefined, 20),
        getHealthGoals('default_user', 'active')
      ]);
      
      setVitalsData(vitals || []);
      setLabsData(labs || []);
      setScansData(scans || []);
      setGoalsData(goals || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getVitalsChartData = () => {
    return vitalsData
      .slice()
      .reverse()
      .map(v => ({
        date: formatDate(v.measurement_date),
        fullDate: v.measurement_date,
        heart_rate: v.heart_rate,
        systolic_bp: v.systolic_bp,
        diastolic_bp: v.diastolic_bp,
        o2_saturation: v.o2_saturation,
        blood_glucose: v.blood_glucose,
        body_temperature: v.body_temperature,
        respiratory_rate: v.respiratory_rate
      }));
  };

  const getLabsChartData = () => {
    const filteredLabs = labsData.filter(l => l.test_name === selectedLabTest);
    return filteredLabs
      .slice()
      .reverse()
      .map(l => ({
        date: formatDate(l.test_date),
        fullDate: l.test_date,
        value: l.test_value,
        status: l.status
      }));
  };

  const getScansChartData = () => {
    return scansData
      .slice()
      .reverse()
      .map(s => ({
        date: formatDate(s.scan_date),
        fullDate: s.scan_date,
        arterial_health: s.arterial_health,
        area: s.area
      }));
  };

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    const first = data[0];
    const last = data[data.length - 1];
    const change = ((last - first) / first) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const getGoalProgress = (goal: HealthGoal) => {
    const startValue = goal.current_value;
    const targetValue = goal.target_value;
    const currentValue = goal.current_value;
    
    // Calculate progress percentage
    const totalChange = Math.abs(targetValue - startValue);
    const currentChange = Math.abs(currentValue - startValue);
    const progress = totalChange > 0 ? (currentChange / totalChange) * 100 : 0;
    
    return Math.min(Math.max(progress, 0), 100);
  };

  const currentMetric = vitalMetrics.find(m => m.key === selectedMetric);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            Health History & Trends
          </h2>
          <p className="text-slate-400 mt-1">Track your health metrics over time</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
          
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Chart Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'vitals', label: 'Vital Signs', icon: TrendingUp },
          { id: 'labs', label: 'Lab Results', icon: Filter },
          { id: 'scans', label: 'Scan History', icon: Target },
          { id: 'goals', label: 'Health Goals', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setChartType(tab.id as ChartType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                chartType === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Vitals Chart */}
      {chartType === 'vitals' && (
        <div className="space-y-6">
          {/* Metric Selector */}
          <div className="flex flex-wrap gap-2">
            {vitalMetrics.map((metric) => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedMetric === metric.key
                    ? 'text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: selectedMetric === metric.key ? metric.color + '30' : undefined,
                  borderColor: selectedMetric === metric.key ? metric.color : undefined,
                  border: selectedMetric === metric.key ? `1px solid ${metric.color}` : undefined
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{currentMetric?.label} Trend</h3>
                <p className="text-sm text-slate-400">Tracking over time ({currentMetric?.unit})</p>
              </div>
              {vitalsData.length > 1 && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const values = vitalsData.map(v => v[selectedMetric as keyof VitalMeasurement] as number).filter(Boolean);
                    const trend = calculateTrend(values);
                    return (
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        trend.direction === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
                        trend.direction === 'down' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> :
                         trend.direction === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                        {trend.percentage}%
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getVitalsChartData()}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentMetric?.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={currentMetric?.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke={currentMetric?.color} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compare Mode */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Compare Multiple Metrics</h3>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  compareMode ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {compareMode ? 'Hide Comparison' : 'Show Comparison'}
              </button>
            </div>
            
            {compareMode && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getVitalsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={2} dot={false} name="Heart Rate" />
                    <Line type="monotone" dataKey="systolic_bp" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Systolic BP" />
                    <Line type="monotone" dataKey="o2_saturation" stroke="#22d3ee" strokeWidth={2} dot={false} name="O2 Sat" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Labs Chart */}
      {chartType === 'labs' && (
        <div className="space-y-6">
          {/* Lab Test Selector */}
          <div className="flex flex-wrap gap-2">
            {labTests.map((test) => (
              <button
                key={test}
                onClick={() => setSelectedLabTest(test)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedLabTest === test
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {test}
              </button>
            ))}
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedLabTest} History</h3>
                <p className="text-sm text-slate-400">Lab values over time</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getLabsChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lab Results Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-white">Recent Lab Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Test</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {labsData.slice(0, 10).map((lab, index) => (
                    <tr key={lab.id || index} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm text-slate-300">{formatDate(lab.test_date)}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{lab.test_name}</td>
                      <td className="px-4 py-3 text-sm text-white">{lab.test_value} {lab.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          lab.status === 'normal' || lab.status === 'optimal' 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {lab.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{lab.normal_range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Scans Chart */}
      {chartType === 'scans' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Arterial Health Score Trend</h3>
                <p className="text-sm text-slate-400">Cardiovascular scan results over time</p>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getScansChartData()}>
                  <defs>
                    <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="arterial_health" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorHealth)" 
                    name="Arterial Health %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scan History Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scansData.slice(0, 6).map((scan, index) => (
              <div key={scan.id || index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">{formatDate(scan.scan_date)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    scan.plaque_level === 'none' ? 'bg-emerald-500/20 text-emerald-400' :
                    scan.plaque_level === 'minimal' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {scan.plaque_level}
                  </span>
                </div>
                <h4 className="font-medium text-white mb-2">{scan.area}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Health Score</span>
                  <span className="text-lg font-bold text-emerald-400">{scan.arterial_health}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Section */}
      {chartType === 'goals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goalsData.map((goal, index) => (
              <div key={goal.id || index} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-white">{goal.target_metric}</h4>
                    <p className="text-sm text-slate-400 capitalize">{goal.goal_type} Goal</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    goal.status === 'active' ? 'bg-cyan-500/20 text-cyan-400' :
                    goal.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {goal.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{goal.current_value}</p>
                    <p className="text-xs text-slate-400">Current</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{goal.target_value}</p>
                    <p className="text-xs text-slate-400">Target</p>
                  </div>
                  <span className="text-sm text-slate-400 ml-auto">{goal.unit}</span>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-cyan-400">{getGoalProgress(goal).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${getGoalProgress(goal)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400 mt-4">
                  <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                  <span>{Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left</span>
                </div>
              </div>
            ))}
          </div>

          {goalsData.length === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
              <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Goals</h3>
              <p className="text-slate-400 mb-4">Set health goals to track your progress over time</p>
              <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
                Create Your First Goal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
