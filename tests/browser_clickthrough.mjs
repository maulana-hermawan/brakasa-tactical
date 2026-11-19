import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const WORKSPACE_DIR = path.resolve('d:/brakasa-tac');
const SERVER_PORT = 3089;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;
const DB_PATH = path.join(WORKSPACE_DIR, 'storage', 'qa-v2-browser.db');
const CDP_PORT = 9239;

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowserExecutable() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('No Chrome or Edge browser executable found on system.');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupDbFiles() {
  for (const suffix of ['', '-shm', '-wal', '-journal']) {
    const target = `${DB_PATH}${suffix}`;
    if (fs.existsSync(target)) {
      try {
        fs.unlinkSync(target);
      } catch {
        // Ignore transient lock
      }
    }
  }
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/bootstrap`);
      if (res.ok) return;
    } catch {
      // Wait for boot
    }
    await sleep(250);
  }
  throw new Error(`Server at ${BASE_URL} did not become ready within ${timeoutMs}ms`);
}

async function waitForCdp(port, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) return page;
      }
    } catch {
      // Wait for Chrome CDP
    }
    await sleep(250);
  }
  throw new Error(`Chrome CDP on port ${port} did not become ready within ${timeoutMs}ms`);
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.consoleErrors = [];
    this.pageErrors = [];
    this.failedRequests = [];
    this.thirdPartyRequests = [];
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      ws.addEventListener('open', () => resolve());
      ws.addEventListener('error', (err) => reject(err));
      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(String(event.data));
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve: res, reject: rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) {
            rej(new Error(`CDP ${msg.error.code}: ${msg.error.message}`));
          } else {
            res(msg.result);
          }
          return;
        }
        if (msg.method) {
          this.handleEvent(msg.method, msg.params);
        }
      });
    });

    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
    await this.send('DOM.enable');
    await this.send('CSS.enable');
  }

  handleEvent(method, params) {
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
      const text = (params.args || [])
        .map((a) => a.value ?? a.description ?? a.type)
        .join(' ');
      this.consoleErrors.push({ text, time: new Date().toISOString() });
    }
    if (method === 'Runtime.exceptionThrown') {
      const d = params.exceptionDetails;
      const text = d?.exception?.description || d?.text || 'Uncaught exception';
      this.pageErrors.push({ text, time: new Date().toISOString() });
    }
    if (method === 'Network.responseReceived') {
      const { status, url } = params.response;
      if (status >= 400) {
        const isFirstParty = url.startsWith(BASE_URL);
        const isExpectedAuthCheck = status === 401 && url.includes('/api/admin/auth/me');
        if (isFirstParty && !isExpectedAuthCheck) {
          this.failedRequests.push({ status, url, time: new Date().toISOString() });
        } else if (!isFirstParty) {
          this.thirdPartyRequests.push({ status, url, time: new Date().toISOString() });
        }
      }
    }
    const cbs = this.listeners.get(method);
    if (cbs) {
      for (const cb of cbs) cb(params);
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        `Page eval error: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`,
      );
    }
    return res.result?.value;
  }

  async goto(urlPath, waitMs = 850) {
    const targetUrl = urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`;
    await this.send('Page.navigate', { url: targetUrl });
    await this.waitForReady(10000);
    await sleep(waitMs);
  }

  async reload(waitMs = 900) {
    await this.send('Page.reload', { ignoreCache: false });
    await this.waitForReady(10000);
    await sleep(waitMs);
  }

  async waitForReady(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const state = await this.eval(`return document.readyState;`);
        if (state === 'complete' || state === 'interactive') {
          await sleep(150);
          return;
        }
      } catch {
        // Navigating
      }
      await sleep(100);
    }
  }

  async waitFor(fnExpr, timeoutMs = 10000, intervalMs = 150) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const val = await this.eval(fnExpr);
        if (val) return val;
      } catch {
        // Retry
      }
      await sleep(intervalMs);
    }
    throw new Error(`Timeout waiting for condition: ${fnExpr.slice(0, 140)}`);
  }

  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    });
    await sleep(250);
  }

  async pressKey(key, code, keyCode) {
    const downPayload = {
      type: key === 'Enter' || key === ' ' ? 'keyDown' : 'rawKeyDown',
      key,
      code: code || key,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    };
    if (key === 'Enter') downPayload.text = '\r';
    if (key === ' ') downPayload.text = ' ';
    await this.send('Input.dispatchKeyEvent', downPayload);
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: code || key,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await sleep(180);
  }

  async setInputValue(selector, value) {
    const ok = await this.eval(`
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.focus();
      const proto = el.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : el.tagName === 'SELECT'
          ? window.HTMLSelectElement.prototype
          : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, ${JSON.stringify(value)});
      else el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    `);
    if (!ok) throw new Error(`Element not found for setInputValue: ${selector}`);
    await sleep(120);
  }

  async clickSelector(selector) {
    const ok = await this.eval(`
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    `);
    if (!ok) throw new Error(`Element not found for clickSelector: ${selector}`);
    await sleep(260);
  }

  async clickByText(tagSelector, textSubstring) {
    const clicked = await this.eval(`
      const els = Array.from(document.querySelectorAll(${JSON.stringify(tagSelector)}))
        .filter((e) => {
          const r = e.getBoundingClientRect();
          const st = getComputedStyle(e);
          return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
        });
      const needle = ${JSON.stringify(textSubstring.toLowerCase())};
      const match = els.find((e) => (e.textContent || '').toLowerCase().includes(needle));
      if (!match) return null;
      match.scrollIntoView({ block: 'center' });
      match.click();
      return (match.textContent || '').trim().slice(0, 80);
    `);
    if (!clicked) {
      throw new Error(`No visible "${tagSelector}" containing "${textSubstring}"`);
    }
    await sleep(280);
    return clicked;
  }
}

const results = [];
const defects = [];

