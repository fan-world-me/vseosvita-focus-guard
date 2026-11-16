(() => {
  'use strict';
  if (window.__vsgInjected) return;
  window.__vsgInjected = true;
  const host = document.head || document.documentElement || document;
  const s = document.createElement('script');
  s.src = browser.runtime.getURL('content.js');
  s.onload = () => s.remove();
  host.appendChild(s);
})();