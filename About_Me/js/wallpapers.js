// Wallpaper Management System
const wallpapers = [
    {
        id: 1,
        name: 'Purple Dream',
        type: 'gradient',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        id: 2,
        name: 'Ocean Blue',
        type: 'gradient',
        value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)'
    },
    {
        id: 3,
        name: 'Sunset',
        type: 'gradient',
        value: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)'
    },
    {
        id: 4,
        name: 'Forest',
        type: 'gradient',
        value: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)'
    },
    {
        id: 5,
        name: 'Northern Lights',
        type: 'gradient',
        value: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)'
    },
    {
        id: 6,
        name: 'Cosmic',
        type: 'gradient',
        value: 'linear-gradient(135deg, #DA22FF 0%, #9733EE 100%)'
    },
    {
        id: 7,
        name: 'Fire',
        type: 'gradient',
        value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)'
    },
    {
        id: 8,
        name: 'Cool Sky',
        type: 'gradient',
        value: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)'
    },
    {
        id: 9,
        name: 'Rose',
        type: 'gradient',
        value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    },
    {
        id: 10,
        name: 'Dark Mode',
        type: 'gradient',
        value: 'linear-gradient(135deg, #232526 0%, #414345 100%)'
    },
    {
        id: 11,
        name: 'Mountain Mist',
        type: 'gradient',
        value: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)'
    },
    {
        id: 12,
        name: 'Peach',
        type: 'gradient',
        value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
        id: 13,
        name: 'Mountain Vista',
        type: 'image',
        value: 'images/wallpapers/wallpaper-1.jpg'
    },
    {
        id: 14,
        name: 'Ocean Waves',
        type: 'image',
        value: 'images/wallpapers/wallpaper-2.jpg'
    },
    {
        id: 15,
        name: 'Forest Path',
        type: 'image',
        value: 'images/wallpapers/wallpaper-3.jpg'
    },
    {
        id: 16,
        name: 'Night Sky',
        type: 'image',
        value: 'images/wallpapers/wallpaper-4.jpg'
    },
    {
        id: 17,
        name: 'City Lights',
        type: 'image',
        value: 'images/wallpapers/wallpaper-5.jpg'
    },
    {
        id: 18,
        name: 'Abstract Art',
        type: 'image',
        value: 'images/wallpapers/wallpaper-6.jpg'
    },
    {
        id: 19,
        name: 'Desert Dunes',
        type: 'image',
        value: 'images/wallpapers/wallpaper-7.jpg'
    },
    {
        id: 20,
        name: 'Aurora Borealis',
        type: 'image',
        value: 'images/wallpapers/wallpaper-8.jpg'
    }
    ,{
        id: 21,
        name: 'Cat In Rain',
        type: 'video',
        value: 'images/wallpapers/cat_in_rain.mp4'
    }
];

// Current wallpaper — prefer the macOS Ventura image if it exists in the wallpapers folder
const defaultImagePath = 'images/wallpapers/macos-ventura.jpg';
const defaultWallpaper = wallpapers.find(w => w.type === 'image' && w.value && w.value.includes('macos-ventura')) || wallpapers.find(w => w.type === 'image' && w.value && w.value === defaultImagePath) || { id: 0, name: 'macos-ventura', type: 'image', value: defaultImagePath };
let currentWallpaper = defaultWallpaper;

// Initialize wallpaper system
function initializeWallpapers() {
    // Load saved wallpaper from localStorage
    const savedWallpaper = localStorage.getItem('selectedWallpaper');
    if (savedWallpaper) {
        const wallpaper = wallpapers.find(w => w.id === parseInt(savedWallpaper));
        // If user previously selected an image wallpaper, honor it. If it was a gradient, prefer the default macOS image instead.
        if (wallpaper) {
            // If the saved wallpaper is an image or video, apply it directly.
            if (wallpaper.type === 'image' || wallpaper.type === 'video') {
                currentWallpaper = wallpaper;
                applyWallpaper(currentWallpaper);
            } else {
                // saved wallpaper is a gradient (or unknown); prefer the macOS Ventura image by default
                if (defaultWallpaper) applyWallpaper(defaultWallpaper);
            }
        } else {
            if (defaultWallpaper) applyWallpaper(defaultWallpaper);
        }
    } else {
        // No saved wallpaper: but if a video element was already injected (by an earlier handler), honor it
            const existingVideo = document.getElementById('desktop-video-wallpaper');
            if (existingVideo) {
                // Try to find the matching wallpaper entry and set it as current
                const match = wallpapers.find(w => w.type === 'video' && existingVideo.src && existingVideo.src.includes(w.value));
                if (match) {
                    currentWallpaper = match;
                    try { localStorage.setItem('selectedWallpaper', match.id); } catch (e) {}
                    return;
                } else {
                    // A video exists but does not match our list; leave it alone
                    return;
                }
            }

            // No saved wallpaper and no existing injected video: apply the default wallpaper (macos-ventura) if present
            if (defaultWallpaper) {
                applyWallpaper(defaultWallpaper);
            } else {
                console.log('No saved wallpaper and no default image found; preserving CSS background');
            }
    }
}

