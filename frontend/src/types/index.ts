export type Role = 'USER' | 'HR_ADMIN' | 'DEPARTMENT_HEAD';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'WORK_FROM_HOME' | 'LEAVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollStatus = 'DRAFT' | 'FINALIZED' | 'PAID';
export type PayrollItemType = 'EARNING' | 'DEDUCTION';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string;
    monthlySalary: number;
  } | null;
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone?: string;
  designation: string;
  monthlySalary: number;
  dateOfJoining: string;
  isActive: boolean;
  worksSundays: boolean;
  managerId: string | null;
  user: { id: string; email: string; role: Role };
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus | null;
  checkIn?: string;
  checkOut?: string;
  workHours?: number | null;
  location?: string;
  locationAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  remarks?: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  createdAt: string;
}

export interface WorkReportEntry {
  id: string;
  workReportId: string;
  clientName?: string | null;
  tasksCompleted: string;
}

export interface WorkReport {
  id: string;
  employeeId: string;
  date: string;
  workingHours: number;
  remarks?: string;
  createdAt: string;
  entries: WorkReportEntry[];
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isPaid: boolean;
  createdAt: string;
}

export interface PayrollItem {
  id: string;
  payrollId: string;
  label: string;
  type: PayrollItemType;
  amount: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidHolidays: number;
  unpaidHolidays: number;
  approvedLeaves: number;
  grossSalary: number;
  totalDeductions: number;
  manualAdjustment: number;
  adjustmentRemark?: string;
  netSalary: number;
  status: PayrollStatus;
  generatedBy: string;
  createdAt: string;
  items: PayrollItem[];
  employee: Pick<Employee, 'id' | 'employeeCode' | 'firstName' | 'lastName' | 'designation'>;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
}

export interface DashboardSummary {
  totalEmployees: number;
  attendance: { presentToday: number; absentToday: number; notMarkedToday: number };
  pendingApprovals: { attendance: number; leaves: number };
  payrollCurrentMonth: { month: number; year: number; totalRecords: number; totalNetSalary: number };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
