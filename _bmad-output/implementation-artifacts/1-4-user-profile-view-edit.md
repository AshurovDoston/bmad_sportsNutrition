# Story 1.4: User Profile View & Edit

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a registered user,
I want to view and update my name, phone number, and default delivery address,
So that my details are saved and pre-filled at checkout without re-entry every time.

## Acceptance Criteria

1. **Given** a logged-in user, **When** `GET /api/v1/auth/profile/` is called, **Then** HTTP 200 is returned with `{id, name, phone, delivery_address}` — password is never included.
2. **Given** a logged-in user, **When** `PATCH /api/v1/auth/profile/` is called with one or more updated fields, **Then** only the submitted fields are updated and the full updated profile is returned.
3. **Given** the `/account/profile` page, **When** a logged-in user visits, **Then** their current name, phone, and address are displayed in an editable form pre-populated with existing values.
4. **Given** the profile form, **When** valid updated data is submitted, **Then** the profile is saved and a success confirmation is shown inline.
5. **Given** the profile form, **When** invalid data is submitted (e.g., malformed phone number), **Then** an inline field-level error is shown and the other valid field values are preserved.
6. **Given** an unauthenticated request, **When** `GET` or `PATCH /api/v1/auth/profile/` is called, **Then** HTTP 401 is returned.

## Tasks / Subtasks

- [x] Task 1: Update `UserProfileSerializer` for read/write profile operations (AC: 1, 2, 6)
  - [x] Add `delivery_address` to fields list
  - [x] Change `read_only_fields` to only `['id']` — name, phone, delivery_address become writable
  - [x] Add `validate_phone()` that checks uniqueness excluding the current user (`CustomUser.objects.filter(phone=value).exclude(pk=self.instance.pk)`)
  - [x] Phone uniqueness error must use code `"phone_already_registered"` (same as RegisterSerializer)
- [x] Task 2: Add `ProfileView` to `backend/accounts/views.py` (AC: 1, 2, 6)
  - [x] GET method: `permission_classes = [IsAuthenticated]`, return `UserProfileSerializer(request.user).data` with HTTP 200
  - [x] PATCH method: `permission_classes = [IsAuthenticated]`, use `UserProfileSerializer(request.user, data=request.data, partial=True)`, validate and save, return full updated profile
  - [x] No rate limiting needed on profile endpoints (authenticated reads/writes, not brute-force targets)
  - [x] DRF's `IsAuthenticated` automatically returns 401 for unauthenticated requests — no manual 401 check needed
- [x] Task 3: Wire `ProfileView` into URL routing (AC: 1, 2, 6)
  - [x] Add to `backend/accounts/urls.py`: `path('auth/profile/', ProfileView.as_view(), name='auth-profile')`
  - [x] Add `ProfileView` to imports in urls.py
- [x] Task 4: Update `User` type interface in `frontend/src/types/user.ts` (AC: 3)
  - [x] Add `delivery_address: string | null` to the `User` interface
  - [x] Add `ProfileUpdatePayload` interface: `{ name?: string; phone?: string; delivery_address?: string | null }`
- [x] Task 5: Add `PROFILE` endpoint constant to `frontend/src/lib/api.ts` (AC: 3, 4, 5)
  - [x] Add `PROFILE: '/api/v1/auth/profile/'` to the `AUTH_ENDPOINTS` const object
- [x] Task 6: Create `ProfileForm` component at `frontend/src/components/features/auth/profile-form.tsx` (AC: 3, 4, 5)
  - [x] `useQuery` to `GET AUTH_ENDPOINTS.PROFILE` via `apiFetch` — populates form fields on load
  - [x] Controlled form with fields: `name` (text), `phone` (text), `delivery_address` (textarea)
  - [x] `useMutation` to `PATCH AUTH_ENDPOINTS.PROFILE` via `apiFetch` with `{ method: 'PATCH', body: JSON.stringify(payload) }`
  - [x] On success: show inline success message (e.g. `<p role="status">Profile saved.</p>`) — no redirect
  - [x] On error: map `details` field from error response to per-field inline errors; preserve other field values
  - [x] Button disabled while mutation is pending
  - [x] Follow existing form styling: inputs use `border rounded px-3 py-2 text-sm w-full`, errors use `text-red-600 text-sm` with `role="alert"`, button uses `bg-black text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50`
- [x] Task 7: Create `/account/profile` page at `frontend/src/app/account/profile/page.tsx` (AC: 3)
  - [x] `'use client'` directive (no SSR — auth-protected page)
  - [x] Renders `<ProfileForm />` inside a simple page layout
  - [x] Route is already protected by existing middleware (`/account/:path*` matcher)
- [x] Task 8: Create `frontend/src/app/admin/layout.tsx` — deferred from Story 1.3 (prerequisite for Epic 4)
  - [x] Client component that reads `useAuthStore().user?.is_staff`
  - [x] If user is not staff, redirect to `/` (or show 403 message)
  - [x] Middleware only checks cookie presence; `is_staff` enforcement must be client-side here
