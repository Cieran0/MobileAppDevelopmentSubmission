import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './providers/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import Toast from 'react-native-toast-message';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
      <SafeAreaProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Stack>
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/register" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="workout/WorkoutScreen" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ErrorBoundary>
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
  );
}