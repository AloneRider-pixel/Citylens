## 2024-05-24 - [Avoid Leaking Internal Errors to Client via res.status(500)]
**Vulnerability:** The application was passing `error.message` from generic catch blocks directly to the client in HTTP 500 response bodies.
**Learning:** External SDKs, such as the Gemini AI SDK, may throw errors containing sensitive internal context, configuration specifics, or potentially API keys. Directly piping these errors to the user breaches secure error-handling boundaries by leaking implementation details.
**Prevention:** Always fail securely by catching all unexpected errors and returning a generic user-friendly safety message (e.g. "Failed to recognize landmark"). The actual raw error should be logged server-side for internal debugging purposes only.

## 2024-05-24 - [Targeted Express Payload Limits to Prevent DoS]
**Vulnerability:** A global `express.json({ limit: '25mb' })` middleware exposed all endpoints to payload-based Denial of Service (DoS) attacks, even those only requiring small payloads.
**Learning:** Broadly applying large payload limits for the convenience of a single endpoint (like image upload) compromises the security of the entire application API.
**Prevention:** Always apply large payload limits route-specifically (e.g., `app.use('/api/recognize', express.json({ limit: '25mb' }))`), and use a strict, small default limit (e.g., `100kb`) globally for all other routes to mitigate memory exhaustion risks.
## 2024-05-24 - [HIGH] Fix token exhaustion vulnerability in generation endpoints
**Vulnerability:** Multiple AI generation endpoints (`/api/history`, `/api/tts`, `/api/weather`, `/api/quiz`) accepted user input fields (`landmarkName`, `city`, `text`, etc.) without explicit length limits, passing them directly into LLM prompts.
**Learning:** External APIs like `@google/genai` charge per token (Financial DoS risk) and have limits on prompt sizes. Any endpoint combining user input into a prompt without bounds checking is vulnerable to malicious large payloads.
**Prevention:** Always implement strict string length limits on any field that is fed into an AI prompt or downstream external API call.
