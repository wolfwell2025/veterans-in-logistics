#!/usr/bin/env python3
"""Build data/jobs.json and data/meta.json for the Veterans in Logistics jobs page.

Reads public, unauthenticated employer job-posting feeds listed in scripts/feeds.json
(Workday CXS, Greenhouse Job Board API, Lever Postings API, Ashby Posting API).
Only job postings are read. No candidate or personal data is touched.
Polite: one request at a time, 1 second apart, identifying User-Agent.

Usage:  python3 scripts/build_jobs.py [--out data] [--max-per-feed N]
Python 3 standard library only.
"""
import argparse, html, json, os, re, sys, time, urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UA = "VIL-jobs-poller/1.0 (+https://veteransinlogistics.org; contact@veteransinlogistics.org)"
DELAY = 1.0

STATES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado",
    "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts",
    "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana",
    "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
    "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico",
}
NAME_TO_CODE = {v.lower(): k for k, v in STATES.items()}
NON_US = re.compile(
    r"\b(canada|mexico|india|united kingdom|\buk\b|england|london|ireland|dublin|germany|berlin|munich|hamburg|"
    r"netherlands|amsterdam|poland|warsaw|krak[oó]w|portugal|lisbon|spain|madrid|barcelona|france|paris|italy|"
    r"china|shanghai|shenzhen|hong kong|singapore|japan|tokyo|korea|taiwan|vietnam|thailand|philippines|manila|"
    r"australia|sydney|melbourne|brazil|s[aã]o paulo|argentina|colombia|bogot[aá]|chile|peru|costa rica|"
    r"romania|bucharest|ukraine|serbia|belgrade|czech|prague|hungary|sweden|denmark|norway|finland|belgium|"
    r"switzerland|austria|israel|uae|dubai|turkey|istanbul|south africa|egypt|toronto|vancouver|montreal|"
    r"ontario|qu[eé]bec|british columbia|alberta|guadalajara|monterrey|bangalore|bengaluru|hyderabad|chennai|"
    r"pune|gurgaon|noida|emea|apac|latam|indonesia|jakarta|malaysia|selangor|pulau pinang|penang|kuala lumpur|new zealand|auckland|dorval|mississauga|pakistan|bangladesh|sri lanka|nigeria|kenya|morocco|saudi|qatar|guatemala|honduras|el salvador|panama|dominican republic|puerto vallarta|tijuana|juarez|nuevo leon|jalisco|cdmx)\b", re.I)

