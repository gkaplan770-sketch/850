"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowUpRight, ArrowDownLeft, 
  Clock, AlertTriangle, XCircle, CheckCircle,
  Home, List, User, Plus, LogOut, LayoutDashboard,
  Mail 
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('user_id');
      const name = localStorage.getItem('user_name');
      if (name) setUserName(name);
      if (!userId) return;

      // חישוב יתרות
      const { data: allTx } = await supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('user_id', userId)
        .eq('status', 'approved');

      const income = allTx?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const expense = allTx?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({ balance: income - expense, income, expense });

      // שליפת פעולות אחרונות
      const { data: recent } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20); // הגדלתי ל-20 שיהיה יותר מידע

      if (recent) setRecentTransactions(recent);
      
      // שליפת הודעות
      const { data: msgs } = await supabase
        .from('messages') 
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3); 
      if (msgs) setMessages(msgs);

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // פונקציית עזר לתיאור הפעולה
  const getTransactionDescription = (t: any) => {
    if (t.status === 'rejected') {
       return `נדחה: ${t.rejection_reason || 'לא צוינה סיבה'}`;
    }
    if (t.type === 'income') {
       return `זיכוי עבור: ${t.title}`;
    }
    return `תשלום לספק: ${t.title}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex" dir="rtl">
      
      {/* תפריט צד (מוסתר בנייד) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen sticky top-0 h-screen p-6 shadow-2xl z-20">
        <div className="mb-10 flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">ח</div>
           <div>
             <h2 className="font-bold text-lg">חב"ד לנוער</h2>
             <p className="text-xs text-slate-400">פורטל שליחים</p>
           </div>
        </div>

        <nav className="space-y-2 flex-1">
           <Link href="/dashboard" className="flex items-center gap-3 bg-white/10 text-white p-3 rounded-xl transition-all">
              <LayoutDashboard size={20} /> <span className="font-bold">לוח בקרה</span>
           </Link>
           <Link href="/dashboard/transactions" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all">
              <List size={20} /> <span className="font-medium">היסטוריית פעולות</span>
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

      {/* תוכן ראשי */}
      <main className="flex-1 pb-24 md:pb-10">
        
        {/* כותרת */}
        <header className="bg-white p-6 md:p-8 shadow-sm border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 md:static">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">היי, {userName.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium">יתרה נוכחית: ₪{stats.balance.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
             <User size={20} />
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8">

          {/* כרטיסי מידע למובייל ולדסקטופ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                <span className="text-slate-300 text-sm font-medium mb-1 block">יתרה זמינה</span>
                <div className="text-5xl font-black tracking-tight my-2">
                   ₪{stats.balance.toLocaleString()}
                </div>
             </div>
             
             {/* כפתורים מהירים למובייל */}
             <div className="md:hidden grid grid-cols-2 gap-4">
                <Link href="/dashboard/add/income" className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center gap-2">
                   <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><ArrowDownLeft /></div>
                   <span className="font-bold text-sm">הוסף הכנסה</span>
                </Link>
                <Link href="/dashboard/add/expense" className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center gap-2">
                   <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><ArrowUpRight /></div>
                   <span className="font-bold text-sm">הוסף הוצאה</span>
                </Link>
             </div>
          </div>

          {/* רשימת פעולות משופרת (סעיפים 1+2) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
             <h2 className="text-xl font-bold text-slate-800 mb-6">פעולות אחרונות</h2>

             {loading ? <div className="text-center py-10">טוען...</div> : recentTransactions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">אין פעולות עדיין</div>
             ) : (
                <div className="space-y-4">
                   {recentTransactions.map((t) => (
                      <div key={t.id} className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${t.status === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                         
                         <div className="flex justify-between items-start">
                            <div className="flex gap-3 items-center">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                  t.status === 'rejected' ? 'bg-red-200 text-red-700' :
                                  t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                               }`}>
                                  {t.status === 'rejected' ? <XCircle size={20}/> : (t.type === 'income' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>)}
                               </div>
                               <div>
                                  <div className="font-bold text-slate-900 text-sm md:text-base">
                                     {/* תיקון סעיף 1: כותרת ברורה עם סוג הפעולה */}
                                     {t.status === 'rejected' ? 'הבקשה נדחתה' : t.title}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                     {new Date(t.date).toLocaleDateString('he-IL')} • {t.status === 'pending' ? 'ממתין לאישור' : (t.status === 'approved' ? 'אושר' : 'נדחה')}
                                  </div>
                               </div>
                            </div>
                            <div className={`text-lg font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'} ${t.status === 'rejected' ? 'line-through opacity-50' : ''}`}>
                               {t.type === 'income' ? '+' : '-'}₪{t.amount.toLocaleString()}
                            </div>
                         </div>

                         {/* תיקון סעיף 1 ו-2: פירוט מלא של הסיבה/הסוג */}
                         <div className="bg-white/50 p-2 rounded-lg text-sm text-slate-700 mt-1">
                            {getTransactionDescription(t)}
                         </div>

                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </main>

      {/* תפריט תחתון למובייל */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t py-3 px-6 flex justify-between z-50">
         <Link href="/dashboard" className="text-blue-600 flex flex-col items-center"><Home size={24}/><span className="text-[10px]">בית</span></Link>
         <div className="-mt-8"><Link href="/dashboard/add/income" className="bg-slate-900 text-white p-4 rounded-full shadow-lg block"><Plus size={28}/></Link></div>
         <Link href="/dashboard/transactions" className="text-slate-400 flex flex-col items-center"><List size={24}/><span className="text-[10px]">פעולות</span></Link>
      </div>
    </div>
  );
}