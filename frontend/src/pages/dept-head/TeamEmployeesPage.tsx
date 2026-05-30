import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Users, UserCheck, UserX, Plus, AlertCircle, Pencil, UserMinus } from 'lucide-react';
import * as employeeApi from '../../api/employee';
import { Employee } from '../../types';
import PageHeader from '../../components/PageHeader';
import SkeletonTable from '../../components/SkeletonTable';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

const EMPTY_FORM = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  designation: '',
  monthlySalary: '',
  dateOfJoining: format(new Date(), 'yyyy-MM-dd'),
};

type EditForm = {
  firstName: string;
  lastName: string;
  designation: string;
  monthlySalary: string;
  dateOfJoining: string;
  phone: string;
  worksSundays: boolean;
};

export default function TeamEmployeesPage() {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [loading, setLoading]       = useState(true);

  // Add modal
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState(EMPTY_FORM);
  const [addError, setAddError]     = useState('');
  const [adding, setAdding]         = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editForm, setEditForm]     = useState<EditForm | null>(null);
  const [editError, setEditError]   = useState('');
  const [editing, setEditing]       = useState(false);

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null);
  const [deactivateError, setDeactivateError]   = useState('');
  const [deactivating, setDeactivating]         = useState(false);

  const load = () => {
    setLoading(true);
    employeeApi.getMyTeam().then(setEmployees).catch(() => setEmployees([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Add ──────────────────────────────────────────────────────────────────────
  const openAdd = () => { setAddForm(EMPTY_FORM); setAddError(''); setShowAdd(true); };
  const closeAdd = () => { setShowAdd(false); setAddForm(EMPTY_FORM); setAddError(''); };
  const af = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddForm((p) => ({ ...p, [k]: e.target.value }));

  const handleAdd = async (ev: React.FormEvent) => {
    ev.preventDefault(); setAddError(''); setAdding(true);
    try {
      await employeeApi.createEmployee({ ...addForm, monthlySalary: Number(addForm.monthlySalary) });
      closeAdd(); load();
    } catch (err) { setAddError(err instanceof Error ? err.message : 'Failed'); }
    finally { setAdding(false); }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setEditForm({
      firstName:    emp.firstName,
      lastName:     emp.lastName,
      designation:  emp.designation,
      monthlySalary: String(emp.monthlySalary),
      dateOfJoining: format(new Date(emp.dateOfJoining), 'yyyy-MM-dd'),
      phone:        emp.phone ?? '',
      worksSundays: emp.worksSundays,
    });
    setEditError('');
  };
  const closeEdit = () => { setEditTarget(null); setEditForm(null); setEditError(''); };
  const ef = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm((p) => p ? { ...p, [k]: e.target.value } : p);

  const handleEdit = async (ev: React.FormEvent) => {
    ev.preventDefault(); if (!editTarget || !editForm) return;
    setEditError(''); setEditing(true);
    try {
      await employeeApi.updateEmployee(editTarget.id, {
        firstName:    editForm.firstName,
        lastName:     editForm.lastName,
        designation:  editForm.designation,
        monthlySalary: Number(editForm.monthlySalary),
        dateOfJoining: editForm.dateOfJoining,
        phone:        editForm.phone || undefined,
        worksSundays: editForm.worksSundays,
      });
      closeEdit(); load();
    } catch (err) { setEditError(err instanceof Error ? err.message : 'Failed'); }
    finally { setEditing(false); }
  };

  // ── Deactivate ───────────────────────────────────────────────────────────────
  const handleDeactivate = (emp: Employee) => {
    setDeactivateTarget(emp);
    setDeactivateError('');
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
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

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="My Team"
        subtitle={`${employees.length} member${employees.length !== 1 ? 's' : ''} in your team`}
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />Add Member
          </Button>
        }
      />

      {/* Add modal */}
      <Modal open={showAdd} title="Add Team Member" onClose={closeAdd} panelClassName="max-w-2xl">
        {addError && (
          <div className="flex items-center gap-2.5 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{addError}
          </div>
        )}
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name"         value={addForm.firstName}    onChange={af('firstName')}    required />
          <Input label="Last Name"          value={addForm.lastName}     onChange={af('lastName')}     required />
          <Input label="Email" type="email" value={addForm.email}        onChange={af('email')}        required />
          <Input label="Password" type="password" value={addForm.password} onChange={af('password')}  required />
          <Input label="Designation"        value={addForm.designation}  onChange={af('designation')}  required />
          <Input label="Monthly Salary (₹)" type="number" min="0" step="0.01" value={addForm.monthlySalary} onChange={af('monthlySalary')} required />
          <Input label="Date of Joining" type="date" value={addForm.dateOfJoining} onChange={af('dateOfJoining')} required />
          <div className="sm:col-span-2">
            <Button type="submit" loading={adding} className="w-full sm:w-auto">Add to My Team</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} title="Edit Team Member" onClose={closeEdit} panelClassName="max-w-2xl">
        {editError && (
          <div className="flex items-center gap-2.5 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{editError}
          </div>
        )}
        {editForm && (
          <form onSubmit={handleEdit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First Name"         value={editForm.firstName}    onChange={ef('firstName')}    required />
            <Input label="Last Name"          value={editForm.lastName}     onChange={ef('lastName')}     required />
            <Input label="Designation"        value={editForm.designation}  onChange={ef('designation')}  required />
            <Input label="Monthly Salary (₹)" type="number" min="0" step="0.01" value={editForm.monthlySalary} onChange={ef('monthlySalary')} required />
            <Input label="Date of Joining" type="date" value={editForm.dateOfJoining} onChange={ef('dateOfJoining')} required />
            <Input label="Phone"              value={editForm.phone}        onChange={ef('phone')} />
            <div className="sm:col-span-2 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="editWorksSundays"
                checked={editForm.worksSundays}
                onChange={(e) => setEditForm((p) => p ? { ...p, worksSundays: e.target.checked } : p)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <label htmlFor="editWorksSundays" className="text-sm text-gray-700 select-none cursor-pointer">
                Works on Sundays
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" loading={editing}>Save Changes</Button>
              <Button type="button" variant="outline" onClick={closeEdit}>Cancel</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm">Team Members</p>
          {!loading && <p className="text-xs text-gray-400">{employees.length} total</p>}
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Name', 'Code', 'Designation', 'Monthly Salary', 'Joined', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody><SkeletonTable cols={7} /></tbody>
            </table>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-gray-400">
            <Users className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No team members yet</p>
            <p className="text-xs mt-1 text-gray-300">Use "Add Member" to add employees to your team</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Name', 'Code', 'Designation', 'Monthly Salary', 'Joined', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-500">{emp.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.employeeCode}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      ₹{emp.monthlySalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {format(new Date(emp.dateOfJoining), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      {emp.isActive
                        ? <span className="badge bg-emerald-100 text-emerald-700 gap-1"><UserCheck className="w-3 h-3" />Active</span>
                        : <span className="badge bg-red-100 text-red-600 gap-1"><UserX className="w-3 h-3" />Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {emp.isActive && (
                          <button
                            onClick={() => handleDeactivate(emp)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Deactivate"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate Team Member"
        message={
          deactivateTarget
            ? `Deactivate ${deactivateTarget.firstName} ${deactivateTarget.lastName}? They will lose access to the system.`
            : ''
        }
        confirmLabel="Deactivate"
        loading={deactivating}
        error={deactivateError}
        onConfirm={confirmDeactivate}
        onCancel={() => { setDeactivateTarget(null); setDeactivateError(''); }}
      />
    </div>
  );
}
