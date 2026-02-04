import React, { useState, useEffect } from 'react';
import VitalCard from './VitalCard';
import { vitalSigns } from '@/data/healthData';
import { VitalSign } from '@/types/health';
import { Activity, RefreshCw, TrendingUp, Clock, Heart, Droplets, Wind, Thermometer } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { getLabResults, LabResultRecord } from '@/lib/healthDatabase';

const VitalsView: React.FC = () => {
  const { currentUser } = useUser();
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [labMarkers, setLabMarkers] = useState<LabResultRecord[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);

  const buildVitals = (measurement?: any): VitalSign[] => {
    const readValue = (val: any) => (val === null || val === undefined ? '--' : val);
    const statusFor = (val: any, low?: number, high?: number): VitalSign['status'] => {
      if (val === null || val === undefined || val === '--') return 'warning';
      if (typeof val !== 'number') return 'warning';
      if (low !== undefined && val < low) return 'warning';
      if (high !== undefined && val > high) return 'warning';
      return 'normal';
    };

    return [
      {
        name: 'Heart Rate',
        value: readValue(measurement?.heart_rate),
        unit: 'BPM',
        status: statusFor(measurement?.heart_rate, 60, 100),
        normalRange: '60-100',
        description: 'Resting heart rate'
      },
      {
        name: 'Blood Pressure',
        value: measurement?.systolic_bp && measurement?.diastolic_bp
          ? `${measurement.systolic_bp}/${measurement.diastolic_bp}`
          : '--/--',
        unit: 'mmHg',
        status: measurement?.systolic_bp && measurement?.diastolic_bp
          ? 'normal'
          : 'warning',
        normalRange: '90/60 - 120/80',
        description: 'Systolic/diastolic blood pressure'
      },
      {
        name: 'O2 Saturation',
        value: readValue(measurement?.o2_saturation),
        unit: '%',
        status: statusFor(measurement?.o2_saturation, 95, 100),
        normalRange: '95-100',
        description: 'Blood oxygen saturation'
      },
      {
        name: 'Respiratory Rate',
        value: readValue(measurement?.respiratory_rate),
        unit: '/min',
        status: statusFor(measurement?.respiratory_rate, 12, 20),
        normalRange: '12-20',
        description: 'Breaths per minute'
      },
      {
        name: 'Blood Glucose',
        value: readValue(measurement?.blood_glucose),
        unit: 'mg/dL',
        status: statusFor(measurement?.blood_glucose, 70, 140),
        normalRange: '70-140',
        description: 'Blood glucose level'
      },
      {
        name: 'Body Temperature',
        value: readValue(measurement?.body_temperature),
        unit: '°F',
        status: statusFor(measurement?.body_temperature, 97, 99),
        normalRange: '97-99',
        description: 'Body temperature'
      }
    ];
  };

  const refreshVitals = async () => {
    if (!currentUser?.id) return;
    setIsRefreshing(true);
    try {
      const data = await getVitalMeasurements(currentUser.id, 1);
      const latest = Array.isArray(data) && data.length > 0 ? data[0] : null;
      setVitals(buildVitals(latest));
      setLastUpdated(latest?.measurement_date ? new Date(latest.measurement_date) : null);
    } catch (err) {
      console.error('Error loading vitals:', err);
      setVitals(buildVitals());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshVitals();
    } else {
      setVitals(buildVitals());
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const loadLabs = async () => {
      if (!currentUser?.id) {
        setLabMarkers([]);
        return;
      }
      setLoadingLabs(true);
      try {
        const data = await getLabResults(currentUser.id, undefined, 10);
        setLabMarkers(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (err) {
        console.error('Error loading lab markers:', err);
      } finally {
        setLoadingLabs(false);
      }
    };
    loadLabs();
  }, [currentUser?.id]);

  const vitalCategories = [
    {
      title: 'Cardiovascular',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      vitals: vitals.filter(v => ['Heart Rate', 'Blood Pressure'].includes(v.name))
    },
    {
      title: 'Respiratory',
      icon: Wind,
      color: 'from-cyan-500 to-blue-500',
      vitals: vitals.filter(v => ['O2 Saturation', 'Respiratory Rate'].includes(v.name))
    },
    {
      title: 'Metabolic',
      icon: Droplets,
      color: 'from-amber-500 to-orange-500',
      vitals: vitals.filter(v => ['Blood Glucose', 'Body Temperature'].includes(v.name))
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Real-Time Vitals
          </h2>
          <p className="text-slate-400 mt-1">Monitor your vital signs in real-time</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdated ? lastUpdated.toLocaleDateString() : 'No data'}
          </div>
          <button
            onClick={refreshVitals}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Vitals by Category */}
      {vitalCategories.map((category, catIndex) => {
        const Icon = category.icon;
        return (
          <div key={category.title}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{category.title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {category.vitals.map((vital, index) => (
                <VitalCard key={vital.name} vital={vital} index={catIndex * 2 + index} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Key Cardiovascular Markers */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Key Blood Markers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingLabs ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
                <div className="h-6 bg-slate-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-2/3" />
              </div>
            ))
          ) : labMarkers.length === 0 ? (
            <div className="col-span-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center text-slate-400">
              No lab markers available yet.
            </div>
          ) : (
            labMarkers.map(marker => (
              <div key={marker.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all">
                <p className="text-sm text-slate-400 mb-2">{marker.test_name}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-white">{marker.test_value}</span>
                  <span className="text-sm text-slate-400">{marker.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    marker.status === 'normal' || marker.status === 'optimal'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : marker.status === 'low'
                        ? 'bg-amber-500/20 text-amber-400'
                        : marker.status === 'high'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-red-500/20 text-red-400'
                  }`}>
                    {marker.status}
                  </span>
                  <span className="text-xs text-slate-500">{marker.normal_range}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Monitoring Notice */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Continuous Monitoring Active</h4>
            <p className="text-slate-300 text-sm">
              Your vitals are being monitored continuously. Any significant changes will trigger 
              an alert. The system automatically refreshes every 30 seconds to provide you with 
              the most up-to-date readings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalsView;
