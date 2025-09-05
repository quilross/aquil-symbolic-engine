# Ark 2.0 Data Architecture Schemas

This directory contains JSON schema definitions for the Ark 2.0 data architecture across Cloudflare's distributed storage systems.

## Overview

The Ark 2.0 architecture uses four nervous systems for data storage:

- **KV**: Ephemeral stream (quick, transient logs, cache, short-lived data)
- **D1**: Persistent structured history (sessions, logs, commitments, durable records)
- **Vector**: Emergent pattern recognition (embeddings, semantic search, recurring themes)
- **R2**: Durable artifact storage (profiles, maps, snapshots, whole objects)

## Schema Files

### 📋 `logs.json` - Event Logs (D1 + KV Hybrid)
**Purpose**: Store event logs, insights, and system actions.

**Structure**:
- `logs[]`: Array of log entries (empty by default)
  - `id`: UUID v4 identifier
  - `type`: Log type (session|voice-change|insight|breakthrough|commitment|api-failure|session-end)
  - `detail`: Optional freeform notes
  - `timestamp`: ISO 8601 string
  - `storedIn`: Storage location (KV|D1)
- `retrieval`: Metadata object
  - `lastRetrieved`: ISO 8601 string or null
  - `retrievalCount`: Integer

**Notes**: KV is the ephemeral first stop. Recurring or important logs are promoted to D1.

### 📝 `commitments.json` - Accountability Tracking (D1 Primary)
**Purpose**: Track commitments, accountability, and progress updates.

**Structure**:
- `commitments[]`: Array of commitment objects
  - `id`: UUID v4 identifier
  - `description`: Commitment description
  - `createdAt`: ISO 8601 creation timestamp
  - `status`: Status (pending|in-progress|complete|dropped)
  - `progressUpdates[]`: Chronological updates
    - `timestamp`: ISO 8601 string
    - `note`: Progress note

**Notes**: Always persisted in D1. Updates are appended chronologically.

### 🗃️ `artifacts.json` - Durable Objects (R2 Storage)
**Purpose**: Hold durable, structured objects (profiles, maps, snapshots).

**Structure**:
- `artifacts[]`: Array of artifact objects
  - `id`: UUID v4 identifier
  - `name`: Human-readable name
  - `type`: Artifact type (profile|snapshot|map|other)
  - `createdAt`: ISO 8601 creation timestamp
  - `r2Key`: Reference key in R2 storage
  - `data`: Schema-flexible payload object

**Notes**: Only metadata lives in JSON/D1. Full payload lives in R2. Artifacts are immutable once stored.

### 🧠 `vector.json` - Pattern Recognition (Vector DB Metadata)
**Purpose**: Track emergent patterns and embeddings stored in Cloudflare Vector DB.

**Structure**:
- `patterns[]`: Array of pattern objects
  - `id`: UUID v4 identifier
  - `embedding`: Float array (vector embedding)
  - `source`: Source type (log|commitment|artifact|other)
  - `createdAt`: ISO 8601 creation timestamp
  - `metadata`: Freeform tags object
    - `theme`: Theme string
    - `confidence`: Confidence float

**Notes**: Full vectors are stored in Vector DB. This file contains metadata schemas and examples for local testing.

## Validation

Run schema validation with:

```bash
npm run validate:schemas
```

This validates:
- ✅ Valid JSON format
- ✅ UUID v4 compliance
- ✅ ISO 8601 timestamp format
- ✅ Required field presence
- ✅ Correct data types

## Usage

These JSON files serve as:
- 📝 Schema blueprints for data structure
- 🏗️ Example initialization for local development
- 🧪 Testing and seeding data templates
- 📖 Documentation for data contracts

In production, data flows into the respective Cloudflare services (KV, D1, R2, Vector) based on the patterns defined here.