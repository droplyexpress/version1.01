import { supabase } from "@/lib/supabase";
import { Order, DeliveryEvidence } from "@shared/types";

export const orderService = {
  // Get all orders (admin view)
  async getOrders(filters?: {
    status?: string;
    client_id?: string;
    driver_id?: string;
  }) {
    try {
      console.log("[OrderService] Fetching orders with filters:", filters);

      let query = supabase.from("orders").select(`
        *,
        client:client_id(id, nombre, email, telefono),
        driver:driver_id(id, nombre, email, telefono)
      `);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id);
      }
      if (filters?.driver_id) {
        query = query.eq("driver_id", filters.driver_id);
      }

      query = query
        .order("delivery_date", { ascending: true })
        .order("delivery_time", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("[OrderService] Error fetching orders:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log(
        "[OrderService] Successfully fetched orders:",
        data?.length || 0,
      );
      return data as Order[];
    } catch (error) {
      console.error("[OrderService] Unexpected error in getOrders:", error);
      throw error;
    }
  },

  // Get client's orders
  async getClientOrders(clientId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        client:client_id(id, nombre, email, telefono),
        driver:driver_id(id, nombre, email, telefono)
      `,
      )
      .eq("client_id", clientId)
      .order("delivery_date", { ascending: true })
      .order("delivery_time", { ascending: true });

    if (error) throw error;
    return data as Order[];
  },

  // Get driver's assigned orders
  async getDriverOrders(driverId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        client:client_id(id, nombre, email, telefono)
      `,
      )
      .eq("driver_id", driverId)
      .order("pickup_date");

    if (error) throw error;
    return data as Order[];
  },

  // Create new order
  async createOrder(
    order: Omit<Order, "id" | "created_at" | "updated_at" | "order_number">,
  ) {
    const orderNumber = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { data, error } = await supabase
      .from("orders")
      .insert([{ ...order, order_number: orderNumber, status: "pending" }])
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  // Update order
  async updateOrder(orderId: string, updates: Partial<Order>) {
    const { data, error } = await supabase
      .from("orders")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    return this.updateOrder(orderId, { status: status as any });
  },

  // Assign driver to order (uses backend to bypass RLS timeout)
  async assignDriver(orderId: string, driverId: string) {
    const response = await fetch("/api/orders/" + orderId + "/assign-driver", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driverId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al asignar repartidor");
    }

    return data;
  },

  // Get order statistics for admin
  async getAdminStats() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    ).toISOString();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    ).toISOString();

    const [activeOrders, totalDrivers, todayOrders] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .in("status", ["pending", "assigned", "going_to_pickup", "in_transit"]),
      supabase
        .from("usuarios")
        .select("id", { count: "exact" })
        .eq("rol", "repartidor")
        .eq("activo", true),
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("status", "delivered")
        .gte("updated_at", startOfDay)
        .lte("updated_at", endOfDay),
    ]);

    return {
      total_active_orders: activeOrders.count || 0,
      total_drivers: totalDrivers.count || 0,
      deliveries_today: todayOrders.count || 0,
      pending_orders: 0,
    };
  },

  // Get client statistics
  async getClientStats(clientId: string) {
    const [total, active, completed] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("client_id", clientId),
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("client_id", clientId)
        .in("status", ["pending", "assigned", "picked_up", "in_transit"]),
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("client_id", clientId)
        .eq("status", "delivered"),
    ]);

    return {
      total_orders: total.count || 0,
      active_orders: active.count || 0,
      completed_orders: completed.count || 0,
    };
  },

  // Get driver statistics
  async getDriverStats(driverId: string) {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    ).toISOString();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    ).toISOString();

    const [assigned, completed, inProgress] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("driver_id", driverId)
        .in("status", ["assigned", "going_to_pickup", "in_transit"]),
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("driver_id", driverId)
        .eq("status", "delivered")
        .gte("updated_at", startOfDay)
        .lte("updated_at", endOfDay),
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("driver_id", driverId)
        .eq("status", "in_transit"),
    ]);

    return {
      assigned_orders: assigned.count || 0,
      completed_today: completed.count || 0,
      in_progress: inProgress.count || 0,
    };
  },

  // Delivery evidence methods
  async uploadDeliveryEvidence(
    orderId: string,
    driverId: string,
    photoFile: File,
    recipientIdNumber: string,
    recipientName: string,
    notes?: string,
  ) {
    try {
      console.log(
        "[OrderService] Starting delivery evidence upload for order:",
        orderId,
      );

      const timestamp = Date.now();
      const photoPath = `delivery_evidence/${orderId}/${timestamp}_photo.jpg`;

      // Upload photo
      console.log("[OrderService] Uploading photo to path:", photoPath);
      const { error: photoError, data: uploadData } = await supabase.storage
        .from("delivery-evidence")
        .upload(photoPath, photoFile, { upsert: false });

      if (photoError) {
        console.error("[OrderService] Photo upload error:", photoError);
        throw photoError;
      }

      console.log("[OrderService] Photo uploaded successfully:", uploadData);

      // Get public URL
      const { data: photoData } = supabase.storage
        .from("delivery-evidence")
        .getPublicUrl(photoPath);

      console.log("[OrderService] Photo public URL:", photoData.publicUrl);

      // Create delivery evidence record
      console.log("[OrderService] Creating delivery evidence record");
      const { data, error } = await supabase
        .from("delivery_evidence")
        .insert([
          {
            order_id: orderId,
            driver_id: driverId,
            photo_url: photoData.publicUrl,
            recipient_id_number: recipientIdNumber,
            recipient_name: recipientName,
            notes: notes || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(
          "[OrderService] Error inserting delivery evidence:",
          error,
        );
        throw error;
      }

      console.log("[OrderService] Delivery evidence created:", data);

      // Update order status to delivered
      console.log("[OrderService] Updating order status to delivered");
      const updateResult = await this.updateOrderStatus(orderId, "delivered");
      console.log("[OrderService] Order status updated:", updateResult);

      return data as DeliveryEvidence;
    } catch (error) {
      console.error("[OrderService] Error uploading delivery evidence:", error);
      throw error;
    }
  },

  async getDeliveryEvidence(orderId: string) {
    try {
      const { data, error } = await supabase
        .from("delivery_evidence")
        .select("*")
        .eq("order_id", orderId)
        .limit(1);

      if (error) {
        console.error(
          "[OrderService] Error fetching delivery evidence:",
          error,
        );
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as DeliveryEvidence;
    } catch (error) {
      console.error("[OrderService] Error in getDeliveryEvidence:", error);
      return null;
    }
  },

  async getDeliveryEvidenceByDriver(driverId: string) {
    const { data, error } = await supabase
      .from("delivery_evidence")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as DeliveryEvidence[];
  },

  // Delete order
  async deleteOrder(orderId: string) {
    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) throw error;
  },

  // Get incidents
  async getIncidents(filters?: {
    order_id?: string;
    driver_id?: string;
    status?: string;
  }) {
    let query = supabase
      .from("incidents")
      .select(
        `
        *,
        order:order_id(id, order_number, client_id, delivery_address),
        driver:driver_id(id, nombre, email, telefono)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.order_id) {
      query = query.eq("order_id", filters.order_id);
    }
    if (filters?.driver_id) {
      query = query.eq("driver_id", filters.driver_id);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getIncidentsByDriver(driverId: string) {
    const { data, error } = await supabase
      .from("incidents")
      .select(
        `
        *,
        order:order_id(id, order_number, client_id, delivery_address)
      `,
      )
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createIncident(incident: {
    order_id: string;
    driver_id: string;
    incident_type: string;
    description: string;
    photo_url?: string | null;
  }) {
    const { data, error } = await supabase
      .from("incidents")
      .insert([incident])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateIncident(
    incidentId: string,
    updates: {
      status?: string;
      admin_notes?: string;
      resolved_action?: string;
      resolved_decision?: string;
      new_driver_id?: string;
    },
  ) {
    const { data, error } = await supabase
      .from("incidents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", incidentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update incident via backend (handles order status updates)
  async updateIncidentViaBackend(
    incidentId: string,
    updates: {
      status?: string;
      admin_notes?: string;
      resolved_decision?: string;
      new_driver_id?: string;
    },
  ) {
    const response = await fetch("/api/incidents/" + incidentId, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al actualizar incidencia");
    }

    return data;
  },
};
