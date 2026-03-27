/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Bell, Clock, CheckCircle2, AlertCircle, X, Calendar, Save } from 'lucide-react';
import { format, isPast, parseISO, isValid } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for cleaner tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Reminder {
  id: string;
  text: string;
  dateTime: string; // ISO string
  isDone: boolean;
  notified: boolean;
}

export default function App() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('reminders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputText, setInputText] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [inputTime, setInputTime] = useState('');

  // Editing state for rescheduling
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Check for overdue reminders every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setReminders(prev => {
        let changed = false;
        const next = prev.map(r => {
          const reminderDate = parseISO(r.dateTime);
          // Notify only ONCE per task when it becomes overdue
          if (!r.isDone && !r.notified && isPast(reminderDate)) {
            toast.error(`תזכורת עברה: ${r.text}`, {
              description: format(reminderDate, 'HH:mm dd/MM/yyyy'),
              icon: <AlertCircle className="w-5 h-5 text-red-500" />,
              duration: 10000,
            });
            changed = true;
            return { ...r, notified: true };
          }
          return r;
        });
        return changed ? next : prev;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || !inputDate || !inputTime) {
      toast.warning('נא למלא את כל השדות');
      return;
    }

    const dateTimeStr = `${inputDate}T${inputTime}`;
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      text: inputText,
      dateTime: dateTimeStr,
      isDone: false,
      notified: false,
    };

    setReminders(prev => [newReminder, ...prev].sort((a, b) => 
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    ));
    
    setInputText('');
    setInputDate('');
    setInputTime('');
    toast.success('תזכורת נוספה בהצלחה');
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggleDone = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, isDone: !r.isDone } : r
    ));
  };

  const startReschedule = (reminder: Reminder) => {
    const dt = parseISO(reminder.dateTime);
    setEditingId(reminder.id);
    setEditDate(format(dt, 'yyyy-MM-dd'));
    setEditTime(format(dt, 'HH:mm'));
  };

  const saveReschedule = (id: string) => {
    if (!editDate || !editTime) {
      toast.warning('נא לבחור תאריך ושעה חדשים');
      return;
    }

    const newDateTime = `${editDate}T${editTime}`;
    setReminders(prev => prev.map(r => 
      r.id === id 
        ? { ...r, dateTime: newDateTime, notified: false, isDone: false } 
        : r
    ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
    
    setEditingId(null);
    toast.success('הזמן עודכן בהצלחה');
  };

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (a.isDone === b.isDone) {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      }
      return a.isDone ? 1 : -1;
    });
  }, [reminders]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 font-sans text-[#1A1A1A]" dir="rtl">
      <Toaster position="top-center" richColors closeButton />
      
      {/* Extension Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Bell className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Reminder Hub</h1>
            </div>
          </div>
        </header>

        {/* Add Section */}
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <form onSubmit={handleAddReminder} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="מה התזכורת שלך?"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5" />
              הוסף תזכורת
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {sortedReminders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-gray-400 flex flex-col items-center gap-3"
              >
                <Clock className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">אין תזכורות כרגע</p>
              </motion.div>
            ) : (
              sortedReminders.map((reminder) => {
                const isOverdue = !reminder.isDone && isPast(parseISO(reminder.dateTime));
                const isEditing = editingId === reminder.id;
                
                return (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group relative p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3",
                      reminder.isDone 
                        ? "bg-gray-50 border-gray-100 opacity-60" 
                        : isOverdue 
                          ? "bg-red-50 border-red-100" 
                          : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button 
                          onClick={() => toggleDone(reminder.id)}
                          className={cn(
                            "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            reminder.isDone 
                              ? "bg-green-500 border-green-500 text-white" 
                              : isOverdue
                                ? "border-red-300 hover:border-red-500"
                                : "border-gray-200 hover:border-blue-500"
                          )}
                        >
                          {reminder.isDone && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(
                            "font-semibold truncate text-sm",
                            reminder.isDone && "line-through text-gray-400"
                          )}>
                            {reminder.text}
                          </h3>
                          {!isEditing && (
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className={cn(
                                "w-3 h-3",
                                isOverdue ? "text-red-500" : "text-gray-400"
                              )} />
                              <span className={cn(
                                "text-[11px] font-medium",
                                isOverdue ? "text-red-500" : "text-gray-400"
                              )}>
                                {format(parseISO(reminder.dateTime), 'HH:mm | dd/MM/yy')}
                              </span>
                              {isOverdue && !reminder.isDone && (
                                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                                  עבר הזמן
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isOverdue && !reminder.isDone && !isEditing && (
                          <button 
                            onClick={() => startReschedule(reminder)}
                            className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all"
                            title="עדכן זמן"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Reschedule Form */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-2 pt-2 border-t border-red-100">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button 
                              onClick={() => saveReschedule(reminder.id)}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer Stats */}
        <footer className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <div>משימות: {reminders.length}</div>
          <div>הושלמו: {reminders.filter(r => r.isDone).length}</div>
        </footer>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
}
