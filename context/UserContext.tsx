import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  image?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUserData: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

interface UserProviderProps {
  children: ReactNode;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  // Function to refresh user data from session
  const refreshUser = async () => {
    try {
      if (session?.user) {
        const sessionUser: User = {
          id: session.user.id || '',
          username: session.user.username || session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || 'user',
          isAdmin: session.user.role === 'admin',
          emailVerified: true, // NextAuth sessions are considered verified
          image: session.user.image || undefined
        };
        setUser(sessionUser);
        console.log('[UserContext] User data refreshed from session:', sessionUser.email);
      }
    } catch (error) {
      console.error('[UserContext] Error refreshing user data:', error);
    }
  };

  // Sync with NextAuth session
  useEffect(() => {
    const syncUserData = async () => {
      setIsLoading(true);
      
      try {
        if (status === "loading") {
          return; // Still loading session
        }
        
        if (session?.user) {
          // User is logged in via NextAuth
          const sessionUser: User = {
            id: session.user.id || '',
            username: session.user.username || session.user.name || '',
            email: session.user.email || '',
            role: session.user.role || 'user',
            isAdmin: session.user.role === 'admin',
            emailVerified: true, // NextAuth sessions are considered verified
            image: session.user.image || undefined
          };
          setUser(sessionUser);
          
          // Clear any localStorage data since we have a valid session
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
          }
          
          console.log('[UserContext] User authenticated via NextAuth:', sessionUser.email);
        } else {
          // No session, check localStorage for fallback (legacy support)
          if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                console.log('[UserContext] User loaded from localStorage:', parsedUser.email);
              } catch (error) {
                console.error('[UserContext] Error parsing stored user data:', error);
                localStorage.removeItem('user');
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[UserContext] Error syncing user data:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    syncUserData();
  }, [session, status]);

  // Update localStorage when user changes (only for manual logins)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user && !session?.user) {
        // Only store in localStorage if not logged in via NextAuth
        try {
          localStorage.setItem("user", JSON.stringify(user));
        } catch (error) {
          console.error('[UserContext] Error storing user data:', error);
        }
      } else if (!user && !session?.user) {
        localStorage.removeItem("user");
      }
    }
  }, [user, session]);

  // Enhanced logout cleanup function
  const clearUserData = () => {
    console.log('[UserContext] Clearing user data');
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('userPreferences');
        sessionStorage.clear();
        
        // Clear any cached data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('user_') || key.startsWith('auth_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('[UserContext] Error clearing user data:', error);
      }
    }
  };
return (
    <UserContext.Provider value={{ user, setUser, clearUserData, isLoading, refreshUser }}>
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