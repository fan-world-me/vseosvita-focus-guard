/* Vseosvita Focus Guard 1.4 */
(() => {
  'use strict';

  const HARD = true, BLOCK_FS_EXIT = true, KILL_NETWORK = true;
  const AUTO_REFS = false, SPY = true, REASSERT_MS = 500;
  const MAX_DRIVEN = 2000;

  if (window.__vsg) return;
  const VSG = (window.__vsg = {
    version: '1.4', blocked: 0, killed: 0, driven: 0,
    blockedList: [], fired: {}, reads: new Map(),
    intervals: [], timeouts: []
  });

  /* реальный геттер сохраняем ДО подмены — нужен драйверу таймеров */
  const realVisDesc = (() => {
    try { return Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState'); } catch (_) { return null; }
  })();
  const reallyHidden = () => {
    try { return realVisDesc ? realVisDesc.get.call(document) === 'hidden' : false; } catch (_) { return false; }
  };

  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement ||
    document.mozFullScreenElement || document.msFullscreenElement || null;

  /* ---------- трассировка ---------- */

  const NOISE = /at tick |VSG\.state|at fsEl|at pump|__vsg/;

  function traceRead(label) {
    try {
      const st = (new Error().stack || '').split('\n').slice(2, 5).join(' | ');
      if (NOISE.test(st)) return;
      const k = label + ' ← ' + st;
      VSG.reads.set(k, (VSG.reads.get(k) || 0) + 1);
    } catch (_) {}
  }

  const forceValue = (obj, prop, value, label) => {
    try {
      Object.defineProperty(obj, prop, {
        configurable: true, enumerable: true,
        get: () => { if (label) traceRead(label); return value; },
        set: () => {}
      });
    } catch (_) {}
  };

  const forceFn = (obj, prop, fn, label) => {
    try {
      Object.defineProperty(obj, prop, {
        configurable: true, writable: true,
        value: label ? function () { traceRead(label); return fn(); } : fn
      });
    } catch (_) {}
  };

  const alwaysTrue = () => true;

  function patchState() {
    for (const t of [Document.prototype]) {
      if (!t) continue;
      forceValue(t, 'hidden', false);
      forceValue(t, 'webkitHidden', false);
      forceValue(t, 'visibilityState', 'visible');
      forceValue(t, 'webkitVisibilityState', 'visible');
      forceFn(t, 'hasFocus', alwaysTrue);
    }
    forceValue(document, 'hidden', false, 'document.hidden');
    forceValue(document, 'webkitHidden', false, 'document.webkitHidden');
    forceValue(document, 'visibilityState', 'visible', 'document.visibilityState');
    forceValue(document, 'webkitVisibilityState', 'visible', 'document.webkitVisibilityState');
    forceFn(document, 'hasFocus', alwaysTrue, 'document.hasFocus');

    try {
      const d = Object.getOwnPropertyDescriptor(Document.prototype, 'fullscreenElement');
      if (d && d.get && !d.get.__vsg) {
        const wrapped = function () { traceRead('document.fullscreenElement'); return d.get.call(this); };
        wrapped.__vsg = true;
        Object.defineProperty(Document.prototype, 'fullscreenElement', { configurable: true, get: wrapped });
      }
    } catch (_) {}
  }

  /* ---------- перехват регистрации ---------- */

  const BLOCK_ALWAYS = new Set(['visibilitychange', 'webkitvisibilitychange',
    'mozvisibilitychange', 'msvisibilitychange', 'pagehide', 'freeze', 'resume']);

  const BLOCK_WINDOW = new Set(['blur', 'focus', 'beforeunload', 'unload',
    'mouseleave', 'mouseenter', 'mouseout', 'mouseover', 'pointerleave', 'pointerenter']);

  const FS_TYPES = new Set(['fullscreenchange', 'webkitfullscreenchange',
    'mozfullscreenchange', 'MSFullscreenChange', 'msfullscreenchange']);

  const nativeAdd = EventTarget.prototype.addEventListener;
  const nativeRemove = EventTarget.prototype.removeEventListener;
  const fsWraps = new WeakMap();

  const nameOf = (t) => t === window ? 'window' : t === document ? 'document'
    : t === document.documentElement ? 'html' : t === document.body ? 'body'
    : (t && t.nodeName) || (t && t.constructor && t.constructor.name) || '?';

  const isWinLevel = (t) => t === window || t === document ||
    t === document.documentElement || t === document.body;

  const captureOf = (o) => o === true || !!(o && typeof o === 'object' && o.capture);

  const patchedAdd = function (type, listener, options) {
    try {
      const t = typeof type === 'string' ? type : String(type);
      if (!listener) return nativeAdd.call(this, type, listener, options);
      const capture = captureOf(options);

      if (FS_TYPES.has(t) && BLOCK_FS_EXIT) {
        const wrapped = function (ev) {
          if (!fsEl()) return;
          if (typeof listener === 'function') return listener.call(this, ev);
          if (listener && typeof listener.handleEvent === 'function') return listener.handleEvent(ev);
        };
        let arr = fsWraps.get(listener);
        if (!arr) fsWraps.set(listener, (arr = []));
        arr.push({ target: this, type: t, wrapped, capture });
        return nativeAdd.call(this, t, wrapped, options);
      }

      if (HARD) {
        if (BLOCK_ALWAYS.has(t)) {
          VSG.blocked++; VSG.blockedList.push(t + '@' + nameOf(this) + (capture ? ' [capture]' : ''));
          return;
        }
        if (BLOCK_WINDOW.has(t) && isWinLevel(this)) {
          const delegate = capture && (this === document.body || this === document.documentElement);
          if (!delegate) {
            VSG.blocked++; VSG.blockedList.push(t + '@' + nameOf(this) + (capture ? ' [capture]' : ''));
            return;
          }
        }
      }
      return nativeAdd.call(this, type, listener, options);
    } catch (_) {
      return nativeAdd.call(this, type, listener, options);
    }
  };

  const patchedRemove = function (type, listener, options) {
    try {
      const t = typeof type === 'string' ? type : String(type);
      const arr = listener && fsWraps.get(listener);
      if (arr && FS_TYPES.has(t)) {
        const capture = captureOf(options);
        const i = arr.findIndex((r) => r.target === this && r.type === t && r.capture === capture);
        if (i >= 0) { const [rec] = arr.splice(i, 1); return nativeRemove.call(this, t, rec.wrapped, options); }
      }
    } catch (_) {}
    return nativeRemove.call(this, type, listener, options);
  };

  function patchEvents() {
    try { EventTarget.prototype.addEventListener = patchedAdd; } catch (_) {}
    try { EventTarget.prototype.removeEventListener = patchedRemove; } catch (_) {}
  }

  /* ---------- глушение ---------- */

  const count = (t) => { VSG.fired[t] = (VSG.fired[t] || 0) + 1; };

  const hardSwallow = (e) => {
    try { e.stopImmediatePropagation(); e.stopPropagation(); } catch (_) {}
  };

  const SWALLOW_DOC = ['visibilitychange', 'webkitvisibilitychange',
    'mozvisibilitychange', 'msvisibilitychange', 'pagehide', 'freeze', 'resume'];

  const SWALLOW_WIN = ['blur', 'focus', 'beforeunload'];
  const SWALLOW_EDGE = ['mouseleave', 'mouseenter', 'pointerleave', 'pointerenter'];

  function installSwallowers() {
    for (const t of SWALLOW_DOC) {
      const h = (e) => { count(t); hardSwallow(e); };
      nativeAdd.call(window, t, h, true);
      nativeAdd.call(document, t, h, true);
    }
    if (BLOCK_FS_EXIT) {
      for (const t of FS_TYPES) {
        const h = (e) => { count(t); if (!fsEl()) hardSwallow(e); };
        nativeAdd.call(window, t, h, true);
        nativeAdd.call(document, t, h, true);
      }
    }
    for (const t of SWALLOW_WIN) {
      nativeAdd.call(window, t, (e) => { if (e.target === window) { count(t); hardSwallow(e); } }, true);
    }
    for (const t of SWALLOW_EDGE) {
      nativeAdd.call(window, t, (e) => {
        if (e.target === document.documentElement) { count(t); hardSwallow(e); }
      }, true);
    }
  }

  /* ---------- драйвер таймеров ---------- */

  function installTimerDriver() {
    const nSetInterval = window.setInterval;
    const nClearInterval = window.clearInterval;

    const ch = new MessageChannel();
    const jobs = new Map();
    let seq = 1e7;
    let spinning = false;

    const pump = () => {
      const now = performance.now();
      for (const [, job] of jobs) {
        if (now - job.last >= job.ms) {
          job.last = now;
          try { job.fn(); } catch (e) { setTimeout(() => { throw e; }, 0); }
        }
      }
      if (!jobs.size) { spinning = false; return; }
      if (reallyHidden()) ch.port2.postMessage(0);
      else setTimeout(pump, 8);
    };

    ch.port1.onmessage = pump;

    window.setInterval = function (fn, ms) {
      try {
        VSG.intervals.push(ms + 'ms :: ' + String(fn).replace(/\s+/g, ' ').slice(0, 160));
      } catch (_) {}
      const period = Math.max(1, Number(ms) || 0);
      if (typeof fn !== 'function' || period > MAX_DRIVEN) {
        return nSetInterval.call(window, fn, ms);
      }
      const id = ++seq;
      jobs.set(id, { fn, ms: period, last: performance.now() });
      VSG.driven++;
      if (!spinning) { spinning = true; pump(); }
      return id;
    };

    window.clearInterval = function (id) {
      if (jobs.delete(id)) return;
      return nClearInterval.call(window, id);
    };
  }

  /* ---------- таймауты (только наблюдение) ---------- */

  function installTimerSpy() {
    const st = window.setTimeout;
    window.setTimeout = function (fn, ms) {
      try {
        if (VSG.timeouts.length < 300) {
          VSG.timeouts.push(ms + 'ms :: ' + String(fn).replace(/\s+/g, ' ').slice(0, 160));
        }
      } catch (_) {}
      return st.apply(this, arguments);
    };
  }

  /* ---------- сеть ---------- */

  const FOCUS_URL = /\/focus-event(\?|$)/i;

  function fakeXhrDone(xhr) {
    try {
      Object.defineProperty(xhr, 'readyState', { configurable: true, get: () => 4 });
      Object.defineProperty(xhr, 'status', { configurable: true, get: () => 200 });
      Object.defineProperty(xhr, 'statusText', { configurable: true, get: () => 'OK' });
      Object.defineProperty(xhr, 'responseText', { configurable: true, get: () => '{}' });
      Object.defineProperty(xhr, 'response', { configurable: true, get: () => '{}' });
    } catch (_) {}
    try { xhr.dispatchEvent(new Event('readystatechange')); } catch (_) {}
    try { xhr.dispatchEvent(new ProgressEvent('load')); } catch (_) {}
    try { xhr.dispatchEvent(new ProgressEvent('loadend')); } catch (_) {}
  }

  function installNetworkKill() {
    try {
      const open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (m, url) {
        try { this.__vsgUrl = url; } catch (_) {}
        return open.apply(this, arguments);
      };
      const send = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function (body) {
        const url = this.__vsgUrl || '';
        if (KILL_NETWORK && FOCUS_URL.test(url)) {
          VSG.killed++;
          if (SPY) console.log('%c[VSG] KILL xhr', 'color:#00d26a;font-weight:bold', url, typeof body === 'string' ? body : '');
          setTimeout(() => fakeXhrDone(this), 0);
          return;
        }
        return send.apply(this, arguments);
      };
    } catch (_) {}

    try {
      const nf = window.fetch;
      if (nf) window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        if (KILL_NETWORK && FOCUS_URL.test(url)) {
          VSG.killed++;
          if (SPY) console.log('%c[VSG] KILL fetch', 'color:#00d26a;font-weight:bold', url);
          return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return nf.apply(this, arguments);
      };
    } catch (_) {}

    try {
      if (navigator.sendBeacon) {
        const sb = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = function (url, data) {
          if (KILL_NETWORK && FOCUS_URL.test(url)) { VSG.killed++; return true; }
          return sb(url, data);
        };
      }
    } catch (_) {}
  }

  /* ---------- on*-свойства ---------- */

  const ON_SWALLOW = ['onvisibilitychange', 'onwebkitvisibilitychange',
    'onmozvisibilitychange', 'onmsvisibilitychange', 'onblur', 'onfocus', 'onpagehide'];
  const ON_FS = ['onfullscreenchange', 'onwebkitfullscreenchange',
    'onmozfullscreenchange', 'onmsfullscreenchange'];

  function patchOnProps() {
    for (const host of [window, document]) {
      if (!host) continue;
      for (const p of ON_SWALLOW) {
        try {
          Object.defineProperty(host, p, { configurable: true, get: () => null, set: () => {} });
        } catch (_) {}
      }
      if (BLOCK_FS_EXIT) for (const p of ON_FS) {
        try {
          let fn = null, wired = false;
          Object.defineProperty(host, p, {
            configurable: true,
            get: () => fn,
            set: (v) => {
              fn = v;
              if (wired) return;
              wired = true;
              nativeAdd.call(host, p.slice(2), (ev) => {
                if (!fsEl() && typeof fn === 'function') { try { fn.call(host, ev); } catch (_) {} }
              });
            }
          });
        } catch (_) {}
      }
    }
  }

  /* ---------- самовосстановление ---------- */

  function startReassert() {
    setInterval(() => {
      try {
        if (document.hidden !== false || document.hasFocus() !== true) patchState();
        if (EventTarget.prototype.addEventListener !== patchedAdd) patchEvents();
      } catch (_) {}
    }, REASSERT_MS);
  }

  /* ---------- старт ---------- */

  patchState();
  patchEvents();
  patchOnProps();
  installSwallowers();
  installTimerDriver();
  installTimerSpy();
  installNetworkKill();
  startReassert();

  /* ---------- CSS фикс оверлея ---------- */

  function installOverlayFix() {
    const style = document.createElement('style');
    style.id = '__vsg-overlay-fix';
    style.textContent = `
      #header-container {
        z-index: 0 !important;
        pointer-events: none !important;
        opacity: 0 !important;
        display: none !important;
      }
      #test13000665 > div > div.test-quest-numb-timer_row.mb05 {
        z-index: 99999 !important;
        position: relative !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  installOverlayFix();

  VSG.state = () => ({
    hidden: document.hidden, visibilityState: document.visibilityState,
    hasFocus: document.hasFocus(), fullscreen: !!fsEl()
  });

  VSG.report = () => ({
    version: VSG.version,
    counters: { blocked: VSG.blocked, killed: VSG.killed, driven: VSG.driven },
    blockedList: VSG.blockedList,
    fired: VSG.fired,
    topReads: [...VSG.reads.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15),
    intervals: VSG.intervals,
    focusTimeouts: VSG.timeouts.filter((s) => /focus|hidden|visib|fullscreen|blur|tab/i.test(s)).slice(-30)
  });

  console.log('%c[VSG] 1.4 активна', 'color:#00d26a;font-weight:bold');
})();