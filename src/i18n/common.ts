export type Language = 'id' | 'en';

export interface HeroSlideItem {
  id: string;
  imageUrl: string;
  altId: string;
  altEn: string;
  headlineId: string;
  headlineEn: string;
  ctaLabelId: string;
  ctaLabelEn: string;
  ctaUrl: string;
  sortOrder: number;
}

export const DEFAULT_HERO_SLIDES: readonly HeroSlideItem[] = [
  {
    id: 'hero-slide-01',
    imageUrl: '/media/images/hero/hero-scene-01.jpg',
    altId: 'Operator dengan unit airsoft taktis di ruang armory Brakasa',
    altEn: 'Operator with tactical airsoft rifle at Brakasa armory',
    headlineId: 'PRESISI ARMORY LAPANGAN',
    headlineEn: 'FIELD ARMORY PRECISION',
    ctaLabelId: 'Belanja Sekarang',
    ctaLabelEn: 'Shop Now',
    ctaUrl: '/store',
    sortOrder: 1,
  },
  {
    id: 'hero-slide-02',
    imageUrl: '/media/images/hero/hero-scene-02.jpg',
    altId: 'Sistem plate carrier dan perlengkapan proteksi modular Brakasa',
    altEn: 'Modular plate carrier and tactical protection rig system',
    headlineId: 'SISTEM RIG & PROTEKSI',
    headlineEn: 'MODULAR RIG SYSTEMS',
    ctaLabelId: 'Lihat Plate Carrier',
    ctaLabelEn: 'Explore Plate Carriers',
    ctaUrl: '/store?category=plate-carrier-rig',
    sortOrder: 2,
  },
  {
    id: 'hero-slide-03',
    imageUrl: '/media/images/hero/hero-scene-05.jpg',
    altId: 'Optik bidik presisi dan sistem mounting Picatinny taktis',
    altEn: 'Precision aiming optics and tactical Picatinny rail mount',
    headlineId: 'OPTIK & AKUISISI TARGET',
    headlineEn: 'OPTICS & TARGETING',
    ctaLabelId: 'Lihat Optik',
    ctaLabelEn: 'Explore Optics',
    ctaUrl: '/store?category=optics-aiming',
    sortOrder: 3,
  },
  {
    id: 'hero-slide-04',
    imageUrl: '/media/images/hero/hero-scene-07.jpg',
    altId: 'Unit SMG dan PDW ringkas untuk manuver CQB jarak dekat',
    altEn: 'Compact SMG and PDW platform built for close quarters play',
    headlineId: 'PERFORMA RINGKAS CQB',
    headlineEn: 'COMPACT CQB READY',
    ctaLabelId: 'Lihat SMG & PDW',
    ctaLabelEn: 'Explore SMG & PDW',
    ctaUrl: '/store?category=smg-pdw',
    sortOrder: 4,
  },
  {
    id: 'hero-slide-05',
    imageUrl: '/media/images/hero/hero-scene-10.jpg',
    altId: 'Koleksi lengkap perlengkapan airsoft dan tactical gear Brakasa',
    altEn: 'Complete airsoft replica and tactical field gear collection',
    headlineId: 'PERLENGKAPAN TAKTIS LENGKAP',
    headlineEn: 'COMPLETE TACTICAL GEAR',
    ctaLabelId: 'Buka Katalog',
    ctaLabelEn: 'Browse Catalog',
    ctaUrl: '/store',
    sortOrder: 5,
  },
];

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'assault-rifle': '/media/images/products/brk-ar-001.jpg',
  'smg-pdw': '/media/images/products/brk-smg-001.jpg',
  'sniper-rifle': '/media/images/products/brk-snp-001.jpg',
  'sidearm-pistol': '/media/images/products/brk-pst-001.jpg',
  'optics-aiming': '/media/images/products/brk-opt-002.jpg',
  'plate-carrier-rig': '/media/images/products/brk-rig-001.jpg',
  'helmet-comms': '/media/images/products/brk-hlm-001.jpg',
  'apparel-footwear': '/media/images/products/brk-app-001.jpg',
  'consumables-upgrades': '/media/images/products/brk-upg-001.jpg',
};

