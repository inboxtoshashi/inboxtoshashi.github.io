// (Removed duplicate Control Center toggle logic; see initializeControlCenter below)
// Temporary runtime diagnostics: boot log and global error handlers
// script.js loaded
window.addEventListener('error', (ev) => {
    try { console.error('Runtime error', ev.message, ev.filename + ':' + ev.lineno + ':' + ev.colno, ev.error); } catch (e) {}
});
window.addEventListener('unhandledrejection', (ev) => {
    try { console.error('Unhandled rejection', ev.reason); } catch (e) {}
});
// Window Management
let windows = [];
let zIndexCounter = 1000; // Start above dock (z-index: 900)
let activeWindow = null;
// Track cascade placement index to avoid opening windows at random positions
window.__openWindowCascadeIndex = window.__openWindowCascadeIndex || 0;

// App Configurations
const appConfigs = {
    about: { title: '👤 About Me', width: 700, height: 600 },
    terminal: { title: '⌨️ Terminal', width: 700, height: 500 },
    preview: { title: '🖼️ Preview', width: 800, height: 600 },
    files: { title: '', width: 800, height: 600 },
    safari: { title: '🌐 Safari', width: 900, height: 500 },
    vscode: { title: '💻 VS Code', width: 900, height: 600 },
    contact: { title: '✉️ Contact', width: 600, height: 650 },
    settings: { title: '⚙️ Settings', width: 700, height: 550 }
    ,calendar: { title: '📅 Calendar', width: 520, height: 420 }
    ,spy: { title: '🕵️ Spy', width: 760, height: 460 }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
        // Add PDF desktop shortcut
        const desktop = document.querySelector('.desktop');
        if (desktop && !document.querySelector('.desktop-shortcut.pdf-resume')) {
            const shortcut = document.createElement('div');
            shortcut.className = 'desktop-shortcut pdf-resume';
            shortcut.title = 'Resume (PDF)';
            shortcut.style.cursor = 'pointer';
            shortcut.innerHTML = `
                <div class="desktop-shortcut-icon"><img src="images/icons/pdf.png" alt="PDF"/></div>
                <div class="desktop-shortcut-label">Resume.pdf</div>
            `;
            shortcut.dataset.file = 'files/Shashi_Kant_Singh.pdf';
            shortcut.addEventListener('dblclick', (e) => { e.stopImmediatePropagation(); openDesktopPdf(shortcut.dataset.file); });
            shortcut.addEventListener('click', (e) => { e.stopImmediatePropagation(); openDesktopPdf(shortcut.dataset.file); });
            desktop.appendChild(shortcut);
            try { positionDesktopShortcuts(); } catch (e) {}
        }

        // Helper to open PDF in Preview app (robust: wait for window element)
        function openDesktopPdf(filePath) {
            openApp('preview');
            // wait for the preview window element to exist, then initialize
            const start = Date.now();
            const timeout = 2000; // ms
            (function waitForPreview() {
                const winEntry = (window.windows || windows || []).find(w => w.appName === 'preview');
                const previewEl = winEntry ? winEntry.element : document.querySelector('.window[data-app="preview"]');
                if (previewEl && typeof initializePreview === 'function') {
                    try { initializePreview(previewEl, filePath); } catch (e) { console.error('initializePreview failed', e); }
                    return;
                }
                if (Date.now() - start < timeout) {
                    setTimeout(waitForPreview, 80);
                } else {
                    console.warn('Preview element not found to load', filePath);
                }
            })();
        }
    // menu-icon click logging removed to reduce noisy debug output
    initializeDock();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    initializeWiFiDropdown();
    // Restore desktop context menu (right-click) handler
    function createDesktopContextMenu() {
        let menu = document.querySelector('.desktop-context-menu');
        if (menu) return menu;
        menu = document.createElement('div');
        menu.className = 'desktop-context-menu';
        menu.style.display = 'none';
        menu.innerHTML = `
            <div class="ctx-item" data-action="new-folder">New Folder</div>
            <div class="ctx-sep"></div>
            <div class="ctx-item" data-action="get-info">Get Info</div>
        `;
        document.body.appendChild(menu);

        menu.addEventListener('click', (ev) => {
            const action = ev.target.closest('.ctx-item')?.dataset?.action;
            if (!action) return;
            ev.stopPropagation();
            hideDesktopContextMenu();
            if (action === 'new-folder') {
                // create a placeholder folder shortcut using an existing icon
                const folder = document.createElement('div');
                folder.className = 'desktop-shortcut';
                const iconHtml = `<div class="desktop-shortcut-icon"><img src="images/icons/desktop.png" alt="Folder"/></div>`;
                const label = document.createElement('div');
                label.className = 'desktop-shortcut-label';
                label.contentEditable = 'true';
                label.spellcheck = false;
                label.textContent = 'New Folder';
                folder.innerHTML = iconHtml;
                folder.appendChild(label);
                // append then position so measurements work
                const desktopEl = document.querySelector('.desktop');
                desktopEl?.appendChild(folder);
                // ensure correct stacking/position immediately after adding
                requestAnimationFrame(() => {
                    try { positionDesktopShortcuts(); } catch (e) {}
                });
                // focus and select the label so user can rename immediately
                setTimeout(() => {
                    label.focus();
                    // select all text
                    const range = document.createRange();
                    range.selectNodeContents(label);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }, 60);

                function commitLabel() {
                    // sanitize and ensure non-empty
                    const name = (label.textContent || '').trim() || 'New Folder';
                    label.textContent = name;
                    label.contentEditable = 'false';
                    positionDesktopShortcuts();
                }

                label.addEventListener('blur', () => commitLabel());
                label.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        label.blur();
                    } else if (ev.key === 'Escape') {
                        ev.preventDefault();
                        // revert name
                        label.textContent = 'New Folder';
                        label.blur();
                    }
                });

            } else if (action === 'get-info') {
                // Open About window and show social links + mailto
                openApp('about');
                setTimeout(() => {
                    const winEntry = (window.windows || windows || []).find(w => w.appName === 'about');
                    let aboutEl = winEntry ? winEntry.element : document.querySelector('.window[data-app="about"]');
                    if (!aboutEl) return;
                    const wrapper = aboutEl.querySelector('.window-content-wrapper');
                    if (!wrapper) return;
                    // Prefer to append links into the existing about content to preserve styles
                    const aboutContent = wrapper.querySelector('.about-content') || wrapper;
                    // Removed appended "Connect with me" links per user request
                    // previously we appended a resume summary here; removed per user request
                }, 300);
            }
        });

        return menu;
    }

    function hideDesktopContextMenu() {
        const menu = document.querySelector('.desktop-context-menu');
        if (menu) menu.style.display = 'none';
    }

    // Global contextmenu handler to intercept right-clicks on the desktop
    document.addEventListener('contextmenu', (e) => {
        try {
            const desktopEl = document.querySelector('.desktop');
            if (!desktopEl) return;
            // Only intercept if the right-click occurred on the desktop itself
            if (e.target && e.target.closest && e.target.closest('.desktop') && !e.target.closest('.window')) {
                e.preventDefault();
                const menu = createDesktopContextMenu();
                // position menu within viewport bounds
                const mw = menu.offsetWidth || 220;
                const mh = menu.offsetHeight || 180;
                const left = Math.min(e.clientX, window.innerWidth - mw - 8);
                const top = Math.min(e.clientY, window.innerHeight - mh - 8);
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
                menu.style.display = 'block';

                // hide on next click or escape
                const onDocClick = () => { hideDesktopContextMenu(); document.removeEventListener('click', onDocClick); };
                document.addEventListener('click', onDocClick);
                const onEsc = (ev) => { if (ev.key === 'Escape') { hideDesktopContextMenu(); document.removeEventListener('keydown', onEsc); } };
                document.addEventListener('keydown', onEsc);
            }
        } catch (err) {
            // fail silently
        }
    });
});

