import { useState, useEffect } from 'react';
import { storageService } from '../services/StorageService';

export function useAppInitialization() {
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] Starting initialization...');

      try {
        // 1. Inicializar Storage Service
        console.log('[App] Initializing Storage Service...');
        await storageService.init();
        console.log('[App] ✅ Storage Service initialized');
        setIsStorageReady(true);
      } catch (error) {
        console.error('[App] ❌ Initialization error:', error);
        // Importante: Setamos como true mesmo com erro para o app não travar no loading infinito
        setIsStorageReady(true);
      }
    };

    initializeApp();
  }, []);

  return {
    isReady: isStorageReady,
  };
}
