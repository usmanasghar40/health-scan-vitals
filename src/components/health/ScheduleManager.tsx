import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { 
  Clock, Plus, Trash2, Save, Check, AlertCircle, Calendar, 
  ChevronLeft, ChevronRight, Repeat, CalendarDays, Sparkles,
  Sun, Moon, Coffee, Sunset, X, Copy, Zap
} from 'lucide-react';

interface ScheduleSlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

interface DateSpecificSlot {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const quickTemplates = [
  { name: 'Morning Shift', icon: Sun, startTime: '08:00', endTime: '12:00', color: 'from-amber-500 to-orange-500' },
  { name: 'Afternoon Shift', icon: Coffee, startTime: '13:00', endTime: '17:00', color: 'from-cyan-500 to-blue-500' },
  { name: 'Evening Shift', icon: Sunset, startTime: '17:00', endTime: '21:00', color: 'from-purple-500 to-pink-500' },
  { name: 'Full Day', icon: Sun, startTime: '09:00', endTime: '17:00', color: 'from-emerald-500 to-teal-500' },
];

const ScheduleManager: React.FC = () => {
  const { currentUser, getProviderSchedule, updateProviderSchedule } = useUser();
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [dateSpecificSlots, setDateSpecificSlots] = useState<DateSpecificSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'dates'>('weekly');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDayForWeekly, setSelectedDayForWeekly] = useState<number | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getProviderSchedule(currentUser.id);
      const formattedSchedules = data.map((s: any) => ({
        id: s.id,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time?.slice(0, 5) || '09:00',
        endTime: s.end_time?.slice(0, 5) || '17:00',
        slotDuration: s.slot_duration || 30,
        isActive: s.is_active !== false
      }));
      setSchedules(formattedSchedules);
    } catch (err) {
      console.error('Error loading schedule:', err);
    }
    setLoading(false);
  };

  const addScheduleSlot = (dayOfWeek: number, template?: typeof quickTemplates[0]) => {
    setSchedules(prev => [...prev, {
      dayOfWeek,
      startTime: template?.startTime || '09:00',
      endTime: template?.endTime || '17:00',
      slotDuration: 30,
      isActive: true
    }]);
    setSaved(false);
    setSelectedDayForWeekly(null);
  };

  const addDateSpecificSlot = (date: string, template?: typeof quickTemplates[0]) => {
    setDateSpecificSlots(prev => [...prev, {
      date,
      startTime: template?.startTime || '09:00',
      endTime: template?.endTime || '17:00',
      slotDuration: 30,
      isActive: true
    }]);
    setSaved(false);
    setSelectedDate(null);
    setShowTimeModal(false);
  };

  const removeScheduleSlot = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const removeDateSpecificSlot = (index: number) => {
    setDateSpecificSlots(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: any) => {
    setSchedules(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    setSaved(false);
  };

  const updateDateSpecificSlot = (index: number, field: keyof DateSpecificSlot, value: any) => {
    setDateSpecificSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setError(null);

    // Combine weekly and date-specific schedules
    const success = await updateProviderSchedule(currentUser.id, schedules);

    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError('Failed to save schedule. Please try again.');
    }
    setSaving(false);
  };

  const getSchedulesForDay = (dayOfWeek: number) => {
    return schedules
      .map((s, index) => ({ ...s, index }))
      .filter(s => s.dayOfWeek === dayOfWeek);
  };

  const applyTemplateToWeekdays = () => {
    const weekdaySchedule: ScheduleSlot[] = [];
    for (let day = 1; day <= 5; day++) {
      weekdaySchedule.push({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        isActive: true
      });
    }
    setSchedules(weekdaySchedule);
    setSaved(false);
  };

  const copyDaySchedule = (fromDay: number) => {
    const daySchedules = schedules.filter(s => s.dayOfWeek === fromDay);
    if (daySchedules.length === 0) return;
    
    // Copy to all other weekdays
    const newSchedules = [...schedules];
    for (let day = 0; day < 7; day++) {
      if (day !== fromDay) {
        // Remove existing schedules for this day
        const filtered = newSchedules.filter(s => s.dayOfWeek !== day);
        // Add copied schedules
        daySchedules.forEach(s => {
          filtered.push({ ...s, dayOfWeek: day, id: undefined });
        });
        newSchedules.length = 0;
        newSchedules.push(...filtered);
      }
    }
    setSchedules(newSchedules);
    setSaved(false);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const hasScheduleForDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const hasWeekly = schedules.some(s => s.dayOfWeek === dayOfWeek && s.isActive);
    const hasSpecific = dateSpecificSlots.some(s => s.date === dateStr && s.isActive);
    return hasWeekly || hasSpecific;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isPastDate = (year: number, month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 md:h-16" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(year, month, day);
      const hasSchedule = hasScheduleForDate(dateStr);
      const today = isToday(year, month, day);
      const past = isPastDate(year, month, day);
      const isSelected = selectedDate === dateStr;
      const dayOfWeek = new Date(year, month, day).getDay();
      const hasWeeklySchedule = schedules.some(s => s.dayOfWeek === dayOfWeek && s.isActive);

      days.push(
        <button
          key={day}
          onClick={() => {
            if (!past) {
              setSelectedDate(dateStr);
              setShowTimeModal(true);
            }
          }}
          disabled={past}
          className={`
            h-12 md:h-16 rounded-xl relative transition-all duration-200 group
            ${past ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
            ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}
            ${hasSchedule 
              ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/50' 
              : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'}
            ${today ? 'ring-2 ring-amber-400/50' : ''}
          `}
        >
          <span className={`
            text-sm md:text-base font-medium
            ${today ? 'text-amber-400' : hasSchedule ? 'text-cyan-300' : 'text-slate-300'}
          `}>
            {day}
          </span>
          {hasWeeklySchedule && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
          )}
          {today && (
            <div className="absolute top-1 right-1">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-700 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Schedule Manager
          </h1>
          <p className="text-slate-400 mt-1">Set your availability for patient appointments</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/25'
          }`}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Schedule
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <p className="text-rose-400">{error}</p>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 w-fit">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'weekly'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Weekly Schedule
        </button>
        <button
          onClick={() => setActiveTab('dates')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'dates'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Specific Dates
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-white font-semibold">Quick Actions</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={applyTemplateToWeekdays}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Apply 9-5 Weekdays
          </button>
          <button
            onClick={() => setSchedules([])}
            className="px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {activeTab === 'weekly' ? (
        /* Weekly Schedule View */
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
          {dayNames.map((dayName, dayIndex) => {
            const daySchedules = getSchedulesForDay(dayIndex);
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            
            return (
              <div 
                key={dayIndex} 
                className={`
                  bg-slate-800/50 border rounded-2xl overflow-hidden transition-all
                  ${daySchedules.length > 0 
                    ? 'border-cyan-500/30 shadow-lg shadow-cyan-500/5' 
                    : 'border-slate-700/50'}
                  ${isWeekend ? 'opacity-80' : ''}
                `}
              >
                {/* Day Header */}
                <div className={`
                  p-4 border-b transition-all
                  ${daySchedules.length > 0 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/20' 
                    : 'bg-slate-900/30 border-slate-700/50'}
                `}>
                  <div className="text-center">
                    <div className={`
                      w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center
                      ${daySchedules.length > 0 
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25' 
                        : 'bg-slate-700/50'}
                    `}>
                      <span className={`text-lg font-bold ${daySchedules.length > 0 ? 'text-white' : 'text-slate-400'}`}>
                        {dayName.slice(0, 2)}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-sm">{dayName}</h3>
                    <p className={`text-xs mt-1 ${daySchedules.length > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {daySchedules.length > 0 
                        ? `${daySchedules.length} slot${daySchedules.length > 1 ? 's' : ''}`
                        : 'No slots'
                      }
                    </p>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="p-3 space-y-2 min-h-[120px]">
                  {daySchedules.map((schedule) => (
                    <div 
                      key={schedule.index} 
                      className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30 group relative"
                    >
                      <button
                        onClick={() => removeScheduleSlot(schedule.index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-1.5 text-cyan-400 mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => updateScheduleSlot(schedule.index, 'startTime', e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => updateScheduleSlot(schedule.index, 'endTime', e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <select
                        value={schedule.slotDuration}
                        onChange={(e) => updateScheduleSlot(schedule.index, 'slotDuration', parseInt(e.target.value))}
                        className="w-full mt-2 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value={15}>15 min slots</option>
                        <option value={30}>30 min slots</option>
                        <option value={45}>45 min slots</option>
                        <option value={60}>60 min slots</option>
                      </select>
                    </div>
                  ))}

                  {/* Add Slot Button */}
                  <button
                    onClick={() => setSelectedDayForWeekly(dayIndex)}
                    className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-medium">Add</span>
                  </button>
                </div>

                {/* Copy to all days button */}
                {daySchedules.length > 0 && (
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => copyDaySchedule(dayIndex)}
                      className="w-full py-2 bg-slate-700/30 text-slate-400 rounded-lg hover:bg-slate-700/50 hover:text-white transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <Copy className="w-3 h-3" />
                      Copy to all days
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar View for Specific Dates */
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors text-slate-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNamesShort.map(day => (
              <div key={day} className="text-center text-slate-500 text-sm font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/50" />
              <span className="text-slate-400 text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-800/50 border border-slate-700/50" />
              <span className="text-slate-400 text-sm">Not Set</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400 text-sm">Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal for Weekly */}
      {selectedDayForWeekly !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Add Slot for {dayNames[selectedDayForWeekly]}
              </h3>
              <button
                onClick={() => setSelectedDayForWeekly(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 mb-4">Choose a template or create custom hours:</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => addScheduleSlot(selectedDayForWeekly, template)}
                  className={`p-4 bg-gradient-to-br ${template.color} bg-opacity-20 border border-white/10 rounded-xl hover:scale-105 transition-all text-left`}
                >
                  <template.icon className="w-5 h-5 text-white mb-2" />
                  <div className="text-white font-medium text-sm">{template.name}</div>
                  <div className="text-white/70 text-xs">{template.startTime} - {template.endTime}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => addScheduleSlot(selectedDayForWeekly)}
              className="w-full py-3 bg-slate-800 border border-slate-700 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
            >
              Custom Hours
            </button>
          </div>
        </div>
      )}

      {/* Time Selection Modal for Specific Date */}
      {showTimeModal && selectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Set Availability</h3>
                <p className="text-cyan-400 text-sm mt-1">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTimeModal(false);
                  setSelectedDate(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Check if there's already a weekly schedule for this day */}
            {(() => {
              const date = new Date(selectedDate + 'T00:00:00');
              const dayOfWeek = date.getDay();
              const weeklySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
              
              if (weeklySchedules.length > 0) {
                return (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Repeat className="w-4 h-4" />
                      <span className="font-medium text-sm">Weekly Schedule Active</span>
                    </div>
                    <p className="text-slate-300 text-sm">
                      This day has a recurring schedule: {weeklySchedules.map(s => `${s.startTime}-${s.endTime}`).join(', ')}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <p className="text-slate-400 mb-4">Choose a template or create custom hours:</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => addDateSpecificSlot(selectedDate, template)}
                  className={`p-4 bg-gradient-to-br ${template.color} bg-opacity-20 border border-white/10 rounded-xl hover:scale-105 transition-all text-left`}
                >
                  <template.icon className="w-5 h-5 text-white mb-2" />
                  <div className="text-white font-medium text-sm">{template.name}</div>
                  <div className="text-white/70 text-xs">{template.startTime} - {template.endTime}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => addDateSpecificSlot(selectedDate)}
              className="w-full py-3 bg-slate-800 border border-slate-700 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
            >
              Custom Hours
            </button>
          </div>
        </div>
      )}

      {/* Date-Specific Slots List */}
      {activeTab === 'dates' && dateSpecificSlots.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            Date-Specific Availability
          </h3>
          <div className="space-y-3">
            {dateSpecificSlots.map((slot, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-cyan-400 text-sm">{slot.startTime} - {slot.endTime}</div>
                </div>
                <select
                  value={slot.slotDuration}
                  onChange={(e) => updateDateSpecificSlot(index, 'slotDuration', parseInt(e.target.value))}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
                <button
                  onClick={() => removeDateSpecificSlot(index)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-cyan-400">{schedules.filter(s => s.isActive).length}</div>
          <div className="text-slate-400 text-sm">Weekly Slots</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{dateSpecificSlots.length}</div>
          <div className="text-slate-400 text-sm">Date-Specific</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">
            {new Set(schedules.map(s => s.dayOfWeek)).size}
          </div>
          <div className="text-slate-400 text-sm">Days Active</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">
            {schedules.reduce((acc, s) => {
              const start = parseInt(s.startTime.split(':')[0]);
              const end = parseInt(s.endTime.split(':')[0]);
              return acc + (end - start);
            }, 0)}h
          </div>
          <div className="text-slate-400 text-sm">Weekly Hours</div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6">
        <h3 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Pro Tips
        </h3>
        <ul className="grid md:grid-cols-2 gap-3 text-slate-300 text-sm">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span>Use <strong>Weekly Schedule</strong> for your regular recurring availability</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span>Use <strong>Specific Dates</strong> for one-time availability or exceptions</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span>Click any date on the calendar to quickly add availability</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span>Use templates to quickly set common time slots</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ScheduleManager;
