import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

const AuthContext = createContext();

// Supabase-backed authentication context

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session and subscribe to changes
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setUser(sessionData?.session?.user ?? null);
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      sub.subscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message || "Invalid credentials");
    }
    setUser(data.user);
    navigate("/");
    return true;
  };

  const logout = () => {
    supabase.auth.signOut().finally(() => {
      setUser(null);
      navigate("/signin");
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);