# (category, regex on lowercased title). First match wins.
CATEGORY_RULES = [
    ("other", r"accountant|accounting|account(s)? (payable|receivable)|\bfinance\b|financial|payroll|\btax\b|treasury|audit|legal|counsel|"
              r"attorney|paralegal|marketing|brand|communications|public relations|human resources|\bhr\b|people (partner|operations)|"
              r"talent|recruit|benefits|compensation|executive assistant|administrative assistant|receptionist|"
              r"loan|lending|banking|banker|teller|credit analyst|underwrit|deposit"),
    ("dispatch_operations", r"driver (manager|leader|business|services)|fleet manager|dispatch"),
    ("tech_data", r"software|developer|devops|\bsre\b|data (scien|engineer|analyst|analytics)|machine learning|\bml\b|\bai\b|"
                  r"security engineer|cyber|\bit\b|information technology|network engineer|cloud|product (manager|designer|management)|"
                  r"\bux\b|\bui\b|designer|engineer(ing)?\b(?!.*(maintenance|mechanic))|solutions architect|qa |quality assurance|\bsdet\b|"
                  r"database|salesforce admin|systems (administrator|analyst)|business intelligence|\bbi\b|analytics"),
    ("driving_cdl", r"\bdriver|\bcdl\b|truck ?driv|owner[- ]operator|class a|class b|\bhostler|yard (jockey|driver|spotter)|\bspotter\b|"
                    r"line ?haul|\botr\b|\bp&d\b|pickup (and|&) delivery|tractor trailer"),
    ("maintenance_technician", r"technician|\btech\b|mechanic|diesel|maintenance|\btire\b|\bshop\b|body shop|parts (specialist|associate|counter)|"
                               r"\bpm\b inspector|welder|fabricat|electrician|hvac"),
    ("warehouse_dock", r"warehouse|\bdock\b|forklift|material handler|\bloader|unloader|picker|packer|order selector|inventory|"
                       r"receiving|shipping (clerk|associate)|cross[- ]?dock|fulfillment|distribution (associate|center associate)|"
                       r"\bdc\b associate|dockworker|freight handler|yard (associate|coordinator)|os&d|freight clerk"),
    ("brokerage_sales", r"\bsales\b|account executive|account manager|business development|\bbdr\b|\bsdr\b|carrier (sales|rep|relations|"
                        r"procurement|account|development|manager|specialist)|\bbroker|freight agent|capacity|procurement|"
                        r"key account|customer success|partnerships|revenue"),
    ("management", r"manager|director|supervisor|\blead\b|team lead|vice president|\bvp\b|head of|chief|superintendent|"
                   r"general manager|\bgm\b|management trainee|manager trainee"),
    ("dispatch_operations", r"dispatch|operations|\bops\b|planner|load plan|driver (manager|leader|business)|fleet (manager|coordinator)|"
                            r"logistics (coordinator|specialist|analyst|representative|rep)|transportation (coordinator|analyst|specialist)|"
                            r"coordinator|customer service|customer (operations|experience|care|support)|expedit|track(ing)? (and|&) trace|"
                            r"billing|claims|safety|compliance|forwarding|freight agent|customs|ocean|air freight|import|export|"
                            r"client services|service center|terminal|yard|logistics|transportation|intermodal|drayage"),
]
CATEGORY_RULES = [(c, re.compile(rx, re.I)) for c, rx in CATEGORY_RULES]
CATEGORY_LABELS = {
    "driving_cdl": "Driving / CDL", "maintenance_technician": "Maintenance / Technician",
    "warehouse_dock": "Warehouse / Dock", "dispatch_operations": "Dispatch / Operations",
    "brokerage_sales": "Brokerage / Sales", "tech_data": "Tech / Data", "management": "Management", "other": "Other",
}
# Title to O*NET occupation, used by the MOS lookup to match jobs. First match wins.
ONET_RULES = [
    (r"software|developer|devops|data (scien|engineer)|security engineer", None),
    (r"\bcdl\b|truck ?driv|line ?haul|\botr\b|regional driver|local driver|\bdriver\b|class a", "53-3032.00"),
    (r"diesel|mechanic|tractor tech|trailer tech|mobile tech|service truck tech|fleet tech|\btechnician\b", "49-3031.00"),
    (r"forklift|dock ?worker|reach truck|material handler|freight handler", "53-7051.00"),
    (r"warehouse associate|warehouse worker|order (picker|selector)|picker|packer|\bloader|unloader", "53-7062.00"),
    (r"inventory|receiving|shipping clerk|\bstock", "43-5071.00"),
    (r"dispatch|driver manager|fleet manager|driver leader|driver business", "43-5032.00"),
    (r"load planner|planner|expedit", "43-5061.00"),
    (r"carrier (sales|account|rep|relations|procurement)|capacity|freight agent|logistics coordinator|customs|"
     r"transportation coordinator|logistics representative", "43-5011.00"),
    (r"logistics (specialist|analyst)|transportation analyst|supply chain analyst|logistician|transportation specialist", "13-1081.00"),
    (r"supervisor|team lead|\blead\b", "53-1047.00"),
    (r"(transportation|logistics|warehouse|terminal|distribution|operations|last mile|fleet|service center|customer logistics) manager|"
     r"manager,? (transportation|logistics|last mile|operations)|manager trainee|management trainee|operations management|terminal", "11-3071.00"),
    (r"account executive|business development|sales rep|sales manager|account manager|key account", "41-4012.00"),
    (r"customer (service|operations|experience|care)|client services", "43-4051.00"),
]
ONET_RULES = [(re.compile(rx, re.I), code) for rx, code in ONET_RULES]
CDL_TITLE = re.compile(r"\bcdl\b|class a\b|class-a|truck ?driv|tractor trailer|line ?haul|\botr\b|owner[- ]operator|\bp&d\b", re.I)
CDL_DESC = re.compile(r"\b(valid|current|active)?\s*(class a|class b|class-a|class-b)?\s*cdl\b[^.]{0,60}\b(required|must)|"
                      r"\bmust (have|hold|possess)[^.]{0,40}\bcdl\b|\bcdl[- ]?a\b|class a (cdl|commercial)", re.I)


def http(url, data=None):
    headers = {"User-Agent": UA, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(data).encode()
    req = urllib.request.Request(url, data=data, headers=headers)
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(3 * (attempt + 1))
    raise last


def clean_text(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(s or ""))).strip()


