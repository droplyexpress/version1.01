import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDriverOrders,
  useUpdateOrderStatus,
  useDriverStats,
} from "@/hooks/useOrders";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { playOrderAssignedSound } from "@/lib/sound-utils";
import { filterOrdersByToday } from "@/lib/order-utils";
import { OrderCard } from "@/components/OrderCard";
import { AuthHeader } from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { DeliveryEvidenceModal } from "@/components/DeliveryEvidenceModal";
import { IncidentReportModal } from "@/components/IncidentReportModal";
import { generateGoogleMapsSearchUrl, generateWazeUrl } from "@/lib/maps-utils";
import { Package } from "lucide-react";
import { Order } from "@shared/types";

type DriverTab = "assigned" | "picked_up" | "incident_reported";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  going_to_pickup: "IR para recogida",
  in_transit: "En tránsito",
  incident_reported: "Incidencia Reportada",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusEmojis: Record<string, string> = {
  pending: "📋",
  assigned: "📦",
  going_to_pickup: "🚗",
  in_transit: "🚚",
  incident_reported: "⚠️",
  delivered: "✔️",
  cancelled: "❌",
};

export default function DriverApp() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DriverTab>("assigned");
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedOrderForEvidence, setSelectedOrderForEvidence] =
    useState<Order | null>(null);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [selectedOrderForIncident, setSelectedOrderForIncident] =
    useState<Order | null>(null);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const hasShownInitialOrdersRef = useRef(false);
  const lastSoundTimeRef = useRef(0);
  const userInteractingRef = useRef(false);
  const {
    data: orders,
    isLoading,
    refetch,
  } = useDriverOrders(currentUser?.id || "");
  const { data: stats } = useDriverStats(currentUser?.id || "");
  const updateStatusMutation = useUpdateOrderStatus();

  // Enable automatic logout after 2 hours of inactivity (drivers only)
  useInactivityLogout({
    timeoutMinutes: 120,
    warningMinutes: 10,
    onlyForRole: "repartidor",
  });

  // Play sound when new orders are assigned
  useEffect(() => {
    if (!orders || orders.length === 0) {
      hasShownInitialOrdersRef.current = false;
      return;
    }

    const currentOrderIds = new Set(orders.map((o) => o.id));

    if (!hasShownInitialOrdersRef.current) {
      previousOrderIdsRef.current = currentOrderIds;
      hasShownInitialOrdersRef.current = true;
      return;
    }

    if (userInteractingRef.current) {
      previousOrderIdsRef.current = currentOrderIds;
      return;
    }

    const previousCount = previousOrderIdsRef.current.size;
    const currentCount = currentOrderIds.size;

    if (currentCount > previousCount) {
      const now = Date.now();
      if (now - lastSoundTimeRef.current < 10000) {
        previousOrderIdsRef.current = currentOrderIds;
        return;
      }

      let newOrderCount = 0;
      for (const orderId of currentOrderIds) {
        if (!previousOrderIdsRef.current.has(orderId)) {
          newOrderCount++;
        }
      }

      if (newOrderCount > 0) {
        console.log("[Driver] New orders detected, playing sound...");
        try {
          playOrderAssignedSound();
          lastSoundTimeRef.current = Date.now();
        } catch (error) {
          console.error("[Driver] Error playing sound:", error);
        }

        toast({
          title: "Nuevo Pedido",
          description: `Has recibido ${newOrderCount} nuevo(s) pedido(s) asignado(s)`,
          duration: 2000,
        });
      }
    }

    previousOrderIdsRef.current = currentOrderIds;
  }, [orders, toast]);

  // Filter orders by today and then by tab
  const todayOrders = filterOrdersByToday(orders);

  const assignedOrders =
    todayOrders?.filter((order) =>
      ["pending", "assigned", "going_to_pickup"].includes(order.status),
    ) || [];

  const pickedUpOrders =
    todayOrders?.filter((order) => order.status === "in_transit") || [];

  const incidentReportedOrders =
    todayOrders?.filter((order) => order.status === "incident_reported") || [];

  const displayedOrders =
    activeTab === "assigned"
      ? assignedOrders
      : activeTab === "picked_up"
        ? pickedUpOrders
        : incidentReportedOrders;

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: string,
    order?: Order,
  ) => {
    // If finalizing delivery, open evidence modal
    if (newStatus === "delivered") {
      if (order) {
        // Set state synchronously to open modal
        setSelectedOrderForEvidence(order);
        setEvidenceModalOpen(true);
      }
      return;
    }

    // For other status updates, make the API call
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus,
      });
      toast({
        title: "Estado actualizado",
        description: "El estado del pedido ha sido actualizado correctamente",
        duration: 2000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar el estado del pedido";
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleGoToPickup = (order: Order) => {
    toast({
      title: "Abriendo Google Maps...",
      description: "�� Ruta a recogida",
      duration: 1500,
    });
    openDirectionsFromCurrentLocation(
      order.pickup_address,
      order.pickup_postal_code,
    );
  };

  const handleGoToDelivery = (order: Order) => {
    toast({
      title: "Abriendo Google Maps...",
      description: "🏁 Ruta a entrega",
      duration: 1500,
    });
    openDirectionsFromCurrentLocation(
      order.delivery_address,
      order.delivery_postal_code,
    );
  };

  const handleEvidenceSuccess = () => {
    // Immediately remove the delivered order from the UI
    if (selectedOrderForEvidence) {
      queryClient.setQueryData(
        ["driver-orders", currentUser?.id],
        (oldData: Order[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(
            (order) => order.id !== selectedOrderForEvidence.id,
          );
        },
      );
    }

    // Invalidate and refetch driver stats
    queryClient.invalidateQueries({
      queryKey: ["driver-stats", currentUser?.id],
    });

    toast({
      title: "Pedido entregado",
      description: "La entrega ha sido finalizada correctamente",
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <AuthHeader />

      {/* Driver Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            App del Repartidor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tus entregas del día
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Pedidos Asignados
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {stats?.assigned_orders || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              En Progreso
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {stats?.in_progress || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Completadas Hoy
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {stats?.completed_today || 0}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "assigned"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            📦 Asignados ({assignedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("picked_up")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "picked_up"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            🚚 Recogidos ({pickedUpOrders.length})
          </button>
          {incidentReportedOrders.length > 0 && (
            <button
              onClick={() => setActiveTab("incident_reported")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "incident_reported"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              ⚠️ Incidencias ({incidentReportedOrders.length})
            </button>
          )}
        </div>

        {/* Orders List */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {isLoading
              ? "Cargando pedidos..."
              : `${displayedOrders.length} Pedidos`}
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 h-32 animate-pulse"
                ></div>
              ))}
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Sin pedidos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === "assigned"
                  ? "No tienes pedidos asignados"
                  : "No tienes pedidos recogidos en tránsito"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isDriver={true}
                  actions={
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Estado: {statusEmojis[order.status]}{" "}
                        {statusLabels[order.status]}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {activeTab === "assigned" &&
                          order.status !== "going_to_pickup" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  handleStatusUpdate(
                                    order.id,
                                    "going_to_pickup",
                                  );
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="flex items-center gap-2"
                              >
                                🚗 Cambiar a IR para recogida
                              </Button>
                              <a
                                href={generateGoogleMapsSearchUrl(
                                  order.pickup_address,
                                  order.pickup_postal_code,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                🗺️ Google Maps
                              </a>
                              <a
                                href={generateWazeUrl(
                                  order.pickup_address,
                                  order.pickup_postal_code,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                              >
                                🗺️ Waze
                              </a>
                            </>
                          )}
                        {activeTab === "assigned" &&
                          order.status === "going_to_pickup" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  handleStatusUpdate(order.id, "in_transit")
                                }
                                disabled={updateStatusMutation.isPending}
                                className="flex items-center gap-2"
                              >
                                ✓ Recogido
                              </Button>
                              <a
                                href={generateGoogleMapsSearchUrl(
                                  order.pickup_address,
                                  order.pickup_postal_code,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                🗺️ Google Maps
                              </a>
                              <a
                                href={generateWazeUrl(
                                  order.pickup_address,
                                  order.pickup_postal_code,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                              >
                                🗺️ Waze
                              </a>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrderForIncident(order);
                                  setIncidentModalOpen(true);
                                }}
                                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              >
                                ⚠️ Reportar Incidencia
                              </Button>
                            </>
                          )}
                        {activeTab === "picked_up" && (
                          <>
                            <a
                              href={generateGoogleMapsSearchUrl(
                                order.delivery_address,
                                order.delivery_postal_code,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              🗺️ Google Maps
                            </a>
                            <a
                              href={generateWazeUrl(
                                order.delivery_address,
                                order.delivery_postal_code,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                            >
                              🗺️ Waze
                            </a>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusUpdate(order.id, "delivered", order)
                              }
                            >
                              ✓ Entregado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForIncident(order);
                                setIncidentModalOpen(true);
                              }}
                              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                              ⚠️ Reportar Incidencia
                            </Button>
                          </>
                        )}
                        {activeTab === "incident_reported" && (
                          <>
                            <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                Incidencia reportada - Esperando decisión del
                                administrador
                              </p>
                              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                Mantén el paquete en tu poder hasta que recibas
                                instrucciones
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Delivery Evidence Modal */}
        {selectedOrderForEvidence && (
          <DeliveryEvidenceModal
            isOpen={evidenceModalOpen}
            onClose={() => {
              setEvidenceModalOpen(false);
              setSelectedOrderForEvidence(null);
            }}
            orderId={selectedOrderForEvidence.id}
            driverId={currentUser?.id || ""}
            onSuccess={handleEvidenceSuccess}
          />
        )}

        {/* Incident Report Modal */}
        {selectedOrderForIncident && (
          <IncidentReportModal
            isOpen={incidentModalOpen}
            onClose={() => {
              setIncidentModalOpen(false);
              setSelectedOrderForIncident(null);
            }}
            order={selectedOrderForIncident}
            driverId={currentUser?.id || ""}
            onSuccess={() => {
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}
