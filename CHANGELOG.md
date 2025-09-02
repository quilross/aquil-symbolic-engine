# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Readiness endpoint at `/api/system/readiness` for deployment health checks
- Canary rollout support with `ENABLE_CANARY` and `CANARY_PERCENT` environment variables
- Kill-switch functionality via `DISABLE_NEW_MW` environment variable
- Schema governance CI job enforcing operation count = 30
- CODEOWNERS file requiring approval for schema changes
- Runbook documentation for operational procedures
- SLO documentation with deployment gates

### Changed
- Enhanced CI pipeline with schema governance and approval requirements
- Improved error handling with fail-open behavior for new features

### Security
- Added fail-open behavior to ensure system availability during outages

## [2.2.1] - 2024-09-02

### Fixed
- Schema consistency and operation aliases alignment
- Integration test robustness improvements

### Chore
- Updated dependency management and CI pipeline optimizations