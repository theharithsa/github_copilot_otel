# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
