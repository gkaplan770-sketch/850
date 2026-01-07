"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  TrendingUp, 
  Receipt, 
  Wallet 
} from "lucide-react";

export default function AddSelectionPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6" dir="rtl">
      
      {/* כותרת וכפתור חזרה */}
      <div className="flex items-center gap-4 mb-8">
         <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-100 transition-colors">
            <ArrowRight size={20} />
         </Link>
         <div>
            <h1 className="text-2xl font-black text-slate-900">דיווח חדש</h1>
            <p className="text-slate-500 text-sm">בחר את סוג הפעולה שברצונך לבצע</p>
         </div>
      </div>

      {/* כרטיסי בחירה */}
      <div className="grid grid-cols-1 gap-6 max-w-md mx-auto mt-10">
         
         {/* כפתור הכנסה / פעילות */}
         <Link href="/dashboard/add/income" className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-20 h-20 bg-green-50 rounded-br-full -translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex items-center gap-5 relative z-10">
               <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                  <TrendingUp size={28} strokeWidth={2.5} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">דיווח פעילות</h3>
                  <p className="text-sm text-slate-400 font-medium">שיעור, אירוע, או פעילות המכניסה כסף ליתרה</p>
               </div>
            </div>
         </Link>

         {/* כפתור הוצאה */}
         <Link href="/dashboard/add/expense" className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-20 h-20 bg-red-50 rounded-br-full -translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex items-center gap-5 relative z-10">
               <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                  <Receipt size={28} strokeWidth={2.5} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">הוצאה / חשבונית</h3>
                  <p className="text-sm text-slate-400 font-medium">העלאת קבלות, רכישות ודיווח הוצאות שוטפות</p>
               </div>
            </div>
         </Link>

      </div>

      {/* אייקון דקורטיבי למטה */}
      <div className="mt-20 flex justify-center opacity-10">
         <Wallet size={120} className="text-slate-400" />
      </div>

    </div>
  );
}