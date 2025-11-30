import { useState, useMemo } from 'react';
import { orderService } from '@/services/orderService';
import { useUsers } from '@/hooks/useUsers';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Filter, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Incident } from '@shared/types';

const INCIDENT_TYPES: Record<string, string> = {
  package_not_ready: 'Paquete no está listo',
  recipient_unavailable: 'Destinatario no disponible',
  wrong_address: 'Dirección incorrecta',
  damaged_package: 'Paquete dañado',
  other: 'Otro',
};

const INCIDENT_STATUS_COLORS: Record<string, { badge: string; icon: string }> = {
  pending: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: '⏳',
  },
  approved: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: '✅',
  },
  rejected: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: '❌',
  },
  resolved: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: '✓',
  },
};

export function IncidentsPanel() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [actionData, setActionData] = useState<Record<string, { notes: string; decision: string; newDriverId?: string }>>({});
  const { data: users } = useUsers();

  const { data: incidents, isLoading, refetch } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const result = await orderService.getIncidents();
      return result || [];
    },
    refetchInterval: 10000,
  });

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    if (!filterStatus) return incidents;
    return incidents.filter((incident) => incident.status === filterStatus);
  }, [incidents, filterStatus]);

  const handleResolveIncident = async (incidentId: string, decision: string) => {
    const notes = actionData[incidentId]?.notes || '';
    const newDriverId = actionData[incidentId]?.newDriverId;

    if (!decision) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una decisión',
        variant: 'destructive',
      });
      return;
    }

    if (decision === 'reassign' && !newDriverId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un repartidor para reasignar',
        variant: 'destructive',
      });
      return;
    }

    try {
      await orderService.updateIncidentViaBackend(incidentId, {
        status: 'resolved',
        admin_notes: notes,
        resolved_decision: decision,
        new_driver_id: newDriverId,
      });

      toast({
        title: 'Éxito',
        description: 'Incidencia resuelta',
        duration: 2000,
      });

      refetch();
      setExpandedIncident(null);
      setActionData({});
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo resolver la incidencia',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h3>

        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('')}
            >
              Todas ({incidents?.length || 0})
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
            >
              ⏳ Pendientes ({incidents?.filter((i) => i.status === 'pending').length || 0})
            </Button>
            <Button
              variant={filterStatus === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('resolved')}
            >
              ✓ Resueltas ({incidents?.filter((i) => i.status === 'resolved').length || 0})
            </Button>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Cargando incidencias...
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Sin incidencias
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No hay incidencias que mostrar
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                onClick={() =>
                  setExpandedIncident(expandedIncident === incident.id ? null : incident.id)
                }
              >
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Pedido: {incident.order?.order_number}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {INCIDENT_TYPES[incident.incident_type as keyof typeof INCIDENT_TYPES]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      INCIDENT_STATUS_COLORS[incident.status].badge
                    }`}
                  >
                    {INCIDENT_STATUS_COLORS[incident.status].icon}{' '}
                    {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedIncident === incident.id && (
                <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/50 space-y-4">
                  {/* Incident Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Repartidor
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {incident.driver?.nombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Teléfono
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {incident.driver?.telefono}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Dirección
                      </p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {incident.order?.delivery_address}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Descripción
                    </p>
                    <p className="text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-700">
                      {incident.description}
                    </p>
                  </div>

                  {/* Photo */}
                  {incident.photo_url && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Foto
                      </p>
                      <img
                        src={incident.photo_url}
                        alt="Incident"
                        className="w-full h-48 object-cover rounded border border-gray-200 dark:border-slate-700"
                      />
                    </div>
                  )}

                  {/* Admin Actions - Only for pending incidents */}
                  {incident.status === 'pending' && (
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Notas (opcional)
                        </label>
                        <textarea
                          value={actionData[incident.id]?.notes || ''}
                          onChange={(e) =>
                            setActionData({
                              ...actionData,
                              [incident.id]: {
                                ...actionData[incident.id],
                                notes: e.target.value,
                              },
                            })
                          }
                          placeholder="Agregar notas sobre la decisión tomada..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Decisión *
                        </label>
                        <select
                          value={actionData[incident.id]?.decision || ''}
                          onChange={(e) =>
                            setActionData({
                              ...actionData,
                              [incident.id]: {
                                ...actionData[incident.id],
                                decision: e.target.value,
                                newDriverId: e.target.value !== 'reassign' ? undefined : actionData[incident.id]?.newDriverId,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecciona una decisión...</option>
                          <option value="retry">🔄 Reintentar entrega (mismo repartidor)</option>
                          <option value="return">↩️ Devolver al cliente</option>
                          <option value="reassign">🔀 Reasignar a otro repartidor</option>
                          <option value="waiting_client">⏳ Esperar respuesta del cliente</option>
                        </select>
                      </div>

                      {actionData[incident.id]?.decision === 'reassign' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Selecciona nuevo repartidor *
                          </label>
                          <select
                            value={actionData[incident.id]?.newDriverId || ''}
                            onChange={(e) =>
                              setActionData({
                                ...actionData,
                                [incident.id]: {
                                  ...actionData[incident.id],
                                  newDriverId: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecciona un repartidor...</option>
                            {users?.filter(u => u.rol === 'repartidor').map(driver => (
                              <option key={driver.id} value={driver.id}>
                                {driver.nombre} ({driver.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            handleResolveIncident(
                              incident.id,
                              actionData[incident.id]?.decision || ''
                            )
                          }
                          disabled={!actionData[incident.id]?.decision}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolver
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show resolved decision */}
                  {incident.status === 'resolved' && incident.resolved_decision && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                        Decisión:
                      </p>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        {incident.resolved_decision === 'retry' && '🔄 Reintentar entrega (mismo repartidor)'}
                        {incident.resolved_decision === 'return' && '↩️ Devolver al cliente'}
                        {incident.resolved_decision === 'reassign' && '🔀 Reasignado a otro repartidor'}
                        {incident.resolved_decision === 'waiting_client' && '⏳ Esperando respuesta del cliente'}
                      </p>
                    </div>
                  )}

                  {incident.admin_notes && (
                    <div className="bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded p-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notas del admin:
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {incident.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
