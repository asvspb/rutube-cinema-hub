# Auth Implementation Plan (Extended)

> **Status:** 🔄 In Progress
> **Last Updated:** 2026-02-22
> **Priority:** Critical

## 1. Overview

This document outlines the robust authentication system for Rutube Cinema Hub, improving upon the initial specification with security best practices like Refresh Token Rotation and HTTP-only cookies.

### 1.1. Key Features

- 🔐 **JWT-based authentication** with dual-token strategy
- 🔄 **Automatic token rotation** for enhanced security
- 🍪 **HTTP-only secure cookies** for refresh tokens
- 📱 **Multi-device session management** with device tracking
- 🛡️ **Rate limiting** for brute-force protection
- 🔒 **Password strength validation** via Zod schemas
- 📊 **Session analytics** (device, IP, activity tracking)
- ⚡ **Token reuse detection** for security breach alerts

## 2. Architecture Enhancements

### 2.1. Token Strategy

- **Access Token (JWT):**
  - Lifetime: 15 minutes
  - Storage: Memory only (React state)
  - Transport: `Authorization: Bearer <token>` header
  - Payload: `{ userId, email, iat, exp, iss }`
- **Refresh Token (Database-backed):**
  - Lifetime: 7 days (configurable)
  - Storage: HTTP-only, Secure, SameSite=Strict cookie
  - Hashed in database using SHA-256
  - One-time use with automatic rotation
- **Rotation:**
  - Every refresh generates new token pair
  - Old refresh token immediately invalidated
  - Reuse detection triggers security alert

### 2.2. Session Metadata

Store comprehensive device and security information:

- `token`: SHA-256 hashed refresh token (unique identifier)
- `userAgent`: Browser/device identification
- `ip`: IP address for security auditing
- `lastUsedAt`: Track session activity
- `fingerprint`: Optional device fingerprint for additional security
- `name`: User-friendly session name (e.g., "Chrome on MacOS")

### 2.3. Security Features

- **Token Reuse Detection**: If a revoked token is used, invalidate all user sessions (potential breach)
- **Concurrent Session Limit**: Optional limit on active sessions per user
- **Geographic Anomaly Detection**: Optional alerts for logins from unusual locations
- **Session Management UI**: Users can view and revoke active sessions

## 3. Database Schema Updates (Prisma)

Enhanced schema with session metadata, fingerprinting, and security features:

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  isActive     Boolean   @default(true)
  isVerified   Boolean   @default(false)
  verifiedAt   DateTime?
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]

  @@index([email])
}

model Session {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String    @unique // SHA-256 hashed refresh token
  userAgent    String?
  ip           String?
  fingerprint  String?   // Optional device fingerprint
  name         String?   // User-friendly name (e.g., "Chrome on MacOS")
  createdAt    DateTime  @default(now())
  expiresAt    DateTime
  revokedAt    DateTime?
  lastUsedAt   DateTime  @default(now())

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([userId, revokedAt]) // For querying active sessions
}
```

## 4. Security Measures

### 4.1. Password Policy

- **Length**: Minimum 8 characters, recommended 12+
- **Complexity**:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (`!@#$%^&*()_+-=[]{}|;:,.<>?`)
- **Hashing**: `bcryptjs` with 12 salt rounds (configurable)
- **Validation**: Zod schema with custom refinements
- **Breach Detection**: Optional integration with HaveIBeenPwned API

### 4.2. API Protection

- **Rate Limiting:**
  - Login: 5 attempts per 15 minutes per IP (exponential backoff on failure)
  - Register: 3 accounts per hour per IP
  - Password Reset: 3 attempts per hour per IP
  - Refresh Token: 10 requests per minute per session
  - Token reuse detection: Immediate session termination
- **CORS:**
  - Restricted to whitelisted frontend domains
  - Credentials enabled for cookie support
  - Pre-flight caching for performance
- **Helmet:**
  - CSP with strict directives
  - HSTS enabled in production
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff

### 4.3. Additional Security Layers

- **CSRF Protection**: SameSite cookies + optional CSRF tokens for sensitive operations
- **Input Sanitization**: All inputs validated and sanitized via Zod
- **SQL Injection Protection**: Parameterized queries via Prisma
- **XSS Protection**: Content Security Policy + output encoding
- **Brute Force Protection**: Progressive delays + account lockout after repeated failures
- **Session Fixation Prevention**: New session ID on authentication
- **Secure Headers**: Full helmet.js configuration

## 5. Implementation Phases

### Phase 1: Backend Foundation ⚙️

**Dependencies:**

```bash
npm install jsonwebtoken bcryptjs cookie-parser @prisma/client
npm install -D @types/jsonwebtoken @types/bcryptjs @types/cookie-parser
```

