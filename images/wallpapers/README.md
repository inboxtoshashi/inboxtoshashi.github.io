# Adding Custom Wallpapers

You have three ways to add custom wallpapers to your Ubuntu Desktop Portfolio:

## Method 1: Using the Settings App (Easiest)
1. Click on the **Settings** ⚙️ icon in the dock
2. Go to **Desktop** section
3. Click on the **➕ Add Image** tile
4. Select an image from your computer
5. The wallpaper will be applied immediately and saved

## Method 2: Adding Images to the Wallpapers Folder
1. Place your images in the `images/wallpapers/` folder
2. Open `wallpapers.js`
3. Add your image to the wallpapers array:

```javascript
{
    id: 13,  // Use next available ID
    name: 'My Custom Wallpaper',
    type: 'image',
    value: 'images/wallpapers/your-image.jpg'
}
```

## Method 3: Adding More Gradients
Open `wallpapers.js` and add new gradient entries:

```javascript
{
    id: 13,
    name: 'My Gradient',
    type: 'gradient',
    value: 'linear-gradient(135deg, #COLOR1 0%, #COLOR2 100%)'
}
```

## Recommended Image Specifications
- **Format**: JPG, PNG, or WebP
- **Resolution**: 1920x1080 or higher
- **Aspect Ratio**: 16:9 recommended
- **File Size**: Under 5MB for best performance

## Built-in Wallpapers
The system comes with 12 beautiful gradient wallpapers:
1. Purple Dream
2. Ocean Blue
3. Sunset
4. Forest
5. Northern Lights
6. Cosmic
7. Fire
8. Cool Sky
9. Rose
10. Dark Mode
11. Mountain Mist
12. Peach

## Features
- ✅ Persistent wallpaper selection (saved in browser localStorage)
- ✅ Live preview when hovering
- ✅ Support for both images and gradients
- ✅ Upload custom images directly from Settings
- ✅ Responsive grid layout

## Tips
- Your wallpaper choice is saved automatically
- You can right-click on the desktop (future feature) to quickly access wallpaper settings
- The wallpaper persists across sessions
- Custom uploaded images are stored in browser storage
