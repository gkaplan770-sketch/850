"use client";

import React, { useState } from 'react';
import { Search, Filter, Download, Calendar, MapPin, Eye } from "lucide-react";

export default function ActivitiesHistoryPage() {
  const [filterType, setFilterType] = useState('all');

  // נתוני דמה
  const activities = [
    { id: 1, branch: "סניף מרכז", type: "שיעור שבועי", participants: 15, credit: 250, date: "04/01/2026", status: "approved" },
    { id: 2, branch: "סניף צפון", type: "פעילות שיא", participants: 45, credit: 1000, date: "03/01/2026", status: "approved" },
    { id: 3, branch: "סניף אילת", type: "טיול", participants: 120, credit: 3500, date: "01/01/2026", status: "approved" },
  ];

  return (
    <div className="space-y-8 pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">היסטוריית פעילות</h2>
          <p className="text-slate-500 mt-1">תיעוד מלא של כל הפעילויות שאושרו במערכת</p>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Download size={20} />
          ייצוא טבלה לאקסל
        </button>
      </div>

      {/* סרגל כלים */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
        <div className="relative flex-1 max-w-md">
           <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
           <input type="text" placeholder="חפש לפי סניף..." className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex items-center gap-2 px-4 border-r border-slate-200">
           <Filter size={20} className="text-slate-400" />
           <select 
             className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
           >
              <option value="all">כל סוגי הפעילות</option>
              <option value="lesson">שיעורים</option>
              <option value="trip">טיולים</option>
              <option value="event">אירועים</option>
           </select>
        </div>
      </div>

      {/* הטבלה */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">סניף</th>
              <th className="px-6 py-4">סוג פעילות</th>
              <th className="px-6 py-4">תאריך</th>
              <th className="px-6 py-4">משתתפים</th>
              <th className="px-6 py-4">זיכוי כספי</th>
              <th className="px-6 py-4">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                   <MapPin size={16} className="text-slate-400" />
                   {item.branch}
                </td>
                <td className="px-6 py-4">
                   <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{item.type}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-2">
                   <Calendar size={14} />
                   {item.date}
                </td>
                <td className="px-6 py-4 font-bold">{item.participants}</td>
                <td className="px-6 py-4 font-black text-green-600 dir-ltr text-right">₪{item.credit}</td>
                <td className="px-6 py-4">
                   <button className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-sm font-bold transition-colors">
                      <Eye size={16} /> פרטים
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}