// Attempt to load the best-matching icon file for each `.skill-icon-only` image.
// This makes icon selection robust to filename case/spacing differences (e.g. "Terraform" -> Terraform.png).
function resolveSkillIcons() {
    const extCandidates = ['.png', '.svg', '.webp', '.PNG'];
    const alias = {
        'git': ['github.png', 'git.png'],
        'gitlab': ['gitlab.png'],
        'github actions': ['github-action.png', 'github_actions.png'],
        'bash': ['linux.png', 'bash.png'],
        'yml': ['yml.png', 'yaml.png'],
        'elk': ['Elastic Search.png', 'elastic-search.png', 'elk.png'],
        'elastic search': ['Elastic Search.png', 'elastic-search.png'],
        'kibana': ['Kibana.png', 'kibana.png'],
        'logstash': ['Logstash.png', 'logstash.png'],
        'terraform': ['Terraform.png', 'terraform.png'],
        'ssl': ['ssl.png'],
        'tls': ['tls.png']
    };

    function normalize(name) {
        return (name || '').toString().trim();
    }

    const wraps = document.querySelectorAll('.skill-icon-wrap');
    wraps.forEach(wrap => {
        const name = normalize(wrap.dataset.name || wrap.textContent || '');
        const img = wrap.querySelector('img.skill-icon-only');
        if (!img) return;

        // Build ordered candidate list
        const candidates = [];
        const lower = name.toLowerCase();

        // explicit aliases first
        if (alias[lower]) candidates.push(...alias[lower]);

        // common variants derived from name
        const variants = new Set([
            name,
            name.replace(/\s+/g, '-'),
            name.replace(/\s+/g, '_'),
            name.replace(/\s+/g, ''),
            lower,
            lower.replace(/\s+/g, '-'),
            lower.replace(/\s+/g, '_'),
            lower.replace(/\s+/g, '')
        ]);

        variants.forEach(v => {
            if (!v) return;
            // try with extension and plain
            extCandidates.forEach(ext => candidates.push(v + ext));
            candidates.push(v);
        });

        // ensure uniqueness
        const ordered = Array.from(new Set(candidates));

        // Try each candidate by attempting to load it; use first that succeeds
        (function tryNext(i) {
            if (i >= ordered.length) return; // no candidate found
            const src = 'images/icons/' + ordered[i];
            const tester = new Image();
            tester.onload = function() {
                // found working icon — update img src
                img.src = src;
                // update alt if missing
                if (!img.alt || img.alt.toLowerCase() === 'image') img.alt = name;
            };
            tester.onerror = function() {
                tryNext(i + 1);
            };
            // start loading
            tester.src = src;
        })(0);
    });
}

// Reposition shortcuts on resize and when datetime updates
window.addEventListener('resize', () => {
    try { positionDesktopShortcuts(); } catch (e) {}
});

// Mobile launcher: small floating buttons to open Preview/Files when dock is hidden
document.addEventListener('DOMContentLoaded', () => {
    function createMobileLauncher() {
        try {
            if (globalThis.innerWidth > 720) {
                const existing = document.querySelector('.mobile-launcher');
                if (existing) existing.remove();
                return;
            }
            if (document.querySelector('.mobile-launcher')) return;
            const launcher = document.createElement('div');
            launcher.className = 'mobile-launcher';

            const btnPreview = document.createElement('button');
            btnPreview.className = 'mobile-launcher-btn';
            btnPreview.title = 'Open Preview';
            btnPreview.innerText = 'Preview';
            btnPreview.addEventListener('click', (e) => {
                e.stopPropagation();
                openApp('preview');
                btnPreview.disabled = true;
                btnPreview.classList.add('disabled');
            });

            const btnFiles = document.createElement('button');
            btnFiles.className = 'mobile-launcher-btn';
            btnFiles.title = 'Open Files';
            btnFiles.innerText = 'Files';
            btnFiles.addEventListener('click', (e) => {
                e.stopPropagation();
                openApp('files');
                btnFiles.disabled = true;
                btnFiles.classList.add('disabled');
            });
            // Helper to re-enable launcher buttons when windows are closed
            function updateLauncherButtons() {
                const previewOpen = !!(window.windows || []).find(w => w.appName === 'preview');
                const filesOpen = !!(window.windows || []).find(w => w.appName === 'files');
                btnPreview.disabled = previewOpen;
                btnFiles.disabled = filesOpen;
                btnPreview.classList.toggle('disabled', previewOpen);
                btnFiles.classList.toggle('disabled', filesOpen);
            }
            // Listen for window open/close events
            window.addEventListener('appWindowChange', updateLauncherButtons);
            // Initial state
            setTimeout(updateLauncherButtons, 200);

            launcher.appendChild(btnPreview);
            launcher.appendChild(btnFiles);
            // default CSS-aware bottom using safe-area; JS will fine-tune for visualViewport
            launcher.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + 16px)';
            document.body.appendChild(launcher);

            // Adjust position for browsers (iOS Safari) where viewport chrome reduces visible height
            function adjustLauncherPosition() {
                try {
                    const lv = window.visualViewport;
                    let extra = 0;
                    if (lv && typeof lv.height === 'number') {
                        // space occupied by browser UI at bottom
                        const bottomInset = Math.max(0, window.innerHeight - (lv.pageTop + lv.height));
                        extra = Math.round(bottomInset);
                    }
                    const base = 16; // base distance from bottom
                    launcher.style.bottom = (base + extra) + 'px';
                } catch (err) {
                    // fallback to CSS safe-area
                    launcher.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + 16px)';
                }
            }

            // run once now and wire up resize/orientation changes
            adjustLauncherPosition();
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', adjustLauncherPosition);
                window.visualViewport.addEventListener('scroll', adjustLauncherPosition);
            }
            window.addEventListener('orientationchange', adjustLauncherPosition);
            window.addEventListener('resize', adjustLauncherPosition);
        } catch (err) {
            console.error('createMobileLauncher failed', err);
        }
    }

    createMobileLauncher();
    window.addEventListener('resize', () => createMobileLauncher());
});

// Update Date Time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
    };
    const dateStr = now.toLocaleString('en-US', options);
    document.getElementById('datetime').textContent = dateStr;
    // Reposition desktop shortcut in case menu bar height or content changed
    try { positionDesktopShortcuts(); } catch (e) {}
}

