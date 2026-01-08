"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, X, RefreshCw, Activity, 
  ArrowUpRight, ArrowDownLeft, ExternalLink, 
  AlertCircle, Calendar, User, Users
} from "lucide-react";

interface Transaction {
  id: string;
  created_at: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  file_url?: string;
  details?: any; // מכיל audience ('boys'/'girls') ו-hebrew_date
  rejection_reason?: string;
  users?: { first_name: string; last_name: string; branch_name: string; };
  date: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<Transaction | null>(null);
  
  // נתונים סטטיסטיים מעודכנים
  const [userStats, setUserStats] = useState({ 
    currentBalance: 0, 
    boysCount: 0,
    girlsCount: 0,
    totalCount: 0
  });
  
  const [calculatingStats, setCalculatingStats] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // --- הפונקציה המעודכנת עם הדפסת שגיאה מלאה ---
  const fetchRequests = async () => {
    setLoading(true);
    console.log("מתחיל שליפת נתונים..."); 

    const { data, error } = await supabase
      .from('transactions')
     .select('*, users!transactions_user_id_fkey(*)')
      .eq('status', 'pending')
      .order('date', { ascending: false });

    if (error) {
        // התיקון כאן: הופך את האובייקט לטקסט קריא
        console.error("שגיאה קריטית בשליפת נתונים:", JSON.stringify(error, null, 2));
        alert("שגיאה בשליפת נתונים:\n" + error.message + "\n\nפתח את הקונסול (F12) לפרטים נוספים.");
    } else {
        console.log("הנתונים שהתקבלו:", data);
        if (!data || data.length === 0) {
            console.log("השאילתה עבדה, אבל לא נמצאו בקשות עם סטטוס pending.");
        }
        setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  // --- חישוב סטטיסטיקה (מפריד בנים/בנות) ---
  const calculateUserStats = async (req: Transaction) => {
    setCalculatingStats(true);
    
    // 1. יתרה נוכחית (כל ההיסטוריה)
    const { data: approvedTx } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', req.user_id)
      .eq('status', 'approved');
      
    const balance = approvedTx?.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0) || 0;

    // 2. ספירה מופרדת לחודש הנוכחי
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // שולף את כל הפעילויות הדומות (אותו שם) של השליח מהחודש האחרון
    const { data: activities } = await supabase
      .from('transactions')
      .select('details')
      .eq('user_id', req.user_id)
      .eq('title', req.title) // אותו סוג פעילות
      .gte('date', startOfMonth);

    let boys = 0;
    let girls = 0;
    let total = 0;

    if (activities) {
        activities.forEach((item: any) => {
            total++;
            // בדיקה לפי קהל יעד
            const aud = item.details?.audience;
            if (aud === 'boys') boys++;
            else if (aud === 'girls') girls++;
        });
    }

    setUserStats({ 
      currentBalance: balance, 
      boysCount: boys,
      girlsCount: girls,
      totalCount: total
    });
    setCalculatingStats(false);
  };

  const handleInspect = (req: Transaction) => {
    setSelectedReq(req);
    setIsRejecting(false);
    setRejectionReason("");
    calculateUserStats(req);
  };

  const handleProcess = async (status: 'approved' | 'rejected') => {
    if (!selectedReq) return;
    
    const { error } = await supabase
      .from('transactions')
      .update({ 
        status: status, 
        rejection_reason: status === 'rejected' ? rejectionReason : null 
      })
      .eq('id', selectedReq.id);

    if (!error) {
      setRequests(requests.filter(r => r.id !== selectedReq.id));
      setSelectedReq(null);
    } else {
        alert("שגיאה בעדכון הסטטוס: " + error.message);
        console.error("Update error:", JSON.stringify(error, null, 2));
    }
  };

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      {/* כותרת */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
           <h1 className="text-3xl font-black text-slate-800">לוח בקרה</h1>
           <p className="text-slate-500 text-sm mt-1">ממתינות לאישור: <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{requests.length}</span></p>
        </div>
        <button onClick={fetchRequests} className="bg-slate-50 text-slate-600 p-3 rounded-xl hover:bg-slate-100 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* רשימת הממתינים - תצוגת קוביות (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p className="col-span-full text-center text-slate-400 mt-10">טוען נתונים...</p> : requests.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
             <Check size={48} className="mx-auto text-green-500 mb-4 bg-green-50 p-2 rounded-full" />
             <p className="text-slate-800 font-bold text-lg">הכל טופל!</p>
             <p className="text-slate-400 text-sm">אין בקשות ממתינות כרגע.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all group h-full">
               
               {/* חלק עליון: פרטי שליח וסוג */}
               <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${req.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {req.type === 'income' ? <ArrowDownLeft size={20} strokeWidth={3} /> : <ArrowUpRight size={20} strokeWidth={3} />}
                      </div>
                      <span className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-lg text-slate-400">
                          {new Date(req.date).toLocaleDateString('he-IL')}
                      </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1" title={req.title}>{req.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User size={14} />
                      <span className="truncate">{req.users?.branch_name || 'לא נמצא סניף'} ({req.users?.first_name || 'שליח'} {req.users?.last_name || ''})</span>
                  </div>
               </div>

               {/* חלק תחתון: סכום וכפתור */}
               <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">סכום</span>
                      <span className="text-xl font-black text-slate-900">₪{req.amount.toLocaleString()}</span>
                  </div>
                  <button onClick={() => handleInspect(req)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg group-hover:bg-blue-600 transition-colors">
                      לטיפול
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* --- מודל בדיקה (Popup) --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            
            {/* כותרת מודל */}
            <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-start">
               <div>
                   <h2 className="text-2xl font-black text-slate-800 mb-1">בדיקת בקשה</h2>
                   <p className="text-slate-500 text-sm flex items-center gap-2">
                       <User size={14}/> {selectedReq.users?.first_name} {selectedReq.users?.last_name} • {selectedReq.users?.branch_name}
                   </p>
               </div>
               <button onClick={() => setSelectedReq(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
               
               {/* תצוגת תאריכים מורחבת */}
               <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
                   <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                           <Calendar size={24} />
                       </div>
                       <div>
                           <div className="font-bold text-slate-800 text-lg">
                               {new Date(selectedReq.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                           </div>
                           <div className="text-sm text-slate-500">תאריך לועזי</div>
                       </div>
                   </div>
                   
                   {/* תאריך עברי (אם קיים בפרטים) */}
                   {selectedReq.details?.hebrew_date && (
                       <div className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-200">
                           <div className="font-black text-lg">{selectedReq.details.hebrew_date}</div>
                           <div className="text-[10px] opacity-80 text-center">תאריך עברי</div>
                       </div>
                   )}
               </div>

               {/* כרטיסי סטטיסטיקה */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  
                  {/* ספירה מופרדת בנים/בנות */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                          <Activity size={18} className="text-orange-500" />
                          <span className="text-xs font-bold text-slate-500">פעילות זו החודש</span>
                      </div>
                      
                      {calculatingStats ? (
                          <div className="text-2xl font-black text-slate-300 animate-pulse">מחשב...</div>
                      ) : (
                          <div className="space-y-2">
                              {/* בנים */}
                              <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg">
                                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                                      <Users size={14} /> בנים
                                  </div>
                                  <span className="font-black text-blue-800">{userStats.boysCount}</span>
                              </div>
                              {/* בנות */}
                              <div className="flex justify-between items-center bg-pink-50 p-2 rounded-lg">
                                  <div className="flex items-center gap-2 text-pink-700 font-bold text-sm">
                                      <Users size={14} /> בנות
                                  </div>
                                  <span className="font-black text-pink-800">{userStats.girlsCount}</span>
                              </div>
                              {/* סה"כ קטן */}
                              <div className="text-center text-[10px] text-slate-400 font-bold pt-1">
                                  סה"כ פעילויות: {userStats.totalCount}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* יתרה נוכחית */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
                     <p className="text-slate-400 text-xs font-bold mb-1">יתרה נוכחית בקופה</p>
                     <span className={`text-3xl font-black ${userStats.currentBalance < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                        ₪{userStats.currentBalance.toLocaleString()}
                     </span>
                  </div>

                  {/* יתרה צפויה */}
                  <div className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-center ${
                     (userStats.currentBalance + (selectedReq.type === 'income' ? selectedReq.amount : -selectedReq.amount)) < 0 
                     ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                  }`}>
                     <p className={`text-xs font-bold mb-1 ${
                        (userStats.currentBalance + (selectedReq.type === 'income' ? selectedReq.amount : -selectedReq.amount)) < 0 
                        ? 'text-red-600' : 'text-green-700'
                     }`}>יתרה לאחר אישור</p>
                     <span className={`text-3xl font-black ${
                        (userStats.currentBalance + (selectedReq.type === 'income' ? selectedReq.amount : -selectedReq.amount)) < 0 
                        ? 'text-red-600' : 'text-green-700'
                     }`}>
                        ₪{(userStats.currentBalance + (selectedReq.type === 'income' ? selectedReq.amount : -selectedReq.amount)).toLocaleString()}
                     </span>
                  </div>
               </div>

               <div className="flex flex-col lg:flex-row gap-6">
                  {/* פרטי הבקשה */}
                  <div className="flex-1 space-y-4">
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">פרטי בקשה</h4>
                        <div className="text-xl font-bold text-slate-900 mb-1">{selectedReq.title}</div>
                        <div className="text-4xl font-black text-blue-600">₪{selectedReq.amount.toLocaleString()}</div>
                     </div>

                     {selectedReq.details?.notes && (
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl">
                           <p className="text-xs font-bold text-yellow-700 mb-1">הערות השליח:</p>
                           <p className="text-yellow-900 text-sm font-medium">{selectedReq.details.notes}</p>
                        </div>
                     )}

                     {/* מידע נוסף אם קיים */}
                     {selectedReq.details?.participants && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-sm">
                            <div className="flex justify-between border-b border-slate-50 pb-2 mb-2">
                                <span className="text-slate-500">משתתפים בפעילות:</span>
                                <span className="font-bold">{selectedReq.details.participants}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">קהל יעד:</span>
                                <span className="font-bold">
                                    {selectedReq.details.audience === 'boys' ? 'בנים' : 
                                     selectedReq.details.audience === 'girls' ? 'בנות' : '-'}
                                </span>
                            </div>
                        </div>
                     )}
                  </div>

                  {/* תמונה */}
                  <div className="flex-1">
                     <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-full">
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">אסמכתא מצורפת</h4>
                         {selectedReq.file_url ? (
                            <a href={selectedReq.file_url} target="_blank" rel="noreferrer" className="block group relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 h-64">
                               <img src={selectedReq.file_url} alt="קבלה" className="w-full h-full object-contain" />
                               <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer">
                                  <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                     <ExternalLink size={16} /> הגדל תמונה
                                  </span>
                               </div>
                            </a>
                         ) : (
                            <div className="h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                               <AlertCircle size={32} className="mb-2 opacity-50" />
                               <span className="font-medium">לא צורף קובץ</span>
                            </div>
                         )}
                     </div>
                  </div>
               </div>

               {/* אזור דחייה */}
               {isRejecting && (
                  <div className="mt-6 bg-red-50 p-4 rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
                     <label className="block text-sm font-bold text-red-600 mb-2">נא לפרט את סיבת הדחייה:</label>
                     <textarea 
                        value={rejectionReason} 
                        onChange={(e) => setRejectionReason(e.target.value)} 
                        className="w-full p-4 border border-red-200 rounded-xl focus:border-red-500 outline-none bg-white text-sm"
                        rows={3}
                        autoFocus
                        placeholder="כתוב כאן..."
                     />
                  </div>
               )}
            </div>

            {/* כפתורים */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
               {!isRejecting ? (
                  <>
                    <button onClick={() => setIsRejecting(true)} className="px-6 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors">
                      דחה בקשה
                    </button>
                    <button onClick={() => handleProcess('approved')} className="px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2">
                      <Check size={18} /> אשר בקשה
                    </button>
                  </>
               ) : (
                  <>
                    <button onClick={() => setIsRejecting(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                      ביטול
                    </button>
                    <button onClick={() => handleProcess('rejected')} disabled={!rejectionReason} className="px-8 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20 disabled:opacity-50 transition-all">
                      אשר דחייה
                    </button>
                  </>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}