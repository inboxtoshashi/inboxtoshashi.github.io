// cc-vibrancy.js
// Full working wallpaper-aware, multi-layer vibrancy for macOS Control Center clone
// Requires: StackBlur.js (https://github.com/flozz/StackBlur)


document.addEventListener('DOMContentLoaded', function() {
  const cc = document.getElementById('controlCenter');
  const canvas = document.createElement('canvas');
  canvas.id = 'cc-blur-canvas';
  canvas.style.display = 'none';
  canvas.style.pointerEvents = 'none'; // always non-interactive
  canvas.style.zIndex = '1';
  document.body.appendChild(canvas);
  const desktop = document.querySelector('.desktop');
  if (!cc || !canvas || !desktop) return;
  const ctx = canvas.getContext('2d');

  function getPanelRect() {
    const rect = cc.getBoundingClientRect();
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
  }
  function getWallpaperImage() {
    const bg = getComputedStyle(desktop).backgroundImage;
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (match && match[1] && !match[1].includes('macos-ventura.jpg')) {
      return match[1];
    }
    // fallback: no image or missing image
    return null;
  }
  function processWallpaperRegion() {
    const imgUrl = getWallpaperImage();
    if (!imgUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imgUrl;
    img.onload = () => {
      const {x, y, w, h} = getPanelRect();
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      // Multi-layer blur: wide + tight
      StackBlur.canvasRGBA(canvas, 0, 0, w, h, 32); // Wide blur
      ctx.globalAlpha = 0.6;
      StackBlur.canvasRGBA(canvas, 0, 0, w, h, 8); // Tighter blur overlay
      ctx.globalAlpha = 1;
      // Dynamic luminance lift
      const imageData = ctx.getImageData(0, 0, w, h);
      let total = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        total += 0.2126 * imageData.data[i] + 0.7152 * imageData.data[i+1] + 0.0722 * imageData.data[i+2];
      }
      const avg = total / (w * h);
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = avg < 128 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      // Set as background
      cc.style.backgroundImage = `url(${canvas.toDataURL()})`;
      cc.style.backgroundSize = 'cover';
      cc.style.backgroundPosition = 'center';
      cc.style.backgroundRepeat = 'no-repeat';
      cc.style.backgroundColor = 'rgba(30,30,32,0.82)';
      // Adaptive blue for toggles
      const blue = avg < 128 ? 'rgba(0,122,255,0.82)' : 'rgba(0,90,200,0.82)';
      cc.style.setProperty('--cc-blue', blue);
    };
  }
  window.addEventListener('resize', processWallpaperRegion);
  setTimeout(processWallpaperRegion, 400);
  window.ccVibrancyRefresh = processWallpaperRegion;
});
