import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const login = (data) => {
  return api.post(ENDPOINTS.AUTH.LOGIN, data);
};

export const register = (data) => {
  return api.post(ENDPOINTS.AUTH.SIGNUP, data);
};

export const forgotPassword = (email) => {
  return api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
};

export const verifyResetCode = (email, resetCode) => {
  return api.post(ENDPOINTS.AUTH.VERIFY_CODE, { email, resetCode });
};

export const resendResetCode = (email) => {
  return api.post(ENDPOINTS.AUTH.RESEND_RESET_CODE, { email });
};

export const resetPassword = (email, newPassword) => {
  return api.put(ENDPOINTS.AUTH.RESET_PASSWORD, {
    email,
    newPassword,
  });
};
