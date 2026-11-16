(() => {
  'use strict';
  if (window.__vsgInjected) return;

  const api = typeof browser !== 'undefined' ? browser : chrome;

  api.storage.local.get({ enabled: true }, ({ enabled }) => {
    if (!enabled) return; // защита выключена пользователем

    window.__vsgInjected = true;
    const url = api.runtime.getURL('content.js');
    const host = document.head || document.documentElement || document;
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => s.remove();
    host.appendChild(s);
  });
})();
