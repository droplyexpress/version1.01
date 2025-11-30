import { useState, useRef } from "react";
import { useCreateOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { searchAddressByPostalCode } from "@/lib/maps-utils";
import { playNewOrderSound } from "@/lib/sound-utils";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface OrderFormProps {
  clientId: string;
  clientAddress: string;
  clientPostalCode?: string;
  clientCity?: string;
  onSuccess?: () => void;
}

export function OrderForm({
  clientId,
  clientAddress,
  clientPostalCode = "",
  clientCity = "",
  onSuccess,
}: OrderFormProps) {
  const { toast } = useToast();
  const createOrderMutation = useCreateOrder();

  const [formData, setFormData] = useState({
    recipientName: "",
    pickupAddress: clientAddress,
    pickupPostalCode: clientPostalCode,
    deliveryAddress: "",
    deliveryPostalCode: "",
    recipientPhone: "",
    pickupDate: "",
    pickupTime: "09:00",
    deliveryDate: "",
    deliveryTime: "14:00",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useAlternatePickup, setUseAlternatePickup] = useState(false);
  const [searchingDeliveryAddress, setSearchingDeliveryAddress] =
    useState(false);
  const debounceTimerDelivery = useRef<NodeJS.Timeout | null>(null);

  const handleDeliveryPostalCodeChange = (postalCode: string) => {
    setFormData({ ...formData, deliveryPostalCode: postalCode });

    // Clear previous timer
    if (debounceTimerDelivery.current) {
      clearTimeout(debounceTimerDelivery.current);
    }

    // Set new timer for search after user stops typing
    if (postalCode.length >= 3) {
      setSearchingDeliveryAddress(true);
      debounceTimerDelivery.current = setTimeout(async () => {
        try {
          const result = await searchAddressByPostalCode(postalCode);
          if (result) {
            setFormData((prev) => ({
              ...prev,
              // Only fill delivery address if it's empty
              deliveryAddress: prev.deliveryAddress || result.address,
              deliveryPostalCode: result.postalCode,
            }));
            toast({
              title: "Código postal validado",
              description: `${result.address}, ${result.city}`,
              duration: 2000,
            });
          }
        } catch (error) {
          console.error("Error searching address:", error);
        } finally {
          setSearchingDeliveryAddress(false);
        }
      }, 800); // Wait 800ms after user stops typing
    } else {
      setSearchingDeliveryAddress(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientName.trim())
      newErrors.recipientName = "Nombre requerido";
    if (!formData.pickupAddress.trim())
      newErrors.pickupAddress = "Dirección de recogida requerida";
    if (!formData.pickupPostalCode.trim())
      newErrors.pickupPostalCode = "Código postal requerido";
    if (!formData.deliveryAddress.trim())
      newErrors.deliveryAddress = "Dirección de entrega requerida";
    if (!formData.deliveryPostalCode.trim())
      newErrors.deliveryPostalCode = "Código postal requerido";
    if (!formData.recipientPhone.trim())
      newErrors.recipientPhone = "Teléfono requerido";
    if (!formData.pickupDate)
      newErrors.pickupDate = "Fecha de recogida requerida";
    if (!formData.deliveryDate)
      newErrors.deliveryDate = "Fecha de entrega requerida";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createOrderMutation.mutateAsync({
        client_id: clientId,
        driver_id: null,
        pickup_address: formData.pickupAddress,
        pickup_postal_code: formData.pickupPostalCode,
        delivery_address: formData.deliveryAddress,
        delivery_postal_code: formData.deliveryPostalCode,
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone,
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        delivery_date: formData.deliveryDate,
        delivery_time: formData.deliveryTime,
        notes: formData.notes || null,
        status: "pending",
      } as any);

      playNewOrderSound();

      toast({
        title: "Éxito",
        description: "Pedido creado correctamente",
        duration: 3000,
      });

      setFormData({
        recipientName: "",
        pickupAddress: clientAddress,
        pickupPostalCode: clientPostalCode,
        deliveryAddress: "",
        deliveryPostalCode: "",
        recipientPhone: "",
        pickupDate: "",
        pickupTime: "09:00",
        deliveryDate: "",
        deliveryTime: "14:00",
        notes: "",
      });
      setUseAlternatePickup(false);

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Group 1: Recipient Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Información del Receptor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Nombre del receptor *
            </label>
            <Input
              value={formData.recipientName}
              onChange={(e) =>
                setFormData({ ...formData, recipientName: e.target.value })
              }
              placeholder="Juan García"
              className={errors.recipientName ? "border-red-500" : ""}
            />
            {errors.recipientName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.recipientName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Teléfono del receptor *
            </label>
            <Input
              value={formData.recipientPhone}
              onChange={(e) =>
                setFormData({ ...formData, recipientPhone: e.target.value })
              }
              placeholder="+34 612 345 678"
              className={errors.recipientPhone ? "border-red-500" : ""}
            />
            {errors.recipientPhone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.recipientPhone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Dirección de entrega *{" "}
              {searchingDeliveryAddress && (
                <span className="text-xs text-blue-500 ml-1">buscando...</span>
              )}
            </label>
            <div className="relative">
              <Input
                value={formData.deliveryAddress}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryAddress: e.target.value })
                }
                placeholder="Avenida Central 456"
                className={errors.deliveryAddress ? "border-red-500" : ""}
              />
              {searchingDeliveryAddress && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ingresa el código postal y se buscará automáticamente, o escribe
              la dirección manualmente
            </p>
            {errors.deliveryAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.deliveryAddress}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Código postal de entrega *{" "}
              {searchingDeliveryAddress && (
                <span className="text-xs text-blue-500 ml-1">buscando...</span>
              )}
            </label>
            <div className="relative">
              <Input
                value={formData.deliveryPostalCode}
                onChange={(e) => handleDeliveryPostalCodeChange(e.target.value)}
                placeholder="28002"
                className={`${errors.deliveryPostalCode ? "border-red-500" : ""}`}
              />
              {searchingDeliveryAddress && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>
            {errors.deliveryPostalCode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.deliveryPostalCode}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Group 2: Times and Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Fechas y Horas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Fecha de recogida *
            </label>
            <Input
              type="date"
              value={formData.pickupDate}
              onChange={(e) =>
                setFormData({ ...formData, pickupDate: e.target.value })
              }
              className={errors.pickupDate ? "border-red-500" : ""}
            />
            {errors.pickupDate && (
              <p className="text-red-500 text-sm mt-1">{errors.pickupDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Hora de recogida
            </label>
            <Input
              type="time"
              value={formData.pickupTime}
              onChange={(e) =>
                setFormData({ ...formData, pickupTime: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Fecha de entrega *
            </label>
            <Input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) =>
                setFormData({ ...formData, deliveryDate: e.target.value })
              }
              className={errors.deliveryDate ? "border-red-500" : ""}
            />
            {errors.deliveryDate && (
              <p className="text-red-500 text-sm mt-1">{errors.deliveryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Hora de entrega
            </label>
            <Input
              type="time"
              value={formData.deliveryTime}
              onChange={(e) =>
                setFormData({ ...formData, deliveryTime: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Group 3: Pickup Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Información de Recogida
        </h3>
        <div>
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <input
              type="checkbox"
              id="useAlternatePickup"
              checked={useAlternatePickup}
              onChange={(e) => {
                setUseAlternatePickup(e.target.checked);
                if (!e.target.checked) {
                  setFormData({
                    ...formData,
                    pickupAddress: clientAddress,
                    pickupPostalCode: clientPostalCode,
                  });
                }
              }}
              className="w-4 h-4 rounded"
            />
            <label
              htmlFor="useAlternatePickup"
              className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer"
            >
              ¿Cambiar dirección de recogida?
            </label>
            {!useAlternatePickup && clientAddress && (
              <span className="ml-auto inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded font-medium">
                Padrón
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={useAlternatePickup ? "opacity-100" : "opacity-75"}>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Dirección de recogida *
              </label>
              <Input
                value={formData.pickupAddress}
                onChange={(e) =>
                  setFormData({ ...formData, pickupAddress: e.target.value })
                }
                placeholder="Calle Principal 123"
                disabled={!useAlternatePickup && !!clientAddress}
                className={`${errors.pickupAddress ? "border-red-500" : ""}`}
              />
              {!useAlternatePickup && clientAddress && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  📍 {formData.pickupAddress} (Padrón)
                </p>
              )}
              {errors.pickupAddress && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.pickupAddress}
                </p>
              )}
            </div>

            <div className={useAlternatePickup ? "opacity-100" : "opacity-75"}>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Código postal de recogida *
              </label>
              <Input
                value={formData.pickupPostalCode}
                onChange={(e) =>
                  setFormData({ ...formData, pickupPostalCode: e.target.value })
                }
                placeholder="28001"
                disabled={!useAlternatePickup && !!clientPostalCode}
                className={`${errors.pickupPostalCode ? "border-red-500" : ""}`}
              />
              {!useAlternatePickup && clientPostalCode && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  🏘️ {formData.pickupPostalCode} (Padrón)
                </p>
              )}
              {errors.pickupPostalCode && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.pickupPostalCode}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
          Observaciones (opcional)
        </label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Agregar instrucciones especiales..."
          rows={4}
        />
      </div>

      <Button
        type="submit"
        disabled={createOrderMutation.isPending}
        className="w-full"
        size="lg"
      >
        {createOrderMutation.isPending ? "Creando pedido..." : "Crear Pedido"}
      </Button>
    </form>
  );
}
