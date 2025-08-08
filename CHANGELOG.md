# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.0] - 2025-08-08

### Repository Cleanup & Baseline

This release establishes a clean baseline for the Signal Q project with improved repository management and development practices.

#### Repository Settings Changes
- **Merge Strategy**: Enabled squash-only merges for clean linear history
- **Branch Protection**: Protected main branch with required PR reviews (1 approval)
- **Linear History**: Enforced linear history requirement on main branch
- **Auto-cleanup**: Enabled automatic deletion of head branches after merge

#### Branch Management
**Preserved Active Branches:**
- `main` - Primary development branch
- `Root` - Active PR #71
- `p65f0y-codex/add-probe_identity-to-handlers` - Active PR #72
- `copilot/fix-28c56956-1f00-4575-b5a0-c6470fc15358` - Active PR #68
- `copilot/fix-8c943afd-41ac-4a91-a285-7d889ef027b4` - Active PR #73

**Cleaned Up Stale Branches:**
- `codespaces-compatibility` - Development branch no longer needed
- `codex/add-probe_identity-to-handlers` - Superseded by newer implementations
- `copilot/fix-2e995cf0-425e-40cf-92b5-364da5b2cda9` - Completed fix branch
- `copilot/fix-6a741f13-e6ff-4adb-92db-91e32cdfb6bb` - Completed fix branch
- `copilot/fix-74` - Completed fix branch
- `copilot/fix-78` - Completed fix branch
- `copilot/fix-4454f47a-5a86-4ddd-812f-b29c1902ddcd` - Completed fix branch
- `qiexuy-codex/add-probe_identity-to-handlers` - Duplicate implementation
- `xt05pd-codex/add-probe_identity-to-handlers` - Duplicate implementation

#### Development Workflow Improvements
- **Clean History**: Squash merges ensure readable git history
- **Quality Gates**: Required PR reviews before merging to main
- **Automated Cleanup**: Head branches automatically deleted after merge
- **Linear Development**: No merge commits, maintaining clean project timeline

#### Baseline Status
- **Main Branch Commit**: `f3cff568ebd2f3b753bc8d006075f0f186dc937a`
- **Active Features**: Signal Q API with probe identity functionality
- **Test Coverage**: Comprehensive health endpoint testing
- **Deployment**: Cloudflare Workers with GitHub Codespaces support

### Added
- Repository cleanup documentation and baseline establishment
- Comprehensive branch management strategy
- Development workflow improvements for maintainability

### Changed
- Repository merge strategy to squash-only for clean history
- Branch protection rules on main for quality assurance
- Automated branch cleanup to reduce repository clutter

### Security
- Enhanced repository security with required PR reviews
- Protected main branch prevents direct commits
- Systematic cleanup of unused development branches

---

**Note**: This changelog documents the repository cleanup performed to establish a clean development baseline. Future releases will document feature changes, bug fixes, and enhancements to the Signal Q API.