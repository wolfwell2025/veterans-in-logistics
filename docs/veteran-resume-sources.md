# Veteran Resume / Profile Sources for Veterans in Logistics

**Prepared for:** John Tozer / Gilfoyle (VIL talent pipeline)  
**Date:** 2026-09-12 (ET)  
**Scope:** Ethical, partnership-first sources we can actually pull from or license—not generic job boards.  
**Constraint:** No personal PII collected or stored. Capabilities and access models only.

---

## Executive summary

There is **no clean free public API** that dumps veteran resumes for private employers. Every serious veteran talent database is behind an employer seat, partnership, or licensed API. Scraping LinkedIn, ClearanceJobs, or RecruitMilitary candidate data is not a viable path.

**Recommended paths for Gilfoyle to pursue with John (top 3):**

| Priority | Path | Why |
| --- | --- | --- |
| **1** | **Best Military Resume (BMR) employer portal** | Deepest logistics/freight/CDL-adjacent pool among researched options; free explore; paid self-serve search + privacy-preserving outreach; partnership also available |
| **2** | **Hire Heroes USA partnership** | Mission-aligned nonprofit; affordable database access (~$215+); 21K+ profiles; direct placement + events; strong ethics/brand fit for VIL |
| **3** | **RecruitMilitary Veteran Talent Source (VTS)** *or* **MilitaryHire** | Scale databases with licensed resume access; VTS has documented employer resume API; MilitaryHire is cheaper entry (~$2,995 / 90 days) |

**Do not pursue as primary pipelines:** LinkedIn scraping, USAJOBS resume mining (federal-only), ClearanceJobs (cleared/defense skew + gated), PostJobFree bulk scrape (public but weak fit / PII risk).

---

## Source-by-source findings

### 1. RecruitMilitary — Veteran Talent Source

| Field | Detail |
| --- | --- |
| **URL** | https://recruitmilitary.com/ · VTS: https://recruitmilitary.com/employers/ai-veteran-talent-source/ · Job board: https://my.recruitmilitary.com/ |
| **Free programmatic pull?** | **No.** Resume document API exists only for licensed employers: `GET https://my.recruitmilitary.com/api/v1/resumes/:uuid` with `user_credentials`. Daily view limits apply. |
| **Public without login** | Job search / job listings. Employer marketing pages. **Candidate profiles and resumes are not publicly searchable.** `board.recruitmilitary.com` redirects to `my.recruitmilitary.com` (candidate-facing job board + sign-in). |
| **Partnership / API path** | Buy **Veteran Talent Source** (Findem-powered). Published annual tiers roughly **$3,599–$19,999+** (Silver→FindRM / Enterprise). Job posting XML/JSON feeds available for outbound jobs. Sales form on VTS page. |
| **Logistics relevance** | **High.** VTS marketing explicitly lists logistics, transportation, skilled trades, operations, maintenance. Large military-to-civilian database; career fairs (100+/yr) useful for CDL/warehouse pipelines. |

**Notes:** Best for scale once budget exists. Not a bootstrap scrape source.

---

### 2. ClearanceJobs

| Field | Detail |
| --- | --- |
| **URL** | https://www.clearancejobs.com/ · Employers: https://about.clearancejobs.com/employers/request-demo |
| **Free programmatic pull?** | **No.** Resume database requires screened employer account. Must be **U.S.-based company**; users must be **U.S. citizens physically in the U.S.** |
| **Public without login** | Job listings / marketing site. Candidate network is private (“only pre-screened defense and intelligence recruiters”). Site returns 200 but app is gated. |
| **Partnership / API path** | Request demo → paid resume search + job postings. Documented automation is **job batch XML posting**, not resume export. AgileATS push for viewed candidates (employer-side). |
| **Logistics relevance** | **Low–medium for VIL core freight/CDL.** Strong for cleared logistics/supply roles supporting DoD contracts; poor fit for commercial trucking/3PL floor hiring. |

**Notes:** Skip unless VIL expands into cleared defense logistics.

---

