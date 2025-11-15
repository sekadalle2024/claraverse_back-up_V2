# Flowise Event System Guide

## Overview

The Flowise.js script now emits custom events whenever tables are integrated into the DOM. This enables the persistence layer to automatically capture and save generated tables without modifying the core Flowise logic.

## Event Types

### 1. Table Integration Event

**Event Name:** `flowise:table:integrated`

**Emitted When:**
- A table is successfully generated from n8n response
- A table is loaded from cache
- An error message is displayed

**Event Detail Structure:**
```typescript
{
  table: HTMLElement,        // The table or error message element
  keyword: string,           // Dynamic keyword from Flowise column
  container: HTMLElement,    // Parent container element
  containerId: string,       // Unique container identifier
  position: number,          // Position within container
  source: 'n8n' | 'cached' | 'error',  // Data source
  timestamp: number,         // Unix timestamp
  error?: string            // Error message (only for source='error')
}
```

## Data Attributes

### Table Attributes

All generated tables have the following attributes:

```html
<div class="overflow-x-auto my-4" 
     data-n8n-table="true"
     data-n8n-keyword="YourKeyword">
  <table>...</table>
</div>
```

### Cached Table Attributes

Tables loaded from cache have an additional attribute:

```html
<div data-n8n-table="true"
     data-n8n-keyword="YourKeyword"
     data-n8n-cached="true">
  <table>...</table>
</div>
```

### Error Message Attributes

Error messages have special attributes:

```html
<div data-n8n-error="true"
     data-n8n-keyword="YourKeyword">
  Error message content...
</div>
```

### Container Attributes

Containers are automatically marked with unique IDs:

```html
<div class="prose prose-base dark:prose-invert max-w-none"
     data-container-id="container-1730000000000-0">
  <!-- Tables go here -->
</div>
```

## Usage Examples

### Basic Event Listener

```javascript
document.addEventListener('flowise:table:integrated', (event) => {
  const { table, keyword, source, containerId } = event.detail;
  
  console.log(`Table integrated: ${keyword}`);
  console.log(`Source: ${source}`);
  console.log(`Container: ${containerId}`);
  
  // Your persistence logic here
});
```

### Filtering by Source

```javascript
document.addEventListener('flowise:table:integrated', (event) => {
  const { source, keyword } = event.detail;
  
  switch(source) {
    case 'n8n':
      console.log(`Fresh data from n8n: ${keyword}`);
      // Save to database
      break;
      
    case 'cached':
      console.log(`Cached data: ${keyword}`);
      // Maybe skip saving or mark as cached
      break;
      
    case 'error':
      console.error(`Error occurred: ${event.detail.error}`);
      // Log error or notify user
      break;
  }
});
```

### Handling Errors

```javascript
document.addEventListener('flowise:table:integrated', (event) => {
  if (event.detail.source === 'error') {
    const { keyword, error, containerId } = event.detail;
    
    console.error(`Error for keyword "${keyword}":`, error);
    
    // Optionally save error state for debugging
    saveErrorState({
      keyword,
      error,
      containerId,
      timestamp: event.detail.timestamp
    });
  }
});
```

## DOM Inspection

### Find All N8N Tables

```javascript
const n8nTables = document.querySelectorAll('[data-n8n-table="true"]');
console.log(`Found ${n8nTables.length} n8n tables`);
```

### Find Cached Tables

```javascript
const cachedTables = document.querySelectorAll('[data-n8n-cached="true"]');
console.log(`Found ${cachedTables.length} cached tables`);
```

### Find Error Messages

```javascript
const errors = document.querySelectorAll('[data-n8n-error="true"]');
console.log(`Found ${errors.length} error messages`);
```

### Get All Keywords

```javascript
const keywordElements = document.querySelectorAll('[data-n8n-keyword]');
const keywords = Array.from(keywordElements).map(el => 
  el.getAttribute('data-n8n-keyword')
);
const uniqueKeywords = [...new Set(keywords)];
console.log('Keywords:', uniqueKeywords);
```

### Get All Containers

```javascript
const containers = document.querySelectorAll('[data-container-id]');
console.log(`Found ${containers.length} containers`);

containers.forEach(container => {
  const id = container.getAttribute('data-container-id');
  const tables = container.querySelectorAll('[data-n8n-table="true"]');
  console.log(`Container ${id}: ${tables.length} tables`);
});
```

## Testing

### Manual Testing Steps

1. **Load the test page:**
   ```
   Open test-flowise-events.html in your browser
   ```

2. **Trigger a Flowise table:**
   - Create a table with "Flowise" column header
   - Add a keyword in the first row
   - The script will process it automatically

3. **Check the event log:**
   - Events should appear in the test page log
   - Check browser console for detailed logs

4. **Inspect the DOM:**
   - Click "Inspect Current DOM" button
   - Verify data attributes are set correctly

### Automated Testing

