#!/usr/bin/env python3
"""
Alternative: Download wallpapers from picsum.photos (Lorem Picsum - free placeholder images)
"""

import urllib.request
import os

wallpapers = [
    {'name': 'wallpaper-1.jpg', 'seed': 'mountain'},
    {'name': 'wallpaper-2.jpg', 'seed': 'ocean'},
    {'name': 'wallpaper-3.jpg', 'seed': 'forest'},
    {'name': 'wallpaper-4.jpg', 'seed': 'night'},
    {'name': 'wallpaper-5.jpg', 'seed': 'city'},
    {'name': 'wallpaper-6.jpg', 'seed': 'abstract'},
    {'name': 'wallpaper-7.jpg', 'seed': 'desert'},
    {'name': 'wallpaper-8.jpg', 'seed': 'aurora'},
]

def download_wallpapers():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    wallpaper_dir = os.path.join(script_dir, 'images', 'wallpapers')
    os.makedirs(wallpaper_dir, exist_ok=True)
    
    print("🎨 Downloading wallpapers from picsum.photos...")
    print(f"📁 Saving to: {wallpaper_dir}\n")
    
    for i, wallpaper in enumerate(wallpapers, 1):
        filepath = os.path.join(wallpaper_dir, wallpaper['name'])
        
        if os.path.exists(filepath):
            print(f"⏭️  [{i}/{len(wallpapers)}] Skipping {wallpaper['name']} (already exists)")
            continue
        
        try:
            # Using Lorem Picsum with seed for consistent images
            url = f"https://picsum.photos/seed/{wallpaper['seed']}/1920/1080"
            print(f"⬇️  [{i}/{len(wallpapers)}] Downloading {wallpaper['name']}...", end=' ')
            
            urllib.request.urlretrieve(url, filepath)
            size = os.path.getsize(filepath) / (1024 * 1024)
            print(f"✅ ({size:.1f} MB)")
            
        except Exception as e:
            print(f"❌ Failed: {e}")
    
    print(f"\n✨ Done! Check the wallpapers folder.")

if __name__ == '__main__':
    download_wallpapers()
