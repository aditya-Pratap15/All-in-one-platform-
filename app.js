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

  // Modals & Settings
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const engineSelect = document.getElementById('engineSelect');
  const customApiField = document.getElementById('customApiField');
  const customApiUrl = document.getElementById('customApiUrl');
  const autoPreviewCheck = document.getElementById('autoPreviewCheck');

  // Theme
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  // State
  let currentVideoData = null;
  let activeEngine = localStorage.getItem('omni_engine') || 'auto';
  let customApi = localStorage.getItem('omni_custom_api') || '';
  let autoPreview = localStorage.getItem('omni_auto_preview') !== 'false';

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
    kuaishou: {
      name: 'Kuaishou / Kwai',
      icon: 'video',
      pattern: /(?:kuaishou\.com|kwai\.com|kwai-video\.com|v\.kuaishou\.com)/i
    },
    instagram: {
      name: 'Instagram Reels',
      icon: 'instagram',
      pattern: /instagram\.com\/(?:reel|p|tv)\//i
    },
    youtube: {
      name: 'YouTube Shorts',
      icon: 'play-circle',
      pattern: /(?:youtube\.com\/(?:shorts\/[a-zA-Z0-9_-]{11}|watch\?v=[a-zA-Z0-9_-]{11})|youtu\.be\/[a-zA-Z0-9_-]{11})/i
    },
    facebook: {
      name: 'Facebook Reels',
      icon: 'facebook',
      pattern: /(?:facebook\.com\/(?:reel|watch|share|.*\/videos\/)|fb\.watch\/)/i
    },
    tiktok: {
      name: 'TikTok',
      icon: 'music-2',
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
    url = url.replace(/[.,;!?，。！？"'\)\]]+$/, '');

    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('instagram.com')) {
        // Strip tracking tokens (?utm_source=...&mdxt=...)
        parsed.search = '';
        return parsed.toString();
      }
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        if (parsed.pathname.includes('/shorts/')) {
          parsed.search = '';
        } else if (parsed.searchParams.has('v')) {
          const v = parsed.searchParams.get('v');
          parsed.search = `?v=${v}`;
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
      detectedPlatformIcon.innerHTML = `<i data-lucide="${platform.icon}"></i>`;
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
   * 1. Kuaishou (快手) / Kwai Extractor
   * Direct high-speed extraction without watermark, original sound preserved.
   */
  const extractKuaishou = async (url) => {
    const clean = cleanInputUrl(url);
    
    // Method A: Dedicated API endpoint (clean fetch without custom headers for CORS)
    try {
      const apiUrl = `https://backend1.tioo.eu.org/kuaishou?url=${encodeURIComponent(clean)}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        const info = data.result || data;
        const videoUrl = info.videoUrl || info.url;
        if (videoUrl) {
          const resLabel = (info.width && info.height) ? `${info.width}x${info.height} HD` : 'Original HD';
          return {
            title: info.title || 'Kuaishou Video',
            author: info.author || info.username || 'Kuaishou Creator',
            thumbnail: info.thumbnail || '',
            duration: info.duration ? `${Math.round(info.duration / 1000)}s` : 'Original Length',
            sourceUrl: clean,
            directUrl: videoUrl,
            audioUrl: '',
            qualityLabel: `${resLabel} (Clean No Watermark)`
          };
        }
      }
    } catch (e1) {
      console.warn('Kuaishou primary endpoint error:', e1);
    }

    // Method B: Direct HTML Redirect & Apollo State Scraper via CORS proxy
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(clean)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const html = await res.text();
        const photoUrlMatch = html.match(/["']photoUrl["']\s*:\s*["']([^"']+)["']/i) ||
                              html.match(/https?:\/\/[^"']+\.kwaicdn\.com\/[^"']+\.mp4[^"']*/i);
        if (photoUrlMatch) {
          const videoUrl = (photoUrlMatch[1] || photoUrlMatch[0]).replace(/\\u002F/g, '/');
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          return {
            title: titleMatch ? titleMatch[1].replace(/ - 快手.*$/, '') : 'Kuaishou Video',
            author: 'Kuaishou Creator',
            thumbnail: '',
            duration: 'Full Video',
            sourceUrl: clean,
            directUrl: videoUrl,
            audioUrl: '',
            qualityLabel: 'Original Quality (Clean No Watermark)'
          };
        }
      }
    } catch (e2) {
      console.warn('Kuaishou fallback proxy error:', e2);
    }

    throw new Error('Unable to extract Kuaishou video. Please verify the link is active.');
  };

  /**
   * 2. Instagram Reels Extractor
   * Direct stream extraction in full original bitrate with crystal clear audio.
   */
  const extractInstagram = async (url) => {
    const clean = cleanInputUrl(url);

    // Method A: Dedicated Instagram API
    try {
      const apiUrl = `https://backend1.tioo.eu.org/igdl?url=${encodeURIComponent(clean)}`;
      const res = await fetch(apiUrl);
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
        } catch (pe) {
          console.warn('Instagram API returned non-JSON:', text);
        }
      }
    } catch (e1) {
      console.warn('Instagram primary endpoint error:', e1);
    }

    // Method B: Captioned Embed parser
    try {
      const shortcodeMatch = clean.match(/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
      if (shortcodeMatch) {
        const code = shortcodeMatch[1];
        const embedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.instagram.com/reel/${code}/embed/captioned/`)}`;
        const res = await fetch(embedUrl);
        if (res.ok) {
          const html = await res.text();
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
    } catch (e2) {
      console.warn('Instagram embed fallback error:', e2);
    }

    throw new Error('Unable to fetch Instagram Reel. Instagram may require authentication or is rate-limiting public requests.');
  };

  /**
   * 3. Facebook Reels Extractor
   * Combined high resolution MP4 with full audio.
   */
  const extractFacebook = async (url) => {
    const clean = cleanInputUrl(url);

    // Method A: Dedicated Facebook stream extractor
    try {
      const apiUrl = `https://backend1.tioo.eu.org/fbdown?url=${encodeURIComponent(clean)}`;
      const res = await fetch(apiUrl);
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
    } catch (e1) {
      console.warn('Facebook endpoint error:', e1);
    }

    throw new Error('Unable to extract Facebook video. Please check that the Reel is publicly viewable.');
  };

  /**
   * 4. YouTube Shorts Invidious Extractor
   * Prioritizes merged streams (formatStreams) with video + audio in one container.
   */
  const INVIDIOUS_NODES = [
    'https://yt.chocolatemoo53.com',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.tiekoetter.com'
  ];

  const extractYouTubeInvidious = async (url) => {
    const clean = cleanInputUrl(url);
    const videoId = extractYouTubeId(clean);
    if (!videoId) throw new Error('Could not parse YouTube video ID from URL');

    for (const node of INVIDIOUS_NODES) {
      try {
        const apiUrl = `${node}/api/v1/videos/${videoId}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeout);

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

    throw new Error('Public YouTube nodes are currently busy. Please try again or use the local backend.');
  };

  /**
   * 5. TikTok Extractor
   */
  const extractTikTok = async (url) => {
    const clean = cleanInputUrl(url);
    try {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(clean)}&hd=1`);
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

    const res = await fetch(`${endpoint}/download?url=${encodeURIComponent(clean)}`, { method: 'GET' });
    if (!res.ok) throw new Error(`Custom backend returned HTTP ${res.status}`);
    const data = await res.json();

    if (!data.url) throw new Error('Backend did not return a valid stream URL');

    return {
      title: data.title || 'Video',
      author: data.uploader || 'Creator',
      thumbnail: data.thumbnail || '',
      duration: data.duration ? `${Math.floor(data.duration / 60)}:${data.duration % 60}` : 'Short',
      sourceUrl: clean,
      directUrl: data.url,
      audioUrl: '',
      qualityLabel: '1080p/4K Merged (Original Audio)'
    };
  };

  // --- Main Fetch Function ---
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
    loadingStatusText.textContent = 'Resolving media stream... (Step 1/2)';
    downloadBtn.disabled = true;

    const detected = detectPlatform(cleanUrl);
    let result = null;

    try {
      if (activeEngine === 'custom') {
        loadingStatusText.textContent = 'Connecting to custom engine...';
        result = await extractWithCustom(cleanUrl, customApi);
      } else {
        if (detected?.key === 'kuaishou') {
          loadingStatusText.textContent = 'Extracting Kuaishou / Kwai original video...';
          result = await extractKuaishou(cleanUrl);
        } else if (detected?.key === 'instagram') {
          loadingStatusText.textContent = 'Extracting Instagram Reel full quality stream...';
          result = await extractInstagram(cleanUrl);
        } else if (detected?.key === 'facebook') {
          loadingStatusText.textContent = 'Extracting Facebook Reel video & audio...';
          result = await extractFacebook(cleanUrl);
        } else if (detected?.key === 'youtube') {
          loadingStatusText.textContent = 'Extracting YouTube Short streams...';
          result = await extractYouTubeInvidious(cleanUrl);
        } else if (detected?.key === 'tiktok') {
          loadingStatusText.textContent = 'Extracting TikTok video without watermark...';
          result = await extractTikTok(cleanUrl);
        } else {
          // Auto detect attempt across engines
          try {
            result = await extractInstagram(cleanUrl);
          } catch (e1) {
            try {
              result = await extractKuaishou(cleanUrl);
            } catch (e2) {
              result = await extractYouTubeInvidious(cleanUrl);
            }
          }
        }
      }

      if (!result || !result.directUrl) {
        throw new Error('Could not find a downloadable video stream for this link.');
      }

      // Pre-buffering Step: Pre-fetch video blob into memory for instant 0-second saving!
      loadingStatusText.textContent = 'Pre-buffering video file for instant 0s download... (Step 2/2)';
      
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

      displayResult(result, detected);
    } catch (err) {
      console.error(err);
      let userFriendlyMsg = err.message || 'Failed to fetch video.';
      if (userFriendlyMsg.includes('404')) {
        userFriendlyMsg = 'Video not found (404). Ensure the link points directly to a single public reel/short.';
      }
      showError(userFriendlyMsg, cleanUrl, detected);
    } finally {
      loadingState.classList.add('hidden');
      downloadBtn.disabled = false;
    }
  };

  // --- Display Result (Single Download Button, Pre-Buffered, Complete Sound) ---
  const displayResult = (data, platform) => {
    currentVideoData = data;
    hideStates();
    resultCard.classList.remove('hidden');

    // Title & Metadata
    videoTitle.textContent = data.title || 'Shorts / Reel Video';
    videoAuthor.textContent = `Creator: ${data.author || 'Original Author'}`;
    durationBadge.textContent = data.duration || 'Full Quality';
    resultPlatformText.textContent = platform ? platform.name : 'Video';

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
    videoPlayer.src = playSource;
    videoPlayer.load();

    // Secondary audio track synchronization for YouTube if separate
    if (data.audioUrl) {
      audioPlayer.src = data.audioUrl;
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

    // INSTANT DOWNLOAD HANDLER (0 Delay):
    directDownloadBtn.onclick = () => {
      const filename = getSafeFilename(data.title, 'mp4');
      
      if (data.preloadedBlob) {
        // Instant save from pre-buffered RAM! Zero waiting, zero loading spinner!
        saveBlobLocally(data.preloadedBlob, filename);
        indicateSuccess();
      } else {
        // Direct save trigger
        triggerFileDownload(data.directUrl, filename);
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

  const triggerFileDownload = async (url, filename) => {
    if (!url) return;

    // 1. Try to fetch as Blob first for clean native saving
    try {
      const res = await fetch(url, { referrerPolicy: 'no-referrer' });
      if (res.ok) {
        const blob = await res.blob();
        saveBlobLocally(blob, filename);
        indicateSuccess();
        return;
      }
    } catch (e) {
      console.warn('Direct blob fetch failed (cross-origin restriction):', e);
    }

    // 2. Direct anchor click fallback (target _blank avoids replacing web app window)
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    indicateSuccess('Download link opened! (Press Ctrl+S to save if playing)');
  };

  const indicateSuccess = (msg = 'Download Started!') => {
    const originalText = directDownloadBtn.innerHTML;
    directDownloadBtn.innerHTML = `<i data-lucide="check-circle-2"></i> <span>${msg}</span>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      directDownloadBtn.innerHTML = originalText;
      if (window.lucide) window.lucide.createIcons();
    }, 4000);
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

  // --- Settings Modal Handlers ---
  settingsBtn?.addEventListener('click', () => {
    engineSelect.value = activeEngine;
    customApiUrl.value = customApi;
    autoPreviewCheck.checked = autoPreview;
    toggleCustomField();
    settingsModal.classList.remove('hidden');
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

    localStorage.setItem('omni_engine', activeEngine);
    localStorage.setItem('omni_custom_api', customApi);
    localStorage.setItem('omni_auto_preview', autoPreview);

    closeSettings();
    alert('Settings saved successfully!');
  });
});
