"use client";

import React, { useState } from 'react';
import { 
  DollarSign, Upload, FileSpreadsheet, Search, Check, 
  ArrowUp, ArrowDown, AlertCircle 
} from "lucide-react";

export default function ManualBalancePage() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit'); // זיכוי או חיוב
  
  return (
    <div className="space-y-8 pb-20">
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">זיכוי או חיוב יזום</h2>
        <p className="text-slate-500 mt-1">עדכון מאזן ידני לשליח בודד או לקבוצה</p>
      </div>

      {/* טאבים לבחירה */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit mb-6">
        <button 
           onClick={() => setActiveTab('single')}
           className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'single' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
           <DollarSign size={16} /> פעולה בודדת
        </button>
        <button 
           onClick={() => setActiveTab('bulk')}
           className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
           <FileSpreadsheet size={16} /> טעינת אקסל (רבים)
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-4xl">
         
         {/* --- פעולה בודדת --- */}
         {activeTab === 'single' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
               
               {/* בחירת סוג פעולה */}
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">סוג הפעולה</label>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                     <button onClick={() => setActionType('credit')} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${actionType === 'credit' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                        <ArrowUp size={20} /> זיכוי (הוספת כסף)
                     </button>
                     <button onClick={() => setActionType('debit')} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${actionType === 'debit' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                        <ArrowDown size={20} /> חיוב (הורדת כסף)
                     </button>
                  </div>
               </div>

               {/* בחירת שליח */}
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">עבור שליח</label>
                  <div className="relative max-w-md">
                     <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
                     <input type="text" placeholder="חפש לפי שם או ת.ז..." className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">סכום</label>
                     <div className="relative">
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-lg" placeholder="0.00" />
                        <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₪</span>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">סיבת הפעולה</label>
                     <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" placeholder="לדוגמה: בונוס על פעילות חנוכה" />
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${actionType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                     <Check size={20} />
                     {actionType === 'credit' ? 'בצע זיכוי כספי' : 'בצע חיוב כספי'}
                  </button>
               </div>
            </div>
         )}

         {/* --- טעינת אקסל --- */}
         {activeTab === 'bulk' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
               
               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                     <AlertCircle size={18} />
                     הנחיות לטעינת קובץ
                  </h4>
                  <p className="text-sm text-blue-700 mb-4">
                     יש להכין קובץ אקסל עם 3 עמודות בדיוק (ללא כותרות):
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-white p-4 rounded-xl border border-blue-200 text-slate-600 text-center">
                     <div>A: ת.ז שליח</div>
                     <div>B: סכום (פלוס לזיכוי, מינוס לחיוב)</div>
                     <div>C: סיבת הפעולה</div>
                  </div>
               </div>

               <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer group">
                   <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Upload size={32} className="text-slate-400 group-hover:text-blue-600" />
                   </div>
                   <p className="text-lg font-bold text-slate-700">לחץ לבחירת קובץ Excel</p>
                   <p className="text-sm text-slate-400 mt-1">המערכת תעדכן את המאזן לכל השלוחים ברשימה</p>
                </div>

                <div className="flex justify-end">
                   <button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all">
                      טען ועדכן נתונים
                   </button>
                </div>
            </div>
         )}

      </div>
    </div>
  );
}