export interface FallbackCategoryItem {
  slug: string;
  imageUrl: string;
}

export const DEFAULT_CATEGORIES: readonly FallbackCategoryItem[] = [
  { slug: 'assault-rifle', imageUrl: CATEGORY_IMAGE_MAP['assault-rifle'] },
  { slug: 'smg-pdw', imageUrl: CATEGORY_IMAGE_MAP['smg-pdw'] },
  { slug: 'sniper-rifle', imageUrl: CATEGORY_IMAGE_MAP['sniper-rifle'] },
  { slug: 'sidearm-pistol', imageUrl: CATEGORY_IMAGE_MAP['sidearm-pistol'] },
  { slug: 'optics-aiming', imageUrl: CATEGORY_IMAGE_MAP['optics-aiming'] },
  { slug: 'plate-carrier-rig', imageUrl: CATEGORY_IMAGE_MAP['plate-carrier-rig'] },
  { slug: 'helmet-comms', imageUrl: CATEGORY_IMAGE_MAP['helmet-comms'] },
  { slug: 'apparel-footwear', imageUrl: CATEGORY_IMAGE_MAP['apparel-footwear'] },
  { slug: 'consumables-upgrades', imageUrl: CATEGORY_IMAGE_MAP['consumables-upgrades'] },
];

export const CATEGORY_LABELS: Record<Language, Record<string, string>> = {
  id: {
    'assault-rifle': 'Senapan Serbu',
    'smg-pdw': 'SMG & PDW',
    'sniper-rifle': 'Senapan Sniper',
    'sidearm-pistol': 'Pistol Sidearm',
    'optics-aiming': 'Optik & Bidik',
    'plate-carrier-rig': 'Plate Carrier & Rig',
    'helmet-comms': 'Helm & Komunikasi',
    'apparel-footwear': 'Pakaian & Sepatu',
    'consumables-upgrades': 'Konsumabel & Upgrade',
  },
  en: {
    'assault-rifle': 'Assault Rifle',
    'smg-pdw': 'SMG & PDW',
    'sniper-rifle': 'Sniper Rifle',
    'sidearm-pistol': 'Sidearm Pistol',
    'optics-aiming': 'Optics & Aiming',
    'plate-carrier-rig': 'Plate Carrier & Rig',
    'helmet-comms': 'Helmet & Comms',
    'apparel-footwear': 'Apparel & Footwear',
    'consumables-upgrades': 'Consumables & Upgrades',
  },
};

export const DEFAULT_STORE_MAPS_EMBED_URL =
  'https://maps.google.com/maps?q=Jl.%20Kemang%20Raya%20No.%2048%2C%20Jakarta%20Selatan%2012730&t=&z=15&ie=UTF8&iwloc=&output=embed';

export const DEFAULT_STORE_MAPS_DIRECTIONS_URL =
  'https://maps.google.com/?q=Jl.+Kemang+Raya+No.+48,+Jakarta+Selatan';

