/**
 * OmniDownloader - Client-Side Controller
 * Multi-Platform Media Extractor & Instant Downloader
 * Supports YouTube Shorts, Instagram Reels, Facebook Reels, Kuaishou/Kwai, TikTok
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- DOM Elements ---
  const videoUrlInput = document.getElementById('videoUrlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const qualitySelect = document.getElementById('qualitySelect');
  const downloadBtn = document.getElementById('downloadBtn');
  const detectedPlatformIcon = document.getElementById('detectedPlatformIcon');
  const detectionNotice = document.getElementById('detectionNotice');
  const detectionText = document.getElementById('detectionText');
  
  const loadingState = document.getElementById('loadingState');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const errorActions = document.getElementById('errorActions');
  
  const resultCard = document.getElementById('resultCard');
  const videoThumbnail = document.getElementById('videoThumbnail');
  const videoPlayer = document.getElementById('videoPlayer');
  const audioPlayer = document.getElementById('audioPlayer');
  const previewFallbackNotice = document.getElementById('previewFallbackNotice');
  const resultPlatformBadge = document.getElementById('resultPlatformBadge');
  const resultPlatformText = document.getElementById('resultPlatformText');
  const durationBadge = document.getElementById('durationBadge');
  const videoTitle = document.getElementById('videoTitle');
  const videoAuthor = document.getElementById('videoAuthor');
  
  const qualityBadgeText = document.getElementById('qualityBadgeText');
  const directDownloadBtn = document.getElementById('directDownloadBtn');
  const downloadBtnText = document.getElementById('downloadBtnText');
  const copyLinkBtn = document.getElementById('copyLinkBtn');

  // Mode Tabs & Containers
  const singleModeTab = document.getElementById('singleModeTab');
  const batchModeTab = document.getElementById('batchModeTab');
  const singleInputContainer = document.getElementById('singleInputContainer');
  const batchInputContainer = document.getElementById('batchInputContainer');

  // Batch Mode Elements
  const batchUrlsInput = document.getElementById('batchUrlsInput');
  const batchTextareaWrapper = document.getElementById('batchTextareaWrapper');
  const batchCountBadge = document.getElementById('batchCountBadge');
  const batchPasteBtn = document.getElementById('batchPasteBtn');
  const batchFormatBtn = document.getElementById('batchFormatBtn');
  const batchSampleBtn = document.getElementById('batchSampleBtn');
  const batchClearBtn = document.getElementById('batchClearBtn');
  const batchQualitySelect = document.getElementById('batchQualitySelect');
  const batchFetchBtn = document.getElementById('batchFetchBtn');

  const batchResultCard = document.getElementById('batchResultCard');
  const batchProgressTitle = document.getElementById('batchProgressTitle');
  const batchProgressSubtext = document.getElementById('batchProgressSubtext');
  const batchProgressBar = document.getElementById('batchProgressBar');
  const batchQueueList = document.getElementById('batchQueueList');
  const batchDownloadZipBtn = document.getElementById('batchDownloadZipBtn');
  const batchDownloadSeqBtn = document.getElementById('batchDownloadSeqBtn');

  // Modals & Settings
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const engineSelect = document.getElementById('engineSelect');
  const customApiField = document.getElementById('customApiField');
  const customApiUrl = document.getElementById('customApiUrl');
  const autoPreviewCheck = document.getElementById('autoPreviewCheck');

  // Google Drive Elements
  const singleDriveBox = document.getElementById('singleDriveBox');
  const driveFolderInput = document.getElementById('driveFolderInput');
  const pushToDriveBtn = document.getElementById('pushToDriveBtn');
  const driveUploadStatus = document.getElementById('driveUploadStatus');
  const openDriveSetupBtn = document.getElementById('openDriveSetupBtn');
  const driveConfigLabel = document.getElementById('driveConfigLabel');

  const batchDriveBox = document.getElementById('batchDriveBox');
  const batchDriveFolderInput = document.getElementById('batchDriveFolderInput');
  const batchPushToDriveBtn = document.getElementById('batchPushToDriveBtn');
  const batchDriveStatus = document.getElementById('batchDriveStatus');
  const openBatchDriveSetupBtn = document.getElementById('openBatchDriveSetupBtn');

  const driveSetupModal = document.getElementById('driveSetupModal');
  const closeDriveSetupBtn = document.getElementById('closeDriveSetupBtn');
  const copyGasCodeBtn = document.getElementById('copyGasCodeBtn');
  const modalDriveWebhookInput = document.getElementById('modalDriveWebhookInput');
  const saveDriveWebhookModalBtn = document.getElementById('saveDriveWebhookModalBtn');

  const settingsDriveWebhook = document.getElementById('settingsDriveWebhook');
  const settingsDriveFolder = document.getElementById('settingsDriveFolder');

  // Google Drive State
  let driveWebhookUrl = localStorage.getItem('omni_drive_webhook') || '';
  let driveFolderUrl = localStorage.getItem('omni_drive_folder') || '';

  // Theme & Status Elements
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const engineStatusPill = document.getElementById('engineStatusPill');
  const engineDot = document.getElementById('engineDot');
  const engineStatusText = document.getElementById('engineStatusText');

  // Engine Endpoints
  const LOCAL_ENGINE_URL = 'http://127.0.0.1:8000';
  const CLOUD_ENGINE_URL = 'https://omni-downloader-kb73.onrender.com';

  // State
  let currentVideoData = null;
  let activeEngine = localStorage.getItem('omni_engine') || 'auto';
  let customApi = localStorage.getItem('omni_custom_api') || '';
  let autoPreview = localStorage.getItem('omni_auto_preview') !== 'false';
  let currentMode = 'single';
  let batchItems = [];
  let isLocalEngineOnline = false;
  let isCloudEngineOnline = false;
  let hasLocalEngine = false;
  let hasCloudEngine = false;

  const updateEngineStatusUI = (isLocal, isCloud = true) => {
    if (!engineStatusPill || !engineStatusText) return;
    if (isLocal) {
      engineStatusPill.className = 'engine-status-pill';
      engineStatusPill.title = 'High-Speed Local Engine Active (http://127.0.0.1:8000)';
      engineStatusText.textContent = 'High-Speed Local Engine';
    } else if (isCloud) {
      engineStatusPill.className = 'engine-status-pill cloud-active';
      engineStatusPill.title = '24/7 Cloud Engine Active (omni-downloader-kb73.onrender.com)';
      engineStatusText.textContent = '24/7 Cloud Engine';
    } else {
      engineStatusPill.className = 'engine-status-pill offline';
      engineStatusPill.title = 'Connecting to engine...';
      engineStatusText.textContent = 'Connecting Engine...';
    }
  };

  const checkEngines = async () => {
    // 1. Check local engine first
    try {
      const res = await fetch('http://127.0.0.1:8000/api/status', { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          isLocalEngineOnline = true;
          hasLocalEngine = true;
          isCloudEngineOnline = false;
          hasCloudEngine = false;
          updateEngineStatusUI(true, false);
          return;
        }
      }
    } catch (e) {}

    isLocalEngineOnline = false;
    hasLocalEngine = false;

    // 2. Check 24/7 Render cloud engine
    try {
      const res = await fetch(`${CLOUD_ENGINE_URL}/api/status`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          isCloudEngineOnline = true;
          hasCloudEngine = true;
          updateEngineStatusUI(false, true);
          return;
        }
      }
    } catch (e) {}

    isCloudEngineOnline = false;
    hasCloudEngine = false;
    updateEngineStatusUI(false, false);
  };

  // Initial check on load
  const checkLocalEngine = checkEngines;
  checkEngines();

  // --- Synchronize Audio & Video for Dual-Stream Playback (YouTube) ---
  if (videoPlayer && audioPlayer) {
    videoPlayer.addEventListener('play', () => {
      if (audioPlayer.src) {
        audioPlayer.currentTime = videoPlayer.currentTime;
        audioPlayer.play().catch(() => {});
      }
    });

    videoPlayer.addEventListener('pause', () => {
      if (audioPlayer.src) audioPlayer.pause();
    });

    videoPlayer.addEventListener('seeking', () => {
      if (audioPlayer.src) audioPlayer.currentTime = videoPlayer.currentTime;
    });

    videoPlayer.addEventListener('volumechange', () => {
      if (audioPlayer.src) {
        audioPlayer.volume = videoPlayer.volume;
        audioPlayer.muted = videoPlayer.muted;
      }
    });
  }

  // --- Theme Management ---
  const initTheme = () => {
    const savedTheme = localStorage.getItem('omni_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  };

  const updateThemeIcon = (theme) => {
    if (!themeIcon) return;
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons();
  };

  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('omni_theme', next);
    updateThemeIcon(next);
  });

  initTheme();

  // --- Platform Detection Patterns ---
  const PLATFORMS = {
    youtube: {
      name: 'YouTube Shorts',
      icon: 'play-circle',
      iconImg: 'assets/icons/youtube.png',
      pattern: /(?:youtube\.com\/(?:shorts\/[a-zA-Z0-9_-]{11}|watch\?v=[a-zA-Z0-9_-]{11})|youtu\.be\/[a-zA-Z0-9_-]{11})/i
    },
    instagram: {
      name: 'Instagram Reels',
      icon: 'instagram',
      iconImg: 'assets/icons/instagram.webp',
      pattern: /instagram\.com\/(?:reel|p|tv)\//i
    },
    facebook: {
      name: 'Facebook Reels',
      icon: 'facebook',
      iconImg: 'assets/icons/facebook.png',
      pattern: /(?:facebook\.com\/(?:reel|watch|share|.*\/videos\/)|fb\.watch\/)/i
    },
    kuaishou: {
      name: 'Kuaishou / Kwai',
      icon: 'video',
      iconImg: 'assets/icons/kuaishou.png',
      pattern: /(?:kuaishou\.com|kwai\.com|kwai-video\.com|v\.kuaishou\.com)/i
    },
    tiktok: {
      name: 'TikTok',
      icon: 'music-2',
      iconImg: 'assets/icons/tiktok.avif',
      pattern: /(?:tiktok\.com\/.*video\/|vt\.tiktok\.com)/i
    }
  };

  /**
   * Sanitizes dirty user input (e.g. mobile share captions with Chinese/English text)
   * and extracts only the pure, clean target URL with tracking params stripped.
   */
  const cleanInputUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    const match = raw.match(/https?:\/\/[^\s"'<>]+/i);
    let url = match ? match[0] : raw.trim();
    
    // Strip trailing punctuation often copied from mobile share sheets
    url = url.replace(/[.,;!?，。！？"'\)\]>】）]+$/, '');

    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('instagram.com')) {
        // Strip tracking tokens (?utm_source=...&mdxt=...)
        parsed.search = '';
        return parsed.toString();
      }
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        let v = '';
        if (parsed.pathname.includes('/shorts/')) {
          const m = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
          if (m) v = m[1];
        } else if (parsed.searchParams.has('v')) {
          v = parsed.searchParams.get('v');
        }
        if (v) {
          return `https://www.youtube.com/watch?v=${v}`;
        }
        return parsed.toString();
      }
      if (parsed.hostname.includes('facebook.com') || parsed.hostname.includes('fb.watch')) {
        parsed.search = '';
        return parsed.toString();
      }
    } catch (e) {}

    return url;
  };

  const isProfileOrChannelUrl = (url) => {
    if (!url) return null;
    if (/(?:youtube\.com\/(?:@|channel\/|c\/|user\/))/i.test(url)) {
      return {
        platform: 'YouTube',
        message: 'This is a YouTube Channel link. Please copy and paste a link to an individual Short video.'
      };
    }
    if (/(?:instagram\.com\/(?!reel\/|p\/|tv\/)[a-zA-Z0-9_.-]+\/?$)/i.test(url)) {
      return {
        platform: 'Instagram',
        message: 'This is an Instagram Profile link. Please copy and paste an individual Reel or video link.'
      };
    }
    if (/(?:tiktok\.com\/@[a-zA-Z0-9_.-]+\/?$)/i.test(url)) {
      return {
        platform: 'TikTok',
        message: 'This is a TikTok Creator Profile link. Please open a specific video and copy its link.'
      };
    }
    return null;
  };

  const detectPlatform = (url) => {
    const clean = cleanInputUrl(url);
    for (const [key, val] of Object.entries(PLATFORMS)) {
      if (val.pattern.test(clean)) {
        return { key, ...val, cleanUrl: clean };
      }
    }
    return null;
  };

  const extractYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  // --- Input Event Handlers ---
  const handleUrlChange = () => {
    const raw = videoUrlInput.value.trim();
    if (raw) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }

    const clean = cleanInputUrl(raw);
    const channelNotice = isProfileOrChannelUrl(clean);
    const platform = detectPlatform(clean);
    const platformTags = document.querySelectorAll('.platform-tag');
    platformTags.forEach(tag => tag.classList.remove('active'));

    if (channelNotice) {
      detectedPlatformIcon.innerHTML = `<i data-lucide="alert-triangle"></i>`;
      detectionText.textContent = `Channel Profile link detected — please paste an individual video link`;
      detectionNotice.classList.remove('hidden');
    } else if (platform) {
      if (platform.iconImg) {
        detectedPlatformIcon.innerHTML = `<img src="${platform.iconImg}" class="input-platform-icon-img" alt="${platform.name}" />`;
      } else {
        detectedPlatformIcon.innerHTML = `<i data-lucide="${platform.icon}"></i>`;
      }
      detectionText.textContent = `Detected: ${platform.name}`;
      detectionNotice.classList.remove('hidden');
      
      const matchedTag = document.querySelector(`.platform-tag[data-platform="${platform.key}"]`);
      if (matchedTag) matchedTag.classList.add('active');
    } else {
      detectedPlatformIcon.innerHTML = `<i data-lucide="link-2"></i>`;
      detectionNotice.classList.add('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
  };

  videoUrlInput?.addEventListener('input', handleUrlChange);

  clearBtn?.addEventListener('click', () => {
    videoUrlInput.value = '';
    handleUrlChange();
    videoUrlInput.focus();
  });

  pasteBtn?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        videoUrlInput.value = text.trim();
        handleUrlChange();
        fetchVideo();
      }
    } catch (err) {
      alert('Please paste your video link directly into the input box.');
    }
  });

  videoUrlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      fetchVideo();
    }
  });

  downloadBtn?.addEventListener('click', () => {
    fetchVideo();
  });

  // --- Extractor Implementations ---

  /**
   * Helper: Try local engine or dedicated Render 24/7 cloud engine
   */
  const formatEngineData = (data, cleanUrl) => ({
    title: data.title || 'Video',
    author: data.uploader || 'Creator',
    thumbnail: data.thumbnail || '',
    duration: data.duration ? `${Math.floor(data.duration / 60)}:${data.duration % 60}` : 'Full Video',
    sourceUrl: cleanUrl,
    directUrl: data.url,
    audioUrl: data.audio_url || '',
    qualityLabel: 'Original Quality (Clean No Watermark)'
  });

  const tryBackendEngine = async (cleanUrl, platform = '') => {
    // 1. Try local engine first (instant if running start.bat)
    if (isLocalEngineOnline) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/download?url=${encodeURIComponent(cleanUrl)}`, {
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) return formatEngineData(data, cleanUrl);
        }
      } catch (e) {}
    }

    // 2. Try Render 24/7 Cloud Engine (online anywhere, anytime on any device)
    if (CLOUD_ENGINE_URL && platform !== 'youtube') {
      try {
        const res = await fetch(`${CLOUD_ENGINE_URL}/download?url=${encodeURIComponent(cleanUrl)}`, {
          signal: AbortSignal.timeout(15000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) return formatEngineData(data, cleanUrl);
        }
      } catch (e) {}
    }

    return null;
  };

  /**
   * 1. Kuaishou (快手) / Kwai Extractor
   * Direct high-speed extraction without watermark, original sound preserved.
   */
  const extractKuaishou = async (url) => {
    const clean = cleanInputUrl(url);

    // Method A: Check local / 24-7 Render cloud engine first
    const backend = await tryBackendEngine(clean, 'kuaishou');
    if (backend) return backend;

    // Method B: Multiple CORS Proxies parsing window.INIT_STATE
    const proxyEndpoints = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(clean)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(clean)}`
    ];

    for (const proxyUrl of proxyEndpoints) {
      try {
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          let html = '';
          if (proxyUrl.includes('allorigins.win/get')) {
            const json = await res.json();
            html = json.contents || '';
          } else {
            html = await res.text();
          }

          if (html) {
            const idx = html.indexOf('window.INIT_STATE');
            if (idx !== -1) {
              const scriptPart = html.slice(idx, idx + 45000);
              const endIdx = scriptPart.indexOf('</script>');
              if (endIdx !== -1) {
                const jsCode = scriptPart.slice(0, endIdx).replace('window.INIT_STATE = ', '').trim();
                const cleanJson = jsCode.replace(/;?\s*$/, '');
                try {
                  const state = JSON.parse(cleanJson);
                  for (const k of Object.keys(state)) {
                    const item = state[k];
                    if (item && item.photo) {
                      const photo = item.photo;
                      const videoUrl = (photo.mainMvUrls && photo.mainMvUrls[0]?.url) || photo.photoUrl;
                      const coverUrl = (photo.coverUrls && photo.coverUrls[0]?.url) || '';
                      if (videoUrl) {
                        return {
                          title: photo.caption || 'Kuaishou Video',
                          author: photo.userName || 'Kuaishou Creator',
                          thumbnail: coverUrl,
                          duration: 'Full Video',
                          sourceUrl: clean,
                          directUrl: videoUrl,
                          audioUrl: '',
                          qualityLabel: 'Original HD (Clean No Watermark)'
                        };
                      }
                    }
                  }
                } catch (pe) {}
              }
            }

            const mp4Match = html.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
            if (mp4Match) {
              return {
                title: 'Kuaishou Video',
                author: 'Kuaishou Creator',
                thumbnail: '',
                duration: 'Full Video',
                sourceUrl: clean,
                directUrl: mp4Match[0].replace(/\\u002F/g, '/'),
                audioUrl: '',
                qualityLabel: 'Original HD (No Watermark)'
              };
            }
          }
        }
      } catch (pe) {}
    }

    throw new Error('Unable to extract Kuaishou video. Please verify the link is active.');
  };

  /**
   * 2. Instagram Reels Extractor
   * Direct stream extraction in full original bitrate with crystal clear audio.
   */
  const extractInstagram = async (url) => {
    const clean = cleanInputUrl(url);

    // Method A: Check local / 24-7 Render cloud engine first
    const backend = await tryBackendEngine(clean, 'instagram');
    if (backend) return backend;

    // Method B: Dedicated fast endpoints with 3.5s timeout
    const endpoints = [
      `https://backend1.tioo.eu.org/igdl?url=${encodeURIComponent(clean)}`
    ];

    for (const apiUrl of endpoints) {
      try {
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            let target = Array.isArray(data) ? data[0] : (data.result ? data.result[0] : data);
            if (target && target.url) {
              return {
                title: 'Instagram Reel',
                author: 'Instagram Creator',
                thumbnail: target.thumbnail || '',
                duration: 'Full Reel',
                sourceUrl: clean,
                directUrl: target.url,
                audioUrl: '',
                qualityLabel: '1080p Full HD (Original Audio)'
              };
            }
          } catch (pe) {}
        }
      } catch (e1) {}
    }

    // Method C: Captioned Embed parser with 3.5s timeout
    try {
      const shortcodeMatch = clean.match(/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
      if (shortcodeMatch) {
        const code = shortcodeMatch[1];
        const embedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.instagram.com/reel/${code}/embed/captioned/`)}`;
        const res = await fetch(embedUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const json = await res.json();
          const html = json.contents || '';
          const videoMatch = html.match(/video_url["']\s*:\s*["']([^"']+)["']/i);
          if (videoMatch) {
            const directUrl = videoMatch[1].replace(/\\u0026/g, '&');
            return {
              title: 'Instagram Reel',
              author: 'Instagram Creator',
              thumbnail: '',
              duration: 'Full Reel',
              sourceUrl: clean,
              directUrl: directUrl,
              audioUrl: '',
              qualityLabel: 'Original Quality (Complete Audio)'
            };
          }
        }
      }
    } catch (e2) {}

    throw new Error('Unable to fetch Instagram Reel. Please check that the Reel is publicly viewable.');
  };

  /**
   * 3. Facebook Reels Extractor
   * Combined high resolution MP4 with full audio.
   */
  const extractFacebook = async (url) => {
    const clean = cleanInputUrl(url);

    // Method A: Check local / 24-7 Render cloud engine first
    const backend = await tryBackendEngine(clean, 'facebook');
    if (backend) return backend;

    // Method B: Dedicated Facebook stream extractor with 3.5s timeout
    const endpoints = [
      `https://backend1.tioo.eu.org/fbdown?url=${encodeURIComponent(clean)}`
    ];

    for (const apiUrl of endpoints) {
      try {
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          const bestUrl = data.HD || data.Normal_video || data.sd || data.hd;
          if (bestUrl) {
            return {
              title: 'Facebook Reel',
              author: 'Facebook Creator',
              thumbnail: '',
              duration: 'Full Reel',
              sourceUrl: clean,
              directUrl: bestUrl,
              audioUrl: '',
              qualityLabel: data.HD ? 'HD 1080p (Complete Audio)' : 'SD (Complete Audio)'
            };
          }
        }
      } catch (e1) {}
    }

    throw new Error('Unable to extract Facebook video. Please check that the Reel is publicly viewable.');
  };

  /**
   * 4. YouTube Shorts Extractor (Local Engine + Invidious Nodes)
   */
  const INVIDIOUS_NODES = [
    'https://yt.chocolatemoo53.com',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.tiekoetter.com'
  ];

  const extractYouTubeInvidious = async (url) => {
    const clean = cleanInputUrl(url);

    // Method A: Check local engine first
    const backend = await tryBackendEngine(clean, 'youtube');
    if (backend) return backend;

    const videoId = extractYouTubeId(clean);
    if (!videoId) throw new Error('Could not parse YouTube video ID from URL');

    for (const node of INVIDIOUS_NODES) {
      try {
        const apiUrl = `${node}/api/v1/videos/${videoId}`;
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(3500) });
        if (!res.ok) continue;
        const data = await res.json();
        if (!data || !data.title) continue;

        const rawAdaptive = data.adaptiveFormats || [];
        const rawStreams = data.formatStreams || [];

        let bestVideoUrl = '';
        let bestQualityLabel = '1080p Full HD';
        let bestAudioUrl = '';

        // Progressive audio stream
        const audioStream = rawAdaptive.find(f => f.url && f.type && f.type.includes('audio/mp4')) ||
                            rawAdaptive.find(f => f.url && f.type && f.type.includes('audio/'));
        if (audioStream) {
          bestAudioUrl = audioStream.url;
        }

        // 1. Check if merged audio+video stream exists
        if (rawStreams.length > 0) {
          const merged = rawStreams.filter(s => s.url);
          if (merged.length > 0) {
            const top = merged[merged.length - 1];
            bestVideoUrl = top.url;
            bestQualityLabel = top.resolution || top.qualityLabel || '720p HD (Merged Sound)';
          }
        }

        // 2. Adaptive stream fallback (highest quality mp4)
        if (!bestVideoUrl) {
          const videoStreams = rawAdaptive.filter(f => f.url && f.type && f.type.includes('video/mp4'));
          if (videoStreams.length > 0) {
            const top = videoStreams[videoStreams.length - 1];
            bestVideoUrl = top.url;
            bestQualityLabel = top.qualityLabel || top.resolution || '1080p Full HD';
          }
        }

        if (!bestVideoUrl) continue;

        const thumb = (data.videoThumbnails && data.videoThumbnails[0]) 
          ? data.videoThumbnails[0].url 
          : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          title: data.title || 'YouTube Short',
          author: data.author || 'Creator',
          thumbnail: thumb,
          duration: data.lengthSeconds ? `${data.lengthSeconds}s` : 'Full Length',
          sourceUrl: clean,
          directUrl: bestVideoUrl,
          audioUrl: bestAudioUrl,
          qualityLabel: bestQualityLabel
        };
      } catch (err) {
        continue;
      }
    }

    throw new Error('Public YouTube nodes are currently busy. Please try again in a few moments.');
  };

  /**
   * 5. TikTok Extractor
   */
  const extractTikTok = async (url) => {
    const clean = cleanInputUrl(url);

    // Method A: Check local / Render cloud engine first
    const backend = await tryBackendEngine(clean, 'tiktok');
    if (backend) return backend;

    try {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(clean)}&hd=1`, {
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && (data.data.play || data.data.hdplay)) {
          const d = data.data;
          return {
            title: d.title || 'TikTok Video',
            author: d.author?.nickname || 'TikTok Creator',
            thumbnail: d.cover || '',
            duration: d.duration ? `${d.duration}s` : 'Full Video',
            sourceUrl: clean,
            directUrl: d.hdplay || d.play,
            audioUrl: '',
            qualityLabel: 'Original Bitrate (No Watermark)'
          };
        }
      }
    } catch (e) {}

    throw new Error('Unable to extract TikTok video. Please ensure the video is public.');
  };

  /**
   * Custom / Local yt-dlp backend
   */
  const extractWithCustom = async (url, customEndpoint) => {
    if (!customEndpoint) throw new Error('Please enter your custom backend URL in Settings');
    const endpoint = customEndpoint.replace(/\/+$/, '');
    const clean = cleanInputUrl(url);

    const res = await fetch(`${endpoint}/download?url=${encodeURIComponent(clean)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`Engine returned HTTP ${res.status}`);
    const data = await res.json();

    if (!data.url) throw new Error('Engine did not return a valid stream URL');

    return {
      title: data.title || 'Video',
      author: data.uploader || 'Creator',
      thumbnail: data.thumbnail || '',
      duration: data.duration ? `${Math.floor(data.duration / 60)}:${data.duration % 60}` : 'Short',
      sourceUrl: clean,
      directUrl: data.url,
      audioUrl: '',
      qualityLabel: 'Original HD (Clean Stream)'
    };
  };

  /**
   * Core Reusable Media Extractor with 3x Auto-Retry Engine
   */
  const extractMediaWithRetry = async (cleanUrl, onAttemptStatus = null) => {
    const detected = detectPlatform(cleanUrl);
    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError = null;
    let result = null;

    // Quick health check on local & cloud engine
    await checkEngines();

    while (attempt < MAX_RETRIES) {
      attempt++;
      const attemptLabel = `(Attempt ${attempt}/${MAX_RETRIES})`;

      try {
        // Priority 1: High-Speed Local Engine (Instant, 0s delay, 100% success)
        if (isLocalEngineOnline || activeEngine === 'custom') {
          const endpoint = (activeEngine === 'custom' && customApi) ? customApi : 'http://127.0.0.1:8000';
          if (onAttemptStatus) onAttemptStatus(`Extracting with High-Speed Engine... ${attemptLabel}`);
          try {
            result = await extractWithCustom(cleanUrl, endpoint);
            if (result && result.directUrl) return result;
          } catch (localErr) {
            console.warn('Local engine extraction error, falling back to cloud:', localErr);
            if (activeEngine === 'custom') throw localErr;
          }
        }

        // Priority 2: Direct Platform Cloud Extractors (with strict 3.5s timeouts)
        if (detected?.key === 'kuaishou') {
          if (onAttemptStatus) onAttemptStatus(`Extracting Kuaishou / Kwai video... ${attemptLabel}`);
          result = await extractKuaishou(cleanUrl);
        } else if (detected?.key === 'instagram') {
          if (onAttemptStatus) onAttemptStatus(`Extracting Instagram Reel full quality stream... ${attemptLabel}`);
          result = await extractInstagram(cleanUrl);
        } else if (detected?.key === 'facebook') {
          if (onAttemptStatus) onAttemptStatus(`Extracting Facebook Reel video & audio... ${attemptLabel}`);
          result = await extractFacebook(cleanUrl);
        } else if (detected?.key === 'youtube') {
          if (onAttemptStatus) onAttemptStatus(`Extracting YouTube Short streams... ${attemptLabel}`);
          result = await extractYouTubeInvidious(cleanUrl);
        } else if (detected?.key === 'tiktok') {
          if (onAttemptStatus) onAttemptStatus(`Extracting TikTok video without watermark... ${attemptLabel}`);
          result = await extractTikTok(cleanUrl);
        } else {
          if (onAttemptStatus) onAttemptStatus(`Auto-resolving platform media stream... ${attemptLabel}`);
          try {
            result = await extractFacebook(cleanUrl);
          } catch (e1) {
            try {
              result = await extractKuaishou(cleanUrl);
            } catch (e2) {
              try {
                result = await extractInstagram(cleanUrl);
              } catch (e3) {
                result = await extractYouTubeInvidious(cleanUrl);
              }
            }
          }
        }

        if (result && result.directUrl) {
          result.platform = detected;
          return result;
        } else {
          throw new Error('No downloadable stream found in response.');
        }
      } catch (attemptErr) {
        lastError = attemptErr;
        console.warn(`Extraction attempt ${attempt}/${MAX_RETRIES} failed for ${cleanUrl}:`, attemptErr.message);

        if (attempt < MAX_RETRIES) {
          const delaySec = attempt;
          if (onAttemptStatus) onAttemptStatus(`Server busy. Auto-retrying in ${delaySec}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(res => setTimeout(res, delaySec * 1000));
        }
      }
    }

    throw lastError || new Error('Could not find a downloadable video stream after 3 attempts.');
  };

  // --- Single Video Fetch Function ---
  const fetchVideo = async () => {
    const rawInput = videoUrlInput.value.trim();
    if (!rawInput) {
      showError('Please paste a video link into the input box.');
      return;
    }

    const cleanUrl = cleanInputUrl(rawInput);
    const profileWarning = isProfileOrChannelUrl(cleanUrl);
    if (profileWarning) {
      showError(profileWarning.message, cleanUrl);
      return;
    }

    hideStates();
    loadingState.classList.remove('hidden');
    downloadBtn.disabled = true;

    try {
      const result = await extractMediaWithRetry(cleanUrl, (status) => {
        loadingStatusText.textContent = status;
      });

      // Pre-buffering Step: Pre-fetch video blob into memory for instant 0-second saving!
      loadingStatusText.textContent = 'Pre-buffering video file for instant 0s download...';
      
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 14000);
        const videoRes = await fetch(result.directUrl, {
          signal: ctrl.signal,
          referrerPolicy: 'no-referrer'
        });
        clearTimeout(timeout);

        if (videoRes.ok) {
          result.preloadedBlob = await videoRes.blob();
          result.preloadedBlobUrl = URL.createObjectURL(result.preloadedBlob);
        }
      } catch (blobErr) {
        console.warn('Direct pre-buffering skipped (cross-origin streaming enabled):', blobErr);
      }

      result.sourceUrl = cleanUrl;
      displayResult(result, result.platform);
    } catch (err) {
      console.error(err);
      let userFriendlyMsg = err.message || 'Failed to fetch video.';
      if (userFriendlyMsg.includes('404')) {
        userFriendlyMsg = 'Video not found (404). Ensure the link points directly to a single public reel/short.';
      }
      showError(userFriendlyMsg, cleanUrl, detectPlatform(cleanUrl));
    } finally {
      loadingState.classList.add('hidden');
      downloadBtn.disabled = false;
    }
  };

  // --- Batch Mode Implementation & Format Corrector ---
  /**
   * Batch Format Corrector:
   * Extracts, normalizes, and validates all URLs from user input.
   * Automatically corrects:
   * - Glued / concatenated URLs with no space (e.g. "https://url1https://url2")
   * - Comma, semicolon, pipe, tab, or space-separated URLs
   * - Numbered or bullet lists ("1. https://...", "- https://...")
   * - Social share captions with mixed foreign text & emojis
   * - Trailing commas, punctuation, parentheses, brackets
   * - Multiple consecutive blank lines
   * - Strips tracking query params and removes duplicate URLs
   */
  const parseBatchUrls = (text) => {
    if (!text || typeof text !== 'string') return [];

    // 1. Separate concatenated URLs where http(s) appears immediately after non-whitespace
    let preprocessed = text.replace(/([^\s])(https?:\/\/)/gi, '$1\n$2');

    // 2. Normalize common delimiters (commas, semicolons, pipes, tabs) into newlines
    preprocessed = preprocessed.replace(/[,;\|\t]+/g, '\n');

    // 3. Match all URL sequences: http:// or https:// followed by valid URL characters
    const urlPattern = /https?:\/\/[^\s"'<>,;，；\)\(\]\[`]+/gi;
    const rawMatches = preprocessed.match(urlPattern) || [];

    const extracted = [];
    for (const raw of rawMatches) {
      let trimmed = raw.replace(/[.,;!?，。！？"'\)\]>】）]+$/, '');
      if (!trimmed) continue;
      const clean = cleanInputUrl(trimmed);
      if (clean && !extracted.includes(clean)) {
        extracted.push(clean);
      }
    }
    return extracted;
  };

  /**
   * Auto-corrects the contents of batchUrlsInput into clean, one-URL-per-line format.
   * Rewrites the textarea, triggers a feedback animation, and returns the array of clean URLs.
   */
  const autoCorrectBatchBox = (showFeedback = true) => {
    if (!batchUrlsInput) return [];
    const cleanUrls = parseBatchUrls(batchUrlsInput.value);

    if (cleanUrls.length > 0) {
      const formatted = cleanUrls.join('\n');
      if (batchUrlsInput.value !== formatted) {
        batchUrlsInput.value = formatted;
      }
      updateBatchCount();

      if (showFeedback) {
        const wrapper = batchTextareaWrapper || batchUrlsInput.closest('.textarea-wrapper') || batchUrlsInput;
        wrapper.classList.remove('format-highlight');
        void wrapper.offsetWidth; // trigger reflow for smooth re-animation
        wrapper.classList.add('format-highlight');
        setTimeout(() => wrapper.classList.remove('format-highlight'), 1200);

        if (batchFormatBtn) {
          const original = `<i data-lucide="wand-2"></i> <span>Format Links</span>`;
          batchFormatBtn.innerHTML = `<i data-lucide="check"></i> <span>Formatted (${cleanUrls.length})</span>`;
          if (window.lucide) window.lucide.createIcons();
          setTimeout(() => {
            batchFormatBtn.innerHTML = original;
            if (window.lucide) window.lucide.createIcons();
          }, 2200);
        }
      }
    } else {
      updateBatchCount();
    }
    return cleanUrls;
  };

  const updateBatchCount = () => {
    if (!batchUrlsInput || !batchCountBadge) return;
    const urls = parseBatchUrls(batchUrlsInput.value);
    const count = urls.length;
    batchCountBadge.textContent = `${count} ${count === 1 ? 'link' : 'links'} detected`;
    if (batchFetchBtn) batchFetchBtn.disabled = count === 0;
  };

  batchUrlsInput?.addEventListener('input', updateBatchCount);

  // Auto-correct on paste event
  batchUrlsInput?.addEventListener('paste', () => {
    setTimeout(() => {
      autoCorrectBatchBox(true);
    }, 60);
  });

  batchFormatBtn?.addEventListener('click', () => {
    const urls = autoCorrectBatchBox(true);
    if (urls.length === 0) {
      alert('No valid URLs found in the box to format.');
    }
  });

  batchClearBtn?.addEventListener('click', () => {
    if (batchUrlsInput) batchUrlsInput.value = '';
    updateBatchCount();
    if (batchResultCard) batchResultCard.classList.add('hidden');
    if (batchQueueList) batchQueueList.innerHTML = '';
    batchItems = [];
  });

  batchPasteBtn?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && batchUrlsInput) {
        const existing = batchUrlsInput.value.trim();
        batchUrlsInput.value = existing ? `${existing}\n${text.trim()}` : text.trim();
        autoCorrectBatchBox(true);
      }
    } catch (e) {
      alert('Please paste your links directly into the batch box.');
    }
  });

  batchSampleBtn?.addEventListener('click', () => {
    if (!batchUrlsInput) return;
    batchUrlsInput.value = [
      'https://www.facebook.com/share/r/191Ta2ZpKc/',
      'https://youtube.com/shorts/D-OlJCCs-J8',
      'https://v.kuaishou.com/KaLfeAAT'
    ].join('\n');
    autoCorrectBatchBox(true);
  });

  // Mode Switch Tabs
  singleModeTab?.addEventListener('click', () => {
    currentMode = 'single';
    singleModeTab.classList.add('active');
    batchModeTab.classList.remove('active');
    singleInputContainer.classList.remove('hidden');
    batchInputContainer.classList.add('hidden');
    batchResultCard.classList.add('hidden');
    if (currentVideoData) {
      resultCard.classList.remove('hidden');
    }
    if (window.lucide) window.lucide.createIcons();
  });

  batchModeTab?.addEventListener('click', () => {
    currentMode = 'batch';
    batchModeTab.classList.add('active');
    singleModeTab.classList.remove('active');
    batchInputContainer.classList.remove('hidden');
    singleInputContainer.classList.add('hidden');
    resultCard.classList.add('hidden');
    errorState.classList.add('hidden');
    loadingState.classList.add('hidden');
    detectionNotice.classList.add('hidden');
    if (batchItems.length > 0) {
      batchResultCard.classList.remove('hidden');
    }
    updateBatchCount();
    if (window.lucide) window.lucide.createIcons();
  });

  const createQueueItemDOM = (item) => {
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.id = item.id;

    const platformName = item.platform ? item.platform.name : 'Video';
    const platformIcon = item.platform ? item.platform.icon : 'film';
    const thumbIconHtml = item.platform && item.platform.iconImg
      ? `<img src="${item.platform.iconImg}" class="queue-platform-icon-img" alt="${platformName}" />`
      : `<i data-lucide="${platformIcon}"></i>`;
    const badgeIconHtml = item.platform && item.platform.iconImg
      ? `<img src="${item.platform.iconImg}" class="queue-badge-icon-img" alt="${platformName}" />`
      : `<i data-lucide="${platformIcon}" style="width:12px;height:12px;"></i>`;

    div.innerHTML = `
      <div class="queue-left-col">
        <div class="queue-thumb-wrapper" id="${item.id}-thumb">
          ${thumbIconHtml}
        </div>
        <div class="queue-info">
          <div class="queue-title" id="${item.id}-title" title="${item.url}">${item.url}</div>
          <div class="queue-meta-row">
            <span class="queue-platform-badge">
              ${badgeIconHtml}
              <span>${platformName}</span>
            </span>
            <span class="queue-status-badge pending" id="${item.id}-status">
              <i data-lucide="clock" style="width:12px;height:12px;"></i>
              <span id="${item.id}-status-text">Pending</span>
            </span>
          </div>
        </div>
      </div>
      <div class="queue-actions" id="${item.id}-actions"></div>
    `;
    return div;
  };

  const updateQueueItemDOM = (item, statusText) => {
    const statusEl = document.getElementById(`${item.id}-status`);
    const statusTextEl = document.getElementById(`${item.id}-status-text`);
    const titleEl = document.getElementById(`${item.id}-title`);
    const thumbEl = document.getElementById(`${item.id}-thumb`);
    const actionsEl = document.getElementById(`${item.id}-actions`);

    if (statusEl && statusTextEl) {
      statusEl.className = `queue-status-badge ${item.status}`;
      statusTextEl.textContent = statusText;
    }

    if (item.data) {
      if (titleEl && item.data.title) {
        titleEl.textContent = item.data.title;
      }
      if (thumbEl && item.data.thumbnail) {
        thumbEl.innerHTML = `<img src="${item.data.thumbnail}" class="queue-thumb-img" alt="Thumb" referrerpolicy="no-referrer" />`;
      }
      if (actionsEl && item.status === 'ready') {
        actionsEl.innerHTML = `
          <button type="button" class="mini-btn mini-btn-primary" id="${item.id}-dl-btn">
            <i data-lucide="download"></i> Download
          </button>
          <button type="button" class="mini-btn mini-btn-secondary" id="${item.id}-copy-btn" title="Copy Stream URL">
            <i data-lucide="copy"></i>
          </button>
        `;

        const dlBtn = document.getElementById(`${item.id}-dl-btn`);
        dlBtn?.addEventListener('click', () => {
          const filename = getSafeFilename(item.data.title, 'mp4');
          if (item.data.preloadedBlob) {
            saveBlobLocally(item.data.preloadedBlob, filename);
          } else {
            const originalHtml = dlBtn.innerHTML;
            dlBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Downloading...</span>`;
            if (window.lucide) window.lucide.createIcons();
            triggerFileDownload(item.data.sourceUrl || item.data.directUrl, filename, item.data.directUrl).finally(() => {
              dlBtn.innerHTML = `<i data-lucide="check-circle-2"></i> <span>Downloaded</span>`;
              if (window.lucide) window.lucide.createIcons();
              setTimeout(() => {
                dlBtn.innerHTML = originalHtml;
                if (window.lucide) window.lucide.createIcons();
              }, 3000);
            });
          }
        });

        const copyBtn = document.getElementById(`${item.id}-copy-btn`);
        copyBtn?.addEventListener('click', () => {
          navigator.clipboard.writeText(item.data.directUrl).then(() => {
            copyBtn.innerHTML = `<i data-lucide="check"></i>`;
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
              copyBtn.innerHTML = `<i data-lucide="copy"></i>`;
              if (window.lucide) window.lucide.createIcons();
            }, 2000);
          });
        });
      }
    } else if (item.status === 'error' && actionsEl) {
      actionsEl.innerHTML = `
        <button type="button" class="mini-btn mini-btn-secondary" id="${item.id}-retry-btn">
          <i data-lucide="refresh-cw"></i> Retry
        </button>
      `;
      const retryBtn = document.getElementById(`${item.id}-retry-btn`);
      retryBtn?.addEventListener('click', async () => {
        item.status = 'extracting';
        updateQueueItemDOM(item, 'Retrying...');
        try {
          const data = await extractMediaWithRetry(item.url, (msg) => updateQueueItemDOM(item, msg));
          item.data = data;
          item.status = 'ready';
          updateQueueItemDOM(item, `${data.qualityLabel ? data.qualityLabel.split(' ')[0] : 'HD'} Ready`);
        } catch (e) {
          item.status = 'error';
          updateQueueItemDOM(item, 'Failed');
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }

    if (window.lucide) window.lucide.createIcons();
  };

  const startBatchFetch = async () => {
    // 1. Auto-correct links inside the batch box into clean format FIRST before processing
    const urls = autoCorrectBatchBox(true);
    if (urls.length === 0) {
      alert('Please enter at least one valid video URL.');
      return;
    }

    hideStates();
    batchResultCard.classList.remove('hidden');
    batchQueueList.innerHTML = '';
    batchDownloadZipBtn.disabled = true;
    batchDownloadSeqBtn.disabled = true;
    batchFetchBtn.disabled = true;

    // Build Queue Items
    batchItems = urls.map((url, idx) => ({
      id: `queue-item-${idx}`,
      url,
      platform: detectPlatform(url),
      status: 'pending',
      statusText: 'Waiting in queue...',
      data: null,
      error: null
    }));

    // Render in DOM
    batchItems.forEach(item => {
      batchQueueList.appendChild(createQueueItemDOM(item));
    });

    if (window.lucide) window.lucide.createIcons();
    batchResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    let completedCount = 0;
    const totalCount = batchItems.length;

    const updateBatchProgress = () => {
      const pct = Math.round((completedCount / totalCount) * 100);
      batchProgressBar.style.width = `${pct}%`;
      const readyCount = batchItems.filter(i => i.status === 'ready').length;
      batchProgressTitle.textContent = `Batch Processing (${completedCount}/${totalCount} Completed)`;
      batchProgressSubtext.textContent = `${readyCount} ready to download • ${totalCount - completedCount} in progress`;
    };

    updateBatchProgress();

    // Concurrent Worker Queue (concurrency = 2)
    const CONCURRENCY = 2;
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < batchItems.length) {
        const item = batchItems[nextIndex++];
        item.status = 'extracting';
        updateQueueItemDOM(item, 'Extracting stream...');

        try {
          const data = await extractMediaWithRetry(item.url, (msg) => {
            updateQueueItemDOM(item, msg);
          });

          // Pre-buffer video blob in memory for instant 0s zip & download
          try {
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 12000);
            const res = await fetch(data.directUrl, { signal: ctrl.signal, referrerPolicy: 'no-referrer' });
            clearTimeout(timeout);
            if (res.ok) {
              data.preloadedBlob = await res.blob();
            }
          } catch (be) {}

          item.data = data;
          item.status = 'ready';
          updateQueueItemDOM(item, `${data.qualityLabel ? data.qualityLabel.split(' ')[0] : 'HD'} Ready`);
        } catch (err) {
          item.status = 'error';
          item.error = err.message || 'Failed';
          updateQueueItemDOM(item, item.error.includes('404') ? 'Video 404' : 'Failed');
        } finally {
          completedCount++;
          updateBatchProgress();
        }
      }
    };

    const workerPromises = [];
    for (let i = 0; i < Math.min(CONCURRENCY, batchItems.length); i++) {
      workerPromises.push(worker());
    }
    await Promise.all(workerPromises);

    // Completion
    batchFetchBtn.disabled = false;
    const readyItems = batchItems.filter(i => i.status === 'ready');
    if (readyItems.length > 0) {
      batchDownloadZipBtn.disabled = false;
      batchDownloadSeqBtn.disabled = false;
      if (batchPushToDriveBtn) batchPushToDriveBtn.disabled = false;
      batchProgressTitle.textContent = `Batch Complete! (${readyItems.length}/${totalCount} Ready)`;
      batchProgressSubtext.textContent = `All extracted videos are ready for 1-click ZIP, sequential, or Google Drive upload.`;
    } else {
      batchProgressTitle.textContent = `Batch Finished (0 of ${totalCount} Succeeded)`;
      batchProgressSubtext.textContent = `Please verify that the URLs point to active, public videos.`;
    }

    if (window.lucide) window.lucide.createIcons();
  };

  batchFetchBtn?.addEventListener('click', startBatchFetch);

  // Download All as ZIP
  batchDownloadZipBtn?.addEventListener('click', async () => {
    const readyItems = batchItems.filter(i => i.status === 'ready' && i.data);
    if (readyItems.length === 0) return;

    if (typeof JSZip === 'undefined') {
      alert('ZIP archive module is still loading. Please use "Download Sequentially" or try again in a moment.');
      return;
    }

    const originalHtml = batchDownloadZipBtn.innerHTML;
    batchDownloadZipBtn.disabled = true;
    batchDownloadZipBtn.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i> <span>Creating ZIP Archive...</span>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const zip = new JSZip();
      let addedCount = 0;

      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        const filename = `${i + 1}_${getSafeFilename(item.data.title, 'mp4')}`;

        if (item.data.preloadedBlob) {
          zip.file(filename, item.data.preloadedBlob);
          addedCount++;
        } else {
          try {
            const r = await fetch(item.data.directUrl, { referrerPolicy: 'no-referrer' });
            if (r.ok) {
              const b = await r.blob();
              zip.file(filename, b);
              addedCount++;
            }
          } catch (e) {
            console.warn(`Could not add ${filename} to zip due to cross-origin CDN restriction:`, e);
          }
        }
      }

      if (addedCount > 0) {
        batchDownloadZipBtn.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i> <span>Compressing ZIP...</span>`;
        if (window.lucide) window.lucide.createIcons();
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveBlobLocally(zipBlob, `OmniDownloader_Batch_${Date.now()}.zip`);
        batchDownloadZipBtn.innerHTML = `<i data-lucide="check-circle-2"></i> <span>ZIP Downloaded!</span>`;
      } else {
        alert('Due to browser cross-origin protection on these video hosts, please click "Download Sequentially" to save each video directly!');
      }
    } catch (zipErr) {
      console.error('ZIP error:', zipErr);
      alert('Could not generate ZIP archive. Please use "Download Sequentially" instead.');
    } finally {
      setTimeout(() => {
        batchDownloadZipBtn.innerHTML = originalHtml;
        batchDownloadZipBtn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
      }, 3500);
    }
  });

  // Download All Sequentially
  batchDownloadSeqBtn?.addEventListener('click', () => {
    const readyItems = batchItems.filter(i => i.status === 'ready' && i.data);
    if (readyItems.length === 0) return;

    readyItems.forEach((item, index) => {
      setTimeout(() => {
        const filename = `${index + 1}_${getSafeFilename(item.data.title, 'mp4')}`;
        if (item.data.preloadedBlob) {
          saveBlobLocally(item.data.preloadedBlob, filename);
        } else {
          triggerFileDownload(item.data.sourceUrl || item.data.directUrl, filename, item.data.directUrl);
        }
      }, index * 900);
    });

    const originalHtml = batchDownloadSeqBtn.innerHTML;
    batchDownloadSeqBtn.innerHTML = `<i data-lucide="check-circle-2"></i> <span>Downloads Initiated!</span>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      batchDownloadSeqBtn.innerHTML = originalHtml;
      if (window.lucide) window.lucide.createIcons();
    }, 4000);
  });

  // --- Display Result (Single Download Button, Pre-Buffered, Complete Sound) ---
  const displayResult = (data, platform) => {
    currentVideoData = data;
    hideStates();
    resultCard.classList.remove('hidden');

    // Title & Metadata
    videoTitle.textContent = data.title || 'Shorts / Reel Video';
    videoAuthor.textContent = `Creator: ${data.author || 'Original Author'}`;
    durationBadge.textContent = data.duration || 'Full Quality';
    
    const slot = document.getElementById('resultPlatformIconSlot');
    if (platform && platform.iconImg) {
      if (slot) slot.innerHTML = `<img src="${platform.iconImg}" class="result-platform-icon-img" alt="${platform.name}" />`;
      resultPlatformText.textContent = platform.name;
    } else {
      if (slot) slot.innerHTML = `<i data-lucide="film"></i>`;
      resultPlatformText.textContent = platform ? platform.name : 'Video';
    }

    // Player setup: use pre-buffered blob if available, otherwise direct stream
    videoPlayer.classList.remove('hidden');
    videoThumbnail.classList.add('hidden');
    previewFallbackNotice.classList.add('hidden');

    if (data.thumbnail) {
      videoPlayer.poster = data.thumbnail;
      videoThumbnail.src = data.thumbnail;
    } else {
      videoPlayer.removeAttribute('poster');
    }

    const playSource = data.preloadedBlobUrl || data.directUrl;
    videoPlayer.muted = false;
    videoPlayer.volume = 1.0;
    videoPlayer.src = playSource;
    videoPlayer.load();

    // Secondary audio track synchronization if separate audio stream exists
    if (data.audioUrl) {
      audioPlayer.src = data.audioUrl;
      audioPlayer.volume = 1.0;
      audioPlayer.muted = false;
      audioPlayer.load();
    } else {
      audioPlayer.removeAttribute('src');
    }

    videoPlayer.onerror = () => {
      console.warn('Video preview element error on CDN URL');
      videoPlayer.classList.add('hidden');
      if (data.thumbnail) videoThumbnail.classList.remove('hidden');
      previewFallbackNotice.classList.remove('hidden');
    };

    // Quality Badge
    if (qualityBadgeText) {
      qualityBadgeText.textContent = `${data.qualityLabel || 'Highest Resolution Fetched'} • Ready to Save`;
    }

    // Single Download Button
    if (downloadBtnText) {
      downloadBtnText.textContent = `Download Video (${data.qualityLabel ? data.qualityLabel.split(' ')[0] : 'Highest Quality'})`;
    }

    // Google Drive Single Upload Handler
    if (pushToDriveBtn) {
      if (driveFolderInput && !driveFolderInput.value && driveFolderUrl) {
        driveFolderInput.value = driveFolderUrl;
      }
      if (driveUploadStatus) {
        driveUploadStatus.classList.add('hidden');
        driveUploadStatus.innerHTML = '';
      }
      pushToDriveBtn.onclick = () => {
        const folder = (driveFolderInput ? driveFolderInput.value : '').trim() || driveFolderUrl;
        const filename = getSafeFilename(data.title, 'mp4');
        uploadToGoogleDrive(data, folder, filename, driveUploadStatus, pushToDriveBtn);
      };
    }

    // INSTANT DOWNLOAD HANDLER (0 Delay):
    directDownloadBtn.onclick = () => {
      const filename = getSafeFilename(data.title, 'mp4');
      
      if (data.preloadedBlob && data.preloadedBlob.size > 1000) {
        // Instant save from pre-buffered RAM! Zero waiting, zero loading spinner!
        saveBlobLocally(data.preloadedBlob, filename);
        indicateSuccess('Saved to Downloads!');
      } else {
        // Direct save trigger with sourceUrl as priority so backend downloads full video with audio
        triggerFileDownload(data.sourceUrl || data.directUrl, filename, data.directUrl);
      }
    };

    // Copy stream link button
    copyLinkBtn.onclick = () => {
      navigator.clipboard.writeText(data.directUrl).then(() => {
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = `<i data-lucide="check"></i> <span>Copied Link!</span>`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          copyLinkBtn.innerHTML = originalText;
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      });
    };

    if (window.lucide) window.lucide.createIcons();
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // --- Save File to Computer with Zero Delay ---
  const saveBlobLocally = (blob, filename) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  };

  let indicateTimer = null;
  const indicateSuccess = (msg = 'Download Started!', keep = false) => {
    if (!directDownloadBtn) return;
    if (indicateTimer) clearTimeout(indicateTimer);
    const originalText = `<i data-lucide="download"></i> <span>Download Video</span>`;
    const isSpinner = msg.toLowerCase().includes('downloading') || msg.toLowerCase().includes('saving') || msg.toLowerCase().includes('preparing');
    const icon = isSpinner ? 'loader-2' : 'check-circle-2';
    const spinClass = isSpinner ? ' class="spin"' : '';
    directDownloadBtn.innerHTML = `<i data-lucide="${icon}"${spinClass}></i> <span>${msg}</span>`;
    if (window.lucide) window.lucide.createIcons();
    if (!keep) {
      indicateTimer = setTimeout(() => {
        directDownloadBtn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }, 4000);
    }
  };

  const triggerFileDownload = async (sourceUrl, filename, directUrl = '') => {
    if (!sourceUrl && !directUrl) return;

    indicateSuccess('Initiating download...', false);

    await checkEngines();
    const isYouTube = (sourceUrl && (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')));

    // 1. If Local Engine is running (start.bat on PC):
    // Downloads 100% full merged audio+video for ALL platforms including YouTube
    if (isLocalEngineOnline) {
      const targetUrl = sourceUrl || directUrl;
      const downloadProxyUrl = `${LOCAL_ENGINE_URL}/api/download-file?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(filename)}`;

      const a = document.createElement('a');
      a.href = downloadProxyUrl;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch (e) {}
      }, 1000);

      indicateSuccess('Download started in browser!');
      return;
    }

    // 2. If online on 24/7 Cloud Engine (Render.com) & NOT YouTube:
    // Works for Instagram, Facebook, TikTok, Kuaishou
    if (isCloudEngineOnline && !isYouTube) {
      const targetUrl = sourceUrl || directUrl;
      const downloadProxyUrl = `${CLOUD_ENGINE_URL}/api/download-file?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(filename)}`;

      const a = document.createElement('a');
      a.href = downloadProxyUrl;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch (e) {}
      }, 1000);

      indicateSuccess('Download started in browser!');
      return;
    }

    // 3. YouTube when Local Engine is NOT running:
    // Never send YouTube to Render (prevents the 500 error page). Prompt user to open start.bat
    if (isYouTube && !isLocalEngineOnline) {
      indicateSuccess('Start start.bat on PC for YouTube!', false);
      alert('To download YouTube videos with complete merged audio without bot blocks:\n\nPlease run start.bat in your D:\\all-in-one-downloader folder (or visit http://127.0.0.1:8000).\n\nThe engine is already ready to download all your YouTube videos instantly!');
      return;
    }

    // 4. Direct in-memory blob saving fallback:
    const streamUrl = directUrl || sourceUrl;
    if (streamUrl) {
      try {
        indicateSuccess('Saving video to computer...', true);
        const res = await fetch(streamUrl, { referrerPolicy: 'no-referrer' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 1000) {
            saveBlobLocally(blob, filename);
            indicateSuccess('Saved to Downloads!');
            return;
          }
        }
      } catch (e) {
        console.warn('Direct stream blob fetch bypassed:', e);
      }

      // Hidden iframe fallback (Triggers download without navigating away)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = streamUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch (e) {}
      }, 15000);

      indicateSuccess('Download started in browser!');
      return;
    }
  };

  const getSafeFilename = (title, ext = 'mp4') => {
    const clean = (title || 'video')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 45);
    return `${clean || 'download'}_nowatermark.${ext}`;
  };

  // --- Error Handling ---
  const showError = (msg, url = '', platform = null) => {
    hideStates();
    errorState.classList.remove('hidden');
    errorMessage.textContent = msg;

    errorActions.innerHTML = '';
    
    // Add 1-click Retry button
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'inline-btn';
    retryBtn.style.marginRight = '8px';
    retryBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Retry (3 Attempts)`;
    retryBtn.onclick = () => fetchVideo();
    errorActions.appendChild(retryBtn);

    if (url) {
      const openDirectBtn = document.createElement('a');
      openDirectBtn.className = 'inline-btn';
      openDirectBtn.href = url;
      openDirectBtn.target = '_blank';
      openDirectBtn.innerHTML = `<i data-lucide="external-link"></i> Open Original Link`;
      errorActions.appendChild(openDirectBtn);

      const tipsNotice = document.createElement('span');
      tipsNotice.className = 'setting-help';
      tipsNotice.style.marginTop = '8px';
      tipsNotice.textContent = platform?.key === 'instagram' 
        ? 'Tip: Ensure the Instagram Reel is from a public account.'
        : 'Tip: You can run our local Python backend (server.py) for 100% unrestricted private downloads.';
      errorActions.appendChild(tipsNotice);
    }

    if (window.lucide) window.lucide.createIcons();
  };

  const hideStates = () => {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultCard.classList.add('hidden');
  };

  // --- Google Drive Integration Engine ---
  const GAS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderId = extractFolderId(data.folderUrl || data.folderId);
    var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    var filename = data.filename || ('video_' + Date.now() + '.mp4');
    var file;

    if (data.fileBase64) {
      var bytes = Utilities.base64Decode(data.fileBase64);
      var blob = Utilities.newBlob(bytes, data.mimeType || 'video/mp4', filename);
      file = folder.createFile(blob);
    } else if (data.videoUrl) {
      var response = UrlFetchApp.fetch(data.videoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, muteHttpExceptions: true });
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        var blob = response.getBlob().setName(filename);
        file = folder.createFile(blob);
      } else {
        throw new Error('Could not fetch video stream (HTTP ' + response.getResponseCode() + ')');
      }
    } else {
      throw new Error('No video URL or data provided');
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Uploaded to Google Drive successfully!',
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      folderUrl: folder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function extractFolderId(urlOrId) {
  if (!urlOrId) return null;
  var str = urlOrId.trim();
  var match = str.match(/folders\\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  var matchId = str.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) return str;
  return null;
}`;

  const extractDriveFolderId = (urlOrId) => {
    if (!urlOrId) return '';
    const str = urlOrId.trim();
    const match = str.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    const matchId = str.match(/id=([a-zA-Z0-9_-]+)/);
    if (matchId) return matchId[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) return str;
    return str;
  };

  const updateDriveConfigLabels = () => {
    const isConfigured = !!driveWebhookUrl;
    if (driveConfigLabel) {
      driveConfigLabel.textContent = isConfigured ? 'Webhook Configured' : 'Setup Webhook';
    }
    if (openBatchDriveSetupBtn) {
      const span = openBatchDriveSetupBtn.querySelector('span');
      if (span) span.textContent = isConfigured ? 'Webhook Configured' : 'Setup Webhook';
    }
  };

  const openDriveSetup = () => {
    if (modalDriveWebhookInput) modalDriveWebhookInput.value = driveWebhookUrl;
    driveSetupModal?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  const closeDriveSetup = () => {
    driveSetupModal?.classList.add('hidden');
  };

  openDriveSetupBtn?.addEventListener('click', openDriveSetup);
  openBatchDriveSetupBtn?.addEventListener('click', openDriveSetup);
  closeDriveSetupBtn?.addEventListener('click', closeDriveSetup);
  driveSetupModal?.addEventListener('click', (e) => {
    if (e.target === driveSetupModal) closeDriveSetup();
  });

  copyGasCodeBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(GAS_SCRIPT_TEMPLATE).then(() => {
      const origHtml = copyGasCodeBtn.innerHTML;
      copyGasCodeBtn.innerHTML = `<i data-lucide="check"></i> <span>Copied!</span>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        copyGasCodeBtn.innerHTML = origHtml;
        if (window.lucide) window.lucide.createIcons();
      }, 2500);
    });
  });

  saveDriveWebhookModalBtn?.addEventListener('click', () => {
    const val = (modalDriveWebhookInput?.value || '').trim();
    if (!val) {
      alert('Please paste your Google Apps Script Web App URL.');
      return;
    }
    driveWebhookUrl = val;
    localStorage.setItem('omni_drive_webhook', driveWebhookUrl);
    updateDriveConfigLabels();
    closeDriveSetup();
    alert('Google Drive Webhook configured successfully! You can now push any video directly to your Drive folder.');
  });

  // Sync folder inputs and remember default
  const syncDriveFolderInputs = (val) => {
    driveFolderUrl = val;
    localStorage.setItem('omni_drive_folder', val);
    if (driveFolderInput && driveFolderInput.value !== val) driveFolderInput.value = val;
    if (batchDriveFolderInput && batchDriveFolderInput.value !== val) batchDriveFolderInput.value = val;
  };

  driveFolderInput?.addEventListener('input', (e) => syncDriveFolderInputs(e.target.value.trim()));
  batchDriveFolderInput?.addEventListener('input', (e) => syncDriveFolderInputs(e.target.value.trim()));

  if (driveFolderUrl) {
    if (driveFolderInput) driveFolderInput.value = driveFolderUrl;
    if (batchDriveFolderInput) batchDriveFolderInput.value = driveFolderUrl;
  }
  updateDriveConfigLabels();

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // Core Google Drive Upload Handler
  const uploadToGoogleDrive = async (videoData, folderInputVal, filename, statusBox, actionBtn) => {
    if (!driveWebhookUrl) {
      openDriveSetup();
      return false;
    }

    const folder = (folderInputVal || '').trim();
    if (!folder) {
      if (statusBox) {
        statusBox.className = 'drive-status-box error';
        statusBox.innerHTML = '<i data-lucide="alert-circle"></i> <span>Please paste your Google Drive folder link or ID above!</span>';
        statusBox.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
      return false;
    }

    syncDriveFolderInputs(folder);

    const originalBtnHtml = actionBtn ? actionBtn.innerHTML : '';
    if (actionBtn) {
      actionBtn.disabled = true;
      actionBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Processing Drive Push...</span>';
      if (window.lucide) window.lucide.createIcons();
    }

    if (statusBox) {
      statusBox.className = 'drive-status-box loading';
      statusBox.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Preparing video and pushing to Google Drive...</span>';
      statusBox.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    await checkEngines();

    try {
      let result = null;

      // Method A: If Local Engine is running (start.bat on PC):
      // The local engine downloads & merges complete video+audio with ffmpeg, converts to binary,
      // and sends to your Google Apps Script webhook. 100% bypass of 403 Forbidden token errors!
      if (isLocalEngineOnline) {
        if (statusBox) {
          statusBox.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Local Engine: Merging full audio & uploading to Drive...</span>';
          if (window.lucide) window.lucide.createIcons();
        }

        const res = await fetch(`${LOCAL_ENGINE_URL}/api/upload-drive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: videoData.sourceUrl || videoData.directUrl,
            folder_url: folder,
            filename: filename,
            webhook_url: driveWebhookUrl,
            title: videoData.title
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Local engine upload returned HTTP ${res.status}`);
        }
        result = await res.json();
      } else {
        // Method B: Browser direct push (GitHub Pages)
        let fileBase64 = null;

        // If preloaded blob exists in memory, use it directly (bypasses 403 CDN locks)
        if (videoData.preloadedBlob && videoData.preloadedBlob.size > 1000) {
          if (statusBox) {
            statusBox.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Pushing buffered video to Google Drive...</span>';
            if (window.lucide) window.lucide.createIcons();
          }
          fileBase64 = await blobToBase64(videoData.preloadedBlob);
        } else if (videoData.directUrl) {
          try {
            const blobRes = await fetch(videoData.directUrl, { referrerPolicy: 'no-referrer' });
            if (blobRes.ok) {
              const b = await blobRes.blob();
              fileBase64 = await blobToBase64(b);
            }
          } catch (be) {}
        }

        const payload = {
          folderUrl: folder,
          filename: filename || 'video.mp4',
          title: videoData.title || 'Video'
        };

        if (fileBase64) {
          payload.fileBase64 = fileBase64;
          payload.mimeType = 'video/mp4';
        } else {
          payload.videoUrl = videoData.directUrl || videoData.url || '';
        }

        const res = await fetch(driveWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        result = await res.json();
      }

      if (result && result.status === 'success') {
        const folderId = extractDriveFolderId(folder);
        const viewLink = result.fileUrl || (folderId ? `https://drive.google.com/drive/folders/${folderId}` : 'https://drive.google.com');

        if (statusBox) {
          statusBox.className = 'drive-status-box success';
          statusBox.innerHTML = `<i data-lucide="check-circle-2"></i> <span>Uploaded to Drive successfully!</span> <a href="${viewLink}" target="_blank" rel="noopener noreferrer">View in Google Drive <i data-lucide="external-link" style="width:12px;height:12px;vertical-align:middle;"></i></a>`;
          statusBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }

        if (actionBtn) {
          actionBtn.innerHTML = '<i data-lucide="check"></i> <span>Pushed!</span>';
          if (window.lucide) window.lucide.createIcons();
        }
        return true;
      } else {
        throw new Error((result && result.message) || 'Google Drive upload rejected.');
      }
    } catch (err) {
      console.error('Drive upload error:', err);
      let errMsg = err.message || 'Drive transfer failed.';
      if (errMsg.includes('403')) {
        errMsg = 'YouTube stream token expired (HTTP 403). For YouTube videos, run start.bat so the local engine uploads merged HD audio+video directly!';
      }
      if (statusBox) {
        statusBox.className = 'drive-status-box error';
        statusBox.innerHTML = `<i data-lucide="alert-circle"></i> <span>${errMsg}</span>`;
        statusBox.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
      return false;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
        setTimeout(() => {
          actionBtn.innerHTML = originalBtnHtml;
          if (window.lucide) window.lucide.createIcons();
        }, 4500);
      }
    }
  };

  // Batch Push All to Google Drive
  batchPushToDriveBtn?.addEventListener('click', async () => {
    if (!driveWebhookUrl) {
      openDriveSetup();
      return;
    }

    const folder = (batchDriveFolderInput ? batchDriveFolderInput.value : '').trim() || driveFolderUrl;
    if (!folder) {
      if (batchDriveStatus) {
        batchDriveStatus.className = 'drive-status-box error';
        batchDriveStatus.innerHTML = '<i data-lucide="alert-circle"></i> <span>Please paste your target Google Drive folder link above!</span>';
        batchDriveStatus.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
      return;
    }

    const readyItems = batchItems.filter(i => i.status === 'ready' && i.data);
    if (readyItems.length === 0) return;

    syncDriveFolderInputs(folder);

    const originalBtnHtml = batchPushToDriveBtn.innerHTML;
    batchPushToDriveBtn.disabled = true;
    batchPushToDriveBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Pushing Batch (0/${readyItems.length})...</span>`;
    if (window.lucide) window.lucide.createIcons();

    if (batchDriveStatus) {
      batchDriveStatus.className = 'drive-status-box loading';
      batchDriveStatus.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Transferring batch into your Drive folder (0 of ${readyItems.length})...</span>`;
      batchDriveStatus.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    let successCount = 0;
    for (let index = 0; index < readyItems.length; index++) {
      const item = readyItems[index];
      const filename = `${index + 1}_${getSafeFilename(item.data.title, 'mp4')}`;

      batchPushToDriveBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Pushing (${index + 1}/${readyItems.length})...</span>`;
      if (batchDriveStatus) {
        batchDriveStatus.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Pushing ${index + 1} of ${readyItems.length}: <strong>${escapeHtml(item.data.title || 'Video')}</strong></span>`;
      }
      if (window.lucide) window.lucide.createIcons();

      try {
        const ok = await uploadToGoogleDrive(item.data, folder, filename, null, null);
        if (ok) {
          successCount++;
          updateQueueItemDOM(item, 'Pushed to Drive');
        }
      } catch (err) {
        console.warn(`Batch Drive push error on item ${index + 1}:`, err);
      }
    }

    const folderId = extractDriveFolderId(folder);
    const viewLink = folderId ? `https://drive.google.com/drive/folders/${folderId}` : 'https://drive.google.com';

    batchPushToDriveBtn.disabled = false;
    batchPushToDriveBtn.innerHTML = `<i data-lucide="check-circle-2"></i> <span>Batch Pushed!</span>`;

    if (batchDriveStatus) {
      batchDriveStatus.className = 'drive-status-box success';
      batchDriveStatus.innerHTML = `<i data-lucide="check-circle-2"></i> <span>Finished! ${successCount} of ${readyItems.length} videos pushed to your Google Drive folder!</span> <a href="${viewLink}" target="_blank" rel="noopener noreferrer">Open Drive Folder <i data-lucide="external-link" style="width:12px;height:12px;vertical-align:middle;"></i></a>`;
      if (window.lucide) window.lucide.createIcons();
    }

    setTimeout(() => {
      batchPushToDriveBtn.innerHTML = originalBtnHtml;
      if (window.lucide) window.lucide.createIcons();
    }, 5000);
  });

  // --- Settings Modal Handlers ---
  settingsBtn?.addEventListener('click', () => {
    engineSelect.value = activeEngine;
    customApiUrl.value = customApi;
    autoPreviewCheck.checked = autoPreview;
    if (settingsDriveWebhook) settingsDriveWebhook.value = driveWebhookUrl;
    if (settingsDriveFolder) settingsDriveFolder.value = driveFolderUrl;
    toggleCustomField();
    settingsModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  });

  const closeSettings = () => settingsModal.classList.add('hidden');
  closeSettingsBtn?.addEventListener('click', closeSettings);
  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  const toggleCustomField = () => {
    if (engineSelect.value === 'custom') {
      customApiField.classList.remove('hidden');
    } else {
      customApiField.classList.add('hidden');
    }
  };

  engineSelect?.addEventListener('change', toggleCustomField);

  saveSettingsBtn?.addEventListener('click', () => {
    activeEngine = engineSelect.value;
    customApi = customApiUrl.value.trim();
    autoPreview = autoPreviewCheck.checked;

    if (settingsDriveWebhook) {
      driveWebhookUrl = settingsDriveWebhook.value.trim();
      localStorage.setItem('omni_drive_webhook', driveWebhookUrl);
    }
    if (settingsDriveFolder) {
      driveFolderUrl = settingsDriveFolder.value.trim();
      localStorage.setItem('omni_drive_folder', driveFolderUrl);
      syncDriveFolderInputs(driveFolderUrl);
    }
    updateDriveConfigLabels();

    localStorage.setItem('omni_engine', activeEngine);
    localStorage.setItem('omni_custom_api', customApi);
    localStorage.setItem('omni_auto_preview', autoPreview);

    closeSettings();
    alert('Settings saved successfully!');
  });
});
