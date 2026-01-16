

window.addEventListener('error', (ev) => {
    try { console.error('Runtime error', ev.message, ev.filename + ':' + ev.lineno + ':' + ev.colno, ev.error); } catch (e) {}
});
window.addEventListener('unhandledrejection', (ev) => {
    try { console.error('Unhandled rejection', ev.reason); } catch (e) {}
});

let windows = [];
let zIndexCounter = 1000; 
let activeWindow = null;

window.__openWindowCascadeIndex = window.__openWindowCascadeIndex || 0;

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
    ,trash: { title: 'Trash', width: 650, height: 500 }
};

document.addEventListener('DOMContentLoaded', () => {
        
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

        function openDesktopPdf(filePath) {
            openApp('preview');
            
            const start = Date.now();
            const timeout = 2000; 
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
    
    initializeDock();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    initializeWiFiDropdown();
    initializeFullscreen();
    
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
                
                const desktopEl = document.querySelector('.desktop');
                desktopEl?.appendChild(folder);
                
                requestAnimationFrame(() => {
                    try { positionDesktopShortcuts(); } catch (e) {}
                });
                
                setTimeout(() => {
                    label.focus();
                    
                    const range = document.createRange();
                    range.selectNodeContents(label);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }, 60);

                function commitLabel() {
                    
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
                        
                        label.textContent = 'New Folder';
                        label.blur();
                    }
                });

            } else if (action === 'get-info') {
                
                openApp('about');
                setTimeout(() => {
                    const winEntry = (window.windows || windows || []).find(w => w.appName === 'about');
                    let aboutEl = winEntry ? winEntry.element : document.querySelector('.window[data-app="about"]');
                    if (!aboutEl) return;
                    const wrapper = aboutEl.querySelector('.window-content-wrapper');
                    if (!wrapper) return;
                    
                    const aboutContent = wrapper.querySelector('.about-content') || wrapper;

                }, 300);
            }
        });

        return menu;
    }

    function hideDesktopContextMenu() {
        const menu = document.querySelector('.desktop-context-menu');
        if (menu) menu.style.display = 'none';
    }

    document.addEventListener('contextmenu', (e) => {
        try {
            const desktopEl = document.querySelector('.desktop');
            if (!desktopEl) return;
            
            if (e.target && e.target.closest && e.target.closest('.desktop') && !e.target.closest('.window')) {
                e.preventDefault();
                const menu = createDesktopContextMenu();
                
                const mw = menu.offsetWidth || 220;
                const mh = menu.offsetHeight || 180;
                const left = Math.min(e.clientX, window.innerWidth - mw - 8);
                const top = Math.min(e.clientY, window.innerHeight - mh - 8);
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
                menu.style.display = 'block';

                const onDocClick = () => { hideDesktopContextMenu(); document.removeEventListener('click', onDocClick); };
                document.addEventListener('click', onDocClick);
                const onEsc = (ev) => { if (ev.key === 'Escape') { hideDesktopContextMenu(); document.removeEventListener('keydown', onEsc); } };
                document.addEventListener('keydown', onEsc);
            }
        } catch (err) {
            
        }
    });
});

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

        const candidates = [];
        const lower = name.toLowerCase();

        if (alias[lower]) candidates.push(...alias[lower]);

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
            
            extCandidates.forEach(ext => candidates.push(v + ext));
            candidates.push(v);
        });

        const ordered = Array.from(new Set(candidates));

        (function tryNext(i) {
            if (i >= ordered.length) return; 
            const src = 'images/icons/' + ordered[i];
            const tester = new Image();
            tester.onload = function() {
                
                img.src = src;
                
                if (!img.alt || img.alt.toLowerCase() === 'image') img.alt = name;
            };
            tester.onerror = function() {
                tryNext(i + 1);
            };
            
            tester.src = src;
        })(0);
    });
}

window.addEventListener('resize', () => {
    try { positionDesktopShortcuts(); } catch (e) {}
});

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
    
    try { positionDesktopShortcuts(); } catch (e) {}
}

