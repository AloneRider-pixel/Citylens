## 2024-05-24 - [Avoid Leaking Internal Errors to Client via res.status(500)]
**Vulnerability:** The application was passing `error.message` from generic catch blocks directly to the client in HTTP 500 response bodies.
**Learning:** External SDKs, such as the Gemini AI SDK, may throw errors containing sensitive internal context, configuration specifics, or potentially API keys. Directly piping these errors to the user breaches secure error-handling boundaries by leaking implementation details.
**Prevention:** Always fail securely by catching all unexpected errors and returning a generic user-friendly safety message (e.g. "Failed to recognize landmark"). The actual raw error should be logged server-side for internal debugging purposes only.

## 2024-05-24 - [Targeted Express Payload Limits to Prevent DoS]
**Vulnerability:** A global `express.json({ limit: '25mb' })` middleware exposed all endpoints to payload-based Denial of Service (DoS) attacks, even those only requiring small payloads.
**Learning:** Broadly applying large payload limits for the convenience of a single endpoint (like image upload) compromises the security of the entire application API.
**Prevention:** Always apply large payload limits route-specifically (e.g., `app.use('/api/recognize', express.json({ limit: '25mb' }))`), and use a strict, small default limit (e.g., `100kb`) globally for all other routes to mitigate memory exhaustion risks.
## 2026-09-25 - Prevent Array Bypass in express.json()
**Vulnerability:** Endpoints handling user input and passing it to Gemini AI SDK were missing strict type and length validation, relying solely on truthiness checks. Since the Express backend uses `express.json()`, an attacker could pass an array (e.g., `{"landmarkName": [1,2,3]}`). If a string length check was present, `[].length` evaluates the number of array items, bypassing character limits and allowing massive arrays to be sent to the AI SDK, causing token exhaustion and potential financial DoS.
**Learning:** When using `express.json()`, always validate the primitive type (`typeof input === 'string'`) before checking `.length`. Otherwise, array objects can bypass string length limits because arrays also have a `.length` property that works differently.
**Prevention:** Implement strict type checks (e.g., `typeof input === 'string'`) followed by explicit character limits (e.g., `input.length <= 200`) on all API inputs before passing them to external or AI services.
