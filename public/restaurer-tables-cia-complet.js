/**
 * Restaurer les Tables CIA Complètes depuis localStorage
 * Utilisé quand Flowise est désactivé ou les tables disparaissent
 */

(function () {
    console.log("🔄 RESTAURATION COMPLÈTE DES TABLES CIA - Démarrage");

    function restaurerTablesCIA() {
        try {
            // Charger les données
            const data = JSON.parse(localStorage.getItem('claraverse_tables_data') || '{}');
            const allTables = Object.entries(data);
            const ciaTables = allTables.filter(([id, table]) => table.isCIATable);

            if (ciaTables.length === 0) {
                console.log("ℹ️ Aucune table CIA à restaurer");
                return;
            }

            console.log(`📊 ${ciaTables.length} table(s) CIA à restaurer`);

            // Trouver le conteneur principal
            let container = document.querySelector('.message-content') ||
                document.querySelector('.chat-messages') ||
                document.querySelector('main') ||
                document.querySelector('#root') ||
                document.body;

            // Créer un conteneur dédié pour les tables restaurées
            let tablesContainer = document.getElementById('restored-cia-tables');
            if (!tablesContainer) {
                tablesContainer = document.createElement('div');
                tablesContainer.id = 'restored-cia-tables';
                tablesContainer.className = 'restored-tables-container';
                tablesContainer.style.cssText = `
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        `;
                container.appendChild(tablesContainer);
            }

            let restoredCount = 0;

            ciaTables.forEach(([tableId, tableData]) => {
                try {
                    console.log(`🔄 Restauration table: ${tableId}`);

                    // Créer la table
                    const table = document.createElement('table');
                    table.dataset.tableId = tableId;
                    table.className = 'min-w-full border border-gray-200 rounded-lg';
                    table.style.cssText = `
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          `;

                    // Créer le header
                    if (tableData.headers && tableData.headers.length > 0) {
                        const thead = document.createElement('thead');
                        const headerRow = document.createElement('tr');

                        tableData.headers.forEach(headerText => {
                            const th = document.createElement('th');
                            th.textContent = headerText;
                            th.style.cssText = `
                border: 1px solid #ddd;
                padding: 12px;
                background: #f8f9fa;
                font-weight: bold;
                text-align: left;
              `;
                            headerRow.appendChild(th);
                        });

                        thead.appendChild(headerRow);
                        table.appendChild(thead);
                    }

                    // Créer le body
                    const tbody = document.createElement('tbody');

                    if (tableData.cells && tableData.cells.length > 0) {
                        // Organiser les cellules par ligne
                        const rowsData = {};
                        tableData.cells.forEach(cellData => {
                            if (!rowsData[cellData.row]) {
                                rowsData[cellData.row] = [];
                            }
                            rowsData[cellData.row][cellData.col] = cellData;
                        });

                        // Créer les lignes
                        Object.keys(rowsData).sort((a, b) => parseInt(a) - parseInt(b)).forEach(rowIndex => {
                            const tr = document.createElement('tr');
                            const rowCells = rowsData[rowIndex];

                            // S'assurer que toutes les colonnes sont présentes
                            const maxCol = Math.max(...rowCells.map((c, i) => i));
                            for (let colIndex = 0; colIndex <= maxCol; colIndex++) {
                                const cellData = rowCells[colIndex];
                                const td = document.createElement('td');
                                td.style.cssText = `
                  border: 1px solid #ddd;
                  padding: 12px;
                `;

                                if (cellData) {
                                    if (cellData.isCheckboxCell) {
                                        // Créer la checkbox
                                        const checkbox = document.createElement('input');
                                        checkbox.type = 'checkbox';
                                        checkbox.checked = cellData.isChecked || false;
                                        checkbox.style.cssText = `
                      width: 20px;
                      height: 20px;
                      cursor: pointer;
                      accent-color: #007bff;
                    `;

                                        // Ajouter l'événement de sauvegarde
                                        checkbox.addEventListener('change', function () {
                                            if (window.claraverseProcessor) {
                                                setTimeout(() => {
                                                    window.claraverseProcessor.autoSaveAllTables();
                                                }, 500);
                                            }
                                        });

                                        td.appendChild(checkbox);

                                        if (cellData.isChecked) {
                                            td.style.backgroundColor = '#e8f5e8';
                                        }
                                    } else {
                                        // Cellule normale
                                        if (cellData.html) {
                                            td.innerHTML = cellData.html;
                                        } else {
                                            td.textContent = cellData.value || '';
                                        }

                                        if (cellData.bgColor) {
                                            td.style.backgroundColor = cellData.bgColor;
                                        }
                                    }
                                }

                                tr.appendChild(td);
                            }

                            tbody.appendChild(tr);
                        });
                    }

                    table.appendChild(tbody);

                    // Ajouter un titre si disponible
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-wrapper';
                    wrapper.style.cssText = `
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          `;

                    const title = document.createElement('h3');
                    title.textContent = `Table CIA - ${tableData.headers?.[1] || 'Sans titre'}`;
                    title.style.cssText = `
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
          `;
                    wrapper.appendChild(title);

                    wrapper.appendChild(table);
                    tablesContainer.appendChild(wrapper);

                    restoredCount++;
                    console.log(`✅ Table ${restoredCount}/${ciaTables.length} restaurée`);

                } catch (error) {
                    console.error(`❌ Erreur restauration table ${tableId}:`, error);
                }
            });

            if (restoredCount > 0) {
                console.log(`✅ ${restoredCount} table(s) CIA restaurée(s) avec succès`);

                // Notification
                const notification = document.createElement('div');
                notification.textContent = `✅ ${restoredCount} table(s) CIA restaurée(s)`;
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
            }

        } catch (error) {
            console.error("❌ Erreur lors de la restauration des tables CIA:", error);
        }
    }

    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(restaurerTablesCIA, 1000);
        });
    } else {
        setTimeout(restaurerTablesCIA, 1000);
    }

    // Exposer la fonction globalement
    window.restaurerTablesCIA = restaurerTablesCIA;

    console.log("✅ Script de restauration complète chargé");
    console.log("💡 Utilisez: window.restaurerTablesCIA() pour forcer la restauration");

})();
