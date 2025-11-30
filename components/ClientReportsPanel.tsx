import { useState, useMemo } from 'react';
import { useClientOrders } from '@/hooks/useOrders';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ClientReportsPanel() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useClientOrders(currentUser?.id || '');

  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders.filter((order) => {
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

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [orders, filterStartDate, filterEndDate, sortOrder]);

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
      'Dirección Entrega',
      'Repartidor',
      'Estado',
      'Fecha Creación',
    ];

    const rows = filteredOrders.map((order) => [
      order.order_number || '',
      order.delivery_address || '',
      order.driver?.nombre || 'Sin asignar',
      order.status || '',
      new Date(order.created_at).toLocaleDateString('es-ES'),
    ]);

    const escapeCSVValue = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvLines = [
      headers.map(escapeCSVValue).join(';'),
      ...rows.map((row) => row.map(escapeCSVValue).join(';')),
    ].join('\n');

    const BOM = '\uFEFF';
    const csvContent = BOM + csvLines;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `mis-pedidos-${timestamp}.csv`);
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

        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Orden
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="newest">Más Recientes</option>
              <option value="oldest">Más Antiguos</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
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
            Descargar CSV ({filteredOrders.length})
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <span className="font-semibold">{filteredOrders.length}</span> pedido(s) encontrado(s)
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Pedido
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Entrega
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Repartidor
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Estado
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                  No hay pedidos
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-mono font-bold text-primary">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {order.delivery_address}
                  </td>
                  <td className="px-4 py-3">
                    {order.driver?.nombre || 'Sin asignar'}
                  </td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