function positionDesktopShortcuts() {
    try {
        
        if (document.body.classList && document.body.classList.contains('locked')) return;

        const menuBar = document.querySelector('.menu-bar');
        const shortcuts = document.querySelectorAll('.desktop-shortcut');
        if (!menuBar || !shortcuts) return;
        const rect = menuBar.getBoundingClientRect();
        const baseTop = Math.ceil(rect.bottom + 12); 
        const gap = 12;
        const baseRight = 18;
        const desktopHeight = window.innerHeight;
        
        let shortcutHeight = 96;
        if (shortcuts.length > 0) {
            shortcutHeight = Math.ceil(shortcuts[0].getBoundingClientRect().height) || shortcuts[0].offsetHeight || 96;
        }
        
        const availableHeight = desktopHeight - baseTop - 24; 
        const maxPerCol = Math.max(1, Math.floor(availableHeight / (shortcutHeight + gap)));

        const list = Array.from(shortcuts);
        list.forEach((s, idx) => {
            const col = Math.floor(idx / maxPerCol);
            const row = idx % maxPerCol;
            s.style.position = 'absolute';
            s.style.top = (baseTop + row * (shortcutHeight + gap)) + 'px';
            s.style.right = (baseRight + col * (shortcutHeight + 32)) + 'px'; 
            s.style.left = '';
            const hasWindows = Array.isArray(window.windows) ? window.windows.length > 0 : (typeof windows !== 'undefined' ? windows.length > 0 : false);
            s.style.zIndex = hasWindows ? '50' : '150';
        });
    } catch (e) {
        
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    const lockBtn = document.getElementById('lockScreenBtn');
    const lockOverlay = document.getElementById('lockScreen');
    
    let lockShowFallback = null;
    let lockHideFallback = null;

    function updateLockTime() {
        if (!lockOverlay) return;
        const now = new Date();
        const timeEl = lockOverlay.querySelector('.lock-time');
        const dateEl = lockOverlay.querySelector('.lock-date');
        if (timeEl) {
            
            let t = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            t = t.replace(/\s?(AM|PM)$/i, '');
            timeEl.textContent = t;
        }
        if (dateEl) {
            
            dateEl.textContent = now.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        }
    }

    function showLockScreen() {
        if (!lockOverlay) return;

        document.body.classList.remove('unlocking');
        
        document.body.classList.add('reduce-effects');
        
            document.body.classList.add('locking');
            
            document.body.classList.remove('locked');
        lockOverlay.setAttribute('aria-hidden', 'false');
        lockOverlay.classList.add('show');

        if (lockHideFallback) { clearTimeout(lockHideFallback); lockHideFallback = null; }
        let showFallback = null;
        const onTransitionEnd = (ev) => {
            if (ev.target !== lockOverlay || ev.propertyName !== 'opacity') return;
            lockOverlay.removeEventListener('transitionend', onTransitionEnd);
            if (showFallback) { clearTimeout(showFallback); showFallback = null; }
            document.body.classList.add('locked');
            
            document.body.classList.remove('locking');
            try { lockOverlay.querySelector('.lock-center')?.focus(); } catch (e) {}
        };
        lockOverlay.addEventListener('transitionend', onTransitionEnd);
        
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

        if (lockShowFallback) { clearTimeout(lockShowFallback); lockShowFallback = null; }
        
        document.body.classList.remove('locked');
        document.body.classList.remove('locking');
        document.body.classList.add('unlocking');
        
        try { lockOverlay.getBoundingClientRect(); } catch (e) {}
        requestAnimationFrame(() => {
            lockOverlay.classList.remove('show');
        });

        let hideFallback = null;
        const onEnd = (ev) => {
            if (ev.target !== lockOverlay || ev.propertyName !== 'opacity') return;
            lockOverlay.removeEventListener('transitionend', onEnd);
            if (hideFallback) { clearTimeout(hideFallback); hideFallback = null; }
            lockOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('locked');
            document.body.classList.remove('reduce-effects');
            
            document.body.classList.remove('locking');
            document.body.classList.remove('unlocking');
            try { positionDesktopShortcuts(); } catch (e) {}
        };
        lockOverlay.addEventListener('transitionend', onEnd);
        
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

    if (lockBtn) lockBtn.addEventListener('click', (e) => { e.stopPropagation(); showLockScreen(); });

    if (lockOverlay) {
        lockOverlay.addEventListener('click', (e) => {
            
            hideLockScreen();
        });
        
        lockOverlay.classList.remove('visible');
        lockOverlay.setAttribute('aria-hidden', 'true');
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideLockScreen(); });

    setInterval(() => {
        if (lockOverlay && lockOverlay.classList && lockOverlay.classList.contains('show')) updateLockTime();
    }, 1000);

    window.showLockScreen = showLockScreen;
});

