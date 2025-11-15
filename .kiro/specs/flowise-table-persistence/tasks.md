# Implementation Plan

- [x] 1. Extend IndexedDB schema with clara_generated_tables store





  - Create new store definition in indexedDB.ts with proper indexes
  - Add migration logic to create the store if it doesn't exist
  - Define TypeScript interfaces for FlowiseGeneratedTableRecord
  - _Requirements: 1.1, 2.4, 9.2_

- [x] 2. Implement FlowiseTableService core functionality





  - Create src/services/flowiseTableService.ts with base class structure
  - Implement table fingerprint generation based on complete content
  - Implement saveGeneratedTable() method with compression support
  - Implement restoreSessionTables() method
  - Implement tableExists() for duplicate detection
  - _Requirements: 1.1, 2.4, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2.1 Implement fingerprint generation algorithm


  - Write extractHeaders() to get all column headers
  - Write extractAllRows() to get all cell content
  - Implement SHA-256 hash function for content signature
  - Add structure metadata (rowCount, colCount) to fingerprint
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 2.2 Implement table metadata extraction

  - Extract rowCount and colCount from table structure
  - Extract column headers array
  - Calculate original HTML size
  - Determine if compression is needed (> 50KB threshold)
  - _Requirements: 1.3, 7.1_

- [x] 2.3 Implement HTML compression and decompression

  - Add compression library (e.g., lz-string or pako)
  - Implement compressHTML() method for tables > 50KB
  - Implement decompressHTML() method for restoration
  - Add compression metadata to table records
  - _Requirements: 7.1_

- [x] 2.4 Write unit tests for FlowiseTableService






  - Test fingerprint generation with identical tables
  - Test fingerprint generation with different content
  - Test fingerprint generation with same keyword but different data
  - Test save and restore operations
  - Test duplicate detection
  - Test compression/decompression
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 3. Create FlowiseTableBridge for event handling





  - Create src/services/flowiseTableBridge.ts with event listeners
  - Implement session detection from React state, URL, and DOM
  - Implement handleTableIntegrated() event handler
  - Implement restoreTablesForSession() method
  - Implement injectTableIntoDOM() for restoration
  - _Requirements: 3.1, 3.2, 4.1, 9.1_

- [x] 3.1 Implement session detection logic


  - Detect session from window.claraverseState (React global state)
  - Detect session from URL parameters (sessionId, session, chatId)
  - Detect session from DOM attributes (data-session-id)
  - Implement fallback to temporary session creation
  - _Requirements: 4.1, 9.1, 9.5_

- [x] 3.2 Implement event listeners


  - Listen for 'flowise:table:integrated' events
  - Listen for 'claraverse:session:changed' events
  - Emit 'storage:table:saved' events on successful save
  - Emit 'storage:table:error' events on failures with retry logic
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 3.3 Implement DOM injection for restored tables


  - Find or create table containers by containerId
  - Create table wrappers with proper attributes (data-n8n-table, data-restored)
  - Inject HTML content into wrappers
  - Preserve table positioning and order
  - _Requirements: 1.2, 1.3, 4.3, 4.4, 4.5_

- [x] 3.4 Write integration tests for FlowiseTableBridge





  - Test event capture and table save workflow
  - Test session change and table restoration
  - Test duplicate table handling
  - Test error handling and retry logic
  - _Requirements: 3.1, 3.2, 3.5, 4.1, 4.2_

- [x] 4. Modify Flowise.js to emit events





  - Add event emission in integrateTablesOnly() after table integration
  - Add event emission in error handling for n8n failures
  - Include table element, keyword, container, position in event detail
  - Mark tables with data-n8n-table and data-n8n-keyword attributes
  - _Requirements: 2.1, 2.2, 3.1, 6.1, 6.2_


- [x] 4.1 Update integrateTablesOnly() function

  - Add data-n8n-table="true" attribute to table wrappers
  - Add data-n8n-keyword attribute with Dynamic_Keyword value
  - Emit 'flowise:table:integrated' event for each table
  - Include source='n8n' in event detail
  - _Requirements: 2.1, 2.2, 3.1_


- [x] 4.2 Update error handling in Flowise.js

  - Add data-n8n-error="true" to error message elements
  - Emit 'flowise:table:integrated' event for error messages
  - Include source='error' and error message in event detail
  - _Requirements: 6.1, 6.2, 6.3_


- [x] 4.3 Handle cached responses in Flowise.js

  - Mark cached tables with source='cached' in events
  - Add data-n8n-cached attribute to cached table wrappers
  - _Requirements: 6.5_

- [x] 5. Implement table restoration on page load





  - Initialize FlowiseTableBridge on DOMContentLoaded
  - Detect current session on initialization
  - Automatically restore tables for detected session
  - Handle missing containers by creating new ones
  - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4_

- [x] 5.1 Implement container creation for missing containers


  - Create div.prose containers with proper classes
  - Set data-container-id and data-restored-container attributes
  - Find appropriate insertion point in chat DOM
  - _Requirements: 4.4_

