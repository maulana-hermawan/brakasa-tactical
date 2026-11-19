import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LOADOUT_SLOT_TYPES,
  MISSION_TAGS,
  PLATFORM_TYPES,
  PROPULSION_TYPES,
  SHIPPING_CLASSES,
  type AdminMediaUploadResponse,
  type AdminProductDetailResponse,
  type AdminProductUpsertRequest,
  type BatteryConnectorType,
  type BatteryFormFactor,
  type CategoryWithCount,
  type CorduraDenierType,
  type FieldFpsClass,
  type GasType,
  type LoadoutSlotType,
  type MagFamilyType,
  type MediaLibraryAsset,
  type MissionTag,
  type MuzzleThreadType,
  type OpticClassType,
  type PlatformType,
  type PowerSourceType,
  type ProductCompatibility,
  type ProductDetail,
  type ProductMediaInput,
  type ProductSpecs,
  type PropulsionType,
  type RailMountType,
  type ShippingClass,
} from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy } from '../../i18n/admin';
import { ApiRequestError, apiFetch, apiUpload } from '../../lib/api';
import { getShippingClassLabel } from '../../lib/format';
import { MediaPickerModal } from './MediaPickerModal';

export interface ProductEditorModalProps {
  open: boolean;
  product: ProductDetail | null;
  categories: CategoryWithCount[];
  onClose: () => void;
  onSaved: (product: ProductDetail) => void;
}

type EditorTabId = 'basic' | 'specs' | 'media';

const RAIL_OPTIONS: readonly RailMountType[] = [
  'PICATINNY_1913',
  'M_LOK',
  'AK_SIDE_DOVETAIL',
  'MOLLE_PALS_LASER_CUT',
  'SWIFTCLIP_PLACARD',
  'ARC_HELMET_RAIL',
  'NVG_SHROUD',
  'NONE',
];

const MUZZLE_OPTIONS: readonly MuzzleThreadType[] = [
  '14MM_CCW',
  'M24X1_CW',
  '11MM_CW_PISTOL',
  'NONE',
];

const CONNECTOR_OPTIONS: readonly BatteryConnectorType[] = [
  'DEANS_T_PLUG',
  'MINI_TAMIYA',
  'NONE',
];

const BATTERY_FORM_OPTIONS: readonly BatteryFormFactor[] = [
  'STICK_BUFFER_TUBE',
  'NUNCHUCK',
  'PEQ_BOX',
  'NONE',
];

const POWER_SOURCE_OPTIONS: readonly PowerSourceType[] = [
  'LIPO_BATTERY',
  'GREEN_GAS',
  'CO2_12G',
  'SPRING_MANUAL',
  'NONE',
];

const GAS_OPTIONS: readonly GasType[] = ['GREEN_GAS', 'CO2_12G', 'NONE'];

const CORDURA_OPTIONS: readonly CorduraDenierType[] = [
  '500D',
  '1000D',
  '500D_1000D_LAMINATE',
  'NYCO_50_50_RIPSTOP',
  'NONE',
];

const FIELD_ROLE_OPTIONS: readonly FieldFpsClass[] = [
  'CQB_STRICT',
  'CQB_STANDARD',
  'WOODLAND_ASSAULT',
  'DMR_SNIPER',
];

const MAG_FAMILY_OPTIONS: readonly MagFamilyType[] = [
  'M4_556_AEG',
  'M4_556_MWS_GBBR',
  'AK_545_AEG',
  'SMG_9MM_ARP9',
  'TAC41_BOLT',
  'GLOCK_G17_GBB',
  'UNIVERSAL',
];

const OPTIC_CLASS_OPTIONS: readonly OpticClassType[] = [
  'RED_DOT',
  'LPVO_MAGNIFIED',
  'LASER_ILLUMINATOR',
  'SNIPER_SCOPE',
];

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseNullableNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function createEmptySpecs(
  propulsion: PropulsionType,
  platform: PlatformType,
  loadoutSlot: LoadoutSlotType,
): ProductSpecs {
  return {
    propulsion,
    platform,
    loadout_slot: loadoutSlot,
    fps_min: null,
    fps_max: null,
    fps_test_bb_gram: 0.2,
    energy_joule: null,
    field_role: null,
    gearbox_or_system: null,
    fire_modes: [],
    hop_up: null,
    inner_barrel: null,
    magazine_capacity_rds: null,
    connector: 'NONE',
    has_mosfet: null,
    battery_voltage_rec: null,
    battery_form_factor: 'NONE',
    gas_type: 'NONE',
    muzzle_thread: 'NONE',
    rail_type: [],
    material: '',
    cordura_denier: 'NONE',
    optic_magnification: null,
    optic_mount: null,
    bb_weight_gram: null,
    bb_weight_rec: null,
    orange_tip_compliant: false,
    safety_certification: null,
    dimensions_mm: null,
    color_options: [],
    in_the_box: [],
    required_to_operate: [],
  };
}

function createEmptyCompatibility(
  propulsion: PropulsionType,
  platform: PlatformType,
  loadoutSlot: LoadoutSlotType,
): ProductCompatibility {
  return {
    loadout_slot: loadoutSlot,
    platform_family: platform,
    propulsion,
    required_power_type: 'NONE',
    provides_power_type: 'NONE',
    battery_connector: 'NONE',
    supports_11v_lipo: null,
    battery_voltage_v: null,
    battery_form_factor: 'NONE',
    required_battery_form_factors: [],
    provides_rails: [],
    requires_rail: null,
    muzzle_thread: 'NONE',
    supported_muzzle_threads: [],
    mag_family: null,
    supported_mag_families: [],
    placard_interface: false,
    arc_rail_compatible: false,
    bb_weight_gram: null,
    recommended_bb_min_gram: null,
    recommended_bb_max_gram: null,
    optic_class: null,
    compatible_skus: [],
  };
}

