# Verification & Evidence

## Trust boundary

CityLens treats model output as untrusted input. Recognition responses are schema-validated before reaching the client; malformed coordinates, confidence values, focal points, or POIs are rejected.

Live weather is fail-closed: when the live sources are unavailable, the API returns an error rather than a fabricated fallback value.

History results require at least one search-grounding source URL. Quiz output must contain exactly three questions with four options and a valid answer index.

## Reproduction

| Area | Command |
|---|---|
| Type checking | pnpm lint |
| Server validation | pnpm test |
| Production build | pnpm build |
| Static security | CodeQL workflow |
| Workflow supply-chain | OpenSSF Scorecard workflow |

## Claim policy

Model confidence is model-provided confidence, not a calibrated probability. Nearby coordinates and generated historical facts remain unverified unless supported by external sources. Published benchmark claims must include dataset, denominator, environment, model/configuration, timestamp, and commit.