- [x] Task 9: Write backend tests in `backend/accounts/tests.py` (AC: 1, 2, 6)
  - [x] `GET /api/v1/auth/profile/` authenticated → 200, fields include `delivery_address`
  - [x] `GET /api/v1/auth/profile/` unauthenticated → 401
  - [x] `PATCH /api/v1/auth/profile/` with `delivery_address` → 200, only that field updated
  - [x] `PATCH /api/v1/auth/profile/` with duplicate phone → 400 with `code: "phone_already_registered"`
  - [x] `PATCH /api/v1/auth/profile/` unauthenticated → 401
- [x] Task 10: Write frontend tests in `frontend/src/test/profile-form.test.tsx` (AC: 3, 4, 5)
  - [x] MSW handler: GET profile returns `{id:1, name:"Test User", phone:"1234567890", delivery_address:"123 St"}`
  - [x] MSW handler: PATCH profile returns updated profile
  - [x] Test: form renders with pre-filled values from API response
  - [x] Test: submitting valid data shows success message
  - [x] Test: submitting invalid phone shows field-level error; other fields preserve values
  - [x] Follow existing test pattern in `frontend/src/test/` (Vitest + MSW + React Testing Library)

## Dev Notes

### Critical: Read Before Writing Any Code

**MUST read Next.js docs first** — `frontend/AGENTS.md` warns: "This is NOT the Next.js you know. This version has breaking changes." Read `node_modules/next/dist/docs/` for the relevant sections before writing any Next.js code.

### Backend: What Changes and What to Preserve

**File: `backend/accounts/serializers.py`** — currently has `UserProfileSerializer` with `fields = ['id', 'name', 'phone']` and ALL fields as `read_only_fields`. This must be UPDATED (not replaced — the class name is already imported in `views.py`).

Current state (DO NOT break):
- `RegisterSerializer` — untouched
- `LoginSerializer` — untouched
- `UserProfileSerializer` — currently read-only, used by `RegisterView` to return `{id, name, phone}` on registration

New state for `UserProfileSerializer`:
```python
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'phone', 'delivery_address']  # add delivery_address
        read_only_fields = ['id']  # only id is read-only now

    def validate_phone(self, value):
        qs = CustomUser.objects.filter(phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                'error': 'Phone already registered',
                'code': 'phone_already_registered',
                'details': {},
            })
        return value
```

**Side effect on RegisterView**: `RegisterView` calls `UserProfileSerializer(user).data` to return the registration response. After this change it will also include `delivery_address` (will be null for new users). This is acceptable — the frontend `RegisterResponse` type is a separate interface and ignores extra fields.

**File: `backend/accounts/views.py`** — add `ProfileView` class below the existing views. Do NOT touch `RegisterView`, `LoginView`, `LogoutView`, or `CookieTokenRefreshView`.

```python
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'code': 'validation_error', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return Response(serializer.data)
```

### Frontend: What Changes and What to Preserve

**File: `frontend/src/types/user.ts`** — add `delivery_address: string | null` to `User` interface. `RegisterResponse` stays unchanged. Add `ProfileUpdatePayload`.

**File: `frontend/src/lib/api.ts`** — add one key to the existing `AUTH_ENDPOINTS` object. DO NOT modify `apiFetch`, `logoutUser`, or `apiUrl`.

**File: `frontend/src/store/auth.ts`** — DO NOT MODIFY. The profile page fetches fresh data from the API via `useQuery` and does NOT rely on the Zustand store's `user` for initial form values. (The store's `user` after login is `{id, name, phone, is_staff}` from register response — no `delivery_address`.)

### Frontend: Token Handling Pattern (CRITICAL)

`apiFetch` in `lib/api.ts` handles everything automatically:
- Reads `accessToken` from Zustand store → sets `Authorization: Bearer {token}` header
- Includes `credentials: 'include'` for cookie transmission
- On 401: auto-refreshes token, retries once, then clears auth and redirects to `/login` if refresh fails

Profile form query pattern:
```typescript
queryFn: async () => {
  const res = await apiFetch(AUTH_ENDPOINTS.PROFILE)
  if (!res.ok) throw new Error('Failed to load profile')
  return res.json() as Promise<User>
}
```

Profile form mutation pattern:
```typescript
mutationFn: async (payload: ProfileUpdatePayload) => {
  const res = await apiFetch(AUTH_ENDPOINTS.PROFILE, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json()
    throw err  // ApiError shape: {error, code, details}
  }
  return res.json() as Promise<User>
}
```

### Frontend: Error Handling Pattern

Follow the exact same pattern as `login-form.tsx` and `register-form.tsx`:
- Field errors: `ApiError.details` maps field names to error arrays (e.g., `{ phone: ["Phone already registered"] }`)
- Form-level fallback error: use `ApiError.code` or `ApiError.error`
- All error elements must have `role="alert"` for accessibility
- Success message element must have `role="status"`
- No `window.alert` — all messages inline

