"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  LogOut,
  ShieldCheck,
  Tags,   // <--- הוספנו את זה
  Scale   // <--- הוספנו את זה
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { 
      name: 'לוח בקרה', 
      href: '/admin/dashboard', 
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      name: 'ניהול שלוחים', 
      href: '/admin/users', 
      icon: <Users size={20} /> 
    },
    { 
      name: 'מנויים וחיובים', 
      href: '/admin/subscriptions', 
      icon: <CreditCard size={20} /> 
    },
    { 
      name: 'סוגי פעילות', 
      href: '/admin/activities', 
      icon: <Tags size={20} /> 
    },
    { 
      name: 'זיכוי/חיוב יזום', 
      href: '/admin/credit-debit', 
      icon: <Scale size={20} /> 
    },
    { 
      name: 'הנהלת חשבונות', 
      href: '/admin/accounting', 
      icon: <FileText size={20} /> 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" dir="rtl">
      
      {/* תפריט צד (Sidebar) */}
      <aside className="w-64 bg-slate-900 text-white min-h-screen sticky top-0 h-screen flex flex-col shadow-2xl z-20">
        
        {/* כותרת התפריט */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
             <ShieldCheck size={24} />
           </div>
           <div>
             <h1 className="font-bold text-lg leading-tight">פנל ניהול</h1>
             <p className="text-xs text-slate-400">חב"ד לנוער</p>
           </div>
        </div>

        {/* רשימת הכפתורים */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
           {menuItems.map((item) => {
             const isActive = pathname === item.href;
             return (
               <Link 
                 key={item.href} 
                 href={item.href}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                   isActive 
                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-bold' 
                     : 'text-slate-400 hover:bg-white/10 hover:text-white'
                 }`}
               >
                 {item.icon}
                 <span>{item.name}</span>
               </Link>
             );
           })}
        </nav>

        {/* כפתור יציאה */}
        <div className="p-4 border-t border-slate-800">
           <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-all font-bold">
              <LogOut size={20} />
              <span>יציאה למסך ראשי</span>
           </Link>
        </div>

      </aside>

      {/* תוכן העמוד המשתנה */}
      <main className="flex-1 p-8 overflow-y-auto">
         {children}
      </main>

    </div>
  );
}