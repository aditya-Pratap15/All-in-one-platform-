"""
Optional Local yt-dlp Micro-Backend for OmniDownloader
Run this whenever you want completely private, unrestricted 4K downloads!

Usage:
  1. pip install -r requirements.txt
  2. python server.py
  3. In OmniDownloader Settings (Gear icon), choose "Custom Backend" 
     and enter: http://localhost:8000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import uvicorn

app = FastAPI(title="OmniDownloader Local Backend", version="1.0.0")

# Enable Cross-Origin Resource Sharing (CORS) for your GitHub Pages frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "OmniDownloader Local Engine is running!"}

@app.get("/download")
def extract_video(url: str = Query(..., description="The URL of the video to extract")):
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract direct stream URL
            direct_url = info.get("url")
            if not direct_url and "formats" in info and len(info["formats"]) > 0:
                direct_url = info["formats"][-1].get("url")

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
                    for f in info.get("formats", []) if f.get("url")
                ][:5]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    print("Starting OmniDownloader Local Engine at http://localhost:8000 ...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
