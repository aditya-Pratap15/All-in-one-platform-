# 🚀 OmniDownloader - All-in-One Social Video Downloader

> A modern, clean, 100% free and open-source web application to download **YouTube Shorts**, **Instagram Reels**, **Facebook Reels**, **Kuaishou (快手 / Kwai)**, and **TikTok** videos in **full original quality without watermarks**.

Hosted completely free on **GitHub Pages** with zero subscription, ads, or daily limits.

---

## ✨ Features

- **Zero Watermarks:** Extracts the clean raw video stream directly from CDN before platform watermarks are attached.
- **Max Full Quality:** Preserves original resolution and bitrate up to 1080p, 2K, and 4K 60fps.
- **Multi-Platform Support:**
  - 🎥 **YouTube Shorts** (`youtube.com/shorts/...`)
  - 📸 **Instagram Reels** (`instagram.com/reel/...`)
  - 📘 **Facebook Reels** (`facebook.com/reel/...`)
  - ⚡ **Kuaishou / Kwai** (`kuaishou.com/...` or `v.kuaishou.com/...`)
  - 🎵 **TikTok** (`tiktok.com/@user/video/...`)
- **Modern UI:** Built with sleek glassmorphism, glowing gradients, dark/light theme, and mobile responsiveness.
- **Live In-Browser Preview:** Watch the extracted video directly in the web player before downloading.
- **Smart Fallback Engine:** Multi-source API fallback to ensure downloads stay reliable even if one public node is busy.
- **Optional Local / Custom Engine:** Easily connect your own private `yt-dlp` micro-backend or Cobalt instance via settings for unlimited personal use.

---

## 📂 Repository Structure

```text
├── index.html          # Main web application interface
├── style.css           # Glassmorphic responsive styling & theme variables
├── app.js              # Multi-engine extractor & platform auto-detection logic
├── favicon.svg         # Modern gradient logo icon
├── .nojekyll           # Ensures GitHub Pages deploys all static assets smoothly
├── server.py           # (Optional) Local FastAPI + yt-dlp micro-backend
├── requirements.txt    # (Optional) Dependencies for local server
└── README.md           # Documentation and deployment guide
```

---

## 🚀 How to Push This Project to Your GitHub Repository

Follow these terminal commands to push the complete codebase to your repository:

### 1. Open Terminal / PowerShell
Navigate to this project directory:
```bash
cd "C:\Users\prata\.gemini\antigravity\scratch\all-in-one-downloader"
```

### 2. Initialize Git and Stage Files
```bash
git init
git add .
git commit -m "feat: initial commit for OmniDownloader all-in-one platform"
```

### 3. Link Your Remote Repository & Push to `main`
```bash
git branch -M main
git remote add origin https://github.com/aditya-Pratap15/All-in-one-platform-.git
git push -u origin main --force
```

*(Note: If you have a README or license already on GitHub that conflicts, `--force` will override it cleanly with this complete project).*

---

## 🌐 How to Host the Website Free on GitHub Pages

Once your code is pushed to GitHub, turn on GitHub Pages in under 60 seconds:

1. Open your repository in your web browser:  
   👉 **[https://github.com/aditya-Pratap15/All-in-one-platform-](https://github.com/aditya-Pratap15/All-in-one-platform-)**
2. Click on the **Settings** tab at the top of the repository.
3. In the left sidebar, click on **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` from the dropdown and leave the folder as `/(root)`.
   - Click **Save**.
5. Wait **1 to 2 minutes** for GitHub to deploy the site. Refresh the page!
6. Your live website URL will appear at the top:  
   🎉 **`https://aditya-pratap15.github.io/All-in-one-platform-/`**

---

## ⚡ (Optional) Running Your Own Private Engine Locally

If you ever want an offline or 100% private extraction engine with maximum 4K speed:

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the local server:
   ```bash
   python server.py
   ```
3. Open your website (either locally or on your GitHub Pages site).
4. Click the **Settings (gear icon)** at the top right.
5. Choose **Custom Backend / Local yt-dlp API** and set the URL to:
   ```text
   http://localhost:8000
   ```
6. Click **Save Changes** — you now have an unrestricted, private video downloader powered by `yt-dlp`!

---

## 📜 License & Usage

Distributed under the **MIT License**. Free for personal archival and educational use. Always respect content creators' copyrights and terms of service.
