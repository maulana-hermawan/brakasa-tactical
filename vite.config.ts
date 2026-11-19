import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const HERO_LCP_SHELL_HTML = `<div id="hero-lcp-shell" style="position:relative;width:100%;min-height:clamp(540px,82svh,860px);background:#0F1110;overflow:hidden;"><img id="hero-lcp-poster" src="/media/videos/hero-tactical-poster.jpg" width="1920" height="1080" fetchpriority="high" decoding="sync" alt="Operator airsoft Brakasa Tactical dengan unit AEG dan plate carrier Cordura 500D" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;" /></div>`;

function getDevRouteMeta(pathname: string): { title: string; description: string; isHome: boolean } {
  if (pathname === '/' || pathname === '') {
    return {
      title: 'Brakasa Tactical | Unit Airsoft & Perlengkapan Taktis Presisi 18+',
      description:
        'Katalog replika airsoft olahraga 6mm <= 2,0 Joule, optik, plate carrier Cordura 500D, dan 5-Slot Tactical Loadout Builder Indonesia.',
      isHome: true,
    };
  }
  if (pathname === '/store') {
    return {
      title: 'Katalog Unit & Gear | Brakasa Tactical',
      description: 'Saring 20+ SKU airsoft dan tactical gear berdasarkan propulsi, platform, FPS, stok, dan video demo.',
      isHome: false,
    };
  }
  if (pathname.startsWith('/store/')) {
    return {
      title: 'Spesifikasi Produk | Brakasa Tactical',
      description: 'Lembar spesifikasi teknis, video demo, dan kecocokan ekosistem unit Brakasa Tactical.',
      isHome: false,
    };
  }
  if (pathname === '/loadout-builder') {
    return {
      title: 'Interactive Tactical Loadout Builder | Brakasa Tactical',
      description: 'Rakit 5-slot loadout airsoft dengan evaluasi kompatibilitas daya, ulir laras, dan MED lapangan.',
      isHome: false,
    };
  }
  if (pathname === '/checkout') {
    return {
      title: 'Checkout & Verifikasi Kepatuhan 18+ | Brakasa Tactical',
      description: 'Penyelesaian pesanan kargo darat/laut dengan verifikasi usia 18+ dan kepatuhan Perpol No. 5/2018.',
      isHome: false,
    };
  }
  if (pathname === '/order-lookup' || pathname === '/orders/lookup') {
    return {
      title: 'Cek Status Pesanan & Resi Kargo | Brakasa Tactical',
      description: 'Lacak verifikasi pembayaran, QC chronograph, dan nomor resi kargo pesanan Brakasa Tactical.',
      isHome: false,
    };
  }
  if (pathname === '/compliance') {
    return {
      title: 'Panduan Regulasi Perpol No. 5/2018 & Klasifikasi FPS | Brakasa Tactical',
      description: 'Panduan kepatuhan olahraga airsoft Indonesia, batas 2,0 Joule, kalkulator FPS ke Joule, dan FAQ.',
      isHome: false,
    };
  }
  if (pathname === '/admin/login') {
    return {
      title: 'Login Admin Operations | Brakasa Tactical',
      description: 'Akses masuk staf operasional armory Brakasa Tactical.',
      isHome: false,
    };
  }
  if (pathname.startsWith('/admin')) {
    return {
      title: 'Admin Operations Center | Brakasa Tactical',
      description: 'Panel operasional pesanan, inventori, katalog, voucher, dan pengaturan Brakasa Tactical.',
      isHome: false,
    };
  }
  return {
    title: 'Brakasa Tactical | Armory & Tactical Gear Indonesia',
    description: 'Perlengkapan olahraga airsoft 6mm dan perlengkapan taktis terukur di Indonesia.',
    isHome: false,
  };
}

function devHtmlShellPlugin(): Plugin {
  return {
    name: 'brakasa-dev-html-shell',
    apply: 'serve',
    transformIndexHtml(html, ctx) {
      const rawUrl = ctx.originalUrl || '/';
      const pathname = rawUrl.split('?')[0] || '/';
      const meta = getDevRouteMeta(pathname);
      const preloadLink = meta.isHome
        ? '\n    <link rel="preload" as="image" href="/media/videos/hero-tactical-poster.jpg" fetchpriority="high" />'
        : '';
      const headMeta = `<title>${meta.title}</title>\n    <meta name="description" content="${meta.description}" />${preloadLink}`;
      return html
        .replace('<!--BRAKASA_HEAD_META-->', headMeta)
        .replace('<!--BRAKASA_LCP_PRELOAD_SHELL-->', meta.isHome ? HERO_LCP_SHELL_HTML : '');
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devHtmlShellPlugin()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
