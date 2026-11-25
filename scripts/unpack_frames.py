"""
Splits the frame packs (public/f/<tier>/<pack>.bin) into one .webp per frame
(f/<tier>/<frame>.webp) and marks index.json with "layout": "files".
Only needed for hosts that refuse .bin files; GitHub Pages, Netlify and Vercel
serve the packs as they are.

  python3 scripts/unpack_frames.py dist            # after npm run build
  python3 scripts/unpack_frames.py dist --only hi  # keep one tier (fewer files)
"""
import json, os, sys

root = os.path.join(sys.argv[1] if len(sys.argv) > 1 else "dist", "f")
only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
with open(os.path.join(root, "index.json")) as f:
    idx = json.load(f)
for tier in list(idx["tiers"]):
    d = os.path.join(root, tier)
    if only and tier != only:
        for name in os.listdir(d): os.remove(os.path.join(d, name))
        os.rmdir(d); del idx["tiers"][tier]; continue
    for k, lens in enumerate(idx["tiers"][tier]["packs"]):
        path = os.path.join(d, f"{k}.bin")
        data = open(path, "rb").read(); pos = 0
        for j, n in enumerate(lens):
            with open(os.path.join(d, f"{k * idx['per'] + j}.webp"), "wb") as out:
                out.write(data[pos:pos + n])
            pos += n
        os.remove(path)
idx["layout"] = "files"
with open(os.path.join(root, "index.json"), "w") as f:
    json.dump(idx, f, separators=(",", ":"))
print("unpacked:", {t: sum(len(p) for p in v["packs"]) for t, v in idx["tiers"].items()})