function initializeCollapsibleSearch() {
    const container = document.getElementById('finderSearchContainer');
    const toggle = document.getElementById('finderSearchToggle');
    const input = document.getElementById('finderSearch');
    if (!container || !toggle || !input) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.add('search-expanded');
        setTimeout(() => input.focus(), 80);
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('search-expanded');
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            container.classList.remove('search-expanded');
            input.blur();
        }
    });
}

function initializeDock() {
    const dockApps = document.querySelectorAll('.dock-app');
    dockApps.forEach(app => {
        app.addEventListener('click', () => {
            const appName = app.dataset.app;

            const windowData = windows.find(w => w.appName === appName);
            if (windowData && windowData.element && windowData.element.classList.contains('minimized')) {
                
                restoreFromDock(appName);
            } else {
                
                openApp(appName);
            }
        });

    });

    const dockTrash = document.querySelector('.dock-trash');
    if (dockTrash) {
        dockTrash.addEventListener('click', () => {
            const appName = 'trash';

            const windowData = windows.find(w => w.appName === appName);
            if (windowData && windowData.element && windowData.element.classList.contains('minimized')) {
                
                restoreFromDock(appName);
            } else {
                
                openApp('trash');
            }
        });
    }
}

function addToDock(window) {
    const appName = window.dataset.app;
    const dynamicContainer = document.getElementById('dockDynamicApps');

    const staticDockIcon = document.querySelector(`.dock-app[data-app="${appName}"]:not(.dock-app-minimized), .dock-trash[data-app="${appName}"]`);
    if (staticDockIcon) {
        
        staticDockIcon.classList.add('minimized-indicator');
        return;
    }

    if (dynamicContainer.querySelector(`[data-app="${appName}"]`)) {
        return;
    }

    const appConfig = appConfigs[appName];
    const appTitle = appConfig ? appConfig.title : appName;

    const iconMap = {
        'calendar': 'images/doc-app/calender.png',
        'terminal': 'images/doc-app/terminal.png',
        'preview': 'images/doc-app/preview.png',
        'safari': 'images/doc-app/safari.png',
        'files': 'images/doc-app/finder.png',
        'spy': 'images/icons/spy.png',
        'about': 'images/icons/user.png',
        'contact': 'images/icons/email.png',
        'settings': 'images/icons/settings.png',
        'trash': 'images/doc-app/bin.png'
    };
    
    const iconPath = iconMap[appName] || 'images/icons/app.png';

    const dockIcon = document.createElement('div');
    dockIcon.className = 'dock-app dock-app-minimized';
    dockIcon.dataset.app = appName;
    dockIcon.title = `${appTitle} (minimized)`;
    dockIcon.innerHTML = `<div class="app-icon"><img src="${iconPath}" alt="${appName}" style="width: 48px; height: 48px; object-fit: contain;" /></div>`;

    dockIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        restoreFromDock(appName);
    });
    
    dynamicContainer.appendChild(dockIcon);
}

function restoreFromDock(appName) {
    const windowData = windows.find(w => w.appName === appName);
    if (windowData && windowData.element) {
        windowData.element.classList.remove('minimized');
        focusWindow(windowData.element);

        const staticDockIcon = document.querySelector(`.dock-app[data-app="${appName}"]:not(.dock-app-minimized), .dock-trash[data-app="${appName}"]`);
        if (staticDockIcon) {
            staticDockIcon.classList.remove('minimized-indicator');
        }
        
        removeFromDock(appName);
    }
}

function removeFromDock(appName) {
    const dynamicContainer = document.getElementById('dockDynamicApps');
    const dockIcon = dynamicContainer.querySelector(`[data-app="${appName}"]`);
    if (dockIcon) {
        dockIcon.remove();
    }
}

