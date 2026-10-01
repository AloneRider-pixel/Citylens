# 🌆 CityLens

[![CI](https://github.com/AloneRider-pixel/Citylens/actions/workflows/ci.yml/badge.svg)](https://github.com/AloneRider-pixel/Citylens/actions/workflows/ci.yml)
[![CodeQL](https://github.com/AloneRider-pixel/Citylens/actions/workflows/codeql.yml/badge.svg)](https://github.com/AloneRider-pixel/Citylens/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-powered city and landmark exploration app built around server-side vision inference, structured results, maps, and a PWA experience.

## Product flow

```text
Photo
  ↓
React + TypeScript UI
  ↓
Express API boundary
  ↓
Gemini Vision
  ↓
Normalized landmark result
  ↓
Map + nearby points of interest
```

## Engineering highlights

- Gemini credentials remain server-side.
- Request payloads are bounded before expensive provider calls.
- Server-side security headers protect the API boundary.
- Model responses are normalized before reaching the UI.
- PWA service-worker support provides an installable web experience.
- CI validates dependency installation, lint/type checks, tests, build, CodeQL, dependency review, and synthetic checks.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js, Express |
| AI | Google Gemini SDK |
| Maps | Leaflet |
| Styling | Tailwind CSS |
| Platform | PWA |
| CI/security | GitHub Actions, CodeQL, Dependabot, Scorecard |

## Repository layout

```text
src/
  components/
  context/
  data/
  services/
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
pnpm install
```

Set the server-side key:

```text
GEMINI_API_KEY=your_key_here
```

Never commit a real credential.

Start the app:

```bash
pnpm dev
```

## Verification

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

The API security-sensitive path is `server.ts` and the associated validation modules.

## Security

Keep provider credentials server-side, enforce request-size/MIME controls, retain rate limiting before high-scale public deployment, and independently validate model-generated coordinates/POI data.

The repository's CI uses immutable GitHub Action SHAs and least-privilege workflow permissions.

## Evidence and reproducibility

Deterministic validation proves application behavior, not real-world landmark-recognition accuracy. Any published recognition, reliability, latency, or coverage result should state provider/model, dataset, sample count, method, environment, and producing commit.

## Roadmap

- Expand server/API integration coverage.
- Runtime schema validation for model responses.
- Versioned landmark evaluation dataset.
- Provider abstraction and geospatial result verification.

## Review path

Start with [SECURITY.md](SECURITY.md) and [verification](docs/verification.md), then inspect `server.ts`, validation modules, and provider integration before changing public API behavior.

## Maintenance standard

Keep secrets off the client, keep request/rate controls active, validate external data, and preserve reproducibility of test fixtures.

## License

MIT
