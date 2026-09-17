# Contributing to CityLens

CityLens is a TypeScript/React application for visual landmark recognition and nearby-point discovery.

## Development workflow

1. Create a focused branch from `main`.
2. Use the repository's declared package manager and lockfile for dependency changes.
3. Run type checking and production builds before opening a pull request.
4. Keep server-side API keys out of client bundles and source control.
5. Document changes to external APIs, response schemas, or application behavior.

## Quality expectations

- Keep user-controlled input validated at server boundaries.
- Preserve security headers and conservative CORS configuration.
- Handle external AI/API failures without leaking internal error details.
- Prefer small, typed modules over large application components.

## Pull requests

Include the affected UI/server areas, validation commands, external API impact, and any security considerations.
