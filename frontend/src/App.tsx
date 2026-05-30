import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage  from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import EmployeeLayout from './layouts/EmployeeLayout';
import AdminLayout from './layouts/AdminLayout';
import DeptHeadLayout from './layouts/DeptHeadLayout';

import DashboardPage        from './pages/employee/DashboardPage';
import MarkAttendancePage   from './pages/employee/MarkAttendancePage';
import MyAttendancePage     from './pages/employee/MyAttendancePage';
import WorkReportPage       from './pages/employee/WorkReportPage';
import HolidayPage          from './pages/employee/HolidayPage';
import ProfilePage          from './pages/employee/ProfilePage';
import MyTravelPage         from './pages/employee/MyTravelPage';
import MyLeavePage          from './pages/employee/MyLeavePage';
import MyOutstationPage     from './pages/employee/MyOutstationPage';

import AdminDashboardPage        from './pages/admin/AdminDashboardPage';
import EmployeeManagementPage    from './pages/admin/EmployeeManagementPage';
import AttendanceManagementPage  from './pages/admin/AttendanceManagementPage';
import WorkReportApprovalPage    from './pages/admin/WorkReportApprovalPage';
import LeaveManagementPage       from './pages/admin/LeaveManagementPage';
import HolidayManagementPage     from './pages/admin/HolidayManagementPage';
import PayrollProcessingPage     from './pages/admin/PayrollProcessingPage';
import AdminProfilePage          from './pages/admin/AdminProfilePage';
import TravelReimbursementPage   from './pages/admin/TravelReimbursementPage';
import AdminOutstationPage       from './pages/admin/AdminOutstationPage';

import DeptHeadDashboardPage from './pages/dept-head/DeptHeadDashboardPage';
import TeamEmployeesPage     from './pages/dept-head/TeamEmployeesPage';
import TeamLeavesPage        from './pages/dept-head/TeamLeavesPage';
import TeamTravelPage        from './pages/dept-head/TeamTravelPage';
import TeamWorkReportsPage   from './pages/dept-head/TeamWorkReportsPage';
import TeamOutstationPage    from './pages/dept-head/TeamOutstationPage';

function AppRoutes() {
  const { isLoading, token, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*"       element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (role === 'HR_ADMIN') {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/dashboard"     element={<AdminDashboardPage />} />
          <Route path="/employees"     element={<EmployeeManagementPage />} />
          <Route path="/attendance"    element={<AttendanceManagementPage />} />
          <Route path="/work-reports"  element={<WorkReportApprovalPage />} />
          <Route path="/leaves"        element={<LeaveManagementPage />} />
          <Route path="/holidays"      element={<HolidayManagementPage />} />
          <Route path="/payroll"       element={<PayrollProcessingPage />} />
          <Route path="/travel"        element={<TravelReimbursementPage />} />
          <Route path="/outstation"    element={<AdminOutstationPage />} />
          <Route path="/profile"       element={<AdminProfilePage />} />
          <Route path="*"              element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (role === 'DEPARTMENT_HEAD') {
    return (
      <DeptHeadLayout>
        <Routes>
          <Route path="/dashboard"   element={<DeptHeadDashboardPage />} />
          <Route path="/team"        element={<TeamEmployeesPage />} />
          <Route path="/leaves"      element={<TeamLeavesPage />} />
          <Route path="/travel"      element={<TeamTravelPage />} />
          <Route path="/outstation"  element={<TeamOutstationPage />} />
          <Route path="/work-reports" element={<TeamWorkReportsPage />} />
          <Route path="*"            element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DeptHeadLayout>
    );
  }

  return (
    <EmployeeLayout>
      <Routes>
        <Route path="/dashboard"         element={<DashboardPage />} />
        <Route path="/attendance/mark"   element={<MarkAttendancePage />} />
        <Route path="/attendance"        element={<MyAttendancePage />} />
        <Route path="/work-reports"      element={<WorkReportPage />} />
        <Route path="/holidays"          element={<HolidayPage />} />
        <Route path="/leaves"            element={<MyLeavePage />} />
        <Route path="/travel"            element={<MyTravelPage />} />
        <Route path="/outstation"        element={<MyOutstationPage />} />
        <Route path="/profile"           element={<ProfilePage />} />
        <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </EmployeeLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
