export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
}

export interface DashboardSummary {
  totalEntries: number;
  totalHours: number;
  streak: number;
  uniqueSkills: number;
  recentEntries: LearningEntry[];
}
