## 2024-05-24 - [Avoid Leaking Internal Errors to Client via res.status(500)]
**Vulnerability:** The application was passing `error.message` from generic catch blocks directly to the client in HTTP 500 response bodies.
**Learning:** External SDKs, such as the Gemini AI SDK, may throw errors containing sensitive internal context, configuration specifics, or potentially API keys. Directly piping these errors to the user breaches secure error-handling boundaries by leaking implementation details.
**Prevention:** Always fail securely by catching all unexpected errors and returning a generic user-friendly safety message (e.g. "Failed to recognize landmark"). The actual raw error should be logged server-side for internal debugging purposes only.

## 2024-05-24 - [Targeted Express Payload Limits to Prevent DoS]
**Vulnerability:** A global `express.json({ limit: '25mb' })` middleware exposed all endpoints to payload-based Denial of Service (DoS) attacks, even those only requiring small payloads.
**Learning:** Broadly applying large payload limits for the convenience of a single endpoint (like image upload) compromises the security of the entire application API.
**Prevention:** Always apply large payload limits route-specifically (e.g., `app.use('/api/recognize', express.json({ limit: '25mb' }))`), and use a strict, small default limit (e.g., `100kb`) globally for all other routes to mitigate memory exhaustion risks.

## 2024-05-24 - [Enforce Explicit Type and Length Checks to Prevent express.json() Bypasses]
**Vulnerability:** Endpoints handling generation (e.g., Gemini prompts) lacked explicit string length validation on `req.body` parameters, making them vulnerable to token exhaustion or DoS via very large inputs. Furthermore, simply checking `.length` is insufficient when using `express.json()`, because array payloads pass the check by having a small element count (e.g., `['huge string'].length === 1`), bypassing string length limits.
**Learning:** `express.json()` parses inputs into their original JSON types. If you expect a string, checking `.length` on an array returns the number of elements, completely circumventing string character length limits and allowing massive payload injection to backend APIs.
**Prevention:** Always explicitly check type before checking length (e.g., `typeof input === 'string' && input.length <= MAX_LENGTH`) on all dynamically generated endpoints processing user data.
## 2026-09-29 - [Missing Rate Limiting on API Endpoints]
**Vulnerability:** The Express.js backend was exposing public API routes (like `/api/recognize` which uses the Gemini AI model) without any rate limiting logic. This made the application vulnerable to basic Application-level Denial of Service (DoS) and brute force attacks that could cause resource exhaustion or API quota exhaustion.
**Learning:** Even internal endpoints or those not tied to user accounts should have a baseline rate limiter applied to prevent untrusted sources from hammering expensive integrations.
**Prevention:** Implement a basic in-memory rate limiter per IP, or an established rate-limiting middleware, early in the request lifecycle for all `/api` endpoints.
