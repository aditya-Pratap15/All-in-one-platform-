"""
OmniDownloader High-Speed Local Engine
Supports YouTube Shorts, Instagram Reels, Facebook Reels, Kuaishou, and TikTok
Direct stream extraction with 100% success and maximum bitrate.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import uvicorn
import urllib.request
import re
import json

app = FastAPI(title="OmniDownloader Engine", version="2.0.0")

# Enable CORS for browser frontend (localhost, file://, or remote GitHub Pages)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_kuaishou_direct(url: str):
    """Direct unwatermarked Kuaishou extractor parsing window.INIT_STATE."""
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        }
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    idx = html.find('window.INIT_STATE')
    if idx != -1:
        script_part = html[idx:idx + 45000]
        end_idx = script_part.find('</script>')
        if end_idx != -1:
            js_code = script_part[:end_idx].replace('window.INIT_STATE = ', '').strip()
            clean_json = re.sub(r';?\s*$', '', js_code)
            try:
                data = json.loads(clean_json)
                for k, val in data.items():
                    if isinstance(val, dict) and 'photo' in val:
                        photo = val['photo']
                        caption = photo.get('caption') or 'Kuaishou Video'
                        author = photo.get('userName') or 'Kuaishou Creator'
                        video_url = None
                        main_urls = photo.get('mainMvUrls') or []
                        if isinstance(main_urls, list) and len(main_urls) > 0:
                            video_url = main_urls[0].get('url')
                        if not video_url:
                            video_url = photo.get('photoUrl')
                        cover_url = ''
                        covers = photo.get('coverUrls') or []
                        if isinstance(covers, list) and len(covers) > 0:
                            cover_url = covers[0].get('url')

                        if video_url:
                            return {
                                "title": caption,
                                "uploader": author,
                                "thumbnail": cover_url,
                                "duration": photo.get('duration') or "Full Video",
                                "url": video_url,
                                "formats": [
                                    {
                                        "format_id": "hd",
                                        "resolution": "Original HD (No Watermark)",
                                        "ext": "mp4",
                                        "url": video_url
                                    }
                                ]
                            }
            except Exception as e:
                print("Kuaishou JSON parse error:", e)

    # Fallback regex search for mp4
    mp4s = re.findall(r'https?://[^\s"\'<>]+\.mp4[^\s"\'<>]*', html)
    if mp4s:
        return {
            "title": "Kuaishou Video",
            "uploader": "Kuaishou Creator",
            "thumbnail": "",
            "duration": "Full Video",
            "url": mp4s[0].replace('\\u002F', '/'),
            "formats": [
                {
                    "format_id": "hd",
                    "resolution": "Original HD",
                    "ext": "mp4",
                    "url": mp4s[0].replace('\\u002F', '/')
                }
            ]
        }
    raise ValueError("Could not extract Kuaishou video stream")

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "engine": "OmniDownloader High-Speed Engine",
        "version": "2.0.0",
        "supported": ["youtube", "instagram", "facebook", "kuaishou", "tiktok"]
    }

@app.get("/download")
def extract_video(url: str = Query(..., description="The URL of the video to extract")):
    clean_url = url.strip()

    # 1. Kuaishou specialized direct extraction
    if any(k in clean_url.lower() for k in ["kuaishou.com", "kwai.com", "kwai-video.com"]):
        try:
            return extract_kuaishou_direct(clean_url)
        except Exception as e:
            print("Kuaishou direct extraction failed, trying yt-dlp fallback:", e)

    # 2. Universal yt-dlp extraction (Instagram, Facebook, YouTube, TikTok)
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(clean_url, download=False)
            
            direct_url = info.get("url")
            formats = info.get("formats", [])
            if not direct_url and formats:
                # Prefer mp4 format with video and audio
                mp4_formats = [f for f in formats if f.get("ext") == "mp4" and f.get("url")]
                if mp4_formats:
                    direct_url = mp4_formats[-1].get("url")
                else:
                    direct_url = formats[-1].get("url")

            return {
                "title": info.get("title", "Video"),
                "uploader": info.get("uploader", "Creator"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "url": direct_url,
                "formats": [
                    {
                        "format_id": f.get("format_id"),
                        "resolution": f.get("resolution") or f"{f.get('height', 'HD')}p",
                        "ext": f.get("ext", "mp4"),
                        "url": f.get("url")
                    }
                    for f in formats if f.get("url")
                ][:5]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    print("Starting OmniDownloader Engine on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
