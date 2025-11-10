import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '@/lib/types';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Initialize with a mock user for demonstration
  // In a real app, this would be null until login
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: "vivas",
    fullName: "Viva",
    email: "viva@legalfirm.com",
    role: "admin",
    title: "Legal Counsel",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces"
  });

  const isAuthenticated = user !== null;

  return (
    <UserContext.Provider value={{ user, setUser, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
