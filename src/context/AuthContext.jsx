import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getMe } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const clearAuth = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await getMe();
      const currentUser = response?.data?.data;

      if (!currentUser) {
        throw new Error("User data was not returned by the API");
      }

      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));

      return currentUser;
    } catch (error) {
      // Clear the session only if the server rejects authentication.
      if ([401, 403].includes(error?.response?.status)) {
        clearAuth();
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {
      // Keep the app running if the API is temporarily unavailable.
    });
  }, [refreshUser]);

  const loginUser = async (token, currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));
      return currentUser;
    }

    return refreshUser();
  };
  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && getToken()),
        loading,
        refreshUser,
        loginUser,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
