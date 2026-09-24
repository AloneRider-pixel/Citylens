## 2024-05-24 - [Avoid Leaking Internal Errors to Client via res.status(500)]
**Vulnerability:** The application was passing `error.message` from generic catch blocks directly to the client in HTTP 500 response bodies.
**Learning:** External SDKs, such as the Gemini AI SDK, may throw errors containing sensitive internal context, configuration specifics, or potentially API keys. Directly piping these errors to the user breaches secure error-handling boundaries by leaking implementation details.
**Prevention:** Always fail securely by catching all unexpected errors and returning a generic user-friendly safety message (e.g. "Failed to recognize landmark"). The actual raw error should be logged server-side for internal debugging purposes only.

## 2024-05-24 - [Targeted Express Payload Limits to Prevent DoS]
**Vulnerability:** A global `express.json({ limit: '25mb' })` middleware exposed all endpoints to payload-based Denial of Service (DoS) attacks, even those only requiring small payloads.
**Learning:** Broadly applying large payload limits for the convenience of a single endpoint (like image upload) compromises the security of the entire application API.
**Prevention:** Always apply large payload limits route-specifically (e.g., `app.use('/api/recognize', express.json({ limit: '25mb' }))`), and use a strict, small default limit (e.g., `100kb`) globally for all other routes to mitigate memory exhaustion risks.

## 2025-02-25 - Prevent express.json() Array-Length Bypass in Validation
**Vulnerability:** Missing strict type checks (`typeof input === 'string'`) before calling `.length` on `express.json()` API payload properties allowed potential array payloads to bypass string length validation, as the `length` of an array evaluates the number of elements instead of characters, leading to potential token exhaustion or DoS.
**Learning:** `express.json()` automatically parses valid JSON inputs into JavaScript primitives, objects, and arrays. When validating strings, always enforce type checks explicitly. Checking `input.length > 50` will permit an array of 49 strings of arbitrary size, defeating string-length constraints.
**Prevention:** Always check `typeof input === 'string'` before running length constraints on string inputs expected via `req.body` parsed by `express.json()`.
