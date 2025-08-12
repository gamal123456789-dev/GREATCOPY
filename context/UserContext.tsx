import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  username?: string;
  email?: string;
  role?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

interface UserProviderProps {
  children: ReactNode;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const { data: session, status } = useSession();

  // Sync with NextAuth session
  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (session?.user) {
      // User is logged in via NextAuth
      const sessionUser: User = {
        id: session.user.id || '',
        username: session.user.username || session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || 'user'
      };
      setUser(sessionUser);
    } else {
      // No session, check localStorage for manual login
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    }
  }, [session, status]);

  // Update localStorage when user changes (only for manual logins)
  useEffect(() => {
    if (user && !session?.user) {
      // Only store in localStorage if not logged in via NextAuth
      localStorage.setItem("user", JSON.stringify(user));
    } else if (!user && !session?.user) {
      localStorage.removeItem("user");
    }
  }, [user, session]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}