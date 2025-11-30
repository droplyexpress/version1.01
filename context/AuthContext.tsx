import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "@shared/types";
import { supabase } from "@/lib/supabase";
import { userService } from "@/services/userService";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isClient: boolean;
  isDriver: boolean;
}

const defaultAuthContext: AuthContextType = {
  currentUser: null,
  isLoading: true,
  login: async () => null,
  logout: async () => {},
  isAdmin: false,
  isClient: false,
  isDriver: false,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount and listen for changes
  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;
    let authErrorListener: any = null;

    const loadUserProfile = async (email: string) => {
      try {
        console.log("[Auth] Fetching profile for:", email);

        // Add error boundary for response reading
        let result, data, error;
        try {
          const response = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", email)
            .single();

          result = response;
          data = response.data;
          error = response.error;
        } catch (readError) {
          console.error("[Auth] Error reading response:", readError);
          return null;
        }

        if (error || !data) {
          console.warn(
            "[Auth] Could not load profile:",
            error?.message || "No data",
          );
          return null;
        }

        if (isMounted) {
          const user = data as User;
          console.log("[Auth] Profile loaded:", user.email, "Role:", user.rol);

          // Set driver online status if they're a driver (non-blocking)
          if (user.rol === "repartidor") {
            userService
              .setDriverOnlineStatus(user.id, "online")
              .catch((err) => {
                console.error("[Auth] Error updating driver status:", err);
              });
          }

          return user;
        }

        return null;
      } catch (dbError) {
        console.error("[Auth] Profile fetch error:", dbError);
        return null;
      }
    };

    const initializeAuth = async () => {
      try {
        console.log("[Auth] Initializing authentication...");

        // Check for persisted session with error handling
        let session = null;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn("[Auth] Error getting session:", error.message);

            // Handle invalid refresh token - clear corrupted session
            if (error.message && error.message.includes("Refresh Token")) {
              console.log(
                "[Auth] Invalid refresh token detected - clearing session",
              );
              // Clear corrupted tokens from storage
              if (typeof window !== "undefined" && window.localStorage) {
                localStorage.removeItem("sb-auth-token");
                localStorage.removeItem("sb-refresh-token");
              }
              // Also try to sign out from Supabase to clear server-side session
              try {
                await supabase.auth.signOut();
              } catch (signOutError) {
                console.warn("[Auth] Error signing out:", signOutError);
              }
            }
          } else {
            session = data?.session;
          }
        } catch (sessionError) {
          console.error("[Auth] Failed to get session:", sessionError);

          // If error mentions refresh token, clean up
          const errorMsg =
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError);
          if (errorMsg.includes("Refresh Token")) {
            console.log(
              "[Auth] Invalid refresh token in catch - clearing session",
            );
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.removeItem("sb-auth-token");
              localStorage.removeItem("sb-refresh-token");
            }
          }
          // Continue anyway - user just won't be logged in
        }

        if (session?.user?.email && isMounted) {
          try {
            const user = await loadUserProfile(session.user.email);
            if (isMounted && user) {
              setCurrentUser(user);
              console.log("[Auth] User loaded from persisted session");
            }
          } catch (profileError) {
            console.error("[Auth] Error loading profile:", profileError);
            // Continue without profile - just logged in to Supabase
          }
        }
      } catch (error) {
        console.error("[Auth] Error initializing auth:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }

      // Set up auth state change listener (after loading initial session)
      try {
        const authSubscription = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("[Auth] Auth state changed:", event);

            if (!isMounted) return;

            try {
              if (session?.user?.email) {
                const user = await loadUserProfile(session.user.email);
                if (isMounted && user) {
                  setCurrentUser(user);
                }
              } else {
                if (isMounted) {
                  setCurrentUser(null);
                }
              }
            } catch (error) {
              console.error(
                "[Auth] Error in auth state change handler:",
                error,
              );
            }
          },
        );

        // Handle subscription assignment - support different Supabase versions
        if (authSubscription) {
          if (typeof authSubscription.unsubscribe === "function") {
            // Direct subscription object
            subscription = authSubscription;
          } else if (authSubscription?.data?.subscription) {
            // Wrapped subscription object
            subscription = authSubscription.data.subscription;
          }
        }
      } catch (error) {
        console.error("[Auth] Error setting up auth state listener:", error);
      }
    };

    initializeAuth();

    // Add global error listener for auth errors
    const handleAuthError = (error: any) => {
      const errorMsg = error?.message || String(error);

      // Handle invalid refresh token anywhere in the app
      if (errorMsg && errorMsg.includes("Refresh Token")) {
        console.log("[Auth] Invalid refresh token detected - clearing session");
        if (isMounted) {
          setCurrentUser(null);
        }
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("sb-auth-token");
          localStorage.removeItem("sb-refresh-token");
        }
        // Try to sign out from Supabase
        try {
          supabase.auth.signOut().catch(() => {
            // Ignore errors
          });
        } catch {
          // Ignore errors
        }
      }
    };

    // Listen to global errors (optional - provides extra safety)
    // This helps catch "Invalid Refresh Token" errors that might occur during API calls
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      return originalFetch.apply(window, args).catch((error) => {
        if (error?.message?.includes("Refresh Token")) {
          handleAuthError(error);
        }
        throw error;
      });
    };

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
      // Restore original fetch
      window.fetch = originalFetch;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log("[Login] Authenticating:", email);
      setIsLoading(true);

      let data, error;
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = result.data;
        error = result.error;
      } catch (sdkError) {
        // Handle Supabase SDK errors (like body stream already read)
        const errorMsg =
          sdkError instanceof Error ? sdkError.message : String(sdkError);
        console.error("[Login] Supabase SDK error:", errorMsg);

        // If it's a "body stream already read" error, it's likely invalid credentials
        if (
          errorMsg.includes("body stream already read") ||
          errorMsg.includes("json")
        ) {
          setIsLoading(false);
          throw new Error("Email o contraseña incorrectos");
        }

        setIsLoading(false);
        throw new Error("Error de conexión. Por favor intenta de nuevo.");
      }

      if (error) {
        console.error("[Login] Auth error:", error.message);
        setIsLoading(false);
        throw new Error(error.message || "Email o contraseña incorrectos");
      }

      if (!data?.session?.user?.email) {
        setIsLoading(false);
        throw new Error("No se pudo obtener la sesión");
      }

      console.log("[Login] Auth successful for:", email);
      setIsLoading(false);

      // Return null - the auth state change listener will load the profile
      return null;
    } catch (error) {
      console.error("[Login] Error:", error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Set driver offline status before logging out
      if (currentUser?.rol === "repartidor") {
        try {
          await userService.setDriverOnlineStatus(currentUser.id, "offline");
        } catch (statusError) {
          console.error("Error setting driver offline status:", statusError);
          // Continue with logout even if status update fails
        }
      }

      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear user even if signOut fails
      setCurrentUser(null);
    }
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    isLoading,
    login,
    logout,
    isAdmin: currentUser?.rol === "admin",
    isClient: currentUser?.rol === "cliente",
    isDriver: currentUser?.rol === "repartidor",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
