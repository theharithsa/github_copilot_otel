# Contributing to @theharithsa/github_copilot_otel

Thanks for your interest in contributing! This guide covers the process for contributing to this project.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/github_copilot_otel.git
   cd github_copilot_otel
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Build** the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Project Structure

```
src/
├── index.ts            # Public API barrel export
├── telemetry.ts        # OTel SDK init, shutdown, tracer/meter factories
└── instrumentation.ts  # Session event subscription, span/metric creation
```

### Making Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes in `src/`
3. Build and verify:
   ```bash
   npm run build
   ```
4. Commit with a clear message (see [Commit Messages](#commit-messages))
5. Push and open a Pull Request

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for log exporters
fix: handle missing token usage in assistant.usage event
docs: clarify Dynatrace token scopes
chore: update @opentelemetry/sdk-node to 0.215.0
```

## Pull Request Guidelines

- **One concern per PR** — avoid mixing features, fixes, and refactors
- **Describe the why** — explain the motivation, not just what changed
- **Keep it small** — smaller PRs get reviewed faster
- **Update the README** if you change the public API
- **Add a CHANGELOG entry** for user-facing changes

## What We're Looking For

- Bug fixes with clear reproduction steps
- Support for additional OTel backends (not just Dynatrace)
- New GenAI semantic convention attributes as the spec evolves
- Documentation improvements
- Performance improvements with benchmarks

## Reporting Bugs

Open an issue with:
1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Your environment (Node.js version, OS, OTel package versions)

## Code Style

- TypeScript strict mode
- ESM modules (`"type": "module"`)
- No unnecessary abstractions — keep it simple
- Follow existing patterns in the codebase

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
