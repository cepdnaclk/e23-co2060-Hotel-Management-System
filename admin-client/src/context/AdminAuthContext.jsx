import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const savedAdmin = localStorage.getItem("tourismhub_admin_user");
    const savedToken = localStorage.getItem("tourismhub_admin_token");

    if (savedAdmin && savedToken) {
      setAdmin(JSON.parse(savedAdmin));
      setToken(savedToken);
    }

    setCheckingAuth(false);
  }, []);

  const loginAdmin = (adminData, adminToken) => {
    localStorage.setItem("tourismhub_admin_user", JSON.stringify(adminData));
    localStorage.setItem("tourismhub_admin_token", adminToken);

    setAdmin(adminData);
    setToken(adminToken);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("tourismhub_admin_user");
    localStorage.removeItem("tourismhub_admin_token");

    setAdmin(null);
    setToken(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAdminLoggedIn: Boolean(admin && token),
        checkingAuth,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};