### 3. Hire Heroes USA

| Field | Detail |
| --- | --- |
| **URL** | https://www.hireheroesusa.org/ · Partner: https://www.hireheroesusa.org/become-employer-partner/ · Job board products: https://jobs.hireheroesusa.org/products |
| **Free programmatic pull?** | **No.** Fee-based employer partnership / product packages. |
| **Public without login** | Mission/employer marketing. Job board behind Cloudflare; not a public resume directory. |
| **Partnership / API path** | **Strong ethical path.** Talent Network: **21,000+** military-affiliated profiles. Products include single job + DB access (~**$215**, with screening call), recruiter packages, unlimited posting + DB (3/6/12 mo), direct placement, virtual fairs, consulting. XML job feed on higher packages. 2025 Employer Partnerships Catalog PDF available on site. |
| **Logistics relevance** | **Medium–high.** General veteran/spouse pool (not logistics-only), but coaching-vetted candidates and filters can surface transport/supply backgrounds. Brand-aligned with VIL’s mission. |

**Notes:** Best “mission partnership” path; good for John to open a sales/partnership conversation quickly.

---

### 4. Military.com talent / resume features

| Field | Detail |
| --- | --- |
| **URL** | https://www.military.com/veteran-jobs · Candidate join: https://jobs.military.com/candidates/join_now · Employer resources: https://www.military.com/hiring-veterans |
| **Free programmatic pull?** | **No** dedicated public Military.com resume API found. |
| **Public without login** | Large free **job board** for veterans; employer profile pages; hiring guides. Resume tools appear candidate-side (build/upload for applications), not an open employer resume bank. |
| **Partnership / API path** | Post jobs via Military.com employer channel. Adjacent: **Monster Resume Search** (paid) includes a **“veterans”** filter and clearance filters—possible if VIL already uses Monster, but this is a general résumé DB, not a veteran-native pipeline. |
| **Logistics relevance** | **Medium** for inbound applicants via job posts; **weak** as a pull/sourcing database. |

**Notes:** Treat as **distribution channel for job ads**, not a talent-pull API.

---

### 5. USAJOBS (limited)

| Field | Detail |
| --- | --- |
| **URL** | https://www.usajobs.gov/ · API docs: https://developer.usajobs.gov/ · Agency Talent Portal: https://agencyportal.usajobs.gov/ |
| **Free programmatic pull of resumes?** | **No for private employers.** Public API (`data.usajobs.gov/api/Search`) is **job announcements only** (requires registered API key + User-Agent). Unauthenticated curl → **403**. Resume bank is searchable only inside **Agency Talent Portal (ATP)** for federal HR/recruiters. |
| **Public without login** | Job search UI; help docs on searchable resumes (job-seeker opt-in for federal recruiters, 12 months). |
| **Partnership / API path** | None for commercial recruiters. ATP is federal-employee only. |
| **Logistics relevance** | Useful to **monitor federal logistics/transportation openings** (`HiringPath=vet`) as competitive intel—not a VIL candidate pipeline. |

---

### 6. LinkedIn (veteran filters) — ToS caution

| Field | Detail |
| --- | --- |
| **URL** | LinkedIn Recruiter / Recruiter Lite help: https://www.linkedin.com/help/linkedin/answer/a414428 · RSC: Microsoft Learn LinkedIn Talent docs · Prohibited tools: https://www.linkedin.com/help/linkedin/answer/a1341387 |
| **Free programmatic pull?** | **No. Scraping is explicitly prohibited** (User Agreement §8.2: crawlers, bots, extensions that scrape profiles). Enforcement is active. |
| **Public without login** | Limited public profile snippets; not a usable veteran résumé directory. |
| **Partnership / API path** | **Paid LinkedIn Recruiter / Recruiter Lite** with **“Military veterans”** filter (~2.2M+ members flagged). **Recruiter System Connect (RSC)** APIs only for LinkedIn-approved ATS partners—not for arbitrary search export. Manual InMail/sourcing under a paid seat is the compliant path. |
| **Logistics relevance** | **High volume** of veterans including logistics titles—but access is seat-based and ToS-bound. Good for human recruiters; bad for automated pipeline build. |

