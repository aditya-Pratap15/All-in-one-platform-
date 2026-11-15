/**
 * OmniDownloader - Client-Side Controller
 * Multi-Platform Media Extractor & Downloader
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
  const audioDownloadLink = document.getElementById('audioDownloadLink');

  // Modals
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

  // --- Audio / Video Synchronization for In-Browser Sound ---
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
      pattern: /(?:youtube\.com\/(?:shorts\/[a-zA-Z0-9_-]{11}|watch\?v=[a-zA-Z0-9_-]{11})|youtu\.be\/[a-zA-Z0-9_-]{11})/i
    },
    instagram: {
      name: 'Instagram Reels',
      icon: 'instagram',
      pattern: /instagram\.com\/(?:reel|p|tv)\//i
    },
    facebook: {
      name: 'Facebook Reels',
      icon: 'facebook',
      pattern: /(?:facebook\.com\/(?:reel|watch|.*\/videos\/)|fb\.watch\/)/i
    },
    kuaishou: {
      name: 'Kuaishou / Kwai',
      icon: 'video',
      pattern: /(?:kuaishou\.com|kwai\.com|kwai-video\.com|v\.kuaishou\.com)/i
    },
    tiktok: {
      name: 'TikTok',
      icon: 'music-2',
      pattern: /(?:tiktok\.com\/.*video\/|vt\.tiktok\.com)/i
    }
  };

  const isProfileOrChannelUrl = (url) => {
    if (!url) return null;
    if (/(?:youtube\.com\/(?:@|channel\/|c\/|user\/))/i.test(url)) {
      return {
        platform: 'YouTube',
        message: 'This is a YouTube Channel profile link. Please click on a specific Short video, tap "Share" → "Copy Link", and paste that video URL here (e.g. https://youtube.com/shorts/VIDEO_ID).'
      };
    }
    if (/(?:instagram\.com\/(?!reel\/|p\/|tv\/)[a-zA-Z0-9_.-]+\/?$)/i.test(url)) {
      return {
        platform: 'Instagram',
        message: 'This is an Instagram Profile link. Please open a specific Reel or video post and copy its link.'
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
    for (const [key, val] of Object.entries(PLATFORMS)) {
      if (val.pattern.test(url)) {
        return { key, ...val };
      }
    }
    return null;
  };

  const extractYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  // --- Input Handlers ---
  const handleUrlChange = () => {
    const url = videoUrlInput.value.trim();
    if (url) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }

    const channelNotice = isProfileOrChannelUrl(url);
    const platform = detectPlatform(url);
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
      alert('Unable to access clipboard. Please paste the link manually into the input box.');
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

  // --- Helpers ---
  const isDirectMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('youtube.com/watch') || url.includes('youtube.com/shorts') ||
        url.includes('instagram.com/reel') || url.includes('facebook.com/reel')) {
      return false;
    }
    return true;
  };

  // --- API Extraction Engines ---

  /**
   * Dedicated YouTube Invidious Multi-Node Resolver with Audio Track Support
   */
  const INVIDIOUS_NODES = [
    'https://yt.chocolatemoo53.com',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.tiekoetter.com'
  ];

  const extractYouTubeInvidious = async (url) => {
    const videoId = extractYouTubeId(url);
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

        // Check for progressive audio stream
        const audioStream = rawAdaptive.find(f => f.url && f.type && f.type.includes('audio/mp4')) ||
                            rawAdaptive.find(f => f.url && f.type && f.type.includes('audio/'));
        if (audioStream) {
          bestAudioUrl = audioStream.url;
        }

        // 1. Check if merged audio+video streams exist (itag 18 or 22)
        if (rawStreams.length > 0) {
          const merged = rawStreams.filter(s => s.url && isDirectMediaUrl(s.url));
          if (merged.length > 0) {
            bestVideoUrl = merged[merged.length - 1].url;
            bestQualityLabel = merged[merged.length - 1].resolution || '720p HD (Muxed Sound)';
          }
        }

        // 2. If no merged stream, pick highest adaptive video stream
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
          sourceUrl: url,
          directUrl: bestVideoUrl,
          audioUrl: bestAudioUrl,
          qualityLabel: bestQualityLabel
        };
      } catch (err) {
        continue;
      }
    }

    throw new Error('Public YouTube nodes are currently busy. Please try again in a moment or run the local backend.');
  };

  /**
   * Primary Engine: VKr public media extractor (for Instagram, Facebook, Kwai, TikTok)
   * Note: Instagram, Facebook, and TikTok CDN streams already bundle video + audio together!
   */
  const extractWithVkr = async (url) => {
    const apiUrl = `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    if (!data || data.error || (data.success === false)) {
      throw new Error(data.message || 'Unable to parse this video link');
    }

    const inner = data.data || data;
    const rawFormats = inner.downloads || inner.formats || [];
    
    const validFormats = rawFormats.filter(f => {
      const link = f.url || f.download_url;
      return link && isDirectMediaUrl(link);
    });

    let bestUrl = '';
    let qualityLabel = 'Full HD (Original Sound)';

    if (validFormats.length > 0) {
      const mp4Formats = validFormats.filter(f => f.ext === 'mp4' || f.format_id?.includes('p'));
      const chosen = mp4Formats[0] || validFormats[0];
      bestUrl = chosen.url || chosen.download_url;
      qualityLabel = chosen.format_id || chosen.quality || 'Full HD (Original Sound)';
    } else if (isDirectMediaUrl(inner.source)) {
      bestUrl = inner.source;
    }

    if (!bestUrl) {
      throw new Error('This platform returned 0 downloadable video streams. Please verify the post is public.');
    }

    return {
      title: inner.title || 'Extracted Video',
      author: inner.channel || inner.author || inner.uploader || 'Creator',
      thumbnail: inner.thumbnail || inner.picture || '',
      duration: inner.duration || 'Full Quality',
      sourceUrl: url,
      directUrl: bestUrl,
      audioUrl: '',
      qualityLabel: qualityLabel
    };
  };

  /**
   * Cobalt Engine (Only when user supplies a custom instance in Settings)
   */
  const extractWithCobalt = async (url, customEndpoint) => {
    if (!customEndpoint) {
      throw new Error('Please configure your custom Cobalt instance URL in Settings (gear icon).');
    }

    const payload = {
      url: url,
      videoQuality: qualitySelect.value === 'max' ? 'max' : qualitySelect.value,
      downloadMode: qualitySelect.value === 'audio' ? 'audio' : 'auto'
    };

    const res = await fetch(`${customEndpoint.replace(/\/+$/, '')}/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.status === 'error') {
      const code = data.error?.code || 'Cobalt instance error';
      if (code.includes('auth') || code.includes('jwt')) {
        throw new Error('This Cobalt instance requires an API key or authentication token.');
      }
      throw new Error(code);
    }

    const directUrl = data.url || (data.picker && data.picker[0]?.url);
    if (!directUrl || !isDirectMediaUrl(directUrl)) {
      throw new Error('No stream URL was returned by Cobalt');
    }

    return {
      title: 'Extracted Video',
      author: 'Creator',
      thumbnail: '',
      duration: 'HD',
      sourceUrl: url,
      directUrl: directUrl,
      audioUrl: '',
      qualityLabel: 'Max Bitrate (Original Sound)'
    };
  };

  /**
   * Local or Custom Self-Hosted yt-dlp micro-backend
   */
  const extractWithCustom = async (url, customEndpoint) => {
    if (!customEndpoint) throw new Error('Please enter your custom backend URL in Settings');
    const endpoint = customEndpoint.replace(/\/+$/, '');
    
    const res = await fetch(`${endpoint}/download?url=${encodeURIComponent(url)}`, { method: 'GET' });
    if (!res.ok) throw new Error(`Custom backend returned HTTP ${res.status}`);
    const data = await res.json();

    if (!data.url || !isDirectMediaUrl(data.url)) {
      throw new Error('Custom backend did not return a playable video stream URL');
    }

    return {
      title: data.title || 'Video',
      author: data.uploader || 'Creator',
      thumbnail: data.thumbnail || '',
      duration: data.duration ? `${Math.floor(data.duration / 60)}:${data.duration % 60}` : 'Short',
      sourceUrl: url,
      directUrl: data.url,
      audioUrl: '',
      qualityLabel: '1080p/4K Merged (Full Audio+Video)'
    };
  };

  // --- Main Fetch Function ---
  const fetchVideo = async () => {
    const rawUrl = videoUrlInput.value.trim();
    if (!rawUrl) {
      showError('Please paste a valid video URL first.');
      return;
    }

    const profileWarning = isProfileOrChannelUrl(rawUrl);
    if (profileWarning) {
      showError(profileWarning.message, rawUrl);
      return;
    }

    hideStates();
    loadingState.classList.remove('hidden');
    loadingStatusText.textContent = 'Resolving media stream...';
    downloadBtn.disabled = true;

    const detected = detectPlatform(rawUrl);
    let result = null;

    try {
      if (activeEngine === 'custom') {
        loadingStatusText.textContent = 'Contacting custom backend...';
        result = await extractWithCustom(rawUrl, customApi);
      } else if (activeEngine === 'cobalt') {
        loadingStatusText.textContent = 'Contacting Cobalt instance...';
        result = await extractWithCobalt(rawUrl, customApi);
      } else {
        if (detected && detected.key === 'youtube') {
          loadingStatusText.textContent = 'Extracting YouTube Short streams...';
          try {
            result = await extractYouTubeInvidious(rawUrl);
          } catch (ytErr) {
            console.warn('Invidious resolver failed, trying fallback...', ytErr);
            loadingStatusText.textContent = 'Trying secondary fallback...';
            result = await extractWithVkr(rawUrl);
          }
        } else {
          loadingStatusText.textContent = 'Extracting original video without watermark...';
          result = await extractWithVkr(rawUrl);
        }
      }

      if (result && result.directUrl) {
        displayResult(result, detected);
      } else {
        throw new Error('Could not find a downloadable video stream for this link.');
      }
    } catch (err) {
      console.error(err);
      let userFriendlyMsg = err.message || 'Failed to fetch video.';
      if (userFriendlyMsg.includes('404')) {
        userFriendlyMsg = 'Video not found (404). Please ensure the link points to a single video/reel and not a channel page or private account.';
      } else if (userFriendlyMsg.includes('error.api.auth') || userFriendlyMsg.includes('jwt')) {
        userFriendlyMsg = 'This public server requires authentication. Please use Auto mode or configure a custom instance in Settings.';
      }
      showError(userFriendlyMsg, rawUrl, detected);
    } finally {
      loadingState.classList.add('hidden');
      downloadBtn.disabled = false;
    }
  };

  // --- Display Result (Clean Single Button UI) ---
  const displayResult = (data, platform) => {
    currentVideoData = data;
    hideStates();
    resultCard.classList.remove('hidden');

    // Metadata
    videoTitle.textContent = data.title || 'Shorts / Reel Video';
    videoAuthor.textContent = `Uploaded by: ${data.author || 'Creator'}`;
    durationBadge.textContent = data.duration || 'Full Quality';
    resultPlatformText.textContent = platform ? platform.name : 'Video';

    // Video Player & Preview Setup
    videoPlayer.classList.remove('hidden');
    videoThumbnail.classList.add('hidden');
    previewFallbackNotice.classList.add('hidden');

    if (data.thumbnail) {
      videoPlayer.poster = data.thumbnail;
      videoThumbnail.src = data.thumbnail;
    } else {
      videoPlayer.removeAttribute('poster');
    }

    // Set the direct video stream source
    videoPlayer.src = data.directUrl;
    videoPlayer.load();

    // Link audio track if available (for YouTube stereo sound synchronization)
    if (data.audioUrl) {
      audioPlayer.src = data.audioUrl;
      audioPlayer.load();
      if (audioDownloadLink) {
        audioDownloadLink.href = data.audioUrl;
        audioDownloadLink.classList.remove('hidden');
      }
    } else {
      audioPlayer.removeAttribute('src');
      if (audioDownloadLink) audioDownloadLink.classList.add('hidden');
    }

    videoPlayer.onerror = () => {
      console.warn('Browser video element was blocked from streaming this CDN URL');
      videoPlayer.classList.add('hidden');
      if (data.thumbnail) {
        videoThumbnail.classList.remove('hidden');
      }
      previewFallbackNotice.classList.remove('hidden');
    };

    // Update Single Download Button & Quality Badge
    if (qualityBadgeText) {
      qualityBadgeText.textContent = `${data.qualityLabel || 'Highest Resolution (1080p Full HD)'} • No Watermark`;
    }
    if (downloadBtnText) {
      downloadBtnText.textContent = `Download Video (${data.qualityLabel ? data.qualityLabel.split(' ')[0] : 'Full HD'})`;
    }

    // Primary Single Download Button Click Event
    directDownloadBtn.onclick = () => {
      triggerFileDownload(data.directUrl, getSafeFilename(data.title, 'mp4'));
    };

    // Copy direct link button
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

  // --- Direct One-Click Download Function (NO MODAL) ---
  const triggerFileDownload = async (url, filename) => {
    if (!url) return;

    directDownloadBtn.disabled = true;
    const originalText = directDownloadBtn.innerHTML;
    directDownloadBtn.innerHTML = `<div class="btn-spinner"></div> <span>Downloading to your device...</span>`;

    // 1. Attempt direct fetch to convert to Blob (cleanest file saving)
    try {
      const res = await fetch(url, { referrerPolicy: 'no-referrer' });
      if (res.ok) {
        const blob = await res.blob();
        saveBlobLocally(blob, filename);
        indicateSuccess(originalText);
        return;
      }
    } catch (e1) {
      console.warn('Direct blob fetch failed, trying proxy...', e1);
    }

    // 2. Attempt via fast CORS proxy to force same-origin Blob
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { referrerPolicy: 'no-referrer' });
      if (res.ok) {
        const blob = await res.blob();
        saveBlobLocally(blob, filename);
        indicateSuccess(originalText);
        return;
      }
    } catch (e2) {
      console.warn('CORS proxy fetch failed, executing direct download trigger...', e2);
    }

    // 3. Fallback direct anchor trigger (never opens modal)
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    indicateSuccess(originalText);
  };

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

  const indicateSuccess = (originalHtml) => {
    directDownloadBtn.innerHTML = `<i data-lucide="check-circle-2"></i> <span>Download Started!</span>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      directDownloadBtn.disabled = false;
      directDownloadBtn.innerHTML = originalHtml;
      if (window.lucide) window.lucide.createIcons();
    }, 3500);
  };

  const getSafeFilename = (title, ext = 'mp4') => {
    const clean = (title || 'video')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 50);
    return `${clean}_nowatermark.${ext}`;
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
    if (engineSelect.value === 'custom' || engineSelect.value === 'cobalt') {
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
