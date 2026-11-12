#!/usr/bin/env python3
"""Scan music/<station>/ folders and rewrite music/stations.js.
Run from the folder that holds radio.html:  python3 make_stations.py
Keeps the order, names, mottos and per-track titles/options you already set
(so a song's custom title or its "rand" start survives); new folders and new
songs are added at the end."""
import json, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "music")
JS = os.path.join(ROOT, "stations.js")
AUDIO = (".mp3", ".ogg", ".oga", ".m4a", ".aac", ".wav", ".flac", ".opus", ".webm")

old = {}; order = []
if os.path.exists(JS):
    txt = open(JS, encoding="utf-8").read()
    m = re.search(r"window\.STATIONS\s*=\s*(\[.*\])\s*;", txt, re.S)
    if m:
        try:
            for st in json.loads(m.group(1)):
                kept = {t["file"]: {k: v for k, v in t.items() if k != "file"}
                        for t in st.get("tracks", []) if isinstance(t, dict) and t.get("file")}
                old[st["folder"]] = {"name": st.get("name"), "motto": st.get("motto", ""), "tracks": kept}
                order.append(st["folder"])
        except ValueError:
            pass  # a hand-broken stations.js: start fresh rather than lose the scan

stations = []
folders = [f for f in order if os.path.isdir(os.path.join(ROOT, f))] \
        + sorted(f for f in os.listdir(ROOT) if f not in order and os.path.isdir(os.path.join(ROOT, f)))
for folder in folders:
    path = os.path.join(ROOT, folder)
    files = sorted(f for f in os.listdir(path) if f.lower().endswith(AUDIO) and not f.startswith("."))
    o = old.get(folder, {})
    kept = o.get("tracks", {})
    tracks = [{"file": f, **kept[f]} if kept.get(f) else f for f in files]   # keep a song's saved title/options
    stations.append({"folder": folder, "name": o.get("name") or "The " + folder.capitalize(),
                     "motto": o.get("motto", ""), "tracks": tracks})
    print(f"{folder}: {len(files)} song(s)")

with open(JS, "w", encoding="utf-8") as f:
    f.write("// ILLIAS RADIO — written by make_stations.py. Edit names, mottos and per-track titles/options freely; rerun to pick up new songs.\n")
    f.write("window.STATIONS = " + json.dumps(stations, indent=2, ensure_ascii=False) + ";\n")
print("wrote", os.path.relpath(JS))
