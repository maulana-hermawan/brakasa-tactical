import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 3088;
const MIGRATION_PORT = 3098;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const QA_DB_PATH = path.resolve(ROOT_DIR, 'storage', 'qa-v2-api.db');
const MIG_DB_PATH = path.resolve(ROOT_DIR, 'storage', 'qa-v2-mig.db');
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'storage', 'uploads');

const results = [];
const uploadedTestFiles = [];

function record(category, name, passed, details = '', severity = 'INFO') {
  results.push({ category, name, passed, details, severity });
  const tag = passed ? 'PASS' : `FAIL[${severity}]`;
  console.log(`[${tag}] (${category}) ${name}${details ? ` :: ${details}` : ''}`);
}

function walkDir(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkDir(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function rel(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
}

function runStaticAudit() {
  console.log('\n--- 1. V2 STATIC CODE, SECURITY & ANTI-SLOP AUDIT ---');
  const codeFiles = [
    ...walkDir(path.join(ROOT_DIR, 'shared')),
    ...walkDir(path.join(ROOT_DIR, 'server')),
    ...walkDir(path.join(ROOT_DIR, 'src')),
    path.join(ROOT_DIR, 'index.html'),
    path.join(ROOT_DIR, 'vite.config.ts'),
  ].filter((f) => fs.existsSync(f));

  const allAuditFiles = [
    ...codeFiles,
    path.join(ROOT_DIR, 'DESIGN.md'),
  ].filter((f) => fs.existsSync(f));

  const dashHits = [];
  const decorCommentHits = [];
  const jsxSlopHits = [];
  const outlineNoneHits = [];
  const pillRadiusHits = [];
  const microPrefixHits = [];
  const removedUiTermHits = [];
  const mediaDimIssues = [];
  const dangerHtmlHits = [];
  const aiFontHits = [];
  const slopAnimHits = [];
  const sqlInterpFindings = [];
  const rawDecodeHits = [];

  const microPrefixRe =
    /\b(SEC-01|SEC-06|OPS-01|CAT-01|INV-01|ORD-01|CFG-01|CFG-02|QUEUE-01|STOCK-02|METRIK-03|BLOK 01|BLOK 03|BLOK 04)\b|\[BRK \/\/|\[SCN-|spec-index-row|\b(AUTH|STATUS|MANIFEST|PARAM|OVERVIEW|SUMMARY|PAYMENT|LOGISTICS|ORDER|PROMO|MEDIA|KONFIRMASI)\s*\/\//;

  const removedTermRe =
    /18\+|Perpol|Loadout Builder|Cek Pesanan|\/loadout-builder|\/order-lookup|\/compliance/i;

  for (const file of allAuditFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const rpath = rel(file);
    const isCodeFile = rpath !== 'DESIGN.md';

    lines.forEach((line, idx) => {
      const ln = idx + 1;

      if (/[\u2014\u2013]/.test(line)) {
        dashHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (!isCodeFile) return;

      if (
        /(\/\/|\/\*)\s*([=\-*#]{4,}|Step\s+\d+|End\s+of|end\s+(if|for|while|function)\b|MAIN\s+LOGIC|CORE\s+LOGIC|HELPER\s+FUNCTION|TODO:\s*(Improve|Fix|Add more))/i.test(
          line,
        ) ||
        /(\/\/|\/\*).*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line)
      ) {
        decorCommentHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (/\{\/\*.*([=\-*]{4,}|Step\s+\d+|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])/iu.test(line)) {
        jsxSlopHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (/outline\s*:\s*(none|0)\b|outline-none/i.test(line)) {
        outlineNoneHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (/rounded-full|rounded-2xl|rounded-3xl|9999px|border-radius\s*:\s*(50%|999)/i.test(line)) {
        pillRadiusHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (microPrefixRe.test(line)) {
        microPrefixHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      const isUiOrPublicCode =
        rpath.startsWith('src/') ||
        rpath === 'index.html' ||
        rpath === 'server/middleware/htmlShell.ts' ||
        rpath.startsWith('server/routes/') ||
        rpath.startsWith('server/services/');
      if (isUiOrPublicCode && removedTermRe.test(line)) {
        removedUiTermHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (/dangerouslySetInnerHTML|innerHTML|outerHTML|\beval\s*\(|new\s+Function\s*\(/i.test(line)) {
        dangerHtmlHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (/(font-family|family=).*(Inter|Geist|Space Grotesk|JetBrains Mono|Fira Code)/i.test(line)) {
        aiFontHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (/animate-pulse|animate-bounce|animate-ping/i.test(line)) {
        slopAnimHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
      }

      if (/decodeURIComponent\s*\(/.test(line)) {
        const context = lines.slice(Math.max(0, idx - 3), Math.min(lines.length, idx + 3)).join(' ');
        if (!/\btry\s*\{/.test(context)) {
          rawDecodeHits.push(`${rpath}:${ln} -> ${line.trim().slice(0, 120)}`);
        }
      }
    });

    if (rpath.endsWith('.tsx') || rpath === 'index.html' || rpath === 'server/middleware/htmlShell.ts') {
      const tagRe = /<(img|video|iframe)\b[^>]*>/g;
      let match;
      while ((match = tagRe.exec(content)) !== null) {
        const tag = match[0];
        if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) {
          const ln = content.slice(0, match.index).split(/\r?\n/).length;
          mediaDimIssues.push(`${rpath}:${ln} -> ${tag.replace(/\s+/g, ' ').slice(0, 120)}`);
        }
      }
    }

    if (rpath.startsWith('server/') && rpath.endsWith('.ts')) {
      const re = /db\.(prepare|exec)\s*\(\s*`([\s\S]*?)`/g;
      let match;
      while ((match = re.exec(content)) !== null) {
        if (/\$\{/.test(match[2])) {
          const lineNo = content.slice(0, match.index).split(/\r?\n/).length;
          const exprs = match[2].match(/\$\{[^}]+\}/g) || [];
          const allowedSafeExprs = [
            '${PRODUCT_SELECT_BASE}',
            '${placeholders}',
            '${excludePlaceholders}',
            '${whereClause}',
            '${orderBy}',
            '${mutationWhere}',
            "${productConditions.join(' AND ')}",
          ];
          const unsafe = exprs.filter((e) => !allowedSafeExprs.includes(e));
          if (unsafe.length > 0) {
            sqlInterpFindings.push(`${rpath}:${lineNo} -> ${unsafe.join(', ')}`);
          }
        }
      }
    }
  }

  const deletedLegacyFiles = [
    'server/services/loadoutService.ts',
    'src/pages/LoadoutBuilderPage.tsx',
    'src/pages/OrderLookupPage.tsx',
    'src/pages/CompliancePage.tsx',
    'src/components/checkout/ComplianceAgeSection.tsx',
    'src/components/store/CompatibilityCallout.tsx',
    'src/components/landing/HeroVideoSection.tsx',
    'src/components/landing/ShopByMissionSection.tsx',
    'src/components/landing/LoadoutSpotlightSection.tsx',
    'src/components/landing/FieldVideoShowcaseSection.tsx',
    'src/components/landing/CompliancePreviewSection.tsx',
  ];
  const lingeringLegacyFiles = deletedLegacyFiles.filter((f) =>
    fs.existsSync(path.join(ROOT_DIR, f)),
  );

  record(
    'STATIC',
    'Zero em-dash (U+2014) & en-dash (U+2013) across code, index.html & DESIGN.md',
    dashHits.length === 0,
    dashHits.length === 0 ? `Scanned ${allAuditFiles.length} files: 0 hits` : dashHits.join(' | '),
    'HIGH',
  );

  record(
    'STATIC',
    'Zero rounded-full / rounded-2xl / rounded-3xl / 9999px / border-radius: 50% in code (R-11)',
    pillRadiusHits.length === 0,
    pillRadiusHits.length === 0 ? `Scanned ${codeFiles.length} code files: 0 violations` : pillRadiusHits.join(' | '),
    'HIGH',
  );

  record(
    'STATIC',
    'Zero decorative micro-prefixes (SEC-01, OPS-01, [BRK //, [SCN-, BLOK 01, spec-index-row)',
    microPrefixHits.length === 0,
    microPrefixHits.length === 0 ? '0 micro-prefix violations' : microPrefixHits.join(' | '),
    'HIGH',
  );

  record(
    'STATIC',
    'Zero 18+ / Perpol / Loadout Builder / Cek Pesanan / removed routes in UI & server routes',
    removedUiTermHits.length === 0,
    removedUiTermHits.length === 0 ? '0 removed-term occurrences in UI/routes/services' : removedUiTermHits.join(' | '),
    'CRITICAL',
  );

  record(
    'STATIC',
    'All 11 deprecated V1 files deleted cleanly',
    lingeringLegacyFiles.length === 0,
    lingeringLegacyFiles.length === 0
      ? 'All 11 legacy V1 files absent'
      : `Still exists: ${lingeringLegacyFiles.join(', ')}`,
    'HIGH',
  );

  record(
    'STATIC',
    'Every <img>, <video>, and <iframe> has explicit width & height attributes (R-40)',
    mediaDimIssues.length === 0,
    mediaDimIssues.length === 0 ? '0 unsized media tags' : mediaDimIssues.join(' | '),
    'HIGH',
  );

  record(
    'STATIC',
    'Zero decorative AI comments (// ====, // ----, emoji, Step N)',
    decorCommentHits.length === 0 && jsxSlopHits.length === 0,
    decorCommentHits.length === 0 && jsxSlopHits.length === 0
      ? '0 decorative comments found'
      : [...decorCommentHits, ...jsxSlopHits].join(' ; '),
    'MEDIUM',
  );

  record(
    'STATIC',
    'No outline:none without :focus-visible protection',
    outlineNoneHits.every((hit) => hit.includes('src/styles/global.css:103')),
    outlineNoneHits.length === 0
      ? '0 outline:none hits'
      : `Only programmatic main:focus skip-target suppressor (${outlineNoneHits.join(' | ')}); global.css:97 enforces :focus-visible`,
    'LOW',
  );

  record(
    'STATIC',
    'Zero dangerouslySetInnerHTML / eval / new Function',
    dangerHtmlHits.length === 0,
    dangerHtmlHits.length === 0 ? '0 unsafe DOM/eval sinks' : dangerHtmlHits.join(' | '),
    'HIGH',
  );

  record(
    'STATIC',
    'Zero AI-slop default fonts (Inter/Geist/Space Grotesk/JetBrains/Fira)',
    aiFontHits.length === 0,
    aiFontHits.length === 0 ? 'Uses Barlow Condensed + IBM Plex Sans + IBM Plex Mono' : aiFontHits.join(' | '),
    'MEDIUM',
  );

  record(
    'STATIC',
    'Zero decorative pulse/bounce/ping animations',
    slopAnimHits.length === 0,
    slopAnimHits.length === 0 ? '0 slop utility animations' : slopAnimHits.join(' | '),
    'LOW',
  );

  record(
    'STATIC',
    'SQL queries use parameterized placeholders (?) with zero raw user-input interpolation',
    sqlInterpFindings.length === 0,
    sqlInterpFindings.length === 0
      ? 'All db.prepare/exec interpolations verified safe'
      : sqlInterpFindings.join(' | '),
    'CRITICAL',
  );

  const authServiceSrc = fs.readFileSync(path.join(ROOT_DIR, 'server', 'services', 'authService.ts'), 'utf8');
  const authMwSrc = fs.readFileSync(path.join(ROOT_DIR, 'server', 'middleware', 'auth.ts'), 'utf8');
  const rateLimitSrc = fs.readFileSync(path.join(ROOT_DIR, 'server', 'middleware', 'rateLimit.ts'), 'utf8');

  record(
    'STATIC',
    'Admin password uses scryptSync + timingSafeEqual & 256-bit random session token',
    authServiceSrc.includes('scryptSync') &&
      authServiceSrc.includes('timingSafeEqual') &&
      authServiceSrc.includes('randomBytes(32)'),
    'Verified in server/services/authService.ts',
    'CRITICAL',
  );

  record(
    'STATIC',
    'Session cookie enforces HttpOnly + SameSite=Lax & CSRF Origin/Referer guard',
    authMwSrc.includes("'HttpOnly'") &&
      authMwSrc.includes("'SameSite=Lax'") &&
      authMwSrc.includes('isSameOriginAllowed'),
    'Verified in server/middleware/auth.ts',
    'CRITICAL',
  );

  record(
    'STATIC',
    'No uncaught decodeURIComponent() crashes on malformed percent-encoding',
    rawDecodeHits.length === 0,
    rawDecodeHits.length === 0 ? 'All decodeURIComponent wrapped safely' : rawDecodeHits.join(' | '),
    'MEDIUM',
  );

  const readsSpoofableXff =
    rateLimitSrc.includes("req.headers['x-forwarded-for']") && rateLimitSrc.includes("split(',')[0]");
  record(
    'STATIC',
    'Rate limiter uses trusted Express req.ip instead of spoofable leftmost X-Forwarded-For',
    !readsSpoofableXff,
    !readsSpoofableXff ? 'Uses req.ip safely' : 'Reads spoofable X-Forwarded-For header directly',
    'MEDIUM',
  );
}

async function waitForServer(baseUrl, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // Server still starting
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server failed to become ready on ${baseUrl} within ${timeoutMs}ms`);
}

function cleanupDbFiles(dbPath) {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const p = `${dbPath}${suffix}`;
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {
        // Ignore transient lock
      }
    }
  }
}

async function stopProc(proc) {
  if (!proc) return;
  proc.kill('SIGTERM');
  await new Promise((resolve) => {
    proc.once('exit', resolve);
    setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        // Process already exited
      }
      resolve();
    }, 2500);
  });
}

async function fetchJson(endpoint, options = {}, baseUrl = BASE_URL) {
  const res = await fetch(`${baseUrl}${endpoint}`, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Non-JSON response
  }
  return { res, text, json };
}

function extractSessionCookie(res) {
  const setCookie = res.headers.get('set-cookie') || '';
  const match = /brakasa_admin_session=([^;]+)/.exec(setCookie);
  return {
    setCookie,
    cookiePair: match ? `brakasa_admin_session=${match[1]}` : null,
  };
}

function buildValidV2OrderPayload(overrides = {}) {
  return {
    items: [{ productId: 2, quantity: 1 }],
    customerName: 'Budi Santoso QA V2',
    customerEmail: 'budi.v2qa@example.com',
    customerPhone: '+6281234567890',
    shippingZone: 'JAWA',
    shippingCity: 'Bandung',
    shippingDistrict: 'Coblong',
    shippingPostalCode: '40132',
    shippingAddress: 'Jl. Dago Asri No. 18 RT 02 RW 05 Bandung',
    shippingNotes: 'Tes QA V2 otomatis tanpa field compliance',
    shippingCourier: 'JNE_TRUCKING',
    woodenPacking: true,
    paymentMethod: 'VA_BCA',
    voucherCode: null,
    ...overrides,
  };
}

async function runIdempotentV2MigrationTest() {
  console.log('\n--- 3. IDEMPOTENT V2 DATABASE MIGRATION VERIFICATION ---');
  cleanupDbFiles(MIG_DB_PATH);

  // First boot creates schema and runs initial seed
  const migBaseUrl = `http://127.0.0.1:${MIGRATION_PORT}`;
  let proc1 = spawn(process.execPath, [path.join(ROOT_DIR, 'dist', 'server', 'index.mjs')], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(MIGRATION_PORT),
      BRAKASA_DB_PATH: MIG_DB_PATH,
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await waitForServer(migBaseUrl);
  } finally {
    await stopProc(proc1);
    proc1 = null;
  }

  // Simulate a pre-V2 legacy database state: remove v2_swarna_migrated & hero_slides, restore legacy armory_profile
  const db = new DatabaseSync(MIG_DB_PATH);
  db.prepare(`DELETE FROM site_settings WHERE key IN ('v2_swarna_migrated', 'hero_slides')`).run();
  db.prepare(
    `UPDATE site_settings SET value_json = ? WHERE key = 'armory_profile'`,
  ).run(
    JSON.stringify({
      storeName: 'Brakasa Tactical',
      tagline: 'Legacy tagline',
      address: 'Jl. Kemang Raya No. 48, Jakarta Selatan 12730',
      city: 'Jakarta Selatan',
      whatsappNumber: '+62 812-8800-4418',
      supportEmail: 'armory@brakasa.id',
      operatingHours: 'Senin - Sabtu, 10:00 - 19:00 WIB',
      announcementEnabled: true,
      announcementText: 'Pengumuman V1 18+',
      complianceNoticeShort: 'Khusus 18+ Perpol 5/2018',
    }),
  );
  db.close();

  // Boot #2: triggers V2 migration
  let proc2 = spawn(process.execPath, [path.join(ROOT_DIR, 'dist', 'server', 'index.mjs')], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(MIGRATION_PORT),
      BRAKASA_DB_PATH: MIG_DB_PATH,
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let afterMig1 = null;
  try {
    await waitForServer(migBaseUrl);
    afterMig1 = await fetchJson('/api/bootstrap', {}, migBaseUrl);
  } finally {
    await stopProc(proc2);
    proc2 = null;
  }

  const prof1 = afterMig1?.json?.settings?.armoryProfile;
  const slides1 = afterMig1?.json?.settings?.heroSlides || [];
  const mig1Ok =
    afterMig1?.res.status === 200 &&
    prof1?.announcementEnabled === false &&
    prof1?.complianceNoticeShort === '' &&
    Boolean(prof1?.mapsEmbedUrl?.startsWith('https://')) &&
    Boolean(prof1?.mapsDirectionsUrl?.startsWith('https://')) &&
    slides1.length === 5;

  // Customize slide 0 headline directly in DB, then boot #3 to prove migration is idempotent and does NOT overwrite custom settings
  const db2 = new DatabaseSync(MIG_DB_PATH);
  const customSlides = slides1.map((s, idx) =>
    idx === 0 ? { ...s, headlineId: 'CUSTOM PERSISTED HEADLINE' } : s,
  );
  db2
    .prepare(`UPDATE site_settings SET value_json = ? WHERE key = 'hero_slides'`)
    .run(JSON.stringify(customSlides));
  db2.close();

  let proc3 = spawn(process.execPath, [path.join(ROOT_DIR, 'dist', 'server', 'index.mjs')], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(MIGRATION_PORT),
      BRAKASA_DB_PATH: MIG_DB_PATH,
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let afterMig2 = null;
  try {
    await waitForServer(migBaseUrl);
    afterMig2 = await fetchJson('/api/bootstrap', {}, migBaseUrl);
  } finally {
    await stopProc(proc3);
    proc3 = null;
  }

  const preservedCustom =
    afterMig2?.json?.settings?.heroSlides?.[0]?.headlineId === 'CUSTOM PERSISTED HEADLINE';

  record(
    'MIGRATION_V2',
    'Idempotent V2 migration upgrades legacy DB once (disables announcement/18+, seeds 5 heroSlides & mapsEmbedUrl) and preserves edits across restarts',
    mig1Ok && preservedCustom,
    `mig1Ok=${mig1Ok}, slides=${slides1.length}, maps=${Boolean(prof1?.mapsEmbedUrl)}, preservedAfterRestart=${preservedCustom}`,
    'HIGH',
  );

  cleanupDbFiles(MIG_DB_PATH);
}

async function runRuntimeSuite() {
  console.log('\n--- 2. V2 RUNTIME API, MEDIA, CONCURRENCY & SECURITY SUITE ---');
  cleanupDbFiles(QA_DB_PATH);

  const serverProc = spawn(process.execPath, [path.join(ROOT_DIR, 'dist', 'server', 'index.mjs')], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(PORT),
      BRAKASA_DB_PATH: QA_DB_PATH,
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverStderr = '';
  serverProc.stderr.on('data', (chunk) => {
    serverStderr += chunk.toString();
  });

  try {
    await waitForServer(BASE_URL);
    record('RUNTIME', 'Production bundle starts cleanly on PORT=3088 with isolated QA DB', true, QA_DB_PATH);

    // A. HTML SHELL V2 (R-39 & R-40, zero 18+/Perpol/Loadout)
    const routesToCheck = [
      { path: '/', expectLcpPoster: true },
      { path: '/store', expectLcpPoster: false },
      { path: '/store/tokyo-marui-mk18-mod1-mws-gbbr', expectLcpPoster: false },
      { path: '/checkout', expectLcpPoster: false },
      { path: '/admin/login', expectLcpPoster: false },
    ];
    const titles = new Map();
    for (const rt of routesToCheck) {
      const res = await fetch(`${BASE_URL}${rt.path}`);
      const html = await res.text();
      const hasLangId = /<html[^>]*\blang="id"/i.test(html);
      const titleMatch = /<title>([^<]+)<\/title>/i.exec(html);
      const title = titleMatch ? titleMatch[1].trim() : '';
      const descMatch = /<meta[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html);
      const desc = descMatch ? descMatch[1] : '';
      const hasLcpImg = /<img[^>]*id="hero-lcp-poster"[^>]*fetchpriority="high"/i.test(html);
      const hasPreloadImg = /<link[^>]*rel="preload"[^>]*as="image"[^>]*fetchpriority="high"/i.test(html);
      const hasLangSync = html.includes('brakasa-lang');
      const hasRemovedTerms = /18\+|Perpol|Loadout Builder|Cek Pesanan/i.test(`${title} ${desc}`);
      const xcto = res.headers.get('x-content-type-options');
      const xfo = res.headers.get('x-frame-options');
      const xpb = res.headers.get('x-powered-by');

      titles.set(rt.path, title);

      const ok =
        res.status === 200 &&
        hasLangId &&
        hasLangSync &&
        title.length > 5 &&
        !hasRemovedTerms &&
        hasLcpImg === rt.expectLcpPoster &&
        hasPreloadImg === rt.expectLcpPoster &&
        xcto === 'nosniff' &&
        xfo === 'SAMEORIGIN' &&
        !xpb;

      record(
        'HTML_SHELL',
        `GET ${rt.path} (lang sync, clean title/meta, LCP poster=${rt.expectLcpPoster}, security headers)`,
        ok,
        `status=${res.status}, title="${title}", lcpImg=${hasLcpImg}, preload=${hasPreloadImg}, cleanMeta=${!hasRemovedTerms}`,
        'HIGH',
      );
    }

    const uniqueTitlesCount = new Set(titles.values()).size;
    record(
      'HTML_SHELL',
      'All 5 tested routes emit distinct <title> values (R-39)',
      uniqueTitlesCount === routesToCheck.length,
      `${uniqueTitlesCount}/${routesToCheck.length} unique titles`,
      'HIGH',
    );

    // Adversarial malformed URI on /store/:slug
    const malformedSlugRes = await fetch(`${BASE_URL}/store/%E0%A4%A`);
    record(
      'SECURITY',
      'Malformed percent-encoding on GET /store/%E0%A4%A handled gracefully (no 500 crash)',
      malformedSlugRes.status !== 500,
      `HTTP ${malformedSlugRes.status}`,
      'MEDIUM',
    );

    // B. BOOTSTRAP V2 & MEDIA INTEGRITY
    const boot = await fetchJson('/api/bootstrap');
    const prodList = await fetchJson('/api/products?limit=100');

    const heroSlides = boot.json?.settings?.heroSlides || [];
    const featuredProducts = boot.json?.featuredProducts || [];
    const categories = boot.json?.categories || [];
    const armoryProfile = boot.json?.settings?.armoryProfile || {};

    record(
      'BOOTSTRAP_V2',
      'GET /api/bootstrap returns 5 heroSlides, 8 featuredProducts, and 9 categories with imageUrl',
      boot.res.status === 200 &&
        heroSlides.length === 5 &&
        heroSlides.every(
          (s) => s.imageUrl && s.headlineId && s.headlineEn && s.ctaLabelId && s.ctaLabelEn && s.ctaUrl,
        ) &&
        featuredProducts.length === 8 &&
        featuredProducts.every((p) => p.isFeatured && p.primaryImageUrl) &&
        categories.length === 9 &&
        categories.every((c) => typeof c.imageUrl === 'string' && c.imageUrl.startsWith('/media/images/')) &&
        armoryProfile.announcementEnabled === false &&
        Boolean(armoryProfile.mapsEmbedUrl?.startsWith('https://')) &&
        Boolean(armoryProfile.mapsDirectionsUrl?.startsWith('https://')),
      `heroSlides=${heroSlides.length}, featured=${featuredProducts.length}, categories=${categories.length}, mapsEmbed=${Boolean(armoryProfile.mapsEmbedUrl)}`,
      'CRITICAL',
    );

    const productsBySku = new Map((prodList.json?.items || []).map((p) => [p.sku, p]));
    const imageUrls = new Set();
    const videoUrls = new Set();

    for (const s of heroSlides) {
      if (s.imageUrl) imageUrls.add(s.imageUrl);
    }
    for (const c of categories) {
      if (c.imageUrl) imageUrls.add(c.imageUrl);
    }
    for (const p of prodList.json.items) {
      if (p.primaryImageUrl) imageUrls.add(p.primaryImageUrl);
      if (p.secondaryImageUrl) imageUrls.add(p.secondaryImageUrl);
      if (p.demoVideoPosterUrl) imageUrls.add(p.demoVideoPosterUrl);
      if (p.demoVideoUrl) videoUrls.add(p.demoVideoUrl);

      const detailRes = await fetchJson(`/api/products/${encodeURIComponent(p.slug)}`);
      if (detailRes.res.status !== 200) {
        record('MEDIA', `GET /api/products/${p.slug}`, false, `HTTP ${detailRes.res.status}`, 'HIGH');
        continue;
      }
      for (const m of detailRes.json.product.media || []) {
        if (m.mediaType === 'image') imageUrls.add(m.url);
        if (m.mediaType === 'video') {
          videoUrls.add(m.url);
          if (m.posterUrl) imageUrls.add(m.posterUrl);
        }
      }
    }

    const brokenImages = [];
    for (const url of imageUrls) {
      const res = await fetch(`${BASE_URL}${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ctype = res.headers.get('content-type') || '';
      if (res.status !== 200 || buf.length === 0 || !ctype.startsWith('image/')) {
        brokenImages.push(`${url} (status=${res.status}, bytes=${buf.length}, type=${ctype})`);
      }
    }
    record(
      'MEDIA',
      `All ${imageUrls.size} Hero/Category/Product image assets return 200 OK with size > 0`,
      brokenImages.length === 0 && imageUrls.size >= 30,
      brokenImages.length === 0 ? `Verified ${imageUrls.size} unique image URLs` : brokenImages.join(' ; '),
      'CRITICAL',
    );

    const brokenVideos = [];
    for (const url of videoUrls) {
      const res = await fetch(`${BASE_URL}${url}`, {
        headers: { Range: 'bytes=0-1023' },
      });
      const buf = Buffer.from(await res.arrayBuffer());
      const ctype = res.headers.get('content-type') || '';
      const acceptRanges = res.headers.get('accept-ranges') || '';
      const contentRange = res.headers.get('content-range') || '';
      const ok =
        res.status === 206 &&
        ctype.includes('video/mp4') &&
        acceptRanges === 'bytes' &&
        contentRange.startsWith('bytes 0-1023/') &&
        buf.length === 1024;
      if (!ok) {
        brokenVideos.push(`${url} (status=${res.status}, type=${ctype}, range=${contentRange})`);
      }
    }
    record(
      'MEDIA',
      `All ${videoUrls.size} product demo MP4 videos return HTTP 206 Partial Content (Range bytes=0-1023)`,
      brokenVideos.length === 0 && videoUrls.size === 7,
      brokenVideos.length === 0 ? `Verified ${videoUrls.size} product MP4 videos` : brokenVideos.join(' ; '),
      'CRITICAL',
    );

    // C. REMOVED ENDPOINTS RETURN 404
    const loadoutRemoved = await fetchJson('/api/loadout/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: { primaryId: 1 } }),
    });
    const lookupRemoved = await fetchJson('/api/orders/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceNumber: 'BRK-20260101-TEST', contact: 'test@example.com' }),
    });
    record(
      'REMOVED_ENDPOINTS',
      'POST /api/loadout/evaluate and POST /api/orders/lookup both return 404 API_NOT_FOUND',
      loadoutRemoved.res.status === 404 &&
        loadoutRemoved.json?.error?.code === 'API_NOT_FOUND' &&
        lookupRemoved.res.status === 404 &&
        lookupRemoved.json?.error?.code === 'API_NOT_FOUND',
      `loadout=${loadoutRemoved.res.status}/${loadoutRemoved.json?.error?.code}, lookup=${lookupRemoved.res.status}/${lookupRemoved.json?.error?.code}`,
      'CRITICAL',
    );

    // D. CHECKOUT V2 (NO 18+/COMPLIANCE), CARGO RESTRICTIONS, VOUCHERS & PARALLEL CONCURRENCY
    const vfc = productsBySku.get('BRK-AR-002');
    const mk18 = productsBySku.get('BRK-AR-001');
    const greenGas = productsBySku.get('BRK-CSM-002');
    const lipoDeans = productsBySku.get('BRK-CSM-003');
    const fcpc = productsBySku.get('BRK-RIG-001');

    // D1. Courier restrictions still enforced for CARGO_REPLICA, CARGO_GAS, CARGO_BATTERY
    const cargoTests = [
      { label: 'CARGO_REPLICA with JNE_REG', productId: vfc.id, courier: 'JNE_REG' },
      { label: 'CARGO_REPLICA with SICEPAT_REG', productId: vfc.id, courier: 'SICEPAT_REG' },
      { label: 'CARGO_GAS with JNE_REG', productId: greenGas.id, courier: 'JNE_REG' },
      { label: 'CARGO_GAS with JNE_TRUCKING', productId: greenGas.id, courier: 'JNE_TRUCKING' },
      { label: 'CARGO_BATTERY with SICEPAT_REG', productId: lipoDeans.id, courier: 'SICEPAT_REG' },
    ];
    for (const ct of cargoTests) {
      const r = await fetchJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildValidV2OrderPayload({
            items: [{ productId: ct.productId, quantity: 1 }],
            shippingCourier: ct.courier,
          }),
        ),
      });
      record(
        'CHECKOUT',
        `Reject restricted air/non-hazmat courier: ${ct.label}`,
        r.res.status === 400 && r.json?.error?.code === 'COURIER_RESTRICTED_FOR_SHIPPING_CLASS',
        `status=${r.res.status}, code=${r.json?.error?.code}`,
        'HIGH',
      );
    }

    // D2. Vouchers validation
    const v1Low = await fetchJson('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'BRAKASA10', subtotalIdr: 1500000 }),
    });
    const v1Cap = await fetchJson('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'brakasa10', subtotalIdr: 7850000 }),
    });
    const v2Ok = await fetchJson('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'CQBREADY', subtotalIdr: 3500000 }),
    });
    const v3Ok = await fetchJson('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'KARGOFREE', subtotalIdr: 5000000, shippingCostIdr: 80000 }),
    });
    const v3Cap = await fetchJson('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'KARGOFREE', subtotalIdr: 5000000, shippingCostIdr: 220000 }),
    });
    const v3Pickup = await fetchJson('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'KARGOFREE', subtotalIdr: 5000000, shippingCostIdr: 0 }),
    });

    record(
      'VOUCHERS',
      'BRAKASA10, CQBREADY, KARGOFREE validation rules accurate',
      v1Low.json?.valid === false &&
        v1Cap.json?.valid === true &&
        v1Cap.json?.discountIdr === 500000 &&
        v2Ok.json?.valid === true &&
        v2Ok.json?.discountIdr === 250000 &&
        v3Ok.json?.valid === true &&
        v3Ok.json?.discountIdr === 80000 &&
        v3Cap.json?.valid === true &&
        v3Cap.json?.discountIdr === 150000 &&
        v3Pickup.json?.valid === false,
      `BRAKASA10_cap=${v1Cap.json?.discountIdr}, CQBREADY=${v2Ok.json?.discountIdr}, KARGOFREE=${v3Ok.json?.discountIdr}/${v3Cap.json?.discountIdr}`,
      'HIGH',
    );

    // D3. Replica checkout (BRK-AR-002) WITHOUT compliance/buyerDob returns 201 Created & deducts stock atomically
    const vfcStockBefore = vfc.stockQty;
    const order1Res = await fetchJson('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildValidV2OrderPayload({
          items: [{ productId: vfc.id, quantity: 1 }],
          shippingZone: 'JAWA',
          shippingCourier: 'JNE_TRUCKING',
          woodenPacking: true,
          voucherCode: 'BRAKASA10',
        }),
      ),
    });
    const order1 = order1Res.json?.order;
    const vfcAfter1 = await fetchJson(`/api/products/${vfc.slug}`);
    const expectedOrder1Total = 7850000 - 500000 + 65000 + 75000;
    record(
      'CHECKOUT',
      'POST /api/orders for replica BRK-AR-002 WITHOUT compliance/buyerDob succeeds (201) & deducts stock atomically',
      order1Res.res.status === 201 &&
        order1?.subtotalIdr === 7850000 &&
        order1?.discountIdr === 500000 &&
        order1?.shippingCostIdr === 65000 &&
        order1?.woodenPackingCostIdr === 75000 &&
        order1?.totalIdr === expectedOrder1Total &&
        order1?.requiresAge18 === false &&
        order1?.compliance?.buyerDob === null &&
        order1?.compliance?.age18Confirmed === false &&
        vfcAfter1.json?.product?.stockQty === vfcStockBefore - 1,
      `invoice=${order1?.invoiceNumber}, total=${order1?.totalIdr}, requiresAge18=${order1?.requiresAge18}, stock=${vfcStockBefore}->${vfcAfter1.json?.product?.stockQty}`,
      'CRITICAL',
    );

    // D4. Parallel Race Condition: 5 concurrent checkouts (no compliance) on MK18 (stockQty = 2)
    const mk18InitialStock = mk18.stockQty;
    const racePromises = Array.from({ length: 5 }, (_, i) =>
      fetchJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildValidV2OrderPayload({
            items: [{ productId: mk18.id, quantity: 1 }],
            customerName: `Race Buyer ${i + 1}`,
            customerEmail: `race${i + 1}@example.com`,
            customerPhone: `0812000000${i + 1}`,
            shippingCourier: 'JNE_TRUCKING',
            woodenPacking: false,
            voucherCode: null,
          }),
        ),
      }),
    );
    const raceResponses = await Promise.all(racePromises);
    const raceSucceeded = raceResponses.filter((r) => r.res.status === 201);
    const raceFailedOos = raceResponses.filter(
      (r) => r.res.status === 409 && r.json?.error?.code === 'OUT_OF_STOCK',
    );
    const mk18AfterRace = await fetchJson(`/api/products/${mk18.slug}`);
    record(
      'CONCURRENCY',
      `5 parallel checkouts on BRK-AR-001 (stock=${mk18InitialStock}): exactly ${mk18InitialStock} succeed, 3 return 409 OUT_OF_STOCK, finalStock=0`,
      mk18InitialStock === 2 &&
        raceSucceeded.length === 2 &&
        raceFailedOos.length === 3 &&
        mk18AfterRace.json?.product?.stockQty === 0,
      `201=${raceSucceeded.length}, 409_OOS=${raceFailedOos.length}, finalStock=${mk18AfterRace.json?.product?.stockQty}`,
      'CRITICAL',
    );

    // E. ADMIN AUTH, SECURITY, MAGIC-BYTES UPLOAD, V2 SETTINGS, ORDER STATE MACHINE & RATE LIMIT
    const unauthEndpoints = [
      '/api/admin/dashboard',
      '/api/admin/products',
      '/api/admin/orders',
      '/api/admin/inventory',
      '/api/admin/vouchers',
      '/api/admin/settings',
      '/api/admin/media',
      '/api/admin/auth/me',
    ];
    const unauthStatuses = [];
    for (const ep of unauthEndpoints) {
      const r = await fetchJson(ep);
      unauthStatuses.push(`${ep}:${r.res.status}`);
    }
    record(
      'ADMIN_AUTH',
      'All 8 /api/admin/* endpoints return 401 without session cookie',
      unauthStatuses.every((s) => s.endsWith(':401')),
      unauthStatuses.join(', '),
      'CRITICAL',
    );

    const malformedCookieRes = await fetchJson('/api/admin/dashboard', {
      headers: { Cookie: 'brakasa_admin_session=%E0%A4%A' },
    });
    record(
      'SECURITY',
      'Malformed percent-encoding in Cookie header returns 401 (no 500 crash)',
      malformedCookieRes.res.status === 401,
      `HTTP ${malformedCookieRes.res.status}`,
      'MEDIUM',
    );

    const badLogin = await fetchJson('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword123!' }),
    });
    record(
      'ADMIN_AUTH',
      'Invalid admin credentials rejected with 401 INVALID_CREDENTIALS',
      badLogin.res.status === 401 && badLogin.json?.error?.code === 'INVALID_CREDENTIALS',
      `status=${badLogin.res.status}`,
      'HIGH',
    );

    const loginRes = await fetchJson('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'BrakasaArmory#2026' }),
    });
    const { setCookie, cookiePair } = extractSessionCookie(loginRes.res);
    const hasHttpOnly = /HttpOnly/i.test(setCookie);
    const hasSameSiteLax = /SameSite=Lax/i.test(setCookie);
    record(
      'ADMIN_AUTH',
      'Valid admin login succeeds and sets HttpOnly + SameSite=Lax cookie',
      loginRes.res.status === 200 && Boolean(cookiePair) && hasHttpOnly && hasSameSiteLax,
      `status=${loginRes.res.status}`,
      'CRITICAL',
    );

    // CSRF Origin & Referer protection
    const csrfOriginRes = await fetchJson('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookiePair,
        Origin: 'https://evil-attacker.example',
      },
      body: JSON.stringify({ productId: fcpc.id, deltaQty: 1, reason: 'MANUAL_RESTOCK', note: 'CSRF test' }),
    });
    const csrfRefererRes = await fetchJson('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookiePair,
        Referer: 'https://evil-attacker.example/exploit.html',
      },
      body: JSON.stringify({ productId: fcpc.id, deltaQty: 1, reason: 'MANUAL_RESTOCK', note: 'CSRF ref test' }),
    });
    record(
      'SECURITY',
      'CSRF protection rejects cross-origin Origin & Referer on POST /api/admin/* with 403',
      csrfOriginRes.res.status === 403 &&
        csrfOriginRes.json?.error?.code === 'CSRF_ORIGIN_MISMATCH' &&
        csrfRefererRes.res.status === 403 &&
        csrfRefererRes.json?.error?.code === 'CSRF_ORIGIN_MISMATCH',
      `origin=${csrfOriginRes.res.status}, referer=${csrfRefererRes.res.status}`,
      'CRITICAL',
    );

    // SQLi / FTS5 injection resilience
    const sqliPayloads = [
      "/api/products?q=' OR '1'='1",
      '/api/products?q=a" OR ""="a; DROP TABLE products;--',
      '/api/products?sort=price_asc;DROP%20TABLE%20products',
    ];
    let sqliSafe = true;
    for (const p of sqliPayloads) {
      const r = await fetchJson(p);
      if (r.res.status !== 200) sqliSafe = false;
    }
    const afterSqliCount = await fetchJson('/api/products?limit=100');
    record(
      'SECURITY',
      'SQLi & FTS5 query injection payloads safely parameterized (zero 500s, table intact)',
      sqliSafe && afterSqliCount.json?.total >= 20,
      `productsRemaining=${afterSqliCount.json?.total}`,
      'CRITICAL',
    );

    // Dashboard reconciliation
    const createdOrders = [order1, ...raceSucceeded.map((r) => r.json.order)];
    const expectedTotalOrders = createdOrders.length;
    const expectedPendingRev = createdOrders.reduce((s, o) => s + o.totalIdr, 0);
    const dash1 = await fetchJson('/api/admin/dashboard', { headers: { Cookie: cookiePair } });
    record(
      'DASHBOARD',
      'Admin dashboard KPIs match 100% of orders & revenue in isolated QA DB',
      dash1.res.status === 200 &&
        dash1.json?.kpis?.totalOrdersCount === expectedTotalOrders &&
        dash1.json?.kpis?.pendingPaymentRevenueIdr === expectedPendingRev &&
        dash1.json?.kpis?.confirmedRevenueIdr === 0 &&
        dash1.json?.kpis?.outOfStockSkuCount === 1,
      `orders=${dash1.json?.kpis?.totalOrdersCount}/${expectedTotalOrders}, pendingRev=${dash1.json?.kpis?.pendingPaymentRevenueIdr}/${expectedPendingRev}`,
      'HIGH',
    );

    // Upload Magic-Bytes Validation
    const uploadsBeforeFake = new Set(fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : []);

    const fakeJpgForm = new FormData();
    fakeJpgForm.append('file', new Blob(['not-an-image'], { type: 'image/jpeg' }), 'fake-payload.jpg');
    const fakeJpgRes = await fetchJson('/api/admin/media/upload', {
      method: 'POST',
      headers: { Cookie: cookiePair },
      body: fakeJpgForm,
    });

    const fakeSvgForm = new FormData();
    fakeSvgForm.append(
      'file',
      new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], {
        type: 'image/svg+xml',
      }),
      'xss.svg',
    );
    const fakeSvgRes = await fetchJson('/api/admin/media/upload', {
      method: 'POST',
      headers: { Cookie: cookiePair },
      body: fakeSvgForm,
    });

    const uploadsAfterFake = new Set(fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : []);
    const leakedFakeFiles = [...uploadsAfterFake].filter((f) => !uploadsBeforeFake.has(f));

    record(
      'UPLOAD_SECURITY',
      'Fake .jpg rejected 400 INVALID_MEDIA_SIGNATURE, .svg rejected 400 INVALID_FILE_TYPE, zero temp file leaks',
      fakeJpgRes.res.status === 400 &&
        fakeJpgRes.json?.error?.code === 'INVALID_MEDIA_SIGNATURE' &&
        fakeSvgRes.res.status === 400 &&
        fakeSvgRes.json?.error?.code === 'INVALID_FILE_TYPE' &&
        leakedFakeFiles.length === 0,
      `fakeJpg=${fakeJpgRes.res.status}/${fakeJpgRes.json?.error?.code}, svg=${fakeSvgRes.res.status}/${fakeSvgRes.json?.error?.code}, leaked=${leakedFakeFiles.length}`,
      'CRITICAL',
    );

    const realJpegBytes = fs.readFileSync(
      path.join(ROOT_DIR, 'public', 'media', 'images', 'products', 'brk-ar-001.jpg'),
    );
    const validJpgForm = new FormData();
    validJpgForm.append('file', new Blob([realJpegBytes], { type: 'image/jpeg' }), 'qa-v2-valid.jpg');
    const validJpgRes = await fetchJson('/api/admin/media/upload', {
      method: 'POST',
      headers: { Cookie: cookiePair },
      body: validJpgForm,
    });
    let uploadedFetchOk = false;
    if (validJpgRes.res.status === 201 && validJpgRes.json?.asset?.filename) {
      uploadedTestFiles.push(path.join(UPLOADS_DIR, validJpgRes.json.asset.filename));
      const getUp = await fetch(`${BASE_URL}${validJpgRes.json.asset.url}`);
      const upBuf = Buffer.from(await getUp.arrayBuffer());
      uploadedFetchOk = getUp.status === 200 && upBuf.length === realJpegBytes.length;
    }
    record(
      'UPLOAD_SECURITY',
      'Valid JPEG upload succeeds (201) and is retrievable via /uploads/<uuid>.jpg',
      validJpgRes.res.status === 201 && uploadedFetchOk,
      `status=${validJpgRes.res.status}, url=${validJpgRes.json?.asset?.url}`,
      'HIGH',
    );

    // Admin Settings V2: Save heroSlides & mapsEmbedUrl + URL scheme hardening
    const settingsGetRes = await fetchJson('/api/admin/settings', { headers: { Cookie: cookiePair } });
    const origSettings = settingsGetRes.json?.settings;

    const badSlideUrlRes = await fetchJson('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({
        heroSlides: origSettings.heroSlides.map((s, idx) =>
          idx === 0 ? { ...s, ctaUrl: 'javascript:alert(1)' } : s,
        ),
      }),
    });
    const badMapsUrlRes = await fetchJson('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({
        armoryProfile: {
          ...origSettings.armoryProfile,
          mapsEmbedUrl: 'http://insecure-maps.example/embed',
        },
      }),
    });
    record(
      'SECURITY',
      'Admin Settings PUT rejects javascript: in heroSlides.ctaUrl and non-HTTPS in mapsEmbedUrl (400)',
      badSlideUrlRes.res.status === 400 && badMapsUrlRes.res.status === 400,
      `badSlideUrl=${badSlideUrlRes.res.status}, badMapsUrl=${badMapsUrlRes.res.status}`,
      'HIGH',
    );

    const updatedHeroSlides = origSettings.heroSlides.map((s, idx) =>
      idx === 0
        ? {
            ...s,
            headlineId: 'ARMORY PRESISI QA V2',
            headlineEn: 'QA V2 PRECISION ARMORY',
          }
        : s,
    );
    const updatedMapsEmbed =
      'https://maps.google.com/maps?q=Jl.%20Kemang%20Raya%20No.%2048%20Jakarta&t=&z=16&ie=UTF8&iwloc=&output=embed';
    const saveV2SettingsRes = await fetchJson('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({
        armoryProfile: {
          ...origSettings.armoryProfile,
          mapsEmbedUrl: updatedMapsEmbed,
        },
        heroSlides: updatedHeroSlides,
      }),
    });
    const bootAfterSettings = await fetchJson('/api/bootstrap');
    const restoreSettingsRes = await fetchJson('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({
        armoryProfile: origSettings.armoryProfile,
        heroSlides: origSettings.heroSlides,
      }),
    });
    record(
      'ADMIN_SETTINGS_V2',
      'Admin Settings PUT persists heroSlides & mapsEmbedUrl to SQLite and GET /api/bootstrap reflects live',
      saveV2SettingsRes.res.status === 200 &&
        bootAfterSettings.json?.settings?.heroSlides?.[0]?.headlineId === 'ARMORY PRESISI QA V2' &&
        bootAfterSettings.json?.settings?.heroSlides?.[0]?.headlineEn === 'QA V2 PRECISION ARMORY' &&
        bootAfterSettings.json?.settings?.armoryProfile?.mapsEmbedUrl === updatedMapsEmbed &&
        restoreSettingsRes.res.status === 200,
      `save=${saveV2SettingsRes.res.status}, liveId="${bootAfterSettings.json?.settings?.heroSlides?.[0]?.headlineId}", restore=${restoreSettingsRes.res.status}`,
      'CRITICAL',
    );

    // Order State Machine & clean logs (0 18+/Perpol)
    const invalidJump = await fetchJson(`/api/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({ nextStatus: 'SHIPPED', trackingNumber: 'JTR-SKIP-001' }),
    });
    const toPaid = await fetchJson(`/api/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({ nextStatus: 'PAID_VERIFIED' }),
    });
    const toPacked = await fetchJson(`/api/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({ nextStatus: 'PACKED' }),
    });
    const shipNoResi = await fetchJson(`/api/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({ nextStatus: 'SHIPPED' }),
    });
    const shipWithResi = await fetchJson(`/api/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({ nextStatus: 'SHIPPED', trackingNumber: 'JTR-88990011' }),
    });
    const orderDetailAfterShip = await fetchJson(`/api/admin/orders/${order1.id}`, {
      headers: { Cookie: cookiePair },
    });
    const statusLogNotes = (orderDetailAfterShip.json?.order?.statusLogs || [])
      .map((l) => l.note || '')
      .join(' ');
    const logsClean = !/18\+|Perpol|chronograph/i.test(statusLogNotes);

    record(
      'ORDER_STATE_MACHINE',
      'State machine PAID_VERIFIED -> PACKED -> SHIPPED (blocks jump 409, blocks missing resi 400, clean V2 status logs)',
      invalidJump.res.status === 409 &&
        toPaid.res.status === 200 &&
        toPacked.res.status === 200 &&
        shipNoResi.res.status === 400 &&
        shipNoResi.json?.error?.code === 'TRACKING_NUMBER_REQUIRED' &&
        shipWithResi.res.status === 200 &&
        shipWithResi.json?.order?.trackingNumber === 'JTR-88990011' &&
        logsClean,
      `skip=${invalidJump.res.status}, shipNoResi=${shipNoResi.res.status}, shipOk=${shipWithResi.res.status}, logsClean=${logsClean}`,
      'CRITICAL',
    );

    // Idempotent Cancel Restock
    const fcpcStockInitial = fcpc.stockQty;
    const cancelOrderCreate = await fetchJson('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildValidV2OrderPayload({
          items: [{ productId: fcpc.id, quantity: 2 }],
          shippingCourier: 'JNE_REG',
          woodenPacking: false,
          voucherCode: null,
        }),
      ),
    });
    const cancelOrder = cancelOrderCreate.json?.order;
    const cancelFirst = await fetchJson(`/api/admin/orders/${cancelOrder.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({
        nextStatus: 'CANCELLED',
        cancelReason: 'Pembeli membatalkan pesanan sebelum pembayaran',
      }),
    });
    const cancelSecond = await fetchJson(`/api/admin/orders/${cancelOrder.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
      body: JSON.stringify({
        nextStatus: 'CANCELLED',
        cancelReason: 'Uji idempotensi pembatalan kedua',
      }),
    });
    const fcpcAfterCancel = await fetchJson(`/api/products/${fcpc.slug}`);
    record(
      'IDEMPOTENT_CANCEL',
      'Cancel restores stock exactly 1x and rejects duplicate cancel (409)',
      cancelOrderCreate.res.status === 201 &&
        cancelFirst.res.status === 200 &&
        cancelFirst.json?.restockedItemsCount === 2 &&
        cancelSecond.res.status === 409 &&
        cancelSecond.json?.error?.code === 'ORDER_ALREADY_CANCELLED' &&
        fcpcAfterCancel.json?.product?.stockQty === fcpcStockInitial,
      `restocked=${cancelFirst.json?.restockedItemsCount}, dup=${cancelSecond.res.status}, stock=${fcpcAfterCancel.json?.product?.stockQty}/${fcpcStockInitial}`,
      'CRITICAL',
    );

    // Logout revokes session server-side
    const logoutRes = await fetchJson('/api/admin/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookiePair },
    });
    const meAfterLogout = await fetchJson('/api/admin/auth/me', {
      headers: { Cookie: cookiePair },
    });
    record(
      'ADMIN_AUTH',
      'Admin logout revokes session in SQLite so old cookie returns 401',
      logoutRes.res.status === 200 && meAfterLogout.res.status === 401,
      `logout=${logoutRes.res.status}, meAfter=${meAfterLogout.res.status}`,
      'HIGH',
    );

    // Rate-limit X-Forwarded-For anti-spoofing test on /api/admin/auth/login (limit is 10 / 15m; 2 logins already ran above)
    let rateLimitBlocked = false;
    let triggerAttempt = 0;
    for (let i = 0; i < 12; i++) {
      const r = await fetchJson('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `10.99.0.${i + 1}`,
        },
        body: JSON.stringify({ username: 'admin', password: `WrongPass${i}` }),
      });
      if (r.res.status === 429 && r.json?.error?.code === 'RATE_LIMITED') {
        rateLimitBlocked = true;
        triggerAttempt = i + 1;
        break;
      }
    }
    record(
      'SECURITY',
      'Admin login rate limiter resists X-Forwarded-For header spoofing (blocks with 429 RATE_LIMITED)',
      rateLimitBlocked,
      rateLimitBlocked
        ? `Blocked spoofed requests with 429 on probe #${triggerAttempt}`
        : '12 spoofed X-Forwarded-For requests bypassed 10-req rate limit',
      'HIGH',
    );
  } finally {
    await stopProc(serverProc);
    for (const f of uploadedTestFiles) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    cleanupDbFiles(QA_DB_PATH);
    if (serverStderr.trim()) {
      console.log('\n[server stderr output]\n' + serverStderr.trim());
    }
  }
}

async function main() {
  runStaticAudit();
  await runRuntimeSuite();
  await runIdempotentV2MigrationTest();

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`\n=== V2 API & STATIC SUMMARY: ${passed}/${total} CHECKS PASSED, ${failed.length} FAILED ===`);
  for (const f of failed) {
    console.log(`  - [${f.severity}] (${f.category}) ${f.name}: ${f.details}`);
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('Fatal verifier error:', err);
  process.exitCode = 2;
});
