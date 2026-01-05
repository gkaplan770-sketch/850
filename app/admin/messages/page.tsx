"use client";

import React, { useState } from 'react';
import { Send, Users, User, CheckCircle2, Clock } from "lucide-react";

export default function AdminMessagesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // נתוני הטופס
  const [formData, setFormData] = useState({
    target: 'all', // 'all', 'branch', 'specific_user'
    targetId: '', // אם נבחר סניף או משתמש ספציפי
    title: '',
    content: ''
  });

  // היסטוריית הודעות (דמה)
  const messageHistory = [
    { id: 1, title: "הגשת קבלות דצמבר", target: "כל השלוחים", date: "04/01/2026", status: "sent" },
    { id: 2, title: "עדכון תעריפי נסיעות", target: "סניף צפון", date: "03/01/2026", status: "sent" },
    { id: 3, title: "חסרה קבלה - באולינג", target: "ישראל ישראלי", date: "01/01/2026", status: "read" },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // כאן תהיה השליחה לשרת
    setTimeout(() => {
      alert("ההודעה נשלחה בהצלחה!");
      setIsSubmitting(false);
      setFormData({ target: 'all', targetId: '', title: '', content: '' });
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">מרכז הודעות</h2>
          <p className="text-slate-500 mt-1">שליחת עדכונים והודעות לשלוחים</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- טופס כתיבת הודעה (צד ימין - רחב) --- */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                 <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Send size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">כתיבת הודעה חדשה</h3>
              </div>

              <form onSubmit={handleSend} className="space-y-6">
                 
                 {/* למי שולחים? */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">למי לשלוח?</label>
                    <div className="grid grid-cols-3 gap-3">
                       <button
                         type="button"
                         onClick={() => setFormData({...formData, target: 'all'})}
                         className={`py-3 rounded-xl border font-bold flex flex-col items-center gap-2 transition-all ${formData.target === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                       >
                          <Users size={20} />
                          לכולם
                       </button>
                       <button
                         type="button"
                         onClick={() => setFormData({...formData, target: 'specific_user'})}
                         className={`py-3 rounded-xl border font-bold flex flex-col items-center gap-2 transition-all ${formData.target === 'specific_user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                       >
                          <User size={20} />
                          לשליח ספציפי
                       </button>
                    </div>
                 </div>

                 {/* אם נבחר שליח ספציפי - הצג שדה חיפוש */}
                 {formData.target === 'specific_user' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                       <label className="block text-sm font-bold text-slate-700 mb-2">בחר שליח</label>
                       <select 
                         className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                         value={formData.targetId}
                         onChange={(e) => setFormData({...formData, targetId: e.target.value})}
                       >
                          <option value="">בחר מהרשימה...</option>
                          <option value="1">ישראל ישראלי - סניף מרכז</option>
                          <option value="2">מנחם כהן - סניף צפון</option>
                       </select>
                    </div>
                 )}

                 {/* כותרת ותוכן */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">נושא ההודעה</label>
                    <input 
                      type="text" 
                      required
                      placeholder="לדוגמה: תזכורת להגשת דוחות"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">תוכן ההודעה</label>
                    <textarea 
                      rows={5}
                      required
                      placeholder="כתוב כאן את תוכן ההודעה..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                    />
                 </div>

                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                    {isSubmitting ? "שולח..." : "שלח הודעה"}
                    <Send size={18} />
                 </button>

              </form>
           </div>
        </div>

        {/* --- היסטוריית הודעות (צד שמאל - צר) --- */}
        <div className="space-y-6">
           <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 h-full">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Clock size={20} className="text-slate-400" />
                 הודעות שנשלחו לאחרונה
              </h3>
              
              <div className="space-y-4">
                 {messageHistory.map((msg) => (
                    <div key={msg.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{msg.target}</span>
                          <span className="text-xs text-slate-400">{msg.date}</span>
                       </div>
                       <h4 className="font-bold text-slate-800 text-sm mb-1">{msg.title}</h4>
                       <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                          <CheckCircle2 size={12} />
                          {msg.status === 'read' ? 'נקרא על ידי כולם' : 'נשלח בהצלחה'}
                       </div>
                    </div>
                 ))}
              </div>
              
              <button className="w-full mt-4 text-sm font-bold text-slate-500 hover:text-blue-600 py-2">
                 צפה בכל ההיסטוריה
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}