/**
 * Service de restauration automatique des tables au chargement
 * Restaure les tables de la session stable au démarrage de l'application
 */

import { flowiseTableBridge } from './flowiseTableBridge';

class AutoRestoreService {
  private initialized = false;
  private restoreAttempted = false;

  /**
   * Initialise la restauration automatique
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔄 Initialisation restauration automatique');

    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Délai réduit pour restauration plus rapide
    await new Promise(resolve => setTimeout(resolve, 500));

    // Tenter la restauration
    await this.attemptRestore();

    this.initialized = true;
  }

  /**
   * Tente de restaurer les tables de la session stable
   */
  private async attemptRestore(): Promise<void> {
    if (this.restoreAttempted) {
      console.log('%c⚠️ AUTO-RESTORE: Déjà tenté', 'background: #ff9800; color: black; padding: 3px;');
      return;
    }

    this.restoreAttempted = true;

    try {
      console.log('%c🔄 AUTO-RESTORE: Tentative de restauration...', 'background: #2196f3; color: white; font-size: 14px; padding: 5px;');

      // Obtenir la session stable depuis sessionStorage
      let sessionId: string | null = null;

      try {
        sessionId = sessionStorage.getItem('claraverse_stable_session');
      } catch (error) {
        console.warn('⚠️ sessionStorage non accessible');
      }

      if (!sessionId) {
        console.log('%cℹ️ AUTO-RESTORE: Aucune session stable trouvée', 'background: #9e9e9e; color: white; padding: 3px;');
        return;
      }

      console.log('%c📋 AUTO-RESTORE: Session trouvée: ' + sessionId, 'background: #4caf50; color: white; padding: 3px;');

      // IMPORTANT: Forcer le bridge à utiliser cette session
      try {
        (flowiseTableBridge as any).currentSessionId = sessionId;
        console.log('%c🔧 AUTO-RESTORE: Session forcée dans le bridge', 'background: #ff9800; color: black; padding: 3px;');
      } catch (error) {
        console.warn('⚠️ Impossible de forcer la session dans le bridge');
      }

      // Restaurer via le bridge
      await flowiseTableBridge.restoreTablesForSession(sessionId);

      console.log('%c✅ AUTO-RESTORE: RESTAURATION TERMINÉE!', 'background: #4caf50; color: white; font-size: 16px; font-weight: bold; padding: 8px;');

      // Émettre un événement
      const event = new CustomEvent('claraverse:auto:restore:complete', {
        detail: {
          sessionId,
          timestamp: Date.now()
        }
      });
      document.dispatchEvent(event);

    } catch (error) {
      console.error('❌ Erreur restauration automatique:', error);
    }
  }

  /**
   * Force une nouvelle tentative de restauration
   */
  public async forceRestore(): Promise<void> {
    this.restoreAttempted = false;
    await this.attemptRestore();
  }
}

// Instance singleton
export const autoRestoreService = new AutoRestoreService();

// Exposer globalement pour debug
if (typeof window !== 'undefined') {
  (window as any).autoRestoreService = autoRestoreService;
}

// Auto-initialisation IMMÉDIATE et MULTIPLE
if (typeof window !== 'undefined') {
  console.log('%c🔄 AUTO-RESTORE: Initialisation...', 'background: #007acc; color: white; font-size: 14px; padding: 5px;');
  
  // Tentative 1: Après un délai pour laisser les tables se charger
  setTimeout(() => {
    console.log('%c🔄 AUTO-RESTORE: Tentative 1 (2s)', 'background: #007acc; color: white; padding: 3px;');
    autoRestoreService.initialize().catch(error => {
      console.error('❌ Erreur initialisation auto-restore (tentative 1):', error);
    });
  }, 2000);
  
  // Tentative 2: Après chargement DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('%c🔄 AUTO-RESTORE: Tentative 2 (DOMContentLoaded + 3s)', 'background: #007acc; color: white; padding: 3px;');
      setTimeout(() => autoRestoreService.forceRestore(), 3000);
    });
  } else {
    setTimeout(() => {
      console.log('%c🔄 AUTO-RESTORE: Tentative 2 (DOM déjà prêt + 3s)', 'background: #007acc; color: white; padding: 3px;');
      autoRestoreService.forceRestore();
    }, 3000);
  }
  
  // Tentative 3: Après chargement complet
  window.addEventListener('load', () => {
    console.log('%c🔄 AUTO-RESTORE: Tentative 3 (window.load + 4s)', 'background: #007acc; color: white; padding: 3px;');
    setTimeout(() => autoRestoreService.forceRestore(), 4000);
  });
  
  // Tentative 4: Très tardive pour s'assurer que Flowise a généré les tables
  setTimeout(() => {
    console.log('%c🔄 AUTO-RESTORE: Tentative 4 (8s - tardive)', 'background: #ff5722; color: white; padding: 3px;');
    autoRestoreService.forceRestore();
  }, 8000);
  
  // Tentative 5: Ultra-tardive en dernier recours
  setTimeout(() => {
    console.log('%c🔄 AUTO-RESTORE: Tentative 5 (15s - ultra-tardive)', 'background: #f44336; color: white; padding: 3px;');
    autoRestoreService.forceRestore();
  }, 15000);
}
