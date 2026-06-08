export type UserRole = 'Owner' | 'Accountant' | 'Employee';

export type ExpenseCategory = string;

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Opt out of sending password over API where appropriate
  role: UserRole;
  organizationId: string;
  organizationName: string;
  isBlocked?: boolean; // Block/unblock employee flag
  logo?: string; // Organization logo URL
  address?: string; // Organization address
  phone?: string; // Contact phone number
}

export interface Expense {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectName: string;
  details: string;
  category: ExpenseCategory;
  amount: number; // in INR
  date: string; // YYYY-MM-DD
  receipt?: string; // Base64 data URL
  receiptType?: string; // Mime type
  receipts?: Array<{ data: string; type: string; name?: string }>; // Base64 strings for multiple uploads
  createdAt: string;
  organizationId: string;
  status: 'Pending' | 'Approved' | 'Rejected'; // Approval status
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