// Position desktop shortcuts under the menu bar to avoid overlap.
function positionDesktopShortcuts() {
    try {
        // Do not reposition while the UI is locked — menu bar may be hidden
        if (document.body.classList && document.body.classList.contains('locked')) return;

        const menuBar = document.querySelector('.menu-bar');
        const shortcuts = document.querySelectorAll('.desktop-shortcut');
        if (!menuBar || !shortcuts) return;
        const rect = menuBar.getBoundingClientRect();
        const baseTop = Math.ceil(rect.bottom + 12); // 12px gap
        const gap = 12;
        const baseRight = 18;
        const desktopHeight = window.innerHeight;
        // Estimate shortcut height (use first shortcut or fallback)
        let shortcutHeight = 96;
        if (shortcuts.length > 0) {
            shortcutHeight = Math.ceil(shortcuts[0].getBoundingClientRect().height) || shortcuts[0].offsetHeight || 96;
        }
        // Calculate max shortcuts per column
        const availableHeight = desktopHeight - baseTop - 24; // 24px bottom margin
        const maxPerCol = Math.max(1, Math.floor(availableHeight / (shortcutHeight + gap)));

        // Position shortcuts in columns, top to bottom, then next column
        const list = Array.from(shortcuts);
        list.forEach((s, idx) => {
            const col = Math.floor(idx / maxPerCol);
            const row = idx % maxPerCol;
            s.style.position = 'absolute';
            s.style.top = (baseTop + row * (shortcutHeight + gap)) + 'px';
            s.style.right = (baseRight + col * (shortcutHeight + 32)) + 'px'; // 32px gap between columns
            s.style.left = '';
            const hasWindows = Array.isArray(window.windows) ? window.windows.length > 0 : (typeof windows !== 'undefined' ? windows.length > 0 : false);
            s.style.zIndex = hasWindows ? '50' : '150';
        });
    } catch (e) {
        // silently ignore
    }
}

// Small on-screen toast for quick diagnostics (temporary)
/* debug toast removed */

// Make sidebar sections collapsible: click the section title to toggle
function initializeSidebarCollapsible() {
    document.querySelectorAll('.sidebar-section').forEach(section => {
        const title = section.querySelector('.sidebar-section-title');
        if (!title) return;
        title.style.userSelect = 'none';
        title.addEventListener('click', (e) => {
            e.stopPropagation();
            section.classList.toggle('collapsed');
        });
    });
}

// Lock screen: show/hide overlay and update clock
document.addEventListener('DOMContentLoaded', () => {
    const lockBtn = document.getElementById('lockScreenBtn');
    const lockOverlay = document.getElementById('lockScreen');
    // Shared fallbacks so show/hide can't race and re-add `locked` unexpectedly
    let lockShowFallback = null;
    let lockHideFallback = null;

    function updateLockTime() {
        if (!lockOverlay) return;
        const now = new Date();
        const timeEl = lockOverlay.querySelector('.lock-time');
        const dateEl = lockOverlay.querySelector('.lock-date');
        if (timeEl) {
            // Show hour:minute without AM/PM (strip day period) to match lock-screen style
            let t = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            t = t.replace(/\s?(AM|PM)$/i, '');
            timeEl.textContent = t;
        }
        if (dateEl) {
            // Use en-GB ordering to show: 'Sunday, 11 January'
            dateEl.textContent = now.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        }
    }

    function showLockScreen() {
        if (!lockOverlay) return;
        // lock show requested
        // Clear any transient unlocking state, then set aria and add show class to trigger CSS transition
        document.body.classList.remove('unlocking');
        // reduce heavy effects while animating to improve performance
        document.body.classList.add('reduce-effects');
        // immediately fade UI chrome so it doesn't flash during the overlay fade
            document.body.classList.add('locking');
            // allow UI chrome to be displayed (remove `locked`) immediately so elements can repaint
            document.body.classList.remove('locked');
        lockOverlay.setAttribute('aria-hidden', 'false');
        lockOverlay.classList.add('show');
        // Wait for the opacity transition to complete before applying `locked`
        // so the UI hidden-by-locked doesn't jump in mid-fade.
        // clear any pending hide fallback (we're showing)
        if (lockHideFallback) { clearTimeout(lockHideFallback); lockHideFallback = null; }
        let showFallback = null;
        const onTransitionEnd = (ev) => {
            if (ev.target !== lockOverlay || ev.propertyName !== 'opacity') return;
            lockOverlay.removeEventListener('transitionend', onTransitionEnd);
            if (showFallback) { clearTimeout(showFallback); showFallback = null; }
            document.body.classList.add('locked');
            // remove the temporary locking fade (locked will actually hide the UI)
            document.body.classList.remove('locking');
            try { lockOverlay.querySelector('.lock-center')?.focus(); } catch (e) {}
        };
        lockOverlay.addEventListener('transitionend', onTransitionEnd);
        // Fallback: ensure `locked` is applied even if transitionend doesn't fire
        lockShowFallback = setTimeout(() => {
            lockOverlay.removeEventListener('transitionend', onTransitionEnd);
            document.body.classList.add('locked');
            document.body.classList.remove('locking');
            try { lockOverlay.querySelector('.lock-center')?.focus(); } catch (e) {}
            lockShowFallback = null;
        }, 320);
        updateLockTime();
    }

    function hideLockScreen() {
        if (!lockOverlay) return;
        // lock hide requested
        // cancel any pending show fallback so it doesn't re-apply `locked`
        if (lockShowFallback) { clearTimeout(lockShowFallback); lockShowFallback = null; }
        // ensure UI chrome becomes displayable, switch to `unlocking` so it fades in
        document.body.classList.remove('locked');
        document.body.classList.remove('locking');
        document.body.classList.add('unlocking');
        // ensure the browser has the current layout state, then trigger fade-out
        try { lockOverlay.getBoundingClientRect(); } catch (e) {}
        requestAnimationFrame(() => {
            lockOverlay.classList.remove('show');
        });

        // Use transitionend so we remove locked/reduce-effects right after fade finishes
        let hideFallback = null;
        const onEnd = (ev) => {
            if (ev.target !== lockOverlay || ev.propertyName !== 'opacity') return;
            lockOverlay.removeEventListener('transitionend', onEnd);
            if (hideFallback) { clearTimeout(hideFallback); hideFallback = null; }
            lockOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('locked');
            document.body.classList.remove('reduce-effects');
            // remove temporary locking/unlocking fade
            document.body.classList.remove('locking');
            document.body.classList.remove('unlocking');
            try { positionDesktopShortcuts(); } catch (e) {}
        };
        lockOverlay.addEventListener('transitionend', onEnd);
        // Fallback: ensure cleanup occurs if transitionend is missed — match CSS duration (220ms) + buffer
        lockHideFallback = setTimeout(() => {
            lockOverlay.removeEventListener('transitionend', onEnd);
            lockOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('locked');
            document.body.classList.remove('reduce-effects');
            document.body.classList.remove('locking');
            document.body.classList.remove('unlocking');
            try { positionDesktopShortcuts(); } catch (e) {}
            lockHideFallback = null;
        }, 320);
    }

    // attach handlers
    if (lockBtn) lockBtn.addEventListener('click', (e) => { e.stopPropagation(); showLockScreen(); });

    // Clicking anywhere on the lock overlay or pressing Escape dismisses it
    if (lockOverlay) {
        lockOverlay.addEventListener('click', (e) => {
            // unlock on any click within the overlay
            hideLockScreen();
        });
        // ensure initial DOM state has overlay hidden
        lockOverlay.classList.remove('visible');
        lockOverlay.setAttribute('aria-hidden', 'true');
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideLockScreen(); });

    // keep clock updated while visible
    setInterval(() => {
        if (lockOverlay && lockOverlay.classList && lockOverlay.classList.contains('show')) updateLockTime();
    }, 1000);
});

