"""Brakasa Tactical Cinematic Hero Video Renderer (24.0s, 1080p @ 30fps, H.264 + AAC).

Produces:
  - public/media/videos/hero-tactical-reel.mp4  (1920x1080, 30fps, 24.0s, yuv420p, +faststart, 48kHz AAC stereo)
  - public/media/videos/hero-tactical-poster.jpg (1920x1080, color-graded Hero poster from Scene 10, <150 KB)

Architecture follows docs/research/04-tech-and-video-pipeline.md (Sections 3.2, 3.3, 3.4, 3.6):
  - Subpixel inverse-affine camera rig (OpenCV fast-path with PIL bicubic fallback)
  - 10 tactical scenes with varied camera choreography (2.2s - 2.8s per scene, total 24.0s)
  - Handheld tactical shake, exponential recoil kick, tracer/muzzle flash pulses, specular sweep,
    rack-focus pull, chromatic aberration snap-zoom, directional whip-pan motion blur cuts
  - Unified 3-way tactical color grade LUT + anamorphic vignette + left-edge typography legibility gradient
    + 35mm film grain anti-banding pool
  - Procedural 48kHz stereo tactical audio track synchronized to exact scene cuts and action beats
  - Zero temporary PNG bloat: streams raw RGB24 frames directly to static ffmpeg stdin pipe.
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
import tempfile
import time
import wave
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageFilter

try:
    import cv2  # type: ignore
    HAS_CV2 = True
except ImportError:
    cv2 = None
    HAS_CV2 = False

import imageio_ffmpeg

WORKSPACE = Path(r"d:\brakasa-tac")
HERO_IMG_DIR = WORKSPACE / "public" / "media" / "images" / "hero"
VIDEO_OUT_DIR = WORKSPACE / "public" / "media" / "videos"
OUT_MP4 = VIDEO_OUT_DIR / "hero-tactical-reel.mp4"
OUT_POSTER = VIDEO_OUT_DIR / "hero-tactical-poster.jpg"

W_OUT = 1920
H_OUT = 1080
FPS = 30
BG_DARK = np.array([9.0 / 255.0, 11.0 / 255.0, 14.0 / 255.0], dtype=np.float32)  # #090B0E


# ---------------------------------------------------------------------------
# Easing & Math Utilities
# ---------------------------------------------------------------------------

def clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def smoothstep(u: float) -> float:
    u = clamp01(u)
    return u * u * (3.0 - 2.0 * u)


def ease_out_cubic(u: float) -> float:
    u = clamp01(u)
    return 1.0 - (1.0 - u) ** 3


def ease_in_out_cubic(u: float) -> float:
    u = clamp01(u)
    return 4.0 * u * u * u if u < 0.5 else 1.0 - ((-2.0 * u + 2.0) ** 3) / 2.0


def ease_out_expo(u: float) -> float:
    u = clamp01(u)
    return 1.0 if u >= 1.0 else 1.0 - (2.0 ** (-10.0 * u))


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def apply_ease(name: str, u: float) -> float:
    if name == "cubic_out":
        return ease_out_cubic(u)
    if name == "cubic_inout":
        return ease_in_out_cubic(u)
    if name == "expo_out":
        return ease_out_expo(u)
    if name == "smoothstep":
        return smoothstep(u)
    return clamp01(u)


def handheld_shake(t: float, seed: float, amp_px: float, amp_deg: float) -> tuple[float, float, float]:
    if amp_px <= 0.0 and amp_deg <= 0.0:
        return 0.0, 0.0, 0.0
    dx = amp_px * (
        0.55 * math.sin(2.0 * math.pi * 0.73 * t + seed)
        + 0.30 * math.sin(2.0 * math.pi * 2.17 * t + seed * 1.9)
        + 0.15 * math.sin(2.0 * math.pi * 5.41 * t + seed * 3.1)
    )
    dy = amp_px * (
        0.55 * math.cos(2.0 * math.pi * 0.61 * t + seed * 0.7)
        + 0.30 * math.sin(2.0 * math.pi * 1.89 * t + seed * 2.3)
        + 0.15 * math.cos(2.0 * math.pi * 4.93 * t + seed * 3.7)
    )
    rot = amp_deg * math.sin(2.0 * math.pi * 0.85 * t + seed * 1.3)
    return dx, dy, rot


# ---------------------------------------------------------------------------
# Scene Manifest (10 Tactical Scenes = Exactly 24.0s = 720 Frames @ 30fps)
# ---------------------------------------------------------------------------

@dataclass
class SceneSpec:
    index: int
    filename: str
    title: str
    duration_sec: float
    scale_start: float
    scale_end: float
    scale_ease: str
    roi_start: tuple[float, float]
    roi_end: tuple[float, float]
    roi_ease: str = "cubic_inout"
    rot_start_deg: float = 0.0
    rot_end_deg: float = 0.0
    shake_px: float = 0.0
    shake_deg: float = 0.0
    shake_seed: float = 1.0
    transition_out: str = "none"  # whip_right | whip_left | whip_down | rack_focus | impact_amber | hard_impact | none
    transition_frames: int = 0
    fx: dict[str, Any] = field(default_factory=dict)


SCENES: list[SceneSpec] = [
    SceneSpec(
        index=1,
        filename="hero-scene-01.jpg",
        title="Armory Bench Prep",
        duration_sec=2.4,  # 72f: 0.0 - 2.4s
        scale_start=1.04,
        scale_end=1.18,
        scale_ease="cubic_out",
        roi_start=(0.50, 0.50),
        roi_end=(0.53, 0.52),
        rot_start_deg=-0.9,
        rot_end_deg=0.6,
        shake_px=1.6,
        shake_deg=0.10,
        shake_seed=1.1,
        transition_out="whip_right",
        transition_frames=6,
        fx={"fade_in_sec": 0.35, "warm_breath": 0.035},
    ),
    SceneSpec(
        index=2,
        filename="hero-scene-02.jpg",
        title="Cordura & Buckle Lock",
        duration_sec=2.2,  # 66f: 2.4 - 4.6s
        scale_start=1.06,
        scale_end=1.20,
        scale_ease="expo_out",
        roi_start=(0.54, 0.54),
        roi_end=(0.48, 0.44),
        roi_ease="cubic_out",
        rot_start_deg=0.4,
        rot_end_deg=-0.3,
        shake_px=3.0,
        shake_deg=0.22,
        shake_seed=2.7,
        transition_out="rack_focus",
        transition_frames=8,
        fx={},
    ),
    SceneSpec(
        index=3,
        filename="hero-scene-03.jpg",
        title="CNC Receiver & Mag Seating",
        duration_sec=2.6,  # 78f: 4.6 - 7.2s
        scale_start=1.15,
        scale_end=1.17,
        scale_ease="linear",
        roi_start=(0.44, 0.49),
        roi_end=(0.56, 0.51),
        roi_ease="smoothstep",
        rot_start_deg=-0.25,
        rot_end_deg=0.25,
        shake_px=2.2,
        shake_deg=0.16,
        shake_seed=4.3,
        transition_out="impact_amber",
        transition_frames=4,
        fx={"specular_sweep": {"angle_deg": 28.0, "width": 0.14, "strength": 0.55}},
    ),
    SceneSpec(
        index=4,
        filename="hero-scene-04.jpg",
        title="Helmet & Comms Check",
        duration_sec=2.2,  # 66f: 7.2 - 9.4s
        scale_start=1.05,
        scale_end=1.15,
        scale_ease="cubic_out",
        roi_start=(0.47, 0.51),
        roi_end=(0.54, 0.46),
        roi_ease="smoothstep",
        rot_start_deg=0.0,
        rot_end_deg=0.45,
        shake_px=2.6,
        shake_deg=0.18,
        shake_seed=5.9,
        transition_out="rack_focus",
        transition_frames=8,
        fx={"cool_rim_breath": 0.03},
    ),
    SceneSpec(
        index=5,
        filename="hero-scene-05.jpg",
        title="Optic & Illuminator Zero",
        duration_sec=2.4,  # 72f: 9.4 - 11.8s
        scale_start=1.04,
        scale_end=1.17,
        scale_ease="cubic_out",
        roi_start=(0.50, 0.50),
        roi_end=(0.56, 0.47),
        roi_ease="cubic_out",
        rot_start_deg=-0.2,
        rot_end_deg=0.25,
        shake_px=4.4,
        shake_deg=0.32,
        shake_seed=7.2,
        transition_out="whip_left",
        transition_frames=6,
        fx={
            "entry_rack_blur": {"sigma_max": 2.8, "duration_sec": 0.45},
            "illuminator_pulse": {
                "t_sec": 0.85,
                "light_xy": (0.40, 0.50),
                "dot_xy": (0.64, 0.46),
            },
        },
    ),
    SceneSpec(
        index=6,
        filename="hero-scene-06.jpg",
        title="Killhouse Entry Stack",
        duration_sec=2.6,  # 78f: 11.8 - 14.4s
        scale_start=1.13,
        scale_end=1.20,
        scale_ease="cubic_inout",
        roi_start=(0.55, 0.51),
        roi_end=(0.44, 0.49),
        roi_ease="smoothstep",
        rot_start_deg=0.35,
        rot_end_deg=-0.35,
        shake_px=4.2,
        shake_deg=0.30,
        shake_seed=8.8,
        transition_out="whip_right",
        transition_frames=6,
        fx={"warm_breath": 0.03},
    ),
    SceneSpec(
        index=7,
        filename="hero-scene-07.jpg",
        title="CQB Pivot & Tracer Pulse",
        duration_sec=2.2,  # 66f: 14.4 - 16.6s
        scale_start=1.06,
        scale_end=1.17,
        scale_ease="cubic_out",
        roi_start=(0.48, 0.51),
        roi_end=(0.54, 0.49),
        roi_ease="cubic_out",
        rot_start_deg=-0.4,
        rot_end_deg=0.5,
        shake_px=5.8,
        shake_deg=0.42,
        shake_seed=10.4,
        transition_out="whip_down",
        transition_frames=6,
        fx={
            "muzzle_flashes": [
                {"t_sec": 0.55, "xy": (0.615, 0.51), "tracer_color": (0.72, 1.0, 0.62)},
                {"t_sec": 1.25, "xy": (0.615, 0.51), "tracer_color": (1.0, 0.72, 0.28)},
            ],
        },
    ),
    SceneSpec(
        index=8,
        filename="hero-scene-08.jpg",
        title="Secondary Transition",
        duration_sec=2.8,  # 84f: 16.6 - 19.4s
        scale_start=1.04,
        scale_end=1.21,
        scale_ease="expo_out",
        roi_start=(0.50, 0.50),
        roi_end=(0.56, 0.43),
        roi_ease="expo_out",
        rot_start_deg=0.3,
        rot_end_deg=-0.25,
        shake_px=3.6,
        shake_deg=0.25,
        shake_seed=12.1,
        transition_out="hard_impact",
        transition_frames=4,
        fx={
            "snap_zoom_time": 0.50,
            "chromatic_snap": {"t_start": 0.14, "t_end": 0.50, "max_px": 2},
            "specular_sweep": {"angle_deg": 18.0, "width": 0.16, "strength": 0.35},
        },
    ),
    SceneSpec(
        index=9,
        filename="hero-scene-09.jpg",
        title="Overwatch Bolt Cycle",
        duration_sec=2.2,  # 66f: 19.4 - 21.6s
        scale_start=1.12,
        scale_end=1.18,
        scale_ease="smoothstep",
        roi_start=(0.45, 0.49),
        roi_end=(0.56, 0.47),
        roi_ease="smoothstep",
        rot_start_deg=-0.2,
        rot_end_deg=0.2,
        shake_px=1.8,
        shake_deg=0.12,
        shake_seed=14.6,
        transition_out="rack_focus",
        transition_frames=8,
        fx={"entry_rack_blur": {"sigma_max": 3.2, "duration_sec": 0.55}},
    ),
    SceneSpec(
        index=10,
        filename="hero-scene-10.jpg",
        title="Brakasa Hero Silhouette",
        duration_sec=2.4,  # 72f: 21.6 - 24.0s
        scale_start=1.18,
        scale_end=1.02,
        scale_ease="cubic_out",
        roi_start=(0.56, 0.48),
        roi_end=(0.50, 0.50),
        roi_ease="cubic_out",
        rot_start_deg=0.0,
        rot_end_deg=0.0,
        shake_px=0.9,
        shake_deg=0.05,
        shake_seed=16.3,
        transition_out="none",
        transition_frames=0,
        fx={"fade_out_sec": 0.35},
    ),
]


# ---------------------------------------------------------------------------
# Precomputed Masks & Finishing Assets (Shared Read-Only Across Threads)
# ---------------------------------------------------------------------------

class CinemaFinishing:
    def __init__(self, width: int, height: int) -> None:
        self.w = width
        self.h = height

        # Normalized coordinate grids [0..1]
        xs = np.linspace(0.0, 1.0, width, dtype=np.float32)
        ys = np.linspace(0.0, 1.0, height, dtype=np.float32)
        self.grid_x, self.grid_y = np.meshgrid(xs, ys)

        # Elliptical anamorphic vignette + 18% left/bottom-left typography legibility gradient
        dx = (self.grid_x - 0.5) * 2.0
        dy = (self.grid_y - 0.5) * 2.0
        r_ell = np.sqrt((dx * 0.92) ** 2 + (dy * 1.08) ** 2)
        vig = 1.0 - 0.34 * np.clip(r_ell, 0.0, 1.4) ** 2.2
        vig = np.clip(vig, 0.48, 1.0)

        # Soft left-side & bottom-left dark scrim for Hero UI headline legibility
        left_weight = np.clip(1.0 - self.grid_x / 0.56, 0.0, 1.0) ** 1.6
        bottom_boost = 0.65 + 0.35 * np.clip((self.grid_y - 0.25) / 0.75, 0.0, 1.0)
        legibility = 1.0 - 0.20 * left_weight * bottom_boost

        self.vig_mask = (vig * legibility)[:, :, None].astype(np.float32)

        # Pre-generate deterministic 16-frame 35mm film grain pool (anti-banding H.264)
        rng = np.random.default_rng(seed=4207)
        sigma = 3.0 / 255.0
        self.grain_pool = [
            rng.normal(0.0, sigma, size=(height, width, 1)).astype(np.float32)
            for _ in range(16)
        ]

        # Color split-toning vectors (cool gunmetal shadows, warm tactical amber highlights)
        self.shadow_tint = np.array([-0.014, 0.004, 0.020], dtype=np.float32).reshape(1, 1, 3)
        self.high_tint = np.array([0.026, 0.011, -0.016], dtype=np.float32).reshape(1, 1, 3)

    def apply(self, frame: np.ndarray, frame_idx: int, add_grain: bool = True) -> np.ndarray:
        """Apply unified 3-way tactical color grade LUT, anamorphic vignette, and optional 35mm grain."""
        x = np.clip(frame, 0.0, 1.0)

        # 1. S-curve micro-contrast (deepens obsidian shadows, lifts crisp mid-highlights)
        x = x - 0.065 * np.sin(2.0 * math.pi * x)
        x = np.clip(x, 0.0, 1.0)

        # 2. Luminance & controlled desaturation (sat = 0.88)
        luma = (0.2126 * x[:, :, 0] + 0.7152 * x[:, :, 1] + 0.0722 * x[:, :, 2])[:, :, None]
        x = luma + 0.88 * (x - luma)

        # 3. 3-way split-toning (cool gunmetal shadows + warm tactical amber highlights)
        shadow_w = (1.0 - luma) ** 2
        high_w = luma ** 2
        x = x + shadow_w * self.shadow_tint + high_w * self.high_tint

        # 4. Anamorphic vignette + left typography safe-area gradient
        x = x * self.vig_mask

        # 5. Subtle 35mm grain pool
        if add_grain:
            x = x + self.grain_pool[frame_idx & 15]

        return np.clip(x, 0.0, 1.0)


# ---------------------------------------------------------------------------
# Image Warp & Filter Primitives
# ---------------------------------------------------------------------------

def warp_subpixel(
    src_f32: np.ndarray,
    scale: float,
    rot_deg: float,
    roi_xy: tuple[float, float],
    offset_out_px: tuple[float, float] = (0.0, 0.0),
) -> np.ndarray:
    """Subpixel inverse-affine warp from 2400x1350 overscan to 1920x1080 with edge-safe clamping."""
    h_src, w_src = src_f32.shape[:2]
    base_fit = W_OUT / float(w_src)

    rot_rad = math.radians(rot_deg)
    cos_r = math.cos(-rot_rad)
    sin_r = math.sin(-rot_rad)

    # Guarantee minimum scale covers any rotation cleanly without exposing borders
    min_rot_scale = max(
        (W_OUT * abs(cos_r) + H_OUT * abs(sin_r)) / float(W_OUT),
        (W_OUT * abs(sin_r) + H_OUT * abs(cos_r)) / float(H_OUT),
    ) + 0.004
    eff_scale = max(scale, min_rot_scale)
    inv_s = 1.0 / (eff_scale * base_fit)

    a = inv_s * cos_r
    b = -inv_s * sin_r
    d = inv_s * sin_r
    e = inv_s * cos_r

    # Desired source focus center including output-space pixel offset (shake/whip)
    cx_s = roi_xy[0] * w_src + offset_out_px[0] * inv_s
    cy_s = roi_xy[1] * h_src + offset_out_px[1] * inv_s

    # Clamp focus center so rotated viewport stays within source bounds
    half_w_s = (W_OUT * 0.5) * inv_s
    half_h_s = (H_OUT * 0.5) * inv_s
    rot_half_w = half_w_s * abs(cos_r) + half_h_s * abs(sin_r)
    rot_half_h = half_w_s * abs(sin_r) + half_h_s * abs(cos_r)

    min_cx = min(w_src * 0.5, rot_half_w + 1.0)
    max_cx = max(w_src * 0.5, w_src - rot_half_w - 1.0)
    min_cy = min(h_src * 0.5, rot_half_h + 1.0)
    max_cy = max(h_src * 0.5, h_src - rot_half_h - 1.0)

    cx_s = max(min_cx, min(max_cx, cx_s))
    cy_s = max(min_cy, min(max_cy, cy_s))

    cx_d = W_OUT * 0.5
    cy_d = H_OUT * 0.5
    c = cx_s - a * cx_d - b * cy_d
    f = cy_s - d * cx_d - e * cy_d

    if HAS_CV2:
        mat = np.array([[a, b, c], [d, e, f]], dtype=np.float32)
        return cv2.warpAffine(
            src_f32,
            mat,
            (W_OUT, H_OUT),
            flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP,
            borderMode=cv2.BORDER_REFLECT_101,
        )

    # PIL fallback
    pil_src = Image.fromarray((np.clip(src_f32, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGB")
    warped = pil_src.transform(
        (W_OUT, H_OUT),
        Image.Transform.AFFINE,
        (a, b, c, d, e, f),
        resample=Image.Resampling.BICUBIC,
    )
    return np.asarray(warped, dtype=np.float32) / 255.0


def gaussian_blur(frame: np.ndarray, sigma: float) -> np.ndarray:
    if sigma < 0.25:
        return frame
    if HAS_CV2:
        k = int(math.ceil(sigma * 3.0)) * 2 + 1
        k = max(3, min(k, 99))
        return cv2.GaussianBlur(frame, (k, k), sigmaX=sigma, sigmaY=sigma, borderType=cv2.BORDER_REPLICATE)
    pil_im = Image.fromarray((np.clip(frame, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGB")
    blurred = pil_im.filter(ImageFilter.GaussianBlur(radius=sigma))
    return np.asarray(blurred, dtype=np.float32) / 255.0


def directional_motion_blur(frame: np.ndarray, kernel_len: int, axis: str = "x") -> np.ndarray:
    k = max(1, int(kernel_len))
    if k <= 1:
        return frame
    if k % 2 == 0:
        k += 1
    if HAS_CV2:
        ksize = (k, 1) if axis == "x" else (1, k)
        return cv2.boxFilter(frame, -1, ksize, normalize=True, borderType=cv2.BORDER_REPLICATE)

    # O(N) pure NumPy cumsum directional box blur
    half = k // 2
    if axis == "x":
        padded = np.pad(frame, ((0, 0), (half, half), (0, 0)), mode="edge")
        cs = np.cumsum(padded, axis=1)
        cs = np.concatenate([np.zeros((frame.shape[0], 1, 3), dtype=np.float32), cs], axis=1)
        return (cs[:, k:, :] - cs[:, :-k, :]) / float(k)
    padded = np.pad(frame, ((half, half), (0, 0), (0, 0)), mode="edge")
    cs = np.cumsum(padded, axis=0)
    cs = np.concatenate([np.zeros((1, frame.shape[1], 3), dtype=np.float32), cs], axis=0)
    return (cs[k:, :, :] - cs[:-k, :, :]) / float(k)


def apply_chromatic_aberration(frame: np.ndarray, shift_px: int) -> np.ndarray:
    if shift_px <= 0:
        return frame
    out = frame.copy()
    # Shift Red right, Blue left
    out[:, shift_px:, 0] = frame[:, :-shift_px, 0]
    out[:, :-shift_px, 2] = frame[:, shift_px:, 2]
    return out


# ---------------------------------------------------------------------------
# Per-Scene Render Core
# ---------------------------------------------------------------------------

def render_scene_frame(
    scene: SceneSpec,
    src_img: np.ndarray,
    local_t: float,
    finishing: CinemaFinishing,
    extra_offset_px: tuple[float, float] = (0.0, 0.0),
) -> np.ndarray:
    """Render a single ungraded float32 RGB frame for `scene` at scene-local time `local_t`."""
    dur = scene.duration_sec
    u_raw = local_t / dur
    u = clamp01(u_raw)

    # Scale progression (supports fast snap-zoom phase for Scene 08)
    if "snap_zoom_time" in scene.fx:
        snap_t = float(scene.fx["snap_zoom_time"])
        if local_t <= snap_t:
            su = ease_out_expo(clamp01(local_t / snap_t))
            scale = lerp(scene.scale_start, scene.scale_end - 0.025, su)
        else:
            du = clamp01((local_t - snap_t) / max(0.01, dur - snap_t))
            scale = lerp(scene.scale_end - 0.025, scene.scale_end, du)
    else:
        scale = lerp(scene.scale_start, scene.scale_end, apply_ease(scene.scale_ease, u))

    ru = apply_ease(scene.roi_ease, u)
    roi_x = lerp(scene.roi_start[0], scene.roi_end[0], ru)
    roi_y = lerp(scene.roi_start[1], scene.roi_end[1], ru)
    rot_deg = lerp(scene.rot_start_deg, scene.rot_end_deg, smoothstep(u))

    # Handheld tactical shake (fade gently at end of Scene 10 for horizon lock)
    shake_mul = (1.0 - smoothstep(clamp01((u - 0.65) / 0.35))) if scene.index == 10 else 1.0
    dx, dy, drot = handheld_shake(local_t, scene.shake_seed, scene.shake_px * shake_mul, scene.shake_deg * shake_mul)

    # Exponential recoil impulse from muzzle / tracer flashes
    flashes = scene.fx.get("muzzle_flashes", [])
    flash_overlays: list[tuple[float, tuple[float, float], tuple[float, float, float]]] = []
    for fl in flashes:
        dt = local_t - float(fl["t_sec"])
        if dt >= 0.0:
            recoil = math.exp(-dt / 0.08)
            if recoil > 0.01:
                dy += 11.0 * recoil
                dx -= 3.5 * recoil
                scale += 0.016 * recoil
                rot_deg += 0.55 * recoil
        # 3-frame (~100ms) flash pulse envelope peaking immediately at dt ~ 0.015s
        if -0.015 <= dt <= 0.115:
            if dt < 0.02:
                inten = clamp01((dt + 0.015) / 0.035)
            else:
                inten = math.exp(-(dt - 0.02) / 0.032)
            flash_overlays.append((inten, fl["xy"], fl["tracer_color"]))

    frame = warp_subpixel(
        src_img,
        scale=scale,
        rot_deg=rot_deg + drot,
        roi_xy=(roi_x, roi_y),
        offset_out_px=(dx + extra_offset_px[0], dy + extra_offset_px[1]),
    )

    # Optional entry rack-focus pull (Scene 05 & Scene 09)
    if "entry_rack_blur" in scene.fx:
        rb = scene.fx["entry_rack_blur"]
        rb_dur = float(rb["duration_sec"])
        if 0.0 <= local_t < rb_dur:
            sigma = float(rb["sigma_max"]) * ((1.0 - smoothstep(local_t / rb_dur)) ** 1.2)
            frame = gaussian_blur(frame, sigma)

    # Optional diagonal specular metallic sweep (Scene 03 CNC receiver & Scene 08 Glock slide)
    if "specular_sweep" in scene.fx:
        sw = scene.fx["specular_sweep"]
        ang = math.radians(float(sw["angle_deg"]))
        width = float(sw["width"])
        strength = float(sw["strength"])
        pos = lerp(-0.25, 1.45, smoothstep(u))
        proj = finishing.grid_x * math.cos(ang) + finishing.grid_y * math.sin(ang)
        band = np.exp(-((proj - pos) ** 2) / (2.0 * width * width))
        luma = 0.2126 * frame[:, :, 0] + 0.7152 * frame[:, :, 1] + 0.0722 * frame[:, :, 2]
        spec_mask = (band * (np.clip(luma, 0.0, 1.0) ** 1.7))[:, :, None]
        tint = np.array([0.92, 0.96, 1.0], dtype=np.float32).reshape(1, 1, 3)
        frame = np.clip(frame + strength * spec_mask * tint, 0.0, 1.0)

    # Optional weapon illuminator & 3 MOA red dot pulse (Scene 05)
    if "illuminator_pulse" in scene.fx:
        ip = scene.fx["illuminator_pulse"]
        dt = local_t - float(ip["t_sec"])
        pulse = 0.25 + 0.75 * math.exp(-((dt / 0.28) ** 2)) if dt > -0.3 else 0.22
        lx, ly = ip["light_xy"]
        rx = finishing.grid_x - lx
        ry = (finishing.grid_y - ly) * (H_OUT / float(W_OUT))
        r2 = rx * rx + ry * ry
        beam = np.exp(-r2 / (2.0 * (0.16 ** 2)))[:, :, None]
        beam_col = np.array([0.85, 0.94, 1.0], dtype=np.float32).reshape(1, 1, 3)
        frame = frame + (0.28 * pulse) * beam * beam_col

        dx_dot, dy_dot = ip["dot_xy"]
        rd2 = (finishing.grid_x - dx_dot) ** 2 + ((finishing.grid_y - dy_dot) * (H_OUT / float(W_OUT))) ** 2
        dot_glow = np.exp(-rd2 / (2.0 * (0.022 ** 2)))[:, :, None]
        dot_col = np.array([1.0, 0.18, 0.10], dtype=np.float32).reshape(1, 1, 3)
        frame = np.clip(frame + (0.32 * pulse) * dot_glow * dot_col, 0.0, 1.0)

    # Optional muzzle / tracer flash pulses (Scene 07)
    for inten, (mx, my), halo_rgb in flash_overlays:
        if inten <= 0.02:
            continue
        rx = finishing.grid_x - mx
        ry = (finishing.grid_y - my) * (H_OUT / float(W_OUT))
        r2 = rx * rx + ry * ry
        core = np.exp(-r2 / (2.0 * (0.036 ** 2)))[:, :, None]
        halo = np.exp(-r2 / (2.0 * (0.17 ** 2)))[:, :, None]
        core_col = np.array([1.0, 0.97, 0.90], dtype=np.float32).reshape(1, 1, 3)
        halo_col = np.array(halo_rgb, dtype=np.float32).reshape(1, 1, 3)
        # Subtle tracer streak shooting rightward from muzzle
        streak_mask = (
            (finishing.grid_x >= mx)
            & (finishing.grid_x <= mx + 0.34)
        ).astype(np.float32)
        streak_y = np.exp(-(((finishing.grid_y - my) + 0.035 * (finishing.grid_x - mx)) ** 2) / (2.0 * (0.0055 ** 2)))
        streak_x = np.exp(-((finishing.grid_x - (mx + 0.14)) ** 2) / (2.0 * (0.085 ** 2)))
        streak = (streak_mask * streak_y * streak_x)[:, :, None]
        frame = np.clip(
            frame
            + inten * (0.92 * core * core_col + 0.48 * halo * halo_col + 0.65 * streak * halo_col)
            + 0.065 * inten,
            0.0,
            1.0,
        )

    # Optional brief chromatic aberration on snap-zoom (Scene 08)
    if "chromatic_snap" in scene.fx:
        cs = scene.fx["chromatic_snap"]
        if cs["t_start"] <= local_t <= cs["t_end"]:
            cu = (local_t - cs["t_start"]) / max(0.01, cs["t_end"] - cs["t_start"])
            px = int(round(cs["max_px"] * math.sin(math.pi * cu)))
            frame = apply_chromatic_aberration(frame, px)

    # Subtle ambient lighting breath (warm tungsten or cool industrial rim)
    if "warm_breath" in scene.fx:
        wb = float(scene.fx["warm_breath"]) * (0.5 + 0.5 * math.sin(math.pi * u))
        frame = np.clip(frame + np.array([wb, wb * 0.55, 0.0], dtype=np.float32).reshape(1, 1, 3), 0.0, 1.0)
    if "cool_rim_breath" in scene.fx:
        cb = float(scene.fx["cool_rim_breath"]) * (0.5 + 0.5 * math.sin(math.pi * u))
        frame = np.clip(frame + np.array([0.0, cb * 0.45, cb], dtype=np.float32).reshape(1, 1, 3), 0.0, 1.0)

    return frame


# ---------------------------------------------------------------------------
# Timeline Composition (With Seamless Transitions Across All 720 Frames)
# ---------------------------------------------------------------------------

def build_timeline_index() -> tuple[int, list[tuple[int, int, SceneSpec]]]:
    entries: list[tuple[int, int, SceneSpec]] = []
    cursor = 0
    for sc in SCENES:
        nf = int(round(sc.duration_sec * FPS))
        entries.append((cursor, cursor + nf, sc))
        cursor += nf
    return cursor, entries


def render_timeline_frame(
    global_f: int,
    timeline: list[tuple[int, int, SceneSpec]],
    images: dict[int, np.ndarray],
    finishing: CinemaFinishing,
) -> bytes:
    """Render global frame `global_f` [0..719], handling transitions + unified finishing."""
    # Find owning scene
    idx = 0
    for i, (f0, f1, _) in enumerate(timeline):
        if f0 <= global_f < f1:
            idx = i
            break

    f0, f1, sc = timeline[idx]
    local_t = (global_f - f0) / float(FPS)

    # Check outgoing transition (tail of current scene)
    out_kind = sc.transition_out
    out_half = sc.transition_frames // 2
    dist_to_end = f1 - global_f  # 1 at very last frame of scene

    # Check incoming transition (head of current scene, defined by previous scene's transition_out)
    prev_sc = timeline[idx - 1][2] if idx > 0 else None
    in_kind = prev_sc.transition_out if prev_sc is not None else "none"
    in_half = (prev_sc.transition_frames // 2) if prev_sc is not None else 0
    dist_from_start = global_f - f0  # 0 at very first frame of scene

    frame: np.ndarray | None = None

    # 1. Outgoing transition half (last `out_half` frames before cut)
    if out_kind != "none" and out_half > 0 and dist_to_end <= out_half and idx + 1 < len(timeline):
        next_sc = timeline[idx + 1][2]
        # Normalized progress across full transition [0..0.5]
        step_in_tr = out_half - dist_to_end  # 0 .. out_half-1
        u_tr = (step_in_tr + 0.5) / float(sc.transition_frames)  # < 0.5
        u_half = (step_in_tr + 1.0) / float(out_half)  # 0.33 .. 1.0

        if out_kind.startswith("whip_"):
            axis = "y" if out_kind == "whip_down" else "x"
            sign = 1.0 if out_kind in ("whip_right", "whip_down") else -1.0
            span = H_OUT if axis == "y" else W_OUT
            shift = sign * span * 0.22 * (u_half ** 2)
            off = (0.0, shift) if axis == "y" else (shift, 0.0)
            frame_a = render_scene_frame(sc, images[sc.index], local_t, finishing, extra_offset_px=off)
            blur_len = int(lerp(19.0, 63.0, u_half))
            frame = directional_motion_blur(frame_a, blur_len, axis=axis)
            if dist_to_end == 1:
                # Slight 22% pre-peek blend of blurred incoming scene right at whip apex
                in_shift = -sign * span * 0.20
                in_off = (0.0, in_shift) if axis == "y" else (in_shift, 0.0)
                frame_b = render_scene_frame(next_sc, images[next_sc.index], 0.0, finishing, extra_offset_px=in_off)
                frame_b = directional_motion_blur(frame_b, 57, axis=axis)
                frame = 0.78 * frame + 0.22 * frame_b

        elif out_kind == "rack_focus":
            frame_a = render_scene_frame(sc, images[sc.index], local_t, finishing)
            frame_b = render_scene_frame(next_sc, images[next_sc.index], 0.0, finishing)
            alpha = smoothstep(u_tr)
            blended = (1.0 - alpha) * frame_a + alpha * frame_b
            sigma = 13.5 * math.sin(math.pi * u_tr)
            frame = gaussian_blur(blended, sigma)

        elif out_kind in ("impact_amber", "hard_impact"):
            frame_a = render_scene_frame(sc, images[sc.index], local_t, finishing)
            flash_i = 0.14 * u_half if out_kind == "impact_amber" else 0.08 * u_half
            col = np.array([1.0, 0.62, 0.22], dtype=np.float32) if out_kind == "impact_amber" else np.array([0.92, 0.95, 1.0], dtype=np.float32)
            frame = np.clip(frame_a + flash_i * col.reshape(1, 1, 3), 0.0, 1.0)

    # 2. Incoming transition half (first `in_half` frames after cut)
    elif in_kind != "none" and in_half > 0 and dist_from_start < in_half and prev_sc is not None:
        u_tr = (in_half + dist_from_start + 0.5) / float(prev_sc.transition_frames)  # > 0.5
        v_half = 1.0 - (dist_from_start / float(in_half))  # 1.0 .. 0.33

        if in_kind.startswith("whip_"):
            axis = "y" if in_kind == "whip_down" else "x"
            sign = 1.0 if in_kind in ("whip_right", "whip_down") else -1.0
            span = H_OUT if axis == "y" else W_OUT
            shift = -sign * span * 0.20 * (v_half ** 2)
            off = (0.0, shift) if axis == "y" else (shift, 0.0)
            frame_b = render_scene_frame(sc, images[sc.index], local_t, finishing, extra_offset_px=off)
            blur_len = int(lerp(15.0, 59.0, v_half))
            frame = directional_motion_blur(frame_b, blur_len, axis=axis)

        elif in_kind == "rack_focus":
            frame_a = render_scene_frame(prev_sc, images[prev_sc.index], prev_sc.duration_sec, finishing)
            frame_b = render_scene_frame(sc, images[sc.index], local_t, finishing)
            alpha = smoothstep(u_tr)
            blended = (1.0 - alpha) * frame_a + alpha * frame_b
            sigma = 13.5 * math.sin(math.pi * u_tr)
            frame = gaussian_blur(blended, sigma)

        elif in_kind in ("impact_amber", "hard_impact"):
            punch_dy = 6.0 * v_half
            frame_b = render_scene_frame(sc, images[sc.index], local_t, finishing, extra_offset_px=(0.0, punch_dy))
            flash_i = 0.20 * v_half if in_kind == "impact_amber" else 0.12 * v_half
            col = np.array([1.0, 0.62, 0.22], dtype=np.float32) if in_kind == "impact_amber" else np.array([0.92, 0.95, 1.0], dtype=np.float32)
            frame = np.clip(frame_b + flash_i * col.reshape(1, 1, 3), 0.0, 1.0)

    # 3. Standard interior frame
    if frame is None:
        frame = render_scene_frame(sc, images[sc.index], local_t, finishing)

    # Unified 3-way tactical color grade LUT + anamorphic vignette + 35mm film grain
    frame = finishing.apply(frame, global_f, add_grain=True)

    # Seamless loop fade-in (Scene 01 head) & fade-out (Scene 10 tail)
    if "fade_in_sec" in sc.fx:
        fi = float(sc.fx["fade_in_sec"])
        if local_t < fi:
            a = smoothstep(local_t / fi)
            frame = BG_DARK.reshape(1, 1, 3) * (1.0 - a) + frame * a
    if "fade_out_sec" in sc.fx:
        fo = float(sc.fx["fade_out_sec"])
        rem = sc.duration_sec - local_t
        if rem < fo:
            a = smoothstep(rem / fo)
            frame = BG_DARK.reshape(1, 1, 3) * (1.0 - a) + frame * a

    return (np.clip(frame, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8).tobytes()


# ---------------------------------------------------------------------------
# Procedural 48kHz Stereo Tactical Audio Synthesizer (Pure NumPy + wave)
# ---------------------------------------------------------------------------

def synthesize_tactical_audio(wav_path: Path, total_sec: float, timeline: list[tuple[int, int, SceneSpec]]) -> None:
    """Generate a 48kHz 16-bit stereo tactical cinematic audio track synchronized to exact scene cuts."""
    sr = 48000
    n_samples = int(round(total_sec * sr))
    t = np.arange(n_samples, dtype=np.float64) / sr
    rng = np.random.default_rng(seed=2026)

    left = np.zeros(n_samples, dtype=np.float64)
    right = np.zeros(n_samples, dtype=np.float64)

    # 1. Sub-bass tactical drone (42 Hz + 63.2 Hz detuned + slow 0.21 Hz LFO at -18 dBFS)
    lfo = 0.72 + 0.28 * np.sin(2.0 * math.pi * 0.21 * t)
    drone_l = (0.62 * np.sin(2.0 * math.pi * 42.0 * t) + 0.38 * np.sin(2.0 * math.pi * 63.2 * t + 0.3)) * lfo * 0.125
    drone_r = (0.62 * np.sin(2.0 * math.pi * 42.15 * t + 0.18) + 0.38 * np.sin(2.0 * math.pi * 63.0 * t)) * lfo * 0.125
    left += drone_l
    right += drone_r

    # 2. Dark hangar / wind ambience (FFT bandpass 240 Hz - 1650 Hz, 1/f slope, -28 dBFS)
    freqs = np.fft.rfftfreq(n_samples, d=1.0 / sr)
    bp_mask = np.zeros_like(freqs)
    in_band = (freqs >= 240.0) & (freqs <= 1650.0)
    bp_mask[in_band] = (240.0 / np.maximum(freqs[in_band], 240.0)) ** 0.85
    # Smooth skirt transitions
    bp_mask *= np.clip((freqs - 180.0) / 80.0, 0.0, 1.0)
    bp_mask *= np.clip((2100.0 - freqs) / 450.0, 0.0, 1.0)

    for ch in (left, right):
        wn = rng.normal(0.0, 1.0, size=n_samples)
        spec = np.fft.rfft(wn) * bp_mask
        amb = np.fft.irfft(spec, n=n_samples)
        amb /= max(1e-6, np.std(amb))
        ch += amb * 0.036  # ~ -29 dBFS RMS

    # Helper to add stereo transient safely
    def add_event(start_sec: float, sig_l: np.ndarray, sig_r: np.ndarray) -> None:
        i0 = int(round(start_sec * sr))
        i1 = i0 + len(sig_l)
        s0 = max(0, -i0)
        d0 = max(0, i0)
        d1 = min(n_samples, i1)
        if d1 > d0:
            ln = d1 - d0
            left[d0:d1] += sig_l[s0 : s0 + ln]
            right[d0:d1] += sig_r[s0 : s0 + ln]

    # 3. Synchronized scene-cut percussive sub-impacts & directional whip-pan whooshes
    for i in range(len(timeline) - 1):
        _, cut_f, sc = timeline[i]
        cut_t = cut_f / float(FPS)
        kind = sc.transition_out

        if kind.startswith("whip_"):
            dur_w = 0.24
            nw = int(round(dur_w * sr))
            tw = np.arange(nw, dtype=np.float64) / sr
            env = np.sin(math.pi * tw / dur_w) ** 1.6
            # Frequency sweep bandpass filtered noise + tonal air swoosh
            f_inst = 320.0 + 1480.0 * (np.sin(math.pi * tw / dur_w) ** 1.3)
            phase = 2.0 * math.pi * np.cumsum(f_inst) / sr
            noise = rng.normal(0.0, 1.0, size=nw)
            # Modulate smooth carrier + filtered air
            w_sig = (0.55 * np.sin(phase) * (0.4 + 0.6 * np.abs(noise)) + 0.45 * np.sin(phase * 0.52) * noise) * env
            w_sig = np.convolve(w_sig, np.ones(9) / 9.0, mode="same")
            w_sig /= max(1e-6, np.max(np.abs(w_sig)))
            w_sig *= 0.26

            # Stereo pan sweep following whip direction
            if kind == "whip_right":
                pan_l = np.linspace(0.95, 0.35, nw)
                pan_r = np.linspace(0.35, 0.95, nw)
            elif kind == "whip_left":
                pan_l = np.linspace(0.35, 0.95, nw)
                pan_r = np.linspace(0.95, 0.35, nw)
            else:
                pan_l = np.full(nw, 0.80)
                pan_r = np.full(nw, 0.80)

            # Pair whip with subtle sub-punch at cut center
            sub_env = np.exp(-np.maximum(0.0, tw - 0.08) / 0.065) * (tw >= 0.08)
            sub_f = 95.0 * np.exp(-np.maximum(0.0, tw - 0.08) / 0.06) + 34.0
            sub = np.sin(2.0 * math.pi * np.cumsum(sub_f) / sr) * sub_env * 0.24
            add_event(cut_t - 0.11, w_sig * pan_l + sub, w_sig * pan_r + sub)

        else:
            # Sub-drop thump for rack-focus / impact cuts (105 Hz -> 34 Hz, decay 190ms)
            dur_s = 0.32
            ns = int(round(dur_s * sr))
            ts = np.arange(ns, dtype=np.float64) / sr
            f_sub = 34.0 + 72.0 * np.exp(-ts / 0.055)
            phase = 2.0 * math.pi * np.cumsum(f_sub) / sr
            amp = 0.34 if kind in ("impact_amber", "hard_impact") else 0.24
            thump = np.sin(phase) * np.exp(-ts / 0.11) * (1.0 - np.exp(-ts / 0.004)) * amp
            if kind in ("impact_amber", "hard_impact"):
                # Crisp metallic transient attack
                click = rng.normal(0.0, 1.0, size=ns) * np.exp(-ts / 0.012) * 0.16
                thump += click
            add_event(cut_t - 0.015, thump, thump)

    # 4. Tactical mechanical foley & tracer pulse transients synced to scene actions
    def add_mechanical_click(t_hit: float, f1: float, f2: float, level: float = 0.22, pan: float = 0.0) -> None:
        dur_c = 0.11
        nc = int(round(dur_c * sr))
        tc = np.arange(nc, dtype=np.float64) / sr
        ring = (
            0.55 * np.sin(2.0 * math.pi * f1 * tc)
            + 0.45 * np.sin(2.0 * math.pi * f2 * tc)
        ) * np.exp(-tc / 0.022)
        snap = rng.normal(0.0, 1.0, size=nc) * np.exp(-tc / 0.007)
        body = np.sin(2.0 * math.pi * 78.0 * tc) * np.exp(-tc / 0.035) * 0.65
        sig = (0.50 * ring + 0.35 * snap + 0.45 * body) * level
        gl = 1.0 - max(0.0, pan) * 0.4
        gr = 1.0 - max(0.0, -pan) * 0.4
        add_event(t_hit, sig * gl, sig * gr)

    # Scene 02: polymer buckle snap lock (3.15s)
    add_mechanical_click(3.15, 1680.0, 3120.0, level=0.18, pan=-0.2)
    # Scene 03: CNC MK18 bolt catch metallic clack (5.45s)
    add_mechanical_click(5.45, 1420.0, 2860.0, level=0.26, pan=0.1)
    # Scene 05: PEQ illuminator pressure switch click (10.25s)
    add_mechanical_click(10.25, 2240.0, 4180.0, level=0.15, pan=-0.15)

    # Scene 07: 2x CQB ARP9 Tracer / Bolt Pulse Transients synced to exact flash timestamps (14.95s, 15.65s)
    for t_shot in (14.4 + 0.55, 14.4 + 1.25):
        dur_p = 0.16
        np_s = int(round(dur_p * sr))
        tp = np.arange(np_s, dtype=np.float64) / sr
        # Sharp high-pass noise snap (12ms) + metallic bolt + low punch (68 Hz)
        raw_n = rng.normal(0.0, 1.0, size=np_s)
        hp_n = raw_n - np.convolve(raw_n, np.ones(19) / 19.0, mode="same")
        burst = hp_n * np.exp(-tp / 0.014) * 0.36
        bolt = (np.sin(2.0 * math.pi * 1420.0 * tp) + 0.7 * np.sin(2.0 * math.pi * 2860.0 * tp)) * np.exp(-tp / 0.036) * 0.16
        punch = np.sin(2.0 * math.pi * (68.0 + 40.0 * np.exp(-tp / 0.015)) * tp) * np.exp(-tp / 0.055) * 0.34
        sig = burst + bolt + punch
        add_event(t_shot, sig * 0.92, sig * 1.0)

    # Scene 08: Glock snap-zoom metallic slide glint + sub accent (16.95s)
    add_mechanical_click(16.95, 1950.0, 3620.0, level=0.22, pan=0.25)
    # Scene 09: TAC-41 sniper bolt lock cycle (20.45s)
    add_mechanical_click(20.45, 1180.0, 2410.0, level=0.20, pan=0.0)

    # 5. Soft limiter (tanh) + seamless loop fade-in (0.30s) & fade-out (0.40s)
    left = np.tanh(left * 1.15) * 0.88
    right = np.tanh(right * 1.15) * 0.88

    fade_in_n = int(round(0.30 * sr))
    fade_out_n = int(round(0.40 * sr))
    fi_env = np.linspace(0.0, 1.0, fade_in_n, dtype=np.float64)
    fo_env = np.linspace(1.0, 0.0, fade_out_n, dtype=np.float64)
    left[:fade_in_n] *= fi_env
    right[:fade_in_n] *= fi_env
    left[-fade_out_n:] *= fo_env
    right[-fade_out_n:] *= fo_env

    stereo = np.empty((n_samples, 2), dtype=np.int16)
    stereo[:, 0] = np.clip(left * 32767.0, -32768, 32767).astype(np.int16)
    stereo[:, 1] = np.clip(right * 32767.0, -32768, 32767).astype(np.int16)

    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())


# ---------------------------------------------------------------------------
# Color-Graded Hero Poster Generation (< 150 KB, 1920x1080)
# ---------------------------------------------------------------------------

def render_hero_poster(scene10_img: np.ndarray, finishing: CinemaFinishing) -> int:
    """Render optimized 1920x1080 color-graded Hero poster from Scene 10 (< 150 KB)."""
    base = warp_subpixel(scene10_img, scale=1.03, rot_deg=0.0, roi_xy=(0.50, 0.50))
    graded = finishing.apply(base, frame_idx=0, add_grain=False)
    pil_im = Image.fromarray((np.clip(graded, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8), mode="RGB")

    # Select highest JPEG quality that stays strictly under 145 KB for fast LCP
    size_bytes = 0
    for q in (86, 82, 78, 74, 70, 66):
        pil_im.save(OUT_POSTER, format="JPEG", quality=q, optimize=True, progressive=True)
        size_bytes = os.path.getsize(OUT_POSTER)
        if size_bytes < 145 * 1024:
            print(f"  [OK] Poster saved: {OUT_POSTER.name} (1920x1080, q={q}, {size_bytes / 1024:.1f} KB)")
            return size_bytes
    print(f"  [OK] Poster saved: {OUT_POSTER.name} (1920x1080, {size_bytes / 1024:.1f} KB)")
    return size_bytes


# ---------------------------------------------------------------------------
# Main Production Entrypoint
# ---------------------------------------------------------------------------

def main() -> None:
    t0 = time.perf_counter()
    VIDEO_OUT_DIR.mkdir(parents=True, exist_ok=True)

    total_frames, timeline = build_timeline_index()
    total_sec = total_frames / float(FPS)
    print(f"=== Brakasa Tactical Hero Video Renderer ===")
    print(f"Backend: {'OpenCV (fast-path)' if HAS_CV2 else 'PIL (fallback)'} | Output: {W_OUT}x{H_OUT} @ {FPS}fps")
    print(f"Timeline: {len(SCENES)} scenes, {total_frames} frames ({total_sec:.2f}s)")

    # 1. Pre-load all 10 standardized overscan keyframes into float32 RGB memory
    images: dict[int, np.ndarray] = {}
    for sc in SCENES:
        p = HERO_IMG_DIR / sc.filename
        if not p.exists():
            raise FileNotFoundError(f"Missing standardized hero keyframe: {p}")
        with Image.open(p) as im:
            arr = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
        images[sc.index] = arr
    print(f"Loaded {len(images)} keyframes in {time.perf_counter() - t0:.2f}s.")

    finishing = CinemaFinishing(W_OUT, H_OUT)

    # 2. Generate matching 1920x1080 color-graded poster from Scene 10
    render_hero_poster(images[10], finishing)

    # 3. Synthesize synchronized 48kHz stereo tactical audio track
    tmp_wav = Path(tempfile.gettempdir()) / "brakasa_hero_audio_tmp.wav"
    t_aud = time.perf_counter()
    synthesize_tactical_audio(tmp_wav, total_sec, timeline)
    print(f"Synthesized 48kHz stereo tactical audio ({os.path.getsize(tmp_wav) / 1024:.1f} KB) in {time.perf_counter() - t_aud:.2f}s.")

    # 4. Launch static ffmpeg stdin RGB24 pipe
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg_exe,
        "-y",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{W_OUT}x{H_OUT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(tmp_wav),
        "-c:v",
        "libx264",
        "-profile:v",
        "high",
        "-level",
        "4.1",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "medium",
        "-crf",
        "21",
        "-maxrate",
        "3400k",
        "-bufsize",
        "6800k",
        "-movflags",
        "+faststart",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-shortest",
        str(OUT_MP4),
    ]

    t_ren = time.perf_counter()
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdin is not None

    batch_size = 16
    workers = min(8, os.cpu_count() or 4)
    try:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            for start_f in range(0, total_frames, batch_size):
                end_f = min(total_frames, start_f + batch_size)
                futs = [
                    pool.submit(render_timeline_frame, f_idx, timeline, images, finishing)
                    for f_idx in range(start_f, end_f)
                ]
                for fut in futs:
                    proc.stdin.write(fut.result())
                if end_f % 144 == 0 or end_f == total_frames:
                    elapsed = time.perf_counter() - t_ren
                    print(f"  Rendered {end_f:3d}/{total_frames} frames ({100.0 * end_f / total_frames:5.1f}%) [{elapsed:.1f}s]")
        proc.stdin.close()
        stderr_out = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
        ret = proc.wait()
        if ret != 0:
            raise RuntimeError(f"ffmpeg exited with code {ret}:\n{stderr_out}")
        if stderr_out.strip():
            print(f"[ffmpeg warnings]\n{stderr_out.strip()}")
    finally:
        if tmp_wav.exists():
            try:
                tmp_wav.unlink()
            except OSError:
                pass

    mp4_mb = os.path.getsize(OUT_MP4) / (1024 * 1024)
    print(f"=== Render Complete in {time.perf_counter() - t0:.2f}s ===")
    print(f"Output MP4: {OUT_MP4} ({mp4_mb:.2f} MB)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        sys.exit(1)
