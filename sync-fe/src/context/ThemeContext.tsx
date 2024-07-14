import type React from 'react';
import { createContext } from 'react';

export const ThemeContext = createContext<{
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
}>({
  theme: 'string',
  setTheme: () => {},
});

export type AuthContextData = {
  roomId: string;
  name: string;
  isCreator: boolean;
};

export const AuthContext = createContext<{
  data: AuthContextData;
  setAuthData: React.Dispatch<React.SetStateAction<AuthContextData>>;
}>({
  data: { roomId: '', name: '', isCreator: false },
  setAuthData: () => {},
});
