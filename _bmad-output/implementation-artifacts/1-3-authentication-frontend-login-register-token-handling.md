# Story 1.3: Authentication Frontend — Login, Register & Token Handling

Status: review

## Story

As a visitor,
I want to register and log in through the website with seamless token management,
so that I can access my account and protected pages without manually managing tokens.

## Acceptance Criteria

1. **Registration Flow:** Given `/register` page, when visitor submits name, phone, and password, then account is created, access token stored in Zustand (memory only—never localStorage), user redirected to homepage as logged in
2. **Login Flow:** Given `/login` page, when valid credentials submitted, then access token stored in Zustand memory, httpOnly refresh cookie set by server, user redirected to intended destination (`?next=` param or `/`)
3. **Token Refresh (Auto):** Given active session with expired access token, when any API call returns HTTP 401, then client automatically attempts `POST /api/v1/auth/token/refresh/`; on success original request retried; on failure user redirected to `/login`
4. **Logout:** Given logged-in user triggering logout action, then `POST /api/v1/auth/logout/` called, Zustand auth store cleared, user redirected to `/login`
5. **Protected Routes:** Given unauthenticated user, when navigating to `/account/*` or `/admin/*` routes, then Next.js middleware immediately redirects to `/login`
6. **Error Display:** Given form submission errors (e.g., phone already exists, wrong password), when API returns error, then user-friendly inline message shown on relevant field—no `window.alert`

## Tasks / Subtasks

