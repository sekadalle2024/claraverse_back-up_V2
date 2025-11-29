/**
 * Script de force pour les checkboxes CIA
 * Force la détection et la création des checkboxes pour les tables d'examen CIA
 * générées dynamiquement par le chat
 */

(function () {
    'use strict';

    console.log('🔧 CIA Checkbox Force - Démarrage');

    // Attendre que conso.js soit chargé
    function waitForConso() {
        if (typeof window.ClaraverseTableProcessor === 'undefined') {
            console.log('⏳ En attente de conso.js...');
            setTimeout(waitForConso, 500);
            return;
        }

        console.log('✅ conso.js détecté, activation du force CIA');
        initCIAForce();
    }

    function initCIAForce() {
        // Observer pour détecter les nouvelles tables dans le chat
        const chatObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Chercher les tables dans le noeud ajouté
                        let tables = [];

                        if (node.tagName === 'TABLE') {
                            tables.push(node);
                        } else if (node.querySelector) {
                            tables = Array.from(node.querySelectorAll('table'));
                        }

                        tables.forEach((table) => {
                            // Vérifier si c'est une table CIA (avec colonne Reponse_user)
                            const headers = Array.from(table.querySelectorAll('th, thead td'));
                            const hasReponseUser = headers.some(th =>
                                /reponse[_\s]?user/i.test(th.textContent.trim())
                            );

                            if (hasReponseUser) {
                                console.log('🎯 Table CIA détectée, forçage du traitement...');

                                // Attendre un peu que React finisse de rendre
                                setTimeout(() => {
                                    forceProcessTable(table);
                                }, 100);
                            }
                        });
                    }
                });
            });
        });

        // Observer le conteneur du chat
        const chatContainer = document.querySelector('#root') || document.body;
        chatObserver.observe(chatContainer, {
            childList: true,
            subtree: true
        });

        console.log('👀 Observation du chat activée');

        // Forcer le traitement des tables existantes
        setTimeout(() => {
            console.log('🔍 Scan initial des tables CIA...');
            const allTables = document.querySelectorAll('table');
            let ciaTablesFound = 0;

            allTables.forEach((table) => {
                const headers = Array.from(table.querySelectorAll('th, thead td'));
                const hasReponseUser = headers.some(th =>
                    /reponse[_\s]?user/i.test(th.textContent.trim())
                );

                if (hasReponseUser) {
                    ciaTablesFound++;
                    console.log(`📋 Table CIA ${ciaTablesFound} trouvée, traitement...`);
                    forceProcessTable(table);
                }
            });

            if (ciaTablesFound === 0) {
                console.log('ℹ️ Aucune table CIA trouvée pour le moment');
            } else {
                console.log(`✅ ${ciaTablesFound} table(s) CIA traitée(s)`);
            }
        }, 1000);
    }

    function forceProcessTable(table) {
        // Vérifier si la table a déjà des checkboxes
        const existingCheckboxes = table.querySelectorAll('input[type="checkbox"]');
        if (existingCheckboxes.length > 0) {
            console.log('⏭️ Table déjà traitée, skip');
            return;
        }

        // Trouver l'index de la colonne Reponse_user
        const headers = Array.from(table.querySelectorAll('th, thead td'));
        let reponseUserIndex = -1;

        headers.forEach((th, index) => {
            if (/reponse[_\s]?user/i.test(th.textContent.trim())) {
                reponseUserIndex = index;
            }
        });

        if (reponseUserIndex === -1) {
            console.log('❌ Colonne Reponse_user non trouvée');
            return;
        }

        console.log(`✓ Colonne Reponse_user trouvée à l'index ${reponseUserIndex}`);

        // Créer les checkboxes dans toutes les lignes
        const tbody = table.querySelector('tbody') || table;
        const rows = tbody.querySelectorAll('tr');
        let checkboxesCreated = 0;

        rows.forEach((row, rowIndex) => {
            // Skip header rows
            if (row.querySelector('th')) return;

            const cells = row.querySelectorAll('td');
            const cell = cells[reponseUserIndex];

            if (cell && !cell.querySelector('input[type="checkbox"]')) {
                createCheckbox(cell, row, table);
                checkboxesCreated++;
            }
        });

        console.log(`✅ ${checkboxesCreated} checkbox(es) créée(s)`);

        // Notifier conso.js pour qu'il prenne en charge la persistance
        if (typeof window.initClaraverseProcessor === 'function') {
            // Forcer le retraitement par conso.js
            setTimeout(() => {
                const event = new CustomEvent('cia-table-ready', { detail: { table } });
                document.dispatchEvent(event);
            }, 100);
        }
    }

    function createCheckbox(cell, row, table) {
        // Vérifier si la cellule a une valeur sauvegardée
        const isChecked = cell.textContent.trim() === '✓' || cell.dataset.checked === 'true';

        cell.innerHTML = '';
        cell.style.cursor = 'pointer';
        cell.style.backgroundColor = isChecked ? '#e8f5e8' : '#f8f9fa';
        cell.style.textAlign = 'center';
        cell.title = 'Cliquez pour sélectionner votre réponse';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isChecked;
        checkbox.style.cssText = `
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #007bff;
    `;
        cell.appendChild(checkbox);

        if (isChecked) {
            cell.dataset.checked = 'true';
        }

        // Gérer le clic
        const handleCheckboxChange = (e) => {
            e.stopPropagation();

            const isNowChecked = checkbox.checked;

            if (isNowChecked) {
                // Décocher toutes les autres checkboxes de la même table
                const tbody = table.querySelector('tbody') || table;
                const allRows = tbody.querySelectorAll('tr');

                allRows.forEach((otherRow) => {
                    if (otherRow !== row) {
                        const cells = otherRow.querySelectorAll('td');
                        cells.forEach((otherCell) => {
                            const otherCheckbox = otherCell.querySelector('input[type="checkbox"]');
                            if (otherCheckbox) {
                                otherCheckbox.checked = false;
                                otherCell.dataset.checked = 'false';
                                otherCell.style.backgroundColor = '#f8f9fa';
                            }
                        });
                    }
                });

                // Marquer cette cellule comme cochée
                cell.dataset.checked = 'true';
                cell.style.backgroundColor = '#e8f5e8';
                console.log('✓ Réponse sélectionnée');
            } else {
                // Décocher cette cellule
                cell.dataset.checked = 'false';
                cell.style.backgroundColor = '#f8f9fa';
                console.log('✗ Réponse désélectionnée');
            }

            // Déclencher la sauvegarde via conso.js
            if (typeof claraverseCommands !== 'undefined' && claraverseCommands.saveAllNow) {
                setTimeout(() => {
                    claraverseCommands.saveAllNow();
                    console.log('💾 Sauvegarde déclenchée');
                }, 500);
            }
        };

        checkbox.addEventListener('change', handleCheckboxChange);
        cell.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                e.stopPropagation();
                checkbox.checked = !checkbox.checked;
                handleCheckboxChange(e);
            }
        });
    }

    // Démarrer
    waitForConso();

    console.log('🎯 CIA Checkbox Force initialisé');
})();
