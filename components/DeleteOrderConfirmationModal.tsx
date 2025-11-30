import { Order } from '@shared/types';
import { useDeleteOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface DeleteOrderConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteOrderConfirmationModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: DeleteOrderConfirmationModalProps) {
  const { toast } = useToast();
  const deleteOrderMutation = useDeleteOrder();

  const handleDeleteOrder = async () => {
    if (!order) return;

    try {
      await deleteOrderMutation.mutateAsync(order.id);
      toast({
        title: 'Pedido Eliminado',
        description: `El pedido ${order.order_number} ha sido eliminado exitosamente`,
        duration: 2000,
      });
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el pedido',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Pedido</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <p className="text-sm text-slate-900 dark:text-white font-medium">
                ¿Estás seguro de que deseas eliminar este pedido?
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Esta acción no se puede deshacer.
              </p>
            </div>
            {order && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">Pedido #:</span>
                  <span className="text-slate-700 dark:text-gray-200 font-mono">
                    {order.order_number}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium text-slate-900 dark:text-white">Destinatario:</span>
                  <span className="text-slate-700 dark:text-gray-200">
                    {order.recipient_name}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium text-slate-900 dark:text-white">Estado:</span>
                  <span className="text-slate-700 dark:text-gray-200">
                    {order.status}
                  </span>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? 'Eliminando...' : 'Eliminar Pedido'}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