// Collapsible search: show lens icon and expand to input on click
function initializeCollapsibleSearch() {
    const container = document.getElementById('finderSearchContainer');
    const toggle = document.getElementById('finderSearchToggle');
    const input = document.getElementById('finderSearch');
    if (!container || !toggle || !input) return;

    // Toggle expand on lens click
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.add('search-expanded');
        setTimeout(() => input.focus(), 80);
    });

    // Collapse when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('search-expanded');
        }
    });

    // Collapse on Escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            container.classList.remove('search-expanded');
            input.blur();
        }
    });
}

// Initialize Dock
function initializeDock() {
    const dockApps = document.querySelectorAll('.dock-app');
    dockApps.forEach(app => {
        app.addEventListener('click', () => {
            const appName = app.dataset.app;
            openApp(appName);
        });

        // small restore overlay on dock hover removed (UI simplified)
    });
}

// Open Application
function openApp(appName) {
    // Prevent rapid repeated opens: track apps currently being opened
    window.__openingApps = window.__openingApps || {};
    if (window.__openingApps[appName]) {
        // If a window already exists, focus it; otherwise ignore the extra open
        const existingWindow = windows.find(w => w.appName === appName);
        if (existingWindow) {
            if (existingWindow.element.classList.contains('minimized')) existingWindow.element.classList.remove('minimized');
            focusWindow(existingWindow.element);
            window.dispatchEvent(new Event('appWindowChange'));
        }
        return;
    }
    window.__openingApps[appName] = true;

    // On mobile: only one window visible at a time
    if (globalThis.innerWidth <= 720) {
        // Minimize all other windows
        (window.windows || []).forEach(w => {
            if (w.appName !== appName && w.element && !w.element.classList.contains('minimized')) {
                w.element.classList.add('minimized');
            }
        });
    }

    // Check if app is already open
    const existingWindow = windows.find(w => w.appName === appName);
    if (existingWindow) {
        // Always bring to top and un-minimize
        if (existingWindow.element.classList.contains('minimized')) {
            existingWindow.element.classList.remove('minimized');
        }
        focusWindow(existingWindow.element);
        // Fire event so launcher can update
        window.dispatchEvent(new Event('appWindowChange'));
        return;
    }

    const config = appConfigs[appName];
    if (!config) return;

    const windowElement = createWindow(appName, config);
    document.getElementById('windowsContainer').appendChild(windowElement);

    // If opening Safari on small screens, pin it under the menu bar so it's always visible
    try {
        if (appName === 'safari' && globalThis.innerWidth <= 720) {
            // Use CSS calc with safe-area so it respects notches and browser chrome
            windowElement.style.left = '0px';
            windowElement.style.top = 'calc(env(safe-area-inset-top, 0px) + 48px)';
            windowElement.style.width = '100%';
            windowElement.style.height = 'calc(100vh - (env(safe-area-inset-top, 0px) + 120px))';
            windowElement.style.position = 'fixed';
            windowElement.classList.add('pinned-mobile');
        }
    } catch (e) { console.error('Failed to pin safari window on mobile', e); }

    // Load content
    loadWindowContent(windowElement, appName);

    // Add to windows array
    windows.push({
        appName: appName,
        element: windowElement,
        isMaximized: false
    });
    // clear the opening flag now that the window exists
    try { delete window.__openingApps[appName]; } catch(e) {}
    // Fire event so launcher can update
    window.dispatchEvent(new Event('appWindowChange'));

    // Mark dock app as active
    const dockApp = document.querySelector(`.dock-app[data-app="${appName}"]`);
    if (dockApp) dockApp.classList.add('active');

    // Listen for window close to re-enable launcher button
    windowElement.addEventListener('remove', () => {
        setTimeout(() => window.dispatchEvent(new Event('appWindowChange')), 100);
    });

    // Focus the new window
    focusWindow(windowElement);
    // Reposition desktop shortcuts so they remain under the newly opened window
    try { positionDesktopShortcuts(); } catch (e) {}
}

// Create Window
function createWindow(appName, config) {
    const winEl = document.createElement('div');
    winEl.className = 'window';
    winEl.dataset.app = appName;

    // Determine centered + cascading placement to avoid random offscreen windows
    const vw = Math.max(320, globalThis.innerWidth || 1024);
    const vh = Math.max(240, globalThis.innerHeight || 768);
    const w = Math.min(config.width, vw - 24);
    const h = Math.min(config.height, vh - 120);
    const centerX = Math.max(12, Math.floor((vw - w) / 2));
    const centerY = Math.max(12, Math.floor((vh - h) / 2));
    // Use existing windows count as cascade index so new windows offset predictably
    const cascadeIndex = (windows && windows.length) ? windows.length : (window.__openWindowCascadeIndex || 0);
    const cascadeOffset = Math.min(160, cascadeIndex * 28);
    // clamp final position within viewport
    const left = Math.max(12, Math.min(centerX + cascadeOffset, vw - w - 12));
    const top = Math.max( (document.querySelector('.menu-bar')?.getBoundingClientRect().height || 34) + 8, Math.min(centerY + cascadeOffset, vh - h - 48));

    winEl.style.width = w + 'px';
    winEl.style.height = h + 'px';
    winEl.style.left = left + 'px';
    winEl.style.top = top + 'px';
    winEl.style.zIndex = zIndexCounter++;
    // allow keyboard focus for window-level keyboard handling
    winEl.tabIndex = 0;

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar';

    // For Safari, show a small safari.png icon next to the title
    let titleHtml = '';
    if (appName === 'safari') {
        titleHtml = `<div class="window-title"><img src="doc-app/safari.png" alt="Safari" class="window-app-icon"> Safari</div>`;
    } else {
        titleHtml = `<div class="window-title">${config.title}</div>`;
    }

    titleBar.innerHTML = `
        <div class="window-controls">
            <div class="window-btn close"></div>
            <div class="window-btn minimize"></div>
            <div class="window-btn maximize"></div>
        </div>
        ${titleHtml}
        <div style="width: 52px;"></div>
    `;

    // Content area
    const content = document.createElement('div');
    content.className = 'window-content-wrapper';

    winEl.appendChild(titleBar);
    winEl.appendChild(content);

    // Add event listeners
    addWindowEventListeners(winEl, titleBar);

    // increment global cascade index for next window
    try { window.__openWindowCascadeIndex = (window.__openWindowCascadeIndex || 0) + 1; } catch (e) {}

    return winEl;
}

