import api from "./axios";

export const requestEmailOtp = async (email, checkoutId) => {
  const response = await api.post("/auth/email-otp/request", { email, checkoutId });
  return response.data;
};

export const verifyEmailOtp = async (email, checkoutId, code) => {
  const response = await api.post("/auth/email-otp/verify", { email, checkoutId, code });
  return response.data;
};
