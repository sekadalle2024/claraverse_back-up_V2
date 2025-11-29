/**
 * DIAGNOSTIC RAPIDE - Persistance CIA lors du changement de chat
 * Copiez-collez ce code dans la console du navigateur
 */

(function () {
    console.log("🔍 DIAGNOSTIC CIA - CHANGEMENT DE CHAT");
    console.log("=".repeat(60));

    // 1. Vérifier que conso.js est chargé
    console.log("\n1️⃣ VÉRIFICATION SYSTÈME");
    if (!window.claraverseProcessor) {
        console.error("❌ conso.js non chargé");
        console.log("💡 Rechargez la page et réessayez");
        return;
    }
    console.log("✅ conso.js chargé");

    // 2. Vérifier auto-restore-chat-change.js
    console.log("\n2️⃣ VÉRIFICATION AUTO-RESTORE");
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const autoRestoreScript = scripts.find(s => s.src.includes('auto-restore-chat-change'));
    if (autoRestoreScript) {
        console.log("✅ auto-restore-chat-change.js chargé");
    } else {
        console.error("❌ auto-restore-chat-change.js NON chargé");
        console.log("💡 Vérifiez index.html");
    }

    // 3. Identifier les tables CIA actuelles
    console.log("\n3️⃣ TABLES CIA ACTUELLES");
    const tables = document.querySelectorAll('table');
    const ciaTablesInfo = [];

    tables.forEach((table, index) => {
        const headers = Array.from(table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td'))
            .map(h => h.textContent.trim());

        const hasReponseUser = headers.some(h => /reponse[_\s]?user/i.test(h));

        if (hasReponseUser) {
            const tableId = table.dataset.tableId;
            const checkboxes = table.querySelectorAll('input[type="checkbox"]');
            const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);

            const info = {
                index,
                tableId: tableId || '❌ SANS ID',
                checkboxCount: checkboxes.length,
                checkedCount: checkedBoxes.length,
                headers: headers.slice(0, 3).join(', ') + '...'
            };

            ciaTablesInfo.push(info);
            console.log(`✅ Table CIA #${ciaTablesInfo.length}:`);
            console.log(`   - ID: ${info.tableId}`);
            console.log(`   - Checkboxes: ${info.checkboxCount}`);
            console.log(`   - Cochées: ${info.checkedCount}`);

            if (!tableId) {
                console.warn(`   ⚠️ PROBLÈME: Table sans ID - ne sera pas sauvegardée!`);
            }
        }
    });

    if (ciaTablesInfo.length === 0) {
        console.warn("⚠️ Aucune table CIA trouvée");
        console.log("💡 Assurez-vous d'être sur une page avec des tables d'examen CIA");
        return;
    }

    console.log(`\n📊 Total: ${ciaTablesInfo.length} table(s) CIA trouvée(s)`);

    // 4. Vérifier localStorage
    console.log("\n4️⃣ VÉRIFICATION LOCALSTORAGE");
    try {
        const data = JSON.parse(localStorage.getItem('claraverse_tables_data') || '{}');
        const ciaTablesInStorage = Object.values(data).filter(t => t.isCIATable);

        console.log(`📦 Tables CIA sauvegardées: ${ciaTablesInStorage.length}`);

        if (ciaTablesInStorage.length > 0) {
            console.log("📋 Détails:");
            ciaTablesInStorage.forEach((table, i) => {
                const checkedCells = (table.cells || []).filter(c => c.isCheckboxCell && c.isChecked).length;
                console.log(`   ${i + 1}. ${table.headers?.[0] || 'Sans nom'} - ${checkedCells} checkbox(es) cochée(s)`);
            });
        } else {
            console.warn("⚠️ Aucune table CIA sauvegardée");
            console.log("💡 Cochez des checkboxes et attendez 1 seconde");
        }
    } catch (error) {
        console.error("❌ Erreur localStorage:", error);
    }

    // 5. Tester l'événement de restauration
    console.log("\n5️⃣ TEST ÉVÉNEMENT DE RESTAURATION");
    console.log("🧪 Déclenchement manuel de l'événement...");

    let eventReceived = false;
    const testListener = () => {
        eventReceived = true;
        console.log("✅ Événement reçu par le listener de test");
    };

    document.addEventListener('flowise:table:restore:request', testListener, { once: true });

    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('flowise:table:restore:request', {
            detail: { sessionId: 'test-diagnostic' }
        }));

        setTimeout(() => {
            if (eventReceived) {
                console.log("✅ Système d'événements fonctionne");
            } else {
                console.error("❌ Événement non reçu - problème de configuration");
            }

            document.removeEventListener('flowise:table:restore:request', testListener);
        }, 100);
    }, 100);

    // 6. Instructions pour tester
    console.log("\n6️⃣ INSTRUCTIONS DE TEST");
    console.log("=".repeat(60));
    console.log("Pour tester la persistance lors du changement de chat:");
    console.log("");
    console.log("1. Cochez quelques checkboxes dans les tables CIA");
    console.log("2. Attendez 1 seconde (sauvegarde automatique)");
    console.log("3. Changez de chat (cliquez sur un autre chat)");
    console.log("4. Revenez au chat initial");
    console.log("5. Vérifiez si les checkboxes sont toujours cochées");
    console.log("");
    console.log("Si les checkboxes ne sont pas restaurées:");
    console.log("- Ouvrez la console et cherchez les logs '🔄'");
    console.log("- Vérifiez les erreurs en rouge");
    console.log("- Relancez ce diagnostic");
    console.log("");
    console.log("=".repeat(60));

    // 7. Commandes utiles
    console.log("\n7️⃣ COMMANDES UTILES");
    console.log("Forcer la sauvegarde:");
    console.log("  claraverseProcessor.saveNow()");
    console.log("");
    console.log("Forcer la restauration:");
    console.log("  claraverseProcessor.restoreAllTablesData()");
    console.log("");
    console.log("Forcer l'événement de restauration:");
    console.log("  document.dispatchEvent(new CustomEvent('flowise:table:restore:request', {");
    console.log("    detail: { sessionId: 'current' }");
    console.log("  }))");
    console.log("");
    console.log("Vider les données CIA:");
    console.log("  const data = JSON.parse(localStorage.getItem('claraverse_tables_data') || '{}');");
    console.log("  const filtered = {};");
    console.log("  Object.entries(data).forEach(([id, t]) => {");
    console.log("    if (!t.isCIATable) filtered[id] = t;");
    console.log("  });");
    console.log("  localStorage.setItem('claraverse_tables_data', JSON.stringify(filtered));");
    console.log("");
    console.log("=".repeat(60));
    console.log("✅ Diagnostic terminé");

})();
