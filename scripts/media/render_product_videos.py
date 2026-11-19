#!/usr/bin/env python3
"""
Brakasa Tactical - Store Product Demo Video Renderer (7x 3-Beat Studio Inspection Reels)

Renders 7 silent 1280x720 @ 30fps H.264 (yuv420p, +faststart) product demo videos and
7 matching <80KB JPEG posters into public/media/videos/ using PIL + NumPy + static ffmpeg
from imageio-ffmpeg. Does NOT touch hero-tactical-reel.mp4 or hero assets.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
import math
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import time
from typing import Sequence

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageFilter

REPO_ROOT = Path(__file__).resolve().parents[2]
PRODUCTS_IMG_DIR = REPO_ROOT / "public" / "media" / "images" / "products"
VIDEOS_OUT_DIR = REPO_ROOT / "public" / "media" / "videos"

OUT_W = 1280
OUT_H = 720
FPS = 30
OVERSCAN_W = 2240
OVERSCAN_H = 1260
TRANSITION_FRAMES = 10  # ~0.33s rack-focus dissolve between beats
LOOP_BLEND_FRAMES = 8   # ~0.27s seamless loop return to frame 0


@dataclass(frozen=True)
class BeatSpec:
    image_key: str                  # "primary" or "detail"
    frames: int
    scale_start: float
    scale_end: float
    fx_start: float                 # normalized focus x [0..1]
    fy_start: float                 # normalized focus y [0..1]
    fx_end: float
    fy_end: float
    rot_start_deg: float = 0.0
    rot_end_deg: float = 0.0
    easing: str = "in_out_cubic"    # "out_cubic", "in_out_cubic", "in_out_sine"
    rack_in_frames: int = 0         # cinema focus-lock pull on beat entry
    sweep_strength: float = 0.0     # luma-masked specular highlight sweep intensity
    sweep_angle_deg: float = 28.0
    sweep_tint: tuple[float, float, float] = (1.00, 0.96, 0.88)


@dataclass(frozen=True)
class ProductVideoSpec:
    sku_slug: str
    title: str
    primary_file: str
    detail_file: str | None
    beats: tuple[BeatSpec, BeatSpec, BeatSpec]
    poster_frame_index: int = 20

    @property
    def total_frames(self) -> int:
        return sum(b.frames for b in self.beats)

    @property
    def duration_sec(self) -> float:
        return self.total_frames / FPS

    @property
    def mp4_name(self) -> str:
        return f"product-{self.sku_slug}.mp4"

    @property
    def poster_name(self) -> str:
        return f"product-{self.sku_slug}-poster.jpg"


# 7 Product Demo Videos synchronized with docs/specs/03-ARCHITECTURE.md & Section 3.5
PRODUCT_VIDEOS: tuple[ProductVideoSpec, ...] = (
    # 1. Tokyo Marui MK18 Mod.1 MWS GBBR (8.0s = 240f)
    ProductVideoSpec(
        sku_slug="brk-ar-001",
        title="Tokyo Marui MK18 Mod.1 MWS GBBR",
        primary_file="brk-ar-001.jpg",
        detail_file="brk-ar-001-detail.jpg",
        beats=(
            BeatSpec(
                image_key="primary",
                frames=78,
                scale_start=1.03,
                scale_end=1.16,
                fx_start=0.50,
                fy_start=0.50,
                fx_end=0.48,
                fy_end=0.49,
                rot_start_deg=-0.35,
                rot_end_deg=0.25,
                easing="out_cubic",
                sweep_strength=0.18,
                sweep_angle_deg=24.0,
            ),
            BeatSpec(
                image_key="detail",
                frames=84,
                scale_start=1.05,
                scale_end=1.22,
                fx_start=0.44,
                fy_start=0.46,
                fx_end=0.56,
                fy_end=0.44,
                rot_start_deg=0.35,
                rot_end_deg=-0.20,
                easing="in_out_cubic",
                rack_in_frames=12,
                sweep_strength=0.30,
                sweep_angle_deg=32.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=78,
                scale_start=1.36,
                scale_end=1.14,
                fx_start=0.33,
                fy_start=0.47,
                fx_end=0.56,
                fy_end=0.49,
                rot_start_deg=-0.20,
                rot_end_deg=0.0,
                easing="in_out_sine",
                sweep_strength=0.26,
                sweep_angle_deg=20.0,
            ),
        ),
        poster_frame_index=18,
    ),
    # 2. VFC Avalon Saber Carbine M-LOK AEG (7.8s = 234f)
    ProductVideoSpec(
        sku_slug="brk-ar-002",
        title="VFC Avalon Saber Carbine M-LOK AEG",
        primary_file="brk-ar-002.jpg",
        detail_file="brk-ar-002-detail.jpg",
        beats=(
            BeatSpec(
                image_key="primary",
                frames=78,
                scale_start=1.03,
                scale_end=1.17,
                fx_start=0.50,
                fy_start=0.50,
                fx_end=0.51,
                fy_end=0.48,
                rot_start_deg=0.30,
                rot_end_deg=-0.25,
                easing="out_cubic",
                sweep_strength=0.18,
                sweep_angle_deg=26.0,
            ),
            BeatSpec(
                image_key="detail",
                frames=78,
                scale_start=1.12,
                scale_end=1.25,
                fx_start=0.38,
                fy_start=0.48,
                fx_end=0.64,
                fy_end=0.52,
                rot_start_deg=-0.30,
                rot_end_deg=0.25,
                easing="in_out_cubic",
                rack_in_frames=11,
                sweep_strength=0.32,
                sweep_angle_deg=34.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=78,
                scale_start=1.35,
                scale_end=1.13,
                fx_start=0.34,
                fy_start=0.52,
                fx_end=0.55,
                fy_end=0.48,
                rot_start_deg=0.20,
                rot_end_deg=0.0,
                easing="in_out_sine",
                sweep_strength=0.24,
                sweep_angle_deg=22.0,
            ),
        ),
        poster_frame_index=18,
    ),
    # 3. G&G ARP9 2.0 CQB PDW AEG (7.5s = 225f)
    ProductVideoSpec(
        sku_slug="brk-smg-001",
        title="G&G ARP9 2.0 CQB PDW AEG",
        primary_file="brk-smg-001.jpg",
        detail_file="brk-smg-001-detail.jpg",
        beats=(
            BeatSpec(
                image_key="primary",
                frames=75,
                scale_start=1.04,
                scale_end=1.18,
                fx_start=0.50,
                fy_start=0.50,
                fx_end=0.47,
                fy_end=0.47,
                rot_start_deg=-0.35,
                rot_end_deg=0.25,
                easing="out_cubic",
                sweep_strength=0.18,
                sweep_angle_deg=25.0,
            ),
            BeatSpec(
                image_key="detail",
                frames=75,
                scale_start=1.14,
                scale_end=1.24,
                fx_start=0.32,
                fy_start=0.58,
                fx_end=0.56,
                fy_end=0.42,
                rot_start_deg=0.35,
                rot_end_deg=-0.25,
                easing="in_out_cubic",
                rack_in_frames=10,
                sweep_strength=0.28,
                sweep_angle_deg=30.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=75,
                scale_start=1.30,
                scale_end=1.12,
                fx_start=0.36,
                fy_start=0.45,
                fx_end=0.60,
                fy_end=0.47,
                rot_start_deg=-0.20,
                rot_end_deg=0.0,
                easing="in_out_sine",
                sweep_strength=0.22,
                sweep_angle_deg=20.0,
            ),
        ),
        poster_frame_index=16,
    ),
    # 4. Silverback TAC-41 P Bolt-Action Sniper (8.5s = 255f)
    ProductVideoSpec(
        sku_slug="brk-snp-001",
        title="Silverback TAC-41 P Bolt-Action Sniper",
        primary_file="brk-snp-001.jpg",
        detail_file="brk-snp-001-detail.jpg",
        beats=(
            BeatSpec(
                image_key="primary",
                frames=87,
                scale_start=1.30,
                scale_end=1.24,
                fx_start=0.68,
                fy_start=0.48,
                fx_end=0.36,
                fy_end=0.50,
                rot_start_deg=0.20,
                rot_end_deg=-0.20,
                easing="in_out_sine",
                sweep_strength=0.20,
                sweep_angle_deg=22.0,
            ),
            BeatSpec(
                image_key="detail",
                frames=84,
                scale_start=1.08,
                scale_end=1.24,
                fx_start=0.40,
                fy_start=0.48,
                fx_end=0.68,
                fy_end=0.44,
                rot_start_deg=-0.30,
                rot_end_deg=0.25,
                easing="in_out_cubic",
                rack_in_frames=14,
                sweep_strength=0.34,
                sweep_angle_deg=35.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=84,
                scale_start=1.22,
                scale_end=1.03,
                fx_start=0.48,
                fy_start=0.49,
                fx_end=0.50,
                fy_end=0.50,
                rot_start_deg=0.20,
                rot_end_deg=0.0,
                easing="out_cubic",
                sweep_strength=0.16,
                sweep_angle_deg=24.0,
            ),
        ),
        poster_frame_index=244,  # Crisp wide silhouette from Beat 3 reveal
    ),
    # 5. Umarex / VFC Glock 17 Gen5 GBB Pistol (6.5s = 195f)
    ProductVideoSpec(
        sku_slug="brk-pst-001",
        title="Umarex VFC Glock 17 Gen5 GBB",
        primary_file="brk-pst-001.jpg",
        detail_file="brk-pst-001-detail.jpg",
        beats=(
            BeatSpec(
                image_key="primary",
                frames=66,
                scale_start=1.04,
                scale_end=1.18,
                fx_start=0.50,
                fy_start=0.54,
                fx_end=0.47,
                fy_end=0.46,
                rot_start_deg=-0.35,
                rot_end_deg=0.30,
                easing="out_cubic",
                sweep_strength=0.22,
                sweep_angle_deg=28.0,
            ),
            BeatSpec(
                image_key="detail",
                frames=66,
                scale_start=1.10,
                scale_end=1.24,
                fx_start=0.34,
                fy_start=0.58,
                fx_end=0.56,
                fy_end=0.38,
                rot_start_deg=0.30,
                rot_end_deg=-0.25,
                easing="in_out_cubic",
                rack_in_frames=10,
                sweep_strength=0.34,
                sweep_angle_deg=36.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=63,
                scale_start=1.26,
                scale_end=1.05,
                fx_start=0.58,
                fy_start=0.54,
                fx_end=0.50,
                fy_end=0.50,
                rot_start_deg=-0.20,
                rot_end_deg=0.0,
                easing="out_cubic",
                sweep_strength=0.20,
                sweep_angle_deg=22.0,
            ),
        ),
        poster_frame_index=16,
    ),
    # 6. Pew Tactical FCPC V5 Plate Carrier (7.5s = 225f)
    ProductVideoSpec(
        sku_slug="brk-rig-001",
        title="Pew Tactical FCPC V5 Plate Carrier",
        primary_file="brk-rig-001.jpg",
        detail_file="brk-rig-001-detail.jpg",
        beats=(
            BeatSpec(
                image_key="primary",
                frames=75,
                scale_start=1.22,
                scale_end=1.13,
                fx_start=0.52,
                fy_start=0.64,
                fx_end=0.50,
                fy_end=0.36,
                rot_start_deg=-0.25,
                rot_end_deg=0.20,
                easing="in_out_cubic",
                sweep_strength=0.16,
                sweep_angle_deg=25.0,
            ),
            BeatSpec(
                image_key="detail",
                frames=75,
                scale_start=1.06,
                scale_end=1.20,
                fx_start=0.38,
                fy_start=0.52,
                fx_end=0.64,
                fy_end=0.50,
                rot_start_deg=0.30,
                rot_end_deg=-0.25,
                easing="in_out_sine",
                rack_in_frames=10,
                sweep_strength=0.24,
                sweep_angle_deg=30.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=75,
                scale_start=1.18,
                scale_end=1.03,
                fx_start=0.49,
                fy_start=0.52,
                fx_end=0.50,
                fy_end=0.50,
                rot_start_deg=0.20,
                rot_end_deg=0.0,
                easing="out_cubic",
                sweep_strength=0.18,
                sweep_angle_deg=20.0,
            ),
        ),
        poster_frame_index=215,  # Clean full-silhouette reveal frame
    ),
    # 7. Vector Optics Forester 1-5x24 SFP LPVO Scope - Single High-Res Master Mode (7.0s = 210f)
    ProductVideoSpec(
        sku_slug="brk-opt-002",
        title="Vector Optics Forester 1-5x24 SFP LPVO Scope",
        primary_file="brk-opt-002.jpg",
        detail_file=None,
        beats=(
            BeatSpec(
                image_key="primary",
                frames=72,
                scale_start=1.03,
                scale_end=1.17,
                fx_start=0.50,
                fy_start=0.50,
                fx_end=0.50,
                fy_end=0.48,
                rot_start_deg=-0.30,
                rot_end_deg=0.20,
                easing="out_cubic",
                sweep_strength=0.18,
                sweep_angle_deg=24.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=69,
                scale_start=1.46,
                scale_end=1.60,
                fx_start=0.54,
                fy_start=0.38,
                fx_end=0.64,
                fy_end=0.42,
                rot_start_deg=0.30,
                rot_end_deg=-0.25,
                easing="in_out_cubic",
                rack_in_frames=10,
                sweep_strength=0.32,
                sweep_angle_deg=34.0,
            ),
            BeatSpec(
                image_key="primary",
                frames=69,
                scale_start=1.48,
                scale_end=1.10,
                fx_start=0.32,
                fy_start=0.52,
                fx_end=0.49,
                fy_end=0.50,
                rot_start_deg=-0.25,
                rot_end_deg=0.0,
                easing="in_out_sine",
                sweep_strength=0.36,
                sweep_angle_deg=38.0,
                sweep_tint=(0.82, 1.00, 0.90),  # Emerald anti-reflective lens glint
            ),
        ),
        poster_frame_index=18,
    ),
)


class StudioVisualAssets:
    """Precomputed 1280x720 NumPy masks and film-grain pool shared across all renders."""

    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height

        yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
        self.nx = (xx / float(width)) * 2.0 - 1.0   # [-1 .. +1]
        self.ny = (yy / float(height)) * 2.0 - 1.0  # [-1 .. +1]

        # Subtle studio vignette preserving true product color at center
        r_ellip = np.sqrt((self.nx * 0.94) ** 2 + (self.ny * 1.02) ** 2)
        vig = np.clip(1.0 - 0.24 * (r_ellip ** 2.2), 0.62, 1.0).astype(np.float32)
        self.vignette = vig[:, :, None]

        # Deterministic 16-frame 35mm fine film grain pool (prevents H.264 dark-gradient banding)
        rng = np.random.default_rng(20260717)
        self.grain_pool = [
            rng.normal(0.0, 2.0 / 255.0, size=(height, width, 1)).astype(np.float32)
            for _ in range(16)
        ]

    def specular_mask(self, progress: float, angle_deg: float) -> np.ndarray:
        """Diagonal soft studio light ribbon moving across normalized frame coordinates."""
        rad = math.radians(angle_deg)
        proj = self.nx * math.cos(rad) + self.ny * math.sin(rad)
        pos = -1.65 + 3.30 * progress
        sigma = 0.22
        return np.exp(-((proj - pos) ** 2) / (2.0 * sigma * sigma)).astype(np.float32)


ASSETS = StudioVisualAssets(OUT_W, OUT_H)


def ease(u: float, kind: str) -> float:
    u = max(0.0, min(1.0, u))
    if kind == "out_cubic":
        return 1.0 - (1.0 - u) ** 3
    if kind == "in_out_sine":
        return 0.5 - 0.5 * math.cos(math.pi * u)
    # default in_out_cubic
    if u < 0.5:
        return 4.0 * u * u * u
    return 1.0 - ((-2.0 * u + 2.0) ** 3) / 2.0


def smoothstep(u: float) -> float:
    u = max(0.0, min(1.0, u))
    return u * u * (3.0 - 2.0 * u)


def load_overscan_image(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"Missing product image: {path}")
    with Image.open(path) as im:
        rgb = im.convert("RGB")
        up = rgb.resize((OVERSCAN_W, OVERSCAN_H), Image.Resampling.LANCZOS)
        return up.filter(ImageFilter.UnsharpMask(radius=0.8, percent=40, threshold=3))


def render_beat_pil(
    src_img: Image.Image,
    beat: BeatSpec,
    local_idx: float,
    extra_blur_sigma: float = 0.0,
) -> tuple[Image.Image, float]:
    """Subpixel inverse-affine camera transform with guaranteed in-bounds clamping."""
    denom = max(1.0, float(beat.frames - 1))
    raw_u = max(0.0, min(1.0, local_idx / denom))
    u = ease(raw_u, beat.easing)

    scale = beat.scale_start + (beat.scale_end - beat.scale_start) * u
    fx = beat.fx_start + (beat.fx_end - beat.fx_start) * u
    fy = beat.fy_start + (beat.fy_end - beat.fy_start) * u
    rot_deg = beat.rot_start_deg + (beat.rot_end_deg - beat.rot_start_deg) * u

    # Ultra-gentle motorized jib micro-drift (never shaky)
    t_sec = local_idx / float(FPS)
    fx += 0.0012 * math.sin(2.0 * math.pi * 0.43 * t_sec)
    fy += 0.0010 * math.cos(2.0 * math.pi * 0.37 * t_sec)

    w_src, h_src = src_img.size
    base_fit_scale = OUT_W / float(w_src)
    rot_rad = math.radians(rot_deg)
    abs_cos = abs(math.cos(rot_rad))
    abs_sin = abs(math.sin(rot_rad))

    # Guarantee rotated viewport fits strictly inside source bounds (zero black corners)
    min_scale_w = ((OUT_W * abs_cos + OUT_H * abs_sin) / (w_src - 4.0)) / base_fit_scale
    min_scale_h = ((OUT_W * abs_sin + OUT_H * abs_cos) / (h_src - 4.0)) / base_fit_scale
    safe_scale = max(scale, min_scale_w, min_scale_h, 1.005)

    inv_s = 1.0 / (safe_scale * base_fit_scale)
    cos_r = math.cos(-rot_rad)
    sin_r = math.sin(-rot_rad)
    a = inv_s * cos_r
    b = -inv_s * sin_r
    d = inv_s * sin_r
    e = inv_s * cos_r

    half_w = (OUT_W * 0.5) * inv_s
    half_h = (OUT_H * 0.5) * inv_s
    ext_x = half_w * abs_cos + half_h * abs_sin
    ext_y = half_w * abs_sin + half_h * abs_cos

    cx_s = max(ext_x + 1.5, min(w_src - ext_x - 1.5, fx * w_src))
    cy_s = max(ext_y + 1.5, min(h_src - ext_y - 1.5, fy * h_src))

    cx_d = OUT_W * 0.5
    cy_d = OUT_H * 0.5
    c = cx_s - a * cx_d - b * cy_d
    f = cy_s - d * cx_d - e * cy_d

    frame = src_img.transform(
        (OUT_W, OUT_H),
        Image.Transform.AFFINE,
        (a, b, c, d, e, f),
        resample=Image.Resampling.BICUBIC,
    )

    # Combine beat entry focus-lock pull with transition rack-focus blur
    total_blur = extra_blur_sigma
    if beat.rack_in_frames > 0 and 0.0 <= local_idx < beat.rack_in_frames:
        rack_u = local_idx / float(beat.rack_in_frames)
        rack_sigma = 4.2 * ((1.0 - ease(rack_u, "out_cubic")) ** 1.3)
        total_blur = max(total_blur, rack_sigma)

    if total_blur > 0.25:
        frame = frame.filter(ImageFilter.GaussianBlur(radius=total_blur))

    return frame, raw_u


def apply_studio_finish(
    rgb_f32: np.ndarray,
    frame_idx: int,
    sweep_strength: float,
    sweep_progress: float,
    sweep_angle_deg: float,
    sweep_tint: tuple[float, float, float],
) -> np.ndarray:
    """Apply luma-masked specular sweep, unified 3-way tactical studio LUT, vignette, and film grain."""
    x = rgb_f32

    # 1. Specular light sweep weighted by luminance^1.7 (only catches machined edges & glass)
    if sweep_strength > 0.0:
        luma_raw = 0.2126 * x[:, :, 0] + 0.7152 * x[:, :, 1] + 0.0722 * x[:, :, 2]
        ribbon = ASSETS.specular_mask(sweep_progress, sweep_angle_deg)
        spec = (ribbon * (np.clip(luma_raw, 0.0, 1.0) ** 1.7) * sweep_strength)[:, :, None]
        tint = np.array(sweep_tint, dtype=np.float32)[None, None, :]
        x = np.clip(x + spec * tint, 0.0, 1.0)

    # 2. Gentle tactical S-curve micro-contrast (preserves accurate product tones)
    x = np.clip(x - 0.045 * np.sin(2.0 * math.pi * x), 0.0, 1.0)

    # 3. Controlled saturation (0.96) + subtle 3-way split toning (cool gunmetal shadows, warm highlights)
    luma = (0.2126 * x[:, :, 0] + 0.7152 * x[:, :, 1] + 0.0722 * x[:, :, 2])[:, :, None]
    x = luma + 0.96 * (x - luma)

    shadow_w = (1.0 - luma) ** 2
    high_w = luma ** 2
    shadow_tint = np.array([-0.008, 0.002, 0.012], dtype=np.float32)[None, None, :]
    high_tint = np.array([0.014, 0.006, -0.009], dtype=np.float32)[None, None, :]
    x = x + shadow_w * shadow_tint + high_w * high_tint

    # 4. Studio vignette + anti-banding fine 35mm grain
    x = x * ASSETS.vignette + ASSETS.grain_pool[frame_idx & 15]
    return np.clip(x * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)


def render_single_frame(
    frame_idx: int,
    spec: ProductVideoSpec,
    sources: dict[str, Image.Image],
    beat_starts: Sequence[int],
) -> np.ndarray:
    """Compute one final uint8 RGB24 frame (H, W, 3) for frame_idx."""
    total = spec.total_frames
    half_tr = TRANSITION_FRAMES // 2

    # Locate active beat
    beat_i = len(spec.beats) - 1
    for i, start in enumerate(beat_starts):
        if frame_idx < start + spec.beats[i].frames:
            beat_i = i
            break

    beat = spec.beats[beat_i]
    local_idx = frame_idx - beat_starts[beat_i]

    # Check if inside rack-focus dissolve transition around beat boundaries (beat 0->1 or 1->2)
    # Boundary at beat_starts[k] for k in (1, 2): blends [boundary - half_tr .. boundary + half_tr - 1]
    blend_info = None
    for k in (1, 2):
        boundary = beat_starts[k]
        if boundary - half_tr <= frame_idx < boundary + half_tr:
            p = (frame_idx - (boundary - half_tr) + 0.5) / float(TRANSITION_FRAMES)
            blend_info = (k - 1, k, p)
            break

    if blend_info is not None:
        idx_a, idx_b, p = blend_info
        beat_a = spec.beats[idx_a]
        beat_b = spec.beats[idx_b]
        blur_sigma = 8.0 * math.sin(math.pi * p)
        alpha = smoothstep(p)

        local_a = frame_idx - beat_starts[idx_a]
        local_b = frame_idx - beat_starts[idx_b]

        img_a, u_a = render_beat_pil(sources[beat_a.image_key], beat_a, local_a, extra_blur_sigma=blur_sigma)
        img_b, u_b = render_beat_pil(sources[beat_b.image_key], beat_b, local_b, extra_blur_sigma=blur_sigma)

        arr_a = np.asarray(img_a, dtype=np.float32) * (1.0 / 255.0)
        arr_b = np.asarray(img_b, dtype=np.float32) * (1.0 / 255.0)
        blended = arr_a * (1.0 - alpha) + arr_b * alpha

        sweep_str = beat_a.sweep_strength * (1.0 - alpha) + beat_b.sweep_strength * alpha
        sweep_u = u_a if alpha < 0.5 else u_b
        sweep_ang = beat_a.sweep_angle_deg if alpha < 0.5 else beat_b.sweep_angle_deg
        sweep_tint = beat_a.sweep_tint if alpha < 0.5 else beat_b.sweep_tint
        return apply_studio_finish(blended, frame_idx, sweep_str, sweep_u, sweep_ang, sweep_tint)

    # Seamless loop wrap on last LOOP_BLEND_FRAMES frames back into Beat 0 frame 0
    if frame_idx >= total - LOOP_BLEND_FRAMES:
        p = (frame_idx - (total - LOOP_BLEND_FRAMES) + 0.5) / float(LOOP_BLEND_FRAMES)
        blur_sigma = 4.5 * math.sin(math.pi * p)
        alpha = smoothstep(p)
        beat_0 = spec.beats[0]

        img_end, u_end = render_beat_pil(sources[beat.image_key], beat, local_idx, extra_blur_sigma=blur_sigma)
        img_start, _ = render_beat_pil(sources[beat_0.image_key], beat_0, 0.0, extra_blur_sigma=blur_sigma)

        arr_end = np.asarray(img_end, dtype=np.float32) * (1.0 / 255.0)
        arr_start = np.asarray(img_start, dtype=np.float32) * (1.0 / 255.0)
        blended = arr_end * (1.0 - alpha) + arr_start * alpha
        return apply_studio_finish(
            blended,
            frame_idx,
            beat.sweep_strength * (1.0 - alpha),
            u_end,
            beat.sweep_angle_deg,
            beat.sweep_tint,
        )

    # Standard in-beat frame
    img, raw_u = render_beat_pil(sources[beat.image_key], beat, local_idx)
    arr = np.asarray(img, dtype=np.float32) * (1.0 / 255.0)
    return apply_studio_finish(
        arr,
        frame_idx,
        beat.sweep_strength,
        raw_u,
        beat.sweep_angle_deg,
        beat.sweep_tint,
    )


def save_poster_under_limit(frame_u8: np.ndarray, dst_path: Path, max_bytes: int = 78 * 1024) -> int:
    """Save 1280x720 progressive JPEG poster guaranteed below 80 KB."""
    pil_im = Image.fromarray(frame_u8, mode="RGB")
    for q in (86, 82, 78, 74, 68, 62):
        pil_im.save(
            dst_path,
            format="JPEG",
            quality=q,
            optimize=True,
            progressive=True,
        )
        size = os.path.getsize(dst_path)
        if size <= max_bytes:
            return size
    return os.path.getsize(dst_path)


def render_product_video(spec: ProductVideoSpec, ffmpeg_exe: str, workers: int) -> tuple[Path, Path, float]:
    t0 = time.perf_counter()
    sources: dict[str, Image.Image] = {
        "primary": load_overscan_image(PRODUCTS_IMG_DIR / spec.primary_file)
    }
    if spec.detail_file:
        sources["detail"] = load_overscan_image(PRODUCTS_IMG_DIR / spec.detail_file)

    beat_starts: list[int] = []
    acc = 0
    for b in spec.beats:
        beat_starts.append(acc)
        acc += b.frames

    mp4_path = VIDEOS_OUT_DIR / spec.mp4_name
    poster_path = VIDEOS_OUT_DIR / spec.poster_name

    cmd = [
        ffmpeg_exe,
        "-y",
        "-loglevel", "error",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{OUT_W}x{OUT_H}",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264",
        "-profile:v", "high",
        "-level", "4.0",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",
        "-crf", "21",
        "-maxrate", "2200k",
        "-bufsize", "4400k",
        "-movflags", "+faststart",
        "-an",
        str(mp4_path),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdin is not None

    poster_u8: np.ndarray | None = None
    total_frames = spec.total_frames
    chunk_size = max(workers * 2, 16)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        for start_f in range(0, total_frames, chunk_size):
            end_f = min(total_frames, start_f + chunk_size)
            indices = list(range(start_f, end_f))
            frames = list(
                pool.map(lambda idx: render_single_frame(idx, spec, sources, beat_starts), indices)
            )
            for idx, frame_u8 in zip(indices, frames):
                if idx == spec.poster_frame_index:
                    poster_u8 = frame_u8
                proc.stdin.write(frame_u8.tobytes())

    proc.stdin.close()
    stderr_bytes = proc.stderr.read() if proc.stderr else b""
    rc = proc.wait()
    if rc != 0:
        raise RuntimeError(
            f"ffmpeg failed for {spec.mp4_name} (rc={rc}): {stderr_bytes.decode('utf-8', errors='replace')}"
        )

    if poster_u8 is None:
        poster_u8 = render_single_frame(0, spec, sources, beat_starts)
    save_poster_under_limit(poster_u8, poster_path)

    elapsed = time.perf_counter() - t0
    return mp4_path, poster_path, elapsed


def check_faststart_moov_before_mdat(mp4_path: Path) -> bool:
    """Verify MP4 top-level box order places moov before mdat (+faststart)."""
    moov_pos = None
    mdat_pos = None
    file_size = os.path.getsize(mp4_path)
    with open(mp4_path, "rb") as f:
        pos = 0
        while pos + 8 <= file_size:
            f.seek(pos)
            header = f.read(8)
            if len(header) < 8:
                break
            box_size, box_type = struct.unpack(">I4s", header)
            if box_size == 1:
                ext = f.read(8)
                if len(ext) < 8:
                    break
                box_size = struct.unpack(">Q", ext)[0]
            elif box_size == 0:
                box_size = file_size - pos
            if box_type == b"moov" and moov_pos is None:
                moov_pos = pos
            elif box_type == b"mdat" and mdat_pos is None:
                mdat_pos = pos
            if box_size < 8:
                break
            pos += box_size
    return moov_pos is not None and mdat_pos is not None and moov_pos < mdat_pos


def verify_outputs(specs: Sequence[ProductVideoSpec], ffmpeg_exe: str) -> None:
    print("\n=== QA VERIFICATION: 7 PRODUCT DEMO VIDEOS + 7 POSTERS ===")
    errors: list[str] = []

    for spec in specs:
        mp4_path = VIDEOS_OUT_DIR / spec.mp4_name
        poster_path = VIDEOS_OUT_DIR / spec.poster_name

        if not mp4_path.exists():
            errors.append(f"Missing video: {mp4_path}")
            continue
        if not poster_path.exists():
            errors.append(f"Missing poster: {poster_path}")
            continue

        # 1. Count frames & duration via imageio_ffmpeg
        nframes, secs = imageio_ffmpeg.count_frames_and_secs(str(mp4_path))

        # 2. Inspect stream info via ffmpeg -i
        probe = subprocess.run(
            [ffmpeg_exe, "-i", str(mp4_path)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        info = probe.stderr
        has_h264 = bool(re.search(r"Video:\s*h264\b", info))
        has_yuv420p = "yuv420p" in info
        has_720p = "1280x720" in info
        has_audio = "Audio:" in info
        faststart = check_faststart_moov_before_mdat(mp4_path)
        mp4_mb = os.path.getsize(mp4_path) / (1024 * 1024)

        # 3. Verify poster image
        with Image.open(poster_path) as pim:
            pim.load()
            psize = pim.size
        poster_kb = os.path.getsize(poster_path) / 1024.0

        ok = True
        if not has_h264 or not has_yuv420p or not has_720p:
            errors.append(f"{spec.mp4_name}: stream mismatch (h264={has_h264}, yuv420p={has_yuv420p}, 720p={has_720p})")
            ok = False
        if has_audio:
            errors.append(f"{spec.mp4_name}: unexpected audio stream found")
            ok = False
        if not (6.0 <= secs <= 9.0):
            errors.append(f"{spec.mp4_name}: duration {secs:.2f}s outside 6.0-9.0s")
            ok = False
        if not faststart:
            errors.append(f"{spec.mp4_name}: moov atom is not before mdat (+faststart missing)")
            ok = False
        if mp4_mb > 2.5 or mp4_mb <= 0.05:
            errors.append(f"{spec.mp4_name}: size {mp4_mb:.2f} MB outside expected bounds (<=2.5 MB)")
            ok = False
        if psize != (OUT_W, OUT_H) or poster_kb >= 80.0 or poster_kb <= 5.0:
            errors.append(f"{spec.poster_name}: invalid poster {psize}, {poster_kb:.1f} KB")
            ok = False

        status = "PASS" if ok else "FAIL"
        print(
            f"  [{status}] {spec.mp4_name:26s} | {secs:4.2f}s ({nframes:3d}f) | "
            f"h264/yuv420p/720p | faststart={faststart} | {mp4_mb:4.2f} MB | "
            f"poster={poster_kb:4.1f} KB"
        )

    if errors:
        print("\nVERIFICATION FAILED:")
        for e in errors:
            print("  -", e)
        raise SystemExit(1)

    print("ALL 7 PRODUCT VIDEOS + 7 POSTERS PASSED 100% QA CHECKS.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Render 7 Brakasa Tactical product demo videos")
    parser.add_argument("--sku", help="Optional single sku_slug to render (e.g. brk-ar-001)")
    parser.add_argument("--workers", type=int, default=min(8, os.cpu_count() or 4))
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()

    VIDEOS_OUT_DIR.mkdir(parents=True, exist_ok=True)
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    specs = (
        tuple(s for s in PRODUCT_VIDEOS if s.sku_slug == args.sku)
        if args.sku
        else PRODUCT_VIDEOS
    )
    if not specs:
        print(f"Unknown sku_slug: {args.sku}", file=sys.stderr)
        return 1

    if not args.verify_only:
        t_all = time.perf_counter()
        print(f"Rendering {len(specs)} product demo videos (1280x720 @ {FPS}fps, workers={args.workers})...")
        for spec in specs:
            mp4_path, poster_path, elapsed = render_product_video(spec, ffmpeg_exe, args.workers)
            mb = os.path.getsize(mp4_path) / (1024 * 1024)
            pkb = os.path.getsize(poster_path) / 1024.0
            print(
                f"  Rendered {spec.mp4_name:26s} ({spec.duration_sec:.1f}s) "
                f"in {elapsed:5.2f}s -> {mb:.2f} MB | poster {pkb:.1f} KB"
            )
        print(f"Total render time: {time.perf_counter() - t_all:.2f}s")

    verify_outputs(specs, ffmpeg_exe)
    return 0


if __name__ == "__main__":
    sys.exit(main())
