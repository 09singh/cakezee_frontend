import { createContext, useCallback, useEffect, useState } from "react";

import {
  staffLogin as staffLoginApi,
  getCurrentUser,
  logout as logoutApi,
} from "../api/auth.api";
import {
  clearEmailVerificationSession,
  getCheckout,
  saveCheckout,
} from "../utils/checkoutStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("cakezee_token");
    localStorage.removeItem("cakezee_user");
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const savedToken = localStorage.getItem("cakezee_token");
    const restoreSession = async () => {
      try {
        if (!savedToken) {
          if (active) setUser(null);
          return;
        }
        const response = await getCurrentUser();
        if (active && response.user) {
          setUser(response.user);
        } else if (active) {
          clearAuth();
        }
      } catch {
        if (active && localStorage.getItem("cakezee_token") === savedToken) {
          clearAuth();
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, [clearAuth]);

  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener("cakezee:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("cakezee:unauthorized", handleUnauthorized);
    };
  }, [clearAuth]);

  const saveStaffAuth = (response) => {
    const { token, user: authenticatedUser } = response;
    if (!token || !authenticatedUser || authenticatedUser.role === "customer") {
      throw new Error("Invalid staff authentication response.");
    }
    localStorage.setItem("cakezee_token", token);
    localStorage.setItem("cakezee_user", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  };

  const loginCustomer = (response) => {
    const { token, user: authenticatedUser } = response;
    if (!token || authenticatedUser?.role !== "customer") {
      throw new Error("Invalid customer authentication response.");
    }
    localStorage.setItem("cakezee_token", token);
    localStorage.setItem("cakezee_user", JSON.stringify(authenticatedUser));
    clearEmailVerificationSession();
    const checkout = getCheckout();
    if (checkout?.emailVerification) {
      saveCheckout({
        ...checkout,
        emailVerification: null,
        emailOtpRequested: false,
        emailOtpResendAt: null,
      });
    }
    setUser(authenticatedUser);
  };

  const loginStaff = async (email, password) => {
    const response = await staffLoginApi(email, password);
    saveStaffAuth(response);
    return response;
  };

  const logoutUser = async () => {
    try {
      if (localStorage.getItem("cakezee_token")) {
        await logoutApi();
      }
    } catch {
      // Local session state is cleared even when the server is unavailable.
    } finally {
      clearEmailVerificationSession();
      const checkout = getCheckout();
      if (checkout?.emailVerification) {
        saveCheckout({
          ...checkout,
          emailVerification: null,
          emailOtpRequested: false,
          emailOtpResendAt: null,
        });
      }
      clearAuth();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isCustomerAuthenticated: user?.role === "customer",
    loginStaff,
    loginCustomer,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
