(() => {
  'use strict';
  if (window.__vsgInjected) return;
  window.__vsgInjected = true;
  const host = document.head || document.documentElement || document;
  const s = document.createElement('script');
  const rt = (typeof browser !== 'undefined' ? browser : chrome).runtime;
  s.src = rt.getURL('content.js');
  s.onload = () => s.remove();
  host.appendChild(s);
})();