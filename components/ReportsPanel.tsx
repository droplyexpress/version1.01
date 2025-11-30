import { useState, useMemo } from 'react';
import { useAdminOrders, useDeleteOrder } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { Order, DeliveryEvidence } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Filter, Trash2, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ViewDeliveryEvidenceModal } from '@/components/ViewDeliveryEvidenceModal';

export function ReportsPanel() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { data: allOrders, isLoading: ordersLoading } = useAdminOrders();
  const { data: clients } = useClients();
  const deleteOrderMutation = useDeleteOrder();

  // Only allow delete for admin master
  const isAdminMaster = currentUser?.email === 'manolo@droplyexpress.com';

  const [filterClientId, setFilterClientId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<DeliveryEvidence | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];

    let filtered = allOrders.filter((order) => {
      if (filterClientId && order.client_id !== filterClientId) return false;

      if (filterStartDate) {
        const startDate = new Date(filterStartDate);
        const orderDate = new Date(order.created_at);
        if (orderDate < startDate) return false;
      }

      if (filterEndDate) {
        const endDate = new Date(filterEndDate);
        const orderDate = new Date(order.created_at);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) return false;
      }

      return true;
    });

    // Sort by creation date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [allOrders, filterClientId, filterStartDate, filterEndDate, sortOrder]);

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleViewEvidence = async (order: Order) => {
    setLoadingEvidence(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/evidence`);

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Información',
            description: 'No hay evidencia de entrega registrada para este pedido',
            variant: 'destructive',
          });
        } else {
          throw new Error(`Error: ${response.status}`);
        }
        setLoadingEvidence(false);
        return;
      }

      const evidence = await response.json();

      if (evidence && evidence.id) {
        setSelectedEvidence(evidence);
        setEvidenceModalOpen(true);
      } else {
        toast({
          title: 'Información',
          description: 'No hay evidencia de entrega registrada para este pedido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la evidencia de entrega',
        variant: 'destructive',
      });
    } finally {
      setLoadingEvidence(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrderMutation.mutateAsync(orderToDelete.id);
      toast({
        title: 'Pedido Eliminado',
        description: `El pedido ${orderToDelete.order_number} ha sido eliminado exitosamente`,
        duration: 2000,
      });
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
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

  const generateCSV = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay pedidos para exportar',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const headers = [
      'Número de Pedido',
      'Cliente',
      'Email Cliente',
      'Teléfono Cliente',
      'Dirección Recogida',
      'Dirección Entrega',
      'Fecha Recogida',
      'Hora Recogida',
      'Fecha Entrega',
      'Hora Entrega',
      'Repartidor',
      'Estado',
      'Fecha Creación',
    ];

    const rows = filteredOrders.map((order) => [
      order.order_number || '',
      order.client?.nombre || 'N/A',
      order.client?.email || 'N/A',
      order.client?.telefono || 'N/A',
      order.pickup_address || '',
      order.delivery_address || '',
      order.pickup_date || '',
      order.pickup_time || '',
      order.delivery_date || '',
      order.delivery_time || '',
      order.driver?.nombre || 'Sin asignar',
      order.status || '',
      new Date(order.created_at).toLocaleDateString('es-ES'),
    ]);

    // Helper function to properly escape CSV values
    const escapeCSVValue = (value: string | null | undefined): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // If the value contains comma, double quote, or newline, wrap it in quotes
      // and escape any existing quotes by doubling them
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV content with proper escaping
    // Use semicolon (;) as delimiter for Spanish Excel compatibility
    const csvLines = [
      headers.map(escapeCSVValue).join(';'),
      ...rows.map((row) => row.map(escapeCSVValue).join(';')),
    ].join('\n');

    // Add UTF-8 BOM for better Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + csvLines;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `reporte-pedidos-${timestamp}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Éxito',
      description: `${filteredOrders.length} pedidos exportados`,
      duration: 2000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h3>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 items-end mb-4">
          {/* Cliente Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Cliente
            </label>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los clientes</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombre} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>

          {/* End Date Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Fecha Fin
            </label>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          {/* Sort Order Filter */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Orden Cronológica
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Más Recientes</option>
              <option value="oldest">Más Antiguos</option>
            </select>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setFilterClientId('');
              setFilterStartDate('');
              setFilterEndDate('');
              setSortOrder('newest');
            }}
            variant="outline"
          >
            Limpiar Filtros
          </Button>
          <Button
            onClick={generateCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar CSV ({filteredOrders.length} pedidos)
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <span className="font-semibold">{filteredOrders.length}</span> pedido(s) encontrado(s)
          {filterClientId && ` para el cliente seleccionado`}
          {filterStartDate && ` desde ${filterStartDate}`}
          {filterEndDate && ` hasta ${filterEndDate}`}
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Pedido #</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Entrega</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Repartidor</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Fecha</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  Cargando pedidos...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  No hay pedidos que cumplan los filtros
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-primary">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900 dark:text-white font-medium">{order.client?.nombre}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{order.client?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{order.delivery_address}</td>
                  <td className="px-4 py-3">
                    {order.driver ? (
                      <div className="text-slate-900 dark:text-white font-medium">{order.driver.nombre}</div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : order.status === 'assigned'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : order.status === 'going_to_pickup'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
                        : order.status === 'in_transit'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : order.status === 'delivered'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {order.status === 'pending' ? 'Pendiente'
                        : order.status === 'assigned' ? 'Asignado'
                        : order.status === 'going_to_pickup' ? 'IR para recogida'
                        : order.status === 'in_transit' ? 'En tránsito'
                        : order.status === 'delivered' ? 'Entregado'
                        : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewEvidence(order)}
                      disabled={loadingEvidence}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Ver evidencia de entrega"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {isAdminMaster && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(order)}
                        disabled={deleteOrderMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Delivery Evidence Modal */}
      <ViewDeliveryEvidenceModal
        isOpen={evidenceModalOpen}
        onClose={() => {
          setEvidenceModalOpen(false);
          setSelectedEvidence(null);
        }}
        evidence={selectedEvidence}
      />

      {/* Delete Confirmation Modal - Only for Admin Master */}
      {isAdminMaster && deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDeleteConfirmOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md mx-4 z-50">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Eliminar Pedido
              </h2>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-900 dark:text-white font-medium">
                  ¿Estás seguro de que deseas eliminar este pedido?
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              {orderToDelete && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">Pedido #:</span>
                    <span className="text-slate-700 dark:text-gray-200 font-mono">
                      {orderToDelete.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">Cliente:</span>
                    <span className="text-slate-700 dark:text-gray-200">
                      {orderToDelete.client?.nombre || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">Estado:</span>
                    <span className="text-slate-700 dark:text-gray-200">
                      {orderToDelete.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-6 border-t border-gray-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteOrderMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteOrderMutation.isPending}
              >
                {deleteOrderMutation.isPending ? 'Eliminando...' : 'Eliminar Pedido'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
