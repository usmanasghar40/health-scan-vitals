import React, { useState } from 'react';
import { useUser, UserRole } from '@/contexts/UserContext';
import { X, Mail, Lock, User, Phone, Stethoscope, Heart, AlertCircle, Check, Eye, EyeOff, Calendar, Clock, ChevronRight, ChevronLeft, Plus, Trash2, Sun, Coffee, Sunset } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const quickTemplates = [
  { name: 'Morning', icon: Sun, startTime: '08:00', endTime: '12:00', color: 'from-amber-500 to-orange-500' },
  { name: 'Afternoon', icon: Coffee, startTime: '13:00', endTime: '17:00', color: 'from-cyan-500 to-blue-500' },
  { name: 'Evening', icon: Sunset, startTime: '17:00', endTime: '21:00', color: 'from-purple-500 to-pink-500' },
];

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, isLoading } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'info' | 'schedule'>('info');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [specialty, setSpecialty] = useState('');
  
  // Schedule fields for providers
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setRole('patient');
    setSpecialty('');
    setSchedules([]);
    setStep('info');
    setSelectedDay(null);
    setError(null);
    setSuccess(false);
  };

  const addScheduleSlot = (dayOfWeek: number, template?: typeof quickTemplates[0]) => {
    setSchedules(prev => [...prev, {
      dayOfWeek,
      startTime: template?.startTime || '09:00',
      endTime: template?.endTime || '17:00',
      slotDuration: 30
    }]);
    setSelectedDay(null);
  };

  const removeScheduleSlot = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const getSchedulesForDay = (dayOfWeek: number) => {
    return schedules
      .map((s, index) => ({ ...s, index }))
      .filter(s => s.dayOfWeek === dayOfWeek);
  };

  const applyWeekdayTemplate = () => {
    const weekdaySchedule: ScheduleSlot[] = [];
    for (let day = 1; day <= 5; day++) {
      weekdaySchedule.push({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30
      });
    }
    setSchedules(weekdaySchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const result = await login(email, password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1000);
      } else {
        setError(result.error || 'Login failed');
      }
    } else {
      // Registration
      if (step === 'info') {
        if (!firstName || !lastName || !email || !password) {
          setError('Please fill in all required fields');
          return;
        }
        if (role === 'provider' && !specialty) {
          setError('Please select your specialty');
          return;
        }
        
        // For providers, go to schedule step
        if (role === 'provider') {
          setStep('schedule');
          return;
        }
        
        // For patients, register directly
        const result = await register({
          email,
          password,
          firstName,
          lastName,
          role,
          phone
        });

        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            onClose();
            resetForm();
          }, 1000);
        } else {
          setError(result.error || 'Registration failed');
        }
      } else {
        // Schedule step - validate and register
        if (schedules.length === 0) {
          setError('Please set at least one availability slot');
          return;
        }

        const result = await register({
          email,
          password,
          firstName,
          lastName,
          role,
          phone,
          specialty: role === 'provider' ? specialty : undefined,
          schedules
        });

        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            onClose();
            resetForm();
          }, 1000);
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : step === 'info' ? 'Create Account' : 'Set Your Availability'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login' 
                ? 'Sign in to your account' 
                : step === 'info' 
                  ? 'Join PEHD today' 
                  : 'When are you available for appointments?'}
            </p>
          </div>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Progress indicator for provider registration */}
        {mode === 'register' && role === 'provider' && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'info' ? 'bg-cyan-500 text-white' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 rounded ${step === 'schedule' ? 'bg-cyan-500' : 'bg-slate-700'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'schedule' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Account Info</span>
              <span>Availability</span>
            </div>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-in zoom-in">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {mode === 'login' ? 'Welcome back!' : 'Account created!'}
            </h3>
            <p className="text-slate-400">Redirecting...</p>
          </div>
        ) : step === 'info' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Role Selection for Register */}
            {mode === 'register' && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      role === 'patient'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Heart className="w-6 h-6" />
                    <span className="font-medium">Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      role === 'provider'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Stethoscope className="w-6 h-6" />
                    <span className="font-medium">Provider</span>
                  </button>
                </div>
              </div>
            )}

            {/* Name Fields for Register */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Phone for Register */}
            {mode === 'register' && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Specialty for Provider */}
            {mode === 'register' && role === 'provider' && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Specialty *</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select your specialty</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Family Medicine">Family Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Processing...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : role === 'provider' ? 'Continue to Schedule' : 'Create Account'}
                  {mode === 'register' && role === 'provider' && <ChevronRight className="w-5 h-5" />}
                </>
              )}
            </button>

            {/* Toggle Mode */}
            <p className="text-center text-slate-400 text-sm">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); }}
                    className="text-cyan-400 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setStep('info'); }}
                    className="text-cyan-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        ) : (
          /* Schedule Setup Step */
          <div className="p-6 space-y-4">
            {/* Back button */}
            <button
              type="button"
              onClick={() => setStep('info')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to account info
            </button>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-cyan-400 text-sm font-medium mb-3">Quick Setup</p>
              <button
                type="button"
                onClick={applyWeekdayTemplate}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
              >
                Apply Mon-Fri 9am-5pm
              </button>
            </div>

            {/* Days Grid */}
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">Select days and set your hours:</p>
              <div className="grid grid-cols-7 gap-1">
                {dayNamesShort.map((day, idx) => {
                  const daySchedules = getSchedulesForDay(idx);
                  const hasSchedule = daySchedules.length > 0;
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
                      className={`p-2 rounded-lg text-center transition-all ${
                        hasSchedule
                          ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                          : selectedDay === idx
                            ? 'bg-slate-700 border border-slate-600 text-white'
                            : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-medium">{day}</span>
                      {hasSchedule && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mx-auto mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add slot for selected day */}
            {selectedDay !== null && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-white font-medium">Add slot for {dayNames[selectedDay]}</p>
                <div className="grid grid-cols-3 gap-2">
                  {quickTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addScheduleSlot(selectedDay, template)}
                      className={`p-3 bg-gradient-to-br ${template.color} rounded-lg text-white text-left hover:scale-105 transition-transform`}
                    >
                      <template.icon className="w-4 h-4 mb-1" />
                      <div className="text-xs font-medium">{template.name}</div>
                      <div className="text-xs opacity-80">{template.startTime}-{template.endTime}</div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addScheduleSlot(selectedDay)}
                  className="w-full py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                >
                  Custom Hours (9am-5pm)
                </button>
              </div>
            )}

            {/* Current Schedule Summary */}
            {schedules.length > 0 && (
              <div className="space-y-2">
                <p className="text-slate-400 text-sm">Your availability:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {schedules.map((schedule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{dayNames[schedule.dayOfWeek]}</span>
                        <span className="text-slate-400 text-sm ml-2">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeScheduleSlot(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || schedules.length === 0}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>

            {schedules.length === 0 && (
              <p className="text-amber-400 text-xs text-center">
                Please set at least one availability slot to continue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
