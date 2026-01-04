"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Minus, History, Bell, ArrowUpRight, ArrowDownLeft, 
  Wallet, Users, TrendingUp 
} from "lucide-react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('שליח יקר');
  const [branchName, setBranchName] = useState('סניף');
  const [loading, setLoading] = useState(true);

  // נתונים דינמיים
  const [balance, setBalance] = useState(0);
  const [monthlyParticipants, setMonthlyParticipants] = useState({ boys: 0, girls: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('user_id');
      const name = localStorage.getItem('user_name');
      const branch = localStorage.getItem('user_branch');

      if (!userId) {
        router.push('/');
        return;
      }

      setUserName(name || 'שליח');
      setBranchName(branch || '');

      try {
        // 1. שליפת כל העסקאות של המשתמש
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }); // מהחדש לישן

        if (error) throw error;

        // 2. חישוב יתרה (רק עסקאות שאושרו)
        let currentBalance = 0;
        let boysCount = 0;
        let girlsCount = 0;
        const currentMonth = new Date().getMonth();

        const recent = transactions.slice(0, 3); // ניקח רק את ה-3 האחרונים לתצוגה

        transactions.forEach((t: any) => {
          // חישוב יתרה (רק אם אושר)
          if (t.status === 'approved') {
            if (t.type === 'income') {
              currentBalance += t.amount;
            } else { // expense or supplier
              currentBalance -= t.amount;
            }
          }

          // חישוב סטטיסטיקה חודשית (לפי תאריך הפעילות)
          const tDate = new Date(t.date);
          if (t.type === 'income' && tDate.getMonth() === currentMonth) {
            const count = t.details?.participants || 0;
            const audience = t.details?.audience || 'boys';
            if (audience === 'boys') boysCount += count;
            else girlsCount += count;
          }
        });

        setBalance(currentBalance);
        setMonthlyParticipants({ boys: boysCount, girls: girlsCount });
        setRecentTransactions(recent);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24" dir="rtl">
      
      {/* כותרת עליונה */}
      <div className="bg-white p-6 pb-8 rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">שלום, {userName.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 font-medium">{branchName}</p>
          </div>
          <div className="flex gap-3">
             <Link href="/dashboard/notifications" className="p-3 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 transition-colors relative">
               <Bell size={24} />
               <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </Link>
          </div>
        </div>

        {/* כרטיס יתרה */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 -translate-y-10 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full translate-x-8 translate-y-8 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-300 mb-2">
              <Wallet size={18} />
              <span className="text-sm font-medium">יתרה נוכחית</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight dir-ltr">
                ₪{loading ? '...' : balance.toLocaleString()}
              </span>
            </div>
            
            {/* סטטיסטיקה מהירה */}
            <div className="mt-6 flex gap-4">
              <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-xs font-bold">{monthlyParticipants.boys} בנים החודש</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                <span className="text-xs font-bold">{monthlyParticipants.girls} בנות החודש</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* כפתורי פעולה ראשיים */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/dashboard/add/income" className="group bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
              <Plus size={24} strokeWidth={3} />
            </div>
            <span className="font-bold text-slate-800 block text-lg">עדכון פעילות</span>
            <span className="text-xs text-slate-400">הוספת דיווח חדש</span>
          </Link>

          <Link href="/dashboard/add/expense" className="group bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all">
            <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center text-red-600 mb-3 group-hover:scale-110 transition-transform">
              <Minus size={24} strokeWidth={3} />
            </div>
            <span className="font-bold text-slate-800 block text-lg">בקשת תשלום</span>
            <span className="text-xs text-slate-400">העלאת קבלה/חשבונית</span>
          </Link>
        </div>

        {/* פעולות אחרונות */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-lg">פעולות אחרונות</h3>
            <Link href="/dashboard/transactions" className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
              הכל
            </Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-slate-400 py-4">טוען נתונים...</p>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400">עדיין אין פעולות</p>
              </div>
            ) : (
              recentTransactions.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {t.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                         <p className="font-bold text-slate-800 text-sm line-clamp-1">{t.title}</p>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('he-IL')}</span>
                           {/* תגית סטטוס קטנה */}
                           {t.status === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-400"></span>}
                           {t.status === 'rejected' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                     <span className={`font-bold dir-ltr block ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                     }`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount}₪
                     </span>
                     {t.status === 'pending' && <span className="text-[10px] text-slate-400">ממתין</span>}
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* תפריט תחתון קבוע */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-2 pb-6 z-50">
        <div className="flex justify-around items-center text-xs font-medium text-slate-400">
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <div className="p-1 rounded-xl bg-blue-50">
               <TrendingUp size={24} />
            </div>
            <span>ראשי</span>
          </button>
          
          <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 hover:text-slate-600 transition-colors">
            <History size={24} />
            <span>היסטוריה</span>
          </Link>
          
          <button className="flex flex-col items-center gap-1 hover:text-slate-600 transition-colors">
            <Users size={24} />
            <span>פרופיל</span>
          </button>
        </div>
      </div>

    </div>
  );
}