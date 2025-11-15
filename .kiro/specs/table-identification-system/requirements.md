# Requirements Document

## Introduction

Le système actuel d'identification des tables dans Claraverse présente des conflits lorsque des tables similaires (même structure, même en-têtes) sont générées dans différents chats. Les tables sauvegardées dans le localStorage remplacent incorrectement le contenu des nouvelles tables, causant une confusion des données entre les sessions de chat. Cette spécification définit un système d'identification robuste qui intègre les identifiants de session de chat, d'utilisateur et de conteneur DIV pour garantir l'unicité et éviter les conflits de données.

## Glossary

- **Table_System**: Le système de gestion et d'identification des tables HTML dans Claraverse
- **Chat_Session**: Une session de conversation unique identifiée par un ID généré par crypto.randomUUID()
- **Table_Container**: L'élément DIV parent qui contient une ou plusieurs tables HTML dans le chat
- **Storage_Manager**: Le composant menu_storage.js responsable de la persistance des données de table
- **Table_ID**: L'identifiant unique généré pour chaque table incluant session, conteneur et position
- **User_Context**: Le contexte utilisateur actuel dans l'application
- **DOM_Observer**: Le système de surveillance des modifications DOM pour détecter les nouvelles tables

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur de Claraverse, je veux que mes tables de données restent isolées par session de chat, afin que les données d'une session ne remplacent pas celles d'une autre session.

#### Acceptance Criteria

1. WHEN une nouvelle table est créée dans une session de chat, THE Table_System SHALL générer un identifiant unique incluant l'ID de session
2. WHEN une table est sauvegardée, THE Storage_Manager SHALL utiliser l'identifiant de session dans la clé de stockage
3. WHEN une table est restaurée, THE Storage_Manager SHALL vérifier la correspondance de l'ID de session avant la restauration
4. WHEN deux sessions contiennent des tables avec la même structure, THE Table_System SHALL maintenir des données séparées pour chaque session
5. WHERE une session de chat n'a pas d'ID disponible, THE Table_System SHALL générer un ID de session temporaire unique

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que les tables dans différents conteneurs DIV d'une même session restent distinctes, afin d'éviter les conflits entre différents groupes de tables.

#### Acceptance Criteria

1. WHEN une table est détectée dans un conteneur DIV, THE Table_System SHALL générer un identifiant unique pour le conteneur
2. WHEN plusieurs tables existent dans le même conteneur, THE Table_System SHALL les identifier par leur position relative dans le conteneur
3. WHILE un conteneur DIV contient des tables, THE Table_System SHALL maintenir un mapping stable entre les tables et leurs positions
4. IF un nouveau conteneur DIV avec des tables est ajouté, THEN THE Table_System SHALL lui assigner un nouvel identifiant unique
5. WHERE un conteneur DIV n'a pas d'attribut d'identification, THE Table_System SHALL générer et assigner un data-container-id unique

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le système gère automatiquement la migration des anciennes tables sans identifiants robustes, afin de préserver mes données existantes.

#### Acceptance Criteria

1. WHEN le système détecte une table avec un ancien format d'ID, THE Storage_Manager SHALL migrer automatiquement vers le nouveau format
2. WHEN une migration est effectuée, THE Storage_Manager SHALL préserver toutes les données existantes de la table
3. WHILE la migration s'exécute, THE Storage_Manager SHALL maintenir la compatibilité avec l'ancien système
4. IF la migration échoue pour une table, THEN THE Storage_Manager SHALL conserver l'ancien format et enregistrer l'erreur
5. WHERE des données en double sont détectées pendant la migration, THE Storage_Manager SHALL prioriser les données les plus récentes

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que le système détecte automatiquement le contexte de session actuel, afin que l'identification des tables soit transparente.

#### Acceptance Criteria

1. WHEN l'application démarre, THE Table_System SHALL détecter automatiquement l'ID de session de chat actuel
2. WHEN l'utilisateur navigue vers une nouvelle session, THE Table_System SHALL mettre à jour le contexte de session
3. WHILE aucune session n'est active, THE Table_System SHALL créer un contexte de session temporaire
4. IF l'ID de session change pendant l'utilisation, THEN THE Table_System SHALL mettre à jour tous les nouveaux identifiants de table
5. WHERE l'ID de session ne peut pas être déterminé, THE Table_System SHALL utiliser un identifiant basé sur l'URL et le timestamp

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que le système nettoie automatiquement les données obsolètes, afin d'optimiser l'utilisation du stockage local.

#### Acceptance Criteria

1. WHEN le quota de localStorage approche la limite, THE Storage_Manager SHALL nettoyer automatiquement les données les plus anciennes
2. WHEN des sessions de chat sont supprimées, THE Storage_Manager SHALL supprimer toutes les données de table associées
3. WHILE le nettoyage s'exécute, THE Storage_Manager SHALL préserver les données des sessions actives et récentes
4. IF des données orphelines sont détectées, THEN THE Storage_Manager SHALL les marquer pour suppression
5. WHERE l'utilisateur demande un nettoyage manuel, THE Storage_Manager SHALL fournir des options de nettoyage sélectif