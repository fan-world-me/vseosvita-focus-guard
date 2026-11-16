[![Telegram](https://img.shields.io/badge/Telegram-@fan__world__me-2CA5E0?style=flat-square&logo=telegram)](https://t.me/fan_world_me) [![Discord](https://img.shields.io/badge/Discord-fan__world__me-5865F2?style=flat-square&logo=discord)](https://discord.com/users/1040301536036786248) [![GitHub](https://img.shields.io/badge/GitHub-fan--world--me-181717?style=flat-square&logo=github)](https://github.com/fan-world-me) [![Portfolio](https://img.shields.io/badge/Portfolio-fan--world--me.github.io-00e5ff?style=flat-square&logo=githubpages&logoColor=white)](https://fan-world-me.github.io/)

```
██╗   ██╗███████╗ ██████╗
██║   ██║██╔════╝██╔════╝
██║   ██║███████╗██║  ███╗
╚██╗ ██╔╝╚════██║██║   ██║
 ╚████╔╝ ███████║╚██████╔╝
  ╚═══╝  ╚══════╝ ╚═════╝
  Vseosvita Focus Guard v1.5 — Chrome & Firefox browser extension
```

Browser extension that neutralizes focus tracking, tab-visibility detection, and overlay blocking on vseosvita.ua — keeps the timer running and the test visible even when you switch tabs or windows.

### 💭 What it does

- 🛡️ **Visibility spoofing** — `document.hidden` always returns `false`, `visibilityState` always `"visible"`
- 🚫 **Event blocking** — intercepts `visibilitychange`, `blur`, `pagehide`, `freeze` and all focus-related listeners before the page registers them
- 🌐 **Network kill** — blocks XHR / fetch / sendBeacon requests to focus-event endpoints
- ⏱️ **Timer driver** — keeps `setInterval` callbacks firing even when the tab is backgrounded
- 🪟 **Overlay fix** — hides `#header-container` when it tries to cover the test on tab switch
- 🔄 **Self-healing** — reasserts all patches every 500 ms in case the page tries to overwrite them

---

### 🧰 Tech Stack

**Core** [![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#) [![Firefox](https://img.shields.io/badge/Firefox_Add--ons-MV2-FF7139?style=flat-square&logo=firefox&logoColor=white)](#) [![Chrome](https://img.shields.io/badge/Chrome_Extensions-MV3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#)

**Browser APIs** [![Content Scripts](https://img.shields.io/badge/Content_Scripts-document__start-00e5ff?style=flat-square)](#) [![Web Accessible](https://img.shields.io/badge/Web_Accessible_Resources-inject-00e5ff?style=flat-square)](#)

---

### 🗂️ Project Structure

```
vseosvita-focus-guard/
├── src/
│   ├── content.js             — core patches: visibility, events, timers, network, overlay
│   └── inject.js              — injects content.js into page world at document_start
├── manifests/
│   ├── chrome/manifest.json   — Chrome MV3 manifest
│   └── firefox/manifest.json  — Firefox MV2 manifest
├── dist/                      — build output (gitignored)
├── package-extensions.ps1     — build script (Windows / PowerShell)
├── package-extensions.sh      — build script (Linux / macOS / WSL)
├── .gitignore
├── LICENSE
└── README.md
```

---

### 🚀 How it works

```
[Page loads] ──► inject.js runs at document_start
                        │
                        ▼
             content.js injected into page world
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   Patch visibility  Block events  Kill network
   document.hidden   visibilitychange  /focus-event
   hasFocus()        blur / pagehide   XHR / fetch
                        │
                        ▼
             Timer driver keeps intervals alive
                        │
                        ▼
             Overlay fix hides #header-container
                        │
                        ▼
             Self-heal loop reasserts every 500ms
```

---

### 📦 Build

**Windows (PowerShell)**

```powershell
.\package-extensions.ps1
```

**Linux / macOS / WSL**

```bash
chmod +x package-extensions.sh   # once
./package-extensions.sh
```

Output in `dist/`:

```
dist/
├── chrome-unpacked/                       — load in Chrome developer mode
├── firefox-unpacked/                      — load in Firefox temporary add-on mode
├── vseosvita-focus-guard-chrome.zip       — Chrome package
├── vseosvita-focus-guard-firefox.zip      — Firefox package
└── vseosvita-focus-guard-firefox.xpi     — unsigned .xpi for Firefox Android
```

---

### 🛠️ Install Locally

**Chrome / Edge / Brave**

```
1. Open chrome://extensions
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select dist/chrome-unpacked
```

**Firefox Desktop**

```
1. Open about:debugging#/runtime/this-firefox
2. Click "Load Temporary Add-on"
3. Select dist/firefox-unpacked/manifest.json
```

**Firefox Android**

```
1. Install Firefox Nightly
2. Open about:config → set xpinstall.signatures.required = false
3. Transfer vseosvita-focus-guard-firefox.xpi to phone
4. Open the .xpi directly in Firefox
```

---

### 📄 License

[GPL-3.0](LICENSE) © [fan-world-me](https://github.com/fan-world-me)

---

### 🔗 Other extensions by the author

| Extension | Description |
|---|---|
| [🧠 Quiz AI Analyzer](https://github.com/fan-world-me/quizai) | Floating AI panel that auto-detects and answers quiz questions on vseosvita.ua, Moodle, Kahoot and more |
| [⚡ Moodle Auto Relogin](https://github.com/fan-world-me/moodle-autoreconnect) | Keeps your Moodle session alive and silently re-logs you in if it expires |

---

Made with 🩵 in Ukraine 🇺🇦

[![Telegram](https://img.shields.io/badge/Telegram-@fan__world__me-2CA5E0?style=flat-square&logo=telegram)](https://t.me/fan_world_me) [![Discord](https://img.shields.io/badge/Discord-fan__world__me-5865F2?style=flat-square&logo=discord)](https://discord.com/users/1040301536036786248) [![Portfolio](https://img.shields.io/badge/Portfolio-fan--world--me.github.io-00e5ff?style=flat-square&logo=githubpages&logoColor=white)](https://fan-world-me.github.io/)
