import React from 'react';
import { Modal } from './Modal';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          {isDestructive && (
            <AlertCircle className="w-5 h-5 text-telemetry-rose flex-shrink-0 mt-0.5" />
          )}
          <p className="text-xs text-charcoal-300 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-charcoal-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-medium text-charcoal-300 hover:bg-charcoal-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              isDestructive
                ? 'bg-telemetry-rose/20 text-telemetry-rose hover:bg-telemetry-rose/30 border border-telemetry-rose/40'
                : 'bg-telemetry-teal text-charcoal-950 font-semibold hover:bg-telemetry-teal-bright'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
