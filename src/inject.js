(() => {
  'use strict';
  if (window.__vsgInjected) return;
  window.__vsgInjected = true;
  const rt = (typeof browser !== 'undefined' ? browser : chrome).runtime;
  const url = rt.getURL('content.js');
  const host = document.head || document.documentElement || document;
  const s = document.createElement('script');
  s.src = url;
  s.onload = () => s.remove();
  host.appendChild(s);
})();
