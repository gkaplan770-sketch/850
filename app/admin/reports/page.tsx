"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Settings, FileText, 
  Download, Calendar, FileSpreadsheet, FolderArchive, LogOut
} from "lucide-react";
import Link from "next/link";

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-01');

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans" dir="rtl">
      
      {/* סרגל צד */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full right-0 top-0 z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">מערכת ניהול</h1>
          <p className="text-xs text-slate-500">חב"ד לנוער - אדמין</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            <LayoutDashboard size={20} />
            לוח בקרה
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            <Users size={20} />
            ניהול שליחים
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors">
            <FileText size={20} />
            דוחות והנה"ח
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            <Settings size={20} />
            הגדרות
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <Link href="/" className="flex items-center gap-3 text-red-400 hover:bg-slate-800 px-4 py-3 rounded-xl transition-colors">
              <LogOut size={20} /> יציאה
           </Link>
        </div>
      </aside>

      {/* תוכן ראשי */}
      <main className="flex-1 mr-64 p-8">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">דוחות והנהלת חשבונות</h2>
            <p className="text-slate-500 mt-1">ייצוא נתונים וקבצים לרואה חשבון</p>
          </div>
          
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
             <Calendar className="text-slate-400" size={20} />
             <input 
               type="month" 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               className="bg-transparent outline-none text-slate-700 font-bold cursor-pointer"
             />
          </div>
        </div>

        {/* כרטיס הפעולה הראשי - ייצוא */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl mb-8 flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">ייצוא חודשי להנהלת חשבונות</h3>
              <p className="text-slate-300 max-w-lg leading-relaxed">
                 לחיצה על הכפתור תבצע: הפקת דוח אקסל מרוכז + הורדת כל הקבלות כקובץ ZIP.
              </p>
           </div>
           <button className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-blue-600/30 transition-all active:scale-95">
              <Download size={24} />
              <div className="text-right">
                 <div className="text-sm opacity-80">הורד הכל</div>
                 <div className="text-lg">Excel + ZIP</div>
              </div>
           </button>
        </div>

        {/* תצוגה מקדימה */}
        <div className="grid grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <div className="bg-green-100 p-3 rounded-xl text-green-600"><FileSpreadsheet size={24}/></div>
                 <div><h4 className="font-bold text-slate-900">סיכום אקסל</h4><p className="text-sm text-slate-500">142 שורות</p></div>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-slate-50 mt-2">
                 <span className="text-slate-500">יתרה חודשית</span>
                 <span className="font-bold text-blue-600">₪13,050</span>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><FolderArchive size={24}/></div>
                 <div><h4 className="font-bold text-slate-900">ארכיון מסמכים</h4><p className="text-sm text-slate-500">89 קבצים</p></div>
              </div>
              <p className="text-sm text-slate-500">כולל שינוי שמות אוטומטי לקבצים לפי פורמט הנהלת חשבונות.</p>
           </div>
        </div>

      </main>
    </div>
  );
}