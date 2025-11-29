/**
 * Script de diagnostic pour les checkboxes CIA
 * Permet de voir ce qui se passe avec les IDs et la persistance
 */

(function () {
    console.log('🔍 DIAGNOSTIC CHECKBOXES CIA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Attendre que conso.js soit chargé
    setTimeout(() => {
        if (typeof claraverseCommands === 'undefined') {
            console.error('❌ claraverseCommands non disponible');
            return;
        }

        console.log('✅ claraverseCommands disponible');
        console.log('');

        // 1. Lister toutes les tables
        console.log('📊 TABLES DÉTECTÉES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const tables = document.querySelectorAll('table');
        console.log(`Total: ${tables.length} table(s)`);
        console.log('');

        tables.forEach((table, index) => {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
            const hasReponseUser = headers.some(h => /reponse[_\s]?user/i.test(h));
            const tableId = table.dataset.tableId;
            const checkboxes = table.querySelectorAll('input[type="checkbox"]');

            console.log(`Table ${index + 1}:`);
            console.log(`  ID: ${tableId || '❌ AUCUN'}`);
            console.log(`  En-têtes: ${headers.join(', ')}`);
            console.log(`  Colonne Reponse_user: ${hasReponseUser ? '✅' : '❌'}`);
            console.log(`  Checkboxes: ${checkboxes.length}`);

            if (checkboxes.length > 0) {
                const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                console.log(`  Checkboxes cochées: ${checkedCount}`);
            }
            console.log('');
        });

        // 2. Vérifier le localStorage
        console.log('💾 DONNÉES DANS LOCALSTORAGE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            const data = localStorage.getItem('claraverse_tables_data');
            if (!data) {
                console.log('❌ Aucune donnée trouvée');
            } else {
                const parsed = JSON.parse(data);
                const tableIds = Object.keys(parsed);
                console.log(`Total: ${tableIds.length} table(s) sauvegardée(s)`);
                console.log('');

                tableIds.forEach((id, index) => {
                    const tableData = parsed[id];
                    const checkboxCells = tableData.cells ? tableData.cells.filter(c => c.isCheckboxCell) : [];
                    const checkedCells = checkboxCells.filter(c => c.isChecked);

                    console.log(`Table ${index + 1}:`);
                    console.log(`  ID: ${id}`);
                    console.log(`  Timestamp: ${new Date(tableData.timestamp).toLocaleString('fr-FR')}`);
                    console.log(`  Cellules totales: ${tableData.cells ? tableData.cells.length : 0}`);
                    console.log(`  Cellules checkbox: ${checkboxCells.length}`);
                    console.log(`  Checkboxes cochées: ${checkedCells.length}`);

                    if (checkedCells.length > 0) {
                        checkedCells.forEach(cell => {
                            console.log(`    → Ligne ${cell.row}, Colonne ${cell.col}`);
                        });
                    }
                    console.log('');
                });
            }
        } catch (error) {
            console.error('❌ Erreur lecture localStorage:', error);
        }

        // 3. Comparer les IDs
        console.log('🔍 COMPARAISON IDs DOM vs LOCALSTORAGE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            const data = localStorage.getItem('claraverse_tables_data');
            if (data) {
                const parsed = JSON.parse(data);
                const savedIds = Object.keys(parsed);

                tables.forEach((table, index) => {
                    const tableId = table.dataset.tableId;
                    const inStorage = savedIds.includes(tableId);

                    console.log(`Table ${index + 1}:`);
                    console.log(`  ID DOM: ${tableId || '❌ AUCUN'}`);
                    console.log(`  Dans localStorage: ${inStorage ? '✅' : '❌'}`);

                    if (!inStorage && tableId) {
                        console.log(`  ⚠️ Table non trouvée dans le stockage!`);
                        console.log(`  IDs disponibles: ${savedIds.join(', ')}`);
                    }
                    console.log('');
                });
            }
        } catch (error) {
            console.error('❌ Erreur comparaison:', error);
        }

        // 4. Test de sauvegarde
        console.log('🧪 TEST DE SAUVEGARDE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Cochez une checkbox, puis attendez 1 seconde...');
        console.log('Ensuite, tapez: diagnosticCheckboxesCIA.verifyAfterSave()');
        console.log('');

        // 5. Fonction de vérification après sauvegarde
        window.diagnosticCheckboxesCIA = {
            verifyAfterSave: function () {
                console.log('');
                console.log('🔍 VÉRIFICATION APRÈS SAUVEGARDE:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                const tables = document.querySelectorAll('table');
                const data = JSON.parse(localStorage.getItem('claraverse_tables_data') || '{}');

                tables.forEach((table, index) => {
                    const tableId = table.dataset.tableId;
                    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
                    const checkedInDOM = Array.from(checkboxes).filter(cb => cb.checked).length;

                    console.log(`Table ${index + 1} (${tableId}):`);
                    console.log(`  Checkboxes cochées dans DOM: ${checkedInDOM}`);

                    if (data[tableId]) {
                        const checkboxCells = data[tableId].cells.filter(c => c.isCheckboxCell);
                        const checkedInStorage = checkboxCells.filter(c => c.isChecked).length;
                        console.log(`  Checkboxes cochées dans storage: ${checkedInStorage}`);
                        console.log(`  Match: ${checkedInDOM === checkedInStorage ? '✅' : '❌'}`);
                    } else {
                        console.log(`  ❌ Table non trouvée dans le stockage`);
                    }
                    console.log('');
                });
            },

            forceIds: function () {
                console.log('');
                console.log('🔧 FORCER L\'ATTRIBUTION DES IDs:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                claraverseCommands.forceAssignIds();

                setTimeout(() => {
                    const tables = document.querySelectorAll('table');
                    tables.forEach((table, index) => {
                        console.log(`Table ${index + 1}: ${table.dataset.tableId || '❌ AUCUN'}`);
                    });
                }, 100);
            },

            forceSave: function () {
                console.log('');
                console.log('💾 FORCER LA SAUVEGARDE:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                claraverseCommands.saveAllNow();

                setTimeout(() => {
                    this.verifyAfterSave();
                }, 500);
            },

            testComplete: function () {
                console.log('');
                console.log('🧪 TEST COMPLET:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('1. Attribution des IDs...');

                this.forceIds();

                setTimeout(() => {
                    console.log('2. Sauvegarde...');
                    this.forceSave();

                    setTimeout(() => {
                        console.log('3. Vérification...');
                        this.verifyAfterSave();
                        console.log('');
                        console.log('✅ Test terminé');
                        console.log('💡 Rechargez la page pour tester la restauration');
                    }, 1000);
                }, 500);
            },

            help: function () {
                console.log('');
                console.log('📚 COMMANDES DISPONIBLES:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('diagnosticCheckboxesCIA.verifyAfterSave()  - Vérifier après sauvegarde');
                console.log('diagnosticCheckboxesCIA.forceIds()         - Forcer attribution IDs');
                console.log('diagnosticCheckboxesCIA.forceSave()        - Forcer sauvegarde');
                console.log('diagnosticCheckboxesCIA.testComplete()     - Test complet');
                console.log('diagnosticCheckboxesCIA.help()             - Afficher cette aide');
                console.log('');
            }
        };

        console.log('');
        console.log('💡 COMMANDES DISPONIBLES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('diagnosticCheckboxesCIA.help()         - Afficher l\'aide');
        console.log('diagnosticCheckboxesCIA.testComplete() - Lancer test complet');
        console.log('');

    }, 2000);
})();
