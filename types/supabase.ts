export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          telefono: string | null;
          rol: 'admin' | 'cliente' | 'repartidor';
          vehiculo: string | null;
          activo: boolean;
          direccion: string | null;
          codigo_postal: string | null;
          ciudad: string | null;
          pais: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          email: string;
          telefono?: string | null;
          rol?: 'admin' | 'cliente' | 'repartidor';
          vehiculo?: string | null;
          activo?: boolean;
          direccion?: string | null;
          codigo_postal?: string | null;
          ciudad?: string | null;
          pais?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nombre?: string;
          email?: string;
          telefono?: string | null;
          rol?: 'admin' | 'cliente' | 'repartidor';
          vehiculo?: string | null;
          activo?: boolean;
          direccion?: string | null;
          codigo_postal?: string | null;
          ciudad?: string | null;
          pais?: string | null;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          client_id: string;
          driver_id: string | null;
          pickup_address: string;
          pickup_postal_code: string;
          delivery_address: string;
          delivery_postal_code: string;
          recipient_name: string;
          recipient_phone: string;
          pickup_date: string;
          pickup_time: string;
          delivery_date: string;
          delivery_time: string;
          notes: string | null;
          status: 'pending' | 'assigned' | 'going_to_pickup' | 'in_transit' | 'delivered' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          client_id: string;
          driver_id?: string | null;
          pickup_address: string;
          pickup_postal_code: string;
          delivery_address: string;
          delivery_postal_code: string;
          recipient_name: string;
          recipient_phone: string;
          pickup_date: string;
          pickup_time: string;
          delivery_date: string;
          delivery_time: string;
          notes?: string | null;
          status?: 'pending' | 'assigned' | 'going_to_pickup' | 'in_transit' | 'delivered' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          driver_id?: string | null;
          status?: 'pending' | 'assigned' | 'going_to_pickup' | 'in_transit' | 'delivered' | 'cancelled';
          notes?: string | null;
          updated_at?: string;
        };
      };
      delivery_evidence: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string;
          photo_url: string;
          recipient_id_number: string;
          recipient_name: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          driver_id: string;
          photo_url: string;
          recipient_id_number: string;
          recipient_name: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          recipient_name?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          user_id: string;
          vehicle_type: string;
          license_plate: string;
          available: boolean;
          current_location: {
            latitude: number;
            longitude: number;
          } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_type: string;
          license_plate: string;
          available?: boolean;
          current_location?: {
            latitude: number;
            longitude: number;
          } | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          available?: boolean;
          current_location?: {
            latitude: number;
            longitude: number;
          } | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
