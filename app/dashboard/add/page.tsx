"use client";

import React, { useState } from 'react';
import { ArrowRight, Check, Users, FileText, UploadCloud, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function AddOperation() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'expense'>('activity');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // כאן נשלח לשרת את הנתונים הנכונים בהתאם לטאב
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" dir="rtl">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowRight size={20} />
          חזרה ללוח הבקרה
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          {/* כותרת ראשית */}
          <div className="p-6 border-b border-slate-100 bg-white">
            <h1 className="text-xl font-bold text-slate-900">דיווח חדש</h1>
            <p className="text-sm text-slate-500 mt-1">בחר את סוג הדיווח שברצונך לבצע</p>
          </div>

          {/* טאבים לבחירה - זה השדרוג הגדול */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'activity' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Users size={18} />
              עדכון פעילות (הכנסה)
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'expense' 
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <FileText size={18} />
              בקשת תשלום (הוצאה)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* טופס 1: עדכון פעילות */}
            {activeTab === 'activity' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm mb-4">
                  💡 המערכת תחשב את סכום ההכנסה באופן אוטומטי לפי מספר המשתתפים.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">קהל יעד</label>
                    <select className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      <option>בנים</option>
                      <option>בנות</option>
                      <option>כללי</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">כמות משתתפים</label>
                    <input type="number" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">סוג פעילות</label>
                   <select className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      <option>שיעור שבועי</option>
                      <option>פעילות שיא</option>
                      <option>טיול</option>
                      <option>התוועדות</option>
                    </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">תאריך הפעילות</label>
                  <div className="relative">
                    <input type="date" className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <Calendar className="absolute left-3 top-3 text-slate-400" size={20} />
                  </div>
                </div>
              </div>
            )}

            {/* טופס 2: בקשת תשלום */}
            {activeTab === 'expense' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">שם הספק / מקבל התשלום</label>
                    <input type="text" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="לדוגמה: פיצה כמעט חינם" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">סכום לתשלום</label>
                    <input type="number" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-lg" placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">תיאור / הערות</label>
                  <textarea rows={2} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none" placeholder="פרט על מה ההוצאה..." />
                </div>

                {/* העלאת קבלה - דרישה קריטית מהרשימה */}
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-700">לחץ להעלאת חשבונית / דרישת תשלום</p>
                  <p className="text-xs text-slate-400 mt-1">חובה להעלות קובץ</p>
                </div>
              </div>
            )}

            {/* כפתור שמירה המשתנה לפי הטאב */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-white ${
                activeTab === 'activity' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
              }`}
            >
              {isSubmitting ? "שולח..." : (
                <>
                  <Check size={20} />
                  {activeTab === 'activity' ? 'שלח דיווח פעילות' : 'שלח בקשת תשלום'}
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}