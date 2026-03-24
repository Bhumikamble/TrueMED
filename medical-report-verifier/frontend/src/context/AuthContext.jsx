import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchProfile } from "../services/authService";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const loadProfile = async () => {
    try {
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetchProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error("Error loading profile:", error);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

  // Login function
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setToken(token);
    setUser(userData);
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Update user function (for profile updates)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Refresh profile function
  const refreshProfile = async () => {
    await loadProfile();
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === "string") return user.role === roles;
    return roles.includes(user.role);
  };

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "patient":
        return "/dashboard";
      case "lab":
        return "/dashboard";
      case "employer":
        return "/dashboard";
      case "admin":
        return "/admin";
      default:
        return "/dashboard";
    }
  };

  // Get user display name based on role
  const getDisplayName = () => {
    if (!user) return "";
    if (user.role === "patient") return user.name;
    if (user.role === "lab") return user.hospitalName || user.name;
    if (user.role === "employer") return user.companyName || user.name;
    return user.name;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      token,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      refreshProfile,
      hasRole,
      getDashboardPath,
      getDisplayName,
    }),
    [user, loading, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};