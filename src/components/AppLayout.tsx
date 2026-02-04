import React, { useEffect, useState, useCallback } from 'react';
import { useUser, ProviderWithUser } from '@/contexts/UserContext';
import { apiGet } from '@/lib/api';
import Navigation from './health/Navigation';
import PatientDashboard from './health/PatientDashboard';
import ProviderDashboard from './health/ProviderDashboard';
import FindProviderView from './health/FindProviderView';
import AppointmentBooking from './health/AppointmentBooking';
import ScheduleManager from './health/ScheduleManager';
import ScanView from './health/ScanView';
import VitalsView from './health/VitalsView';
import LabsView from './health/LabsView';
import ImportView from './health/ImportView';
import HIPAAComplianceView from './health/HIPAAComplianceView';
import ClinicalWorkflowView from './health/ClinicalWorkflowView';
import AIScribeView from './health/AIScribeView';
import HealthChatbot from './health/HealthChatbot';
import TelehealthView from './health/TelehealthView';
import PrescriptionView from './health/PrescriptionView';
import InsuranceView from './health/InsuranceView';
import { SubscriptionView } from './health/SubscriptionView';
import AuthModal from './health/AuthModal';
import MessagingView from './health/MessagingView';
import MyPatientsView from './health/MyPatientsView';
import { 
  MessageCircle, Shield, Lock, Calendar, Pill, User, Settings, 
  Heart, Activity, FileText, Search, Clock, Star, CheckCircle,
  Stethoscope, Users, Video, Brain, ArrowRight
} from 'lucide-react';

