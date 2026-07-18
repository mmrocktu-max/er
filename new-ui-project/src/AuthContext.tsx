import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userName: string | null;
  login: (token: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_token'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('erp_user'));

  const login = (newToken: string, name: string) => {
    setToken(newToken);
    setUserName(name);
    localStorage.setItem('erp_token', newToken);
    localStorage.setItem('erp_user', name);
  };

  const logout = () => {
    setToken(null);
    setUserName(null);
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ token, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
