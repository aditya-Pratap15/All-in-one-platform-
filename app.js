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
  const playPreviewBtn = document.getElementById('playPreviewBtn');
  const resultPlatformBadge = document.getElementById('resultPlatformBadge');
  const resultPlatformText = document.getElementById('resultPlatformText');
  const durationBadge = document.getElementById('durationBadge');
  const videoTitle = document.getElementById('videoTitle');
  const videoAuthor = document.getElementById('videoAuthor');
  const downloadFormatsList = document.getElementById('downloadFormatsList');
  const directDownloadBtn = document.getElementById('directDownloadBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');

  // Theme & Settings
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const engineSelect = document.getElementById('engineSelect');
  const customApiField = document.getElementById('customApiField');
  const customApiUrl = document.getElementById('customApiUrl');
  const autoPreviewCheck = document.getElementById('autoPreviewCheck');

  // State
  let currentVideoData = null;
  let activeEngine = localStorage.getItem('omni_engine') || 'auto';
  let customApi = localStorage.getItem('omni_custom_api') || '';
  let autoPreview = localStorage.getItem('omni_auto_preview') !== 'false';

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
      pattern: /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)/i
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
      pattern: /(?:tiktok\.com|vt\.tiktok\.com)/i
    }
  };

  const detectPlatform = (url) => {
    for (const [key, val] of Object.entries(PLATFORMS)) {
      if (val.pattern.test(url)) {
        return { key, ...val };
      }
    }
    return null;
  };

  // --- Input Handlers ---
  const handleUrlChange = () => {
    const url = videoUrlInput.value.trim();
    if (url) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }

    const platform = detectPlatform(url);
    const platformTags = document.querySelectorAll('.platform-tag');
    platformTags.forEach(tag => tag.classList.remove('active'));

    if (platform) {
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
      alert('Unable to access clipboard. Please paste the link manually into the box.');
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

  // --- API Extraction Engines ---

  /**
   * Primary Engine: VKr public media extractor
   */
  const extractWithVkr = async (url) => {
    const apiUrl = `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    if (!data || data.error || (data.success === false)) {
      throw new Error(data.message || 'Extractor was unable to parse this URL');
    }

    const inner = data.data || data;
    const formats = inner.downloads || inner.formats || [];
    
    // Sort or locate best mp4 stream
    let bestUrl = inner.source || '';
    if (formats.length > 0) {
      // Find highest resolution or first mp4
      const videoFormats = formats.filter(f => f.ext === 'mp4' || f.format_id?.includes('p') || f.url);
      if (videoFormats.length > 0) {
        bestUrl = videoFormats[0].url || videoFormats[0].download_url;
      }
    }

    return {
      title: inner.title || 'Extracted Video',
      author: inner.channel || inner.author || inner.uploader || 'Creator',
      thumbnail: inner.thumbnail || inner.picture || '',
      duration: inner.duration || 'Short',
      sourceUrl: url,
      directUrl: bestUrl,
      formats: formats.map(f => ({
        label: f.format_id || f.quality || (f.ext === 'mp3' ? 'Audio MP3' : 'MP4 HD'),
        ext: f.ext || 'mp4',
        size: f.size || f.filesize_str || 'Full Quality',
        url: f.url || f.download_url
      }))
    };
  };

  /**
   * Secondary Engine: Cobalt Public Node Parser
   */
  const extractWithCobalt = async (url, customEndpoint) => {
    const endpoint = customEndpoint || 'https://api.cobalt.tools';
    const payload = {
      url: url,
      videoQuality: qualitySelect.value === 'max' ? 'max' : qualitySelect.value,
      downloadMode: qualitySelect.value === 'audio' ? 'audio' : 'auto'
    };

    const res = await fetch(`${endpoint.replace(/\/+$/, '')}/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.status === 'error') {
      throw new Error(data.error?.code || 'Cobalt instance returned an error');
    }

    const directUrl = data.url || (data.picker && data.picker[0]?.url);
    if (!directUrl) throw new Error('No stream URL was returned by Cobalt');

    return {
      title: 'Extracted Short / Reel',
      author: 'Creator',
      thumbnail: '',
      duration: 'HD',
      sourceUrl: url,
      directUrl: directUrl,
      formats: [{
        label: 'Best Available (No Watermark)',
        ext: 'mp4',
        size: 'Original Bitrate',
        url: directUrl
      }]
    };
  };

  /**
   * Tertiary Engine: Local or Custom Self-Hosted yt-dlp micro-backend
   */
  const extractWithCustom = async (url, customEndpoint) => {
    if (!customEndpoint) throw new Error('Please enter your custom backend or Cobalt URL in Settings');
    const endpoint = customEndpoint.replace(/\/+$/, '');
    
    // Check if endpoint is custom yt-dlp API
    const res = await fetch(`${endpoint}/download?url=${encodeURIComponent(url)}`, { method: 'GET' });
    if (!res.ok) throw new Error(`Custom API returned status ${res.status}`);
    const data = await res.json();

    return {
      title: data.title || 'Video',
      author: data.uploader || 'Creator',
      thumbnail: data.thumbnail || '',
      duration: data.duration ? `${Math.floor(data.duration / 60)}:${data.duration % 60}` : 'Short',
      sourceUrl: url,
      directUrl: data.url,
      formats: [{
        label: 'Original 1080p/4K (Raw Stream)',
        ext: 'mp4',
        size: 'Max Bitrate',
        url: data.url
      }]
    };
  };

  // --- Main Fetch Function ---
  const fetchVideo = async () => {
    const rawUrl = videoUrlInput.value.trim();
    if (!rawUrl) {
      showError('Please paste a valid video URL first.');
      return;
    }

    // UI State: Loading
    hideStates();
    loadingState.classList.remove('hidden');
    loadingStatusText.textContent = 'Resolving media stream...';
    downloadBtn.disabled = true;

    const detected = detectPlatform(rawUrl);
    let result = null;
    let errors = [];

    try {
      // If user selected Custom in settings
      if (activeEngine === 'custom') {
        loadingStatusText.textContent = 'Contacting custom backend...';
        result = await extractWithCustom(rawUrl, customApi);
      } 
      // If user selected Cobalt
      else if (activeEngine === 'cobalt') {
        loadingStatusText.textContent = 'Fetching from Cobalt network...';
        result = await extractWithCobalt(rawUrl, customApi);
      } 
      // Auto / Multi-Engine Fallback Mode
      else {
        // Attempt Primary Engine
        try {
          loadingStatusText.textContent = 'Extracting original video without watermark...';
          result = await extractWithVkr(rawUrl);
        } catch (err1) {
          console.warn('Primary engine failed:', err1);
          errors.push(err1.message);

          // Attempt Secondary Fallback Engine
          try {
            loadingStatusText.textContent = 'Trying secondary fallback engine...';
            result = await extractWithCobalt(rawUrl);
          } catch (err2) {
            console.warn('Secondary engine failed:', err2);
            errors.push(err2.message);
          }
        }
      }

      if (result && result.directUrl) {
        displayResult(result, detected);
      } else {
        throw new Error('Video extraction servers are temporarily busy or the link is private.');
      }
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to fetch video.', rawUrl, detected);
    } finally {
      loadingState.classList.add('hidden');
      downloadBtn.disabled = false;
    }
  };

  // --- Display Result ---
  const displayResult = (data, platform) => {
    currentVideoData = data;
    hideStates();
    resultCard.classList.remove('hidden');

    // Meta details
    videoTitle.textContent = data.title || 'Shorts / Reel Video';
    videoAuthor.textContent = `Uploaded by: ${data.author || 'Creator'}`;
    durationBadge.textContent = data.duration || 'Full Quality';
    resultPlatformText.textContent = platform ? platform.name : 'Video';

    // Media Preview
    if (data.thumbnail) {
      videoThumbnail.src = data.thumbnail;
      videoThumbnail.classList.remove('hidden');
    } else {
      videoThumbnail.classList.add('hidden');
    }

    videoPlayer.pause();
    videoPlayer.classList.add('hidden');
    playPreviewBtn.classList.remove('hidden');

    if (autoPreview && data.directUrl) {
      videoPlayer.src = data.directUrl;
      videoPlayer.classList.remove('hidden');
      videoThumbnail.classList.add('hidden');
      playPreviewBtn.classList.add('hidden');
    }

    // Populate format list
    downloadFormatsList.innerHTML = '';
    const formatsToRender = (data.formats && data.formats.length > 0) 
      ? data.formats 
      : [{ label: 'Full Resolution (No Watermark)', ext: 'mp4', size: 'Original', url: data.directUrl }];

    formatsToRender.forEach(f => {
      const row = document.createElement('div');
      row.className = 'format-row';
      row.innerHTML = `
        <div class="format-info">
          <span class="format-tag">${(f.ext || 'MP4').toUpperCase()}</span>
          <strong>${f.label || 'Standard Format'}</strong>
          <span class="setting-help">${f.size || ''}</span>
        </div>
        <button class="format-btn" data-url="${f.url}" data-name="${getSafeFilename(data.title, f.ext)}">
          <i data-lucide="download"></i> Download
        </button>
      `;
      downloadFormatsList.appendChild(row);
    });

    // Attach click to format buttons
    downloadFormatsList.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.getAttribute('data-url');
        const filename = btn.getAttribute('data-name');
        triggerFileDownload(url, filename);
      });
    });

    // Primary download button
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

    // Scroll smoothly to result
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  playPreviewBtn?.addEventListener('click', () => {
    if (!currentVideoData?.directUrl) return;
    videoPlayer.src = currentVideoData.directUrl;
    videoPlayer.classList.remove('hidden');
    videoThumbnail.classList.add('hidden');
    playPreviewBtn.classList.add('hidden');
    videoPlayer.play().catch(e => console.warn('Autoplay blocked:', e));
  });

  // --- Download Trigger ---
  const triggerFileDownload = async (url, filename) => {
    if (!url) return;

    try {
      // Attempt blob download to force save file dialog directly
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch (e) {
      console.warn('CORS blob download prevented, falling back to direct navigation download:', e);
    }

    // Direct link fallback
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getSafeFilename = (title, ext = 'mp4') => {
    const clean = (title || 'video')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 50);
    return `${clean}_nowatermark.${ext}`;
  };

  // --- Error Handling & Fallbacks ---
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
        ? 'Tip: If this is an Instagram Reel, confirm the account is public.'
        : 'Tip: You can configure a custom Cobalt or local yt-dlp instance in Settings for unlimited downloads.';
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

  const closeModal = () => {
    settingsModal.classList.add('hidden');
  };

  closeSettingsBtn?.addEventListener('click', closeModal);
  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
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

    closeModal();
    alert('Settings saved successfully!');
  });
});
