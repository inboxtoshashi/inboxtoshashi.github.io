// Apple menu (mac-icon) JS extracted from script.js
// This file should be included after script.js in index.html

(function() {
    // Helper: temporarily clear the `title` attribute on an element while running a function,
    // then restore it after a short delay. This prevents native browser tooltips from appearing
    // or lingering when UI actions (like lock) are triggered.
    function withTemporaryTitleClear(el, fn, restoreMs = 480) {
        if (!el) return fn && fn();
        try {
            const had = el.hasAttribute('title');
            const orig = had ? el.getAttribute('title') : null;
            if (had) el.removeAttribute('title');
            // run the action
            if (typeof fn === 'function') fn();
            // restore after a short timeout to avoid showing native tooltip
            setTimeout(() => {
                try {
                    if (had && orig !== null) el.setAttribute('title', orig);
                } catch (e) {}
            }, restoreMs);
        } catch (e) {
            try { if (typeof fn === 'function') fn(); } catch (e) {}
        }
    }

    // Utility: clear stored/original title and optionally restore it
    function clearStoredTitle(el) {
        if (!el) return;
        try {
            if (el.hasAttribute('title')) {
                el.dataset._origTitle = el.getAttribute('title') || '';
                el.removeAttribute('title');
            }
        } catch (e) {}
    }
    function restoreStoredTitle(el) {
        if (!el) return;
        try {
            if (document.body && document.body.classList && document.body.classList.contains('locked')) {
                window._pendingTitleRestores = window._pendingTitleRestores || [];
                if (!window._pendingTitleRestores.includes(el)) window._pendingTitleRestores.push(el);
                return;
            }
            const isInAppleMenu = el && el.closest && el.closest('.apple-menu');
            const orig = el && el.dataset ? el.dataset._origTitle : '';
            if (isInAppleMenu || (typeof orig === 'string' && /lock screen/i.test(orig))) {
                if (el && el.dataset) delete el.dataset._origTitle;
            } else if (el.dataset && el.dataset._origTitle != null && el.dataset._origTitle !== '') {
                el.setAttribute('title', el.dataset._origTitle);
                delete el.dataset._origTitle;
            }
        } catch (e) {}
    }

    function closeAppleMenu() {
        const appleMenu = document.getElementById('appleMenu');
        if (!appleMenu) return;
        appleMenu.setAttribute('aria-hidden', 'true');
        // Fade out with opacity, then hide
        appleMenu.style.transition = 'opacity 0.35s cubic-bezier(.4,0,.2,1)';
        appleMenu.style.opacity = '0';
        appleMenu.style.visibility = 'hidden';
        setTimeout(() => {
            appleMenu.style.display = '';
        }, 360);
    }

    function openAppleMenu() {
        const appleMenu = document.getElementById('appleMenu');
        if (!appleMenu) return;
        appleMenu.setAttribute('aria-hidden', 'false');
        appleMenu.style.display = 'block';
        appleMenu.style.visibility = 'visible';
        appleMenu.style.transition = 'opacity 0.35s cubic-bezier(.4,0,.2,1)';
        setTimeout(() => { appleMenu.style.opacity = '1'; }, 10);
        try { removeFloatingTooltipsContaining('Lock Screen'); } catch (e) {}
    }

    // --- Main Apple menu logic ---
    document.addEventListener('DOMContentLoaded', function() {
        const appleLogo = document.querySelector('.apple-logo');
        const appleMenu = document.getElementById('appleMenu');
        if (appleLogo && appleMenu) {
            appleLogo.style.cursor = 'pointer';
            try {
                const s = appleMenu.style;
                s.position = 'fixed';
                s.left = '8px';
                s.top = '36px';
                s.minWidth = '220px';
                s.maxWidth = '320px';
                s.background = 'rgba(40,40,40,0.96)';
                s.color = '#ffffff';
                s.borderRadius = '10px';
                s.boxShadow = '0 12px 40px rgba(0,0,0,0.6)';
                s.padding = '8px 0 8px 0';
                s.zIndex = '120000';
                s.display = 'none';
                s.fontSize = '15px';
                s.lineHeight = '1.2';
                s.boxSizing = 'border-box';
                s.pointerEvents = 'auto';
            } catch (e) {}
            appleLogo.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (appleMenu.getAttribute('aria-hidden') === 'false') {
                    closeAppleMenu();
                } else {
                    openAppleMenu();
                }
            });
            
            // Handle Get Info click
            appleMenu.addEventListener('pointerdown', (ev) => {
                const getInfoEl = ev.target.closest && ev.target.closest('#appleGetInfo');
                if (getInfoEl) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (typeof window.showSystemInfo === 'function') {
                        window.showSystemInfo();
                    }
                    closeAppleMenu();
                    return;
                }
                
                // Handle About Me click
                const aboutMeEl = ev.target.closest && ev.target.closest('#appleAboutMe');
                if (aboutMeEl) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    // Open About window with profile information
                    if (typeof openApp === 'function') {
                        openApp('about');
                    }
                    closeAppleMenu();
                    return;
                }
                
                // Handle Lock Screen click
                const lockEl = ev.target.closest && ev.target.closest('#appleLockScreen');
                if (!lockEl) return;
                ev.preventDefault();
                ev.stopPropagation();
                clearStoredTitle(lockEl);
                try {
                    if (typeof window.showLockScreen === 'function') {
                        window.showLockScreen();
                    } else {
                        const lockBtn = document.getElementById('lockScreenBtn');
                        if (lockBtn) lockBtn.click();
                    }
                } catch (e) {}
                closeAppleMenu();
                setTimeout(() => restoreStoredTitle(lockEl), 600);
            }, true);
            document.addEventListener('click', (ev) => {
                if (!appleMenu) return;
                if (appleMenu.getAttribute('aria-hidden') === 'true') return;
                if (ev.target.closest && (ev.target.closest('.apple-menu') || ev.target.closest('.apple-logo'))) return;
                closeAppleMenu();
            }, true);
            document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeAppleMenu(); });
        }
    });
})();
