"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, FileText, Settings, 
  LogOut, Menu, X, MessageSquare, Image,
  CreditCard, 
  Wallet      
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // הסרנו את isAuthorized ואת ה-useEffect של הבדיקה.
  // ה-Middleware כבר עושה את העבודה הזו.

  const handleLogout = () => {
    // מחיקת הקוקי בצורה אגרסיבית
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "admin_token=; path=/admin; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    
    // רענון מלא והפניה ללוגין
    window.location.href = "/admin/login";
  };

  // אם אנחנו בדף לוגין, מציגים אותו נקי בלי התפריט
  if (pathname === "/admin/login") {
     return <>{children}</>;
  }

const menuItems = [
  { name: "לוח בקרה", href: "/admin", icon: LayoutDashboard },
  { name: "סטטיסטיקות", href: "/admin/overview", icon: LayoutDashboard }, 
  { name: "שלוחים", href: "/admin/users", icon: Users },
  { name: "פעילויות", href: "/admin/activities", icon: FileText },
  { name: "הנהלת חשבונות", href: "/admin/accounting", icon: FileText }, 
  { name: "גלריית תמונות", href: "/admin/photos", icon: Image },
  { name: "הודעות", href: "/admin/messages", icon: MessageSquare },
  { name: "ניהול מנויים", href: "/admin/subscriptions", icon: CreditCard },
  { name: "זיכוי/חיוב ידני", href: "/admin/manual-balance", icon: Wallet },
  // מחקנו את הגדרות מכאן
];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" dir="rtl">
      
      {/* כפתור תפריט למובייל */}
      <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-md text-slate-600">
        <Menu size={24} />
      </button>

      {/* תפריט צד */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static shadow-2xl
        ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-black tracking-tight">ניהול</h1>
            <p className="text-xs text-slate-400 mt-1">מחובר ומאובטח</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium">
            <LogOut size={20} />
            יציאה
          </button>
        </div>
      </aside>

      {/* תוכן מרכזי */}
      <main className="flex-1 overflow-auto h-screen">
        {children}
      </main>

      {/* רקע כהה למובייל */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" />}
    </div>
  );
}