import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, CalendarDays, FileText,
  Palmtree, User, LogOut, Menu, X, Building2, Car, CalendarX, Train,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',       label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/attendance/mark', label: 'Mark Attendance', icon: CalendarCheck },
  { to: '/attendance',      label: 'My Attendance',   icon: CalendarDays },
  { to: '/work-reports',   label: 'Work Reports',    icon: FileText },
  { to: '/holidays',        label: 'Holidays',        icon: Palmtree },
  { to: '/leaves',          label: 'My Leaves',       icon: CalendarX },
  { to: '/travel',          label: 'Travel Claims',   icon: Car },
  { to: '/outstation',      label: 'Outstation',      icon: Train },
  { to: '/profile',         label: 'Profile',         icon: User },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const fullName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email ?? '';

  const initials = user?.employee
    ? `${user.employee.firstName[0]}${user.employee.lastName[0]}`.toUpperCase()
    : (user?.email ?? 'EE').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary/25 flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">WorkTrack</p>
          <p className="text-[11px] text-primary font-semibold tracking-wide">My Workspace</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Navigation
        </p>
        <div className="space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/attendance'}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-800 truncate">{fullName || 'Employee'}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200 fixed top-0 left-0 bottom-0 z-30 shadow-sidebar">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 flex flex-col shadow-2xl animate-slide-in-left">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-700 rounded-md flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">WorkTrack</span>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-5 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
