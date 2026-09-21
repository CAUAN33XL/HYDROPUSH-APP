// src/services/storageService.ts

// ===== IMPORTS & EXPORTS =====
import { HydrationEntry, HydrationDay } from '../models/Hydration';
import { UserSettings, AppSettings } from '../models/Settings';
import { UserStats } from '../models/UserStats';
import { ColorTheme, ThemingSettings } from '../models/Theme';
import { AuthData } from '../models/Auth';
import { Tip } from '../models/Tip';
import { FeedbackData } from '../models/Feedback';

export type {
  HydrationEntry, HydrationDay,
  UserSettings, AppSettings,
  UserStats,
  ColorTheme, ThemingSettings,
  AuthData,
  Tip,
  FeedbackData
};

// Chaves do localStorage/Preferences
const STORAGE_KEYS = {
  HYDRATION_ENTRIES: (date: string) => `hydration_entries_${date}`,
  HYDRATION_HISTORY: 'hydration_history',
  USER_DAILY_GOAL: 'user_daily_goal',
  USER_SETTINGS: 'user_settings',
  APP_SETTINGS: 'app_settings',
  AUTH_DATA: 'auth_data',
  COLOR_THEMES: 'color_themes',
  THEMING_SETTINGS: 'theming_settings',
  BACKUP_DATA: 'backup_data',
  NOTIFICATION_SETTINGS: 'notification_settings',
  USER_STATS: 'user_stats',
  TIPS_HISTORY: 'tips_history',
  FEEDBACK_DATA: 'feedback_data',
  APP_FEEDBACK: 'app_feedback',
  USER_PHOTO: 'user_photo',
} as const;

class StorageService {
  // ===== MÉTODOS GENÉRICOS =====
  // Cache em memória para acesso síncrono rápido
  private memoryCache: Map<string, any> = new Map();
  private backupCache: Map<string, any> = new Map(); // Backup para recovery
  private initialized: boolean = false;
  private writeQueue = new Map<string, number>();
  private failedWrites: Map<string, { value: any; retries: number }> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly MAX_CACHE_SIZE_MB = 50;
  private degradedMode = false;

  // ===== UTILITY METHODS =====

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = this.MAX_RETRIES
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        if (isLastAttempt) {
          console.error(`[StorageService] ❌ ${operationName} failed after ${maxRetries} attempts:`, error);
          throw error;
        }