- [x] 5.2 Implement chronological table ordering

  - Sort tables by timestamp before restoration
  - Maintain position order within same container
  - Respect original table sequence
  - _Requirements: 4.2, 4.5, 10.2, 10.5_

- [x] 5.3 Write tests for restoration system






  - Test restoration on session change
  - Test container creation for missing containers
  - Test chronological ordering
  - Test multiple tables in same container
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement duplicate detection and prevention





  - Check fingerprint before saving new tables
  - Use composite index (sessionId + fingerprint) for fast lookup
  - Skip save operation if duplicate found
  - Log duplicate detection for monitoring
  - _Requirements: 5.3, 5.4, 11.5_

- [x] 6.1 Implement tableExists() method


  - Query IndexedDB using sessionId_fingerprint composite index
  - Return boolean indicating if table already exists
  - Handle query errors gracefully
  - _Requirements: 11.5_

- [x] 6.2 Update Trigger_Table handling

  - Mark processed Trigger_Tables in metadata
  - Exclude processed Trigger_Tables from restoration
  - Check for existing Generated_Tables before processing Trigger_Table
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.3 Write tests for duplicate detection





  - Test duplicate table rejection
  - Test Trigger_Table processing prevention
  - Test fingerprint-based duplicate detection
  - _Requirements: 5.3, 5.4, 11.5_

- [x] 7. Implement session lifecycle management




  - Link tables to Clara chat sessions via sessionId
  - Implement cascade delete when session is deleted
  - Handle session navigation and table filtering
  - Implement orphaned table cleanup
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7.1 Extend claraDatabaseService for table cleanup


  - Add deleteSessionTables() call in deleteSession() method
  - Implement cascade delete for all session tables
  - Update debugDataIntegrity() to check for orphaned tables
  - Update cleanupOrphanedData() to remove orphaned tables
  - _Requirements: 9.4_

- [x] 7.2 Implement session filtering


  - Filter tables by sessionId when restoring
  - Only show tables for current active session
  - Handle session switching with automatic reload
  - _Requirements: 9.3_

- [x] 7.3 Implement orphaned table detection


  - Find tables with sessionIds that don't exist in clara_sessions
  - Mark orphaned tables for cleanup
  - Provide manual cleanup option via diagnostic API
  - _Requirements: 9.5_

- [-] 7.4 Write tests for session lifecycle





  - Test cascade delete on session deletion
  - Test session filtering during restoration
  - Test orphaned table detection and cleanup
  - _Requirements: 9.3, 9.4, 9.5_

- [x] 8. Implement storage optimization



  - Implement automatic cleanup when quota approaches 80%
  - Prioritize deletion of cached and error tables
  - Preserve tables from active session during cleanup
  - Implement manual cleanup API for users
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 8.1 Implement quota monitoring

  - Check storage usage before each save operation
  - Calculate percentage of quota used
  - Trigger cleanup when threshold exceeded
  - _Requirements: 7.2_


- [x] 8.2 Implement cleanup strategy





  - Sort tables by timestamp (oldest first)
  - Filter out tables from active session
  - Prioritize cached and error tables for deletion
  - Delete oldest 20% of eligible tables
  - _Requirements: 7.3, 7.4_


- [x] 8.3 Implement size limits





  - Enforce maximum 500 tables per user
  - Enforce maximum 50MB total storage per user
  - Trigger cleanup when limits approached
  - _Requirements: 7.5_

- [x] 8.4 Write tests for storage optimization





  - Test quota monitoring and cleanup trigger
  - Test cleanup strategy and prioritization
  - Test active session preservation
  - Test size limit enforcement
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 9. Implement diagnostic and monitoring tools






  - Create FlowiseTableDiagnostics class with stats methods
  - Implement getStorageStats() for usage reporting
  - Implement checkIntegrity() for data validation
  - Implement listSessionTables() for session inspection
  - Add logging for all operations
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9.1 Implement storage statistics




  - Count total tables across all sessions
  - Calculate tables per session breakdown
  - Calculate total storage size and average
  - Count compressed, cached, and error tables
  - _Requirements: 8.1, 8.2_

- [x] 9.2 Implement integrity checking

  - Detect orphaned tables (no matching session)
  - Detect corrupted tables (invalid HTML or metadata)
  - Detect duplicate fingerprints within same session
  - Generate integrity report
  - _Requirements: 8.4_

- [x] 9.3 Implement session table listing

  - List all tables for a given session
  - Include id, keyword, timestamp, size, source
  - Sort by timestamp
  - _Requirements: 8.3_

- [x] 9.4 Write tests for diagnostic tools







  - Test storage statistics calculation
  - Test integrity checking with various scenarios
  - Test session table listing
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Implement chronological integration with messages






  - Link tables to specific messages via messageId
  - Store timestamp for chronological ordering
  - Implement unified timeline view (messages + tables)
  - Preserve creation order during restoration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 10.1 Add messageId linking



  - Detect message context when table is generated
  - Store messageId in table metadata
  - Create reference link between message and table
  - _Requirements: 10.4_

