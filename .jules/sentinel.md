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

## 2024-05-24 - [Rate Limiting for LLM API Endpoints to Prevent Token Exhaustion DoS]
**Vulnerability:** The application's `/api/*` endpoints (such as `/api/recognize`, `/api/history`, `/api/weather`, etc.) were directly calling expensive backend external LLM APIs (like Gemini) without any request frequency controls. A malicious actor could easily trigger high-frequency concurrent requests to exhaust token quotas and cause a financial DoS.
**Learning:** Endpoints functioning as wrappers around LLMs are exceptionally high-risk for automated DoS due to the latency and cost of generative requests. Express payload size limits (`express.json({ limit: ... })`) protect memory but do not prevent request flooding.
**Prevention:** Always deploy an IP-based (or user-based) rate limiter middleware immediately upstream of external API integrations to strictly throttle the frequency of expensive resource consumption.

## 2024-05-24 - [Rate Limiter Bypass via Expensive Middleware Ordering]
**Vulnerability:** The IP-based rate limiter middleware was placed *after* the `express.json({ limit: '25mb' })` payload parser. An attacker could bypass the intended CPU protection by flooding the server with massive 25MB payloads. Node.js would buffer and parse these large payloads in memory *before* checking the rate limit, leading to trivial CPU and memory exhaustion (DoS).
**Learning:** Middleware execution order is critical for security. Security controls (like rate limiters and IP blocklists) must execute as early as possible in the request lifecycle. Placing them after expensive operations (like large body parsing, file uploads, or complex routing) renders them ineffective against resource exhaustion attacks.
**Prevention:** Always mount rate-limiting middleware *before* payload parsers (e.g., `express.json()`, `express.urlencoded()`, or `multer()`) to immediately reject abusive traffic before the server expends resources processing the request body.

## 2024-10-08 - [Bound Rate Limiter Map to Prevent OOM DoS]
**Vulnerability:** The `rateLimitMap` used for IP-based rate limiting in Express grew unboundedly. An attacker could intentionally fill the map by sending requests from spoofed IPs, leading to an Out-Of-Memory (OOM) Denial of Service (DoS) attack, or a Global Flush by clearing the entire map which circumvents the rate limiting.
**Learning:** In-memory stores, particularly those tracking IP addresses or user sessions, must be strictly bounded in size. If unbounded, they become a vector for memory exhaustion. Clearing an entire map as an eviction strategy is also dangerous because it resets rate limits for all users, enabling rate limit bypass. Evicting the oldest entry is a safer approach.
**Prevention:** Always bound the size of in-memory rate limiting maps (e.g., using `if (map.size >= MAX_SIZE) map.delete(map.keys().next().value)`). Additionally, ensure IP spoofing is prevented in production by securely configuring Express's `trust proxy` setting (e.g., `if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);`).
