import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.error(
    "VITE_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "✓ Set" : "✗ Missing",
  );
  throw new Error(
    "Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    flowType: "pkce",
  },
});

// Diagnostic function to test Supabase connection
export async function testSupabaseConnection() {
  const results = {
    url_accessible: false,
    database_accessible: false,
    tables_exist: false,
    errors: [] as string[],
  };

  try {
    console.log("[Supabase] Testing connection to:", supabaseUrl);

    // Test 1: Try to reach the Supabase server via fetch
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
        },
      });
      console.log("[Supabase] REST API check status:", response.status);
      results.url_accessible = response.ok || response.status !== 0;
    } catch (fetchError) {
      const msg =
        fetchError instanceof Error ? fetchError.message : String(fetchError);
      results.errors.push(`Failed to reach Supabase URL: ${msg}`);
      console.error("[Supabase] URL check failed:", msg);
    }

    // Test 2: Try to query the usuarios table
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id", { count: "exact" })
        .limit(1);

      if (error) {
        console.error("[Supabase] Query error:", error.message);
        results.errors.push(`Database query failed: ${error.message}`);

        // Check if it's a table not found error
        if (
          error.message.includes("does not exist") ||
          error.code === "PGRST116"
        ) {
          results.errors.push(
            "The 'usuarios' table does not exist in the database",
          );
        }
      } else {
        results.database_accessible = true;
        results.tables_exist = true;
        console.log("[Supabase] Database query successful");
      }
    } catch (queryError) {
      const msg =
        queryError instanceof Error ? queryError.message : String(queryError);
      results.errors.push(`Unexpected error querying database: ${msg}`);
      console.error("[Supabase] Database query exception:", msg);
    }

    // Prepare response
    if (results.tables_exist) {
      return {
        connected: true,
        message: "Connected to Supabase successfully",
        ...results,
      };
    } else {
      return {
        connected: false,
        error:
          results.errors.length > 0
            ? results.errors[0]
            : "Unable to connect to Supabase",
        details: results,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Supabase] Connection test failed:", errorMessage);
    return {
      connected: false,
      error: errorMessage,
      details: results,
    };
  }
}

// Log Supabase connection status (only in development)
if (import.meta.env.DEV) {
  console.log("[Supabase] Configured successfully");
  console.log("[Supabase] URL:", supabaseUrl);
  console.log("[Supabase] Session persistence enabled");
}
