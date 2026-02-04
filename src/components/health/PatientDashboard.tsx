import React, { useState, useEffect } from 'react';
import { useUser, Appointment } from '@/contexts/UserContext';
import { 
  Calendar, Clock, Heart, Activity, FileText, Video, 
  ChevronRight, Bell, User, Stethoscope, Pill, 
  TrendingUp, AlertCircle, CheckCircle, X, Search, MessageCircle,
  Zap, Sparkles, Shield
} from 'lucide-react';

interface PatientDashboardProps {
  onNavigate: (tab: string) => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { currentUser, isAuthenticated, getAppointments, cancelAppointment } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadAppointments = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const data = await getAppointments({ startDate: today });
    setAppointments(data.filter(a => a.status !== 'cancelled').slice(0, 5));
    setLoading(false);
  };

  const handleCancelAppointment = async (id: string) => {
    setCancellingId(id);
    const success = await cancelAppointment(id);
    if (success) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
    setCancellingId(null);
  };

  const getScheduledDate = (apt: any) => apt.scheduledDate ?? apt.scheduled_date;
  const getScheduledTime = (apt: any) => apt.scheduledTime ?? apt.scheduled_time;

  const formatTime = (time?: string) => {
    if (!time) return 'Time TBD';
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return 'Time TBD';
    const hour = parseInt(hours);
    if (Number.isNaN(hour)) return 'Time TBD';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const parseDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isValidDateString = (dateStr?: string) => {
    return parseDate(dateStr) !== null;
  };

  const formatDate = (dateStr?: string) => {
    const date = parseDate(dateStr);
    if (!date) return 'Date TBD';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const quickActions = [
    { icon: Search, label: 'Find Provider', tab: 'find-provider', color: 'from-cyan-500 to-blue-600' },
    { icon: Calendar, label: 'Appointments', tab: 'appointments', color: 'from-purple-500 to-pink-600' },
    { icon: MessageCircle, label: 'Messages', tab: 'messages', color: 'from-indigo-500 to-purple-600' },
    { icon: Heart, label: 'Heart Scan', tab: 'scan', color: 'from-rose-500 to-orange-600' },
    { icon: FileText, label: 'Lab Results', tab: 'labs', color: 'from-emerald-500 to-teal-600' },
    { icon: Pill, label: 'Medications', tab: 'medications', color: 'from-amber-500 to-yellow-600' },
  ];

  const scannerFeatures = [
    { icon: Heart, label: 'Heart rate & rhythm insights' },
    { icon: Activity, label: 'Vitals trend detection' },
    { icon: Zap, label: 'AI-powered anomaly checks' },
    { icon: Shield, label: 'Private, HIPAA-aligned storage' }
  ];


  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        {/* Welcome Banner for Non-Authenticated Users */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/30 rounded-2xl p-8">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome to PEHD
            </h1>
            <p className="text-slate-300 text-lg mb-6 max-w-2xl">
              Your portable electronic health data platform. Find healthcare providers, 
              book appointments, and manage your health all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('find-provider')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Find a Provider
              </button>
              <button
                onClick={() => onNavigate('scan')}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Try Heart Scan
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/30 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.tab}
                onClick={() => onNavigate(action.tab)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/50 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-medium text-sm">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Find Providers</h3>
            <p className="text-slate-400 text-sm mb-4">
              Browse our network of healthcare professionals and book appointments online.
            </p>
            <button
              onClick={() => onNavigate('find-provider')}
              className="text-cyan-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Browse Providers <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Heart Health Scan</h3>
            <p className="text-slate-400 text-sm mb-4">
              Use your phone's camera to measure heart rate and HRV in just 60 seconds.
            </p>
            <button
              onClick={() => onNavigate('scan')}
              className="text-rose-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Start Scan <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lab Results</h3>
            <p className="text-slate-400 text-sm mb-4">
              Import and analyze your lab results with AI-powered interpretations.
            </p>
            <button
              onClick={() => onNavigate('labs')}
              className="text-emerald-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View Labs <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {currentUser?.firstName}!
          </h1>
          <p className="text-slate-400 mt-1">Here's your health overview for today</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('find-provider')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Find Provider
          </button>
        </div>
      </div>

      {/* Health Scanner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-300 font-medium">Smart Health Scanner</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Capture your vitals in seconds
            </h2>
            <p className="text-slate-400">
              Run a guided scan to record key vitals and get an instant AI interpretation tailored to you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scannerFeatures.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                  <feature.icon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300">{feature.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('scan')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
              >
                Start Scan
              </button>
              <button
                onClick={() => onNavigate('vitals')}
                className="px-6 py-3 bg-slate-800/60 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-all"
              >
                View Vitals
              </button>
            </div>
          </div>
          <div className="relative w-full lg:w-80 h-52 bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/30 flex items-center justify-center animate-pulse">
                  <Heart className="w-8 h-8 text-cyan-300" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-xs text-slate-500">
              Latest scan: --
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.tab}
              onClick={() => onNavigate(action.tab)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/50 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-medium text-sm">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upcoming Appointments</h2>
          <button
            onClick={() => onNavigate('appointments')}
            className="text-cyan-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-medium mb-2">No Upcoming Appointments</h3>
            <p className="text-slate-500 text-sm mb-4">Find a provider and book your first appointment</p>
            <button
              onClick={() => onNavigate('find-provider')}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              Find a Provider
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                    apt.isTelehealth ? 'bg-purple-500/20' : 'bg-cyan-500/20'
                  }`}>
                    <span className={`text-xs font-medium ${apt.isTelehealth ? 'text-purple-400' : 'text-cyan-400'}`}>
                      {(() => {
                        const date = parseDate(getScheduledDate(apt));
                        return date
                          ? date.toLocaleDateString('en-US', { month: 'short' })
                          : 'TBD';
                      })()}
                    </span>
                    <span className={`text-xl font-bold ${apt.isTelehealth ? 'text-purple-400' : 'text-cyan-400'}`}>
                      {(() => {
                        const date = parseDate(getScheduledDate(apt));
                        return date ? date.getDate() : '--';
                      })()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">
                        Dr. {apt.provider?.first_name} {apt.provider?.last_name}
                      </h3>
                      {apt.isTelehealth && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Telehealth
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{apt.reason || apt.appointmentType}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(getScheduledTime(apt))}
                      </span>
                      <span>{formatDate(getScheduledDate(apt))}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {apt.isTelehealth && (
                      <button className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm">
                        Join Call
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      disabled={cancellingId === apt.id}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      {cancellingId === apt.id ? (
                        <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
