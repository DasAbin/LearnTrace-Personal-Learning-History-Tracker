const API_URL = 'http://localhost:3001';

// On installation, open onboarding page
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'onboarding.html' });
  }
});

// Setup alarm for sync queue (every 5 minutes)
chrome.alarms.create('sync-queue', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-queue') {
    processQueue();
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LEARNING_DETECTED') {
    handleLearningDetected(message.payload);
  }
  return true;
});

async function generateIdempotencyKey(userId, title, completionDate) {
  const data = new TextEncoder().encode(`${userId}:${title}:${completionDate}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function handleLearningDetected(payload) {
  const { token, user } = await chrome.storage.local.get(['token', 'user']);
  
  // Generate key even if offline to ensure consistency
  const idempotencyKey = await generateIdempotencyKey(user?.id || 'anon', payload.title, payload.completionDate);
  
  const queueItem = {
    idempotencyKey,
    payload,
    attempts: 0,
    createdAt: Date.now(),
    nextRetryAt: 0
  };

  await addToQueue(queueItem);
  
  if (token) {
    await processQueue(); // Attempt immediate sync
  }
}

async function addToQueue(item) {
  const { sync_queue = [] } = await chrome.storage.local.get(['sync_queue']);
  // Prevent duplicate items in queue
  if (sync_queue.some(qi => qi.idempotencyKey === item.idempotencyKey)) return;
  
  sync_queue.push(item);
  await chrome.storage.local.set({ sync_queue });
}

async function processQueue() {
  const { token, sync_queue = [] } = await chrome.storage.local.get(['token', 'sync_queue']);
  
  if (!token || sync_queue.length === 0) return;

  const remainingQueue = [];
  const now = Date.now();

  for (const item of sync_queue) {
    if (now < item.nextRetryAt) {
        remainingQueue.push(item);
        continue;
    }

    try {
      const status = await sendEntry(item, token);
      
      if (status === 'success') {
        await logActivity(item.payload);
        showNotification(item.payload.title);
      } else if (status === 'retry') {
        item.attempts++;
        if (item.attempts > 5) {
            await moveToDeadLetter(item);
        } else {
            item.nextRetryAt = now + Math.pow(2, item.attempts) * 60_000;
            remainingQueue.push(item);
        }
      } else if (status === 'auth_error') {
        remainingQueue.push(item); // Keep in queue until user re-logins
      }
      // If 'error', we discard it as it's likely a bad payload
    } catch (error) {
      remainingQueue.push(item);
    }
  }

  await chrome.storage.local.set({ sync_queue: remainingQueue });
}

async function sendEntry(item, token) {
  try {
    const res = await fetch(`${API_URL}/api/v1/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': item.idempotencyKey
      },
      body: JSON.stringify(item.payload)
    });
    
    if (res.ok || res.status === 409) return 'success';
    if (res.status === 401) return 'auth_error';
    if (res.status === 429 || res.status >= 500) return 'retry';
    return 'error';
  } catch (e) {
    return 'retry';
  }
}

async function logActivity(payload) {
  const { activity_log = [] } = await chrome.storage.local.get(['activity_log']);
  const newLog = [{ ...payload, sentAt: new Date().toISOString() }, ...activity_log];
  if (newLog.length > 100) newLog.pop();
  await chrome.storage.local.set({ activity_log: newLog });
}

async function moveToDeadLetter(item) {
    const { dead_letter_queue = [] } = await chrome.storage.local.get(['dead_letter_queue']);
    dead_letter_queue.push(item);
    await chrome.storage.local.set({ dead_letter_queue });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Sync Failed',
      message: `Could not sync "${item.payload.title}" after multiple attempts.`
    });
}

function showNotification(title) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Learning Tracked!',
      message: `Successfully captured: ${title}`
    });
}
