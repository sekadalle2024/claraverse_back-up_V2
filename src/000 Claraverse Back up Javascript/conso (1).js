/**
 * Claraverse Table Consolidation Script - Version React Compatible
 * Script optimisé pour fonctionner avec React et les tables dynamiques
 */

(function() {
    'use strict';
    
    console.log("🚀 Claraverse Table Script - Démarrage");
  
    // Configuration globale
    const CONFIG = {
      tableSelector: 'table.min-w-full.border.border-gray-200.dark\\:border-gray-700 .rounded-lg, table.min-w-full',
      alternativeSelector: 'div.prose table, .prose table, table',
      checkInterval: 1000,
      processDelay: 500,
      debugMode: true
    };
  
    // Utilitaires de debug
    const debug = {
      log: (...args) => CONFIG.debugMode && console.log('📋 [Claraverse]', ...args),
      error: (...args) => console.error('❌ [Claraverse]', ...args),
      warn: (...args) => console.warn('⚠️ [Claraverse]', ...args)
    };
  
    class ClaraverseTableProcessor {
      constructor() {
        this.processedTables = new WeakSet();
        this.dropdownVisible = false;
        this.currentDropdown = null;
        this.isInitialized = false;
        
        this.init();
      }
  
      init() {
        if (this.isInitialized) return;
        
        debug.log('Initialisation du processeur de tables');
        
        // Attendre que React soit prêt
        this.waitForReact(() => {
          this.setupGlobalEventListeners();
          this.startTableMonitoring();
          this.isInitialized = true;
          debug.log('✅ Processeur initialisé avec succès');
        });
      }
  
      waitForReact(callback) {
        const checkReactReady = () => {
          // Vérifier si React est chargé et si des tables existent
          const hasReact = window.React || document.querySelector('[data-reactroot]') || document.querySelector('#root');
          const hasTables = this.findAllTables().length > 0;
          
          if (hasReact || hasTables) {
            debug.log('React détecté, démarrage du traitement');
            setTimeout(callback, 500); // Petit délai pour s'assurer que tout est prêt
          } else {
            debug.log('En attente de React...');
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
          'table',
          '.prose table',
          'div table'
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
        
        debug.log('Surveillance des tables démarrée');
      }
  
      setupMutationObserver() {
        if (this.observer) {
          this.observer.disconnect();
        }
  
        this.observer = new MutationObserver((mutations) => {
          let shouldProcess = false;
          
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              // Vérifier les nouveaux noeuds ajoutés
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  if (node.tagName === 'TABLE' || 
                      node.querySelector && node.querySelector('table')) {
                    shouldProcess = true;
                  }
                }
              });
            }
          });
  
          if (shouldProcess) {
            debug.log('Changement DOM détecté, retraitement des tables');
            setTimeout(() => this.processAllTables(), CONFIG.processDelay);
          }
        });
  
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: false
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
            debug.warn('Aucun en-tête trouvé dans la table');
            return;
          }
  
          debug.log('En-têtes trouvés:', headers.map(h => h.text));
          
          if (this.isModelizedTable(headers)) {
            debug.log('Table modelisée détectée');
            this.setupTableInteractions(table, headers);
            this.createConsolidationTable(table);
            this.processedTables.add(table);
          } else {
            debug.log('Table non-modelisée, ignorée');
          }
        } catch (error) {
          debug.error('Erreur lors du traitement de la table:', error);
        }
      }
  
      getTableHeaders(table) {
        const headerSelectors = ['thead th', 'thead td', 'tr:first-child th', 'tr:first-child td'];
        
        for (const selector of headerSelectors) {
          const headers = table.querySelectorAll(selector);
          if (headers.length > 0) {
            return Array.from(headers).map((cell, index) => ({
              element: cell,
              text: cell.textContent.trim().toLowerCase(),
              index: index
            }));
          }
        }
        
        return [];
      }
  
      isModelizedTable(headers) {
        const requiredColumns = ['conclusion', 'assertion'];
        return requiredColumns.some(col => 
          headers.some(header => this.matchesColumn(header.text, col))
        );
      }
  
      matchesColumn(headerText, columnType) {
        const patterns = {
          'assertion': /assertion/i,
          'conclusion': /conclusion/i,
          'ctr': /ctr\d*/i,
          'ecart': /ecart|montant/i,
          'compte': /compte/i,
          'resultat': /r[eé]sultat/i
        };
  
        return patterns[columnType] && patterns[columnType].test(headerText);
      }
  
      setupTableInteractions(table, headers) {
        const tbody = table.querySelector('tbody') || table;
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
          if (rowIndex === 0 && row.querySelector('th')) return; // Skip header row
          
          const cells = row.querySelectorAll('td');
          
          cells.forEach((cell, cellIndex) => {
            const header = headers[cellIndex];
            if (!header) return;
  
            // Supprimer les anciens event listeners
            cell.replaceWith(cell.cloneNode(true));
            const newCell = row.children[cellIndex];
            
            if (this.matchesColumn(header.text, 'assertion')) {
              this.setupAssertionCell(newCell);
            } else if (this.matchesColumn(header.text, 'conclusion')) {
              this.setupConclusionCell(newCell, table);
            } else if (this.matchesColumn(header.text, 'ctr')) {
              this.setupCtrCell(newCell);
            }
          });
        });
      }
  
      setupAssertionCell(cell) {
        cell.style.cursor = 'pointer';
        cell.style.backgroundColor = cell.style.backgroundColor || '#f8f9fa';
        cell.title = 'Cliquez pour sélectionner une assertion';
        
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDropdown(cell, [
            'Validité', 'Exhaustivité', 'Formalisation', 'Application', 'Permanence'
          ], (value) => {
            cell.textContent = value;
            cell.style.backgroundColor = '#e8f5e8';
            debug.log(`Assertion sélectionnée: ${value}`);
          });
        });
      }
  
      setupConclusionCell(cell, table) {
        cell.style.cursor = 'pointer';
        cell.style.backgroundColor = cell.style.backgroundColor || '#f8f9fa';
        cell.title = 'Cliquez pour sélectionner une conclusion';
        
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDropdown(cell, [
            'Satisfaisant', 'Non-Satisfaisant', 'Limitation', 'Non-Applicable'
          ], (value) => {
            cell.textContent = value;
            
            if (value === 'Non-Satisfaisant' || value === 'Limitation') {
              cell.style.backgroundColor = '#fee';
              debug.log(`Conclusion défavorable sélectionnée: ${value}`);
              this.scheduleConsolidation(table);
            } else {
              cell.style.backgroundColor = '#efe';
            }
          });
        });
      }
  
      setupCtrCell(cell) {
        cell.style.cursor = 'pointer';
        cell.style.backgroundColor = cell.style.backgroundColor || '#f8f9fa';
        cell.title = 'Cliquez pour sélectionner un contrôle';
        
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDropdown(cell, ['+', '-', 'N/A'], (value) => {
            cell.textContent = value;
            cell.style.backgroundColor = value === '+' ? '#e8f5e8' : 
                                       value === '-' ? '#fee8e8' : '#f5f5f5';
          });
        });
      }
  
      showDropdown(targetCell, options, onSelect) {
        this.hideDropdown();
        
        const dropdown = document.createElement('div');
        dropdown.className = 'claraverse-dropdown';
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
          const item = document.createElement('div');
          item.textContent = option;
          item.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: ${index < options.length - 1 ? '1px solid #eee' : 'none'};
            transition: background-color 0.2s;
          `;
          
          item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f0f8ff';
          });
          
          item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'white';
          });
          
          item.addEventListener('click', (e) => {
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
          document.addEventListener('click', this.hideDropdown.bind(this), { once: true });
        }, 100);
      }
  
      hideDropdown() {
        if (this.currentDropdown && document.body.contains(this.currentDropdown)) {
          document.body.removeChild(this.currentDropdown);
        }
        this.currentDropdown = null;
        this.dropdownVisible = false;
      }
  
      createConsolidationTable(table) {
        const existingConso = this.findExistingConsoTable(table);
        if (existingConso) {
          debug.log('Table de consolidation existante trouvée');
          return;
        }
  
        const consoTable = document.createElement('table');
        consoTable.className = 'claraverse-conso-table';
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
      }
  
      findExistingConsoTable(table) {
        const parent = table.parentElement;
        if (!parent) return null;
        
        return parent.querySelector('.claraverse-conso-table');
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
        return table.id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
          debug.log('Début de la consolidation');
          
          const headers = this.getTableHeaders(table);
          const hasCompte = headers.some(h => this.matchesColumn(h.text, 'compte'));
          const hasEcart = headers.some(h => this.matchesColumn(h.text, 'ecart'));
          
          let result = '';
          let consolidationData = {};
          
          if (hasCompte && hasEcart) {
            consolidationData = this.extractConsolidationData(table, headers, 'withAccount');
            result = this.consolidateWithAccount(table, headers);
          } else if (hasEcart) {
            consolidationData = this.extractConsolidationData(table, headers, 'withoutAccount');
            result = this.consolidateWithoutAccount(table, headers);
          } else {
            result = '⚠️ Table incomplète : colonnes ecart ou montant manquantes';
          }
          
          // 🚨 ALERTE DE DEBUG - Afficher le contenu de consolidation
          const alertMessage = this.generateAlertMessage(consolidationData, result);
          alert(`📊 RÉSULTAT DE CONSOLIDATION\n\n${alertMessage}`);
          
          this.updateConsolidationDisplay(table, result);
          debug.log('Consolidation terminée');
          
        } catch (error) {
          debug.error('Erreur pendant la consolidation:', error);
          alert(`❌ ERREUR DE CONSOLIDATION\n\n${error.message}\n\nVoir la console pour plus de détails.`);
          this.updateConsolidationDisplay(table, '❌ Erreur pendant la consolidation');
        }
      }
  
      extractConsolidationData(table, headers, type) {
        const data = {
          type: type,
          totalRows: 0,
          processedRows: 0,
          assertions: {},
          rawData: []
        };
  
        const tbody = table.querySelector('tbody') || table;
        const rows = tbody.querySelectorAll('tr');
        const colIndexes = this.getColumnIndexes(headers);
  
        rows.forEach((row, index) => {
          if (index === 0 && row.querySelector('th')) return;
          
          const cells = row.querySelectorAll('td');
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
            montant: this.parseMontant(ecart)
          };
          
          data.rawData.push(rowData);
          
          if (assertion && (conclusion === 'Non-Satisfaisant' || conclusion === 'Limitation')) {
            data.processedRows++;
            
            if (!data.assertions[assertion]) {
              data.assertions[assertion] = {
                comptes: new Set(),
                total: 0,
                occurrences: 0
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
            if (row.conclusion === 'Non-Satisfaisant' || row.conclusion === 'Limitation') {
              message += `Ligne ${row.row}: ${row.assertion} | ${row.conclusion} | ${row.compte || 'N/A'} | ${row.ecart}\n`;
            }
          });
          message += `\n`;
        }
  
        if (consolidationData.assertions && Object.keys(consolidationData.assertions).length > 0) {
          message += `🔍 CONSOLIDATION PAR ASSERTION:\n`;
          Object.entries(consolidationData.assertions).forEach(([assertion, data]) => {
            message += `• ${assertion}:\n`;
            message += `  - Occurrences: ${data.occurrences}\n`;
            message += `  - Montant total: ${this.formatMontant(data.total)} FCFA\n`;
            if (data.comptes.size > 0) {
              message += `  - Comptes: ${Array.from(data.comptes).join(', ')}\n`;
            }
            message += `\n`;
          });
        }
  
        message += `📝 RÉSULTAT FINAL:\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        // Supprimer les balises HTML pour l'alerte
        const cleanResult = finalResult.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
        message += cleanResult;
  
        return message;
      }
  
      consolidateWithAccount(table, headers) {
        const consolidation = {};
        const tbody = table.querySelector('tbody') || table;
        const rows = tbody.querySelectorAll('tr');
        
        const colIndexes = this.getColumnIndexes(headers);
        
        rows.forEach((row, index) => {
          if (index === 0 && row.querySelector('th')) return;
          
          const cells = row.querySelectorAll('td');
          if (cells.length === 0) return;
          
          const assertion = cells[colIndexes.assertion]?.textContent?.trim();
          const conclusion = cells[colIndexes.conclusion]?.textContent?.trim();
          const compte = cells[colIndexes.compte]?.textContent?.trim();
          const ecart = cells[colIndexes.ecart]?.textContent?.trim();
          
          if (assertion && (conclusion === 'Non-Satisfaisant' || conclusion === 'Limitation')) {
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
        const tbody = table.querySelector('tbody') || table;
        const rows = tbody.querySelectorAll('tr');
        
        const colIndexes = this.getColumnIndexes(headers);
        
        rows.forEach((row, index) => {
          if (index === 0 && row.querySelector('th')) return;
          
          const cells = row.querySelectorAll('td');
          if (cells.length === 0) return;
          
          const assertion = cells[colIndexes.assertion]?.textContent?.trim();
          const conclusion = cells[colIndexes.conclusion]?.textContent?.trim();
          const ecart = cells[colIndexes.ecart]?.textContent?.trim();
          
          if (assertion && (conclusion === 'Non-Satisfaisant' || conclusion === 'Limitation')) {
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
          assertion: headers.findIndex(h => this.matchesColumn(h.text, 'assertion')),
          conclusion: headers.findIndex(h => this.matchesColumn(h.text, 'conclusion')),
          compte: headers.findIndex(h => this.matchesColumn(h.text, 'compte')),
          ecart: headers.findIndex(h => this.matchesColumn(h.text, 'ecart'))
        };
      }
  
      parseMontant(montantStr) {
        if (!montantStr) return 0;
        const cleaned = montantStr.replace(/[^\d.,-]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
      }
  
      formatMontant(montant) {
        return new Intl.NumberFormat('fr-FR').format(Math.abs(montant));
      }
  
      formatConsolidationWithAccount(consolidation) {
        if (Object.keys(consolidation).length === 0) {
          return '✅ Aucune non-conformité détectée';
        }
  
        const results = [];
        Object.entries(consolidation).forEach(([assertion, data]) => {
          const comptes = Array.from(data.comptes).sort().join(', ');
          const phrase = this.generateAssertionPhrase(assertion, comptes, data.total);
          results.push(phrase);
        });
        
        return results.join('<br><br>');
      }
  
      generateAssertionPhrase(assertion, comptes, montant) {
        const assertionLower = assertion.toLowerCase();
        const montantFormate = this.formatMontant(montant);
        
        const phrases = {
          'validité': `🔍 <strong>Validité</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas valides pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'exhaustivité': `🔍 <strong>Exhaustivité</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas exhaustives pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'limitation': `🔍 <strong>Limitation</strong> : Nous n'avons pas obtenu les pièces justificatives relatives aux comptes <em>${comptes}</em> pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'cut-off': `🔍 <strong>Cut-off</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne respectent pas le cut-off pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'evaluation': `🔍 <strong>Évaluation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement évaluées pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'presentation': `🔍 <strong>Présentation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne respectent pas la correcte présentation pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'comptabilisation': `🔍 <strong>Comptabilisation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement comptabilisées dans le bon compte et/ou pour le bon montant pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'formalisation': `🔍 <strong>Formalisation</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement formalisées pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'application': `🔍 <strong>Application</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne sont pas correctement appliquées pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`,
          
          'permanence': `🔍 <strong>Permanence</strong> : les transactions relatives aux comptes <em>${comptes}</em> ne respectent pas le principe de permanence pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`
        };
  
        return phrases[assertionLower] || 
          `🔍 <strong>${assertion}</strong> : les transactions relatives aux comptes <em>${comptes}</em> présentent des anomalies pour un montant de <strong>${montantFormate} FCFA</strong> au 31/12/N.`;
      }
  
      formatConsolidationWithoutAccount(consolidation) {
        if (Object.keys(consolidation).length === 0) {
          return '✅ Aucune non-conformité détectée';
        }
  
        const results = [];
        Object.entries(consolidation).forEach(([assertion, data]) => {
          const phrase = this.generateSimpleAssertionPhrase(assertion, data.total);
          results.push(phrase);
        });
        
        return results.join('<br><br>');
      }
  
      generateSimpleAssertionPhrase(assertion, montant) {
        const assertionLower = assertion.toLowerCase();
        const montantFormate = this.formatMontant(montant);
        
        const phrases = {
          'validité': `🔍 <strong>Validité</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'exhaustivité': `🔍 <strong>Exhaustivité</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'limitation': `🔍 <strong>Limitation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'cut-off': `🔍 <strong>Cut-off</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'evaluation': `🔍 <strong>Évaluation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'presentation': `🔍 <strong>Présentation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'comptabilisation': `🔍 <strong>Comptabilisation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'formalisation': `🔍 <strong>Formalisation</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'application': `🔍 <strong>Application</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`,
          'permanence': `🔍 <strong>Permanence</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`
        };
  
        return phrases[assertionLower] || 
          `🔍 <strong>${assertion}</strong> : Non-conformité pour un montant de <strong>${montantFormate} FCFA</strong>.`;
      }
  
      updateConsolidationDisplay(table, content) {
        const tableId = this.generateTableId(table);
        const displays = document.querySelectorAll(`#conso-content-${tableId}, [id*="conso-content"]`);
        
        // Essayer de trouver l'élément d'affichage
        let targetDisplay = null;
        
        if (displays.length > 0) {
          targetDisplay = displays[0];
        } else {
          // Chercher dans les tables de consolidation proches
          const parent = table.parentElement;
          if (parent) {
            const consoTable = parent.querySelector('.claraverse-conso-table');
            if (consoTable) {
              targetDisplay = consoTable.querySelector('td');
            }
          }
        }
        
        if (targetDisplay) {
          targetDisplay.innerHTML = content;
          debug.log('✅ Affichage de consolidation mis à jour');
          
          // 🚨 ALERTE SUPPLÉMENTAIRE - Confirmer la mise à jour
          setTimeout(() => {
            alert(`✅ MISE À JOUR CONFIRMÉE\n\nLe contenu a été mis à jour dans la table de consolidation:\n\n${content.replace(/<[^>]*>/g, '').substring(0, 200)}${content.length > 200 ? '...' : ''}`);
          }, 500);
          
        } else {
          debug.warn('⚠️ Impossible de trouver l\'élément d\'affichage');
          
          // 🚨 ALERTE D'ERREUR - Élément non trouvé
          alert(`❌ ERREUR D'AFFICHAGE\n\nImpossible de trouver l'élément d'affichage de la consolidation.\n\nContenu généré:\n${content.replace(/<[^>]*>/g, '').substring(0, 300)}`);
          
          // Essayer de créer une nouvelle table de consolidation
          debug.log('Tentative de création d\'une nouvelle table de consolidation');
          this.createConsolidationTable(table);
          
          // Réessayer après un délai
          setTimeout(() => {
            this.updateConsolidationDisplay(table, content);
          }, 1000);
        }
      }
  
      setupGlobalEventListeners() {
        // Fermer les dropdowns avec Escape
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.dropdownVisible) {
            this.hideDropdown();
          }
        });
  
        // Gérer les clics globaux
        document.addEventListener('click', (e) => {
          if (this.dropdownVisible && !e.target.closest('.claraverse-dropdown')) {
            this.hideDropdown();
          }
        });
      }
  
      destroy() {
        debug.log('🧹 Nettoyage du processeur');
        
        if (this.observer) {
          this.observer.disconnect();
        }
        
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }
        
        if (this.consolidationTimeout) {
          clearTimeout(this.consolidationTimeout);
        }
        
        this.hideDropdown();
        
        // Supprimer les tables de consolidation
        document.querySelectorAll('.claraverse-conso-table').forEach(table => {
          table.remove();
        });
        
        this.isInitialized = false;
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
      
      // Exposer pour le debug
      window.claraverseProcessor = processor;
      
      debug.log('🎉 Processeur Claraverse initialisé');
    }
  
    // Auto-initialisation
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initClaraverseProcessor);
    } else {
      // Petit délai pour laisser React se charger
      setTimeout(initClaraverseProcessor, 1000);
    }
  
    // Réinitialisation périodique pour les SPAs
    setInterval(() => {
      if (processor && !processor.isInitialized) {
        debug.log('🔄 Réinitialisation détectée');
        initClaraverseProcessor();
      }
    }, 5000);
  
    // Export global
    window.ClaraverseTableProcessor = ClaraverseTableProcessor;
    window.initClaraverseProcessor = initClaraverseProcessor;
  
  })();