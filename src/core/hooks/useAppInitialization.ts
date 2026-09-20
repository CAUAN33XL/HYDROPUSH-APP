import { useState, useEffect } from 'react';
import { storageService } from '../services/StorageService';
import { capacitorService } from '../services/CapacitorService';

export function useAppInitialization() {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isCapacitorReady, setIsCapacitorReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] Starting initialization...');

      try {
        // 1. Inicializar Storage Service
        console.log('[App] Initializing Storage Service...');
        await storageService.init();
        console.log('[App] ✅ Storage Service initialized');
        setIsStorageReady(true);

        // 2. Inicializar Capacitor Service (plugins nativos)
        console.log('[App] Initializing Capacitor Service...');
        await capacitorService.initialize();
        console.log('[App] ✅ Capacitor Service initialized');
        setIsCapacitorReady(true);

      } catch (error) {
        console.error('[App] ❌ Initialization error:', error);
        // Importante: Setamos como true mesmo com erro para o app não travar no loading infinito
        setIsStorageReady(true);
        setIsCapacitorReady(true);
      }
    };

    initializeApp();
  }, []);

  // 3. Esconder SplashScreen quando tudo estiver pronto
  useEffect(() => {
    const isReady = isStorageReady && isCapacitorReady;

    if (isReady) {
      const hideSplash = async () => {
        console.log('[App] All systems ready, hiding SplashScreen...');
        await capacitorService.hideSplashScreen();
        console.log('[App] 🚀 App ready!');
      };

      // Dar um pequeno delay para garantir que a UI está renderizada
      setTimeout(() => {
        hideSplash();
      }, 300);
    }
  }, [isStorageReady, isCapacitorReady]);

  return {
    isReady: isStorageReady && isCapacitorReady,
  };
}
