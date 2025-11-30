import { Order } from '@shared/types';

/**
 * Get the start and end of today in the user's timezone
 */
export function getTodayDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start, end };
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  const orderDate = new Date(date);
  const { start, end } = getTodayDateRange();

  return orderDate >= start && orderDate <= end;
}

/**
 * Filter orders to show only today's orders
 */
export function filterOrdersByToday(orders: Order[] | undefined): Order[] {
  if (!orders) return [];

  return orders.filter((order) => {
    // Check scheduled_delivery_date first
    if (order.scheduled_delivery_date && isToday(order.scheduled_delivery_date)) {
      return true;
    }

    // Fallback to created_at
    if (order.created_at && isToday(order.created_at)) {
      return true;
    }

    return false;
  });
}

/**
 * Check if an order is near delivery deadline (within 12 minutes)
 */
export function isOrderNearDelivery(order: Order): boolean {
  if (!order.scheduled_delivery_time) return false;

  // Don't show alert for already delivered orders
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return false;
  }

  const now = new Date();
  const deliveryTimeStr = order.scheduled_delivery_time;

  // Parse delivery time (format: "HH:MM")
  const [hours, minutes] = deliveryTimeStr.split(':').map(Number);
  const deliveryTime = new Date();
  deliveryTime.setHours(hours, minutes, 0, 0);

  // Calculate time difference in minutes
  const timeDiffMs = deliveryTime.getTime() - now.getTime();
  const timeDiffMinutes = timeDiffMs / (1000 * 60);

  // Alert if within 12 minutes and not yet passed
  return timeDiffMinutes > 0 && timeDiffMinutes <= 12;
}

/**
 * Check if an order is near pickup deadline (within 15 minutes)
 */
export function isOrderNearPickup(order: Order): boolean {
  if (!order.pickup_time) return false;

  // Don't show alert for orders already picked up or in transit
  if (['in_transit', 'delivered', 'cancelled'].includes(order.status)) {
    return false;
  }

  const now = new Date();
  const pickupTimeStr = order.pickup_time;

  // Parse pickup time (format: "HH:MM")
  const [hours, minutes] = pickupTimeStr.split(':').map(Number);
  const pickupTime = new Date();
  pickupTime.setHours(hours, minutes, 0, 0);

  // Calculate time difference in minutes
  const timeDiffMs = pickupTime.getTime() - now.getTime();
  const timeDiffMinutes = timeDiffMs / (1000 * 60);

  // Alert if within 15 minutes and not yet passed
  return timeDiffMinutes > 0 && timeDiffMinutes <= 15;
}

/**
 * Check if an order is near pickup or delivery deadline (for admin alerts)
 */
export function isOrderAtRisk(order: Order): boolean {
  return isOrderNearPickup(order) || isOrderNearDelivery(order);
}

/**
 * Get remaining minutes until pickup
 */
export function getRemainingPickupMinutes(order: Order): number {
  if (!order.pickup_time) return -1;

  const now = new Date();
  const pickupTimeStr = order.pickup_time;

  const [hours, minutes] = pickupTimeStr.split(':').map(Number);
  const pickupTime = new Date();
  pickupTime.setHours(hours, minutes, 0, 0);

  const timeDiffMs = pickupTime.getTime() - now.getTime();
  return Math.ceil(timeDiffMs / (1000 * 60));
}

/**
 * Get remaining minutes until delivery
 */
export function getRemainingDeliveryMinutes(order: Order): number {
  if (!order.scheduled_delivery_time) return -1;

  const now = new Date();
  const deliveryTimeStr = order.scheduled_delivery_time;

  const [hours, minutes] = deliveryTimeStr.split(':').map(Number);
  const deliveryTime = new Date();
  deliveryTime.setHours(hours, minutes, 0, 0);

  const timeDiffMs = deliveryTime.getTime() - now.getTime();
  return Math.ceil(timeDiffMs / (1000 * 60));
}
