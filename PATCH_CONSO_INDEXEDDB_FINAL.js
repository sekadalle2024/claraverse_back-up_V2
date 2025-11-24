/**
 * PATCH FINAL - Intégration conso.js avec IndexedDB
 * 
 * Ce fichier contient les 4 modifications à apporter à conso.js
 * pour intégrer le système de persistance IndexedDB
 * 
 * Instructions : Copier-coller chaque section dans conso.js
 */

// ============================================
// MODIFICATION 1 : Remplacer saveTableDataNow()
// Ligne ~1533
// ============================================

saveTableDataNow(table) {
    if (!table) {
        debug.warn("⚠️ saveTableDataNow: table est null ou undefined");
        return;
    }

    // ✅ NOUVEAU : Utiliser le système IndexedDB via claraverseSyncAPI
    if (window.claraverseSyncAPI && window.claraverseSyncAPI.forceSaveTable) {
        debug.log("💾 Sauvegarde via IndexedDB (claraverseSyncAPI)");

        window.claraverseSyncAPI.forceSaveTable(table)
            .then(() => {
                debug.log("✅ Table sauvegardée dans IndexedDB");
            })
            .catch((error) => {
                debug.error("❌ Erreur sauvegarde IndexedDB:", error);
                // Fallback vers localStorage
                this.saveTableDataLocalStorage(table);
            });
    } else {
        // Fallback si l'API n'est pas disponible
        debug.warn("⚠️ claraverseSyncAPI non disponible, utilisation localStorage");
        this.saveTableDataLocalStorage(table);
    }
}

// ============================================
// MODIFICATION 2 : Ajouter saveTableDataLocalStorage()
// À ajouter APRÈS saveTableDataNow()
// ============================================

/**
 * Méthode de fallback pour sauvegarder dans localStorage
 * Utilisée si IndexedDB n'est pas disponible
 */
saveTableDataLocalStorage(table) {
    try {
        const tableId = this.generateUniqueTableId(table);
        const data = this.extractTableData(table);

        const allData = this.loadAllData();
        allData[tableId] = {
            data: data,
            timestamp: Date.now(),
            tableId: tableId,
        };

        this.saveAllData(allData);
        debug.log(`💾 Table ${tableId} sauvegardée (localStorage fallback)`);
    } catch (error) {
        debug.error("❌ Erreur sauvegarde localStorage:", error);
    }
}

// ============================================
// MODIFICATION 3 : Modifier performConsolidation()
// Ligne ~604
// AJOUTER ce code APRÈS this.updateConsolidationDisplay(table, result);
// ============================================

// Dans performConsolidation(), après updateConsolidationDisplay() :

// ✅ NOUVEAU : Notifier le système de persistance
const consoTable = this.findExistingConsoTable(table);
if (consoTable) {
    debug.log("📢 Notification changement table consolidation");

    // Sauvegarder la table de consolidation
    if (window.claraverseSyncAPI && window.claraverseSyncAPI.forceSaveTable) {
        window.claraverseSyncAPI.forceSaveTable(consoTable)
            .then(() => {
                debug.log("✅ Table consolidation sauvegardée");
            })
            .catch((error) => {
                debug.error("❌ Erreur sauvegarde consolidation:", error);
            });
    }

    // Déclencher événement de changement de structure
    const event = new CustomEvent('flowise:table:structure:changed', {
        detail: {
            table: consoTable,
            source: 'conso',
            type: 'consolidation',
            timestamp: Date.now()
        }
    });
    document.dispatchEvent(event);
}

// ============================================
// MODIFICATION 4 : Modifier createConsolidationTable()
// Ligne ~540
// REMPLACER la création de consoTable par ce code
// ============================================

