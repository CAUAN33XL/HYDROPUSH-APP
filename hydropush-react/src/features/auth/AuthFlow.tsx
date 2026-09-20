import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth, SetupData } from '../../contexts/AuthContext';
import { storageService } from '../../core/services/StorageService';
import { criticalFlagsService } from '../../core/services/CriticalFlagsService';
import { capacitorService } from '../../core/services/CapacitorService';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { InitialSetupScreen } from './InitialSetupScreen';
import { MainApp } from '../dashboard/MainApp';
import { NotificationOnboarding } from '../onboarding/NotificationOnboarding';

// Logo path - usando URL em vez de import para evitar problemas de type declaration
const hydropushLogo = '/assets/Hydropush.png';

type AuthScreen = 'login' | 'register' | 'onboarding' | 'forgotPassword';

export function AuthFlow() {
    const { isAuthenticated, isLoading, isPreferencesReady, createUserFromSetup } = useAuth();
    const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showNotificationOnboarding, setShowNotificationOnboarding] = useState(false);
    const [showInitialSetup, setShowInitialSetup] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // ✅ FIX CRÍTICO: Usar ref para evitar re-checagem constante do onboarding
    const hasCheckedOnboarding = useRef(false);
    const previousAuthState = useRef(isAuthenticated);

    // ✅ NOVO: Verificar onboarding APENAS quando Preferences estiver pronto
    useEffect(() => {
        // Aguardar até que:
        // 1. StorageService termine de inicializar (isLoading = false)
        // 2. CriticalFlags esteja pronto (isPreferencesReady = true)
        if (isLoading || !isPreferencesReady) {
            console.log('[AuthFlow] ⏳ Waiting for initialization...', { isLoading, isPreferencesReady });
            return;
        }

        // Só verificar onboarding em duas situações:
        // 1. Primeira vez que o componente monta (!hasCheckedOnboarding)
        // 2. Quando isAuthenticated mudar (login/logout)
        const authStateChanged = previousAuthState.current !== isAuthenticated;

        if (!hasCheckedOnboarding.current || authStateChanged) {
            const checkFirstTimeUser = async () => {
                try {
                    console.log('[AuthFlow] 🔍 Checking user status...');

                    // ✅ LER DIRETAMENTE DO SOURCE OF TRUTH (Preferences)
                    const setupDone = await criticalFlagsService.getInitialSetupCompleted();
                    const onboardingDone = await criticalFlagsService.getOnboardingCompleted();
                    const notifDone = await criticalFlagsService.getNotificationOnboardingCompleted();

                    console.log('[AuthFlow] 📊 Critical flags state:', {
                        initialSetupCompleted: setupDone,
                        onboardingCompleted: onboardingDone,
                        notificationOnboardingCompleted: notifDone,
                        isAuthenticated,
                        authStateChanged
                    });

                    // Reset states first
                    setShowInitialSetup(false);
                    setShowOnboarding(false);
                    setShowNotificationOnboarding(false);

                    if (!setupDone && !isAuthenticated) {
                        console.log('[AuthFlow] ➡️ Showing initial setup');
                        setShowInitialSetup(true);
                    } else if (isAuthenticated && !onboardingDone) {
                        console.log('[AuthFlow] ➡️ Showing onboarding');
                        setShowOnboarding(true);
                    } else if (isAuthenticated && !notifDone) {
                        console.log('[AuthFlow] ➡️ Showing notification onboarding');
                        setShowNotificationOnboarding(true);
                    } else {
                        console.log('[AuthFlow] ✅ All setup done - going to MainApp');
                    }

                    // Marcar como checado
                    hasCheckedOnboarding.current = true;
                    previousAuthState.current = isAuthenticated;
                } catch (error) {
                    console.error('[AuthFlow] ❌ Error checking status:', error);
                }
            };

            checkFirstTimeUser();
        } else {
            console.log('[AuthFlow] ⏭️ Skipping onboarding check - already checked and auth state unchanged');
        }
    }, [isLoading, isPreferencesReady, isAuthenticated]);



    const handleSetupComplete = (setupData: SetupData) => {
        try {
            createUserFromSetup(setupData);
            storageService.markInitialSetupCompleted();
            setShowInitialSetup(false);
            setAuthError(null);
        } catch (error) {
            console.error('Erro no setup:', error);
            setAuthError('Erro ao criar usuário. Tente novamente.');
        }
    };

    const handleOnboardingComplete = () => {
        try {
            storageService.markOnboardingCompleted();
            setShowOnboarding(false);

            // Mostrar onboarding de notificações após onboarding principal
            const appSettings = storageService.loadAppSettings();
            if (!appSettings.notificationOnboardingComplete) {
                setShowNotificationOnboarding(true);
            }
        } catch (error) {
            console.error('Erro ao completar onboarding:', error);
            setAuthError('Erro ao salvar configurações.');
        }
    };

    const handleNotificationOnboardingComplete = async (granted: boolean) => {
        try {
            console.log(`🔔 Onboarding de notificações completo. Permissão: ${granted ? 'concedida' : 'negada'}}`);

            if (granted) {
                // Solicitar permissão nativa (Push)
                await capacitorService.requestPushPermissions();
            }

            // ✅ CRÍTICO: Salvar no SOURCE OF TRUTH (Preferences) PRIMEIRO
            console.log('[AuthFlow] 💾 Saving notification onboarding completion to Preferences...');
            await criticalFlagsService.setNotificationOnboardingCompleted(true);
            console.log('[AuthFlow] ✅ Notification onboarding flag saved to Preferences');

            // Também salvar no StorageService (backward compatibility)
            await storageService.markNotificationOnboardingCompleted();

            setShowNotificationOnboarding(false);
        } catch (error) {
            console.error('Erro ao completar onboarding de notificações:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center w-full mx-auto px-4">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <img
                        src={hydropushLogo}
                        alt="Hydropush Logo"
                        className="w-40 h-40 object-contain"
                    />
                    <p className="text-muted-foreground">Carregando Hydropush...</p>
                </motion.div>
            </div>
        );
    }

    if (showInitialSetup) {
        return <InitialSetupScreen onComplete={handleSetupComplete} error={authError ?? undefined} />;
    }

    if (isAuthenticated && showOnboarding) {
        return (
            <OnboardingScreen
                onComplete={handleOnboardingComplete}
                error={authError ?? undefined}
            />
        );
    }

    if (isAuthenticated && showNotificationOnboarding) {
        return (
            <NotificationOnboarding
                onComplete={handleNotificationOnboardingComplete}
                onSkip={() => handleNotificationOnboardingComplete(false)}
            />
        );
    }

    if (isAuthenticated) {
        return <MainApp />;
    }

    switch (currentScreen) {
        case 'register':
            return (
                <RegisterScreen
                    onSwitchToLogin={() => {
                        setCurrentScreen('login');
                        setAuthError(null);
                    }}
                    onRegisterSuccess={() => setShowOnboarding(true)}
                    error={authError ?? undefined}
                    onError={setAuthError}
                />
            );
        case 'forgotPassword':
            return (
                <ForgotPasswordScreen
                    onBack={() => {
                        setCurrentScreen('login');
                        setAuthError(null);
                    }}
                    error={authError ?? undefined}
                    onError={setAuthError}
                />
            );
        default:
            return (
                <LoginScreen
                    onSwitchToRegister={() => {
                        setCurrentScreen('register');
                        setAuthError(null);
                    }}
                    onForgotPassword={() => {
                        setCurrentScreen('forgotPassword');
                        setAuthError(null);
                    }}
                    error={authError ?? undefined}
                    onError={setAuthError}
                />
            );
    }
}
