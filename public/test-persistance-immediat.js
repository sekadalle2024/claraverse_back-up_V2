/**
 * Test Immédiat - Vérifier la persistance des checkboxes
 * À exécuter dans la console après avoir coché une checkbox
 */

(function () {
    console.log("🔍 TEST PERSISTANCE IMMÉDIAT");
    console.log("=".repeat(60));

    // 1. Vérifier localStorage
    console.log("\n1️⃣ VÉRIFICATION LOCALSTORAGE");
    const storageKey = 'claraverse_tables_data';
    const rawData = localStorage.getItem(storageKey);

    if (!rawData) {
        console.error("❌ Aucune donnée dans localStorage");
        console.log("💡 Les tables ne sont pas sauvegardées");
        console.log("💡 Essayez de forcer une sauvegarde:");
        console.log("   claraverseCommands.saveNow();");
        return;
    }

    const data = JSON.parse(rawData);
    const tableCount = Object.keys(data).length;
    console.log(`✅ ${tableCount} table(s) dans localStorage`);

    // 2. Vérifier les tables CIA
    console.log("\n2️⃣ TABLES CIA SAUVEGARDÉES");
    let ciaTablesCount = 0;
    let tablesWithCheckboxData = 0;
    let totalCheckboxes = 0;
    let checkedCheckboxes = 0;

    Object.entries(data).forEach(([tableId, tableData]) => {
        // Vérifier si c'est une table CIA
        const isCIA = tableData.isCIATable ||
            (tableData.headers && tableData.headers.some(h => /reponse[_\s]?user/i.test(h)));

        if (isCIA) {
            ciaTablesCount++;

            // Compter les checkboxes
            const checkboxCells = tableData.cells ? tableData.cells.filter(c => c.isCheckboxCell) : [];
            const checkedCells = checkboxCells.filter(c => c.isChecked);

            if (checkboxCells.length > 0) {
                tablesWithCheckboxData++;
                totalCheckboxes += checkboxCells.length;
                checkedCheckboxes += checkedCells.length;

                console.log(`\n   ✅ ${tableId}`);
                console.log(`      - Checkboxes: ${checkboxCells.length}`);
                console.log(`      - Cochées: ${checkedCells.length}`);

                if (checkedCells.length > 0) {
                    console.log(`      - Détails:`);
                    checkedCells.forEach((cell, i) => {
                        console.log(`        • Ligne ${cell.row}, Col ${cell.col}: ✓`);
                    });
                }
            }
        }
    });

    console.log("\n📊 RÉSUMÉ LOCALSTORAGE:");
    console.log(`   - Tables CIA: ${ciaTablesCount}`);
    console.log(`   - Tables avec checkboxes: ${tablesWithCheckboxData}`);
    console.log(`   - Total checkboxes: ${totalCheckboxes}`);
    console.log(`   - Checkboxes cochées: ${checkedCheckboxes}`);

    // 3. Comparer avec le DOM
    console.log("\n3️⃣ COMPARAISON DOM vs LOCALSTORAGE");
    const tables = document.querySelectorAll('table');
    let domCiaCount = 0;
    let domCheckedCount = 0;

    tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('th, td')).map(h => h.textContent.toLowerCase());
        if (headers.some(h => /reponse[_\s]?user/i.test(h))) {
            domCiaCount++;
            const checkboxes = table.querySelectorAll('input[type="checkbox"]');
            const checked = Array.from(checkboxes).filter(cb => cb.checked);
            domCheckedCount += checked.length;
        }
    });

    console.log(`   - Tables CIA dans DOM: ${domCiaCount}`);
    console.log(`   - Checkboxes cochées dans DOM: ${domCheckedCount}`);
    console.log(`   - Tables CIA dans localStorage: ${ciaTablesCount}`);
    console.log(`   - Checkboxes cochées dans localStorage: ${checkedCheckboxes}`);

    // 4. Diagnostic
    console.log("\n4️⃣ DIAGNOSTIC");

    if (ciaTablesCount === 0) {
        console.error("❌ AUCUNE table CIA sauvegardée");
        console.log("💡 Problème: Les tables CIA ne sont pas sauvegardées");
        console.log("💡 Solution: Vérifier que saveTableDataNow() filtre correctement");
    } else if (tablesWithCheckboxData === 0) {
        console.error("❌ Tables CIA sauvegardées MAIS sans données de checkbox");
        console.log("💡 Problème: Les checkboxes ne sont pas sauvegardées");
        console.log("💡 Solution: Vérifier que isCheckboxCell et isChecked sont bien sauvegardés");
    } else if (domCheckedCount > checkedCheckboxes) {
        console.warn(`⚠️ ${domCheckedCount} checkbox(es) cochée(s) dans DOM mais seulement ${checkedCheckboxes} dans localStorage`);
        console.log("💡 Problème: La sauvegarde ne se déclenche pas");
        console.log("💡 Solution: Forcer la sauvegarde:");
        console.log("   claraverseCommands.saveNow();");
    } else if (domCheckedCount === checkedCheckboxes && checkedCheckboxes > 0) {
        console.log("✅ PARFAIT ! Les checkboxes sont bien sauvegardées");
        console.log("🧪 Testez la restauration:");
        console.log("   1. Rechargez la page (F5)");
        console.log("   2. Attendez 2 secondes");
        console.log("   3. Les checkboxes doivent être toujours cochées");
    } else {
        console.log("ℹ️ Aucune checkbox cochée pour le moment");
        console.log("🧪 Pour tester:");
        console.log("   1. Cochez une checkbox");
        console.log("   2. Attendez 1 seconde");
        console.log("   3. Relancez ce script");
    }

    // 5. Taille du localStorage
    console.log("\n5️⃣ TAILLE DU LOCALSTORAGE");
    const sizeInBytes = new Blob([rawData]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    console.log(`   - Taille: ${sizeInKB} KB (${sizeInMB} MB)`);
    console.log(`   - Tables: ${tableCount}`);
    console.log(`   - Moyenne par table: ${(sizeInBytes / tableCount / 1024).toFixed(2)} KB`);

    if (sizeInMB > 5) {
        console.warn("⚠️ localStorage proche de la limite (5-10 MB)");
    } else {
        console.log("✅ Taille OK");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Test terminé");
})();
