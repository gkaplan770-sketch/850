"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, RefreshCw, ArrowUpRight, ArrowDownLeft, 
  CheckCircle, Clock, XCircle, AlertTriangle,
  Home, List, Plus, LayoutDashboard, LogOut
} from "lucide-react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TransactionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); 

    if (!error) {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter || (filter === 'expense' && t.type === 'supplier');
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex" dir="rtl">
      
      {/* --- תפריט צד למחשב (מוסתר בנייד) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen sticky top-0 h-screen p-6 shadow-2xl z-20">
        <div className="mb-10 flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">ח</div>
           <div>
             <h2 className="font-bold text-lg">חב"ד לנוער</h2>
             <p className="text-xs text-slate-400">פורטל שליחים</p>
           </div>
        </div>

        <nav className="space-y-2 flex-1">
           <Link href="/dashboard" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all">
              <LayoutDashboard size={20} /> <span className="font-medium">לוח בקרה</span>
           </Link>
           <Link href="/dashboard/transactions" className="flex items-center gap-3 bg-white/10 text-white p-3 rounded-xl transition-all">
              <List size={20} /> <span className="font-bold">היסטוריית פעולות</span>
           </Link>
           <Link href="/dashboard/add/income" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all">
              <ArrowDownLeft size={20} /> <span className="font-medium">עדכון הכנסה</span>
           </Link>
           <Link href="/dashboard/add/expense" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all">
              <ArrowUpRight size={20} /> <span className="font-medium">בקשת תשלום</span>
           </Link>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:bg-red-900/20 p-3 rounded-xl mt-auto transition-all">
           <LogOut size={20} /> <span className="font-bold">יציאה</span>
        </button>
      </aside>

      {/* --- תוכן ראשי --- */}
      <div className="flex-1 pb-24 md:pb-10 w-full">
        
        {/* כותרת */}
        <div className="bg-white p-5 md:p-8 shadow-sm border-b border-slate-100 sticky top-0 z-10 flex justify-between items-center">
           <div className="flex items-center gap-3">
               <Link href="/dashboard" className="md:hidden w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600">
                  <ArrowRight size={18} />
               </Link>
               <h1 className="text-lg md:text-2xl font-black text-slate-800">היסטוריית פעולות</h1>
           </div>
           <button onClick={fetchTransactions} className="bg-blue-50 text-blue-600 p-2 md:p-3 rounded-full hover:bg-blue-100 transition-colors">
              <RefreshCw size={18} />
           </button>
        </div>

        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          
          {/* טאבים לסינון */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm sticky top-20 md:top-24 z-10">
              <button onClick={() => setFilter('all')} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all ${filter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>הכל</button>
              <button onClick={() => setFilter('income')} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all ${filter === 'income' ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:text-slate-600'}`}>הכנסות</button>
              <button onClick={() => setFilter('expense')} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all ${filter === 'expense' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:text-slate-600'}`}>הוצאות</button>
          </div>

          {/* רשימה */}
          <div className="space-y-3">
             {loading ? <div className="text-center text-slate-400 py-10 text-sm">טוען נתונים...</div> : filteredTransactions.length === 0 ? (
                <div className="text-center py-20 opacity-60 bg-slate-100 rounded-3xl border border-dashed border-slate-200">
                   <p className="font-bold text-slate-500">לא נמצאו פעולות בקטגוריה זו</p>
                </div>
             ) : (
                filteredTransactions.map((item) => (
                   <div key={item.id} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                      
                      {/* פס צבעוני בצד ימין לפי סטטוס */}
                      <div className={`absolute top-0 right-0 bottom-0 w-1.5 md:w-2 ${
                         item.status === 'approved' ? 'bg-green-500' : 
                         item.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-400'
                      }`}></div>

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mr-3 gap-4 md:gap-0">
                         <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                               item.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                               {item.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                            </div>
                            <div>
                               <h3 className="font-bold text-slate-900 text-base md:text-lg">{item.title}</h3>
                               <p className="text-xs md:text-sm text-slate-400 font-medium mt-0.5">
                                  {new Date(item.date).toLocaleDateString('he-IL')} • {item.details?.supplierName || (item.type === 'income' ? 'הכנסה' : 'הוצאה')}
                               </p>
                            </div>
                         </div>
                         
                         <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pl-2 md:pl-0 border-t md:border-0 border-slate-50 pt-3 md:pt-0">
                            <div className={`text-xl md:text-2xl font-black ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                               {item.type === 'income' ? '+' : '-'}₪{item.amount.toLocaleString()}
                            </div>
                            
                            {/* תגית סטטוס */}
                            <div className="flex justify-end mt-1">
                               {item.status === 'approved' && <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={12}/> אושר</span>}
                               {item.status === 'pending' && <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><Clock size={12}/> ממתין</span>}
                               {item.status === 'rejected' && <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle size={12}/> נדחה</span>}
                            </div>
                         </div>
                      </div>

                      {/* אזור דחייה - בולט וברור */}
                      {item.status === 'rejected' && (
                         <div className="mt-4 bg-red-50 rounded-xl p-3 border border-red-100 flex gap-2 items-start animate-in fade-in mr-2">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                            <div>
                               <p className="text-xs font-bold text-red-700 mb-0.5">הבקשה נדחתה:</p>
                               <p className="text-sm text-red-800 leading-tight">{item.rejection_reason || "לא צוינה סיבה"}</p>
                            </div>
                         </div>
                      )}
                   </div>
                ))
             )}
          </div>
        </div>
      </div>

      {/* --- סרגל ניווט תחתון (לנייד בלבד) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3 px-6 pb-6 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl">
         
         <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
            <Home size={24} />
            <span className="text-[10px] font-medium">ראשי</span>
         </Link>

         {/* כפתור אמצעי */}
         <div className="relative -top-5">
            <Link href="/dashboard/add/income" className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl shadow-slate-900/30 hover:scale-105 transition-transform">
               <Plus size={28} />
            </Link>
         </div>

         <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 text-blue-600">
            <div className="p-1 rounded-xl bg-blue-50">
               <List size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold">פעולות</span>
         </Link>
      </div>

    </div>
  );
}