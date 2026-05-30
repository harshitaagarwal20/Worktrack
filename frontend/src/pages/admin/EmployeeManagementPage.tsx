import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, UserCheck, UserX, Search, Shield, Pencil } from 'lucide-react';
import SkeletonList from '../../components/SkeletonList';
import * as employeeApi from '../../api/employee';
import { Employee } from '../../types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  designation: '',
  monthlySalary: '',
  dateOfJoining: format(new Date(), 'yyyy-MM-dd'),
  role: 'USER' as 'USER' | 'DEPARTMENT_HEAD',
  managerId: '',
  worksSundays: false,
};

const EMPTY_EDIT_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  designation: '',
  monthlySalary: '',
  dateOfJoining: '',
  managerId: '',
  worksSundays: false,
  email: '',
  role: 'USER' as 'USER' | 'DEPARTMENT_HEAD',
  newPassword: '',
};

const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const selectCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

export default function EmployeeManagementPage() {
  const { role: myRole } = useAuth();
  const isAdmin = myRole === 'HR_ADMIN';

  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Edit
  const [editEmp, setEditEmp]               = useState<Employee | null>(null);
  const [editForm, setEditForm]             = useState(EMPTY_EDIT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError]           = useState('');

  // Deactivate
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null);
  const [deactivating, setDeactivating]         = useState(false);
  const [deactivateError, setDeactivateError]   = useState('');

  const deptHeads = useMemo(
    () => employees.filter((e) => e.user.role === 'DEPARTMENT_HEAD' && e.isActive),
    [employees],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      if (statusFilter === 'ACTIVE'   && !e.isActive) return false;
      if (statusFilter === 'INACTIVE' &&  e.isActive) return false;
      if (q) {
        return (
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.user.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employees, search, statusFilter]);

  const load = () => {
    setLoading(true);
    employeeApi
      .getAllEmployees({ limit: 200 })
      .then((r) => setEmployees(r.items))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // ─── Create ───────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setError(''); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); setError(''); };

  const f =
    (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await employeeApi.createEmployee({
        ...form,
        monthlySalary: Number(form.monthlySalary),
        managerId: form.managerId || undefined,
        worksSundays: form.worksSundays,
      });
      closeForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    setEditForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone ?? '',
      designation: emp.designation,
      monthlySalary: String(emp.monthlySalary),
      dateOfJoining: format(new Date(emp.dateOfJoining), 'yyyy-MM-dd'),
      managerId: emp.managerId ?? '',
      worksSundays: emp.worksSundays,
      email: emp.user.email,
      role: emp.user.role as 'USER' | 'DEPARTMENT_HEAD',
      newPassword: '',
    });
    setEditError('');
  };

  const closeEdit = () => { setEditEmp(null); setEditForm(EMPTY_EDIT_FORM); setEditError(''); };

  const ef =
    (k: keyof typeof EMPTY_EDIT_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm((p) => ({ ...p, [k]: e.target.value }));

  const handleEditSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editEmp) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone || undefined,
        designation: editForm.designation,
        monthlySalary: Number(editForm.monthlySalary),
        dateOfJoining: editForm.dateOfJoining,
        managerId: editForm.managerId || null,
        worksSundays: editForm.worksSundays,
      };
      if (isAdmin) {
        payload.email = editForm.email;
        payload.role = editForm.role;
        if (editForm.newPassword) payload.newPassword = editForm.newPassword;
      }
      await employeeApi.updateEmployee(editEmp.id, payload);
      closeEdit();
      load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ─── Deactivate ───────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivateError('');
    setDeactivating(true);
    try {
      await employeeApi.deactivateEmployee(deactivateTarget.id);
      setDeactivateTarget(null);
      load();
    } catch (err) {
      setDeactivateError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setDeactivating(false);
    }
  };

  function roleBadge(role: string) {
    if (role === 'HR_ADMIN') {
      return <span className="badge bg-primary-100 text-primary gap-1"><Shield className="w-3 h-3" />HR Admin</span>;
    }
    if (role === 'DEPARTMENT_HEAD') {
      return <span className="badge bg-primary-100 text-primary gap-1"><Shield className="w-3 h-3" />Dept Head</span>;
    }
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} total`}
        action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" />Add Employee</Button>}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, code, designation, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Create modal ── */}
      <Modal open={showForm} title="Add New Employee" onClose={closeForm} panelClassName="max-w-4xl">
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name"  value={form.firstName}  onChange={f('firstName')}  required />
          <Input label="Last Name"   value={form.lastName}   onChange={f('lastName')}   required />
          <Input label="Email"       type="email"  value={form.email}    onChange={f('email')}    required />
          <Input label="Password"    type="password" value={form.password} onChange={f('password')} required />
          <Input label="Designation" value={form.designation} onChange={f('designation')} required />
          <Input label="Monthly Salary (₹)" type="number" min="0" step="0.01" value={form.monthlySalary} onChange={f('monthlySalary')} required />
          <Input label="Date of Joining" type="date" value={form.dateOfJoining} onChange={f('dateOfJoining')} required />
          <div>
            <label className={labelCls}>Role</label>
            <select value={form.role} onChange={f('role')} className={selectCls}>
              <option value="EMPLOYEE">User</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
            </select>
          </div>
          {form.role === 'USER' && (
            <div>
              <label className={labelCls}>Assign Manager (optional)</label>
              <select value={form.managerId} onChange={f('managerId')} className={selectCls}>
                <option value="">— No manager —</option>
                {deptHeads.map((dh) => (
                  <option key={dh.id} value={dh.id}>
                    {dh.firstName} {dh.lastName} ({dh.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="worksSundays"
              checked={form.worksSundays}
              onChange={(e) => setForm((p) => ({ ...p, worksSundays: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            <label htmlFor="worksSundays" className="text-sm text-gray-700 select-none cursor-pointer">
              Works on Sundays (includes Sundays in payroll working days count)
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting} className="w-full sm:w-auto">
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit modal ── */}
      <Modal open={!!editEmp} title="Edit Employee" onClose={closeEdit} panelClassName="max-w-4xl">
        {editError && <p className="mb-3 text-sm text-red-500">{editError}</p>}
        <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name"  value={editForm.firstName}  onChange={ef('firstName')}  required />
          <Input label="Last Name"   value={editForm.lastName}   onChange={ef('lastName')}   required />
          <Input label="Phone"       value={editForm.phone}      onChange={ef('phone')} />
          <Input label="Designation" value={editForm.designation} onChange={ef('designation')} required />
          <Input label="Monthly Salary (₹)" type="number" min="0" step="0.01" value={editForm.monthlySalary} onChange={ef('monthlySalary')} required />
          <Input label="Date of Joining" type="date" value={editForm.dateOfJoining} onChange={ef('dateOfJoining')} required />

          <div>
            <label className={labelCls}>Manager (optional)</label>
            <select value={editForm.managerId} onChange={ef('managerId')} className={selectCls}>
              <option value="">— No manager —</option>
              {deptHeads.filter((dh) => dh.id !== editEmp?.id).map((dh) => (
                <option key={dh.id} value={dh.id}>
                  {dh.firstName} {dh.lastName} ({dh.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="editWorksSundays"
              checked={editForm.worksSundays}
              onChange={(e) => setEditForm((p) => ({ ...p, worksSundays: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            <label htmlFor="editWorksSundays" className="text-sm text-gray-700 select-none cursor-pointer">
              Works on Sundays
            </label>
          </div>

          {/* Credentials section — HR_ADMIN only */}
          {isAdmin && (
            <>
              <div className="sm:col-span-2 border-t border-gray-100 pt-3 mt-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Credentials</p>
              </div>
              <Input label="Email" type="email" value={editForm.email} onChange={ef('email')} required />
              <div>
                <label className={labelCls}>Role</label>
                <select value={editForm.role} onChange={ef('role')} className={selectCls}>
                  <option value="EMPLOYEE">User</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                </select>
              </div>
              <Input
                label="New Password"
                type="password"
                value={editForm.newPassword}
                onChange={ef('newPassword')}
                placeholder="Leave blank to keep current password"
              />
            </>
          )}

          <div className="sm:col-span-2 flex gap-3">
            <Button type="submit" loading={editSubmitting}>Save Changes</Button>
            <Button type="button" variant="ghost" onClick={closeEdit} disabled={editSubmitting}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* ── Deactivate confirm ── */}
      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${deactivateTarget?.firstName} ${deactivateTarget?.lastName}? They will lose access to the system.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deactivating}
        error={deactivateError}
        onConfirm={handleDeactivate}
        onCancel={() => { setDeactivateTarget(null); setDeactivateError(''); }}
      />

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm">All Employees</p>
          <p className="text-xs text-gray-400">{filtered.length} of {employees.length}</p>
        </div>
        {loading ? (
          <SkeletonList rows={8} />
        ) : filtered.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">
            {search ? 'No employees match your search' : 'No employees found'}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((emp) => (
              <div key={emp.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800">{emp.firstName} {emp.lastName}</p>
                    {roleBadge(emp.user.role)}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{emp.user.email}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-gray-400">{emp.employeeCode}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{emp.designation}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">₹{emp.monthlySalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">Joined {format(new Date(emp.dateOfJoining), 'dd MMM yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  {emp.isActive
                    ? <span className="badge bg-emerald-100 text-emerald-700 gap-1"><UserCheck className="w-3 h-3" />Active</span>
                    : <span className="badge bg-red-100 text-red-600 gap-1"><UserX className="w-3 h-3" />Inactive</span>}
                  <button
                    onClick={() => openEdit(emp)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {emp.isActive && (
                    <button
                      onClick={() => setDeactivateTarget(emp)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Deactivate"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
