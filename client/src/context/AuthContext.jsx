import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("tourismhub_user");
    const savedToken = localStorage.getItem("tourismhub_token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = (userData, authToken) => {
    localStorage.setItem("tourismhub_user", JSON.stringify(userData));
    localStorage.setItem("tourismhub_token", authToken);

    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem("tourismhub_user");
    localStorage.removeItem("tourismhub_token");

    setUser(null);
    setToken(null);
  };

  const isLoggedIn = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}