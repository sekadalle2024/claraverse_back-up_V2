# Design Document

## Overview

Ce document décrit la conception d'un système d'identification robuste pour les tables HTML dans Claraverse. Le système actuel génère des conflits lorsque des tables similaires existent dans différentes sessions de chat, causant des remplacements de données incorrects. La nouvelle architecture intègre les identifiants de session de chat, les conteneurs DIV et la position des tables pour garantir l'unicité et l'isolation des données.

## Architecture

### Architecture Actuelle

Le système actuel dans `menu_storage.js` utilise une approche simplifiée :

```javascript
// Génération ID actuelle - PROBLÉMATIQUE
generateStableTableId(table) {
  const allChatTables = document.querySelectorAll('div.prose table.min-w-full');
  const position = Array.from(allChatTables).indexOf(table);
  const contentHash = this.simpleHash(firstRow.textContent.slice(0, 100));
  return `${this.config.storagePrefix}${position}_${contentHash}`;
}
```

**Problèmes identifiés :**
- Pas d'isolation par session de chat
- Pas d'identification du conteneur DIV parent
- Hash basé uniquement sur le contenu de la première ligne
- Conflits entre sessions avec des tables similaires

### Architecture Proposée

La nouvelle architecture introduit un système d'identification hiérarchique à 4 niveaux :

```
Session ID → Container ID → Table Position → Content Hash
```

## Components and Interfaces

### 1. Context Manager (Nouveau)

**Responsabilité :** Détecter et maintenir le contexte de session actuel

```javascript
class ClaraverseContextManager {
  constructor() {
    this.currentSessionId = null;
    this.sessionDetectionMethods = [
      'detectFromReactState',
      'detectFromURL', 
      'detectFromDOM',
      'generateTemporary'
    ];
  }

  // Détection automatique du contexte de session
  detectCurrentSession() {
    for (const method of this.sessionDetectionMethods) {
      const sessionId = this[method]();
      if (sessionId) {
        this.currentSessionId = sessionId;
        return sessionId;
      }
    }
    return this.generateTemporarySession();
  }

  // Méthodes de détection
  detectFromReactState() {
    // Accès à l'état React via window.claraverseState
    return window.claraverseState?.currentSession?.id;
  }

  detectFromURL() {
    // Extraction depuis l'URL si disponible
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sessionId');
  }

  detectFromDOM() {
    // Recherche d'attributs data-session-id dans le DOM
    const sessionElement = document.querySelector('[data-session-id]');
    return sessionElement?.getAttribute('data-session-id');
  }

  generateTemporarySession() {
    // Génération d'un ID temporaire basé sur timestamp et URL
    const timestamp = Date.now();
    const urlHash = this.simpleHash(window.location.href);
    return `temp_${timestamp}_${urlHash}`;
  }
}
```

### 2. Container Manager (Nouveau)

**Responsabilité :** Identifier et gérer les conteneurs DIV avec des tables

```javascript
class TableContainerManager {
  constructor() {
    this.containerMap = new Map();
    this.containerSelectors = [
      'div.prose.prose-base.dark\\:prose-invert.max-w-none',
      'div.glassmorphic',
      '[data-table-container]'
    ];
  }

  // Identification ou création d'ID de conteneur
  getOrCreateContainerId(table) {
    const container = this.findTableContainer(table);
    if (!container) return 'no-container';

    // Vérifier si le conteneur a déjà un ID
    let containerId = container.getAttribute('data-container-id');
    
    if (!containerId) {
      containerId = this.generateContainerId(container);
      container.setAttribute('data-container-id', containerId);
    }

    return containerId;
  }

  findTableContainer(table) {
    for (const selector of this.containerSelectors) {
      const container = table.closest(selector);
      if (container) return container;
    }
    return null;
  }

  generateContainerId(container) {
    // Génération basée sur position et contenu
    const allContainers = document.querySelectorAll(this.containerSelectors.join(','));
    const position = Array.from(allContainers).indexOf(container);
    const contentHash = this.hashContainerContent(container);
    const timestamp = Date.now();
    
    return `container_${position}_${contentHash}_${timestamp}`;
  }

  hashContainerContent(container) {
    // Hash basé sur les en-têtes de tables dans le conteneur
    const tables = container.querySelectorAll('table');
    const headers = Array.from(tables).map(table => {
      const firstRow = table.querySelector('tr');
      return firstRow ? firstRow.textContent.slice(0, 50) : '';
    }).join('|');
    
    return this.simpleHash(headers);
  }
}
```