function openApp(appName) {
    
    window.__openingApps = window.__openingApps || {};
    if (window.__openingApps[appName]) {
        
        const existingWindow = windows.find(w => w.appName === appName);
        if (existingWindow) {
            if (existingWindow.element.classList.contains('minimized')) existingWindow.element.classList.remove('minimized');
            focusWindow(existingWindow.element);
            window.dispatchEvent(new Event('appWindowChange'));
        }
        return;
    }
    window.__openingApps[appName] = true;

    const isMobile = globalThis.innerWidth <= 720;
    if (isMobile) {
        
        windows.forEach(w => {
            if (w.appName !== appName && w.element) {
                w.element.style.display = 'none';
            }
        });
    }

    const existingWindow = windows.find(w => w.appName === appName);
    if (existingWindow) {
        
        if (isMobile) {
            windows.forEach(w => {
                w.element.style.display = (w.appName === appName) ? 'flex' : 'none';
            });
        }
        
        if (existingWindow.element.classList.contains('minimized')) {
            existingWindow.element.classList.remove('minimized');
        }
        existingWindow.element.style.display = 'flex';
        focusWindow(existingWindow.element);
        
        window.dispatchEvent(new Event('appWindowChange'));
        delete window.__openingApps[appName];
        return;
    }

    const config = appConfigs[appName];
    if (!config) return;

    const windowElement = createWindow(appName, config);

    windowElement.style.zIndex = zIndexCounter++;
    
    document.getElementById('windowsContainer').appendChild(windowElement);

    try {
        if (appName === 'safari' && globalThis.innerWidth <= 720) {
            
            windowElement.style.left = '0px';
            windowElement.style.top = 'calc(env(safe-area-inset-top, 0px) + 48px)';
            windowElement.style.width = '100%';
            windowElement.style.height = 'calc(100vh - (env(safe-area-inset-top, 0px) + 120px))';
            windowElement.style.position = 'fixed';
            windowElement.classList.add('pinned-mobile');
        }
    } catch (e) { console.error('Failed to pin safari window on mobile', e); }

    loadWindowContent(windowElement, appName);

    windows.push({
        appName: appName,
        element: windowElement,
        isMaximized: false
    });
    
    try { delete window.__openingApps[appName]; } catch(e) {}
    
    window.dispatchEvent(new Event('appWindowChange'));

    const dockApp = document.querySelector(`.dock-app[data-app="${appName}"]`);
    if (dockApp) dockApp.classList.add('active');

    windowElement.addEventListener('remove', () => {
        setTimeout(() => window.dispatchEvent(new Event('appWindowChange')), 100);
    });

    focusWindow(windowElement);
    
    windowElement.style.zIndex = zIndexCounter++;

    try { positionDesktopShortcuts(); } catch (e) {}
}

