import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // For development, using a mock user
  useEffect(() => {
    const mockUser: User = {
      id: 'mock-user-1',
      email: 'director@example.com',
      role: 'director',
      centerId: 'center-1',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33123456789',
      dateOfBirth: '1980-01-01',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCurrentUser(mockUser);
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}