- [x] Task 1: Fix type interfaces (AC: all)
  - [x] UPDATE `frontend/src/types/user.ts` — replace current mismatched fields with backend-accurate interface:
    - `User`: `{ id: number; name: string; phone: string; is_staff: boolean }`
    - Remove `AuthTokens` (backend doesn't return this shape)
    - Add `LoginResponse`: `{ access_token: string }`
    - Add `RegisterResponse`: `{ id: number; name: string; phone: string }`
    - Add `ApiError`: `{ error: string; code: string; details: Record<string, string[]> }`

- [x] Task 2: Expand Zustand auth store (AC: #1, #2, #4)
  - [x] UPDATE `frontend/src/store/auth.ts`:
    - State: `accessToken: string | null`, `user: User | null`
    - Actions: `setAuth(token: string, user: User | null)`, `clearAuth()`, `isAuthenticated: () => boolean`
    - Never persist to localStorage — Zustand memory only (no `persist` middleware)

- [x] Task 3: Token refresh utility (AC: #3)
  - [x] UPDATE `frontend/src/lib/auth.ts`:
    - Export `refreshAccessToken(): Promise<string | null>`
    - Calls `POST /api/v1/auth/token/refresh/` with `credentials: 'include'` (cookie auto-sent)
    - Returns new `access_token` string on success, `null` on 401/error
    - This function must NOT import `apiFetch` from `lib/api.ts` (avoid circular import)

- [x] Task 4: Build API client with 401 retry (AC: #3)
  - [x] UPDATE `frontend/src/lib/api.ts`:
    - Keep existing `apiUrl()` helper and `API_BASE_URL`
    - Add `AUTH_ENDPOINTS` constants: `REGISTER`, `LOGIN`, `LOGOUT`, `REFRESH`
    - Add `apiFetch(path, options?, retry?)`:
      - Reads access token from `useAuthStore.getState().accessToken`
      - Sets `credentials: 'include'` and `Content-Type: application/json` on every request
      - Injects `Authorization: Bearer <token>` when token exists
      - On 401 and `retry=true`: calls `refreshAccessToken()` from `lib/auth.ts`; on success updates Zustand and retries once; on failure calls `clearAuth()` then `window.location.href = '/login'`
    - Add `logoutUser(): Promise<void>`: POSTs to `AUTH_ENDPOINTS.LOGOUT`, calls `clearAuth()`, sets `window.location.href = '/login'` — regardless of response status

- [x] Task 5: Install TanStack Query + Providers wrapper (AC: #1, #2)
  - [x] Run: `cd frontend && npm install @tanstack/react-query`
  - [x] CREATE `frontend/src/components/providers.tsx`:
    - `'use client'` directive
    - Wrap children in `QueryClientProvider` with a stable `QueryClient` instance
  - [x] UPDATE `frontend/src/app/layout.tsx`:
    - Import `<Providers>` and wrap `{children}` with it

- [x] Task 6: Middleware route protection (AC: #5)
  - [x] **READ NEXT.JS 16 DOCS FIRST:** `frontend/node_modules/next/dist/docs/` before writing middleware code
  - [x] UPDATE `frontend/src/middleware.ts`:
    - For `/account/*` and `/admin/*`: check `request.cookies.get('refresh_token')`
    - Missing cookie → `NextResponse.redirect(new URL('/login', request.url))`
    - Cookie present → `NextResponse.next()`
    - Admin `is_staff` check is client-side in `admin/layout.tsx` (Story 1-4) — middleware only checks auth presence

- [x] Task 7: Register form + page (AC: #1, #6)
  - [x] CREATE `frontend/src/components/features/auth/register-form.tsx`:
    - `'use client'` component
    - Form fields: name (text), phone (tel), password (password)
    - Use `useMutation` from TanStack Query; POST to `AUTH_ENDPOINTS.REGISTER` via `apiFetch`
    - On success: calls login after register (register returns no token), then `setAuth(loginData.access_token, {id, name, phone, is_staff: false})`, `router.push('/')`
    - On error `code: "phone_already_registered"` → inline error on phone field
    - On error `code: "validation_error"` → map `details` keys to per-field inline errors
    - On error `code: "rate_limit_exceeded"` → form-level error message
  - [x] CREATE `frontend/src/app/register/page.tsx`:
    - Server component (no `'use client'`)
    - Renders `<RegisterForm />`

- [x] Task 8: Login form + page (AC: #2, #6)
  - [x] CREATE `frontend/src/components/features/auth/login-form.tsx`:
    - `'use client'` component
    - Form fields: phone (tel), password (password)
    - Use `useMutation`; POST to `AUTH_ENDPOINTS.LOGIN` via `apiFetch`
    - On success: call `setAuth(data.access_token, null)`, redirect to `searchParams.get('next') || '/'`
    - On error `code: "invalid_credentials"` → inline error below password field
    - On error `code: "rate_limit_exceeded"` → form-level error
    - Link to `/register` for new users
  - [x] CREATE `frontend/src/app/login/page.tsx`:
    - Server component wrapping `<LoginForm />` in `<Suspense>` (required for `useSearchParams()`)
    - Renders `<LoginForm />`

- [x] Task 9: Tests
  - [x] Unit tests for `store/auth.ts`: `setAuth` stores token+user, `clearAuth` nulls both, `isAuthenticated` returns correct boolean
  - [x] Integration tests for `LoginForm`: submit valid → `setAuth` called with token; submit invalid → inline error displayed
  - [x] Integration tests for `RegisterForm`: submit valid → `setAuth` called; duplicate phone → field error shown
  - [x] Middleware test: request without cookie → redirect to `/login`; request with cookie → passes through
  - [x] Run: `cd frontend && npm test` — 17/17 tests pass across 4 test files

## Dev Notes

### ⚠️ MUST READ FIRST — Next.js 16 Breaking Changes

Before writing any Next.js code, read the guide in `frontend/node_modules/next/dist/docs/`. Next.js 16.2.4 has breaking changes vs training data. Specifically check:
- Middleware API (cookie access, redirect methods)
- App Router conventions (Server vs Client components, route groups)
- Font and metadata APIs in `layout.tsx`

---

### Critical Type Fixes Required

Current `frontend/src/types/user.ts` has **wrong field names** that don't match the backend:

```typescript
// CURRENT (WRONG — must fix in Task 1):
interface User { id: number; email: string; first_name: string; last_name: string; is_staff: boolean }
interface AuthTokens { access: string; refresh: string }

// CORRECT (backend returns this):
export interface User {
  id: number
  name: string
  phone: string
  is_staff: boolean
}
export interface LoginResponse { access_token: string }
export interface RegisterResponse { id: number; name: string; phone: string }
export interface ApiError { error: string; code: string; details: Record<string, string[]> }
```

---

### Backend API Contract (Story 1-2 — complete)

```
POST /api/v1/auth/register/
  Body:    { name: string, phone: string, password: string }
  201 OK:  { id: number, name: string, phone: string }         ← no access_token
  400 ERR: { error: string, code: "phone_already_registered"|"validation_error", details: {...} }
  429:     { error: string, code: "rate_limit_exceeded", details: {} }

POST /api/v1/auth/login/
  Body:    { phone: string, password: string }
  200 OK:  { access_token: string }  +  Set-Cookie: refresh_token (httpOnly, SameSite=Lax, 7d)
  401 ERR: { error: string, code: "invalid_credentials", details: {} }
  429:     { error: string, code: "rate_limit_exceeded", details: {} }

POST /api/v1/auth/token/refresh/
  (no body — reads refresh_token from httpOnly cookie automatically)
  200 OK:  { access_token: string }
  401 ERR: { error: string, code: "token_invalid"|"refresh_token_missing", details: {} }

POST /api/v1/auth/logout/
  Header:  Authorization: Bearer <access_token>
  200 OK:  {} + clears refresh_token cookie
```

**Note on register:** The register endpoint returns `{ id, name, phone }` — NOT an access_token. After successful registration, the frontend must immediately call login OR separately store that the user needs to log in. Check the epics AC: "account is created, access token stored in Zustand" — this implies a login call after register, OR the backend may need adjustment. Clarify by reading the actual backend view in `backend/accounts/views.py` before implementing.

---

### Token Storage Rules (Architecture AR4)

- **Access token:** Zustand memory ONLY — never `localStorage`, never any cookie
- **Refresh token:** httpOnly cookie, set by backend server — frontend NEVER reads it directly; browser auto-sends it on requests to the same origin
- `credentials: 'include'` is **mandatory** on every `fetch()` call — without it the refresh cookie is not transmitted

---

### Zustand Store Pattern

```typescript
// frontend/src/store/auth.ts
import { create } from 'zustand'
import { User } from '@/types/user'

interface AuthStore {
  accessToken: string | null
  user: User | null
  setAuth: (token: string, user: User | null) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  isAuthenticated: () => get().accessToken !== null,
}))
```

Current `store/auth.ts` has minimal shape — expand it; do NOT add `persist` middleware.

---

### API Client Pattern

```typescript
// frontend/src/lib/api.ts (expand existing file)
import { useAuthStore } from '@/store/auth'
import { refreshAccessToken } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`
export default API_BASE_URL

export const AUTH_ENDPOINTS = {
  REGISTER: '/api/v1/auth/register/',
  LOGIN: '/api/v1/auth/login/',
  LOGOUT: '/api/v1/auth/logout/',
  REFRESH: '/api/v1/auth/token/refresh/',
} as const

export async function apiFetch(path: string, options?: RequestInit, retry = true): Promise<Response> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      useAuthStore.getState().setAuth(newToken, useAuthStore.getState().user)
      return apiFetch(path, options, false)
    }
    useAuthStore.getState().clearAuth()
    window.location.href = '/login'
  }
  return res
}

export async function logoutUser(): Promise<void> {
  await apiFetch(AUTH_ENDPOINTS.LOGOUT, { method: 'POST' })
  useAuthStore.getState().clearAuth()
  window.location.href = '/login'
}
```

---

### Token Refresh Utility

```typescript
// frontend/src/lib/auth.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}
```

**Important:** Do NOT import `apiFetch` from `lib/api.ts` here — circular import (`api.ts` imports `auth.ts`, `auth.ts` cannot import `api.ts`). Use raw `fetch()` in this file only.

---

### Middleware Pattern (Edge Runtime)

Middleware runs on the Edge runtime — it cannot access Zustand (memory) or any Node.js APIs. The only auth signal available is the `refresh_token` httpOnly cookie.

```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
}
```

Admin `is_staff` enforcement is client-side in `admin/layout.tsx` (Story 1-4).

---

### Route Structure Clarification

`(account)` is a Next.js route **group** — it does NOT add to the URL path:
- `app/(account)/login/page.tsx` → URL `/login`
- `app/(account)/register/page.tsx` → URL `/register`

For this story, create login/register at:
- `app/login/page.tsx` → URL `/login` (simpler, avoids route group ambiguity)
- `app/register/page.tsx` → URL `/register`

Protected account pages (`/account/profile`, `/account/orders`) are in Story 1-4.

---

### Error Handling in Forms

Backend error shape:
```json
{ "error": "Validation failed", "code": "validation_error", "details": { "phone": ["Phone already registered"] } }
```

Pattern:
- `code: "phone_already_registered"` → show error next to phone field
- `code: "invalid_credentials"` → show error below password field  
- `code: "rate_limit_exceeded"` → show form-level banner "Too many attempts. Try again later."
- `code: "validation_error"` → map `details` object keys to field errors
- Never use `window.alert` — inline display only

---

### Files Being Modified — Current State

| File | Current State | Change |
|------|--------------|--------|
| `src/types/user.ts` | Wrong fields: `email`, `first_name`, `last_name`; wrong `AuthTokens` shape | Full rewrite to match backend |
| `src/store/auth.ts` | Only `accessToken` + `setAccessToken` | Expand with `user`, `setAuth`, `clearAuth`, `isAuthenticated` |
| `src/lib/auth.ts` | Empty (`export {}`) | Add `refreshAccessToken()` |
| `src/lib/api.ts` | Only `apiUrl()` helper | Add `apiFetch()`, `logoutUser()`, `AUTH_ENDPOINTS` |
| `src/middleware.ts` | Pass-through stub | Add cookie check + redirect |
| `src/app/layout.tsx` | No providers | Wrap children with `<Providers>` |

---

### Naming Conventions (Architecture)

| Context | Convention | Example |
|---------|------------|---------|
| Component files | `kebab-case.tsx` | `login-form.tsx` |
| Component names | `PascalCase` | `LoginForm` |
| API JSON keys | `snake_case` | `{ access_token, phone_number }` |
| TypeScript interfaces | `snake_case` fields | `interface User { is_staff: boolean }` |
| TypeScript variables | `camelCase` | `const accessToken = data.access_token` |

---

### Anti-Patterns (Do NOT)

- ❌ Store access token in `localStorage` (XSS risk — Architecture AR4)
- ❌ Store access token in any cookie (only server sets `refresh_token`)
- ❌ Call `fetch()` directly inside React components — use `apiFetch` or TanStack Query mutations
- ❌ Hardcode API URLs in components — use `AUTH_ENDPOINTS` constants from `lib/api.ts`
- ❌ Use camelCase JSON keys in API requests (`{ phoneNumber }` → `{ phone }`)
- ❌ Skip `credentials: 'include'` on any fetch call (breaks cookie transmission)
- ❌ Import `apiFetch` inside `lib/auth.ts` (circular dependency)

### Project Structure Notes

New files created:
- `frontend/src/app/login/page.tsx` — URL `/login`, public
- `frontend/src/app/register/page.tsx` — URL `/register`, public
- `frontend/src/components/features/auth/login-form.tsx`
- `frontend/src/components/features/auth/register-form.tsx`
- `frontend/src/components/providers.tsx` — TanStack Query provider

Files modified:
- `frontend/src/types/user.ts`
- `frontend/src/store/auth.ts`
- `frontend/src/lib/auth.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/middleware.ts`
- `frontend/src/app/layout.tsx`

All auth component logic in `src/components/features/auth/` — pages are thin shells only.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — user story and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Zustand, TanStack Query, token storage decisions
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — JWT, cookie, AR4 requirement
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Directory Structure] — file paths and component locations
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — anti-patterns, error handling, naming conventions
- [Source: _bmad-output/implementation-artifacts/1-2-user-registration-authentication-backend.md#Dev Notes] — exact API response shapes, cookie configuration, CookieTokenRefreshView behavior
- [Source: frontend/AGENTS.md] — Next.js 16.2.4 breaking changes warning

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Next.js 16 breaking change: `middleware` renamed to `proxy`. Warning appears on build but does not break functionality. Story spec targets `middleware.ts` so kept as-is; full migration to `proxy.ts` is a separate concern.
- Register endpoint returns `{id, name, phone}` — no access_token. Implemented auto-login after registration to satisfy AC #1 ("access token stored in Zustand").
- `LoginForm` uses `useSearchParams()` which requires `<Suspense>` boundary in Next.js App Router; added to `login/page.tsx`.
- No test framework was pre-configured; added Vitest + @testing-library/react + msw for API mocking.

### Completion Notes List

- All 9 tasks completed. 17/17 tests pass (4 test files: store unit, middleware unit, login form integration, register form integration).
- TypeScript build passes with zero errors.
- Key architecture decisions honored: access token in Zustand memory only, refresh token via httpOnly cookie, no localStorage, `credentials: 'include'` on all fetches, no circular imports between `lib/auth.ts` and `lib/api.ts`.
- Register flow auto-calls login after register since backend register endpoint returns no token.

### File List

**Modified:**
- `frontend/src/types/user.ts` — rewritten with `User`, `LoginResponse`, `RegisterResponse`, `ApiError`
- `frontend/src/store/auth.ts` — expanded with `user`, `setAuth`, `clearAuth`, `isAuthenticated`
- `frontend/src/lib/auth.ts` — implemented `refreshAccessToken()`
- `frontend/src/lib/api.ts` — added `AUTH_ENDPOINTS`, `apiFetch`, `logoutUser`
- `frontend/src/middleware.ts` — implemented refresh_token cookie check + redirect
- `frontend/src/app/layout.tsx` — wrapped children in `<Providers>`
- `frontend/package.json` — added `@tanstack/react-query`, Vitest, msw, testing libs; added `test` script

**Created:**
- `frontend/src/components/providers.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`
- `frontend/src/components/features/auth/login-form.tsx`
- `frontend/src/components/features/auth/register-form.tsx`
- `frontend/vitest.config.ts`
- `frontend/src/test/setup.ts`
- `frontend/src/test/auth-store.test.ts`
- `frontend/src/test/middleware.test.ts`
- `frontend/src/test/login-form.test.tsx`
- `frontend/src/test/register-form.test.tsx`

## Change Log

- 2026-05-05: Implemented Story 1.3 — Authentication Frontend (Login, Register & Token Handling). Fixed type interfaces, expanded Zustand store, added token refresh utility, built API client with 401 retry, installed TanStack Query with providers wrapper, implemented middleware route protection, created register and login forms with error handling, set up Vitest test suite with 17 passing tests.