def workday_posted(label, today):
    t = (label or "").lower()
    if "today" in t:
        return today.isoformat()
    if "yesterday" in t:
        return (today - timedelta(days=1)).isoformat()
    m = re.search(r"(\d+)\+? days? ago", t)
    if m and "+" not in t:
        return (today - timedelta(days=int(m.group(1)))).isoformat()
    return None  # "30+ Days Ago" or unknown


def poll_workday(f, cap, today):
    base = f"https://{f['host']}"
    api = f"{base}/wday/cxs/{f['tenant']}/{f['site']}/jobs"
    out, offset, total = [], 0, None
    while True:
        d = http(api, {"appliedFacets": {}, "limit": 20, "offset": offset, "searchText": ""})
        if total is None:
            total = d.get("total")
        posts = d.get("jobPostings", [])
        for p in posts:
            path = p.get("externalPath", "") or ""
            seg = re.match(r"/job/([^/]+)/", path)
            out.append({
                "title": p.get("title"),
                "loc_raw": p.get("locationsText") or "",
                "loc_hint": seg.group(1) if seg else "",
                "posted": workday_posted(p.get("postedOn"), today),
                "url": f"{base}/en-US/{f['site']}{path}",
                "desc": "",
            })
        offset += 20
        if not posts or offset >= (total or 0) or len(out) >= cap:
            break
        time.sleep(DELAY)
    return out[:cap], total


def poll_greenhouse(f, cap, today):
    d = http(f"https://boards-api.greenhouse.io/v1/boards/{f['board']}/jobs?content=true")
    jobs = d.get("jobs", [])
    out = []
    for j in jobs:
        posted = j.get("first_published") or j.get("updated_at")
        out.append({
            "title": j.get("title"),
            "loc_raw": (j.get("location") or {}).get("name") or "",
            "loc_hint": "",
            "posted": posted[:10] if posted else None,
            "url": j.get("absolute_url"),
            "desc": clean_text(j.get("content"))[:6000],
        })
    return out[:cap], len(jobs)


def poll_lever(f, cap, today):
    d = http(f"https://api.lever.co/v0/postings/{f['board']}?mode=json")
    out = []
    for j in d:
        cat = j.get("categories") or {}
        ts = j.get("createdAt")
        locs = cat.get("allLocations") or []
        out.append({
            "title": j.get("text"),
            "loc_raw": cat.get("location") or ", ".join(locs),
            "loc_hint": "",
            "remote_hint": (j.get("workplaceType") or "").lower() == "remote",
            "country": j.get("country"),
            "posted": datetime.fromtimestamp(ts / 1000, timezone.utc).date().isoformat() if ts else None,
            "url": j.get("hostedUrl"),
            "desc": (j.get("descriptionPlain") or "")[:6000],
        })
    return out[:cap], len(d)


def poll_ashby(f, cap, today):
    d = http(f"https://api.ashbyhq.com/posting-api/job-board/{f['board']}?includeCompensation=false")
    out = []
    for j in d.get("jobs", []):
        if j.get("isListed") is False:
            continue
        addr = ((j.get("address") or {}).get("postalAddress") or {})
        loc = ", ".join(x for x in [addr.get("addressLocality"), addr.get("addressRegion"), addr.get("addressCountry")] if x)
        out.append({
            "title": j.get("title"),
            "loc_raw": loc or j.get("location") or "",
            "loc_hint": "",
            "remote_hint": bool(j.get("isRemote")),
            "country": "US" if addr.get("addressCountry") in ("United States", "USA", "US") else (addr.get("addressCountry") or None),
            "posted": (j.get("publishedAt") or "")[:10] or None,
            "url": j.get("jobUrl") or j.get("applyUrl"),
            "desc": (j.get("descriptionPlain") or "")[:6000],
        })
    return out[:cap], len(out)


POLLERS = {"workday": poll_workday, "greenhouse": poll_greenhouse, "lever": poll_lever, "ashby": poll_ashby}


