const PLATFORMS = ['Udemy', 'Coursera', 'YouTube', 'GitHub', 'Medium'];

document.addEventListener('DOMContentLoaded', async () => {
    const masterPause = document.getElementById('masterPause');
    const platformList = document.getElementById('platformList');
    const logList = document.getElementById('logList');
    const clearBtn = document.getElementById('clearBtn');

    const state = await chrome.storage.local.get(['trackingPaused', 'enabledPlatforms', 'activity_log']);
    const enabledPlatforms = state.enabledPlatforms || [];
    const activityLog = state.activity_log || [];

    // Master Toggle
    masterPause.checked = !state.trackingPaused; // Pause is true, checked is active (false)
    masterPause.addEventListener('change', async () => {
        await chrome.storage.local.set({ trackingPaused: !masterPause.checked });
        updateContentScripts();
    });

    // Render Platforms
    PLATFORMS.forEach(platform => {
        const div = document.createElement('div');
        div.className = 'flex-between platform-toggle';
        div.innerHTML = `
            <span>${platform}</span>
            <label class="toggle">
                <input type="checkbox" class="platform-check" value="${platform}" ${enabledPlatforms.includes(platform) ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        `;
        platformList.appendChild(div);
    });

    // Platform Toggles
    const checks = document.querySelectorAll('.platform-check');
    checks.forEach(check => {
        check.addEventListener('change', async () => {
            const currentEnabled = Array.from(checks)
                .filter(c => c.checked)
                .map(c => c.value);
            await chrome.storage.local.set({ enabledPlatforms: currentEnabled });
            updateContentScripts();
        });
    });

    // Render Log
    function renderLog(log) {
        logList.innerHTML = '';
        const displayLog = log.slice(0, 20); // Last 20 entries
        
        if (displayLog.length === 0) {
            logList.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #9ca3af; padding: 20px;">No entries caught yet.</td></tr>';
            return;
        }

        displayLog.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:600">${entry.title}</td>
                <td><span class="badge">${entry.platform}</span></td>
                <td style="color: #6b7280; font-size: 0.8rem;">${new Date(entry.sentAt || entry.completionDate).toLocaleString()}</td>
                <td style="text-align:right">
                    <span class="delete-ico" data-index="${index}">✕</span>
                </td>
            `;
            logList.appendChild(row);
        });

        // Add deletion listeners
        document.querySelectorAll('.delete-ico').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(e.target.dataset.index);
                const currentLog = (await chrome.storage.local.get('activity_log')).activity_log || [];
                currentLog.splice(idx, 1);
                await chrome.storage.local.set({ activity_log: currentLog });
                renderLog(currentLog);
            });
        });
    }

    renderLog(activityLog);

    // Clear All
    clearBtn.addEventListener('click', async () => {
        if (confirm('Clear all local LearnTrace data? This will reset your consent and chosen platforms.')) {
            await chrome.storage.local.set({ 
                consentGiven: false, 
                enabledPlatforms: [], 
                trackingPaused: false, 
                activity_log: [], 
                sync_queue: [] 
            });
            window.location.reload();
        }
    });

    function updateContentScripts() {
        // Since we refresh storage each load in content.js, we don't necessarily need a direct push, 
        // but we could use message passing if immediate reactivity across tabs was needed.
    }
});
