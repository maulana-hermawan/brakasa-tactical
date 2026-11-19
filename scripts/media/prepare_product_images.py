#!/usr/bin/env python3
"""
Normalize all 26 Brakasa Tactical generative product images to exact 16:9 (1600x900)
high-quality progressive JPEG (quality=90) in public/media/images/products/.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from PIL import Image, ImageFilter

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "public" / "media" / "images" / "products"
RAW_BASE = Path(r"C:\Users\MSI GAMING\.gemini\antigravity\brain\d6e7c827-e2ef-4535-906e-038c73850182")

TARGET_SIZE = (1600, 900)
TARGET_RATIO = TARGET_SIZE[0] / TARGET_SIZE[1]
JPEG_QUALITY = 90

# Exact mapping of all 26 product images (20 primary SKUs + 6 secondary detail shots)
PRODUCT_IMAGE_MAP: list[tuple[str, str]] = [
    ("brk-ar-001.jpg", "brk_ar_001_1795068139717.jpg"),
    ("brk-ar-002.jpg", "brk_ar_002_1795068172534.jpg"),
    ("brk-ar-003.jpg", "brk_ar_003_1795068189713.jpg"),
    ("brk-smg-001.jpg", "brk_smg_001_1795068208999.jpg"),
    ("brk-snp-001.jpg", "brk_snp_001_1795068158588.jpg"),
    ("brk-pst-001.jpg", "brk_pst_001_1795068214505.jpg"),
    ("brk-opt-001.jpg", "brk_opt_001_1795068141873.jpg"),
    ("brk-opt-002.jpg", "brk_opt_002_1795068158621.jpg"),
    ("brk-opt-003.jpg", "brk_opt_003_1795068178171.jpg"),
    ("brk-rig-001.jpg", "brk_rig_001_1795068196987.jpg"),
    ("brk-rig-002.jpg", "brk_rig_002_1795068219843.jpg"),
    ("brk-hlm-001.jpg", "brk_hlm_001_1795068263797.jpg"),
    ("brk-hlm-002.jpg", "brk_hlm_002_1795068346995.jpg"),
    ("brk-app-001.jpg", "brk_app_001_1795068144393.jpg"),
    ("brk-app-002.jpg", "brk_app_002_1795068160860.jpg"),
    ("brk-app-003.jpg", "brk_app_003_1795068177929.jpg"),
    ("brk-csm-001.jpg", "brk_csm_001_1795068196087.jpg"),
    ("brk-csm-002.jpg", "brk_csm_002_1795068217844.jpg"),
    ("brk-csm-003.jpg", "brk_csm_003_1795068256727.jpg"),
    ("brk-upg-001.jpg", "brk_upg_001_1795068294122.jpg"),
    ("brk-ar-001-detail.jpg", "brk_ar_001_detail_1795068256677.jpg"),
    ("brk-ar-002-detail.jpg", "brk_ar_002_detail_1795068277656.jpg"),
    ("brk-smg-001-detail.jpg", "brk_smg_001_detail_1795068253582.jpg"),
    ("brk-snp-001-detail.jpg", "brk_snp_001_detail_1795068295862.jpg"),
    ("brk-pst-001-detail.jpg", "brk_pst_001_detail_1795068349731.jpg"),
    ("brk-rig-001-detail.jpg", "brk_rig_001_detail_1795068246584.jpg"),
]


def crop_to_aspect(img: Image.Image, target_ratio: float) -> Image.Image:
    """Symmetric center crop to exact aspect ratio without stretching."""
    w, h = img.size
    current_ratio = w / h
    if abs(current_ratio - target_ratio) < 1e-4:
        return img
    if current_ratio > target_ratio:
        new_w = int(round(h * target_ratio))
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    new_h = int(round(w / target_ratio))
    top = (h - new_h) // 2
    return img.crop((0, top, w, top + new_h))


def normalize_one(out_name: str, raw_name: str) -> tuple[str, tuple[int, int], int]:
    src_path = RAW_BASE / raw_name
    if not src_path.exists():
        raise FileNotFoundError(f"Missing raw image: {src_path}")

    dst_path = OUT_DIR / out_name
    with Image.open(src_path) as im:
        rgb = im.convert("RGB")
        cropped = crop_to_aspect(rgb, TARGET_RATIO)
        resized = cropped.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        sharpened = resized.filter(
            ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=3)
        )
        sharpened.save(
            dst_path,
            format="JPEG",
            quality=JPEG_QUALITY,
            optimize=True,
            progressive=True,
            subsampling=1,
        )

    # Re-open to verify file integrity
    with Image.open(dst_path) as check:
        check.load()
        size = check.size
        if size != TARGET_SIZE:
            raise RuntimeError(f"Dimension mismatch for {out_name}: got {size}")
    byte_size = os.path.getsize(dst_path)
    if byte_size <= 0:
        raise RuntimeError(f"Zero-byte output for {out_name}")
    return out_name, size, byte_size


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total_bytes = 0
    results: list[tuple[str, tuple[int, int], int]] = []

    for out_name, raw_name in PRODUCT_IMAGE_MAP:
        res = normalize_one(out_name, raw_name)
        results.append(res)
        total_bytes += res[2]

    print(f"Normalized {len(results)}/26 product images to {TARGET_SIZE[0]}x{TARGET_SIZE[1]} JPEG (q={JPEG_QUALITY}):")
    for name, (w, h), nbytes in results:
        print(f"  OK  {name:24s}  {w}x{h}  {nbytes / 1024:6.1f} KB")
    print(f"Total size: {total_bytes / (1024 * 1024):.2f} MB ({OUT_DIR})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
