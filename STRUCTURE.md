# Repository Structure

This document describes the organized structure of the Aquil Symbolic Engine repository after cleanup.

## Directory Structure

```
aquil-symbolic-engine/
├── backend/                    # All source code (Cloudflare Workers)
│   ├── actions/               # Database and storage actions
│   │   ├── d1.js             # D1 database operations
│   │   ├── kv.js             # KV store operations
│   │   ├── logging.js        # Unified logging system
│   │   ├── r2.js             # R2 object storage
│   │   └── vectorize.js      # Vector database operations
│   ├── agent/                # Behavioral intelligence engine
│   │   ├── avoidance.js      # Avoidance pattern detection
│   │   ├── engine.js         # Main behavioral engine
│   │   ├── pressing.js       # Pressing question generation
│   │   ├── questions.js      # Question generation utilities
│   │   └── voice.js          # Voice and communication patterns
│   ├── ark/                  # ARK enhanced endpoints
│   │   ├── ark-endpoints.js  # ARK-specific API endpoints
│   │   ├── core.js           # ARK core functionality
│   │   └── endpoints.js      # Standard endpoints
│   ├── core/                 # AI modules for personal growth
│   │   ├── abundance-cultivator.js    # Abundance mindset work
│   │   ├── ancestry-healer.js         # Ancestral healing
│   │   ├── creativity-unleasher.js    # Creativity enhancement
│   │   ├── media-wisdom.js            # Media wisdom extraction
│   │   ├── pattern-recognizer.js      # Pattern recognition
│   │   ├── somatic-healer.js          # Somatic healing
│   │   ├── standing-tall.js           # Confidence building
│   │   ├── transition-navigator.js    # Life transitions
│   │   ├── trust-builder.js           # Trust building
│   │   └── values-clarifier.js        # Values clarification
│   ├── ops/                  # Operation management
│   │   └── operation-aliases.js       # Operation aliases and mapping
│   ├── utils/                # Utility functions
│   │   ├── ai-helpers.js             # AI integration helpers
│   │   ├── autonomy.js               # Autonomous action handling
│   │   ├── cors.js                   # CORS handling
│   │   ├── database.js               # Database utilities
│   │   ├── dream-interpreter.js      # Dream interpretation
│   │   ├── emotion-analyzer.js       # Emotion analysis
│   │   ├── error-handler.js          # Error handling
│   │   ├── gpt-compat.js            # ChatGPT compatibility
│   │   ├── http.js                   # HTTP utilities
│   │   ├── metrics.js                # Metrics collection
│   │   ├── ops-middleware.js         # Operations middleware
│   │   ├── pattern-matcher.js        # Pattern matching
│   │   ├── privacy.js                # Privacy utilities
│   │   ├── response-helpers.js       # Response formatting
│   │   └── trust-scorer.js           # Trust scoring
│   ├── index.js              # Main entry point
│   └── index.js.backup       # Backup of main entry point
├── config/                   # Configuration and schemas
│   ├── add-on-actions.json           # Add-on actions configuration
│   ├── ark.actions.logging.json      # ARK logging actions schema
│   ├── ark.actions.logging-with-addons.json  # Extended logging schema
│   ├── gpt-actions-schema.json       # Main ChatGPT actions schema
│   ├── gpt-actions-schema-streamlined.json   # Streamlined schema
│   ├── gpt-actions-schema-with-addons.json   # Schema with add-ons
│   └── logging-addons.json           # Logging add-ons configuration
├── scripts/                  # Build and maintenance scripts
│   ├── active/               # Scripts actively used in package.json
│   │   ├── acceptance.mjs            # Acceptance testing
│   │   ├── bump-openapi-version.mjs  # Version bumping
│   │   ├── check-banned-patterns.mjs # Pattern validation
│   │   ├── check-op-aliases.mjs      # Alias validation
│   │   ├── check-schema-consistency.mjs  # Schema validation
│   │   ├── check-spec-bump.mjs       # Spec change validation
│   │   ├── comprehensive-audit.mjs   # Comprehensive auditing
│   │   ├── fix-suggestions.mjs       # Fix suggestions
│   │   ├── migrate-d1.mjs           # D1 database migration
│   │   ├── reconcile-logs.mjs        # Log reconciliation
│   │   ├── smoke-logs.mjs           # Smoke testing for logs
│   │   └── spec-diff.mjs            # Spec difference checking
│   └── maintenance/          # Development and testing scripts
│       ├── integration-test.mjs      # Integration testing
│       ├── scripts-deploy.sh         # Deployment scripts
│       ├── scripts-test-endpoints.sh # Endpoint testing
│       ├── test-chatgpt-actions.mjs  # ChatGPT actions testing
│       ├── test-endpoints.js         # Endpoint testing
│       ├── test-logging.mjs          # Logging testing
│       ├── test-migration-sql.mjs    # Migration testing
│       └── test-vector-retrieval.mjs # Vector retrieval testing
├── static/                   # Static assets
│   └── dashboard.html               # Dashboard interface
├── test/                     # Test files
│   └── idempotency.test.js          # Idempotency tests
├── package.json              # Node.js package configuration
├── wrangler.toml            # Cloudflare Workers configuration
├── schema.sql               # Database schema
└── README.md                # Project documentation
```

## Key Changes Made

### Removed Files
- **Unused validation scripts**: 8 one-time validation and fix scripts
- **Unused utilities**: 7 utility files that were no longer referenced
- **Example/demo files**: Documentation and example integration files
- **Alternative implementations**: Backup versions and addon-specific files
- **Unused dependencies**: Removed `ajv` package

### Reorganized Structure
- **Backend consolidation**: All source code moved to `backend/` directory
- **Configuration centralization**: All schemas and config moved to `config/`
- **Script organization**: Active scripts separated from maintenance scripts
- **Core modules**: Renamed and organized core AI modules
- **Import path updates**: All import paths updated to reflect new structure

### Updated Configuration
- **package.json**: Updated main entry point and script paths
- **wrangler.toml**: Updated main entry point for Cloudflare Workers
- **Import statements**: Updated all relative imports in source files
- **Script paths**: Updated path resolution in all maintenance scripts

## Benefits

1. **Clearer organization**: Logical separation of concerns
2. **Reduced complexity**: Removed 20+ unused files
3. **Better maintainability**: Clear distinction between active and maintenance scripts
4. **Improved navigation**: Hierarchical directory structure
5. **Consistent naming**: Removed redundant prefixes and naming inconsistencies

## Next Steps

The repository is now well-organized and ready for continued development. All tests pass and the existing functionality is preserved.