function createWindow(appName, config) {
    const winEl = document.createElement('div');
    winEl.className = 'window';
    winEl.dataset.app = appName;

    const vw = Math.max(320, globalThis.innerWidth || 1024);
    const vh = Math.max(240, globalThis.innerHeight || 768);
    const w = Math.min(config.width, vw - 24);
    const h = Math.min(config.height, vh - 120);

    const isMobile = vw <= 720;
    let left, top;
    
    if (isMobile) {
        
        left = 0;
        top = 48;
    } else {
        
        const centerX = Math.max(12, Math.floor((vw - w) / 2));
        const centerY = Math.max(12, Math.floor((vh - h) / 2));
        const cascadeIndex = (windows && windows.length) ? windows.length : (window.__openWindowCascadeIndex || 0);
        const cascadeOffset = Math.min(200, cascadeIndex * 45);
        left = Math.max(12, Math.min(centerX + cascadeOffset, vw - w - 12));
        top = Math.max(48, Math.min(centerY + cascadeOffset, vh - h - 48));
    }

    winEl.style.width = w + 'px';
    winEl.style.height = h + 'px';
    winEl.style.left = left + 'px';
    winEl.style.top = top + 'px';

    winEl.tabIndex = 0;

    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar';

    let titleHtml = '';
    if (appName === 'safari') {
        titleHtml = `<div class="window-title"><img src="images/doc-app/safari.png" alt="Safari" class="window-app-icon"> Safari</div>`;
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

    const content = document.createElement('div');
    content.className = 'window-content-wrapper';

    winEl.appendChild(titleBar);
    winEl.appendChild(content);

    addWindowEventListeners(winEl, titleBar);

    try { window.__openWindowCascadeIndex = (window.__openWindowCascadeIndex || 0) + 1; } catch (e) {}

    return winEl;
}

function addWindowEventListeners(window, titleBar) {
    
    window.addEventListener('mousedown', () => focusWindow(window));
    window.addEventListener('touchstart', () => focusWindow(window), { passive: true });

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

    let isResizing = false;
    let resizeDirection = '';
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    const RESIZE_BORDER = 8; 

    function isNearEdge(e) {
        const rect = window.getBoundingClientRect();
        const atTop = e.clientY - rect.top < RESIZE_BORDER;
        const atBottom = rect.bottom - e.clientY < RESIZE_BORDER;
        const atLeft = e.clientX - rect.left < RESIZE_BORDER;
        const atRight = rect.right - e.clientX < RESIZE_BORDER;
        return { atTop, atBottom, atLeft, atRight, any: atTop || atBottom || atLeft || atRight };
    }

    window.addEventListener('mousemove', (e) => {
        if (isResizing) return;
        
        const rect = window.getBoundingClientRect();
        const edge = isNearEdge(e);

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

    window.addEventListener('mousedown', (e) => {
        
        if (e.target.closest('.window-btn') || e.target.closest('.window-title')) return;
        
        const edge = isNearEdge(e);

        if (!edge.any) return;

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

    const minimizeBtn = titleBar.querySelector('.minimize');
    const maximizeBtn = titleBar.querySelector('.maximize');
    const closeBtn = titleBar.querySelector('.close');

    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.classList.add('minimized');
        addToDock(window);
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

function focusWindow(window) {
    
    document.querySelectorAll('.window').forEach(w => {
        w.classList.remove('active');
    });

    window.classList.add('active');

    window.style.zIndex = zIndexCounter++;
    activeWindow = window;
}

function closeWindow(window) {
    const appName = window.dataset.app;

    try {
        if (window._visitorWidgetInstance && typeof window._visitorWidgetInstance.destroy === 'function') {
            window._visitorWidgetInstance.destroy();
            window._visitorWidgetInstance = null;
        }
    } catch (e) { console.error('Error destroying visitor widget on close', e); }

    windows = windows.filter(w => w.element !== window);

    const dockApp = document.querySelector(`.dock-app[data-app="${appName}"]`);
    if (dockApp) dockApp.classList.remove('active');

    removeFromDock(appName);

    window.remove();
    try { positionDesktopShortcuts(); } catch (e) {}
}

function loadWindowContent(window, appName) {
    const template = document.getElementById(`${appName}-template`);
    if (!template) return;

    const content = window.querySelector('.window-content-wrapper');
    const clone = template.content.cloneNode(true);
    content.appendChild(clone);

    if (appName === 'terminal') {
        initializeTerminal(window);
    } else if (appName === 'contact') {
        initializeContactForm(window);
    } else if (appName === 'settings') {
        initializeSettings(window);
    } else if (appName === 'files') {
        
        if (window.initializeFiles && typeof window.initializeFiles === 'function') {
            window.initializeFiles(window);
        } else if (typeof initializeFiles === 'function') {
            
            initializeFiles(window);
        }
    } else if (appName === 'preview') {
        initializePreview(window);
    } else if (appName === 'trash') {
        initializeTrash(window);
    } else if (appName === 'about') {
        
        try { initializeAbout(window); } catch (e) {}
    } else if (appName === 'calendar') {
        initializeCalendar(window);
    } else if (appName === 'spy') {
        
        try {
            const headerLink = document.querySelector('link[href*="visitor-widget.css"]');
            if (!headerLink) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                
                link.href = 'css/visitor-widget.css?v=' + Date.now();
                document.head.appendChild(link);
            }

            function initVisitorRoot() {
                const root = window.querySelector('#visitor-root') || window.querySelector('.visitor-root');
                if (!root) return;
                
                try { if (window._visitorWidgetInstance && typeof window._visitorWidgetInstance.destroy === 'function') { window._visitorWidgetInstance.destroy(); window._visitorWidgetInstance = null; } } catch (e) { console.error('error destroying previous widget', e); }

                    if (!globalThis.VisitorWidget) {
                    const s = document.createElement('script');
                    
                    s.src = 'js/visitorWidget.js?v=' + Date.now();
                    s.onload = function () {
                        try { window._visitorWidgetInstance = globalThis.VisitorWidget.init(root, { base: 10567 }); } catch (e) { console.error(e); }
                        
                        tryLocalIncrement(window._visitorWidgetInstance);
                    };
                    document.body.appendChild(s);
                } else {
                    try { window._visitorWidgetInstance = globalThis.VisitorWidget.init(root, { base: 10567 }); } catch (e) { console.error(e); }
                    tryLocalIncrement(window._visitorWidgetInstance);
                }

            }

            setTimeout(initVisitorRoot, 40);
            
                    function tryLocalIncrement(widgetInstance) {
                        try {
                            const key = 'visitor_counted_v1';
                            
                            if (localStorage.getItem(key)) return;
                            
                            localStorage.setItem(key, String(Date.now()));

                            function parseUserAgent() {
                                const ua = navigator.userAgent || '';
                                const platform = navigator.platform || '';
                                let browser = 'Unknown';
                                if (/OPR|Opera/.test(ua)) browser = 'Opera';
                                else if (/Edg\b|Edge\b/.test(ua)) browser = 'Edge';
                                else if (/Chrome/.test(ua)) browser = 'Chrome';
                                else if (/CriOS/.test(ua)) browser = 'Chrome';
                                else if (/Firefox/.test(ua)) browser = 'Firefox';
                                else if (/Safari/.test(ua)) browser = 'Safari';

                                let os = 'Unknown';
                                if (/Win/.test(platform) || /Windows/.test(ua)) os = 'Windows';
                                else if (/Mac/.test(platform) || /Macintosh/.test(ua)) os = 'macOS';
                                else if (/Linux/.test(platform) || /X11/.test(ua)) os = 'Linux';
                                else if (/Android/.test(ua)) os = 'Android';
                                else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

                                return { browser, os };
                            }

                            const client = parseUserAgent();

                            fetch('/api/visitors/increment', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ amount: 1, client: client }) })
                                .then(r => {
                                    if (!r.ok) throw new Error('no increment endpoint');
                                    
                                    return r.json().catch(()=>null);
                                })
                                .catch(() => {
                                    
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
    
    showTab('about');
}

function initializeCalendar(windowEl) {
    const container = windowEl.querySelector('.calendar-root');
    const monthLabel = windowEl.querySelector('#calendarMonthLabel');
    const prevBtn = windowEl.querySelector('#calendarPrev');
    const nextBtn = windowEl.querySelector('#calendarNext');
    if (!container) return;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); changeMonth(-1); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); changeMonth(1); };

    windowEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { changeMonth(-1); }
        else if (e.key === 'ArrowRight') { changeMonth(1); }
    });

    render();
}

function initializePreview(window, filePath) {
    const iframe = window.querySelector('#previewIframe');
    const title = window.querySelector('.window-title');
    const defaultPath = 'files/Shashi_Kant_Singh.pdf';
    filePath = filePath || defaultPath;

    if (iframe) {
        
        fetch(filePath)
            .then(resp => {
                if (!resp.ok) throw new Error('Network response was not ok');
                return resp.blob();
            })
            .then(blob => {
                
                try {
                    const filename = (filePath || defaultPath).split('/').pop() || 'document.pdf';
                    const fileObj = new File([blob], filename, { type: blob.type });
                    const blobUrl = URL.createObjectURL(fileObj);
                    console.debug('initializePreview blobUrl', blobUrl);
                    iframe.src = blobUrl;
                } catch (e) {
                    
                    const blobUrl = URL.createObjectURL(blob);
                    console.debug('initializePreview blobUrl (fallback)', blobUrl);
                    iframe.src = blobUrl;
                }
            })
            .catch(err => {
                console.error('Failed to load PDF via fetch, falling back to direct src:', err);
                iframe.src = filePath; 
            });

    if (title) {
        title.textContent = filePath.split('/').pop();
    }

    try {
        const pathLabel = window.querySelector('.preview-path');
        if (pathLabel) {
            const name = (filePath || defaultPath).split('/').pop() || 'Resume';
            
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

    let scale = 1;
    const minScale = 0.5;
    const maxScale = 3.0;
    const step = 0.25;

    function applyScale(s) {
        scale = Math.max(minScale, Math.min(maxScale, s));
        
        if (iframe) {
            
            iframe.style.transform = `scale(${scale})`;
            iframe.style.transformOrigin = '0 0';

            if (previewArea) {
                const scaledWidth = 100 / scale;
                const scaledHeight = 100 / scale;
                iframe.style.width = `${scaledWidth}%`;
                iframe.style.height = `${scaledHeight}%`;
            }
        }
        
        if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    }

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
        applyScale(1);
    });

    if (iframe) {
        iframe.addEventListener('load', () => {
            
            setTimeout(() => applyScale(scale), 100);
        });
    }

    const resizeObserver = new ResizeObserver(() => {
        applyScale(scale);
    });
    if (window) {
        resizeObserver.observe(window);
    }
}

function initializeTrash(window) {
    const trashGrid = window.querySelector('#trashGrid');
    if (!trashGrid) return;

    const trashFile = {
        name: 'data.txt',
        type: 'text',
        icon: 'images/icons/txt.png',
        size: '0 KB',
        date: new Date().toLocaleDateString()
    };
    
    function renderTrash() {
        trashGrid.innerHTML = '';

        const fileItem = document.createElement('div');
        fileItem.className = 'doc-item';
        fileItem.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100px;
            cursor: pointer;
            padding: 10px;
            border-radius: 8px;
            transition: background 0.2s;
        `;
        
        fileItem.innerHTML = `
            <div style="margin-bottom: 8px;">
                <img src="${trashFile.icon}" alt="${trashFile.name}" style="width: 64px; height: 64px; object-fit: contain;" />
            </div>
            <div style="font-size: 12px; text-align: center; word-break: break-word; color: #e0e0e0;">${trashFile.name}</div>
        `;
        
        fileItem.addEventListener('mouseenter', () => {
            fileItem.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        
        fileItem.addEventListener('mouseleave', () => {
            fileItem.style.background = 'transparent';
        });
        
        trashGrid.appendChild(fileItem);
    }
    
    renderTrash();
}

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
            return 'Darwin 23.4.0 x86_64'; 
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

            const commandLine = document.createElement('div');
            commandLine.className = 'terminal-line';
            commandLine.innerHTML = `<span class="terminal-prompt">guest@guest-MacBook-Air ~ %</span> <span class="terminal-text">${command}</span>`;
            output.appendChild(commandLine);

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

            input.value = '';

            output.scrollTop = output.scrollHeight;
        }
    });

    input.focus();

    window.addEventListener('mousedown', () => {
        setTimeout(() => input.focus(), 0);
    });
}

function initializeContactForm(window) {
    const form = window.querySelector('.contact-form');
    const submitBtn = form.querySelector('.btn-submit');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

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

function initializeSettings(window) {
    
    if (window.wallpaperSystem) {
        window.wallpaperSystem.render();
    }

    const sidebarItems = window.querySelectorAll('.settings-item');
    const mainSection = window.querySelector('.settings-main');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

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

        'styles.css': `<span class="code-comment"></span>

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

<span class="code-comment"></span>
<span class="code-keyword">.window</span> {
    <span class="code-string">position</span>: <span class="code-string">absolute</span>;
    <span class="code-string">border-radius</span>: <span class="code-string">8px</span>;
    <span class="code-string">box-shadow</span>: <span class="code-string">0 10px 40px rgba(0,0,0,0.4)</span>;
}`,

        'script.js': `<span class="code-comment">
<span class="code-keyword">function</span> <span class="code-function">createAwesomeProject</span>() {
    <span class="code-keyword">const</span> skills = [<span class="code-string">'JavaScript'</span>, <span class="code-string">'Python'</span>, <span class="code-string">'React'</span>];
    <span class="code-keyword">return</span> skills.<span class="code-function">map</span>(skill => {
        <span class="code-keyword">return</span> <span class="code-string">\`Learning \${skill}\`</span>;
    });
}

<span class="code-comment">
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
            
            files.forEach(f => f.classList.remove('active'));
            file.classList.add('active');

            const filename = file.textContent.trim().replace('📄 ', '');

            tabContainer.innerHTML = `<div class="vscode-tab active">${filename}</div>`;

            if (fileContents[filename]) {
                codeArea.innerHTML = fileContents[filename];
            }
        });
    });

    if (files[0]) {
        files[0].classList.add('active');
    }
}

function initializeWiFiDropdown() {
    const wifiIcon = document.getElementById('wifiIcon');
    const wifiDropdown = document.getElementById('wifiDropdown');
    
    if (!wifiIcon || !wifiDropdown) return;
    
    wifiIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        wifiDropdown.classList.toggle('show');
        
        const controlCenter = document.getElementById('controlCenter');
        if (controlCenter) controlCenter.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if (!wifiDropdown.contains(e.target) && !wifiIcon.contains(e.target)) {
            wifiDropdown.classList.remove('show');
        }
    }, true);
}

function initializeFullscreen() {
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    
    if (!fullscreenIcon) return;
    
    fullscreenIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreen();
    });

    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
    document.addEventListener('MSFullscreenChange', updateFullscreenIcon);
}

function toggleFullscreen() {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function updateFullscreenIcon() {
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    if (!fullscreenIcon) return;
    
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || 
                         document.mozFullScreenElement || document.msFullscreenElement;
    
    const svg = fullscreenIcon.querySelector('svg');
    if (svg) {
        if (isFullscreen) {
            
            svg.innerHTML = '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>';
        } else {
            
            svg.innerHTML = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
        }
    }
}

function initializeControlCenter() {
    const controlIcon = document.getElementById('controlCenterIcon');
    const controlCenter = document.getElementById('controlCenter');
    
    if (!controlIcon || !controlCenter) return;
    
    controlIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        controlCenter.classList.toggle('show');
        
        const wifiDropdown = document.getElementById('wifiDropdown');
        if (wifiDropdown) wifiDropdown.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if (!controlCenter.contains(e.target) && !controlIcon.contains(e.target)) {
            controlCenter.classList.remove('show');
        }
    }, true);

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

    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;

        });
    }

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

document.addEventListener('keydown', (e) => {
    
    if (e.altKey && e.key === 't') {
        e.preventDefault();
        openApp('terminal');
    }
    
    if (e.altKey && e.key === 'f') {
        e.preventDefault();
        openApp('files');
    }
    
    if (e.altKey && e.key === 'a') {
        e.preventDefault();
        openApp('about');
    }
});

window.showSystemInfo = function() {
    
    const existing = document.getElementById('systemInfoModal');
    if (existing) existing.remove();

    const browserInfo = getBrowserInfo();
    const screenInfo = `${window.screen.width} × ${window.screen.height}`;
    const viewportInfo = `${window.innerWidth} × ${window.innerHeight}`;

    const modal = document.createElement('div');
    modal.id = 'systemInfoModal';
    modal.className = 'system-info-modal';
    modal.innerHTML = `
        <div class="system-info-content">
            <div class="system-info-header">
                <div class="system-info-icon">💻</div>
                <h2>About This Mac</h2>
            </div>
            <div class="system-info-body">
                <div class="system-info-section">
                    <div class="info-label">Portfolio Version</div>
                    <div class="info-value">macOS Desktop v1.0</div>
                </div>
                <div class="system-info-section">
                    <div class="info-label">Browser</div>
                    <div class="info-value">${browserInfo}</div>
                </div>
                <div class="system-info-section">
                    <div class="info-label">Screen Resolution</div>
                    <div class="info-value">${screenInfo}</div>
                </div>
                <div class="system-info-section">
                    <div class="info-label">Viewport Size</div>
                    <div class="info-value">${viewportInfo}</div>
                </div>
                <div class="system-info-section">
                    <div class="info-label">Platform</div>
                    <div class="info-value">${navigator.platform}</div>
                </div>
                <div class="system-info-section">
                    <div class="info-label">Language</div>
                    <div class="info-value">${navigator.language}</div>
                </div>
            </div>
            <div class="system-info-footer">
                <button class="system-info-close">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.system-info-close');
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });

    setTimeout(() => modal.classList.add('show'), 10);
};

function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Mozilla Firefox';
    if (ua.indexOf('Edg') > -1) return 'Microsoft Edge';
    if (ua.indexOf('Chrome') > -1) return 'Google Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    return 'Unknown Browser';
}
