# Legacy Code Quarantine (Aug 2025)

This directory contains code that was quarantined during the Gene Keys kernel runtime simplification.

## Quarantined Components

### /agents/
Legacy agent modules superseded by Gene Keys kernel path.

### /classifier/
Legacy sentiment, intent, toxicity, and tone classification modules.

### /tools/
Legacy external tool integrations (calculator, search, weather, wiki, etc.).

### /openapi/
Legacy OpenAPI specifications that are no longer canonical.

### /workflows/
Legacy CI/CD workflows that were replaced by streamlined processes.

## Usage

All quarantined code is gated by feature flags in `worker/config/featureFlags.js`:
- `ENABLE_LEGACY_TOOLS`
- `ENABLE_LEGACY_CLASSIFIERS` 
- `ENABLE_LEGACY_AGENTS`

Default: `false` (quarantined code is disabled)

## Rollback Instructions

To restore legacy functionality:
1. Set appropriate feature flags to `true` in `worker/config/featureFlags.js`
2. Import specific modules as needed in the main runtime
3. Restore specific workflow files from `legacy/workflows/` to `.github/workflows/`

**Warning**: Do not import anything from `legacy/` in active runtime without explicit feature flag gating.