export interface CommonDictionary {
  common: {
    close: string;
    cancel: string;
    save: string;
    retry: string;
    loading: string;
    view: string;
    remove: string;
    back: string;
    skipToContent: string;
  };
  nav: {
    home: string;
    shop: string;
    categories: string;
    featured: string;
    ourStore: string;
    admin: string;
    menu: string;
    allProducts: string;
    searchLabel: string;
    searchAria: string;
    searchDialogTitle: string;
    searchInputLabel: string;
    searchPlaceholder: string;
    searchSubmit: string;
    popularCategories: string;
    cartLabel: string;
    openCartAria: (count: number) => string;
    themeToDarkAria: string;
    themeToLightAria: string;
    themeDarkName: string;
    themeLightName: string;
    themeToDarkShort: string;
    themeToLightShort: string;
    languageGroupAria: string;
    langIdFull: string;
    langEnFull: string;
    languageHeading: string;
    themeHeading: string;
    homeAria: string;
    mainNavAria: string;
    mobileNavAria: string;
    closeMenuAria: string;
    closeSearchAria: string;
  };
  hero: {
    regionAria: string;
    prevSlideAria: string;
    nextSlideAria: string;
    dotsLabelAria: string;
    goToSlideAria: (index: number, headline: string) => string;
  };
  featuredProducts: {
    title: string;
    viewAll: string;
    prevAria: string;
    nextAria: string;
    loadingLabel: string;
    errorTitle: string;
    emptyTitle: string;
    emptyDesc: string;
  };
  categoriesSection: {
    title: string;
  };
  ourStore: {
    title: string;
    addressLabel: string;
    hoursLabel: string;
    contactLabel: string;
    directionsCta: string;
    showroomImageAlt: string;
    mapTitle: string;
    defaultAddress: string;
    defaultHours: string;
    defaultWhatsapp: string;
    defaultEmail: string;
  };
  footer: {
    shopHeading: string;
    exploreHeading: string;
    contactHeading: string;
    allProducts: string;
    home: string;
    featuredProducts: string;
    categories: string;
    ourStore: string;
    adminPortal: string;
    googleMaps: string;
    copyright: string;
  };
  cart: {
    title: (count: number) => string;
    closeAria: string;
    emptyTitle: string;
    emptyDesc: string;
    browseCatalog: string;
    syncing: string;
    errorTitle: string;
    outOfStockAlert: string;
    soldOutBadge: string;
    subtotal: string;
    checkout: string;
    decreaseQtyAria: (name: string) => string;
    increaseQtyAria: (name: string) => string;
    removeItemAria: (name: string) => string;
    dismissNoticeAria: string;
    viewItemAria: (name: string) => string;
    closeToastAria: string;
    archivedRemovedNotice: string;
    stockClampedNotice: (name: string, stock: number) => string;
    verifyError: string;
    addedNamed: (name: string, qty: number) => string;
    addedGeneric: (qty: number) => string;
    addedMany: (total: number) => string;
    removedNamed: (name: string) => string;
    removedGeneric: string;
    cleared: string;
  };
  stock: {
    inStock: string;
    lowStock: string;
    outOfStock: string;
    soldOut: string;
  };
  states: {
    loadingDefault: string;
    errorTitleDefault: string;
    retryLabel: string;
  };
  notFound: {
    docTitle: string;
    title: string;
    description: string;
    backHome: string;
    openShop: string;
  };
  landing: {
    docTitle: string;
  };
}

