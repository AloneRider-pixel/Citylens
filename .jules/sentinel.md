## 2024-05-24 - [Avoid Leaking Internal Errors to Client via res.status(500)]
**Vulnerability:** The application was passing `error.message` from generic catch blocks directly to the client in HTTP 500 response bodies.
**Learning:** External SDKs, such as the Gemini AI SDK, may throw errors containing sensitive internal context, configuration specifics, or potentially API keys. Directly piping these errors to the user breaches secure error-handling boundaries by leaking implementation details.
**Prevention:** Always fail securely by catching all unexpected errors and returning a generic user-friendly safety message (e.g. "Failed to recognize landmark"). The actual raw error should be logged server-side for internal debugging purposes only.

## 2024-05-24 - [Targeted Express Payload Limits to Prevent DoS]
**Vulnerability:** A global `express.json({ limit: '25mb' })` middleware exposed all endpoints to payload-based Denial of Service (DoS) attacks, even those only requiring small payloads.
**Learning:** Broadly applying large payload limits for the convenience of a single endpoint (like image upload) compromises the security of the entire application API.
**Prevention:** Always apply large payload limits route-specifically (e.g., `app.use('/api/recognize', express.json({ limit: '25mb' }))`), and use a strict, small default limit (e.g., `100kb`) globally for all other routes to mitigate memory exhaustion risks.

## 2024-05-24 - [Input Validation to Prevent AI Token DoS]
**Vulnerability:** Endpoints querying large language models (like `/api/tts` and `/api/history`) had no strict input length limits. Even with a 100kb payload limit, users could send roughly 25,000 characters to LLM/TTS APIs.
**Learning:** There is a critical difference between standard HTTP payload limits (protecting memory/bandwidth) and AI Model input limits (protecting against severe token exhaustion and financial Denial of Service). A "small" payload in HTTP terms can be a massive payload in LLM context terms.
**Prevention:** Always implement explicit string length validation for any user-provided data passed into generative AI APIs, independent of basic JSON payload size limits.
