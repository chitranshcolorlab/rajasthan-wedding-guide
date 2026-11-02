# Production launch verification — 2026-11-02

- Production Apps Script Version 9 restricts public reads to approved, allowlisted fields. Unauthenticated admin-list requests fail before private data is returned.
- Authorized production admin read verified with four approved vendors; public catalog contains four approved vendors and no Email, Review Notes, or Owner Name fields.
- Isolated DEV registration, authenticated approval, automatic generated profile publication, rejection and automatic removal verified. Disposable fixture removed.
- Repaired DEV publisher default-branch catalog synchronization to avoid reusing an old workflow_run Pages build identity.
- Production publisher preserves four premium routes and assigns stable generated routes to new vendor IDs. Production publisher tests: 4 passed. Admin privacy/recovery tests: 11 passed. Existing SEO validator: 3534 pages, no errors.
- Production publisher and Pages workflow succeeded. During conversion from branch Pages to Actions, the final old branch deployment finished after the first Actions deployment. This new source commit triggers a clean Actions-only deployment.
- Five-minute scheduled publication is configured; no native schedule event observed at this checkpoint. GitHub schedules are best effort.
- HTTPS is serving; GitHub currently reports certificate provisioning and temporarily disables the Enforce HTTPS checkbox.
