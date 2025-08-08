# Conflict Resolution Guide

## Issue: Conflicting Conflicts Preventing Merge

### Root Cause
Multiple open PRs have **conflicting product directions** for the same codebase:

- **PR #73**: Consolidation approach - simplify to 5 canonical actions
- **PR #72**: Expansion approach - add significant new functionality  
- **PR #71**: Specific feature additions
- **PR #68**: Structural fixes

### The Conflicts

#### Primary Conflict in `worker/src/index.js`:
- **PR #73**: Removes 284 lines, consolidates to clean API surface
- **PR #72**: Adds 291 lines, expands functionality
- **PR #71**: Adds handlers that PR #73 would delete

### Recommended Resolution Strategy

#### Option 1: Consolidation First (Recommended)
1. **Merge PR #68** (structural OpenAPI fixes) - safe, no conflicts
2. **Merge PR #73** (consolidation) - establishes clean foundation
3. **Selectively integrate PR #72 features** that align with consolidated approach
4. **Add PR #71 handlers** to the consolidated structure

#### Option 2: Expansion First
1. **Merge PR #68** (structural fixes)
2. **Merge PR #72** (expansion) 
3. **Integrate PR #71** additions
4. **Apply PR #73 consolidation** as cleanup layer

#### Option 3: Hybrid Approach
1. **Merge PR #68** (fixes)
2. **Create unified implementation** that:
   - Uses PR #73's clean action structure
   - Includes PR #72's essential new features
   - Incorporates PR #71's specific handlers
   - Maintains backward compatibility

### Implementation Notes

- All PRs pass individual tests
- Core functionality works correctly
- The conflict is **strategic/architectural**, not technical
- Current main branch + PR #75 provides stable foundation

### Recommendation

Use **Option 1 (Consolidation First)** as it provides:
- Clean, maintainable codebase
- Clear API surface (5 canonical actions)
- Foundation for selective feature addition
- Better GPT plugin compatibility

This resolves the "conflicting conflicts" by establishing a clear merge order and unified vision.