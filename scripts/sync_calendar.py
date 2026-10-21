#!/usr/bin/env python3
"""Fetch the Airbnb iCal feed and write the booked nights to assets/data/booked.json.

Usage: sync_calendar.py [SOURCE]
SOURCE is an iCal URL or a local .ics path; defaults to $AIRBNB_ICAL_URL.

Only date ranges are published (no guest names or reservation details).
If the feed can't be fetched or parsed the script exits non-zero, so a
failed sync never replaces the last good calendar with an empty one.
"""
import datetime as dt
import json
import os
import sys
import urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "booked.json")


def write(payload):
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(payload, f, indent=2)


def load(source):
    if source.startswith(("http://", "https://")):
        req = urllib.request.Request(source, headers={"User-Agent": "kona-cabin-sync"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode("utf-8", "replace")
    with open(source) as f:
        return f.read()


def parse_date(value):
    return dt.datetime.strptime(value[:8], "%Y%m%d").date()


def booked_ranges(text):
    # Unfold continuation lines, then collect DTSTART/DTEND per VEVENT.
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    unfolded = []
    for line in lines:
        if line[:1] in (" ", "\t") and unfolded:
            unfolded[-1] += line[1:]
        else:
            unfolded.append(line)

    ranges, start, end, inside = [], None, None, False
    for line in unfolded:
        if line == "BEGIN:VEVENT":
            inside, start, end = True, None, None
        elif line == "END:VEVENT":
            if inside and start and end and end > start:
                ranges.append([start.isoformat(), end.isoformat()])
            inside = False
        elif inside and line.startswith("DTSTART"):
            start = parse_date(line.split(":", 1)[1])
        elif inside and line.startswith("DTEND"):
            end = parse_date(line.split(":", 1)[1])
    return sorted(ranges)


def main():
    source = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("AIRBNB_ICAL_URL", "")
    if not source:
        # No feed configured: publish an explicit "unavailable" marker so the
        # page never shows every date as open.
        write({"available": False, "booked": []})
        print("AIRBNB_ICAL_URL not set; wrote placeholder", file=sys.stderr)
        return
    text = load(source)
    if "BEGIN:VCALENDAR" not in text:
        sys.exit("Feed did not look like an iCal calendar")
    ranges = booked_ranges(text)
    write({
        "available": True,
        "updated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "booked": ranges,  # [start, end): nights booked; end date is checkout day
    })
    print(f"Wrote {len(ranges)} booked ranges")


if __name__ == "__main__":
    main()
