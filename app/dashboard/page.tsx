"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowUpRight, ArrowDownLeft, 
  XCircle, CheckCircle, Clock,
  Home, List, User, Plus, LogOut, LayoutDashboard,
  Mail, TrendingUp, TrendingDown, AlertTriangle 
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  
  // משתנים לשמירת נתונים
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });
  const [prevMonthName, setPrevMonthName] = useState('');
  
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

      // 1. חישוב תאריכים לחודש הקודם
      const now = new Date();
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const monthName = prevDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      setPrevMonthName(monthName);

      const startStr = prevDate.toISOString().split('T')[0];
      const endStr = prevMonthEnd.toISOString().split('T')[0];

      // 2. שליפת כל העסקאות המאושרות לחישוב יתרה
      const { data: allTx } = await supabase
        .from('transactions')
        .select('amount, type, status, date')
        .eq('user_id', userId)
        .eq('status', 'approved');

      if (allTx) {
        const totalBalance = allTx.reduce((acc, t) => {
          return acc + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);

        const prevIncome = allTx
          .filter(t => t.type === 'income' && t.date >= startStr && t.date <= endStr)
          .reduce((sum, t) => sum + t.amount, 0);

        const prevExpense = allTx
          .filter(t => t.type === 'expense' && t.date >= startStr && t.date <= endStr)
          .reduce((sum, t) => sum + t.amount, 0);

        setStats({ 
          balance: totalBalance, 
          income: prevIncome, 
          expense: prevExpense 
        });
      }

      // 3. שליפת פעולות אחרונות (כולל סיבת דחייה ופרטים)
      const { data: recent } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (recent) setRecentTransactions(recent);
      
      // 4. שליפת הודעות
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

  // פונקציה שמחזירה תאריך עברי
  const getHebrewDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', { calendar: 'hebrew', day: 'numeric', month: 'long' });
    } catch (e) {
      return '';
    }
  };

  // פונקציה לבניית התיאור המפורט (סעיף 1 ברשימה שלך)
  const getTransactionDescription = (t: any) => {
    // אם נדחה - מציגים את הסיבה
    if (t.status === 'rejected') {
       return `סיבת הדחייה: ${t.rejection_reason || 'לא צוינה סיבה'}`;
    }
    // אם זו הכנסה
    if (t.type === 'income') {
       return `זיכוי עבור: ${t.title}`;
    }
    // אם זו הוצאה
    return `תשלום לספק: ${t.title}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex" dir="rtl">
      
      {/* --- תפריט צד למחשב --- */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white min-h-screen sticky top-0 h-screen p-6 shadow-2xl z-20">
        <div className="mb-8 flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">ח</div>
           <div>
             <h2 className="font-bold text-lg">חב"ד לנוער</h2>
             <p className="text-xs text-slate-400">פורטל שליחים</p>
           </div>
        </div>

        <nav className="space-y-2 mb-8">
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

        {!loading && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mb-4">
             <h3 className="text-xs font-bold text-slate-400 mb-3 border-b border-slate-700 pb-2 uppercase">
                סיכום חודש {prevMonthName}
             </h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-green-400 text-sm">
                      <TrendingUp size={16} /> <span>הכנסות</span>
                   </div>
                   <span className="font-bold font-mono text-green-400">₪{stats.income.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-red-400 text-sm">
                      <TrendingDown size={16} /> <span>הוצאות</span>
                   </div>
                   <span className="font-bold font-mono text-red-400">₪{stats.expense.toLocaleString()}</span>
                </div>
             </div>
          </div>
        )}

        <div className="mt-auto">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 text-red-400 hover:bg-red-900/20 p-3 rounded-xl transition-all">
             <LogOut size={20} /> <span className="font-bold">יציאה</span>
          </button>
        </div>
      </aside>

      {/* --- תוכן ראשי --- */}
      <main className="flex-1 pb-24 md:pb-10">
        
        <header className="bg-white p-6 md:p-8 shadow-sm border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 md:static">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">היי, {userName.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium">ברוך הבא לאזור האישי</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
             <User size={20} />
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8">

          {/* כרטיס יתרה */}
          <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-900/20 relative overflow-hidden group text-center md:text-right">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
             
             <div className="relative z-10">
                <span className="text-slate-400 text-lg font-bold mb-2 block">יתרה זמינה בקופה</span>
                <div className="text-6xl md:text-7xl font-black tracking-tight my-2">
                   ₪{stats.balance.toLocaleString()}
                </div>
                <p className="text-slate-500 text-sm mt-4 font-medium opacity-80">
                  {getHebrewDate(new Date().toISOString())} • {new Date().toLocaleDateString('he-IL')}
                </p>
             </div>
          </div>

          {/* כפתורים מהירים למובייל */}
          <div className="md:hidden grid grid-cols-2 gap-4">
             <Link href="/dashboard/add/income" className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><ArrowDownLeft /></div>
                <span className="font-bold text-sm">הוסף הכנסה</span>
             </Link>
             <Link href="/dashboard/add/expense" className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><ArrowUpRight /></div>
                <span className="font-bold text-sm">הוסף הוצאה</span>
             </Link>
          </div>

          {/* הודעות */}
          {messages.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                <Mail size={20} /> הודעות והעדכונים
              </h3>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-white p-4 rounded-2xl border border-blue-100 text-sm text-slate-700">
                    <p className="font-bold mb-1">{msg.title}</p>
                    <p>{msg.content}</p>
                    <div className="text-xs text-slate-400 mt-2">
                      {new Date(msg.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* רשימת פעולות */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
             <h2 className="text-xl font-bold text-slate-800 mb-6">פעולות אחרונות</h2>

             {loading ? <div className="text-center py-10">טוען...</div> : recentTransactions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">אין פעולות עדיין</div>
             ) : (
                <div className="space-y-4">
                   {recentTransactions.map((t) => (
                      <div key={t.id} className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${t.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                         
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
                                     {t.type === 'income' ? `זיכוי: ${t.title}` : `חיוב: ${t.title}`}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                     {/* הצגת תאריך עברי ולועזי */}
                                     {getHebrewDate(t.date)} • {new Date(t.date).toLocaleDateString('he-IL')} 
                                     <span className="mx-1">•</span> 
                                     {t.status === 'pending' ? 'ממתין לאישור' : (t.status === 'approved' ? 'אושר' : 'נדחה')}
                                  </div>
                               </div>
                            </div>
                            <div className={`text-lg font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'} ${t.status === 'rejected' ? 'line-through opacity-50' : ''}`}>
                               {t.type === 'income' ? '+' : '-'}₪{t.amount.toLocaleString()}
                            </div>
                         </div>

                         {/* תיאור מפורט / סיבת דחייה */}
                         <div className={`p-3 rounded-xl text-sm mt-1 flex items-start gap-2 ${
                           t.status === 'rejected' ? 'bg-red-100 text-red-900 font-medium' : 'bg-slate-50 text-slate-600'
                         }`}>
                            {t.status === 'rejected' && <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
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