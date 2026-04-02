# LearnTrace Chrome Extension

Auto-track your learning activity across platforms like Udemy, Coursera, YouTube, GitHub, Medium, LinkedIn Learning, freeCodeCamp, and Pluralsight.

## How to Install (Developer Mode)

Since this extension is not yet published on the Chrome Web Store, you'll load it manually:

### Step 1: Open Chrome Extensions Page
1. Open Google Chrome
2. Navigate to `chrome://extensions/` in the address bar
3. Toggle **"Developer mode"** ON (top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"** button (top-left)
2. Navigate to and select the `extension/` folder inside your `LearnTrace-Personal-Learning-History-Tracker` project
3. The LearnTrace extension should appear in your extensions list with a gold/amber icon

### Step 3: First-Time Setup
1. After loading, the **onboarding page** will open automatically
2. Select which platforms you want to track (Udemy, Coursera, YouTube, etc.)
3. Click **"Start Tracking"** to begin

### Step 4: Using the Extension
- **Popup**: Click the LearnTrace icon in your Chrome toolbar to see:
  - Tracking status (active/paused)
  - Recent activity log
  - Quick sync button
- **Settings**: Click the gear icon in the popup to:
  - Enable/disable specific platforms
  - Pause tracking globally
  - View and clear your local activity log
- **Auto-tracking**: Visit any supported learning platform and the extension will automatically detect your activity

## Supported Platforms
| Platform | What is Tracked |
|----------|----------------|
| Udemy | Course title, completion |
| Coursera | Course name, progress |
| YouTube | Educational video titles |
| GitHub | Repository activity |
| Medium | Article titles |
| LinkedIn Learning | Course names |
| freeCodeCamp | Exercise progress |
| Pluralsight | Course names |

## Privacy
- ✅ Tracks: Page title, platform name, time estimate, completion status
- ❌ Does NOT track: Page content, passwords, browsing history outside supported platforms
- All data is stored locally until you explicitly sync it to your LearnTrace account

## Syncing with LearnTrace
The extension syncs detected learning activities to your LearnTrace backend at `http://localhost:3001/api/v1/entries`. Make sure:
1. Your backend server is running (`npm run dev` in the `backend/` folder)
2. You're logged in — set your JWT token in the extension popup settings

## Troubleshooting
- **Extension not loading?** Make sure you selected the `extension/` folder, not a file inside it
- **No activity detected?** Check that the platform is enabled in Settings
- **Sync failing?** Ensure the backend is running and your token is valid
