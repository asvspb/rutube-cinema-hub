# Auth REST API

Base URL: `/api/auth`

## Authentication Mechanism

This API uses a dual-token strategy:

- **Access Token**: Returned in the response body. Should be stored in memory. Used in `Authorization: Bearer <token>` header.
- **Refresh Token**: Sent via a secure, httpOnly cookie (`refreshToken`). Used automatically by the `/refresh` endpoint.

## Register

`POST /api/auth/register`

**Body**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 201**

- **Set-Cookie**: `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict`
- **Body**:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Login

`POST /api/auth/login`

**Body**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200**

- **Set-Cookie**: `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict`
- **Body**:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Logout

`POST /api/auth/logout`

**Headers**

```
Authorization: Bearer <jwt>
```

**Response 200**

- **Set-Cookie**: `refreshToken=; Max-Age=0`

```json
{ "status": "ok" }
```

## Current user

`GET /api/auth/me`

**Headers**

```
Authorization: Bearer <jwt>
```

**Response 200**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Refresh token

`POST /api/auth/refresh`

**Headers**

- Cookie: `refreshToken=<token>`

**Response 200**

- **Set-Cookie**: `refreshToken=<new_token>; HttpOnly; Secure; SameSite=Strict`
- **Body**:

```json
{
  "accessToken": "<new_jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Error responses

- `400` Invalid input (bad email or weak password)
- `401` Invalid or expired credentials
- `403` Refresh token rotation failure (re-login required)
- `409` Email already registered
- `500` Server configuration error
