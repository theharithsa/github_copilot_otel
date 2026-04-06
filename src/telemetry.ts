/**
 * telemetry.ts — OpenTelemetry bootstrap for Dynatrace OTLP export.
 *
 * Initializes the OTel NodeSDK with OTLP/HTTP protobuf exporters for
 * traces, metrics, and logs, configured for Dynatrace ingestion.
 *
 * Call initTelemetry() BEFORE any other imports that create spans/metrics/logs.
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { PeriodicExportingMetricReader, AggregationTemporality } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, metrics, type Tracer, type Meter } from "@opentelemetry/api";
import { logs, type Logger } from "@opentelemetry/api-logs";

let sdk: NodeSDK | null = null;

export interface TelemetryConfig {
  /** OTLP base URL (e.g., https://abc123.live.dynatrace.com/api/v2/otlp). Falls back to DYNATRACE_OTLP_URL env var. */
  otlpUrl?: string;
  /** Dynatrace API token (dt0c01.*) with ingest scopes. Falls back to DYNATRACE_OTLP_TOKEN env var. */
  otlpToken?: string;
  /** Service name for OTel resource. Falls back to OTEL_SERVICE_NAME env var, then "copilot-sdk-agent". */
  serviceName?: string;
  /** Metric export interval in milliseconds. Defaults to 60000. */
  metricExportIntervalMs?: number;
}

/**
 * Initialize OpenTelemetry with Dynatrace OTLP exporters.
 *
 * Accepts an optional config object. Falls back to environment variables:
 * - DYNATRACE_OTLP_URL: OTLP base path
 * - DYNATRACE_OTLP_TOKEN: Classic API token with ingest scopes
 * - OTEL_SERVICE_NAME: Service name (default: "copilot-sdk-agent")
 */
export function initTelemetry(config?: TelemetryConfig): void {
  const otlpUrl = config?.otlpUrl ?? process.env.DYNATRACE_OTLP_URL;
  const otlpToken = config?.otlpToken ?? process.env.DYNATRACE_OTLP_TOKEN;

  if (!otlpUrl || !otlpToken) {
    console.log("[telemetry] DYNATRACE_OTLP_URL or DYNATRACE_OTLP_TOKEN not set — telemetry disabled");
    return;
  }

  const serviceName = config?.serviceName ?? process.env.OTEL_SERVICE_NAME ?? "copilot-sdk-agent";
  const metricExportIntervalMs = config?.metricExportIntervalMs ?? 60_000;
  const authHeader = `Api-Token ${otlpToken}`;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
  });

  // DYNATRACE_OTLP_URL should be the OTLP base path, e.g.:
  //   https://abc123.live.dynatrace.com/api/v2/otlp
  // See: https://docs.dynatrace.com/docs/ingest-from/opentelemetry/otlp-api
  const baseUrl = otlpUrl.replace(/\/+$/, ""); // strip trailing slashes

  const traceExporter = new OTLPTraceExporter({
    url: `${baseUrl}/v1/traces`,
    headers: { Authorization: authHeader },
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${baseUrl}/v1/metrics`,
    headers: { Authorization: authHeader },
    // Dynatrace requires delta temporality
    temporalityPreference: AggregationTemporality.DELTA,
  });

  const logExporter = new OTLPLogExporter({
    url: `${baseUrl}/v1/logs`,
    headers: { Authorization: authHeader },
  });

  sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    metricReaders: [new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: metricExportIntervalMs,
    })],
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
  });

  sdk.start();
  console.log(`[telemetry] Initialized — exporting to ${otlpUrl}`);
}

export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    console.log("[telemetry] Shut down");
  }
}

export function getTracer(name: string): Tracer {
  return trace.getTracer(name);
}

export function getMeter(name: string): Meter {
  return metrics.getMeter(name);
}

export function getLogger(name: string): Logger {
  return logs.getLogger(name);
}
