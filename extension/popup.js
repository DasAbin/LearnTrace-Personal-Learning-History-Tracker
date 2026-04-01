const API_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', async () => {
    const loginView = document.getElementById('loginView');
    const userView = document.getElementById('userView');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const errorMsg = document.getElementById('errorMsg');
    const userName = document.getElementById('userName');
    const pauseToggle = document.getElementById('pauseToggle');
    const activityList = document.getElementById('activityList');

    // Settings Link
    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙ Settings';
    settingsBtn.className = 'text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors bg-transparent border-none cursor-pointer';
    settingsBtn.style.padding = '0';
    document.querySelector('header').appendChild(settingsBtn);
    
    settingsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'settings.html' });
    });

    // Check login state
    const { token, user, trackingPaused, sync_queue = [] } = await chrome.storage.local.get(['token', 'user', 'trackingPaused', 'sync_queue']);

    if (token && user) {
        showUserView(user, trackingPaused, sync_queue);
    } else {
        showLoginView();
    }

    // Login Handler
    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        errorMsg.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                await chrome.storage.local.set({ token: data.token, user: data.user });
                showUserView(data.user, false, []);
            } else {
                errorMsg.textContent = data.error || 'Login failed';
                errorMsg.style.display = 'block';
            }
        } catch (err) {
            errorMsg.textContent = 'Connection error';
            errorMsg.style.display = 'block';
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', async () => {
        await chrome.storage.local.remove(['token', 'user']);
        showLoginView();
    });

    // Toggle Handler
    pauseToggle.addEventListener('change', async () => {
        const isPaused = !pauseToggle.checked; // checked means active
        await chrome.storage.local.set({ trackingPaused: isPaused });
        updateStatusUI(isPaused);
    });

    function showLoginView() {
        loginView.style.display = 'block';
        userView.style.display = 'none';
    }

    function showUserView(userData, isPaused, entries) {
        loginView.style.display = 'none';
        userView.style.display = 'block';
        userName.textContent = `Hi, ${userData.firstName}!`;
        pauseToggle.checked = !isPaused;
        updateStatusUI(isPaused);
        renderActivity(entries);
    }

    function updateStatusUI(isPaused) {
        document.getElementById('statusActive').style.display = isPaused ? 'none' : 'inline-flex';
        document.getElementById('statusPaused').style.display = isPaused ? 'inline-flex' : 'none';
    }

    function renderActivity(entries) {
        activityList.innerHTML = '';
        const displayEntries = entries.slice(-3).reverse();
        
        if (displayEntries.length === 0) {
            activityList.innerHTML = '<div style="font-size: 12px; color: #9ca3af; text-align: center; padding: 10px;">No recent activity tracked locally.</div>';
            return;
        }

        displayEntries.forEach(item => {
            const div = document.createElement('div');
            div.className = 'activity-item';
            div.textContent = `📍 ${item.title}`;
            activityList.appendChild(div);
        });
    }
});
