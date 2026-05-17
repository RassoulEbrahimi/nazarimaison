import os
import sys
import json
import subprocess
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEOS_DIR = os.path.join(ROOT_DIR, 'frontend', 'public', 'videos', 'products')
POSTERS_DIR = os.path.join(ROOT_DIR, 'frontend', 'public', 'images', 'posters')
PRODUCTS_JSON = os.path.join(ROOT_DIR, 'frontend', 'public', 'data', 'products.json')

def get_ffmpeg_path():
    # Try finding in PATH
    ffmpeg_path = shutil.which('ffmpeg')
    if ffmpeg_path:
        return ffmpeg_path
    
    # Try Winget default installation path on Windows
    username = os.environ.get('USERNAME')
    if username:
        winget_path = rf"C:\Users\{username}\AppData\Local\Microsoft\WinGet\Packages"
        if os.path.exists(winget_path):
            for root, dirs, files in os.walk(winget_path):
                if 'ffmpeg.exe' in files:
                    return os.path.join(root, 'ffmpeg.exe')
    return None

def main():
    ffmpeg_bin = get_ffmpeg_path()
    if not ffmpeg_bin:
        print("❌ ffmpeg not found! Please install it (e.g. winget install Gyan.FFmpeg) or add it to PATH.")
        sys.exit(1)
        
    print(f"✅ Using ffmpeg: {ffmpeg_bin}")
    os.makedirs(POSTERS_DIR, exist_ok=True)
    
    video_files = [f for f in os.listdir(VIDEOS_DIR) if f.startswith('nazari-post-') and f.endswith('.mp4')]
    if not video_files:
        print("No MP4 videos found.")
        sys.exit(0)
        
    print(f"\nFound {len(video_files)} videos. Extracting posters...\n")
    poster_map = {}
    
    for video_file in video_files:
        video_id = os.path.splitext(video_file)[0]
        video_path = os.path.join(VIDEOS_DIR, video_file)
        poster_path = os.path.join(POSTERS_DIR, f"{video_id}.jpg")
        web_path = f"/images/posters/{video_id}.jpg"
        
        if os.path.exists(poster_path):
            print(f"  ⏭  {video_file} → already exists, skipping")
            poster_map[video_id] = web_path
            continue
            
        args1 = [
            ffmpeg_bin, '-y', '-ss', '1', '-i', video_path, '-vframes', '1',
            '-vf', 'scale=600:600:force_original_aspect_ratio=increase,crop=600:600',
            '-q:v', '4', poster_path
        ]
        
        result = subprocess.run(args1, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            # Fallback to frame 0
            args0 = [
                ffmpeg_bin, '-y', '-i', video_path, '-vframes', '1',
                '-vf', 'scale=600:600:force_original_aspect_ratio=increase,crop=600:600',
                '-q:v', '4', poster_path
            ]
            result2 = subprocess.run(args0, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if result2.returncode != 0:
                print(f"  ❌  {video_file} → FAILED")
                continue
                
        print(f"  ✅  {video_file} → {video_id}.jpg")
        poster_map[video_id] = web_path
        
    # Update products.json
    try:
        with open(PRODUCTS_JSON, 'r', encoding='utf-8') as f:
            products = json.load(f)
    except Exception as e:
        print(f"Failed to read products.json: {e}")
        sys.exit(1)
        
    changed = 0
    for p in products:
        is_video = p.get('type') == 'video' or (p.get('video') and not p.get('image'))
        if is_video:
            poster_url = poster_map.get(p['id'])
            if poster_url and p.get('poster') != poster_url:
                p['poster'] = poster_url
                changed += 1
                
    if changed > 0:
        with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        # Add trailing newline
        with open(PRODUCTS_JSON, 'a', encoding='utf-8') as f:
            f.write('\n')
            
    print(f"\n✅ products.json updated — {changed} entries had poster added/changed.")
    print(f"   Poster directory: {POSTERS_DIR}")
    print("\nDone! Run `npm run build` in frontend/ next.\n")

if __name__ == '__main__':
    main()
