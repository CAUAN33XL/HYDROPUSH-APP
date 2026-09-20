import React, { Suspense, lazy } from 'react';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { LoadingSpinner, InitialLoadingScreen } from './shared/components/LoadingStates';
import { useAppInitialization } from './core/hooks/useAppInitialization';

// Lazy load heavy components
const AuthFlow = lazy(() => import('./features/auth/AuthFlow').then(m => ({ default: m.AuthFlow })));
const RootLiquidGlassWrapper = lazy(() => import('./shared/layouts/RootLiquidGlassWrapper').then(m => ({ default: m.RootLiquidGlassWrapper })));

export default function App() {
  const { isReady } = useAppInitialization();

  if (!isReady) {
    return <InitialLoadingScreen />;
  }

  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <RootLiquidGlassWrapper>
              <AuthFlow />
            </RootLiquidGlassWrapper>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
