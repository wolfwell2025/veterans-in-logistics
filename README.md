# Veterans in Logistics

Landing site rebuild for [veteransinlogistics.org](https://veteransinlogistics.org/).

## Pages

- `/` home
- `/join.html` veteran signup and resume intake
- `/sponsor.html` company jobs and sponsorship form
- `/jobs.html` live logistics jobs with search, filters, and pagination
- `/mos.html` military job code lookup (MOS, AFSC, rating) with matching live jobs
- `/founders.html` founding seats interest (still uses a mailto link)
- `/engage.html` redirects to founders

## Forms

Submissions from `/join.html` and `/sponsor.html` go through [FormSubmit](https://formsubmit.co) (free, no account) and are emailed to john@bcsfreightnetwork.com.

- Endpoint alias: `https://formsubmit.co/60f3451a7dabcabba92fca302f1c7296` (activated Oct 18, 2026 from the BCS inbox). The alias keeps the inbox address out of the page source.
- Both forms post with `fetch` to the FormSubmit `/ajax/` endpoint and show a success message in place. If the post fails, the page shows an error and opens a prefilled email to contact@veteransinlogistics.org as a fallback.
- Resumes: veterans share a resume link (Google Drive, Dropbox, OneDrive) or a LinkedIn URL, and one of the two is required. File upload was removed on Oct 18, 2026. FormSubmit drops files on its AJAX endpoint, and two test posts with a PDF through its standard multipart endpoint were accepted on screen but never delivered. Bring file upload back only with a backend that is confirmed to deliver attachments.
- Spam: hidden honeypot field `_honey`. FormSubmit reCAPTCHA is turned off (`_captcha=false`) so the in-page flow works; turn it back on if spam shows up.
- Tracking: hidden fields `form_name`, `page`, `utm_source`, `utm_medium`, `utm_campaign`, and `submitted_at` ride along with every submission.
- Multi-select answers are sent as one comma-separated field.
- The page sets `<meta name="referrer" content="no-referrer-when-downgrade">` because the preview host sends `Referrer-Policy: no-referrer` and FormSubmit rejects posts with no referrer.
- Optional: FormSubmit supports a free `_webhook` field that can call a Google Apps Script web app to log each submission to a Google Sheet. Not set up yet.

## Jobs data

`scripts/build_jobs.py` (Python 3 standard library only) reads the public job-posting feeds in `scripts/feeds.json` and writes:

- `data/jobs.json`: one record per US job with `title`, `employer`, `location`, `city`, `state`, `remote`, `category`, `cdl`, `onet`, `posted`, and `url` (the employer's own apply page).
- `data/meta.json`: `updated_at`, total count, and per-employer stats (fetched, listed, duplicates removed, non-US removed).

Feeds: Workday CXS (C.H. Robinson, RXO, J.B. Hunt, Werner, Old Dominion, Ryder, Triumph Financial), Greenhouse Job Board API (Uber Freight, Flexport, Motive, project44, FourKites, Samsara), Lever (Arrive Logistics, Loadsmart), and Ashby (Flock Freight). Amazon's jobs search JSON is listed but disabled because it is not an official API.

Rules: public feeds only, one request at a time with a 1 second pause, identifying User-Agent, no candidate data. Jobs outside the US are dropped. Duplicates are removed by URL and by employer, title, and location. If a feed fails, the previous run's jobs for that employer are kept. Category, CDL, and O*NET tags come from simple title and description rules, so expect some misses.

Run it: `python3 scripts/build_jobs.py` (about 3 minutes).

### Daily refresh

- GitHub Actions: `.github/workflows/refresh-jobs.yml` runs daily at 11:15 UTC (6:15 AM Central in daylight time, 5:15 AM in winter) and commits new data. Pushing this file needs a token with the `workflow` scope.
- Box preview: `scripts/refresh_and_publish.sh` pulls the feeds, republishes the here.now preview, and commits the data.

## MOS lookup

`scripts/build_mos.py` builds `data/mos.json` (about 75 KB) from the O*NET Military Crosswalk (July 2024, public download from onetcenter.org). It keeps only active codes that map to logistics occupations (drivers, vehicle mechanics, material movers, shipping and inventory clerks, dispatchers, cargo agents, logisticians, purchasing, and transportation supervisors and managers). The page matches a code to those occupations, then to live jobs by O*NET code (direct) and by category (related). Air Force codes accept an X for the skill level, such as 2T1X1.

`join.html` accepts prefill params: `branch`, `status`, `mos_code`, `mos_title`, `cdl_status`, `city_state`.

## UTM tracking

`assets/js/main.js` reads `utm_*` params from the landing URL, keeps them for the browser session, adds them to every internal link, fills the hidden form fields, and prefills "How did you hear about us?" on `/join.html` from `utm_source`.

Example share link: `https://veteransinlogistics.org/join.html?utm_source=instagram&utm_medium=social&utm_campaign=reel1`

## Legal review

The consent text on `/join.html` and the terms text on `/sponsor.html` are DRAFT pending legal review. Current join consent:

> I agree that Veterans in Logistics may store my information and share my profile with partner employers for job matching. I can ask to be removed anytime by emailing contact@veteransinlogistics.org.

## Preview

Interim preview: https://mineral-soul-hbbv.here.now/

## Docs

See `docs/PRODUCT.md` for the two-sided matching brief, and `docs/jobs/` for the TBK Workday JD index sample.

## Local

Serve the folder with any static file server (for example `python3 -m http.server`). FormSubmit rejects posts from `file://` pages.
