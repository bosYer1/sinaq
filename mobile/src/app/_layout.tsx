import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClubDataProvider } from '@/context/ClubDataContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppErrorBoundary>
        <ClubDataProvider>
          <RootNavigator />
        </ClubDataProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
    </>
  );
}
