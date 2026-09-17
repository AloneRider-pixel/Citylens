# Security Policy

Report suspected vulnerabilities privately through GitHub's security reporting mechanism when available. Include the affected endpoint or component, reproducible steps, and sanitized evidence. Never publish API keys or other credentials.

Production deployments should add strict request validation, authentication and rate limiting before exposing the image-recognition endpoint at scale. The Gemini credential remains server-side and is not intended for browser exposure.
