/* Finder helper functions (separate file) */
(function(window){
    function formatTagLabel(key) {
        if (!key) return '';
        if (key.startsWith('tag-')) {
            const nm = key.replace('tag-', '').replace(/-/g, ' ');
            return nm.charAt(0).toUpperCase() + nm.slice(1);
        }
        // fallback: capitalize
        return key.charAt(0).toUpperCase() + key.slice(1);
    }

    function renderAllTags(container, onSelectTag) {
        // container is the filesGrid element
        container.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'all-tags-wrap';

        const left = document.createElement('div');
        left.className = 'all-tags-left';

        const tags = [
            { key: 'tag-blue', label: 'Blue', color:'#0a84ff' },
            { key: 'tag-green', label: 'Green', color:'#34c759' },
            { key: 'tag-grey', label: 'Grey', color:'#8e8e93' },
            { key: 'tag-home', label: 'Home', color:'#8e8e93' },
            { key: 'tag-important', label: 'Important', color:'#8e8e93' },
            { key: 'tag-orange', label: 'Orange', color:'#ff9500' },
            { key: 'tag-purple', label: 'Purple', color:'#af52de' },
            { key: 'tag-red', label: 'Red', color:'#ff3b30' },
            { key: 'tag-work', label: 'Work', color:'#8e8e93' },
            { key: 'tag-yellow', label: 'Yellow', color:'#ffd60a' }
        ];

        tags.forEach(t => {
            const row = document.createElement('div');
            row.className = 'all-tags-row';
            row.innerHTML = `<span class="tag-dot" style="background:${t.color}"></span><span class="all-tags-label">${t.label}</span>`;
            row.addEventListener('click', () => onSelectTag && onSelectTag(t.key));
            left.appendChild(row);
        });

        const right = document.createElement('div');
        right.className = 'all-tags-right';
        // intentionally leave right column blank for the All Tags view
        right.innerHTML = '';

        wrap.appendChild(left);
        wrap.appendChild(right);
        container.appendChild(wrap);
    }

    window.finderHelpers = {
        formatTagLabel,
        renderAllTags
    };
})(window);

    // Finder initialization and UI logic moved here from script.js
    (function(window){
        function initializeFiles(win) {
            const sidebarItems = win.querySelectorAll('.files-sidebar-item');
            // Ensure Finder opens to Recents by default when a new Finder window is created
            const initial = win.querySelector('.files-sidebar-item[data-key="recents"]');
            if (initial) {
                sidebarItems.forEach(i => i.classList.remove('active'));
                initial.classList.add('active');
            }
            // Replace sidebar SVGs with PNG icons from `icons/` when available
            (function replaceSidebarIcons() {
                const map = {
                    'airdrop': 'Airdrop.png',
                    'desktop': 'desktop.png',
                    'documents': 'documents.png',
                    'downloads': 'downloads.png',
                    'icloud': 'icloud.png',
                    'iclouddrive': 'icloud.png'
                    , 'applications': 'app-store.png'
                };

                sidebarItems.forEach(item => {
                    const iconSpan = item.querySelector('.sidebar-icon');
                    const svg = iconSpan ? iconSpan.querySelector('.sidebar-svg') : null;
                    const label = (item.textContent || '').trim().split('\n')[0] || '';
                    const key = label.toLowerCase().replace(/\s+/g, '');
                    const file = map[key];
                    if (file && iconSpan) {
                        // keep a reference to the original svg for fallback
                        const originalSvg = svg ? svg.cloneNode(true) : null;
                        if (svg) svg.remove();
                        const img = document.createElement('img');
                        img.src = `icons/${file}`;
                        img.alt = label;
                        img.style.width = '18px';
                        img.style.height = '18px';
                        img.style.objectFit = 'contain';
                        img.onerror = () => {
                            // restore original svg if PNG not found
                            if (originalSvg) {
                                iconSpan.appendChild(originalSvg);
                            }
                            img.remove();
                        };
                        iconSpan.appendChild(img);
                    }
                });
            })();
            // Make sidebar sections collapsible (attach handlers to titles)
            (function initializeSidebarCollapsibleInFinder(){
                const sections = win.querySelectorAll('.sidebar-section');
                sections.forEach(section => {
                    const title = section.querySelector('.sidebar-section-title');
                    if (!title) return;
                    title.style.userSelect = 'none';
                    title.addEventListener('click', (e) => {
                        e.stopPropagation();
                        section.classList.toggle('collapsed');
                    });
                });
            })();
            // Ensure AirDrop sidebar label uses 'AirDrop' capitalization
            (function ensureAirdropLabel(){
                const airdrop = Array.from(sidebarItems).find(i => i.dataset.key === 'airdrop');
                if (!airdrop) return;
                const iconSpan = airdrop.querySelector('.sidebar-icon');
                if (iconSpan) {
                    // rebuild node so label text is exactly 'AirDrop'
                    airdrop.innerHTML = '';
                    airdrop.appendChild(iconSpan);
                    airdrop.appendChild(document.createTextNode('AirDrop'));
                } else {
                    airdrop.textContent = 'AirDrop';
                }
            })();
            const pathElement = win.querySelector('#filesPath') || win.querySelector('.files-path');
            const gridElement = win.querySelector('#filesGrid') || win.querySelector('.files-grid');
            const backBtn = win.querySelector('#finderBack');
            const leftLabel = win.querySelector('#finderLeftLabel');
            const tagDot = win.querySelector('#finderTagDot');

            let historyStack = [];
            let forwardStack = [];
            let currentKey = 'recents';
            // timeout handle for delayed AirDrop rendering
            let airdropTimeout = null;

            function clearAirdropTimeout(){
                if (airdropTimeout) { clearTimeout(airdropTimeout); airdropTimeout = null; }
            }
            // view mode and search elements
            const viewButtons = win.querySelectorAll('.finder-view-btn');
            const searchInput = win.querySelector('#finderSearch');
            let currentView = 'icon';

            function setFinderViewMode(mode) {
                currentView = mode || 'icon';
                const mainEl = win.querySelector('.finder-main');
                if (mainEl) mainEl.setAttribute('data-view', currentView);
                viewButtons.forEach(b => b.classList.toggle('active', b.dataset.view === currentView));
            }

            function applyFinderSearch(query) {
                const q = (query || '').trim().toLowerCase();
                const children = Array.from(gridElement.children || []);
                children.forEach(ch => {
                    if (!q) {
                        ch.style.display = '';
                        return;
                    }
                    const text = (ch.textContent || '').toLowerCase();
                    ch.style.display = text.indexOf(q) !== -1 ? '' : 'none';
                });
            }

            // wire view button clicks
            viewButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const view = btn.dataset.view || 'icon';
                    setFinderViewMode(view);
                });
            });

            // wire search input
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    applyFinderSearch(e.target.value);
                });
            }

            function getLastWindowElementByApp(appName) {
                for (let i = windows.length - 1; i >= 0; i--) {
                    if (windows[i].appName === appName) return windows[i].element;
                }
                return null;
            }

            function clearGrid() {
                gridElement.innerHTML = '';
            }

            function renderEmpty(message) {
                clearGrid();
                const empty = document.createElement('div');
                empty.className = 'finder-empty';
                // Render an intentionally blank centered area (no text)
                empty.innerHTML = ``;
                gridElement.appendChild(empty);
            }

            function renderApplications() {
                clearGrid();
                const apps = [
                    { src: 'doc-app/docker.png', name: 'Docker' },
                    { src: 'doc-app/calender.png', name: 'Calendar', app: 'calendar' },
                    { src: 'doc-app/safari.png', name: 'Safari', app: 'safari', href: 'https://www.apple.com/safari' }
                ];

                // Applications are icon-only; no details panel

                apps.forEach(a => {
                    const tile = document.createElement('div');
                    tile.className = 'doc-tile app-compact';
                    tile.innerHTML = `
                        <div class="doc-icon">
                            <img src="${a.src}" alt="${a.name}" style="object-fit:contain;border-radius:8px;">
                        </div>
                        <div class="doc-name">${a.name}</div>
                    `;

                    // Click behavior: open external link when provided; otherwise no details
                    // Click behavior: open app if configured, otherwise open external link
                    tile.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (a.app && typeof window.openApp === 'function') {
                            window.openApp(a.app);
                        } else if (a.href) {
                            window.open(a.href, '_blank');
                        }
                    });

                    gridElement.appendChild(tile);
                });

                // no details container for applications
            }


            function renderDocuments() {
                clearGrid();
                const tile = document.createElement('div');
                tile.className = 'doc-tile';
                tile.innerHTML = `
                    <div class="doc-thumb" style="width:96px;height:96px;border-radius:6px;background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:center;">
                        <img src="icons/pdf.png" alt="PDF" style="width:64px;height:64px;object-fit:contain;" />
                    </div>
                    <div class="doc-name">Shashi_Kant_Singh.pdf</div>
                `;

                tile.addEventListener('click', () => {
                    openApp('preview');
                    setTimeout(() => {
                        const previewEl = getLastWindowElementByApp('preview');
                        if (previewEl) initializePreview(previewEl, 'files/Shashi_Kant_Singh.pdf');
                    }, 80);
                });

                // try to generate PDF thumbnail using PDF.js if available
                (function tryPdfThumb() {
                    const thumbEl = tile.querySelector('.doc-thumb');
                    if (!thumbEl) return;
                    if (window.pdfjsLib && window.pdfjsLib.getDocument) {
                        const url = 'files/Shashi_Kant_Singh.pdf';
                        const loadingTask = pdfjsLib.getDocument(url);
                        loadingTask.promise.then(pdf => {
                            return pdf.getPage(1).then(page => {
                                const viewport = page.getViewport({ scale: 1 });
                                const scale = Math.min(96 / viewport.width, 96 / viewport.height);
                                const vp = page.getViewport({ scale });
                                const canvas = document.createElement('canvas');
                                canvas.width = vp.width;
                                canvas.height = vp.height;
                                const ctx = canvas.getContext('2d');
                                const renderTask = page.render({ canvasContext: ctx, viewport: vp });
                                return renderTask.promise.then(() => canvas.toDataURL());
                            });
                        }).then(dataUrl => {
                            if (dataUrl && thumbEl) {
                                thumbEl.style.background = 'transparent';
                                thumbEl.innerHTML = '';
                                const img = document.createElement('img');
                                img.src = dataUrl;
                                img.style.width = '96px';
                                img.style.height = '96px';
                                img.style.objectFit = 'cover';
                                img.style.borderRadius = '6px';
                                thumbEl.appendChild(img);
                            }
                        }).catch(err => {
                            // ignore, keep fallback
                            console.error('PDF thumbnail failed', err);
                        });
                    }
                })();

                // add image onerror fallback to avoid broken image when missing
                const img = tile.querySelector('img');
                if (img) {
                    img.addEventListener('error', () => {
                        img.src = 'icons/pdf.png';
                    });
                }

                gridElement.appendChild(tile);
            }

            function renderAirdrop(showCenter = true) {
                clearGrid();

                const root = document.createElement('div');
                root.className = 'airdrop-root';

                const top = document.createElement('div');
                top.className = 'airdrop-top';

                const avatar = document.createElement('div');
                avatar.className = 'airdrop-avatar';
                // prefer a local avatar image if provided, otherwise show emoji
                (function(){
                    const img = document.createElement('img');
                    img.alt = 'avatar';
                    img.src = 'images/avatar.jpg';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';
                    img.onerror = () => { avatar.textContent = '👤'; };
                    avatar.appendChild(img);
                })();

                const info = document.createElement('div');
                info.className = 'airdrop-info';
                const appear = document.createElement('div');
                appear.className = 'airdrop-appear-label';
                appear.textContent = 'Appear as';
                const name = document.createElement('div');
                name.className = 'airdrop-name';
                // show Guest as requested (capitalized)
                name.textContent = 'Guest';

                info.appendChild(appear);
                info.appendChild(name);

                top.appendChild(avatar);
                top.appendChild(info);

                const center = document.createElement('div');
                center.className = 'airdrop-center';

                // inner container allows precise positioning of the
                // central message. It may be populated later (delayed).
                const centerInner = document.createElement('div');
                centerInner.className = 'airdrop-center-inner';

                if (showCenter) {
                    const noPeople = document.createElement('div');
                    noPeople.className = 'airdrop-no-people';
                    noPeople.textContent = 'No People Found';
                    const subtitle = document.createElement('div');
                    subtitle.className = 'airdrop-subtitle';
                    subtitle.textContent = 'There is no one nearby to share with.';

                    centerInner.appendChild(noPeople);
                    centerInner.appendChild(subtitle);
                }

                center.appendChild(centerInner);

                const footer = document.createElement('div');
                footer.className = 'airdrop-footer';

                // create two separate lines so we can control wrapping independently
                const line1 = document.createElement('div');
                line1.className = 'airdrop-footer-line1';
                line1.textContent = 'AirDrop lets you share instantly with people nearby.';

                const line2 = document.createElement('div');
                line2.className = 'airdrop-footer-line2';
                const link = document.createElement('a');
                link.href = '#';
                link.onclick = () => false;
                link.textContent = 'Allow me to be discovered by: Contacts Only ▾';
                line2.appendChild(link);

                footer.appendChild(line1);
                footer.appendChild(line2);

                root.appendChild(top);
                root.appendChild(center);
                root.appendChild(footer);

                gridElement.appendChild(root);
            }

            // Match other app icon sizes to Safari's displayed size for consistent look
            (function matchToSafari() {
                const safariImg = gridElement.querySelector('img[alt="Safari"]');
                if (!safariImg) return;

                function applyMatch() {
                    const w = safariImg.naturalWidth || safariImg.clientWidth || safariImg.width || 60;
                    const h = safariImg.naturalHeight || safariImg.clientHeight || safariImg.height || w;
                    const imgs = gridElement.querySelectorAll('.doc-icon img');
                    imgs.forEach(im => {
                        if (im === safariImg) return;
                        im.style.width = w + 'px';
                        im.style.height = h + 'px';
                    });
                }

                if (safariImg.complete && safariImg.naturalWidth) {
                    applyMatch();
                } else {
                    safariImg.addEventListener('load', applyMatch);
                }
            })();

            // Update toolbar left label / tag dot and back visibility
            function updateToolbarForKey(key) {
                // determine title
                let title = ({
                    'airdrop': 'AirDrop',
                    'recents': 'Recents',
                    'applications': 'Applications',
                    'desktop': 'Desktop',
                    'documents': 'Documents',
                    'downloads': 'Downloads',
                    'icloud': 'iCloud Drive',
                    'shared': 'Shared',
                    'cursor': 'Cursor',
                    'tags-all': 'All Tags'
                }[key] || key);

                // If this is a tag (e.g., 'tag-green'), show a cleaned, capitalized title like 'Green'
                if (key && key.startsWith('tag-')) {
                    if (window.finderHelpers && typeof window.finderHelpers.formatTagLabel === 'function') {
                        title = window.finderHelpers.formatTagLabel(key);
                    } else {
                        // Fallback: strip 'tag-' and capitalize
                        title = key.replace('tag-', '').replace(/-/g, ' ');
                        title = title.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                    }
                }

                if (pathElement) pathElement.textContent = title;

                const forwardBtn = win.querySelector('#finderForward');
                // Show back/forward as visible but disabled when no history
                if (backBtn) {
                    backBtn.disabled = !historyStack.length;
                    backBtn.style.opacity = historyStack.length ? '1' : '0.45';
                    backBtn.style.pointerEvents = historyStack.length ? 'auto' : 'none';
                }
                if (forwardBtn) {
                    forwardBtn.disabled = !forwardStack.length;
                    forwardBtn.style.opacity = forwardStack.length ? '1' : '0.45';
                    forwardBtn.style.pointerEvents = forwardStack.length ? 'auto' : 'none';
                }

                // If tag, show dot and small label next to back button; else if folder show small label
                if (key && key.startsWith('tag-')) {
                    const tagName = window.finderHelpers && window.finderHelpers.formatTagLabel ? window.finderHelpers.formatTagLabel(key) : key.replace('tag-', '').replace(/-/g, ' ');
                    if (leftLabel) { leftLabel.textContent = tagName; leftLabel.hidden = false; }
                    if (tagDot) {
                        tagDot.hidden = false;
                        const lc = tagName.toLowerCase();
                        tagDot.style.background = (lc === 'red' ? '#ff3b30' : lc === 'orange' ? '#ff9500' : lc === 'yellow' ? '#ffd60a' : lc === 'green' ? '#34c759' : lc === 'blue' ? '#0a84ff' : lc === 'purple' ? '#af52de' : '#8e8e93');
                    }
                } else if (key) {
                    if (leftLabel) { leftLabel.textContent = title; leftLabel.hidden = historyStack.length ? false : true; }
                    if (tagDot) { tagDot.hidden = true; }
                } else {
                    if (leftLabel) leftLabel.hidden = true;
                    if (tagDot) tagDot.hidden = true;
                }

                // Disable (visually + interactively) the right-hand toolbar controls when viewing AirDrop
                try {
                    const rightControls = win.querySelector('.finder-right-controls');
                    if (rightControls) {
                        const controls = rightControls.querySelectorAll('button,input,select,textarea');
                        if (key === 'airdrop') {
                            rightControls.classList.add('disabled');
                            rightControls.setAttribute('aria-disabled', 'true');
                            controls.forEach(el => {
                                try { el.disabled = true; } catch (e) {}
                                try { el.setAttribute('tabindex', '-1'); } catch (e) {}
                            });
                        } else {
                            rightControls.classList.remove('disabled');
                            rightControls.removeAttribute('aria-disabled');
                            controls.forEach(el => {
                                try { el.disabled = false; } catch (e) {}
                                try { el.removeAttribute('tabindex'); } catch (e) {}
                            });
                        }
                    }
                } catch (e) {
                    // ignore if DOM not available
                }
            }

            // Render view for a given key
            function renderMainContent(key, pushHistory = false) {
                if (pushHistory && currentKey && currentKey !== key) {
                    historyStack.push(currentKey);
                    // new navigation clears forward stack
                    forwardStack = [];
                }

                currentKey = key;
                updateToolbarForKey(key);

                // clear any pending AirDrop render when navigating elsewhere
                clearAirdropTimeout();

                if (key === 'applications') {
                    renderApplications();
                } else if (key === 'documents') {
                    renderDocuments();
                } else if (key === 'tags-all') {
                    // Render the All Tags two-column view
                    if (window.finderHelpers && typeof window.finderHelpers.renderAllTags === 'function') {
                        window.finderHelpers.renderAllTags(gridElement, (tagKey) => {
                            // Do NOT navigate away from All Tags. Instead update the top title
                            // and the small left label/dot to reflect the selected tag.
                            const format = window.finderHelpers && typeof window.finderHelpers.formatTagLabel === 'function'
                                ? window.finderHelpers.formatTagLabel
                                : (k) => {
                                    const nm = (k || '').replace(/^tag-/, '').replace(/-/g, ' ');
                                    return nm.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                };

                            const tagName = format(tagKey);

                            // Update center title
                            if (pathElement) pathElement.textContent = tagName;

                            // Update small left label and colored dot
                            if (leftLabel) { leftLabel.textContent = tagName; leftLabel.hidden = false; }
                            if (tagDot) {
                                tagDot.hidden = false;
                                const lc = tagName.toLowerCase();
                                tagDot.style.background = (lc === 'red' ? '#ff3b30' : lc === 'orange' ? '#ff9500' : lc === 'yellow' ? '#ffd60a' : lc === 'green' ? '#34c759' : lc === 'blue' ? '#0a84ff' : lc === 'purple' ? '#af52de' : '#8e8e93');
                            }

                            // Visually mark selected row in All Tags list
                            const rows = gridElement.querySelectorAll('.all-tags-row');
                            rows.forEach(r => r.classList.remove('selected'));
                            const match = Array.from(rows).find(r => (r.textContent || '').trim().startsWith(tagName));
                            if (match) match.classList.add('selected');
                        });
                    } else {
                        renderEmpty('Nothing here');
                    }
                } else if (key === 'airdrop') {
                    // render AirDrop shell immediately (top/footer) but delay
                    // inserting the central message for 5s
                    clearGrid();
                    renderAirdrop(false);
                    clearAirdropTimeout();
                    airdropTimeout = setTimeout(() => {
                        const centerInner = gridElement.querySelector('.airdrop-center-inner');
                        if (centerInner && centerInner.children.length === 0) {
                            const noPeople = document.createElement('div');
                            noPeople.className = 'airdrop-no-people';
                            noPeople.textContent = 'No People Found';
                            const subtitle = document.createElement('div');
                            subtitle.className = 'airdrop-subtitle';
                            subtitle.textContent = 'There is no one nearby to share with.';
                            centerInner.appendChild(noPeople);
                            centerInner.appendChild(subtitle);
                        }
                        airdropTimeout = null;
                    }, 2000);
                } else if (key === 'desktop') {
                    // Show the documents placed on the Desktop (reuse documents renderer)
                    renderDocuments();
                } else if (key === 'downloads' || key === 'icloud' || key === 'shared' || key.startsWith('tag-') || key === 'recents' || key === 'cursor') {
                    renderEmpty('Nothing here');
                } else {
                    renderEmpty('Nothing here');
                }

                // Re-apply search filter after rendering if a search is active
                try {
                    if (typeof applyFinderSearch === 'function' && searchInput) applyFinderSearch(searchInput.value);
                } catch (e) {
                    // ignore
                }
            }

            // Back button handler
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!historyStack.length) return;
                    // push current into forward stack, then navigate back
                    forwardStack.push(currentKey);
                    const prev = historyStack.pop() || 'recents';
                    // set active sidebar item
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    const sel = Array.from(sidebarItems).find(i => i.dataset.key === prev);
                    if (sel) sel.classList.add('active');
                    renderMainContent(prev, false);
                });
            }

            // Forward button handler
            const forwardBtnEl = win.querySelector('#finderForward');
            if (forwardBtnEl) {
                forwardBtnEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!forwardStack.length) return;
                    // push current into history and navigate forward
                    historyStack.push(currentKey);
                    const nxt = forwardStack.pop();
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    const sel = Array.from(sidebarItems).find(i => i.dataset.key === nxt);
                    if (sel) sel.classList.add('active');
                    renderMainContent(nxt, false);
                });
            }

            // Wire sidebar clicks
            sidebarItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const key = item.dataset.key;
                    // update active class
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    renderMainContent(key, true);
                });
            });

            // Keyboard navigation: Left = back, Right = forward when this Finder window is focused
            win.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    const backBtn = win.querySelector('#finderBack');
                    if (backBtn && historyStack.length) backBtn.click();
                } else if (e.key === 'ArrowRight') {
                    const fwd = win.querySelector('#finderForward');
                    if (fwd && forwardStack.length) fwd.click();
                }
            });

            // Initial view
            renderMainContent('recents', false);
            // Ensure initial view mode applied
            try { setFinderViewMode(currentView); } catch (e) {}
        }

        window.initializeFiles = initializeFiles;
    })(window);
