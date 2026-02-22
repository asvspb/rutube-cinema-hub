# Auth REST API

> **Version:** 1.0  
> **Base URL:** `/api/auth`  
> **Last Updated:** 2026-02-22

## Table of Contents

1. [Authentication Mechanism](#authentication-mechanism)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Session Management](#session-management)
4. [Password Management](#password-management)
5. [Error Responses](#error-responses)
6. [Rate Limiting](#rate-limiting)
7. [Security Headers](#security-headers)

---

## Authentication Mechanism

This API uses a **dual-token strategy** for enhanced security:

### Access Token (JWT)

- **Purpose**: Short-lived token for API authentication
- **Lifetime**: 15 minutes (configurable)
- **Storage**: Client memory only (React state, never localStorage)
- **Transport**: `Authorization: Bearer <token>` header
- **Payload Example**:
  ```json
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "iat": 1708606800,
    "exp": 1708607700,
    "iss": "rutube-cinema-hub"
  }
  ```

### Refresh Token

- **Purpose**: Long-lived token for obtaining new access tokens
- **Lifetime**: 7 days (configurable)
- **Storage**: HTTP-only, Secure, SameSite=Strict cookie
- **Database**: SHA-256 hashed token stored in Session table
- **Rotation**: One-time use - new token issued on every refresh
- **Security**: Token reuse detection triggers full session revocation

---

## Authentication Endpoints

### Register

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Rate Limit:** 3 requests per hour per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!"
}
```

**Validation Rules:**

- **Email**: Valid email format, unique in database
- **Password**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

**Success Response (201 Created):**

**Headers:**

```
Set-Cookie: refreshToken=<hashed_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/auth
```

**Body:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isVerified": false,
    "createdAt": "2026-02-22T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Error                 | Description                        |
| ---- | --------------------- | ---------------------------------- |
| 400  | `INVALID_EMAIL`       | Email format is invalid            |
| 400  | `WEAK_PASSWORD`       | Password doesn't meet requirements |
| 409  | `EMAIL_EXISTS`        | Email already registered           |
| 429  | `RATE_LIMIT_EXCEEDED` | Too many registration attempts     |

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd!"
  }'
```

---

### Login

Authenticate and create a new session.

**Endpoint:** `POST /api/auth/login`

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!"
}
```

**Success Response (200 OK):**

**Headers:**

```
Set-Cookie: refreshToken=<hashed_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/auth
```

**Body:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isVerified": true,
    "lastLoginAt": "2026-02-22T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Error                 | Description                            |
| ---- | --------------------- | -------------------------------------- |
| 401  | `INVALID_CREDENTIALS` | Email or password is incorrect         |
| 403  | `ACCOUNT_DISABLED`    | Account has been deactivated           |
| 403  | `EMAIL_NOT_VERIFIED`  | Email verification required (optional) |
| 429  | `RATE_LIMIT_EXCEEDED` | Too many login attempts                |

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd!"
  }'
```

---

### Refresh Token

Obtain a new access token using refresh token. **Old refresh token is invalidated.**

**Endpoint:** `POST /api/auth/refresh`

**Rate Limit:** 10 requests per minute per session

**Request Headers:**

```
Cookie: refreshToken=<token>
```

**Success Response (200 OK):**

**Headers:**

```
Set-Cookie: refreshToken=<new_hashed_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/auth
```

**Body:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isVerified": true
  }
}
```

**Error Responses:**

| Code | Error                 | Description                                                 |
| ---- | --------------------- | ----------------------------------------------------------- |
| 401  | `INVALID_TOKEN`       | Refresh token is missing or invalid                         |
| 401  | `TOKEN_EXPIRED`       | Refresh token has expired                                   |
| 403  | `TOKEN_REUSED`        | Token already used (security breach) - all sessions revoked |
| 429  | `RATE_LIMIT_EXCEEDED` | Too many refresh attempts                                   |

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

---

### Logout

Revoke current session and clear refresh token cookie.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required (Access Token)

**Request Headers:**

```
Authorization: Bearer <access_token>
Cookie: refreshToken=<token>
```

**Success Response (200 OK):**

**Headers:**

```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth
```

**Body:**

```json
{
  "message": "Logged out successfully"
}
```

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt
```

---

### Logout All Devices

Revoke all active sessions for the current user.

**Endpoint:** `POST /api/auth/logout-all`

**Authentication:** Required (Access Token)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**

```json
{
  "message": "All sessions revoked successfully",
  "revokedCount": 3
}
```

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/logout-all \
  -H "Authorization: Bearer <access_token>"
```

---

### Get Current User

Retrieve authenticated user profile.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (Access Token)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isVerified": true,
    "isActive": true,
    "lastLoginAt": "2026-02-22T12:00:00.000Z",
    "createdAt": "2026-01-15T08:30:00.000Z",
    "updatedAt": "2026-02-22T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Error           | Description                     |
| ---- | --------------- | ------------------------------- |
| 401  | `UNAUTHORIZED`  | Access token missing or invalid |
| 401  | `TOKEN_EXPIRED` | Access token has expired        |

**Example:**

```bash
curl -X GET https://api.example.com/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

---

## Session Management

### List All Sessions

Get all active sessions for the current user.

**Endpoint:** `GET /api/auth/sessions`

**Authentication:** Required (Access Token)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**

```json
{
  "sessions": [
    {
      "id": "session-uuid-1",
      "name": "Chrome on MacOS",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
      "ip": "192.168.1.100",
      "isCurrent": true,
      "createdAt": "2026-02-22T12:00:00.000Z",
      "lastUsedAt": "2026-02-22T14:30:00.000Z",
      "expiresAt": "2026-03-01T12:00:00.000Z"
    },
    {
      "id": "session-uuid-2",
      "name": "Firefox on Windows",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "ip": "192.168.1.101",
      "isCurrent": false,
      "createdAt": "2026-02-20T09:15:00.000Z",
      "lastUsedAt": "2026-02-21T18:45:00.000Z",
      "expiresAt": "2026-02-27T09:15:00.000Z"
    }
  ],
  "total": 2
}
```

**Example:**

```bash
curl -X GET https://api.example.com/api/auth/sessions \
  -H "Authorization: Bearer <access_token>"
```

---

### Revoke Specific Session

Revoke a specific session by ID.

**Endpoint:** `DELETE /api/auth/sessions/:sessionId`

**Authentication:** Required (Access Token)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**URL Parameters:**

- `sessionId`: UUID of the session to revoke

**Success Response (200 OK):**

```json
{
  "message": "Session revoked successfully",
  "sessionId": "session-uuid-2"
}
```

**Error Responses:**

| Code | Error                   | Description                                    |
| ---- | ----------------------- | ---------------------------------------------- |
| 403  | `CANNOT_REVOKE_CURRENT` | Cannot revoke current session (use logout)     |
| 404  | `SESSION_NOT_FOUND`     | Session ID not found or doesn't belong to user |

**Example:**

```bash
curl -X DELETE https://api.example.com/api/auth/sessions/session-uuid-2 \
  -H "Authorization: Bearer <access_token>"
```

---

## Password Management

### Change Password

Update password for authenticated user.

**Endpoint:** `PATCH /api/auth/password`

**Authentication:** Required (Access Token)

**Rate Limit:** 3 requests per hour per user

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "oldPassword": "SecureP@ssw0rd!",
  "newPassword": "NewSecureP@ssw0rd123!"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Password updated successfully"
}
```

**Note:** All sessions except the current one are revoked after password change.

**Error Responses:**

| Code | Error                  | Description                            |
| ---- | ---------------------- | -------------------------------------- |
| 400  | `WEAK_PASSWORD`        | New password doesn't meet requirements |
| 401  | `INVALID_OLD_PASSWORD` | Current password is incorrect          |
| 429  | `RATE_LIMIT_EXCEEDED`  | Too many password change attempts      |

**Example:**

```bash
curl -X PATCH https://api.example.com/api/auth/password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "SecureP@ssw0rd!",
    "newPassword": "NewSecureP@ssw0rd123!"
  }'
