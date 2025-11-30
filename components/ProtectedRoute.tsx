import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@shared/types";

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole?: UserRole | UserRole[];
}

export function ProtectedRoute({ element, requiredRole }: ProtectedRouteProps) {
  const auth = useAuth();
  const { currentUser, isLoading } = auth;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    if (!allowedRoles.includes(currentUser.rol)) {
      return <Navigate to="/login" replace />;
    }
  }

  return element;
}
