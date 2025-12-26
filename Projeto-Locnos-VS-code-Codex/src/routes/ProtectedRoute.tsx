import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { UserRole } from "../types/domain";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
