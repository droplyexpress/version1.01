import { supabase } from "@/lib/supabase";
import { User } from "@shared/types";

export const userService = {
  // Get all users
  async getUsers() {
    try {
      console.log("[UserService] Fetching all users");
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[UserService] Error fetching users:", {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw error;
      }

      console.log(
        "[UserService] Successfully fetched users:",
        data?.length || 0,
      );
      return data as User[];
    } catch (error) {
      console.error("[UserService] Unexpected error in getUsers:", error);
      throw error;
    }
  },

  // Get users by role
  async getUsersByRole(rol: string) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("rol", rol)
      .eq("activo", true)
      .order("nombre");

    if (error) throw error;
    return data as User[];
  },

  // Get single user by ID
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as User;
  },

  // Get user by email
  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as User | null;
  },

  // Create new user
  async createUser(user: any) {
    try {
      const insertData = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        vehiculo: user.vehiculo || null,
        activo: user.activo !== false,
        direccion: user.direccion || null,
        codigo_postal: user.codigo_postal || null,
        ciudad: user.ciudad || null,
        pais: user.pais || "ES",
      };

      console.log("[UserService] Creating user:", user.email);

      const { error } = await supabase.from("usuarios").insert([insertData]);

      if (error) {
        console.error("[UserService] Insert error:", error);
        throw error;
      }

      console.log("[UserService] User inserted, fetching data...");

      // Fetch the user data after insert
      const { data, error: fetchError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("[UserService] Fetch error:", fetchError);
        throw fetchError;
      }

      console.log("[UserService] User created successfully:", user.email);
      return data as User;
    } catch (error) {
      console.error("[UserService] Create user error:", error);
      throw error;
    }
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from("usuarios")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  // Activate/Deactivate user
  async toggleUserStatus(id: string, activo: boolean) {
    return this.updateUser(id, { activo });
  },

  // Delete user (soft delete - just deactivate)
  async deleteUser(id: string) {
    return this.toggleUserStatus(id, false);
  },

  // Set driver online status
  async setDriverOnlineStatus(id: string, onlineStatus: "online" | "offline") {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .update({
          online_status: onlineStatus,
          last_activity: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("[UserService] Error setting driver status:", error);
        throw error;
      }

      return data as User;
    } catch (error) {
      console.error("[UserService] Error in setDriverOnlineStatus:", error);
      throw error;
    }
  },

  // Get available drivers (active repartidores)
  async getAvailableDrivers() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("rol", "repartidor")
      .eq("activo", true)
      .order("nombre");

    if (error) throw error;
    return data as User[];
  },

  // Get admin users
  async getAdmins() {
    return this.getUsersByRole("admin");
  },

  // Get clients
  async getClients() {
    return this.getUsersByRole("cliente");
  },

  // Get drivers
  async getDrivers() {
    return this.getUsersByRole("repartidor");
  },

  // Count users by role
  async getUserCountByRole() {
    try {
      const [adminRes, clientRes, driverRes] = await Promise.all([
        supabase
          .from("usuarios")
          .select("id", { count: "exact" })
          .eq("rol", "admin"),
        supabase
          .from("usuarios")
          .select("id", { count: "exact" })
          .eq("rol", "cliente"),
        supabase
          .from("usuarios")
          .select("id", { count: "exact" })
          .eq("rol", "repartidor"),
      ]);

      return {
        admin: adminRes.count || 0,
        cliente: clientRes.count || 0,
        repartidor: driverRes.count || 0,
      };
    } catch (error) {
      console.error("Error fetching user counts:", error);
      return {
        admin: 0,
        cliente: 0,
        repartidor: 0,
      };
    }
  },
};
