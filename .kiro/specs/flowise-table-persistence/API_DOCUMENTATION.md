# Flowise Table Persistence - API Documentation

## Overview

The Flowise Table Persistence system provides a robust solution for persisting dynamically generated HTML tables from Flowise.js in IndexedDB. This document describes the public APIs available for developers to interact with the system.

## Table of Contents

1. [FlowiseTableService API](#flowiseTableservice-api)
2. [FlowiseTableBridge API](#flowiseTablebridge-api)
3. [FlowiseTableDiagnostics API](#flowiseTablediagnostics-api)
4. [Event System](#event-system)
5. [Code Examples](#code-examples)

---

## FlowiseTableService API

The `FlowiseTableService` is the core service for managing table persistence operations.

### Import

```typescript
import { flowiseTableService } from './services/flowiseTableService';
```

### Methods

#### `saveGeneratedTable()`

Save a generated table to IndexedDB.

```typescript
async saveGeneratedTable(
  sessionId: string,
  tableElement: HTMLTableElement,
  keyword: string,
  source: 'n8n' | 'cached' | 'error',
  messageId?: string
): Promise<string>
```

**Parameters:**
- `sessionId` - The Clara chat session ID
- `tableElement` - The HTML table element to save
- `keyword` - The Dynamic_Keyword from the Flowise table
- `source` - The source of the table ('n8n', 'cached', or 'error')
- `messageId` - (Optional) The message ID to link the table to

**Returns:** The unique table ID

**Example:**
```typescript
const tableId = await flowiseTableService.saveGeneratedTable(
  'session-123',
  tableElement,
  'SalesData',
  'n8n',
  'msg-456'
);
console.log(`Table saved: ${tableId}`);
```

---

#### `restoreSessionTables()`

Restore all tables for a specific session.

```typescript
async restoreSessionTables(sessionId: string): Promise<FlowiseGeneratedTableRecord[]>
```

**Parameters:**
- `sessionId` - The session ID to restore tables for

**Returns:** Array of table records

**Example:**
```typescript
const tables = await flowiseTableService.restoreSessionTables('session-123');
console.log(`Restored ${tables.length} tables`);
```

---

#### `generateTableFingerprint()`

Generate a unique fingerprint for a table based on its content.

```typescript
generateTableFingerprint(tableElement: HTMLTableElement): string
```

**Parameters:**
- `tableElement` - The HTML table element

**Returns:** A unique fingerprint string

**Example:**
```typescript
const fingerprint = flowiseTableService.generateTableFingerprint(tableElement);
console.log(`Fingerprint: ${fingerprint}`);
```

---

#### `tableExists()`

Check if a table with the same fingerprint already exists.

```typescript
async tableExists(sessionId: string, fingerprint: string): Promise<boolean>
```

**Parameters:**
- `sessionId` - The session ID
- `fingerprint` - The table fingerprint

**Returns:** `true` if the table exists, `false` otherwise

**Example:**
```typescript
const fingerprint = flowiseTableService.generateTableFingerprint(tableElement);
const exists = await flowiseTableService.tableExists('session-123', fingerprint);

if (exists) {
  console.log('Table already saved, skipping duplicate');
}
```

---

#### `deleteSessionTables()`

Delete all tables for a specific session (cascade delete).

```typescript
async deleteSessionTables(sessionId: string): Promise<number>
```

**Parameters:**
- `sessionId` - The session ID

**Returns:** Number of tables deleted

**Example:**
```typescript
const deletedCount = await flowiseTableService.deleteSessionTables('session-123');
console.log(`Deleted ${deletedCount} tables`);
```

---

#### `getTableById()`

Get a specific table by its ID.

```typescript
async getTableById(tableId: string): Promise<FlowiseGeneratedTableRecord | null>
```

**Parameters:**
- `tableId` - The table ID

**Returns:** The table record or `null` if not found

**Example:**
```typescript
const table = await flowiseTableService.getTableById('table-123');
if (table) {
  console.log(`Table keyword: ${table.keyword}`);
}
```

---

#### `getTablesByMessageId()`

Get all tables linked to a specific message.

```typescript
async getTablesByMessageId(messageId: string): Promise<FlowiseGeneratedTableRecord[]>
```

**Parameters:**
- `messageId` - The message ID

**Returns:** Array of table records

**Example:**
```typescript
const tables = await flowiseTableService.getTablesByMessageId('msg-456');
console.log(`Found ${tables.length} tables for message`);
```

---

#### `compressHTML()` / `decompressHTML()`

Compress or decompress HTML content.

```typescript
compressHTML(html: string): string
decompressHTML(compressed: string): string
```

**Example:**
```typescript
const html = tableElement.outerHTML;
const compressed = flowiseTableService.compressHTML(html);
console.log(`Compressed from ${html.length} to ${compressed.length} bytes`);

const decompressed = flowiseTableService.decompressHTML(compressed);
```

---

#### `findOrphanedTables()`

Find all orphaned tables (tables with sessionIds that don't exist).

```typescript
async findOrphanedTables(): Promise<FlowiseGeneratedTableRecord[]>
```

**Returns:** Array of orphaned table records

**Example:**
```typescript
const orphaned = await flowiseTableService.findOrphanedTables();
console.log(`Found ${orphaned.length} orphaned tables`);
```

---

#### `cleanupOrphanedTables()`

Clean up all orphaned tables.

```typescript
async cleanupOrphanedTables(): Promise<number>
```

**Returns:** Number of tables deleted

**Example:**
```typescript
const deletedCount = await flowiseTableService.cleanupOrphanedTables();
console.log(`Cleaned up ${deletedCount} orphaned tables`);
```

---

#### `checkStorageQuota()`

Check storage usage and quota information.

```typescript
async checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
  available: number;
}>
```

**Returns:** Storage quota information

**Example:**
```typescript
const quota = await flowiseTableService.checkStorageQuota();
console.log(`Storage: ${(quota.percentage * 100).toFixed(1)}% used`);
console.log(`Available: ${(quota.available / 1024 / 1024).toFixed(2)} MB`);
```

---

## FlowiseTableBridge API

The `FlowiseTableBridge` connects Flowise.js events with the persistence system.

### Import

```typescript
import { flowiseTableBridge } from './services/flowiseTableBridge';
```

### Methods

#### `setCurrentSession()`

Manually set the current session ID.

```typescript
setCurrentSession(sessionId: string): void
```

**Parameters:**
- `sessionId` - The session ID to set

**Example:**
```typescript
flowiseTableBridge.setCurrentSession('session-123');
```

---

#### `getCurrentSession()`

Get the current session ID.

```typescript
getCurrentSession(): string | null
```

**Returns:** The current session ID or `null`

**Example:**
```typescript
const sessionId = flowiseTableBridge.getCurrentSession();
console.log(`Current session: ${sessionId}`);
```

---

#### `getSessionDetectionLogs()`

Get session detection logs for diagnostics.

```typescript
getSessionDetectionLogs(): any[]
```

**Returns:** Array of session detection log entries

**Example:**
```typescript
const logs = flowiseTableBridge.getSessionDetectionLogs();
console.log(`Detection attempts: ${logs.length}`);
```

---

#### `getTemporarySessions()`

Get list of temporary sessions created.

```typescript
getTemporarySessions(): Array<{
  id: string;
  createdAt: string;
  reason: string;
}>
```

**Returns:** Array of temporary session info

**Example:**
```typescript
const tempSessions = flowiseTableBridge.getTemporarySessions();
console.log(`Temporary sessions: ${tempSessions.length}`);
```

---

#### `cleanupTemporarySessions()`

Clean up temporary sessions and their tables.

```typescript
async cleanupTemporarySessions(): Promise<number>
```

**Returns:** Number of tables deleted

**Example:**
```typescript
const deletedCount = await flowiseTableBridge.cleanupTemporarySessions();
console.log(`Cleaned up ${deletedCount} tables from temporary sessions`);
```

---

#### `getRetryLogs()`

Get retry logs for diagnostics.

```typescript
getRetryLogs(): any[]
```

**Returns:** Array of retry log entries

**Example:**
```typescript
const retryLogs = flowiseTableBridge.getRetryLogs();
console.log(`Failed save attempts: ${retryLogs.length}`);
```

---

## FlowiseTableDiagnostics API

The `FlowiseTableDiagnostics` provides monitoring and diagnostic tools.

### Import

```typescript
import { flowiseTableDiagnostics } from './services/flowiseTableDiagnostics';
```

### Methods

#### `getStorageStats()`

Get comprehensive storage statistics.

```typescript
async getStorageStats(): Promise<StorageStats>
```

**Returns:** Storage statistics object

**Example:**
```typescript
const stats = await flowiseTableDiagnostics.getStorageStats();
console.log(`Total tables: ${stats.totalTables}`);
console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Compressed: ${stats.compressedTables}`);
```

---

#### `getStorageStatsFormatted()`

Get storage statistics in a human-readable format.

```typescript
async getStorageStatsFormatted(): Promise<string>
```

**Returns:** Formatted statistics string

**Example:**
```typescript
const formatted = await flowiseTableDiagnostics.getStorageStatsFormatted();
console.log(formatted);
```

---

#### `checkIntegrity()`

Check data integrity and find issues.

```typescript
async checkIntegrity(): Promise<IntegrityCheckResult>
```

**Returns:** Integrity check results

**Example:**
```typescript
const integrity = await flowiseTableDiagnostics.checkIntegrity();
console.log(`Orphaned tables: ${integrity.orphanedTables}`);
console.log(`Corrupted tables: ${integrity.corruptedTables}`);
console.log(`Duplicates: ${integrity.duplicates}`);
```

---

#### `checkIntegrityFormatted()`

Get integrity check results in a human-readable format.

```typescript
async checkIntegrityFormatted(): Promise<string>
```

**Returns:** Formatted integrity report

**Example:**
```typescript
const report = await flowiseTableDiagnostics.checkIntegrityFormatted();
console.log(report);
```

---

#### `listSessionTables()`

List all tables for a given session.

```typescript
async listSessionTables(sessionId: string): Promise<SessionTableInfo[]>
```

**Parameters:**
- `sessionId` - The session ID

**Returns:** Array of table info objects

**Example:**
```typescript
const tables = await flowiseTableDiagnostics.listSessionTables('session-123');
tables.forEach(table => {
  console.log(`${table.keyword}: ${(table.size / 1024).toFixed(2)} KB`);
});
```

---

#### `listSessionTablesFormatted()`

List session tables in a human-readable format.

```typescript
async listSessionTablesFormatted(sessionId: string): Promise<string>
```

**Parameters:**
- `sessionId` - The session ID

**Returns:** Formatted table list

**Example:**
```typescript
const formatted = await flowiseTableDiagnostics.listSessionTablesFormatted('session-123');
console.log(formatted);
```

---

#### `getFullDiagnosticReport()`

Get a comprehensive diagnostic report.

```typescript
async getFullDiagnosticReport(): Promise<string>
```

**Returns:** Full diagnostic report

**Example:**
```typescript
const report = await flowiseTableDiagnostics.getFullDiagnosticReport();
console.log(report);
```

---

#### `logDiagnosticReport()`

Log diagnostic report to console.

```typescript
async logDiagnosticReport(): Promise<void>
```

**Example:**
```typescript
await flowiseTableDiagnostics.logDiagnosticReport();
```

---

## Event System

The system uses custom events for communication between components.

### Events Emitted

#### `flowise:table:integrated`

Emitted by Flowise.js when a table is integrated into the DOM.

**Event Detail:**
```typescript
{
  table: HTMLTableElement;
  keyword: string;
  container?: HTMLElement;
  position?: number;
  source: 'n8n' | 'cached' | 'error';
  error?: string;
  timestamp: number;
  messageId?: string;
}
```

**Example:**
```typescript
document.addEventListener('flowise:table:integrated', (event) => {
  const detail = event.detail;
  console.log(`Table integrated: ${detail.keyword}`);
});
```

---

#### `storage:table:saved`

Emitted when a table is successfully saved.

**Event Detail:**
```typescript
{
  tableId: string;
  sessionId: string;
  keyword: string;
  fingerprint: string;
}
```

**Example:**
```typescript
document.addEventListener('storage:table:saved', (event) => {
  const detail = event.detail;
  console.log(`Table saved: ${detail.tableId}`);
});
```

---

#### `storage:table:error`

Emitted when a table save operation fails.

**Event Detail:**
```typescript
{
  error: string;
  sessionId: string | null;
  keyword?: string;
  source?: string;
}
```

**Example:**
```typescript
document.addEventListener('storage:table:error', (event) => {
  const detail = event.detail;
  console.error(`Save error: ${detail.error}`);
});
```

---

#### `storage:table:error:max-retries`

Emitted when max retry attempts are exceeded.

**Event Detail:**
```typescript
{
  error: string;
  lastError: string;
  sessionId: string | null;
  keyword: string;
  source: string;
  timestamp: number;
  maxAttempts: number;
}
```

**Example:**
```typescript
document.addEventListener('storage:table:error:max-retries', (event) => {
  const detail = event.detail;
  console.error(`Max retries exceeded for: ${detail.keyword}`);
});
```

---

#### `claraverse:session:changed`

Emitted when the Clara chat session changes.

**Event Detail:**
```typescript
{
  sessionId: string;
}
```

**Example:**
```typescript
document.addEventListener('claraverse:session:changed', (event) => {
  const detail = event.detail;
  console.log(`Session changed to: ${detail.sessionId}`);
});
```

---

## Code Examples

### Example 1: Save a Table Manually

```typescript
import { flowiseTableService } from './services/flowiseTableService';

async function saveTable(tableElement: HTMLTableElement) {
  try {
    const sessionId = 'session-123';
    const keyword = 'SalesData';
    const source = 'n8n';
    
    const tableId = await flowiseTableService.saveGeneratedTable(
      sessionId,
      tableElement,
      keyword,
      source
    );
    
    console.log(`✅ Table saved: ${tableId}`);
  } catch (error) {
    console.error('❌ Error saving table:', error);
  }
}
```

---

### Example 2: Restore Tables for a Session

```typescript
import { flowiseTableService } from './services/flowiseTableService';

async function restoreTables(sessionId: string) {
  try {
    const tables = await flowiseTableService.restoreSessionTables(sessionId);
    
    console.log(`Found ${tables.length} tables`);
    
    tables.forEach(table => {
      console.log(`- ${table.keyword} (${table.source})`);
    });
  } catch (error) {
    console.error('❌ Error restoring tables:', error);
  }
}
```

---

### Example 3: Check for Duplicates Before Saving

```typescript
import { flowiseTableService } from './services/flowiseTableService';

async function saveTableWithDuplicateCheck(
  sessionId: string,
  tableElement: HTMLTableElement,
  keyword: string
) {
  try {
    // Generate fingerprint
    const fingerprint = flowiseTableService.generateTableFingerprint(tableElement);
    
    // Check if table already exists
    const exists = await flowiseTableService.tableExists(sessionId, fingerprint);
    
    if (exists) {
      console.log('ℹ️ Table already saved, skipping duplicate');
      return null;
    }
    
    // Save the table
    const tableId = await flowiseTableService.saveGeneratedTable(
      sessionId,
      tableElement,
      keyword,
      'n8n'
    );
    
    console.log(`✅ Table saved: ${tableId}`);
    return tableId;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}
```

---

### Example 4: Monitor Storage Usage

```typescript
import { flowiseTableService } from './services/flowiseTableService';

async function monitorStorage() {
  try {
    const quota = await flowiseTableService.checkStorageQuota();
    
    const usedMB = (quota.usage / 1024 / 1024).toFixed(2);
    const totalMB = (quota.quota / 1024 / 1024).toFixed(2);
    const percentage = (quota.percentage * 100).toFixed(1);
    
    console.log(`Storage: ${usedMB} MB / ${totalMB} MB (${percentage}%)`);
    
    if (quota.percentage >= 0.8) {
      console.warn('⚠️ Storage quota approaching limit!');
    }
  } catch (error) {
    console.error('❌ Error checking storage:', error);
  }
}
```

---

### Example 5: Get Diagnostic Report

```typescript
import { flowiseTableDiagnostics } from './services/flowiseTableDiagnostics';

async function getDiagnostics() {
  try {
    // Get full diagnostic report
    const report = await flowiseTableDiagnostics.getFullDiagnosticReport();
    console.log(report);
    
    // Or log directly to console
    await flowiseTableDiagnostics.logDiagnosticReport();
  } catch (error) {
    console.error('❌ Error getting diagnostics:', error);
  }
}
```

---

### Example 6: Clean Up Orphaned Tables

```typescript
import { flowiseTableService } from './services/flowiseTableService';

async function cleanupOrphaned() {
  try {
    // Find orphaned tables
    const orphaned = await flowiseTableService.findOrphanedTables();
    console.log(`Found ${orphaned.length} orphaned tables`);
    
    // Clean them up
    const deletedCount = await flowiseTableService.cleanupOrphanedTables();
    console.log(`✅ Cleaned up ${deletedCount} orphaned tables`);
  } catch (error) {
    console.error('❌ Error cleaning up:', error);
  }
}
```

---

### Example 7: Listen for Table Events

```typescript
// Listen for successful saves
document.addEventListener('storage:table:saved', (event) => {
  const detail = event.detail;
  console.log(`✅ Table saved: ${detail.keyword}`);
  
  // Update UI or trigger other actions
  updateTableList(detail.sessionId);
});

// Listen for save errors
document.addEventListener('storage:table:error', (event) => {
  const detail = event.detail;
  console.error(`❌ Save error: ${detail.error}`);
  
  // Show error notification to user
  showErrorNotification(detail.error);
});

// Listen for max retry errors
document.addEventListener('storage:table:error:max-retries', (event) => {
  const detail = event.detail;
  console.error(`❌ Max retries exceeded for: ${detail.keyword}`);
  
  // Show critical error notification
  showCriticalError(`Failed to save table after ${detail.maxAttempts} attempts`);
});
```

---

### Example 8: Get Tables for a Message

```typescript
import { flowiseTableService } from './services/flowiseTableService';

async function getMessageTables(messageId: string) {
  try {
    const tables = await flowiseTableService.getTablesByMessageId(messageId);
    
    console.log(`Found ${tables.length} tables for message ${messageId}`);
    
    tables.forEach(table => {
      console.log(`- ${table.keyword}: ${(table.html.length / 1024).toFixed(2)} KB`);
    });
    
    return tables;
  } catch (error) {
    console.error('❌ Error getting message tables:', error);
    return [];
  }
}
```

---

## Type Definitions

### FlowiseGeneratedTableRecord

```typescript
interface FlowiseGeneratedTableRecord {
  id: string;
  sessionId: string;
  messageId?: string;
  keyword: string;
  html: string;
  fingerprint: string;
  containerId: string;
  position: number;
  timestamp: string;
  source: 'n8n' | 'cached' | 'error';
  metadata: FlowiseTableMetadata;
  user_id?: string;
  tableType: 'generated' | 'trigger';
  processed: boolean;
}
```

### FlowiseTableMetadata

```typescript
interface FlowiseTableMetadata {
  rowCount: number;
  colCount: number;
  headers: string[];
  compressed: boolean;
  originalSize?: number;
}
```

### StorageStats

```typescript
interface StorageStats {
  totalTables: number;
  tablesBySession: Map<string, number>;
  totalSize: number;
  averageSize: number;
  compressedTables: number;
  cachedTables: number;
  errorTables: number;
  largestTable: {
    id: string;
    size: number;
    keyword: string;
  } | null;
  oldestTable: {
    id: string;
    timestamp: string;
    keyword: string;
  } | null;
}
```

### IntegrityCheckResult

```typescript
interface IntegrityCheckResult {
  orphanedTables: number;
  corruptedTables: number;
  duplicates: number;
  orphanedTableIds: string[];
  corruptedTableIds: string[];
  duplicateGroups: Array<{
    fingerprint: string;
    sessionId: string;
    tableIds: string[];
  }>;
}
```

---

## Best Practices

### 1. Always Check for Duplicates

Before saving a table, check if it already exists to avoid duplicates:

```typescript
const fingerprint = flowiseTableService.generateTableFingerprint(tableElement);
const exists = await flowiseTableService.tableExists(sessionId, fingerprint);

if (!exists) {
  await flowiseTableService.saveGeneratedTable(sessionId, tableElement, keyword, source);
}
```

### 2. Monitor Storage Usage

Regularly check storage usage to prevent quota issues:

```typescript
const quota = await flowiseTableService.checkStorageQuota();
if (quota.percentage >= 0.8) {
  // Trigger cleanup or warn user
}
```

### 3. Handle Errors Gracefully

Always wrap API calls in try-catch blocks:

```typescript
try {
  await flowiseTableService.saveGeneratedTable(...);
} catch (error) {
  console.error('Save failed:', error);
  // Show user-friendly error message
}
```

### 4. Use Event Listeners

Listen for events to react to system changes:

```typescript
document.addEventListener('storage:table:saved', handleTableSaved);
document.addEventListener('storage:table:error', handleTableError);
```

### 5. Clean Up Regularly

Periodically clean up orphaned tables and temporary sessions:

```typescript
// Run cleanup on app startup or periodically
await flowiseTableService.cleanupOrphanedTables();
await flowiseTableBridge.cleanupTemporarySessions();
```

---

## Troubleshooting

### Issue: Tables Not Saving

**Possible Causes:**
- No active session detected
- Storage quota exceeded
- Invalid table element

**Solutions:**
```typescript
// Check session
const sessionId = flowiseTableBridge.getCurrentSession();
if (!sessionId) {
  flowiseTableBridge.setCurrentSession('your-session-id');
}

// Check storage quota
const quota = await flowiseTableService.checkStorageQuota();
if (quota.percentage >= 0.9) {
  await flowiseTableService.cleanupOrphanedTables();
}
```

### Issue: Duplicate Tables

**Possible Causes:**
- Not checking for duplicates before saving
- Fingerprint collision (rare)

**Solutions:**
```typescript
// Always check before saving
const fingerprint = flowiseTableService.generateTableFingerprint(tableElement);
const exists = await flowiseTableService.tableExists(sessionId, fingerprint);

if (!exists) {
  await flowiseTableService.saveGeneratedTable(...);
}
```

### Issue: Tables Not Restoring

**Possible Causes:**
- Wrong session ID
- Tables marked as processed Trigger_Tables
- Corrupted data

**Solutions:**
```typescript
// Check integrity
const integrity = await flowiseTableDiagnostics.checkIntegrity();
console.log(integrity);

// List tables for session
const tables = await flowiseTableDiagnostics.listSessionTables(sessionId);
console.log(tables);
```

---

## Support

For issues or questions:
1. Check the diagnostic report: `flowiseTableDiagnostics.logDiagnosticReport()`
2. Review session detection logs: `flowiseTableBridge.getSessionDetectionLogs()`
3. Check retry logs: `flowiseTableBridge.getRetryLogs()`
4. Review storage error logs: `flowiseTableService.getStorageErrorLogs()`

---

**Last Updated:** November 2025  
**Version:** 1.0.0
