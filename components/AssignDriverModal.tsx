import { useState } from 'react';
import { useAvailableDrivers } from '@/hooks/useUsers';
import { useAssignDriver } from '@/hooks/useOrders';
import { Order } from '@shared/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { playOrderAssignedSound } from '@/lib/sound-utils';
import { X, Loader2, User, Phone, Truck } from 'lucide-react';

interface AssignDriverModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignDriverModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: AssignDriverModalProps) {
  const { toast } = useToast();
  const { data: drivers, isLoading: driversLoading } = useAvailableDrivers();
  const assignDriverMutation = useAssignDriver();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      toast({
        title: 'Error',
        description: 'Selecciona un repartidor',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    try {
      await assignDriverMutation.mutateAsync({
        orderId: order.id,
        driverId: selectedDriverId,
      });

      playOrderAssignedSound();

      toast({
        title: 'Éxito',
        description: 'Repartidor asignado correctamente',
        duration: 3000,
      });

      setSelectedDriverId(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo asignar el repartidor',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Asignar Repartidor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Order info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
              Pedido #
            </p>
            <p className="font-mono font-bold text-blue-900 dark:text-blue-100">
              {order.order_number}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
              {order.recipient_name}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {order.delivery_address}
            </p>
          </div>

          {/* Drivers list */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
              Selecciona un repartidor:
            </label>

            {driversLoading ? (
              <div className="space-y-2 py-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cargando repartidores...
                </p>
              </div>
            ) : !drivers || drivers.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No hay repartidores disponibles en este momento
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {drivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedDriverId === driver.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <User className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {driver.nombre}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {driver.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            driver.online_status === 'online'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              driver.online_status === 'online'
                                ? 'bg-green-500'
                                : 'bg-gray-500'
                            }`}></span>
                            {driver.online_status === 'online' ? 'En línea' : 'Desconectado'}
                          </span>
                        </div>
                      </div>

                      {driver.telefono && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <p className="text-gray-600 dark:text-gray-400">
                            {driver.telefono}
                          </p>
                        </div>
                      )}

                      {driver.vehiculo && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <p className="text-gray-600 dark:text-gray-400">
                            {driver.vehiculo}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssignDriver}
            disabled={!selectedDriverId || assignDriverMutation.isPending}
          >
            {assignDriverMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              'Asignar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
