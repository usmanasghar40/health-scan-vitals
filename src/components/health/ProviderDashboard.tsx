import React, { useState, useEffect } from 'react';
import { useUser, Appointment } from '@/contexts/UserContext';
import AIScribeModal from '@/components/health/AIScribeModal';
import { 
  Calendar, Clock, Users, FileText, Video, 
  ChevronRight, ChevronLeft, Settings, Bell,
  CheckCircle, XCircle, AlertCircle, Plus, User,
  MessageCircle, Pill, Sparkles
} from 'lucide-react';

interface ProviderDashboardProps {
  onNavigate: (tab: string) => void;
  onSelectPatient?: (patientId: string) => void;
  subscriptionStatus?: {
    status?: string;
    trialEndsAt?: string;
  } | null;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  onNavigate,
  onSelectPatient,
  subscriptionStatus,
}) => {
  const { currentUser, isAuthenticated, getAppointments, providerProfile, updateAppointment, cancelAppointment } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [scribeAppointment, setScribeAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, selectedDate]);

  const loadAppointments = async () => {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const data = await getAppointments({ startDate: dateStr, endDate: dateStr });
    setTodayAppointments(data.filter(a => a.status !== 'cancelled'));
    
    // Also load upcoming appointments
    const today = new Date().toISOString().split('T')[0];
    const upcoming = await getAppointments({ startDate: today });
    setAppointments(upcoming.filter(a => a.status !== 'cancelled').slice(0, 10));
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'completed' | 'no_show') => {
    setUpdatingId(id);
    const success = await updateAppointment(id, { status } as any);
    if (success) {
      setTodayAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
    setUpdatingId(null);
  };

  const handleCancelAppointment = async (id: string) => {
    setUpdatingId(id);
    const success = await cancelAppointment(id);
    if (success) {
      setTodayAppointments(prev => prev.filter(a => a.id !== id));
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
    setUpdatingId(null);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const stats = [
    { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    { label: 'Pending Confirmations', value: todayAppointments.filter(a => a.status === 'scheduled').length, icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { label: 'Telehealth Today', value: todayAppointments.filter(a => a.isTelehealth).length, icon: Video, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { label: 'Completed Today', value: todayAppointments.filter(a => a.status === 'completed').length, icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  ];
  const trialDaysRemaining = subscriptionStatus?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscriptionStatus.trialEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-blue-600/20 to-cyan-600/20 border border-purple-500/30 rounded-2xl p-8">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-3">
              Provider Portal
            </h1>
            <p className="text-slate-300 text-lg mb-6 max-w-2xl">
              Manage your practice, view appointments, and connect with patients through our comprehensive provider dashboard.
            </p>
            <p className="text-slate-400">Please login to access your provider dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Trial Banner */}
      {subscriptionStatus?.status !== 'active' &&
        subscriptionStatus?.trialEndsAt &&
        trialDaysRemaining !== null &&
        trialDaysRemaining > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
          Your free trial ends in {trialDaysRemaining} days. Subscribe now or features will be
          locked after the trial.
        </div>
      )}
      {!subscriptionStatus && (
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-slate-300">
          Subscription status not available. Open the Subscription tab to refresh your trial details.
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-900/40 p-6 lg:p-8 shadow-[0_20px_60px_-40px_rgba(14,165,233,0.6)]">
        <div className="absolute -top-24 -right-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 text-xs uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3 h-3" />
              Provider Workspace
            </div>
            <h1 className="text-3xl font-bold text-white">
              Welcome, Dr. {currentUser?.lastName}
            </h1>
            <p className="text-slate-400 mt-2">
              {providerProfile?.specialty || 'Healthcare Provider'} • {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                <Calendar className="w-3.5 h-3.5" />
                Today’s Focus
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/50 px-3 py-1 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5" />
                Schedule Ready
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('schedule-manager')}
              className="px-4 py-2 bg-slate-800/70 text-slate-200 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 border border-slate-700/60 shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Manage Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/70 rounded-2xl p-5 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{stat.label}</span>
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/70 rounded-2xl p-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDate(new Date())}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedDate.toDateString() === new Date().toDateString()
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Today
          </button>
          <span className="text-xl font-semibold text-white">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <button
          onClick={() => navigateDate(1)}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Today's Schedule */}
      <div className="schedule-font bg-gradient-to-br from-slate-900/80 to-slate-950/60 border border-slate-800/70 rounded-2xl overflow-hidden shadow-[0_20px_60px_-50px_rgba(14,165,233,0.45)]">
        <div className="p-6 border-b border-slate-800/70 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
              <Calendar className="w-3.5 h-3.5" />
              Daily Schedule
            </div>
            <h2 className="text-xl font-bold text-white mt-2">
              Schedule for {formatDate(selectedDate.toISOString().split('T')[0])}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {todayAppointments.length} appointments
          </span>
        </div>
        
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-20 h-16 bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-medium mb-2">No Appointments</h3>
            <p className="text-slate-500 text-sm">No appointments scheduled for this date</p>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {todayAppointments
              .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
              .map((apt) => (
              <div
                key={apt.id}
                className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-900/70 p-5 hover:bg-slate-900/70 transition-colors shadow-[0_16px_40px_-28px_rgba(14,165,233,0.35)] ring-1 ring-white/5"
              >
                <div className={`absolute inset-y-0 left-0 w-1 ${
                  apt.status === 'completed' ? 'bg-emerald-400/70' :
                  apt.status === 'confirmed' ? 'bg-cyan-400/70' :
                  apt.isTelehealth ? 'bg-purple-400/70' : 'bg-amber-400/60'
                }`} />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <div className="flex items-center gap-4">
                  <div className={`w-24 text-center py-3 rounded-2xl border ${
                    apt.status === 'completed' ? 'bg-emerald-500/20' :
                    apt.status === 'confirmed' ? 'bg-cyan-500/20' :
                    apt.isTelehealth ? 'bg-purple-500/20' : 'bg-slate-700/50'
                  } ${apt.status === 'completed'
                      ? 'border-emerald-500/30'
                      : apt.status === 'confirmed'
                      ? 'border-cyan-500/30'
                      : apt.isTelehealth
                      ? 'border-purple-500/30'
                      : 'border-slate-600/50'
                  }`}>
                    <span className={`text-lg font-bold ${
                      apt.status === 'completed' ? 'text-emerald-400' :
                      apt.status === 'confirmed' ? 'text-cyan-400' :
                      apt.isTelehealth ? 'text-purple-400' : 'text-white'
                    }`}>
                      {formatTime(apt.scheduledTime)}
                    </span>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">
                      {apt.isTelehealth ? 'Virtual' : 'In-person'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-slate-700/60 flex items-center justify-center text-slate-200 text-sm font-semibold shadow-sm">
                        {(apt.patient?.first_name || 'P')[0]}
                        {(apt.patient?.last_name || ' ')[0]}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold leading-tight">
                          {apt.patient?.first_name} {apt.patient?.last_name}
                        </h3>
                        <p className="text-slate-400 text-sm">{apt.reason || apt.appointmentType}</p>
                      </div>
                      <span className={`px-3 py-0.5 text-xs rounded-full ${
                        apt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        apt.status === 'confirmed' ? 'bg-cyan-500/20 text-cyan-400' :
                        apt.status === 'no_show' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                      {apt.isTelehealth && (
                        <span className="px-3 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Telehealth
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-slate-500 text-sm">
                      <span>{apt.duration} minutes</span>
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      <span>{apt.appointmentType || 'Consultation'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {apt.status === 'scheduled' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                        disabled={updatingId === apt.id}
                        className="px-3 py-2 bg-cyan-500/20 text-cyan-200 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center gap-1 border border-cyan-500/30 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <>
                        {apt.isTelehealth && (
                          <button className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            Start Call
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'completed')}
                          disabled={updatingId === apt.id}
                          className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'no_show')}
                          disabled={updatingId === apt.id}
                          className="px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors text-sm flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          No Show
                        </button>
                      </>
                    )}
                    {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        disabled={updatingId === apt.id}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        {updatingId === apt.id ? (
                          <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setScribeAppointment(apt)}
                      className="px-3 py-2 bg-slate-800/80 text-slate-200 rounded-lg hover:bg-slate-800 transition-colors text-sm flex items-center gap-1 border border-slate-700/60 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      AI Scribe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {scribeAppointment && (
        <AIScribeModal
          appointment={scribeAppointment}
          onClose={() => setScribeAppointment(null)}
        />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('my-patients')}
          className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">My Patients</h3>
          <p className="text-slate-400 text-sm">View patients and manage medications</p>
        </button>

        <button
          onClick={() => onNavigate('messages')}
          className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 hover:border-purple-500/40 hover:bg-slate-900/80 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <MessageCircle className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">Messages</h3>
          <p className="text-slate-400 text-sm">Chat with your patients</p>
        </button>

        <button
          onClick={() => onNavigate('schedule-manager')}
          className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-slate-900/80 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Settings className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">Manage Availability</h3>
          <p className="text-slate-400 text-sm">Set your working hours and slots</p>
        </button>

        <button
          onClick={() => onNavigate('appointments')}
          className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">All Appointments</h3>
          <p className="text-slate-400 text-sm">View and manage all appointments</p>
        </button>
      </div>
    </div>
  );
};

export default ProviderDashboard;
