/*
 * visitorWidget.js
 * Lightweight vanilla JS visitor stats widget (no React).
 * Usage:
 *   <div id="visitor-root"></div>
 *   <link rel="stylesheet" href="css/visitor-widget.css">
 *   <script src="js/visitorWidget.js"></script>
 *   <script>VisitorWidget.init('#visitor-root', { base: 10567 });</script>
 *
 * Options:
 *  - base: starting total visitors (number)
 *  - liveUrl: optional REST endpoint that returns { sessions: [...] } or a number
 *  - totalUrl: optional REST endpoint that returns a numeric total (added to base)
 *  - poll: polling interval in ms (default 5000)
 *
 * The widget gracefully falls back to simulated data if no endpoints are provided.
 */
(function (global) {
    const DEFAULT_BASE = 10000;
    const DEFAULT_POLL = 5000;

    function fmt(n) {
        return (n || 0).toLocaleString();
    }

    function createNode(tag, cls, html) {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (html !== undefined) el.innerHTML = html;
        return el;
    }

    function nowSeconds() { return Math.floor(Date.now() / 1000); }

    function makeWidget(root, opts) {
        const base = Number(opts.base) || DEFAULT_BASE;
        const poll = Number(opts.poll) || DEFAULT_POLL;
        const liveUrl = opts.liveUrl || null;
        const totalUrl = opts.totalUrl || null;
        const simulate = Boolean(opts.simulate);

        root.classList.add('visitor-widget-root');

        const card = createNode('div', 'vw-card');
        const header = createNode('header', 'vw-header', '<h3 class="vw-title">Visitor Overview</h3><div class="vw-subtitle">Live visitor snapshot and recent activity</div>');
        const grid = createNode('div', 'vw-grid');

        const liveCard = createNode('div', 'vw-stat vw-live');
        const liveLabel = createNode('div', 'vw-label', 'LIVE VIEWERS');
        const liveValue = createNode('div', 'vw-value', '0');
        liveCard.appendChild(liveLabel);
        liveCard.appendChild(liveValue);

        const totalCard = createNode('div', 'vw-stat vw-total');
        const totalLabel = createNode('div', 'vw-label', 'TOTAL VISITORS');
        const totalValue = createNode('div', 'vw-value', fmt(base));
        totalCard.appendChild(totalLabel);
        totalCard.appendChild(totalValue);

        grid.appendChild(liveCard);
        grid.appendChild(totalCard);

        const recentList = createNode('div', 'vw-recent');
        const recentTitle = createNode('div', 'vw-recent-title', '<span class="live-dot"></span> Recent Activity');
        const recentItems = createNode('div', 'vw-recent-items');
        recentList.appendChild(recentTitle);
        recentList.appendChild(recentItems);

        card.appendChild(header);
        card.appendChild(grid);
        card.appendChild(recentList);
        const footer = createNode('div', 'vw-footer', '<span class="live-dot"></span> Active Sessions');
        card.appendChild(footer);
        root.appendChild(card);

        // internal state
        let total = base;
        let live = 0;
        let recent = [];

        // Ensure Live shows at least 1 and add an Active Session entry for the current client
        try {
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

            const icon = os === 'macOS' ? '🍎' : (os === 'Windows' ? '🪟' : '🌐');
            live = Math.max(1, live);
            if (recent.length === 0) {
                recent.unshift({ icon, browser, platform: os, when: new Date().toLocaleTimeString() });
                if (recent.length > 8) recent.pop();
            }
        } catch (e) {}

        function render() {
            liveValue.textContent = fmt(live);
            totalValue.textContent = fmt(total);
            recentItems.innerHTML = '';
            if (recent.length === 0) {
                const empty = createNode('div', 'vw-recent-empty', 'No recent activity');
                recentItems.appendChild(empty);
            } else {
                recent.slice(0,5).forEach(r => {
                    const item = createNode('div', 'vw-recent-item');
                    const left = createNode('div', 'vw-recent-left');
                    // create icon image if possible
                    try {
                        const img = document.createElement('img');
                        img.className = 'vw-icon-img';
                        // map browser to icon filename
                        function browserIcon(b, p) {
                            const name = (b || '').toLowerCase();
                            if (name.includes('safari')) return 'images/icons/safari.png';
                            if (name.includes('chrome')) return 'images/icons/chrome.png';
                            if (name.includes('edge') || name.includes('edg')) return 'images/icons/edge.png';
                            if (name.includes('firefox')) return 'images/icons/firefox.png';
                            if (p && p.toLowerCase().includes('mac')) return 'images/icons/apple.png';
                            // default for other apps/browsers
                            return 'images/icons/browser.png';
                        }
                        img.src = browserIcon(r.browser, r.platform || '');
                        img.alt = r.browser || 'visitor';
                        left.appendChild(img);
                    } catch (e) {
                        left.innerHTML = `<span class=\'vw-pill\'>${r.icon || '👤'}</span>`;
                    }

                    const mid = createNode('div', 'vw-recent-mid', `<div class="vw-small">${r.browser || 'Browser'}</div><div class="vw-muted">${r.platform || ''}</div>`);
                    const right = createNode('div', 'vw-recent-right', `<div class="vw-small vw-time">${r.when || ''}</div>`);
                    item.appendChild(left);
                    item.appendChild(mid);
                    item.appendChild(right);
                    recentItems.appendChild(item);
                });
            }
        }

        // Simulation fallback (only runs when simulate=true)
        function simulateTick() {
            // small random variation
            live = Math.max(0, Math.round( (Math.sin(nowSeconds()/37) + 1) * 3 + Math.random()*2 ));
            total += Math.round(Math.random() * 3);
            // random recent
            if (Math.random() > 0.7) {
                recent.unshift({ icon: Math.random() > 0.5 ? '🍎' : '🪟', browser: Math.random() > 0.5 ? 'Safari' : 'Chrome', platform: Math.random() > 0.5 ? 'iOS' : 'macOS', when: new Date().toLocaleTimeString() });
                if (recent.length > 8) recent.pop();
            }
            render();
        }

        async function fetchLive() {
            try {
                if (!liveUrl) return false;
                const r = await fetch(liveUrl, { cache: 'no-store' });
                if (!r.ok) return false;
                const data = await r.json();
                // Accept both number or { sessions: [...] }
                if (typeof data === 'number') {
                    live = data;
                } else if (Array.isArray(data.sessions)) {
                    live = data.sessions.length;
                    // map recent
                    recent = data.sessions.slice().sort((a,b)=> (b.ts||0)-(a.ts||0)).map(s=>({ icon: s.platform?.includes('Mac') ? '🍎' : '🪟', browser: s.browser||'', platform: s.platform||'', when: s.time || new Date((s.ts||Date.now())).toLocaleTimeString() }));
                }
                return true;
            } catch (err) { return false; }
        }

        async function fetchTotal() {
            try {
                if (!totalUrl) return false;
                const r = await fetch(totalUrl, { cache: 'no-store' });
                if (!r.ok) return false;
                const data = await r.json();
                if (typeof data === 'number') {
                    total = base + data;
                } else if (data && typeof data.total === 'number') {
                    total = base + data.total;
                }
                return true;
            } catch (err) { return false; }
        }

        let timer = null;
        async function tick() {
            const okLive = await fetchLive();
            const okTotal = await fetchTotal();
            if (!okLive && !okTotal) {
                if (simulate) simulateTick();
            } else {
                render();
            }
            timer = setTimeout(tick, poll);
        }

        // start: always render initial state. Only poll if endpoints exist or simulation explicitly enabled.
        render();
        if (liveUrl || totalUrl) {
            timer = setTimeout(tick, poll);
        } else if (simulate) {
            // start simulation loop
            timer = setTimeout(tick, poll);
        }

        function add(delta = 1, entry) {
            delta = Number(delta) || 0;
            total += delta;
            // Treat add as a short-lived live session: bump `live` briefly so UI shows activity
            live += delta;
            if (entry) {
                recent.unshift(entry);
                if (recent.length > 8) recent.pop();
            }
            render();
            // decay live after a short interval so Live returns to prior state
            setTimeout(() => {
                try { live = Math.max(0, live - delta); render(); } catch (e) {}
            }, 8000);
        }

        const instance = {
            destroy() {
                if (timer) clearTimeout(timer);
                root.innerHTML = '';
            },
            add
        };

        // Attach instance to the host element for access
        try { root._visitorWidgetInstance = instance; } catch (e) {}

        return instance;
    }

    // Public API
    global.VisitorWidget = {
        init(selectorOrEl, options = {}) {
            const el = (typeof selectorOrEl === 'string') ? document.querySelector(selectorOrEl) : selectorOrEl;
            if (!el) throw new Error('VisitorWidget: container not found');
            return makeWidget(el, options || {});
        }
    };

})(window);
