## 2024-05-24 - [Avoid Leaking Internal Errors to Client via res.status(500)]
**Vulnerability:** The application was passing `error.message` from generic catch blocks directly to the client in HTTP 500 response bodies.
**Learning:** External SDKs, such as the Gemini AI SDK, may throw errors containing sensitive internal context, configuration specifics, or potentially API keys. Directly piping these errors to the user breaches secure error-handling boundaries by leaking implementation details.
**Prevention:** Always fail securely by catching all unexpected errors and returning a generic user-friendly safety message (e.g. "Failed to recognize landmark"). The actual raw error should be logged server-side for internal debugging purposes only.

## 2024-05-24 - [Targeted Express Payload Limits to Prevent DoS]
**Vulnerability:** A global `express.json({ limit: '25mb' })` middleware exposed all endpoints to payload-based Denial of Service (DoS) attacks, even those only requiring small payloads.
**Learning:** Broadly applying large payload limits for the convenience of a single endpoint (like image upload) compromises the security of the entire application API.
**Prevention:** Always apply large payload limits route-specifically (e.g., `app.use('/api/recognize', express.json({ limit: '25mb' }))`), and use a strict, small default limit (e.g., `100kb`) globally for all other routes to mitigate memory exhaustion risks.

## 2024-05-24 - [Fix Input Length Validation Bypass via Array Payloads]
**Vulnerability:** Input length validation on endpoints (`landmarkName`, `text`) was checking `.length` without first strictly verifying the input type. If a malicious client sent an array instead of a string, `.length` would evaluate the number of array elements instead of string characters, allowing massive string payloads within array elements to bypass the character limit and potentially cause memory exhaustion or API token limits.
**Learning:** In dynamically typed languages or when parsing JSON payloads in Express (via `express.json()`), input types can be easily manipulated by clients. Checking `.length` is ambiguous and insecure without type context.
**Prevention:** Always strictly verify the input type (e.g., `typeof val === 'string'`) before checking `.length` to ensure limits are applied to character counts rather than array elements.
