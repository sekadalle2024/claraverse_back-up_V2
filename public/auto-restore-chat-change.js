// Restauration automatique lors du changement de chat
// Version améliorée avec détection spécifique des tables CIA

(function () {
    console.log('🔄 AUTO RESTORE CHAT CHANGE - Démarrage (Version CIA)');

    let lastTableCount = 0;
    let lastCIATableCount = 0;
    let restoreTimeout = null;
    let lastRestoreTime = 0;
    const MIN_RESTORE_INTERVAL = 5000;

    // === UTILITAIRES ===

    /**
     * Vérifier si une table est une table CIA
     */
    function isCIATable(table) {
        if (!table || table.tagName !== 'TABLE') return false;

        const headers = Array.from(table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td'))
            .map(h => h.textContent.trim().toLowerCase());

        return headers.some(h => /reponse[_\s]?user/i.test(h));
    }

    /**
     * Compter les tables CIA dans le DOM
     */
    function countCIATables() {
        const allTables = document.querySelectorAll('table');
        return Array.from(allTables).filter(t => isCIATable(t)).length;
    }

    /**
     * Vérifier si des tables CIA existent
     */
    function hasCIATables() {
        return countCIATables() > 0;
    }

    // === FONCTION DE RESTAURATION ===
    async function restoreCurrentSession() {
        // Vérifier le gestionnaire de verrouillage
        if (window.restoreLockManager && !window.restoreLockManager.canRestore()) {
            console.log('🔒 Restauration bloquée par le gestionnaire de verrouillage');
            return;
        }

        const now = Date.now();
        if (now - lastRestoreTime < MIN_RESTORE_INTERVAL) {
            console.log('⏭️ Restauration trop récente, skip');
            return;
        }

        // Activer le flag pour ignorer les mutations pendant la restauration
        isRestoring = true;

        lastRestoreTime = now;
        console.log('🎯 === RESTAURATION VIA ÉVÉNEMENT (CIA) ===');

        try {
            // Compter les tables CIA avant restauration
            const ciaCount = countCIATables();
            console.log(`📊 Tables CIA détectées: ${ciaCount}`);

            if (ciaCount === 0) {
                console.log('⏭️ Aucune table CIA, skip restauration');
                isRestoring = false;
                return;
            }

            // Essayer d'obtenir le sessionId depuis sessionStorage
            let sessionId = sessionStorage.getItem('claraverse_stable_session');

            // Ou depuis l'URL
            if (!sessionId) {
                const urlParams = new URLSearchParams(window.location.search);
                sessionId = urlParams.get('session') || urlParams.get('sessionId');
            }

            // Ou depuis le DOM
            if (!sessionId) {
                const sessionElement = document.querySelector('[data-session-id]');
                if (sessionElement) {
                    sessionId = sessionElement.getAttribute('data-session-id');
                }
            }

            if (!sessionId) {
                console.log('⚠️ Pas de session détectée - Déclenchement événement générique');
                // Déclencher un événement de restauration générique
                document.dispatchEvent(new CustomEvent('flowise:table:restore:request', {
                    detail: { sessionId: 'current' }
                }));
            } else {
                console.log(`📍 Session: ${sessionId}`);

                // Déclencher l'événement de restauration
                document.dispatchEvent(new CustomEvent('flowise:table:restore:request', {
                    detail: { sessionId }
                }));
            }

            console.log('✅ Événement de restauration déclenché');
            console.log('🎯 === FIN ===');

        } catch (error) {
            console.error('❌ Erreur:', error);
        } finally {
            // Désactiver le flag après un délai pour laisser le DOM se stabiliser
            setTimeout(() => {
                isRestoring = false;
                console.log('🔓 Flag de restauration désactivé');
            }, 3000); // Augmenté à 3 secondes pour les tables CIA
        }
    }

    // === DÉTECTER LES CHANGEMENTS ===

    function scheduleRestore() {
        console.log('⏰ Restauration planifiée dans 5 secondes');

        if (restoreTimeout) {
            clearTimeout(restoreTimeout);
        }

        restoreTimeout = setTimeout(() => {
            console.log('⏰ Timeout écoulé - Lancement');
            restoreCurrentSession();
            restoreTimeout = null;
        }, 5000);
    }

    // === INITIALISATION ===

    // Flag pour éviter les boucles de restauration
    let isRestoring = false;

    // Observer DOM avec détection spécifique des tables CIA
    const observer = new MutationObserver((mutations) => {
        // Ignorer les mutations pendant la restauration
        if (isRestoring) {
            return;
        }

        const hasNewCIATables = mutations.some(m => {
            return Array.from(m.addedNodes).some(node => {
                if (node.nodeType === 1) {
                    // Vérifier si c'est une table CIA
                    if (node.tagName === 'TABLE') {
                        // Ignorer les tables déjà restaurées
                        const container = node.closest('[data-restored-content="true"]');
                        if (container) {
                            return false;
                        }
                        return isCIATable(node);
                    }

                    // Vérifier les sous-éléments
                    const tables = node.querySelectorAll?.('table');
                    if (tables && tables.length > 0) {
                        // Vérifier si au moins une table CIA non restaurée existe
                        return Array.from(tables).some(table => {
                            const container = table.closest('[data-restored-content="true"]');
                            if (container) return false;
                            return isCIATable(table);
                        });
                    }
                }
                return false;
            });
        });

        if (hasNewCIATables) {
            const currentCIACount = countCIATables();
            console.log(`🔄 Nouvelles tables CIA détectées (${lastCIATableCount} → ${currentCIACount})`);
            lastCIATableCount = currentCIACount;
            scheduleRestore();
        }
    });

    setTimeout(() => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initialiser le compteur
        lastCIATableCount = countCIATables();
        console.log(`👀 Observer activé - ${lastCIATableCount} table(s) CIA initiale(s)`);
    }, 1000);

    // Exposer pour tests
    window.restoreCurrentSession = restoreCurrentSession;
    window.countCIATables = countCIATables;
    window.isCIATable = isCIATable;

    console.log('✅ Auto Restore Chat Change activé (Version CIA)');
    console.log('💡 Tests disponibles:');
    console.log('   - window.restoreCurrentSession()');
    console.log('   - window.countCIATables()');
    console.log('   - window.isCIATable(table)');
})();
