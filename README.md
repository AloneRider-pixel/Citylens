# CityLens — AI City & Landmark Explorer

[![CI](https://github.com/AloneRider-pixel/Citylens/actions/workflows/ci.yml/badge.svg)](https://github.com/AloneRider-pixel/Citylens/actions/workflows/ci.yml)
[![CodeQL](https://github.com/AloneRider-pixel/Citylens/actions/workflows/codeql.yml/badge.svg)](https://github.com/AloneRider-pixel/Citylens/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-powered city and landmark exploration web app built around server-side vision inference, validated responses, maps, and a progressive web app experience.

## Product flow

```text
Photo
  ↓
React + TypeScript
  ↓
Express API
  ↓
Gemini Vision
  ↓
Validated landmark result
  ↓
Map / nearby points of interest
```

## Engineering highlights

- Gemini credentials stay server-side.
- Request size and content controls protect expensive provider calls.
- API security headers and rate limiting protect the public boundary.
- Model responses are normalized before reaching the UI.
- PWA service-worker support provides an installable web experience.
- CI covers install, lint, type checking, tests, build, CodeQL, dependency review, Scorecard, and synthetic validation.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js, Express |
| AI | Google Gemini SDK |
| Maps | Leaflet |
| Styling | Tailwind CSS |
| Platform | PWA |
| Security/CI | GitHub Actions, CodeQL, Dependabot, Scorecard |

## Repository map

```text
src/components/
src/services/
server.ts
image-validation.ts
server-validation.ts
public/
package.json
pnpm-lock.yaml
.github/workflows/
```

## Quick start

```bash
git clone https://github.com/AloneRider-pixel/Citylens.git
cd Citylens
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

Set the server-side credential in `.env`:

```text
GEMINI_API_KEY=...
```

Never commit a real credential.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Review `server.ts`, `server-validation.ts`, and the provider integration together for public API changes.

## Security model

The browser must never receive provider or database credentials. Treat model output, user uploads, and external geospatial data as untrusted; validate and bound them before expensive or security-sensitive processing.

See [SECURITY.md](SECURITY.md).

## Evidence policy

Deterministic tests demonstrate software behavior, not real-world landmark-recognition accuracy. Publish recognition, reliability, latency, or coverage claims only with provider/model, dataset, sample count, methodology, environment, and producing commit.

## Documentation

- [Security](SECURITY.md)
- [Verification](docs/verification.md)
- [Evidence policy](docs/evidence-policy.md)

## Roadmap

Broader API integration coverage, runtime schema validation, versioned landmark evaluation datasets, and provider/geospatial verification.

## License

MIT
