import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClubDataProvider } from '@/context/ClubDataContext';
import { colors } from '@/constants/theme';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <ClubDataProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="club/[slug]" options={{ title: 'Klub məlumatı', headerBackTitle: 'Geri' }} />
        </Stack>
      </ClubDataProvider>
    </AppErrorBoundary>
  );
}
