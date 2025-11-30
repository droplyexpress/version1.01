import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { Order } from "@shared/types";

export function useAdminOrders(filters?: {
  status?: string;
  client_id?: string;
  driver_id?: string;
}) {
  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => orderService.getOrders(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useClientOrders(clientId: string) {
  return useQuery({
    queryKey: ["client-orders", clientId],
    queryFn: () => orderService.getClientOrders(clientId),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!clientId,
  });
}

export function useDriverOrders(driverId: string) {
  return useQuery({
    queryKey: ["driver-orders", driverId],
    queryFn: () => orderService.getDriverOrders(driverId),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!driverId,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => orderService.getAdminStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useClientStats(clientId: string) {
  return useQuery({
    queryKey: ["client-stats", clientId],
    queryFn: () => orderService.getClientStats(clientId),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!clientId,
  });
}

export function useDriverStats(driverId: string) {
  return useQuery({
    queryKey: ["driver-stats", driverId],
    queryFn: () => orderService.getDriverStats(driverId),
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!driverId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      order: Omit<Order, "id" | "created_at" | "updated_at" | "order_number">,
    ) => orderService.createOrder(order),
    onSuccess: () => {
      // Only invalidate order queries, stats will refresh on their own interval
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      // Invalidate only the order queries
      queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
      // Stats will refresh on their own interval
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      driverId,
    }: {
      orderId: string;
      driverId: string;
    }) => orderService.assignDriver(orderId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.deleteOrder(orderId),
    onSuccess: () => {
      // Invalidate all order queries to reflect deletion
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
      queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
      // Stats will refresh on their own interval
    },
  });
}
