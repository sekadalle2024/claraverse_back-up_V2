# Flowise Table Persistence - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Flowise Table Persistence system to production. It covers database migration, configuration, testing, monitoring, and rollback procedures.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migration](#database-migration)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Monitoring Setup](#monitoring-setup)
6. [Performance Tuning](#performance-tuning)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, ensure the following:

### Code Review
- [ ] All code has been reviewed and approved
- [ ] All tests pass (unit, integration, e2e)
- [ ] No console errors or warnings in development
- [ ] Code follows project coding standards

### Dependencies
- [ ] `lz-string` package installed for compression
- [ ] All TypeScript types are properly defined
- [ ] No missing imports or circular dependencies

### Configuration
- [ ] IndexedDB schema version updated if needed
- [ ] Storage limits configured appropriately
- [ ] Compression threshold set correctly (default: 50KB)
- [ ] Quota threshold set correctly (default: 80%)

### Testing
- [ ] Unit tests pass (100% coverage for core functions)
- [ ] Integration tests pass
- [ ] End-to-end tests pass
- [ ] Performance tests pass (100+ tables)
- [ ] Stress tests pass (500+ tables)

### Documentation
- [ ] API documentation complete
- [ ] Deployment guide reviewed
- [ ] User guide available (if needed)
- [ ] Code comments are clear and accurate

---

## Database Migration

### Step 1: Backup Existing Data

Before making any changes, backup the existing IndexedDB data:

```typescript
// Run this in browser console on production
async function backupIndexedDB() {
  const backup = {
    sessions: await indexedDBService.getAll('clara_sessions'),
    messages: await indexedDBService.getAll('clara_messages'),
    files: await indexedDBService.getAll('clara_files'),
    timestamp: new Date().toISOString()
  };
  
  // Download backup as JSON
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `claraverse-backup-${Date.now()}.json`;
  a.click();
  
  console.log('✅ Backup complete');
}

backupIndexedDB();
```

### Step 2: Update IndexedDB Schema

The new schema adds the `clara_generated_tables` store. This is handled automatically by the migration logic in `indexedDB.ts`.

**Schema Changes:**
```typescript
// New store: clara_generated_tables
{
  keyPath: 'id',
  indexes: [
    { name: 'sessionId', keyPath: 'sessionId', unique: false },
    { name: 'messageId', keyPath: 'messageId', unique: false },
    { name: 'keyword', keyPath: 'keyword', unique: false },
    { name: 'fingerprint', keyPath: 'fingerprint', unique: false },
    { name: 'user_id', keyPath: 'user_id', unique: false },
    { name: 'timestamp', keyPath: 'timestamp', unique: false },
    { name: 'sessionId_fingerprint', keyPath: ['sessionId', 'fingerprint'], unique: true }
  ]
}
```

### Step 3: Verify Migration

After deployment, verify the migration was successful:

```typescript
// Run in browser console
async function verifyMigration() {
  try {
    // Check if new store exists
    const db = await indexedDBService.openDatabase();
    const storeNames = Array.from(db.objectStoreNames);
    
    if (storeNames.includes('clara_generated_tables')) {
      console.log('✅ Store created successfully');
      
      // Check indexes
      const tx = db.transaction('clara_generated_tables', 'readonly');
      const store = tx.objectStore('clara_generated_tables');
      const indexNames = Array.from(store.indexNames);
      
      console.log('Indexes:', indexNames);
      
      if (indexNames.includes('sessionId_fingerprint')) {
        console.log('✅ Composite index created successfully');
      }
    } else {
      console.error('❌ Store not found');
    }
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
  }
}

verifyMigration();
```

---

## Deployment Steps

### Phase 1: Infrastructure Deployment (Week 1)

Deploy the core infrastructure without activating the full system.

#### Step 1.1: Deploy Service Files

Deploy the following files to production:

```bash
# Core services
src/services/flowiseTableService.ts
src/services/flowiseTableBridge.ts
src/services/flowiseTableDiagnostics.ts
src/services/flowiseTableCache.ts
src/services/flowiseTableLazyLoader.ts
src/services/flowiseTimelineService.ts

# Type definitions
src/types/flowise_table_types.ts

# Updated IndexedDB service
src/services/indexedDB.ts
src/services/claraDatabase.ts
```

#### Step 1.2: Deploy in Passive Mode

Initially deploy with the bridge in passive mode (listening but not saving):

```typescript
// In flowiseTableBridge.ts - temporarily disable saving
private async handleTableIntegrated(detail: FlowiseTableIntegratedDetail): Promise<void> {
  // DEPLOYMENT PHASE 1: Passive mode - log only
  console.log('📊 [PASSIVE] Table integrated:', detail.keyword);
  return; // Don't save yet
  
  // ... rest of the code
}
```

#### Step 1.3: Monitor for Issues

Monitor console logs for any errors or warnings:
- Check browser console for errors
- Verify IndexedDB schema migration
- Confirm no performance degradation

**Success Criteria:**
- No console errors
- IndexedDB schema updated successfully
- No impact on existing functionality

---

### Phase 2: Event Integration (Week 2)

Activate event listening and table saving.

#### Step 2.1: Update Flowise.js

Modify `Flowise.js` to emit events:

```javascript
// In Flowise.js - integrateTablesOnly function
function integrateTablesOnly(n8nTables, targetContainer, targetKeyword) {
  // ... existing code ...
  
  // DEPLOYMENT PHASE 2: Emit events
  n8nTables.forEach((table, index) => {
    const event = new CustomEvent('flowise:table:integrated', {
      detail: {
        table: table,
        keyword: targetKeyword,
        container: targetContainer,
        position: index,
        source: 'n8n',
        timestamp: Date.now()
      },
      bubbles: true
    });
    document.dispatchEvent(event);
  });
}
```

#### Step 2.2: Enable Saving

Remove the passive mode guard in `flowiseTableBridge.ts`:

```typescript
private async handleTableIntegrated(detail: FlowiseTableIntegratedDetail): Promise<void> {
  // DEPLOYMENT PHASE 2: Enable saving
  // Remove the early return
  
  if (!this.currentSessionId) {
    console.warn('⚠️ No active session, attempting to detect session...');
    this.detectCurrentSession();
    // ... rest of the code
  }
  // ... continue with saving logic
}
```

#### Step 2.3: Monitor Saving Operations

Monitor table saving operations:

```typescript
// Add temporary logging
document.addEventListener('storage:table:saved', (event) => {
  console.log('✅ [DEPLOYMENT] Table saved:', event.detail);
});

document.addEventListener('storage:table:error', (event) => {
  console.error('❌ [DEPLOYMENT] Save error:', event.detail);
});
```

**Success Criteria:**
- Tables are being saved successfully
- No duplicate tables created
- Storage quota not exceeded
- No performance issues

---

### Phase 3: Restoration Activation (Week 3)

Activate automatic table restoration on page load.

#### Step 3.1: Enable Restoration

The restoration is already enabled by default in `flowiseTableBridge.ts`. Verify it's working:

```typescript
// In browser console
async function testRestoration() {
  const sessionId = flowiseTableBridge.getCurrentSession();
  console.log('Current session:', sessionId);
  
  const tables = await flowiseTableService.restoreSessionTables(sessionId);
  console.log(`Found ${tables.length} tables to restore`);
}

testRestoration();
```

#### Step 3.2: Monitor Restoration

Monitor restoration operations:

```typescript
// Check restored tables in DOM
const restoredTables = document.querySelectorAll('[data-restored="true"]');
console.log(`Restored ${restoredTables.length} tables in DOM`);
```

**Success Criteria:**
- Tables restore correctly on page load
- Tables appear in correct order
- No duplicate tables in DOM
- Performance is acceptable

---

### Phase 4: Full Production (Week 4)

Enable all features and remove deployment logging.

#### Step 4.1: Remove Deployment Logging

Remove temporary deployment logs:

```typescript
// Remove or comment out deployment-specific logs
// document.addEventListener('storage:table:saved', ...);
```

#### Step 4.2: Enable All Optimizations

Ensure all optimizations are enabled:

```typescript
// In flowiseTableService.ts
private readonly COMPRESSION_THRESHOLD = 50 * 1024; // 50KB
private readonly QUOTA_THRESHOLD = 0.8; // 80%
private readonly MAX_TABLES_PER_USER = 500;
private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50 MB

// In flowiseTableBridge.ts
private lazyLoadingEnabled: boolean = true;

// In flowiseTableCache.ts
private maxSize = 50; // LRU cache size
```

#### Step 4.3: Final Verification

Run comprehensive verification:

```typescript
// Run diagnostic report
await flowiseTableDiagnostics.logDiagnosticReport();

// Check integrity
const integrity = await flowiseTableDiagnostics.checkIntegrity();
console.log('Integrity check:', integrity);

// Check storage quota
const quota = await flowiseTableService.checkStorageQuota();
console.log('Storage quota:', quota);
```

**Success Criteria:**
- All features working correctly
- No integrity issues
- Storage usage within limits
- Performance meets requirements

---

## Post-Deployment Verification

### Verification Checklist

Run these checks after deployment:

#### 1. Basic Functionality

```typescript
// Test table saving
const testTable = document.querySelector('table');
if (testTable) {
  const sessionId = flowiseTableBridge.getCurrentSession();
  const tableId = await flowiseTableService.saveGeneratedTable(
    sessionId,
    testTable,
    'TestKeyword',
    'n8n'
  );
  console.log('✅ Save test passed:', tableId);
}
```

#### 2. Restoration

```typescript
// Refresh page and check restoration
// After page refresh:
const restoredTables = document.querySelectorAll('[data-restored="true"]');
console.log(`✅ Restoration test: ${restoredTables.length} tables restored`);
```

#### 3. Duplicate Detection

```typescript
// Try to save the same table twice
const fingerprint = flowiseTableService.generateTableFingerprint(testTable);
const exists = await flowiseTableService.tableExists(sessionId, fingerprint);
console.log('✅ Duplicate detection:', exists ? 'Working' : 'Failed');
```

#### 4. Storage Optimization

```typescript
// Check storage stats
const stats = await flowiseTableDiagnostics.getStorageStats();
console.log('✅ Storage stats:', {
  totalTables: stats.totalTables,
  totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2),
  compressedTables: stats.compressedTables
});
```

#### 5. Session Lifecycle

```typescript
// Test session deletion
const testSessionId = 'test-session-123';
// Create some test tables...
const deletedCount = await flowiseTableService.deleteSessionTables(testSessionId);
console.log('✅ Session deletion:', deletedCount, 'tables deleted');
```

---

## Monitoring Setup

### Key Metrics to Monitor

#### 1. Storage Usage

```typescript
// Monitor storage usage daily
async function monitorStorage() {
  const quota = await flowiseTableService.checkStorageQuota();
  
  if (quota.percentage >= 0.8) {
    console.warn('⚠️ Storage quota at 80%');
    // Send alert
  }
  
  if (quota.percentage >= 0.9) {
    console.error('❌ Storage quota at 90%');
    // Send critical alert
  }
}

// Run every hour
setInterval(monitorStorage, 60 * 60 * 1000);
```

#### 2. Error Rate

```typescript
// Monitor save errors
let saveErrors = 0;
let saveSuccesses = 0;

document.addEventListener('storage:table:saved', () => {
  saveSuccesses++;
});

document.addEventListener('storage:table:error', () => {
  saveErrors++;
});

// Check error rate every 5 minutes
setInterval(() => {
  const total = saveErrors + saveSuccesses;
  const errorRate = total > 0 ? (saveErrors / total) * 100 : 0;
  
  if (errorRate > 5) {
    console.warn(`⚠️ High error rate: ${errorRate.toFixed(1)}%`);
  }
  
  // Reset counters
  saveErrors = 0;
  saveSuccesses = 0;
}, 5 * 60 * 1000);
```

#### 3. Performance Metrics

```typescript
// Monitor restoration performance
async function monitorRestorationPerformance() {
  const startTime = performance.now();
  
  const sessionId = flowiseTableBridge.getCurrentSession();
  const tables = await flowiseTableService.restoreSessionTables(sessionId);
  
  const duration = performance.now() - startTime;
  
  console.log(`Restoration: ${tables.length} tables in ${duration.toFixed(2)}ms`);
  
  if (duration > 2000) {
    console.warn('⚠️ Slow restoration detected');
  }
}
```

#### 4. Data Integrity

```typescript
// Check integrity daily
async function dailyIntegrityCheck() {
  const integrity = await flowiseTableDiagnostics.checkIntegrity();
  
  if (integrity.orphanedTables > 0) {
    console.warn(`⚠️ ${integrity.orphanedTables} orphaned tables found`);
  }
  
  if (integrity.corruptedTables > 0) {
    console.error(`❌ ${integrity.corruptedTables} corrupted tables found`);
  }
  
  if (integrity.duplicates > 0) {
    console.warn(`⚠️ ${integrity.duplicates} duplicate tables found`);
  }
}

// Run daily at midnight
const now = new Date();
const midnight = new Date(now);
midnight.setHours(24, 0, 0, 0);
const msUntilMidnight = midnight.getTime() - now.getTime();

setTimeout(() => {
  dailyIntegrityCheck();
  setInterval(dailyIntegrityCheck, 24 * 60 * 60 * 1000);
}, msUntilMidnight);
```

### Logging Strategy

#### Production Logging Levels

```typescript
// Configure logging based on environment
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'ERROR' : 'DEBUG';

// Only log errors in production
if (LOG_LEVEL === 'ERROR') {
  console.log = () => {}; // Disable info logs
  console.debug = () => {}; // Disable debug logs
  // Keep console.warn and console.error
}
```

#### Error Tracking

```typescript
// Send errors to monitoring service
document.addEventListener('storage:table:error', (event) => {
  const detail = event.detail;
  
  // Send to error tracking service (e.g., Sentry)
  if (window.Sentry) {
    Sentry.captureException(new Error(detail.error), {
      tags: {
        component: 'flowise-table-persistence',
        sessionId: detail.sessionId,
        keyword: detail.keyword
      }
    });
  }
});
```

---

## Performance Tuning

### Optimization Guidelines

#### 1. Compression Threshold

Adjust based on your data:

```typescript
// Default: 50KB
private readonly COMPRESSION_THRESHOLD = 50 * 1024;

// For smaller tables, increase threshold:
private readonly COMPRESSION_THRESHOLD = 100 * 1024; // 100KB

// For larger tables, decrease threshold:
private readonly COMPRESSION_THRESHOLD = 25 * 1024; // 25KB
```

#### 2. Cache Size

Adjust LRU cache size based on memory:

```typescript
// Default: 50 entries
private maxSize = 50;

// For more memory, increase:
private maxSize = 100;

// For less memory, decrease:
private maxSize = 25;
```

#### 3. Lazy Loading

Configure lazy loading behavior:

```typescript
// Enable/disable lazy loading
private lazyLoadingEnabled: boolean = true;

// Adjust intersection observer options
const observerOptions = {
  root: null,
  rootMargin: '50px', // Load 50px before visible
  threshold: 0.1
};
```

#### 4. Batch Operations

Use batch operations for multiple tables:

```typescript
// Instead of saving one by one:
for (const table of tables) {
  await flowiseTableService.saveGeneratedTable(...);
}

// Use batch save (if implemented):
await flowiseTableService.saveBatch(tables);
```

#### 5. Storage Limits

Adjust storage limits based on usage:

```typescript
// Default limits
private readonly MAX_TABLES_PER_USER = 500;
private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50 MB

// For power users:
private readonly MAX_TABLES_PER_USER = 1000;
private readonly MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100 MB

// For limited storage:
private readonly MAX_TABLES_PER_USER = 250;
private readonly MAX_STORAGE_SIZE = 25 * 1024 * 1024; // 25 MB
```

---

## Rollback Procedures

### When to Rollback

Rollback if you encounter:
- Critical errors affecting core functionality
- Data corruption or loss
- Performance degradation > 50%
- Storage quota issues affecting users
- High error rate (> 10%)

### Rollback Steps

#### Step 1: Disable New Features

```typescript
// In flowiseTableBridge.ts - disable saving
private async handleTableIntegrated(detail: FlowiseTableIntegratedDetail): Promise<void> {
  // ROLLBACK: Disable saving
  console.log('⚠️ [ROLLBACK] Table saving disabled');
  return;
}
```

#### Step 2: Disable Restoration

```typescript
// In flowiseTableBridge.ts - disable restoration
private async initializeRestoration(): Promise<void> {
  // ROLLBACK: Disable restoration
  console.log('⚠️ [ROLLBACK] Table restoration disabled');
  return;
}
```

#### Step 3: Disable Event Emission

```javascript
// In Flowise.js - comment out event emission
function integrateTablesOnly(n8nTables, targetContainer, targetKeyword) {
  // ... existing code ...
  
  // ROLLBACK: Disable events
  // n8nTables.forEach((table, index) => {
  //   const event = new CustomEvent('flowise:table:integrated', ...);
  //   document.dispatchEvent(event);
  // });
}
```

#### Step 4: Verify Rollback

```typescript
// Verify features are disabled
console.log('Checking rollback status...');

// Check if events are being emitted
let eventCount = 0;
document.addEventListener('flowise:table:integrated', () => {
  eventCount++;
});

setTimeout(() => {
  if (eventCount === 0) {
    console.log('✅ Events disabled');
  } else {
    console.error('❌ Events still being emitted');
  }
}, 5000);
```

#### Step 5: Restore from Backup (if needed)

```typescript
// Restore IndexedDB from backup
async function restoreFromBackup(backupData) {
  try {
    // Clear existing data
    await indexedDBService.clearGeneratedTables();
    
    // Restore sessions
    for (const session of backupData.sessions) {
      await indexedDBService.put('clara_sessions', session);
    }
    
    // Restore messages
    for (const message of backupData.messages) {
      await indexedDBService.put('clara_messages', message);
    }
    
    // Restore files
    for (const file of backupData.files) {
      await indexedDBService.put('clara_files', file);
    }
    
    console.log('✅ Backup restored successfully');
  } catch (error) {
    console.error('❌ Restore failed:', error);
  }
}
```

### Post-Rollback Actions

1. **Investigate Root Cause**
   - Review error logs
   - Check diagnostic reports
   - Analyze performance metrics

2. **Fix Issues**
   - Address identified problems
   - Update code as needed
   - Add additional tests

3. **Re-deploy**
   - Follow deployment steps again
   - Monitor more closely
   - Have rollback plan ready

---

## Troubleshooting

### Common Issues

#### Issue 1: Tables Not Saving

**Symptoms:**
- No `storage:table:saved` events
- Tables disappear after refresh
- Console shows "No active session"

**Diagnosis:**
```typescript
// Check session detection
const sessionId = flowiseTableBridge.getCurrentSession();
console.log('Session ID:', sessionId);

// Check session detection logs
const logs = flowiseTableBridge.getSessionDetectionLogs();
console.log('Detection logs:', logs);
```

**Solutions:**
1. Verify session detection is working
2. Manually set session if needed: `flowiseTableBridge.setCurrentSession('session-id')`
3. Check if Flowise.js is emitting events
4. Verify IndexedDB is accessible

---

#### Issue 2: Storage Quota Exceeded

**Symptoms:**
- `QuotaExceededError` in console
- Tables fail to save
- High storage usage

**Diagnosis:**
```typescript
// Check storage quota
const quota = await flowiseTableService.checkStorageQuota();
console.log('Storage:', quota);

// Check table count
const stats = await flowiseTableDiagnostics.getStorageStats();
console.log('Total tables:', stats.totalTables);
```

**Solutions:**
1. Run cleanup: `await flowiseTableService.cleanupOrphanedTables()`
2. Increase compression threshold
3. Reduce max tables per user
4. Clear old sessions

---

#### Issue 3: Duplicate Tables

**Symptoms:**
- Same table appears multiple times
- Duplicate fingerprints in integrity check

**Diagnosis:**
```typescript
// Check for duplicates
const integrity = await flowiseTableDiagnostics.checkIntegrity();
console.log('Duplicates:', integrity.duplicates);
console.log('Duplicate groups:', integrity.duplicateGroups);
```

**Solutions:**
1. Ensure duplicate checking is enabled
2. Verify fingerprint generation is consistent
3. Remove duplicates manually if needed

---

#### Issue 4: Slow Performance

**Symptoms:**
- Page load takes > 2 seconds
- Restoration is slow
- UI freezes during operations

**Diagnosis:**
```typescript
// Measure restoration time
const startTime = performance.now();
await flowiseTableService.restoreSessionTables(sessionId);
const duration = performance.now() - startTime;
console.log('Restoration time:', duration, 'ms');

// Check table count
const stats = await flowiseTableDiagnostics.getStorageStats();
console.log('Total tables:', stats.totalTables);
```

**Solutions:**
1. Enable lazy loading
2. Increase cache size
3. Use batch operations
4. Reduce number of tables per session

---

#### Issue 5: Orphaned Tables

**Symptoms:**
- Tables with no matching session
- Integrity check shows orphaned tables

**Diagnosis:**
```typescript
// Find orphaned tables
const orphaned = await flowiseTableService.findOrphanedTables();
console.log('Orphaned tables:', orphaned.length);
```

**Solutions:**
1. Run cleanup: `await flowiseTableService.cleanupOrphanedTables()`
2. Verify session lifecycle management
3. Check cascade delete is working

---

## Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check error logs
- [ ] Monitor storage usage
- [ ] Review performance metrics

#### Weekly
- [ ] Run integrity check
- [ ] Clean up orphaned tables
- [ ] Review diagnostic report

#### Monthly
- [ ] Analyze storage trends
- [ ] Optimize compression settings
- [ ] Review and update documentation

### Maintenance Scripts

```typescript
// Daily maintenance
async function dailyMaintenance() {
  console.log('🔧 Running daily maintenance...');
  
  // Check integrity
  const integrity = await flowiseTableDiagnostics.checkIntegrity();
  console.log('Integrity:', integrity);
  
  // Check storage
  const quota = await flowiseTableService.checkStorageQuota();
  console.log('Storage:', quota);
  
  // Clean up if needed
  if (quota.percentage >= 0.8) {
    await flowiseTableService.cleanupOrphanedTables();
  }
  
  console.log('✅ Daily maintenance complete');
}

// Weekly maintenance
async function weeklyMaintenance() {
  console.log('🔧 Running weekly maintenance...');
  
  // Full diagnostic report
  await flowiseTableDiagnostics.logDiagnosticReport();
  
  // Clean up orphaned tables
  const deletedCount = await flowiseTableService.cleanupOrphanedTables();
  console.log(`Cleaned up ${deletedCount} orphaned tables`);
  
  // Clean up temporary sessions
  const tempDeleted = await flowiseTableBridge.cleanupTemporarySessions();
  console.log(`Cleaned up ${tempDeleted} tables from temporary sessions`);
  
  console.log('✅ Weekly maintenance complete');
}
```

---

## Support Contacts

For deployment issues or questions:

1. **Technical Lead:** [Contact Info]
2. **DevOps Team:** [Contact Info]
3. **Database Admin:** [Contact Info]

---

## Appendix

### A. Configuration Reference

```typescript
// FlowiseTableService Configuration
COMPRESSION_THRESHOLD = 50 * 1024;      // 50KB
QUOTA_THRESHOLD = 0.8;                  // 80%
MAX_TABLES_PER_USER = 500;
MAX_STORAGE_SIZE = 50 * 1024 * 1024;    // 50 MB
CLEANUP_PERCENTAGE = 0.2;               // 20%

// FlowiseTableBridge Configuration
MAX_RETRY_ATTEMPTS = 2;
RETRY_DELAY_MS = 2000;                  // 2 seconds

// FlowiseTableCache Configuration
MAX_CACHE_SIZE = 50;                    // 50 entries

// FlowiseTableLazyLoader Configuration
INTERSECTION_ROOT_MARGIN = '50px';
INTERSECTION_THRESHOLD = 0.1;
```

### B. IndexedDB Schema

```typescript
{
  name: 'clara_generated_tables',
  keyPath: 'id',
  indexes: [
    'sessionId',
    'messageId',
    'keyword',
    'fingerprint',
    'user_id',
    'timestamp',
    'sessionId_fingerprint' (composite, unique)
  ]
}
```

### C. Event Reference

- `flowise:table:integrated` - Table integrated by Flowise.js
- `storage:table:saved` - Table saved successfully
- `storage:table:error` - Table save failed
- `storage:table:error:max-retries` - Max retries exceeded
- `claraverse:session:changed` - Session changed

---

**Last Updated:** November 2025  
**Version:** 1.0.0  
**Deployment Status:** Ready for Production
