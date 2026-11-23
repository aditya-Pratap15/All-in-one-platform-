"""
OmniDownloader - Daily Drive Batch Runner
-----------------------------------------
Automates downloading high-volume video links from a Google Drive JSON file
and uploading merged, full-quality MP4 videos directly back to Google Drive.

Can be run:
  1. In GitHub Actions (daily cron or manual trigger)
  2. Locally on Windows / macOS / Linux via command line or task scheduler
"""

import os
import sys
import json
import argparse
import base64
import re
import tempfile
import time
import urllib.request
import urllib.parse
import urllib.error

# Ensure yt-dlp is available
try:
    import yt_dlp
except ImportError:
    print("Error: yt-dlp is not installed. Please install it with: pip install -U yt-dlp")
    sys.exit(1)


def load_local_config() -> dict:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cfg_path = os.path.join(base_dir, "drive_config.json")
    if os.path.exists(cfg_path):
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def parse_args():
    cfg = load_local_config()
    parser = argparse.ArgumentParser(description="OmniDownloader Drive Batch Runner")
    parser.add_argument("--webhook", default=os.getenv("DRIVE_WEBHOOK_URL") or cfg.get("webhook_url") or cfg.get("DRIVE_WEBHOOK_URL"), help="Google Apps Script Webhook URL")
    parser.add_argument("--folder", default=os.getenv("DRIVE_FOLDER_URL") or os.getenv("DRIVE_FOLDER_ID") or cfg.get("folder_url") or cfg.get("DRIVE_FOLDER_URL"), help="Target Google Drive Folder URL or ID")
    parser.add_argument("--filename", default=os.getenv("LINKS_JSON_FILENAME") or cfg.get("filename") or "links.json", help="Filename of the JSON containing links in the Drive folder")
    parser.add_argument("--cookies", default=os.getenv("YT_COOKIES_PATH") or cfg.get("cookies_path"), help="Path to cookies.txt file for YouTube")
    parser.add_argument("--max-videos", type=int, default=int(os.getenv("MAX_VIDEOS", "0")), help="Limit number of videos to download (0 = unlimited)")
    parser.add_argument("--force", action="store_true", default=os.getenv("FORCE_ALL", "false").lower() in ["1", "true", "yes"], help="Force re-download even if file already exists in folder")
    return parser.parse_args()


def clean_url(url: str) -> str:
    if not url:
        return ""
    u = url.strip()
    # Normalize YouTube shorts to standard watch link if applicable
    m = re.search(r'(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})', u)
    if m:
        return f"https://www.youtube.com/watch?v={m.group(1)}"
    return u


