import type {
  InventoryMutationReason,
  LoadoutSlotType,
  MissionTag,
  PaymentMethodCode,
  PlatformType,
  PropulsionType,
  ShippingCourierCode,
  ShippingZoneCode,
} from '../../shared/types';
import type { Language } from './common';

export interface AdminDictionary {
  common: {
    close: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    reset: string;
    reload: string;
    loading: string;
    processing: string;
    saving: string;
    up: string;
    down: string;
    yes: string;
    no: string;
    noImage: string;
    dismissNotice: string;
    detail: string;
    all: string;
    active: string;
    inactive: string;
    publicTag: string;
    privateTag: string;
    unit: string;
    items: string;
  };
  layout: {
    skipToContent: string;
    mobileMenuBtn: string;
    closeMenuAria: string;
    mobileNavAria: string;
    sidebarAria: string;
    mainNavAria: string;
    collapseSidebarAria: string;
    expandSidebarAria: string;
    collapseSidebarTitle: string;
    expandSidebarTitle: string;
    adminTitle: string;
    brandHomeAria: string;
    roleSuperAdmin: string;
    roleOperations: string;
    viewStorefront: string;
    themeLightMode: string;
    themeDarkMode: string;
    themeCurrentDark: string;
    themeCurrentLight: string;
    themeToLightAria: string;
    themeToDarkAria: string;
    langGroupAria: string;
    langToggleAria: string;
    langIdLabel: string;
    langEnLabel: string;
    logout: string;
    loggingOut: string;
    logoutAria: string;
    navGroups: {
      operations: string;
      catalogWarehouse: string;
      configuration: string;
    };
    navItems: {
      dashboard: string;
      orders: string;
      products: string;
      inventory: string;
      vouchers: string;
      settings: string;
    };
  };
  login: {
    docTitle: string;
    skipToForm: string;
    backToStorefront: string;
    backShort: string;
    heading: string;
    errorBadge: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    showPasswordAria: string;
    hidePasswordAria: string;
    submit: string;
    submitting: string;
    validationRequired: string;
    errorRateLimit: string;
    errorUnauthorized: string;
    errorNetwork: string;
  };
  dashboard: {
    docTitle: string;
    title: string;
    syncedAt: string;
    allOrders: string;
    reloadData: string;
    loadingLabel: string;
    errorTitle: string;
    errorFallback: string;
    priorityLabel: string;
    priorityOrders: string;
    priorityCriticalStock: string;
    queueHeading: (count: number) => string;
    manageOrders: string;
    queueEmptyTitle: string;
    queueEmptyDesc: string;
    openOrderDetail: string;
    colInvoiceTime: string;
    colCustomer: string;
    colTotalShipping: string;
    colStatus: string;
    colNextAction: string;
    woodenCratedShort: string;
    criticalStockHeading: (count: number) => string;
    inventoryLedgerLink: string;
    criticalEmptyTitle: string;
    criticalEmptyDesc: string;
    stockOutBadge: string;
    stockLowBadge: string;
    stockRemaining: string;
    minShort: string;
    quickRestock: string;
    metricsHeading: string;
    kpiConfirmedRevenue: string;
    kpiPendingRevenue: string;
    kpiTotalOrders: string;
    kpiActionRequired: (count: number) => string;
    kpiActiveCatalog: string;
    kpiWithVideo: (count: number) => string;
    kpiInventoryValue: string;
    kpiLowOutSummary: (low: number, out: number) => string;
    statusBreakdownHeading: string;
    recentMutationsHeading: (count: number) => string;
    viewFullLedger: string;
    mutationsEmptyTitle: string;
    mutationsEmptyDesc: string;
    colTime: string;
    colSkuProduct: string;
    colMutation: string;
    colReasonNote: string;
    colActor: string;
    restockNotice: (sku: string, before: number, after: number) => string;
    orderUpdatedNotice: (invoice: string, statusLabel: string) => string;
    nextActionVerify: string;
    nextActionPack: string;
    nextActionShip: string;
  };
  orders: {
    docTitle: string;
    title: string;
    reloadBtn: string;
    filterSectionAria: string;
    statusGroupAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    showAllOrders: string;
    loadingLabel: string;
    errorTitle: string;
    errorFallback: string;
    emptyStatusTitle: (statusLabel: string) => string;
    emptyDefaultTitle: string;
    emptyFilteredDesc: string;
    emptyDefaultDesc: string;
    trackingPrefix: string;
    inspectDetail: string;
    colInvoiceTime: string;
    colCustomer: string;
    colShippingTracking: string;
    colTotal: string;
    colStatus: string;
    colActions: string;
    woodenPackingTag: string;
    stockRestoredTag: string;
    quickVerify: string;
    quickPack: string;
    quickShip: string;
    quickComplete: string;
    cancelledNotice: (invoice: string, restockedCount: number) => string;
    updatedNotice: (invoice: string, statusLabel: string) => string;
  };
  orderDrawer: {
    fallbackTitle: (id: number) => string;
    copyInvoice: string;
    invoiceCopied: string;
    loadingLabel: string;
    errorTitle: string;
    errorFallback: string;
    actionsHeading: string;
    receivedAt: string;
    finalStatusText: (statusLabel: string) => string;
    cancelReasonLabel: string;
    restockStatusLabel: string;
    restockedYes: string;
    restockedNo: string;
    cancelOrderBtn: string;
    courierLabel: string;
    trackingLabel: string;
    trackingPlaceholder: string;
    cancelWarnTitle: string;
    cancelWarnBody: string;
    cancelReasonInputLabel: string;
    cancelReasonPlaceholder: string;
    cancelConfirmText: (invoice: string) => string;
    noteLabel: string;
    notePlaceholderVerify: string;
    notePlaceholderPack: string;
    notePlaceholderDefault: string;
    submittingStatus: string;
    validationTracking: string;
    validationCancelReason: string;
    validationCancelConfirm: string;
    updateErrorFallback: string;
    cancelledSuccess: (invoice: string, count: number) => string;
    updatedSuccess: (invoice: string, statusLabel: string) => string;
    shippingHeading: string;
    recipientName: string;
    contact: string;
    shippingAddress: string;
    districtPrefix: string;
    shippingClassCourier: string;
    woodenAndPayment: string;
    woodenPackingLabel: string;
    paymentLabel: string;
    recordedTracking: string;
    copyTracking: string;
    trackingCopied: string;
    buyerNotes: string;
    itemsHeading: (count: number) => string;
    subtotalItems: string;
    voucherDiscount: string;
    shippingCost: string;
    woodenPackingCost: string;
    grandTotal: string;
    timelineHeading: (count: number) => string;
    actorPrefix: string;
    ctaPaidVerified: string;
    ctaPacked: string;
    ctaShipped: string;
    ctaCompleted: string;
    ctaCancelled: string;
  };
  products: {
    docTitle: string;
    title: string;
    addNew: string;
    filterSectionAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    categoryLabel: string;
    allCategories: string;
    statusLabel: string;
    allStatuses: string;
    statusActive: string;
    statusInactive: string;
    stockLabel: string;
    allStocks: string;
    stockSafe: string;
    stockLow: string;
    stockOut: string;
    onlyWithVideo: string;
    showingCount: (count: number) => string;
    resetFilter: string;
    resetAllFilters: string;
    loadingLabel: string;
    errorTitle: string;
    errorFallback: string;
    emptyFilteredTitle: string;
    emptyDefaultTitle: string;
    emptyFilteredDesc: string;
    emptyDefaultDesc: string;
    stockBtn: string;
    colProductSku: string;
    colCategorySpecs: string;
    colPriceWeight: string;
    colStock: string;
    colMediaStatus: string;
    colActions: string;
    stockSummaryMobile: (qty: number, min: number) => string;
    mediaCountShort: (count: number) => string;
    assetsCountShort: (count: number) => string;
    videoBadge: string;
    activeBadge: string;
    inactiveBadge: string;
    savedEditNotice: (sku: string, name: string) => string;
    savedCreateNotice: (sku: string, name: string) => string;
    archivedNotice: (sku: string) => string;
    deletedNotice: (sku: string) => string;
    deleteErrorFallback: string;
    deleteDialogTitle: string;
    deleteDialogBody: (name: string) => string;
    deleteConfirmBtn: string;
  };
  productModal: {
    editTitle: (name: string) => string;
    createTitle: string;
    tablistAria: string;
    tabBasic: string;
    tabSpecs: string;
    tabMedia: string;
    skuLabel: string;
    skuPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    slugLabel: string;
    slugPlaceholder: string;
    brandLabel: string;
    brandPlaceholder: string;
    categoryLabel: string;
    priceLabel: string;
    weightLabel: string;
    currentStockLabel: string;
    adjustStockLink: string;
    initialStockLabel: string;
    lowStockThresholdLabel: string;
    propulsionLabel: string;
    platformLabel: string;
    productGroupLabel: string;
    shippingClassLabel: string;
    playstyleTagsLabel: string;
    featuredFlag: string;
    activeFlag: string;
    shortDescLabel: string;
    shortDescPlaceholder: string;
    fullDescLabel: string;
    fullDescPlaceholder: string;
    backToGuidedForm: string;
    advancedJsonMode: string;
    rawSpecsLabel: string;
    rawCompatLabel: string;
    applyJsonBtn: string;
    rawJsonError: string;
    techSpecsHeading: string;
    fpsMinLabel: string;
    fpsMinPlaceholder: string;
    fpsMaxLabel: string;
    fpsMaxPlaceholder: string;
    energyJouleLabel: string;
    energyJoulePlaceholder: string;
    fieldRoleLabel: string;
    notSpecified: string;
    materialLabel: string;
    materialPlaceholder: string;
    gearboxLabel: string;
    gearboxPlaceholder: string;
    connectorLabel: string;
    mosfetLabel: string;
    notApplicable: string;
    mosfetYes: string;
    mosfetNo: string;
    muzzleThreadLabel: string;
    gasTypeLabel: string;
    corduraLabel: string;
    magCapacityLabel: string;
    hopUpLabel: string;
    hopUpPlaceholder: string;
    innerBarrelLabel: string;
    innerBarrelPlaceholder: string;
    fireModesLabel: string;
    fireModesPlaceholder: string;
    bbWeightRecLabel: string;
    bbWeightRecPlaceholder: string;
    railSystemLabel: string;
    inTheBoxLabel: string;
    inTheBoxPlaceholder: string;
    requiredOperateLabel: string;
    requiredOperatePlaceholder: string;
    compatHeading: string;
    reqPowerLabel: string;
    provPowerLabel: string;
    compatConnectorLabel: string;
    supports11vLabel: string;
    supports11vYes: string;
    supports11vNo: string;
    compatMuzzleLabel: string;
    reqRailLabel: string;
    noRailNeeded: string;
    magFamilyLabel: string;
    opticClassLabel: string;
    notOptic: string;
    providesRailsLabel: string;
    batteryFormFactorsLabel: string;
    placardInterfaceFlag: string;
    arcRailFlag: string;
    compatSkusLabel: string;
    compatSkusPlaceholder: string;
    uploadMediaLabel: string;
    pickPhotoBtn: string;
    pickVideoBtn: string;
    uploadingMedia: string;
    uploadTypeError: string;
    uploadErrorFallback: string;
    emptyMediaTitle: string;
    emptyMediaDesc: string;
    mediaVideoBadge: string;
    mediaPrimaryBadge: string;
    mediaPhotoBadge: (num: number) => string;
    setPrimaryBtn: string;
    moveMediaUpAria: (num: number) => string;
    moveMediaDownAria: (num: number) => string;
    altTextLabel: string;
    durationLabel: string;
    posterUrlLabel: string;
    pickPosterBtn: string;
    saveEditBtn: string;
    saveCreateBtn: string;
    savingBtn: string;
    pickerVideoTitle: string;
    pickerPosterTitle: string;
    pickerPhotoTitle: string;
    errRequiredFields: string;
    errInvalidSlug: string;
    errInvalidPrice: string;
    errInvalidWeight: string;
    errInvalidThreshold: string;
    errInvalidJson: string;
    errInvalidJoule: string;
    errSaveFallback: string;
  };
  inventory: {
    docTitle: string;
    title: string;
    reloadBtn: string;
    kpiTotalValue: string;
    kpiSafeSku: string;
    kpiLowSku: string;
    kpiOutSku: string;
    tablistAria: string;
    tabPositions: string;
    tabLedger: string;
    loadingLabel: string;
    errorTitle: string;
    errorFallback: string;
    searchLabel: string;
    searchPlaceholder: string;
    stockFilterLabel: string;
    allStockStatuses: string;
    statusOut: string;
    statusLow: string;
    statusSafe: string;
    resetFilter: string;
    emptyPositionsTitle: string;
    emptyPositionsDesc: string;
    resetInventoryFilter: string;
    badgeOut: string;
    badgeLow: string;
    badgeSafe: string;
    mobileStockMin: string;
    mobileAssetValue: string;
    btnRestock: string;
    btnAudit: string;
    btnHistory: string;
    colSkuProduct: string;
    colStockMin: string;
    colPriceValue: string;
    colLastMutation: string;
    colActions: string;
    notRecorded: string;
    reasonFilterLabel: string;
    allReasons: string;
    productFilterLabel: string;
    allProducts: string;
    resetLedgerFilter: string;
    filteredForSku: (sku: string, name: string) => string;
    showAllSkus: string;
    emptyLedgerTitle: string;
    emptyLedgerDesc: string;
    colTime: string;
    colDelta: string;
    colBeforeAfter: string;
    colTypeRef: string;
    colNote: string;
    colActor: string;
    refPrefix: string;
    noNote: string;
    adjustNotice: (sku: string, delta: string, before: number, after: number) => string;
  };
  stockModal: {
    title: string;
    mutationTypeLegend: string;
    restockOption: string;
    auditOption: string;
    directionLegend: string;
    addBtn: string;
    subtractBtn: string;
    qtyAddLabel: string;
    qtySubtractLabel: string;
    previewCurrent: string;
    previewDelta: string;
    previewFinal: string;
    negativeWarn: string;
    refLabel: string;
    refPlaceholder: string;
    noteLabel: string;
    notePlaceholderRestock: string;
    notePlaceholderAudit: string;
    submitRestock: string;
    submitAudit: string;
    submitting: string;
    errInvalidQty: string;
    errNegativeStock: (qty: number, current: number) => string;
    errNoteMin: string;
    errSaveFallback: string;
  };
  vouchers: {
    docTitle: string;
    title: string;
    createBtn: string;
    loadingLabel: string;
    errorTitle: string;
    errorFallback: string;
    toggleErrorFallback: string;
    deleteErrorFallback: string;
    emptyTitle: string;
    emptyDesc: string;
    noDescription: string;
    activeBadge: string;
    inactiveBadge: string;
    mobileDiscountValue: string;
    mobileUsedQuota: string;
    mobileMinSubtotal: string;
    mobileVisibility: string;
    unlimited: string;
    visibilityPublic: string;
    visibilityPrivate: string;
    deactivate: string;
    activate: string;
    usedTooltip: (count: number) => string;
    deleteTooltip: (code: string) => string;
    colCodeDesc: string;
    colDiscount: string;
    colMinSpend: string;
    colUsage: string;
    colValidity: string;
    colStatus: string;
    colActions: string;
    maxCap: (amount: string) => string;
    noCap: string;
    fixedDiscount: string;
    startsPrefix: string;
    endsPrefix: string;
    immediate: string;
    noExpiry: string;
    alwaysValid: string;
    toggledNotice: (code: string, active: boolean) => string;
    deletedNotice: (code: string) => string;
    savedEditNotice: (code: string) => string;
    savedCreateNotice: (code: string) => string;
    deleteDialogTitle: string;
    deleteDialogBody: (code: string) => string;
    deleteConfirmBtn: string;
    deletingBtn: string;
  };
  voucherModal: {
    editTitle: (code: string) => string;
    createTitle: string;
    templatePrompt: string;
    templateBtn: string;
    templateDesc: string;
    codeLabel: string;
    codePlaceholder: string;
    typeLabel: string;
    typePercent: string;
    typeFixed: string;
    descLabel: string;
    descPlaceholder: string;
    valuePercentLabel: string;
    valueFixedLabel: string;
    maxDiscountLabel: string;
    maxDiscountPlaceholder: string;
    minSubtotalLabel: string;
    maxUsesLabel: string;
    maxUsesPlaceholder: string;
    startsAtLabel: string;
    expiresAtLabel: string;
    activeFlag: string;
    publicFlag: string;
    saveEditBtn: string;
    saveCreateBtn: string;
    savingBtn: string;
    errCode: string;
    errValue: string;
    errPercentMax: string;
    errMinSubtotal: string;
    errMaxDiscount: string;
    errMaxUses: string;
    errDateRange: string;
    errSaveFallback: string;
  };
  mediaPicker: {
    defaultTitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    uploadLabel: (limitText: string) => string;
    limitImage: string;
    limitVideo: string;
    limitAll: string;
    folderGroupAria: string;
    folderAll: string;
    folderProducts: string;
    folderHero: string;
    folderVideos: string;
    folderUploads: string;
    typeGroupAria: string;
    typeAll: string;
    typeImage: string;
    typeVideo: string;
    uploadingStatus: string;
    uploadSuccess: (filename: string) => string;
    errUnsupportedExt: string;
    errImageOnly: string;
    errVideoOnly: string;
    errImageTooLarge: string;
    errVideoTooLarge: string;
    errUploadFallback: string;
    errLoadFallback: string;
    loadingLabel: string;
    errorTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    resetFilterBtn: string;
    selectBtn: string;
  };
  settings: {
    docTitle: string;
    title: string;
    lastSaved: string;
    reloadBtn: string;
    loadingLabel: string;
    errorTitle: string;
    errorFallback: string;
    tablistAria: string;
    tabProfile: string;
    tabHero: string;
    tabShipping: string;
    profileHeading: string;
    storeNameLabel: string;
    cityLabel: string;
    addressLabel: string;
    hoursIdLabel: string;
    hoursEnLabel: string;
    hoursEnPlaceholder: string;
    whatsappLabel: string;
    emailLabel: string;
    mapsHeading: string;
    mapsEmbedLabel: string;
    mapsEmbedPlaceholder: string;
    mapsDirectionsLabel: string;
    mapsDirectionsPlaceholder: string;
    mapsPreviewLabel: string;
    mapsIframeTitle: string;
    mapsInvalidWarning: string;
    heroHeading: (count: number) => string;
    addSlideBtn: string;
    slideLabel: (num: number) => string;
    moveSlideUpAria: (num: number) => string;
    moveSlideDownAria: (num: number) => string;
    removeSlideAria: (num: number) => string;
    choosePhotoBtn: string;
    imageUrlLabel: string;
    headlineIdLabel: string;
    headlineEnLabel: string;
    ctaLabelIdLabel: string;
    ctaLabelEnLabel: string;
    ctaUrlLabel: string;
    ctaUrlPlaceholder: string;
    shippingDefaultsHeading: string;
    woodenFeeLabel: string;
    lowStockDefaultLabel: string;
    zoneRatesHeading: string;
    colZone: string;
    colRegularRate: string;
    colCargoRate: string;
    colHazmatSurcharge: string;
    zoneRegularAria: (label: string) => string;
    zoneCargoAria: (label: string) => string;
    zoneHazmatAria: (label: string) => string;
    saveBtn: string;
    savingBtn: string;
    saveSuccess: string;
    saveErrorFallback: string;
    errProfileRequired: string;
    errMapsHttps: string;
    errSlidesRange: string;
    errSlideFields: (num: number) => string;
    pickerSlideImageTitle: (num: number) => string;
    newSlideHeadlineId: (num: number) => string;
    newSlideHeadlineEn: (num: number) => string;
    newSlideCtaId: string;
    newSlideCtaEn: string;
  };
  couriers: Record<ShippingCourierCode, string>;
  payments: Record<PaymentMethodCode, string>;
  mutationReasons: Record<InventoryMutationReason, string>;
  platforms: Record<PlatformType, string>;
  propulsions: Record<PropulsionType, string>;
  productGroups: Record<LoadoutSlotType, string>;
  missions: Record<MissionTag, string>;
  zones: Record<ShippingZoneCode, string>;
}

