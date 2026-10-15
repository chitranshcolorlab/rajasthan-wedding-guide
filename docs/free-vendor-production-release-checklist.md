# Free Vendor Registration — Production Release Checklist

Status: **STAGED / NOT DEPLOYED**. Production `main` remains unchanged.

## Verified
- DEV publisher #1911 succeeded; DEV approved-vendors.json is empty after test cleanup.
- Production already has `vendor-register.html` and `admin-review.html`.
- Production currently uses a **different Google Apps Script deployment** than DEV.
- The DEV GitHub Actions publisher must **never** be copied as-is into production: it enforces a DEV base URL and reads the DEV backend.

## Before merging any release
1. Back up the production GitHub `main` commit and production Apps Script deployment/source and Google Sheet; record restore identifiers.
2. Review the production Apps Script source and verify its schema supports the final single-form Free plan (business name, owner name, category, district/city, one owner photo, 100-character description, mobile, WhatsApp, consent).
3. Confirm the production admin token audience and authorized admin, server-side validation, rate limiting, approval audit, and photo permissions. Never copy DEV secrets or DEV sheet IDs.
4. Stage the production frontend changes on this release branch only, retaining production branding and existing routes.
5. Implement a **production-specific** publisher with an explicit production repository/domain allowlist, approved-only reads, atomic replacement, least-privilege token and rollback.
6. Run automated tests and an isolated smoke test against a controlled production test vendor; verify approve/unpublish, privacy, and mobile links.
7. Confirm the final backup, rollback commands and monitoring. Merge only after the above gates pass.

## Rollback
Restore the recorded pre-release `main` commit and prior production Apps Script deployment version, then republish. Do not roll back or erase production vendor data.

## Scope
No production API URLs, credentials, or Google Sheet IDs are to be copied into DEV; no production website change is authorized by the existence of this checklist alone.
