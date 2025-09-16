# Aquil Symbolic Engine - Detailed Cleanup Action Plan

## Executive Summary
The repository has excellent architecture but suffers from schema-implementation misalignment. The ChatGPT integration confusion is caused by operationId mismatches, not architectural issues.

## Immediate Actions (Critical for ChatGPT)

### 1. Fix Primary OperationId Mismatch
**File:** `src/index.js` line 867
**Current:** `await logChatGPTAction(env, 'generateInsight', ...)`
**Change to:** `await logChatGPTAction(env, 'generateJournalInsight', ...)`

### 2. Delete Legacy Files (240KB savings)
```bash
rm src/index-backup.js
rm src/index-original-backup.js  
rm src/index-original.js
```

## Missing Route Implementations

### 3. Implement Missing Commitments System
**Files to create/modify:**
- Add to `src/routes/personal-dev.js`:
```javascript
// POST /api/commitments/create
personalDevRouter.post("/api/commitments/create", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed
  await logChatGPTAction(env, 'manageCommitment', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// GET /api/commitments/active  
personalDevRouter.get("/api/commitments/active", withErrorHandling(async (req, env) => {
  // Implementation needed
  await logChatGPTAction(env, 'listActiveCommitments', {}, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// POST /api/commitments/progress
personalDevRouter.post("/api/commitments/progress", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed  
  await logChatGPTAction(env, 'updateCommitmentProgress', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));
```

### 4. Implement Missing Goals/Habits System
**Files to create/modify:**
- Add to `src/routes/personal-dev.js`:
```javascript
// POST /api/goals/set
personalDevRouter.post("/api/goals/set", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed
  await logChatGPTAction(env, 'setPersonalGoals', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// POST /api/habits/design  
personalDevRouter.post("/api/habits/design", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed
  await logChatGPTAction(env, 'designHabits', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));
```

## OperationId Alignment Fixes

### 5. Fix Route Files with Wrong OperationIds

**File:** `src/routes/personal-dev.js`
- Line ~56: Change `'generateInquiry'` to `'generateDiscoveryInquiry'`
- Line ~77: Change `'somaticSession'` to `'somaticHealingSession'`  
- Line ~87: Change `'extractWisdom'` to `'extractMediaWisdom'`
- Line ~127: Change `'dailyWisdomSynthesis'` to `'getDailySynthesis'`
- Line ~147: Change `'navigateTransition'` to `'navigateTransitions'`

**File:** `src/routes/utility.js`  
- Change `'getInsights'` to `'getPersonalInsights'`
- Change `'trackMood'` to `'trackMoodAndEmotions'`

**File:** `src/routes/data-ops.js`
- Change `'kvLog'` to `'storeInKV'` 
- Change `'upsertVectorData'` to `'upsertVectors'`
- Change `'queryVectorDatabase'` to `'queryVectorIndex'`
- Change `'getKVStoredData'` to `'retrieveFromKV'`
- Change `'listR2Objects'` to `'retrieveR2StoredContent'`

**File:** `src/routes/system.js`
- Change `'healthCheck'` to `'systemHealthCheck'`
- Change `'sessionInit'` to `'retrieveRecentSessionLogs'`

**File:** `src/routes/logging.js`
- Change `'logEntry'` to `'logDataOrEvent'`
- Change `'retrieveLogs'` to `'retrieveLogsOrDataEntries'`
- Change `'writeLog'` to `'advancedLoggingOperations'`

## Missing Endpoints to Implement

### 6. Add Missing Search Endpoints
**File:** `src/routes/data-ops.js` or create new search router:
```javascript
// POST /api/search/logs
dataOpsRouter.post("/api/search/logs", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed
  await logChatGPTAction(env, 'searchLogs', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// POST /api/search/r2
dataOpsRouter.post("/api/search/r2", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed
  await logChatGPTAction(env, 'searchR2Storage', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// POST /api/rag/search  
dataOpsRouter.post("/api/rag/search", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed
  await logChatGPTAction(env, 'ragSearch', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));

// POST /api/rag/memory
dataOpsRouter.post("/api/rag/memory", withErrorHandling(async (req, env) => {
  const body = await req.json();
  // Implementation needed
  await logChatGPTAction(env, 'ragMemoryConsolidation', body, result);
  return addCORSToResponse(createSuccessResponse(result));
}));
```

## Files NOT to Delete (Well Integrated)

### ✅ Keep These - All Properly Connected:
- `src/routes/` - All 5 route files actively used
- `src/ark/` - ARK system properly integrated  
- `src/utils/` - Utility functions actively used
- `src/actions/` - Action handlers properly integrated
- `src/agent/` - Behavioral engine properly connected
- All `src-core-*.js` files - Personal development modules actively used

## Schema Considerations

### Option A: Fix Implementation to Match Schema (Recommended)
- Implement missing routes
- Fix operationId mismatches
- Keep schema under 30 operations for ChatGPT

### Option B: Update Schema to Match Implementation  
- Add missing operationIds to schema
- Risk exceeding 30 operation limit
- May require schema pruning

## Architecture Quality Assessment ✅

**Strengths:**
- Excellent modular router architecture
- Clean separation of concerns 
- Proper error handling patterns
- Good fail-open behavior
- ARK system well integrated

**The Confusion Source:**
- OperationId mismatches causing ChatGPT to select wrong implementations
- Not architectural problems - just naming inconsistencies

**Recommendation:** 
Fix the operationId mismatches rather than architectural changes. The codebase structure is solid.