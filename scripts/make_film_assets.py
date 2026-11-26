"""
Makes everything a film needs in the AI Films room, from one video.

  python3 scripts/make_film_assets.py VIDEO SLUG --cover 12.5 [--focus 0.5,0.4] [--zoom 1]

Writes public/films/<SLUG>/:
  film.mp4     the film, web-ready: H.264/AAC, starts playing at once, and kept
               under 23 MB (GitHub's website takes 25 MB per file) — long films
               are re-encoded at 720p to fit; short ones keep their size
  card.webp    the cover on the stack: the frame at --cover, cut to the card's
               shape (portrait, 0.78) and 1100 px tall. Small sources are
               upscaled with Real-ESRGAN when PyTorch is installed
               (pip install spandrel), otherwise with Lanczos
  poster.webp  the full frame at --cover, shown in the player before it starts
  preview.mp4  a silent 6 s loop for the front card, cut to the card's shape,
               starting at the cover so the still turns straight into motion

--focus x,y   which part of the frame the card shows (0–1; 0.5,0.5 = middle)
--zoom z      < 1 cuts in tighter (e.g. 0.86 to leave subtitles out)

Then add the film to src/content/films.ts. Needs ffmpeg, Python 3, numpy,
opencv-python and Pillow.
"""
import argparse, json, os, subprocess, sys, urllib.request
import numpy as np, cv2
from PIL import Image

ASPECT = 0.78        # card width / height (matches the CSS)
CARD_H = 1100        # card cover height in px
PREVIEW_H = 1000     # front-card loop height (or the source's, if smaller)
MAX_MB = 23
MODEL_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth"

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("slug")
ap.add_argument("--cover", type=float, required=True)
ap.add_argument("--focus", default="0.5,0.5"); ap.add_argument("--zoom", type=float, default=1.0)
ap.add_argument("--keep-film", action="store_true", help="don't touch an existing film.mp4")
a = ap.parse_args()
fx, fy = (float(v) for v in a.focus.split(","))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "films", a.slug)
os.makedirs(out, exist_ok=True)

def probe(path):
    j = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate", "-of", "json", path]))
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    n, d = (v.get("avg_frame_rate") or "30/1").split("/")
    fps = float(n) / float(d or 1) if float(d or 0) else 30.0
    return float(j["format"]["duration"]), v["width"], v["height"], any(s["codec_type"] == "audio" for s in j["streams"]), v["codec_name"], fps

def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)

dur, W, H, audio, vcodec, src_fps = probe(a.video)

# the card's cut of the frame, in source pixels
def card_box(w, h):
    if w / h > ASPECT:
        ch = int(h * a.zoom); cw = int(ch * ASPECT)
    else:
        cw = int(w * a.zoom); ch = int(cw / ASPECT)
    x = int(np.clip(fx * w - cw / 2, 0, w - cw)); y = int(np.clip(fy * h - ch / 2, 0, h - ch))
    return x, y, cw - cw % 2, ch - ch % 2

# ---------- film.mp4 ----------
film = os.path.join(out, "film.mp4")
if not (a.keep_film and os.path.exists(film)):
    size_mb = os.path.getsize(a.video) / 2**20
    if size_mb <= MAX_MB and vcodec == "h264" and max(W, H) <= 1920:
        ff("-i", a.video, "-c", "copy", "-movflags", "+faststart", film)
    else:
        a_kbps = 112 if audio else 0
        budget = MAX_MB * 8 * 1024 / dur - a_kbps            # video kbps that fits the size limit
        long_side = 1920 if budget >= 3500 else 1280         # 720p when the budget is tight
        scale = f"scale='if(gt(iw,ih),min({long_side},iw),-2)':'if(gt(iw,ih),-2,min({long_side},ih))'"
        v_kbps = int(min(budget, 6000 if long_side == 1920 else 2500))
        common = ["-vf", scale + (",fps=30" if src_fps > 31 else ""), "-c:v", "libx264", "-preset", "medium", "-b:v", f"{v_kbps}k", "-pix_fmt", "yuv420p"]
        log = os.path.join(out, "x264pass")
        ff("-i", a.video, *common, "-pass", "1", "-passlogfile", log, "-an", "-f", "mp4", os.devnull)
        ff("-i", a.video, *common, "-pass", "2", "-passlogfile", log, *(["-c:a", "aac", "-b:a", f"{a_kbps}k"] if audio else ["-an"]), "-movflags", "+faststart", film)
        for f in os.listdir(out):
            if f.startswith("x264pass"): os.remove(os.path.join(out, f))

# ---------- the cover frame ----------
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", f"{a.cover}", "-i", a.video, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
frame = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
Image.fromarray(frame).resize((W, H) if max(W, H) <= 1600 else ((1600, round(1600 * H / W)) if W > H else (round(1600 * W / H), 1600)), Image.LANCZOS).save(os.path.join(out, "poster.webp"), "WEBP", quality=84, method=6)

x, y, cw, ch = card_box(W, H)
crop = frame[y:y + ch, x:x + cw]

def upscale(img):
    """Real-ESRGAN ×4 if PyTorch + spandrel are installed, else None."""
    try:
        import torch, spandrel
    except ImportError:
        return None
    path = os.path.expanduser("~/.cache/realesr-general-x4v3.pth")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, path)
    m = spandrel.ModelLoader().load_from_file(path).eval()
    with torch.no_grad():
        t = torch.from_numpy(img.copy()).permute(2, 0, 1).float().unsqueeze(0) / 255
        y4 = m(t).clamp(0, 1)[0].permute(1, 2, 0).numpy()
    return (y4 * 255 + 0.5).astype(np.uint8)

if ch < CARD_H:
    big = upscale(crop)
    how = "Real-ESRGAN x4" if big is not None else "Lanczos"
    card = Image.fromarray(big if big is not None else crop).resize((round(CARD_H * ASPECT), CARD_H), Image.LANCZOS)
else:
    how = "downscaled"
    card = Image.fromarray(cv2.resize(crop, (round(CARD_H * ASPECT), CARD_H), interpolation=cv2.INTER_AREA))
card.save(os.path.join(out, "card.webp"), "WEBP", quality=88, method=6)

# ---------- preview.mp4 ----------
st = max(0.0, min(dur - 6.1, a.cover))
ph = min(PREVIEW_H, ch); ph -= ph % 2; pw = round(ph * ASPECT); pw -= pw % 2
ff("-ss", f"{st:.2f}", "-t", "6", "-i", a.video, "-an",
   "-vf", f"crop={cw}:{ch}:{x}:{y},scale={pw}:{ph}:flags=lanczos,fps=30",
   "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(out, "preview.mp4"))

sizes = {f: f"{os.path.getsize(os.path.join(out, f)) / 2**20:.1f} MB" for f in sorted(os.listdir(out))}
fd, fw, fh, _, _, _ = probe(film)
print(f"{a.slug}: film {fw}x{fh} {fd:.0f}s · card from {cw}x{ch} ({how}) · {sizes}")
