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
## 2024-05-24 - Rate Limiting LRU OOM DoS and Global Flush Vulnerability
**Vulnerability:** The in-memory Express rate limiter was unbounded, leading to potential Out-Of-Memory (OOM) DoS attacks if an attacker spoofed many unique IP addresses. If an approach to bound the map involved clearing the entire map once full, it would introduce a "Global Flush" vulnerability, allowing attackers to intentionally fill the map and bypass rate limits for all users.
**Learning:** In Node.js, `Map` objects preserve insertion order, but updating an existing key with `.set()` does not update its position in the iterator. To create true Least Recently Used (LRU) behavior, you must explicitly `.delete()` the key before `.set()`ing it again. Additionally, `app.set('trust proxy', 1)` should be wrapped in a production environment check to prevent IP spoofing during local/direct exposure testing.
**Prevention:** Always bound in-memory maps using an eviction strategy (e.g., deleting `Map.keys().next().value`) rather than a full `.clear()`. When implementing LRU with native Maps, remember the delete-before-set pattern. Secure `trust proxy` configurations by ensuring they are only active behind actual reverse proxies in production.

## 2024-05-24 - [Fix XSS via Unsafe URL Protocols in Search Sources]
**Vulnerability:** The backend extracted URLs from external AI grounding responses (`chunk.web!.uri`) and directly passed them to the frontend to be rendered as `href` attributes in React `<a href={source.url}>`. Using `new URL()` to parse it did not prevent `javascript:` protocols, allowing a stored/reflected XSS if the external search service returned a malicious URL.
**Learning:** `new URL()` successfully parses valid URIs like `javascript:alert(1)`. Relying solely on `new URL()` for parsing without validating the `.protocol` property does not mitigate XSS when that URL is injected into DOM navigation elements (like `href`).
**Prevention:** Always explicitly validate that external user-supplied or AI-generated URLs strictly use safe protocols (e.g., `urlObj.protocol === 'http:' || urlObj.protocol === 'https:'`) before allowing them to be returned to the client or rendered.

## 2024-05-24 - [Add Timeouts to External API Calls to Prevent Resource Exhaustion]
**Vulnerability:** The application was making external network requests (e.g., to the Open-Meteo API) using native `fetch` without an explicit timeout mechanism. If the external server became unresponsive or hung indefinitely, the Node.js request handler would block, tying up memory and potentially exhausting server connections (a form of Denial of Service).
**Learning:** Native `fetch` in Node.js does not have a default timeout. It relies entirely on the operating system's TCP timeout, which can take several minutes. High-frequency API endpoints acting as proxies must actively bound their execution time when communicating with third parties.
**Prevention:** Always pair external network calls with an `AbortController` and `setTimeout` (or similar timeout mechanism) to actively abort the `fetch` request if it exceeds a safe threshold (e.g., 3000ms), ensuring the server fails quickly and resiliently.