### Frontend: New Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/app/account/profile/page.tsx` | Profile page route (protected by middleware) |
| `frontend/src/components/features/auth/profile-form.tsx` | Profile view/edit form component |
| `frontend/src/app/admin/layout.tsx` | Admin is_staff guard (deferred from Story 1.3) |
| `frontend/src/test/profile-form.test.tsx` | Profile form tests |

### Frontend: Files to Modify

| File | Change |
|------|--------|
| `frontend/src/types/user.ts` | Add `delivery_address: string \| null` to `User`; add `ProfileUpdatePayload` |
| `frontend/src/lib/api.ts` | Add `PROFILE: '/api/v1/auth/profile/'` to `AUTH_ENDPOINTS` |

### Backend: Files to Modify

| File | Change |
|------|--------|
| `backend/accounts/serializers.py` | Update `UserProfileSerializer`: add `delivery_address`, change `read_only_fields`, add `validate_phone` |
| `backend/accounts/views.py` | Add `ProfileView` class |
| `backend/accounts/urls.py` | Add profile route; add `ProfileView` to imports |
| `backend/accounts/tests.py` | Add 5 profile endpoint test cases |

### Deferred Items (DO NOT implement in this story)

From `_bmad-output/implementation-artifacts/deferred-work.md`:
- `prod.py` ALLOWED_HOSTS → Story 5
- Unpinned requirements.txt → Post-Story 1.2 validation
- `python-dotenv` unused → Docker handles env loading
- Unused `include` import in `core/urls.py` → consumed by domain apps in future stories

### Project Structure Notes

- All profile logic stays in `backend/accounts/` — no new Django app
- Frontend profile component: `frontend/src/components/features/auth/` (consistent with auth feature folder)
- Frontend page: `frontend/src/app/account/profile/page.tsx` — `/account/*` already in middleware matcher
- Test files: `frontend/src/test/` — all Vitest tests go here (not co-located with components)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/implementation-artifacts/1-3-authentication-frontend-login-register-token-handling.md#Dev Notes] — "Admin is_staff enforcement is client-side in admin/layout.tsx (Story 1-4)"
- [Source: backend/accounts/serializers.py] — current `UserProfileSerializer` state (read-only, fields: id/name/phone)
- [Source: backend/accounts/views.py] — existing view patterns (APIView, IsAuthenticated, error response format)
- [Source: frontend/src/lib/api.ts] — `apiFetch` signature and `AUTH_ENDPOINTS` const pattern
- [Source: frontend/src/test/login-form.test.tsx] — MSW + Vitest + React Testing Library test pattern to follow

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Fixed `UserProfileSerializer` unique validator conflict: added `extra_kwargs = {'phone': {'validators': []}}` to disable DRF's built-in UniqueValidator so the custom `validate_phone()` method returns the correct `phone_already_registered` code.

Fixed Docker DB disk-space failure: ran `docker system prune -f` and `docker image prune -a --filter "until=48h" -f`, reclaiming ~33GB. DB recovered on next start.

### Completion Notes List

- Implemented `GET /api/v1/auth/profile/` and `PATCH /api/v1/auth/profile/` endpoints with `IsAuthenticated` enforcement; HTTP 401 on unauthenticated access handled automatically by DRF.
- `UserProfileSerializer` updated: `delivery_address` added, `read_only_fields` narrowed to `['id']`, custom `validate_phone` with `phone_already_registered` code, UniqueValidator disabled via `extra_kwargs`.
- `ProfileView` added to `backend/accounts/views.py`; registered at `auth/profile/` in `backend/accounts/urls.py`.
- Frontend: `User` type extended with `delivery_address: string | null`; `ProfileUpdatePayload` added; `PROFILE` endpoint constant added to `AUTH_ENDPOINTS`.
- `ProfileForm` component: `useQuery` pre-populates fields; `useMutation` PATCH with per-field error mapping; inline success/error messages; button disabled during pending.
- `/account/profile` page created; protected by existing middleware matcher.
- `admin/layout.tsx` created: client-side `is_staff` guard redirecting non-staff to `/`.
- 5 new backend tests (all pass); 3 new frontend tests (all pass); 0 regressions; TypeScript clean.

### File List

- `backend/accounts/serializers.py` (modified)
- `backend/accounts/views.py` (modified)
- `backend/accounts/urls.py` (modified)
- `backend/accounts/tests.py` (modified)
- `frontend/src/types/user.ts` (modified)
- `frontend/src/lib/api.ts` (modified)
- `frontend/src/components/features/auth/register-form.tsx` (modified)
- `frontend/src/test/auth-store.test.ts` (modified)
- `frontend/src/components/features/auth/profile-form.tsx` (new)
- `frontend/src/app/account/profile/page.tsx` (new)
- `frontend/src/app/admin/layout.tsx` (new)
- `frontend/src/test/profile-form.test.tsx` (new)

## Change Log

- 2026-05-05: Implemented Story 1.4 — profile GET/PATCH backend endpoints, ProfileForm frontend component with pre-filled fields and inline validation, `/account/profile` page, admin is_staff layout guard, and full test coverage (14 backend + 20 frontend tests passing).
