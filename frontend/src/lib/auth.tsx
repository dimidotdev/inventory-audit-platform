'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Employee, AuthResponse, LoginRequest, RegisterRequest } from '@/types';

interface AuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isEmployee(value: unknown): value is Employee {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const employee = value as Record<string, unknown>;
  return (
    typeof employee.id === 'string' &&
    typeof employee.nome === 'string' &&
    typeof employee.email === 'string'
  );
}

function readStoredEmployee(): Employee | null {
  const stored = localStorage.getItem('employee');
  const token = localStorage.getItem('accessToken');
  if (!stored || !token) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return isEmployee(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Carrega o employee do localStorage no mount
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setEmployee(readStoredEmployee());
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      const { accessToken, employee: emp } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('employee', JSON.stringify(emp));
      setEmployee(emp);
      router.push('/');
    },
    [router],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { accessToken, employee: emp } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('employee', JSON.stringify(emp));
      setEmployee(emp);
      router.push('/');
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('employee');
    setEmployee(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ employee, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
