import { useState } from 'react';
import { Order, IncidentType } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, AlertTriangle, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  driverId: string;
  onSuccess: () => void;
}

const INCIDENT_TYPES: { value: IncidentType; label: string; description: string }[] = [
  {
    value: 'package_not_ready',
    label: 'Paquete no está listo',
    description: 'El paquete no está preparado para recoger',
  },
  {
    value: 'recipient_unavailable',
    label: 'Destinatario no disponible',
    description: 'No se encontró al destinatario en la dirección',
  },
  {
    value: 'wrong_address',
    label: 'Dirección incorrecta',
    description: 'La dirección no es correcta o no existe',
  },
  {
    value: 'damaged_package',
    label: 'Paquete dañado',
    description: 'El paquete está dañado o no se puede entregar',
  },
  {
    value: 'other',
    label: 'Otro',
    description: 'Otro tipo de incidencia',
  },
];

export function IncidentReportModal({
  isOpen,
  onClose,
  order,
  driverId,
  onSuccess,
}: IncidentReportModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    incident_type: 'other' as IncidentType,
    description: '',
    photo: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.incident_type || formData.incident_type === '') {
      newErrors.incident_type = 'Debe seleccionar un tipo de incidencia';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Debe proporcionar una descripción';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'La descripción debe tener al menos 5 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let photoUrl = null;

      // Try to upload photo if present, but don't fail if it doesn't work
      if (formData.photo) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(formData.photo);
          });

          const base64Data = await base64Promise;

          const uploadResponse = await fetch('/api/incidents/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64Data,
              order_id: order.id,
              driver_id: driverId,
            }),
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            photoUrl = uploadData.url;
          } else {
            console.warn('[IncidentReportModal] Photo upload failed, continuing without photo');
          }
        } catch (photoError) {
          console.warn('[IncidentReportModal] Photo upload error:', photoError);
          // Continue without photo
        }
      }

      // Create incident
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          driver_id: driverId,
          incident_type: formData.incident_type,
          description: formData.description,
          photo_url: photoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al reportar incidencia');
      }

      toast({
        title: 'Éxito',
        description: 'Incidencia reportada. El administrador será notificado.',
        duration: 3000,
      });

      setFormData({
        incident_type: 'other',
        description: '',
        photo: null,
      });
      setPreviewUrl('');
      setErrors({});
      onClose();
      onSuccess();
    } catch (error) {
      console.error('[IncidentReportModal] Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al reportar incidencia',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md mx-4 z-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Reportar Incidencia
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content and Footer in Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Order Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Pedido: <span className="font-mono font-bold">{order.order_number}</span>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {order.delivery_address}
              </p>
            </div>

            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Tipo de Incidencia *
              </label>
              <select
                value={formData.incident_type}
                onChange={(e) => {
                  setFormData({ ...formData, incident_type: e.target.value as IncidentType });
                  if (errors.incident_type) {
                    setErrors({ ...errors, incident_type: '' });
                  }
                }}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Selecciona un tipo...</option>
                {INCIDENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.incident_type && (
                <p className="text-red-500 text-sm mt-1">{errors.incident_type}</p>
              )}
              {formData.incident_type && formData.incident_type !== '' && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {INCIDENT_TYPES.find((t) => t.value === formData.incident_type)?.description}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Descripción detallada *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) {
                    setErrors({ ...errors, description: '' });
                  }
                }}
                placeholder="Describe qué pasó y proporciona detalles adicionales..."
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                }`}
                rows={4}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Foto (opcional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  disabled={isLoading}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.photo ? 'Foto seleccionada' : 'Seleccionar foto'}
                  </span>
                </label>
              </div>
              {previewUrl && (
                <div className="mt-3 relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded border border-gray-300 dark:border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, photo: null });
                      setPreviewUrl('');
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t border-gray-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-md font-medium"
            >
              {isLoading ? 'Reportando...' : 'Reportar Incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
