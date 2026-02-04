// User Role Types
export type UserRole = 'patient' | 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Patient extends User {
  role: 'patient';
  medicalRecordNumber?: string;
  insuranceProvider?: string;
  insuranceId?: string;
  primaryProviderId?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  bloodType?: string;
  height?: number; // in cm
  weight?: number; // in kg
}

export interface Provider extends User {
  role: 'provider';
  npi?: string;
  specialty?: string;
  credentials?: string;
  licenseNumber?: string;
  licenseState?: string;
  department?: string;
  acceptingNewPatients?: boolean;
  languages?: string[];
  bio?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  patientName: string;
  providerName: string;
  type: 'initial' | 'follow_up' | 'annual' | 'urgent' | 'telehealth' | 'lab_review';
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduledAt: Date;
  duration: number; // in minutes
  reason: string;
  notes?: string;
  location?: string;
  telehealth?: boolean;
  telehealthUrl?: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  subject?: string;
  content: string;
  sentAt: Date;
  readAt?: Date;
  attachments?: MessageAttachment[];
  priority: 'normal' | 'urgent';
  category: 'general' | 'prescription' | 'lab_results' | 'appointment' | 'billing' | 'referral';
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Conversation {
  id: string;
  participants: { id: string; name: string; role: UserRole }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Task Types for Providers
export interface ProviderTask {
  id: string;
  providerId: string;
  patientId?: string;
  patientName?: string;
  type: 'review_labs' | 'sign_note' | 'prescription_renewal' | 'referral' | 'callback' | 'message' | 'prior_auth';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
}

// Patient Summary for Provider View
export interface PatientSummary {
  patient: Patient;
  lastVisit?: Date;
  nextAppointment?: Appointment;
  pendingTasks: number;
  unreadMessages: number;
  recentLabs?: { date: Date; abnormalCount: number };
  activeConditions: string[];
  riskLevel: 'low' | 'moderate' | 'high';
}

// Health Education Content
export interface HealthEducationArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number; // in minutes
  author: string;
  publishedAt: Date;
  imageUrl?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'message' | 'lab_result' | 'prescription' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}
