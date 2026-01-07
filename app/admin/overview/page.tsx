"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, TrendingDown, Activity, 
  Calendar, ArrowUpCircle, ArrowDownCircle 
} from "lucide-react";

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    boys: 0,
    girls: 0,
    totalIncome: 0,
    totalExpense: 0
  });
  
  // חודש נוכחי כברירת מחדל (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchStats = async () => {
    setLoading(true);
    
    // חישוב טווח תאריכים לחודש הנבחר (מה-1 לחודש עד סוף החודש)
    const startOfMonth = `${selectedMonth}-01`;
    const [year, month] = selectedMonth.split('-').map(Number);
    // טריק למציאת היום האחרון בחודש
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${selectedMonth}-${lastDay}`;

    // שליפת עסקאות מאושרות בלבד בטווח התאריכים
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, type, details')
      .eq('status', 'approved')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (!error && transactions) {
      let b = 0;
      let g = 0;
      let inc = 0;
      let exp = 0;

      transactions.forEach((t: any) => {
        if (t.type === 'income') {
          // זה כסף שהגיע לשלוחים (זיכוי)
          inc += t.amount;
          
          // חישוב משתתפים (נמצא בתוך הפרטים של הכנסה)
          if (t.details) {
            const count = Number(t.details.participants) || 0;
            if (t.details.audience === 'girls') {
              g += count;
            } else {
              // ברירת מחדל בנים (או אם מוגדר boys)
              b += count;
            }
          }
        } else if (t.type === 'expense') {
          // זה כסף שהם משכו (הוצאה)
          exp += t.amount;
        }
      });

      setStats({
        boys: b,
        girls: g,
        totalIncome: inc,
        totalExpense: exp
      });
    }
    setLoading(false);
  };

  // רענון הנתונים בכל פעם שבוחרים חודש אחר
  useEffect(() => {
    fetchStats();
  }, [selectedMonth]);

  return (
    <div className="space-y-8 pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">סטטיסטיקה ונתונים</h2>
          <p className="text-slate-500 mt-1">סיכום פעילות כספית וכמותית</p>
        </div>
        
        {/* בחירת חודש */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
           <Calendar className="text-slate-400" size={20} />
           <input 
             type="month" 
             value={selectedMonth}
             onChange={(e) => setSelectedMonth(e.target.value)}
             className="bg-transparent outline-none text-slate-700 font-bold cursor-pointer"
           />
        </div>
      </div>

      {/* כרטיסים ראשיים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* כרטיס הכנסות (הגיע לשלוחים) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-green-100 p-3 rounded-xl text-green-600"><ArrowDownCircle size={24}/></div>
              <span className="text-xs font-bold text-slate-400">הגיע לשלוחים (זיכויים)</span>
           </div>
           <h3 className="text-3xl font-black text-slate-900 dir-ltr text-right">
             {loading ? '...' : `₪${stats.totalIncome.toLocaleString()}`}
           </h3>
           <p className="text-sm text-slate-500 mt-2">סכום הכסף שנכנס לחשבונות השלוחים</p>
        </div>

        {/* כרטיס הוצאות (משכו) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-red-100 p-3 rounded-xl text-red-600"><ArrowUpCircle size={24}/></div>
              <span className="text-xs font-bold text-slate-400">משכו (הוצאות)</span>
           </div>
           <h3 className="text-3xl font-black text-slate-900 dir-ltr text-right">
             {loading ? '...' : `₪${stats.totalExpense.toLocaleString()}`}
           </h3>
           <p className="text-sm text-slate-500 mt-2">סכום הכסף שהוצא/שולם על ידי השלוחים</p>
        </div>

        {/* כרטיס משתתפים */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Users size={24}/></div>
              <span className="text-xs font-bold text-slate-400">סה"כ משתתפים</span>
           </div>
           <h3 className="text-3xl font-black text-slate-900">
             {loading ? '...' : (stats.boys + stats.girls).toLocaleString()}
           </h3>
           <div className="flex gap-4 mt-2 text-xs font-bold">
              <span className="text-blue-600 flex items-center gap-1">
                 <div className="w-2 h-2 bg-blue-600 rounded-full"></div> {stats.boys.toLocaleString()} נערים
              </span>
              <span className="text-pink-600 flex items-center gap-1">
                 <div className="w-2 h-2 bg-pink-600 rounded-full"></div> {stats.girls.toLocaleString()} נערות
              </span>
           </div>
        </div>
      </div>

      {/* גרף ויזואלי פשוט */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
         <h3 className="font-bold text-slate-900 mb-6">התפלגות מגדרית החודש</h3>
         {stats.boys + stats.girls === 0 ? (
            <p className="text-slate-400 text-sm">אין נתונים להצגה בחודש זה</p>
         ) : (
            <div className="flex h-8 rounded-full overflow-hidden w-full max-w-lg mx-auto bg-slate-100">
               <div 
                 className="bg-blue-500 h-full transition-all duration-500" 
                 style={{ width: `${(stats.boys / (stats.boys + stats.girls)) * 100}%` }}
               ></div>
               <div 
                 className="bg-pink-500 h-full transition-all duration-500" 
                 style={{ width: `${(stats.girls / (stats.boys + stats.girls)) * 100}%` }}
               ></div>
            </div>
         )}
         <div className="flex justify-center gap-8 mt-4 text-sm font-medium">
            <span className="text-blue-600">נערים ({stats.boys + stats.girls > 0 ? Math.round((stats.boys / (stats.boys + stats.girls)) * 100) : 0}%)</span>
            <span className="text-pink-600">נערות ({stats.boys + stats.girls > 0 ? Math.round((stats.girls / (stats.boys + stats.girls)) * 100) : 0}%)</span>
         </div>
      </div>

    </div>
  );
}