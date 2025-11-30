import { DeliveryEvidence } from '@shared/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ViewDeliveryEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: DeliveryEvidence | null;
}

export function ViewDeliveryEvidenceModal({
  isOpen,
  onClose,
  evidence,
}: ViewDeliveryEvidenceModalProps) {
  if (!isOpen || !evidence) return null;

  // Render as a custom modal instead of Dialog to avoid potential freezing
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Evidencia de Entrega
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Información de entrega confirmada con firma y datos de identidad
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Recipient Info */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Destinatario</p>
              <p className="font-medium text-slate-900 dark:text-white">{evidence.recipient_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">DNI</p>
              <p className="font-medium text-slate-900 dark:text-white">{evidence.recipient_id_number}</p>
            </div>
          </div>

          {/* Date Info */}
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de Entrega</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">
              {format(new Date(evidence.created_at), 'PPP p', { locale: es })}
            </p>
          </div>

          {/* Signature */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
              Firma del Destinatario
            </label>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-2">
              <img
                src={evidence.photo_url}
                alt="Firma de entrega"
                className="w-full rounded"
                loading="lazy"
              />
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-900 dark:text-green-200">
              <strong>✓ Entrega Verificada</strong> - Esta entrega ha sido confirmada con firma y datos de identidad.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
