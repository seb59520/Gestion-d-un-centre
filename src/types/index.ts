// Existing types remain unchanged
export interface User {
  id: string;
  email: string;
  role: 'director' | 'assistant' | 'animator';
  centerId: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  personalAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  centerId: string;
  type: 'vaccine' | 'diploma' | 'other';
  name: string;
  url: string;
  expiryDate: string | null;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  centerId: string;
  type: 'arrival' | 'departure' | 'break_start' | 'break_end';
  date: string;
  timestamp: Date;
  createdAt: Date;
}

export interface Period {
  id: string;
  centerId: string;
  name: string;
  type: 'wednesday' | 'vacation';
  startDate: Date;
  endDate: Date;
  animators: string[];
  schoolYearId: string;
  createdAt: Date;
  updatedAt: Date;
}

// New types for automation features
export interface Notification {
  id: string;
  userId: string;
  centerId: string;
  type: 'document_expiry' | 'missing_timesheet' | 'activity_reminder' | 'general';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'dismissed';
  link?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface Feedback {
  id: string;
  centerId: string;
  fromUserId: string;
  toUserId?: string;
  activityId?: string;
  type: 'performance' | 'activity' | 'general';
  rating?: number;
  comment: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceReview {
  id: string;
  centerId: string;
  animatorId: string;
  reviewerId: string;
  period: string;
  ratings: {
    punctuality: number;
    teamwork: number;
    initiative: number;
    childCare: number;
    communication: number;
  };
  strengths: string[];
  improvements: string[];
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
}

export interface SchoolYearData {
  name: string;
  startDate: Date;
  endDate: Date;
  vacationPeriods: VacationPeriod[];
}</content>