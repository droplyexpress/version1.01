import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useClientOrders, useClientStats } from "@/hooks/useOrders";
import { useAuth } from "@/context/AuthContext";
import { OrderCard } from "@/components/OrderCard";
import { OrderForm } from "@/components/OrderForm";
import { ClientReportsPanel } from "@/components/ClientReportsPanel";
import { AuthHeader } from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { filterOrdersByToday } from "@/lib/order-utils";
import { ArrowLeft, Plus, Package, FileText } from "lucide-react";

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState<"pedidos" | "reportes">("pedidos");
  const [showForm, setShowForm] = useState(false);

  // Use actual user ID from auth context
  const { currentUser } = useAuth();
  const clientId = currentUser?.id || "";
  const { data: orders, isLoading } = useClientOrders(clientId);
  const { data: stats } = useClientStats(clientId);

  // Only show today's orders in the main tab
  const todayOrders = useMemo(() => {
    if (!orders) return [];
    return filterOrdersByToday(orders);
  }, [orders]);

  // Only show active orders from today (excluding delivered and cancelled)
  const activeOrders = useMemo(() => {
    return todayOrders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status),
    );
  }, [todayOrders]);

  // All orders (for reporting purposes)
  const allOrders = orders || [];
  const completedOrders = useMemo(() => {
    return allOrders.filter((o) =>
      ["delivered", "cancelled"].includes(o.status),
    );
  }, [allOrders]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <AuthHeader />
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Portal del Cliente
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Crea y sigue tus pedidos
              </p>
            </div>
          </div>
          {activeTab === "pedidos" && !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Pedido
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "pedidos"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pedidos
              </div>
            </button>
            <button
              onClick={() => setActiveTab("reportes")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "reportes"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reportes
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pedidos Tab */}
        {activeTab === "pedidos" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Total de Pedidos
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stats?.total_orders || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Pedidos Activos
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stats?.active_orders || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-primary/10">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Entregados
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stats?.completed_orders || 0}
                </p>
              </div>
            </div>

            {/* New Order Form */}
            {showForm && (
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8 mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Crear Nuevo Pedido
                  </h2>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    Cerrar
                  </Button>
                </div>
                <OrderForm
                  clientId={clientId}
                  clientAddress={currentUser?.direccion || "No especificada"}
                  clientPostalCode={currentUser?.codigo_postal || ""}
                  clientCity={currentUser?.ciudad || ""}
                  onSuccess={() => setShowForm(false)}
                />
              </div>
            )}

            {/* Pedidos Activos */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Pedidos Activos ({activeOrders.length})
              </h2>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 h-32 animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No tienes pedidos activos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>

            {/* Historial */}
            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Historial de Pedidos ({completedOrders.length})
                </h2>
                <div className="space-y-4">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reportes Tab */}
        {activeTab === "reportes" && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Mis Reportes
            </h2>
            <ClientReportsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