// Add Window Event Listeners
function addWindowEventListeners(window, titleBar) {
    // Focus on click
    window.addEventListener('mousedown', () => focusWindow(window));

    // Dragging - only on title bar
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    titleBar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.window-btn')) return;
        
        e.preventDefault();
        isDragging = true;
        initialX = e.clientX - window.offsetLeft;
        initialY = e.clientY - window.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    });

    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        window.style.left = currentX + 'px';
        window.style.top = currentY + 'px';
    }

    function stopDrag(e) {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // Resizing - from edges and corners
    let isResizing = false;
    let resizeDirection = '';
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    const RESIZE_BORDER = 8; // pixels from edge to trigger resize

    // Helper function to check if near edge
    function isNearEdge(e) {
        const rect = window.getBoundingClientRect();
        const atTop = e.clientY - rect.top < RESIZE_BORDER;
        const atBottom = rect.bottom - e.clientY < RESIZE_BORDER;
        const atLeft = e.clientX - rect.left < RESIZE_BORDER;
        const atRight = rect.right - e.clientX < RESIZE_BORDER;
        return { atTop, atBottom, atLeft, atRight, any: atTop || atBottom || atLeft || atRight };
    }

    // Track mouse position to update cursor
    window.addEventListener('mousemove', (e) => {
        if (isResizing) return;
        
        const rect = window.getBoundingClientRect();
        const edge = isNearEdge(e);
        
        // Update cursor style
        if ((edge.atTop || edge.atBottom) && (edge.atLeft || edge.atRight)) {
            window.style.cursor = edge.atTop ? (edge.atLeft ? 'nwse-resize' : 'nesw-resize') : (edge.atLeft ? 'nesw-resize' : 'nwse-resize');
        } else if (edge.atTop || edge.atBottom) {
            window.style.cursor = 'ns-resize';
        } else if (edge.atLeft || edge.atRight) {
            window.style.cursor = 'ew-resize';
        } else {
            window.style.cursor = 'default';
        }
    });

    // Handle resize start
    window.addEventListener('mousedown', (e) => {
        // Don't resize if clicking on buttons, title
        if (e.target.closest('.window-btn') || e.target.closest('.window-title')) return;
        
        const edge = isNearEdge(e);
        
        // Only start resize if at edge
        if (!edge.any) return;
        
        // Don't resize if clicking on interactive content (links, buttons, inputs)
        if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input')) return;
        
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = window.offsetWidth;
        startHeight = window.offsetHeight;
        startLeft = window.offsetLeft;
        startTop = window.offsetTop;
        
        resizeDirection = '';
        if (edge.atTop) resizeDirection += 'top';
        if (edge.atBottom) resizeDirection += 'bottom';
        if (edge.atLeft) resizeDirection += 'left';
        if (edge.atRight) resizeDirection += 'right';
        
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    });

    function handleResize(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        if (resizeDirection.includes('left')) {
            newWidth = startWidth - deltaX;
            newLeft = startLeft + deltaX;
        }
        if (resizeDirection.includes('right')) {
            newWidth = startWidth + deltaX;
        }
        if (resizeDirection.includes('top')) {
            newHeight = startHeight - deltaY;
            newTop = startTop + deltaY;
        }
        if (resizeDirection.includes('bottom')) {
            newHeight = startHeight + deltaY;
        }
        
        // Minimum window size
        if (newWidth < 300) {
            newWidth = 300;
            if (resizeDirection.includes('left')) newLeft = startLeft + (startWidth - 300);
        }
        if (newHeight < 200) {
            newHeight = 200;
            if (resizeDirection.includes('top')) newTop = startTop + (startHeight - 200);
        }
        
        window.style.width = newWidth + 'px';
        window.style.height = newHeight + 'px';
        window.style.left = newLeft + 'px';
        window.style.top = newTop + 'px';
        
        e.preventDefault();
        e.stopPropagation();
    }

    function stopResize(e) {
        if (isResizing) {
            e.preventDefault();
            e.stopPropagation();
        }
        isResizing = false;
        resizeDirection = '';
        window.style.cursor = 'default';
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    }

    // Window controls
    const minimizeBtn = titleBar.querySelector('.minimize');
    const maximizeBtn = titleBar.querySelector('.maximize');
    const closeBtn = titleBar.querySelector('.close');

    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.classList.add('minimized');
    });

    maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const windowData = windows.find(w => w.element === window);
        if (windowData.isMaximized) {
            window.classList.remove('maximized');
            windowData.isMaximized = false;
        } else {
            window.classList.add('maximized');
            windowData.isMaximized = true;
        }
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(window);
    });
}

// Focus Window
function focusWindow(window) {
    if (activeWindow) {
        activeWindow.style.zIndex = parseInt(activeWindow.style.zIndex) || 10;
    }
    
    window.style.zIndex = zIndexCounter++;
    activeWindow = window;
}

// Close Window
function closeWindow(window) {
    const appName = window.dataset.app;
    
    // Destroy any widget instance attached to this window to stop timers
    try {
        if (window._visitorWidgetInstance && typeof window._visitorWidgetInstance.destroy === 'function') {
            window._visitorWidgetInstance.destroy();
            window._visitorWidgetInstance = null;
        }
    } catch (e) { console.error('Error destroying visitor widget on close', e); }

    // Remove from windows array
    windows = windows.filter(w => w.element !== window);
    
    // Remove active class from dock
    const dockApp = document.querySelector(`.dock-app[data-app="${appName}"]`);
    if (dockApp) dockApp.classList.remove('active');
    
    // Remove window element
    window.remove();
    try { positionDesktopShortcuts(); } catch (e) {}
}