**Recommendation:** Optional paid Recruiter Lite for Gilfoyle/manual sourcing. **Never** build scrapers or “enrichment” bots against LinkedIn.

---

### 7. Logistics / CDL / open directories

#### A. Best Military Resume (BMR) — **strongest logistics-specific find**

| Field | Detail |
| --- | --- |
| **URL** | https://bestmilitaryresume.com/hire · Partners: https://bestmilitaryresume.com/partner-with-us |
| **Free programmatic pull?** | **No open API documented.** Free employer account to explore; messaging/search depth behind paid monthly plan (flat, no per-hire fee per marketing). |
| **Public without login** | Marketing site with **sample/illustrative** ranked matches (anonymized structure). Live pool claimed ~**7,200+** profiles; **~800–1,000+** new / 30 days; **71K+** resumes built lifetime. Contact shown as protected until veteran replies. |
| **Partnership / API path** | (1) Self-serve portal: paste JD → ranked shortlist → message → pipeline board. (2) Concierge matching via sales call. (3) Separate VSO/nonprofit sponsor program (not employer DB). |
| **Logistics relevance** | **Very high.** BMR content repeatedly states logistics/supply/transport/motor pool/3PL/warehousing as among their **deepest** fields. Sample profile fields (structure only): branch, location, years, clearance, availability, skill tags, match score—**no contact until reply**. |

**Sample listing structure (public demo only; not real PII to store):**  
`display_name_initial · MOS-style blurb · branch · base/city · years · clearance · availability · skill_tags[] · match_pct · contact=protected`

#### B. MilitaryHire

| Field | Detail |
| --- | --- |
| **URL** | https://www.militaryhire.com/ · Pricing: https://www.militaryhire.com/employer-info |
| **Free pull?** | No. |
| **Public** | Marketing; candidate upload. |
| **Partnership** | **90-Day Hiring Sprint $2,995** (platform + profiles/resumes + virtual events). Annual membership (quote). Concierge recruiting. Orion Talent partnership for broader RPO. |
| **Logistics relevance** | Medium–high general military DB; not logistics-exclusive. |

#### C. Corporate Gray Online

| Field | Detail |
| --- | --- |
| **URL** | https://cgo.corporategray.com/employer-products/ |
| **Free pull?** | No. Paid packages with **unlimited job postings + resume search** (historically ~$600/mo or ~$4,000/yr premium tiers; confirm current quote). |
| **Logistics relevance** | Medium (transitioning officers/enlisted; events-heavy). |

#### D. Orion Talent (managed pipeline, not DIY DB)

| Field | Detail |
| --- | --- |
| **URL** | https://www.oriontalent.com/talent-solutions/industries/supply-chain-logistics-transportation/ |
| **Model** | RPO / military search / SkillBridge enablement; proprietary military DB claimed **1M+**. No public résumé API. |
| **Logistics relevance** | **Very high** (Walmart, Americold, etc. as logistics clients). Best if VIL wants **outsourced** sourcing rather than building an in-house pull. |

#### E. PostJobFree (truly public resume search — use with caution)

| Field | Detail |
| --- | --- |
| **URL** | https://www.postjobfree.com/resumes · Advanced: https://www.postjobfree.com/advanced-resume-search · ToS: https://www.postjobfree.com/terms-of-service |
| **Free programmatic pull?** | **Listings are publicly crawlable without login** (verified: keyword search returns result cards). **Not a sanctioned JSON API.** ToS allows republishing posts **with backlink** and deletion when source deletes; premium needed to unmask contact. Contact/SSN/phone often redacted for non-premium. |
| **Public structure (no PII stored):** | Result card → `title` + link `/resume/{id}/{slug}` + `location` + `date` + text `snippet`. Full resume pages exist publicly; sensitive fields often masked. |
| **Ethics / fit** | Mixed quality; not veteran-verified; storing full resumes would collect PII. **Not recommended as a primary VIL pipeline.** At most: occasional manual keyword spot-check (`veteran CDL`, `88M`, etc.) without bulk storage. |
| **Logistics relevance** | Some CDL/veteran hits exist, but noisy and unverified. |

