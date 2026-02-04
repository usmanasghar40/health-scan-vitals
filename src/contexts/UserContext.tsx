import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invokeFunction } from '@/lib/api';

export type UserRole = 'patient' | 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  specialty: string;
  credentials?: string;
  npi?: string;
  bio?: string;
  yearsExperience?: number;
  acceptingNewPatients: boolean;
  languages: string[];
  consultationFee?: number;
  rating: number;
  reviewCount: number;
  profileImage?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  insuranceProvider?: string;
  insuranceId?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  isTelehealth: boolean;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  provider?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export interface ProviderWithUser {
  id: string;
  user_id: string;
  specialty: string;
  credentials?: string;
  npi?: string;
  bio?: string;
  years_experience?: number;
  accepting_new_patients: boolean;
  languages: string[];
  consultation_fee?: number;
  rating: number;
  review_count: number;
  profile_image?: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
}

interface UserContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  providerProfile: ProviderProfile | null;
  patientProfile: PatientProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    specialty?: string;
    schedules?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotDuration: number;
    }>;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  switchRole: (role: UserRole) => void;
  getProviders: (filters?: { specialty?: string; acceptingNew?: boolean }) => Promise<ProviderWithUser[]>;
  getProviderSchedule: (providerId: string) => Promise<any[]>;
  updateProviderSchedule: (providerId: string, schedules: any[]) => Promise<boolean>;
  getAvailableSlots: (providerId: string, date: string) => Promise<string[]>;
  bookAppointment: (data: {
    providerId: string;
    date: string;
    time: string;
    reason?: string;
    appointmentType?: string;
    isTelehealth?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  getAppointments: (filters?: { status?: string; startDate?: string; endDate?: string }) => Promise<Appointment[]>;
  cancelAppointment: (appointmentId: string) => Promise<boolean>;
  updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Helper function to invoke edge functions with retry logic
const invokeWithRetry = async (
  functionName: string, 
  body: any, 
  maxRetries: number = 5,
  initialDelay: number = 500
): Promise<{ data: any; error: any }> => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${functionName}] Attempt ${attempt}/${maxRetries}`);
      
      const result = await invokeFunction(functionName, body);
      
      // If we got a successful response, return it
      if (result.data !== undefined && result.error === null) {
        console.log(`[${functionName}] Success on attempt ${attempt}`);
        return result;
      }
      
      // If we got data even with an error, return it (application-level error)
      if (result.data !== undefined) {
        console.log(`[${functionName}] Got data with error on attempt ${attempt}`);
        return result;
      }
      
      // If it's a network error (FunctionsFetchError), retry
      if (result.error?.name === 'FunctionsFetchError' || result.error?.message?.includes('Failed to send')) {
        lastError = result.error;
        console.warn(`[${functionName}] Network error on attempt ${attempt}:`, result.error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
          console.log(`[${functionName}] Waiting ${Math.round(delay)}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For other errors, return immediately
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[${functionName}] Exception on attempt ${attempt}:`, err.message || err);
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
        console.log(`[${functionName}] Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[${functionName}] All ${maxRetries} attempts failed`);
  return { data: null, error: lastError };
};



export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const storageKey = 'pehd-auth';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed?.user?.id && parsed?.user?.email) {
        setCurrentUser(parsed.user);
        setUserRole(parsed.userRole || parsed.user.role);
        setProviderProfile(parsed.providerProfile || null);
        setPatientProfile(parsed.patientProfile || null);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !isAuthenticated) {
      localStorage.removeItem(storageKey);
      return;
    }
    const payload = {
      user: currentUser,
      userRole,
      providerProfile,
      patientProfile,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [currentUser, isAuthenticated, patientProfile, providerProfile, userRole]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await invokeWithRetry('user-management', {
        action: 'login',
        data: { email, password }
      });

      // Check for network/invoke errors first
      if (error) {
        console.error('Login invoke error:', error);
        return { success: false, error: 'Unable to connect to server. Please check your connection and try again.' };
      }

      // Check for application-level errors (success: false in response)
      if (!data?.success) {
        return { success: false, error: data?.error || 'Login failed. Please try again.' };
      }

      const user = data.user;
      setCurrentUser({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone
      });
      setUserRole(user.role);
      setIsAuthenticated(true);

      if (data.profile) {
        if (user.role === 'provider') {
          setProviderProfile({
            id: data.profile.id,
            userId: data.profile.user_id,
            specialty: data.profile.specialty,
            credentials: data.profile.credentials,
            npi: data.profile.npi,
            bio: data.profile.bio,
            yearsExperience: data.profile.years_experience,
            acceptingNewPatients: data.profile.accepting_new_patients,
            languages: data.profile.languages || [],
            consultationFee: data.profile.consultation_fee,
            rating: data.profile.rating,
            reviewCount: data.profile.review_count,
            profileImage: data.profile.profile_image
          });
        } else if (user.role === 'patient') {
          setPatientProfile({
            id: data.profile.id,
            userId: data.profile.user_id,
            dateOfBirth: data.profile.date_of_birth,
            gender: data.profile.gender,
            bloodType: data.profile.blood_type,
            allergies: data.profile.allergies,
            conditions: data.profile.conditions,
            medications: data.profile.medications,
            insuranceProvider: data.profile.insurance_provider,
            insuranceId: data.profile.insurance_id
          });
        }
      }
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            phone: user.phone
          },
          userRole: user.role,
          providerProfile: user.role === 'provider' ? data.profile : null,
          patientProfile: user.role === 'patient' ? data.profile : null
        })
      );

      return { success: true };
    } catch (err: any) {
      console.error('Login exception:', err);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (regData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    specialty?: string;
    schedules?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotDuration: number;
    }>;
  }): Promise<{ success: boolean; error?: string }> => {

    setIsLoading(true);
    try {
      const { data: result, error } = await invokeWithRetry('user-management', {
        action: 'register',
        data: regData
      });

      // Check for network/invoke errors first
      if (error) {
        console.error('Register invoke error:', error);
        return { success: false, error: 'Unable to connect to server. Please check your connection and try again.' };
      }

      // Check for application-level errors (success: false in response)
      if (!result?.success) {
        return { success: false, error: result?.error || 'Registration failed. Please try again.' };
      }

      // Auto-login after successful registration
      return await login(regData.email, regData.password);

    } catch (err: any) {
      console.error('Register exception:', err);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };


  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
    setProviderProfile(null);
    setPatientProfile(null);
    localStorage.removeItem(storageKey);
  };

  const switchRole = (role: UserRole) => {
    setUserRole(role);
  };

  const getProviders = async (filters?: { specialty?: string; acceptingNew?: boolean }): Promise<ProviderWithUser[]> => {
    try {
      const { data, error } = await invokeWithRetry('user-management', {
        action: 'getProviders',
        data: filters || {}
      });

      if (error) {
        console.error('Error fetching providers:', error);
        return [];
      }

      // Check for success flag and ensure providers is an array
      if (!data?.success || !data?.providers) {
        console.error('Error fetching providers:', data?.error || 'No providers data');
        return [];
      }

      // Ensure we return an array
      const providers = Array.isArray(data.providers) ? data.providers : [];
      return providers;
    } catch (err) {
      console.error('Error fetching providers:', err);
      return [];
    }
  };


  const getProviderSchedule = async (providerId: string): Promise<any[]> => {
    try {
      const { data, error } = await invokeWithRetry('user-management', {
        action: 'getProviderSchedule',
        data: { providerId }
      });

      if (error) {
        console.error('Error fetching schedule:', error);
        return [];
      }

      if (!data?.success) {
        console.error('Error fetching schedule:', data?.error);
        return [];
      }

      return data.schedules || [];
    } catch (err) {
      console.error('Error fetching schedule:', err);
      return [];
    }
  };

  const updateProviderSchedule = async (providerId: string, schedules: any[]): Promise<boolean> => {
    try {
      const { data, error } = await invokeWithRetry('user-management', {
        action: 'updateProviderSchedule',
        data: { providerId, schedules }
      });

      if (error) {
        console.error('Error updating schedule:', error);
        return false;
      }

      if (!data?.success) {
        console.error('Error updating schedule:', data?.error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error updating schedule:', err);
      return false;
    }
  };

  const getAvailableSlots = async (providerId: string, date: string): Promise<string[]> => {
    try {
      // First, get the provider's schedule
      const schedules = await getProviderSchedule(providerId);
      
      if (!schedules || schedules.length === 0) {
        console.log('No schedule found for provider');
        return [];
      }

      // Get the day of week for the selected date (0 = Sunday, 6 = Saturday)
      const selectedDate = new Date(date + 'T00:00:00');
      const dayOfWeek = selectedDate.getDay();

      // Find schedules for this day of week
      const daySchedules = schedules.filter((s: any) => s.day_of_week === dayOfWeek && s.is_active);

      if (daySchedules.length === 0) {
        console.log('Provider not available on this day');
        return [];
      }

      // Generate time slots based on the provider's schedule
      const allSlots: string[] = [];

      for (const schedule of daySchedules) {
        const startTime = schedule.start_time.slice(0, 5); // "HH:MM"
        const endTime = schedule.end_time.slice(0, 5);
        const slotDuration = schedule.slot_duration || 30;

        // Parse start and end times
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Generate slots
        for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration) {
          const hours = Math.floor(time / 60);
          const mins = time % 60;
          const slot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          allSlots.push(slot);
        }
      }

      // Now fetch booked appointments to filter them out
      try {
        const { data, error } = await invokeWithRetry('appointment-management', {
          action: 'getBookedSlots',
          data: { providerId, date }
        });

        if (error) {
          console.error('Error fetching booked slots:', error);
          // Return all slots if we can't get booked slots
          return allSlots.sort();
        }

        if (data?.success && data?.bookedSlots) {
          const bookedSlots = new Set(data.bookedSlots);
          return allSlots.filter(slot => !bookedSlots.has(slot)).sort();
        }
      } catch (err) {
        console.error('Exception fetching booked slots:', err);
      }

      // Sort slots chronologically
      return allSlots.sort();
    } catch (err) {
      console.error('Error fetching slots:', err);
      return [];
    }
  };




  const bookAppointment = async (appointmentData: {
    providerId: string;
    date: string;
    time: string;
    reason?: string;
    appointmentType?: string;
    isTelehealth?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Please login to book an appointment' };
    }

    try {
      const { data, error } = await invokeWithRetry('appointment-management', {
        action: 'bookAppointment',
        data: {
          patientId: currentUser.id,
          ...appointmentData
        }
      });

      if (error) {
        return { success: false, error: 'Unable to connect to server. Please try again.' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Booking failed' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Booking failed' };
    }
  };

  const getAppointments = async (filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Appointment[]> => {
    if (!currentUser) return [];

    try {
      const { data, error } = await invokeWithRetry('appointment-management', {
        action: 'getAppointments',
        data: {
          userId: currentUser.id,
          role: userRole,
          ...filters
        }
      });

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      // Check for success flag
      if (!data?.success) {
        console.error('Error fetching appointments:', data?.error || 'Unknown error');
        return [];
      }

      const appointments = Array.isArray(data.appointments) ? data.appointments : [];
      
      return appointments.map((apt: any) => ({
        id: apt.id,
        patientId: apt.patient_id,
        providerId: apt.provider_id,
        scheduledDate: apt.scheduled_date,
        scheduledTime: apt.scheduled_time,
        duration: apt.duration,
        appointmentType: apt.appointment_type,
        status: apt.status,
        reason: apt.reason,
        notes: apt.notes,
        isTelehealth: apt.is_telehealth,
        patient: apt.patient,
        provider: apt.provider
      }));
    } catch (err) {
      console.error('Error fetching appointments:', err);
      return [];
    }
  };


  const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
    try {
      const { data, error } = await invokeWithRetry('appointment-management', {
        action: 'cancelAppointment',
        data: { appointmentId }
      });

      if (error) {
        console.error('Error cancelling appointment:', error);
        return false;
      }

      if (!data?.success) {
        console.error('Error cancelling appointment:', data?.error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      return false;
    }
  };

  const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>): Promise<boolean> => {
    try {
      const { data, error } = await invokeWithRetry('appointment-management', {
        action: 'updateAppointment',
        data: { appointmentId, updates }
      });

      if (error) {
        console.error('Error updating appointment:', error);
        return false;
      }

      if (!data?.success) {
        console.error('Error updating appointment:', data?.error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error updating appointment:', err);
      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        userRole,
        isAuthenticated,
        isLoading,
        providerProfile,
        patientProfile,
        login,
        register,
        logout,
        switchRole,
        getProviders,
        getProviderSchedule,
        updateProviderSchedule,
        getAvailableSlots,
        bookAppointment,
        getAppointments,
        cancelAppointment,
        updateAppointment
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