```

---

### Request Password Reset

Initiate password reset flow (sends email with reset token).

**Endpoint:** `POST /api/auth/forgot-password`

**Rate Limit:** 3 requests per hour per IP

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** Response is intentionally vague to prevent email enumeration attacks.

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

### Reset Password

Complete password reset with token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Rate Limit:** 3 requests per hour per IP

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecureP@ssw0rd123!"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Password reset successfully"
}
```

**Note:** All user sessions are revoked after password reset.

**Error Responses:**

| Code | Error                 | Description                            |
| ---- | --------------------- | -------------------------------------- |
| 400  | `WEAK_PASSWORD`       | New password doesn't meet requirements |
| 401  | `INVALID_TOKEN`       | Reset token is invalid or expired      |
| 429  | `RATE_LIMIT_EXCEEDED` | Too many reset attempts                |

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "NewSecureP@ssw0rd123!"
  }'
```

---

### Verify Email (Optional)

Verify email address with token from verification email.

**Endpoint:** `POST /api/auth/verify-email`

**Rate Limit:** 5 requests per hour per IP

**Request Body:**

```json
{
  "token": "verification-token-from-email"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**

| Code | Error              | Description                              |
| ---- | ------------------ | ---------------------------------------- |
| 401  | `INVALID_TOKEN`    | Verification token is invalid or expired |
| 409  | `ALREADY_VERIFIED` | Email is already verified                |

**Example:**

```bash
curl -X POST https://api.example.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "verification-token-from-email"}'
```

---

## Error Responses

### Standard Error Format

All errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context (optional)"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning               | Common Causes                                      |
| ---- | --------------------- | -------------------------------------------------- |
| 400  | Bad Request           | Invalid input, validation errors                   |
| 401  | Unauthorized          | Missing or invalid access token, wrong credentials |
| 403  | Forbidden             | Token reuse, account disabled, email not verified  |
| 404  | Not Found             | Resource doesn't exist                             |
| 409  | Conflict              | Email already registered                           |
| 429  | Too Many Requests     | Rate limit exceeded                                |
| 500  | Internal Server Error | Server configuration error                         |

### Common Error Codes

| Error Code              | HTTP Status | Description                                      |
| ----------------------- | ----------- | ------------------------------------------------ |
| `INVALID_EMAIL`         | 400         | Email format is invalid                          |
| `WEAK_PASSWORD`         | 400         | Password doesn't meet security requirements      |
| `INVALID_CREDENTIALS`   | 401         | Email or password is incorrect                   |
| `UNAUTHORIZED`          | 401         | Access token missing or invalid                  |
| `TOKEN_EXPIRED`         | 401         | Token has expired                                |
| `INVALID_TOKEN`         | 401         | Token is malformed or invalid                    |
| `TOKEN_REUSED`          | 403         | Refresh token was already used (security breach) |
| `ACCOUNT_DISABLED`      | 403         | User account has been deactivated                |
| `EMAIL_NOT_VERIFIED`    | 403         | Email verification required                      |
| `CANNOT_REVOKE_CURRENT` | 403         | Cannot revoke current session                    |
| `SESSION_NOT_FOUND`     | 404         | Session ID not found                             |
| `EMAIL_EXISTS`          | 409         | Email already registered                         |
| `ALREADY_VERIFIED`      | 409         | Email is already verified                        |
| `RATE_LIMIT_EXCEEDED`   | 429         | Too many requests                                |
| `SERVER_ERROR`          | 500         | Internal server error                            |

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1708607700
```

### Rate Limit Response

When rate limit is exceeded (429 Too Many Requests):

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "retryAfter": 120,
      "limit": 5,
      "window": "15 minutes"
    }
  }
}
```

### Endpoint-Specific Limits

| Endpoint                | Limit       | Window               |
| ----------------------- | ----------- | -------------------- |
| `POST /register`        | 3 requests  | 1 hour per IP        |
| `POST /login`           | 5 requests  | 15 minutes per IP    |
| `POST /refresh`         | 10 requests | 1 minute per session |
| `POST /forgot-password` | 3 requests  | 1 hour per IP        |
| `POST /reset-password`  | 3 requests  | 1 hour per IP        |
| `POST /verify-email`    | 5 requests  | 1 hour per IP        |
| `PATCH /password`       | 3 requests  | 1 hour per user      |

---

## Security Headers

### Required Request Headers

**Authentication Required:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Session Operations:**

```
Cookie: refreshToken=<token>
```

### Response Security Headers

All responses include security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: same-origin
```

### Cookie Attributes

Refresh token cookies include:

```
HttpOnly: Prevents JavaScript access
Secure: HTTPS only (production)
SameSite=Strict: CSRF protection
Max-Age: 604800 (7 days)
Path: /api/auth
```

---

## Client Implementation Examples

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  withCredentials: true, // Include cookies
});

// Request interceptor: Add access token
api.interceptors.request.use(config => {
  const token = getAccessToken(); // From memory/state
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Auto-refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          {
            withCredentials: true,
          }
        );

        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Usage
async function login(email: string, password: string) {
  const { data } = await api.post('/api/auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}
```

### React Hook Example

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-refresh every 14 minutes
  useEffect(() => {
    const interval = setInterval(
      async () => {
        try {
          const { data } = await api.post('/api/auth/refresh');
          setAccessToken(data.accessToken);
          setUser(data.user);
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      },
      14 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setAccessToken(null);
    setUser(null);
  }, []);

  return { user, accessToken, loading, login, logout };
}
```

---

## Testing Examples

### cURL Examples

**Complete Flow:**

```bash
# 1. Register
curl -X POST https://api.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "test@example.com", "password": "SecureP@ssw0rd!"}'

# 2. Login
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "test@example.com", "password": "SecureP@ssw0rd!"}' \
  | jq -r '.accessToken' > token.txt

# 3. Get current user
curl -X GET https://api.example.com/api/auth/me \
  -H "Authorization: Bearer $(cat token.txt)"

# 4. Refresh token
curl -X POST https://api.example.com/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# 5. Logout
curl -X POST https://api.example.com/api/auth/logout \
  -H "Authorization: Bearer $(cat token.txt)" \
  -b cookies.txt
```

---

## Changelog

### Version 1.0 (2026-02-22)

- ✨ Initial API specification
- 🔐 Dual-token authentication strategy
- 🔄 Token rotation with reuse detection
- 📱 Multi-device session management
- 🔒 Comprehensive password management
- 🛡️ Rate limiting on all endpoints
- 📊 Detailed error handling
- 📝 Complete documentation with examples