export const COMMON_DICTIONARIES: Record<Language, CommonDictionary> = {
  id: {
    common: {
      close: 'Tutup',
      cancel: 'Batal',
      save: 'Simpan',
      retry: 'Coba Lagi',
      loading: 'Memuat...',
      view: 'Lihat',
      remove: 'Hapus',
      back: 'Kembali',
      skipToContent: 'Lewati ke konten utama',
    },
    nav: {
      home: 'Beranda',
      shop: 'Belanja',
      categories: 'Kategori',
      featured: 'Unggulan',
      ourStore: 'Toko Kami',
      admin: 'Admin',
      menu: 'Menu',
      allProducts: 'Semua Produk',
      searchLabel: 'Cari',
      searchAria: 'Cari produk di katalog',
      searchDialogTitle: 'Cari Produk',
      searchInputLabel: 'Kata kunci produk, merek, atau kategori',
      searchPlaceholder: 'Cari MK18, VFC, Plate Carrier, Optik...',
      searchSubmit: 'Cari',
      popularCategories: 'Kategori Populer',
      cartLabel: 'Keranjang',
      openCartAria: (count: number) => `Buka keranjang belanja, ${count} item`,
      themeToDarkAria: 'Ubah tema ke Armory Dark',
      themeToLightAria: 'Ubah tema ke Field Paper Light',
      themeDarkName: 'Armory Dark',
      themeLightName: 'Field Paper Light',
      themeToDarkShort: 'Gelap',
      themeToLightShort: 'Terang',
      languageGroupAria: 'Pilih bahasa',
      langIdFull: 'Indonesia (ID)',
      langEnFull: 'English (EN)',
      languageHeading: 'Bahasa',
      themeHeading: 'Tema',
      homeAria: 'Brakasa Tactical Beranda',
      mainNavAria: 'Navigasi utama',
      mobileNavAria: 'Navigasi seluler',
      closeMenuAria: 'Tutup menu navigasi',
      closeSearchAria: 'Tutup dialog pencarian',
    },
    hero: {
      regionAria: 'Slider hero Brakasa Tactical',
      prevSlideAria: 'Slide sebelumnya',
      nextSlideAria: 'Slide berikutnya',
      dotsLabelAria: 'Pilih slide hero',
      goToSlideAria: (index: number, headline: string) =>
        `Tampilkan slide ${index}: ${headline}`,
    },
    featuredProducts: {
      title: 'Produk Unggulan',
      viewAll: 'Lihat Semua',
      prevAria: 'Geser produk ke kiri',
      nextAria: 'Geser produk ke kanan',
      loadingLabel: 'Memuat produk unggulan...',
      errorTitle: 'Gagal memuat produk unggulan',
      emptyTitle: 'Belum ada produk unggulan',
      emptyDesc: 'Jelajahi katalog lengkap untuk melihat seluruh unit dan perlengkapan aktif.',
    },
    categoriesSection: {
      title: 'Kategori',
    },
    ourStore: {
      title: 'Toko Kami',
      addressLabel: 'Alamat',
      hoursLabel: 'Jam Buka',
      contactLabel: 'WhatsApp',
      directionsCta: 'Buka Google Maps',
      showroomImageAlt: 'Showroom fisik Brakasa Tactical di Jakarta Selatan',
      mapTitle: 'Peta lokasi showroom Brakasa Tactical',
      defaultAddress: 'Jl. Kemang Raya No. 48, Jakarta Selatan 12730',
      defaultHours: 'Senin - Sabtu, 10:00 - 19:00 WIB',
      defaultWhatsapp: '+62 812-8800-4418',
      defaultEmail: 'armory@brakasa.id',
    },
    footer: {
      shopHeading: 'Belanja',
      exploreHeading: 'Jelajah',
      contactHeading: 'Kontak',
      allProducts: 'Semua Produk',
      home: 'Beranda',
      featuredProducts: 'Produk Unggulan',
      categories: 'Kategori',
      ourStore: 'Toko Kami',
      adminPortal: 'Portal Admin',
      googleMaps: 'Google Maps',
      copyright: '© 2026 Brakasa Tactical. Hak cipta dilindungi.',
    },
    cart: {
      title: (count: number) => `Keranjang (${count})`,
      closeAria: 'Tutup keranjang belanja',
      emptyTitle: 'Keranjang belanja masih kosong',
      emptyDesc: 'Pilih unit, optik, atau perlengkapan taktis dari katalog untuk mulai berbelanja.',
      browseCatalog: 'Lihat Katalog',
      syncing: 'Menyinkronkan stok dan harga...',
      errorTitle: 'Gagal memuat keranjang',
      outOfStockAlert: 'Hapus item bertanda habis stok untuk melanjutkan ke checkout.',
      soldOutBadge: 'Habis',
      subtotal: 'Subtotal',
      checkout: 'Checkout',
      decreaseQtyAria: (name: string) => `Kurangi jumlah ${name}`,
      increaseQtyAria: (name: string) => `Tambah jumlah ${name}`,
      removeItemAria: (name: string) => `Hapus ${name} dari keranjang`,
      dismissNoticeAria: 'Tutup pemberitahuan',
      viewItemAria: (name: string) => `Lihat detail ${name}`,
      closeToastAria: 'Tutup notifikasi keranjang',
      archivedRemovedNotice: 'Satu atau lebih item yang tidak tersedia telah dihapus dari keranjang.',
      stockClampedNotice: (name: string, stock: number) =>
        `Stok ${name} tersisa ${stock} unit. Jumlah disesuaikan otomatis.`,
      verifyError: 'Gagal memverifikasi stok keranjang terbaru. Muat ulang sebelum melanjutkan.',
      addedNamed: (name: string, qty: number) =>
        `${name} (${qty}) ditambahkan ke keranjang.`,
      addedGeneric: (qty: number) => `${qty} item ditambahkan ke keranjang.`,
      addedMany: (total: number) => `${total} item ditambahkan ke keranjang.`,
      removedNamed: (name: string) => `${name} dihapus dari keranjang.`,
      removedGeneric: 'Item dihapus dari keranjang.',
      cleared: 'Keranjang belanja dikosongkan.',
    },
    stock: {
      inStock: 'Tersedia',
      lowStock: 'Stok Terbatas',
      outOfStock: 'Habis',
      soldOut: 'Habis',
    },
    states: {
      loadingDefault: 'Memuat data...',
      errorTitleDefault: 'Gagal Memuat Data',
      retryLabel: 'Coba Lagi',
    },
    notFound: {
      docTitle: 'Halaman Tidak Ditemukan | Brakasa Tactical',
      title: 'Halaman Tidak Ditemukan',
      description: 'Tautan yang Anda tuju tidak tersedia. Kembali ke beranda atau buka katalog produk.',
      backHome: 'Kembali ke Beranda',
      openShop: 'Buka Katalog',
    },
    landing: {
      docTitle: 'Brakasa Tactical | Airsoft & Tactical Gear',
    },
  },
  en: {
    common: {
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      retry: 'Try Again',
      loading: 'Loading...',
      view: 'View',
      remove: 'Remove',
      back: 'Back',
      skipToContent: 'Skip to main content',
    },
    nav: {
      home: 'Home',
      shop: 'Shop',
      categories: 'Categories',
      featured: 'Featured',
      ourStore: 'Our Store',
      admin: 'Admin',
      menu: 'Menu',
      allProducts: 'All Products',
      searchLabel: 'Search',
      searchAria: 'Search products in catalog',
      searchDialogTitle: 'Search Products',
      searchInputLabel: 'Product name, brand, or category',
      searchPlaceholder: 'Search MK18, VFC, Plate Carrier, Optics...',
      searchSubmit: 'Search',
      popularCategories: 'Popular Categories',
      cartLabel: 'Cart',
      openCartAria: (count: number) => `Open shopping cart, ${count} items`,
      themeToDarkAria: 'Switch theme to Armory Dark',
      themeToLightAria: 'Switch theme to Field Paper Light',
      themeDarkName: 'Armory Dark',
      themeLightName: 'Field Paper Light',
      themeToDarkShort: 'Dark',
      themeToLightShort: 'Light',
      languageGroupAria: 'Select language',
      langIdFull: 'Indonesia (ID)',
      langEnFull: 'English (EN)',
      languageHeading: 'Language',
      themeHeading: 'Theme',
      homeAria: 'Brakasa Tactical Home',
      mainNavAria: 'Main navigation',
      mobileNavAria: 'Mobile navigation',
      closeMenuAria: 'Close navigation menu',
      closeSearchAria: 'Close search dialog',
    },
    hero: {
      regionAria: 'Brakasa Tactical hero slider',
      prevSlideAria: 'Previous slide',
      nextSlideAria: 'Next slide',
      dotsLabelAria: 'Choose hero slide',
      goToSlideAria: (index: number, headline: string) =>
        `Show slide ${index}: ${headline}`,
    },
    featuredProducts: {
      title: 'Featured Products',
      viewAll: 'View All',
      prevAria: 'Scroll products left',
      nextAria: 'Scroll products right',
      loadingLabel: 'Loading featured products...',
      errorTitle: 'Failed to load featured products',
      emptyTitle: 'No featured products yet',
      emptyDesc: 'Browse the full catalog to explore all active replicas and gear.',
    },
    categoriesSection: {
      title: 'Categories',
    },
    ourStore: {
      title: 'Our Store',
      addressLabel: 'Address',
      hoursLabel: 'Opening Hours',
      contactLabel: 'WhatsApp',
      directionsCta: 'Get Directions',
      showroomImageAlt: 'Brakasa Tactical physical showroom in South Jakarta',
      mapTitle: 'Brakasa Tactical showroom location map',
      defaultAddress: 'Jl. Kemang Raya No. 48, Jakarta Selatan 12730',
      defaultHours: 'Monday - Saturday, 10:00 - 19:00 WIB',
      defaultWhatsapp: '+62 812-8800-4418',
      defaultEmail: 'armory@brakasa.id',
    },
    footer: {
      shopHeading: 'Shop',
      exploreHeading: 'Explore',
      contactHeading: 'Contact',
      allProducts: 'All Products',
      home: 'Home',
      featuredProducts: 'Featured Products',
      categories: 'Categories',
      ourStore: 'Our Store',
      adminPortal: 'Admin Portal',
      googleMaps: 'Google Maps',
      copyright: '© 2026 Brakasa Tactical. All rights reserved.',
    },
    cart: {
      title: (count: number) => `Cart (${count})`,
      closeAria: 'Close shopping cart',
      emptyTitle: 'Your cart is empty',
      emptyDesc: 'Add airsoft replicas, optics, or tactical gear from the shop to get started.',
      browseCatalog: 'Browse Shop',
      syncing: 'Syncing live stock and prices...',
      errorTitle: 'Failed to load cart',
      outOfStockAlert: 'Remove sold out items before proceeding to checkout.',
      soldOutBadge: 'Sold Out',
      subtotal: 'Subtotal',
      checkout: 'Checkout',
      decreaseQtyAria: (name: string) => `Decrease quantity of ${name}`,
      increaseQtyAria: (name: string) => `Increase quantity of ${name}`,
      removeItemAria: (name: string) => `Remove ${name} from cart`,
      dismissNoticeAria: 'Dismiss notice',
      viewItemAria: (name: string) => `View details for ${name}`,
      closeToastAria: 'Close cart notification',
      archivedRemovedNotice: 'One or more unavailable items were removed from your cart.',
      stockClampedNotice: (name: string, stock: number) =>
        `Only ${stock} unit(s) of ${name} remain. Quantity was adjusted automatically.`,
      verifyError: 'Failed to verify latest cart stock. Please reload before continuing.',
      addedNamed: (name: string, qty: number) =>
        `${name} (${qty}) added to cart.`,
      addedGeneric: (qty: number) => `${qty} item(s) added to cart.`,
      addedMany: (total: number) => `${total} items added to cart.`,
      removedNamed: (name: string) => `${name} removed from cart.`,
      removedGeneric: 'Item removed from cart.',
      cleared: 'Shopping cart cleared.',
    },
    stock: {
      inStock: 'In Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      soldOut: 'Sold Out',
    },
    states: {
      loadingDefault: 'Loading data...',
      errorTitleDefault: 'Failed to Load Data',
      retryLabel: 'Try Again',
    },
    notFound: {
      docTitle: 'Page Not Found | Brakasa Tactical',
      title: 'Page Not Found',
      description: 'The page you requested is unavailable. Return home or browse the product catalog.',
      backHome: 'Back to Home',
      openShop: 'Browse Shop',
    },
    landing: {
      docTitle: 'Brakasa Tactical | Airsoft & Tactical Gear',
    },
  },
};
