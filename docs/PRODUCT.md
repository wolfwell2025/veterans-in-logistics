# Veterans in Logistics — Product brief (Sep 12 2026)

## Problem
Live marketing site at veteransinlogistics.org has a strong homepage, but /sponsor, /engage, and /join all 404. Base44 is parked. Need a supportable rebuild that also runs the marketplace.

## Two-sided marketplace
1. **Veterans** submit resumes (and profile: MOS, clearance, preferred roles, geo, CDL status).
2. **Logistics companies** share job descriptions (role, location, requirements, sponsor interest).
3. **Matching** surfaces strong fits both ways (veteran ↔ JD), with human review before outreach.

## Site surfaces (rebuild)
- Marketing homepage (match live look: near-black, logistics green, Inter Tight + JetBrains Mono)
- /join — veteran resume/profile intake (must work; live 404)
- /sponsor — company JD + sponsor interest intake (must work; live 404)
- /founders or /engage — founding seats / engage path (live 404)
- Admin-lite later: review submissions, run matches, export CSV

## Interim hosting
Static-exportable front end → eventual S3. Lead storage: start with form → email/webhook TODO, then durable store.

## Out of scope for v1
Full ATS, auto-apply, paid ads. Focus: capture both sides cleanly and prove matching.

## Design refs
Screenshots in /workspace/vil-reference/
