# Auth Database Schema (Prisma)

This project uses Prisma migrations with SQLite for local development and PostgreSQL in production.

## 1) Schema

The auth schema lives in `prisma/schema.prisma` and includes:

- `User` (email + password hash)
- `Session` (server-side session records to support JWT revocation)

## 2) Local dev (SQLite)

Set `DATABASE_URL` in `.env`:

```
DATABASE_URL="file:./dev.db"
```

Then apply migrations:

```
npm install
npx prisma generate
npx prisma migrate dev --name init-auth
```

## 3) Production (PostgreSQL)

Set `DATABASE_URL` in your production environment, for example:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Apply migrations:

```
npx prisma generate
npx prisma migrate deploy
```

## 4) Notes

- JWT tokens are short-lived and tied to a `Session` record.
- When you log out, the session is revoked (`revokedAt`).
- Sessions also expire automatically via `expiresAt`.

