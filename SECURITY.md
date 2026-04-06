# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this package, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **theharithsa@gmail.com**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive an acknowledgment within 48 hours. We will work with you to understand and address the issue before any public disclosure.

## Security Considerations

This package handles sensitive configuration:

- **API tokens** (`DYNATRACE_OTLP_TOKEN`) — transmitted over HTTPS to the configured OTLP endpoint. Never logged or included in span attributes.
- **Prompt/completion content** — only captured in spans when explicitly opted in via `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true`. Disabled by default.
- **GitHub tokens** (`GH_TOKEN`) — used by the Copilot SDK in your application, not by this package directly.

### Best Practices

- Use environment variables or secret managers for tokens — never hardcode them
- Keep `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` disabled in production unless you understand the privacy implications
- Restrict your Dynatrace API token to the minimum required scopes: `openTelemetryTrace.ingest` and `metrics.ingest`
- Use HTTPS endpoints only for OTLP export

## Dependencies

This package depends on OpenTelemetry SDK packages. We monitor for vulnerabilities via `npm audit` and update dependencies promptly when security patches are released.
