import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type User } from "@/models/user";
import { authState } from "./authState";
import { initAuth } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const observer = {
      update() {
        setUser(authState.getUser());
        setIsLoading(authState.isLoading());
      },
    };
    authState.addObserver(observer);
    initAuth();
    return () => authState.removeObserver(observer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
