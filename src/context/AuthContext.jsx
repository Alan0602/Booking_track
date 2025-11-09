import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const DEMO_ADMINS = [
  { email: "adminakshay@compass.com", password: "admin123", name: "Compass Admin1" },
  { email: "adminhari@compass.com", password: "admin123", name: "Compass Admin2" },
   { email: "adminantony@compass.com", password: "admin123", name: "Compass Admin3" },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // ← NEW
  const navigate = useNavigate();

  // ---- 1. Restore user synchronously on first render ----
  useEffect(() => {
    const saved = localStorage.getItem("authUser");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (_) {
        // corrupted → ignore
      }
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const found = DEMO_ADMINS.find(
      (a) => a.email === email && a.password === password
    );
    if (!found) {
      alert("Invalid credentials. Please try again.");
      return false;
    }

    setUser(found);
    localStorage.setItem("authUser", JSON.stringify(found));
    navigate("/");
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
    navigate("/signin");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);