// Landing Page Component for non-authenticated users
const LandingPage: React.FC<{ onOpenAuth: (mode: 'login' | 'register') => void }> = ({ onOpenAuth }) => {
  const features = [
    { icon: Brain, title: 'AI Health Insights', description: 'Personalized summaries and recommendations from your data' },
    { icon: Heart, title: 'AI Heart Scans', description: 'Guided scans with AI-assisted interpretation and trends' },
    { icon: FileText, title: 'AI Lab Interpretation', description: 'Turn lab reports into clear explanations and next steps' },
    { icon: Search, title: 'Find Providers', description: 'Search and connect with qualified healthcare professionals in your area' },
    { icon: Calendar, title: 'Easy Scheduling', description: 'Book appointments online with real-time availability' },
    { icon: Shield, title: 'HIPAA Compliant', description: 'Your health data is protected with enterprise-grade security' },
  ];

  const steps = [
    { title: 'Create your profile', description: 'Set up your patient or provider account in minutes.' },
    { title: 'Book or scan', description: 'Schedule visits or run a guided heart scan from home.' },
    { title: 'Get insights', description: 'Review results, labs, and AI summaries in one place.' },
  ];

  const testimonials = [
    { name: 'Dr. A. Patel', role: 'Cardiologist', quote: 'PEHD keeps my patients engaged and appointments organized without extra admin overhead.' },
    { name: 'Maria L.', role: 'Patient', quote: 'Everything I need—appointments, labs, and heart scans—lives in one secure place.' },
    { name: 'Clinic Ops', role: 'Practice Manager', quote: 'Scheduling and telehealth workflows are smooth and reliable.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium">AI-Powered Health Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                AI-Driven Healthcare
                <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Built for Real Life
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 mb-8 max-w-xl">
                A modern platform that connects patients and providers, automates workflows, and uses AI to transform health data into clear, actionable insights.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Sign In
                </button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" />AI Insights</span>
                <span className="inline-flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" />HIPAA Compliant</span>
                <span className="inline-flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" />AES-256 Encrypted</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-slate-400">PEHD Overview</div>
                  <div className="flex gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
                    <div className="text-sm text-slate-300 font-medium">Unified Records</div>
                    <div className="text-xs text-slate-500 mt-1">Labs, visits, and meds in one view</div>
                  </div>
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
                    <div className="text-sm text-slate-300 font-medium">AI Summaries</div>
                    <div className="text-xs text-slate-500 mt-1">Clear explanations from complex data</div>
                  </div>
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
                    <div className="text-sm text-slate-300 font-medium">Secure Messaging</div>
                    <div className="text-xs text-slate-500 mt-1">Private, compliant communication</div>
                  </div>
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
                    <div className="text-sm text-slate-300 font-medium">Smart Scheduling</div>
                    <div className="text-xs text-slate-500 mt-1">Book and manage appointments fast</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Latest Scan</div>
                      <div className="text-sm text-slate-400">Heart rate, HRV, and insights</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 shadow-lg">
                <span className="text-cyan-300 font-semibold">Real-time</span> appointment updates
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-6 border-y border-slate-800/70 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-widest text-slate-500">
            <span>AI-enabled care</span>
            <span>Trusted by clinics</span>
            <span>Secure by design</span>
            <span>HIPAA-aligned workflows</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need for Better Health
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our comprehensive platform brings together all aspects of healthcare management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-8 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-all">
                  <feature.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How PEHD Works
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A simple workflow that keeps care, data, and communication in sync.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="p-8 rounded-2xl border border-slate-700/60 bg-slate-900/40">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-300 font-semibold mb-5">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Patients & Providers Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Patients */}
            <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl border border-cyan-500/30">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">For Patients</h3>
              <ul className="space-y-4 mb-8">
                {[
                  'Find and book appointments with top providers',
                  'Access your health records anytime',
                  'Track vitals and health metrics',
                  'Get AI-powered health insights',
                  'Virtual consultations available'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 bg-cyan-500/20 text-cyan-400 rounded-xl font-medium hover:bg-cyan-500/30 transition-all"
              >
                Sign Up as Patient
              </button>
            </div>

            {/* For Providers */}
            <div className="p-8 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl border border-purple-500/30">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                <Stethoscope className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">For Healthcare Providers</h3>
              <ul className="space-y-4 mb-8">
                {[
                  'Manage your schedule efficiently',
                  'Accept online appointments',
                  'AI-powered clinical tools',
                  'Secure patient communication',
                  'Telehealth integration'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 bg-purple-500/20 text-purple-400 rounded-xl font-medium hover:bg-purple-500/30 transition-all"
              >
                Sign Up as Provider
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for Real Care Teams
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              What patients and providers say about PEHD.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item, index) => (
              <div key={index} className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-8">
                <p className="text-slate-300 mb-6">“{item.quote}”</p>
                <div className="text-white font-semibold">{item.name}</div>
                <div className="text-sm text-slate-500">{item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-blue-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Join thousands of patients and healthcare providers already using PEHD
          </p>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30"
          >
            Create Your Free Account
          </button>
        </div>
      </section>
    </div>
  );
};

// Appointments View
const AppointmentsView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { userRole, getAppointments, cancelAppointment } = useUser();
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'upcoming' | 'past' | 'all'>('upcoming');

  React.useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    let data;
    if (filter === 'upcoming') {
      data = await getAppointments({ startDate: today });
    } else if (filter === 'past') {
      data = await getAppointments({ endDate: today });
    } else {
      data = await getAppointments();
    }
    setAppointments(data);
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    await cancelAppointment(id);
    loadAppointments();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">
          {userRole === 'provider' ? 'My Schedule' : 'My Appointments'}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            {(['upcoming', 'past', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {userRole === 'patient' && (
            <button
              onClick={() => onNavigate('find-provider')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              Book New
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-slate-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl">
          <Calendar className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No appointments found</h2>
          <p className="text-slate-400 mb-4">
            {filter === 'upcoming' ? "You don't have any upcoming appointments" : "No appointments in this category"}
          </p>
          {userRole === 'patient' && (
            <button
              onClick={() => onNavigate('find-provider')}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              Find a Provider
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {userRole === 'provider' 
                        ? `${apt.patient?.first_name} ${apt.patient?.last_name}`
                        : `Dr. ${apt.provider?.first_name} ${apt.provider?.last_name}`
                      }
                    </h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      apt.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                      apt.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                      apt.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400' :
                      apt.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {apt.status.toUpperCase()}
                    </span>
                    {apt.isTelehealth && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs">
                        Telehealth
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{apt.reason || apt.appointmentType}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>
                      {apt.scheduledDate
                        ? new Date(`${apt.scheduledDate}T00:00:00`).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Date TBD'}
                    </span>
                    <span>{apt.scheduledTime ? formatTime(apt.scheduledTime) : 'Time TBD'}</span>
                    <span>{Number.isFinite(apt.duration) ? `${apt.duration} minutes` : 'Duration TBD'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <>
                      {apt.isTelehealth && (
                        <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                          Join Call
                        </button>
                      )}
                      <button 
                        onClick={() => handleCancel(apt.id)}
                        className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Medications View
const MedicationsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          My Medications
        </h1>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
        <Pill className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No medications recorded</h2>
        <p className="text-slate-400">Your medications will appear here once added by your healthcare provider</p>
      </div>
    </div>
  );
};

// Profile View
const ProfileView: React.FC = () => {
  const { currentUser, userRole, providerProfile } = useUser();
  const [finalNotes, setFinalNotes] = useState<Array<{
    id: string;
    final_note: string;
    icd_codes: Array<{ code: string; description?: string }>;
    cpt_codes: Array<{ code: string; description?: string }>;
    finalized_at: string | null;
    scheduled_date?: string;
    scheduled_time?: string;
    provider_first_name?: string;
    provider_last_name?: string;
  }>>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      if (!currentUser || userRole !== 'patient') return;
      setNotesLoading(true);
      try {
        const data = await apiGet(`/scribe/patient?patientId=${currentUser.id}`);
        setFinalNotes(Array.isArray(data) ? data : []);
      } catch (err) {
        setFinalNotes([]);
      } finally {
        setNotesLoading(false);
      }
    };
    loadNotes();
  }, [currentUser, userRole]);

  const exportNoteToPdf = (note: { final_note: string; provider_first_name?: string; provider_last_name?: string; finalized_at?: string | null; }) => {
    const providerName = `${note.provider_first_name || ''} ${note.provider_last_name || ''}`.trim() || 'Provider';
    const dateLabel = note.finalized_at ? new Date(note.finalized_at).toLocaleDateString() : 'Finalized Note';
    const html = `
      <html>
        <head>
          <title>AI Scribe Note</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 0; color: #334155; font-weight: 500; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>AI Scribe Note</h1>
          <h2>${providerName} • ${dateLabel}</h2>
          <pre>${note.final_note || ''}</pre>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">My Profile</h1>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-medium">
            {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {userRole === 'provider' ? 'Dr. ' : ''}{currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-slate-400">{currentUser?.email}</p>
            {userRole === 'provider' && providerProfile && (
              <p className="text-cyan-400 text-sm mt-1">{providerProfile.specialty}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-sm">First Name</label>
            <input type="text" defaultValue={currentUser?.firstName} className="w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Last Name</label>
            <input type="text" defaultValue={currentUser?.lastName} className="w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Email</label>
            <input type="email" defaultValue={currentUser?.email} className="w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Phone</label>
            <input type="tel" defaultValue={currentUser?.phone} className="w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
          </div>
        </div>
        <button className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all">
          Save Changes
        </button>
      </div>

      {userRole === 'patient' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Finalized AI Scribe Notes</h2>
          </div>
          {notesLoading ? (
            <div className="text-slate-400 text-sm">Loading finalized notes...</div>
          ) : finalNotes.length === 0 ? (
            <div className="text-slate-400 text-sm">No finalized notes available yet.</div>
          ) : (
            <div className="space-y-4">
              {finalNotes.map((note) => (
                <div key={note.id} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {note.provider_first_name ? `Dr. ${note.provider_first_name} ${note.provider_last_name || ''}` : 'Provider'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {note.finalized_at ? new Date(note.finalized_at).toLocaleDateString() : 'Finalized'}
                        {note.scheduled_date ? ` • Visit ${note.scheduled_date}` : ''}
                        {note.scheduled_time ? ` • ${note.scheduled_time}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => exportNoteToPdf(note)}
                      className="px-3 py-2 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700 transition text-xs"
                    >
                      Export to PDF
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200 whitespace-pre-wrap">
                    {note.final_note || 'No note content.'}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div>
                      <p className="text-slate-400 mb-2">ICD Suggestions</p>
                      {note.icd_codes?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {note.icd_codes.map((item, index) => (
                            <span key={`${item.code}-${index}`} className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
                              {item.code}{item.description ? ` · ${item.description}` : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500">None</p>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-400 mb-2">CPT Suggestions</p>
                      {note.cpt_codes?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {note.cpt_codes.map((item, index) => (
                            <span key={`${item.code}-${index}`} className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
                              {item.code}{item.description ? ` · ${item.description}` : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500">None</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Settings View
const SettingsView: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-white font-semibold mb-4">Notifications</h3>
          <div className="space-y-3">
            {['Email notifications', 'SMS notifications', 'Appointment reminders', 'Lab result alerts'].map((setting) => (
              <label key={setting} className="flex items-center justify-between">
                <span className="text-slate-300">{setting}</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500" />
              </label>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-white font-semibold mb-4">Privacy</h3>
          <button className="text-cyan-400 text-sm hover:underline">
            View HIPAA Compliance Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { userRole, isAuthenticated, currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [vitalsCompleted, setVitalsCompleted] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    access: boolean;
    status?: string;
    trialEndsAt?: string;
  } | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleScanComplete = () => {
    setVitalsCompleted(true);
    setActiveTab('clinical');
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setSelectedProvider(null);
  };

  const handleSelectProvider = (provider: ProviderWithUser) => {
    setSelectedProvider(provider);
    setActiveTab('book-appointment');
  };

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!isAuthenticated || userRole !== 'provider' || !currentUser?.id) {
      setSubscriptionStatus(null);
      return;
    }
    setSubscriptionLoading(true);
    try {
      const data = await apiGet(`/billing/status?userId=${currentUser.id}`);
      setSubscriptionStatus({
        access: Boolean(data?.access),
        status: data?.status,
        trialEndsAt: data?.trialEndsAt,
      });
    } catch (err) {
      setSubscriptionStatus({ access: false });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [currentUser?.id, isAuthenticated, userRole]);

  useEffect(() => {
    refreshSubscriptionStatus();
  }, [refreshSubscriptionStatus]);

  const renderContent = () => {
    if (
      userRole === 'provider' &&
      isAuthenticated &&
      !subscriptionLoading &&
      subscriptionStatus &&
      !subscriptionStatus.access
    ) {
      return (
        <SubscriptionView
          gateMessage="Your 7-day free trial has ended. Please subscribe to continue using the platform."
        />
      );
    }
    switch (activeTab) {
      case 'dashboard':
        if (userRole === 'provider') {
          return (
            <ProviderDashboard
              onNavigate={handleNavigate}
              subscriptionStatus={subscriptionStatus}
            />
          );
        }
        return <PatientDashboard onNavigate={handleNavigate} />;
      
      case 'find-provider':
        return <FindProviderView onNavigate={handleNavigate} onSelectProvider={handleSelectProvider} />;
      
      case 'book-appointment':
        if (selectedProvider) {
          return (
            <AppointmentBooking 
              provider={selectedProvider} 
              onBack={() => handleNavigate('find-provider')}
              onSuccess={() => handleNavigate('appointments')}
            />
          );
        }
        return <FindProviderView onNavigate={handleNavigate} onSelectProvider={handleSelectProvider} />;
      
      case 'appointments':
        return <AppointmentsView onNavigate={handleNavigate} />;
      
      case 'schedule-manager':
        return <ScheduleManager />;
      
      case 'my-patients':
        return <MyPatientsView />;
      
      case 'messages':
        return <MessagingView />;
      
      case 'scan':
        return <ScanView onScanComplete={handleScanComplete} />;
      
      case 'clinical':
        return <ClinicalWorkflowView initialVitalsCompleted={vitalsCompleted} />;
      
      case 'scribe':
        return <AIScribeView />;
      
      case 'telehealth':
        return <TelehealthView onNavigate={handleNavigate} />;
      
      case 'prescriptions':
        return <PrescriptionView />;
      
      case 'medications':
        return <MedicationsView />;
      
      case 'vitals':
        return <VitalsView />;
      
      case 'labs':
        return <LabsView onNavigateToImport={() => handleNavigate('import')} />;
      
      case 'import':
        return <ImportView />;
      
      case 'insurance':
        return <InsuranceView />;
      
      case 'profile':
        return <ProfileView />;
      
      case 'settings':
        return <SettingsView />;
      
      case 'subscription':
        if (userRole !== 'provider') {
          return (
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 text-slate-300">
              Subscriptions are available for providers only.
            </div>
          );
        }
        return <SubscriptionView userType="provider" onStatusRefresh={refreshSubscriptionStatus} />;
      
      case 'hipaa':
        return <HIPAAComplianceView />;
      
      default:
        if (userRole === 'provider') {
          return <ProviderDashboard onNavigate={handleNavigate} />;
        }
        return <PatientDashboard onNavigate={handleNavigate} />;
    }
  };


  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        {/* Simple Navigation for Landing */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">PEHD</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Landing Page Content */}
        <LandingPage onOpenAuth={handleOpenAuth} />

        {/* Footer */}
        <footer className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">PEHD</h3>
                    <p className="text-xs text-slate-400">Portable Electronic Health Data</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                  Your comprehensive health platform for finding providers, booking appointments, 
                  and managing your health data securely.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-medium">AES-256 Encrypted</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Platform</h4>
                <ul className="space-y-2">
                  <li><button onClick={() => handleOpenAuth('register')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">For Patients</button></li>
                  <li><button onClick={() => handleOpenAuth('register')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">For Providers</button></li>
                  <li><span className="text-slate-400 text-sm">Telehealth</span></li>
                  <li><span className="text-slate-400 text-sm">Health Tracking</span></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><span className="text-slate-400 text-sm">About Us</span></li>
                  <li><span className="text-slate-400 text-sm">Privacy Policy</span></li>
                  <li><span className="text-slate-400 text-sm">Terms of Service</span></li>
                  <li><span className="text-slate-400 text-sm">HIPAA Compliance</span></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm">
                © 2026 PEHD - Portable Electronic Health Data. All rights reserved.
              </p>
            </div>

            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-400 text-center">
                <strong>Medical Disclaimer:</strong> This application is for educational and informational purposes only. 
                Always consult with a qualified healthcare professional before making any health-related decisions.
              </p>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          initialMode={authMode}
        />
      </div>
    );
  }

  // Authenticated user view
  const isTelehealth = activeTab === 'telehealth';
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Navigation */}
      {!isTelehealth && (
        <Navigation 
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedProvider(null);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      )}

      {/* Main Content */}
      <main
        className={
          isTelehealth
            ? "w-full max-w-none p-0 h-[100dvh]"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24"
        }
      >
        {renderContent()}
      </main>

      {/* Floating Chat Button */}
      {!isTelehealth && !isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 z-40"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Health Chatbot */}
      {!isTelehealth && (
        <HealthChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}

      {/* Footer */}
      {!isTelehealth && (
        <footer className="border-t border-slate-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">PEHD</h3>
                  <p className="text-xs text-slate-400">Portable Electronic Health Data</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                Your comprehensive health platform for finding providers, booking appointments, 
                and managing your health data securely.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400 font-medium">AES-256 Encrypted</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2">
                <li><button onClick={() => setActiveTab('find-provider')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Find Providers</button></li>
                <li><button onClick={() => setActiveTab('appointments')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Appointments</button></li>
                <li><button onClick={() => setActiveTab('scan')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Heart Scan</button></li>
                <li><button onClick={() => setActiveTab('labs')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Lab Results</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2">
                <li><button onClick={() => setActiveTab('schedule-manager')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Manage Schedule</button></li>
                <li><button onClick={() => setActiveTab('clinical')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Clinical Tools</button></li>
                <li><button onClick={() => setActiveTab('telehealth')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Telehealth</button></li>
                <li><button onClick={() => setActiveTab('hipaa')} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">HIPAA Compliance</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 PEHD - Portable Electronic Health Data. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">Terms of Service</a>
              <button onClick={() => setActiveTab('hipaa')} className="text-slate-500 hover:text-slate-400 text-sm transition-colors">HIPAA Compliance</button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-sm text-amber-400 text-center">
              <strong>Medical Disclaimer:</strong> This application is for educational and informational purposes only. 
              Always consult with a qualified healthcare professional before making any health-related decisions.
            </p>
          </div>
        </div>
        </footer>
      )}
    </div>
  );
};

export default AppLayout;
