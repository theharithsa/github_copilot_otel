# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-06

### Added

- `getLogger()` — convenience accessor for OpenTelemetry Logger instances
- OTLP log export to Dynatrace via `OTLPLogExporter` (`/v1/logs` endpoint)
- Structured log emissions from session events: `user.message`, `assistant.usage`, `tool.execution_complete`, `session.error`
- `trace_id` and `span_id` attributes on all log records for trace-to-log correlation
- Span context propagation via `context` field on log records (OTLP-level `traceId`/`spanId`)

### Changed

- `NodeSDK` config uses `logRecordProcessors` (array) and `metricReaders` (array) instead of deprecated singular options
- Dynatrace API token now requires `logs.ingest` scope in addition to `openTelemetryTrace.ingest` and `metrics.ingest`

### Dependencies

- Added `@opentelemetry/api-logs` ^0.214.0
- Added `@opentelemetry/exporter-logs-otlp-proto` ^0.214.0
- Added `@opentelemetry/sdk-logs` ^0.214.0

## [0.1.0] - 2026-04-06

### Added

- `initTelemetry()` — OpenTelemetry SDK bootstrap with Dynatrace OTLP/HTTP protobuf exporters
- `shutdownTelemetry()` — graceful SDK shutdown with telemetry flush
- `subscribeSessionTelemetry()` — Copilot SDK session event subscription for GenAI span instrumentation
- `TelemetryConfig` interface for programmatic configuration (alternative to env vars)
- `getTracer()` / `getMeter()` — convenience accessors for custom spans/metrics
- GenAI semantic convention spans (`chat`, `execute_tool`, `invoke_agent`)
- Metrics: `copilot_sdk.llm.tokens.total`, `copilot_sdk.llm.latency`, `copilot_sdk.tools.executed`
- Opt-in prompt/completion content capture via `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`
- Dynatrace delta temporality for metric export
- Compatible with `@opentelemetry/resources` v2.x (`resourceFromAttributes`)