#### F. FMCSA / carrier open data

Public FMCSA SAFER / census data is **carrier/company** data (DOT, fleet, cargo)—**not veteran resumes**. Irrelevant as a candidate pipeline (useful for B2B carrier leads only).

---

## Probe notes (WebFetch / curl)

| Target | Result |
| --- | --- |
| `clearancejobs.com` | HTTP 200; SPA/app; resume DB not public |
| `board.recruitmilitary.com` | 302 → `my.recruitmilitary.com`; job board + candidate sign-in |
| `jobs.hireheroesusa.org` | 200 (Cloudflare bot check on WebFetch); employer products behind login/purchase |
| `jobs.military.com` | Candidate join / job board surface |
| `postjobfree.com/resumes?q=veteran+…` | Public result list without login; card structure as above |
| `data.usajobs.gov/api/search` (no key) | **403 Forbidden** |
| RecruitMilitary VTS page | Confirmed paid tiers + logistics in FAQ |
| BMR `/hire` | Confirmed freemium employer portal + protected outreach model |

---

## Legal / ethical guardrails for VIL

1. **Prefer licensed seats and written partnerships** over scraping.  
2. **Do not scrape LinkedIn** or automate profile collection—ToS + account risk.  
3. **Do not store names, emails, phones, or full resumes** from public pages in VIL systems unless candidates opt in through VIL’s own funnel or a licensed platform’s export under contract.  
4. Prefer platforms where **candidates opted into employer search** (BMR, HHUSA, RecruitMilitary, MilitaryHire).  
5. Job-board **XML feeds** are for **pushing VIL jobs out**, not pulling résumés in.

---

## Clear recommendations for Gilfoyle + John

### Path A — Start this week (best ROI / logistics fit)
**Best Military Resume employer account**  
- Create free employer account; run logistics/CDL/warehouse JD searches.  
- Convert to paid plan if match quality is good.  
- Parallel: short partnership call for concierge shortlists.  
- **Why first:** Explicit logistics depth + ethical contact model + low commitment.

### Path B — Mission partnership (brand + pipeline)
**Hire Heroes USA**  
- John opens employer-partner conversation.  
- Buy entry DB access or a small posting package; evaluate candidate quality for freight roles.  
- Add direct placement if volume justifies.  
- **Why:** Nonprofit alignment, coaching-vetted talent, clear commercial packaging.

### Path C — Scale / events (when budget allows)
**RecruitMilitary VTS** (or **MilitaryHire 90-day sprint** as cheaper trial)  
- Use for always-on search + career-fair pipeline.  
- RecruitMilitary has a **licensed resume API** suitable for careful ATS integration later.  
- **Why:** Mature military recruiting infrastructure; logistics called out in product.

### Explicit non-goals
- LinkedIn scraping / “veteran filter” bots  
- USAJOBS resume bank (not available to VIL)  
- ClearanceJobs as primary (wrong market unless cleared logistics)  
- Bulk PostJobFree harvest into a database  

---

## Suggested next actions (owners)

| Owner | Action |
| --- | --- |
| **John** | Email Hire Heroes USA partnerships + BMR `contact@bestmilitaryresume.com` with VIL roles (CDL, dispatcher, warehouse, freight ops) |
| **Gilfoyle** | Spin up BMR free employer seat; document filter fields and export options under ToS; draft integration sketch only for **licensed** APIs (RecruitMilitary resume UUID API *after* contract) |
| **Both** | Decide budget band: &lt;$500/mo (BMR/HHUSA) vs $3K–$10K+/yr (MilitaryHire / RecruitMilitary VTS) |

---

*End of brief. Sources checked via public web pages, product docs, and HTTP probes on 2026-09-12. Pricing is marketing-published and should be confirmed in sales calls.*
