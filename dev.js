// Utilitaires pour la manipulation des tables dans le chat avec localStorage

class TableDataManager {
  constructor() {
    this.storageKey = 'claraverse_table_data';
    this.tableCounter = 0;
  }

  // Génère un ID unique pour chaque table
  generateTableId() {
    return `table_${Date.now()}_${++this.tableCounter}`;
  }

  // Sauvegarde les données d'une table dans localStorage
  saveTableData(tableId, data) {
    try {
      const allTableData = this.getAllTableData();
      allTableData[tableId] = {
        data: data,
        timestamp: Date.now(),
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(allTableData));
      console.log(`Table ${tableId} sauvegardée dans localStorage`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  // Récupère les données d'une table depuis localStorage
  getTableData(tableId) {
    try {
      const allTableData = this.getAllTableData();
      return allTableData[tableId] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return null;
    }
  }

  // Récupère toutes les données des tables
  getAllTableData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erreur lors de la lecture de localStorage:', error);
      return {};
    }
  }

  // Supprime les données d'une table
  deleteTableData(tableId) {
    try {
      const allTableData = this.getAllTableData();
      delete allTableData[tableId];
      localStorage.setItem(this.storageKey, JSON.stringify(allTableData));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }

  // Nettoie toutes les données des tables
  clearAllTableData() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      return false;
    }
  }
}

// Fonctions pour manipuler les tables HTML dans le DOM
class TableDOMManager {
  constructor(tableDataManager) {
    this.tableDataManager = tableDataManager;
  }

