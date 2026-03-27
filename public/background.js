// Listen for changes in storage to update alarms
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.reminders) {
    scheduleAlarms(changes.reminders.newValue);
  }
});

// Schedule alarms based on reminders
function scheduleAlarms(reminders) {
  chrome.alarms.clearAll(() => {
    const now = Date.now();
    reminders.forEach(r => {
      const rTime = new Date(r.dateTime).getTime();
      if (!r.isDone && !r.notified) {
        if (rTime > now) {
          // Future reminder: set an alarm for the exact time
          chrome.alarms.create(`rem_${r.id}`, { when: rTime });
        } else {
          // Missed/Overdue reminder: trigger immediately
          triggerNotification(r);
        }
      }
    });
  });
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('rem_')) {
    const id = alarm.name.replace('rem_', '');
    chrome.storage.local.get(['reminders'], (result) => {
      const reminders = result.reminders || [];
      const reminder = reminders.find(r => r.id === id);
      if (reminder && !reminder.isDone && !reminder.notified) {
        triggerNotification(reminder);
      }
    });
  }
});

// Trigger the OS notification
function triggerNotification(reminder) {
  chrome.notifications.create(`notif_${reminder.id}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon.png'), // חובה להשתמש בנתיב המלא של התוסף
    title: 'Reminder Hub',
    message: `⏰ תזכורת: ${reminder.text}`,
    priority: 2,
    requireInteraction: true
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      // הדפסת השגיאה המדויקת במקום [object Object]
      console.error("Notification Error:", chrome.runtime.lastError.message || chrome.runtime.lastError);
    }
  });

  // Mark as notified in storage so it doesn't trigger again
  chrome.storage.local.get(['reminders'], (result) => {
    const reminders = result.reminders || [];
    const updated = reminders.map(r =>
      r.id === reminder.id ? { ...r, notified: true } : r
    );
    chrome.storage.local.set({ reminders: updated });
  });
}

// Initialize on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['reminders'], (result) => {
    if (result.reminders) scheduleAlarms(result.reminders);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['reminders'], (result) => {
    if (result.reminders) scheduleAlarms(result.reminders);
  });
});
