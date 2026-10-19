# Veterans in Logistics

Landing site rebuild for [veteransinlogistics.org](https://veteransinlogistics.org/).

## Pages

- `/` home
- `/join.html` veteran signup and resume intake
- `/sponsor.html` company jobs and sponsorship form
- `/founders.html` founding seats interest (still uses a mailto link)
- `/engage.html` redirects to founders

## Forms

Submissions from `/join.html` and `/sponsor.html` go through [FormSubmit](https://formsubmit.co) (free, no account) and are emailed to john@bcsfreightnetwork.com.

- Endpoint alias: `https://formsubmit.co/60f3451a7dabcabba92fca302f1c7296` (activated Oct 18, 2026 from the BCS inbox). The alias keeps the inbox address out of the page source.
- No resume file: the form posts with `fetch` to the `/ajax/` endpoint and shows a success message in place. If the post fails, the page shows an error and opens a prefilled email to contact@veteransinlogistics.org as a fallback.
- Resume file attached: FormSubmit only accepts files on a normal form post, so the page does a standard multipart post and FormSubmit redirects back to `?submitted=1`, which shows the success message. Max file size enforced in the browser is 5MB (PDF, DOC, DOCX).
- Spam: hidden honeypot field `_honey`. FormSubmit reCAPTCHA is turned off (`_captcha=false`) so the in-page flow works; turn it back on if spam shows up.
- Tracking: hidden fields `form_name`, `page`, `utm_source`, `utm_medium`, `utm_campaign`, and `submitted_at` ride along with every submission.
- Multi-select answers are sent as one comma-separated field.
- The page sets `<meta name="referrer" content="no-referrer-when-downgrade">` because the preview host sends `Referrer-Policy: no-referrer` and FormSubmit rejects posts with no referrer.
- Optional: FormSubmit supports a free `_webhook` field that can call a Google Apps Script web app to log each submission to a Google Sheet. Not set up yet.

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