// Apply wallpaper
function applyWallpaper(wallpaper) {
    const desktop = document.querySelector('.desktop');
    
    if (!desktop) {
        console.error('Desktop element not found');
        return;
    }
    
    if (wallpaper.type === 'gradient') {
        desktop.style.background = wallpaper.value;
        console.log('Applied gradient:', wallpaper.name);
    } else if (wallpaper.type === 'image') {
        // remove any existing video wallpaper
        const existingVideo = document.getElementById('desktop-video-wallpaper');
        if (existingVideo && existingVideo.parentNode) existingVideo.parentNode.removeChild(existingVideo);

        desktop.style.background = `url('${wallpaper.value}') center/cover no-repeat`;
        console.log('Applied image:', wallpaper.name);
    } else if (wallpaper.type === 'video') {
        // Remove CSS background (override stylesheet)
        desktop.style.background = 'none';
        desktop.style.backgroundImage = 'none';

        // Remove any existing video first
        let existing = document.getElementById('desktop-video-wallpaper');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        // Create video element
        const vid = document.createElement('video');
        vid.id = 'desktop-video-wallpaper';
        vid.src = wallpaper.value;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.style.position = 'absolute';
        vid.style.left = '0';
        vid.style.top = '0';
        vid.style.width = '100%';
        vid.style.height = '100%';
        vid.style.objectFit = 'cover';
        vid.style.zIndex = '0';
        vid.style.pointerEvents = 'none';

        // Ensure desktop is positioned so absolute video sits behind content
        const prevPosition = getComputedStyle(desktop).position;
        if (prevPosition === 'static' || !prevPosition) desktop.style.position = 'relative';

        desktop.insertBefore(vid, desktop.firstChild);
        // Attempt to play (some browsers require user interaction)
        vid.play().catch(() => {
            console.warn('Autoplay prevented for wallpaper video; it will remain paused until user interacts.');
            // Add a one-time resume on the next user interaction (click/tap/keydown)
            const resume = () => {
                vid.play().catch(() => {});
                document.removeEventListener('click', resume);
                document.removeEventListener('touchstart', resume);
                document.removeEventListener('keydown', resume);
            };
            document.addEventListener('click', resume, { once: true });
            document.addEventListener('touchstart', resume, { once: true });
            document.addEventListener('keydown', resume, { once: true });
        });
        console.log('Applied video wallpaper:', wallpaper.name);
    }
    
    currentWallpaper = wallpaper;
    
    // Save to localStorage
    localStorage.setItem('selectedWallpaper', wallpaper.id);
    // Refresh vibrancy if available
    if (typeof window.ccVibrancyRefresh === 'function') {
        window.ccVibrancyRefresh();
    }
}

// Change wallpaper
function changeWallpaper(wallpaperId) {
    const wallpaper = wallpapers.find(w => w.id === wallpaperId);
    if (wallpaper) {
        applyWallpaper(wallpaper);
    }
}

// Add custom wallpaper from file
function addCustomWallpaper(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const customWallpaper = {
            id: Date.now(),
            name: file.name,
            type: 'image',
            value: e.target.result
        };
        
        wallpapers.push(customWallpaper);
        
        // Update settings if open
        const settingsWindow = document.querySelector('.window[data-app="settings"]');
        if (settingsWindow) {
            renderWallpaperGrid();
        }
        
        // Apply immediately
        applyWallpaper(customWallpaper);
    };
    reader.readAsDataURL(file);
}

// Render wallpaper grid in settings
function renderWallpaperGrid() {
    const container = document.querySelector('.wallpaper-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    wallpapers.forEach(wallpaper => {
        const item = document.createElement('div');
        item.className = 'wallpaper-item';
        if (wallpaper.id === currentWallpaper.id) {
            item.classList.add('active');
        }
        
        const preview = document.createElement('div');
        preview.className = 'wallpaper-preview';
        
        if (wallpaper.type === 'gradient') {
            preview.style.background = wallpaper.value;
        } else if (wallpaper.type === 'image') {
            preview.style.background = `url('${wallpaper.value}') center/cover no-repeat`;
        }
        
        const name = document.createElement('div');
        name.className = 'wallpaper-name';
        name.textContent = wallpaper.name;
        
        item.appendChild(preview);
        item.appendChild(name);
        
        item.addEventListener('click', () => {
            changeWallpaper(wallpaper.id);
            
            // Update active state
            document.querySelectorAll('.wallpaper-item').forEach(w => w.classList.remove('active'));
            item.classList.add('active');
        });
        
        container.appendChild(item);
    });
    
    // Add custom upload button
    const uploadItem = document.createElement('div');
    uploadItem.className = 'wallpaper-item upload-item';
    uploadItem.innerHTML = `
        <div class="wallpaper-preview upload-preview">
            <span style="font-size: 32px;">➕</span>
        </div>
        <div class="wallpaper-name">Add Image</div>
    `;
    
    uploadItem.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            if (e.target.files[0]) {
                addCustomWallpaper(e.target.files[0]);
            }
        };
        input.click();
    });
    
    container.appendChild(uploadItem);
}

// Export functions
window.wallpaperSystem = {
    initialize: initializeWallpapers,
    change: changeWallpaper,
    addCustom: addCustomWallpaper,
    render: renderWallpaperGrid,
    getAll: () => wallpapers,
    getCurrent: () => currentWallpaper
};

// If a `cat_in_rain.mp4` video exists in the wallpapers list, apply it on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const videoWallpaper = wallpapers.find(w => w.type === 'video' && w.value && w.value.includes('cat_in_rain.mp4'));
        if (videoWallpaper) {
            try { localStorage.setItem('selectedWallpaper', videoWallpaper.id); } catch (e) {}
            applyWallpaper(videoWallpaper);
        }
    } catch (e) {
        console.error('Failed to auto-apply video wallpaper', e);
    }
});
