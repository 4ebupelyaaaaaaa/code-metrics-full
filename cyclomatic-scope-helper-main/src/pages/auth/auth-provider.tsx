import React, { useState, useCallback, useEffect } from "react";
import { AuthContext } from "./auth-context";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: number;
  login: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUsername(decoded.login);
        setUserId(decoded.id);
      } catch (err) {
        console.error("Ошибка декодирования токена:", err);
        setUsername("");
        setUserId(null);
      }
    } else {
      setUsername("");
      setUserId(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        login,
        logout,
        username,
        userId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
