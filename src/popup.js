/* Vseosvita Focus Guard — popup.js */
'use strict';

const toggle     = document.getElementById('enabledToggle');
const toggleSub  = document.getElementById('toggleSub');
const toggleCard = document.getElementById('toggleCard');

// Extension IDs (fixed via "key" in manifest)
const EXT_QUAZ   = 'mcmcmdaeegfgjnmfpmadlhkebkabgomb';
const EXT_MOODLE = 'kmbjnmkpgpfmdeiaadmgjffjdclpifoh';

function applyState(enabled) {
  toggle.checked = enabled;
  toggleSub.textContent = enabled ? 'Увімкнено' : 'Вимкнено';
  toggleSub.classList.toggle('active', enabled);
  toggleCard.classList.toggle('off', !enabled);
}

// Hide project cards for already-installed extensions
function checkRelatedProjects() {
  if (!chrome.management) return;
  chrome.management.getAll((exts) => {
    if (chrome.runtime.lastError) return;
    const ids = new Set(exts.filter(e => e.enabled).map(e => e.id));
    const map = { 'proj-quaz': EXT_QUAZ, 'proj-moodle': EXT_MOODLE };
    for (const [elId, extId] of Object.entries(map)) {
      const el = document.getElementById(elId);
      if (el) el.style.display = ids.has(extId) ? 'none' : '';
    }
  });
}

chrome.storage.local.get({ enabled: true }, ({ enabled }) => {
  applyState(enabled);
});

checkRelatedProjects();

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  applyState(enabled);
  chrome.storage.local.set({ enabled });

  chrome.tabs.query({ url: ['*://vseosvita.ua/*', '*://*.vseosvita.ua/*'] }, (tabs) => {
    if (!tabs || !tabs.length) return;
    for (const tab of tabs) chrome.tabs.reload(tab.id);
  });
});
