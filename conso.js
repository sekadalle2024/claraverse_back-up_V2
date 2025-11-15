/**
 * Claraverse Table Consolidation Script - Version React Compatible
 * Script optimisé pour fonctionner avec React et les tables dynamiques
 */

(function () {
  "use strict";

  console.log("🚀 Claraverse Table Script - Démarrage");

  // Configuration globale
  const CONFIG = {
    tableSelector:
      "table.min-w-full.border.border-gray-200.dark\\:border-gray-700 .rounded-lg, table.min-w-full",
    alternativeSelector: "div.prose table, .prose table, table",
    checkInterval: 1000,
    processDelay: 500,
    debugMode: true,
  };

  // Utilitaires de debug
  const debug = {
    log: (...args) =>
      CONFIG.debugMode && console.log("📋 [Claraverse]", ...args),
    error: (...args) => console.error("❌ [Claraverse]", ...args),
    warn: (...args) => console.warn("⚠️ [Claraverse]", ...args),
  };

  class ClaraverseTableProcessor {
    constructor() {
      this.processedTables = new WeakSet();
      this.dropdownVisible = false;
      this.currentDropdown = null;
      this.isInitialized = false;
      this.storageKey = "claraverse_tables_data";
      this.autoSaveDelay = 500; // Délai avant sauvegarde automatique
      this.saveTimeout = null; // Pour le debounce

      this.init();
    }

    init() {
      if (this.isInitialized) return;

      debug.log("Initialisation du processeur de tables");

      // Attendre que React soit prêt
      this.waitForReact(() => {
        // Test de localStorage au démarrage
        this.testLocalStorage();
        this.setupGlobalEventListeners();
        this.startTableMonitoring();
        this.restoreAllTablesData(); // Restaurer les données sauvegardées
        this.isInitialized = true;
        debug.log("✅ Processeur initialisé avec succès");
      });
    }

    testLocalStorage() {
      try {
        const testKey = "claraverse_test";
        localStorage.setItem(testKey, "test");
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);

        if (testValue === "test") {
          debug.log("✅ localStorage fonctionne correctement");

          // Vérifier les données existantes
          const existingData = this.loadAllData();
          const tableCount = Object.keys(existingData).length;
          debug.log(`📦 ${tableCount} table(s) trouvée(s) dans le stockage`);

          if (tableCount > 0) {
            debug.log("📊 Tables sauvegardées:", Object.keys(existingData));
          }
        } else {
          debug.error("❌ localStorage ne fonctionne pas correctement");
        }
      } catch (error) {
        debug.error("❌ Erreur de test localStorage:", error);
        alert(
          "⚠️ Le stockage local n'est pas disponible. Les données ne seront pas sauvegardées.",
        );
      }
    }

    waitForReact(callback) {
      const checkReactReady = () => {
        // Vérifier si React est chargé et si des tables existent
        const hasReact =
          window.React ||
          document.querySelector("[data-reactroot]") ||
          document.querySelector("#root");
        const hasTables = this.findAllTables().length > 0;

        if (hasReact || hasTables) {
          debug.log("React détecté, démarrage du traitement");
          setTimeout(callback, 500); // Petit délai pour s'assurer que tout est prêt
        } else {
          debug.log("En attente de React...");
          setTimeout(checkReactReady, 1000);
        }
      };

      checkReactReady();
    }

    findAllTables() {
      // Essayer plusieurs sélecteurs pour trouver les tables
      const selectors = [
        CONFIG.tableSelector,
        CONFIG.alternativeSelector,
        "table",
        ".prose table",
        "div table",
      ];

      let allTables = [];

      for (const selector of selectors) {
        try {
          const tables = document.querySelectorAll(selector);
          allTables = [...allTables, ...Array.from(tables)];
        } catch (e) {
          debug.warn(`Sélecteur invalide: ${selector}`, e);
        }
      }

      // Supprimer les doublons
      const uniqueTables = [...new Set(allTables)];
      debug.log(`${uniqueTables.length} table(s) trouvée(s)`);

      return uniqueTables;
    }

    startTableMonitoring() {
      // Traitement initial
      this.processAllTables();

      // Surveillance continue avec MutationObserver
      this.setupMutationObserver();

      // Fallback avec setInterval pour les cas où MutationObserver ne suffit pas
      this.intervalId = setInterval(() => {
        this.processAllTables();
      }, CONFIG.checkInterval);

      // Sauvegarder périodiquement
      this.autoSaveIntervalId = setInterval(() => {
        this.autoSaveAllTables();
      }, 30000); // Sauvegarde automatique toutes les 30 secondes

      debug.log("Surveillance des tables démarrée");
    }

    setupMutationObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new MutationObserver((mutations) => {
        let shouldProcess = false;

        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            // Vérifier les nouveaux noeuds ajoutés
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (
                  node.tagName === "TABLE" ||
                  (node.querySelector && node.querySelector("table"))
                ) {
                  shouldProcess = true;
                }
              }
            });
          }
        });

        if (shouldProcess) {
          debug.log("Changement DOM détecté, retraitement des tables");
          setTimeout(() => this.processAllTables(), CONFIG.processDelay);
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    }

    processAllTables() {
      const tables = this.findAllTables();

      tables.forEach((table, index) => {
        if (!this.processedTables.has(table)) {
          debug.log(`Traitement de la table ${index + 1}`);
          this.processTable(table);
        }
      });
    }

    processTable(table) {
      try {
        const headers = this.getTableHeaders(table);
        if (headers.length === 0) {
          debug.warn("Aucun en-tête trouvé dans la table");
          return;
        }

        debug.log(
          "En-têtes trouvés:",
          headers.map((h) => h.text),
        );

        // Générer et assigner un ID unique immédiatement pour TOUTES les tables
        if (!table.dataset.tableId) {
          this.generateUniqueTableId(table);
          debug.log("✓ ID assigné à la table:", table.dataset.tableId);
        }

        if (this.isModelizedTable(headers)) {
          debug.log(
            "Table modelisée détectée - Configuration des interactions",
          );
          this.setupTableInteractions(table, headers);
          this.createConsolidationTable(table);
          this.processedTables.add(table);
        } else {
          debug.log("Table standard détectée - Sauvegarde uniquement");
          // Les tables non-modelisées seront quand même sauvegardées
          this.processedTables.add(table);
        }

        // Installer un MutationObserver sur TOUTES les tables pour détecter les changements
        this.setupTableChangeDetection(table);
      } catch (error) {
        debug.error("Erreur lors du traitement de la table:", error);
      }
    }

    getTableHeaders(table) {
      const headerSelectors = [
        "thead th",
        "thead td",
        "tr:first-child th",
        "tr:first-child td",
      ];

      for (const selector of headerSelectors) {
        const headers = table.querySelectorAll(selector);
        if (headers.length > 0) {
          return Array.from(headers).map((cell, index) => ({
            element: cell,
            text: cell.textContent.trim().toLowerCase(),
            index: index,
          }));
        }
      }

      return [];
    }

    isModelizedTable(headers) {
      const requiredColumns = ["conclusion", "assertion"];
      return requiredColumns.some((col) =>
        headers.some((header) => this.matchesColumn(header.text, col)),
      );
    }

    matchesColumn(headerText, columnType) {
      const patterns = {
        assertion: /assertion/i,
        conclusion: /conclusion/i,
        ctr: /ctr\d*/i,
        ecart: /ecart|montant/i,
        compte: /compte/i,
        resultat: /r[eé]sultat/i,
      };

      return patterns[columnType] && patterns[columnType].test(headerText);
    }

    setupTableInteractions(table, headers) {
      const tbody = table.querySelector("tbody") || table;
      const rows = tbody.querySelectorAll("tr");

      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0 && row.querySelector("th")) return; // Skip header row

        const cells = row.querySelectorAll("td");

        cells.forEach((cell, cellIndex) => {
          const header = headers[cellIndex];
          if (!header) return;

          // Supprimer les anciens event listeners
          cell.replaceWith(cell.cloneNode(true));
          const newCell = row.children[cellIndex];

          if (this.matchesColumn(header.text, "assertion")) {
            this.setupAssertionCell(newCell);
          } else if (this.matchesColumn(header.text, "conclusion")) {
            this.setupConclusionCell(newCell, table);
          } else if (this.matchesColumn(header.text, "ctr")) {
            this.setupCtrCell(newCell);
          }
        });
      });
    }

    setupAssertionCell(cell) {
      cell.style.cursor = "pointer";
      cell.style.backgroundColor = cell.style.backgroundColor || "#f8f9fa";
      cell.title = "Cliquez pour sélectionner une assertion";

      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showDropdown(
          cell,
          [
            "Validité",
            "Exhaustivité",
            "Formalisation",
            "Application",
            "Permanence",
          ],
          (value) => {
            cell.textContent = value;
            cell.style.backgroundColor = "#e8f5e8";
            debug.log(`Assertion sélectionnée: ${value}`);
            // Sauvegarder après modification
            const parentTable = this.findParentTable(cell);
            if (parentTable) {
              debug.log("💾 Déclenchement sauvegarde depuis assertion");
              this.saveTableData(parentTable);
            } else {
              debug.warn("⚠️ Table parente non trouvée pour sauvegarde");
            }
          },
        );
      });
    }

    setupConclusionCell(cell, table) {
      cell.style.cursor = "pointer";
      cell.style.backgroundColor = cell.style.backgroundColor || "#f8f9fa";
      cell.title = "Cliquez pour sélectionner une conclusion";

      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showDropdown(
          cell,
          ["Satisfaisant", "Non-Satisfaisant", "Limitation", "Non-Applicable"],
          (value) => {
            cell.textContent = value;

            if (value === "Non-Satisfaisant" || value === "Limitation") {
              cell.style.backgroundColor = "#fee";
              debug.log(`Conclusion défavorable sélectionnée: ${value}`);
              this.scheduleConsolidation(table);
            } else {
              cell.style.backgroundColor = "#efe";
            }
            // Sauvegarder après modification
            debug.log("💾 Déclenchement sauvegarde depuis conclusion");
            this.saveTableData(table);
          },
        );
      });
    }

    setupCtrCell(cell) {
      cell.style.cursor = "pointer";
      cell.style.backgroundColor = cell.style.backgroundColor || "#f8f9fa";
      cell.title = "Cliquez pour sélectionner un contrôle";

      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showDropdown(cell, ["+", "-", "N/A"], (value) => {
          cell.textContent = value;
          cell.style.backgroundColor =
            value === "+" ? "#e8f5e8" : value === "-" ? "#fee8e8" : "#f5f5f5";
          // Sauvegarder après modification
          const parentTable = this.findParentTable(cell);
          if (parentTable) {
            debug.log("💾 Déclenchement sauvegarde depuis CTR");
            this.saveTableData(parentTable);
          } else {
            debug.warn("⚠️ Table parente non trouvée pour sauvegarde");
          }
        });
      });
    }

    setupTableChangeDetection(table) {
      // Éviter de créer plusieurs observers pour la même table
      if (table.dataset.observerInstalled === "true") {
        return;
      }

      const tableId = table.dataset.tableId;
      debug.log(`🔍 Installation détecteur de changements sur ${tableId}`);

      // Créer un observer pour cette table
      const tableObserver = new MutationObserver((mutations) => {
        let hasChanges = false;

        mutations.forEach((mutation) => {
          // Détecter les changements dans les cellules
          if (
            mutation.type === "characterData" ||
            mutation.type === "childList"
          ) {
            hasChanges = true;
          }
          // Détecter les changements d'attributs (style, etc.)
          if (mutation.type === "attributes") {
            hasChanges = true;
          }
        });

        if (hasChanges) {
          debug.log(`📝 Changement détecté dans table ${tableId}`);
          // Sauvegarder avec debounce
          this.saveTableData(table);
        }
      });

      // Observer les changements dans la table
      tableObserver.observe(table, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: false,
        attributes: true,
        attributeFilter: ["style", "class"],
      });

      // Marquer comme installé
      table.dataset.observerInstalled = "true";

      // Stocker l'observer pour pouvoir le détruire plus tard
      if (!this.tableObservers) {
        this.tableObservers = new Map();
      }
      this.tableObservers.set(table, tableObserver);

      debug.log(`✅ Détecteur installé sur ${tableId}`);
    }

    showDropdown(targetCell, options, onSelect) {
      this.hideDropdown();

      const dropdown = document.createElement("div");
      dropdown.className = "claraverse-dropdown";
      dropdown.style.cssText = `
          position: fixed;
          background: white;
          border: 2px solid #007bff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          min-width: 150px;
          max-width: 200px;
          font-family: system-ui, -apple-system, sans-serif;
        `;

      const rect = targetCell.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
      dropdown.style.left = `${rect.left + window.scrollX}px`;

      options.forEach((option, index) => {
        const item = document.createElement("div");
        item.textContent = option;
        item.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: ${index < options.length - 1 ? "1px solid #eee" : "none"};
            transition: background-color 0.2s;
          `;

        item.addEventListener("mouseenter", () => {
          item.style.backgroundColor = "#f0f8ff";
        });

        item.addEventListener("mouseleave", () => {
          item.style.backgroundColor = "white";
        });

        item.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelect(option);
          this.hideDropdown();
        });

        dropdown.appendChild(item);
      });

      document.body.appendChild(dropdown);
      this.currentDropdown = dropdown;
      this.dropdownVisible = true;

      // Fermer le dropdown en cliquant ailleurs
      setTimeout(() => {
        document.addEventListener("click", this.hideDropdown.bind(this), {
          once: true,
        });
      }, 100);
    }

    hideDropdown() {
      if (
        this.currentDropdown &&
        document.body.contains(this.currentDropdown)
      ) {
        document.body.removeChild(this.currentDropdown);
      }
      this.currentDropdown = null;
      this.dropdownVisible = false;
    }

    createConsolidationTable(table) {
      const existingConso = this.findExistingConsoTable(table);
      if (existingConso) {
        debug.log("Table de consolidation existante trouvée");
        return;
      }

      const consoTable = document.createElement("table");
      consoTable.className = "claraverse-conso-table";
      consoTable.style.cssText = `
          width: 100%;
          margin-bottom: 20px;
          border-collapse: collapse;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 2px solid #007bff;
          border-radius: 8px;
          overflow: hidden;
        `;

      const tableId = this.generateTableId(table);
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

      // Insérer la table de consolidation
      this.insertConsoTable(table, consoTable);
      debug.log(`Table de consolidation créée avec ID: ${tableId}`);

      // Notifier dev.js de la création de la nouvelle table
      this.notifyTableCreated(consoTable);
    }

    findExistingConsoTable(table) {
      const parent = table.parentElement;
      if (!parent) return null;

      return parent.querySelector(".claraverse-conso-table");
    }

    insertConsoTable(table, consoTable) {
      const parent = table.parentElement;
      if (parent) {
        parent.insertBefore(consoTable, table);
      } else {
        table.before(consoTable);
      }
    }

    generateTableId(table) {
      return (
        table.id ||
        `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      );
    }

    scheduleConsolidation(table) {
      // Éviter les consolidations multiples rapides
      if (this.consolidationTimeout) {
        clearTimeout(this.consolidationTimeout);
      }

      this.consolidationTimeout = setTimeout(() => {
        this.performConsolidation(table);
      }, 300);
    }

    performConsolidation(table) {
      try {
        debug.log("Début de la consolidation");

        const headers = this.getTableHeaders(table);
        const hasCompte = headers.some((h) =>
          this.matchesColumn(h.text, "compte"),
        );
        const hasEcart = headers.some((h) =>
          this.matchesColumn(h.text, "ecart"),
        );

        let result = "";
        let consolidationData = {};

        if (hasCompte && hasEcart) {
          consolidationData = this.extractConsolidationData(
            table,
            headers,
            "withAccount",
          );
          result = this.consolidateWithAccount(table, headers);
        } else if (hasEcart) {
          consolidationData = this.extractConsolidationData(
            table,
            headers,
            "withoutAccount",
          );
          result = this.consolidateWithoutAccount(table, headers);
        } else {
          result = "⚠️ Table incomplète : colonnes ecart ou montant manquantes";
        }

        // 🚨 ALERTE DE DEBUG - Afficher le contenu de consolidation
        const alertMessage = this.generateAlertMessage(
          consolidationData,
          result,
        );
        alert(`📊 RÉSULTAT DE CONSOLIDATION\n\n${alertMessage}`);

        this.updateConsolidationDisplay(table, result);
        debug.log("Consolidation terminée");
      } catch (error) {
        debug.error("Erreur pendant la consolidation:", error);
        alert(
          `❌ ERREUR DE CONSOLIDATION\n\n${error.message}\n\nVoir la console pour plus de détails.`,
        );
        this.updateConsolidationDisplay(
          table,
          "❌ Erreur pendant la consolidation",
        );
      }
    }

    extractConsolidationData(table, headers, type) {
      const data = {
        type: type,
        totalRows: 0,
        processedRows: 0,
        assertions: {},
        rawData: [],
      };

      const tbody = table.querySelector("tbody") || table;
      const rows = tbody.querySelectorAll("tr");
      const colIndexes = this.getColumnIndexes(headers);

      rows.forEach((row, index) => {
        if (index === 0 && row.querySelector("th")) return;

        const cells = row.querySelectorAll("td");
        if (cells.length === 0) return;

        data.totalRows++;

        const assertion = cells[colIndexes.assertion]?.textContent?.trim();
        const conclusion = cells[colIndexes.conclusion]?.textContent?.trim();
        const compte = cells[colIndexes.compte]?.textContent?.trim();
        const ecart = cells[colIndexes.ecart]?.textContent?.trim();

        const rowData = {
          row: index + 1,
          assertion,
          conclusion,
          compte,
          ecart,
          montant: this.parseMontant(ecart),
        };

        data.rawData.push(rowData);

        if (
          assertion &&
          (conclusion === "Non-Satisfaisant" || conclusion === "Limitation")
        ) {
          data.processedRows++;

          if (!data.assertions[assertion]) {
            data.assertions[assertion] = {
              comptes: new Set(),
              total: 0,
              occurrences: 0,
            };
          }

          if (compte) data.assertions[assertion].comptes.add(compte);
          data.assertions[assertion].total += rowData.montant;
          data.assertions[assertion].occurrences++;
        }
      });

      return data;
    }

    generateAlertMessage(consolidationData, finalResult) {
      if (!consolidationData || Object.keys(consolidationData).length === 0) {
        return "Aucune donnée de consolidation disponible.";
      }

      let message = `📋 ANALYSE DE LA TABLE\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `Total lignes analysées: ${consolidationData.totalRows}\n`;
      message += `Lignes avec non-conformités: ${consolidationData.processedRows}\n`;
      message += `Type de consolidation: ${consolidationData.type}\n\n`;

      if (consolidationData.rawData && consolidationData.rawData.length > 0) {
        message += `📊 DONNÉES BRUTES:\n`;
        consolidationData.rawData.forEach((row, index) => {
          if (
            row.conclusion === "Non-Satisfaisant" ||
            row.conclusion === "Limitation"
          ) {
            message += `Ligne ${row.row}: ${row.assertion} | ${row.conclusion} | ${row.compte || "N/A"} | ${row.ecart}\n`;
          }
        });
        message += `\n`;
      }

      if (
        consolidationData.assertions &&
        Object.keys(consolidationData.assertions).length > 0
      ) {
        message += `🔍 CONSOLIDATION PAR ASSERTION:\n`;
        Object.entries(consolidationData.assertions).forEach(
          ([assertion, data]) => {
            message += `• ${assertion}:\n`;
            message += `  - Occurrences: ${data.occurrences}\n`;
            message += `  - Montant total: ${this.formatMontant(data.total)} FCFA\n`;
            if (data.comptes.size > 0) {
              message += `  - Comptes: ${Array.from(data.comptes).join(", ")}\n`;
            }
            message += `\n`;
          },
        );
      }

      message += `📝 RÉSULTAT FINAL:\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      // Supprimer les balises HTML pour l'alerte
      const cleanResult = finalResult
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ");
      message += cleanResult;

      return message;
    }

    consolidateWithAccount(table, headers) {
      const consolidation = {};
      const tbody = table.querySelector("tbody") || table;
      const rows = tbody.querySelectorAll("tr");

      const colIndexes = this.getColumnIndexes(headers);

      rows.forEach((row, index) => {
        if (index === 0 && row.querySelector("th")) return;

        const cells = row.querySelectorAll("td");
        if (cells.length === 0) return;

        const assertion = cells[colIndexes.assertion]?.textContent?.trim();
        const conclusion = cells[colIndexes.conclusion]?.textContent?.trim();
        const compte = cells[colIndexes.compte]?.textContent?.trim();
        const ecart = cells[colIndexes.ecart]?.textContent?.trim();

        if (
          assertion &&
          (conclusion === "Non-Satisfaisant" || conclusion === "Limitation")
        ) {
          if (!consolidation[assertion]) {
            consolidation[assertion] = { comptes: new Set(), total: 0 };
          }

          if (compte) consolidation[assertion].comptes.add(compte);

          const montant = this.parseMontant(ecart);
          consolidation[assertion].total += montant;
        }
      });

      return this.formatConsolidationWithAccount(consolidation);
    }

    consolidateWithoutAccount(table, headers) {
      const consolidation = {};
      const tbody = table.querySelector("tbody") || table;
      const rows = tbody.querySelectorAll("tr");

      const colIndexes = this.getColumnIndexes(headers);

      rows.forEach((row, index) => {
        if (index === 0 && row.querySelector("th")) return;

        const cells = row.querySelectorAll("td");
        if (cells.length === 0) return;

        const assertion = cells[colIndexes.assertion]?.textContent?.trim();
        const conclusion = cells[colIndexes.conclusion]?.textContent?.trim();
        const ecart = cells[colIndexes.ecart]?.textContent?.trim();

        if (
          assertion &&
          (conclusion === "Non-Satisfaisant" || conclusion === "Limitation")
        ) {
          if (!consolidation[assertion]) {
            consolidation[assertion] = { total: 0 };
          }

          const montant = this.parseMontant(ecart);
          consolidation[assertion].total += montant;
        }
      });

      return this.formatConsolidationWithoutAccount(consolidation);
    }

    getColumnIndexes(headers) {
      return {
        assertion: headers.findIndex((h) =>
          this.matchesColumn(h.text, "assertion"),
        ),
        conclusion: headers.findIndex((h) =>
          this.matchesColumn(h.text, "conclusion"),
        ),
        compte: headers.findIndex((h) => this.matchesColumn(h.text, "compte")),
        ecart: headers.findIndex((h) => this.matchesColumn(h.text, "ecart")),
      };
    }

    parseMontant(montantStr) {
      if (!montantStr) return 0;
      const cleaned = montantStr.replace(/[^\d.,-]/g, "").replace(",", ".");
      return parseFloat(cleaned) || 0;
    }

    formatMontant(montant) {
      return new Intl.NumberFormat("fr-FR").format(Math.abs(montant));
    }

    formatConsolidationWithAccount(consolidation) {
      if (Object.keys(consolidation).length === 0) {
        return "✅ Aucune non-conformité détectée";
      }

      const results = [];
      Object.entries(consolidation).forEach(([assertion, data]) => {
        const comptes = Array.from(data.comptes).sort().join(", ");
        const phrase = this.generateAssertionPhrase(
          assertion,
          comptes,
          data.total,
        );
        results.push(phrase);
      });

      return results.join("<br><br>");
    }

    generateAssertionPhrase(assertion, comptes, montant) {
      const assertionLower = assertion.toLowerCase();
      const montantFormate = this.formatMontant(montant);

      const phrases = {
        validité: `🔍 <strong>Validité</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas valides pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        exhaustivité: `🔍 <strong>Exhaustivité</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas exhaustives pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        limitation: `🔍 <strong>Limitation</strong> : Nous n'avons pas obtenu les pièces justificatives relatives aux comptes <em>${comptes}</em> pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        "cut-off": `🔍 <strong>Cut-off</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne respectent pas le cut-off pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        evaluation: `🔍 <strong>Évaluation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement évaluées pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        presentation: `🔍 <strong>Présentation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne respectent pas la correcte présentation pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        comptabilisation: `🔍 <strong>Comptabilisation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement comptabilisées dans le bon compte et/ou pour le bon montant pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        formalisation: `🔍 <strong>Formalisation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement formalisées pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        application: `🔍 <strong>Application</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement appliquées pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,

        permanence: `🔍 <strong>Permanence</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne respectent pas le principe de permanence pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
      };

      return (
        phrases[assertionLower] ||
        `🔍 <strong>${assertion}</strong> : les transactions relatives aux comptes <em>${comptes}</em> présentent des anomalies pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`
      );
    }

    formatConsolidationWithoutAccount(consolidation) {
      if (Object.keys(consolidation).length === 0) {
        return "✅ Aucune non-conformité détectée";
      }

      const results = [];
      Object.entries(consolidation).forEach(([assertion, data]) => {
        const phrase = this.generateSimpleAssertionPhrase(
          assertion,
          data.total,
        );
        results.push(phrase);
      });

      return results.join("<br><br>");
    }

    generateSimpleAssertionPhrase(assertion, montant) {
      const assertionLower = assertion.toLowerCase();
      const montantFormate = this.formatMontant(montant);

      const phrases = {
        validité: `🔍 <strong>Validité</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        exhaustivité: `🔍 <strong>Exhaustivité</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        limitation: `🔍 <strong>Limitation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        "cut-off": `🔍 <strong>Cut-off</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        evaluation: `🔍 <strong>Évaluation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        presentation: `🔍 <strong>Présentation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        comptabilisation: `🔍 <strong>Comptabilisation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        formalisation: `🔍 <strong>Formalisation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        application: `🔍 <strong>Application</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
        permanence: `🔍 <strong>Permanence</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
      };

      return (
        phrases[assertionLower] ||
        `🔍 <strong>${assertion}</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`
      );
    }

    updateConsolidationDisplay(table, content) {
      try {
        debug.log("🔍 Début de updateConsolidationDisplay");
        debug.log("Contenu complet à afficher:", content.substring(0, 100));

        // Générer la version simplifiée pour la table conso
        const simpleContent = this.generateSimpleConsoContent(content);
        debug.log(
          "Contenu simplifié pour conso:",
          simpleContent.substring(0, 100),
        );

        // 1. Mise à jour de la table RÉSULTAT (version complète) - EN PREMIER
        const resultatUpdated = this.updateResultatTable(table, content);

        // 2. Mise à jour de la table CONSO (version simplifiée) - EN SECOND
        const consoUpdated = this.updateConsoTable(table, simpleContent);

        // 3. Sauvegarder les données après consolidation
        this.saveConsolidationData(table, content, simpleContent);

        // 4. Notifier dev.js des modifications pour synchronisation
        this.notifyDevJsSync(table, { resultatUpdated, consoUpdated });

        // 5. Confirmation
        if (consoUpdated || resultatUpdated) {
          debug.log("✅ Mise à jour réussie");
          debug.log(`- Table Conso: ${consoUpdated ? "✓" : "✗"}`);
          debug.log(`- Table Résultat: ${resultatUpdated ? "✓" : "✗"}`);

          // Alerte de confirmation
          setTimeout(() => {
            const cleanContent = content.replace(/<[^>]*>/g, "").trim();
            alert(
              `✅ MISE À JOUR CONFIRMÉE\n\n` +
                `Table Conso: ${consoUpdated ? "Mise à jour" : "Non trouvée"}\n` +
                `Table Résultat: ${resultatUpdated ? "Mise à jour" : "Non trouvée"}\n\n` +
                `Contenu Table Résultat:\n${cleanContent.substring(0, 200)}${cleanContent.length > 200 ? "..." : ""}\n\n` +
                `Contenu Table Conso:\n${simpleContent.replace(/<[^>]*>/g, "").substring(0, 150)}`,
            );
          }, 500);
        } else {
          debug.warn("⚠️ Aucune table n'a été mise à jour");

          // Essayer de créer la table conso si elle n'existe pas
          this.createConsolidationTable(table);

          // Réessayer après un délai
          setTimeout(() => {
            this.updateConsolidationDisplay(table, content);
          }, 1000);
        }
      } catch (error) {
        debug.error("❌ Erreur dans updateConsolidationDisplay:", error);
        alert(
          `❌ ERREUR DE MISE À JOUR\n\n${error.message}\n\nVoir la console pour plus de détails.`,
        );
      }
    }

    generateSimpleConsoContent(fullContent) {
      // Transformer le contenu complet en version simplifiée pour table conso
      // Format attendu : "Validité : Non-conformité pour 600 000 FCFA"

      debug.log("🔄 Génération du contenu simplifié");

      const lines = [];

      // Méthode 1: Parser le HTML complet
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = fullContent;

      // Récupérer chaque paragraphe/bloc séparé par <br>
      const htmlParts = fullContent.split(/<br\s*\/?>/gi);

      htmlParts.forEach((part) => {
        if (!part.trim()) return;

        // Extraire l'assertion (contenu de <strong>)
        const assertionMatch = part.match(/<strong>(.*?)<\/strong>/i);
        // Extraire le montant
        const montantMatch = part.match(/([\d\s.,]+)\s*FCFA/);

        if (assertionMatch && montantMatch) {
          const assertion = assertionMatch[1].trim();
          const montant = montantMatch[1].replace(/\s/g, " ").trim();
          lines.push(
            `🔍 <strong>${assertion}</strong> : Non-conformité pour <strong>${montant} FCFA</strong>`,
          );
        }
      });

      // Méthode 2: Fallback si la méthode 1 échoue
      if (lines.length === 0) {
        const cleanText = fullContent.replace(/<[^>]*>/g, "");
        const assertionPattern =
          /(Validité|Exhaustivité|Limitation|Formalisation|Application|Permanence|Cut-off|Évaluation|Présentation|Comptabilisation)[^0-9]*?([\d\s.,]+)\s*FCFA/gi;

        let match;
        while ((match = assertionPattern.exec(cleanText)) !== null) {
          const assertion = match[1];
          const montant = match[2].replace(/\s/g, " ").trim();
          lines.push(
            `🔍 <strong>${assertion}</strong> : Non-conformité pour <strong>${montant} FCFA</strong>`,
          );
        }
      }

      const result =
        lines.length > 0
          ? lines.join("<br><br>")
          : "⏳ En attente de consolidation...";
      debug.log("✓ Contenu simplifié généré:", result.substring(0, 150));
      return result;
    }

    updateConsoTable(table, simpleContent) {
      debug.log("📊 Recherche de la table conso (pour contenu simplifié)...");

      // Stratégie 1: Chercher par ID généré
      const tableId = this.generateTableId(table);
      let consoCell = document.querySelector(`#conso-content-${tableId}`);

      if (consoCell) {
        debug.log("✓ Table conso trouvée via ID:", `conso-content-${tableId}`);
        debug.log(
          "Mise à jour avec contenu simplifié:",
          simpleContent.substring(0, 100),
        );
        consoCell.innerHTML = simpleContent;
        // Marquer comme table conso
        consoCell.setAttribute("data-updated", "conso");
        consoCell.setAttribute("data-type", "conso");

        // Notifier dev.js de la modification
        this.notifyTableUpdate(
          consoCell.closest("table"),
          "conso-table-update",
        );
        return true;
      }

      // Stratégie 2: Chercher par ID partiel
      const allConsoCells = document.querySelectorAll('[id*="conso-content"]');
      if (allConsoCells.length > 0) {
        debug.log(
          `✓ ${allConsoCells.length} cellule(s) conso trouvée(s) via attribut partiel`,
        );
        // Prendre la dernière créée (plus récente)
        consoCell = allConsoCells[allConsoCells.length - 1];
        debug.log(
          "Mise à jour avec contenu simplifié:",
          simpleContent.substring(0, 100),
        );
        consoCell.innerHTML = simpleContent;
        // Marquer comme table conso
        consoCell.setAttribute("data-updated", "conso");
        consoCell.setAttribute("data-type", "conso");

        // Notifier dev.js de la modification
        this.notifyTableUpdate(
          consoCell.closest("table"),
          "conso-table-update",
        );
        return true;
      }

      // Stratégie 3: Chercher la table conso dans le parent
      const parent = table.parentElement;
      if (parent) {
        const consoTable = parent.querySelector(
          'table.claraverse-conso-table, table[class*="claraverse-conso"]',
        );
        if (consoTable) {
          consoCell = consoTable.querySelector("td");
          if (consoCell) {
            debug.log("✓ Table conso trouvée via parent et classe");
            debug.log(
              "Mise à jour avec contenu simplifié:",
              simpleContent.substring(0, 100),
            );
            consoCell.innerHTML = simpleContent;
            // Marquer comme table conso
            consoCell.setAttribute("data-updated", "conso");
            consoCell.setAttribute("data-type", "conso");

            // Notifier dev.js de la modification
            this.notifyTableUpdate(consoTable, "conso-table-update");
            return true;
          }
        }
      }

      // Stratégie 4: Chercher toutes les tables conso dans le document
      const allConsoTables = document.querySelectorAll(
        'table.claraverse-conso-table, table[class*="claraverse-conso"]',
      );
      if (allConsoTables.length > 0) {
        debug.log(`✓ ${allConsoTables.length} table(s) conso trouvée(s)`);
        // Trouver la plus proche de la table de pointage
        let closestConsoTable = null;
        let minDistance = Infinity;

        allConsoTables.forEach((consoTable) => {
          const distance = this.getElementDistance(table, consoTable);
          if (distance < minDistance) {
            minDistance = distance;
            closestConsoTable = consoTable;
          }
        });

        if (closestConsoTable) {
          consoCell = closestConsoTable.querySelector("td");
          if (consoCell) {
            debug.log("✓ Table conso la plus proche trouvée");
            debug.log(
              "Mise à jour avec contenu simplifié:",
              simpleContent.substring(0, 100),
            );
            consoCell.innerHTML = simpleContent;
            // Marquer comme table conso
            consoCell.setAttribute("data-updated", "conso");
            consoCell.setAttribute("data-type", "conso");
            return true;
          }
        }
      }

      debug.warn("✗ Table conso non trouvée");
      return false;
    }

    updateResultatTable(table, fullContent) {
      debug.log(
        "📋 Recherche de la table Résultat (située au-dessus de la table conso)...",
      );

      // Pour la table résultat, on veut le contenu HTML complet et détaillé
      const htmlContent = fullContent;

      debug.log(
        "Contenu HTML pour table Résultat:",
        htmlContent.substring(0, 150),
      );

      // D'abord, trouver la table conso pour éviter de la confondre avec la table résultat
      let consoTable = null;
      const parent = table.parentElement;

      if (parent) {
        consoTable = parent.querySelector(
          'table.claraverse-conso-table, table[class*="claraverse-conso"]',
        );
      }

      if (!consoTable) {
        // Chercher globalement
        const allConsoTables = document.querySelectorAll(
          'table.claraverse-conso-table, table[class*="claraverse-conso"]',
        );
        if (allConsoTables.length > 0) {
          consoTable = allConsoTables[allConsoTables.length - 1];
        }
      }

      debug.log("Table conso identifiée:", consoTable ? "Oui" : "Non");

      // Stratégie 1: Chercher la table Résultat juste AVANT la table conso
      if (consoTable && consoTable.parentElement) {
        const consoParent = consoTable.parentElement;
        const siblings = Array.from(consoParent.children);
        const consoIndex = siblings.indexOf(consoTable);

        debug.log(`Index de la table conso: ${consoIndex}`);

        // Chercher les tables AVANT la table conso
        for (let i = consoIndex - 1; i >= 0; i--) {
          const sibling = siblings[i];
          if (sibling.tagName === "TABLE" && sibling !== consoTable) {
            debug.log(`Examen de la table à l'index ${i}`);
            const headers = sibling.querySelectorAll("th");
            for (const header of headers) {
              const headerText = header.textContent.trim().toLowerCase();
              debug.log(`En-tête trouvé: "${headerText}"`);
              if (
                headerText.includes("resultat") ||
                headerText.includes("résultat")
              ) {
                const contentCell = sibling.querySelector("tbody td");
                if (contentCell) {
                  debug.log(
                    "✓ Table Résultat trouvée au-dessus de la table conso",
                  );
                  debug.log(
                    "Mise à jour avec contenu complet:",
                    htmlContent.substring(0, 100),
                  );
                  // Vérifier que ce n'est pas la cellule de la table conso
                  const isConsoCell = consoTable.contains(contentCell);
                  if (!isConsoCell) {
                    contentCell.innerHTML = htmlContent;
                    contentCell.setAttribute("data-updated", "resultat");
                    debug.log("✓ Mise à jour effectuée");
                    return true;
                  } else {
                    debug.warn(
                      "⚠️ Cette cellule appartient à la table conso, ignorée",
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Stratégie 2: Chercher toutes les tables avec en-tête "Resultats" (en excluant la table conso)
      const allTables = document.querySelectorAll(
        'table.min-w-full, table[class*="border"]',
      );

      for (const potentialTable of allTables) {
        // S'assurer que ce n'est pas la table conso
        if (potentialTable === consoTable) {
          debug.log("Table ignorée (c'est la table conso)");
          continue;
        }
        if (potentialTable.classList.contains("claraverse-conso-table")) {
          debug.log("Table ignorée (classe conso)");
          continue;
        }

        const headers = potentialTable.querySelectorAll("th");
        for (const header of headers) {
          const headerText = header.textContent.trim().toLowerCase();
          if (
            headerText.includes("resultat") ||
            headerText.includes("résultat")
          ) {
            const contentCell = potentialTable.querySelector("tbody td");
            if (contentCell) {
              debug.log("✓ Table Résultat trouvée via recherche globale");
              debug.log(
                "Mise à jour avec contenu complet:",
                htmlContent.substring(0, 100),
              );
              contentCell.innerHTML = htmlContent;
              contentCell.setAttribute("data-updated", "resultat");
              return true;
            }
          }
        }
      }

      // Stratégie 3: Chercher avant la table de pointage (en excluant table conso)
      if (parent) {
        const allSiblings = Array.from(parent.children);
        const tableIndex = allSiblings.indexOf(table);

        for (let i = tableIndex - 1; i >= 0; i--) {
          const sibling = allSiblings[i];
          if (
            sibling.tagName === "TABLE" &&
            sibling !== consoTable &&
            !sibling.classList.contains("claraverse-conso-table")
          ) {
            const headers = sibling.querySelectorAll("th");
            for (const header of headers) {
              const headerText = header.textContent.trim().toLowerCase();
              if (
                headerText.includes("resultat") ||
                headerText.includes("résultat") ||
                headerText.includes("conclusion finale")
              ) {
                const contentCell = sibling.querySelector("tbody td");
                if (contentCell) {
                  debug.log("✓ Table Résultat trouvée avant table de pointage");
                  debug.log(
                    "Mise à jour avec contenu complet:",
                    htmlContent.substring(0, 100),
                  );
                  contentCell.innerHTML = htmlContent;
                  contentCell.setAttribute("data-updated", "resultat");

                  // Notifier dev.js de la modification
                  this.notifyTableUpdate(sibling, "resultat-table-update");

                  return true;
                }
              }
            }
          }
        }
      }

      debug.warn("✗ Table Résultat non trouvée");
      return false;
    }

    setupGlobalEventListeners() {
      // Fermer les dropdowns avec Escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.dropdownVisible) {
          this.hideDropdown();
        }
      });

      // Gérer les clics globaux
      document.addEventListener("click", (e) => {
        if (this.dropdownVisible && !e.target.closest(".claraverse-dropdown")) {
          this.hideDropdown();
        }
      });
    }

    destroy() {
      debug.log("🧹 Nettoyage du processeur");

      if (this.observer) {
        this.observer.disconnect();
      }

      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      if (this.autoSaveIntervalId) {
        clearInterval(this.autoSaveIntervalId);
      }

      if (this.consolidationTimeout) {
        clearTimeout(this.consolidationTimeout);
      }

      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      this.hideDropdown();

      // Déconnecter tous les observers de tables
      if (this.tableObservers) {
        this.tableObservers.forEach((observer, table) => {
          observer.disconnect();
        });
        this.tableObservers.clear();
      }

      // Supprimer les tables de consolidation
      document.querySelectorAll(".claraverse-conso-table").forEach((table) => {
        table.remove();
      });

      this.isInitialized = false;
    }

    // ==================== MÉTHODES DE PERSISTANCE ====================

    /**
     * Générer un ID unique pour une table basé sur son contenu
     */
    generateUniqueTableId(table) {
      // Essayer d'utiliser l'ID existant du dataset
      if (table.dataset.tableId) {
        debug.log(`♻️ Réutilisation ID existant: ${table.dataset.tableId}`);
        return table.dataset.tableId;
      }

      // Essayer d'utiliser l'attribut data-table-id existant
      const existingId = table.getAttribute("data-table-id");
      if (existingId) {
        table.dataset.tableId = existingId;
        debug.log(`♻️ Récupération ID HTML existant: ${existingId}`);
        return existingId;
      }

      // Sinon, créer un ID basé sur les en-têtes (stable entre rechargements)
      const headers = this.getTableHeaders(table);
      // Normaliser les en-têtes pour avoir un hash stable
      const headerText = headers
        .map((h) => h.text.trim().toLowerCase().replace(/\s+/g, "_"))
        .join("__");
      const hash = this.hashCode(headerText);

      // Compter les tables avec ce hash pour différencier les tables similaires
      const existingTables = document.querySelectorAll(
        `[data-table-id^="table_${hash}"]`,
      );
      const suffix =
        existingTables.length > 0 ? `_${existingTables.length}` : "";

      // ID stable basé sur les en-têtes normalisés
      const uniqueId = `table_${hash}${suffix}`;

      table.dataset.tableId = uniqueId;
      table.setAttribute("data-table-id", uniqueId);
      debug.log(`🆔 ID généré et assigné: ${uniqueId}`);
      return uniqueId;
    }

    /**
     * Fonction de hachage simple
     */
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }

    /**
     * Trouver la table parente d'une cellule
     */
    findParentTable(cell) {
      let element = cell;
      while (element && element.tagName !== "TABLE") {
        element = element.parentElement;
      }
      return element;
    }

    /**
     * Charger toutes les données depuis localStorage
     */
    loadAllData() {
      try {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
      } catch (error) {
        debug.error("Erreur lors du chargement des données:", error);
        return {};
      }
    }

    /**
     * Sauvegarder toutes les données dans localStorage
     */
    saveAllData(data) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        debug.log("💾 Données sauvegardées dans localStorage");
      } catch (error) {
        debug.error("❌ Erreur lors de la sauvegarde:", error);
        if (error.name === "QuotaExceededError") {
          alert(
            "⚠️ Espace de stockage insuffisant. Certaines données n'ont pas pu être sauvegardées.",
          );
        }
      }
    }

    /**
     * Sauvegarder l'état d'une table avec debounce
     */
    saveTableData(table) {
      if (!table) {
        debug.warn("⚠️ saveTableData: table est null ou undefined");
        return;
      }

      debug.log("⏳ Sauvegarde programmée dans", this.autoSaveDelay, "ms");

      // Annuler la sauvegarde en attente
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      // Programmer une nouvelle sauvegarde après le délai
      this.saveTimeout = setTimeout(() => {
        this.saveTableDataNow(table);
      }, this.autoSaveDelay);
    }

    /**
     * Sauvegarder immédiatement l'état d'une table
     */
    saveTableDataNow(table) {
      if (!table) {
        debug.warn("⚠️ saveTableDataNow: table est null ou undefined");
        return;
      }

      debug.log("💾 Début de sauvegarde immédiate");

      const tableId = this.generateUniqueTableId(table);
      debug.log("🆔 ID de table pour sauvegarde:", tableId);

      const allData = this.loadAllData();
      debug.log(
        "📂 Données existantes chargées, nombre de tables:",
        Object.keys(allData).length,
      );

      // Extraire les données de la table
      const tableData = {
        timestamp: Date.now(),
        cells: [],
        headers: [],
        isModelized: false,
      };

      // Sauvegarder les en-têtes
      const headers = this.getTableHeaders(table);
      tableData.headers = headers.map((h) => h.text);
      tableData.isModelized = this.isModelizedTable(headers);

      // Sauvegarder les cellules - gérer tables avec ou sans tbody
      let rows;
      const tbody = table.querySelector("tbody");
      if (tbody) {
        rows = tbody.querySelectorAll("tr");
      } else {
        // Table sans tbody - prendre toutes les lignes sauf thead
        rows = Array.from(table.querySelectorAll("tr")).filter(
          (row) => !row.parentElement.tagName.match(/THEAD/i),
        );
      }

      rows.forEach((row, rowIndex) => {
        // Skip header rows
        if (
          row.querySelector("th") &&
          row.parentElement.tagName.match(/THEAD/i)
        )
          return;

        const cells = row.querySelectorAll("td");
        cells.forEach((cell, colIndex) => {
          const value = cell.textContent.trim();
          const bgColor = cell.style.backgroundColor;
          const innerHTML = cell.innerHTML;

          // Sauvegarder même les cellules vides pour préserver la structure
          tableData.cells.push({
            row: rowIndex,
            col: colIndex,
            value: value,
            bgColor: bgColor,
            // Sauvegarder aussi le HTML pour les cellules avec contenu riche
            html: innerHTML !== value ? innerHTML : undefined,
          });
        });
      });

      // Sauvegarder
      allData[tableId] = tableData;
      debug.log("📝 Données de la table préparées:", {
        type: tableData.isModelized ? "Modelisée" : "Standard",
        headers: tableData.headers.length,
        cells: tableData.cells.length,
        timestamp: new Date(tableData.timestamp).toLocaleString("fr-FR"),
      });

      this.saveAllData(allData);

      debug.log(`✅ Table ${tableId} sauvegardée avec succès`);
      debug.log(
        `📊 Total de tables sauvegardées: ${Object.keys(allData).length}`,
      );
    }

    /**
     * Sauvegarder les données de consolidation
     */
    saveConsolidationData(table, fullContent, simpleContent) {
      if (!table) {
        debug.warn("⚠️ saveConsolidationData: table est null");
        return;
      }

      debug.log("💾 Début sauvegarde consolidation");

      const tableId = this.generateUniqueTableId(table);
      debug.log("🆔 ID pour consolidation:", tableId);

      const allData = this.loadAllData();

      if (!allData[tableId]) {
        allData[tableId] = { timestamp: Date.now() };
        debug.log("📝 Nouvelle entrée créée pour la table");
      }

      allData[tableId].consolidation = {
        fullContent: fullContent,
        simpleContent: simpleContent,
        timestamp: Date.now(),
      };

      debug.log("📝 Consolidation préparée:", {
        fullContentLength: fullContent.length,
        simpleContentLength: simpleContent.length,
      });

      this.saveAllData(allData);
      debug.log(`✅ Consolidation sauvegardée pour ${tableId}`);
    }

    /**
     * Restaurer l'état d'une table
     */
    restoreTableData(table) {
      if (!table) return false;

      const tableId = table.dataset.tableId;
      if (!tableId) {
        debug.warn("⚠️ Table sans ID, impossible de restaurer");
        return false;
      }

      debug.log(`🔍 Tentative de restauration pour ID: ${tableId}`);

      const allData = this.loadAllData();
      const tableData = allData[tableId];

      if (!tableData) {
        debug.log(`ℹ️ Aucune donnée trouvée pour ${tableId}`);
        return false;
      }

      debug.log(`📂 Restauration de la table ${tableId}`, {
        type: tableData.isModelized ? "Modelisée" : "Standard",
        cellCount: tableData.cells ? tableData.cells.length : 0,
        hasConsolidation: !!tableData.consolidation,
      });

      // Restaurer les cellules - gérer tables avec ou sans tbody
      let rows;
      const tbody = table.querySelector("tbody");
      if (tbody) {
        rows = tbody.querySelectorAll("tr");
      } else {
        // Table sans tbody
        rows = Array.from(table.querySelectorAll("tr")).filter(
          (row) => !row.parentElement.tagName.match(/THEAD/i),
        );
      }

      tableData.cells.forEach((cellData) => {
        const row = rows[cellData.row];
        if (!row) return;

        const cells = row.querySelectorAll("td");
        const cell = cells[cellData.col];

        if (cell) {
          // Restaurer le HTML si disponible, sinon le texte
          if (cellData.html) {
            cell.innerHTML = cellData.html;
          } else {
            cell.textContent = cellData.value;
          }

          if (cellData.bgColor) {
            cell.style.backgroundColor = cellData.bgColor;
          }
        }
      });

      // Restaurer la consolidation si elle existe (uniquement pour tables modelisées)
      if (tableData.consolidation && tableData.isModelized) {
        const { fullContent, simpleContent } = tableData.consolidation;

        // Restaurer la table résultat
        this.updateResultatTable(table, fullContent);

        // Restaurer la table conso
        this.updateConsoTable(table, simpleContent);

        debug.log("✅ Consolidation restaurée");
      }

      return true;
    }

    /**
     * Restaurer toutes les tables
     */
    restoreAllTablesData() {
      debug.log("📂 Restauration de toutes les tables...");

      const allData = this.loadAllData();
      const tableIds = Object.keys(allData);

      debug.log(`📊 ${tableIds.length} table(s) trouvée(s) dans le stockage`);

      if (tableIds.length === 0) {
        debug.log("ℹ️ Aucune donnée à restaurer");
        return;
      }

      debug.log("🔍 IDs des tables à restaurer:", tableIds);

      // Attendre un peu que les tables soient créées
      setTimeout(() => {
        const allTables = this.findAllTables();
        debug.log(`🔍 ${allTables.length} table(s) trouvée(s) dans le DOM`);

        let restoredCount = 0;
        let attemptedCount = 0;

        allTables.forEach((table, index) => {
          attemptedCount++;

          // Générer l'ID si la table n'en a pas (pour TOUTES les tables)
          if (!table.dataset.tableId) {
            this.generateUniqueTableId(table);
            debug.log(
              `🆔 ID généré lors de la restauration: ${table.dataset.tableId}`,
            );
          }

          debug.log(
            `🔄 Tentative ${attemptedCount}/${allTables.length} pour la table`,
            table.dataset.tableId || "sans ID",
          );

          if (this.restoreTableData(table)) {
            restoredCount++;
            debug.log(`✓ Table restaurée (${restoredCount}/${attemptedCount})`);
          } else {
            debug.log(`✗ Table non restaurée (aucune donnée ou pas d'ID)`);
          }
        });

        debug.log(
          `✅ Résultat: ${restoredCount} table(s) restaurée(s) sur ${attemptedCount} tentatives`,
        );

        if (restoredCount > 0) {
          // Notification discrète
          const notification = document.createElement("div");
          notification.textContent = `✅ ${restoredCount} table(s) restaurée(s)`;
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
          `;
          document.body.appendChild(notification);

          setTimeout(() => {
            notification.style.transition = "opacity 0.5s";
            notification.style.opacity = "0";
            setTimeout(() => notification.remove(), 500);
          }, 3000);
        }
      }, 1500);
    }

    /**
     * Sauvegarder automatiquement toutes les tables modifiées
     */
    autoSaveAllTables() {
      const allTables = this.findAllTables();
      let savedCount = 0;

      allTables.forEach((table) => {
        // Sauvegarder TOUTES les tables (modelisées ou non)
        const tbody = table.querySelector("tbody");
        const hasCells = tbody && tbody.querySelectorAll("td").length > 0;

        // Vérifier aussi les tables sans tbody (certaines tables ont les données directement)
        const hasData = hasCells || table.querySelectorAll("td").length > 0;

        if (hasData) {
          this.saveTableDataNow(table);
          savedCount++;
        }
      });

      if (savedCount > 0) {
        debug.log(`💾 Auto-sauvegarde: ${savedCount} table(s) sauvegardée(s)`);
      }
    }

    /**
     * Effacer toutes les données sauvegardées
     */
    clearAllData() {
      if (
        confirm(
          "⚠️ Êtes-vous sûr de vouloir effacer toutes les données sauvegardées ?",
        )
      ) {
        localStorage.removeItem(this.storageKey);
        debug.log("🗑️ Toutes les données ont été effacées");
        alert("✅ Données effacées avec succès");
      }
    }

    /**
     * Exporter les données en JSON
     */
    exportData() {
      const allData = this.loadAllData();
      const jsonString = JSON.stringify(allData, null, 2);

      // Créer un blob et télécharger
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `claraverse_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      debug.log("📥 Données exportées");
      alert("✅ Données exportées avec succès");
    }

    /**
     * Importer des données depuis JSON
     */
    importData(jsonData) {
      try {
        const data =
          typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

        if (
          confirm(
            "⚠️ Importer ces données remplacera les données actuelles. Continuer ?",
          )
        ) {
          this.saveAllData(data);
          this.restoreAllTablesData();
          debug.log("📤 Données importées");
          alert("✅ Données importées avec succès");
        }
      } catch (error) {
        debug.error("❌ Erreur lors de l'importation:", error);
        alert("❌ Erreur lors de l'importation des données");
      }
    }

    /**
     * Effacer les données d'une table spécifique
     */
    clearTableData(tableId) {
      const allData = this.loadAllData();
      if (allData[tableId]) {
        delete allData[tableId];
        this.saveAllData(allData);
        debug.log(`🗑️ Table ${tableId} effacée`);
        return true;
      }
      return false;
    }

    // === MÉTHODES DE SYNCHRONISATION AVEC DEV.JS ===

    // Notifier dev.js d'une modification de table
    notifyTableUpdate(tableElement, updateType = "conso-update") {
      if (!tableElement) return;

      try {
        // Créer un événement personnalisé pour dev.js
        const event = new CustomEvent("claraverse:table:updated", {
          detail: {
            table: tableElement,
            tableId:
              this.generateTableId(tableElement) ||
              this.generateUniqueTableId(),
            source: "conso",
            updateType: updateType,
            timestamp: Date.now(),
          },
        });

        document.dispatchEvent(event);
        debug.log(`🔄 Notification envoyée à dev.js: ${updateType}`);
      } catch (error) {
        debug.error("Erreur notification dev.js:", error);
      }
    }

    // Notifier dev.js de la fin de consolidation
    notifyConsolidationComplete(affectedTables = []) {
      try {
        const event = new CustomEvent("claraverse:consolidation:complete", {
          detail: {
            consolidationTables: affectedTables,
            source: "conso",
            timestamp: Date.now(),
          },
        });

        document.dispatchEvent(event);
        debug.log("🎯 Notification consolidation terminée envoyée à dev.js");
      } catch (error) {
        debug.error("Erreur notification consolidation:", error);
      }
    }

    // Notifier dev.js de la création d'une nouvelle table
    notifyTableCreated(tableElement) {
      if (!tableElement) return;

      try {
        const event = new CustomEvent("claraverse:table:created", {
          detail: {
            table: tableElement,
            source: "conso",
            timestamp: Date.now(),
          },
        });

        document.dispatchEvent(event);
        debug.log("🆕 Notification nouvelle table envoyée à dev.js");
      } catch (error) {
        debug.error("Erreur notification création table:", error);
      }
    }

    // Synchroniser avec dev.js après modification
    notifyDevJsSync(table, updateStatus) {
      try {
        const affectedTables = [];

        // Ajouter les tables modifiées
        if (updateStatus.consoUpdated) {
          const consoTable = document.querySelector(".claraverse-conso-table");
          if (consoTable) affectedTables.push(consoTable);
        }

        if (updateStatus.resultatUpdated) {
          // Chercher la table résultat
          const resultatTables = Array.from(
            document.querySelectorAll("table"),
          ).filter((t) => {
            const headers = t.querySelectorAll("th");
            return Array.from(headers).some(
              (h) =>
                h.textContent.toLowerCase().includes("resultat") ||
                h.textContent.toLowerCase().includes("résultat"),
            );
          });
          if (resultatTables.length > 0) {
            affectedTables.push(resultatTables[resultatTables.length - 1]);
          }
        }

        // Notifier la consolidation terminée
        this.notifyConsolidationComplete(affectedTables);

        // Forcer la sauvegarde via l'API de dev.js
        if (
          window.claraverseSyncAPI &&
          window.claraverseSyncAPI.saveAllTables
        ) {
          setTimeout(() => {
            window.claraverseSyncAPI.saveAllTables();
            debug.log("💾 Sauvegarde forcée via API dev.js");
          }, 100);
        }
      } catch (error) {
        debug.error("Erreur synchronisation dev.js:", error);
      }
    }

    // Exposer les méthodes utilitaires
    getStorageInfo() {
      const allData = this.loadAllData();
      const dataSize = new Blob([JSON.stringify(allData)]).size;
      const tableCount = Object.keys(allData).length;

      return {
        tableCount: tableCount,
        dataSize: dataSize,
        dataSizeKB: (dataSize / 1024).toFixed(2),
        dataSizeMB: (dataSize / 1024 / 1024).toFixed(2),
        lastUpdate: Math.max(
          ...Object.values(allData).map((d) => d.timestamp || 0),
        ),
        tables: Object.keys(allData).map((key) => ({
          id: key,
          timestamp: allData[key].timestamp,
          timestampDate: new Date(allData[key].timestamp).toLocaleString(
            "fr-FR",
          ),
          hasConsolidation: !!allData[key].consolidation,
          cellCount: allData[key].cells ? allData[key].cells.length : 0,
        })),
      };
    }
  }

  // Instance globale
  let processor = null;

  // Fonction d'initialisation
  function initClaraverseProcessor() {
    if (processor) {
      processor.destroy();
    }

    processor = new ClaraverseTableProcessor();

    // Exposer pour le debug et les commandes utilitaires
    window.claraverseProcessor = processor;

    // Exposer les commandes utiles dans la console
    window.claraverseCommands = {
      clearAllData: () => processor.clearAllData(),
      clearTable: (tableId) => processor.clearTableData(tableId),
      exportData: () => processor.exportData(),
      importData: (jsonData) => processor.importData(jsonData),
      saveNow: () => processor.autoSaveAllTables(),
      getStorageInfo: () => {
        const info = processor.getStorageInfo();
        console.table(info.tables);
        console.log(
          `📊 Total: ${info.tableCount} table(s), ${info.dataSizeKB} KB (${info.dataSizeMB} MB)`,
        );
        if (info.lastUpdate) {
          console.log(
            `🕐 Dernière mise à jour: ${new Date(info.lastUpdate).toLocaleString("fr-FR")}`,
          );
        }
        return info;
      },
      restoreAll: () => processor.restoreAllTablesData(),
      testPersistence: () => {
        console.log("🧪 TEST DE PERSISTANCE");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━");

        // 1. Test localStorage
        try {
          localStorage.setItem("test", "test");
          localStorage.removeItem("test");
          console.log("✅ localStorage accessible");
        } catch (e) {
          console.error("❌ localStorage non accessible:", e);
          return;
        }

        // 2. Vérifier les tables dans le DOM
        const tables = processor.findAllTables();
        console.log(`🔍 ${tables.length} table(s) trouvée(s) dans le DOM`);

        tables.forEach((table, i) => {
          const headers = processor.getTableHeaders(table);
          const isModelized = processor.isModelizedTable(headers);
          const hasId = !!table.dataset.tableId;
          const cellCount = table.querySelectorAll("td").length;
          const hasObserver = table.dataset.observerInstalled === "true";
          console.log(`  Table ${i + 1}:`, {
            modelisée: isModelized,
            id: table.dataset.tableId || "❌ AUCUN",
            cellules: cellCount,
            observer: hasObserver ? "✅" : "❌",
            headers:
              headers
                .map((h) => h.text)
                .slice(0, 5)
                .join(", ") + (headers.length > 5 ? "..." : ""),
          });
        });

        // 3. Vérifier les données sauvegardées

        const data = processor.loadAllData();
        const savedTables = Object.keys(data);
        console.log(`💾 ${savedTables.length} table(s) sauvegardée(s)`);

        savedTables.forEach((id, i) => {
          console.log(`  Sauvegarde ${i + 1}:`, {
            id: id,
            cells: data[id].cells?.length || 0,
            hasConsolidation: !!data[id].consolidation,
            timestamp: new Date(data[id].timestamp).toLocaleString("fr-FR"),
          });
        });

        // 4. Test de sauvegarde
        console.log("\n🧪 Test de sauvegarde...");
        processor.autoSaveAllTables();

        setTimeout(() => {
          const newData = processor.loadAllData();
          console.log(
            `✅ Test terminé - ${Object.keys(newData).length} table(s) dans le stockage`,
          );
        }, 1000);
      },
      forceAssignIds: () => {
        console.log("🔧 Attribution forcée des IDs à TOUTES les tables...");
        const tables = processor.findAllTables();
        let count = 0;
        tables.forEach((table) => {
          // Attribuer un ID à TOUTES les tables, pas seulement les modelisées
          if (!table.dataset.tableId) {
            processor.generateUniqueTableId(table);
            count++;
          }
        });
        console.log(`✅ ${count} ID(s) assigné(s)`);
        processor.autoSaveAllTables();
      },
      saveAllNow: () => {
        console.log("💾 Sauvegarde de TOUTES les tables...");
        const tables = processor.findAllTables();
        console.log(`🔍 ${tables.length} table(s) trouvée(s)`);

        let savedCount = 0;
        let skippedCount = 0;

        tables.forEach((table, index) => {
          // Assigner un ID si nécessaire
          if (!table.dataset.tableId) {
            processor.generateUniqueTableId(table);
          }

          const hasData = table.querySelectorAll("td").length > 0;
          const headers = processor.getTableHeaders(table);
          const isModelized = processor.isModelizedTable(headers);

          if (hasData) {
            processor.saveTableDataNow(table);
            savedCount++;
            console.log(
              `  ✅ Table ${index + 1} (${table.dataset.tableId}) - ${isModelized ? "Modelisée" : "Standard"}`,
            );
          } else {
            skippedCount++;
            console.log(`  ⏭️ Table ${index + 1} ignorée (vide)`);
          }
        });

        console.log(`\n📊 RÉSULTAT:`);
        console.log(`  ✅ Sauvegardées: ${savedCount}`);
        console.log(`  ⏭️ Ignorées: ${skippedCount}`);
        console.log(`  📦 Total: ${tables.length}`);

        // Vérifier le stockage
        const info = processor.getStorageInfo();
        console.log(
          `\n💾 Stockage: ${info.tableCount} table(s), ${info.dataSizeKB} KB`,
        );
      },
      debug: {
        enableVerbose: () => {
          CONFIG.debugMode = true;
          console.log("🔊 Mode debug activé");
        },
        disableVerbose: () => {
          CONFIG.debugMode = false;
          console.log("🔇 Mode debug désactivé");
        },
        listTables: () => {
          const tables = processor.findAllTables();
          console.table(
            tables.map((t, i) => ({
              index: i,
              id: t.dataset.tableId || "❌ AUCUN",
              hasClass: t.className,
              rowCount: t.querySelectorAll("tr").length,
            })),
          );
        },
        showStorage: () => {
          const data = processor.loadAllData();
          console.log("📦 Contenu du localStorage:");
          console.log(JSON.stringify(data, null, 2));
        },
      },
      help: () => {
        console.log(`
🎯 COMMANDES CLARAVERSE DISPONIBLES:

📊 Gestion des données:
  - claraverseCommands.getStorageInfo()       : Afficher les infos de stockage
  - claraverseCommands.restoreAll()           : Restaurer toutes les tables
  - claraverseCommands.saveNow()              : Sauvegarder tables modelisées
  - claraverseCommands.saveAllNow()           : Sauvegarder TOUTES les tables
  - claraverseCommands.clearAllData()         : Effacer toutes les données
  - claraverseCommands.clearTable(tableId)    : Effacer une table spécifique

💾 Import/Export:
  - claraverseCommands.exportData()           : Exporter les données en JSON
  - claraverseCommands.importData(json)       : Importer des données JSON

🧪 Diagnostic:
  - claraverseCommands.testPersistence()      : Tester la persistance complète
  - claraverseCommands.forceAssignIds()       : Forcer l'attribution des IDs
  - claraverseCommands.saveAllNow()           : Sauvegarder TOUTES les tables
  - claraverseCommands.debug.enableVerbose()  : Activer logs détaillés
  - claraverseCommands.debug.listTables()     : Lister toutes les tables
  - claraverseCommands.debug.showStorage()    : Afficher le contenu localStorage

💡 Les changements dans les tables sont automatiquement détectés et sauvegardés après 500ms

📋 Exemples:
  // Test de persistance
  claraverseCommands.testPersistence();

  // Sauvegarder TOUTES les tables (modelisées et standards)
  claraverseCommands.saveAllNow();

  // Si la persistance ne fonctionne pas
  claraverseCommands.forceAssignIds();
  claraverseCommands.saveAllNow();

  // Voir les infos de stockage
  claraverseCommands.getStorageInfo();
        `);
      },
    };

    debug.log("🎉 Processeur Claraverse initialisé");
    debug.log("💡 Commandes disponibles: window.claraverseCommands");
    debug.log(
      "💡 Tapez: claraverseCommands.help() pour voir toutes les commandes",
    );
    debug.log("🧪 Test de persistance: claraverseCommands.testPersistence()");
  }

  // Auto-initialisation
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClaraverseProcessor);
  } else {
    // Petit délai pour laisser React se charger
    setTimeout(initClaraverseProcessor, 1000);
  }

  // Réinitialisation périodique pour les SPAs
  setInterval(() => {
    if (processor && !processor.isInitialized) {
      debug.log("🔄 Réinitialisation détectée");
      initClaraverseProcessor();
    }
  }, 5000);

  // Export global
  window.ClaraverseTableProcessor = ClaraverseTableProcessor;
  window.initClaraverseProcessor = initClaraverseProcessor;
})();
