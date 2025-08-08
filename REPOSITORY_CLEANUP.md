# Repository Cleanup Guide

This document outlines the manual steps required to complete the repository cleanup as documented in CHANGELOG.md v0.1.0.

## Manual Steps Required

### 1. Repository Settings Changes

Navigate to **Repository → Settings → General → Merge button** and configure:

```
✅ Allow squash merging
❌ Allow merge commits  
❌ Allow rebase merging
✅ Use squash PR title as default
```

In the same section, enable:
```
✅ Automatically delete head branches
```

### 2. Branch Protection Rules

Navigate to **Repository → Settings → Branches → Add rule** for `main` branch:

```
✅ Require a pull request before merging
✅ Require approvals: 1
✅ Require linear history
❌ Require status checks (disabled per preference)
```

### 3. Stale Branch Deletion

Navigate to **Repository → Branches** and delete these 9 branches:

- `codespaces-compatibility`
- `codex/add-probe_identity-to-handlers`
- `copilot/fix-2e995cf0-425e-40cf-92b5-364da5b2cda9`
- `copilot/fix-6a741f13-e6ff-4adb-92db-91e32cdfb6bb`
- `copilot/fix-74`
- `copilot/fix-78`
- `copilot/fix-4454f47a-5a86-4ddd-812f-b29c1902ddcd`
- `qiexuy-codex/add-probe_identity-to-handlers`
- `xt05pd-codex/add-probe_identity-to-handlers`

**Keep these branches** (have active PRs):
- `main`
- `Root` (PR #71)
- `p65f0y-codex/add-probe_identity-to-handlers` (PR #72)
- `copilot/fix-28c56956-1f00-4575-b5a0-c6470fc15358` (PR #68)
- `copilot/fix-8c943afd-41ac-4a91-a285-7d889ef027b4` (PR #73)

### 4. Create Baseline Tag

#### Option A: Using GitHub Releases UI
1. Navigate to **Repository → Releases → Draft a new release**
2. Set **Tag**: `v0.1.0`
3. Set **Target**: `f3cff568ebd2f3b753bc8d006075f0f186dc937a` (main branch)
4. Set **Title**: `v0.1.0 - Repository Cleanup Baseline`
5. Set **Description**: Copy from CHANGELOG.md v0.1.0 section
6. Click **Publish release**

#### Option B: Using Git Commands
```bash
# Switch to main branch
git checkout main

# Create annotated tag
git tag -a v0.1.0 f3cff568ebd2f3b753bc8d006075f0f186dc937a -m "Baseline before cleanup"

# Push tag to origin
git push origin v0.1.0
```

## Verification Steps

After completing the manual steps:

1. **Verify merge settings**: Create a test PR and confirm only squash merge is available
2. **Verify branch protection**: Attempt direct push to main (should be blocked)
3. **Verify branch cleanup**: Check that only 5 branches remain
4. **Verify tag creation**: Confirm v0.1.0 tag exists on main branch commit

## Benefits of This Cleanup

- **Clean History**: Squash-only merges create readable git timeline
- **Quality Control**: PR reviews prevent direct commits to main
- **Reduced Clutter**: Only active branches remain in repository
- **Automated Maintenance**: Head branches auto-delete after merge
- **Linear Development**: No merge commits maintain project clarity

## Future Development Workflow

With these changes in place:

1. Create feature branches from main
2. Submit PRs for review (1 approval required)
3. Squash merge when approved (head branch auto-deleted)
4. Main branch maintains clean, linear history
5. Tags mark important milestones and releases