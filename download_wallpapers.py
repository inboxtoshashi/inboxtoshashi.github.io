#!/usr/bin/env python3
"""
Download beautiful wallpapers from Unsplash (free, no attribution required)
"""

import urllib.request
import os

# Unsplash Source API - provides random beautiful images
wallpapers = [
    {
        'name': 'mountain-landscape.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?mountain,landscape',
    },
    {
        'name': 'ocean-beach.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?ocean,beach',
    },
    {
        'name': 'forest-nature.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?forest,nature',
    },
    {
        'name': 'night-sky.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?night,sky,stars',
    },
    {
        'name': 'city-skyline.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?city,skyline',
    },
    {
        'name': 'abstract-colors.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?abstract,colors',
    },
    {
        'name': 'desert-sunset.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?desert,sunset',
    },
    {
        'name': 'aurora-lights.jpg',
        'url': 'https://source.unsplash.com/1920x1080/?aurora,northern-lights',
    },
]

def download_wallpapers():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    wallpaper_dir = os.path.join(script_dir, 'images', 'wallpapers')
    
    # Create directory if it doesn't exist
    os.makedirs(wallpaper_dir, exist_ok=True)
    
    print("🎨 Downloading wallpapers from Unsplash...")
    print(f"📁 Saving to: {wallpaper_dir}\n")
    
    for i, wallpaper in enumerate(wallpapers, 1):
        filepath = os.path.join(wallpaper_dir, wallpaper['name'])
        
        # Skip if file already exists
        if os.path.exists(filepath):
            print(f"⏭️  [{i}/{len(wallpapers)}] Skipping {wallpaper['name']} (already exists)")
            continue
        
        try:
            print(f"⬇️  [{i}/{len(wallpapers)}] Downloading {wallpaper['name']}...", end=' ')
            
            # Download the image
            urllib.request.urlretrieve(wallpaper['url'], filepath)
            
            # Get file size
            size = os.path.getsize(filepath)
            size_mb = size / (1024 * 1024)
            
            print(f"✅ ({size_mb:.1f} MB)")
            
        except Exception as e:
            print(f"❌ Failed: {e}")
    
    print(f"\n✨ Done! Downloaded wallpapers to: {wallpaper_dir}")
    print("\n📝 Next steps:")
    print("   1. Open wallpapers.js")
    print("   2. Add these image entries to the wallpapers array:")
    print("\n   Example:")
    print("   {")
    print("       id: 13,")
    print("       name: 'Mountain Landscape',")
    print("       type: 'image',")
    print("       value: 'images/wallpapers/mountain-landscape.jpg'")
    print("   },")

if __name__ == '__main__':
    download_wallpapers()
