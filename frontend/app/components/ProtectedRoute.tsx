import { useContext } from 'react';
import { AuthContext } from '../providers/AuthProvider';
import { Redirect } from 'expo-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Redirect href="../auth/login" />;
  }

  return <>{children}</>;
};