### 3. Enhanced Table Storage Manager

**Responsabilité :** Gestion de la persistance avec le nouveau système d'ID

```javascript
class EnhancedTableStorageManager extends TableStorageManager {
  constructor() {
    super();
    this.contextManager = new ClaraverseContextManager();
    this.containerManager = new TableContainerManager();
    this.migrationManager = new DataMigrationManager();
  }

  // Nouvelle génération d'ID robuste
  generateRobustTableId(table) {
    // 1. Contexte de session
    const sessionId = this.contextManager.detectCurrentSession();
    
    // 2. Conteneur parent
    const containerId = this.containerManager.getOrCreateContainerId(table);
    
    // 3. Position dans le conteneur
    const container = this.containerManager.findTableContainer(table);
    const tablesInContainer = container ? 
      container.querySelectorAll('table') : 
      document.querySelectorAll('table');
    const position = Array.from(tablesInContainer).indexOf(table);
    
    // 4. Hash du contenu
    const contentHash = this.generateContentHash(table);
    
    // 5. Assemblage de l'ID final
    const tableId = `claraverse_table_${sessionId}_${containerId}_${position}_${contentHash}`;
    
    // Stocker l'ID sur la table
    table.setAttribute('data-robust-table-id', tableId);
    
    return tableId;
  }

  generateContentHash(table) {
    // Hash plus robuste basé sur structure et contenu
    const firstRow = table.querySelector('tr');
    const headerText = firstRow ? firstRow.textContent.slice(0, 100) : '';
    const rowCount = table.querySelectorAll('tr').length;
    const colCount = firstRow ? firstRow.children.length : 0;
    
    const signature = `${headerText}_${rowCount}x${colCount}`;
    return this.simpleHash(signature);
  }

  // Sauvegarde avec nouveau système
  saveTableWithRobustId(table) {
    try {
      // Vérifier si c'est une ancienne table à migrer
      const oldId = table.getAttribute('data-menu-table-id');
      const newId = this.generateRobustTableId(table);
      
      if (oldId && oldId !== newId) {
        // Migration des données existantes
        this.migrationManager.migrateTableData(oldId, newId);
      }
      
      // Sauvegarde avec le nouvel ID
      const tableData = {
        id: newId,
        html: table.outerHTML,
        timestamp: Date.now(),
        sessionId: this.contextManager.currentSessionId,
        containerId: this.containerManager.getOrCreateContainerId(table),
        metadata: {
          rowCount: table.querySelectorAll('tr').length,
          colCount: table.querySelector('tr')?.children.length || 0,
          version: '2.0'
        }
      };

      localStorage.setItem(newId, JSON.stringify(tableData));
      console.log(`✅ Sauvegarde robuste: ${newId}`);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde robuste:', error);
      return false;
    }
  }
}
```

### 4. Data Migration Manager (Nouveau)

**Responsabilité :** Migration des données existantes vers le nouveau format

