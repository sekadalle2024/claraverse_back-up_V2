# Requirements Document

## Introduction

L'application Claraverse intègre un script Flowise.js (V17.1) qui génère dynamiquement des tables HTML en réponse à des requêtes vers un endpoint n8n. Actuellement, ces tables générées disparaissent après actualisation de la page car elles ne sont pas intégrées au système de persistance IndexedDB existant. Cette spécification définit les exigences pour intégrer le système de génération de tables Flowise.js avec le système de persistance robuste déjà implémenté dans menu_storage.js, garantissant que toutes les tables générées dynamiquement persistent correctement entre les sessions.

## Glossary

- **Flowise_System**: Le script JavaScript (Flowise.js V17.1) qui détecte les tables déclencheuses, collecte les critères, interroge l'endpoint n8n et intègre les tables de réponse dans le DOM
- **N8n_Endpoint**: Le service webhook n8n (http://localhost:5678/webhook/htlm_processor) qui traite les données de table et retourne des tables formatées en markdown
- **Trigger_Table**: Une table HTML avec un en-tête de colonne "Flowise" qui déclenche le processus de collecte et d'envoi vers n8n
- **Generated_Table**: Une table HTML créée dynamiquement par Flowise_System à partir de la réponse n8n et insérée dans le DOM
- **Storage_System**: Le système de persistance IndexedDB implémenté dans menu_storage.js avec identification robuste des tables
- **Dynamic_Keyword**: Le mot-clé extrait dynamiquement de la première ligne de la colonne "Flowise" de la Trigger_Table
- **Criteria_Tables**: Les tables collectées dans les conteneurs DIV correspondant au Dynamic_Keyword
- **User_Message_Table**: Une table générée automatiquement contenant le message utilisateur précédant la Trigger_Table
- **Table_Container**: L'élément DIV parent (div.prose) qui contient les tables générées
- **Persistence_Marker**: Un attribut data-* ajouté aux Generated_Tables pour indiquer qu'elles doivent être sauvegardées
- **Restoration_Manager**: Le composant responsable de restaurer les Generated_Tables depuis IndexedDB au chargement de la page
- **Clara_Chat_Session**: Une session de conversation gérée par claraChatService.ts et persistée dans IndexedDB via claraDatabase.ts
- **Session_Context**: Le contexte de session actif incluant l'ID de session Clara utilisé pour lier les Generated_Tables aux conversations
- **Chat_Message**: Un message dans une Clara_Chat_Session, pouvant contenir du texte, des pièces jointes et des métadonnées
- **Table_Metadata**: Les métadonnées associées à une Generated_Table incluant sessionId, timestamp, Dynamic_Keyword et source (n8n ou cached)

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur de Claraverse, je veux que les tables générées par Flowise.js persistent après actualisation de la page et soient liées à ma session de chat active, afin de ne pas perdre les résultats de mes requêtes n8n et de maintenir la cohérence avec mes conversations.

#### Acceptance Criteria

1. WHEN Flowise_System génère une Generated_Table depuis une réponse n8n, THE Storage_System SHALL sauvegarder automatiquement la table dans IndexedDB avec l'ID de la Clara_Chat_Session active
2. WHEN l'utilisateur actualise la page, THE Restoration_Manager SHALL détecter la Clara_Chat_Session active et restaurer uniquement les Generated_Tables associées à cette session
3. WHEN une Generated_Table est restaurée, THE Restoration_Manager SHALL préserver la structure HTML, les styles CSS et les attributs data-* de la table
4. WHEN plusieurs Generated_Tables existent dans une session, THE Storage_System SHALL sauvegarder chaque table avec un identifiant unique incluant sessionId et Dynamic_Keyword
5. WHERE une Generated_Table contient des liens URL, THE Restoration_Manager SHALL préserver la fonctionnalité des liens après restauration

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que le système distingue les tables générées par Flowise.js des autres tables du chat, afin que seules les tables appropriées soient traitées par le système de persistance.

#### Acceptance Criteria

1. WHEN Flowise_System crée une Generated_Table, THE Flowise_System SHALL ajouter un attribut data-n8n-table="true" à la table
2. WHEN Flowise_System crée une Generated_Table, THE Flowise_System SHALL ajouter un attribut data-n8n-keyword contenant le Dynamic_Keyword
3. WHEN Storage_System détecte une nouvelle table dans le DOM, THE Storage_System SHALL vérifier la présence de l'attribut data-n8n-table avant la sauvegarde
4. WHEN Storage_System sauvegarde une Generated_Table, THE Storage_System SHALL inclure le Dynamic_Keyword dans les métadonnées de stockage
5. WHERE une table n'a pas l'attribut data-n8n-table, THE Storage_System SHALL appliquer les règles de persistance standard

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le système synchronise automatiquement la génération de tables Flowise.js avec le système de persistance, afin que la sauvegarde soit transparente et automatique.

#### Acceptance Criteria

1. WHEN Flowise_System termine l'intégration d'une Generated_Table dans le DOM, THE Flowise_System SHALL émettre un événement personnalisé "flowise:table:integrated"
2. WHEN Storage_System détecte l'événement "flowise:table:integrated", THE Storage_System SHALL déclencher immédiatement la sauvegarde de la Generated_Table
3. WHEN Storage_System sauvegarde une Generated_Table, THE Storage_System SHALL utiliser l'identifiant robuste incluant sessionId, containerId et Dynamic_Keyword
4. WHEN la sauvegarde est terminée, THE Storage_System SHALL émettre un événement "storage:table:saved" avec les détails de la table
5. WHERE la sauvegarde échoue, THE Storage_System SHALL émettre un événement "storage:table:error" et tenter une nouvelle sauvegarde après 2 secondes

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que le système restaure les tables générées dans le bon ordre et au bon emplacement, afin de préserver la cohérence visuelle de mes conversations.

#### Acceptance Criteria

1. WHEN la page se charge, THE Restoration_Manager SHALL détecter la session de chat active avant de restaurer les tables
2. WHEN Restoration_Manager restaure des Generated_Tables, THE Restoration_Manager SHALL restaurer les tables dans l'ordre chronologique de leur création
3. WHEN Restoration_Manager restaure une Generated_Table, THE Restoration_Manager SHALL identifier le Table_Container correct en utilisant le containerId stocké
4. IF le Table_Container d'origine n'existe pas, THEN THE Restoration_Manager SHALL créer un nouveau conteneur avec les mêmes attributs et classes CSS
5. WHERE plusieurs Generated_Tables appartiennent au même Table_Container, THE Restoration_Manager SHALL les restaurer dans leur position relative d'origine

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que le système gère les cas où la Trigger_Table et les Generated_Tables coexistent, afin d'éviter les doublons et les conflits visuels.

#### Acceptance Criteria

1. WHEN Flowise_System supprime une Trigger_Table après traitement, THE Storage_System SHALL marquer la Trigger_Table comme "processed" dans les métadonnées
2. WHEN Restoration_Manager restaure des tables, THE Restoration_Manager SHALL exclure les Trigger_Tables marquées comme "processed"
3. WHEN une Trigger_Table est détectée au chargement de la page, THE Flowise_System SHALL vérifier si des Generated_Tables correspondantes existent déjà dans le stockage
4. IF des Generated_Tables correspondantes existent, THEN THE Flowise_System SHALL ignorer le traitement de la Trigger_Table pour éviter les doublons
5. WHERE une Trigger_Table n'a pas encore été traitée, THE Flowise_System SHALL procéder normalement au traitement et à la génération

### Requirement 6

**User Story:** En tant qu'utilisateur, je veux que le système gère les erreurs de l'endpoint n8n de manière robuste, afin que les échecs de génération n'affectent pas la persistance des autres tables.

#### Acceptance Criteria

1. WHEN Flowise_System reçoit une erreur de N8n_Endpoint, THE Flowise_System SHALL créer un message d'erreur visuel dans le Table_Container
2. WHEN un message d'erreur est créé, THE Storage_System SHALL sauvegarder le message d'erreur avec un attribut data-n8n-error="true"
3. WHEN Restoration_Manager restaure un message d'erreur, THE Restoration_Manager SHALL préserver le formatage et le style d'erreur
4. WHEN l'utilisateur actualise la page après une erreur, THE Restoration_Manager SHALL restaurer le message d'erreur pour informer l'utilisateur
5. WHERE l'endpoint n8n est indisponible, THE Flowise_System SHALL utiliser les données en cache si disponibles et marquer la table comme "cached"

### Requirement 7

**User Story:** En tant qu'utilisateur, je veux que le système optimise le stockage des tables générées, afin de ne pas saturer le quota localStorage/IndexedDB avec des données volumineuses.

#### Acceptance Criteria

1. WHEN Storage_System sauvegarde une Generated_Table, THE Storage_System SHALL compresser le HTML si la taille dépasse 50 KB
2. WHEN Storage_System détecte que le quota de stockage approche 80%, THE Storage_System SHALL nettoyer automatiquement les Generated_Tables les plus anciennes
3. WHILE le nettoyage s'exécute, THE Storage_System SHALL préserver les Generated_Tables de la session active
4. WHEN Storage_System nettoie des Generated_Tables, THE Storage_System SHALL supprimer d'abord les tables marquées comme "cached" ou "error"
5. WHERE l'utilisateur a plus de 100 Generated_Tables stockées, THE Storage_System SHALL proposer un nettoyage manuel via l'API de diagnostic

### Requirement 8

**User Story:** En tant qu'utilisateur, je veux que le système fournisse des outils de diagnostic pour comprendre l'état de la persistance des tables Flowise, afin de résoudre les problèmes éventuels.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à l'API de diagnostic, THE Storage_System SHALL fournir le nombre total de Generated_Tables stockées par session
2. WHEN l'utilisateur accède à l'API de diagnostic, THE Storage_System SHALL fournir la taille totale du stockage utilisé par les Generated_Tables
3. WHEN l'utilisateur accède à l'API de diagnostic, THE Storage_System SHALL lister toutes les Generated_Tables avec leur Dynamic_Keyword et timestamp
4. WHEN l'utilisateur demande un diagnostic détaillé, THE Storage_System SHALL vérifier l'intégrité de chaque Generated_Table stockée
5. WHERE des données corrompues sont détectées, THE Storage_System SHALL proposer une réparation automatique ou une suppression sélective


### Requirement 9

**User Story:** En tant qu'utilisateur, je veux que les tables générées par Flowise.js soient automatiquement liées à ma session de chat Clara, afin que je puisse retrouver facilement toutes les tables associées à une conversation spécifique.

#### Acceptance Criteria

1. WHEN Flowise_System génère une Generated_Table, THE Storage_System SHALL détecter automatiquement l'ID de la Clara_Chat_Session active depuis le contexte React ou le DOM
2. WHEN Storage_System sauvegarde une Generated_Table, THE Storage_System SHALL inclure le sessionId de la Clara_Chat_Session dans les Table_Metadata
3. WHEN l'utilisateur navigue vers une Clara_Chat_Session différente, THE Restoration_Manager SHALL charger uniquement les Generated_Tables associées à cette session
4. WHEN l'utilisateur supprime une Clara_Chat_Session, THE Storage_System SHALL supprimer automatiquement toutes les Generated_Tables associées à cette session
5. WHERE aucune Clara_Chat_Session n'est active, THE Storage_System SHALL créer un sessionId temporaire et marquer les tables comme "orphaned" pour nettoyage ultérieur

### Requirement 10

**User Story:** En tant qu'utilisateur, je veux que le système intègre les tables générées dans le flux de messages de ma conversation Clara, afin de maintenir une chronologie cohérente entre mes messages et les résultats n8n.

#### Acceptance Criteria

1. WHEN Flowise_System génère une Generated_Table, THE Storage_System SHALL enregistrer le timestamp de génération dans les Table_Metadata
2. WHEN Restoration_Manager restaure des Generated_Tables, THE Restoration_Manager SHALL les positionner chronologiquement par rapport aux Chat_Messages de la session
3. WHEN l'utilisateur consulte l'historique d'une Clara_Chat_Session, THE Storage_System SHALL fournir une vue unifiée incluant les Chat_Messages et les Generated_Tables dans l'ordre chronologique
4. WHEN une Generated_Table est créée en réponse à un Chat_Message spécifique, THE Storage_System SHALL créer un lien de référence entre le message et la table
5. WHERE plusieurs Generated_Tables sont créées successivement, THE Restoration_Manager SHALL préserver l'ordre de création lors de la restauration


### Requirement 11

**User Story:** En tant qu'utilisateur, je veux que le système génère un fingerprint unique basé sur le contenu complet de chaque table, afin d'identifier de manière fiable les tables même lorsqu'elles partagent le même keyword et la même structure.

#### Acceptance Criteria

1. WHEN Storage_System génère un fingerprint pour une Generated_Table, THE Storage_System SHALL calculer un hash basé sur le contenu textuel complet de toutes les cellules de la table
2. WHEN Storage_System calcule le fingerprint, THE Storage_System SHALL inclure dans le calcul les en-têtes de colonnes, toutes les lignes de données et la structure de la table (nombre de lignes et colonnes)
3. WHEN deux Generated_Tables ont le même Dynamic_Keyword mais des contenus différents, THE Storage_System SHALL générer des fingerprints différents pour chaque table
4. WHEN Storage_System sauvegarde une Generated_Table, THE Storage_System SHALL stocker le fingerprint dans les Table_Metadata pour permettre la détection de doublons
5. WHERE une Generated_Table avec le même fingerprint existe déjà dans le stockage pour la même session, THE Storage_System SHALL ignorer la sauvegarde pour éviter les doublons exacts
