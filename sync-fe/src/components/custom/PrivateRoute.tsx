import { AuthContext } from '@/context';
import type React from 'react';
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default ({ children }: { children: React.ReactNode }) => {
  const { data } = useContext(AuthContext);
  return data.roomId ? children : <Navigate to="/sign-in" replace />;
};