  // Rend une table éditable
  makeTableEditable(tableElement, tableId) {
    if (!tableElement || tableElement.tagName !== 'TABLE') {
      console.error('Élément table invalide');
      return false;
    }

    // Ajoute l'attribut contenteditable aux cellules
    const cells = tableElement.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.setAttribute('contenteditable', 'true');
      cell.style.border = '1px solid #ddd';
      cell.style.padding = '8px';
      
      // Événement pour sauvegarder automatiquement
      cell.addEventListener('blur', () => {
        this.saveTableChanges(tableElement, tableId);
      });
    });

    // Ajoute des boutons de contrôle
    this.addTableControls(tableElement, tableId);
    
    console.log(`Table ${tableId} rendue éditable`);
    return true;
  }

  // Ajoute des boutons de contrôle à la table
  addTableControls(tableElement, tableId) {
    // Conteneur pour les boutons
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'table-controls';
    controlsDiv.style.cssText = `
      margin: 10px 0;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    // Bouton de sauvegarde
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Sauvegarder';
    saveBtn.style.cssText = `
      background: #28a745;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    saveBtn.addEventListener('click', () => {
      this.saveTableChanges(tableElement, tableId);
      this.showNotification('Table sauvegardée!', 'success');
    });

    // Bouton de restauration
    const restoreBtn = document.createElement('button');
    restoreBtn.textContent = '🔄 Restaurer';
    restoreBtn.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    restoreBtn.addEventListener('click', () => {
      this.restoreTableData(tableElement, tableId);
      this.showNotification('Table restaurée!', 'info');
    });

    // Bouton d'effacement
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Effacer';
    clearBtn.style.cssText = `
      background: #dc3545;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    clearBtn.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir effacer cette table?')) {
        this.tableDataManager.deleteTableData(tableId);
        this.showNotification('Table effacée!', 'warning');
      }
    });

    // Indicateur de statut
    const statusSpan = document.createElement('span');
    statusSpan.id = `status-${tableId}`;
    statusSpan.style.cssText = `
      font-size: 12px;
      color: #6c757d;
      margin-left: auto;
    `;
    const savedData = this.tableDataManager.getTableData(tableId);
    statusSpan.textContent = savedData ? `Dernière sauvegarde: ${new Date(savedData.timestamp).toLocaleString()}` : 'Non sauvegardé';

    controlsDiv.appendChild(saveBtn);
    controlsDiv.appendChild(restoreBtn);
    controlsDiv.appendChild(clearBtn);
    controlsDiv.appendChild(statusSpan);

    // Insère les contrôles avant la table
    tableElement.parentNode.insertBefore(controlsDiv, tableElement);
  }

  // Sauvegarde les changements de la table
  saveTableChanges(tableElement, tableId) {
    const data = this.extractTableData(tableElement);
    const success = this.tableDataManager.saveTableData(tableId, data);
    
    // Met à jour le statut
    const statusSpan = document.getElementById(`status-${tableId}`);
    if (statusSpan) {
      statusSpan.textContent = success ? 
        `Dernière sauvegarde: ${new Date().toLocaleString()}` : 
        'Erreur de sauvegarde';
    }
    
    return success;
  }

  // Extrait les données de la table
  extractTableData(tableElement) {
    const rows = [];
    const tableRows = tableElement.querySelectorAll('tr');
    
    tableRows.forEach(row => {
      const cells = [];
      const tableCells = row.querySelectorAll('td, th');
      
      tableCells.forEach(cell => {
        cells.push({
          content: cell.textContent || '',
          isHeader: cell.tagName === 'TH'
        });
      });
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    
    return { rows };
  }

  // Restaure les données de la table
  restoreTableData(tableElement, tableId) {
    const savedData = this.tableDataManager.getTableData(tableId);
    if (!savedData || !savedData.data || !savedData.data.rows) {
      console.log('Aucune donnée sauvegardée trouvée');
      return false;
    }

    // Reconstruit la table
    const tbody = tableElement.querySelector('tbody') || tableElement;
    tbody.innerHTML = '';

    savedData.data.rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cellData => {
        const cell = document.createElement(cellData.isHeader ? 'th' : 'td');
        cell.textContent = cellData.content;
        cell.setAttribute('contenteditable', 'true');
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
        
        // Réattache l'événement de sauvegarde
        cell.addEventListener('blur', () => {
          this.saveTableChanges(tableElement, tableId);
        });
        
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    return true;
  }

  // Affiche une notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    // Couleurs selon le type
    const colors = {
      success: '#28a745',
      info: '#007bff',
      warning: '#ffc107',
      error: '#dc3545'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Supprime la notification après 3 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Classe principale pour l'intégration dans les composants
class ChatTableIntegration {
  constructor() {
    this.tableDataManager = new TableDataManager();
    this.tableDOMManager = new TableDOMManager(this.tableDataManager);
    this.initialized = false;
  }

  // Initialise l'intégration
  init() {
    if (this.initialized) return;
    
    console.log('Initialisation de ChatTableIntegration');
    this.observeNewTables();
    this.processExistingTables();
    this.initialized = true;
  }

  // Observe l'ajout de nouvelles tables
  observeNewTables() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tables = node.querySelectorAll ? node.querySelectorAll('table') : [];
            tables.forEach(table => this.processTable(table));
            
            if (node.tagName === 'TABLE') {
              this.processTable(node);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Traite les tables existantes
  processExistingTables() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => this.processTable(table));
  }

  // Traite une table individuelle
  processTable(tableElement) {
    // Vérifie si la table est dans un message de chat
    const chatMessage = tableElement.closest('.prose-base, .markdown-body, [class*="message"]');
    if (!chatMessage) return;

    // Évite de traiter la même table deux fois
    if (tableElement.hasAttribute('data-table-id')) return;

    const tableId = this.tableDataManager.generateTableId();
    tableElement.setAttribute('data-table-id', tableId);
    
    // Rend la table éditable
    this.tableDOMManager.makeTableEditable(tableElement, tableId);
    
    // Tente de restaurer les données sauvegardées
    const savedData = this.tableDataManager.getTableData(tableId);
    if (savedData) {
      setTimeout(() => {
        this.tableDOMManager.restoreTableData(tableElement, tableId);
      }, 100);
    }
  }

  // Méthodes publiques pour l'utilisation dans les composants
  saveAllTables() {
    const tables = document.querySelectorAll('table[data-table-id]');
    tables.forEach(table => {
      const tableId = table.getAttribute('data-table-id');
      if (tableId) {
        this.tableDOMManager.saveTableChanges(table, tableId);
      }
    });
  }

  restoreAllTables() {
    const tables = document.querySelectorAll('table[data-table-id]');
    tables.forEach(table => {
      const tableId = table.getAttribute('data-table-id');
      if (tableId) {
        this.tableDOMManager.restoreTableData(table, tableId);
      }
    });
  }

  clearAllData() {
    return this.tableDataManager.clearAllTableData();
  }

  // Méthode pour forcer la recherche de nouvelles tables
  refreshTables() {
    this.processExistingTables();
  }
}

// Instance globale
window.ChatTableIntegration = window.ChatTableIntegration || new ChatTableIntegration();

// Initialisation automatique avec plusieurs tentatives
function initializeTableManager() {
  console.log('Tentative d\'initialisation du gestionnaire de tables...');
  
  if (window.ChatTableIntegration && !window.ChatTableIntegration.initialized) {
    window.ChatTableIntegration.init();
    console.log('Gestionnaire de tables initialisé avec succès');
    return true;
  }
  return false;
}

// Initialisation immédiate
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTableManager);
} else {
  initializeTableManager();
}

// Réessaie toutes les 2 secondes pendant 30 secondes
let initAttempts = 0;
const maxAttempts = 15;
const initInterval = setInterval(() => {
  if (initializeTableManager() || initAttempts >= maxAttempts) {
    clearInterval(initInterval);
  }
  initAttempts++;
}, 2000);

// Fonction utilitaire pour déboguer
window.debugTables = function() {
  console.log('=== Debug Tables ===' );
  const allTables = document.querySelectorAll('table');
  console.log(`Tables trouvées: ${allTables.length}`);
  
  allTables.forEach((table, index) => {
    console.log(`Table ${index + 1}:`, {
      element: table,
      hasId: table.hasAttribute('data-table-id'),
      id: table.getAttribute('data-table-id'),
      contentEditable: table.querySelectorAll('[contenteditable="true"]').length,
      parent: table.closest('.prose, .markdown-body, [class*="message"], [class*="chat"]')
    });
  });
};

// Fonction pour forcer l'édition de toutes les tables
window.forceEditableTables = function() {
  console.log('Forçage de l\'édition des tables...');
  const tables = document.querySelectorAll('table');
  
  tables.forEach((table, index) => {
    if (!table.hasAttribute('data-table-id')) {
      const tableId = `forced_table_${Date.now()}_${index}`;
      table.setAttribute('data-table-id', tableId);
      
      // Rend directement éditable
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.setAttribute('contenteditable', 'true');
        cell.style.border = '1px solid #007bff';
        cell.style.padding = '8px';
        cell.style.backgroundColor = '#f8f9ff';
      });
      
      console.log(`Table ${index + 1} rendue éditable avec ID: ${tableId}`);
    }
  });
};

export { ChatTableIntegration, TableDataManager, TableDOMManager };