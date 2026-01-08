"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, User, Phone, MapPin, 
  Wallet, ArrowDownLeft, ArrowUpRight, 
  Calendar, CreditCard 
} from "lucide-react";

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  status: string;
  category?: string;
}

interface UserDetails {
  id: string;
  first_name: string;
  last_name: string;
  teudat_zehut: string;
  branch_name: string;
  phone?: string;
  spouse_first_name?: string;
  spouse_phone?: string;
}

// עדכון הטיפוס של ה-Props להיות Promise
export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  // שימוש ב-React.use כדי לפתוח את ה-Promise ולקבל את ה-ID
  // זה התיקון הקריטי עבור Next.js 15
  const { id } = React.use(params);
  const userId = id;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // סטטיסטיקות
  const [stats, setStats] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpense: 0
  });

  useEffect(() => {
    // מניעת הרצה אם ה-ID עדיין לא קיים (למרות שעם React.use זה אמור להיות בסדר)
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      // 1. שליפת פרטי המשתמש
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        // טיפול במקרה של שגיאה - לא חייב אלרט, אפשר רק לוג
        // alert('לא נמצא משתמש כזה'); 
        // router.push('/admin'); 
        setLoading(false);
        return;
      }
      setUser(userData);

      // 2. שליפת עסקאות המשתמש (ספציפית ל-ID הזה)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error fetching transactions:', txError);
      } else {
        setTransactions(txData || []);
        calculateStats(txData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId, router]); // הוספתי את router לתלויות כדי למנוע אזהרות לינטר

  const calculateStats = (txs: Transaction[]) => {
    let income = 0;
    let expense = 0;

    txs.forEach(tx => {
      if (tx.status === 'approved') {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      }
    });

    setStats({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
     return (
        <div className="p-10 text-center text-slate-500">
           לא נמצאו נתונים למשתמש זה.
           <button onClick={() => router.back()} className="block mx-auto mt-4 text-blue-600 underline">חזור</button>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* כפתור חזרה */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowRight size={20} />
          חזרה לרשימת השליחים
        </button>

        {/* כרטיס ראשי - פרטי משתמש */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.first_name?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user.first_name} {user.last_name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-500 mt-1 text-sm">
                <span className="flex items-center gap-1"><MapPin size={14} /> {user.branch_name}</span>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">ת.ז: {user.teudat_zehut}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-600 w-full md:w-auto bg-slate-50 p-4 rounded-xl">
             <div className="flex items-center gap-2">
               <Phone size={14} className="text-slate-400" /> 
               <span className="font-bold">נייד:</span> {user.phone || '-'}
             </div>
             {user.spouse_first_name && (
               <div className="flex items-center gap-2">
                 <User size={14} className="text-pink-400" /> 
                 <span className="font-bold">רעייה:</span> {user.spouse_first_name} ({user.spouse_phone || '-'})
               </div>
             )}
          </div>
        </div>

        {/* כרטיסי סטטיסטיקה */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-slate-500 text-sm font-bold mb-1 flex items-center gap-2">
               <Wallet size={16} /> יתרה נוכחית
             </div>
             <div className={`text-3xl font-black ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'} dir-ltr text-right`}>
               ₪{stats.balance.toLocaleString()}
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-slate-500 text-sm font-bold mb-1 flex items-center gap-2">
               <ArrowDownLeft size={16} className="text-green-500" /> סה"כ הכנסות (מאושר)
             </div>
             <div className="text-3xl font-black text-slate-800 dir-ltr text-right">
               ₪{stats.totalIncome.toLocaleString()}
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-slate-500 text-sm font-bold mb-1 flex items-center gap-2">
               <ArrowUpRight size={16} className="text-red-500" /> סה"כ הוצאות (מאושר)
             </div>
             <div className="text-3xl font-black text-slate-800 dir-ltr text-right">
               ₪{stats.totalExpense.toLocaleString()}
             </div>
          </div>
        </div>

        {/* טבלת עסקאות */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50">
             <h2 className="font-bold text-lg flex items-center gap-2">
               <CreditCard size={20} className="text-blue-600" /> פירוט תנועות
             </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-4">תאריך</th>
                  <th className="px-6 py-4">תיאור</th>
                  <th className="px-6 py-4">קטגוריה</th>
                  <th className="px-6 py-4">סכום</th>
                  <th className="px-6 py-4">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      אין נתונים להצגה
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(tx.created_at).toLocaleDateString('he-IL')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{tx.description}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                          {tx.category || 'כללי'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold dir-ltr text-right ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}₪{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          tx.status === 'approved' ? 'bg-green-100 text-green-700' :
                          tx.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tx.status === 'approved' ? 'מאושר' : 
                           tx.status === 'rejected' ? 'נדחה' : 'ממתין'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}