import { useState, useRef } from 'react';
import { Order } from '@shared/types';
import { useUpdateOrderStatus } from '@/hooks/useOrders';
import { orderService } from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { searchAddressByPostalCode } from '@/lib/maps-utils';
import { X, Loader2 } from 'lucide-react';

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: EditOrderModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    recipientName: order.recipient_name,
    recipientPhone: order.recipient_phone,
    deliveryAddress: order.delivery_address,
    deliveryPostalCode: order.delivery_postal_code,
    pickupDate: order.pickup_date,
    pickupTime: order.pickup_time,
    deliveryDate: order.delivery_date,
    deliveryTime: order.delivery_time,
    notes: order.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  if (!isOpen) return null;

  const handleDeliveryPostalCodeChange = (postalCode: string) => {
    setFormData({ ...formData, deliveryPostalCode: postalCode });

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for search after user stops typing
    if (postalCode.length >= 3) {
      setSearchingAddress(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const result = await searchAddressByPostalCode(postalCode);
          if (result) {
            setFormData((prev) => ({
              ...prev,
              deliveryAddress: result.address,
              deliveryPostalCode: result.postalCode,
            }));
          }
        } catch (error) {
          console.error('Error searching address:', error);
        } finally {
          setSearchingAddress(false);
        }
      }, 800);
    } else {
      setSearchingAddress(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientName.trim()) newErrors.recipientName = 'Nombre requerido';
    if (!formData.recipientPhone.trim()) newErrors.recipientPhone = 'Teléfono requerido';
    if (!formData.deliveryAddress.trim()) newErrors.deliveryAddress = 'Dirección requerida';
    if (!formData.deliveryPostalCode.trim()) newErrors.deliveryPostalCode = 'Código postal requerido';
    if (!formData.pickupDate) newErrors.pickupDate = 'Fecha de recogida requerida';
    if (!formData.deliveryDate) newErrors.deliveryDate = 'Fecha de entrega requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await orderService.updateOrder(order.id, {
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone,
        delivery_address: formData.deliveryAddress,
        delivery_postal_code: formData.deliveryPostalCode,
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        delivery_date: formData.deliveryDate,
        delivery_time: formData.deliveryTime,
        notes: formData.notes || null,
      } as any);

      toast({
        title: 'Éxito',
        description: 'Pedido actualizado correctamente',
        duration: 3000,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el pedido',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only allow editing if order is still pending
  const isEditable = order.status === 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto shadow-xl">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Editar Pedido #{order.order_number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditable && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mx-6 mt-4 p-3 rounded text-blue-700 dark:text-blue-300 text-sm">
            ⓘ No se puede editar este pedido porque ya ha sido asignado o completado.
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Nombre del Receptor *
              </label>
              <Input
                value={formData.recipientName}
                onChange={(e) =>
                  setFormData({ ...formData, recipientName: e.target.value })
                }
                placeholder="Juan García"
                className={errors.recipientName ? 'border-red-500' : ''}
                disabled={!isEditable || isLoading}
              />
              {errors.recipientName && (
                <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Teléfono *
              </label>
              <Input
                value={formData.recipientPhone}
                onChange={(e) =>
                  setFormData({ ...formData, recipientPhone: e.target.value })
                }
                placeholder="+34 612 345 678"
                className={errors.recipientPhone ? 'border-red-500' : ''}
                disabled={!isEditable || isLoading}
              />
              {errors.recipientPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Dirección de Entrega *
              </label>
              <Input
                value={formData.deliveryAddress}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryAddress: e.target.value })
                }
                placeholder="Avenida Central 456"
                className={errors.deliveryAddress ? 'border-red-500' : ''}
                disabled={!isEditable || isLoading}
              />
              {errors.deliveryAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Código Postal *
                {searchingAddress && <span className="text-xs text-blue-500 ml-1">buscando...</span>}
              </label>
              <div className="relative">
                <Input
                  value={formData.deliveryPostalCode}
                  onChange={(e) => handleDeliveryPostalCodeChange(e.target.value)}
                  placeholder="28002"
                  className={errors.deliveryPostalCode ? 'border-red-500' : ''}
                  disabled={!isEditable || isLoading}
                />
                {searchingAddress && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              {errors.deliveryPostalCode && (
                <p className="text-red-500 text-sm mt-1">{errors.deliveryPostalCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Fecha de Recogida *
              </label>
              <Input
                type="date"
                value={formData.pickupDate}
                onChange={(e) =>
                  setFormData({ ...formData, pickupDate: e.target.value })
                }
                className={errors.pickupDate ? 'border-red-500' : ''}
                disabled={!isEditable || isLoading}
              />
              {errors.pickupDate && (
                <p className="text-red-500 text-sm mt-1">{errors.pickupDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Hora de Recogida
              </label>
              <Input
                type="time"
                value={formData.pickupTime}
                onChange={(e) =>
                  setFormData({ ...formData, pickupTime: e.target.value })
                }
                disabled={!isEditable || isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Fecha de Entrega *
              </label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryDate: e.target.value })
                }
                className={errors.deliveryDate ? 'border-red-500' : ''}
                disabled={!isEditable || isLoading}
              />
              {errors.deliveryDate && (
                <p className="text-red-500 text-sm mt-1">{errors.deliveryDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Hora de Entrega
              </label>
              <Input
                type="time"
                value={formData.deliveryTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryTime: e.target.value })
                }
                disabled={!isEditable || isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Observaciones
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
              disabled={!isEditable || isLoading}
            />
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isEditable || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