**Tasks:**

1. [ ] Install and configure dependencies
2. [ ] Update Prisma schema with enhanced User and Session models
3. [ ] Run migrations: `npx prisma migrate dev --name add_auth_enhancements`
4. [ ] Initialize Prisma Client in `server/db/prismaClient.js`
5. [ ] Create `server/services/authService.js`:
   - `hashPassword(password)`: Bcrypt hashing
   - `comparePassword(password, hash)`: Verify password
   - `generateAccessToken(user)`: Create JWT access token
   - `generateRefreshToken()`: Create random refresh token
   - `hashToken(token)`: SHA-256 hash for database storage
   - `createSession(userId, refreshToken, metadata)`: Store session
   - `refreshSession(oldToken, metadata)`: Rotate tokens
   - `revokeSession(sessionId)`: Mark session as revoked
   - `revokeAllUserSessions(userId)`: Security breach response
   - `cleanupExpiredSessions()`: Maintenance cron job
6. [ ] Create `server/utils/tokenUtils.js`:
   - `parseUserAgent(ua)`: Extract browser/OS info
   - `generateSessionName(userAgent)`: Human-friendly names
   - `detectTokenReuse(session)`: Security alert logic

### Phase 2: API Routes & Middleware 🛣️

**Middleware:**

1. [ ] Create `server/middleware/authMiddleware.js`:
   - `authenticateToken`: Validates JWT from Authorization header
   - `optionalAuth`: Attach user if token present (for public/private content)
   - `requireAuth`: Strict authentication requirement
   - `requireVerified`: Require email verification
2. [ ] Create `server/middleware/rateLimitAuth.js`:
   - `loginLimiter`: 5/15min per IP
   - `registerLimiter`: 3/hour per IP
   - `refreshLimiter`: 10/min per session
   - `passwordResetLimiter`: 3/hour per IP

**Routes:**

1. [ ] Create `server/routes/auth.js`:
   - `POST /api/auth/register`: Create user + session + set cookies
   - `POST /api/auth/login`: Verify credentials + session + set cookies
   - `POST /api/auth/logout`: Revoke current session + clear cookies
   - `POST /api/auth/logout-all`: Revoke all user sessions
   - `POST /api/auth/refresh`: Rotate refresh token + return new access token
   - `GET /api/auth/me`: Return current user profile
   - `GET /api/auth/sessions`: List all active sessions
   - `DELETE /api/auth/sessions/:id`: Revoke specific session
   - `POST /api/auth/verify-email`: Email verification endpoint
   - `POST /api/auth/forgot-password`: Initiate password reset
   - `POST /api/auth/reset-password`: Complete password reset

2. [ ] Create validation schemas in `server/schemas/authSchemas.js`:
   - `registerSchema`: Email + password validation
   - `loginSchema`: Email + password
   - `refreshSchema`: Cookie validation
   - `passwordResetSchema`: Password strength checks

### Phase 3: Frontend Integration ⚛️

**Services:**

1. [ ] Create `src/services/authService.ts`:
   - `register(email, password)`: API wrapper
   - `login(email, password)`: API wrapper
   - `logout()`: Clear access token + API call
   - `logoutAll()`: Revoke all sessions
   - `refreshAccessToken()`: Silent refresh
   - `getCurrentUser()`: Fetch user profile
   - `getSessions()`: List active sessions
   - `revokeSession(sessionId)`: Remove specific session
   - `updatePassword(oldPassword, newPassword)`: Change password

**State Management:**

1. [ ] Create `src/contexts/AuthContext.tsx`:
   - Global auth state (user, loading, error)
   - Auto-refresh logic with interval
   - Token storage in memory
   - Logout cleanup

2. [ ] Create `src/hooks/useAuth.ts`:
   - `useAuth()`: Access auth context
   - `useRequireAuth()`: Redirect if not authenticated
   - `useOptionalAuth()`: Optional authentication

**HTTP Client:**

1. [ ] Configure Axios in `src/utils/axiosConfig.ts`:
   - Request interceptor: Add Authorization header
   - Response interceptor: Auto-refresh on 401
   - Retry logic with token refresh
   - Queue requests during refresh

**UI Components:**

1. [ ] Create `src/components/Auth/AuthModal.tsx`:
   - Login/Register tabs
   - Form validation with Zod
   - Error handling
   - Loading states
2. [ ] Create `src/components/Auth/SessionManager.tsx`:
   - List active sessions with device info
   - Revoke session buttons
   - Current session indicator

3. [ ] Create `src/components/Auth/PasswordStrength.tsx`:
   - Visual password strength meter
   - Real-time validation feedback

### Phase 4: Testing & Documentation 🧪