- [x] 10.2 Implement timeline ordering






  - Sort messages and tables by timestamp
  - Interleave tables with messages chronologically
  - Maintain correct visual order in chat
  - _Requirements: 10.2, 10.3_

- [x] 10.3 Write tests for chronological integration























  - Test messageId linking
  - Test timeline ordering with mixed messages and tables
  - Test restoration order preservation
  - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 11. Implement error handling and recovery




  - Handle session detection failures with fallback
  - Handle storage quota exceeded with cleanup
  - Handle save failures with retry logic (max 2 attempts)
  - Handle restoration failures gracefully
  - _Requirements: 3.5, 6.1, 6.2, 6.3, 6.4_

- [x] 11.1 Implement session detection error handling


  - Try multiple detection methods in sequence
  - Fall back to temporary session if all fail
  - Log detection method used
  - _Requirements: 9.1, 9.5_

- [x] 11.2 Implement storage error handling


  - Catch QuotaExceededError and trigger cleanup
  - Retry save operation after cleanup
  - Log storage errors for monitoring
  - _Requirements: 7.2_

- [x] 11.3 Implement save retry logic


  - Retry failed saves after 2 seconds
  - Maximum 2 retry attempts
  - Emit error event after max retries
  - _Requirements: 3.5_

- [ ]* 11.4 Write tests for error handling
  - Test session detection fallback
  - Test quota exceeded handling
  - Test save retry logic
  - Test restoration error recovery
  - _Requirements: 3.5, 6.1, 6.2, 6.3_

- [ ] 12. Add security and sanitization
  - Implement HTML sanitization with DOMPurify
  - Enforce user_id isolation for all operations
  - Validate table data before save
  - Implement storage limits per user
  - _Requirements: 1.1, 9.2_

- [ ] 12.1 Implement HTML sanitization
  - Add DOMPurify library dependency
  - Sanitize table HTML before saving
  - Allow only safe tags and attributes
  - Preserve data-* attributes for functionality
  - _Requirements: 1.3_

- [ ] 12.2 Implement user isolation
  - Get current user_id for all operations
  - Filter tables by user_id in all queries
  - Prevent cross-user data access
  - _Requirements: 9.2_

- [ ]* 12.3 Write security tests
  - Test HTML sanitization removes malicious code
  - Test user isolation prevents cross-user access
  - Test storage limits enforcement
  - _Requirements: 9.2_

- [x] 13. Performance optimization



  - Implement lazy loading for table content
  - Implement batch save operations
  - Implement table caching for frequent access
  - Optimize fingerprint calculation
  - _Requirements: 7.1, 7.2_

- [x] 13.1 Implement lazy loading


  - Use IntersectionObserver for visibility detection
  - Load table content only when visible
  - Placeholder for off-screen tables
  - _Requirements: 7.1_


- [x] 13.2 Implement batch operations

  - Save multiple tables in single transaction
  - Restore multiple tables efficiently
  - Reduce IndexedDB transaction overhead
  - _Requirements: 7.1_


- [x] 13.3 Implement caching

  - Cache recently accessed tables in memory
  - LRU cache with max 50 entries
  - Invalidate cache on updates
  - _Requirements: 7.1_

- [x] 13.4 Write performance tests









  - Test handling of 100+ tables
  - Test compression efficiency
  - Test lazy loading performance
  - Test batch operation speed
  - _Requirements: 7.1, 7.2_

- [x] 14. Integration and end-to-end testing





  - Test complete workflow from Flowise event to restoration
  - Test session switching with table reload
  - Test session deletion with cascade cleanup
  - Test error scenarios and recovery
  - _Requirements: All requirements_

- [x] 14.1 Create end-to-end test suite


  - Test full save and restore cycle
  - Test multiple sessions with isolation
  - Test duplicate prevention
  - Test error handling
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 9.3_

- [x] 14.2 Create stress test suite


  - Test with 500+ tables
  - Test with large tables (> 1MB)
  - Test rapid table generation
  - Test concurrent operations
  - _Requirements: 7.1, 7.2, 7.5_

- [-] 14.3 Create integration test runner




  - Automated test execution
  - Test result reporting
  - Performance metrics collection
  - _Requirements: All requirements_

- [x] 15. Documentation and deployment



  - Document API usage for developers
  - Create user guide for diagnostic tools
  - Update system architecture documentation
  - Create deployment checklist
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 15.1 Create API documentation


  - Document FlowiseTableService public methods
  - Document event system and custom events
  - Document diagnostic API
  - Provide code examples
  - _Requirements: 8.1, 8.2, 8.3_


- [x] 15.2 Create deployment guide

  - Database migration steps
  - Rollback procedures
  - Monitoring setup
  - Performance tuning guidelines
  - _Requirements: All requirements_
