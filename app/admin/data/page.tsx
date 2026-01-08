"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Database, Filter, Download, Search, 
  Calendar, CreditCard, Users, RefreshCw, X 
} from "lucide-react";
import * as XLSX from 'xlsx';

interface Transaction {
  id: string;
  created_at: string;
  date: string;
  amount: number;
  title: string;
  type: 'income' | 'expense';
  status: string;
  details?: any;
  users?: { first_name: string; last_name: string; branch_name: string; teudat_zehut: string; };
}

export default function DataCenterPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- מסננים ---
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('all');
  const [type, setType] = useState('all'); // income / expense
  const [subType, setSubType] = useState('all'); // supplier / refund / activity
  const [audience, setAudience] = useState('all'); // boys / girls (רק להכנסות)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // רשימות לבחירה
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // --- 1. טעינת כל הנתונים ---
  const fetchData = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*, users(first_name, last_name, branch_name, teudat_zehut)')
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
      setFilteredData(data);

      // חילוץ סניפים
      const uniqueBranches = Array.from(new Set(data.map((t: any) => t.users?.branch_name).filter(Boolean)));
      setBranches(uniqueBranches.sort() as string[]);
    }
    setLoading(false);
  };

  // --- 2. המנוע: סינון הנתונים ---
  useEffect(() => {
    let result = transactions;

    // חיפוש טקסט חופשי (בשם, כותרת, ת.ז או הערות)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.details?.notes?.toLowerCase().includes(q) ||
        `${t.users?.first_name} ${t.users?.last_name}`.toLowerCase().includes(q) ||
        t.users?.branch_name?.toLowerCase().includes(q) ||
        t.users?.teudat_zehut?.includes(q)
      );
    }

    // סינון לפי סניף
    if (branch !== 'all') {
      result = result.filter(t => t.users?.branch_name === branch);
    }

    // סינון לפי סוג ראשי (הכנסה/הוצאה)
    if (type !== 'all') {
      result = result.filter(t => t.type === type);
    }

    // סינון לפי תת-סוג (פעילות, ספק, החזר)
    if (subType !== 'all') {
       if (subType === 'activity') {
          // פעילות = הכנסה שמחושבת ע"י המערכת או ידנית
          result = result.filter(t => t.type === 'income');
       } else if (subType === 'supplier') {
          result = result.filter(t => t.type === 'expense' && t.details?.mode !== 'refund');
       } else if (subType === 'refund') {
          result = result.filter(t => t.type === 'expense' && t.details?.mode === 'refund');
       }
    }

    // סינון לפי קהל (בנים/בנות) - רלוונטי רק לפעילויות
    if (audience !== 'all') {
       result = result.filter(t => t.details?.audience === audience);
    }

    // סינון תאריכים
    if (startDate) {
      result = result.filter(t => t.date >= startDate);
    }
    if (endDate) {
      result = result.filter(t => t.date <= endDate);
    }

    setFilteredData(result);
  }, [search, branch, type, subType, audience, startDate, endDate, transactions]);

  // --- 3. ייצוא לאקסל ---
  const exportToExcel = () => {
    const rows = filteredData.map(t => ({
       'תאריך': new Date(t.date).toLocaleDateString('he-IL'),
       'שם השליח': `${t.users?.first_name} ${t.users?.last_name}`,
       'סניף': t.users?.branch_name,
       'סוג פעולה': t.type === 'income' ? 'הכנסה' : 'הוצאה',
       'נושא': t.title,
       'סכום': t.amount,
       'קהל': t.details?.audience === 'boys' ? 'בנים' : (t.details?.audience === 'girls' ? 'בנות' : '-'),
       'משתתפים': t.details?.participants || '-',
       'הערות': t.details?.notes || '',
       'סטטוס': t.status === 'approved' ? 'אושר' : (t.status === 'pending' ? 'ממתין' : 'נדחה')
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "נתונים");
    XLSX.writeFile(wb, `export_data_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // --- סיכומים מהירים ---
  const totalIncome = filteredData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // כפתור איפוס מסננים
  const clearFilters = () => {
      setSearch(''); setBranch('all'); setType('all'); setSubType('all'); 
      setAudience('all'); setStartDate(''); setEndDate('');
  };

  return (
    <div className="space-y-6 pb-20 p-8" dir="rtl">
      
      {/* כותרת */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
             <Database className="text-indigo-600" /> מרכז נתונים
          </h1>
          <p className="text-slate-500 mt-1">חיתוך וניתוח כל המידע במערכת</p>
        </div>
        <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-green-700 transition-all">
           <Download size={20} /> ייצוא לאקסל
        </button>
      </div>

      {/* --- סרגל מסננים מתקדם --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
         
         <div className="flex justify-between items-center border-b border-slate-50 pb-2">
             <div className="font-bold text-slate-700 flex items-center gap-2">
                 <Filter size={18} className="text-indigo-500"/> סינון מתקדם
             </div>
             <button onClick={clearFilters} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                 <X size={14}/> אפס הכל
             </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* חיפוש חופשי */}
             <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                 <input 
                   type="text" 
                   placeholder="חיפוש חופשי (שם, נושא, הערה...)" 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
                 <Search className="absolute left-3 top-3 text-slate-400" size={18} />
             </div>

             {/* סניף */}
             <select value={branch} onChange={e => setBranch(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500">
                 <option value="all">כל הסניפים</option>
                 {branches.map(b => <option key={b} value={b}>{b}</option>)}
             </select>

             {/* תאריך התחלה */}
             <div className="relative">
                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-600" />
                 <span className="absolute -top-2 right-2 bg-white px-1 text-[10px] text-slate-400">מתאריך</span>
             </div>

             {/* תאריך סיום */}
             <div className="relative">
                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-600" />
                 <span className="absolute -top-2 right-2 bg-white px-1 text-[10px] text-slate-400">עד תאריך</span>
             </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
             {/* סוג ראשי */}
             <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setType('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${type === 'all' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>הכל</button>
                 <button onClick={() => setType('income')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>הכנסות</button>
                 <button onClick={() => setType('expense')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>הוצאות</button>
             </div>

             {/* תת סוג */}
             <select value={subType} onChange={e => setSubType(e.target.value)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm">
                 <option value="all">כל הסוגים</option>
                 <option value="activity">פעילויות (הכנסה)</option>
                 <option value="supplier">ספקים וקבלות (הוצאה)</option>
                 <option value="refund">החזרי הוצאות (הוצאה)</option>
             </select>

             {/* קהל יעד */}
             <div className={`flex bg-slate-100 p-1 rounded-xl ${type === 'expense' ? 'opacity-50 pointer-events-none' : ''}`}>
                 <button onClick={() => setAudience('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${audience === 'all' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>כל קהל</button>
                 <button onClick={() => setAudience('boys')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${audience === 'boys' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>בנים</button>
                 <button onClick={() => setAudience('girls')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${audience === 'girls' ? 'bg-white shadow text-pink-600' : 'text-slate-500'}`}>בנות</button>
             </div>
         </div>
      </div>

      {/* --- כרטיסי סיכום --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-slate-500 text-xs font-bold mb-1">סה"כ רשומות</div>
              <div className="text-2xl font-black text-slate-800">{filteredData.length}</div>
          </div>
          <div className="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm">
              <div className="text-green-600 text-xs font-bold mb-1">סה"כ הכנסות (בסינון)</div>
              <div className="text-2xl font-black text-green-700">₪{totalIncome.toLocaleString()}</div>
          </div>
          <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
              <div className="text-red-600 text-xs font-bold mb-1">סה"כ הוצאות (בסינון)</div>
              <div className="text-2xl font-black text-red-700">₪{totalExpense.toLocaleString()}</div>
          </div>
      </div>

      {/* --- טבלה --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4">תאריך</th>
                     <th className="px-6 py-4">שם השליח</th>
                     <th className="px-6 py-4">סניף</th>
                     <th className="px-6 py-4">סוג</th>
                     <th className="px-6 py-4">נושא / כותרת</th>
                     <th className="px-6 py-4">סכום</th>
                     <th className="px-6 py-4">פרטים נוספים</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                     <tr><td colSpan={7} className="text-center py-10 text-slate-400">טוען נתונים...</td></tr>
                  ) : filteredData.length === 0 ? (
                     <tr><td colSpan={7} className="text-center py-10 text-slate-400 font-bold">לא נמצאו תוצאות לסינון זה</td></tr>
                  ) : (
                     filteredData.slice(0, 100).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-mono text-slate-600">{new Date(t.date).toLocaleDateString('he-IL')}</td>
                           <td className="px-6 py-4 font-bold text-slate-800">{t.users?.first_name} {t.users?.last_name}</td>
                           <td className="px-6 py-4 text-slate-600">{t.users?.branch_name}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {t.type === 'income' ? 'הכנסה' : 'הוצאה'}
                              </span>
                           </td>
                           <td className="px-6 py-4 font-medium">{t.title}</td>
                           <td className={`px-6 py-4 font-bold dir-ltr text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              ₪{t.amount.toLocaleString()}
                           </td>
                           <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                              {t.details?.notes || (t.details?.audience ? `קהל: ${t.details.audience === 'boys' ? 'בנים' : 'בנות'}` : '-')}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
            {filteredData.length > 100 && (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                    מציג 100 תוצאות ראשונות מתוך {filteredData.length}. השתמש בייצוא לאקסל לצפייה בכולן.
                </div>
            )}
         </div>
      </div>

    </div>
  );
}