# Auth REST API

Base URL: `/api/auth`

## Register

`POST /api/auth/register`

**Body**

```
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response 201**

```
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Login

`POST /api/auth/login`

**Body**

```
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response 200**

```
{
  "token": "<jwt>",
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

```
{ "status": "ok" }
```

## Current user

`GET /api/auth/me`

**Headers**

```
Authorization: Bearer <jwt>
```

**Response 200**

```
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

```
Authorization: Bearer <jwt>
```

**Response 200**

```
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Error responses

- `400` invalid input
- `401` invalid or missing credentials
- `409` email already registered
- `500` server/config error
