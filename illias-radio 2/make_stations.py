#!/usr/bin/env python3
"""Scan music/<station>/ folders and rewrite music/stations.js.
Run from the folder that holds radio.html:  python3 make_stations.py
Keeps the order, names and mottos you already set; new folders are added at the end."""
import json, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "music")
JS = os.path.join(ROOT, "stations.js")
AUDIO = (".mp3", ".ogg", ".oga", ".m4a", ".aac", ".wav", ".flac", ".opus", ".webm")

old = {}; order = []
if os.path.exists(JS):
    txt = open(JS, encoding="utf-8").read()
    for m in re.finditer(r'folder:\s*"([^"]+)"(.*?)(?=folder:|\];)', txt, re.S):
        name = re.search(r'name:\s*"([^"]*)"', m.group(2)); motto = re.search(r'motto:\s*"([^"]*)"', m.group(2))
        old[m.group(1)] = (name.group(1) if name else None, motto.group(1) if motto else ""); order.append(m.group(1))

stations = []
folders = [f for f in order if os.path.isdir(os.path.join(ROOT, f))] + sorted(f for f in os.listdir(ROOT) if f not in order)
for folder in folders:
    path = os.path.join(ROOT, folder)
    if not os.path.isdir(path): continue
    files = sorted(f for f in os.listdir(path) if f.lower().endswith(AUDIO) and not f.startswith("."))
    name, motto = old.get(folder, (None, ""))
    stations.append({"folder": folder, "name": name or "The " + folder.capitalize(), "motto": motto, "tracks": files})
    print(f"{folder}: {len(files)} song(s)")

with open(JS, "w", encoding="utf-8") as f:
    f.write("// ILLIAS RADIO — written by make_stations.py. Edit names and mottos freely; rerun to pick up new songs.\n")
    f.write("window.STATIONS = " + json.dumps(stations, indent=2, ensure_ascii=False) + ";\n")
print("wrote", os.path.relpath(JS))
