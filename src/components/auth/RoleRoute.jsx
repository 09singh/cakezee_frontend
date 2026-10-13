import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

function RoleRoute({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  // Wait for authentication check
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
        <p className="text-sm text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  // Logged in but wrong role
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;