const ADMIN_DICTIONARIES: Record<Language, AdminDictionary> = {
  id: {
    common: {
      close: 'Tutup',
      cancel: 'Batal',
      save: 'Simpan',
      edit: 'Edit',
      delete: 'Hapus',
      reset: 'Reset',
      reload: 'Muat Ulang',
      loading: 'Memuat...',
      processing: 'Memproses...',
      saving: 'Menyimpan...',
      up: 'Naik',
      down: 'Turun',
      yes: 'Ya',
      no: 'Tidak',
      noImage: 'NO IMG',
      dismissNotice: 'Tutup Notifikasi',
      detail: 'Detail',
      all: 'Semua',
      active: 'Aktif',
      inactive: 'Nonaktif',
      publicTag: 'PUBLIK',
      privateTag: 'PRIVAT',
      unit: 'unit',
      items: 'item',
    },
    layout: {
      skipToContent: 'Lewati ke konten utama',
      mobileMenuBtn: 'Menu',
      closeMenuAria: 'Tutup menu navigasi admin',
      mobileNavAria: 'Navigasi admin mobile',
      sidebarAria: 'Sidebar admin',
      mainNavAria: 'Navigasi utama admin',
      collapseSidebarAria: 'Ciutkan sidebar navigasi',
      expandSidebarAria: 'Perluas sidebar navigasi',
      collapseSidebarTitle: 'Ciutkan sidebar',
      expandSidebarTitle: 'Perluas sidebar',
      adminTitle: 'Panel Admin',
      brandHomeAria: 'Brakasa Tactical Admin',
      roleSuperAdmin: 'Super Admin',
      roleOperations: 'Operasional',
      viewStorefront: 'Lihat Toko',
      themeLightMode: 'Mode Terang',
      themeDarkMode: 'Mode Gelap',
      themeCurrentDark: 'Tema: Armory Dark',
      themeCurrentLight: 'Tema: Field Paper Light',
      themeToLightAria: 'Beralih ke tema terang Field Paper Light',
      themeToDarkAria: 'Beralih ke tema gelap Armory Dark',
      langGroupAria: 'Pilih bahasa antarmuka admin',
      langToggleAria: 'Ganti bahasa Indonesia / Inggris',
      langIdLabel: 'Indonesia (ID)',
      langEnLabel: 'English (EN)',
      logout: 'Keluar',
      loggingOut: 'Keluar...',
      logoutAria: 'Keluar dari Panel Admin',
      navGroups: {
        operations: 'Operasional',
        catalogWarehouse: 'Katalog & Gudang',
        configuration: 'Konfigurasi',
      },
      navItems: {
        dashboard: 'Ringkasan',
        orders: 'Pesanan',
        products: 'Produk & Media',
        inventory: 'Inventori',
        vouchers: 'Voucher',
        settings: 'Pengaturan',
      },
    },
    login: {
      docTitle: 'Masuk Admin | Brakasa Tactical',
      skipToForm: 'Lewati ke formulir login',
      backToStorefront: 'Kembali ke Toko',
      backShort: 'Toko',
      heading: 'Masuk Admin',
      errorBadge: '[GALAT]',
      usernameLabel: 'Username atau Email',
      usernamePlaceholder: 'Masukkan username atau email',
      passwordLabel: 'Kata Sandi',
      passwordPlaceholder: 'Masukkan kata sandi',
      showPassword: 'Lihat',
      hidePassword: 'Sembunyi',
      showPasswordAria: 'Tampilkan kata sandi',
      hidePasswordAria: 'Sembunyikan kata sandi',
      submit: 'Masuk',
      submitting: 'Memverifikasi...',
      validationRequired: 'Masukkan username atau email beserta kata sandi Anda.',
      errorRateLimit:
        'Terlalu banyak percobaan masuk gagal. Tunggu 15 menit sebelum mencoba kembali.',
      errorUnauthorized: 'Username, email, atau kata sandi tidak sesuai.',
      errorNetwork: 'Koneksi ke server autentikasi gagal. Coba lagi.',
    },
    dashboard: {
      docTitle: 'Dashboard | Admin Brakasa',
      title: 'Dashboard',
      syncedAt: 'Sinkronisasi',
      allOrders: 'Semua Pesanan',
      reloadData: 'Muat Ulang',
      loadingLabel: 'Memuat ringkasan operasional...',
      errorTitle: 'Gagal memuat dashboard',
      errorFallback: 'Gagal memuat ringkasan operasional dari server.',
      priorityLabel: 'Prioritas',
      priorityOrders: 'Pesanan Butuh Tindakan',
      priorityCriticalStock: 'SKU Stok Kritis / Habis',
      queueHeading: (count) => `Antrean Pesanan (${count})`,
      manageOrders: 'Kelola Pesanan',
      queueEmptyTitle: 'Tidak ada pesanan menunggu tindakan',
      queueEmptyDesc: 'Seluruh pesanan masuk telah diproses.',
      openOrderDetail: 'Buka Detail',
      colInvoiceTime: 'Invoice & Waktu',
      colCustomer: 'Pembeli',
      colTotalShipping: 'Total & Kargo',
      colStatus: 'Status',
      colNextAction: 'Tindakan',
      woodenCratedShort: ' + Kayu',
      criticalStockHeading: (count) => `Stok Kritis (${count})`,
      inventoryLedgerLink: 'Buku Inventori',
      criticalEmptyTitle: 'Semua stok SKU aman',
      criticalEmptyDesc: 'Tidak ada produk aktif dengan stok menipis atau habis.',
      stockOutBadge: '[HABIS]',
      stockLowBadge: '[KRITIS]',
      stockRemaining: 'Sisa',
      minShort: 'Min.',
      quickRestock: 'Restock',
      metricsHeading: 'Ringkasan Metrik',
      kpiConfirmedRevenue: 'Omzet Terkonfirmasi',
      kpiPendingRevenue: 'Menunggu bayar',
      kpiTotalOrders: 'Total Pesanan',
      kpiActionRequired: (count) => `Butuh tindakan: ${count}`,
      kpiActiveCatalog: 'Katalog Aktif',
      kpiWithVideo: (count) => `Video demo: ${count} SKU`,
      kpiInventoryValue: 'Nilai Inventori Aktif',
      kpiLowOutSummary: (low, out) => `Kritis: ${low} | Habis: ${out}`,
      statusBreakdownHeading: 'Status Pesanan',
      recentMutationsHeading: (count) => `Mutasi Inventori Terbaru (${count})`,
      viewFullLedger: 'Lihat Semua',
      mutationsEmptyTitle: 'Belum ada riwayat mutasi',
      mutationsEmptyDesc: 'Mutasi stok tercatat otomatis pada transaksi dan penyesuaian.',
      colTime: 'Waktu',
      colSkuProduct: 'SKU & Produk',
      colMutation: 'Mutasi',
      colReasonNote: 'Alasan & Catatan',
      colActor: 'Aktor',
      restockNotice: (sku, before, after) =>
        `Stok ${sku} diperbarui dari ${before} menjadi ${after} unit.`,
      orderUpdatedNotice: (invoice, statusLabel) =>
        `Status pesanan ${invoice} diperbarui menjadi ${statusLabel}.`,
      nextActionVerify: 'Verifikasi Bayar',
      nextActionPack: 'Tandai Dikemas',
      nextActionShip: 'Input Resi',
    },
    orders: {
      docTitle: 'Pesanan | Admin Brakasa',
      title: 'Pesanan',
      reloadBtn: 'Muat Ulang',
      filterSectionAria: 'Filter dan pencarian pesanan',
      statusGroupAria: 'Filter status pesanan',
      searchLabel: 'Cari Invoice, Pembeli, Email, atau No. HP',
      searchPlaceholder: 'Contoh: BRK-20260410 atau nama pembeli',
      showAllOrders: 'Tampilkan Semua',
      loadingLabel: 'Memuat daftar pesanan...',
      errorTitle: 'Gagal memuat daftar pesanan',
      errorFallback: 'Gagal memuat daftar pesanan dari server.',
      emptyStatusTitle: (statusLabel) => `Tidak ada pesanan dengan status ${statusLabel}`,
      emptyDefaultTitle: 'Belum ada pesanan',
      emptyFilteredDesc: 'Ubah kata kunci pencarian atau pilih tab Semua.',
      emptyDefaultDesc: 'Pesanan dari storefront akan muncul di halaman ini.',
      trackingPrefix: 'Resi',
      inspectDetail: 'Lihat Detail',
      colInvoiceTime: 'Invoice & Waktu',
      colCustomer: 'Pelanggan',
      colShippingTracking: 'Kargo & Resi',
      colTotal: 'Total',
      colStatus: 'Status',
      colActions: 'Tindakan',
      woodenPackingTag: ' | Packing Kayu',
      stockRestoredTag: 'Stok dikembalikan',
      quickVerify: 'Verifikasi Bayar',
      quickPack: 'Tandai Dikemas',
      quickShip: 'Input Resi',
      quickComplete: 'Selesaikan',
      cancelledNotice: (invoice, count) =>
        `Pesanan ${invoice} dibatalkan dan ${count} baris item dikembalikan ke stok.`,
      updatedNotice: (invoice, statusLabel) =>
        `Pesanan ${invoice} diperbarui ke status ${statusLabel}.`,
    },
    orderDrawer: {
      fallbackTitle: (id) => `Pesanan #${id}`,
      copyInvoice: 'Salin Invoice',
      invoiceCopied: 'Invoice Disalin',
      loadingLabel: 'Memuat detail pesanan...',
      errorTitle: 'Gagal memuat detail pesanan',
      errorFallback: 'Gagal mengambil detail pesanan dari server.',
      actionsHeading: 'Tindakan Status',
      receivedAt: 'Masuk',
      finalStatusText: (statusLabel) => `Pesanan berada pada status akhir (${statusLabel}).`,
      cancelReasonLabel: 'Alasan pembatalan',
      restockStatusLabel: 'Pengembalian stok',
      restockedYes: 'SUDAH DIKEMBALIKAN',
      restockedNo: 'BELUM DIKEMBALIKAN',
      cancelOrderBtn: 'Batalkan Pesanan',
      courierLabel: 'Ekspedisi Pengiriman (Wajib)',
      trackingLabel: 'Nomor Resi (Wajib)',
      trackingPlaceholder: 'Contoh: JTR-202604-88912',
      cancelWarnTitle: 'Pembatalan & Pengembalian Stok Otomatis',
      cancelWarnBody:
        'Pembatalan tidak dapat dibatalkan ulang. Seluruh kuantitas item akan dikembalikan otomatis ke stok.',
      cancelReasonInputLabel: 'Alasan Pembatalan (Wajib, minimal 5 karakter)',
      cancelReasonPlaceholder: 'Contoh: Batas waktu transfer terlewati atau permintaan batal',
      cancelConfirmText: (invoice) =>
        `Saya mengonfirmasi pembatalan pesanan ${invoice} dan pengembalian stok otomatis.`,
      noteLabel: 'Catatan Operasional (Opsional)',
      notePlaceholderVerify: 'Contoh: Dana masuk VA BCA terverifikasi',
      notePlaceholderPack: 'Contoh: Pesanan diperiksa dan dikemas aman',
      notePlaceholderDefault: 'Catatan tambahan untuk riwayat status',
      submittingStatus: 'Memproses...',
      validationTracking: 'Masukkan nomor resi yang sah (minimal 5 karakter).',
      validationCancelReason: 'Tuliskan alasan pembatalan minimal 5 karakter.',
      validationCancelConfirm: 'Centang kotak konfirmasi pembatalan terlebih dahulu.',
      updateErrorFallback: 'Gagal memperbarui status pesanan.',
      cancelledSuccess: (invoice, count) =>
        `Pesanan ${invoice} dibatalkan. Stok ${count} baris item dikembalikan otomatis.`,
      updatedSuccess: (invoice, statusLabel) =>
        `Status pesanan ${invoice} diperbarui menjadi ${statusLabel}.`,
      shippingHeading: 'Penerima & Pengiriman',
      recipientName: 'Nama Penerima',
      contact: 'Kontak',
      shippingAddress: 'Alamat Pengiriman',
      districtPrefix: 'Kec.',
      shippingClassCourier: 'Kurir & Kelas Kargo',
      woodenAndPayment: 'Packing Kayu & Pembayaran',
      woodenPackingLabel: 'Packing Kayu',
      paymentLabel: 'Pembayaran',
      recordedTracking: 'Nomor Resi',
      copyTracking: 'Salin Resi',
      trackingCopied: 'Resi Disalin',
      buyerNotes: 'Catatan Pembeli',
      itemsHeading: (count) => `Daftar Item (${count} SKU)`,
      subtotalItems: 'Subtotal Item',
      voucherDiscount: 'Diskon Voucher',
      shippingCost: 'Ongkos Kirim',
      woodenPackingCost: 'Packing Kayu',
      grandTotal: 'Total Akhir',
      timelineHeading: (count) => `Riwayat Status (${count})`,
      actorPrefix: 'Aktor',
      ctaPaidVerified: 'Verifikasi Pembayaran',
      ctaPacked: 'Tandai Dikemas',
      ctaShipped: 'Simpan Resi & Kirim',
      ctaCompleted: 'Tandai Selesai',
      ctaCancelled: 'Batalkan & Kembalikan Stok',
    },
    products: {
      docTitle: 'Produk | Admin Brakasa',
      title: 'Produk & Media',
      addNew: 'Tambah Produk',
      filterSectionAria: 'Filter daftar produk',
      searchLabel: 'Cari SKU, Nama, atau Merek',
      searchPlaceholder: 'Contoh: BRK-AR-002 atau VFC',
      categoryLabel: 'Kategori',
      allCategories: 'Semua Kategori',
      statusLabel: 'Status',
      allStatuses: 'Semua Status',
      statusActive: 'Aktif',
      statusInactive: 'Nonaktif / Diarsipkan',
      stockLabel: 'Stok',
      allStocks: 'Semua Posisi Stok',
      stockSafe: 'Stok Aman',
      stockLow: 'Stok Kritis',
      stockOut: 'Stok Habis (0)',
      onlyWithVideo: 'Hanya produk dengan video demo (.mp4)',
      showingCount: (count) => `${count} SKU`,
      resetFilter: 'Reset Filter',
      resetAllFilters: 'Reset Semua Filter',
      loadingLabel: 'Memuat daftar produk...',
      errorTitle: 'Gagal memuat daftar produk',
      errorFallback: 'Gagal memuat daftar produk dari server.',
      emptyFilteredTitle: 'Tidak ada produk yang cocok',
      emptyDefaultTitle: 'Belum ada produk',
      emptyFilteredDesc: 'Ubah kata kunci pencarian atau filter untuk melihat produk lain.',
      emptyDefaultDesc: 'Tambahkan produk pertama ke katalog.',
      stockBtn: 'Stok',
      colProductSku: 'Produk & SKU',
      colCategorySpecs: 'Kategori & Spek',
      colPriceWeight: 'Harga & Berat',
      colStock: 'Stok',
      colMediaStatus: 'Media & Status',
      colActions: 'Aksi',
      stockSummaryMobile: (qty, min) => `Stok: ${qty} / Min ${min}`,
      mediaCountShort: (count) => `${count} media`,
      assetsCountShort: (count) => `${count} aset`,
      videoBadge: 'VIDEO',
      activeBadge: 'AKTIF',
      inactiveBadge: 'NONAKTIF',
      savedEditNotice: (sku, name) => `Perubahan produk ${sku} (${name}) disimpan.`,
      savedCreateNotice: (sku, name) => `Produk baru ${sku} (${name}) ditambahkan.`,
      archivedNotice: (sku) => `Produk ${sku} dinonaktifkan (diarsipkan) karena memiliki riwayat.`,
      deletedNotice: (sku) => `Produk ${sku} dihapus permanen.`,
      deleteErrorFallback: 'Gagal menghapus atau menonaktifkan produk.',
      deleteDialogTitle: 'Hapus atau Nonaktifkan Produk?',
      deleteDialogBody: (name) =>
        `Produk ${name} akan dihapus permanen bila belum memiliki riwayat pesanan atau mutasi stok, atau diarsipkan bila sudah tercatat.`,
      deleteConfirmBtn: 'Ya, Hapus / Nonaktifkan',
    },
    productModal: {
      editTitle: (name) => `Edit Produk: ${name}`,
      createTitle: 'Tambah Produk Baru',
      tablistAria: 'Bagian editor produk',
      tabBasic: 'Info Dasar',
      tabSpecs: 'Spesifikasi',
      tabMedia: 'Media',
      skuLabel: 'Kode SKU (Wajib)',
      skuPlaceholder: 'BRK-AR-004',
      nameLabel: 'Nama Produk (Wajib)',
      namePlaceholder: 'Contoh: VFC Avalon Saber Carbine M-LOK AEG',
      slugLabel: 'Slug URL (Wajib)',
      slugPlaceholder: 'vfc-avalon-saber-carbine',
      brandLabel: 'Merek (Wajib)',
      brandPlaceholder: 'Contoh: Tokyo Marui, VFC, Vector Optics',
      categoryLabel: 'Kategori',
      priceLabel: 'Harga (IDR)',
      weightLabel: 'Berat (gram)',
      currentStockLabel: 'Stok Saat Ini',
      adjustStockLink: 'Ubah Stok',
      initialStockLabel: 'Stok Awal',
      lowStockThresholdLabel: 'Ambang Stok Kritis',
      propulsionLabel: 'Propulsi',
      platformLabel: 'Platform',
      productGroupLabel: 'Grup Produk',
      shippingClassLabel: 'Kelas Pengiriman',
      playstyleTagsLabel: 'Tag Gaya Bermain',
      featuredFlag: 'Tampilkan di Produk Unggulan',
      activeFlag: 'Produk Aktif di Toko',
      shortDescLabel: 'Ringkasan Singkat',
      shortDescPlaceholder: 'Ringkasan singkat karakter produk',
      fullDescLabel: 'Deskripsi Lengkap',
      fullDescPlaceholder: 'Uraikan konstruksi, performa, dan detail produk...',
      backToGuidedForm: 'Form Terpandu',
      advancedJsonMode: 'Mode Edit JSON',
      rawSpecsLabel: 'JSON Spesifikasi (specs_json)',
      rawCompatLabel: 'JSON Kompatibilitas (compatibility_tags_json)',
      applyJsonBtn: 'Terapkan JSON ke Form',
      rawJsonError: 'Format JSON tidak valid. Periksa tanda kutip, koma, dan kurung.',
      techSpecsHeading: 'Spesifikasi Teknis',
      fpsMinLabel: 'FPS Minimum (@0.20g)',
      fpsMinPlaceholder: 'Kosong bila non-unit',
      fpsMaxLabel: 'FPS Maksimum (@0.20g)',
      fpsMaxPlaceholder: 'Contoh: 380',
      energyJouleLabel: 'Energi Kinetik (Joule)',
      energyJoulePlaceholder: 'Contoh: 1.35',
      fieldRoleLabel: 'Kelas Medan FPS',
      notSpecified: 'Tidak ditentukan',
      materialLabel: 'Material',
      materialPlaceholder: 'CNC 6061-T6 Aluminum / Cordura 500D',
      gearboxLabel: 'Gearbox / Sistem',
      gearboxPlaceholder: 'Gearbox V2 ECS / ZET System',
      connectorLabel: 'Konektor Baterai',
      mosfetLabel: 'MOSFET / ETU',
      notApplicable: 'Tidak relevan',
      mosfetYes: 'Ya (Ada MOSFET/ETU)',
      mosfetNo: 'Tidak (Non-MOSFET)',
      muzzleThreadLabel: 'Ulir Laras (Muzzle Thread)',
      gasTypeLabel: 'Tipe Gas',
      corduraLabel: 'Denier Kain',
      magCapacityLabel: 'Kapasitas Magasin (rds)',
      hopUpLabel: 'Hop-Up',
      hopUpPlaceholder: 'Adjustable Rotary Hop-Up',
      innerBarrelLabel: 'Inner Barrel',
      innerBarrelPlaceholder: '380 mm / 6.03 mm',
      fireModesLabel: 'Mode Tembak (pisah koma)',
      fireModesPlaceholder: 'Safe, Semi, Full-Auto',
      bbWeightRecLabel: 'Rekomendasi Berat BB',
      bbWeightRecPlaceholder: '0.25g - 0.28g',
      railSystemLabel: 'Sistem Rail / Mounting',
      inTheBoxLabel: 'Isi Dalam Paket (1 item per baris)',
      inTheBoxPlaceholder: '1x Unit\n1x Magazine Mid-Cap',
      requiredOperateLabel: 'Kebutuhan Tambahan (1 item per baris)',
      requiredOperatePlaceholder: 'Baterai LiPo 11.1V Deans\nSmart Balance Charger\nBB 6mm 0.28g',
      compatHeading: 'Kompatibilitas Produk',
      reqPowerLabel: 'Daya Dibutuhkan',
      provPowerLabel: 'Daya Disediakan',
      compatConnectorLabel: 'Konektor Kompatibilitas',
      supports11vLabel: 'Dukungan LiPo 11.1V',
      supports11vYes: 'Mendukung 11.1V',
      supports11vNo: 'Tidak mendukung 11.1V',
      compatMuzzleLabel: 'Ulir Laras Unit',
      reqRailLabel: 'Rail yang Dibutuhkan',
      noRailNeeded: 'Tidak membutuhkan rail',
      magFamilyLabel: 'Famili Magasin',
      opticClassLabel: 'Kelas Optik',
      notOptic: 'Bukan optik',
      providesRailsLabel: 'Rail Tersedia',
      batteryFormFactorsLabel: 'Form Factor Baterai',
      placardInterfaceFlag: 'Mendukung SwiftClip / Velcro Front Placard',
      arcRailFlag: 'Kompatibel Side ARC Helmet Rail',
      compatSkusLabel: 'SKU Produk Terkait (pisah koma)',
      compatSkusPlaceholder: 'BRK-CSM-003, BRK-OPT-001, BRK-UPG-001',
      uploadMediaLabel: 'Unggah Foto atau Video (.jpg, .png, .webp maks 8 MB / .mp4, .webm maks 40 MB)',
      pickPhotoBtn: 'Pilih Foto dari Pustaka',
      pickVideoBtn: 'Pilih Video (.mp4)',
      uploadingMedia: 'Mengunggah media...',
      uploadTypeError: 'Format file harus JPG, PNG, WebP, MP4, atau WebM.',
      uploadErrorFallback: 'Gagal mengunggah media baru.',
      emptyMediaTitle: 'Belum ada media',
      emptyMediaDesc: 'Tambahkan minimal 1 foto utama produk untuk ditampilkan di katalog dan halaman detail.',
      mediaVideoBadge: 'VIDEO',
      mediaPrimaryBadge: 'UTAMA',
      mediaPhotoBadge: (num) => `FOTO #${num}`,
      setPrimaryBtn: 'Jadikan Utama',
      moveMediaUpAria: (num) => `Pindahkan media ${num} ke atas`,
      moveMediaDownAria: (num) => `Pindahkan media ${num} ke bawah`,
      altTextLabel: 'Teks Alternatif (Alt Text)',
      durationLabel: 'Durasi Video (detik)',
      posterUrlLabel: 'URL Poster Video (Opsional)',
      pickPosterBtn: 'Pilih Poster',
      saveEditBtn: 'Simpan Perubahan',
      saveCreateBtn: 'Simpan Produk',
      savingBtn: 'Menyimpan...',
      pickerVideoTitle: 'Pilih Video Produk',
      pickerPosterTitle: 'Pilih Gambar Poster Video',
      pickerPhotoTitle: 'Pilih Foto Produk',
      errRequiredFields: 'SKU, Slug, Nama Produk, dan Merek wajib diisi.',
      errInvalidSlug: 'Slug URL hanya boleh berisi huruf kecil, angka, dan tanda hubung.',
      errInvalidPrice: 'Harga IDR harus berupa bilangan bulat 0 atau positif.',
      errInvalidWeight: 'Berat (gram) harus berupa bilangan bulat 0 atau positif.',
      errInvalidThreshold: 'Ambang stok kritis harus berupa bilangan bulat 0 atau positif.',
      errInvalidJson: 'JSON spesifikasi atau kompatibilitas belum valid.',
      errInvalidJoule: 'Energi kinetik (Joule) harus bernilai antara 0 sampai 2,0 Joule.',
      errSaveFallback: 'Gagal menyimpan data produk ke server.',
    },
    inventory: {
      docTitle: 'Inventori | Admin Brakasa',
      title: 'Inventori',
      reloadBtn: 'Muat Ulang',
      kpiTotalValue: 'Total Nilai Inventori',
      kpiSafeSku: 'SKU Stok Aman',
      kpiLowSku: 'SKU Stok Kritis',
      kpiOutSku: 'SKU Habis (0)',
      tablistAria: 'Tampilan inventori',
      tabPositions: 'Posisi Stok',
      tabLedger: 'Riwayat Mutasi',
      loadingLabel: 'Memuat data inventori...',
      errorTitle: 'Gagal memuat inventori',
      errorFallback: 'Gagal memuat data inventori dari server.',
      searchLabel: 'Cari SKU atau Nama Produk',
      searchPlaceholder: 'Contoh: BRK-AR-001 atau Green Gas',
      stockFilterLabel: 'Status Stok',
      allStockStatuses: 'Semua Status',
      statusOut: 'Habis (0 Unit)',
      statusLow: 'Stok Kritis',
      statusSafe: 'Stok Aman',
      resetFilter: 'Reset Filter',
      emptyPositionsTitle: 'Tidak ada SKU yang cocok',
      emptyPositionsDesc: 'Reset pencarian atau ubah filter status stok.',
      resetInventoryFilter: 'Reset Filter',
      badgeOut: '[HABIS]',
      badgeLow: '[KRITIS]',
      badgeSafe: '[AMAN]',
      mobileStockMin: 'STOK / MIN',
      mobileAssetValue: 'NILAI ASET',
      btnRestock: '+ Restock',
      btnAudit: '+/- Koreksi',
      btnHistory: 'Riwayat',
      colSkuProduct: 'SKU & Produk',
      colStockMin: 'Stok / Min.',
      colPriceValue: 'Harga & Nilai',
      colLastMutation: 'Mutasi Terakhir',
      colActions: 'Aksi',
      notRecorded: 'Belum tercatat',
      reasonFilterLabel: 'Alasan Mutasi',
      allReasons: 'Semua Alasan',
      productFilterLabel: 'Produk',
      allProducts: 'Semua Produk',
      resetLedgerFilter: 'Reset Filter',
      filteredForSku: (sku, name) => `Riwayat mutasi untuk ${sku} (${name})`,
      showAllSkus: 'Tampilkan Semua',
      emptyLedgerTitle: 'Belum ada catatan mutasi',
      emptyLedgerDesc: 'Mutasi tercatat otomatis pada transaksi, restock, atau koreksi audit.',
      colTime: 'Waktu',
      colDelta: 'Delta',
      colBeforeAfter: 'Sebelum -> Sesudah',
      colTypeRef: 'Tipe & Referensi',
      colNote: 'Catatan',
      colActor: 'Aktor',
      refPrefix: 'Ref',
      noNote: 'Tanpa catatan',
      adjustNotice: (sku, delta, before, after) =>
        `Mutasi ${sku} (${delta}): stok berubah dari ${before} menjadi ${after} unit.`,
    },
    stockModal: {
      title: 'Penyesuaian Stok',
      mutationTypeLegend: 'Jenis Mutasi',
      restockOption: 'Restock Masuk (+)',
      auditOption: 'Koreksi Audit (+/-)',
      directionLegend: 'Arah Koreksi',
      addBtn: 'Tambah (+)',
      subtractBtn: 'Kurangi (-)',
      qtyAddLabel: 'Jumlah Unit Ditambahkan',
      qtySubtractLabel: 'Jumlah Unit Dikurangi',
      previewCurrent: 'Saat Ini',
      previewDelta: 'Mutasi',
      previewFinal: 'Stok Akhir',
      negativeWarn: 'Stok akhir tidak boleh kurang dari 0.',
      refLabel: 'Nomor Referensi PO / Batch (Opsional)',
      refPlaceholder: 'Contoh: PO-2026-041',
      noteLabel: 'Catatan Mutasi (Wajib)',
      notePlaceholderRestock: 'Contoh: Penerimaan stok batch baru',
      notePlaceholderAudit: 'Contoh: Penyesuaian hasil hitung fisik rak',
      submitRestock: 'Simpan Restock',
      submitAudit: 'Simpan Koreksi',
      submitting: 'Menyimpan...',
      errInvalidQty: 'Jumlah harus berupa bilangan bulat lebih besar dari 0.',
      errNegativeStock: (qty, current) =>
        `Pengurangan ${qty} unit melebihi stok tersedia (${current}).`,
      errNoteMin: 'Tuliskan catatan mutasi minimal 3 karakter.',
      errSaveFallback: 'Gagal menyimpan penyesuaian stok.',
    },
    vouchers: {
      docTitle: 'Voucher | Admin Brakasa',
      title: 'Voucher & Promo',
      createBtn: 'Buat Voucher',
      loadingLabel: 'Memuat daftar voucher...',
      errorTitle: 'Gagal memuat voucher',
      errorFallback: 'Gagal memuat daftar voucher dari server.',
      toggleErrorFallback: 'Gagal mengubah status aktif voucher.',
      deleteErrorFallback: 'Gagal menghapus voucher.',
      emptyTitle: 'Belum ada voucher',
      emptyDesc: 'Buat kode promo persentase atau potongan tetap.',
      noDescription: 'Tanpa deskripsi',
      activeBadge: '[AKTIF]',
      inactiveBadge: '[NONAKTIF]',
      mobileDiscountValue: 'DISKON',
      mobileUsedQuota: 'TERPAKAI / KUOTA',
      mobileMinSubtotal: 'MIN. SUBTOTAL',
      mobileVisibility: 'VISIBILITAS',
      unlimited: 'Tak terbatas',
      visibilityPublic: 'Publik',
      visibilityPrivate: 'Privat',
      deactivate: 'Nonaktifkan',
      activate: 'Aktifkan',
      usedTooltip: (count) => `Sudah dipakai ${count} kali; gunakan tombol Nonaktifkan.`,
      deleteTooltip: (code) => `Hapus voucher ${code}`,
      colCodeDesc: 'Kode & Deskripsi',
      colDiscount: 'Potongan',
      colMinSpend: 'Min. Belanja',
      colUsage: 'Pemakaian',
      colValidity: 'Masa Berlaku',
      colStatus: 'Status',
      colActions: 'Aksi',
      maxCap: (amount) => `Maks ${amount}`,
      noCap: 'Tanpa plafon',
      fixedDiscount: 'Potongan Tetap',
      startsPrefix: 'Mulai',
      endsPrefix: 'Akhir',
      immediate: 'Langsung',
      noExpiry: 'Tanpa akhir',
      alwaysValid: 'Berlaku terus',
      toggledNotice: (code, active) => `Voucher ${code} sekarang ${active ? 'AKTIF' : 'NONAKTIF'}.`,
      deletedNotice: (code) => `Voucher ${code} berhasil dihapus.`,
      savedEditNotice: (code) => `Perubahan voucher ${code} disimpan.`,
      savedCreateNotice: (code) => `Voucher baru ${code} dibuat.`,
      deleteDialogTitle: 'Hapus Voucher Permanen?',
      deleteDialogBody: (code) =>
        `Kode voucher ${code} belum pernah dipakai dan akan dihapus permanen.`,
      deleteConfirmBtn: 'Ya, Hapus',
      deletingBtn: 'Menghapus...',
    },
    voucherModal: {
      editTitle: (code) => `Edit Voucher ${code}`,
      createTitle: 'Buat Voucher Baru',
      templatePrompt: 'Buat voucher subsidi ongkir kargo?',
      templateBtn: 'Isi Template Subsidi Ongkir',
      templateDesc: 'Subsidi ongkos kirim kargo darat hingga Rp 150.000',
      codeLabel: 'Kode Voucher (Wajib)',
      codePlaceholder: 'Contoh: BRAKASA10',
      typeLabel: 'Tipe Potongan',
      typePercent: 'Persentase (%)',
      typeFixed: 'Nominal Tetap (IDR)',
      descLabel: 'Deskripsi Singkat',
      descPlaceholder: 'Contoh: Diskon 10% hingga Rp 500.000',
      valuePercentLabel: 'Persentase Diskon (%)',
      valueFixedLabel: 'Nilai Potongan (IDR)',
      maxDiscountLabel: 'Plafon Diskon (IDR, Opsional)',
      maxDiscountPlaceholder: 'Kosong = tanpa plafon',
      minSubtotalLabel: 'Min. Subtotal (IDR)',
      maxUsesLabel: 'Kuota Pemakaian (Opsional)',
      maxUsesPlaceholder: 'Kosong = tak terbatas',
      startsAtLabel: 'Mulai Berlaku (Opsional)',
      expiresAtLabel: 'Berakhir Pada (Opsional)',
      activeFlag: 'Voucher aktif di checkout',
      publicFlag: 'Tampilkan di daftar promo publik',
      saveEditBtn: 'Simpan Perubahan',
      saveCreateBtn: 'Buat Voucher',
      savingBtn: 'Menyimpan...',
      errCode: 'Kode voucher minimal 3 karakter (huruf, angka, _, atau -).',
      errValue: 'Nilai diskon harus berupa angka bulat positif.',
      errPercentMax: 'Persentase diskon maksimal 100%.',
      errMinSubtotal: 'Minimum subtotal harus 0 atau positif.',
      errMaxDiscount: 'Plafon diskon harus positif atau dikosongkan.',
      errMaxUses: 'Kuota pemakaian harus positif atau dikosongkan.',
      errDateRange: 'Waktu berakhir harus lebih lambat dari waktu mulai.',
      errSaveFallback: 'Gagal menyimpan voucher ke server.',
    },
    mediaPicker: {
      defaultTitle: 'Pilih Media dari Pustaka',
      searchLabel: 'Cari berkas atau URL',
      searchPlaceholder: 'Contoh: brk-ar-001, hero-scene, atau .mp4',
      uploadLabel: (limitText) => `Unggah berkas baru (${limitText})`,
      limitImage: 'maks 8 MB',
      limitVideo: 'maks 40 MB',
      limitAll: 'Gambar 8 MB / Video 40 MB',
      folderGroupAria: 'Filter folder media',
      folderAll: 'Semua Folder',
      folderProducts: 'Produk',
      folderHero: 'Hero',
      folderVideos: 'Video',
      folderUploads: 'Upload',
      typeGroupAria: 'Filter tipe media',
      typeAll: 'Semua Tipe',
      typeImage: 'Gambar',
      typeVideo: 'Video',
      uploadingStatus: 'Mengunggah berkas...',
      uploadSuccess: (filename) => `Berkas ${filename} berhasil diunggah.`,
      errUnsupportedExt: 'Format berkas tidak didukung. Gunakan JPG, PNG, WebP, MP4, atau WebM.',
      errImageOnly: 'Slot ini hanya menerima gambar (JPG, PNG, WebP).',
      errVideoOnly: 'Slot ini hanya menerima video (MP4, WebM).',
      errImageTooLarge: 'Ukuran gambar maksimal 8 MB.',
      errVideoTooLarge: 'Ukuran video maksimal 40 MB.',
      errUploadFallback: 'Gagal mengunggah berkas ke server.',
      errLoadFallback: 'Gagal memuat pustaka media dari server.',
      loadingLabel: 'Memuat pustaka media...',
      errorTitle: 'Gagal memuat pustaka media',
      emptyTitle: 'Tidak ada media yang cocok',
      emptyDesc: 'Ubah filter pencarian atau unggah berkas baru.',
      resetFilterBtn: 'Reset Filter',
      selectBtn: 'Pilih Media Ini',
    },
    settings: {
      docTitle: 'Pengaturan | Admin Brakasa',
      title: 'Pengaturan',
      lastSaved: 'Terakhir disimpan',
      reloadBtn: 'Muat Ulang',
      loadingLabel: 'Memuat pengaturan...',
      errorTitle: 'Gagal memuat pengaturan',
      errorFallback: 'Gagal memuat konfigurasi dari server.',
      tablistAria: 'Tab pengaturan',
      tabProfile: 'Profil Toko & Maps',
      tabHero: 'Hero Slider',
      tabShipping: 'Pengiriman & Inventori',
      profileHeading: 'Informasi Toko',
      storeNameLabel: 'Nama Toko',
      cityLabel: 'Kota',
      addressLabel: 'Alamat Lengkap',
      hoursIdLabel: 'Jam Operasional (ID)',
      hoursEnLabel: 'Jam Operasional (EN)',
      hoursEnPlaceholder: 'Monday - Saturday, 10:00 - 19:00 WIB',
      whatsappLabel: 'Nomor WhatsApp',
      emailLabel: 'Email Dukungan',
      mapsHeading: 'Google Maps',
      mapsEmbedLabel: 'URL Embed Google Maps (https://)',
      mapsEmbedPlaceholder: 'https://maps.google.com/maps?q=...&output=embed',
      mapsDirectionsLabel: 'URL Petunjuk Arah Google Maps (https://)',
      mapsDirectionsPlaceholder: 'https://maps.google.com/?q=...',
      mapsPreviewLabel: 'Pratinjau Peta',
      mapsIframeTitle: 'Pratinjau peta lokasi toko Brakasa Tactical',
      mapsInvalidWarning: 'URL embed harus diawali https:// agar pratinjau dapat ditampilkan.',
      heroHeading: (count) => `Slide Hero (${count} / 8)`,
      addSlideBtn: '+ Tambah Slide',
      slideLabel: (num) => `Slide ${num}`,
      moveSlideUpAria: (num) => `Pindahkan slide ${num} ke atas`,
      moveSlideDownAria: (num) => `Pindahkan slide ${num} ke bawah`,
      removeSlideAria: (num) => `Hapus slide ${num}`,
      choosePhotoBtn: 'Pilih / Unggah Foto',
      imageUrlLabel: 'URL Gambar',
      headlineIdLabel: 'Headline (ID)',
      headlineEnLabel: 'Headline (EN)',
      ctaLabelIdLabel: 'Label Tombol CTA (ID)',
      ctaLabelEnLabel: 'Label Tombol CTA (EN)',
      ctaUrlLabel: 'URL Tujuan CTA',
      ctaUrlPlaceholder: '/store',
      shippingDefaultsHeading: 'Packing Kayu & Ambang Stok',
      woodenFeeLabel: 'Biaya Packing Kayu (IDR)',
      lowStockDefaultLabel: 'Ambang Stok Rendah Default',
      zoneRatesHeading: 'Tarif Kargo per Zona Wilayah (IDR)',
      colZone: 'Zona',
      colRegularRate: 'Reguler / kg (IDR)',
      colCargoRate: 'Kargo Darat / kg (IDR)',
      colHazmatSurcharge: 'Tambahan Gas/Hazmat (IDR)',
      zoneRegularAria: (label) => `Tarif reguler per kg ${label}`,
      zoneCargoAria: (label) => `Tarif kargo darat per kg ${label}`,
      zoneHazmatAria: (label) => `Tambahan hazmat ${label}`,
      saveBtn: 'Simpan Pengaturan',
      savingBtn: 'Menyimpan...',
      saveSuccess: 'Pengaturan toko, Hero Slider, dan pengiriman berhasil disimpan.',
      saveErrorFallback: 'Gagal menyimpan pengaturan ke server.',
      errProfileRequired: 'Nama toko, alamat, kota, jam operasional, WhatsApp, dan email wajib diisi.',
      errMapsHttps: 'URL Google Maps harus menggunakan protokol https:// yang valid.',
      errSlidesRange: 'Hero Slider wajib memiliki minimal 1 slide dan maksimal 8 slide.',
      errSlideFields: (num) =>
        `Slide ${num} wajib memiliki gambar, headline (ID & EN), label CTA (ID & EN), dan URL CTA.`,
      pickerSlideImageTitle: (num) => `Pilih Foto untuk Slide ${num}`,
      newSlideHeadlineId: (num) => `SLIDE HERO ${num}`,
      newSlideHeadlineEn: (num) => `HERO SLIDE ${num}`,
      newSlideCtaId: 'Belanja Sekarang',
      newSlideCtaEn: 'Shop Now',
    },
    couriers: {
      JNE_REG: 'JNE Reguler',
      SICEPAT_REG: 'SiCepat Reguler',
      JNE_TRUCKING: 'JNE Trucking (JTR)',
      INDAH_CARGO: 'Indah Cargo Darat',
      DAKOTA_CARGO: 'Dakota Cargo Darat',
      HAZMAT_LAND_CARGO: 'Kargo Khusus Darat/Laut',
      ARMORY_PICKUP: 'Ambil di Toko',
    },
    payments: {
      VA_BCA: 'Virtual Account BCA',
      VA_MANDIRI: 'Virtual Account Mandiri',
      QRIS: 'QRIS',
      BANK_TRANSFER_ARMORY: 'Transfer Bank Manual',
    },
    mutationReasons: {
      INITIAL_SEED: 'Stok Awal',
      CHECKOUT_DEDUCT: 'Terjual Checkout',
      ORDER_CANCEL_RESTOCK: 'Batal Auto-Restock',
      MANUAL_RESTOCK: 'Restock Masuk',
      AUDIT_ADJUSTMENT: 'Koreksi Audit',
    },
    platforms: {
      M4_AR15: 'M4 / AR-15',
      AK_SERIES: 'AK Series',
      SMG_PDW: 'SMG / PDW',
      BOLT_ACTION: 'Bolt-Action Sniper',
      PISTOL_G_SERIES: 'Pistol G-Series',
      UNIVERSAL_MOLLE: 'Universal MOLLE / Rig',
      UNIVERSAL_PICATINNY: 'Universal Picatinny 1913',
      APPAREL_FOOTWEAR: 'Pakaian & Sepatu',
      CONSUMABLE: 'Konsumabel & Daya',
    },
    propulsions: {
      AEG: 'AEG (Automatic Electric Gun)',
      GBBR: 'GBBR (Gas Blowback Rifle)',
      GBB_PISTOL: 'GBB Pistol',
      CO2: 'CO2 12g',
      SPRING: 'Spring Bolt-Action',
      NON_REPLICA: 'Non-Unit (Gear / Optik / Konsumabel)',
    },
    productGroups: {
      primary: 'Unit Utama',
      sidearm: 'Pistol Sidearm',
      optic: 'Optik & Bidik',
      rig_protection: 'Rig & Proteksi',
      power_consumables: 'Daya & Konsumabel',
    },
    missions: {
      cqb: 'CQB Indoor (<= 350 FPS)',
      'woodland-recce': 'Woodland & Recce',
      speedqb: 'SpeedQB / Kompetisi',
      'rig-protection': 'Rig & Proteksi',
    },
    zones: {
      JABODETABEK: 'Jabodetabek',
      JAWA: 'Pulau Jawa',
      SUMATERA_BALI: 'Sumatera & Bali',
      KALIMANTAN_SULAWESI: 'Kalimantan & Sulawesi',
      INDONESIA_TIMUR: 'Indonesia Timur',
    },
  },
  en: {
    common: {
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      reset: 'Reset',
      reload: 'Reload',
      loading: 'Loading...',
      processing: 'Processing...',
      saving: 'Saving...',
      up: 'Up',
      down: 'Down',
      yes: 'Yes',
      no: 'No',
      noImage: 'NO IMG',
      dismissNotice: 'Dismiss',
      detail: 'Details',
      all: 'All',
      active: 'Active',
      inactive: 'Inactive',
      publicTag: 'PUBLIC',
      privateTag: 'PRIVATE',
      unit: 'units',
      items: 'items',
    },
    layout: {
      skipToContent: 'Skip to main content',
      mobileMenuBtn: 'Menu',
      closeMenuAria: 'Close admin navigation menu',
      mobileNavAria: 'Mobile admin navigation',
      sidebarAria: 'Admin sidebar',
      mainNavAria: 'Main admin navigation',
      collapseSidebarAria: 'Collapse navigation sidebar',
      expandSidebarAria: 'Expand navigation sidebar',
      collapseSidebarTitle: 'Collapse sidebar',
      expandSidebarTitle: 'Expand sidebar',
      adminTitle: 'Admin Panel',
      brandHomeAria: 'Brakasa Tactical Admin',
      roleSuperAdmin: 'Super Admin',
      roleOperations: 'Operations',
      viewStorefront: 'View Store',
      themeLightMode: 'Light Mode',
      themeDarkMode: 'Dark Mode',
      themeCurrentDark: 'Theme: Armory Dark',
      themeCurrentLight: 'Theme: Field Paper Light',
      themeToLightAria: 'Switch to Field Paper Light theme',
      themeToDarkAria: 'Switch to Armory Dark theme',
      langGroupAria: 'Select admin language',
      langToggleAria: 'Toggle Indonesian / English language',
      langIdLabel: 'Indonesia (ID)',
      langEnLabel: 'English (EN)',
      logout: 'Sign Out',
      loggingOut: 'Signing out...',
      logoutAria: 'Sign out from Admin Panel',
      navGroups: {
        operations: 'Operations',
        catalogWarehouse: 'Catalog & Warehouse',
        configuration: 'Configuration',
      },
      navItems: {
        dashboard: 'Overview',
        orders: 'Orders',
        products: 'Products & Media',
        inventory: 'Inventory',
        vouchers: 'Vouchers',
        settings: 'Settings',
      },
    },
    login: {
      docTitle: 'Admin Sign In | Brakasa Tactical',
      skipToForm: 'Skip to sign in form',
      backToStorefront: 'Back to Store',
      backShort: 'Store',
      heading: 'Admin Sign In',
      errorBadge: '[ERROR]',
      usernameLabel: 'Username or Email',
      usernamePlaceholder: 'Enter username or email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password',
      showPassword: 'Show',
      hidePassword: 'Hide',
      showPasswordAria: 'Show password',
      hidePasswordAria: 'Hide password',
      submit: 'Sign In',
      submitting: 'Verifying...',
      validationRequired: 'Enter your username or email along with your password.',
      errorRateLimit: 'Too many failed sign-in attempts. Wait 15 minutes before trying again.',
      errorUnauthorized: 'Incorrect username, email, or password.',
      errorNetwork: 'Connection to the authentication server failed. Please try again.',
    },
    dashboard: {
      docTitle: 'Dashboard | Brakasa Admin',
      title: 'Dashboard',
      syncedAt: 'Synced',
      allOrders: 'All Orders',
      reloadData: 'Reload',
      loadingLabel: 'Loading operational overview...',
      errorTitle: 'Failed to load dashboard',
      errorFallback: 'Failed to load operational overview from server.',
      priorityLabel: 'Priority',
      priorityOrders: 'Orders Requiring Action',
      priorityCriticalStock: 'Low / Out of Stock SKUs',
      queueHeading: (count) => `Action Queue (${count})`,
      manageOrders: 'Manage Orders',
      queueEmptyTitle: 'No orders awaiting action',
      queueEmptyDesc: 'All incoming orders have been processed.',
      openOrderDetail: 'Open Details',
      colInvoiceTime: 'Invoice & Date',
      colCustomer: 'Customer',
      colTotalShipping: 'Total & Shipping',
      colStatus: 'Status',
      colNextAction: 'Action',
      woodenCratedShort: ' + Crate',
      criticalStockHeading: (count) => `Critical Stock (${count})`,
      inventoryLedgerLink: 'Inventory Ledger',
      criticalEmptyTitle: 'All SKU stock levels are healthy',
      criticalEmptyDesc: 'No active products are currently low or out of stock.',
      stockOutBadge: '[OUT]',
      stockLowBadge: '[LOW]',
      stockRemaining: 'Stock',
      minShort: 'Min.',
      quickRestock: 'Restock',
      metricsHeading: 'Metrics Summary',
      kpiConfirmedRevenue: 'Confirmed Revenue',
      kpiPendingRevenue: 'Pending payment',
      kpiTotalOrders: 'Total Orders',
      kpiActionRequired: (count) => `Needs action: ${count}`,
      kpiActiveCatalog: 'Active Catalog',
      kpiWithVideo: (count) => `Demo video: ${count} SKUs`,
      kpiInventoryValue: 'Active Inventory Value',
      kpiLowOutSummary: (low, out) => `Low: ${low} | Out: ${out}`,
      statusBreakdownHeading: 'Order Status Breakdown',
      recentMutationsHeading: (count) => `Recent Stock Mutations (${count})`,
      viewFullLedger: 'View All',
      mutationsEmptyTitle: 'No stock mutations yet',
      mutationsEmptyDesc: 'Stock changes are logged automatically on orders and adjustments.',
      colTime: 'Time',
      colSkuProduct: 'SKU & Product',
      colMutation: 'Change',
      colReasonNote: 'Reason & Note',
      colActor: 'Actor',
      restockNotice: (sku, before, after) =>
        `Stock for ${sku} updated from ${before} to ${after} units.`,
      orderUpdatedNotice: (invoice, statusLabel) =>
        `Order ${invoice} updated to ${statusLabel}.`,
      nextActionVerify: 'Verify Payment',
      nextActionPack: 'Mark Packed',
      nextActionShip: 'Add Tracking',
    },
    orders: {
      docTitle: 'Orders | Brakasa Admin',
      title: 'Orders',
      reloadBtn: 'Reload',
      filterSectionAria: 'Order filters and search',
      statusGroupAria: 'Order status filter',
      searchLabel: 'Search Invoice, Customer, Email, or Phone',
      searchPlaceholder: 'Example: BRK-20260410 or customer name',
      showAllOrders: 'Show All',
      loadingLabel: 'Loading orders...',
      errorTitle: 'Failed to load orders',
      errorFallback: 'Failed to load orders from server.',
      emptyStatusTitle: (statusLabel) => `No orders with status ${statusLabel}`,
      emptyDefaultTitle: 'No orders found',
      emptyFilteredDesc: 'Adjust your search query or select the All tab.',
      emptyDefaultDesc: 'Orders placed from the storefront will appear here.',
      trackingPrefix: 'Tracking',
      inspectDetail: 'View Details',
      colInvoiceTime: 'Invoice & Date',
      colCustomer: 'Customer',
      colShippingTracking: 'Shipping & Tracking',
      colTotal: 'Total',
      colStatus: 'Status',
      colActions: 'Actions',
      woodenPackingTag: ' | Wooden Crate',
      stockRestoredTag: 'Stock restored',
      quickVerify: 'Verify Payment',
      quickPack: 'Mark Packed',
      quickShip: 'Add Tracking',
      quickComplete: 'Complete',
      cancelledNotice: (invoice, count) =>
        `Order ${invoice} cancelled and ${count} line item(s) restored to stock.`,
      updatedNotice: (invoice, statusLabel) =>
        `Order ${invoice} updated to ${statusLabel}.`,
    },
    orderDrawer: {
      fallbackTitle: (id) => `Order #${id}`,
      copyInvoice: 'Copy Invoice',
      invoiceCopied: 'Invoice Copied',
      loadingLabel: 'Loading order details...',
      errorTitle: 'Failed to load order details',
      errorFallback: 'Failed to retrieve order details from server.',
      actionsHeading: 'Status Actions',
      receivedAt: 'Created',
      finalStatusText: (statusLabel) => `This order is in a final state (${statusLabel}).`,
      cancelReasonLabel: 'Cancellation reason',
      restockStatusLabel: 'Stock restoration',
      restockedYes: 'RESTORED TO INVENTORY',
      restockedNo: 'NOT RESTORED',
      cancelOrderBtn: 'Cancel Order',
      courierLabel: 'Shipping Courier (Required)',
      trackingLabel: 'Tracking Number (Required)',
      trackingPlaceholder: 'Example: JTR-202604-88912',
      cancelWarnTitle: 'Cancellation & Automatic Restock',
      cancelWarnBody:
        'Order cancellation cannot be undone. All item quantities will be automatically restored to stock.',
      cancelReasonInputLabel: 'Cancellation Reason (Required, min 5 characters)',
      cancelReasonPlaceholder: 'Example: Payment deadline expired or customer requested cancellation',
      cancelConfirmText: (invoice) =>
        `I confirm cancelling order ${invoice} and automatically restoring item stock.`,
      noteLabel: 'Operational Note (Optional)',
      notePlaceholderVerify: 'Example: BCA VA payment verified',
      notePlaceholderPack: 'Example: Items inspected and packed securely',
      notePlaceholderDefault: 'Additional note for status log',
      submittingStatus: 'Processing...',
      validationTracking: 'Enter a valid tracking number (at least 5 characters).',
      validationCancelReason: 'Provide a cancellation reason of at least 5 characters.',
      validationCancelConfirm: 'Check the cancellation confirmation box first.',
      updateErrorFallback: 'Failed to update order status.',
      cancelledSuccess: (invoice, count) =>
        `Order ${invoice} cancelled. ${count} item line(s) restored to inventory.`,
      updatedSuccess: (invoice, statusLabel) =>
        `Order ${invoice} status updated to ${statusLabel}.`,
      shippingHeading: 'Recipient & Shipping',
      recipientName: 'Recipient Name',
      contact: 'Contact',
      shippingAddress: 'Shipping Address',
      districtPrefix: 'Dist.',
      shippingClassCourier: 'Courier & Shipping Class',
      woodenAndPayment: 'Wooden Crating & Payment',
      woodenPackingLabel: 'Wooden Crate',
      paymentLabel: 'Payment',
      recordedTracking: 'Tracking Number',
      copyTracking: 'Copy Tracking',
      trackingCopied: 'Tracking Copied',
      buyerNotes: 'Customer Notes',
      itemsHeading: (count) => `Order Items (${count} SKUs)`,
      subtotalItems: 'Items Subtotal',
      voucherDiscount: 'Voucher Discount',
      shippingCost: 'Shipping Cost',
      woodenPackingCost: 'Wooden Crating',
      grandTotal: 'Grand Total',
      timelineHeading: (count) => `Status History (${count})`,
      actorPrefix: 'Actor',
      ctaPaidVerified: 'Verify Payment',
      ctaPacked: 'Mark as Packed',
      ctaShipped: 'Save Tracking & Ship',
      ctaCompleted: 'Mark as Completed',
      ctaCancelled: 'Cancel & Restore Stock',
    },
    products: {
      docTitle: 'Products | Brakasa Admin',
      title: 'Products & Media',
      addNew: 'Add Product',
      filterSectionAria: 'Filter product list',
      searchLabel: 'Search SKU, Name, or Brand',
      searchPlaceholder: 'Example: BRK-AR-002 or VFC',
      categoryLabel: 'Category',
      allCategories: 'All Categories',
      statusLabel: 'Status',
      allStatuses: 'All Statuses',
      statusActive: 'Active',
      statusInactive: 'Inactive / Archived',
      stockLabel: 'Stock',
      allStocks: 'All Stock Levels',
      stockSafe: 'In Stock',
      stockLow: 'Low Stock',
      stockOut: 'Out of Stock (0)',
      onlyWithVideo: 'Only products with demo video (.mp4)',
      showingCount: (count) => `${count} SKUs`,
      resetFilter: 'Reset Filters',
      resetAllFilters: 'Reset All Filters',
      loadingLabel: 'Loading products...',
      errorTitle: 'Failed to load products',
      errorFallback: 'Failed to load product list from server.',
      emptyFilteredTitle: 'No matching products',
      emptyDefaultTitle: 'No products yet',
      emptyFilteredDesc: 'Try adjusting your search query or filters.',
      emptyDefaultDesc: 'Add your first product to build the catalog.',
      stockBtn: 'Stock',
      colProductSku: 'Product & SKU',
      colCategorySpecs: 'Category & Specs',
      colPriceWeight: 'Price & Weight',
      colStock: 'Stock',
      colMediaStatus: 'Media & Status',
      colActions: 'Actions',
      stockSummaryMobile: (qty, min) => `Stock: ${qty} / Min ${min}`,
      mediaCountShort: (count) => `${count} media`,
      assetsCountShort: (count) => `${count} assets`,
      videoBadge: 'VIDEO',
      activeBadge: 'ACTIVE',
      inactiveBadge: 'INACTIVE',
      savedEditNotice: (sku, name) => `Changes to ${sku} (${name}) saved.`,
      savedCreateNotice: (sku, name) => `New product ${sku} (${name}) added.`,
      archivedNotice: (sku) => `Product ${sku} was archived because it has order or stock history.`,
      deletedNotice: (sku) => `Product ${sku} was permanently deleted.`,
      deleteErrorFallback: 'Failed to delete or archive product.',
      deleteDialogTitle: 'Delete or Archive Product?',
      deleteDialogBody: (name) =>
        `${name} will be permanently deleted if it has no order or stock history, or archived otherwise.`,
      deleteConfirmBtn: 'Yes, Delete / Archive',
    },
    productModal: {
      editTitle: (name) => `Edit Product: ${name}`,
      createTitle: 'Add New Product',
      tablistAria: 'Product editor sections',
      tabBasic: 'Basic Info',
      tabSpecs: 'Specifications',
      tabMedia: 'Media',
      skuLabel: 'SKU Code (Required)',
      skuPlaceholder: 'BRK-AR-004',
      nameLabel: 'Product Name (Required)',
      namePlaceholder: 'Example: VFC Avalon Saber Carbine M-LOK AEG',
      slugLabel: 'URL Slug (Required)',
      slugPlaceholder: 'vfc-avalon-saber-carbine',
      brandLabel: 'Brand (Required)',
      brandPlaceholder: 'Example: Tokyo Marui, VFC, Vector Optics',
      categoryLabel: 'Category',
      priceLabel: 'Price (IDR)',
      weightLabel: 'Weight (grams)',
      currentStockLabel: 'Current Stock',
      adjustStockLink: 'Adjust Stock',
      initialStockLabel: 'Initial Stock',
      lowStockThresholdLabel: 'Low Stock Threshold',
      propulsionLabel: 'Propulsion',
      platformLabel: 'Platform',
      productGroupLabel: 'Product Group',
      shippingClassLabel: 'Shipping Class',
      playstyleTagsLabel: 'Playstyle Tags',
      featuredFlag: 'Show in Featured Products',
      activeFlag: 'Active in Storefront',
      shortDescLabel: 'Short Summary',
      shortDescPlaceholder: 'One-line technical summary of the product',
      fullDescLabel: 'Full Description',
      fullDescPlaceholder: 'Describe build quality, field performance, and product details...',
      backToGuidedForm: 'Guided Form',
      advancedJsonMode: 'JSON Editor Mode',
      rawSpecsLabel: 'Technical Specs JSON (specs_json)',
      rawCompatLabel: 'Compatibility JSON (compatibility_tags_json)',
      applyJsonBtn: 'Apply JSON to Form',
      rawJsonError: 'Invalid JSON format. Check quotes, commas, and braces.',
      techSpecsHeading: 'Technical Specifications',
      fpsMinLabel: 'Minimum FPS (@0.20g)',
      fpsMinPlaceholder: 'Leave empty if non-unit',
      fpsMaxLabel: 'Maximum FPS (@0.20g)',
      fpsMaxPlaceholder: 'Example: 380',
      energyJouleLabel: 'Kinetic Energy (Joule)',
      energyJoulePlaceholder: 'Example: 1.35',
      fieldRoleLabel: 'Field FPS Class',
      notSpecified: 'Not specified',
      materialLabel: 'Material',
      materialPlaceholder: 'CNC 6061-T6 Aluminum / Cordura 500D',
      gearboxLabel: 'Gearbox / System',
      gearboxPlaceholder: 'Gearbox V2 ECS / ZET System',
      connectorLabel: 'Battery Connector',
      mosfetLabel: 'MOSFET / ETU',
      notApplicable: 'Not applicable',
      mosfetYes: 'Yes (MOSFET/ETU)',
      mosfetNo: 'No (Non-MOSFET)',
      muzzleThreadLabel: 'Muzzle Thread',
      gasTypeLabel: 'Gas Type',
      corduraLabel: 'Fabric Denier',
      magCapacityLabel: 'Magazine Capacity (rds)',
      hopUpLabel: 'Hop-Up',
      hopUpPlaceholder: 'Adjustable Rotary Hop-Up',
      innerBarrelLabel: 'Inner Barrel',
      innerBarrelPlaceholder: '380 mm / 6.03 mm',
      fireModesLabel: 'Fire Modes (comma-separated)',
      fireModesPlaceholder: 'Safe, Semi, Full-Auto',
      bbWeightRecLabel: 'Recommended BB Weight',
      bbWeightRecPlaceholder: '0.25g - 0.28g',
      railSystemLabel: 'Rail / Mounting System',
      inTheBoxLabel: 'In the Box (1 item per line)',
      inTheBoxPlaceholder: '1x Unit\n1x Mid-Cap Magazine',
      requiredOperateLabel: 'Required to Operate (1 item per line)',
      requiredOperatePlaceholder: '11.1V LiPo Battery Deans\nSmart Balance Charger\n6mm 0.28g BBs',
      compatHeading: 'Product Compatibility',
      reqPowerLabel: 'Required Power',
      provPowerLabel: 'Provided Power',
      compatConnectorLabel: 'Compatibility Connector',
      supports11vLabel: '11.1V LiPo Support',
      supports11vYes: 'Supports 11.1V',
      supports11vNo: 'Does not support 11.1V',
      compatMuzzleLabel: 'Unit Muzzle Thread',
      reqRailLabel: 'Required Rail',
      noRailNeeded: 'No rail required',
      magFamilyLabel: 'Magazine Family',
      opticClassLabel: 'Optic Class',
      notOptic: 'Not an optic',
      providesRailsLabel: 'Provided Rails',
      batteryFormFactorsLabel: 'Battery Form Factors',
      placardInterfaceFlag: 'Supports SwiftClip / Velcro Front Placard',
      arcRailFlag: 'Compatible with Side ARC Helmet Rail',
      compatSkusLabel: 'Related Product SKUs (comma-separated)',
      compatSkusPlaceholder: 'BRK-CSM-003, BRK-OPT-001, BRK-UPG-001',
      uploadMediaLabel: 'Upload Photo or Video (.jpg, .png, .webp max 8 MB / .mp4, .webm max 40 MB)',
      pickPhotoBtn: 'Choose Photo from Library',
      pickVideoBtn: 'Choose Video (.mp4)',
      uploadingMedia: 'Uploading media...',
      uploadTypeError: 'File format must be JPG, PNG, WebP, MP4, or WebM.',
      uploadErrorFallback: 'Failed to upload media file.',
      emptyMediaTitle: 'No media attached',
      emptyMediaDesc: 'Add at least 1 primary product photo for catalog and product detail display.',
      mediaVideoBadge: 'VIDEO',
      mediaPrimaryBadge: 'PRIMARY',
      mediaPhotoBadge: (num) => `PHOTO #${num}`,
      setPrimaryBtn: 'Set Primary',
      moveMediaUpAria: (num) => `Move media ${num} up`,
      moveMediaDownAria: (num) => `Move media ${num} down`,
      altTextLabel: 'Alt Text',
      durationLabel: 'Video Duration (sec)',
      posterUrlLabel: 'Video Poster URL (Optional)',
      pickPosterBtn: 'Choose Poster',
      saveEditBtn: 'Save Changes',
      saveCreateBtn: 'Create Product',
      savingBtn: 'Saving...',
      pickerVideoTitle: 'Choose Product Video',
      pickerPosterTitle: 'Choose Video Poster Image',
      pickerPhotoTitle: 'Choose Product Photo',
      errRequiredFields: 'SKU, Slug, Product Name, and Brand are required.',
      errInvalidSlug: 'URL slug may only contain lowercase letters, numbers, and hyphens.',
      errInvalidPrice: 'Price (IDR) must be a non-negative integer.',
      errInvalidWeight: 'Weight (grams) must be a non-negative integer.',
      errInvalidThreshold: 'Low stock threshold must be a non-negative integer.',
      errInvalidJson: 'Specifications or compatibility JSON is invalid.',
      errInvalidJoule: 'Kinetic energy (Joule) must be between 0 and 2.0 Joules.',
      errSaveFallback: 'Failed to save product to server.',
    },
    inventory: {
      docTitle: 'Inventory | Brakasa Admin',
      title: 'Inventory',
      reloadBtn: 'Reload',
      kpiTotalValue: 'Total Inventory Value',
      kpiSafeSku: 'Healthy Stock SKUs',
      kpiLowSku: 'Low Stock SKUs',
      kpiOutSku: 'Out of Stock SKUs',
      tablistAria: 'Inventory views',
      tabPositions: 'Stock Levels',
      tabLedger: 'Mutation History',
      loadingLabel: 'Loading inventory...',
      errorTitle: 'Failed to load inventory',
      errorFallback: 'Failed to load inventory data from server.',
      searchLabel: 'Search SKU or Product Name',
      searchPlaceholder: 'Example: BRK-AR-001 or Green Gas',
      stockFilterLabel: 'Stock Status',
      allStockStatuses: 'All Statuses',
      statusOut: 'Out of Stock (0)',
      statusLow: 'Low Stock',
      statusSafe: 'In Stock',
      resetFilter: 'Reset Filters',
      emptyPositionsTitle: 'No matching SKUs',
      emptyPositionsDesc: 'Reset search or adjust the stock status filter.',
      resetInventoryFilter: 'Reset Filters',
      badgeOut: '[OUT]',
      badgeLow: '[LOW]',
      badgeSafe: '[OK]',
      mobileStockMin: 'STOCK / MIN',
      mobileAssetValue: 'ASSET VALUE',
      btnRestock: '+ Restock',
      btnAudit: '+/- Adjust',
      btnHistory: 'History',
      colSkuProduct: 'SKU & Product',
      colStockMin: 'Stock / Min.',
      colPriceValue: 'Price & Value',
      colLastMutation: 'Last Mutation',
      colActions: 'Actions',
      notRecorded: 'Not recorded',
      reasonFilterLabel: 'Mutation Reason',
      allReasons: 'All Reasons',
      productFilterLabel: 'Product',
      allProducts: 'All Products',
      resetLedgerFilter: 'Reset Filters',
      filteredForSku: (sku, name) => `Mutation history for ${sku} (${name})`,
      showAllSkus: 'Show All SKUs',
      emptyLedgerTitle: 'No stock mutations found',
      emptyLedgerDesc: 'Mutations are logged automatically on checkout, restock, or audit adjustment.',
      colTime: 'Time',
      colDelta: 'Delta',
      colBeforeAfter: 'Before -> After',
      colTypeRef: 'Type & Reference',
      colNote: 'Note',
      colActor: 'Actor',
      refPrefix: 'Ref',
      noNote: 'No note',
      adjustNotice: (sku, delta, before, after) =>
        `Mutation recorded for ${sku} (${delta}): stock changed from ${before} to ${after} units.`,
    },
    stockModal: {
      title: 'Stock Adjustment',
      mutationTypeLegend: 'Mutation Type',
      restockOption: 'Inbound Restock (+)',
      auditOption: 'Audit Adjustment (+/-)',
      directionLegend: 'Adjustment Direction',
      addBtn: 'Add (+)',
      subtractBtn: 'Subtract (-)',
      qtyAddLabel: 'Quantity to Add',
      qtySubtractLabel: 'Quantity to Subtract',
      previewCurrent: 'Current',
      previewDelta: 'Delta',
      previewFinal: 'Final Stock',
      negativeWarn: 'Final stock cannot be less than 0.',
      refLabel: 'PO / Batch Reference (Optional)',
      refPlaceholder: 'Example: PO-2026-041',
      noteLabel: 'Mutation Note (Required)',
      notePlaceholderRestock: 'Example: Inbound stock batch from supplier',
      notePlaceholderAudit: 'Example: Physical warehouse count adjustment',
      submitRestock: 'Save Restock',
      submitAudit: 'Save Adjustment',
      submitting: 'Saving...',
      errInvalidQty: 'Quantity must be a positive integer.',
      errNegativeStock: (qty, current) =>
        `Subtracting ${qty} unit(s) exceeds available stock (${current}).`,
      errNoteMin: 'Enter a mutation note of at least 3 characters.',
      errSaveFallback: 'Failed to save stock adjustment.',
    },
    vouchers: {
      docTitle: 'Vouchers | Brakasa Admin',
      title: 'Vouchers & Promos',
      createBtn: 'Create Voucher',
      loadingLabel: 'Loading vouchers...',
      errorTitle: 'Failed to load vouchers',
      errorFallback: 'Failed to load vouchers from server.',
      toggleErrorFallback: 'Failed to toggle voucher active status.',
      deleteErrorFallback: 'Failed to delete voucher.',
      emptyTitle: 'No vouchers registered',
      emptyDesc: 'Create a percentage or fixed amount promo code.',
      noDescription: 'No description',
      activeBadge: '[ACTIVE]',
      inactiveBadge: '[INACTIVE]',
      mobileDiscountValue: 'DISCOUNT',
      mobileUsedQuota: 'USED / QUOTA',
      mobileMinSubtotal: 'MIN. SUBTOTAL',
      mobileVisibility: 'VISIBILITY',
      unlimited: 'Unlimited',
      visibilityPublic: 'Public',
      visibilityPrivate: 'Private',
      deactivate: 'Deactivate',
      activate: 'Activate',
      usedTooltip: (count) => `Already used ${count} time(s); use Deactivate instead.`,
      deleteTooltip: (code) => `Delete voucher ${code}`,
      colCodeDesc: 'Code & Description',
      colDiscount: 'Discount',
      colMinSpend: 'Min. Spend',
      colUsage: 'Usage',
      colValidity: 'Validity',
      colStatus: 'Status',
      colActions: 'Actions',
      maxCap: (amount) => `Max ${amount}`,
      noCap: 'No cap',
      fixedDiscount: 'Fixed Amount',
      startsPrefix: 'Starts',
      endsPrefix: 'Ends',
      immediate: 'Immediate',
      noExpiry: 'No expiry',
      alwaysValid: 'Always valid',
      toggledNotice: (code, active) => `Voucher ${code} is now ${active ? 'ACTIVE' : 'INACTIVE'}.`,
      deletedNotice: (code) => `Voucher ${code} deleted.`,
      savedEditNotice: (code) => `Changes to voucher ${code} saved.`,
      savedCreateNotice: (code) => `New voucher ${code} created.`,
      deleteDialogTitle: 'Delete Voucher Permanently?',
      deleteDialogBody: (code) =>
        `Voucher code ${code} has not been used on any order and will be permanently deleted.`,
      deleteConfirmBtn: 'Yes, Delete',
      deletingBtn: 'Deleting...',
    },
    voucherModal: {
      editTitle: (code) => `Edit Voucher ${code}`,
      createTitle: 'Create New Voucher',
      templatePrompt: 'Create a land cargo shipping subsidy voucher?',
      templateBtn: 'Apply Cargo Subsidy Template',
      templateDesc: 'Land cargo shipping subsidy up to Rp 150,000',
      codeLabel: 'Voucher Code (Required)',
      codePlaceholder: 'Example: BRAKASA10',
      typeLabel: 'Discount Type',
      typePercent: 'Percentage (%)',
      typeFixed: 'Fixed Amount (IDR)',
      descLabel: 'Short Description',
      descPlaceholder: 'Example: 10% off up to Rp 500,000',
      valuePercentLabel: 'Discount Percentage (%)',
      valueFixedLabel: 'Discount Amount (IDR)',
      maxDiscountLabel: 'Max Discount Cap (IDR, Optional)',
      maxDiscountPlaceholder: 'Empty = no cap',
      minSubtotalLabel: 'Min. Subtotal (IDR)',
      maxUsesLabel: 'Usage Limit (Optional)',
      maxUsesPlaceholder: 'Empty = unlimited',
      startsAtLabel: 'Starts At (Optional)',
      expiresAtLabel: 'Expires At (Optional)',
      activeFlag: 'Active at checkout',
      publicFlag: 'Show in public promo list',
      saveEditBtn: 'Save Changes',
      saveCreateBtn: 'Create Voucher',
      savingBtn: 'Saving...',
      errCode: 'Voucher code must be at least 3 characters (letters, numbers, _, or -).',
      errValue: 'Discount value must be a positive integer.',
      errPercentMax: 'Percentage discount cannot exceed 100%.',
      errMinSubtotal: 'Minimum subtotal must be 0 or positive.',
      errMaxDiscount: 'Max discount must be positive or empty.',
      errMaxUses: 'Usage limit must be positive or empty.',
      errDateRange: 'Expiration time must be later than start time.',
      errSaveFallback: 'Failed to save voucher to server.',
    },
    mediaPicker: {
      defaultTitle: 'Choose Media from Library',
      searchLabel: 'Search filename or URL',
      searchPlaceholder: 'Example: brk-ar-001, hero-scene, or .mp4',
      uploadLabel: (limitText) => `Upload new file (${limitText})`,
      limitImage: 'max 8 MB',
      limitVideo: 'max 40 MB',
      limitAll: 'Image 8 MB / Video 40 MB',
      folderGroupAria: 'Filter media folder',
      folderAll: 'All Folders',
      folderProducts: 'Products',
      folderHero: 'Hero',
      folderVideos: 'Videos',
      folderUploads: 'Uploads',
      typeGroupAria: 'Filter media type',
      typeAll: 'All Types',
      typeImage: 'Images',
      typeVideo: 'Videos',
      uploadingStatus: 'Uploading file...',
      uploadSuccess: (filename) => `File ${filename} uploaded successfully.`,
      errUnsupportedExt: 'Unsupported file format. Use JPG, PNG, WebP, MP4, or WebM.',
      errImageOnly: 'This slot only accepts image files (JPG, PNG, WebP).',
      errVideoOnly: 'This slot only accepts video files (MP4, WebM).',
      errImageTooLarge: 'Image file size must be 8 MB or less.',
      errVideoTooLarge: 'Video file size must be 40 MB or less.',
      errUploadFallback: 'Failed to upload media file.',
      errLoadFallback: 'Failed to load media library from server.',
      loadingLabel: 'Loading media library...',
      errorTitle: 'Failed to load media library',
      emptyTitle: 'No matching media files',
      emptyDesc: 'Adjust your filters or upload a new file above.',
      resetFilterBtn: 'Reset Filters',
      selectBtn: 'Select Media',
    },
    settings: {
      docTitle: 'Settings | Brakasa Admin',
      title: 'Settings',
      lastSaved: 'Last saved',
      reloadBtn: 'Reload',
      loadingLabel: 'Loading settings...',
      errorTitle: 'Failed to load settings',
      errorFallback: 'Failed to load configuration from server.',
      tablistAria: 'Settings tabs',
      tabProfile: 'Store Profile & Maps',
      tabHero: 'Hero Slider',
      tabShipping: 'Shipping & Inventory',
      profileHeading: 'Store Information',
      storeNameLabel: 'Store Name',
      cityLabel: 'City',
      addressLabel: 'Full Address',
      hoursIdLabel: 'Operating Hours (ID)',
      hoursEnLabel: 'Operating Hours (EN)',
      hoursEnPlaceholder: 'Monday - Saturday, 10:00 - 19:00 WIB',
      whatsappLabel: 'WhatsApp Number',
      emailLabel: 'Support Email',
      mapsHeading: 'Google Maps',
      mapsEmbedLabel: 'Google Maps Embed URL (https://)',
      mapsEmbedPlaceholder: 'https://maps.google.com/maps?q=...&output=embed',
      mapsDirectionsLabel: 'Google Maps Directions URL (https://)',
      mapsDirectionsPlaceholder: 'https://maps.google.com/?q=...',
      mapsPreviewLabel: 'Map Preview',
      mapsIframeTitle: 'Brakasa Tactical store location map preview',
      mapsInvalidWarning: 'Embed URL must start with https:// to display the preview.',
      heroHeading: (count) => `Hero Slides (${count} / 8)`,
      addSlideBtn: '+ Add Slide',
      slideLabel: (num) => `Slide ${num}`,
      moveSlideUpAria: (num) => `Move slide ${num} up`,
      moveSlideDownAria: (num) => `Move slide ${num} down`,
      removeSlideAria: (num) => `Remove slide ${num}`,
      choosePhotoBtn: 'Choose / Upload Photo',
      imageUrlLabel: 'Image URL',
      headlineIdLabel: 'Headline (ID)',
      headlineEnLabel: 'Headline (EN)',
      ctaLabelIdLabel: 'CTA Label (ID)',
      ctaLabelEnLabel: 'CTA Label (EN)',
      ctaUrlLabel: 'CTA URL',
      ctaUrlPlaceholder: '/store',
      shippingDefaultsHeading: 'Wooden Crating & Stock Threshold',
      woodenFeeLabel: 'Wooden Crating Fee (IDR)',
      lowStockDefaultLabel: 'Default Low Stock Threshold',
      zoneRatesHeading: 'Regional Cargo Rates (IDR)',
      colZone: 'Zone',
      colRegularRate: 'Regular / kg (IDR)',
      colCargoRate: 'Land Cargo / kg (IDR)',
      colHazmatSurcharge: 'Gas/Hazmat Surcharge (IDR)',
      zoneRegularAria: (label) => `Regular rate per kg for ${label}`,
      zoneCargoAria: (label) => `Land cargo rate per kg for ${label}`,
      zoneHazmatAria: (label) => `Hazmat surcharge for ${label}`,
      saveBtn: 'Save Settings',
      savingBtn: 'Saving...',
      saveSuccess: 'Store profile, Hero Slider, and shipping settings saved.',
      saveErrorFallback: 'Failed to save settings to server.',
      errProfileRequired: 'Store name, address, city, operating hours, WhatsApp, and email are required.',
      errMapsHttps: 'Google Maps URLs must use a valid https:// protocol.',
      errSlidesRange: 'Hero Slider must have between 1 and 8 slides.',
      errSlideFields: (num) =>
        `Slide ${num} requires an image, headlines (ID & EN), CTA labels (ID & EN), and CTA URL.`,
      pickerSlideImageTitle: (num) => `Choose Photo for Slide ${num}`,
      newSlideHeadlineId: (num) => `SLIDE HERO ${num}`,
      newSlideHeadlineEn: (num) => `HERO SLIDE ${num}`,
      newSlideCtaId: 'Belanja Sekarang',
      newSlideCtaEn: 'Shop Now',
    },
    couriers: {
      JNE_REG: 'JNE Regular',
      SICEPAT_REG: 'SiCepat Regular',
      JNE_TRUCKING: 'JNE Trucking (JTR)',
      INDAH_CARGO: 'Indah Land Cargo',
      DAKOTA_CARGO: 'Dakota Land Cargo',
      HAZMAT_LAND_CARGO: 'Specialized Land/Sea Cargo',
      ARMORY_PICKUP: 'Store Pickup',
    },
    payments: {
      VA_BCA: 'BCA Virtual Account',
      VA_MANDIRI: 'Mandiri Virtual Account',
      QRIS: 'QRIS',
      BANK_TRANSFER_ARMORY: 'Manual Bank Transfer',
    },
    mutationReasons: {
      INITIAL_SEED: 'Initial Stock',
      CHECKOUT_DEDUCT: 'Checkout Sale',
      ORDER_CANCEL_RESTOCK: 'Cancel Auto-Restock',
      MANUAL_RESTOCK: 'Inbound Restock',
      AUDIT_ADJUSTMENT: 'Audit Adjustment',
    },
    platforms: {
      M4_AR15: 'M4 / AR-15',
      AK_SERIES: 'AK Series',
      SMG_PDW: 'SMG / PDW',
      BOLT_ACTION: 'Bolt-Action Sniper',
      PISTOL_G_SERIES: 'G-Series Pistol',
      UNIVERSAL_MOLLE: 'Universal MOLLE / Rig',
      UNIVERSAL_PICATINNY: 'Universal Picatinny 1913',
      APPAREL_FOOTWEAR: 'Apparel & Footwear',
      CONSUMABLE: 'Consumables & Power',
    },
    propulsions: {
      AEG: 'AEG (Automatic Electric Gun)',
      GBBR: 'GBBR (Gas Blowback Rifle)',
      GBB_PISTOL: 'GBB Pistol',
      CO2: 'CO2 12g',
      SPRING: 'Spring Bolt-Action',
      NON_REPLICA: 'Non-Unit (Gear / Optics / Consumables)',
    },
    productGroups: {
      primary: 'Primary Unit',
      sidearm: 'Sidearm Pistol',
      optic: 'Optics & Aiming',
      rig_protection: 'Rig & Protection',
      power_consumables: 'Power & Consumables',
    },
    missions: {
      cqb: 'Indoor CQB (<= 350 FPS)',
      'woodland-recce': 'Woodland & Recce',
      speedqb: 'SpeedQB / Competition',
      'rig-protection': 'Rig & Protection',
    },
    zones: {
      JABODETABEK: 'Greater Jakarta (Jabodetabek)',
      JAWA: 'Java Island',
      SUMATERA_BALI: 'Sumatra & Bali',
      KALIMANTAN_SULAWESI: 'Kalimantan & Sulawesi',
      INDONESIA_TIMUR: 'Eastern Indonesia',
    },
  },
};

export function getAdminCopy(lang: Language): AdminDictionary {
  return ADMIN_DICTIONARIES[lang];
}
