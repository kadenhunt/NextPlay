/** Global React context: query client, theme, a11y prefs, dev mode, auth. Wraps the whole app in main.tsx. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import AuthProvider from './AuthProvider'
import DevModeProvider from './DevModeProvider'
import AccessibilityProvider from './AccessibilityProvider'
import ThemeProvider from './ThemeProvider'

export default function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AccessibilityProvider>
          <DevModeProvider>
            <AuthProvider>{children}</AuthProvider>
          </DevModeProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

