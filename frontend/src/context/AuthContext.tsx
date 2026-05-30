import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AuthUser, Role } from '../types';
import * as authApi from '../api/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'RESTORE'; token: string | null; user: AuthUser | null }
  | { type: 'LOGIN';   token: string; user: AuthUser }
  | { type: 'LOGOUT' };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE': return { ...state, token: action.token, user: action.user, isLoading: false };
    case 'LOGIN':   return { token: action.token, user: action.user, isLoading: false };
    case 'LOGOUT':  return { token: null, user: null, isLoading: false };
    default:        return state;
  }
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { token: null, user: null, isLoading: true });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
    dispatch({ type: 'RESTORE', token, user });
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    dispatch({ type: 'LOGIN', token, user });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ token: state.token, user: state.user, role: state.user?.role ?? null, isLoading: state.isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
