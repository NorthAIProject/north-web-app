# ADR 0001: Use Bun as the package manager

- Status: accepted
- Date: 2026-10-26

## Context

The task brief listed pnpm, but the repository instruction and current project configuration identify Bun as the package manager. Mixed package managers create competing lockfiles, different script behavior, and inconsistent CI installs.

## Decision

Use Bun for dependency installation, scripts, lockfile generation, and CI. Keep the Bun lockfile authoritative. Document any package-manager migration as a separate ADR.

## Consequences

Developers use `bun install`, `bun run`, and `bunx` equivalents. Documentation may show package names and commands abstractly, but repository examples must use Bun. Tooling must be checked for Bun compatibility before adoption.
