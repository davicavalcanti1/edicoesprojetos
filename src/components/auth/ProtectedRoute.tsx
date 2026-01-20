import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean; // Deprecated in favor of allowedRoles, kept for backward compat
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, requireAdmin = false, allowedRoles = [] }: ProtectedRouteProps) {
  const { user, role, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Legacy admin check
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // New RBAC check
  if (allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      // If user is 'estoque' and tries to access something not allowed, stay in /estoque if possible or root
      // But if root is not allowed, we might loop.
      // For now, redirect to root usually works, but 'estoque' user might need special handling if they can't see root.
      // Assuming 'estoque' user has a specific dashboard at /estoque.
      if (role === 'estoque' && !allowedRoles.includes('estoque')) {
        return <Navigate to="/estoque" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
