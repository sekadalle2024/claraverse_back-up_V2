/**
 * Test Rapide - Vérifier que les checkboxes CIA apparaissent
 * À exécuter dans la console du navigateur
 */

(function () {
    console.log("🧪 TEST RAPIDE - CHECKBOXES CIA");
    console.log("=".repeat(60));

    // 1. Vérifier que conso.js est chargé
    console.log("\n1️⃣ VÉRIFICATION CONSO.JS");
    if (window.claraverseProcessor) {
        console.log("✅ conso.js est chargé");
        console.log("   - Initialisé:", window.claraverseProcessor.isInitialized);
    } else {
        console.error("❌ conso.js n'est PAS chargé");
        console.log("💡 Solution: Rechargez la page (F5)");
        return;
    }

    // 2. Trouver les tables CIA
    console.log("\n2️⃣ RECHERCHE DES TABLES CIA");
    const allTables = document.querySelectorAll('table');
    console.log(`📊 ${allTables.length} table(s) trouvée(s) dans le DOM`);

    let ciaTablesFound = 0;
    let tablesWithCheckboxes = 0;
    let totalCheckboxes = 0;

    allTables.forEach((table, index) => {
        const headers = Array.from(table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td'))
            .map(h => h.textContent.trim());

        const hasReponseUser = headers.some(h => /reponse[_\s]?user/i.test(h));

        if (hasReponseUser) {
            ciaTablesFound++;
            const tableId = table.dataset.tableId || 'sans ID';
            const checkboxes = table.querySelectorAll('input[type="checkbox"]');
            const checkboxCount = checkboxes.length;

            console.log(`\n   ✅ Table CIA #${ciaTablesFound} (index ${index})`);
            console.log(`      - ID: ${tableId}`);
            console.log(`      - Headers: ${headers.join(', ')}`);
            console.log(`      - Checkboxes: ${checkboxCount}`);

            if (checkboxCount > 0) {
                tablesWithCheckboxes++;
                totalCheckboxes += checkboxCount;

                // Vérifier les checkboxes cochées
                const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                if (checkedCount > 0) {
                    console.log(`      - Cochées: ${checkedCount}`);
                }
            } else {
                console.warn(`      ⚠️ AUCUNE CHECKBOX trouvée !`);
            }
        }
    });

    // 3. Résumé
    console.log("\n3️⃣ RÉSUMÉ");
    console.log(`   - Tables CIA trouvées: ${ciaTablesFound}`);
    console.log(`   - Tables avec checkboxes: ${tablesWithCheckboxes}`);
    console.log(`   - Total checkboxes: ${totalCheckboxes}`);

    // 4. Diagnostic
    console.log("\n4️⃣ DIAGNOSTIC");
    if (ciaTablesFound === 0) {
        console.error("❌ AUCUNE table CIA trouvée");
        console.log("💡 Vérifiez que vos tables ont une colonne 'Reponse_user'");
    } else if (tablesWithCheckboxes === 0) {
        console.error("❌ Tables CIA trouvées MAIS aucune checkbox");
        console.log("💡 Les tables ne sont peut-être pas encore traitées");
        console.log("💡 Essayez de forcer le traitement:");
        console.log("   window.claraverseProcessor.processAllTables();");
    } else if (tablesWithCheckboxes < ciaTablesFound) {
        console.warn(`⚠️ Seulement ${tablesWithCheckboxes}/${ciaTablesFound} tables ont des checkboxes`);
        console.log("💡 Certaines tables n'ont peut-être pas été traitées");
    } else {
        console.log("✅ SUCCÈS ! Toutes les tables CIA ont des checkboxes");
    }

    // 5. Actions suggérées
    console.log("\n5️⃣ ACTIONS SUGGÉRÉES");
    if (tablesWithCheckboxes === 0 && ciaTablesFound > 0) {
        console.log("🔧 Forcer le traitement des tables:");
        console.log("   window.claraverseProcessor.processAllTables();");
        console.log("\n🔄 Ou recharger la page:");
        console.log("   location.reload();");
    } else if (tablesWithCheckboxes > 0) {
        console.log("✅ Les checkboxes sont présentes !");
        console.log("🧪 Testez maintenant:");
        console.log("   1. Cochez une checkbox");
        console.log("   2. Attendez 1 seconde");
        console.log("   3. Rechargez la page (F5)");
        console.log("   4. Vérifiez que la checkbox est toujours cochée");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Test terminé");
})();
