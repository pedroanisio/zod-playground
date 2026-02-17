# Version Mixin Design

Companion design notes extracted from `version-mixin.ts`.

## Workflow Diagram

`SemVerSchema` -> `ParsedSemVer` -> `VersionInfo` -> `VersionMixin`

## Utility Surface

- `parseSemVer()`
- `formatSemVer()`
- `compareSemVer()`
- `incrementSemVer()`
- `satisfiesRange()`

## Purpose

Provide semver-compliant version parsing, comparison, and metadata attachment for reusable schemas.