**Backend Tests:**

1. [ ] `tests/backend/auth-service.test.js`:
   - Password hashing/verification
   - Token generation/validation
   - Session CRUD operations
   - Token rotation logic
2. [ ] `tests/backend/auth-routes.test.js`:
   - Registration flow (success/error cases)
   - Login flow with rate limiting
   - Token refresh with rotation
   - Logout and session management
   - Token reuse detection

**Frontend Tests:**

1. [ ] `tests/frontend/authService.test.ts`:
   - API wrapper functions
   - Error handling
2. [ ] `tests/frontend/useAuth.test.ts`:
   - Context provider
   - Auto-refresh logic
   - State updates

3. [ ] `tests/frontend/AuthModal.test.tsx`:
   - Form validation
   - UI interactions
   - Error display

**E2E Tests:**

1. [ ] `tests/e2e/auth-flow.spec.ts`:
   - Complete registration → login → logout flow
   - Multi-device sessions
   - Token refresh during navigation
   - Session management UI

**Security Audit:**

1. [ ] Cookie settings verification (httpOnly, secure, sameSite)
2. [ ] Token expiration enforcement
3. [ ] Rate limiting effectiveness
4. [ ] CORS configuration
5. [ ] Password policy enforcement
6. [ ] SQL injection prevention
7. [ ] XSS protection via CSP

**Documentation:**

1. [ ] Update API documentation with examples
2. [ ] Create user guide for session management
3. [ ] Document security best practices
4. [ ] Add troubleshooting guide

## 6. API Reference (Complete)

| Method | Endpoint                    | Description                   | Auth           | Rate Limit |
| ------ | --------------------------- | ----------------------------- | -------------- | ---------- |
| POST   | `/api/auth/register`        | Create new account            | None           | 3/hour/IP  |
| POST   | `/api/auth/login`           | Sign in                       | None           | 5/15min/IP |
| POST   | `/api/auth/logout`          | Sign out (revoke session)     | Required       | -          |
| POST   | `/api/auth/logout-all`      | Revoke all user sessions      | Required       | -          |
| POST   | `/api/auth/refresh`         | Get new access token (rotate) | Refresh Cookie | 10/min     |
| GET    | `/api/auth/me`              | Get current user profile      | Required       | -          |
| GET    | `/api/auth/sessions`        | List all active sessions      | Required       | -          |
| DELETE | `/api/auth/sessions/:id`    | Revoke specific session       | Required       | -          |
| POST   | `/api/auth/verify-email`    | Verify email with token       | None           | 5/hour     |
| POST   | `/api/auth/forgot-password` | Request password reset        | None           | 3/hour/IP  |
| POST   | `/api/auth/reset-password`  | Complete password reset       | Reset Token    | 3/hour     |
| PATCH  | `/api/auth/password`        | Change password               | Required       | 3/hour     |

---

## 7. Configuration (.env)

```bash
# JWT Configuration
JWT_ACCESS_SECRET=generate_with_openssl_rand_base64_64
JWT_REFRESH_SECRET=generate_with_openssl_rand_base64_64
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=rutube-cinema-hub

# Password Hashing
BCRYPT_ROUNDS=12

# Session Management
SESSION_TTL_DAYS=7
MAX_SESSIONS_PER_USER=5  # Optional: limit concurrent sessions
SESSION_CLEANUP_INTERVAL=24h  # Cron schedule for cleanup

# Rate Limiting (Auth endpoints)
AUTH_LOGIN_RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS=5
AUTH_REGISTER_RATE_LIMIT_WINDOW_MS=3600000  # 1 hour
AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS=3
AUTH_REFRESH_RATE_LIMIT_WINDOW_MS=60000  # 1 minute
AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS=10

# Email Verification (Optional)
EMAIL_VERIFICATION_REQUIRED=false
EMAIL_VERIFICATION_TOKEN_EXPIRES_IN=24h

# Password Reset (Optional)
PASSWORD_RESET_TOKEN_EXPIRES_IN=1h

# Security
ENABLE_TOKEN_REUSE_DETECTION=true
ENABLE_BREACH_PASSWORD_CHECK=false  # HaveIBeenPwned integration

# Cookies
COOKIE_DOMAIN=localhost  # Change in production
COOKIE_SECURE=true  # Set false for local dev without HTTPS
COOKIE_SAME_SITE=strict

# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev
# DATABASE_URL="postgresql://user:password@host:5432/dbname"  # Production
```

### Environment-Specific Overrides

**Development (.env.development):**

```bash
COOKIE_SECURE=false
JWT_ACCESS_EXPIRES_IN=30m  # Longer for development
```

**Production (.env.production):**