```javascript
// Test event emission
function testEventEmission() {
  let eventReceived = false;
  
  const listener = (event) => {
    eventReceived = true;
    console.log('✅ Event received:', event.detail);
  };
  
  document.addEventListener('flowise:table:integrated', listener);
  
  // Trigger Flowise processing
  window.ClaraverseN8nV17.scanAndProcess();
  
  setTimeout(() => {
    if (eventReceived) {
      console.log('✅ Event emission test PASSED');
    } else {
      console.error('❌ Event emission test FAILED');
    }
    document.removeEventListener('flowise:table:integrated', listener);
  }, 2000);
}
```

### Verify Data Attributes

```javascript
function verifyDataAttributes() {
  const tables = document.querySelectorAll('[data-n8n-table="true"]');
  
  let allValid = true;
  
  tables.forEach((wrapper, index) => {
    const hasKeyword = wrapper.hasAttribute('data-n8n-keyword');
    const keyword = wrapper.getAttribute('data-n8n-keyword');
    
    if (!hasKeyword || !keyword) {
      console.error(`❌ Table ${index} missing keyword attribute`);
      allValid = false;
    } else {
      console.log(`✅ Table ${index}: keyword="${keyword}"`);
    }
  });
  
  return allValid;
}
```

## Integration with FlowiseTableBridge

The FlowiseTableBridge (implemented in Task 3) automatically listens for these events:

```typescript
// In FlowiseTableBridge
document.addEventListener('flowise:table:integrated', (event: CustomEvent) => {
  this.handleTableIntegrated(event.detail);
});
```

The bridge will:
1. Capture the event
2. Generate a fingerprint from the table content
3. Check for duplicates
4. Save to IndexedDB if new
5. Link to current session

## Debugging

### Enable Verbose Logging

The Flowise script already includes console logs for all events:

```javascript
console.log(`📡 Event emitted for table ${index + 1} with keyword "${targetKeyword}" (source: ${source})`);
```

### Check Event Emission

```javascript
// Count events
let eventCount = 0;
document.addEventListener('flowise:table:integrated', () => {
  eventCount++;
  console.log(`Total events: ${eventCount}`);
});
```

### Monitor Event Details

```javascript
document.addEventListener('flowise:table:integrated', (event) => {
  console.group('Flowise Event Details');
  console.log('Keyword:', event.detail.keyword);
  console.log('Source:', event.detail.source);
  console.log('Container ID:', event.detail.containerId);
  console.log('Position:', event.detail.position);
  console.log('Timestamp:', new Date(event.detail.timestamp).toISOString());
  console.log('Table Element:', event.detail.table);
  console.groupEnd();
});
```

## Common Issues

### Events Not Firing

**Problem:** No events are being emitted

**Solutions:**
1. Check if Flowise.js is loaded: `window.ClaraverseN8nV17`
2. Verify table has "Flowise" column header
3. Check browser console for errors
4. Manually trigger: `window.ClaraverseN8nV17.scanAndProcess()`

### Missing Data Attributes

**Problem:** Tables don't have data-n8n-* attributes

**Solutions:**
1. Check Flowise.js version (should be V17.1+)
2. Verify integrateTablesOnly() was called
3. Inspect DOM: `document.querySelectorAll('[data-n8n-table]')`

### Container ID Not Set

**Problem:** Containers missing data-container-id

**Solutions:**
1. Container IDs are generated automatically
2. Check generateContainerId() function
3. Manually set: `container.setAttribute('data-container-id', 'custom-id')`

## Performance Considerations

### Event Frequency

- Events are emitted once per table
- Multiple tables in one response = multiple events
- Events are synchronous and lightweight

### Memory Usage

- Event details contain DOM references
- Clean up listeners when not needed
- Use weak references if storing events

### Best Practices

1. **Use event delegation** for better performance
2. **Debounce handlers** if processing is expensive
3. **Remove listeners** when components unmount
4. **Avoid storing** large event histories in memory

## API Reference

### Flowise.js Public API

```javascript
window.ClaraverseN8nV17 = {
  // Manually trigger table scanning
  scanAndProcess: () => void,
  
  // Get configuration
  CONFIG: Object,
  
  // Extract keyword from table
  extractDynamicKeyword: (table: HTMLElement) => string,
  
  // Test n8n connection
  testN8nConnection: () => Promise<{success: boolean, data?: any, error?: string}>,
  
  // Cache management
  clearAllCache: () => void,
  getCacheInfo: () => Object,
  
  // Version info
  version: string
};
```

## Migration Notes

### From Previous Versions

If upgrading from Flowise.js < V17.1:

1. **No breaking changes** - events are additive
2. **Data attributes** were already present
3. **New features:**
   - Event emission
   - Container ID generation
   - Cached table marking
   - Error event emission

### Backward Compatibility

- All existing functionality preserved
- Events are opt-in (no listeners = no impact)
- Data attributes don't affect rendering
- Cache behavior unchanged

## Support

For issues or questions:
1. Check browser console for errors
2. Use test page (test-flowise-events.html)
3. Verify Flowise.js version
4. Review this guide

## Version History

- **V17.1** - Added event emission system
- **V17.0** - Fixed n8n response handling
- **V16.x** - Previous versions
