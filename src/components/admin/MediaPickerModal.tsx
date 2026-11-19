import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminMediaListResponse,
  AdminMediaUploadResponse,
  MediaLibraryAsset,
} from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy, type AdminDictionary } from '../../i18n/admin';
import { ApiRequestError, apiFetch, apiUpload } from '../../lib/api';
import { formatDateTimeId } from '../../lib/format';
import { EmptyState, ErrorState, LoadingState } from '../ui/StateViews';

export interface MediaPickerModalProps {
  open: boolean;
  mediaTypeFilter?: 'all' | 'image' | 'video';
  title?: string;
  onSelect: (asset: MediaLibraryAsset) => void;
  onClose: () => void;
}

type FolderFilter = 'all' | 'products' | 'hero' | 'videos' | 'uploads';

const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_EXT = ['.mp4', '.webm'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFolderLabel(folder: MediaLibraryAsset['folder'], copy: AdminDictionary): string {
  switch (folder) {
    case 'products':
      return copy.mediaPicker.folderProducts;
    case 'hero':
      return copy.mediaPicker.folderHero;
    case 'videos':
      return copy.mediaPicker.folderVideos;
    case 'uploads':
      return copy.mediaPicker.folderUploads;
  }
}

export function MediaPickerModal({
  open,
  mediaTypeFilter = 'all',
  title,
  onSelect,
  onClose,
}: MediaPickerModalProps): React.JSX.Element | null {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);

  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<FolderFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>(mediaTypeFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setTypeFilter(mediaTypeFilter);
  }, [mediaTypeFilter, open]);

  const loadAssets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AdminMediaListResponse>('/api/admin/media');
      setAssets(response.assets);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.mediaPicker.errLoadFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [copy.mediaPicker.errLoadFallback]);

  useEffect(() => {
    if (!open) return;

    prevFocusedRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setUploadError(null);
    setUploadSuccess(null);
    void loadAssets();

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 10);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown, true);
      prevFocusedRef.current?.focus();
    };
  }, [open, loadAssets, onClose]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets.filter((asset) => {
      if (typeFilter !== 'all' && asset.mediaType !== typeFilter) return false;
      if (folderFilter !== 'all' && asset.folder !== folderFilter) return false;
      if (q && !asset.filename.toLowerCase().includes(q) && !asset.url.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [assets, folderFilter, typeFilter, searchQuery]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const lowerName = file.name.toLowerCase();
    const isImage = ALLOWED_IMAGE_EXT.some((ext) => lowerName.endsWith(ext));
    const isVideo = ALLOWED_VIDEO_EXT.some((ext) => lowerName.endsWith(ext));

    if (!isImage && !isVideo) {
      setUploadError(copy.mediaPicker.errUnsupportedExt);
      event.target.value = '';
      return;
    }

    if (mediaTypeFilter === 'image' && !isImage) {
      setUploadError(copy.mediaPicker.errImageOnly);
      event.target.value = '';
      return;
    }

    if (mediaTypeFilter === 'video' && !isVideo) {
      setUploadError(copy.mediaPicker.errVideoOnly);
      event.target.value = '';
      return;
    }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      setUploadError(copy.mediaPicker.errImageTooLarge);
      event.target.value = '';
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setUploadError(copy.mediaPicker.errVideoTooLarge);
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiUpload<AdminMediaUploadResponse>('/api/admin/media/upload', formData);
      setAssets((prev) => [response.asset, ...prev.filter((item) => item.url !== response.asset.url)]);
      setFolderFilter('all');
      setUploadSuccess(copy.mediaPicker.uploadSuccess(response.asset.filename));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setUploadError(err.message);
      } else {
        setUploadError(copy.mediaPicker.errUploadFallback);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (!open) return null;

  const modalTitle = title ?? copy.mediaPicker.defaultTitle;
  const acceptAttr =
    mediaTypeFilter === 'image'
      ? '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
      : mediaTypeFilter === 'video'
        ? '.mp4,.webm,video/mp4,video/webm'
        : '.jpg,.jpeg,.png,.webp,.mp4,.webm,image/jpeg,image/png,image/webp,video/mp4,video/webm';

  const limitText =
    mediaTypeFilter === 'image'
      ? copy.mediaPicker.limitImage
      : mediaTypeFilter === 'video'
        ? copy.mediaPicker.limitVideo
        : copy.mediaPicker.limitAll;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-[var(--backdrop-scrim)]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <h2
            id="media-picker-modal-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            {modalTitle}
          </h2>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent-primary)]"
          >
            {copy.common.close}
          </button>
        </div>

        {/* Upload & Filter Bar */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-5 py-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="media-picker-search"
                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
              >
                {copy.mediaPicker.searchLabel}
              </label>
              <input
                id="media-picker-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy.mediaPicker.searchPlaceholder}
                className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label
                  htmlFor="media-picker-upload"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                >
                  {copy.mediaPicker.uploadLabel(limitText)}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id="media-picker-upload"
                    type="file"
                    accept={acceptAttr}
                    onChange={(e) => void handleFileUpload(e)}
                    disabled={uploading}
                    className="block min-h-[44px] max-w-[260px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs text-[var(--text-primary)] file:mr-2.5 file:rounded-[2px] file:border-0 file:bg-[var(--accent-primary)] file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-[var(--accent-foreground)]"
                  />
                  <button
                    type="button"
                    onClick={() => void loadAssets()}
                    disabled={loading}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                  >
                    {copy.common.reload}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Folder & Type Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={copy.mediaPicker.folderGroupAria}
            >
              {(
                [
                  { id: 'all', label: copy.mediaPicker.folderAll },
                  { id: 'products', label: copy.mediaPicker.folderProducts },
                  { id: 'hero', label: copy.mediaPicker.folderHero },
                  { id: 'videos', label: copy.mediaPicker.folderVideos },
                  { id: 'uploads', label: copy.mediaPicker.folderUploads },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFolderFilter(tab.id)}
                  aria-pressed={folderFilter === tab.id}
                  className={[
                    'min-h-[44px] rounded-[4px] border px-3 text-xs font-medium transition-colors duration-150',
                    folderFilter === tab.id
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {mediaTypeFilter === 'all' && (
              <div
                className="flex items-center gap-2"
                role="group"
                aria-label={copy.mediaPicker.typeGroupAria}
              >
                {(
                  [
                    { id: 'all', label: copy.mediaPicker.typeAll },
                    { id: 'image', label: copy.mediaPicker.typeImage },
                    { id: 'video', label: copy.mediaPicker.typeVideo },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTypeFilter(item.id)}
                    aria-pressed={typeFilter === item.id}
                    className={[
                      'min-h-[44px] rounded-[4px] border px-3 text-xs font-medium transition-colors duration-150',
                      typeFilter === item.id
                        ? 'border-[var(--brand-olive)] bg-[var(--brand-olive-surface)] text-[var(--brand-olive-tag-text)] font-semibold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {uploading && (
            <p role="status" aria-live="polite" className="text-xs font-medium text-[var(--accent-text)]">
              {copy.mediaPicker.uploadingStatus}
            </p>
          )}
          {uploadError && (
            <div
              role="alert"
              className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger)]"
            >
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-[2px] border border-[var(--status-ok)] bg-[var(--status-ok-bg)] px-3 py-2 text-xs text-[var(--status-ok)]"
            >
              {uploadSuccess}
            </div>
          )}
        </div>

        {/* Media Assets Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <LoadingState label={copy.mediaPicker.loadingLabel} />
          ) : error ? (
            <ErrorState
              title={copy.mediaPicker.errorTitle}
              message={error}
              onRetry={() => void loadAssets()}
            />
          ) : filteredAssets.length === 0 ? (
            <EmptyState
              title={copy.mediaPicker.emptyTitle}
              description={copy.mediaPicker.emptyDesc}
              actionLabel={copy.mediaPicker.resetFilterBtn}
              onAction={() => {
                setFolderFilter('all');
                setSearchQuery('');
                if (mediaTypeFilter === 'all') setTypeFilter('all');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => (
                <article
                  key={asset.url}
                  className="flex flex-col overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
                >
                  <div className="relative aspect-video w-full bg-[var(--bg-elevated)]">
                    {asset.mediaType === 'video' ? (
                      <video
                        src={asset.url}
                        width={1280}
                        height={720}
                        controls
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        width={320}
                        height={180}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="pointer-events-none absolute top-2 left-2 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--text-primary)]">
                      {asset.mediaType === 'video' ? 'VIDEO' : 'IMG'}
                    </span>
                    <span className="pointer-events-none absolute top-2 right-2 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-secondary)]">
                      {getFolderLabel(asset.folder, copy)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-3 p-3">
                    <div className="min-w-0 space-y-1">
                      <p
                        title={asset.filename}
                        className="truncate font-[family-name:var(--font-mono)] text-xs font-medium text-[var(--text-primary)]"
                      >
                        {asset.filename}
                      </p>
                      <p className="truncate font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                        {asset.url}
                      </p>
                      <p className="font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[var(--text-muted)]">
                        {formatFileSize(asset.sizeBytes)} | {formatDateTimeId(asset.updatedAt, lang)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelect(asset);
                        onClose();
                      }}
                      className="min-h-[44px] w-full rounded-[4px] bg-[var(--accent-primary)] px-3 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
                    >
                      {copy.mediaPicker.selectBtn}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
