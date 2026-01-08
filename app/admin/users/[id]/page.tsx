"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, FileText, TrendingUp, TrendingDown, 
  Clock, CheckCircle, XCircle, AlertCircle 
} from "lucide-react";

interface Transaction {
  id: string;
  created_at: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  details?: any;
  file_url?: string;
}

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // 1. פרטי השליח
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      setUser(userData);

      // 2. היסטוריית תנועות
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', id)
        .order('date', { ascending: false });
      
      setTransactions(txData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // פונקציה חכמה לחילוץ הסיבה/הערה
  const getReasonText = (t: Transaction) => {
    // 1. אם נדחה - סיבת הדחייה היא החשובה ביותר
    if (t.status === 'rejected') {
        return <span className="text-red-600 font-bold">נדחה: {t.rejection_reason || 'ללא סיבה'}</span>;
    }
    
    // 2. הערות שליח (בדיווח הכנסה/הוצאה)
    if (t.details?.notes) {
        return t.details.notes;
    }

    // 3. סיבת מנהל (בזיכוי/חיוב יזום)
    if (t.details?.admin_reason) {
        return <span className="text-purple-600">מנהל: {t.details.admin_reason}</span>;
    }

    // 4. ברירת מחדל
    return <span className="text-slate-400 text-xs">- אין פירוט -</span>;
  };

  if (loading) return <div className="p-10 text-center text-slate-500">טוען נתונים...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans" dir="rtl">
      
      {/* כותרת וחזרה */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors">
           <ArrowRight size={20} className="text-slate-600"/>
        </button>
        <div>
           <h1 className="text-2xl font-bold text-slate-900">
             תיק שליח: {user?.first_name} {user?.last_name}
           </h1>
           <p className="text-slate-500 text-sm">{user?.branch_name} • ת.ז: {user?.teudat_zehut}</p>
        </div>
      </div>

      {/* טבלת תנועות */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">היסטוריית פעולות ויתרה</h3>
            <div className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold">
               סה"כ פעולות: {transactions.length}
            </div>
         </div>

         {transactions.length === 0 ? (
            <div className="p-10 text-center text-slate-400">אין פעולות להצגה לשליח זה.</div>
         ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">תאריך</th>
                    <th className="px-6 py-4">סוג</th>
                    <th className="px-6 py-4">נושא / כותרת</th>
                    <th className="px-6 py-4">סכום</th>
                    <th className="px-6 py-4 w-1/3">סיבה / פירוט</th>
                    <th className="px-6 py-4">סטטוס</th>
                    <th className="px-6 py-4">מסמך</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {new Date(t.date).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        {t.type === 'income' ? (
                           <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded w-fit">
                             <TrendingUp size={14}/> הכנסה
                           </span>
                        ) : (
                           <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded w-fit">
                             <TrendingDown size={14}/> הוצאה
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{t.title}</td>
                      <td className={`px-6 py-4 font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        ₪{t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm leading-relaxed text-slate-700">
                        {getReasonText(t)}
                      </td>
                      <td className="px-6 py-4">
                        {t.status === 'approved' && <CheckCircle size={18} className="text-green-500"/>}
                        {t.status === 'pending' && <Clock size={18} className="text-yellow-500"/>}
                        {t.status === 'rejected' && <XCircle size={18} className="text-red-500"/>}
                      </td>
                      <td className="px-6 py-4">
                        {t.file_url ? (
                          <a href={t.file_url} target="_blank" className="text-blue-600 hover:text-blue-800">
                            <FileText size={18}/>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         )}
      </div>
    </div>
  );
}