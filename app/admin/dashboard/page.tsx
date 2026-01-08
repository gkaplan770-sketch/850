"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, X, RefreshCw, Activity, 
  ArrowUpRight, ArrowDownLeft, ExternalLink, 
  AlertCircle, Filter, Calendar, Users, MapPin
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
  const [allRequests, setAllRequests] = useState<Transaction[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<Transaction | null>(null);
  
  // -- מסננים --
  const [branches, setBranches] = useState<string[]>([]);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');

  // נתונים סטטיסטיים מעודכנים
  const [userStats, setUserStats] = useState({ 
    currentBalance: 0, 
    monthCountBoys: 0,
    monthCountGirls: 0
  });
  
  const [calculatingStats, setCalculatingStats] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*, users(first_name, last_name, branch_name)')
      .eq('status', 'pending')
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else if (data) {
      // הגנה מפני נתונים חסרים
      const safeData = data.map((item: any) => ({
          ...item,
          users: item.users || { first_name: 'לא ידוע', last_name: '', branch_name: '---' }
      }));

      setAllRequests(safeData);
      setFilteredRequests(safeData);
      
      const uniqueBranches = Array.from(new Set(safeData.map(r => r.users?.branch_name).filter(Boolean))) as string[];
      setBranches(uniqueBranches);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  // -- מנוע הסינון --
  useEffect(() => {
    let result = allRequests;

    if (filterBranch !== 'all') {
      result = result.filter(r => r.users?.branch_name === filterBranch);
    }

    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }

    if (filterMonth) {
      result = result.filter(r => r.date.startsWith(filterMonth));
    }

    setFilteredRequests(result);
  }, [filterBranch, filterType, filterMonth, allRequests]);


  // --- חישוב סטטיסטיקה מופרדת (בנים/בנות) ---
  const calculateUserStats = async (req: Transaction) => {
    setCalculatingStats(true);
    
    // 1. יתרה נוכחית
    const { data: approvedTx } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', req.user_id)
      .eq('status', 'approved');
      
    const balance = approvedTx?.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0) || 0;

    // 2. ספירה מופרדת לחודש הנוכחי
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // שולפים את כל הפעולות הדומות מהחודש האחרון (כולל פרטים)
    const { data: monthActivity } = await supabase
      .from('transactions')
      .select('details')
      .eq('user_id', req.user_id)
      .eq('title', req.title) 
      .gte('date', startOfMonth);

    let boys = 0;
    let girls = 0;

    if (monthActivity) {
        monthActivity.forEach((item: any) => {
            if (item.details?.audience === 'boys') boys++;
            else if (item.details?.audience === 'girls') girls++;
            else boys++; // ברירת מחדל אם לא מוגדר
        });
    }

    setUserStats({ 
      currentBalance: balance, 
      monthCountBoys: boys,
      monthCountGirls: girls
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
      const updatedList = allRequests.filter(r => r.id !== selectedReq.id);
      setAllRequests(updatedList);
      setFilteredRequests(prev => prev.filter(r => r.id !== selectedReq.id));
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

      {/* סרגל מסננים */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
         <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <Filter size={16} /> סינון:
         </div>
         <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 flex-1 w-full md:w-auto">
            <option value="all">כל הסניפים</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
         </select>
         <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 flex-1 w-full md:w-auto">
            <option value="all">כל הסוגים</option>
            <option value="income">הכנסות (דיווחים)</option>
            <option value="expense">הוצאות (קבלות)</option>
         </select>
         <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 flex-1 w-full md:w-auto cursor-pointer" />
         {(filterBranch !== 'all' || filterType !== 'all' || filterMonth) && (
            <button onClick={() => { setFilterBranch('all'); setFilterType('all'); setFilterMonth(''); }} className="text-red-500 text-xs font-bold hover:underline whitespace-nowrap">נקה הכל</button>
         )}
      </div>

      {/* --- רשימת הממתינים בתצוגת Grid (ריבועים) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? <div className="col-span-full text-center text-slate-400 mt-10">טוען...</div> : filteredRequests.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
             <Check size={40} className="mx-auto text-slate-300 mb-2" />
             <p className="text-slate-500 font-medium">אין בקשות ממתינות</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden h-full min-h-[220px]">
               
               {/* פס צבעוני עליון */}
               <div className={`absolute top-0 left-0 w-full h-1.5 ${req.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>

               <div>
                   <div className="flex justify-between items-start mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${req.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                         {req.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-mono">
                         {new Date(req.date).toLocaleDateString('he-IL')}
                      </span>
                   </div>

                   <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1" title={req.title}>{req.title}</h3>
                   <div className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1">
                      <Users size={12} className="text-slate-400"/> {req.users?.first_name} {req.users?.last_name}
                   </div>
                   
                   {/* תצוגת סניף */}
                   <div className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block font-bold mb-4">
                      {req.users?.branch_name}
                   </div>
               </div>

               <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-4">
                  <div className="text-right">
                     <span className="block text-[10px] text-slate-400 font-bold uppercase">סכום</span>
                     <span className={`text-xl font-black ${req.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        ₪{req.amount.toLocaleString()}
                     </span>
                  </div>
                  <button onClick={() => handleInspect(req)} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-lg hover:bg-slate-800 transition-colors">
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
                  {/* ספירת פעילות החודש - מופרדת */}
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 relative overflow-hidden">
                     <Activity className="absolute top-4 left-4 text-blue-200" size={40} />
                     <p className="text-blue-600 text-xs font-bold mb-2">פעילות זו החודש (סה"כ)</p>
                     
                     <div className="flex gap-4">
                         <div>
                             <span className="text-2xl font-black text-blue-800">{calculatingStats ? "-" : userStats.monthCountBoys}</span>
                             <span className="text-[10px] text-blue-500 block font-bold">בנים</span>
                         </div>
                         <div className="w-px bg-blue-200 h-8 self-center"></div>
                         <div>
                             <span className="text-2xl font-black text-pink-600">{calculatingStats ? "-" : userStats.monthCountGirls}</span>
                             <span className="text-[10px] text-pink-400 block font-bold">בנות</span>
                         </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                     <p className="text-slate-500 text-xs font-bold mb-1">יתרה נוכחית</p>
                     <span className={`text-2xl font-black ${userStats.currentBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        ₪{userStats.currentBalance.toLocaleString()}
                     </span>
                  </div>

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
                  <div className="flex-1 space-y-6">
                     <div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">פרטי הפעילות</h4>
                        <div className="text-2xl font-bold text-slate-900 mb-1">{selectedReq.title}</div>
                        
                        {/* תצוגת התאריך העברי */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedReq.details?.hebrew_date && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                                    <Calendar size={14} /> {selectedReq.details.hebrew_date}
                                </div>
                            )}
                            
                            {/* תצוגת כמות וקהל (בנים/בנות) */}
                            {selectedReq.details?.participants && (
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold ${selectedReq.details.audience === 'girls' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                                    <Users size={14} /> 
                                    {selectedReq.details.participants} משתתפים 
                                    ({selectedReq.details.audience === 'girls' ? 'בנות' : 'בנים'})
                                </div>
                            )}
                        </div>

                        <div className="text-4xl font-black text-slate-900 mt-4">₪{selectedReq.amount.toLocaleString()}</div>
                     </div>

                     {/* הערות שליח */}
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

                     {/* שאלות ותשובות נוספות */}
                     {selectedReq.details?.custom_answers && Object.keys(selectedReq.details.custom_answers).length > 0 && (
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-sm space-y-3">
                           <p className="font-bold text-purple-900 mb-2 underline decoration-purple-200">פרטים נוספים מהדיווח:</p>
                           {Object.entries(selectedReq.details.custom_answers).map(([key, val]: any) => {
                              const questionSnapshot = selectedReq.details.custom_questions_snapshot || [];
                              const qLabel = questionSnapshot.find((q:any) => q.id === key)?.label || "שאלה";
                              return (
                                 <div key={key} className="flex justify-between text-sm border-b border-purple-100 last:border-0 pb-1">
                                    <span className="text-purple-600">{qLabel}:</span>
                                    <span className="font-bold text-purple-900">{typeof val === 'boolean' ? (val ? 'כן' : 'לא') : val}</span>
                                 </div>
                              )
                           })}
                        </div>
                     )}
                     
                     {/* פרטי בנק */}
                     {selectedReq.details?.bank_details?.accountNumber && (
                        <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-sm">
                           <p className="font-bold text-slate-700 mb-2">פרטי העברה בנקאית:</p>
                           <div className="grid grid-cols-2 gap-y-2 text-slate-600">
                              <span>שם:</span> <span className="font-bold">{selectedReq.details.bank_details.ownerName || selectedReq.details.bank_details.owner_name}</span>
                              <span>בנק:</span> <span className="font-bold">{selectedReq.details.bank_details.bankNumber || selectedReq.details.bank_details.bank_name}</span>
                              <span>סניף:</span> <span className="font-bold">{selectedReq.details.bank_details.branchNumber || selectedReq.details.bank_details.branch}</span>
                              <span>חשבון:</span> <span className="font-bold">{selectedReq.details.bank_details.accountNumber || selectedReq.details.bank_details.account}</span>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="flex-1">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">אסמכתא / תמונה</h4>
                     {selectedReq.file_url ? (
                        <a href={selectedReq.file_url} target="_blank" rel="noreferrer" className="block group relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all">
                           <img src={selectedReq.file_url} alt="קבלה" className="w-full h-80 object-contain bg-slate-100" />
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