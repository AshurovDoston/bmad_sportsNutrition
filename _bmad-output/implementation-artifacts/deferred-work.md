# Deferred Work

## Deferred from: code review of 1-1-project-initialization-docker-development-environment (2026-05-05)

- `prod.py` ALLOWED_HOSTS is empty — deferred to Story 5 (production infra) where the actual domain will be known
- Unpinned versions in `requirements.txt` — deferred post-Story-1.2 to validate working versions end-to-end before pinning
- `python-dotenv` installed but `load_dotenv()` never called — Docker `env_file:` handles env loading; only matters for non-Docker dev which is out of scope for this sprint
- Unused `include` import in `backend/core/urls.py` — will be consumed naturally when domain app URLs are wired in future stories
