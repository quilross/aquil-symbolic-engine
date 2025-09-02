# D1 Schema Fix Deployment Guide

This fix resolves the D1 logging schema/insert mismatches that cause:
- `table metamorphic_logs has no column named id`
- `no such table: event_log`

## Quick Deployment

1. **Apply the migration:**
   ```bash
   npm run db:migrate-fix
   ```

2. **Verify the fix:**
   ```bash
   # Check new schema
   wrangler d1 execute AQUIL_DB --command="PRAGMA table_info(metamorphic_logs);" --env production
   
   # Test logging endpoint
   curl -X POST https://your-domain.com/api/log \
     -H "Content-Type: application/json" \
     -d '{"type":"test","payload":{"test":"migration"}}'
   ```

3. **Check logs:**
   ```bash
   curl https://your-domain.com/api/logs?limit=5
   ```

## What Was Fixed

### Schema Changes
- **metamorphic_logs**: Updated to canonical schema with 15 columns including `operationId`, `stores`, `artifactKey`, etc.
- **event_log**: Converted from table to compatibility VIEW that maps to metamorphic_logs
- **Indexes**: Updated to match new column names

### Code Changes
- **src/actions/logging.js**: Updated to use canonical schema fields
- **src/ark/core.js**: Updated to use canonical schema fields
- **src/utils/d1-indexes.js**: Updated index creation for new columns

### Migration Safety
- **Zero downtime**: Uses atomic table swaps
- **Data preservation**: Migrates existing data with best-effort mapping
- **Backwards compatibility**: event_log VIEW ensures fallback code works
- **Fail-open**: Preserves existing error handling behavior

## Rollback Plan (if needed)

If issues arise, you can rollback by:

1. **Restore from backup:**
   ```sql
   DROP TABLE metamorphic_logs;
   ALTER TABLE metamorphic_logs_backup RENAME TO metamorphic_logs;
   DROP VIEW event_log;
   CREATE TABLE event_log (...); -- restore original table
   ```

2. **Revert code changes** (git revert this commit)

3. **Redeploy** previous version

## Testing

Run these commands to verify the fix:

```bash
# Core tests
npm run guard
node --test test/d1Migration.test.js
node --test test/schemaFixSmoke.test.js

# Verify migration SQL
node scripts/test-migration-sql.mjs
```

## Expected Results

After deployment:
- ✅ No more "column named id" errors
- ✅ No more "no such table: event_log" errors  
- ✅ D1 writes include `"d1"` in `stores` array
- ✅ All existing functionality preserved
- ✅ 30 operation limit maintained
- ✅ Fail-open behavior preserved