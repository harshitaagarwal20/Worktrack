import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={onCancel} panelClassName="max-w-md">
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{message}</p>
      {error && (
        <p className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
