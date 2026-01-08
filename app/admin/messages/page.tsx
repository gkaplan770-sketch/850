"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Trash2, Bell, Check, Users, User, RefreshCw, Sparkles, X } from "lucide-react";

// --- רשימת התבניות הקבועות (ניתן להוסיף/לשנות כאן בקלות) ---
const MESSAGE_TEMPLATES = [
  { 
    label: "תזכורת דיווח", 
    title: "תזכורת: דיווח פעילות חודשי", 
    content: "שלום לכולם, נא לא לשכוח להזין את דיווחי הפעילות וההכנסות עד סוף השבוע. תודה!" 
  },
  { 
    label: "חג שמח", 
    title: "חג שמח!", 
    content: "לכל הרכזים והפעילים, חג שמח ומבורך! מאחלים הרבה הצלחה בפעילות." 
  },
  { 
    label: "עדכון נהלים", 
    title: "עדכון נהלים חשוב", 
    content: "שימו לב, עודכנו הנהלים לגבי החזר הוצאות. אנא התעדכנו בקובץ המצורף בדרייב." 
  },
  { 
    label: "יישר כוח", 
    title: "יישר כוח ענק!", 
    content: "כל הכבוד על הפעילות המדהימה השבוע. רואים את התוצאות בשטח. תמשיכו כך!" 
  }
];

