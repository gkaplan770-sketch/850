"use client";

import React from 'react';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  Award, Activity, ArrowUp, ArrowDown 
} from "lucide-react";

export default function AdminOverviewPage() {
  
  // נתוני דמה לסטטיסטיקה
  const stats = {
    totalBalance: 142500, // סה"כ זכות של כולם
    totalPayoutThisMonth: 32400, // כמה שילמנו החודש
    totalParticipants: 1250, // סה"כ חניכים בפעילויות החודש
    boys: 750,
    girls: 500
  };

  const topPerformers = [
    { name: "ישראל ישראלי", branch: "סניף מרכז", score: 12, amount: 4500 },
    { name: "מנחם כהן", branch: "סניף צפון", score: 10, amount: 3200 },
    { name: "יוסי לוי", branch: "סניף דרום", score: 8, amount: 2100 },
  ];

  return (
    <div className="space-y-8 pb-20">
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">מבט על - סטטיסטיקה</h2>
        <p className="text-slate-500 mt-1">נתונים בזמן אמת על כלל הפעילות בארגון</p>
      </div>

      {/* כרטיסים עליונים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* כרטיס יתרה כוללת */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><DollarSign size={24}/></div>
              <span className="text-xs font-bold text-slate-400">יתרת זכות כוללת</span>
           </div>
           <h3 className="text-3xl font-black text-slate-900 dir-ltr text-right">₪{stats.totalBalance.toLocaleString()}</h3>
           <p className="text-sm text-slate-500 mt-2">סכום הכסף ש"חייבים" לשלוחים</p>
        </div>

        {/* כרטיס תשלומים החודש */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-red-100 p-3 rounded-xl text-red-600"><TrendingDown size={24}/></div>
              <span className="text-xs font-bold text-slate-400">שולם החודש</span>
           </div>
           <h3 className="text-3xl font-black text-slate-900 dir-ltr text-right">₪{stats.totalPayoutThisMonth.toLocaleString()}</h3>
           <p className="text-sm text-slate-500 mt-2">העברות שאושרו ובוצעו</p>
        </div>

        {/* כרטיס משתתפים */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Users size={24}/></div>
              <span className="text-xs font-bold text-slate-400">חניכים החודש</span>
           </div>
           <h3 className="text-3xl font-black text-slate-900">{stats.totalParticipants.toLocaleString()}</h3>
           <div className="flex gap-4 mt-2 text-xs font-bold">
              <span className="text-blue-600">{stats.boys} בנים</span>
              <span className="text-pink-600">{stats.girls} בנות</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* טבלת מצטיינים */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
               <Award className="text-yellow-500" />
               השלוחים הפעילים ביותר החודש
            </h3>
            <div className="space-y-4">
               {topPerformers.map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                           i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'
                        }`}>
                           {i + 1}
                        </div>
                        <div>
                           <p className="font-bold text-slate-900">{user.name}</p>
                           <p className="text-xs text-slate-500">{user.branch}</p>
                        </div>
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-slate-900">{user.score} פעילויות</p>
                        <p className="text-xs text-green-600 font-bold">קיבל ₪{user.amount}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* גרף פעילות (ויזואלי פשוט) */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
               <Activity className="text-blue-500" />
               התפלגות פעילות
            </h3>
            
            <div className="flex items-end justify-center h-48 gap-8 px-8">
               <div className="w-20 bg-blue-100 rounded-t-xl relative h-full flex flex-col justify-end group cursor-pointer">
                  <div className="bg-blue-600 w-full rounded-t-xl transition-all hover:bg-blue-700" style={{ height: '60%' }}></div>
                  <p className="text-center text-xs font-bold mt-2">שיעורים</p>
               </div>
               <div className="w-20 bg-purple-100 rounded-t-xl relative h-full flex flex-col justify-end group cursor-pointer">
                  <div className="bg-purple-600 w-full rounded-t-xl transition-all hover:bg-purple-700" style={{ height: '80%' }}></div>
                  <p className="text-center text-xs font-bold mt-2">מסיבות</p>
               </div>
               <div className="w-20 bg-green-100 rounded-t-xl relative h-full flex flex-col justify-end group cursor-pointer">
                  <div className="bg-green-600 w-full rounded-t-xl transition-all hover:bg-green-700" style={{ height: '40%' }}></div>
                  <p className="text-center text-xs font-bold mt-2">טיולים</p>
               </div>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">נתוני חודש ינואר 2026</p>
         </div>

      </div>
    </div>
  );
}