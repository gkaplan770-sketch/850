"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, X, RefreshCw, Activity, 
  ArrowUpRight, ArrowDownLeft, ExternalLink, 
  AlertCircle, Filter
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
  details?: any;
  rejection_reason?: string;
  users?: { first_name: string; last_name: string; branch_name: string; };
  date: string;
}

export default function AdminDashboard() {
  const [allRequests, setAllRequests] = useState<Transaction[]>([]); // כל הבקשות (ללא סינון)
  const [filteredRequests, setFilteredRequests] = useState<Transaction[]>([]); // הבקשות המוצגות
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<Transaction | null>(null);
  
  // -- מסננים --
  const [branches, setBranches] = useState<string[]>([]);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM

  // נתונים סטטיסטיים
  const [userStats, setUserStats] = useState({ 
    currentBalance: 0, 
    specificActivityCount: 0 
  });
  
  const [calculatingStats, setCalculatingStats] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    // שליפת כל הבקשות הממתינות
    const { data, error } = await supabase
      .from('transactions')
      .select('*, users(first_name, last_name, branch_name)')
      .eq('status', 'pending')
      .order('date', { ascending: false });

    if (!error && data) {
      setAllRequests(data);
      setFilteredRequests(data);
      
      // חילוץ רשימת סניפים ייחודיים לתיבת הסינון
      const uniqueBranches = Array.from(new Set(data.map(r => r.users?.branch_name).filter(Boolean))) as string[];
      setBranches(uniqueBranches);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  // -- מנוע הסינון --
  useEffect(() => {
    let result = allRequests;

    // 1. סינון לפי סניף
    if (filterBranch !== 'all') {
      result = result.filter(r => r.users?.branch_name === filterBranch);
    }

    // 2. סינון לפי סוג
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }

    // 3. סינון לפי חודש
    if (filterMonth) {
      result = result.filter(r => r.date.startsWith(filterMonth));
    }

    setFilteredRequests(result);
  }, [filterBranch, filterType, filterMonth, allRequests]);


  // --- חישוב סטטיסטיקה לשליח ---
  const calculateUserStats = async (req: Transaction) => {
    setCalculatingStats(true);
    
    // 1. יתרה נוכחית (כל ההיסטוריה המאושרת)
    const { data: approvedTx } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', req.user_id)
      .eq('status', 'approved');
      
    const balance = approvedTx?.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0) || 0;

    // 2. כמה פעמים עשה את הפעילות הזו החודש?
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { count: specificCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user_id)
      .eq('title', req.title) 
      .gte('date', startOfMonth); 

    setUserStats({ 
      currentBalance: balance, 
      specificActivityCount: specificCount || 0
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
      // עדכון הרשימה המקומית (הסרת הפריט שטופל)
      const updatedList = allRequests.filter(r => r.id !== selectedReq.id);
      setAllRequests(updatedList);
      // הסינון יתעדכן אוטומטית דרך ה-useEffect
      setSelectedReq(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* כותרת ראשית */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">לוח בקרה - אישורים</h1>
           <p className="text-slate-500 text-sm">ממתינות לאישור: <span className="font-bold text-blue-600">{allRequests.length}</span></p>
        </div>
        <button onClick={fetchRequests} className="bg-blue-50 text-blue-600 p-3 rounded-full hover:bg-blue-100 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* --- סרגל מסננים --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-2">
         <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <Filter size={16} /> סינון:
         </div>
         
         {/* סניף */}
         <select 
            value={filterBranch} 
            onChange={(e) => setFilterBranch(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 flex-1 w-full md:w-auto"
         >
            <option value="all">כל הסניפים</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
         </select>

         {/* סוג פעולה */}
         <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 flex-1 w-full md:w-auto"
         >
            <option value="all">כל הסוגים</option>
            <option value="income">הכנסות (דיווחים)</option>
            <option value="expense">הוצאות (קבלות)</option>
         </select>

         {/* חודש */}
         <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 flex-1 w-full md:w-auto cursor-pointer"
         />
         
         {/* כפתור איפוס */}
         {(filterBranch !== 'all' || filterType !== 'all' || filterMonth) && (
            <button 
               onClick={() => { setFilterBranch('all'); setFilterType('all'); setFilterMonth(''); }}
               className="text-red-500 text-xs font-bold hover:underline whitespace-nowrap"
            >
               נקה הכל
            </button>
         )}
      </div>

      {/* רשימת הממתינים */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? <p className="text-center text-slate-400 mt-10">טוען...</p> : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
             <Check size={40} className="mx-auto text-slate-300 mb-2" />
             <p className="text-slate-500 font-medium">
                {allRequests.length > 0 ? "אין תוצאות התואמות לסינון" : "הכל טופל! אין בקשות ממתינות"}
             </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-md transition-shadow">
               
               <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${req.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                     {req.type === 'income' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800">{req.title}</h3>
                     <p className="text-sm text-slate-500">{req.users?.first_name} {req.users?.last_name} • {req.users?.branch_name}</p>
                     <p className="text-xs text-slate-400 mt-0.5">{new Date(req.date).toLocaleDateString('he-IL')}</p>
                  </div>
               </div>

               <div className="flex items-center justify-between w-full md:w-auto gap-6">
                  <div className="text-left">
                     <span className="block text-xs text-slate-400 font-bold">סכום</span>
                     <span className="text-xl font-black text-slate-900">₪{req.amount.toLocaleString()}</span>
                  </div>
                  <button onClick={() => handleInspect(req)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors">
                     פתח
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* --- מודל בדיקה (Popup) --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
               <h2 className="font-bold text-slate-800">בדיקת בקשה - {selectedReq.users?.first_name} {selectedReq.users?.last_name}</h2>
               <button onClick={() => setSelectedReq(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               
               {/* כרטיסי מידע (סטטיסטיקה) */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* ספירת פעילות החודש */}
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 relative overflow-hidden">
                     <Activity className="absolute top-4 left-4 text-blue-200" size={40} />
                     <p className="text-blue-600 text-xs font-bold mb-1">פעילות זו החודש (סה"כ)</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-800">{calculatingStats ? "..." : userStats.specificActivityCount}</span>
                        <span className="text-sm text-slate-500">פעמים</span>
                     </div>
                     <p className="text-xs text-slate-400 mt-2">סוג: "{selectedReq.title}"</p>
                  </div>

                  {/* יתרה נוכחית */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                     <p className="text-slate-500 text-xs font-bold mb-1">יתרה נוכחית</p>
                     <span className={`text-2xl font-black ${userStats.currentBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        ₪{userStats.currentBalance.toLocaleString()}
                     </span>
                  </div>

                  {/* יתרה צפויה */}
                  <div className={`rounded-2xl p-5 border ${
                      (userStats.currentBalance + (selectedReq.type === 'income' ? selectedReq.amount : -selectedReq.amount)) < 0 
                      ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
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

               <div className="flex flex-col lg:flex-row gap-8">
                  {/* פרטי הבקשה */}
                  <div className="flex-1 space-y-6">
                     <div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">פרטים</h4>
                        <div className="text-2xl font-bold text-slate-900 mb-1">{selectedReq.title}</div>
                        <div className="text-4xl font-black text-slate-900">₪{selectedReq.amount.toLocaleString()}</div>
                     </div>

                     {/* כאן התיקון: הצגת הערות השליח */}
                     {selectedReq.details?.notes && (
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl shadow-sm">
                           <p className="text-xs font-bold text-yellow-800 mb-1 flex items-center gap-1">
                              <AlertCircle size={12}/> הערות השליח / סיבה:
                           </p>
                           <p className="text-yellow-900 text-lg font-medium leading-relaxed">
                              {selectedReq.details.notes}
                           </p>
                        </div>
                     )}

                     {/* תצוגת תשובות לשאלות מותאמות אישית - אם יש */}
                     {selectedReq.details?.custom_answers && Object.keys(selectedReq.details.custom_answers).length > 0 && (
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-sm space-y-2">
                           <p className="font-bold text-purple-900 mb-2">תשובות לשאלות נוספות:</p>
                           {Object.entries(selectedReq.details.custom_answers).map(([key, value]) => {
                              const questionLabel = selectedReq.details.custom_questions_snapshot?.find((q: any) => q.id === key)?.label || 'שאלה:';
                              return (
                                 <div key={key} className="flex justify-between border-b border-purple-100 pb-1 last:border-0">
                                    <span className="text-purple-700">{questionLabel}</span>
                                    <span className="font-bold text-purple-900">
                                        {typeof value === 'boolean' ? (value ? 'כן' : 'לא') : String(value)}
                                    </span>
                                 </div>
                              );
                           })}
                        </div>
                     )}

                     {/* פרטי בנק (אם זו בקשת הוצאה/החזר) */}
                     {selectedReq.details?.bank_details?.accountNumber && (
                        <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-sm">
                           <p className="font-bold text-slate-700 mb-2">פרטי העברה בנקאית:</p>
                           <div className="grid grid-cols-2 gap-y-2 text-slate-600">
                              <span>שם:</span> <span className="font-bold">{selectedReq.details.bank_details.ownerName}</span>
                              <span>בנק:</span> <span className="font-bold">{selectedReq.details.bank_details.bankNumber} ({selectedReq.details.bank_details.branchNumber})</span>
                              <span>חשבון:</span> <span className="font-bold">{selectedReq.details.bank_details.accountNumber}</span>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* תמונה */}
                  <div className="flex-1">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">אסמכתא</h4>
                     {selectedReq.file_url ? (
                        <a href={selectedReq.file_url} target="_blank" rel="noreferrer" className="block group relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all">
                           <img src={selectedReq.file_url} alt="קבלה" className="w-full h-64 object-contain bg-slate-50" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                 <ExternalLink size={16} /> פתח בגודל מלא
                              </span>
                           </div>
                        </a>
                     ) : (
                        <div className="h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                           <AlertCircle size={32} className="mb-2 opacity-50" />
                           <span>לא צורף קובץ</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* אזור דחייה */}
               {isRejecting && (
                  <div className="mt-8 animate-in slide-in-from-top-4">
                     <label className="block text-sm font-bold text-red-600 mb-2">סיבת הדחייה (חובה):</label>
                     <textarea 
                        value={rejectionReason} 
                        onChange={(e) => setRejectionReason(e.target.value)} 
                        className="w-full p-4 border-2 border-red-200 rounded-xl focus:border-red-500 outline-none bg-red-50/50"
                        rows={3}
                        autoFocus
                     />
                  </div>
               )}
            </div>

            {/* כפתורים */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
               {!isRejecting ? (
                 <>
                   <button onClick={() => setIsRejecting(true)} className="px-6 py-3 rounded-xl font-bold text-red-600 hover:bg-red-100 transition-colors">
                     דחה בקשה
                   </button>
                   <button onClick={() => handleProcess('approved')} className="px-8 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 active:scale-95 transition-all">
                     אשר בקשה ✓
                   </button>
                 </>
               ) : (
                 <>
                   <button onClick={() => setIsRejecting(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                     ביטול
                   </button>
                   <button onClick={() => handleProcess('rejected')} disabled={!rejectionReason} className="px-8 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all">
                     שלח דחייה
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