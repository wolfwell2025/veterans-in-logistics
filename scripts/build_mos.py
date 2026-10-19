#!/usr/bin/env python3
"""Build data/mos.json, a small military-code lookup for the jobs page.

Source: O*NET Military Crosswalk (July 2024, milx0724.csv), a public download from
https://www.onetcenter.org/crosswalks.html. Only active codes that crosswalk to
logistics-relevant civilian occupations are kept, and only those occupations.

Usage: python3 scripts/build_mos.py /path/to/milx0724.csv
"""
import csv, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "data", "mos.json")

# Crosswalk service code -> branch shown on the site.
SVC_BRANCH = {"A": "Army", "N": "Navy", "P": "Navy", "F": "Air Force", "M": "Marine Corps", "C": "Coast Guard", "H": "Space Force"}

# Logistics-relevant O*NET occupations -> job category used to match live jobs.
def onet_category(code):
    if code.startswith(("53-3032", "53-3033", "53-3031", "53-3053", "53-3099")):
        return "driving_cdl"
    if code.startswith(("49-3023", "49-3031", "49-3042", "49-3021", "49-3041", "49-3093", "49-9071", "49-9041", "49-9043", "49-2093")):
        return "maintenance_technician"
    if code.startswith(("53-7051", "53-7062", "53-7064", "53-7065", "53-7121", "53-7199", "43-5071", "43-5081", "43-5111")):
        return "warehouse_dock"
    if code.startswith(("43-5011", "43-5032", "43-5061", "43-5021", "13-1081")):
        return "dispatch_operations"
    if code.startswith(("13-1023", "11-3061", "41-4012", "13-1022")):
        return "brokerage_sales"
    if code.startswith(("11-3071", "53-1041", "53-1042", "53-1043", "53-1044", "53-1047", "53-1049")):
        return "management"
    return None


def main(path):
    onet, codes = {}, {}
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as fh:
        for r in csv.DictReader(fh):
            if r["STATUS"] != "A" or r["SVC"] not in SVC_BRANCH:
                continue
            branch = SVC_BRANCH[r["SVC"]]
            moc = r["MOC"].strip().upper()
            if not moc or moc == "-":
                continue
            hits = []
            for i in range(1, 5):
                c, t = (r.get(f"ONET{i}") or "").strip(), (r.get(f"ONET{i}_TITLE") or "").strip()
                cat = onet_category(c) if c and c != "-" else None
                if cat:
                    onet[c] = [t, cat]
                    hits.append(c)
            if not hits:
                continue
            key = (branch, moc)
            entry = codes.setdefault(key, {"titles": [], "onet": []})
            title = r["MOC_TITLE"].strip()
            if title and title not in entry["titles"]:
                entry["titles"].append(title)
            for c in hits:
                if c not in entry["onet"]:
                    entry["onet"].append(c)
    rows = [[b, m, " / ".join(v["titles"][:2])[:120], v["onet"]] for (b, m), v in sorted(codes.items())]
    out = {
        "source": "O*NET Military Crosswalk, July 2024 (onetcenter.org). Filtered to logistics-relevant occupations.",
        "fields": ["branch", "code", "title", "onet_codes"],
        "onet": onet,
        "codes": rows,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump(out, fh, separators=(",", ":"))
    print(f"Wrote {len(rows)} military codes and {len(onet)} occupations to {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/workspace/vil-rebuild/matching/data/military_crosswalk/milx0724.csv")