export default function AdminMessagesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendMode, setSendMode] = useState<'all' | 'select'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. שליפת משתמשים
    const { data: usersData } = await supabase.from('users').select('*');
    setUsers(usersData || []);

    // 2. שליפת הודעות (בלי JOIN כדי למנוע תקלות)
    const { data: msgsData } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false }); // הודעות חדשות למעלה
    setMessages(msgsData || []);
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedIds.includes(userId)) {
      setSelectedIds(selectedIds.filter(id => id !== userId));
    } else {
      setSelectedIds([...selectedIds, userId]);
    }
  };

  const getUserDisplayName = (userId: string | null) => {
    if (!userId) return "הודעה כללית";
    const user = users.find(u => u.id === userId);
    if (!user) return "סניף לא ידוע";
    return user.branch_name || user.full_name || "ללא שם";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) { alert("חובה למלא נושא ותוכן"); return; }
    if (sendMode === 'select' && selectedIds.length === 0) { alert("חובה לסמן לפחות סניף אחד"); return; }

    setIsSending(true);
    try {
        let payloads = [];
        if (sendMode === 'all') {
            payloads.push({ title, content, user_id: null, is_read: false });
        } else {
            payloads = selectedIds.map(uid => ({ title, content, user_id: uid, is_read: false }));
        }

        const { error } = await supabase.from('messages').insert(payloads);
        if (error) throw error;

        // איפוס הטופס
        setTitle(''); 
        setContent(''); 
        setSendMode('all'); 
        setSelectedIds([]);
        fetchData(); // רענון מידי

    } catch (error: any) {
        alert("שגיאה: " + error.message);
    } finally {
        setIsSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("למחוק?")) return;
    await supabase.from('messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  // מילוי אוטומטי מתבנית
  const fillTemplate = (tmpl: any) => {
    setTitle(tmpl.title);
    setContent(tmpl.content);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-slate-800" dir="rtl">
      
      {/* כותרת */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">מרכז הודעות</h1>
          <p className="text-slate-500 text-sm">שליחת עדכונים לסניפים</p>
        </div>
        <button onClick={fetchData} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors">
            <RefreshCw size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- צד ימין: טופס כתיבה (תופס 4/12 מהרוחב) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
              <Send size={18} className="text-blue-600" /> כתיבת הודעה
            </h2>

            {/* תבניות מהירות */}
            <div className="mb-6">
                <label className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> תבניות מהירות (לחץ למילוי):
                </label>
                <div className="flex flex-wrap gap-2">
                    {MESSAGE_TEMPLATES.map((tmpl, idx) => (
                        <button 
                            key={idx}
                            type="button"
                            onClick={() => fillTemplate(tmpl)}
                            className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
                        >
                            {tmpl.label}
                        </button>
                    ))}
                    {(title || content) && (
                        <button onClick={() => {setTitle(''); setContent('');}} className="text-[11px] bg-red-50 text-red-500 px-2 py-1.5 rounded-full hover:bg-red-100 border border-transparent" title="נקה טופס">
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>
            
            <form onSubmit={handleSend} className="space-y-4">
              
              {/* בחירת נמענים */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setSendMode('all')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sendMode === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}> <Users size={14} className="inline ml-1"/> לכולם </button>
                  <button type="button" onClick={() => setSendMode('select')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sendMode === 'select' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}> <User size={14} className="inline ml-1"/> בחירה </button>
              </div>

              {/* רשימת בחירה (אם נבחר "בחירה אישית") */}
              {sendMode === 'select' && (
                  <div className="border border-slate-200 rounded-xl p-2 h-40 overflow-y-auto bg-slate-50 space-y-1 custom-scrollbar">
                      {users.length === 0 && <p className="text-center text-xs text-slate-400 py-4">אין משתמשים</p>}
                      {users.map(u => {
                          const isSelected = selectedIds.includes(u.id);
                          const displayName = u.branch_name || u.full_name || u.email?.split('@')[0];
                          return (
                              <div key={u.id} onClick={() => toggleUserSelection(u.id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-100'}`}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                      {isSelected && <Check size={10} className="text-white" />}
                                  </div>
                                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>{displayName}</span>
                              </div>
                          )
                      })}
                  </div>
              )}

              {/* שדות קלט */}
              <div>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="נושא ההודעה" className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div>
                  <textarea rows={5} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="תוכן ההודעה..." className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:border-blue-500 outline-none transition-colors leading-relaxed" />
              </div>
              
              <button type="submit" disabled={isSending} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2">
                {isSending ? <span className="animate-pulse">שולח...</span> : <><Send size={18} /> שלח הודעה</>}
              </button>
            </form>
          </div>
        </div>

        {/* --- צד שמאל: היסטוריה (תופס 8/12 מהרוחב) --- */}
        <div className="lg:col-span-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
              <Bell size={18} className="text-orange-500" /> היסטוריית הודעות שנשלחו
            </h2>
            
            {messages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">טרם נשלחו הודעות</p>
              </div>
            ) : (
              // גריד של כרטיסיות קטנות
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-2">
                {messages.map(msg => {
                  const senderName = getUserDisplayName(msg.user_id);
                  const isGeneral = !msg.user_id;
                  const dateStr = new Date(msg.created_at).toLocaleDateString('he-IL');
                  const timeStr = new Date(msg.created_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'});

                  return (
                    <div key={msg.id} className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between h-48 relative overflow-hidden">
                      
                      {/* פס צבעוני בצד */}
                      <div className={`absolute top-0 right-0 w-1.5 h-full ${isGeneral ? 'bg-orange-400' : 'bg-blue-500'}`} />

                      <div>
                        {/* כותרת עליונה */}
                        <div className="flex justify-between items-start mb-2 pr-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold truncate max-w-[120px] ${isGeneral ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                {senderName}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{dateStr}</span>
                        </div>
                        
                        {/* תוכן */}
                        <h3 className="font-bold text-slate-800 text-sm mb-1 truncate pr-2" title={msg.title}>{msg.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 pr-2 pl-1">
                            {msg.content}
                        </p>
                      </div>
                      
                      {/* כפתור מחיקה ושעה */}
                      <div className="flex justify-between items-end mt-2 pr-2 border-t border-slate-50 pt-2">
                        <span className="text-[10px] text-slate-300">{timeStr}</span>
                        <button 
                            onClick={() => deleteMessage(msg.id)} 
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="מחק הודעה"
                        >
                            <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>

      </div>
    </div>
  );
}