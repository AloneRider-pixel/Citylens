# CityLens

**AI-powered city and landmark exploration web application.**

CityLens uses a React + TypeScript frontend and a Node/Express server to analyze city photos with Google's Gemini API, return structured landmark information, and present nearby points of interest on an interactive map.

## Architecture

```text
User photo
   ↓
React + TypeScript UI
   ↓
Express API
   ↓
Gemini vision model
   ↓
Structured landmark result
   ├── Landmark metadata
   ├── Visual focal points
   ├── Nearby POIs
   └── Confidence / model metadata
   ↓
Map + exploration UI
```

## Technology

- React 19 + TypeScript
- Vite
- Node.js + Express
- Google Gemini SDK
- Leaflet
- Tailwind CSS
- Motion / Lucide React
- PWA service-worker support

## Engineering highlights

- Server-side Gemini API integration keeps the provider credential out of the browser bundle.
- JSON responses are normalized before being returned to the client.
- Request payloads are bounded to prevent unbounded image-body growth.
- Security headers are applied at the server boundary.
- Interactive map functionality is separated from the AI recognition path.
- CI runs deterministic dependency installation, TypeScript checking, and a production build.
- Dependabot and CodeQL workflows provide ongoing dependency and static-analysis coverage.

## Local development

```bash
cp .env.example .env
# Add GEMINI_API_KEY to .env
pnpm install
pnpm dev
```

Build and type-check:

```bash
pnpm build
pnpm lint
```

## Environment

```text
GEMINI_API_KEY=your_key_here
```

Never commit real API credentials. Use `.env.example` as the configuration template.

## Project structure

```text
src/
├── components/       # UI components
├── context/          # application state
├── data/              # local application data
├── services/          # external/API services
├── App.tsx            # application shell
├── main.tsx           # React entry point
├── types.ts           # shared TypeScript types
└── serviceWorkerRegistration.ts
server.ts              # Express + Gemini API boundary
vite.config.ts
package.json
```

## Security considerations

- Keep `GEMINI_API_KEY` server-side.
- Validate uploaded image MIME types and payload size before production deployment.
- Add authentication/rate limiting before exposing the recognition endpoint publicly at scale.
- Avoid treating model-generated coordinates or nearby-POI data as authoritative without verification.

## Roadmap

- Automated unit/integration tests for the API boundary and recognition pipeline
- Runtime request validation with a schema library
- API rate limiting and structured request logging
- Reproducible evaluation set for landmark-recognition quality
- Optional provider abstraction for additional vision models

## License

MIT
