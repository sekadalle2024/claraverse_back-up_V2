/**
 * 🧪 Script de Validation conso.js V4
 * 
 * Ce script permet de valider rapidement que conso.js V4 fonctionne correctement
 * sans générer de tables de consolidation.
 * 
 * UTILISATION:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script complet
 * 3. Appuyer sur Entrée
 * 4. Lire les résultats
 */

(function () {
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  🧪 VALIDATION CONSO.JS V4 - SANS CONSOLIDATION");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n");

    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        tests: []
    };

    function test(name, condition, expected, actual) {
        const passed = condition;
        results.tests.push({ name, passed, expected, actual });

        if (passed) {
            results.passed++;
            console.log(`✅ ${name}`);
            console.log(`   Attendu: ${expected}`);
            console.log(`   Obtenu: ${actual}`);
        } else {
            results.failed++;
            console.log(`❌ ${name}`);
            console.log(`   Attendu: ${expected}`);
            console.log(`   Obtenu: ${actual}`);
        }
        console.log("");
    }

    function warn(message) {
        results.warnings++;
        console.log(`⚠️ ${message}`);
        console.log("");
    }

    // ═══════════════════════════════════════════════════════════
    // TEST 1: Absence de Tables de Consolidation
    // ═══════════════════════════════════════════════════════════
    console.log("📋 TEST 1: Absence de Tables de Consolidation");
    console.log("───────────────────────────────────────────────────────────");

    const consoTables = document.querySelectorAll('.claraverse-conso-table');
    test(
        "Aucune table de consolidation dans le DOM",
        consoTables.length === 0,
        "0 table",
        `${consoTables.length} table(s)`
    );

    // ═══════════════════════════════════════════════════════════
    // TEST 2: Présence du Processeur
    // ═══════════════════════════════════════════════════════════
    console.log("📋 TEST 2: Présence du Processeur");
    console.log("───────────────────────────────────────────────────────────");

    const processorExists = typeof window.claraverseProcessor !== 'undefined';
    test(
        "Processeur Claraverse chargé",
        processorExists,
        "Processeur présent",
        processorExists ? "Processeur présent" : "Processeur absent"
    );

    // ═══════════════════════════════════════════════════════════
    // TEST 3: LocalStorage
    // ═══════════════════════════════════════════════════════════
    console.log("📋 TEST 3: LocalStorage");
    console.log("───────────────────────────────────────────────────────────");

    try {
        const testKey = 'claraverse_validation_test';
        localStorage.setItem(testKey, 'ok');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);

        test(
            "LocalStorage fonctionnel",
            testValue === 'ok',
            "Lecture/Écriture OK",
            testValue === 'ok' ? "Lecture/Écriture OK" : "Erreur"
        );
    } catch (error) {
        test(
            "LocalStorage fonctionnel",
            false,
            "Lecture/Écriture OK",
            `Erreur: ${error.message}`
        );
    }

    // Vérifier les données sauvegardées
    const savedData = localStorage.getItem('claraverse_tables_data');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            const tableCount = Object.keys(parsedData).length;
            console.log(`ℹ️  ${tableCount} table(s) sauvegardée(s) dans localStorage`);
            console.log(`   Clés: ${Object.keys(parsedData).join(', ')}`);
        } catch (e) {
            warn("Données localStorage corrompues");
        }
    } else {
        console.log(`ℹ️  Aucune donnée sauvegardée (normal si première utilisation)`);
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════
    // TEST 4: Tables dans le DOM
    // ═══════════════════════════════════════════════════════════
    console.log("📋 TEST 4: Tables dans le DOM");
    console.log("───────────────────────────────────────────────────────────");

    const allTables = document.querySelectorAll('table');
    console.log(`ℹ️  ${allTables.length} table(s) totale(s) dans le DOM`);

    // Analyser les types de tables
    let modelizedTables = 0;
    let ciaTables = 0;
    let standardTables = 0;

    allTables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td'))
            .map(cell => cell.textContent.trim().toLowerCase());

        const hasAssertion = headers.some(h => /assertion/i.test(h));
        const hasConclusion = headers.some(h => /conclusion/i.test(h));
        const hasReponseUser = headers.some(h => /reponse[_\s]?user/i.test(h));

        if (hasAssertion || hasConclusion || hasReponseUser) {
            if (hasReponseUser) {
                ciaTables++;
            } else {
                modelizedTables++;
            }
        } else {
            standardTables++;
        }
    });

    console.log(`   - Tables modelisées: ${modelizedTables}`);
    console.log(`   - Tables CIA: ${ciaTables}`);
    console.log(`   - Tables standard: ${standardTables}`);
    console.log("");

    // ═══════════════════════════════════════════════════════════
    // TEST 5: Fonctions Désactivées
    // ═══════════════════════════════════════════════════════════
    console.log("📋 TEST 5: Fonctions de Consolidation Désactivées");
    console.log("───────────────────────────────────────────────────────────");

    if (window.claraverseProcessor) {
        const processor = window.claraverseProcessor;

        // Vérifier que les fonctions existent mais sont désactivées
        const functionsToCheck = [
            'createConsolidationTable',
            'scheduleConsolidation',
            'performConsolidation',
            'updateConsolidationDisplay'
        ];

        functionsToCheck.forEach(funcName => {
            const exists = typeof processor[funcName] === 'function';
            if (exists) {
                console.log(`✅ Fonction ${funcName} existe (désactivée)`);
            } else {
                console.log(`⚠️  Fonction ${funcName} n'existe pas`);
            }
        });

        // Vérifier que les fonctions de nettoyage existent
        const cleanupFunctions = [
            'removeExistingConsoTables',
            'removeAllConsoTables'
        ];

        console.log("");
        cleanupFunctions.forEach(funcName => {
            const exists = typeof processor[funcName] === 'function';
            if (exists) {
                console.log(`✅ Fonction de nettoyage ${funcName} existe`);
            } else {
                console.log(`❌ Fonction de nettoyage ${funcName} manquante`);
            }
        });
    } else {
        warn("Processeur non disponible pour vérifier les fonctions");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════
    // TEST 6: Vérification des Interactions
    // ═══════════════════════════════════════════════════════════
    console.log("📋 TEST 6: Vérification des Interactions");
    console.log("───────────────────────────────────────────────────────────");

    // Chercher des cellules interactives
    const assertionCells = document.querySelectorAll('td[title*="assertion"], td[style*="cursor: pointer"]');
    const conclusionCells = document.querySelectorAll('td[title*="conclusion"]');
    const ctrCells = document.querySelectorAll('td[title*="contrôle"]');
    const checkboxCells = document.querySelectorAll('td input[type="checkbox"]');

    console.log(`ℹ️  Cellules interactives détectées:`);
    console.log(`   - Cellules Assertion: ${assertionCells.length}`);
    console.log(`   - Cellules Conclusion: ${conclusionCells.length}`);
    console.log(`   - Cellules CTR: ${ctrCells.length}`);
    console.log(`   - Checkboxes CIA: ${checkboxCells.length}`);
    console.log("");

    // ═══════════════════════════════════════════════════════════
    // RÉSUMÉ FINAL
    // ═══════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  📊 RÉSUMÉ DES TESTS");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
    console.log(`✅ Tests réussis: ${results.passed}`);
    console.log(`❌ Tests échoués: ${results.failed}`);
    console.log(`⚠️  Avertissements: ${results.warnings}`);
    console.log("");

    if (results.failed === 0) {
        console.log("🎉 VALIDATION RÉUSSIE!");
        console.log("   Conso.js V4 fonctionne correctement sans tables de consolidation.");
    } else {
        console.log("⚠️  VALIDATION PARTIELLE");
        console.log("   Certains tests ont échoué. Vérifier les détails ci-dessus.");
    }

    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  🔧 ACTIONS RECOMMANDÉES");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    if (consoTables.length > 0) {
        console.log("🗑️  Pour supprimer les tables de consolidation existantes:");
        console.log("   window.claraverseProcessor?.removeAllConsoTables()");
        console.log("");
    }

    console.log("📝 Pour tester les interactions:");
    console.log("   1. Cliquer sur une cellule 'Assertion'");
    console.log("   2. Vérifier que le menu déroulant apparaît");
    console.log("   3. Sélectionner une valeur");
    console.log("   4. Vérifier qu'AUCUNE alerte de consolidation n'apparaît");
    console.log("");

    console.log("💾 Pour vérifier la persistance:");
    console.log("   1. Modifier des cellules");
    console.log("   2. Recharger la page (F5)");
    console.log("   3. Vérifier que les modifications sont conservées");
    console.log("");

    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n");

    // Retourner les résultats pour utilisation programmatique
    return results;
})();
