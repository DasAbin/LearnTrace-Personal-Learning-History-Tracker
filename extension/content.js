(function() {
  const PLATFORMS = {
    UDEMY: 'https://www.udemy.com/',
    COURSERA: 'https://www.coursera.org/',
    YOUTUBE: 'https://www.youtube.com/',
    GITHUB: 'https://github.com/',
    MEDIUM: 'https://medium.com/'
  };

  async function checkAndFire(payload) {
    const { consentGiven, enabledPlatforms = [], trackingPaused } = await chrome.storage.local.get(['consentGiven', 'enabledPlatforms', 'trackingPaused']);
    
    if (!consentGiven || trackingPaused) return;
    if (!enabledPlatforms.includes(payload.platform)) return;

    const firedUrls = JSON.parse(sessionStorage.getItem('lt_fired_urls') || '[]');
    if (firedUrls.includes(window.location.href)) return;

     firedUrls.push(window.location.href);
    sessionStorage.setItem('lt_fired_urls', JSON.stringify(firedUrls));

    chrome.runtime.sendMessage({
      type: 'LEARNING_DETECTED',
      payload: { ...payload, completionDate: new Date().toISOString(), autoTracked: true }
    });
  }

  // --- UDEMY ---
  if (window.location.href.includes('udemy.com')) {
    const observer = new MutationObserver(() => {
      try {
        const certBtn = document.querySelector('.certificate-button, [class*="certificate"]');
        if (certBtn) {
          const title = document.querySelector('.clp-lead__title, h1[data-purpose="lead-title"]')?.textContent;
          checkAndFire({ title: title?.trim(), platform: 'Udemy', domain: 'Online Learning' });
          observer.disconnect();
        }
      } catch (e) {}
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // --- COURSERA ---
  if (window.location.href.includes('coursera.org')) {
    if (window.location.pathname.includes('/certificate')) {
        const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
        checkAndFire({ title: title.split('|')[0].trim(), platform: 'Coursera', domain: 'Online Learning' });
    }
  }

  // --- YOUTUBE ---
  if (window.location.href.includes('youtube.com/watch') && window.location.search.includes('list=')) {
    const video = document.querySelector('video');
    if (video) {
      let thresholdReached = false;
      video.addEventListener('timeupdate', () => {
        if (!thresholdReached && video.currentTime > 180) {
          thresholdReached = true;
          try {
            const title = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string')?.textContent;
            checkAndFire({ title: title?.trim(), platform: 'YouTube', domain: 'Video Learning', hoursSpent: 0.5 });
          } catch (e) {}
        }
      });
    }
  }

  // --- GITHUB ---
  if (window.location.host === 'github.com') {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 2) { // repo root
        const title = document.querySelector('[itemprop="name"] a')?.textContent;
        const lang = document.querySelector('.Layout-sidebar .Progress-item')?.getAttribute('aria-label') || 'Code';
        checkAndFire({ title: `${title?.trim()} (${lang})`, platform: 'GitHub', domain: 'Programming' });
    }
  }

  // --- MEDIUM ---
  if (window.location.host.includes('medium.com')) {
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
        if (scrollPercent > 0.85) {
            try {
                const title = document.querySelector('h1')?.textContent;
                checkAndFire({ title: title?.trim(), platform: 'Medium', domain: 'Reading' });
            } catch (e) {}
        }
    }, { passive: true });
  }

})();
