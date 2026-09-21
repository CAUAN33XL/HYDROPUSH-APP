import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Droplets, BarChart3, User, BookOpen, Settings, AlertCircle, Gamepad2, Map } from 'lucide-react';
import { MinigamesHub } from '../minigames/MinigamesHub';
import { MetaverseWorld } from '../metaverse/MetaverseWorld';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { HydrationDashboard } from './HydrationDashboard';
import { StatsView } from '../stats/StatsView';
import { ProfileViewNew as ProfileView } from '../profile/ProfileViewNew';
import { HistoryView } from '../history/HistoryView';
import { SettingsView } from '../profile/SettingsView';
import { OfflineIndicator } from '../../shared/components/OfflineIndicator';
import { PenaltyAlertModal } from '../../shared/components/PenaltyAlertModal';
import { DesktopDock, BottomNav, TopHeader } from './components/layout';
import { storageService } from '../../core/services/StorageService';
import type { HydrationDay, HydrationEntry, UserStats } from '../../core/services/StorageService';
import type { TabType } from './components/layout/Sidebar';


interface HydrationData {
    currentAmount: number;
    dailyGoal: number;
    userName: string;
}

// Componente principal da aplicação autenticada
export function MainApp() {
    const { user } = useAuth();

    // ✅ Restaurar última tab ativa quando app inicializa
    const getInitialTab = (): TabType => {
        const lastView = storageService.loadLastActiveView();
        if (lastView && ['home', 'stats', 'history', 'profile', 'settings'].includes(lastView)) {
            return lastView as TabType;
        }
        return 'home';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hydrationData, setHydrationData] = useState<HydrationData>({
        currentAmount: 0,
        dailyGoal: user?.dailyGoalMl || 2000,
        userName: user?.name || 'Usuário'
    });
    const [history, setHistory] = useState<HydrationDay[]>([]);
    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
        storageService.saveLastActiveView(tab);
    }, []);

    // Estado para o modal de penalidade
    const [penaltyAlert, setPenaltyAlert] = useState<{
        isOpen: boolean;
        penaltyXp: number;
        missedDaysCount: number;
    }>({
        isOpen: false,
        penaltyXp: 0,
        missedDaysCount: 0
    });

    const loadInitialData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const today = new Date().toLocaleDateString('en-CA');
            const dailyGoal = storageService.loadDailyGoal();
            const todayEntries = storageService.loadHydrationEntries(today);
            const currentAmount = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
            const loadedHistory = storageService.loadHydrationHistory();

            setHydrationData({
                currentAmount,
                dailyGoal,
                userName: user?.name || 'Usuário'
            });
            setHistory(loadedHistory);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError('Erro ao carregar dados. Tente recarregar a página.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadInitialData();
        // ✅ Listener para sincronizar meta diária quando mudar no perfil
        const unsubscribeGoal = storageService.subscribe('user_daily_goal', (newGoal) => {
            if (newGoal && typeof newGoal === 'number') {
                setHydrationData(prev => ({
                    ...prev,
                    dailyGoal: newGoal
                }));
                console.log('📊 Meta diária atualizada:', (newGoal / 1000).toFixed(1) + 'L');
            }
        });

        // ✅ Listener para quando app volta do background
        const handleAppResume = () => {
            console.log('[MainApp] App resumed, refreshing data...');
            // Apenas atualizar dados, NÃO resetar navegação
            loadInitialData();
        };

        window.addEventListener('app:resumed', handleAppResume);

        return () => {
            unsubscribeGoal();
            window.removeEventListener('app:resumed', handleAppResume);
        };
    }, [loadInitialData]);

    // Listener para penalidades (Hardcore mode)
    useEffect(() => {
        const handlePenaltyApplied = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { penaltyXp, missedDays } = customEvent.detail;
            
            setPenaltyAlert({
                isOpen: true,
                penaltyXp,
                missedDaysCount: missedDays
            });
        };
        
        window.addEventListener('penalty:applied', handlePenaltyApplied);
        
        return () => {
            window.removeEventListener('penalty:applied', handlePenaltyApplied);
        };
    }, []);

    const userStats = useMemo((): UserStats => {
        return storageService.calculateUserStats(history);
    }, [history]);

    const addDrink = useCallback(async (drinkAmount: number) => {
        try {
            setError(null);
            const previousAmount = hydrationData.currentAmount;
            const newAmount = Math.min(hydrationData.currentAmount + drinkAmount, hydrationData.dailyGoal * 1.5);

            setHydrationData(prev => ({
                ...prev,
                currentAmount: newAmount
            }));

            const today = new Date().toLocaleDateString('en-CA');
            const timestamp = new Date().toISOString();
            const entry: HydrationEntry = {
                timestamp,
                amount: drinkAmount,
                type: 'manual'
            };

            storageService.addHydrationEntry(today, entry);
            storageService.updateHistoryDay(today, newAmount, hydrationData.dailyGoal);

            const updatedHistory = storageService.loadHydrationHistory();
            setHistory(updatedHistory);

            // Feedback tátil igual ao protótipo
            // if (navigator.vibrate) {
            //    navigator.vibrate(50);
            // }

            const hasReachedGoal = previousAmount < hydrationData.dailyGoal && newAmount >= hydrationData.dailyGoal;
            if (hasReachedGoal) {
                toast.success('🎉 Parabéns! Meta diária alcançada!', {
                    description: 'Você está mantendo uma ótima hidratação!',
                    duration: 5000,
                });
                
                // Pagar dívida se tiver (100 XP por dia batido)
                const reduced = storageService.reduceDailyPenalty(100);
                if (reduced > 0) {
                     toast.success('Dívida Paga!', {
                         description: `Você recuperou sua consistência e reduziu a penalidade em ${reduced} XP!`,
                         duration: 6000,
                     });
                }
            }
        } catch (err) {
            console.error('Erro ao adicionar bebida:', err);
            setError('Erro ao salvar o consumo. Tente novamente.');
            setHydrationData(prev => ({
                ...prev,
                currentAmount: prev.currentAmount - drinkAmount
            }));
        }
    }, [hydrationData.currentAmount, hydrationData.dailyGoal]);


    const resetToday = useCallback(async () => {
        try {
            setError(null);
            const today = new Date().toLocaleDateString('en-CA');
            storageService.saveHydrationEntries(today, []);
            storageService.updateHistoryDay(today, 0, hydrationData.dailyGoal);

            setHydrationData(prev => ({
                ...prev,
                currentAmount: 0
            }));

            const updatedHistory = storageService.loadHydrationHistory();
            setHistory(updatedHistory);
        } catch (err) {
            console.error('Erro ao resetar dados:', err);
            setError('Erro ao resetar dados do dia. Tente novamente.');
        }
    }, [hydrationData.dailyGoal]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando dados...</p>
                    </motion.div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-destructive/10 border border-destructive rounded-lg p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={20} className="text-destructive" />
                            <h3 className="font-semibold text-destructive">Erro</h3>
                        </div>
                        <p className="text-sm text-destructive mb-4">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-sm bg-destructive text-destructive-foreground px-3 py-1 rounded-md hover:bg-destructive/90 transition-colors"
                        >
                            Fechar
                        </button>
                    </motion.div>
                </div>
            );
        }

        switch (activeTab) {
            case 'home':
                return (
                    <HydrationDashboard
                        data={hydrationData}
                        onAddDrink={addDrink}
                        onReset={resetToday}
                        isLoading={isLoading}
                    />
                );
            case 'stats':
                return (
                    <StatsView
                        data={hydrationData}
                        history={history}
                        userStats={userStats}
                    />
                );
            case 'history':
                return (
                    <HistoryView />
                );
            case 'profile':
                return (
                    <ProfileView />
                );
            case 'settings':
                return (
                    <SettingsView onNavigate={handleTabChange} />
                );
            case 'minigames':
                return (
                    <MinigamesHub />
                );
            case 'metaverse':
                return (
                    <div className="w-full h-full relative" style={{ minHeight: 'calc(100vh - 180px)' }}>
                         <MetaverseWorld onNavigate={handleTabChange} hydrationData={hydrationData} />
                    </div>
                );
            default:
                return (
                    <HydrationDashboard
                        data={hydrationData}
                        onAddDrink={addDrink}
                        onReset={resetToday}
                        isLoading={isLoading}
                    />
                );
        }
    };

    const navigationItems = [
        { id: 'home', icon: Droplets, label: 'Início' },
        { id: 'stats', icon: BarChart3, label: 'Progresso' },
        { id: 'minigames', icon: Gamepad2, label: 'Fliperama' },
        { id: 'history', icon: BookOpen, label: 'Histórico' },
        { id: 'profile', icon: User, label: 'Perfil' },
        { id: 'settings', icon: Settings, label: 'Configurações' },
    ] as const;

    return (
        <div className="h-[100dvh] bg-background flex flex-col w-full mx-auto relative overflow-hidden">
            <OfflineIndicator />

            {/* Main Container */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden">
                {/* Header com saudação personalizada */}
                {user && (
                    <TopHeader 
                        userName={user.name} 
                        dailyGoal={hydrationData.dailyGoal} 
                    />
                )}

                {/* Main Content - Scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto pb-24 relative">
                    <div className="max-w-5xl mx-auto w-full pt-4 min-h-full">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.22, 1, 0.36, 1]
                            }}
                            className="min-h-full"
                        >
                            {renderContent()}
                        </motion.div>
                    </div>
                </div>
            </div>

            <BottomNav 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                items={navigationItems} 
            />

            <DesktopDock 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                items={navigationItems} 
            />
            
            <PenaltyAlertModal
                isOpen={penaltyAlert.isOpen}
                onClose={() => setPenaltyAlert(prev => ({ ...prev, isOpen: false }))}
                penaltyXp={penaltyAlert.penaltyXp}
                missedDaysCount={penaltyAlert.missedDaysCount}
            />
        </div>
    );
}