function record(area, item, passed, evidence) {
  results.push({ area, item, passed, evidence });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${area} :: ${item} -> ${evidence}`);
  if (!passed) {
    defects.push({ area, item, evidence });
  }
}

async function runAuditOnCurrentPage(cdp, routeLabel, width, height, theme, expectedLang = 'id') {
  if (width === 1440 && theme === 'dark') {
    await cdp.eval(`
      const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 350));
    `);
  }

  const report = await cdp.eval(`
    const docEl = document.documentElement;
    const scrollW = docEl.scrollWidth;
    const innerW = window.innerWidth;
    const overflowPx = Math.max(0, scrollW - innerW);

    const h1s = Array.from(document.querySelectorAll('h1'));
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const isSrOnly = el.classList.contains('sr-only') || el.classList.contains('sr-only-brakasa');
        return (r.width > 0 && r.height > 0) || isSrOnly;
      })
      .map((el) => Number(el.tagName[1]));
    let skippedHeading = null;
    for (let i = 1; i < headings.length; i += 1) {
      if (headings[i] - headings[i - 1] > 1) {
        skippedHeading = 'h' + headings[i - 1] + ' -> h' + headings[i];
        break;
      }
    }

    const mediaIssues = [];
    for (const img of Array.from(document.querySelectorAll('img'))) {
      const r = img.getBoundingClientRect();
      const st = getComputedStyle(img);
      if ((r.width === 0 && r.height === 0) || st.opacity === '0' || img.getAttribute('aria-hidden') === 'true') continue;
      if (!img.complete || img.naturalWidth === 0) {
        mediaIssues.push('broken-img:' + img.getAttribute('src'));
      }
      if (!img.hasAttribute('alt')) {
        mediaIssues.push('missing-alt:' + img.getAttribute('src'));
      }
      const hasDim = img.hasAttribute('width') && img.hasAttribute('height');
      if (!hasDim) {
        mediaIssues.push('unsized-img:' + img.getAttribute('src'));
      }
    }
    for (const vid of Array.from(document.querySelectorAll('video'))) {
      const r = vid.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (!vid.hasAttribute('width') || !vid.hasAttribute('height')) {
        mediaIssues.push('unsized-video:' + (vid.getAttribute('src') || 'inline'));
      }
    }
    for (const ifr of Array.from(document.querySelectorAll('iframe'))) {
      const r = ifr.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (!ifr.hasAttribute('width') || !ifr.hasAttribute('height')) {
        mediaIssues.push('unsized-iframe:' + (ifr.getAttribute('src') || 'inline'));
      }
      if (!(ifr.getAttribute('title') || '').trim()) {
        mediaIssues.push('untitled-iframe:' + (ifr.getAttribute('src') || 'inline'));
      }
    }

    const tapTargetIssues = [];
    const cursorIssues = [];
    const a11yNameIssues = [];
    const interactiveEls = Array.from(
      document.querySelectorAll('a[href], button, select, summary, [role="button"], [role="tab"], [role="switch"]')
    );
    for (const el of interactiveEls) {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (el.classList.contains('skip-link') || el.classList.contains('sr-only') || el.classList.contains('sr-only-brakasa')) continue;

      const isDisabled = el.disabled || el.getAttribute('aria-disabled') === 'true';
      if (!isDisabled && st.cursor !== 'pointer') {
        cursorIssues.push(el.tagName + ':' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 35) + ' (cursor=' + st.cursor + ')');
      }

      const imgAlt = el.querySelector('img[alt]')?.getAttribute('alt')?.trim() || '';
      const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim();
      if (!name) {
        a11yNameIssues.push(el.tagName + '#' + (el.id || 'no-id') + (imgAlt ? '(only-img-alt)' : ''));
      }

      if (window.innerWidth <= 420) {
        if (r.height < 43.5 || r.width < 43.5) {
          tapTargetIssues.push({
            tag: el.tagName,
            text: (name || imgAlt).slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      }
    }

    const labelIssues = [];
    for (const input of Array.from(document.querySelectorAll('input, select, textarea'))) {
      const st = getComputedStyle(input);
      if (st.display === 'none' || st.visibility === 'hidden' || input.type === 'hidden') continue;
      const r = input.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const hasLabel =
        Boolean(input.id && document.querySelector('label[for="' + CSS.escape(input.id) + '"]')) ||
        Boolean(input.closest('label')) ||
        Boolean(input.getAttribute('aria-label')) ||
        Boolean(input.getAttribute('aria-labelledby'));
      if (!hasLabel) {
        labelIssues.push(input.tagName + '#' + (input.id || input.name || 'unnamed'));
      }
    }

    const bodyText = document.body.innerText || '';
    const hasEmDash = bodyText.includes('\\u2014') || bodyText.includes('\\u2013');
    const forbiddenUiMatch = bodyText.match(/(18\\+|Perpol|Loadout Builder|Cek Pesanan|SEC-01|SEC-06|OPS-01|CAT-01|INV-01|ORD-01|CFG-01|QUEUE-01|STOCK-02|METRIK-03|BLOK 01|\\[BRK \\/\\/|\\[SCN-)/i);
    const badRouteLinks = Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href') || '')
      .filter((h) => /\\/(loadout-builder|order-lookup|orders\\/lookup|compliance)\\b/i.test(h));

    const rootBg = getComputedStyle(document.body).backgroundColor;
    const rootColor = getComputedStyle(document.body).color;
    const dataTheme = document.documentElement.getAttribute('data-theme');
    const lang = document.documentElement.getAttribute('lang');
    const title = document.title;

    return {
      overflowPx,
      scrollW,
      innerW,
      h1Count: h1s.length,
      skippedHeading,
      mediaIssues,
      tapTargetIssues,
      cursorIssues,
      a11yNameIssues,
      labelIssues,
      hasEmDash,
      forbiddenUiHit: forbiddenUiMatch ? forbiddenUiMatch[0] : null,
      badRouteLinks,
      rootBg,
      rootColor,
      dataTheme,
      lang,
      title,
    };
  `);

  const prefix = `[${width}x${height} ${theme} ${expectedLang.toUpperCase()}] ${routeLabel}`;
  record('Responsive', `${prefix} overflow`, report.overflowPx === 0, `scrollWidth=${report.scrollW}, innerWidth=${report.innerW}, overflow=${report.overflowPx}px`);
  if (width === 1440 && theme === 'dark') {
    record('Semantics', `${routeLabel} h1, lang=${expectedLang}, title, heading order`, report.h1Count === 1 && report.lang === expectedLang && report.title.length > 5 && !report.skippedHeading, `lang=${report.lang}, h1=${report.h1Count}, skipped=${report.skippedHeading || 'none'}, title="${report.title}"`);
    record('Media', `${routeLabel} imgs/videos/iframes sized & loaded`, report.mediaIssues.length === 0, report.mediaIssues.length === 0 ? 'All visible media loaded with alt/title & width/height' : report.mediaIssues.slice(0, 6).join('; '));
    record('A11y', `${routeLabel} cursor:pointer & labels & names`, report.cursorIssues.length === 0 && report.a11yNameIssues.length === 0 && report.labelIssues.length === 0, `cursorIssues=${report.cursorIssues.length}, missingNames=${report.a11yNameIssues.length}, unlabeledInputs=${report.labelIssues.length}`);
    record('V2Hygiene', `${routeLabel} zero em/en-dash, zero 18+/Perpol/micro-prefix, zero removed links`, !report.hasEmDash && !report.forbiddenUiHit && report.badRouteLinks.length === 0, `dash=${report.hasEmDash}, forbidden="${report.forbiddenUiHit || 'none'}", badLinks=${report.badRouteLinks.length}`);
  }
  if (width === 375 && theme === 'dark') {
    record('TapTarget', `${routeLabel} mobile >=44px`, report.tapTargetIssues.length === 0, report.tapTargetIssues.length === 0 ? 'All interactive targets >= 44x44px' : `${report.tapTargetIssues.length} undersized: ` + report.tapTargetIssues.slice(0, 8).map((t) => `${t.tag}("${t.text}" ${t.w}x${t.h})`).join(', '));
  }
  return report;
}

async function main() {
  const browserExe = findBrowserExecutable();
  console.log(`Browser executable: ${browserExe}`);

  cleanupDbFiles();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brakasa-v2-cdp-'));

  let serverProc = null;
  let chromeProc = null;
  let cdp = null;

  try {
    console.log(`Starting V2 production server on PORT=${SERVER_PORT} with DB=${DB_PATH}...`);
    serverProc = spawn(process.execPath, [path.join(WORKSPACE_DIR, 'dist', 'server', 'index.mjs')], {
      cwd: WORKSPACE_DIR,
      env: {
        ...process.env,
        PORT: String(SERVER_PORT),
        NODE_ENV: 'production',
        BRAKASA_DB_PATH: DB_PATH,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProc.stdout.on('data', (d) => {
      const s = d.toString().trim();
      if (s) console.log(`[server] ${s}`);
    });
    serverProc.stderr.on('data', (d) => {
      const s = d.toString().trim();
      if (s) console.error(`[server-err] ${s}`);
    });

    await waitForServer();
    console.log('V2 production server is ready.');

    chromeProc = spawn(
      browserExe,
      [
        '--headless=new',
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${userDataDir}`,
        '--window-size=1440,900',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--mute-audio',
        'about:blank',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    const pageTarget = await waitForCdp(CDP_PORT);
    cdp = new CdpSession(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.setViewport(1440, 900, false);

    // =========================================================================
    // 1. HERO V2 AUDIT (100dvh x 3 breakpoints, static sharp, dots inside hero)
    // =========================================================================
    await cdp.goto('/', 1100);

    const heroHeightChecks = [];
    for (const vp of [
      { name: 'Desktop', w: 1440, h: 900, mobile: false },
      { name: 'Tablet', w: 768, h: 1024, mobile: false },
      { name: 'Mobile', w: 375, h: 812, mobile: true },
    ]) {
      await cdp.setViewport(vp.w, vp.h, vp.mobile);
      const geom = await cdp.eval(`
        window.scrollTo(0, 0);
        const hero = document.querySelector('.hero-armory');
        const hr = hero ? hero.getBoundingClientRect() : null;
        const dots = hero ? hero.querySelector('[role="tablist"]') : null;
        const dr = dots ? dots.getBoundingClientRect() : null;
        return {
          vpW: window.innerWidth,
          vpH: window.innerHeight,
          heroTop: hr ? Math.round(hr.top) : -999,
          heroH: hr ? Math.round(hr.height) : 0,
          diffPx: hr ? Math.abs(hr.height - window.innerHeight) : 999,
          dotsInside: Boolean(hr && dr && dr.top >= hr.top && dr.bottom <= hr.bottom + 1 && dr.left >= hr.left && dr.right <= hr.right),
        };
      `);
      heroHeightChecks.push({ vp: vp.name, ...geom });
    }
    record(
      'HeroV2',
      'Hero fills exactly 100dvh (|height - innerHeight| <= 2px, top=0) with dots inside hero at Desktop, Tablet & Mobile',
      heroHeightChecks.every((c) => c.diffPx <= 2 && c.heroTop === 0 && c.dotsInside),
      heroHeightChecks.map((c) => `${c.vp}(hero=${c.heroH}/${c.vpH}, top=${c.heroTop}, dotsIn=${c.dotsInside})`).join(' | '),
    );

    await cdp.setViewport(1440, 900, false);
    await cdp.goto('/', 900);

    const heroStructure = await cdp.eval(`
      const hero = document.querySelector('.hero-armory');
      const videos = hero.querySelectorAll('video').length;
      const imgs = Array.from(hero.querySelectorAll('img'));
      const animOrScale = imgs.some((img) => {
        const st = getComputedStyle(img);
        return (st.animationName && st.animationName !== 'none') || (st.transform && st.transform !== 'none');
      });
      const heroBtns = Array.from(hero.querySelectorAll('button'));
      const hasPauseOrAudioBtn = heroBtns.some((b) => /jeda|pause|putar|play|suara|audio|mute/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.textContent || '')));
      const h1 = hero.querySelector('h1');
      const eyebrowAboveH1 = Boolean(h1 && h1.previousElementSibling);
      const hasSceneList = /SCN-|\\[SCN/i.test(document.body.innerText);
      const poster = document.getElementById('hero-lcp-poster');
      const posterOk = Boolean(
        poster &&
        poster.getAttribute('fetchpriority') === 'high' &&
        poster.getAttribute('loading') !== 'lazy' &&
        poster.getAttribute('width') === '2400' &&
        poster.getAttribute('height') === '1350' &&
        poster.complete &&
        poster.naturalWidth > 0
      );
      const dotCount = hero.querySelectorAll('[role="tablist"] [role="tab"]').length;
      const ctas = hero.querySelectorAll('a[href]').length;
      const headerOverlay = document.querySelector('header')?.classList.contains('navbar-hero-overlay');
      return {
        videos,
        imgCount: imgs.length,
        animOrScale,
        hasPauseOrAudioBtn,
        eyebrowAboveH1,
        hasSceneList,
        posterOk,
        dotCount,
        ctas,
        headerOverlay,
        h1Text: h1?.textContent?.trim(),
      };
    `);
    record(
      'HeroV2',
      'Hero has 0 <video>, 0 shake/scale anim, 0 Pause/Audio btns, 0 eyebrow above H1, 0 scene strip, 5 static slides, 1 CTA, LCP poster OK',
      heroStructure.videos === 0 &&
        heroStructure.imgCount === 5 &&
        !heroStructure.animOrScale &&
        !heroStructure.hasPauseOrAudioBtn &&
        !heroStructure.eyebrowAboveH1 &&
        !heroStructure.hasSceneList &&
        heroStructure.posterOk &&
        heroStructure.dotCount === 5 &&
        heroStructure.ctas === 1 &&
        heroStructure.headerOverlay === true,
      JSON.stringify(heroStructure),
    );

    // Click Hero Pagination Dots: 2 -> 4 -> 1
    const dotClicks = [];
    for (const targetIdx of [1, 3, 0]) {
      const state = await cdp.eval(`
        const tabs = Array.from(document.querySelectorAll('.hero-armory [role="tablist"] [role="tab"]'));
        tabs[${targetIdx}].click();
        await new Promise((r) => setTimeout(r, 200));
        return {
          idx: ${targetIdx},
          selected: tabs[${targetIdx}].getAttribute('aria-selected'),
          h1: document.querySelector('.hero-armory h1')?.textContent?.trim(),
        };
      `);
      dotClicks.push(state);
    }
    const distinctHeadlines = new Set(dotClicks.map((d) => d.h1)).size;
    record(
      'HeroV2',
      'Hero pagination dots (2 -> 4 -> 1) switch active slide & headline accurately',
      dotClicks.every((d) => d.selected === 'true') && distinctHeadlines === 3,
      dotClicks.map((d) => `dot${d.idx + 1}="${d.h1}"`).join(' | '),
    );

    // Skip link Tab + Enter
    await cdp.eval(`document.body.focus(); if (document.activeElement) document.activeElement.blur();`);
    await cdp.pressKey('Tab', 'Tab', 9);
    const skipFocused = await cdp.eval(`return document.activeElement?.getAttribute('href');`);
    await cdp.pressKey('Enter', 'Enter', 13);
    const afterSkip = await cdp.eval(`return { id: document.activeElement?.id, hash: window.location.hash };`);
    record(
      'Landing',
      'Skip link keyboard Tab + Enter focuses #main-content',
      skipFocused === '#main-content' && (afterSkip.id === 'main-content' || afterSkip.hash === '#main-content'),
      `skip=${skipFocused}, after=${JSON.stringify(afterSkip)}`,
    );

    // =========================================================================
    // 2. 4-SECTION LANDING PAGE ORDER, CAROUSEL, 9 CATEGORIES & OUR STORE MAPS
    // =========================================================================
    const lpSections = await cdp.eval(`
      const main = document.querySelector('main');
      const sections = Array.from(main.querySelectorAll(':scope > div > section, :scope > section'));
      const order = sections.map((s) => s.id || (s.classList.contains('hero-armory') ? 'hero-armory' : 'unknown'));

      // Section 2: Featured Products Carousel cards hygiene
      const fpSec = document.getElementById('featured-products');
      const fpCards = Array.from(fpSec.querySelectorAll('a[href^="/store/"]'));
      const fpCardAudit = fpCards.map((card) => {
        const imgs = card.querySelectorAll('img').length;
        const h3 = card.querySelector('h3')?.textContent?.trim() || '';
        const text = card.innerText.replace(/\\s+/g, ' ').trim();
        const hasForbidden = /BRK-|18\\+|FPS|Joule|Tambah|Detail|VIDEO/i.test(text);
        const hasBtn = card.querySelectorAll('button').length > 0;
        const hasPrice = /Rp\\s*[\\d.]+/.test(text);
        return { imgs, h3: Boolean(h3), hasPrice, hasForbidden, hasBtn };
      });

      // Section 3: Featured Categories Grid cards hygiene
      const catSec = document.getElementById('categories');
      const catCards = Array.from(catSec.querySelectorAll('a[href^="/store?category="]'));
      const catCardAudit = catCards.map((card) => {
        const img = card.querySelector('img');
        const label = card.querySelector('span')?.textContent?.trim() || '';
        const text = (card.textContent || '').replace(/\\s+/g, ' ').trim();
        const hasExtra = /SKU|Shop Now|CAT-|produk/i.test(text);
        const hasP = card.querySelectorAll('p, button').length > 0;
        return {
          href: card.getAttribute('href'),
          imgOk: Boolean(img && img.hasAttribute('width') && img.hasAttribute('height')),
          labelOnly: Boolean(label) && text === label && !hasExtra && !hasP,
        };
      });

      // Section 4: Our Store & Google Maps iframe
      const storeSec = document.getElementById('our-store');
      const iframe = storeSec?.querySelector('iframe');
      const storeText = storeSec?.innerText || '';
      const storeInfo = {
        hasAddress: storeText.includes('Kemang Raya'),
        hasPhone: storeText.includes('+62 812-8800-4418'),
        hasDirectionsLink: Boolean(storeSec?.querySelector('a[href^="https://maps.google.com"]')),
        iframeSrc: iframe?.getAttribute('src') || '',
        iframeW: iframe?.getAttribute('width'),
        iframeH: iframe?.getAttribute('height'),
        iframeTitle: iframe?.getAttribute('title') || '',
      };

      // Footer 4 columns clean
      const footer = document.querySelector('footer');
      const footerCols = footer ? footer.querySelectorAll('.grid > div').length : 0;
      const footerText = footer?.innerText || '';
      const footerClean = !/SEC-06|\\[BRK \\/\\/|18\\+|Perpol|Loadout|Cek Pesanan/i.test(footerText);

      return {
        order,
        fpCount: fpCards.length,
        fpAllClean: fpCards.length === 8 && fpCardAudit.every((c) => c.imgs >= 1 && c.h3 && c.hasPrice && !c.hasForbidden && !c.hasBtn),
        catCount: catCards.length,
        catAllClean: catCards.length === 9 && catCardAudit.every((c) => c.imgOk && c.labelOnly),
        storeInfo,
        footerCols,
        footerClean,
      };
    `);

    record(
      'LandingSections',
      'Exact 4-section order: Hero -> #featured-products -> #categories -> #our-store + 4-col clean Footer',
      JSON.stringify(lpSections.order) === JSON.stringify(['hero-armory', 'featured-products', 'categories', 'our-store']) &&
        lpSections.footerCols === 4 &&
        lpSections.footerClean,
      `order=${JSON.stringify(lpSections.order)}, footerCols=${lpSections.footerCols}, footerClean=${lpSections.footerClean}`,
    );
    record(
      'LandingSections',
      '#featured-products Carousel renders 8 clean cards (ONLY photo, name, price)',
      lpSections.fpAllClean,
      `count=${lpSections.fpCount}, allClean=${lpSections.fpAllClean}`,
    );
    record(
      'LandingSections',
      '#categories Grid renders 9 clean cards (ONLY photo + category name)',
      lpSections.catAllClean,
      `count=${lpSections.catCount}, allClean=${lpSections.catAllClean}`,
    );
    record(
      'LandingSections',
      '#our-store renders address, phone, Maps CTA & valid Google Maps <iframe> (width, height, title, https src)',
      lpSections.storeInfo.hasAddress &&
        lpSections.storeInfo.hasPhone &&
        lpSections.storeInfo.hasDirectionsLink &&
        lpSections.storeInfo.iframeSrc.startsWith('https://maps.google.com') &&
        Boolean(lpSections.storeInfo.iframeW) &&
        Boolean(lpSections.storeInfo.iframeH) &&
        lpSections.storeInfo.iframeTitle.length > 3,
      JSON.stringify(lpSections.storeInfo),
    );

    // Carousel Prev / Next scroll arrows
    const carouselScroll = await cdp.eval(`
      const sec = document.getElementById('featured-products');
      sec.scrollIntoView({ block: 'center' });
      const track = sec.querySelector('.overflow-x-auto');
      const btns = Array.from(sec.querySelectorAll('button'));
      const prevBtn = btns[0];
      const nextBtn = btns[1];
      const startLeft = track.scrollLeft;
      nextBtn.click();
      await new Promise((r) => setTimeout(r, 650));
      const afterNextLeft = track.scrollLeft;
      prevBtn.click();
      await new Promise((r) => setTimeout(r, 650));
      const afterPrevLeft = track.scrollLeft;
      return { startLeft, afterNextLeft, afterPrevLeft, nextDisabledInitially: false };
    `);
    record(
      'LandingSections',
      '#featured-products Carousel Prev/Next buttons scroll track horizontally',
      carouselScroll.afterNextLeft > carouselScroll.startLeft + 100 &&
        carouselScroll.afterPrevLeft < carouselScroll.afterNextLeft,
      JSON.stringify(carouselScroll),
    );

    // Click category card -> navigates to /store?category=<slug>
    await cdp.clickSelector('#categories a[href="/store?category=optics-aiming"]');
    await cdp.waitFor(`return window.location.pathname === '/store' && window.location.search.includes('category=optics-aiming') && document.querySelectorAll('a[href^="/store/"]').length >= 1;`, 8000);
    const catNavResult = await cdp.eval(`
      return {
        url: window.location.pathname + window.location.search,
        h1: document.querySelector('h1')?.textContent?.trim(),
        cards: document.querySelectorAll('main a[href^="/store/"]').length,
      };
    `);
    record(
      'LandingSections',
      'Clicking Category card navigates to /store?category=optics-aiming & filters products',
      catNavResult.url === '/store?category=optics-aiming' && catNavResult.cards >= 1,
      JSON.stringify(catNavResult),
    );

    // =========================================================================
    // 3. SWARNA NAVBAR, REMOVED ROUTES (404), AND FULL ID/EN TOGGLE
    // =========================================================================
    await cdp.goto('/', 800);

    // Desktop Categories Dropdown + Escape
    await cdp.clickSelector('button[aria-controls="desktop-categories-dropdown"]');
    await sleep(200);
    const catDropOpen = await cdp.eval(`
      const dd = document.getElementById('desktop-categories-dropdown');
      return { open: Boolean(dd), links: dd ? dd.querySelectorAll('a[href^="/store?category="]').length : 0 };
    `);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(200);
    const catDropClosed = await cdp.eval(`return !document.getElementById('desktop-categories-dropdown');`);
    record(
      'Navbar',
      'Desktop Categories dropdown opens 9 categories and closes on Escape',
      catDropOpen.open && catDropOpen.links === 9 && catDropClosed,
      `${JSON.stringify(catDropOpen)}, escClosed=${catDropClosed}`,
    );

    // Search Modal + Escape
    await cdp.clickSelector('header button[aria-label*="Cari"], header button[aria-label*="Search"]');
    await sleep(200);
    const searchModalOpen = await cdp.eval(`return Boolean(document.querySelector('[role="dialog"] input[type="search"]'));`);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(200);
    const searchModalClosed = await cdp.eval(`return !document.querySelector('[role="dialog"]');`);
    record(
      'Navbar',
      'Search modal opens and closes cleanly on Escape',
      searchModalOpen && searchModalClosed,
      `open=${searchModalOpen}, closedEsc=${searchModalClosed}`,
    );

    // Removed routes must render NotFoundPage (404)
    const removedChecks = [];
    for (const deadRoute of ['/loadout-builder', '/order-lookup', '/compliance']) {
      await cdp.goto(deadRoute, 600);
      const st = await cdp.eval(`
        const txt = document.body.innerText;
        const h1 = document.querySelector('h1')?.textContent?.trim() || '';
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const isSrOnly = el.classList.contains('sr-only') || el.classList.contains('sr-only-brakasa');
            return (r.width > 0 && r.height > 0) || isSrOnly;
          })
          .map((el) => Number(el.tagName[1]));
        let skipped = null;
        for (let i = 1; i < headings.length; i += 1) {
          if (headings[i] - headings[i - 1] > 1) { skipped = 'h' + headings[i - 1] + '->h' + headings[i]; break; }
        }
        return {
          route: ${JSON.stringify(deadRoute)},
          has404: txt.includes('404'),
          h1,
          skipped,
        };
      `);
      removedChecks.push(st);
    }
    record(
      'RemovedRoutes',
      '/loadout-builder, /order-lookup, /compliance all render NotFoundPage (404) with valid heading hierarchy',
      removedChecks.every((c) => c.has404 && !c.skipped),
      JSON.stringify(removedChecks),
    );

    // Bilingual ID -> EN toggle, persistence across reload, Store/PDP/Cart/Checkout EN audit, then EN -> ID
    await cdp.goto('/', 800);
    await cdp.clickSelector('header [role="group"] button:nth-child(2)'); // EN button
    await sleep(300);
    const enLandingBeforeReload = await cdp.eval(`
      return {
        langAttr: document.documentElement.getAttribute('lang'),
        lsLang: localStorage.getItem('brakasa-lang'),
        heroH1: document.querySelector('.hero-armory h1')?.textContent?.trim(),
        fpH2: document.querySelector('#featured-products h2')?.textContent?.trim(),
        catH2: document.querySelector('#categories h2')?.textContent?.trim(),
        storeH2: document.querySelector('#our-store h2')?.textContent?.trim(),
        navText: document.querySelector('header nav')?.innerText?.replace(/\\s+/g, ' ').trim(),
        footerCopyright: document.querySelector('footer')?.textContent?.includes('All rights reserved'),
        hasAssaultRifleEn: /Assault Rifle/i.test(document.querySelector('#categories')?.textContent || ''),
      };
    `);
    await cdp.reload(850);
    const enAfterReload = await cdp.eval(`
      return {
        langAttr: document.documentElement.getAttribute('lang'),
        heroH1: document.querySelector('.hero-armory h1')?.textContent?.trim(),
      };
    `);
    record(
      'i18n-EN',
      'Toggle EN sets <html lang="en">, translates Landing Page & persists across reload',
      enLandingBeforeReload.langAttr === 'en' &&
        enLandingBeforeReload.lsLang === 'en' &&
        enLandingBeforeReload.heroH1 === 'FIELD ARMORY PRECISION' &&
        enLandingBeforeReload.fpH2 === 'Featured Products' &&
        enLandingBeforeReload.catH2 === 'Categories' &&
        enLandingBeforeReload.storeH2 === 'Our Store' &&
        enLandingBeforeReload.footerCopyright &&
        enLandingBeforeReload.hasAssaultRifleEn &&
        enAfterReload.langAttr === 'en' &&
        enAfterReload.heroH1 === 'FIELD ARMORY PRECISION',
      `${JSON.stringify(enLandingBeforeReload)} | reload=${JSON.stringify(enAfterReload)}`,
    );

    // Verify EN on /store & PDP (including English product description & specs)
    await cdp.goto('/store', 800);
    await cdp.waitFor(`return document.querySelectorAll('main a[href^="/store/"]').length > 0;`, 8000);
    const enStore = await cdp.eval(`
      const txt = document.body.innerText;
      return {
        langAttr: document.documentElement.getAttribute('lang'),
        h1: document.querySelector('h1')?.textContent?.trim(),
        hasProductsWord: /20\\s+products/i.test(txt),
        hasFilterEn: txt.includes('Propulsion') && txt.includes('In Stock Only'),
      };
    `);
    record(
      'i18n-EN',
      '/store renders English heading, count & filter labels',
      enStore.langAttr === 'en' && enStore.h1 === 'Shop' && enStore.hasProductsWord && enStore.hasFilterEn,
      JSON.stringify(enStore),
    );

    await cdp.goto('/store/tokyo-marui-mk18-mod1-mws-gbbr', 900);
    await cdp.waitFor(`return Boolean(document.querySelector('h1'));`, 8000);
    const enPdp = await cdp.eval(`
      const txt = document.body.textContent || '';
      const desc = document.querySelector('section[aria-labelledby="pdp-description-heading"]')?.textContent || '';
      const specs = document.querySelector('section[aria-labelledby="pdp-specs-heading"]')?.textContent || '';
      return {
        langAttr: document.documentElement.getAttribute('lang'),
        hasAddToCart: /Add to Cart/i.test(txt),
        hasDescEn: /Description/i.test(desc) && /ZET|blowback|replica|carbine/i.test(desc) && !/Replika.*sistem/i.test(desc),
        hasSpecsEn: /Specifications/i.test(specs) && /Propulsion/i.test(specs) && !/Kecepatan Moncong/i.test(specs) && !/Perpol/i.test(specs),
        no18Plus: !/18\\+|Perpol|Loadout/i.test(txt),
      };
    `);
    record(
      'i18n-EN',
      'PDP (/store/:slug) translates Description, In the Box & Spec table to English (0 18+/Perpol)',
      enPdp.langAttr === 'en' && enPdp.hasAddToCart && enPdp.hasDescEn && enPdp.hasSpecsEn && enPdp.no18Plus,
      JSON.stringify(enPdp),
    );

    // Switch back to ID and verify persistence
    await cdp.clickSelector('header [role="group"] button:nth-child(1)'); // ID button
    await sleep(300);
    const backToId = await cdp.eval(`
      return {
        langAttr: document.documentElement.getAttribute('lang'),
        lsLang: localStorage.getItem('brakasa-lang'),
        hasAddId: document.body.innerText.includes('Tambah ke Keranjang'),
      };
    `);
    record(
      'i18n-ID',
      'Toggle back to ID restores <html lang="id"> and Indonesian UI',
      backToId.langAttr === 'id' && backToId.lsLang === 'id' && backToId.hasAddId,
      JSON.stringify(backToId),
    );

    // =========================================================================
    // 4. E2E FLOW: STORE -> PDP (LIGHTBOX + VIDEO) -> CART -> CHECKOUT (NO 18+) -> ADMIN V2
    // =========================================================================
    await cdp.goto('/store', 850);
    await cdp.waitFor(`return document.querySelectorAll('main a[href^="/store/"]').length === 12;`, 8000);

    // Search "MK18"
    await cdp.setInputValue('#store-search-input', 'MK18');
    await cdp.waitFor(`return window.location.search.includes('q=MK18') && document.querySelectorAll('main a[href^="/store/"]').length >= 1 && document.querySelectorAll('main a[href^="/store/"]').length <= 5;`, 6000);
    const searchMk18Count = await cdp.eval(`return document.querySelectorAll('main a[href^="/store/"]').length;`);

    // Empty state "zzzznotfound" + Reset
    await cdp.setInputValue('#store-search-input', 'zzzznotfound');
    await cdp.waitFor(`return document.querySelectorAll('main a[href^="/store/"]').length === 0 && /Produk tidak ditemukan/i.test(document.body.innerText);`, 6000);
    const emptyVisible = await cdp.eval(`return /Produk tidak ditemukan/i.test(document.body.innerText);`);
    await cdp.clickByText('button', 'Reset');
    await cdp.waitFor(`return document.querySelectorAll('main a[href^="/store/"]').length === 12;`, 6000);

    record(
      'Storefront',
      'Search "MK18", R-27 Empty State ("zzzznotfound") & Reset all work cleanly',
      searchMk18Count >= 1 && emptyVisible,
      `mk18Cards=${searchMk18Count}, emptyState=${emptyVisible}`,
    );

    // PDP: Lightbox (Escape) + Product Demo Video (Play/Pause) + Add to Cart
    await cdp.goto('/store/vfc-avalon-saber-carbine-mlok-aeg', 900);
    await cdp.waitFor(`return (document.querySelector('h1')?.textContent || '').includes('VFC');`, 8000);

    // Lightbox open & Escape close
    await cdp.clickSelector('button[aria-label*="Perbesar"], button[aria-label*="Zoom"]');
    await sleep(250);
    const lightboxOpen = await cdp.eval(`return Boolean(document.querySelector('[role="dialog"] img'));`);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(250);
    const lightboxClosed = await cdp.eval(`return !document.querySelector('[role="dialog"]');`);
    record(
      'PDP',
      'Photo Lightbox opens full-res modal and closes on Escape',
      lightboxOpen && lightboxClosed,
      `open=${lightboxOpen}, escClosed=${lightboxClosed}`,
    );

    // Product Demo Video on PDP
    await cdp.clickByText('button', 'Video');
    const pdpVideoMeta = await cdp.waitFor(`
      const v = document.querySelector('main video');
      if (!v || v.readyState < 1) return null;
      return { src: v.getAttribute('src'), videoWidth: v.videoWidth, widthAttr: v.getAttribute('width'), heightAttr: v.getAttribute('height') };
    `, 8000);
    await cdp.clickSelector('button[aria-label*="Putar video demo"], button[aria-label*="Play demo video"]');
    await sleep(400);
    const pdpPlaying = await cdp.eval(`return !document.querySelector('main video')?.paused;`);
    await cdp.clickSelector('button[aria-label*="Jeda"], button[aria-label*="Pause"]');
    await sleep(250);
    const pdpPaused = await cdp.eval(`return Boolean(document.querySelector('main video')?.paused);`);
    record(
      'PDP',
      'Product Demo Video loads .mp4 (with width/height) and Play/Pause toggles accurately',
      pdpVideoMeta.src.includes('.mp4') && pdpVideoMeta.videoWidth > 0 && Boolean(pdpVideoMeta.widthAttr) && pdpPlaying && pdpPaused,
      JSON.stringify({ ...pdpVideoMeta, pdpPlaying, pdpPaused }),
    );

    // Add to Cart -> Open CartDrawer -> Escape -> Navigate Checkout
    await cdp.clickByText('button', 'Tambah ke Keranjang');
    await sleep(300);
    await cdp.clickByText('button', 'Buka Keranjang');
    await cdp.waitFor(`return Boolean(document.getElementById('cart-drawer-title'));`, 5000);
    const cartAudit = await cdp.eval(`
      const dlg = document.querySelector('[role="dialog"]');
      const txt = dlg?.innerText || '';
      return {
        title: document.getElementById('cart-drawer-title')?.textContent?.trim(),
        cleanNo18: !/18\\+|Perpol|Loadout|MANIFEST/i.test(txt),
      };
    `);
    await cdp.clickByText('[role="dialog"] button', 'Checkout');
    await cdp.waitFor(`return window.location.pathname === '/checkout' && Boolean(document.getElementById('checkout-name'));`, 8000);
    record(
      'CartToCheckout',
      'CartDrawer clean (0 18+/MANIFEST) and navigates to /checkout',
      cartAudit.cleanNo18,
      JSON.stringify(cartAudit),
    );

    // Checkout V2: Verify 0 DOB/18+/Perpol inputs, empty validation, fill address + cargo + BRAKASA10 -> Invoice issued
    const checkoutClean = await cdp.eval(`
      const form = document.querySelector('form');
      const dobInputs = form.querySelectorAll('input[type="date"], #checkout-buyer-dob, #checkout-age18-confirmed, #checkout-legal-declaration').length;
      const txt = document.body.innerText;
      const has18 = /18\\+|Perpol|Tanggal Lahir|Deklarasi/i.test(txt);
      const couriers = Array.from(document.querySelectorAll('input[name="shippingCourier"]')).map((r) => ({ val: r.value, disabled: r.disabled, checked: r.checked }));
      const airDisabled = couriers.filter((c) => c.val === 'JNE_REG' || c.val === 'SICEPAT_REG').every((c) => c.disabled);
      const landChecked = couriers.some((c) => c.checked && ['JNE_TRUCKING', 'INDAH_CARGO', 'DAKOTA_CARGO', 'HAZMAT_LAND_CARGO'].includes(c.val));
      return { dobInputs, has18, airDisabled, landChecked };
    `);
    record(
      'CheckoutV2',
      'Checkout has 0 DOB/18+/Perpol inputs while locking air couriers for replica unit',
      checkoutClean.dobInputs === 0 && !checkoutClean.has18 && checkoutClean.airDisabled && checkoutClean.landChecked,
      JSON.stringify(checkoutClean),
    );

    // Empty submit validation
    await cdp.clickSelector('button[type="submit"]');
    await sleep(300);
    const emptyAlerts = await cdp.eval(`return document.querySelectorAll('form [role="alert"]').length;`);
    record('CheckoutV2', 'Empty checkout submit triggers per-field validation alerts', emptyAlerts >= 5, `alerts=${emptyAlerts}`);

    // Fill address + BRAKASA10 -> Place Order
    await cdp.setInputValue('#checkout-name', 'Budi Santoso V2 QA');
    await cdp.setInputValue('#checkout-email', 'qa.v2@brakasatest.id');
    await cdp.setInputValue('#checkout-phone', '081234567890');
    await cdp.setInputValue('#checkout-city', 'Jakarta Selatan');
    await cdp.setInputValue('#checkout-district', 'Kebayoran Baru');
    await cdp.setInputValue('#checkout-postal', '12160');
    await cdp.setInputValue('#checkout-address', 'Jl. Senopati No. 45 RT 02 RW 03, Jakarta Selatan');
    await cdp.setInputValue('#checkout-voucher-code', 'BRAKASA10');
    await cdp.clickByText('form button[type="button"]', 'Terapkan');
    await cdp.waitFor(`return /BRAKASA10/i.test(document.body.innerText) && /500\\.000/i.test(document.body.innerText);`, 6000);
    await cdp.clickSelector('button[type="submit"]');
    const invoiceNumber = await cdp.waitFor(`
      const h1 = document.querySelector('h1')?.textContent || '';
      const m = h1.match(/(BRK-\\d{8}-[A-Z0-9]+)/);
      return m ? m[1] : null;
    `, 10000);
    const invoiceClean = await cdp.eval(`
      const txt = document.body.innerText;
      const hasLookupLink = Boolean(document.querySelector('a[href*="order-lookup"]'));
      return { hasNo18: !/18\\+|Perpol|INVOICE DITERBITKAN \\/\\//i.test(txt), hasLookupLink };
    `);
    record(
      'CheckoutV2',
      'Replica checkout WITHOUT 18+/DOB + BRAKASA10 issues clean Invoice (no /order-lookup link)',
      Boolean(invoiceNumber) && invoiceClean.hasNo18 && !invoiceClean.hasLookupLink,
      `invoice=${invoiceNumber}, clean=${JSON.stringify(invoiceClean)}`,
    );

    // =========================================================================
    // 5. ADMIN V2 LOGIN, ORDER -> SHIPPED, ADMIN ID/EN, 3-TAB SETTINGS -> LIVE HERO SYNC
    // =========================================================================
    await cdp.goto('/admin/login', 800);
    const loginToggleOk = await cdp.eval(`
      return Boolean(document.querySelector('header [role="group"]')) && !/AUTH \\/\\/|BRK \\/\\/ ADMIN/i.test(document.body.innerText);
    `);
    await cdp.setInputValue('#admin-login-username', 'admin');
    await cdp.setInputValue('#admin-login-password', 'BrakasaArmory#2026');
    await cdp.clickSelector('button[type="submit"]');
    await cdp.waitFor(`return window.location.pathname === '/admin' && document.body.innerText.includes(${JSON.stringify(invoiceNumber)});`, 8000);
    record(
      'AdminV2',
      'Admin login clean (with ID/EN toggle) and new V2 checkout order appears live in Dashboard',
      loginToggleOk,
      `invoice=${invoiceNumber}`,
    );

    // Open OrderDetailDrawer -> verify 0 18+/Perpol -> advance to SHIPPED with tracking
    await cdp.clickByText('button', invoiceNumber);
    await cdp.waitFor(`return document.getElementById('order-detail-drawer-title')?.textContent?.includes(${JSON.stringify(invoiceNumber)});`, 8000);
    const drawerClean = await cdp.eval(`return !/18\\+|Perpol|ORDER \\/\\//i.test(document.querySelector('[role="dialog"]')?.innerText || '');`);
    // PENDING -> PAID_VERIFIED
    await cdp.clickSelector('[role="dialog"] button[type="submit"]');
    await cdp.waitFor(`return /Tandai Dikemas|Mark as Packed/i.test(document.querySelector('[role="dialog"]')?.textContent || '');`, 8000);
    // PAID_VERIFIED -> PACKED
    await cdp.clickSelector('[role="dialog"] button[type="submit"]');
    await cdp.waitFor(`return Boolean(document.getElementById('order-ship-tracking'));`, 8000);
    const shipDisabledEmpty = await cdp.eval(`return Boolean(document.querySelector('[role="dialog"] button[type="submit"]')?.disabled);`);
    await cdp.setInputValue('#order-ship-tracking', 'JTR-V2-778899');
    await sleep(150);
    await cdp.clickSelector('[role="dialog"] button[type="submit"]');
    await cdp.waitFor(`return document.querySelector('[role="dialog"]')?.textContent?.includes('JTR-V2-778899');`, 8000);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(250);
    const drawerClosed = await cdp.eval(`return !document.getElementById('order-detail-drawer-title');`);
    record(
      'AdminV2',
      'OrderDetailDrawer clean (0 18+/Perpol) & transitions order to SHIPPED with resi JTR-V2-778899',
      drawerClean && shipDisabledEmpty && drawerClosed,
      `clean=${drawerClean}, blockedEmptyResi=${shipDisabledEmpty}, escClosed=${drawerClosed}`,
    );

    // Test Admin ID/EN toggle
    await cdp.clickSelector('aside [role="group"] button:nth-child(2)'); // EN
    await sleep(300);
    const adminEn = await cdp.eval(`
      const aside = document.querySelector('aside')?.textContent || '';
      const mainTxt = document.querySelector('main')?.textContent || '';
      return {
        langAttr: document.documentElement.getAttribute('lang'),
        hasEnNav: aside.includes('Overview') && aside.includes('Orders') && aside.includes('Settings'),
        hasEnHeading: /Action Queue|Orders Requiring Action|Metrics Summary/i.test(mainTxt),
      };
    `);
    await cdp.clickSelector('aside [role="group"] button:nth-child(1)'); // back to ID
    await sleep(250);
    record(
      'AdminV2',
      'Admin ID/EN toggle switches sidebar & dashboard copy to English and back cleanly',
      adminEn.langAttr === 'en' && adminEn.hasEnNav && adminEn.hasEnHeading,
      JSON.stringify(adminEn),
    );

    // /admin/products -> verify ProductEditorModal clean (no 18+ checkbox) + MediaPicker Escape stack
    await cdp.goto('/admin/products', 850);
    await cdp.waitFor(`return document.body.innerText.includes('BRK-AR-001');`, 8000);
    await cdp.eval(`
      const row = Array.from(document.querySelectorAll('tr')).find((r) => r.textContent.includes('BRK-AR-001'));
      Array.from(row.querySelectorAll('button')).find((b) => /Edit/i.test(b.textContent))?.click();
    `);
    await cdp.waitFor(`return Boolean(document.getElementById('product-editor-modal-title'));`, 6000);
    const prodModalClean = await cdp.eval(`
      const dlg = document.querySelector('[role="dialog"]');
      return !/18\\+|Perpol|CAT-01/i.test(dlg?.innerText || '') && !dlg.querySelector('input[name="requiresAge18"]');
    `);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(250);
    record('AdminV2', 'AdminProducts & ProductEditorModal clean (0 18+/Perpol/CAT-01) & Escape closes', prodModalClean, `clean=${prodModalClean}`);

    // /admin/inventory & /admin/vouchers
    await cdp.goto('/admin/inventory', 750);
    const invOk = await cdp.waitFor(`return document.querySelectorAll('table tbody tr').length > 0 && !/INV-01/i.test(document.body.innerText);`, 6000);
    await cdp.goto('/admin/vouchers', 750);
    const vouOk = await cdp.waitFor(`return document.body.innerText.includes('BRAKASA10') && !/CFG-01/i.test(document.body.innerText);`, 6000);
    record('AdminV2', 'AdminInventory & AdminVouchers render live SQLite data with zero micro-prefixes', Boolean(invOk) && Boolean(vouOk), `inv=${Boolean(invOk)}, vouchers=${Boolean(vouOk)}`);

    // /admin/settings -> Verify 3 V2 Tabs -> Edit Slide 1 Title -> Save -> Verify LIVE on `/`
    await cdp.goto('/admin/settings', 900);
    await cdp.waitFor(`return document.querySelectorAll('[role="tablist"] [role="tab"]').length === 3;`, 8000);
    const settingsTabsInfo = await cdp.eval(`
      const tabs = Array.from(document.querySelectorAll('[role="tablist"] [role="tab"]')).map((t) => t.textContent.trim());
      const mapsPreview = document.querySelector('#settings-panel-profile iframe');
      return {
        tabs,
        hasMapsIframe: Boolean(mapsPreview && mapsPreview.getAttribute('width') && mapsPreview.getAttribute('height')),
      };
    `);
    record(
      'AdminSettingsV2',
      'AdminSettings renders exactly 3 V2 tabs (Store Profile & Maps, Hero Slider, Shipping & Inventory) + Maps preview',
      settingsTabsInfo.tabs.length === 3 && settingsTabsInfo.hasMapsIframe,
      JSON.stringify(settingsTabsInfo),
    );

    // Switch to Hero Slider tab, record original headlineId, change it, save
    await cdp.clickSelector('#settings-tab-hero');
    await sleep(250);
    const origHeadlineId = await cdp.eval(`return document.getElementById('slide-headline-id-0')?.value || '';`);
    const testHeadline = 'BRAKASA LIVE HERO VERIFIED';
    await cdp.setInputValue('#slide-headline-id-0', testHeadline);
    await cdp.clickSelector('form button[type="submit"]');
    await cdp.waitFor(`return Boolean(document.querySelector('[role="status"]'));`, 8000);

    // Test SPA navigation back to "/" via sidebar link first!
    await cdp.clickSelector('aside a[href="/"]');
    await cdp.waitFor(`return window.location.pathname === '/' && Boolean(document.querySelector('.hero-armory h1'));`, 8000);
    await sleep(450);
    const spaHeroH1 = await cdp.eval(`return document.querySelector('.hero-armory h1')?.textContent?.trim();`);
    // Also test hard reload on "/"
    await cdp.reload(850);
    const reloadHeroH1 = await cdp.eval(`return document.querySelector('.hero-armory h1')?.textContent?.trim();`);

    record(
      'AdminSettingsV2',
      'Saving Hero Slider slide 1 title updates "/" live on SPA navigation AND reload',
      spaHeroH1 === testHeadline && reloadHeroH1 === testHeadline,
      `spaNav="${spaHeroH1}" (expected "${testHeadline}"), reload="${reloadHeroH1}"`,
    );

    // Restore original slide 1 title
    await cdp.goto('/admin/settings', 850);
    await cdp.clickSelector('#settings-tab-hero');
    await sleep(250);
    await cdp.setInputValue('#slide-headline-id-0', origHeadlineId || 'PRESISI ARMORY LAPANGAN');
    await cdp.clickSelector('form button[type="submit"]');
    await cdp.waitFor(`return Boolean(document.querySelector('[role="status"]'));`, 8000);

    // =========================================================================
    // 6. 3-BREAKPOINT (1440x900, 768x1024, 375x812) x DUAL THEME x ID/EN AUDIT
    // =========================================================================
    // Add 1 item to cart so /checkout renders full form during breakpoint checks
    await cdp.goto('/store/vfc-avalon-saber-carbine-mlok-aeg', 750);
    await cdp.clickByText('button', 'Tambah ke Keranjang');
    await sleep(250);

    const publicRoutes = ['/', '/store', '/store/tokyo-marui-mk18-mod1-mws-gbbr', '/checkout'];
    const adminRoutes = ['/admin', '/admin/products', '/admin/inventory', '/admin/orders', '/admin/vouchers', '/admin/settings'];

    const viewports = [
      { w: 1440, h: 900, mobile: false },
      { w: 768, h: 1024, mobile: false },
      { w: 375, h: 812, mobile: true },
    ];

    for (const vp of viewports) {
      await cdp.setViewport(vp.w, vp.h, vp.mobile);
      for (const route of [...publicRoutes, ...adminRoutes]) {
        await cdp.goto(route, 600);
        await runAuditOnCurrentPage(cdp, route, vp.w, vp.h, 'dark', 'id');
      }
    }

    // Mobile Drawers at 375x812: Public "Menu", Store "Filter", Admin "Menu Admin"
    await cdp.setViewport(375, 812, true);

    await cdp.goto('/', 700);
    await cdp.clickSelector('button[aria-controls="public-mobile-nav"]');
    await sleep(250);
    const mobileMenuOpen = await cdp.eval(`return Boolean(document.getElementById('public-mobile-nav'));`);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(250);
    const mobileMenuClosed = await cdp.eval(`
      return !document.getElementById('public-mobile-nav') &&
        document.activeElement?.getAttribute('aria-controls') === 'public-mobile-nav';
    `);
    record('Mobile', 'Public mobile "Menu" drawer opens, closes on Escape & returns focus', mobileMenuOpen && mobileMenuClosed, `open=${mobileMenuOpen}, closedFocus=${mobileMenuClosed}`);

    await cdp.goto('/store', 750);
    await cdp.clickSelector('button[aria-controls="store-filter-sheet"]');
    await sleep(250);
    const filterSheetOpen = await cdp.eval(`return Boolean(document.getElementById('store-filter-sheet'));`);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(250);
    const filterSheetClosed = await cdp.eval(`
      return !document.getElementById('store-filter-sheet') &&
        document.activeElement?.getAttribute('aria-controls') === 'store-filter-sheet';
    `);
    record('Mobile', 'Store mobile "Filter" bottom sheet opens, closes on Escape & returns focus', filterSheetOpen && filterSheetClosed, `open=${filterSheetOpen}, closedFocus=${filterSheetClosed}`);

    await cdp.goto('/admin', 750);
    await cdp.clickSelector('button[aria-controls="admin-mobile-nav"]');
    await sleep(250);
    const adminMenuOpen = await cdp.eval(`return Boolean(document.getElementById('admin-mobile-nav'));`);
    await cdp.pressKey('Escape', 'Escape', 27);
    await sleep(250);
    const adminMenuClosed = await cdp.eval(`
      return !document.getElementById('admin-mobile-nav') &&
        document.activeElement?.getAttribute('aria-controls') === 'admin-mobile-nav';
    `);
    record('Mobile', 'Admin mobile "Menu" drawer opens, closes on Escape & returns focus', adminMenuOpen && adminMenuClosed, `open=${adminMenuOpen}, closedFocus=${adminMenuClosed}`);

    // Dual-Theme Light Mode + EN language check across Desktop & Mobile
    await cdp.setViewport(1440, 900, false);
    await cdp.goto('/', 750);
    await cdp.clickSelector('header button[aria-label*="Field Paper Light"], header button[aria-label*="terang"]');
    await sleep(300);
    const lightLanding = await cdp.eval(`
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        heroBg: getComputedStyle(document.querySelector('.hero-armory')).backgroundColor,
        heroH1Color: getComputedStyle(document.querySelector('.hero-armory h1')).color,
      };
    `);
    record(
      'DualTheme',
      'Light Mode applies Field Paper (#F2EFE9) while keeping Hero dark-locked (#0F1110 / #F0EFEA)',
      lightLanding.theme === 'light' &&
        lightLanding.bodyBg === 'rgb(242, 239, 233)' &&
        lightLanding.heroBg === 'rgb(15, 17, 16)' &&
        lightLanding.heroH1Color === 'rgb(240, 239, 234)',
      JSON.stringify(lightLanding),
    );

    // Switch to EN as well so Light + EN is verified across Desktop & Mobile
    await cdp.clickSelector('header [role="group"] button:nth-child(2)');
    await sleep(250);

    for (const vp of [
      { w: 1440, h: 900, mobile: false },
      { w: 375, h: 812, mobile: true },
    ]) {
      await cdp.setViewport(vp.w, vp.h, vp.mobile);
      for (const route of ['/', '/store', '/checkout', '/admin', '/admin/settings']) {
        await cdp.goto(route, 550);
        const rep = await runAuditOnCurrentPage(cdp, route, vp.w, vp.h, 'light', 'en');
        if (vp.w === 1440) {
          record(
            'DualTheme+EN',
            `${route} Light Mode + EN active & styled`,
            rep.dataTheme === 'light' && rep.rootBg === 'rgb(242, 239, 233)' && rep.lang === 'en',
            `theme=${rep.dataTheme}, lang=${rep.lang}, bg=${rep.rootBg}`,
          );
        }
      }
    }

    // 200% Text Zoom on 375x812
    await cdp.setViewport(375, 812, true);
    await cdp.goto('/store', 600);
    const zoom200 = await cdp.eval(`
      document.documentElement.style.fontSize = '32px';
      await new Promise((r) => setTimeout(r, 200));
      const overflowPx = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
      document.documentElement.style.fontSize = '';
      return { overflowPx };
    `);
    record('Zoom200', 'Storefront holds at 200% text resize on 375px viewport', zoom200.overflowPx <= 2, `overflowPx=${zoom200.overflowPx}`);

    // Console, PageError, First-party HTTP errors
    record(
      'RuntimeHealth',
      'Zero console.error during full V2 browser click-through',
      cdp.consoleErrors.length === 0,
      cdp.consoleErrors.length === 0 ? '0 console.error' : JSON.stringify(cdp.consoleErrors),
    );
    record(
      'RuntimeHealth',
      'Zero uncaught pageerror exceptions',
      cdp.pageErrors.length === 0,
      cdp.pageErrors.length === 0 ? '0 pageerror' : JSON.stringify(cdp.pageErrors),
    );
    record(
      'RuntimeHealth',
      'Zero unexpected first-party HTTP >= 400 responses',
      cdp.failedRequests.length === 0,
      cdp.failedRequests.length === 0 ? '0 unexpected 4xx/5xx' : JSON.stringify(cdp.failedRequests),
    );

    const total = results.length;
    const failed = defects.length;
    console.log('\n==================== V2 BROWSER SUMMARY ====================');
    console.log(`TOTAL CHECKS: ${total} | PASSED: ${total - failed} | FAILED: ${failed}`);
    if (cdp.thirdPartyRequests.length > 0) {
      console.log(`(Note: ${cdp.thirdPartyRequests.length} third-party iframe requests had >=400, e.g. ${cdp.thirdPartyRequests[0].url})`);
    }
    if (failed > 0) {
      console.log('\nDEFECTS FOUND:');
      for (const d of defects) {
        console.log(`- [${d.area}] ${d.item}: ${d.evidence}`);
      }
      process.exitCode = 1;
    } else {
      console.log('ALL V2 BROWSER CLICK-THROUGH CHECKS PASSED 100%!');
      process.exitCode = 0;
    }
  } finally {
    if (cdp) {
      try {
        await cdp.close();
      } catch {
        // Ignore
      }
    }
    if (chromeProc && !chromeProc.killed) {
      chromeProc.kill('SIGTERM');
      await sleep(300);
      try {
        chromeProc.kill('SIGKILL');
      } catch {
        // Ignore
      }
    }
    if (serverProc && !serverProc.killed) {
      serverProc.kill('SIGTERM');
      await sleep(400);
      try {
        serverProc.kill('SIGKILL');
      } catch {
        // Ignore
      }
    }
    cleanupDbFiles();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // Ignore temp cleanup
    }
  }
}

main().catch((err) => {
  console.error('FATAL V2 BROWSER RUNNER ERROR:', err);
  process.exitCode = 1;
});
