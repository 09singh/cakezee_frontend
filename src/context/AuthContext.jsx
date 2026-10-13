import { createContext, useCallback, useEffect, useState } from 'react';

import {
  requestCustomerOtp as requestCustomerOtpApi,
  verifyCustomerOtp as verifyCustomerOtpApi,
  staffLogin as staffLoginApi,
  getCurrentUser,
  logout as logoutApi,
} from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Never trust a user object from localStorage for access control. Restore
  // identity only after the server validates the saved token via /auth/me.
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem('cakezee_token'))
  );

  // Clear local authentication data
  const clearAuth = useCallback(() => {
    localStorage.removeItem('cakezee_token');
    localStorage.removeItem('cakezee_user');

    setUser(null);
  }, []);

  // Check whether existing token is still valid
  useEffect(() => {
    const token = localStorage.getItem('cakezee_token');

    if (!token) {
      return;
    }

    getCurrentUser()
      .then((response) => {
        if (localStorage.getItem('cakezee_token') !== token) {
          return;
        }

        const currentUser = response.user;

        if (!currentUser) {
          clearAuth();
          return;
        }

        setUser(currentUser);

        localStorage.setItem(
          'cakezee_user',
          JSON.stringify(currentUser)
        );
      })
      .catch(() => {
        // Fail closed if the token cannot be validated (including network or
        // server errors), otherwise a stale cached user could unlock staff routes.
        if (localStorage.getItem('cakezee_token') === token) {
          clearAuth();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clearAuth]);

  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener('cakezee:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('cakezee:unauthorized', handleUnauthorized);
    };
  }, [clearAuth]);

  // Request customer OTP
  const requestCustomerOtp = async (phone) => {
    const response = await requestCustomerOtpApi(phone);

    return response;
  };

  // Verify customer OTP and login
  const verifyCustomerOtp = async (phone, otp) => {
    const response = await verifyCustomerOtpApi(phone, otp);

    saveAuth(response);

    return response;
  };

  // Staff login
  const loginStaff = async (email, password) => {
    const response = await staffLoginApi(email, password);

    saveAuth(response);

    return response;
  };

  // Save token + user
  const saveAuth = (response) => {
    const { token, user } = response;

    if (!token || !user) {
      throw new Error('Invalid authentication response.');
    }

    localStorage.setItem('cakezee_token', token);
    localStorage.setItem('cakezee_user', JSON.stringify(user));

    setUser(user);
  };

  // Logout
  const logoutUser = async () => {
    try {
      await logoutApi();
    } catch {
      // Even if backend logout fails,
      // remove local authentication.
    } finally {
      clearAuth();
    }
  };

  const isAuthenticated = Boolean(
    user && localStorage.getItem('cakezee_token')
  );

  const value = {
    user,
    loading,
    isAuthenticated,

    requestCustomerOtp,
    verifyCustomerOtp,
    loginStaff,
    logoutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