BARE_CITIES = {
    "chicago": "IL", "dallas": "TX", "atlanta": "GA", "new york": "NY", "new york city": "NY", "san francisco": "CA",
    "austin": "TX", "houston": "TX", "phoenix": "AZ", "denver": "CO", "seattle": "WA", "boston": "MA",
    "los angeles": "CA", "nashville": "TN", "columbus": "OH", "indianapolis": "IN", "charlotte": "NC",
    "miami": "FL", "omaha": "NE", "minneapolis": "MN", "detroit": "MI", "philadelphia": "PA",
    "salt lake city": "UT", "kansas city": "MO", "st. louis": "MO", "memphis": "TN", "san diego": "CA",
    "lowell": "AR", "eden prairie": "MN", "plano": "TX", "fort worth": "TX", "jacksonville": "FL",
}
CITY_ST = re.compile(r"([A-Za-z][A-Za-z .'\-]*?)(?:,\s*|\s+)([A-Z]{2}|(?<=,)\s*[A-Z][a-z])(?:\s+\d{5}(?:-\d{4})?)?(?=$|[\s,;|()/])")
PREFIX = re.compile(r"^\s*(?:(?:usa?|united states(?: of america)?)\s*[-,:]*\s*|(?:hybrid|remote|on-?site|in[- ]office)\s*[-:]\s*)+", re.I)
CA_POSTAL = re.compile(r"\b[A-Z]\d[A-Z] ?\d[A-Z]\d\b")


def _clean_city(c):
    c = PREFIX.sub("", c or "").strip(" -,")
    return c.title() if c.isupper() or c.islower() else c


def _find_us(text):
    """Find (city, state) in free text. Returns (None, None) if not found."""
    if not text:
        return None, None
    for m in CITY_ST.finditer(text):
        code = m.group(2).strip().upper()
        if code in STATES:
            city = _clean_city(m.group(1)) or None
            if city and city.lower() in ("remote", "hybrid", "usa", "us"):
                city = None
            return city, code
    low = text.lower()
    for name, code in NAME_TO_CODE.items():
        m = re.search(r"([A-Za-z][A-Za-z .'\-]*?)[ ,]+" + re.escape(name) + r"\b", low)
        if m and not NON_US.search(low):
            return _clean_city(m.group(1)).title() or None, code
    for name, code in NAME_TO_CODE.items():
        if re.search(r"\b" + re.escape(name) + r"\b", low) and not NON_US.search(low):
            return None, code
    m = re.match(r"^[Uu][Ss]([A-Z]{2})[- ]+([A-Za-z .]+)", text)
    if m and m.group(1) in STATES:
        return _clean_city(re.sub(r"\d+$", "", m.group(2))), m.group(1)
    bare = re.sub(r"\(.*?\)|/\s*remote|\bor remote\b|\bhybrid\b", "", PREFIX.sub("", text), flags=re.I).strip(" ,-").lower()
    if bare in BARE_CITIES:
        return bare.title(), BARE_CITIES[bare]
    return None, None


def _looks_foreign(text):
    return bool(NON_US.search(text or "")) or bool(re.match(r"^\s*CAN\b", text or "")) or bool(CA_POSTAL.search(text or "")) \
        or bool(re.search(r"[^\x00-\x7f]", text or ""))


def parse_location(raw, hint, us_default, country=None):
    """Return (city, state, multi, is_us). state is a 2-letter code or None."""
    text = (raw or "").strip()
    low = text.lower()
    multi = bool(re.match(r"^\d+ locations?$", low)) or ";" in text or " | " in text
    hint_text = (hint or "").replace("---", " | ").replace("-", " ")
    if country and country.upper() not in ("US", "USA"):
        return None, None, multi, False
    if not re.match(r"^\d+ locations?$", low):
        if _looks_foreign(text) and not CITY_ST.search(text):
            return None, None, multi, False
        city, state = _find_us(text)
        if state:
            return city, state, multi, True
    if hint_text:
        if _looks_foreign(hint_text):
            return None, None, multi, False
        city, state = _find_us(hint_text.split(" | ")[1] if hint_text.startswith("USA | ") else hint_text)
        if state:
            return city, state, multi, True
    if _looks_foreign(text):
        return None, None, multi, False
    is_us = bool(re.search(r"\b(us|usa|u\.s\.|united states|north america)\b", low)) or us_default or (country or "").upper() == "US"
    return None, None, multi, is_us


def categorize(title):
    for cat, rx in CATEGORY_RULES:
        if rx.search(title):
            return cat
    return "other"


