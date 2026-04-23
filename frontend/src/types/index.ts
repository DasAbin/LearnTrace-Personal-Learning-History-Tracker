export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'HOD' | 'ADMIN' | 'VAC_INCHARGE';
  gender?: string;
  collegeName?: string;
  department?: string;
  className?: string;
  rollNumber?: string;
  yearOfStudy?: string;
  assignedClass?: string;
  emailVerified?: boolean;
  createdAt: string;
}

export interface LearningEntry {
  id: string;
  userId: string;
  title: string;
  platform: string;
  domain: string;
  subDomain?: string;
  hoursSpent?: number;
  startDate: string;
  completionDate: string;
  skills: string[];
  description?: string;
  reflection?: string;
  certificatePath?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface DashboardSummary {
  totalEntries: number;
  totalHours: number;
  streak: number;
  uniqueSkills: number;
  recentEntries: LearningEntry[];
}

export interface ClassInfo {
  className: string;
  studentCount: number;
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: string;
  rollNumber?: string;
  department?: string;
  className?: string;
  createdAt: string;
  entryCount: number;
}

export interface StudentDetail {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender?: string;
    rollNumber?: string;
    department?: string;
    className?: string;
    createdAt: string;
  };
  entries: LearningEntry[];
  approvedVacRequests?: {
    id: string;
    courseName: string;
    platform: string;
    courseAmount: number;
    certificatePath?: string;
    reviewedAt?: string;
    createdAt: string;
  }[];
  summary: {
    totalEntries: number;
    totalHours: number;
    uniqueSkills: number;
    domains: Record<string, number>;
    platforms: Record<string, number>;
  };
}


export interface CollegeOverview {
  collegeName: string;
  totalStudents: number;
  totalClasses: number;
  totalEntries: number;
  classes: ClassInfo[];
  recentStudents: {
    id: string;
    firstName: string;
    lastName: string;
    className?: string;
    rollNumber?: string;
    createdAt: string;
  }[];
}

export interface VacRefundRequest {
  id: string;
  studentId: string;
  courseName: string;
  platform: string;
  courseAmount: number;
  notes?: string;
  preApprovalPath?: string;
  certificatePath?: string;
  paymentReceiptPath?: string;
  additionalDocPath?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    rollNumber?: string;
    className?: string;
    department?: string;
  };
}
