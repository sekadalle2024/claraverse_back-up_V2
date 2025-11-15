# Task 10.1 Implementation: Add messageId Linking

## Overview

This task implements the ability to link Flowise-generated tables to specific Clara chat messages, creating a reference relationship between tables and the messages that triggered their generation.

## Requirements Addressed

- **Requirement 10.4**: WHEN a Generated_Table is created in response to a Chat_Message specific, THE Storage_System SHALL create a link of reference between the message and the table

## Implementation Details

### 1. Message Context Detection

Added `detectMessageContext()` method to `FlowiseTableBridge` that attempts to detect the message ID using multiple strategies:

1. **Direct table attribute**: Checks for `data-message-id` on the table element
2. **Parent container attributes**: Traverses up the DOM tree looking for message ID attributes
3. **Closest message container**: Finds the nearest message container element
4. **Table container**: Checks the table's container for message ID
5. **Last assistant message**: Falls back to the most recent assistant message in the DOM

### 2. Enhanced Table Saving

Modified `handleTableIntegrated()` in `FlowiseTableBridge` to:
- Detect message context when a table is generated
- Pass the detected `messageId` to the `saveGeneratedTable()` method
- Log the message link when a table is saved

### 3. New Service Methods

Added to `FlowiseTableService`:

- **`getTableById(tableId)`**: Retrieve a specific table by its ID
- **`updateTable(table)`**: Update an existing table record
- **`getTablesByMessageId(messageId)`**: Get all tables linked to a specific message (sorted chronologically)

Added to `FlowiseTableBridge`:

- **`linkTableToMessage(tableId, messageId)`**: Manually create a link between a table and a message
- **`getTablesForMessage(messageId)`**: Get all tables associated with a specific message
- **`unlinkTableFromMessage(tableId)`**: Remove the message link from a table

### 4. Event Detail Enhancement

The `FlowiseTableIntegratedDetail` interface already supports an optional `messageId` field, allowing Flowise.js to explicitly provide the message ID when emitting events.

## Usage Examples

### Automatic Message Detection

When Flowise.js emits a table integrated event, the bridge automatically detects the message context:

```typescript
// Flowise.js emits event
const event = new CustomEvent('flowise:table:integrated', {
  detail: {
    table: tableElement,
    keyword: 'MyKeyword',
    source: 'n8n',
    timestamp: Date.now()
    // messageId is optional - will be auto-detected if not provided
  }
});
document.dispatchEvent(event);
```

### Manual Message Linking

External code can manually link tables to messages:

```typescript
// Link a table to a message after it's been saved
await flowiseTableBridge.linkTableToMessage(tableId, messageId);

// Get all tables for a specific message
const tables = await flowiseTableBridge.getTablesForMessage(messageId);

// Unlink a table from its message
await flowiseTableBridge.unlinkTableFromMessage(tableId);
```

### Querying Tables by Message

```typescript
// Get all tables linked to a message
const tables = await flowiseTableService.getTablesByMessageId(messageId);

// Tables are returned in chronological order
tables.forEach(table => {
  console.log(`Table ${table.id}: ${table.keyword} at ${table.timestamp}`);
});
```

## DOM Structure Requirements

For automatic message detection to work, the DOM should include message ID attributes:

```html
<!-- Option 1: Message container with data-message-id -->
<div class="message-container" data-message-id="msg-123" data-role="assistant">
  <div class="prose" data-container-id="container-456">
    <table data-n8n-table="true">...</table>
  </div>
</div>

<!-- Option 2: Table with direct message ID -->
<table data-n8n-table="true" data-message-id="msg-123">...</table>

<!-- Option 3: Container with message ID -->
<div class="prose" data-container-id="container-456" data-message-id="msg-123">
  <table data-n8n-table="true">...</table>
</div>
```

## Database Schema

The `messageId` field is already part of the `FlowiseGeneratedTableRecord` interface:

```typescript
interface FlowiseGeneratedTableRecord {
  id: string;
  sessionId: string;
  messageId?: string;  // Optional link to clara_messages
  keyword: string;
  // ... other fields
}
```

The IndexedDB schema includes an index on `messageId` for efficient querying:

```typescript
indexes: [
  { name: 'messageId', keyPath: 'messageId', unique: false },
  // ... other indexes
]
```

## Benefits

1. **Chronological Integration**: Tables can be positioned correctly relative to messages in the chat timeline
2. **Context Preservation**: Each table maintains a reference to the message that triggered its generation
3. **Flexible Querying**: Easy to retrieve all tables associated with a specific message
4. **Manual Override**: Supports both automatic detection and manual linking
5. **Backward Compatible**: The `messageId` field is optional, so existing tables without message links continue to work

## Testing Recommendations

1. Test automatic message detection with various DOM structures
2. Test manual linking and unlinking of tables to messages
3. Test querying tables by message ID
4. Test chronological ordering of tables within a message
5. Test behavior when message ID is not detected (should still save table)
6. Test updating a table's message link

## Next Steps

This implementation provides the foundation for Task 10.2 (Implement timeline ordering), which will use the message links to create a unified chronological view of messages and tables.