```bash
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
ENABLE_TOKEN_REUSE_DETECTION=true
EMAIL_VERIFICATION_REQUIRED=true
```

---

## 8. Token Lifecycle Diagrams

### 8.1. Initial Authentication

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │                │ Server  │                │ Database │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │ POST /login              │                          │
     │ {email, password}        │                          │
     ├─────────────────────────>│                          │
     │                          │ Verify password          │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ Generate tokens          │
     │                          │ Create session           │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ Set-Cookie: refreshToken │                          │
     │ {accessToken, user}      │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ Store in memory          │                          │
     │                          │                          │
```

### 8.2. Token Refresh Flow

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │                │ Server  │                │ Database │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │ POST /refresh            │                          │
     │ Cookie: refreshToken     │                          │
     ├─────────────────────────>│                          │
     │                          │ Hash & verify token      │
     │                          ├─────────────────────────>│
     │                          │ <session data>           │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ Generate new tokens      │
     │                          │ Revoke old session       │
     │                          │ Create new session       │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ Set-Cookie: NEW token    │                          │
     │ {NEW accessToken, user}  │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
```

### 8.3. Token Reuse Detection

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │                │ Server  │                │ Database │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │ POST /refresh            │                          │
     │ Cookie: OLD token        │                          │
     ├─────────────────────────>│                          │
     │                          │ Hash & lookup token      │
     │                          ├─────────────────────────>│
     │                          │ <revokedAt: NOT NULL>    │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ ⚠️ SECURITY ALERT        │
     │                          │ Revoke ALL user sessions │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ 403 Forbidden            │                          │
     │ {error: "Token reuse"}   │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ Redirect to login        │                          │
     │                          │                          │
```

---

## 9. Error Handling

### 9.1. Error Codes

| Code | Message              | Description                              | Client Action            |
| ---- | -------------------- | ---------------------------------------- | ------------------------ |
| 400  | Invalid input        | Validation error (email/password format) | Show field errors        |
| 401  | Invalid credentials  | Wrong email/password combination         | Show error message       |
| 401  | Token expired        | Access token expired                     | Attempt refresh          |
| 403  | Token reuse detected | Security breach - old refresh token used | Force logout + alert     |
| 403  | Email not verified   | Account requires email verification      | Show verification UI     |
| 403  | Account disabled     | User account has been deactivated        | Contact support          |
| 409  | Email already exists | Registration with existing email         | Suggest login            |
| 429  | Too many requests    | Rate limit exceeded                      | Show retry timer         |
| 500  | Server error         | Internal server error                    | Retry or contact support |

### 9.2. Error Response Format

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": {
      "remainingAttempts": 3,
      "lockoutTime": null
    }
  }
}
```

---

## 10. Maintenance & Monitoring

### 10.1. Scheduled Tasks

**Session Cleanup (Daily):**

```javascript
// server/jobs/cleanupSessions.js
import cron from 'node-cron';
import { cleanupExpiredSessions } from './services/authService.js';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const deleted = await cleanupExpiredSessions();
  console.log(`Cleaned up ${deleted} expired sessions`);
});
```

### 10.2. Metrics to Track

- Active sessions per user
- Failed login attempts by IP
- Token refresh frequency
- Session duration distribution
- Geographic login patterns
- Token reuse incidents
- Password reset requests

### 10.3. Logging

**Security Events:**

- ✅ Successful logins (IP, user agent, timestamp)
- ❌ Failed login attempts (IP, attempted email)
- 🔄 Token refreshes
- ⚠️ Token reuse detection
- 🚫 Account lockouts
- 🔓 Password resets

---

## 11. Migration Strategy

### 11.1. Database Migration

```bash
# 1. Update schema.base.prisma with enhanced User and Session models
# 2. Regenerate schema for current environment
npm run generate:prisma

# 3. Create migration
npx prisma migrate dev --name enhance_auth_system

# 4. Apply to production (after testing!)
npx prisma migrate deploy
```

### 11.2. Backward Compatibility

- Existing sessions will be revoked on deployment
- Users will need to re-authenticate
- Consider sending notification emails before deployment

---

## 12. Future Enhancements

- [ ] **OAuth Integration**: Google, GitHub, Facebook login
- [ ] **Two-Factor Authentication (2FA)**: TOTP, SMS, Email codes
- [ ] **Passwordless Login**: Magic links via email
- [ ] **Biometric Authentication**: WebAuthn/FIDO2 support
- [ ] **Advanced Anomaly Detection**: ML-based suspicious activity detection
- [ ] **Session Transfer**: Move session between devices securely
- [ ] **Trusted Devices**: Remember devices for reduced 2FA prompts
- [ ] **API Keys**: Generate API keys for programmatic access
