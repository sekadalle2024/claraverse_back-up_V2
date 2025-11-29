/**
 * Force la Restauration des Checkboxes CIA avec Délai
 * Restaure les checkboxes dans les tables existantes
 */

(function () {
    console.log("🔄 FORCE RESTAURATION CIA - Démarrage");

    function forceRestaurationCIA() {
        // Attendre que conso.js soit chargé
        if (!window.claraverseProcessor) {
            console.log("⏳ Attente de conso.js...");
            setTimeout(forceRestaurationCIA, 500);
            return;
        }

        console.log("✅ conso.js détecté");

        // Attendre que les tables soient créées (2 secondes)
        setTimeout(() => {
            console.log("🔄 Tentative de restauration des checkboxes CIA...");

            // Compter les tables CIA
            const tables = document.querySelectorAll('table');
            let ciaCount = 0;
            tables.forEach(t => {
                const headers = Array.from(t.querySelectorAll('th, td')).map(h => h.textContent.toLowerCase());
                if (headers.some(h => /reponse[_\s]?user/i.test(h))) {
                    ciaCount++;
                }
            });

            console.log(`📊 ${ciaCount} table(s) CIA trouvée(s) dans le DOM`);

            if (ciaCount === 0) {
                console.log("⚠️ Aucune table CIA, nouvelle tentative dans 2 secondes...");
                setTimeout(forceRestaurationCIA, 2000);
                return;
            }

            // Forcer la restauration
            try {
                window.claraverseProcessor.restoreAllTablesData();
                console.log("✅ Restauration forcée déclenchée");

                // Vérifier après 2 secondes
                setTimeout(() => {
                    const checkboxes = document.querySelectorAll('table input[type="checkbox"]');
                    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
                    console.log(`📊 Résultat: ${checkboxes.length} checkbox(es), ${checked} cochée(s)`);

                    if (checked > 0) {
                        console.log("✅ Restauration réussie !");

                        // Notification
                        const notification = document.createElement('div');
                        notification.textContent = `✅ ${checked} checkbox(es) restaurée(s)`;
                        notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #28a745;
              color: white;
              padding: 15px 25px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 16px;
              font-weight: bold;
            `;
                        document.body.appendChild(notification);

                        setTimeout(() => {
                            notification.style.transition = 'opacity 0.5s';
                            notification.style.opacity = '0';
                            setTimeout(() => notification.remove(), 500);
                        }, 3000);
                    } else {
                        console.log("⚠️ Aucune checkbox cochée après restauration");
                    }
                }, 2000);

            } catch (error) {
                console.error("❌ Erreur lors de la restauration:", error);
            }

        }, 2000);
    }

    // Démarrer au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceRestaurationCIA);
    } else {
        forceRestaurationCIA();
    }

    console.log("✅ Script de force restauration chargé");

})();
