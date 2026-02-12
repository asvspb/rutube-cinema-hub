# Proxy Security Implementation

## Overview

This document describes the security measures implemented for the `/api/proxy` and `/api/ai/*` endpoints to protect against unauthorized access and potential security vulnerabilities.

## Changes to Application Logic

### 1. Enhanced Security Middleware

- Added Helmet.js for security headers
- Implemented custom CORS with origin allowlist
- Added rate limiting for proxy and AI endpoints
- Created domain validation and IP filtering functions

### 2. Updated Dependencies

- Added `express-rate-limit` for rate limiting
- Added `helmet` for security headers
- Added `dns` module for hostname resolution

### 3. Modified Endpoint Behavior

- `/api/proxy` now validates target URLs against allowlist and private IP ranges
- `/api/ai/*` endpoints now have rate limiting applied
- Response codes expanded to include 403 (Forbidden) and 429 (Too Many Requests)

## Security Measures Implemented

### 1. Domain Allowlist

- Only specific domains are allowed for proxy requests
- Default allowed domains: `rutube.ru`, `*.rutube.ru`, `api.rutube.ru`
- Configurable via `ALLOWED_PROXY_DOMAINS` environment variable (comma-separated)

### 2. Private IP/Localhost Blocking

- Blocks requests to private IP ranges:
  - IPv4: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `0.0.0.0/8`
  - IPv6: `::1`, `fc00::/7`, `fe80::/10`
- Hostnames resolving to private IPs are blocked
- Includes DNS resolution check to prevent bypass attempts

### 3. Rate Limiting

- `/api/proxy` endpoint: 100 requests per 15 minutes (configurable)
- `/api/ai/*` endpoints: 50 requests per 15 minutes (configurable)
- Configurable via environment variables:
  - `PROXY_RATE_LIMIT_MAX_REQUESTS`
  - `PROXY_RATE_LIMIT_WINDOW_MS`
  - `AI_RATE_LIMIT_MAX_REQUESTS`
  - `AI_RATE_LIMIT_WINDOW_MS`

### 4. CORS Whitelist

- Restricts cross-origin requests to predefined origins
- Default allowed origins: `http://localhost:5173`, `http://localhost:4173`, `http://127.0.0.1:5173`, `http://127.0.0.1:4173`
- Configurable via `ALLOWED_ORIGINS` environment variable (comma-separated)

### 5. Security Headers

- Implements Helmet.js with security-focused headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - Content Security Policy with restricted sources
  - Referrer Policy set to `same-origin`

## Environment Variables

| Variable                        | Default                                                                                   | Description                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `ALLOWED_ORIGINS`               | `http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173` | Comma-separated list of allowed CORS origins         |
| `PROXY_RATE_LIMIT_WINDOW_MS`    | `900000` (15 min)                                                                         | Time window for proxy rate limiting                  |
| `PROXY_RATE_LIMIT_MAX_REQUESTS` | `100`                                                                                     | Max requests per window for proxy                    |
| `AI_RATE_LIMIT_WINDOW_MS`       | `900000` (15 min)                                                                         | Time window for AI rate limiting                     |
| `AI_RATE_LIMIT_MAX_REQUESTS`    | `50`                                                                                      | Max requests per window for AI endpoints             |
| `ALLOWED_PROXY_DOMAINS`         | `rutube.ru,*.rutube.ru,api.rutube.ru`                                                     | Comma-separated list of allowed proxy domains        |
| `PROXY_MAX_REDIRECTS`           | `5`                                                                                       | Max redirects allowed while validating proxy targets |

## Response Codes

- `403 Forbidden`: Requested domain is not in allowlist or resolves to private IP
- `429 Too Many Requests`: Rate limit exceeded
- `400 Bad Request`: Missing or invalid parameters
- `500 Internal Server Error`: Unexpected error during processing

## Validation Process

For each proxy request, the following validation occurs:

1. Parse the target URL
2. Block localhost and private IP literal targets
3. Check if the hostname is in the allowed domains list
4. Resolve the hostname to an IP address
5. Check if the resolved IP is a private IP address
6. Validate any redirect targets against the same rules
7. If all validations pass, proceed with the request

## Testing

Test files are located in the `tests/` directory:

- `tests/test-validation-functions.js` - Validates the security functions
- `tests/test-security.js` - Tests the security implementation

To run validation tests:

```
node tests/test-validation-functions.js
```

To verify the security measures:

1. Test with allowed domains (should succeed)
2. Test with external domains like `google.com` (should return 403)
3. Test with localhost/private IPs (should return 403)
4. Test rate limiting by exceeding request limits (should return 429)
5. Test CORS with unauthorized origins (should be blocked)