def onet_for(title):
    for rx, code in ONET_RULES:
        if rx.search(title):
            return code
    return None


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feeds", default=os.path.join(HERE, "feeds.json"))
    ap.add_argument("--out", default=os.path.join(ROOT, "data"))
    ap.add_argument("--max-per-feed", type=int, default=5000)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    feeds = [f for f in json.load(open(a.feeds))["feeds"] if f.get("enabled", True)]
    now = datetime.now(timezone.utc)
    today = now.date()
    jobs, per_employer, seen_url, seen_key = [], [], set(), set()
    prev = {}
    prev_path = os.path.join(a.out, "jobs.json")
    if os.path.exists(prev_path):
        try:
            for j in json.load(open(prev_path)).get("jobs", []):
                prev.setdefault(j["employer"], []).append(j)
        except Exception:  # noqa: BLE001
            prev = {}
    failures = 0
    for f in feeds:
        stats = {"employer": f["employer"], "segment": f["segment"], "ats": f["ats"]}
        try:
            rows, total = POLLERS[f["ats"]](f, a.max_per_feed, today)
            kept = dup = non_us = 0
            for r in rows:
                title = clean_text(r.get("title"))
                url = r.get("url")
                if not title or not url:
                    continue
                if url in seen_url:
                    dup += 1
                    continue
                city, state, multi, is_us = parse_location(r.get("loc_raw"), r.get("loc_hint"), f.get("us_default", False), r.get("country"))
                remote = bool(r.get("remote_hint")) or bool(re.search(r"\bremote\b", (r.get("loc_raw") or "") + " " + title, re.I))
                if not is_us:
                    non_us += 1
                    continue
                key = (f["employer"], norm(title), norm(city), state)
                if key in seen_key:
                    dup += 1
                    continue
                seen_url.add(url)
                seen_key.add(key)
                cat = categorize(title)
                cdl = bool(CDL_TITLE.search(title)) or bool(CDL_DESC.search(r.get("desc") or ""))
                if multi and city and state:
                    loc_label = f"{city}, {state} + more"
                elif city and state:
                    loc_label = f"{city}, {state}"
                elif state:
                    loc_label = STATES[state]
                elif remote:
                    loc_label = "Remote (US)"
                elif multi:
                    loc_label = "Multiple locations"
                else:
                    loc_label = clean_text(r.get("loc_raw"))[:60] or "United States"
                jobs.append({
                    "title": title[:140],
                    "employer": f["employer"],
                    "location": loc_label,
                    "city": city,
                    "state": state,
                    "remote": remote,
                    "category": cat,
                    "cdl": cdl,
                    "onet": onet_for(title),
                    "posted": r.get("posted"),
                    "url": url,
                })
                kept += 1
            stats.update({"ok": True, "reported_total": total, "fetched": len(rows), "listed": kept,
                          "duplicates_removed": dup, "non_us_removed": non_us})
            print(f"OK   {f['employer']:<26} {f['ats']:<10} fetched={len(rows)} listed={kept} dup={dup} non_us={non_us}")
        except Exception as e:  # noqa: BLE001
            failures += 1
            # Keep the previous run's jobs for this employer so one bad feed does not empty the page.
            carried = [j for j in prev.get(f["employer"], []) if j["url"] not in seen_url]
            for j in carried:
                seen_url.add(j["url"])
            jobs.extend(carried)
            stats.update({"ok": False, "error": str(e)[:200], "listed": len(carried), "carried_over": True})
            print(f"FAIL {f['employer']:<26} {f['ats']:<10} {e} (kept {len(carried)} from last run)", file=sys.stderr)
        per_employer.append(stats)
        time.sleep(DELAY)
    jobs.sort(key=lambda j: (j["posted"] or "0000-00-00", j["employer"], j["title"]), reverse=True)
    counts_cat = {}
    for j in jobs:
        counts_cat[j["category"]] = counts_cat.get(j["category"], 0) + 1
    meta = {
        "updated_at": now.isoformat(timespec="seconds"),
        "total_jobs": len(jobs),
        "employers": per_employer,
        "categories": counts_cat,
        "category_labels": CATEGORY_LABELS,
        "cdl_jobs": sum(1 for j in jobs if j["cdl"]),
        "remote_jobs": sum(1 for j in jobs if j["remote"]),
        "feeds_failed": failures,
        "source_note": "Public job-posting feeds from each employer's own careers site. Apply links go to the employer.",
    }
    if not jobs:
        print("No jobs collected; leaving existing files untouched.", file=sys.stderr)
        sys.exit(1)
    with open(os.path.join(a.out, "jobs.json"), "w") as fh:
        json.dump({"updated_at": meta["updated_at"], "count": len(jobs), "jobs": jobs}, fh, separators=(",", ":"))
    with open(os.path.join(a.out, "meta.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
    print(f"Wrote {len(jobs)} jobs from {len(feeds) - failures}/{len(feeds)} feeds to {a.out}")


if __name__ == "__main__":
    main()
