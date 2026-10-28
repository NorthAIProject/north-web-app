# ADR 0004: Treat health data as normalized, delayed, and sensitive

- Status: accepted
- Date: 2026-10-26

## Context

Native apps collect and synchronize health data. The web app does not access HealthKit or Health Connect directly, and not every metric is available or current at every moment.

## Decision

Display normalized API values with explicit units, timezone/date semantics, and freshness/sync status when available. Model missing, unsupported, pending, and stale values separately. Keep sensitive payloads out of logs, URLs, client persistence, and unnecessary SSR serialization.

## Consequences

Charts and cards need states beyond loading/success. Product copy must avoid implying real-time completeness. Unit conversion and aggregation belong in a shared, tested boundary—not ad hoc inside individual widgets.