def post_webhook(webhook_url: str, payload: dict, timeout: int = 180) -> dict:
    """Sends a JSON request to the Google Apps Script Webhook."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "text/plain;charset=utf-8"}
    )
    # Follow redirects as Google Apps Script redirects 302 to script.googleusercontent.com
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {"status": "raw", "response": body}


def fetch_links_from_drive(webhook_url: str, folder: str, filename: str) -> dict:
    """Requests links.json from the Google Drive folder via the Apps Script Webhook."""
    print(f"[*] Querying Google Drive for '{filename}' in folder: {folder} ...")
    payload = {
        "action": "get_links",
        "folderUrl": folder,
        "filename": filename
    }
    res = post_webhook(webhook_url, payload, timeout=60)
    return res


def extract_links_list(raw_content) -> list:
    """Parses various JSON or list structures into a clean list of URLs."""
    if isinstance(raw_content, list):
        items = []
        for item in raw_content:
            if isinstance(item, str):
                items.append(item.strip())
            elif isinstance(item, dict):
                url = item.get("url") or item.get("link") or item.get("sourceUrl") or ""
                if url:
                    items.append(url.strip())
        return [i for i in items if i]

    if isinstance(raw_content, dict):
        # Look for keys like "links", "urls", "videos"
        for key in ["links", "urls", "videos", "data", "items"]:
            if key in raw_content and isinstance(raw_content[key], list):
                return extract_links_list(raw_content[key])

    if isinstance(raw_content, str):
        # Could be JSON string or newline-separated URLs
        try:
            parsed = json.loads(raw_content)
            return extract_links_list(parsed)
        except Exception:
            return [line.strip() for line in raw_content.splitlines() if line.strip().startswith("http")]

    return []


def sanitize_filename(title: str, max_length: int = 80) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9_\-\.\s]', '_', title or "video")
    cleaned = re.sub(r'\s+', '_', cleaned)
    cleaned = cleaned[:max_length].strip('_')
    return cleaned or "video"


def download_highest_quality_video(url: str, temp_dir: str, cookies_path: str = None) -> tuple:
    """
    Downloads highest quality video + audio using yt-dlp and merges losslessly with ffmpeg.
    Returns (local_file_path, video_title, video_id, duration)
    """
    clean_target = clean_url(url)
    
    # Pre-extract info to get title and ID
    ydl_info_opts = {
        'js_runtimes': {'node': {}},
        'remote_components': ['ejs:github'],
        'extractor_args': {
            'youtube': {
                'player_client': ['default', '-tv_samsung', '-web_embedded']
            }
        },
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'extract_flat': False
    }
    if cookies_path and os.path.exists(cookies_path):
        ydl_info_opts['cookiefile'] = cookies_path

    video_title = "video"
    video_id = "unknown"
    duration = "N/A"

    try:
        with yt_dlp.YoutubeDL(ydl_info_opts) as ydl:
            info = ydl.extract_info(clean_target, download=False)
            video_title = info.get("title", "video")
            video_id = info.get("id", "vid")
            dur = info.get("duration")
            if dur:
                duration = f"{dur // 60}m {dur % 60}s"
    except Exception as e:
        print(f"    [!] Metadata pre-fetch warning: {e}")

    safe_title = sanitize_filename(video_title)
    out_template = os.path.join(temp_dir, f"{safe_title}_{video_id}.%(ext)s")

    ydl_opts = {
        'format': 'bestvideo*+bestaudio/best[acodec!=none]/b/best',
        'merge_output_format': 'mp4',
        'js_runtimes': {'node': {}},
        'remote_components': ['ejs:github'],
        'extractor_args': {
            'youtube': {
                'player_client': ['default', '-tv_samsung', '-web_embedded']
            }
        },
        'outtmpl': out_template,
        'quiet': False,
        'no_warnings': True,
        'noplaylist': True,
        'retries': 5,
        'fragment_retries': 5,
    }
    if cookies_path and os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path

    print(f"    [+] Initiating download: '{video_title}'...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([clean_target])

    # Find the resulting file
    expected_mp4 = os.path.join(temp_dir, f"{safe_title}_{video_id}.mp4")
    if os.path.exists(expected_mp4):
        return expected_mp4, video_title, video_id, duration

    # If extension differed or filename got slightly altered:
    for f in os.listdir(temp_dir):
        if video_id in f and (f.endswith(".mp4") or f.endswith(".mkv")):
            return os.path.join(temp_dir, f), video_title, video_id, duration

    raise FileNotFoundError(f"Could not locate merged output file for {video_title} ({video_id})")


def upload_to_drive(webhook_url: str, folder: str, file_path: str, title: str) -> dict:
    """Reads the video binary file, encodes as base64, and pushes to Google Apps Script webhook."""
    filename = os.path.basename(file_path)
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"    [>] Uploading to Google Drive: {filename} ({file_size_mb:.2f} MB)...")

    with open(file_path, "rb") as f:
        file_bytes = f.read()
        file_b64 = base64.b64encode(file_bytes).decode("utf-8")

    payload = {
        "action": "upload",
        "folderUrl": folder,
        "filename": filename,
        "fileBase64": file_b64,
        "mimeType": "video/mp4",
        "title": title
    }

    res = post_webhook(webhook_url, payload, timeout=300)
    return res


def main():
    args = parse_args()
    print("=" * 70)
    print("OmniDownloader - Daily Google Drive Batch Runner")
    print("=" * 70)

    if not args.webhook:
        print("ERROR: Missing Google Apps Script Webhook URL.")
        print("Provide it via --webhook or set DRIVE_WEBHOOK_URL environment variable/secret.")
        sys.exit(1)

    if not args.folder:
        print("ERROR: Missing Google Drive folder URL or ID.")
        print("Provide it via --folder or set DRIVE_FOLDER_URL environment variable/secret.")
        sys.exit(1)

    print(f"Target Drive Folder : {args.folder}")
    print(f"Links JSON Filename : {args.filename}")
    if args.cookies:
        print(f"Cookies File        : {args.cookies} (Active)")

    # 1. Fetch links.json from Drive
    drive_data = fetch_links_from_drive(args.webhook, args.folder, args.filename)
    if drive_data.get("status") != "success":
        print(f"ERROR: Could not retrieve '{args.filename}' from Google Drive.")
        print(f"Details: {drive_data.get('message', drive_data)}")
        sys.exit(1)

    raw_links = drive_data.get("links", [])
    existing_files = set(drive_data.get("existingFiles", []))
    links = extract_links_list(raw_links)

    print(f"[✓] Successfully retrieved '{args.filename}'. Found {len(links)} link(s).")
    print(f"[*] Drive folder currently contains {len(existing_files)} existing file(s).")

    if not links:
        print("[!] No links found inside the JSON file. Exiting.")
        sys.exit(0)

    if args.max_videos > 0:
        links = links[:args.max_videos]
        print(f"[*] Limited to first {args.max_videos} video(s).")

    # 2. Process each link
    temp_dir = tempfile.mkdtemp(prefix="omni_batch_")
    successful = []
    skipped = []
    failed = []

    print("-" * 70)
    for idx, url in enumerate(links, 1):
        print(f"\n[{idx}/{len(links)}] Processing: {url}")
        try:
            # Check if this video might already be in Drive folder (by checking existing names)
            if not args.force:
                # Extract video ID if possible to check against existing files
                vid_m = re.search(r'(?:v=|\/shorts\/|youtu\.be\/|\/reel\/|\/p\/|\/video\/)([a-zA-Z0-9_-]{8,})', url)
                if vid_m and any(vid_m.group(1) in existing_name for existing_name in existing_files):
                    print(f"    [-] Video with ID '{vid_m.group(1)}' already exists in Google Drive. Skipping.")
                    skipped.append(url)
                    continue

            # Download at highest available quality
            local_file, title, vid_id, dur = download_highest_quality_video(url, temp_dir, args.cookies)
            file_size_mb = os.path.getsize(local_file) / (1024 * 1024)
            print(f"    [✓] Downloaded & merged successfully: '{title}' ({dur}) - {file_size_mb:.2f} MB")

            # Upload to Google Drive
            upload_res = upload_to_drive(args.webhook, args.folder, local_file, title)
            if upload_res.get("status") == "success":
                file_url = upload_res.get("fileUrl", "")
                print(f"    [✓] Successfully uploaded to Drive! URL: {file_url}")
                successful.append({
                    "url": url,
                    "title": title,
                    "filename": os.path.basename(local_file),
                    "size_mb": round(file_size_mb, 2),
                    "file_url": file_url
                })
            else:
                err_msg = upload_res.get("message", "Unknown upload error")
                print(f"    [!] Drive upload failed: {err_msg}")
                failed.append({"url": url, "error": err_msg})

            # Cleanup local temp file
            if os.path.exists(local_file):
                os.remove(local_file)

        except Exception as e:
            print(f"    [!] Error processing {url}: {e}")
            failed.append({"url": url, "error": str(e)})

        # Brief pause between videos
        time.sleep(2)

    # 3. Final Summary
    print("\n" + "=" * 70)
    print("BATCH PROCESSING COMPLETED")
    print("=" * 70)
    print(f"Total Links Checked : {len(links)}")
    print(f"Uploaded to Drive   : {len(successful)}")
    print(f"Skipped (Already in): {len(skipped)}")
    print(f"Failed              : {len(failed)}")

    # Update processed history in Google Drive
    if successful:
        try:
            print("\n[*] Updating 'processed_history.json' in Google Drive...")
            post_webhook(args.webhook, {
                "action": "save_history",
                "folderUrl": args.folder,
                "filename": "processed_history.json",
                "history": successful
            }, timeout=30)
            print("[✓] Processed history saved to Drive.")
        except Exception as he:
            print(f"[!] Warning: Could not update history file: {he}")

    # Set GitHub Actions output summary if running in CI
    gh_summary = os.getenv("GITHUB_STEP_SUMMARY")
    if gh_summary:
        with open(gh_summary, "a", encoding="utf-8") as f:
            f.write("# 🎬 OmniDownloader Daily Batch Summary\n\n")
            f.write(f"- **Total Links:** {len(links)}\n")
            f.write(f"- **Successfully Uploaded:** {len(successful)}\n")
            f.write(f"- **Skipped (Already Exists):** {len(skipped)}\n")
            f.write(f"- **Failed:** {len(failed)}\n\n")
            if successful:
                f.write("### 📥 Newly Uploaded Videos\n\n")
                f.write("| Video Title | Size (MB) | File Name |\n| --- | --- | --- |\n")
                for s in successful:
                    f.write(f"| {s['title']} | {s['size_mb']} MB | `{s['filename']}` |\n")

    if failed:
        sys.exit(1 if len(successful) == 0 else 0)


if __name__ == "__main__":
    main()
