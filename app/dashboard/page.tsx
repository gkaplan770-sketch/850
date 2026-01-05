"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, 
  Clock, AlertTriangle, XCircle, CheckCircle,
  Home, List, User, Plus, LogOut, LayoutDashboard,
  Mail 
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  
  // --- משתנים (State) עם תיקון ל-TypeScript ---
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });
  
  // הוספנו <any[]> כדי למנוע את השגיאה
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // הוספנו <any[]> גם כאן
  const [messages, setMessages] = useState<any[]>([]);

  // --- useEffect 1: טעינת נתוני משתמש ופעולות ---
  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('user_id');
      const name = localStorage.getItem('user_name');
      if (name) setUserName(name);
      if (!userId) return;

      // שליפת יתרות
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
        .limit(10);

      if (recent) {
        setRecentTransactions(recent);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // --- useEffect 2: טעינת הודעות ---
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages') 
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3); 

        if (!error && data) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    fetchMessages();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

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

      {/* --- תוכן ראשי --- */}
      <main className="flex-1 pb-24 md:pb-10">
        
        {/* כותרת עליונה */}
        <header className="bg-white p-6 md:p-8 shadow-sm border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 md:static">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">היי, {userName.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium">ברוך הבא לאזור האישי</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-700">{userName}</p>
                <p className="text-xs text-slate-400">שליח</p>
             </div>
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
               <User size={20} />
             </div>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8">

          {/* כרטיסי סטטיסטיקה */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-1 bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/30 transition-all duration-500"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:bg-purple-500/30 transition-all duration-500"></div>
                
                <div className="relative z-10">
                   <span className="text-slate-300 text-sm font-medium mb-1 block">יתרה זמינה בקופה</span>
                   <div className="text-5xl md:text-6xl font-black tracking-tight my-4">
                      ₪{stats.balance.toLocaleString()}
                   </div>
                </div>
             </div>

             <div className="md:col-span-2 grid grid-cols-2 gap-4 md:gap-6">
                <div className="bg-green-50 p-6 md:p-8 rounded-[2rem] border border-green-100 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-green-600 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg"><ArrowDownLeft size={20} /></div>
                      <span className="font-bold">הכנסות שאושרו</span>
                   </div>
                   <div className="text-2xl md:text-4xl font-black text-green-800">+₪{stats.income.toLocaleString()}</div>
                </div>

                <div className="bg-red-50 p-6 md:p-8 rounded-[2rem] border border-red-100 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-red-600 mb-2">
                      <div className="p-2 bg-red-100 rounded-lg"><ArrowUpRight size={20} /></div>
                      <span className="font-bold">הוצאות שאושרו</span>
                   </div>
                   <div className="text-2xl md:text-4xl font-black text-red-800">-₪{stats.expense.toLocaleString()}</div>
                </div>
             </div>
          </div>

          {/* כפתורי פעולה מהירים - בנייד */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            <Link href="/dashboard/add/income" className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                  <ArrowDownLeft size={24} />
               </div>
               <span className="font-bold text-slate-700 text-sm">עדכון הכנסה</span>
            </Link>
            <Link href="/dashboard/add/expense" className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
               <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                  <ArrowUpRight size={24} />
               </div>
               <span className="font-bold text-slate-700 text-sm">בקשת תשלום</span>
            </Link>
          </div>

          {/* --- אזור הודעות --- */}
          {messages.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                <Mail size={20} /> הודעות והעדכונים
              </h3>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-white p-4 rounded-2xl border border-blue-100 text-sm text-slate-700">
                    {msg.content}
                    <div className="text-xs text-slate-400 mt-2">
                      {new Date(msg.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* רשימת עובר ושוב */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">פעולות אחרונות</h2>
                <Link href="/dashboard/transactions" className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">לכל הפעולות</Link>
             </div>

             {loading ? (
                <div className="text-center py-10"><span className="animate-pulse text-slate-400">טוען נתונים...</span></div>
             ) : recentTransactions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-slate-400 text-sm">עדיין אין פעולות החודש</p>
                </div>
             ) : (
                <div className="space-y-4">
                   {recentTransactions.map((t) => (
                      <div key={t.id} className="group hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                         
                         <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-red-50 text-red-600 group-hover:bg-red-100'} transition-colors`}>
                               {t.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                            </div>
                            <div>
                               <div className="font-bold text-slate-900 text-base">{t.title}</div>
                               <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                                  <span>{new Date(t.date).toLocaleDateString('he-IL')}</span>
                                  <span className="hidden md:inline">•</span>
                                  <span className="hidden md:inline">{new Date(t.created_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pl-2 md:pl-0 border-t md:border-0 border-slate-50 pt-3 md:pt-0">
                            <div className={`text-xl font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                               {t.type === 'income' ? '+' : '-'}₪{t.amount.toLocaleString()}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                               {t.status === 'approved' && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1"><CheckCircle size={12}/> אושר</span>}
                               {t.status === 'pending' && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1"><Clock size={12}/> ממתין</span>}
                               {t.status === 'rejected' && <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1"><XCircle size={12}/> נדחה</span>}
                            </div>
                         </div>
                         
                         {t.status === 'rejected' && t.rejection_reason && (
                           <div className="md:hidden bg-red-50 p-2 rounded-lg text-xs text-red-700 font-medium flex gap-2 items-start">
                             <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                             {t.rejection_reason}
                           </div>
                         )}

                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </main>

      {/* --- תפריט תחתון לנייד --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3 px-6 pb-6 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl">
         <Link href="/dashboard" className="flex flex-col items-center gap-1 text-blue-600">
            <div className="p-1 rounded-xl bg-blue-50">
               <Home size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold">ראשי</span>
         </Link>

         <div className="relative -top-5">
            <Link href="/dashboard/add/income" className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl shadow-slate-900/30">
               <Plus size={28} />
            </Link>
         </div>

         <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 text-slate-400">
            <List size={24} />
            <span className="text-[10px] font-medium">פעולות</span>
         </Link>
      </div>

    </div>
  );
}