// Load Window Content
function loadWindowContent(window, appName) {
    const template = document.getElementById(`${appName}-template`);
    if (!template) return;

    const content = window.querySelector('.window-content-wrapper');
    const clone = template.content.cloneNode(true);
    content.appendChild(clone);

    // Initialize app-specific functionality
    if (appName === 'terminal') {
        initializeTerminal(window);
    } else if (appName === 'contact') {
        initializeContactForm(window);
    } else if (appName === 'settings') {
        initializeSettings(window);
    } else if (appName === 'files') {
        // Call the finder initializer from finder.js if available
        if (window.initializeFiles && typeof window.initializeFiles === 'function') {
            window.initializeFiles(window);
        } else if (typeof initializeFiles === 'function') {
            // fallback if function still exists in this file
            initializeFiles(window);
        }
    } else if (appName === 'preview') {
        initializePreview(window);
    } else if (appName === 'about') {
        // initialize About window (tabs)
        try { initializeAbout(window); } catch (e) {}
    } else if (appName === 'calendar') {
        initializeCalendar(window);
    } else if (appName === 'spy') {
        // Initialize Spy app: load visitor widget into this window's `#visitor-root`
        try {
            const headerLink = document.querySelector('link[href*="visitor-widget.css"]');
            if (!headerLink) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                // Append cache-busting query so updated CSS loads immediately
                link.href = 'css/visitor-widget.css?v=' + Date.now();
                document.head.appendChild(link);
            }

            function initVisitorRoot() {
                const root = window.querySelector('#visitor-root') || window.querySelector('.visitor-root');
                if (!root) return;
                // If an instance already exists on this window, destroy it first
                try { if (window._visitorWidgetInstance && typeof window._visitorWidgetInstance.destroy === 'function') { window._visitorWidgetInstance.destroy(); window._visitorWidgetInstance = null; } } catch (e) { console.error('error destroying previous widget', e); }

                    if (!globalThis.VisitorWidget) {
                    const s = document.createElement('script');
                    // Cache-bust the widget script so browser picks up latest changes
                    s.src = 'js/visitorWidget.js?v=' + Date.now();
                    s.onload = function () {
                        try { window._visitorWidgetInstance = globalThis.VisitorWidget.init(root, { base: 10567 }); } catch (e) { console.error(e); }
                        // after init, handle per-user increment via cache
                        tryLocalIncrement(window._visitorWidgetInstance);
                    };
                    document.body.appendChild(s);
                } else {
                    try { window._visitorWidgetInstance = globalThis.VisitorWidget.init(root, { base: 10567 }); } catch (e) { console.error(e); }
                    tryLocalIncrement(window._visitorWidgetInstance);
                }

                // Test increment removed — widget will show active session by default
            }

            // Wait a tick to ensure template content is attached
            setTimeout(initVisitorRoot, 40);
            
                    function tryLocalIncrement(widgetInstance) {
                        try {
                            const key = 'visitor_counted_v1';
                            // If already counted in this browser, do nothing
                            if (localStorage.getItem(key)) return;
                            // mark as counted in local cache
                            localStorage.setItem(key, String(Date.now()));

                            // Small helper: parse a simple browser + OS string from the UA
                            function parseUserAgent() {
                                const ua = navigator.userAgent || '';
                                const platform = navigator.platform || '';
                                let browser = 'Unknown';
                                if (/OPR|Opera/.test(ua)) browser = 'Opera';
                                else if (/Edg\b|Edge\b/.test(ua)) browser = 'Edge';
                                else if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) browser = 'Chrome';
                                else if (/CriOS\//.test(ua)) browser = 'Chrome (iOS)';
                                else if (/Firefox\//.test(ua)) browser = 'Firefox';
                                else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari';

                                let os = 'Unknown';
                                if (/Win/.test(platform) || /Windows/.test(ua)) os = 'Windows';
                                else if (/Mac/.test(platform) || /Macintosh/.test(ua)) os = 'macOS';
                                else if (/Linux/.test(platform) || /X11/.test(ua)) os = 'Linux';
                                else if (/Android/.test(ua)) os = 'Android';
                                else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

                                return { browser, os };
                            }

                            const client = parseUserAgent();

                            // Prefer server increment endpoint if available
                            // Attempt a POST to /api/visitors/increment; if it fails, fall back to local UI update
                            fetch('/api/visitors/increment', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ amount: 1, client: client }) })
                                .then(r => {
                                    if (!r.ok) throw new Error('no increment endpoint');
                                    // server will update total; widget will poll if configured, otherwise we can refresh
                                    return r.json().catch(()=>null);
                                })
                                .catch(() => {
                                    // fallback: increment local widget UI immediately
                                    try {
                                        if (widgetInstance && typeof widgetInstance.add === 'function') {
                                            const when = new Date().toLocaleTimeString();
                                            const entry = { icon: '👤', browser: client.browser, platform: client.os, when };
                                            widgetInstance.add(1, entry);
                                        }
                                    } catch (e) { console.error('widget add fallback failed', e); }
                                });
                        } catch (e) { console.error('local increment failed', e); }
                    }
        } catch (e) { console.error('Failed to initialize Spy app widget', e); }
    }
}

// Initialize About window tabs and interactions
function initializeAbout(windowEl) {
    const container = windowEl.querySelector('.about-content') || windowEl;
    if (!container) return;
    const tabs = container.querySelectorAll('.about-tab');
    const panes = container.querySelectorAll('.about-pane');
    function showTab(name) {
        panes.forEach(p => p.style.display = p.dataset.pane === name ? '' : 'none');
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    }
    tabs.forEach(t => {
        t.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = t.dataset.tab;
            showTab(name);
        });
    });
    // default
    showTab('about');
}

// Initialize a simple calendar view inside the calendar window
function initializeCalendar(windowEl) {
    const container = windowEl.querySelector('.calendar-root');
    const monthLabel = windowEl.querySelector('#calendarMonthLabel');
    const prevBtn = windowEl.querySelector('#calendarPrev');
    const nextBtn = windowEl.querySelector('#calendarNext');
    if (!container) return;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Keep state on the window element so subsequent opens preserve view
    if (!windowEl._calendarState) {
        const now = new Date();
        windowEl._calendarState = { year: now.getFullYear(), month: now.getMonth() };
    }

    function render() {
        const { year, month } = windowEl._calendarState;
        if (monthLabel) monthLabel.textContent = `📅 ${monthNames[month]} ${year}`;

        const first = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = first.getDay();

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-row header';
        weekDays.forEach(d => {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell calendar-header';
            cell.textContent = d;
            headerRow.appendChild(cell);
        });
        grid.appendChild(headerRow);

        let day = 1;
        for (let r = 0; r < 6; r++) {
            const row = document.createElement('div');
            row.className = 'calendar-row';
            for (let c = 0; c < 7; c++) {
                const cell = document.createElement('div');
                cell.className = 'calendar-cell';
                if (r === 0 && c < startDay) {
                    cell.textContent = '';
                } else if (day > daysInMonth) {
                    cell.textContent = '';
                } else {
                    cell.textContent = String(day);
                    const now = new Date();
                    if (day === now.getDate() && month === now.getMonth() && year === now.getFullYear()) cell.classList.add('today');
                    day++;
                }
                row.appendChild(cell);
            }
            grid.appendChild(row);
        }

        container.innerHTML = '';
        container.appendChild(grid);
    }

    function changeMonth(delta) {
        let { year, month } = windowEl._calendarState;
        month += delta;
        if (month < 0) { month = 11; year -= 1; }
        if (month > 11) { month = 0; year += 1; }
        windowEl._calendarState.year = year;
        windowEl._calendarState.month = month;
        render();
    }

    // Wire controls
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); changeMonth(-1); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); changeMonth(1); };

    // Keyboard navigation when this window is focused
    windowEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { changeMonth(-1); }
        else if (e.key === 'ArrowRight') { changeMonth(1); }
    });

    // initial render
    render();
}

// Initialize Preview app
function initializePreview(window, filePath) {
    const iframe = window.querySelector('#previewIframe');
    const title = window.querySelector('.window-title');
    const defaultPath = 'files/Shashi_Kant_Singh.pdf';
    filePath = filePath || defaultPath;

    if (iframe) {
        // Try fetching the PDF and load via blob URL for better reliability
        fetch(filePath)
            .then(resp => {
                if (!resp.ok) throw new Error('Network response was not ok');
                return resp.blob();
            })
            .then(blob => {
                // create a File with a filename so browser PDF viewers show the proper name
                try {
                    const filename = (filePath || defaultPath).split('/').pop() || 'document.pdf';
                    const fileObj = new File([blob], filename, { type: blob.type });
                    const blobUrl = URL.createObjectURL(fileObj);
                    console.debug('initializePreview blobUrl', blobUrl);
                    iframe.src = blobUrl;
                } catch (e) {
                    // fallback to blob URL if File constructor isn't supported
                    const blobUrl = URL.createObjectURL(blob);
                    console.debug('initializePreview blobUrl (fallback)', blobUrl);
                    iframe.src = blobUrl;
                }
            })
            .catch(err => {
                console.error('Failed to load PDF via fetch, falling back to direct src:', err);
                iframe.src = filePath; // fallback
            });
    // ...existing code...

    if (title) {
        title.textContent = filePath.split('/').pop();
    }

    // Update the small path label in the preview toolbar (show filename or 'Resume')
    try {
        const pathLabel = window.querySelector('.preview-path');
        if (pathLabel) {
            const name = (filePath || defaultPath).split('/').pop() || 'Resume';
            // show a nicer label
            pathLabel.textContent = name.replace(/_/g, ' ');
        }
        } catch (err) {
            console.error('createMobileLauncher failed', err);
        }
    }
    const zoomOutBtn = window.querySelector('#previewZoomOut');
    const zoomInBtn = window.querySelector('#previewZoomIn');
    const fitBtn = window.querySelector('#previewFit');
    const zoomLabel = window.querySelector('#previewZoomLabel');
    const previewArea = window.querySelector('.preview-area');

    // Initial scale
    let scale = 1;
    const minScale = 0.5;
    const maxScale = 3.0;
    const step = 0.25;

    function applyScale(s) {
        scale = Math.max(minScale, Math.min(maxScale, s));
        if (iframe) {
            iframe.style.transform = `scale(${scale})`;
            // Adjust width so scaled content fits within container scroll area
            iframe.style.width = `${100 / scale}%`;
        }
        if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    }

    // Wire up buttons
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyScale(scale - step);
    });

    if (zoomInBtn) zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyScale(scale + step);
    });

    if (fitBtn) fitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Reset to 100% and ensure width fills container
        applyScale(1);
        if (iframe) iframe.style.width = '100%';
    });

    // Ensure initial application of scale after load
    if (iframe) {
        iframe.addEventListener('load', () => {
            // small delay to ensure viewer rendered
            setTimeout(() => applyScale(scale), 100);
        });
    }
}

