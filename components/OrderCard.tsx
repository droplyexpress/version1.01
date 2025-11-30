import { Order } from "@shared/types";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Clock,
  User,
  Navigation,
  Edit,
  Trash2,
  Share2,
  Printer,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  openGoogleMapsDirections,
  openDirectionsFromCurrentLocation,
  generateGoogleMapsSearchUrl,
} from "@/lib/maps-utils";
import { useToast } from "@/hooks/use-toast";
import { PrintLabel } from "@/components/PrintLabel";
import {
  isOrderNearDelivery,
  getRemainingDeliveryMinutes,
  isOrderNearPickup,
  getRemainingPickupMinutes,
} from "@/lib/order-utils";

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  actions?: React.ReactNode;
  onEdit?: () => void;
  onViewEvidence?: () => void;
  onDelete?: () => void;
  onTransfer?: () => void;
  showEditButton?: boolean;
  isDriver?: boolean; // If true, use current location for directions
  isAdmin?: boolean; // If true, show alerts for any admin
  isAdminMaster?: boolean;
  canTransfer?: boolean;
}

export function OrderCard({
  order,
  onClick,
  actions,
  onEdit,
  onViewEvidence,
  onDelete,
  onTransfer,
  showEditButton,
  isDriver,
  isAdmin,
  isAdminMaster,
  canTransfer,
}: OrderCardProps) {
  const { toast } = useToast();
  const [showPrintLabel, setShowPrintLabel] = useState(false);

  const nearDelivery = isOrderNearDelivery(order);
  const nearPickup = isOrderNearPickup(order);
  const nearDeliveryMinutes = nearDelivery
    ? getRemainingDeliveryMinutes(order)
    : 0;
  const nearPickupMinutes = nearPickup ? getRemainingPickupMinutes(order) : 0;
  const isAtRisk = nearDelivery || nearPickup;
  const remainingMinutes = nearDelivery
    ? nearDeliveryMinutes
    : nearPickupMinutes;
  const shouldShowAlert = isAtRisk && (isDriver || isAdmin);

  // Handle opening directions with location permission check
  const handleOpenDirections = (
    address: string,
    postalCode: string | undefined,
    isPickup: boolean,
  ) => {
    console.log("[OrderCard] handleOpenDirections called");
    console.log("[OrderCard] isDriver:", isDriver);
    console.log("[OrderCard] address:", address);
    console.log("[OrderCard] postalCode:", postalCode);
    console.log("[OrderCard] isPickup:", isPickup);

    if (isDriver) {
      // For drivers, show message and open maps (which will request location)
      console.log(
        "[OrderCard] Driver mode - calling openDirectionsFromCurrentLocation",
      );
      toast({
        title: "Abriendo Google Maps...",
        description: isPickup ? "📍 Ruta a recogida" : "🏁 Ruta a entrega",
        duration: 1500,
      });

      // Open maps with current location
      openDirectionsFromCurrentLocation(address, postalCode);
    } else {
      // For non-drivers, show route from pickup to delivery
      console.log(
        "[OrderCard] Non-driver mode - calling openGoogleMapsDirections",
      );
      openGoogleMapsDirections(order.pickup_address, address, postalCode);
    }
  };

  const statusColors: Record<string, string> = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    going_to_pickup:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    in_transit:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    delivered:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    assigned: "Asignado",
    going_to_pickup: "IR para recogida",
    in_transit: "En tránsito",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-lg border p-4 hover:shadow-md transition-shadow",
        shouldShowAlert
          ? "border-red-500 dark:border-red-600 animate-pulse shadow-lg shadow-red-500/50"
          : "border-gray-200 dark:border-slate-700",
      )}
      onClick={onClick}
      style={shouldShowAlert ? { animationIterationCount: "infinite" } : {}}
    >
      {/* Alert for near pickup or delivery */}
      {shouldShowAlert && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">
              ⚠️ Alerta de {nearPickup ? "Recogida" : "Entrega"} Próxima
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Tiempo para {nearPickup ? "recogida" : "entrega"}:{" "}
              <span className="font-bold">{remainingMinutes} minutos</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left side - Order info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Pedido #
              </p>
              <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                {order.order_number}
              </p>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                statusColors[order.status],
              )}
            >
              {statusLabels[order.status]}
            </span>
          </div>

          <div className="space-y-2">
            {/* Cliente/Remitente */}
            {order.client && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded p-3 border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                  👤 Remitente (Cliente)
                </p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {order.client.nombre}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {order.client.email}
                </p>
                {order.client.telefono && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {order.client.telefono}
                  </p>
                )}
              </div>
            )}

            {/* Destinatario */}
            <div className="flex items-start gap-2 text-sm">
              <User className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Destinatario
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {order.recipient_name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.recipient_phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <>
                  <p className="text-gray-600 dark:text-gray-400">
                    📍 Recogida: {order.pickup_address}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    🏁 Entrega: {order.delivery_address}
                  </p>
                </>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Recogida: {order.pickup_date} {order.pickup_time}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Entrega: {order.delivery_date} {order.delivery_time}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Driver and actions */}
        <div className="space-y-3">
          {order.driver && (
            <div className="bg-gray-50 dark:bg-slate-700 rounded p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Repartidor Asignado
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {order.driver.nombre}
              </p>
            </div>
          )}

          {order.notes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                Notas
              </p>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {order.notes}
              </p>
            </div>
          )}

          {!isDriver && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowPrintLabel(true);
              }}
              className="w-full flex items-center justify-center gap-2"
              title="Imprimir etiqueta del pedido"
            >
              <Printer className="w-4 h-4" />
              Imprimir Etiqueta
            </Button>
          )}

          {showEditButton && order.status === "pending" && onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar Pedido
            </Button>
          )}

          {order.status === "delivered" && onViewEvidence && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewEvidence}
              className="w-full flex items-center justify-center gap-2"
            >
              📸 Ver Evidencia de Entrega
            </Button>
          )}

          {canTransfer && onTransfer && order.driver_id && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onTransfer}
              className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 p-1 h-auto"
              title="Transferir a otro repartidor"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}

          {isAdminMaster && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 p-1 h-auto"
              title="Eliminar pedido"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          {actions && <div className="pt-2">{actions}</div>}
        </div>
      </div>

      {showPrintLabel && (
        <PrintLabel order={order} onClose={() => setShowPrintLabel(false)} />
      )}
    </div>
  );
}
