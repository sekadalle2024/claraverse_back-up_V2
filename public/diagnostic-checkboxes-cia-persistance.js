/**
 * Diagnostic de persistance des checkboxes CIA
 * À exécuter dans la console après avoir coché/décoché des checkboxes
 */

(function () {
    console.log("🔍 DIAGNOSTIC PERSISTANCE CHECKBOXES CIA");
    console.log("=".repeat(60));

    // 1. Vérifier localStorage
    console.log("\n📦 1. VÉRIFICATION LOCALSTORAGE");
    try {
        const storageKey = "claraverse_tables_data";
        const rawData = localStorage.getItem(storageKey);

        if (!rawData) {
            console.error("❌ Aucune donnée dans localStorage");
            console.log("💡 Les tables n'ont pas été sauvegardées");
        } else {
            const data = JSON.parse(rawData);
            const tableCount = Object.keys(data).length;
            console.log(`✅ ${tableCount} table(s) trouvée(s) dans localStorage`);

            // Afficher les IDs des tables
            console.log("\n📋 IDs des tables sauvegardées:");
            Object.keys(data).forEach(id => {
                const tableData = data[id];
                const checkboxCells = tableData.cells ? tableData.cells.filter(c => c.isCheckboxCell) : [];
                const checkedCells = checkboxCells.filter(c => c.isChecked);

                console.log(`  • ${id}:`);
                console.log(`    - Headers: ${tableData.headers ? tableData.headers.join(", ") : "N/A"}`);
                console.log(`    - Cellules avec checkbox: ${checkboxCells.length}`);
                console.log(`    - Checkboxes cochées: ${checkedCells.length}`);
                console.log(`    - Timestamp: ${new Date(tableData.timestamp).toLocaleString("fr-FR")}`);
            });
        }
    } catch (error) {
        console.error("❌ Erreur lecture localStorage:", error);
    }

    // 2. Vérifier les tables dans le DOM
    console.log("\n\n🌐 2. VÉRIFICATION TABLES DANS LE DOM");
    const allTables = document.querySelectorAll("table");
    console.log(`📊 ${allTables.length} table(s) trouvée(s) dans le DOM`);

    let ciaTablesCount = 0;
    let tablesWithCheckboxes = 0;
    let checkedCheckboxesCount = 0;

    allTables.forEach((table, index) => {
        const headers = Array.from(table.querySelectorAll("thead th, thead td, tr:first-child th, tr:first-child td"))
            .map(h => h.textContent.trim().toLowerCase());

        const hasReponseUser = headers.some(h => /reponse[_\s]?user/i.test(h));

        if (hasReponseUser) {
            ciaTablesCount++;
            console.log(`\n  ✓ Table CIA #${ciaTablesCount} (index ${index}):`);
            console.log(`    - ID: ${table.dataset.tableId || "❌ AUCUN ID"}`);
            console.log(`    - Headers: ${headers.join(", ")}`);

            // Compter les checkboxes
            const checkboxes = table.querySelectorAll("input[type='checkbox']");
            const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);

            if (checkboxes.length > 0) {
                tablesWithCheckboxes++;
                checkedCheckboxesCount += checkedBoxes.length;

                console.log(`    - Checkboxes: ${checkboxes.length}`);
                console.log(`    - Cochées: ${checkedBoxes.length}`);

                // Afficher les détails des checkboxes cochées
                if (checkedBoxes.length > 0) {
                    console.log(`    - Détails des checkboxes cochées:`);
                    checkedBoxes.forEach((cb, i) => {
                        const cell = cb.closest("td");
                        const row = cell ? cell.closest("tr") : null;
                        const rowIndex = row ? Array.from(row.parentElement.children).indexOf(row) : -1;
                        console.log(`      • Checkbox ${i + 1}: ligne ${rowIndex}, dataset.checked=${cell?.dataset.checked}`);
                    });
                }
            } else {
                console.log(`    - ❌ Aucune checkbox trouvée`);
            }
        }
    });

    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`  - Tables CIA: ${ciaTablesCount}`);
    console.log(`  - Tables avec checkboxes: ${tablesWithCheckboxes}`);
    console.log(`  - Checkboxes cochées: ${checkedCheckboxesCount}`);

    // 3. Vérifier le processeur Claraverse
    console.log("\n\n⚙️ 3. VÉRIFICATION PROCESSEUR CLARAVERSE");
    if (window.claraverseProcessor) {
        console.log("✅ Processeur Claraverse trouvé");
        console.log(`  - Initialisé: ${window.claraverseProcessor.isInitialized}`);
        console.log(`  - Tables traitées: ${window.claraverseProcessor.processedTables ? "WeakSet présent" : "❌ Absent"}`);
    } else {
        console.error("❌ Processeur Claraverse non trouvé");
    }

    // 4. Test de sauvegarde manuelle
    console.log("\n\n💾 4. TEST DE SAUVEGARDE MANUELLE");
    if (window.claraverseProcessor && ciaTablesCount > 0) {
        console.log("Tentative de sauvegarde manuelle des tables CIA...");

        allTables.forEach((table) => {
            const headers = Array.from(table.querySelectorAll("thead th, thead td, tr:first-child th, tr:first-child td"))
                .map(h => h.textContent.trim().toLowerCase());

            const hasReponseUser = headers.some(h => /reponse[_\s]?user/i.test(h));

            if (hasReponseUser && table.dataset.tableId) {
                try {
                    window.claraverseProcessor.saveTableDataNow(table);
                    console.log(`✅ Table ${table.dataset.tableId} sauvegardée`);
                } catch (error) {
                    console.error(`❌ Erreur sauvegarde ${table.dataset.tableId}:`, error);
                }
            }
        });
    } else {
        console.warn("⚠️ Impossible de tester la sauvegarde manuelle");
    }

    // 5. Instructions pour l'utilisateur
    console.log("\n\n📝 INSTRUCTIONS:");
    console.log("1. Cochez/décochez une checkbox dans une table CIA");
    console.log("2. Attendez 1 seconde");
    console.log("3. Rechargez la page (F5)");
    console.log("4. Vérifiez si la checkbox est toujours cochée");
    console.log("\n💡 Si la checkbox n'est pas persistante:");
    console.log("   - Vérifiez que la table a un ID (dataset.tableId)");
    console.log("   - Vérifiez que localStorage contient les données");
    console.log("   - Vérifiez que isCheckboxCell et isChecked sont sauvegardés");

    console.log("\n" + "=".repeat(60));
    console.log("✅ Diagnostic terminé");
})();