interface MediaPickerTarget {
  open: boolean;
  mode: 'add-image' | 'add-video' | 'set-poster';
  mediaIndex?: number;
}

export function ProductEditorModal({
  open,
  product,
  categories,
  onClose,
  onSaved,
}: ProductEditorModalProps): React.JSX.Element | null {
  const { lang, getCategoryName } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  const isEdit = product !== null;

  const editorTabs = useMemo<readonly { id: EditorTabId; label: string }[]>(
    () => [
      { id: 'basic', label: copy.productModal.tabBasic },
      { id: 'specs', label: copy.productModal.tabSpecs },
      { id: 'media', label: copy.productModal.tabMedia },
    ],
    [copy],
  );

  const [activeTab, setActiveTab] = useState<EditorTabId>('basic');

  // Basic Info State
  const [sku, setSku] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [slugTouched, setSlugTouched] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 1);
  const [missionTags, setMissionTags] = useState<MissionTag[]>([]);
  const [platform, setPlatform] = useState<PlatformType>('M4_AR15');
  const [propulsion, setPropulsion] = useState<PropulsionType>('AEG');
  const [loadoutSlot, setLoadoutSlot] = useState<LoadoutSlotType>('primary');
  const [priceIdr, setPriceIdr] = useState<string>('0');
  const [weightGrams, setWeightGrams] = useState<string>('1000');
  const [initialStockQty, setInitialStockQty] = useState<string>('5');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [shippingClass, setShippingClass] = useState<ShippingClass>('CARGO_REPLICA');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Structured Specs & Compatibility State
  const [specs, setSpecs] = useState<ProductSpecs>(() =>
    createEmptySpecs('AEG', 'M4_AR15', 'primary'),
  );
  const [compatibility, setCompatibility] = useState<ProductCompatibility>(() =>
    createEmptyCompatibility('AEG', 'M4_AR15', 'primary'),
  );
  const [fireModesText, setFireModesText] = useState<string>('');
  const [inTheBoxText, setInTheBoxText] = useState<string>('');
  const [requiredToOperateText, setRequiredToOperateText] = useState<string>('');
  const [compatibleSkusText, setCompatibleSkusText] = useState<string>('');

  // Advanced Raw JSON override mode
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [rawSpecsJson, setRawSpecsJson] = useState<string>('');
  const [rawCompatJson, setRawCompatJson] = useState<string>('');
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);

  // Media State
  const [mediaList, setMediaList] = useState<ProductMediaInput[]>([]);
  const [mediaUploading, setMediaUploading] = useState<boolean>(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaPicker, setMediaPicker] = useState<MediaPickerTarget>({
    open: false,
    mode: 'add-image',
  });

  // Submit State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const skuInputRef = useRef<HTMLInputElement | null>(null);
  const tabRefs = useRef<Record<EditorTabId, HTMLButtonElement | null>>({
    basic: null,
    specs: null,
    media: null,
  });
  const prevFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    prevFocusedRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    setActiveTab('basic');
    setError(null);
    setRawJsonError(null);
    setShowRawJson(false);
    setMediaUploadError(null);

    if (product) {
      setSku(product.sku);
      setSlug(product.slug);
      setSlugTouched(true);
      setName(product.name);
      setBrand(product.brand);
      setCategoryId(product.categoryId);
      setMissionTags([...product.missionTags]);
      setPlatform(product.platform);
      setPropulsion(product.propulsion);
      setLoadoutSlot(product.loadoutSlot);
      setPriceIdr(String(product.priceIdr));
      setWeightGrams(String(product.weightGrams));
      setInitialStockQty(String(product.stockQty));
      setLowStockThreshold(String(product.lowStockThreshold));
      setIsFeatured(product.isFeatured);
      setIsActive(product.isActive);
      setShippingClass(product.shippingClass);
      setShortDescription(product.shortDescription);
      setDescription(product.description);

      setSpecs({ ...product.specs });
      setCompatibility({ ...product.compatibility });
      setFireModesText((product.specs.fire_modes ?? []).join(', '));
      setInTheBoxText((product.specs.in_the_box ?? []).join('\n'));
      setRequiredToOperateText((product.specs.required_to_operate ?? []).join('\n'));
      setCompatibleSkusText((product.compatibility.compatible_skus ?? []).join(', '));

      setMediaList(
        product.media.map((m, idx) => ({
          mediaType: m.mediaType,
          url: m.url,
          posterUrl: m.posterUrl,
          altText: m.altText,
          durationSec: m.durationSec,
          isPrimary: m.isPrimary,
          sortOrder: idx,
        })),
      );
    } else {
      const defaultCategoryId = categories[0]?.id ?? 1;
      setSku('');
      setSlug('');
      setSlugTouched(false);
      setName('');
      setBrand('');
      setCategoryId(defaultCategoryId);
      setMissionTags(['cqb']);
      setPlatform('M4_AR15');
      setPropulsion('AEG');
      setLoadoutSlot('primary');
      setPriceIdr('4500000');
      setWeightGrams('2500');
      setInitialStockQty('5');
      setLowStockThreshold('5');
      setIsFeatured(false);
      setIsActive(true);
      setShippingClass('CARGO_REPLICA');
      setShortDescription('');
      setDescription('');

      setSpecs(createEmptySpecs('AEG', 'M4_AR15', 'primary'));
      setCompatibility(createEmptyCompatibility('AEG', 'M4_AR15', 'primary'));
      setFireModesText('Safe, Semi, Full-Auto');
      setInTheBoxText('');
      setRequiredToOperateText('');
      setCompatibleSkusText('');
      setMediaList([]);
    }

    const focusTimer = window.setTimeout(() => {
      skuInputRef.current?.focus();
    }, 10);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      prevFocusedRef.current?.focus();
    };
  }, [open, product, categories]);

  useEffect(() => {
    if (!open || mediaPicker.open) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, mediaPicker.open, onClose]);

  if (!open) return null;

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, idx: number): void => {
    let nextIdx = idx;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % editorTabs.length;
    else if (event.key === 'ArrowLeft') nextIdx = (idx - 1 + editorTabs.length) % editorTabs.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = editorTabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = editorTabs[nextIdx];
    setActiveTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  const toggleMissionTag = (tag: MissionTag): void => {
    setMissionTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const toggleSpecRail = (rail: RailMountType): void => {
    setSpecs((prev) => {
      const exists = prev.rail_type.includes(rail);
      return {
        ...prev,
        rail_type: exists ? prev.rail_type.filter((r) => r !== rail) : [...prev.rail_type, rail],
      };
    });
  };

  const toggleCompatArray = <T extends string>(
    field:
      | 'provides_rails'
      | 'supported_muzzle_threads'
      | 'supported_mag_families'
      | 'required_battery_form_factors',
    value: T,
  ): void => {
    setCompatibility((prev) => {
      const current = (prev[field] as T[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return {
        ...prev,
        [field]: next,
      };
    });
  };

  const buildSynchronizedSpecs = (): ProductSpecs => {
    const fireModes = fireModesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const inTheBox = inTheBoxText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const requiredToOperate = requiredToOperateText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      ...specs,
      propulsion,
      platform,
      loadout_slot: loadoutSlot,
      fire_modes: fireModes,
      in_the_box: inTheBox,
      required_to_operate: requiredToOperate,
    };
  };

  const buildSynchronizedCompatibility = (): ProductCompatibility => {
    const compatibleSkus = compatibleSkusText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    return {
      ...compatibility,
      loadout_slot: loadoutSlot,
      platform_family: platform,
      propulsion,
      compatible_skus: compatibleSkus,
    };
  };

  const handleToggleRawJson = (): void => {
    setRawJsonError(null);
    if (!showRawJson) {
      setRawSpecsJson(JSON.stringify(buildSynchronizedSpecs(), null, 2));
      setRawCompatJson(JSON.stringify(buildSynchronizedCompatibility(), null, 2));
      setShowRawJson(true);
    } else {
      setShowRawJson(false);
    }
  };

  const handleApplyRawJson = (): void => {
    setRawJsonError(null);
    try {
      const parsedSpecs = JSON.parse(rawSpecsJson) as ProductSpecs;
      const parsedCompat = JSON.parse(rawCompatJson) as ProductCompatibility;
      setSpecs(parsedSpecs);
      setCompatibility(parsedCompat);
      setFireModesText((parsedSpecs.fire_modes ?? []).join(', '));
      setInTheBoxText((parsedSpecs.in_the_box ?? []).join('\n'));
      setRequiredToOperateText((parsedSpecs.required_to_operate ?? []).join('\n'));
      setCompatibleSkusText((parsedCompat.compatible_skus ?? []).join(', '));
      setShowRawJson(false);
    } catch {
      setRawJsonError(copy.productModal.rawJsonError);
    }
  };

  const handleDirectMediaUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMediaUploadError(null);

    const lower = file.name.toLowerCase();
    const isImg = ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => lower.endsWith(ext));
    const isVid = ['.mp4', '.webm'].some((ext) => lower.endsWith(ext));
    if (!isImg && !isVid) {
      setMediaUploadError(copy.productModal.uploadTypeError);
      event.target.value = '';
      return;
    }

    setMediaUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiUpload<AdminMediaUploadResponse>('/api/admin/media/upload', fd);
      appendMediaAsset(res.asset);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setMediaUploadError(err.message);
      } else {
        setMediaUploadError(copy.productModal.uploadErrorFallback);
      }
    } finally {
      setMediaUploading(false);
      event.target.value = '';
    }
  };

  const appendMediaAsset = (asset: MediaLibraryAsset): void => {
    setMediaList((prev) => {
      const hasPrimaryImage = prev.some((m) => m.mediaType === 'image' && m.isPrimary);
      const nextItem: ProductMediaInput = {
        mediaType: asset.mediaType,
        url: asset.url,
        posterUrl: null,
        altText: name.trim() || asset.filename,
        durationSec: asset.mediaType === 'video' ? 10 : null,
        isPrimary: asset.mediaType === 'image' && !hasPrimaryImage,
        sortOrder: prev.length,
      };
      return [...prev, nextItem];
    });
  };

  const handleMediaPicked = (asset: MediaLibraryAsset): void => {
    if (mediaPicker.mode === 'set-poster' && typeof mediaPicker.mediaIndex === 'number') {
      const targetIdx = mediaPicker.mediaIndex;
      setMediaList((prev) =>
        prev.map((item, idx) => (idx === targetIdx ? { ...item, posterUrl: asset.url } : item)),
      );
      return;
    }
    appendMediaAsset(asset);
  };

  const moveMediaItem = (index: number, delta: -1 | 1): void => {
    setMediaList((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const copyList = [...prev];
      const temp = copyList[index];
      copyList[index] = copyList[target];
      copyList[target] = temp;
      return copyList.map((m, idx) => ({ ...m, sortOrder: idx }));
    });
  };

  const setPrimaryMedia = (index: number): void => {
    setMediaList((prev) =>
      prev.map((m, idx) => ({
        ...m,
        isPrimary: idx === index,
      })),
    );
  };

  const removeMediaItem = (index: number): void => {
    setMediaList((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (filtered.length > 0 && !filtered.some((m) => m.isPrimary)) {
        const firstImageIdx = filtered.findIndex((m) => m.mediaType === 'image');
        const idxToPromote = firstImageIdx >= 0 ? firstImageIdx : 0;
        filtered[idxToPromote] = { ...filtered[idxToPromote], isPrimary: true };
      }
      return filtered.map((m, idx) => ({ ...m, sortOrder: idx }));
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const trimmedSku = sku.trim().toUpperCase();
    const trimmedName = name.trim();
    const trimmedSlug = slugifyText(slug.trim() || trimmedName);
    const trimmedBrand = brand.trim();

    if (!trimmedSku || !trimmedName || !trimmedSlug || !trimmedBrand) {
      setActiveTab('basic');
      setError(copy.productModal.errRequiredFields);
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
      setActiveTab('basic');
      setError(copy.productModal.errInvalidSlug);
      return;
    }

    const parsedPrice = Number.parseInt(priceIdr, 10);
    const parsedWeight = Number.parseInt(weightGrams, 10);
    const parsedThreshold = Number.parseInt(lowStockThreshold, 10);
    const parsedInitialStock = Number.parseInt(initialStockQty || '0', 10);

    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setActiveTab('basic');
      setError(copy.productModal.errInvalidPrice);
      return;
    }

    if (!Number.isInteger(parsedWeight) || parsedWeight < 0) {
      setActiveTab('basic');
      setError(copy.productModal.errInvalidWeight);
      return;
    }

    if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
      setActiveTab('basic');
      setError(copy.productModal.errInvalidThreshold);
      return;
    }

    let finalSpecs = buildSynchronizedSpecs();
    let finalCompat = buildSynchronizedCompatibility();

    if (showRawJson) {
      try {
        finalSpecs = JSON.parse(rawSpecsJson) as ProductSpecs;
        finalCompat = JSON.parse(rawCompatJson) as ProductCompatibility;
      } catch {
        setActiveTab('specs');
        setError(copy.productModal.errInvalidJson);
        return;
      }
    }

    if (
      finalSpecs.energy_joule !== null &&
      (finalSpecs.energy_joule < 0 || finalSpecs.energy_joule > 2.0)
    ) {
      setActiveTab('specs');
      setError(copy.productModal.errInvalidJoule);
      return;
    }

    const normalizedMedia: ProductMediaInput[] = mediaList.map((m, idx) => ({
      mediaType: m.mediaType,
      url: m.url.trim(),
      posterUrl: m.posterUrl?.trim() ? m.posterUrl.trim() : null,
      altText: m.altText.trim() || trimmedName,
      durationSec: m.durationSec ?? null,
      isPrimary: m.isPrimary,
      sortOrder: idx,
    }));

    const payload: AdminProductUpsertRequest = {
      sku: trimmedSku,
      slug: trimmedSlug,
      name: trimmedName,
      brand: trimmedBrand,
      categoryId,
      missionTags,
      platform,
      propulsion,
      loadoutSlot,
      priceIdr: parsedPrice,
      weightGrams: parsedWeight,
      initialStockQty: isEdit ? undefined : Math.max(0, parsedInitialStock),
      lowStockThreshold: parsedThreshold,
      isFeatured,
      isActive,
      requiresAge18: false,
      shippingClass,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      specs: finalSpecs,
      compatibility: finalCompat,
      media: normalizedMedia,
    };

    setSubmitting(true);
    try {
      let response: AdminProductDetailResponse;
      if (isEdit && product) {
        response = await apiFetch<AdminProductDetailResponse>(`/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiFetch<AdminProductDetailResponse>('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      onSaved(response.product);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.productModal.errSaveFallback);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-5">
        <div
          className="fixed inset-0 bg-[var(--backdrop-scrim)]"
          aria-hidden="true"
          onClick={onClose}
        />

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-editor-modal-title"
          className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
            <h2
              id="product-editor-modal-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              {isEdit
                ? copy.productModal.editTitle(product.name)
                : copy.productModal.createTitle}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 text-sm font-medium text-[var(--text-primary)]"
            >
              {copy.common.close}
            </button>
          </div>

          {/* ARIA Tablist */}
          <div
            role="tablist"
            aria-label={copy.productModal.tablistAria}
            className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-5 py-2.5"
          >
            {editorTabs.map((tab, idx) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  id={`product-tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`product-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={[
                    'min-h-[44px] rounded-[4px] border px-3.5 text-sm transition-colors duration-150',
                    selected
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                  ].join(' ')}
                >
                  {tab.label}
                  {tab.id === 'media' && (
                    <span className="ml-2 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
                      [{mediaList.length}]
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Body */}
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="flex flex-1 flex-col overflow-hidden"
            noValidate
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-10">
              {error && (
                <div
                  role="alert"
                  className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger)]"
                >
                  {error}
                </div>
              )}

              {/* TAB 1: BASIC INFO */}
              <div
                id="product-panel-basic"
                role="tabpanel"
                aria-labelledby="product-tab-basic"
                hidden={activeTab !== 'basic'}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label
                      htmlFor="prod-sku"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.skuLabel}
                    </label>
                    <input
                      ref={skuInputRef}
                      id="prod-sku"
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      placeholder={copy.productModal.skuPlaceholder}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm uppercase text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="prod-name"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.nameLabel}
                    </label>
                    <input
                      id="prod-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setName(val);
                        if (!slugTouched) {
                          setSlug(slugifyText(val));
                        }
                      }}
                      placeholder={copy.productModal.namePlaceholder}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prod-slug"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.slugLabel}
                    </label>
                    <input
                      id="prod-slug"
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(e.target.value);
                      }}
                      placeholder={copy.productModal.slugPlaceholder}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prod-brand"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.brandLabel}
                    </label>
                    <input
                      id="prod-brand"
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder={copy.productModal.brandPlaceholder}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prod-category"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.categoryLabel}
                    </label>
                    <select
                      id="prod-category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {getCategoryName(cat.slug, cat.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price, Weight, Stock & Threshold */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label
                      htmlFor="prod-price"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.priceLabel}
                    </label>
                    <input
                      id="prod-price"
                      type="number"
                      min={0}
                      step={5000}
                      required
                      value={priceIdr}
                      onChange={(e) => setPriceIdr(e.target.value)}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prod-weight"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.weightLabel}
                    </label>
                    <input
                      id="prod-weight"
                      type="number"
                      min={0}
                      step={10}
                      required
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(e.target.value)}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
                    />
                  </div>

                  {isEdit && product ? (
                    <div>
                      <label
                        htmlFor="prod-stock-readonly"
                        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        {copy.productModal.currentStockLabel}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="prod-stock-readonly"
                          type="text"
                          readOnly
                          value={`${product.stockQty} ${copy.common.unit}`}
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-secondary)]"
                        />
                        <Link
                          to={`/admin/inventory?q=${encodeURIComponent(product.sku)}`}
                          onClick={onClose}
                          className="inline-flex min-h-[44px] shrink-0 items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--accent-text)] hover:bg-[var(--bg-elevated)]"
                        >
                          {copy.productModal.adjustStockLink}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="prod-initial-stock"
                        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        {copy.productModal.initialStockLabel}
                      </label>
                      <input
                        id="prod-initial-stock"
                        type="number"
                        min={0}
                        step={1}
                        value={initialStockQty}
                        onChange={(e) => setInitialStockQty(e.target.value)}
                        className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="prod-low-threshold"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.lowStockThresholdLabel}
                    </label>
                    <input
                      id="prod-low-threshold"
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                {/* Propulsion, Platform, Product Group, Shipping Class */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label
                      htmlFor="prod-propulsion"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.propulsionLabel}
                    </label>
                    <select
                      id="prod-propulsion"
                      value={propulsion}
                      onChange={(e) => setPropulsion(e.target.value as PropulsionType)}
                      className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                    >
                      {PROPULSION_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {copy.propulsions[p]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prod-platform"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.platformLabel}
                    </label>
                    <select
                      id="prod-platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as PlatformType)}
                      className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                    >
                      {PLATFORM_TYPES.map((pl) => (
                        <option key={pl} value={pl}>
                          {copy.platforms[pl]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prod-group-slot"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.productGroupLabel}
                    </label>
                    <select
                      id="prod-group-slot"
                      value={loadoutSlot}
                      onChange={(e) => setLoadoutSlot(e.target.value as LoadoutSlotType)}
                      className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                    >
                      {LOADOUT_SLOT_TYPES.map((slot) => (
                        <option key={slot} value={slot}>
                          {copy.productGroups[slot]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prod-shipping-class"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.shippingClassLabel}
                    </label>
                    <select
                      id="prod-shipping-class"
                      value={shippingClass}
                      onChange={(e) => setShippingClass(e.target.value as ShippingClass)}
                      className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                    >
                      {SHIPPING_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>
                          {getShippingClassLabel(cls, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Playstyle Tags */}
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-[var(--text-primary)]">
                    {copy.productModal.playstyleTagsLabel}
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {MISSION_TAGS.map((tag) => (
                      <label
                        key={tag}
                        className="flex min-h-[44px] items-center gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)]"
                      >
                        <input
                          type="checkbox"
                          checked={missionTags.includes(tag)}
                          onChange={() => toggleMissionTag(tag)}
                          className="h-4 w-4 shrink-0"
                        />
                        <span>{copy.missions[tag]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Status Flags */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex min-h-[48px] items-center gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="h-4 w-4 shrink-0"
                    />
                    <span>{copy.productModal.featuredFlag}</span>
                  </label>

                  <label className="flex min-h-[48px] items-center gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 shrink-0"
                    />
                    <span>{copy.productModal.activeFlag}</span>
                  </label>
                </div>

                {/* Descriptions */}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="prod-short-desc"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.shortDescLabel}
                    </label>
                    <input
                      id="prod-short-desc"
                      type="text"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder={copy.productModal.shortDescPlaceholder}
                      className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prod-full-desc"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.fullDescLabel}
                    </label>
                    <textarea
                      id="prod-full-desc"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={copy.productModal.fullDescPlaceholder}
                      className="w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 2: SPECIFICATIONS & COMPATIBILITY */}
              <div
                id="product-panel-specs"
                role="tabpanel"
                aria-labelledby="product-tab-specs"
                hidden={activeTab !== 'specs'}
                className="space-y-6"
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleToggleRawJson}
                    className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  >
                    {showRawJson
                      ? copy.productModal.backToGuidedForm
                      : copy.productModal.advancedJsonMode}
                  </button>
                </div>

                {showRawJson ? (
                  <div className="space-y-4">
                    {rawJsonError && (
                      <div
                        role="alert"
                        className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger)]"
                      >
                        {rawJsonError}
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="prod-raw-specs"
                        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        {copy.productModal.rawSpecsLabel}
                      </label>
                      <textarea
                        id="prod-raw-specs"
                        rows={10}
                        value={rawSpecsJson}
                        onChange={(e) => setRawSpecsJson(e.target.value)}
                        className="w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="prod-raw-compat"
                        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        {copy.productModal.rawCompatLabel}
                      </label>
                      <textarea
                        id="prod-raw-compat"
                        rows={10}
                        value={rawCompatJson}
                        onChange={(e) => setRawCompatJson(e.target.value)}
                        className="w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyRawJson}
                      className="min-h-[44px] rounded-[4px] border border-[var(--accent-primary)] bg-[var(--bg-elevated)] px-4 text-sm font-semibold text-[var(--text-primary)]"
                    >
                      {copy.productModal.applyJsonBtn}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Section A: Technical Specs */}
                    <section className="space-y-4 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]">
                        {copy.productModal.techSpecsHeading}
                      </h3>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label
                            htmlFor="spec-fps-min"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.fpsMinLabel}
                          </label>
                          <input
                            id="spec-fps-min"
                            type="number"
                            min={0}
                            value={specs.fps_min ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                fps_min: parseNullableNumber(e.target.value),
                              }))
                            }
                            placeholder={copy.productModal.fpsMinPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-fps-max"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.fpsMaxLabel}
                          </label>
                          <input
                            id="spec-fps-max"
                            type="number"
                            min={0}
                            value={specs.fps_max ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                fps_max: parseNullableNumber(e.target.value),
                              }))
                            }
                            placeholder={copy.productModal.fpsMaxPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-joule"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.energyJouleLabel}
                          </label>
                          <input
                            id="spec-joule"
                            type="number"
                            min={0}
                            max={2}
                            step={0.01}
                            value={specs.energy_joule ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                energy_joule: parseNullableNumber(e.target.value),
                              }))
                            }
                            placeholder={copy.productModal.energyJoulePlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-field-role"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.fieldRoleLabel}
                          </label>
                          <select
                            id="spec-field-role"
                            value={specs.field_role ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                field_role: (e.target.value || null) as FieldFpsClass | null,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            <option value="">{copy.productModal.notSpecified}</option>
                            {FIELD_ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="spec-material"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.materialLabel}
                          </label>
                          <input
                            id="spec-material"
                            type="text"
                            value={specs.material}
                            onChange={(e) => setSpecs((prev) => ({ ...prev, material: e.target.value }))}
                            placeholder={copy.productModal.materialPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-gearbox"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.gearboxLabel}
                          </label>
                          <input
                            id="spec-gearbox"
                            type="text"
                            value={specs.gearbox_or_system ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                gearbox_or_system: e.target.value || null,
                              }))
                            }
                            placeholder={copy.productModal.gearboxPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-connector"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.connectorLabel}
                          </label>
                          <select
                            id="spec-connector"
                            value={specs.connector ?? 'NONE'}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                connector: e.target.value as BatteryConnectorType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {CONNECTOR_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="spec-mosfet"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.mosfetLabel}
                          </label>
                          <select
                            id="spec-mosfet"
                            value={specs.has_mosfet === null ? '' : specs.has_mosfet ? 'yes' : 'no'}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                has_mosfet:
                                  e.target.value === '' ? null : e.target.value === 'yes',
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            <option value="">{copy.productModal.notApplicable}</option>
                            <option value="yes">{copy.productModal.mosfetYes}</option>
                            <option value="no">{copy.productModal.mosfetNo}</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="spec-muzzle"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.muzzleThreadLabel}
                          </label>
                          <select
                            id="spec-muzzle"
                            value={specs.muzzle_thread ?? 'NONE'}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                muzzle_thread: e.target.value as MuzzleThreadType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {MUZZLE_OPTIONS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="spec-gas"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.gasTypeLabel}
                          </label>
                          <select
                            id="spec-gas"
                            value={specs.gas_type ?? 'NONE'}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                gas_type: e.target.value as GasType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {GAS_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="spec-cordura"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.corduraLabel}
                          </label>
                          <select
                            id="spec-cordura"
                            value={specs.cordura_denier ?? 'NONE'}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                cordura_denier: e.target.value as CorduraDenierType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {CORDURA_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="spec-mag-cap"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.magCapacityLabel}
                          </label>
                          <input
                            id="spec-mag-cap"
                            type="number"
                            min={0}
                            value={specs.magazine_capacity_rds ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                magazine_capacity_rds: parseNullableNumber(e.target.value),
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-hopup"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.hopUpLabel}
                          </label>
                          <input
                            id="spec-hopup"
                            type="text"
                            value={specs.hop_up ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({ ...prev, hop_up: e.target.value || null }))
                            }
                            placeholder={copy.productModal.hopUpPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-barrel"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.innerBarrelLabel}
                          </label>
                          <input
                            id="spec-barrel"
                            type="text"
                            value={specs.inner_barrel ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                inner_barrel: e.target.value || null,
                              }))
                            }
                            placeholder={copy.productModal.innerBarrelPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-fire-modes"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.fireModesLabel}
                          </label>
                          <input
                            id="spec-fire-modes"
                            type="text"
                            value={fireModesText}
                            onChange={(e) => setFireModesText(e.target.value)}
                            placeholder={copy.productModal.fireModesPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-bb-rec"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.bbWeightRecLabel}
                          </label>
                          <input
                            id="spec-bb-rec"
                            type="text"
                            value={specs.bb_weight_rec ?? ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                bb_weight_rec: e.target.value || null,
                              }))
                            }
                            placeholder={copy.productModal.bbWeightRecPlaceholder}
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>
                      </div>

                      <fieldset className="space-y-2">
                        <legend className="text-xs font-medium text-[var(--text-primary)]">
                          {copy.productModal.railSystemLabel}
                        </legend>
                        <div className="flex flex-wrap gap-2">
                          {RAIL_OPTIONS.map((rail) => (
                            <label
                              key={rail}
                              className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]"
                            >
                              <input
                                type="checkbox"
                                checked={specs.rail_type.includes(rail)}
                                onChange={() => toggleSpecRail(rail)}
                              />
                              <span className="font-[family-name:var(--font-mono)]">{rail}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="spec-in-the-box"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.inTheBoxLabel}
                          </label>
                          <textarea
                            id="spec-in-the-box"
                            rows={3}
                            value={inTheBoxText}
                            onChange={(e) => setInTheBoxText(e.target.value)}
                            placeholder={copy.productModal.inTheBoxPlaceholder}
                            className="w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="spec-required-operate"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.requiredOperateLabel}
                          </label>
                          <textarea
                            id="spec-required-operate"
                            rows={3}
                            value={requiredToOperateText}
                            onChange={(e) => setRequiredToOperateText(e.target.value)}
                            placeholder={copy.productModal.requiredOperatePlaceholder}
                            className="w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Section B: Product Compatibility */}
                    <section className="space-y-4 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]">
                        {copy.productModal.compatHeading}
                      </h3>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label
                            htmlFor="compat-req-power"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.reqPowerLabel}
                          </label>
                          <select
                            id="compat-req-power"
                            value={compatibility.required_power_type ?? 'NONE'}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                required_power_type: e.target.value as PowerSourceType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {POWER_SOURCE_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="compat-prov-power"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.provPowerLabel}
                          </label>
                          <select
                            id="compat-prov-power"
                            value={compatibility.provides_power_type ?? 'NONE'}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                provides_power_type: e.target.value as PowerSourceType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {POWER_SOURCE_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="compat-connector"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.compatConnectorLabel}
                          </label>
                          <select
                            id="compat-connector"
                            value={compatibility.battery_connector ?? 'NONE'}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                battery_connector: e.target.value as BatteryConnectorType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {CONNECTOR_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="compat-supports-11v"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.supports11vLabel}
                          </label>
                          <select
                            id="compat-supports-11v"
                            value={
                              compatibility.supports_11v_lipo === null ||
                              compatibility.supports_11v_lipo === undefined
                                ? ''
                                : compatibility.supports_11v_lipo
                                  ? 'yes'
                                  : 'no'
                            }
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                supports_11v_lipo:
                                  e.target.value === '' ? null : e.target.value === 'yes',
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            <option value="">{copy.productModal.notApplicable}</option>
                            <option value="yes">{copy.productModal.supports11vYes}</option>
                            <option value="no">{copy.productModal.supports11vNo}</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="compat-muzzle"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.compatMuzzleLabel}
                          </label>
                          <select
                            id="compat-muzzle"
                            value={compatibility.muzzle_thread ?? 'NONE'}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                muzzle_thread: e.target.value as MuzzleThreadType,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            {MUZZLE_OPTIONS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="compat-req-rail"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.reqRailLabel}
                          </label>
                          <select
                            id="compat-req-rail"
                            value={compatibility.requires_rail ?? ''}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                requires_rail: (e.target.value || null) as RailMountType | null,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            <option value="">{copy.productModal.noRailNeeded}</option>
                            {RAIL_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="compat-mag-family"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.magFamilyLabel}
                          </label>
                          <select
                            id="compat-mag-family"
                            value={compatibility.mag_family ?? ''}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                mag_family: (e.target.value || null) as MagFamilyType | null,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            <option value="">{copy.productModal.notApplicable}</option>
                            {MAG_FAMILY_OPTIONS.map((mf) => (
                              <option key={mf} value={mf}>
                                {mf}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="compat-optic-class"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.productModal.opticClassLabel}
                          </label>
                          <select
                            id="compat-optic-class"
                            value={compatibility.optic_class ?? ''}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                optic_class: (e.target.value || null) as OpticClassType | null,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                          >
                            <option value="">{copy.productModal.notOptic}</option>
                            {OPTIC_CLASS_OPTIONS.map((oc) => (
                              <option key={oc} value={oc}>
                                {oc}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <fieldset className="space-y-2">
                        <legend className="text-xs font-medium text-[var(--text-primary)]">
                          {copy.productModal.providesRailsLabel}
                        </legend>
                        <div className="flex flex-wrap gap-2">
                          {RAIL_OPTIONS.map((rail) => (
                            <label
                              key={rail}
                              className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]"
                            >
                              <input
                                type="checkbox"
                                checked={(compatibility.provides_rails ?? []).includes(rail)}
                                onChange={() => toggleCompatArray('provides_rails', rail)}
                              />
                              <span className="font-[family-name:var(--font-mono)]">{rail}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="space-y-2">
                        <legend className="text-xs font-medium text-[var(--text-primary)]">
                          {copy.productModal.batteryFormFactorsLabel}
                        </legend>
                        <div className="flex flex-wrap gap-2">
                          {BATTERY_FORM_OPTIONS.map((form) => (
                            <label
                              key={form}
                              className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]"
                            >
                              <input
                                type="checkbox"
                                checked={(compatibility.required_battery_form_factors ?? []).includes(form)}
                                onChange={() => toggleCompatArray('required_battery_form_factors', form)}
                              />
                              <span className="font-[family-name:var(--font-mono)]">{form}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex min-h-[44px] items-center gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]">
                          <input
                            type="checkbox"
                            checked={Boolean(compatibility.placard_interface)}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                placard_interface: e.target.checked,
                              }))
                            }
                          />
                          <span>{copy.productModal.placardInterfaceFlag}</span>
                        </label>

                        <label className="flex min-h-[44px] items-center gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]">
                          <input
                            type="checkbox"
                            checked={Boolean(compatibility.arc_rail_compatible)}
                            onChange={(e) =>
                              setCompatibility((prev) => ({
                                ...prev,
                                arc_rail_compatible: e.target.checked,
                              }))
                            }
                          />
                          <span>{copy.productModal.arcRailFlag}</span>
                        </label>
                      </div>

                      <div>
                        <label
                          htmlFor="compat-skus"
                          className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                        >
                          {copy.productModal.compatSkusLabel}
                        </label>
                        <input
                          id="compat-skus"
                          type="text"
                          value={compatibleSkusText}
                          onChange={(e) => setCompatibleSkusText(e.target.value)}
                          placeholder={copy.productModal.compatSkusPlaceholder}
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-xs uppercase text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                      </div>
                    </section>
                  </>
                )}
              </div>

              {/* TAB 3: MEDIA */}
              <div
                id="product-panel-media"
                role="tabpanel"
                aria-labelledby="product-tab-media"
                hidden={activeTab !== 'media'}
                className="space-y-4"
              >
                <div className="flex flex-col gap-3 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <label
                      htmlFor="prod-direct-media-upload"
                      className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                    >
                      {copy.productModal.uploadMediaLabel}
                    </label>
                    <input
                      id="prod-direct-media-upload"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
                      disabled={mediaUploading}
                      onChange={(e) => void handleDirectMediaUpload(e)}
                      className="block min-h-[44px] w-full max-w-sm rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs text-[var(--text-primary)] file:mr-2.5 file:rounded-[2px] file:border-0 file:bg-[var(--accent-primary)] file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-[var(--accent-foreground)]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPicker({ open: true, mode: 'add-image' })}
                      className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    >
                      {copy.productModal.pickPhotoBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaPicker({ open: true, mode: 'add-video' })}
                      className="min-h-[44px] rounded-[4px] border border-[var(--brand-olive)] bg-[var(--brand-olive-surface)] px-3.5 text-sm font-medium text-[var(--brand-olive-tag-text)] hover:opacity-90"
                    >
                      {copy.productModal.pickVideoBtn}
                    </button>
                  </div>
                </div>

                {mediaUploading && (
                  <p role="status" aria-live="polite" className="text-xs font-medium text-[var(--accent-text)]">
                    {copy.productModal.uploadingMedia}
                  </p>
                )}
                {mediaUploadError && (
                  <div
                    role="alert"
                    className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger)]"
                  >
                    {mediaUploadError}
                  </div>
                )}

                {mediaList.length === 0 ? (
                  <div className="rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] p-6 text-center space-y-1.5">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {copy.productModal.emptyMediaTitle}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {copy.productModal.emptyMediaDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mediaList.map((item, idx) => (
                      <div
                        key={`${item.url}-${idx}`}
                        className="grid grid-cols-1 gap-4 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 md:grid-cols-[220px_1fr]"
                      >
                        <div className="relative aspect-video w-full overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                          {item.mediaType === 'video' ? (
                            <video
                              src={item.url}
                              poster={item.posterUrl || undefined}
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
                              src={item.url}
                              alt={item.altText || `Media ${idx + 1}`}
                              width={320}
                              height={180}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span className="pointer-events-none absolute top-1.5 left-1.5 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase text-[var(--text-primary)]">
                            {item.mediaType === 'video'
                              ? copy.productModal.mediaVideoBadge
                              : item.isPrimary
                                ? copy.productModal.mediaPrimaryBadge
                                : copy.productModal.mediaPhotoBadge(idx + 1)}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)]">
                              {item.url}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.mediaType === 'image' && !item.isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryMedia(idx)}
                                  className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)]"
                                >
                                  {copy.productModal.setPrimaryBtn}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => moveMediaItem(idx, -1)}
                                disabled={idx === 0}
                                aria-label={copy.productModal.moveMediaUpAria(idx + 1)}
                                className="min-h-[44px] min-w-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)]"
                              >
                                {copy.common.up}
                              </button>
                              <button
                                type="button"
                                onClick={() => moveMediaItem(idx, 1)}
                                disabled={idx === mediaList.length - 1}
                                aria-label={copy.productModal.moveMediaDownAria(idx + 1)}
                                className="min-h-[44px] min-w-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)]"
                              >
                                {copy.common.down}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMediaItem(idx)}
                                className="min-h-[44px] rounded-[4px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-2.5 text-xs font-medium text-[var(--status-danger)]"
                              >
                                {copy.common.delete}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className={item.mediaType === 'video' ? '' : 'sm:col-span-2'}>
                              <label
                                htmlFor={`media-alt-${idx}`}
                                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                              >
                                {copy.productModal.altTextLabel}
                              </label>
                              <input
                                id={`media-alt-${idx}`}
                                type="text"
                                value={item.altText}
                                onChange={(e) =>
                                  setMediaList((prev) =>
                                    prev.map((m, mIdx) =>
                                      mIdx === idx ? { ...m, altText: e.target.value } : m,
                                    ),
                                  )
                                }
                                className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)]"
                              />
                            </div>

                            {item.mediaType === 'video' && (
                              <>
                                <div>
                                  <label
                                    htmlFor={`media-dur-${idx}`}
                                    className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                                  >
                                    {copy.productModal.durationLabel}
                                  </label>
                                  <input
                                    id={`media-dur-${idx}`}
                                    type="number"
                                    min={1}
                                    step={0.5}
                                    value={item.durationSec ?? ''}
                                    onChange={(e) =>
                                      setMediaList((prev) =>
                                        prev.map((m, mIdx) =>
                                          mIdx === idx
                                            ? {
                                                ...m,
                                                durationSec: parseNullableNumber(e.target.value),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-primary)]"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label
                                    htmlFor={`media-poster-${idx}`}
                                    className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                                  >
                                    {copy.productModal.posterUrlLabel}
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      id={`media-poster-${idx}`}
                                      type="text"
                                      value={item.posterUrl ?? ''}
                                      onChange={(e) =>
                                        setMediaList((prev) =>
                                          prev.map((m, mIdx) =>
                                            mIdx === idx
                                              ? { ...m, posterUrl: e.target.value || null }
                                              : m,
                                          ),
                                        )
                                      }
                                      placeholder="/media/videos/product-...-poster.jpg"
                                      className="min-h-[44px] flex-1 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMediaPicker({
                                          open: true,
                                          mode: 'set-poster',
                                          mediaIndex: idx,
                                        })
                                      }
                                      className="min-h-[44px] shrink-0 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)]"
                                    >
                                      {copy.productModal.pickPosterBtn}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-5 py-3.5">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                {copy.common.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
              >
                {submitting
                  ? copy.productModal.savingBtn
                  : isEdit
                    ? copy.productModal.saveEditBtn
                    : copy.productModal.saveCreateBtn}
              </button>
            </div>
          </form>
        </div>
      </div>

      <MediaPickerModal
        open={mediaPicker.open}
        mediaTypeFilter={mediaPicker.mode === 'add-video' ? 'video' : 'image'}
        title={
          mediaPicker.mode === 'add-video'
            ? copy.productModal.pickerVideoTitle
            : mediaPicker.mode === 'set-poster'
              ? copy.productModal.pickerPosterTitle
              : copy.productModal.pickerPhotoTitle
        }
        onSelect={handleMediaPicked}
        onClose={() => setMediaPicker((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
