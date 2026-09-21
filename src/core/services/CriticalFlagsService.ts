/**
 * CriticalFlagsService
 * 
 * Gerencia flags críticos do app usando APENAS localStorage como source of truth.
 * Estes flags são GARANTIDOS persistir entre sessões do app.
 * 
 * Por que usar este serviço:
 * - API simples e direta, sem cache volátil
 * - Inicialização rápida (~0ms)
 * - Source of truth único e confiável
 */
class CriticalFlagsService {
    private readonly KEY_PREFIX = 'critical_flag_';
    private initialized = false;
    private readonly MAX_RETRIES = 3;

    // Cache em memória APENAS para leitura rápida (atualizado em cada set)
    private cache = new Map<string, boolean>();

    /**
     * Helper para lidar com erros de parsing
     */
    private parseJSON(value: string | null): any {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    /**
     * Validate boolean flag value
     */
    private validateFlag(value: any): boolean {
        return typeof value === 'boolean';
    }

    /**
     * Inicializa o serviço carregando todos os flags críticos
     * DEVE ser chamado antes de usar qualquer outro método
     */
    async init(): Promise<void> {
        if (this.initialized) {
            console.log('[CriticalFlags] Already initialized');
            return;
        }

        try {
            console.log('[CriticalFlags] 🔄 Initializing...');

            // Carregar todos os flags críticos em paralelo com retry
            const [onboarding, initialSetup, notificationOnboarding] = await Promise.all([
                this.getOnboardingCompleted(),
                this.getInitialSetupCompleted(),
                this.getNotificationOnboardingCompleted()
            ]);

            console.log('[CriticalFlags] ✅ Initialized with state:', {
                onboardingCompleted: onboarding,
                initialSetupCompleted: initialSetup,
                notificationOnboardingCompleted: notificationOnboarding
            });

            this.initialized = true;
        } catch (error) {
            console.error('[CriticalFlags] ❌ Initialization error:', error);
            // GRACEFUL DEGRADATION: Não bloquear o app - marca como initialized com defaults
            this.cache.set('onboarding_completed', false);
            this.cache.set('initial_setup_completed', false);
            this.cache.set('notification_onboarding_completed', false);
            this.initialized = true;
            console.warn('[CriticalFlags] ⚠️ Running with default values due to init error');
        }
    }

    /**
     * Helper privado para ler flag do Preferences com retry
     */
    private async getFlag(key: string): Promise<boolean> {
        try {
            // Tentar ler do cache primeiro (se já foi carregado)
            if (this.cache.has(key)) {
                return this.cache.get(key)!;
            }

            const fullKey = `${this.KEY_PREFIX}${key}`;

            // Ler direto do localStorage
            const value = localStorage.getItem(fullKey);

            // Validar e parsear
            const boolValue = value === 'true';

            // Atualizar cache
            this.cache.set(key, boolValue);

            return boolValue;
        } catch (error) {
            console.error(`[CriticalFlags] ❌ Error reading ${key}:`, error);
            // Default seguro: retornar false e cachear
            this.cache.set(key, false);
            return false;
        }
    }

    /**
     * Helper privado para salvar flag no Preferences com retry
     */
    private async setFlag(key: string, value: boolean): Promise<void> {
        try {
            // Validar input
            if (!this.validateFlag(value)) {
                throw new Error(`Invalid flag value: ${value}`);
            }

            const fullKey = `${this.KEY_PREFIX}${key}`;

            // Salvar no localStorage
            localStorage.setItem(fullKey, value.toString());

            // Atualizar cache APÓS sucesso
            this.cache.set(key, value);

            console.log(`[CriticalFlags] ✅ Set ${key} = ${value}`);
        } catch (error) {
            console.error(`[CriticalFlags] ❌ Error writing ${key}:`, error);
            throw error; // Re-throw para que o caller saiba que falhou
        }
    }

    // ===== ONBOARDING COMPLETED =====

    /**
     * Verifica se o onboarding principal foi completado
     * Este é o onboarding de 4 passos (meta, tema, notificações, email)
     */
    async getOnboardingCompleted(): Promise<boolean> {
        return this.getFlag('onboarding_completed');
    }

    /**
     * Marca o onboarding principal como completado
     */
    async setOnboardingCompleted(value: boolean): Promise<void> {
        await this.setFlag('onboarding_completed', value);
    }

    // ===== INITIAL SETUP COMPLETED =====

    /**
     * Verifica se o setup inicial foi completado
     * Este é o setup de perfil (nome, peso, altura, etc)
     */
    async getInitialSetupCompleted(): Promise<boolean> {
        return this.getFlag('initial_setup_completed');
    }

    /**
     * Marca o setup inicial como completado
     */
    async setInitialSetupCompleted(value: boolean): Promise<void> {
        await this.setFlag('initial_setup_completed', value);
    }

    // ===== NOTIFICATION ONBOARDING COMPLETED =====

    /**
     * Verifica se o onboarding de notificações foi completado
     * Este é o onboarding separado que aparece depois do onboarding principal
     */
    async getNotificationOnboardingCompleted(): Promise<boolean> {
        return this.getFlag('notification_onboarding_completed');
    }

    /**
     * Marca o onboarding de notificações como completado
     */
    async setNotificationOnboardingCompleted(value: boolean): Promise<void> {
        await this.setFlag('notification_onboarding_completed', value);
    }

    // ===== UTILITY METHODS =====

    /**
     * Reseta TODOS os flags críticos (útil para testing/debug)
     * ⚠️ CUIDADO: Isso vai resetar o app para primeiro uso
     */
    async resetAllFlags(): Promise<void> {
        console.warn('[CriticalFlags] ⚠️ RESETTING ALL FLAGS');
        await Promise.all([
            this.setOnboardingCompleted(false),
            this.setInitialSetupCompleted(false),
            this.setNotificationOnboardingCompleted(false)
        ]);
        this.cache.clear();
    }

    /**
     * Obtém todos os flags atuais (útil para debug)
     */
    async getAllFlags(): Promise<{
        onboardingCompleted: boolean;
        initialSetupCompleted: boolean;
        notificationOnboardingCompleted: boolean;
    }> {
        return {
            onboardingCompleted: await this.getOnboardingCompleted(),
            initialSetupCompleted: await this.getInitialSetupCompleted(),
            notificationOnboardingCompleted: await this.getNotificationOnboardingCompleted()
        };
    }

    /**
     * Verifica se o serviço foi inicializado
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Export singleton
export const criticalFlagsService = new CriticalFlagsService();
