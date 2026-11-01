import axios from "axios";
import { getEmailVerificationSession } from "../utils/checkoutStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const emailSession = getEmailVerificationSession();
    const explicitAuthorization = config.headers?.get
      ? config.headers.get("Authorization")
      : config.headers?.Authorization;
    const token = explicitAuthorization ||
      localStorage.getItem("cakezee_token") ||
      (Number(emailSession?.expiresAt) > Date.now() ? emailSession.token : null);

    if (token) {
      config.headers.Authorization = explicitAuthorization || `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (config.data && !(config.data instanceof URLSearchParams)) {
      config.headers.set
        ? config.headers.set("Content-Type", "application/json")
        : (config.headers["Content-Type"] = "application/json");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authorization = error.config?.headers?.Authorization ||
      error.config?.headers?.get?.("Authorization");
    const isLoginRequest = /\/auth\/staff\/login$/.test(
      error.config?.url || ""
    );
    const requestToken = typeof authorization === "string"
      ? authorization.replace(/^Bearer\s+/i, "")
      : null;

    if (
      error.response?.status === 401 &&
      requestToken &&
      localStorage.getItem("cakezee_token") === requestToken &&
      !isLoginRequest
    ) {
      localStorage.removeItem("cakezee_token");
      localStorage.removeItem("cakezee_user");
      window.dispatchEvent(new Event("cakezee:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