// Terminal Functionality
function initializeTerminal(window) {
    const input = window.querySelector('.terminal-input');
    const output = window.querySelector('.terminal-output');

    const commands = {
        help: () => {
            return `Available commands:
  help     - Show this help message
  about    - Display information about me
  skills   - List my technical skills
  projects - Show my projects
  contact  - Display contact information
  ls       - List directory contents
  pwd      - Print working directory
  whoami   - Display current user
  clear    - Clear terminal screen
  date     - Show current date and time
  echo     - Echo text back
  uname    - Display system information
  cat      - Display file contents
  history  - Show command history`;
        },
        about: () => {
            return `Full Stack Developer with a passion for creating innovative solutions.
I love building interactive web experiences and exploring new technologies.`;
        },
        skills: () => {
            return `Technical Skills:
• Frontend: JavaScript, React, HTML5, CSS3
• Backend: Node.js, Python, Express
• Database: MongoDB, PostgreSQL
• Tools: Git, Docker, VS Code
• Always learning and improving!`;
        },
        projects: () => {
            return `My Projects:
    1. Portfolio Website - This interactive macOS-themed site
2. E-commerce Platform - Full-stack shopping application
3. AI Chatbot - NLP-powered conversation bot
4. Mobile Game - React Native game development`;
        },
        contact: () => {
            return `Contact Information:
Email: your.email@example.com
GitHub: github.com/inboxtoshashi
LinkedIn: linkedin.com/in/yourprofile
Twitter: @yourhandle`;
        },
        ls: () => {
            return `Desktop/    Documents/    Downloads/    Pictures/
Music/      Videos/       Projects/     README.md`;
        },
        pwd: () => {
            return '/home/guest';
        },
        whoami: () => {
            return 'guest';
        },
        uname: () => {
            return 'Darwin 23.4.0 x86_64'; // Simulate macOS uname
        },
        cat: (args) => {
            if (!args || args.length === 0) {
                return 'cat: missing file operand\nTry \'cat README.md\' for example';
            }
            if (args[0] === 'README.md') {
                return `# Welcome to My Portfolio

This is an interactive macOS desktop portfolio.
Feel free to explore the applications and terminal!

Created with ❤️ using HTML, CSS, and JavaScript.`;
            }
            return `cat: ${args[0]}: No such file or directory`;
        },
        history: () => {
            return `  1  welcome
  2  help
  3  ls
  4  pwd`;
        },
        clear: () => {
            output.innerHTML = '';
            return '';
        },
        date: () => {
            return new Date().toString();
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            
            // Add command to output
            const commandLine = document.createElement('div');
            commandLine.className = 'terminal-line';
            commandLine.innerHTML = `<span class="terminal-prompt">guest@guest-MacBook-Air ~ %</span> <span class="terminal-text">${command}</span>`;
            output.appendChild(commandLine);

            // Process command
            if (command) {
                const parts = command.split(' ');
                const cmd = parts[0];
                const args = parts.slice(1);

                let result;
                if (cmd === 'echo') {
                    result = args.join(' ');
                } else if (cmd === 'cat') {
                    result = commands[cmd] ? commands[cmd](args) : `Command not found: ${cmd}. Type 'help' for available commands.`;
                } else if (commands[cmd]) {
                    result = commands[cmd]();
                } else {
                    result = `Command not found: ${cmd}. Type 'help' for available commands.`;
                }

                if (result) {
                    const resultLine = document.createElement('div');
                    resultLine.className = 'terminal-line terminal-text';
                    resultLine.style.whiteSpace = 'pre-wrap';
                    resultLine.textContent = result;
                    output.appendChild(resultLine);
                }
            }

            // Removed empty line to eliminate extra space between terminal lines

            // Clear input
            input.value = '';

            // Scroll to bottom
            output.scrollTop = output.scrollHeight;
        }
    });

    // Focus input
    input.focus();

    // Always focus input when window is clicked or focused
    window.addEventListener('mousedown', () => {
        setTimeout(() => input.focus(), 0);
    });
}

// Contact Form Functionality
function initializeContactForm(window) {
    const form = window.querySelector('.contact-form');
    const submitBtn = form.querySelector('.btn-submit');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simulate form submission
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
            alert('Thank you for your message! (This is a demo, no actual email was sent)');
            form.reset();
            submitBtn.textContent = 'Send Message';
            submitBtn.disabled = false;
        }, 1500);
    });
}

// Settings Functionality
function initializeSettings(window) {
    // Render wallpaper grid
    if (window.wallpaperSystem) {
        window.wallpaperSystem.render();
    }
    
    // Handle sidebar navigation
    const sidebarItems = window.querySelectorAll('.settings-item');
    const mainSection = window.querySelector('.settings-main');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Update main content based on selection
            const itemText = item.textContent;
            
            if (itemText.includes('Desktop')) {
                mainSection.innerHTML = `
                    <h2>Desktop Background</h2>
                    <p class="settings-description">Choose a background for your desktop. You can select from built-in gradients or add your own images.</p>
                    <div class="wallpaper-grid"></div>
                `;
                window.wallpaperSystem.render();
            } else if (itemText.includes('Appearance')) {
                mainSection.innerHTML = `
                    <h2>Appearance</h2>
                    <p class="settings-description">Customize the look and feel of your desktop.</p>
                    <div class="setting-option">
                        <label>Theme</label>
                        <select>
                            <option>Light</option>
                            <option selected>Dark</option>
                        </select>
                    </div>
                `;
            } else if (itemText.includes('About')) {
                mainSection.innerHTML = `
                    <h2>About</h2>
                    <p class="settings-description">macOS Desktop Portfolio v1.0</p>
                    <div style="margin-top: 20px; line-height: 1.8; color: #d0d0d0;">
                        <p><strong>Version:</strong> 1.0.0</p>
                        <p><strong>Built with:</strong> HTML, CSS, JavaScript</p>
                        <p><strong>Features:</strong></p>
                        <ul style="margin-left: 20px; margin-top: 10px;">
                            <li>Interactive desktop environment</li>
                            <li>Multiple applications</li>
                            <li>Custom wallpaper support</li>
                            <li>Draggable windows</li>
                            <li>Working terminal</li>
                        </ul>
                    </div>
                `;
            }
        });
    });
}

