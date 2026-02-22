# Auth Implementation Plan (Extended)

> **Status:** 🔄 In Progress
> **Last Updated:** 2026-02-21
> **Priority:** Critical

## 1. Overview

This document outlines the robust authentication system for Rutube Cinema Hub, improving upon the initial specification with security best practices like Refresh Token Rotation and HTTP-only cookies.

## 2. Architecture Enhancements

### 2.1. Token Strategy

- **Access Token (JWT):** Short-lived (15 minutes). Stored in memory on the frontend.
- **Refresh Token (Database-backed):** Long-lived (7 days). Stored in an `httpOnly`, `secure`, `sameSite: strict` cookie.
- **Rotation:** Every time a refresh token is used, a new one is issued, and the old one is revoked.

### 2.2. Session Metadata

Store device information to allow users to manage their active sessions:

- `userAgent`: To identify the browser/device.
- `ip`: For security auditing.
- `lastUsedAt`: To track activity.

## 3. Database Schema Updates (Prisma)

The current schema is good, but we will ensure `Session` supports rotation and metadata.

```prisma
model Session {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  token        String    @unique // Hashed refresh token
  userAgent    String?
  ip           String?
  createdAt    DateTime  @default(now())
  expiresAt    DateTime
  revokedAt    DateTime?
  lastUsedAt   DateTime  @default(now())

  @@index([userId])
  @@index([token])
}
```

## 4. Security Measures

### 4.1. Password Policy

- Minimum 8 characters.
- Must include at least one number and one special character (validation via Zod).
- Hashing: `bcryptjs` with 10-12 salt rounds.

### 4.2. API Protection

- **Rate Limiting:**
  - Login: 5 attempts per 15 minutes per IP.
  - Register: 3 accounts per hour per IP.
- **CORS:** Restricted to the frontend domain.
- **Helmet:** Properly configured headers.

## 5. Implementation Phases

### Phase 1: Backend Foundation

1. [ ] Install dependencies (`jsonwebtoken`, `bcryptjs`, `cookie-parser`).
2. [ ] Initialize Prisma Client in `server/db/prismaClient.js`.
3. [ ] Create `authService.js` with:
   - Password hashing/comparison.
   - JWT generation (Access & Refresh).
   - Session management (Create, Refresh, Revoke).

### Phase 2: API Routes & Middleware

1. [ ] Implement `authMiddleware.js`:
   - `authenticateToken`: Validates Access Token.
   - `optionalAuth`: Attach user to request if token is present.
2. [ ] Implement `authRouter.js`:
   - `POST /register`: Create user + session + set cookies.
   - `POST /login`: Verify user + session + set cookies.
   - `POST /refresh`: Verify refresh token + rotate + set new cookies.
   - `POST /logout`: Revoke session + clear cookies.
   - `GET /me`: Return current user data.

### Phase 3: Frontend Integration

1. [ ] Create `src/services/authService.ts` (API wrapper).
2. [ ] Create `src/hooks/useAuth.ts` (State management with React Context/State).
3. [ ] Implement `AuthModal.tsx` for UI.
4. [ ] Setup Axios Interceptors for token refresh logic.

### Phase 4: Testing & Documentation

1. [ ] Backend: Integration tests for all auth flows.
2. [ ] Frontend: Unit tests for hook and service.
3. [ ] Security: Manual audit of cookie settings and token expiration.

## 6. API Reference (Updated)

| Method | Endpoint             | Description               | Auth           |
| ------ | -------------------- | ------------------------- | -------------- |
| POST   | `/api/auth/register` | Create account            | None           |
| POST   | `/api/auth/login`    | Sign in                   | None           |
| POST   | `/api/auth/logout`   | Sign out (Revoke session) | Required       |
| POST   | `/api/auth/refresh`  | Get new Access Token      | Refresh Cookie |
| GET    | `/api/auth/me`       | Get current user info     | Required       |

---

## 7. Configuration (.env)

```bash
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
