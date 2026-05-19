# Deferred Work

## Deferred from: code review of 1-1-project-initialization-docker-development-environment (2026-05-05)

- `prod.py` ALLOWED_HOSTS is empty — deferred to Story 5 (production infra) where the actual domain will be known
- Unpinned versions in `requirements.txt` — deferred post-Story-1.2 to validate working versions end-to-end before pinning
- `python-dotenv` installed but `load_dotenv()` never called — Docker `env_file:` handles env loading; only matters for non-Docker dev which is out of scope for this sprint
- Unused `include` import in `backend/core/urls.py` — will be consumed naturally when domain app URLs are wired in future stories

## Deferred from: code review of ui-ux-retrofit-p0 (2026-05-06)

- `product-card.tsx` and `product-detail.tsx`: `setTimeout(() => setAdded(false), 2000)` is not cleaned up on unmount — pre-existing in baseline `product-card.tsx` (the original "Added!" toast pattern); harmless React 19 leak warning at most. Address when refactoring the post-add toast UX (P1).
- `account-menu.tsx`: when `accessToken` exists but `user` is `null` (auth-bootstrap profile fetch in flight or failed), the Admin link is hidden because gating reads `user?.is_staff`. Pre-existing race in `auth-bootstrap.tsx`. Fix when adding loading/error UX to the bootstrap.
- Pre-existing input validation gaps surfaced incidentally: `cart-item-row.tsx` quantity has no upper bound (server rejects on checkout; misleading subtotal until then); `filter-panel.tsx` price min/max accepts negatives and `min > max`; `search-bar.tsx` debounce has a stale `searchParams` closure that may drop a concurrent param change. None caused by this story — the refactor only swapped button markup.

