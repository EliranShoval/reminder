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
    iconUrl: 'data:image/png;base64,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',
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