```javascript
class DataMigrationManager {
  constructor() {
    this.migrationVersion = '2.0';
    this.oldPrefix = 'claraverse_table_';
  }

  // Migration automatique des anciennes données
  async migrateAllExistingData() {
    console.log('🔄 Début migration des données de table...');
    
    const oldKeys = this.findOldFormatKeys();
    let migratedCount = 0;
    let errorCount = 0;

    for (const oldKey of oldKeys) {
      try {
        const success = await this.migrateSingleTable(oldKey);
        if (success) migratedCount++;
      } catch (error) {
        console.error(`❌ Erreur migration ${oldKey}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Migration terminée: ${migratedCount} migrées, ${errorCount} erreurs`);
    return { migratedCount, errorCount };
  }

  findOldFormatKeys() {
    const oldKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.oldPrefix) && !this.isNewFormat(key)) {
        oldKeys.push(key);
      }
    }
    return oldKeys;
  }

  isNewFormat(key) {
    // Nouveau format: claraverse_table_sessionId_containerId_position_hash
    const parts = key.split('_');
    return parts.length >= 6; // claraverse + table + sessionId + containerId + position + hash
  }

  async migrateSingleTable(oldKey) {
    try {
      const oldData = JSON.parse(localStorage.getItem(oldKey));
      if (!oldData) return false;

      // Générer un nouvel ID générique pour les anciennes données
      const genericSessionId = 'migrated_legacy';
      const genericContainerId = 'legacy_container';
      const timestamp = oldData.timestamp || Date.now();
      const newKey = `claraverse_table_${genericSessionId}_${genericContainerId}_0_${timestamp}`;

      // Mettre à jour les données avec le nouveau format
      const newData = {
        ...oldData,
        id: newKey,
        sessionId: genericSessionId,
        containerId: genericContainerId,
        metadata: {
          ...oldData.metadata,
          version: this.migrationVersion,
          migratedFrom: oldKey,
          migrationDate: Date.now()
        }
      };

      // Sauvegarder avec le nouveau format
      localStorage.setItem(newKey, JSON.stringify(newData));
      
      // Supprimer l'ancienne entrée après confirmation
      localStorage.removeItem(oldKey);
      
      console.log(`✅ Migration: ${oldKey} → ${newKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur migration ${oldKey}:`, error);
      return false;
    }
  }
}
```

## Data Models

### Table Storage Data Model

```typescript
interface RobustTableData {
  // Identifiants
  id: string;                    // ID complet robuste
  sessionId: string;             // ID de session de chat
  containerId: string;           // ID du conteneur DIV
  
  // Données de table
  html: string;                  // HTML complet de la table
  timestamp: number;             // Timestamp de sauvegarde
  
  // Métadonnées
  metadata: {
    rowCount: number;            // Nombre de lignes
    colCount: number;            // Nombre de colonnes
    version: string;             // Version du format de données
    position: number;            // Position dans le conteneur
    contentHash: string;         // Hash du contenu
    migratedFrom?: string;       // Clé d'origine si migrée
    migrationDate?: number;      // Date de migration
  };
  
  // Contexte
  context: {
    url: string;                 // URL de la page
    userAgent: string;           // User agent du navigateur
    sessionStartTime: number;    // Début de session
  };
}
```

### Session Context Model

```typescript
interface SessionContext {
  sessionId: string;             // ID unique de session
  detectionMethod: string;       // Méthode de détection utilisée
  isTemporary: boolean;          // Session temporaire ou persistante
  startTime: number;             // Début de session
  lastActivity: number;          // Dernière activité
  url: string;                   // URL de la session
}
```

## Error Handling

### 1. Gestion des Erreurs de Détection de Session

```javascript
class SessionDetectionError extends Error {
  constructor(message, method) {
    super(message);
    this.name = 'SessionDetectionError';
    this.method = method;
  }
}

// Stratégie de fallback
detectCurrentSessionWithFallback() {
  const fallbackChain = [
    () => this.detectFromReactState(),
    () => this.detectFromURL(),
    () => this.detectFromDOM(),
    () => this.generateTemporarySession()
  ];

  for (const [index, method] of fallbackChain.entries()) {
    try {
      const sessionId = method();
      if (sessionId) {
        console.log(`✅ Session détectée via méthode ${index + 1}`);
        return sessionId;
      }
    } catch (error) {
      console.warn(`⚠️ Méthode ${index + 1} échouée:`, error);
    }
  }

  throw new SessionDetectionError('Toutes les méthodes de détection ont échoué');
}
```

### 2. Gestion des Erreurs de Migration

```javascript
class MigrationError extends Error {
  constructor(message, oldKey, details) {
    super(message);
    this.name = 'MigrationError';
    this.oldKey = oldKey;
    this.details = details;
  }
}

// Stratégie de récupération
async migrateSingleTableWithRecovery(oldKey) {
  try {
    return await this.migrateSingleTable(oldKey);
  } catch (error) {
    // Tentative de récupération
    console.warn(`⚠️ Erreur migration ${oldKey}, tentative de récupération...`);
    
    try {
      // Sauvegarder les données dans un format de récupération
      const rawData = localStorage.getItem(oldKey);
      const recoveryKey = `recovery_${oldKey}_${Date.now()}`;
      localStorage.setItem(recoveryKey, rawData);
      
      console.log(`💾 Données sauvegardées en récupération: ${recoveryKey}`);
      return false;
    } catch (recoveryError) {
      throw new MigrationError('Migration et récupération échouées', oldKey, {
        originalError: error,
        recoveryError: recoveryError
      });
    }
  }
}
```

## Testing Strategy

### 1. Tests Unitaires

```javascript
// Test de génération d'ID robuste
describe('RobustTableId Generation', () => {
  test('should generate unique IDs for different sessions', () => {
    const table = createMockTable();
    const manager = new EnhancedTableStorageManager();
    
    // Simuler différentes sessions
    manager.contextManager.currentSessionId = 'session1';
    const id1 = manager.generateRobustTableId(table);
    
    manager.contextManager.currentSessionId = 'session2';
    const id2 = manager.generateRobustTableId(table);
    
    expect(id1).not.toBe(id2);
    expect(id1).toContain('session1');
    expect(id2).toContain('session2');
  });
});
```

### 2. Tests d'Intégration

```javascript
// Test de migration complète
describe('Data Migration', () => {
  test('should migrate all legacy data successfully', async () => {
    // Préparer des données legacy
    const legacyData = createLegacyTableData();
    localStorage.setItem('claraverse_table_0_12345', JSON.stringify(legacyData));
    
    const migrationManager = new DataMigrationManager();
    const result = await migrationManager.migrateAllExistingData();
    
    expect(result.migratedCount).toBe(1);
    expect(result.errorCount).toBe(0);
    
    // Vérifier que les nouvelles données existent
    const newKeys = Object.keys(localStorage).filter(key => 
      key.includes('migrated_legacy')
    );
    expect(newKeys.length).toBe(1);
  });
});
```

### 3. Tests de Performance

```javascript
// Test de performance de détection de session
describe('Session Detection Performance', () => {
  test('should detect session within acceptable time', () => {
    const manager = new ClaraverseContextManager();
    
    const startTime = performance.now();
    const sessionId = manager.detectCurrentSession();
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50); // < 50ms
    expect(sessionId).toBeTruthy();
  });
});
```

### 4. Tests de Compatibilité

```javascript
// Test de compatibilité avec l'ancien système
describe('Backward Compatibility', () => {
  test('should handle legacy table IDs gracefully', () => {
    const table = createMockTable();
    table.setAttribute('data-menu-table-id', 'claraverse_table_0_12345');
    
    const manager = new EnhancedTableStorageManager();
    const newId = manager.generateRobustTableId(table);
    
    // Vérifier que l'ancien ID est préservé pendant la transition
    expect(table.hasAttribute('data-menu-table-id')).toBe(true);
    expect(table.hasAttribute('data-robust-table-id')).toBe(true);
  });
});
```

## Implementation Phases

### Phase 1: Infrastructure (Semaine 1)
- Création des nouveaux managers (Context, Container, Migration)
- Tests unitaires des composants de base
- Intégration avec le système existant

### Phase 2: Migration (Semaine 2)
- Implémentation du système de migration
- Tests de migration avec données réelles
- Mécanismes de récupération d'erreur

### Phase 3: Déploiement (Semaine 3)
- Intégration complète dans menu_storage.js
- Tests d'intégration complets
- Documentation utilisateur

### Phase 4: Optimisation (Semaine 4)
- Optimisations de performance
- Nettoyage automatique des anciennes données
- Monitoring et métriques