"""
Builds the film frames the site plays on scroll.

  python3 scripts/make_frames.py path/to/tower-film.mp4

Writes into public/f/:
  p/<n>.webp        preview sheets: 64 small frames (480x270) each, 8x8 with a 4 px gutter
  hi/<k>.bin        sharp frames 2560x1440, 24 per pack (WebP files stored back to back)
  mid/<k>.bin       the same at 1600x900
  tall/<k>.bin      portrait phones: 1240x1440 cut from the 2560 frame around the
                    film's subject (x 456-1696), half the decoding work of "hi"
  index.json        byte length of every frame inside its pack

Every frame gets a light unsharp mask before compression (AI footage is soft).
Needs: ffmpeg, Python 3 with numpy, opencv-python and Pillow.
"""
import json, os, subprocess, sys, io, shutil
import numpy as np, cv2
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "film/tower-film-v4.mp4"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "f")
PER = 24
TIERS = {"hi": (2560, 1440, 84), "mid": (1600, 900, 82), "tall": (2560, 1440, 84)}
# the "tall" cut: every focal point the site uses (0.34-0.5 of the width) seen on a screen up to 9:16
TALL_X, TALL_W = 456, 1240
SHEET = dict(cols=8, rows=8, w=480, h=270, gutter=4, q=52)

def sharpen(img, amount=0.6, sigma=1.4):
    blur = cv2.GaussianBlur(img, (0, 0), sigma)
    return cv2.addWeighted(img, 1 + amount, blur, -amount, 0)

def webp(rgb, q):
    b = io.BytesIO()
    Image.fromarray(rgb).save(b, "WEBP", quality=q, method=6)
    return b.getvalue()

def frames():
    w, h = 2560, 1440
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", SRC, "-vf", f"scale={w}:{h}:flags=lanczos",
                          "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n: break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)

for d in ["p", *TIERS]:
    shutil.rmtree(os.path.join(OUT, d), ignore_errors=True)
    os.makedirs(os.path.join(OUT, d))

index = {"per": PER, "tiers": {}}
packs = {t: [] for t in TIERS}       # current pack bytes
lengths = {t: [] for t in TIERS}     # per pack: list of frame lengths
sheet_imgs = []
count = 0

def flush(t):
    k = len(lengths[t])
    with open(os.path.join(OUT, t, f"{k}.bin"), "wb") as f:
        for b in packs[t]: f.write(b)
    lengths[t].append([len(b) for b in packs[t]])
    packs[t] = []

for bgr in frames():
    sharp = sharpen(bgr)
    for t, (w, h, q) in TIERS.items():
        img = sharp if w == 2560 else cv2.resize(sharp, (w, h), interpolation=cv2.INTER_AREA)
        if t == "tall": img = img[:, TALL_X:TALL_X + TALL_W]
        packs[t].append(webp(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), q))
        if len(packs[t]) == PER: flush(t)
    sheet_imgs.append(cv2.resize(bgr, (SHEET["w"], SHEET["h"]), interpolation=cv2.INTER_AREA))
    count += 1
for t in TIERS:
    if packs[t]: flush(t)

# preview sheets
S = SHEET; per_sheet = S["cols"] * S["rows"]; g = S["gutter"]
for a in range((count + per_sheet - 1) // per_sheet):
    sheet = np.full((S["rows"] * (S["h"] + g), S["cols"] * (S["w"] + g), 3), (24, 20, 10), np.uint8)
    for k, im in enumerate(sheet_imgs[a * per_sheet:(a + 1) * per_sheet]):
        x = (k % S["cols"]) * (S["w"] + g) + g // 2; y = (k // S["cols"]) * (S["h"] + g) + g // 2
        sheet[y:y + S["h"], x:x + S["w"]] = im
    Image.fromarray(cv2.cvtColor(sheet, cv2.COLOR_BGR2RGB)).save(os.path.join(OUT, "p", f"{a}.webp"), "WEBP", quality=S["q"], method=6)

index["frames"] = count
for t, (w, h, q) in TIERS.items():
    index["tiers"][t] = {"w": w, "h": h, "packs": lengths[t]}
    if t == "tall": index["tiers"][t]["crop"] = {"x": TALL_X, "w": TALL_W}
with open(os.path.join(OUT, "index.json"), "w") as f:
    json.dump(index, f, separators=(",", ":"))
print("frames", count, {t: len(v) for t, v in lengths.items()})
