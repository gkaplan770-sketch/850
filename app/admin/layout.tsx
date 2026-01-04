import React from 'react';
import Link from "next/link";
import { 
  LayoutDashboard, Users, Settings, FileText, 
  BarChart3, LogOut, DollarSign, ListFilter, Send // <-- הוספנו Send
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100 font-sans" dir="rtl">
      
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full right-0 top-0 z-50 shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <h1 className="text-xl font-bold text-white tracking-wide">ניהול סניפים</h1>
          <p className="text-xs text-slate-500 mt-1">מערכת אדמין v2.0</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-500 mb-2 mt-2">ראשי</p>
          
          <Link href="/admin/dashboard" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <LayoutDashboard size={20} />
            <span>לוח בקרה (ממתינים)</span>
          </Link>
          
          <Link href="/admin/overview" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <BarChart3 size={20} />
            <span>מבט על וסטטיסטיקה</span>
          </Link>

          <Link href="/admin/activities" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <ListFilter size={20} />
            <span>היסטוריית פעילות</span>
          </Link>

          {/* --- הקישור החדש להודעות --- */}
          <Link href="/admin/messages" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <Send size={20} />
            <span>מרכז הודעות</span>
          </Link>
          {/* --------------------------- */}

          <p className="px-4 text-xs font-bold text-slate-500 mb-2 mt-6">ניהול</p>

          <Link href="/admin/users" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <Users size={20} />
            <span>שלוחים (לקוחות)</span>
          </Link>

          <Link href="/admin/manual-balance" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <DollarSign size={20} />
            <span>זיכוי/חיוב יזום</span>
          </Link>

          <p className="px-4 text-xs font-bold text-slate-500 mb-2 mt-6">כספים</p>

          <Link href="/admin/accounting" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <FileText size={20} />
            <span>הנהלת חשבונות</span>
          </Link>

          <div className="my-4 border-t border-slate-800"></div>

          <Link href="/admin/settings" className="flex items-center gap-3 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-xl transition-all">
            <Settings size={20} />
            <span>הגדרות מערכת</span>
          </Link>
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 px-4 py-3 rounded-xl transition-all">
            <LogOut size={20} />
            <span>יציאה מהמערכת</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 mr-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}