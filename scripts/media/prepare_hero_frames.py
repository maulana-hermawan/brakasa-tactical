"""Prepare and standardize the 10 Brakasa Tactical Hero keyframes to 16:9 overscan (2400x1350).

Outputs:
  - public/media/images/hero/hero-scene-01.jpg .. hero-scene-10.jpg (2400x1350, LANCZOS + unsharp, JPEG q=92)
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

WORKSPACE = Path(r"d:\brakasa-tac")
OUT_DIR = WORKSPACE / "public" / "media" / "images" / "hero"

TARGET_SIZE = (2400, 1350)  # Exact 16:9 overscan for 1080p subpixel camera rig
JPEG_QUALITY = 92

RAW_KEYFRAMES: list[tuple[str, str]] = [
    ("hero-scene-01.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_01_1795068134744.jpg"),
    ("hero-scene-02.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_02_1795068154921.jpg"),
    ("hero-scene-03.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_03_1795068223258.jpg"),
    ("hero-scene-04.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_04_1795068243743.jpg"),
    ("hero-scene-05.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_05_1795068271757.jpg"),
    ("hero-scene-06.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_06_1795068137150.jpg"),
    ("hero-scene-07.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_07_1795068177712.jpg"),
    ("hero-scene-08.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_08_1795068197864.jpg"),
    ("hero-scene-09.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_09_1795068243894.jpg"),
    ("hero-scene-10.jpg", r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182\hero_scene_10_1795068269550.jpg"),
]


def prepare_all() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    unsharp = ImageFilter.UnsharpMask(radius=1.2, percent=85, threshold=3)

    print(f"Preparing {len(RAW_KEYFRAMES)} hero keyframes -> {OUT_DIR} ({TARGET_SIZE[0]}x{TARGET_SIZE[1]}, q={JPEG_QUALITY})")
    for out_name, src_str in RAW_KEYFRAMES:
        src_path = Path(src_str)
        if not src_path.exists():
            raise FileNotFoundError(f"Missing raw keyframe: {src_path}")

        with Image.open(src_path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            orig_size = im.size
            # Center-fit to exact 16:9 overscan canvas using LANCZOS
            fitted = ImageOps.fit(
                im,
                TARGET_SIZE,
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            sharpened = fitted.filter(unsharp)

            out_path = OUT_DIR / out_name
            sharpened.save(
                out_path,
                format="JPEG",
                quality=JPEG_QUALITY,
                optimize=True,
                progressive=True,
                subsampling=0,
            )

        # Verify written file
        size_bytes = os.path.getsize(out_path)
        if size_bytes <= 0:
            raise RuntimeError(f"Output file is empty: {out_path}")
        with Image.open(out_path) as verify_im:
            verify_im.verify()
        with Image.open(out_path) as check_im:
            if check_im.size != TARGET_SIZE:
                raise RuntimeError(f"Unexpected output size {check_im.size} for {out_path}")
            print(
                f"  [OK] {out_name}: {orig_size[0]}x{orig_size[1]} -> "
                f"{check_im.size[0]}x{check_im.size[1]} ({size_bytes / 1024:.1f} KB)"
            )

    print("All 10 hero keyframes verified successfully.")


if __name__ == "__main__":
    try:
        prepare_all()
    except Exception as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        sys.exit(1)