        const backoffMs = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
        console.warn(`[StorageService] ⚠️ ${operationName} attempt ${attempt + 1} failed, retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    throw new Error(`${operationName} failed after ${maxRetries} retries`);
  }

  /**
   * Validate JSON data structure
   */
  private validateData(data: any, key: string): boolean {
    try {
      // Basic validation
      if (data === null || data === undefined) return false;

      // Type-specific validation
      if (key === STORAGE_KEYS.USER_DAILY_GOAL) {
        return typeof data === 'number' && data > 0 && data <= 10000;
      }

      if (key === STORAGE_KEYS.HYDRATION_HISTORY) {
        return Array.isArray(data) && data.length <= 90;
      }

      if (key.startsWith('hydration_entries_')) {
        return Array.isArray(data);
      }

      // Object validation
      if (typeof data === 'object') {
        return JSON.stringify(data).length < 1024 * 1024; // Max 1MB per item
      }

      return true;
    } catch (e) {
      console.warn(`[StorageService] Validation failed for ${key}:`, e);
      return false;
    }
  }

  /**
   * Detect data corruption
   */
  private isCorrupted(value: string): boolean {
    try {
      // Check for incomplete JSON
      if (value.startsWith('{') && !value.endsWith('}')) return true;
      if (value.startsWith('[') && !value.endsWith(']')) return true;

      // Try parsing
      JSON.parse(value);
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Monitor memory usage
   */
  private checkMemoryPressure(): void {
    try {
      const cacheSize = JSON.stringify(Array.from(this.memoryCache.entries())).length;
      const cacheSizeMB = cacheSize / (1024 * 1024);

      if (cacheSizeMB > this.MAX_CACHE_SIZE_MB) {
        console.warn(`[StorageService] ⚠️ Memory pressure detected: ${cacheSizeMB.toFixed(2)}MB`);
        this.cleanupOldEntries();
      }
    } catch (e) {
      console.error('[StorageService] Memory check failed:', e);
    }
  }

  /**
   * Cleanup old hydration entries to free memory
   */
  private cleanupOldEntries(): void {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const [key] of this.memoryCache) {
        if (key.startsWith('hydration_entries_')) {
          const dateStr = key.replace('hydration_entries_', '');
          const entryDate = new Date(dateStr);

          if (entryDate < thirtyDaysAgo) {
            this.memoryCache.delete(key);
            console.log(`[StorageService] 🧹 Cleaned up old entry: ${key}`);
          }
        }
      }
    } catch (e) {
      console.error('[StorageService] Cleanup failed:', e);
    }
  }

  /**
   * Create backup of critical data
   */
  private backupCriticalData(key: string, value: any): void {
    try {
      // Only backup critical keys
      const criticalKeys = [
        STORAGE_KEYS.APP_SETTINGS,
        STORAGE_KEYS.USER_SETTINGS,
        STORAGE_KEYS.AUTH_DATA,
        STORAGE_KEYS.USER_DAILY_GOAL
      ] as const;

      if (criticalKeys.some(k => k === key)) {
        this.backupCache.set(key, JSON.parse(JSON.stringify(value))); // Deep clone
      }
    } catch (e) {
      console.warn('[StorageService] Backup creation failed:', e);
    }
  }

  /**
   * Restore from backup
   */
  private restoreFromBackup(key: string): any | null {
    try {
      const backup = this.backupCache.get(key);
      if (backup) {
        console.log(`[StorageService] 🔄 Restored ${key} from backup`);
        return backup;
      }
      return null;
    } catch (e) {
      console.error('[StorageService] Backup restore failed:', e);
      return null;
    }
  }

  // Inicialização: Carrega tudo para a memória ao abrir o app
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[StorageService] 🔄 Initializing with localStorage...');

      // 1. Carregar TODAS as chaves do localStorage com retry (não é necessário retry para localStorage síncrono, mas manteremos o pattern)
      const keys = Object.keys(localStorage);

      // 2. Carregar valores em paralelo com validação
      const loadPromises = keys.map(async (key) => {
        try {
          const value = localStorage.getItem(key);

          if (value) {
            // Detectar corrupção
            if (this.isCorrupted(value)) {
              console.warn(`[StorageService] ⚠️ Corrupted data detected for ${key}, attempting recovery...`);
              const backup = this.restoreFromBackup(key);
              if (backup) {
                this.memoryCache.set(key, backup);
                return;
              }
              // Se não tem backup, pular este item
              console.error(`[StorageService] ❌ No backup available for ${key}`);
              return;
            }

            try {
              // Tentar fazer parse do JSON
              const parsed = JSON.parse(value);

              // Validar dados
              if (this.validateData(parsed, key)) {
                this.memoryCache.set(key, parsed);
                this.backupCriticalData(key, parsed); // Criar backup de dados válidos
              } else {
                console.warn(`[StorageService] ⚠️ Invalid data for ${key}, using backup or default`);
                const backup = this.restoreFromBackup(key);
                if (backup) {
                  this.memoryCache.set(key, backup);
                }
              }
            } catch {
              // Se não for JSON, salvar como string mesmo (casos legados ou flags simples)
              this.memoryCache.set(key, value);
            }
          }
        } catch (error) {
          console.error(`[StorageService] Failed to load ${key}:`, error);
          // Continuar carregando outros itens mesmo se um falhar
        }
      });

      await Promise.all(loadPromises);

      // 3. Carregar flags críticas (garantia extra)
      await this.loadInitialPreferences();

      // 4. Check memory pressure
      this.checkMemoryPressure();

      // Avaliar penalidades do modo hardcore
      this.evaluateDailyPenalties();

      this.initialized = true;
      this.degradedMode = false;
      console.log(`[StorageService] ✅ Initialized! Loaded ${this.memoryCache.size} items into memory.`);

      // Retry failed writes periodically
      this.startFailedWriteRetry();

    } catch (error) {
      console.error('[StorageService] ❌ Fatal initialization error:', error);

      // GRACEFUL DEGRADATION: permitir app rodar em modo degradado
      this.degradedMode = true;
      this.initialized = true;

      console.warn('[StorageService] ⚠️ Running in DEGRADED MODE - data will be memory-only until storage recovers');
    }
  }

  /**
   * Retry failed writes periodically
   */
  private startFailedWriteRetry(): void {
    setInterval(() => {
      if (this.failedWrites.size > 0) {
        console.log(`[StorageService] 🔄 Retrying ${this.failedWrites.size} failed writes...`);

        for (const [key, { value, retries }] of this.failedWrites) {
          if (retries < this.MAX_RETRIES) {
            this.setItem(key, value, true); // Immediate retry
            this.failedWrites.set(key, { value, retries: retries + 1 });
          } else {
            console.error(`[StorageService] ❌ Giving up on ${key} after ${this.MAX_RETRIES} retries`);
            this.failedWrites.delete(key);
          }
        }
      }
    }, 10000); // Retry every 10 seconds
  }

  private dispatchStorageChange(key: string, value: unknown | null) {
    try {
      const ev = new CustomEvent('storage:changed', { detail: { key, value } });
      window.dispatchEvent(ev);
    } catch {
      // ignore
    }
  }

  // Leitura Síncrona (lê do cache de memória)
  private getItem<T>(key: string): T | null {
    return this.memoryCache.get(key) || null;
  }

  // Escrita Assíncrona (salva no Preferences e atualiza cache)
  private setItem(key: string, value: unknown, immediate = false): void {
    // 1. Validate data before saving
    if (!this.validateData(value, key)) {
      console.error(`[StorageService] ❌ Invalid data for ${key}, not saving`);
      return;
    }

    // 2. Atualiza memória imediatamente (para a UI reagir rápido)
    this.memoryCache.set(key, value);

    // 3. Create backup of critical data
    this.backupCriticalData(key, value);

    // 4. Dispara evento para atualizar UI (React)
    this.dispatchStorageChange(key, value);

    // 5. Função de persistência com retry
    const write = async () => {
      try {
        if (this.degradedMode) {
          console.warn(`[StorageService] ⚠️ Degraded mode - ${key} saved to memory only`);
          return;
        }

        const stringValue = JSON.stringify(value);

        // Salvar no localStorage (síncrono)
        localStorage.setItem(key, stringValue);

        // Success - remove from failed writes if it was there
        this.failedWrites.delete(key);

      } catch (error) {
        console.error(`[StorageService] ❌ Failed to save ${key} after retries:`, error);

        // Track failed write for later retry
        if (!this.failedWrites.has(key)) {
          this.failedWrites.set(key, { value, retries: 0 });
          console.log(`[StorageService] 📝 Queued ${key} for retry`);
        }
      }
    };

    // 6. Debounce writes (evitar IO excessivo em sliders/inputs rápidos)
    if (immediate) {
      write();
      return;
    }

    if (this.writeQueue.has(key)) {
      clearTimeout(this.writeQueue.get(key));
    }

    const t = window.setTimeout(() => {
      write();
      this.writeQueue.delete(key);
    }, 180); // 180ms debounce

    this.writeQueue.set(key, t);
  }

  private async removeItem(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.dispatchStorageChange(key, null);
    localStorage.removeItem(key);
  }

  async clearAllData(): Promise<void> {
    this.memoryCache.clear();
    try {
      localStorage.clear();
      this.dispatchStorageChange('all', null);
      console.log('[StorageService] 🧹 All data cleared');
    } catch (error) {
      console.error('[StorageService] Error clearing data:', error);
    }
  }

  // ===== GOD MODE =====
  enableGodMode(): void {
    const history: HydrationDay[] = [];
    const today = new Date();

    // Persistir flag do Modo Deus
    this.saveAppSettings({ godMode: true });
    
    // Generate 35 perfect days to unlock 30-day streak achievements and Minigames
    for (let i = 0; i <= 35; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-CA');
      
      history.push({
        date: dateStr,
        amount: 2500,
        goal: 2000,
        entries: [{
          id: `god-mode-${i}`,
          amount: 2500,
          timestamp: date.toISOString(),
          drinkType: 'water'
        }]
      });
    }
    
    this.saveHydrationHistory(history);
    
    // Reset any penalties
    const stats = this.getItem<UserStats>(STORAGE_KEYS.USER_STATS);
    if (stats) {
      stats.totalPenaltyXp = 0;
      this.setItem(STORAGE_KEYS.USER_STATS, stats);
    }
    
    this.dispatchStorageChange('all', null);
    console.log('🌟 GOD MODE ACTIVATED: 35 perfect days injected!');
  }

  // Verifica se o Modo Deus está ativo (desbloqueia todos os minigames)
  isGodModeEnabled(): boolean {
    return this.loadAppSettings().godMode === true;
  }

  // Permite que partes da aplicação escutem mudanças locais no storage
   
  subscribe(key: string, cb: (_value: unknown | null) => void) {
    const handler = (e: Event) => {
      const ev = e as CustomEvent;
      if (!ev?.detail) return;
      if (ev.detail.key === key) cb(ev.detail.value);
    };

    window.addEventListener('storage:changed', handler);
    return () => {
      window.removeEventListener('storage:changed', handler);
    };
  }

  // ===== DADOS DE HIDRATAÇÃO =====

  // Salvar entradas do dia
  saveHydrationEntries(date: string, entries: HydrationEntry[]): void {
    this.setItem(STORAGE_KEYS.HYDRATION_ENTRIES(date), entries);
  }

  // Carregar entradas do dia
  loadHydrationEntries(date: string): HydrationEntry[] {
    return this.getItem<HydrationEntry[]>(STORAGE_KEYS.HYDRATION_ENTRIES(date)) || [];
  }

  // Adicionar uma entrada ao dia
  addHydrationEntry(date: string, entry: HydrationEntry): void {
    const entries = this.loadHydrationEntries(date);
    entries.push(entry);
    this.saveHydrationEntries(date, entries);
  }

  // Calcular total do dia
  getDailyTotal(date: string): number {
    const entries = this.loadHydrationEntries(date);
    return entries.reduce((total, entry) => total + entry.amount, 0);
  }

  // Obter a última entrada de hidratação (de qualquer dia)
  getLastHydrationEntry(): { date: string; entry: HydrationEntry } | null {
    try {
      // Verificar hoje
      const today = new Date().toLocaleDateString('en-CA');
      const todayEntries = this.loadHydrationEntries(today);

      if (todayEntries.length > 0) {
        // Retornar a última de hoje
        const lastEntry = todayEntries[todayEntries.length - 1];
        return { date: today, entry: lastEntry };
      }

      // Se não tem hoje, verificar histórico recente
      const history = this.loadHydrationHistory();
      if (history.length > 0) {
        // O histórico já deve estar ordenado ou podemos pegar o primeiro
        const lastDay = history[0]; // Assumindo que o primeiro é o mais recente
        if (lastDay.entries && lastDay.entries.length > 0) {
          const lastEntry = lastDay.entries[lastDay.entries.length - 1];
          return { date: lastDay.date, entry: lastEntry };
        }
      }

      return null;
    } catch (error) {
      console.error('[StorageService] Error getting last hydration entry:', error);
      return null;
    }
  }

  // ===== HISTÓRICO =====

  // Salvar histórico
  saveHydrationHistory(history: HydrationDay[]): void {
    this.setItem(STORAGE_KEYS.HYDRATION_HISTORY, history);
  }

  // Carregar histórico
  loadHydrationHistory(): HydrationDay[] {
    return this.getItem<HydrationDay[]>(STORAGE_KEYS.HYDRATION_HISTORY) || [];
  }

  // Atualizar dia no histórico
  updateHistoryDay(date: string, amount: number, goal: number): void {
    const history = this.loadHydrationHistory();
    const existingDayIndex = history.findIndex(day => day.date === date);

    if (existingDayIndex >= 0) {
      history[existingDayIndex] = {
        ...history[existingDayIndex],
        amount,
        goal
      };
    } else {
      history.unshift({
        date,
        amount,
        goal,
        entries: this.loadHydrationEntries(date)
      });
    }

    // Manter apenas últimos 90 dias para performance
    const limitedHistory = history.slice(0, 90);
    this.saveHydrationHistory(limitedHistory);
  }

  // ===== CONFIGURAÇÕES DO USUÁRIO =====

  // Salvar meta diária
  saveDailyGoal(goal: number): void {
    this.setItem(STORAGE_KEYS.USER_DAILY_GOAL, goal);
  }

  // Carregar meta diária
  loadDailyGoal(): number {
    return this.getItem<number>(STORAGE_KEYS.USER_DAILY_GOAL) || 2000;
  }

  // Salvar configurações do usuário
  saveUserSettings(settings: Partial<UserSettings>): void {
    const currentSettings = this.loadUserSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      lastNotificationCheck: settings.notificationPermission ? new Date().toISOString() : currentSettings.lastNotificationCheck
    };

    this.setItem(STORAGE_KEYS.USER_SETTINGS, updatedSettings);
  }

  // Carregar configurações do usuário
  loadUserSettings(): UserSettings {
    const defaultSettings: UserSettings = {
      notifications: false,
      reminderInterval: 120,
      quietHours: { start: '22:00', end: '07:00' },
      weekendReminders: true,
      smartReminders: true,

      soundEnabled: true,
      hapticFeedback: true,
      notificationPermission: 'default',
      lastNotificationCheck: new Date().toISOString()
    };

    return this.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS) || defaultSettings;
  }


  // ===== CONFIGURAÇÕES DO APP =====

  // Salvar configurações do app
  saveAppSettings(settings: Partial<AppSettings>): void {
    const currentSettings = this.loadAppSettings();
    this.setItem(STORAGE_KEYS.APP_SETTINGS, {
      ...currentSettings,
      ...settings
    });
  }

  // Carregar configurações do app
  loadAppSettings(): AppSettings {
    const defaultSettings: AppSettings = {
      theme: 'auto',
      colorTheme: 'blue',
      completedOnboarding: false,
      completedInitialSetup: false,
      firstTimeUser: true,
      language: 'pt-BR',
      fontSize: 'medium',
      reducedMotion: false,
      backupFrequency: 'weekly'
    };

    return this.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS) || defaultSettings;
  }

  // Helper to load initial preferences (Sync with CriticalFlags)
  private async loadInitialPreferences(): Promise<void> {
    try {
      // Carregar do localStorage (fonte da verdade persistente)
      const prefCompletedOnboarding = localStorage.getItem('critical_flag_onboarding_completed');
      const prefCompletedInitialSetup = localStorage.getItem('critical_flag_initial_setup_completed');
      const prefNotificationOnboardingComplete = localStorage.getItem('critical_flag_notification_onboarding_completed');

      const currentSettings = this.loadAppSettings();
      const newSettings = { ...currentSettings };
      let changed = false;

      // Sincronizar flags críticos com AppSettings
      if (prefCompletedOnboarding === 'true' && !currentSettings.completedOnboarding) {
        newSettings.completedOnboarding = true;
        newSettings.firstTimeUser = false;
        changed = true;
      }

      if (prefCompletedInitialSetup === 'true' && !currentSettings.completedInitialSetup) {
        newSettings.completedInitialSetup = true;
        newSettings.firstTimeUser = false;
        changed = true;
      }

      if (prefNotificationOnboardingComplete === 'true' && !currentSettings.notificationOnboardingComplete) {
        newSettings.notificationOnboardingComplete = true;
        changed = true;
      }

      if (changed) {
        this.saveAppSettings(newSettings);
        console.log('[StorageService] Synced critical flags from Preferences to AppSettings');
      }
    } catch (e) {
      console.error('[StorageService] Failed to load preferences:', e);
    }
  }

  // Verificar se é primeiro uso
  isFirstTimeUser(): boolean {
    const settings = this.loadAppSettings();
    return settings.firstTimeUser;
  }

  // Marcar onboarding como concluído
  async markOnboardingCompleted(): Promise<void> {
    this.saveAppSettings({
      completedOnboarding: true,
      firstTimeUser: false
    });
    // CriticalFlagsService cuida da persistência real, aqui é só para manter o estado consistente
  }

  // Marcar setup inicial como concluído
  async markInitialSetupCompleted(): Promise<void> {
    this.saveAppSettings({
      completedInitialSetup: true,
      firstTimeUser: false
    });
  }

  // Marcar onboarding de notificações como concluído
  async markNotificationOnboardingCompleted(): Promise<void> {
    this.saveAppSettings({
      notificationOnboardingComplete: true
    });
  }

  // ✅ Salvar qual view/tela o usuário estava
  saveLastActiveView(view: string): void {
    this.saveAppSettings({
      lastActiveView: view
    });
  }

  // ✅ Carregar última view ativa
  loadLastActiveView(): string | null {
    const settings = this.loadAppSettings();
    return settings.lastActiveView || null;
  }

  // ✅ Limpar última view ativa
  clearLastActiveView(): void {
    this.saveAppSettings({
      lastActiveView: null
    });
  }

  // ===== DADOS DE AUTENTICAÇÃO =====

  // Salvar dados de autenticação
  saveAuthData(authData: AuthData): void {
    this.setItem(STORAGE_KEYS.AUTH_DATA, authData);
  }

  // Carregar dados de autenticação
  loadAuthData(): AuthData {
    const defaultAuthData: AuthData = {
      user: null,
      isAuthenticated: false
    };

    return this.getItem<AuthData>(STORAGE_KEYS.AUTH_DATA) || defaultAuthData;
  }

  // Limpar dados de autenticação (logout)
  clearAuthData(): void {
    this.removeItem(STORAGE_KEYS.AUTH_DATA);
    this.removeItem(STORAGE_KEYS.USER_PHOTO);
  }

  // ===== FOTO DO USUÁRIO =====

  // Salvar foto do usuário (base64)
  saveUserPhoto(photoDataUrl: string): void {
    this.setItem(STORAGE_KEYS.USER_PHOTO, photoDataUrl);
  }

  // Carregar foto do usuário
  loadUserPhoto(): string | null {
    return this.getItem<string>(STORAGE_KEYS.USER_PHOTO);
  }

  // ===== TEMAS DE CORES =====

  saveColorThemes(themes: ColorTheme[]): void {
    this.setItem(STORAGE_KEYS.COLOR_THEMES, themes);
  }

  // Carregar temas de cores
  loadColorThemes(): ColorTheme[] {
    const defaultThemes: ColorTheme[] = [
      {
        id: 'blue',
        name: 'Azul Água',
        description: 'Tema padrão do Hydropush',
        primary: '#1E88E5',
        secondary: '#42A5F5',
        accent: '#00B894',
        preview: 'bg-gradient-to-br from-blue-400 to-blue-600',
        darkInfluence: {
          background: '#0A0E13',
          card: '#0E1318',
          muted: '#161B21',
          border: 'rgba(59, 130, 246, 0.15)'
        }
      },
      // ... outros temas (mantidos iguais)
      {
        id: 'ocean',
        name: 'Oceano',
        description: 'Tons de azul profundo',
        primary: '#0277BD',
        secondary: '#0288D1',
        accent: '#00ACC1',
        preview: 'bg-gradient-to-br from-cyan-500 to-blue-700',
        darkInfluence: {
          background: '#0A0F14',
          card: '#0E141A',
          muted: '#161C22',
          border: 'rgba(2, 132, 209, 0.18)'
        }
      },
      {
        id: 'mint',
        name: 'Menta',
        description: 'Verde refrescante',
        primary: '#00A693',
        secondary: '#26A69A',
        accent: '#4DB6AC',
        preview: 'bg-gradient-to-br from-teal-400 to-green-600',
        darkInfluence: {
          background: '#0A130F',
          card: '#0E1814',
          muted: '#16211B',
          border: 'rgba(0, 166, 147, 0.15)'
        }
      },
      {
        id: 'purple',
        name: 'Lavanda',
        description: 'Roxo suave e elegante',
        primary: '#7B1FA2',
        secondary: '#8E24AA',
        accent: '#AB47BC',
        preview: 'bg-gradient-to-br from-purple-400 to-purple-700',
        darkInfluence: {
          background: '#0F0A13',
          card: '#140E18',
          muted: '#1B1621',
          border: 'rgba(123, 31, 162, 0.15)'
        }
      },
      {
        id: 'coral',
        name: 'Coral',
        description: 'Rosa vibrante',
        primary: '#E91E63',
        secondary: '#EC407A',
        accent: '#F06292',
        preview: 'bg-gradient-to-br from-pink-400 to-red-500',
        darkInfluence: {
          background: '#130A0D',
          card: '#180E12',
          muted: '#21161A',
          border: 'rgba(233, 30, 99, 0.15)'
        }
      },
      {
        id: 'sunset',
        name: 'Pôr do Sol',
        description: 'Laranja caloroso',
        primary: '#FF6F00',
        secondary: '#FF8F00',
        accent: '#FFA000',
        preview: 'bg-gradient-to-br from-orange-400 to-red-600',
        darkInfluence: {
          background: '#130E0A',
          card: '#18120E',
          muted: '#211B16',
          border: 'rgba(255, 111, 0, 0.15)'
        }
      }
    ];

    return this.getItem<ColorTheme[]>(STORAGE_KEYS.COLOR_THEMES) || defaultThemes;
  }

  // Obter tema de cor específico
  getColorTheme(themeId: string): ColorTheme | null {
    const themes = this.loadColorThemes();
    return themes.find(theme => theme.id === themeId) || null;
  }

  // ===== FEEDBACK =====

  // Salvar feedback
  saveFeedback(feedback: FeedbackData): void {
    this.setItem(STORAGE_KEYS.APP_FEEDBACK, feedback);
  }

  // Carregar feedback
  loadFeedback(): FeedbackData | null {
    return this.getItem<FeedbackData>(STORAGE_KEYS.APP_FEEDBACK);
  }

  // ===== ESTATÍSTICAS E DEBUG =====

  // Obter estatísticas de armazenamento para PrivacyPolicyScreen
  getStorageStats(): { totalDays: number; totalEntries: number; totalWater: number; lastBackup: string | null } {
    const history = this.loadHydrationHistory();
    const totalDays = history.length;
    let totalEntries = 0;
    let totalWater = 0;

    history.forEach(day => {
      totalEntries += day.entries ? day.entries.length : 0;
      totalWater += day.amount;
    });

    // Adicionar dados de hoje se não estiverem no histórico ainda
    const today = new Date().toLocaleDateString('en-CA');
    const todayEntries = this.loadHydrationEntries(today);
    if (todayEntries.length > 0 && !history.find(h => h.date === today)) {
      totalEntries += todayEntries.length;
      totalWater += todayEntries.reduce((sum, e) => sum + e.amount, 0);
    }

    return {
      totalDays,
      totalEntries,
      totalWater,
      lastBackup: null // Implementar lógica de backup se necessário
    };
  }

  // Exportar dados para debug/backup
  exportDebugData(): any {
    const allData: any = {};
    // Exportar cache de memória
    this.memoryCache.forEach((value, key) => {
      allData[key] = value;
    });
    return allData;
  }

  // Criar backup completo (string JSON)
  createBackup(): string {
    return JSON.stringify(this.exportDebugData(), null, 2);
  }

  // Restaurar backup
  restoreBackup(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (!data || typeof data !== 'object') return false;

      // Restaurar cada chave
      Object.keys(data).forEach(key => {
        this.setItem(key, data[key]);
      });

      return true;
    } catch (e) {
      console.error('[StorageService] Failed to restore backup:', e);
      return false;
    }
  }

  // ===== CONFIGURAÇÕES DE TEMA =====

  // Salvar configurações de tema
  saveThemingSettings(settings: Partial<ThemingSettings>): void {
    const currentSettings = this.loadThemingSettings();
    this.setItem(STORAGE_KEYS.THEMING_SETTINGS, {
      ...currentSettings,
      ...settings
    });
  }

  // Carregar configurações de tema
  loadThemingSettings(): ThemingSettings {
    const defaultSettings: ThemingSettings = {
      currentTheme: 'auto',
      systemTheme: 'light',
      useSystemTheme: true,
      accentColor: '#1E88E5',
      contrast: 'normal'
    };

    return this.getItem<ThemingSettings>(STORAGE_KEYS.THEMING_SETTINGS) || defaultSettings;
  }

  // ===== ESTATÍSTICAS DO USUÁRIO =====

  // Calcular estatísticas do usuário
  calculateUserStats(history?: HydrationDay[]): UserStats {
    const historyToUse = history || this.loadHydrationHistory();

    if (historyToUse.length === 0) {
      return {
        totalDaysTracked: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalWaterConsumed: 0,
        perfectDays: 0,
        monthlyGoalsAchieved: 0,
        totalGoalsAchieved: 0,
        averageCompletion: 0,
        lastUpdated: new Date().toISOString(),
        totalPenaltyXp: 0,
        lastPenaltyEvaluationDate: undefined
      };
    }

    const totalDaysTracked = historyToUse.length;
    const totalGoalsAchieved = historyToUse.filter(day => day.amount >= day.goal).length;
    const perfectDays = historyToUse.filter(day => day.amount === day.goal).length;
    const totalWaterConsumed = historyToUse.reduce((sum, day) => sum + day.amount, 0);

    // Calcular sequência atual
    let currentStreak = 0;
    const today = new Date().toLocaleDateString('en-CA');

    const sortedHistory = [...historyToUse].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (let i = 0; i < sortedHistory.length; i++) {
      const day = sortedHistory[i];
      if (day.date === today && day.amount < day.goal) {
        break;
      }
      if (day.amount >= day.goal) {
        currentStreak++;
      } else {
        if (i === 0) {
          break;
        }
      }
    }

    // Calcular melhor sequência
    let bestStreak = 0;
    let tempStreak = 0;

    for (const day of sortedHistory) {
      if (day.amount >= day.goal) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const averageCompletion = totalDaysTracked > 0 ?
      (historyToUse.reduce((sum, day) => sum + Math.min((day.amount / day.goal) * 100, 100), 0) / totalDaysTracked) : 0;

    const last30Days = historyToUse.slice(0, 30);
    const monthlyGoalsAchieved = last30Days.filter(day => day.amount >= day.goal).length;

    return {
      totalDaysTracked,
      currentStreak,
      bestStreak,
      totalWaterConsumed,
      perfectDays,
      monthlyGoalsAchieved,
      totalGoalsAchieved,
      averageCompletion: Math.round(averageCompletion),
      lastUpdated: new Date().toISOString(),
      totalPenaltyXp: this.getItem<UserStats>(STORAGE_KEYS.USER_STATS)?.totalPenaltyXp || 0,
      lastPenaltyEvaluationDate: this.getItem<UserStats>(STORAGE_KEYS.USER_STATS)?.lastPenaltyEvaluationDate
    };
  }

  // Salvar estatísticas calculadas
  saveUserStats(stats: UserStats): void {
    this.setItem(STORAGE_KEYS.USER_STATS, stats);
  }

  loadUserStats(): UserStats {
    return this.getItem<UserStats>(STORAGE_KEYS.USER_STATS) || this.calculateUserStats();
  }

  // Avaliar penalidades diárias (Modo Hardcore)
  evaluateDailyPenalties(): { penaltyApplied: number, missedDays: number } {
    const stats = this.loadUserStats();
    const history = this.loadHydrationHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera hora para comparar apenas a data

    // Verificar quando foi a última avaliação (se não existir, usa a data de criação/primeiro histórico ou hoje)
    let lastEvalDate = stats.lastPenaltyEvaluationDate ? new Date(stats.lastPenaltyEvaluationDate) : today;
    lastEvalDate.setHours(0, 0, 0, 0);

    // Se já foi avaliado hoje, não faz nada
    if (lastEvalDate.getTime() >= today.getTime()) {
      return { penaltyApplied: 0, missedDays: 0 };
    }

    // Calcula os dias perdidos entre lastEvalDate e hoje
    const missedDays: string[] = [];
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Iterar dia a dia desde a última avaliação até ontem
    for (let time = lastEvalDate.getTime(); time < today.getTime(); time += oneDayMs) {
      const dateToCheck = new Date(time);
      const dateString = dateToCheck.toLocaleDateString('en-CA');
      
      const dayHistory = history.find(h => h.date === dateString);
      // Se não tem histórico para aquele dia, ou se tem e a quantidade é menor que a meta
      if (!dayHistory || dayHistory.amount < dayHistory.goal) {
        missedDays.push(dateString);
      }
    }

    let penaltyXp = 0;
    
    if (missedDays.length > 0) {
      let consecutiveMisses = 0;

      // Ordenar do mais antigo pro mais novo para aplicar o multiplicador de sequência negativa
      missedDays.sort().forEach(date => {
        consecutiveMisses++;
        // Multiplicador: -50 no primeiro dia, -100 no segundo, -150 no terceiro, etc.
        const dayPenalty = 50 * consecutiveMisses;
        penaltyXp += dayPenalty;
        console.log(`[Gamification] Penalidade aplicada: -${dayPenalty} XP por falhar a meta em ${date}`);
      });

      stats.totalPenaltyXp += penaltyXp;
      console.warn(`[Gamification] Total de penalidades acumuladas: -${penaltyXp} XP (${missedDays.length} dias perdidos)`);
    }

    // Atualiza a data de última avaliação
    stats.lastPenaltyEvaluationDate = today.toISOString();
    this.saveUserStats(stats);
    
    if (penaltyXp > 0) {
      // Dispatch event to show the modal in the UI
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('penalty:applied', { 
          detail: { penaltyXp, missedDays: missedDays.length } 
        }));
      }, 1000); // Small delay to let the app finish loading before showing the modal
    }
    
    return { penaltyApplied: penaltyXp, missedDays: missedDays.length };
  }

  // Abater dívida de penalidade (acionado quando bate a meta)
  reduceDailyPenalty(amount: number = 100): number {
    const stats = this.loadUserStats();
    
    if (!stats.totalPenaltyXp || stats.totalPenaltyXp <= 0) {
      return 0; // Nenhuma dívida
    }

    const previousPenalty = stats.totalPenaltyXp;
    stats.totalPenaltyXp = Math.max(0, stats.totalPenaltyXp - amount);
    
    const reducedAmount = previousPenalty - stats.totalPenaltyXp;
    
    this.saveUserStats(stats);
    
    console.log(`[Gamification] Dívida reduzida em ${reducedAmount} XP. Dívida restante: ${stats.totalPenaltyXp} XP`);
    
    // Dispara evento para a UI
    window.dispatchEvent(new CustomEvent('penalty:reduced', { 
      detail: { 
        reducedAmount, 
        remainingPenalty: stats.totalPenaltyXp 
      } 
    }));
    
    return reducedAmount;
  }
  
  // Estimar uso de armazenamento
  estimateStorageUsage(): { bytes: number; items: number } {
    let bytes = 0;
    let items = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          bytes += key.length + value.length;
          items++;
        }
      }
    }

    return { bytes, items };
  }
}

export const storageService = new StorageService();
