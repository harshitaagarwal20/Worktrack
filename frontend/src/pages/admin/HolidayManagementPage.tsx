import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays, Trash2, Pencil } from 'lucide-react';
import * as holidayApi from '../../api/holiday';
import { Holiday } from '../../types';
import Button from '../../components/Button';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SkeletonList from '../../components/SkeletonList';

const EMPTY = { name: '', date: '', isPaid: true };

export default function HolidayManagementPage() {
  const [holidays, setHolidays]     = useState<Holiday[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [editId, setEditId]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [deleteError, setDeleteError]   = useState('');
  const [deleting, setDeleting]         = useState(false);

  const load = (p = page) => {
    setLoading(true);
    holidayApi.getHolidays({ page: p, limit: 20 })
      .then((res) => { setHolidays(res.items); setTotalPages(res.meta.totalPages); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(1); }, []);

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowForm(true); setError(''); };
  const openEdit = (h: Holiday) => {
    setForm({ name: h.name, date: h.date.split('T')[0], isPaid: h.isPaid });
    setEditId(h.id); setShowForm(true); setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY);
    setEditId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const payload = { ...form };
      if (editId) await holidayApi.updateHoliday(editId, payload);
      else await holidayApi.createHoliday(payload);
      closeForm();
      load(1);
      setPage(1);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (h: Holiday) => {
    setDeleteTarget(h);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await holidayApi.deleteHoliday(deleteTarget.id);
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Holiday Management"
        action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" />Add Holiday</Button>}
      />

      <Modal
        open={showForm}
        title={editId ? 'Edit Holiday' : 'New Holiday'}
        onClose={closeForm}
        panelClassName="max-w-2xl"
      >
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Holiday Name" value={form.name} onChange={f('name')} required />
          <Input label="Date" type="date" value={form.date} onChange={f('date')} required />
          <div className="flex items-center gap-2 pt-6">
            <input id="isPaid" type="checkbox" checked={form.isPaid} onChange={e => setForm(p => ({ ...p, isPaid: e.target.checked }))} className="w-4 h-4 accent-primary" />
            <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">Paid Holiday</label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting} className="w-full sm:w-auto">{editId ? 'Update Holiday' : 'Create Holiday'}</Button>
          </div>
        </form>
      </Modal>

      <div className="card overflow-hidden">
        {loading ? (
          <SkeletonList rows={5} />
        ) : holidays.length === 0 ? <EmptyState message="No holidays yet" /> : (
          <div className="divide-y divide-gray-50">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50">
                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800">{h.name}</p>
                  <span className={`badge ${h.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {h.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                  </div>
                  <p className="text-sm text-gray-500">{format(new Date(h.date), 'EEEE, dd MMM yyyy')}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(h)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(h)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}>Previous</Button>
          <span className="flex items-center text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => { setPage(p => p + 1); load(page + 1); }}>Next</Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Holiday"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
      />
    </div>
  );
}
