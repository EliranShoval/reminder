// אייקון כחול פשוט (כדי שכרום לא יזרוק שגיאה על חוסר באייקון להתראה)
const ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// יצירת טיימר שרץ כל דקה ברקע
chrome.alarms.create("reminderCheck", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "reminderCheck") {
    checkReminders();
  }
});

// בדיקה גם כשהתוסף נטען לראשונה
checkReminders();

function checkReminders() {
  chrome.storage.local.get(['reminders'], (result) => {
    const reminders = result.reminders || [];
    let changed = false;
    const now = new Date().getTime();

    const updated = reminders.map(r => {
      const rTime = new Date(r.dateTime).getTime();
      
      // אם המשימה לא בוצעה, לא קיבלה התראה, והזמן עבר
      if (!r.isDone && !r.notified && rTime <= now) {
        
        // הקפצת חלון התראה של מערכת ההפעלה!
        chrome.notifications.create({
          type: 'basic',
          iconUrl: ICON,
          title: 'Reminder Hub',
          message: `⏰ תזכורת: ${r.text}`,
          priority: 2,
          requireInteraction: true // ההתראה תישאר עד שהמשתמש יסגור אותה
        });
        
        changed = true;
        return { ...r, notified: true };
      }
      return r;
    });

    // אם משהו השתנה, נשמור חזרה
    if (changed) {
      chrome.storage.local.set({ reminders: updated });
    }
  });
}