createConsolidationTable(table) {
    const existingConso = this.findExistingConsoTable(table);
    if (existingConso) {
        debug.log("Table de consolidation existante trouvée");
        return;
    }

    const consoTable = document.createElement("table");
    consoTable.className = "claraverse-conso-table";

    // ✅ NOUVEAU : Assigner un ID stable pour IndexedDB
    const tableId = this.generateTableId(table);
    consoTable.dataset.tableId = `conso-${tableId}`;
    consoTable.dataset.tableType = "generated"; // Marquer comme table générée
    consoTable.dataset.sourceTable = table.dataset.tableId || tableId;

    consoTable.style.cssText = `
        width: 100%;
        margin-bottom: 20px;
        border-collapse: collapse;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 2px solid #007bff;
        border-radius: 8px;
        overflow: hidden;
    `;

    consoTable.innerHTML = `
        <thead>
            <tr>
                <th style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 15px; text-align: left; font-weight: bold;">
                    📊 Table de Consolidation
                </th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td id="conso-content-${tableId}" style="padding: 15px; background: #f8f9fa; min-height: 50px;">
                    ⏳ En attente de consolidation...
                </td>
            </tr>
        </tbody>
    `;

    this.insertConsoTable(table, consoTable);
    debug.log(`Table de consolidation créée avec ID: conso-${tableId}`);

    // ✅ NOUVEAU : Sauvegarder immédiatement dans IndexedDB
    if (window.claraverseSyncAPI && window.claraverseSyncAPI.forceSaveTable) {
        setTimeout(() => {
            debug.log("💾 Sauvegarde initiale table consolidation");
            window.claraverseSyncAPI.forceSaveTable(consoTable)
                .then(() => {
                    debug.log("✅ Table consolidation initialisée dans IndexedDB");
                })
                .catch((error) => {
                    debug.error("❌ Erreur initialisation consolidation:", error);
                });
        }, 500);
    }
}

// ============================================
// MODIFICATION 5 : Modifier restoreAllTablesData()
// Ligne ~1734
// REMPLACER tout le contenu de la fonction
// ============================================

restoreAllTablesData() {
    debug.log("📂 Restauration de toutes les tables...");

    // ✅ NOUVEAU : Utiliser le système IndexedDB au lieu de localStorage
    debug.log("🔄 Restauration déléguée au système IndexedDB");
    debug.log("ℹ️ Les tables seront restaurées automatiquement par auto-restore-chat-change.js");

    // Ne plus restaurer depuis localStorage
    // Le système IndexedDB gère tout automatiquement via :
    // - auto-restore-chat-change.js (changement de chat)
    // - single-restore-on-load.js (rechargement page)
    // - menuIntegration.ts (écoute des événements)

    return;
}

// ============================================
// MODIFICATION 6 (OPTIONNELLE) : Ajouter generateUniqueTableId()
// Si cette méthode n'existe pas déjà
// ============================================

/**
 * Générer un ID unique et stable pour une table
 */
generateUniqueTableId(table) {
    // Si la table a déjà un ID, le réutiliser
    if (table.dataset.tableId) {
        return table.dataset.tableId;
    }

    // Sinon, générer un ID basé sur le contenu
    try {
        const content = table.outerHTML.substring(0, 1000);
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const tableId = `table-${Math.abs(hash).toString(36)}`;

        // Assigner l'ID à la table pour le réutiliser
        table.dataset.tableId = tableId;

        return tableId;
    } catch (error) {
        // Fallback : ID basé sur timestamp
        const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        table.dataset.tableId = tableId;
        return tableId;
    }
}

// ============================================
// MODIFICATION 7 (OPTIONNELLE) : Ajouter extractTableData()
// Si cette méthode n'existe pas déjà
// ============================================

/**
 * Extraire les données d'une table sous forme de tableau 2D
 */
extractTableData(table) {
    const data = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td, th');

        cells.forEach(cell => {
            rowData.push(cell.textContent || '');
        });

        if (rowData.length > 0) {
            data.push(rowData);
        }
    });

    return data;
}

// ============================================
// FIN DU PATCH
// ============================================

/**
 * RÉSUMÉ DES MODIFICATIONS :
 * 
 * 1. saveTableDataNow() → Utilise IndexedDB via claraverseSyncAPI
 * 2. saveTableDataLocalStorage() → Fallback localStorage
 * 3. performConsolidation() → Notifie et sauvegarde les changements
 * 4. createConsolidationTable() → Assigne ID stable et sauvegarde initiale
 * 5. restoreAllTablesData() → Délègue à IndexedDB
 * 6. generateUniqueTableId() → Génère ID stable (si nécessaire)
 * 7. extractTableData() → Extrait données table (si nécessaire)
 * 
 * ORDRE D'APPLICATION :
 * 1. Sauvegarder conso.js
 * 2. Appliquer modifications 1-5 (obligatoires)
 * 3. Appliquer modifications 6-7 (si méthodes manquantes)
 * 4. Recharger l'application
 * 5. Tester
 * 
 * TEMPS ESTIMÉ : 15-20 minutes
 */
