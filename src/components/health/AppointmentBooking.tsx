import React, { useState, useEffect } from 'react';
import { useUser, ProviderWithUser } from '@/contexts/UserContext';
import { invokeFunction } from '@/lib/api';
import { 
  Calendar, Clock, Video, MapPin, ChevronLeft, ChevronRight, Check, AlertCircle, 
  Info, User, Star, Sparkles, ArrowRight, Shield
} from 'lucide-react';

interface AppointmentBookingProps {
  provider: ProviderWithUser;
  onBack: () => void;
  onSuccess: () => void;
}

interface ProviderSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

const appointmentTypes = [
  { id: 'consultation', label: 'General Consultation', duration: 30, icon: Calendar, description: 'Comprehensive health evaluation' },
  { id: 'follow_up', label: 'Follow-up Visit', duration: 15, icon: Clock, description: 'Quick check on your progress' },
  { id: 'telehealth', label: 'Telehealth Visit', duration: 30, icon: Video, description: 'Virtual consultation from home' },
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ provider, onBack, onSuccess }) => {
  const { getAvailableSlots, getProviderSchedule, bookAppointment, isAuthenticated, currentUser } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('consultation');
  const [reason, setReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [providerSchedules, setProviderSchedules] = useState<ProviderSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadProviderSchedule();
  }, [provider.user_id]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadProviderSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const schedules = await getProviderSchedule(provider.user_id);
      setProviderSchedules(schedules || []);
    } catch (err) {
      console.error('Error loading provider schedule:', err);
    }
    setLoadingSchedule(false);
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    setLoading(true);
    setSelectedTime(null);
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const slots = await getAvailableSlots(provider.user_id, dateStr);
    setAvailableSlots(slots);
    setLoading(false);
  };

  const sendBookingMessage = async (dateStr: string, timeStr: string) => {
    if (!currentUser?.id) return;
    const visitType = selectedType === 'telehealth' ? 'telehealth (Zoom/Google Meet)' : 'in-person visit';
    const timeLabel = formatTime(timeStr);
    const reasonText = reason.trim() ? ` Reason: ${reason.trim()}` : '';
    const message = `Hi Dr. ${provider.user?.last_name || 'Provider'}, I have booked an appointment for ${dateStr} at ${timeLabel}. Please let me know whether we will meet via ${visitType} or in-person.${reasonText}`;

    try {
      await invokeFunction('messaging', {
        action: 'sendMessage',
        data: {
          senderId: currentUser.id,
          receiverId: provider.user_id,
          content: message
        }
      });
    } catch (err) {
      console.error('Failed to send booking message:', err);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login to book an appointment');
      return;
    }

    setSubmitting(true);
    setError(null);

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const result = await bookAppointment({
      providerId: provider.user_id,
      date: dateStr,
      time: selectedTime,
      reason,
      appointmentType: selectedType,
      isTelehealth: selectedType === 'telehealth'
    });

    setSubmitting(false);

    if (result.success) {
      await sendBookingMessage(dateStr, selectedTime);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } else {
      setError(result.error || 'Failed to book appointment');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getAvailableDays = (): Set<number> => {
    const availableDays = new Set<number>();
    providerSchedules.forEach(schedule => {
      if (schedule.is_active) {
        availableDays.add(schedule.day_of_week);
      }
    });
    return availableDays;
  };

  const isDateSelectable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    
    const dayOfWeek = date.getDay();
    const availableDays = getAvailableDays();
    
    if (availableDays.size === 0) return false;
    
    return availableDays.has(dayOfWeek);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    const availableDays = getAvailableDays();

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 md:h-14" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();
      const selectable = isDateSelectable(day);
      const isToday = new Date().toDateString() === date.toDateString();
      const dayOfWeek = date.getDay();
      const isAvailableDay = availableDays.has(dayOfWeek);

      days.push(
        <button
          key={day}
          onClick={() => selectable && setSelectedDate(date)}
          disabled={!selectable}
          className={`
            relative h-12 md:h-14 rounded-xl transition-all duration-300 group
            ${isSelected
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
              : selectable
                ? isToday
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-400 hover:scale-105'
                  : 'bg-slate-800/80 text-white border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-700/80 hover:scale-105'
                : 'bg-slate-900/30 text-slate-600 cursor-not-allowed'
            }
          `}
        >
          <span className={`text-sm md:text-base font-medium ${isSelected ? 'text-white' : ''}`}>
            {day}
          </span>
          {isToday && !isSelected && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
          )}
          {selectable && !isSelected && isAvailableDay && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      );
    }

    return days;
  };

  const getAvailableDaysSummary = () => {
    const availableDays = getAvailableDays();
    if (availableDays.size === 0) return null;
    
    const daysList = Array.from(availableDays)
      .sort((a, b) => a - b)
      .map(d => dayNames[d]);
    
    return daysList.join(', ');
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-8 animate-in zoom-in shadow-2xl shadow-emerald-500/30">
            <Check className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Appointment Confirmed!</h2>
        <p className="text-slate-400 text-center max-w-md text-lg">
          Your appointment with Dr. {provider.user?.first_name || ''} {provider.user?.last_name || ''} has been scheduled.
        </p>
        <div className="mt-6 flex items-center gap-2 text-emerald-400">
          <Shield className="w-5 h-5" />
          <span className="text-sm">You will receive a confirmation email shortly</span>
        </div>
      </div>
    );
  }

  const availableDaysSummary = getAvailableDaysSummary();
  const hasNoSchedule = providerSchedules.length === 0 || getAvailableDays().size === 0;

  return (
    <div className="space-y-8">
      {/* Header with Provider Info */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-3xl p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <button
            onClick={onBack}
            className="absolute top-0 left-0 p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 transition-all hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          
          <div className="flex items-center gap-5 mt-8 md:mt-0 md:ml-12">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Dr. {provider.user?.first_name || ''} {provider.user?.last_name || ''}
              </h1>
              <p className="text-cyan-400 font-medium">{provider.specialty || 'Healthcare Provider'}</p>
              {provider.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-400 font-medium">{provider.rating.toFixed(1)}</span>
                  <span className="text-slate-500 text-sm">({provider.review_count} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-400 font-semibold">Login Required</p>
            <p className="text-amber-400/80 text-sm mt-1">Please login or create an account to book an appointment with this provider.</p>
          </div>
        </div>
      )}

      {!loadingSchedule && hasNoSchedule && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-400 font-semibold">No Available Schedule</p>
            <p className="text-amber-400/80 text-sm mt-1">
              This provider has not set up their availability schedule yet. Please check back later or contact the provider directly.
            </p>
          </div>
        </div>
      )}

      {!loadingSchedule && availableDaysSummary && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-cyan-400 font-semibold">Provider Availability</p>
            <p className="text-cyan-400/80 text-sm mt-1">
              Dr. {provider.user?.first_name || ''} is available on: <span className="font-medium text-cyan-300">{availableDaysSummary}</span>
            </p>
          </div>
        </div>
      )}

      {/* Main Booking Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Appointment Type Selection */}
        <div className="xl:col-span-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              Appointment Type
            </h3>
            <div className="space-y-3">
              {appointmentTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 group ${
                    selectedType === type.id
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    selectedType === type.id
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg'
                      : 'bg-slate-700/50 group-hover:bg-slate-700'
                  }`}>
                    <type.icon className={`w-5 h-5 ${selectedType === type.id ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-medium ${selectedType === type.id ? 'text-cyan-400' : 'text-white'}`}>
                      {type.label}
                    </p>
                    <p className="text-slate-500 text-sm mt-0.5">{type.description}</p>
                    <p className={`text-xs mt-1 ${selectedType === type.id ? 'text-cyan-400/70' : 'text-slate-600'}`}>
                      {type.duration} minutes
                    </p>
                  </div>
                  {selectedType === type.id && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="xl:col-span-5">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                Select Date
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <span className="text-white font-medium min-w-[160px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {shortDayNames.map(day => (
                <div key={day} className="text-center text-slate-500 text-xs font-medium py-2">
                  {day}
                </div>
              ))}
            </div>

            {loadingSchedule ? (
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="h-12 md:h-14 bg-slate-700/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600" />
                <span className="text-slate-400 text-xs">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <span className="text-slate-400 text-xs">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-slate-400 text-xs">Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="xl:col-span-3">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              {selectedDate 
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : 'Select Time'
              }
            </h3>
            
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">Select a date to view available times</p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-12 bg-slate-700/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">No available slots</p>
                <p className="text-slate-500 text-xs mt-1">Try selecting another date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selectedTime === slot
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 scale-105'
                        : 'bg-slate-900/50 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50 hover:border-cyan-500/30'
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reason for Visit */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
            <Info className="w-4 h-4 text-rose-400" />
          </div>
          Reason for Visit
          <span className="text-slate-500 text-sm font-normal">(Optional)</span>
        </h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly describe the reason for your visit to help the doctor prepare..."
          className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-28 transition-colors"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-rose-400">{error}</p>
        </div>
      )}

      {/* Summary & Book Button */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Appointment Summary</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/50">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-300">
                  {selectedDate 
                    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                    : 'No date selected'
                  }
                </span>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/50">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-slate-300">{selectedTime ? formatTime(selectedTime) : 'No time selected'}</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/50">
                {selectedType === 'telehealth' ? <Video className="w-5 h-5 text-purple-400" /> : <MapPin className="w-5 h-5 text-emerald-400" />}
                <span className="text-slate-300">{appointmentTypes.find(t => t.id === selectedType)?.label}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTime || submitting || !isAuthenticated || hasNoSchedule}
            className={`px-10 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 text-lg ${
              selectedDate && selectedTime && isAuthenticated && !hasNoSchedule
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Booking...
              </>
            ) : (
              <>
                Confirm Booking
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
