# @theharithsa/github_copilot_otel

Reusable OpenTelemetry instrumentation for [GitHub Copilot SDK](https://github.com/github/copilot-sdk) agents, with built-in Dynatrace OTLP export.

Drop this into any Node.js app that uses `@github/copilot-sdk` and get full AI observability in Dynatrace — LLM call traces, token usage metrics, tool execution spans, and latency histograms — with zero custom instrumentation code.

## Why This Exists

The GitHub Copilot SDK lets you embed GitHub's LLM models (GPT-4o, Claude, etc.) directly into your applications via a programmatic API. But once you're running LLM-powered features in production, you need visibility into:

- **How much are LLM calls costing?** (token usage per model)
- **How fast are responses?** (latency percentiles)
- **Are tool calls failing?** (error rates, timeouts)
- **What's the full request lifecycle?** (distributed traces from user prompt → model → tool → response)

This package wires up OpenTelemetry spans and metrics following the [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) so that Dynatrace's AI Observability app (or any OTel-compatible backend) can answer all of these questions out of the box.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Your App                                                   │
│                                                             │
│  ┌───────────────┐    ┌──────────────────────────────────┐  │
│  │ Copilot SDK   │───▶│ @theharithsa/github_copilot_otel │  │
│  │ Session Events│    │                                  │  │
│  │               │    │  invoke_agent (root span)        │  │
│  │ user.message  │    │   ├── chat claude-sonnet (span)  │  │
│  │ assistant.*   │    │   ├── execute_tool get_time      │  │
│  │ tool.*        │    │   ├── chat claude-sonnet (span)  │  │
│  │ session.*     │    │   └── metrics (tokens, latency)  │  │
│  └───────────────┘    └──────────────┬───────────────────┘  │
│                                      │                      │
└──────────────────────────────────────┼──────────────────────┘
                                       │ OTLP/HTTP (protobuf)
                                       ▼
                              ┌─────────────────┐
                              │   Dynatrace     │
                              │  AI Observability│
                              └─────────────────┘
```

### Span Hierarchy

```
invoke_agent (SERVER)                    ← one per session
  ├── chat claude-sonnet-4-5 (CLIENT)    ← per LLM call, drives AI Observability
  ├── execute_tool get_time (CLIENT)     ← per tool execution
  ├── chat claude-sonnet-4-5 (CLIENT)    ← subsequent LLM call
  └── ...
```

### Metrics Emitted

| Metric | Type | Description |
|--------|------|-------------|
| `copilot_sdk.llm.tokens.total` | Counter | Token usage by model, direction (`input`/`output`), and type |
| `copilot_sdk.llm.latency` | Histogram | LLM response latency in milliseconds |
| `copilot_sdk.tools.executed` | Counter | Tool executions by name and outcome (`success`/`error`) |

## Installation

```bash
npm install @theharithsa/github_copilot_otel @opentelemetry/api
```

> `@opentelemetry/api` is a peer dependency — you provide it so all OTel instrumentation in your app shares the same global instance.

## Quick Start

### 1. Set Environment Variables

```bash
# Required
DYNATRACE_OTLP_URL=https://abc123.live.dynatrace.com/api/v2/otlp
DYNATRACE_OTLP_TOKEN=dt0c01.xxxx.xxxxxxxx

# Optional
OTEL_SERVICE_NAME=my-copilot-agent          # default: "copilot-sdk-agent"
PROVIDER_TYPE=github.copilot                 # default: "github.copilot"
GH_TOKEN=ghp_xxxx                           # GitHub token for Copilot SDK

# Opt-in: capture prompt/completion content in spans (disabled by default for privacy)
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true
```

### 2. Initialize and Use

```typescript
import { initTelemetry, shutdownTelemetry, subscribeSessionTelemetry } from "@theharithsa/github_copilot_otel";

// Initialize BEFORE importing Copilot SDK (captures auto-instrumented HTTP calls)
initTelemetry();

import { CopilotClient, defineTool } from "@github/copilot-sdk";

const client = new CopilotClient({ githubToken: process.env.GH_TOKEN });
await client.start();

const session = await client.createSession({
  model: "claude-sonnet-4-5-20250929",
  tools: [/* your tools */],
  systemMessage: { content: "You are a helpful assistant." },
});

// Subscribe to session events for telemetry
const cleanup = subscribeSessionTelemetry(session, session.sessionId, "claude-sonnet-4-5-20250929");

// Use the session
const response = await session.sendAndWait({ prompt: "What time is it?" });

// Cleanup
cleanup();
await session.destroy();
await client.stop();
await shutdownTelemetry();
```

### 3. Programmatic Configuration (Optional)

Instead of environment variables, pass config directly:

```typescript
import { initTelemetry } from "@theharithsa/github_copilot_otel";

initTelemetry({
  otlpUrl: "https://abc123.live.dynatrace.com/api/v2/otlp",
  otlpToken: "dt0c01.xxxx.xxxxxxxx",
  serviceName: "my-copilot-agent",
  metricExportIntervalMs: 30_000,
});
```

## API Reference

### `initTelemetry(config?: TelemetryConfig): void`

Initializes the OpenTelemetry SDK with Dynatrace OTLP exporters. Call this **before** importing `@github/copilot-sdk`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.otlpUrl` | `string` | OTLP base URL. Falls back to `DYNATRACE_OTLP_URL` env var |
| `config.otlpToken` | `string` | Dynatrace API token. Falls back to `DYNATRACE_OTLP_TOKEN` env var |
| `config.serviceName` | `string` | OTel service name. Falls back to `OTEL_SERVICE_NAME`, then `"copilot-sdk-agent"` |
| `config.metricExportIntervalMs` | `number` | Metric export interval. Default: `60000` |

### `subscribeSessionTelemetry(session, sessionId, model): () => void`

Subscribes to a Copilot SDK session's events and creates OTel spans/metrics. Returns an unsubscribe function.

| Parameter | Type | Description |
|-----------|------|-------------|
| `session` | `{ on: (handler) => void }` | Copilot SDK session instance |
| `sessionId` | `string` | Session identifier |
| `model` | `string` | Model name (e.g., `"claude-sonnet-4-5-20250929"`) |

### `shutdownTelemetry(): Promise<void>`

Flushes pending telemetry and shuts down the OTel SDK. Call before process exit.

### `getTracer(name: string): Tracer`

Returns an OTel tracer for creating custom spans.

### `getMeter(name: string): Meter`

Returns an OTel meter for creating custom metrics.

## Dynatrace Setup

1. **Create an API token** in Dynatrace with these scopes:
   - `openTelemetryTrace.ingest`
   - `metrics.ingest`

2. **Get your OTLP endpoint**:
   - SaaS: `https://{your-environment-id}.live.dynatrace.com/api/v2/otlp`
   - Managed: `https://{your-domain}/e/{your-environment-id}/api/v2/otlp`

3. See [Dynatrace OTLP API docs](https://docs.dynatrace.com/docs/ingest-from/opentelemetry/otlp-api) for details.

## Requirements

- Node.js >= 18
- `@opentelemetry/api` ^1.9.0 (peer dependency)
- `@github/copilot-sdk` in your application
- A GitHub Copilot subscription (Individual, Pro, Business, or Enterprise)

## Related

- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Dynatrace AI Observability](https://docs.dynatrace.com/docs/analyze-explore-automate/ai-observability)
- [OTel JS SDK 2.0 Migration Guide](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/upgrade-to-2.md)

## License

[MIT](LICENSE)
