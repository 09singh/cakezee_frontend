import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait until /auth/me finishes checking the token
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // User is not logged in
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/staff/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // User is authenticated
  return <Outlet />;
}

export default ProtectedRoute;