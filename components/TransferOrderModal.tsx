import { useState } from 'react';
import { Order, User } from '@shared/types';
import { orderService } from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, X } from 'lucide-react';

interface TransferOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  drivers: User[];
  onSuccess?: () => void;
}

export function TransferOrderModal({
  order,
  isOpen,
  onClose,
  drivers,
  onSuccess,
}: TransferOrderModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const { toast } = useToast();

  const currentDriver = order?.driver_id ? drivers.find(d => d.id === order.driver_id) : null;
  const selectedDriver = selectedDriverId ? drivers.find(d => d.id === selectedDriverId) : null;
  const availableDrivers = drivers.filter(d => d.id !== order?.driver_id);

  const handleTransfer = async () => {
    if (!order || !selectedDriverId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un repartidor',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await orderService.assignDriver(order.id, selectedDriverId);

      toast({
        title: 'Pedido Transferido',
        description: `El pedido ${order.order_number} ha sido transferido a ${selectedDriver?.nombre}`,
        duration: 2000,
      });

      // Close modal and reset state immediately
      setSelectedDriverId('');
      setShowDriverDropdown(false);
      setIsLoading(false);
      onClose();

      // Call onSuccess async without waiting
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error) {
      console.error('Error transferring order:', error);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al transferir el pedido',
        variant: 'destructive',
        duration: 3000,
      });
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
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md mx-4 z-50">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Transferir Pedido
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {order && (
            <div className="bg-gray-50 dark:bg-slate-800 rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900 dark:text-white">Pedido:</span>
                <span className="text-slate-700 dark:text-gray-200 font-mono">
                  {order.order_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-900 dark:text-white">Repartidor actual:</span>
                <span className="text-slate-700 dark:text-gray-200">
                  {currentDriver?.nombre || 'Sin asignar'}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Selecciona nuevo repartidor *
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDriverDropdown(!showDriverDropdown)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                <span className={selectedDriver ? '' : 'text-gray-500 dark:text-gray-400'}>
                  {selectedDriver?.nombre || 'Selecciona un repartidor'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDriverDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDriverDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg z-50">
                  {availableDrivers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No hay repartidores disponibles
                    </div>
                  ) : (
                    availableDrivers.map(driver => (
                      <button
                        key={driver.id}
                        onClick={() => {
                          setSelectedDriverId(driver.id);
                          setShowDriverDropdown(false);
                        }}
                        disabled={isLoading}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm disabled:opacity-50 transition-colors"
                      >
                        <div className="font-medium">{driver.nombre}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {driver.email}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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
          <Button
            type="button"
            variant="default"
            onClick={handleTransfer}
            disabled={!selectedDriverId || isLoading}
          >
            {isLoading ? 'Transferiendo...' : 'Transferir Pedido'}
          </Button>
        </div>
      </div>
    </div>
  );
}
