import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProductDetail, ProductMediaItem } from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getStoreCopy } from '../../i18n/store';
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconPause,
  IconPlay,
  IconVideo,
  IconVolumeOff,
  IconVolumeOn,
  IconZoomIn,
} from '../ui/TacticalIcons';

export interface ProductGalleryProps {
  product: ProductDetail;
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ProductGallery({ product }: ProductGalleryProps): React.JSX.Element {
  const { lang } = useLanguage();
  const { gallery } = getStoreCopy(lang);

  const mediaList = useMemo<ProductMediaItem[]>(() => {
    const items = [...product.media].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      if (a.mediaType !== b.mediaType) return a.mediaType === 'image' ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

    if (items.length > 0) {
      return items;
    }

    const fallback: ProductMediaItem[] = [
      {
        id: -1,
        productId: product.id,
        mediaType: 'image',
        url: product.primaryImageUrl,
        posterUrl: null,
        altText: product.primaryImageAlt || product.name,
        durationSec: null,
        isPrimary: true,
        sortOrder: 0,
      },
    ];
    if (product.demoVideoUrl) {
      fallback.push({
        id: -2,
        productId: product.id,
        mediaType: 'video',
        url: product.demoVideoUrl,
        posterUrl: product.demoVideoPosterUrl || product.primaryImageUrl,
        altText: `${product.name} demo video`,
        durationSec: product.demoVideoDurationSec,
        isPrimary: false,
        sortOrder: 1,
      });
    }
    return fallback;
  }, [product]);

  const imageItems = useMemo(
    () => mediaList.filter((item) => item.mediaType === 'image'),
    [mediaList],
  );

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLightboxOpen(false);
    setLightboxIndex(0);
  }, [product.id]);

  const activeItem = mediaList[activeIndex] ?? mediaList[0];
  const firstVideoIndex = mediaList.findIndex((m) => m.mediaType === 'video');
  const firstImageIndex = mediaList.findIndex((m) => m.mediaType === 'image');

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(activeItem?.durationSec ?? 0);
  }, [activeIndex, activeItem?.durationSec]);

  const openLightbox = useCallback(() => {
    if (activeItem.mediaType !== 'image' || imageItems.length === 0) return;
    const foundIdx = imageItems.findIndex((img) => img.url === activeItem.url);
    setLightboxIndex(foundIdx >= 0 ? foundIdx : 0);
    setLightboxOpen(true);
  }, [activeItem, imageItems]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    window.setTimeout(() => {
      zoomTriggerRef.current?.focus();
    }, 20);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const focusTimer = window.setTimeout(() => {
      lightboxCloseRef.current?.focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (imageItems.length > 1 && e.key === 'ArrowLeft') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev - 1 + imageItems.length) % imageItems.length);
        return;
      }
      if (imageItems.length > 1 && e.key === 'ArrowRight') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev + 1) % imageItems.length);
        return;
      }
      if (e.key === 'Tab' && lightboxRef.current) {
        const focusable = lightboxRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, closeLightbox, imageItems.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handleTogglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      const p = vid.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          setIsPlaying(false);
        });
      }
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    const vid = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (vid) {
      vid.muted = nextMuted;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSec = Number(e.target.value);
    const vid = videoRef.current;
    if (vid && Number.isFinite(targetSec)) {
      vid.currentTime = targetSec;
      setCurrentTime(targetSec);
    }
  };

  const safeDuration = duration > 0 ? duration : activeItem?.durationSec ?? 0;
  const activeLightboxImage = imageItems[lightboxIndex] ?? imageItems[0];

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {firstVideoIndex >= 0 && firstImageIndex >= 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex(firstImageIndex)}
            aria-pressed={activeItem.mediaType === 'image'}
            style={{
              backgroundColor:
                activeItem.mediaType === 'image' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
              borderColor:
                activeItem.mediaType === 'image' ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-control)',
            }}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border px-3.5 text-sm font-semibold"
          >
            <span>{gallery.photoTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex(firstVideoIndex)}
            aria-pressed={activeItem.mediaType === 'video'}
            style={{
              backgroundColor:
                activeItem.mediaType === 'video' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
              borderColor:
                activeItem.mediaType === 'video' ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-control)',
            }}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border px-3.5 text-sm font-semibold"
          >
            <IconVideo size={15} />
            <span>{gallery.videoTab}</span>
          </button>
        </div>
      ) : null}

      <div
        style={{
          backgroundColor: '#0F1110',
          borderColor: 'var(--border-subtle)',
          borderRadius: 'var(--radius-plate)',
        }}
        className="relative aspect-video w-full overflow-hidden border"
      >
        {activeItem.mediaType === 'video' ? (
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              key={activeItem.url}
              src={activeItem.url}
              poster={activeItem.posterUrl || product.primaryImageUrl}
              width={1280}
              height={720}
              muted={isMuted}
              playsInline
              loop
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration;
                if (Number.isFinite(dur) && dur > 0) {
                  setDuration(dur);
                }
              }}
              onTimeUpdate={(e) => {
                setCurrentTime(e.currentTarget.currentTime);
              }}
              className="block h-full w-full object-cover"
            />

            {!isPlaying ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label={gallery.playDemoAria(product.name)}
                  style={{
                    backgroundColor: 'var(--hero-cta-bg)',
                    color: 'var(--hero-cta-fg)',
                    borderRadius: 'var(--radius-control)',
                  }}
                  className="pointer-events-auto inline-flex min-h-[48px] items-center gap-2.5 px-5 font-sans-body text-sm font-semibold"
                >
                  <IconPlay size={18} />
                  <span>{gallery.playDemoBtn}</span>
                </button>
              </div>
            ) : null}

            <div
              style={{
                background:
                  'linear-gradient(0deg, rgba(15, 17, 16, 0.92) 0%, rgba(15, 17, 16, 0.72) 70%, rgba(15, 17, 16, 0) 100%)',
              }}
              className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 px-3 pt-6 pb-2.5"
            >
              <button
                type="button"
                onClick={handleTogglePlay}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? gallery.pauseVideoAria : gallery.playVideoAria}
                style={{
                  backgroundColor: 'rgba(23, 26, 24, 0.92)',
                  color: '#F0EFEA',
                  borderColor: '#7A847D',
                  borderRadius: 'var(--radius-control)',
                }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 border px-3 text-xs font-semibold"
              >
                {isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
                <span>{isPlaying ? gallery.pauseLabel : gallery.playLabel}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                aria-pressed={!isMuted}
                aria-label={isMuted ? gallery.unmuteAria : gallery.muteAria}
                style={{
                  backgroundColor: 'rgba(23, 26, 24, 0.92)',
                  color: '#F0EFEA',
                  borderColor: isMuted ? '#7A847D' : '#EBAC3B',
                  borderRadius: 'var(--radius-control)',
                }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 border px-3 text-xs font-semibold"
              >
                {isMuted ? <IconVolumeOff size={16} /> : <IconVolumeOn size={16} />}
                <span className="hidden sm:inline">
                  {isMuted ? gallery.soundOff : gallery.soundOn}
                </span>
              </button>

              <div className="flex min-w-[140px] flex-1 items-center gap-2 px-1">
                <label htmlFor={`pdp-video-seek-${product.id}`} className="sr-only-brakasa">
                  {gallery.seekLabel}
                </label>
                <input
                  id={`pdp-video-seek-${product.id}`}
                  type="range"
                  min={0}
                  max={safeDuration || 10}
                  step={0.1}
                  value={Math.min(currentTime, safeDuration || 10)}
                  onChange={handleSeek}
                  className="h-2 w-full accent-[#E5A024]"
                />
                <span className="shrink-0 font-mono-tech text-xs text-[#F0EFEA] tabular-nums">
                  {formatSeconds(currentTime)} / {formatSeconds(safeDuration)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <img
              src={activeItem.url}
              alt={activeItem.altText || product.name}
              width={1600}
              height={900}
              fetchPriority="high"
              decoding="async"
              onClick={openLightbox}
              className="block h-full w-full cursor-zoom-in object-cover"
            />
            <button
              ref={zoomTriggerRef}
              type="button"
              onClick={openLightbox}
              aria-label={gallery.zoomAria(product.name)}
              style={{
                backgroundColor: 'rgba(15, 17, 16, 0.82)',
                color: '#F0EFEA',
                borderColor: '#7A847D',
                borderRadius: 'var(--radius-control)',
              }}
              className="absolute top-2.5 right-2.5 inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 border px-3 text-xs font-semibold hover:border-[#F0EFEA]"
            >
              <IconZoomIn size={15} />
              <span className="hidden sm:inline">{gallery.zoomLabel}</span>
            </button>
          </>
        )}

        {mediaList.length > 1 ? (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label={gallery.prevMediaAria}
              style={{
                backgroundColor: 'rgba(15, 17, 16, 0.82)',
                color: '#F0EFEA',
                borderColor: '#7A847D',
                borderRadius: 'var(--radius-control)',
              }}
              className="absolute top-1/2 left-2.5 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center border hover:border-[#F0EFEA]"
            >
              <IconChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={gallery.nextMediaAria}
              style={{
                backgroundColor: 'rgba(15, 17, 16, 0.82)',
                color: '#F0EFEA',
                borderColor: '#7A847D',
                borderRadius: 'var(--radius-control)',
              }}
              className="absolute top-1/2 right-2.5 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center border hover:border-[#F0EFEA]"
            >
              <IconChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>

      {mediaList.length > 1 ? (
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
          role="group"
          aria-label={gallery.thumbsGroupAria}
        >
          {mediaList.map((item, idx) => {
            const isSelected = idx === activeIndex;
            const thumbSrc =
              item.mediaType === 'video'
                ? item.posterUrl || product.primaryImageUrl
                : item.url;
            return (
              <button
                key={`${item.mediaType}-${item.url}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-pressed={isSelected}
                aria-label={
                  item.mediaType === 'video'
                    ? gallery.showVideoThumbAria(idx + 1)
                    : gallery.showPhotoThumbAria(idx + 1)
                }
                style={{
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-plate)',
                }}
                className="relative aspect-video min-h-[44px] w-full overflow-hidden border-2 p-0"
              >
                <img
                  src={thumbSrc}
                  alt=""
                  width={1600}
                  height={900}
                  loading="lazy"
                  className="block h-full w-full object-cover"
                />
                {item.mediaType === 'video' ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(15, 17, 16, 0.88)',
                      color: '#F0EFEA',
                      borderRadius: 'var(--radius-plate)',
                    }}
                    className="absolute inset-x-1 bottom-1 inline-flex items-center justify-center gap-1 py-0.5 font-mono-tech text-[10px] font-semibold uppercase"
                  >
                    <IconPlay size={10} />
                    <span>{gallery.videoBadge}</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {lightboxOpen && activeLightboxImage ? (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={gallery.lightboxAria(product.name)}
          style={{ backgroundColor: 'rgba(10, 12, 11, 0.94)' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <div className="mb-3 flex w-full max-w-[90vw] items-center justify-between gap-3">
            <span className="truncate font-mono-tech text-xs text-[#F0EFEA]/80 tabular-nums">
              {product.name}
              {imageItems.length > 1
                ? ` (${lightboxIndex + 1} / ${imageItems.length})`
                : ''}
            </span>
            <button
              ref={lightboxCloseRef}
              type="button"
              onClick={closeLightbox}
              aria-label={gallery.lightboxCloseAria}
              style={{
                backgroundColor: 'rgba(23, 26, 24, 0.92)',
                color: '#F0EFEA',
                borderColor: '#7A847D',
                borderRadius: 'var(--radius-control)',
              }}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 border px-3 text-xs font-semibold"
            >
              <IconClose size={16} />
              <span>{gallery.lightboxCloseLabel}</span>
            </button>
          </div>

          <div className="relative flex max-h-[84vh] w-full max-w-[90vw] flex-1 items-center justify-center">
            <img
              src={activeLightboxImage.url}
              alt={activeLightboxImage.altText || product.name}
              width={1600}
              height={900}
              className="block max-h-[82vh] max-w-[90vw] h-auto w-auto rounded-[2px] border border-[#2E3430] bg-[#0F1110] object-contain"
            />

            {imageItems.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (prev) => (prev - 1 + imageItems.length) % imageItems.length,
                    )
                  }
                  aria-label={gallery.lightboxPrevAria}
                  style={{
                    backgroundColor: 'rgba(15, 17, 16, 0.85)',
                    color: '#F0EFEA',
                    borderColor: '#7A847D',
                    borderRadius: 'var(--radius-control)',
                  }}
                  className="absolute top-1/2 left-2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center border"
                >
                  <IconChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev + 1) % imageItems.length)
                  }
                  aria-label={gallery.lightboxNextAria}
                  style={{
                    backgroundColor: 'rgba(15, 17, 16, 0.85)',
                    color: '#F0EFEA',
                    borderColor: '#7A847D',
                    borderRadius: 'var(--radius-control)',
                  }}
                  className="absolute top-1/2 right-2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center border"
                >
                  <IconChevronRight size={20} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
