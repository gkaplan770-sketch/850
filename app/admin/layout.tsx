"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, PieChart, History, Users, 
  DollarSign, FileText, LogOut, Menu 
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // בודק אם המילה login מופיעה בכתובת
  const isLoginPage = pathname?.includes('/login');

  useEffect(() => {
    // 1. אם אנחנו בדף הלוגין - אין צורך בבדיקות אבטחה
    if (isLoginPage) {
      setIsAuthorized(true);
      return;
    }

    // 2. בדיקת אבטחה: האם יש למשתמש אישור כניסה?
    const hasAuth = document.cookie.includes('admin-auth=true');

    if (!hasAuth) {
      // אם אין אישור - זרוק אותו מיד ללוגין
      router.push('/admin/login');
    } else {
      // יש אישור - הצג את הדף
      setIsAuthorized(true);
    }
  }, [pathname, isLoginPage, router]);

  // מונע "הבהוב" של הדף המוגן לפני שהבדיקה הסתיימה
  if (!isAuthorized) return null;

  // --- מצב לוגין: הצג דף נקי בלי תפריטים ---
  if (isLoginPage) {
    return <main className="w-full min-h-screen bg-slate-900">{children}</main>;
  }

  // --- מצב מערכת: הצג תפריט ותוכן ---
  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      
      {/* תפריט צד (Sidebar) */}
      <aside className={`
        fixed top-0 right-0 z-40 w-64 h-screen transition-transform bg-slate-900 text-slate-300
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          
          {/* כותרת */}
          <div className="mb-8 px-2 text-center">
            <h2 className="text-2xl font-bold text-white">ניהול סניפים</h2>
            <p className="text-xs text-slate-500 mt-1">מערכת אדמין v2.0</p>
          </div>

          {/* תפריטים */}
          <ul className="space-y-2 font-medium flex-1">
            
            <li className="px-2 pt-4 pb-2 text-xs font-bold text-slate-500 uppercase">ראשי</li>
            <li>
              <Link href="/admin/dashboard" className={`flex items-center p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-colors ${pathname === '/admin/dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : ''}`}>
                 <LayoutDashboard size={20} className="ml-3" />
                 <span>לוח בקרה</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/overview" className={`flex items-center p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-colors ${pathname === '/admin/overview' ? 'bg-blue-600 text-white' : ''}`}>
                 <PieChart size={20} className="ml-3" />
                 <span>מבט על וסטטיסטיקה</span>
              </Link>
            </li>
            <li>
               <Link href="/admin/accounting" className={`flex items-center p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-colors ${pathname === '/admin/accounting' ? 'bg-blue-600 text-white' : ''}`}>
                  <History size={20} className="ml-3" />
                  <span>היסטוריית פעילות</span>
               </Link>
            </li>

            <li className="px-2 pt-6 pb-2 text-xs font-bold text-slate-500 uppercase">ניהול</li>
            <li>
              <Link href="/admin/users" className={`flex items-center p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-colors ${pathname === '/admin/users' ? 'bg-blue-600 text-white' : ''}`}>
                 <Users size={20} className="ml-3" />
                 <span>שלוחים (לקוחות)</span>
              </Link>
            </li>
            <li>
               <button className="flex w-full items-center p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-colors text-right opacity-50 cursor-not-allowed">
                  <DollarSign size={20} className="ml-3" />
                  <span>זיכוי/חיוב יזום</span>
               </button>
            </li>

            <li className="px-2 pt-6 pb-2 text-xs font-bold text-slate-500 uppercase">כספים</li>
            <li>
               <Link href="/admin/reports" className="flex items-center p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-colors opacity-50 cursor-not-allowed">
                  <FileText size={20} className="ml-3" />
                  <span>הנהלת חשבונות</span>
               </Link>
            </li>
          </ul>

          {/* כפתור יציאה */}
          <div className="mt-auto pt-6 border-t border-slate-800">
            <button 
              onClick={() => {
                document.cookie = "admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                router.push('/admin/login');
              }}
              className="flex items-center p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl w-full transition-colors"
            >
               <LogOut size={20} className="ml-3" />
               <span>יציאה מהמערכת</span>
            </button>
          </div>
        </div>
      </aside>

      {/* כפתור תפריט למובייל */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* תוכן ראשי */}
      <div className="flex-1 md:mr-64 min-h-screen">
         <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
         </div>
      </div>
    </div>
  );
}