// VS Code Functionality
function initializeVSCode(window) {
    const fileContents = {
        'index.html': `<span class="code-comment">&lt;!-- Welcome to my portfolio! --&gt;</span>
<span class="code-keyword">&lt;!DOCTYPE</span> <span class="code-string">html</span><span class="code-keyword">&gt;</span>
<span class="code-keyword">&lt;html</span> <span class="code-string">lang</span>=<span class="code-string">"en"</span><span class="code-keyword">&gt;</span>
<span class="code-keyword">&lt;head&gt;</span>
    <span class="code-keyword">&lt;meta</span> <span class="code-string">charset</span>=<span class="code-string">"UTF-8"</span><span class="code-keyword">&gt;</span>
    <span class="code-keyword">&lt;title&gt;</span>macOS Desktop Portfolio<span class="code-keyword">&lt;/title&gt;</span>
<span class="code-keyword">&lt;/head&gt;</span>
<span class="code-keyword">&lt;body&gt;</span>
    <span class="code-comment">&lt;!-- Desktop Environment --&gt;</span>
    <span class="code-keyword">&lt;div</span> <span class="code-string">class</span>=<span class="code-string">"desktop"</span><span class="code-keyword">&gt;&lt;/div&gt;</span>
<span class="code-keyword">&lt;/body&gt;</span>
<span class="code-keyword">&lt;/html&gt;</span>`,

        'styles.css': `<span class="code-comment">/* macOS Desktop Portfolio Styles */</span>

<span class="code-keyword">body</span> {
    <span class="code-string">font-family</span>: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    <span class="code-string">margin</span>: <span class="code-string">0</span>;
    <span class="code-string">padding</span>: <span class="code-string">0</span>;
    <span class="code-string">overflow</span>: <span class="code-string">hidden</span>;
}

<span class="code-keyword">.desktop</span> {
    <span class="code-string">width</span>: <span class="code-string">100vw</span>;
    <span class="code-string">height</span>: <span class="code-string">100vh</span>;
    <span class="code-string">background</span>: <span class="code-function">linear-gradient</span>(<span class="code-string">135deg, #667eea, #764ba2</span>);
}

<span class="code-comment">/* Window Styles */</span>
<span class="code-keyword">.window</span> {
    <span class="code-string">position</span>: <span class="code-string">absolute</span>;
    <span class="code-string">border-radius</span>: <span class="code-string">8px</span>;
    <span class="code-string">box-shadow</span>: <span class="code-string">0 10px 40px rgba(0,0,0,0.4)</span>;
}`,

        'script.js': `<span class="code-comment">// Welcome to my portfolio!</span>
<span class="code-keyword">function</span> <span class="code-function">createAwesomeProject</span>() {
    <span class="code-keyword">const</span> skills = [<span class="code-string">'JavaScript'</span>, <span class="code-string">'Python'</span>, <span class="code-string">'React'</span>];
    <span class="code-keyword">return</span> skills.<span class="code-function">map</span>(skill => {
        <span class="code-keyword">return</span> <span class="code-string">\`Learning \${skill}\`</span>;
    });
}

<span class="code-comment">// Always learning, always building</span>
console.<span class="code-function">log</span>(<span class="code-string">'Hello, World!'</span>);`,

        'README.md': `<span class="code-comment"># macOS Desktop Portfolio</span>

    An interactive portfolio website with macOS desktop theme.

    <span class="code-keyword">## Features</span>
    - Multiple draggable windows
    - Working terminal with commands
    - Custom wallpaper support
    - Mac-style window controls

    <span class="code-keyword">## Tech Stack</span>
    - HTML5, CSS3, JavaScript
    - No frameworks, pure vanilla JS

    <span class="code-string">Built with ❤️</span>`
    };

    const files = window.querySelectorAll('.vscode-file');
    const codeArea = window.querySelector('.vscode-code pre code');
    const tabContainer = window.querySelector('.vscode-tabs');
    
    files.forEach(file => {
        file.addEventListener('click', () => {
            // Remove active class from all files
            files.forEach(f => f.classList.remove('active'));
            file.classList.add('active');
            
            // Get filename
            const filename = file.textContent.trim().replace('📄 ', '');
            
            // Update tab
            tabContainer.innerHTML = `<div class="vscode-tab active">${filename}</div>`;
            
            // Update code content
            if (fileContents[filename]) {
                codeArea.innerHTML = fileContents[filename];
            }
        });
    });
    
    // Add active class to first file by default
    if (files[0]) {
        files[0].classList.add('active');
    }
}

// Files Functionality moved to finder.js (initializeFiles)

// WiFi Dropdown Functionality
function initializeWiFiDropdown() {
    const wifiIcon = document.getElementById('wifiIcon');
    const wifiDropdown = document.getElementById('wifiDropdown');
    
    if (!wifiIcon || !wifiDropdown) return;
    
    wifiIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        wifiDropdown.classList.toggle('show');
        // Close control center if open
        const controlCenter = document.getElementById('controlCenter');
        if (controlCenter) controlCenter.classList.remove('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!wifiDropdown.contains(e.target) && !wifiIcon.contains(e.target)) {
            wifiDropdown.classList.remove('show');
        }
    }, true);
}

// Control Center Functionality
function initializeControlCenter() {
    const controlIcon = document.getElementById('controlCenterIcon');
    const controlCenter = document.getElementById('controlCenter');
    
    if (!controlIcon || !controlCenter) return;
    
    controlIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        controlCenter.classList.toggle('show');
        // Close wifi dropdown if open
        const wifiDropdown = document.getElementById('wifiDropdown');
        if (wifiDropdown) wifiDropdown.classList.remove('show');
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!controlCenter.contains(e.target) && !controlIcon.contains(e.target)) {
            controlCenter.classList.remove('show');
        }
    }, true);
    
    // Brightness control
    const brightnessSlider = document.getElementById('brightnessSlider');
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', (e) => {
            const brightness = e.target.value / 100;
            const desktop = document.querySelector('.desktop');
            if (desktop) {
                desktop.style.filter = `brightness(${brightness})`;
            }
        });
    }
    
    // Volume control (visual feedback)
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            // visual-only volume control; logging removed
            // Note: Browser cannot control system volume for security reasons
            // This provides visual feedback only
        });
    }
    
    // Control items toggle
    const controlItems = controlCenter.querySelectorAll('.control-item');
    controlItems.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
            const subtitle = item.querySelector('.control-item-subtitle');
            if (subtitle) {
                const isActive = item.classList.contains('active');
                const control = item.dataset.control;
                
                if (control === 'wifi') {
                    subtitle.textContent = isActive ? 'King in the north' : 'Off';
                } else if (control === 'bluetooth') {
                    subtitle.textContent = isActive ? 'On' : 'Off';
                } else if (control === 'airdrop') {
                    subtitle.textContent = isActive ? 'Contacts Only' : 'Off';
                } else if (control === 'focus') {
                    subtitle.textContent = isActive ? 'On' : 'Off';
                }
            }
        });
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + T for terminal
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        openApp('terminal');
    }
    // Alt + F for files
    if (e.altKey && e.key === 'f') {
        e.preventDefault();
        openApp('files');
    }
    // Alt + A for about
    if (e.altKey && e.key === 'a') {
        e.preventDefault();
        openApp('about');
    }
});
