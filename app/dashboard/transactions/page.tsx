"use client";

import React, { useState } from 'react';
import { ArrowRight, Search, Filter, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // נתונים לדוגמה (בהמשך יגיעו מ-Supabase)
  const transactions = [
    { id: 1, type: 'expense', title: "קניית ציוד לטיול פתיחה", amount: 450, date: "02/01/2026", status: "approved", supplier: "מקס סטוק" },
    { id: 2, type: 'income', title: "הכנסות דמי חבר", amount: 1200, date: "01/01/2026", status: "approved", category: "דמי חבר" },
    { id: 3, type: 'expense', title: "פיצה לערב מדריכים", amount: 120, date: "30/12/2025", status: "rejected", supplier: "פיצה שמש", reason: "חסרה קבלה תקינה" },
    { id: 4, type: 'expense', title: "החזר נסיעות", amount: 45.50, date: "29/12/2025", status: "pending", supplier: "רב קו" },
    { id: 5, type: 'income', title: "פעילות חנוכה - כרטיסים", amount: 2500, date: "25/12/2025", status: "approved", category: "פעילות שיא" },
    { id: 6, type: 'expense', title: "תשלום לספק אוטובוסים", amount: 1500, date: "24/12/2025", status: "waiting_for_receipt", supplier: "אגד היסעים" },
  ];

  // סינון הנתונים לפי הטאב שנבחר
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* כותרת וכפתור חזרה */}
        <div className="flex items-center gap-2 text-slate-500">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                <ArrowRight size={20} />
            </Link>
            <span>חזרה ללוח הבקרה</span>
        </div>

        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">היסטוריית פעולות</h1>
            <button className="bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:bg-slate-50">
                <Filter size={20} />
            </button>
        </div>

        {/* טאבים לסינון */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex">
            <button 
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'all' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                הכל
            </button>
            <button 
                onClick={() => setFilter('income')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'income' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                הכנסות
            </button>
            <button 
                onClick={() => setFilter('expense')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'expense' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                הוצאות
            </button>
        </div>

        {/* רשימת הפעולות */}
        <div className="space-y-3">
            {filteredTransactions.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                    
                    <div className="flex items-center gap-4">
                        {/* אייקון לפי סוג הפעולה */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            item.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {item.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-800">{item.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span>{item.date}</span>
                                <span>•</span>
                                <span>{item.type === 'income' ? item.category : item.supplier}</span>
                            </div>
                            
                            {/* סיבת דחייה אם יש */}
                            {item.status === 'rejected' && item.reason && (
                                <p className="text-xs text-red-500 mt-1">סיבה: {item.reason}</p>
                            )}
                        </div>
                    </div>

                    <div className="text-left">
                        <div className={`font-bold text-lg ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'income' ? '+' : '-'}₪{item.amount}
                        </div>
                        
                        {/* תגית סטטוס */}
                        <div className="flex justify-end mt-1">
                            {item.status === 'approved' && (
                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                                    <CheckCircle size={10} /> אושר
                                </span>
                            )}
                            {item.status === 'pending' && (
                                <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full font-medium">
                                    <Clock size={10} /> ממתין
                                </span>
                            )}
                            {item.status === 'rejected' && (
                                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                                    <XCircle size={10} /> נדחה
                                </span>
                            )}
                            {item.status === 'waiting_for_receipt' && (
                                <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                                    <AlertCircle size={10} /> חסרה קבלה
                                </span>
                            )}
                        </div>
                    </div>

                </div>
            ))}
        </div>

      </div>
    </div>
  );
}