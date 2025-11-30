import { useState, useEffect, useRef, useMemo } from "react";
import { useAdminOrders, useAdminStats } from "@/hooks/useOrders";
import { useUsers, useUserCountByRole } from "@/hooks/useUsers";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { playNewOrderSound } from "@/lib/sound-utils";
import { filterOrdersByToday } from "@/lib/order-utils";
import { OrderCard } from "@/components/OrderCard";
import { UserManagementTable } from "@/components/UserManagementTable";
import { CreateUserForm } from "@/components/CreateUserForm";
import { AssignDriverModal } from "@/components/AssignDriverModal";
import { ViewDeliveryEvidenceModal } from "@/components/ViewDeliveryEvidenceModal";
import { DeleteOrderConfirmationModal } from "@/components/DeleteOrderConfirmationModal";
import { TransferOrderModal } from "@/components/TransferOrderModal";
import { ReportsPanel } from "@/components/ReportsPanel";
import { IncidentsPanel } from "@/components/IncidentsPanel";
import { AuthHeader } from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Order, DeliveryEvidence } from "@shared/types";
import {
  Package,
  Users,
  TrendingUp,
  Filter,
  Plus,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { orderService } from "@/services/orderService";

type Tab =
  | "pedidos"
  | "usuarios"
  | "crear-usuario"
  | "reportes"
  | "incidencias";

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("pedidos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] =
    useState<Order | null>(null);
  const [selectedOrderForEvidence, setSelectedOrderForEvidence] =
    useState<Order | null>(null);
  const [selectedOrderForDelete, setSelectedOrderForDelete] =
    useState<Order | null>(null);
  const [selectedOrderForTransfer, setSelectedOrderForTransfer] =
    useState<Order | null>(null);
  const [deliveryEvidence, setDeliveryEvidence] =
    useState<DeliveryEvidence | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const hasShownInitialOrdersRef = useRef(false);
  const lastSoundTimeRef = useRef(0);
  const userInteractingRef = useRef(false);

  const isAdminMaster = currentUser?.email === "manolo@droplyexpress.com";

  // Map filter values to database statuses
  const getStatusesForFilter = (filterValue: string): string[] | undefined => {
    if (filterValue === "todos") return undefined; // Return all orders
    if (filterValue === "pendientes")
      return ["pending", "assigned", "going_to_pickup"];
    if (filterValue === "recogidos") return ["in_transit"];
    if (filterValue === "entregados") return ["delivered", "cancelled"];
    return undefined;
  };

  const handleViewEvidence = async (order: Order) => {
    setSelectedOrderForEvidence(order);
    setIsLoadingEvidence(true);
    try {
      const evidence = await orderService.getDeliveryEvidence(order.id);
      if (!evidence) {
        console.warn("No evidence found for order:", order.id);
        setSelectedOrderForEvidence(null);
        setIsLoadingEvidence(false);
        return;
      }
      setDeliveryEvidence(evidence);
    } catch (error) {
      console.error(
        "Error loading delivery evidence:",
        error instanceof Error ? error.message : String(error),
      );
      setSelectedOrderForEvidence(null);
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrderForDelete(order);
  };

  // Orders - fetch all and filter on client side for multiple statuses
  const {
    data: allOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useAdminOrders();

  // Filter orders by status group
  const orders = useMemo(() => {
    if (!allOrders) return [];

    const dbStatusFilter = getStatusesForFilter(statusFilter);
    if (!dbStatusFilter) return allOrders;

    return allOrders.filter((order) => dbStatusFilter.includes(order.status));
  }, [allOrders, statusFilter]);

  // Disable sound for 5 seconds when user changes filter
  const handleStatusFilterChange = (status: string) => {
    console.log("[Admin] Filter changed, disabling sound temporarily");
    userInteractingRef.current = true;
    setStatusFilter(status);
    setTimeout(() => {
      userInteractingRef.current = false;
    }, 5000);
  };

  // Play sound when new orders arrive (but not during filter changes)
  useEffect(() => {
    if (!orders || orders.length === 0) {
      hasShownInitialOrdersRef.current = false;
      return;
    }

    const currentOrderIds = new Set(orders.map((o) => o.id));

    // Skip if this is the first time loading orders
    if (!hasShownInitialOrdersRef.current) {
      previousOrderIdsRef.current = currentOrderIds;
      hasShownInitialOrdersRef.current = true;
      return;
    }

    // Skip if user is currently interacting with filters
    if (userInteractingRef.current) {
      console.log("[Admin] User interacting, skipping sound");
      previousOrderIdsRef.current = currentOrderIds;
      return;
    }

    // Check if orders INCREASED (new orders arrived)
    const previousCount = previousOrderIdsRef.current.size;
    const currentCount = currentOrderIds.size;

    if (currentCount > previousCount) {
      // Don't play sound too frequently (max every 10 seconds)
      const now = Date.now();
      if (now - lastSoundTimeRef.current < 10000) {
        console.log("[Admin] Sound played recently, skipping");
        previousOrderIdsRef.current = currentOrderIds;
        return;
      }

      // Count how many truly new order IDs we have
      let newOrderCount = 0;
      for (const orderId of currentOrderIds) {
        if (!previousOrderIdsRef.current.has(orderId)) {
          newOrderCount++;
        }
      }

      if (newOrderCount > 0) {
        console.log("[Admin] New orders detected, playing sound...");
        try {
          playNewOrderSound();
          lastSoundTimeRef.current = Date.now();
        } catch (error) {
          console.error("[Admin] Error playing sound:", error);
        }

        toast({
          title: "Nuevo Pedido",
          description: `Has recibido ${newOrderCount} nuevo(s) pedido(s)`,
          duration: 2000,
        });
      }
    }

    previousOrderIdsRef.current = currentOrderIds;
  }, [orders, toast]);

  const { data: stats } = useAdminStats();

  // Users
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: userCounts } = useUserCountByRole();

  // Filter orders by today for pedidos tab (not for reportes) and sort newest first
  const filteredOrders = useMemo(() => {
    const filtered =
      activeTab === "pedidos" ? filterOrdersByToday(orders) : orders;

    // Always sort by newest first (descending created_at)
    if (filtered && Array.isArray(filtered) && filtered.length > 0) {
      return [...filtered].sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }
    return filtered || [];
  }, [orders, activeTab]);

  const statusOptions = [
    { value: "todos", label: "Todos" },
    { value: "pendientes", label: "Pendientes" },
    { value: "recogidos", label: "Recogidos" },
    { value: "entregados", label: "Entregados" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <AuthHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "pedidos"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pedidos
              </div>
            </button>
            <button
              onClick={() => setActiveTab("usuarios")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "usuarios"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuarios
              </div>
            </button>
            <button
              onClick={() => setActiveTab("reportes")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "reportes"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reportes
              </div>
            </button>
            <button
              onClick={() => setActiveTab("incidencias")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "incidencias"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Incidencias
              </div>
            </button>
          </div>
        </div>

        {/* Pedidos Tab */}
        {activeTab === "pedidos" && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Pedidos Activos
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {stats?.total_active_orders || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Repartidores
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {userCounts?.repartidor || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Entregas Hoy
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {stats?.deliveries_today || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Filtrar por estado:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant={
                      statusFilter === option.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusFilterChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {ordersLoading
                  ? "Cargando pedidos..."
                  : `${filteredOrders?.length || 0} Pedidos`}
              </h2>

              {ordersError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-200">
                  <p className="font-semibold">Error al cargar los pedidos</p>
                  <p className="text-sm mt-1">
                    {ordersError instanceof Error
                      ? ordersError.message
                      : "Error desconocido"}
                  </p>
                </div>
              )}

              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 h-32 animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : !filteredOrders || filteredOrders.length === 0 ? (
                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No hay pedidos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay pedidos que coincidan con los filtros seleccionados
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onViewEvidence={() => handleViewEvidence(order)}
                      onDelete={() => handleDeleteOrder(order)}
                      onTransfer={() => setSelectedOrderForTransfer(order)}
                      isAdmin={isAdmin}
                      isAdminMaster={isAdminMaster}
                      canTransfer={!!order.driver_id}
                      actions={
                        <div className="flex gap-2">
                          {order.status !== "delivered" &&
                            order.status !== "cancelled" &&
                            !order.driver_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedOrderForAssignment(order)
                                }
                              >
                                Asignar Repartidor
                              </Button>
                            )}
                          <Button size="sm" variant="ghost">
                            Ver Detalles
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usuarios Tab */}
        {activeTab === "usuarios" && (
          <div>
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-red-200 dark:border-red-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Administradores
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {userCounts?.admin || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl">👨‍💼</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-blue-200 dark:border-blue-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Clientes
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {userCounts?.cliente || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-green-200 dark:border-green-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      Repartidores
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {userCounts?.repartidor || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🚚</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Create User Button */}
            <div className="mb-8">
              <Button
                onClick={() => setActiveTab("crear-usuario")}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Nuevo Usuario
              </Button>
            </div>

            {/* Role Filters */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Filtrar por tipo de usuario:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={roleFilter === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(undefined)}
                >
                  Todos
                </Button>
                <Button
                  variant={roleFilter === "admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter("admin")}
                >
                  Administradores
                </Button>
                <Button
                  variant={roleFilter === "cliente" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter("cliente")}
                >
                  Clientes
                </Button>
                <Button
                  variant={roleFilter === "repartidor" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter("repartidor")}
                >
                  Repartidores
                </Button>
              </div>
            </div>

            {/* Users List */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {usersLoading
                  ? "Cargando usuarios..."
                  : `${users?.length || 0} Usuarios`}
              </h2>
              <UserManagementTable
                users={
                  users?.filter((user) =>
                    roleFilter ? user.rol === roleFilter : true,
                  ) || []
                }
                isLoading={usersLoading}
              />
            </div>
          </div>
        )}

        {/* Crear Usuario Tab */}
        {activeTab === "crear-usuario" && (
          <div className="max-w-2xl">
            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Crear Nuevo Usuario
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("usuarios")}
                >
                  ✕
                </Button>
              </div>
              <CreateUserForm onSuccess={() => setActiveTab("usuarios")} />
            </div>
          </div>
        )}

        {/* Reportes Tab */}
        {activeTab === "reportes" && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Reportes de Pedidos
            </h2>
            <ReportsPanel />
          </div>
        )}

        {/* Incidencias Tab */}
        {activeTab === "incidencias" && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Incidencias de Entrega
            </h2>
            <IncidentsPanel />
          </div>
        )}
      </div>

      {/* Assign Driver Modal */}
      {selectedOrderForAssignment && (
        <AssignDriverModal
          order={selectedOrderForAssignment}
          isOpen={!!selectedOrderForAssignment}
          onClose={() => setSelectedOrderForAssignment(null)}
          onSuccess={() => {
            setSelectedOrderForAssignment(null);
          }}
        />
      )}

      {/* View Delivery Evidence Modal */}
      <ViewDeliveryEvidenceModal
        isOpen={!!selectedOrderForEvidence && !!deliveryEvidence}
        onClose={() => {
          setSelectedOrderForEvidence(null);
          setDeliveryEvidence(null);
        }}
        evidence={deliveryEvidence}
      />

      {/* Delete Order Confirmation Modal */}
      <DeleteOrderConfirmationModal
        order={selectedOrderForDelete}
        isOpen={!!selectedOrderForDelete}
        onClose={() => setSelectedOrderForDelete(null)}
        onSuccess={() => {
          setSelectedOrderForDelete(null);
        }}
      />

      {/* Transfer Order Modal */}
      <TransferOrderModal
        order={selectedOrderForTransfer}
        isOpen={!!selectedOrderForTransfer}
        onClose={() => setSelectedOrderForTransfer(null)}
        drivers={users?.filter((u) => u.rol === "repartidor") || []}
        onSuccess={() => {
          setSelectedOrderForTransfer(null);
        }}
      />
    </div>
  );
}
