"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Scale, ArrowDownLeft, ArrowUpRight, Check, Search, User 
} from "lucide-react";

export default function CreditDebitPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income'); // income = זיכוי, expense = חיוב
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('id, first_name, last_name, branch_name');
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.includes(searchTerm) || u.branch_name.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || !reason) return;
    setIsSubmitting(true);

    try {
      await supabase.from('transactions').insert([{
        user_id: selectedUser.id,
        type: type,
        amount: Number(amount),
        title: type === 'income' ? 'זיכוי יזום ע"י מנהל' : 'חיוב יזום ע"י מנהל',
        status: 'approved', // מאושר אוטומטית
        date: new Date().toISOString(),
        details: {
          notes: reason,
          mode: 'manual_admin_action',
          admin_reason: reason
        }
      }]);

      alert("הפעולה בוצעה בהצלחה! היתרה של השליח עודכנה.");
      // איפוס טופס
      setAmount('');
      setReason('');
      setSelectedUser(null);
      setSearchTerm('');
    } catch (err) {
      console.error(err);
      alert("שגיאה בביצוע הפעולה");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="text-orange-600" /> זיכוי / חיוב יזום
         </h1>
         <p className="text-slate-500 text-sm mt-1">ביצוע פעולות כספיות ידניות בחשבון השליח</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* צד ימין: בחירת שליח */}
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18}/> בחר שליח</h3>
            
            <div className="relative mb-4">
               <input 
                 type="text" 
                 placeholder="חפש לפי שם או סניף..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
               />
               <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
               {filteredUsers.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full p-3 rounded-xl text-right flex justify-between items-center transition-all ${
                      selectedUser?.id === u.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                     <div>
                        <div className="font-bold">{u.first_name} {u.last_name}</div>
                        <div className={`text-xs ${selectedUser?.id === u.id ? 'text-slate-400' : 'text-slate-500'}`}>{u.branch_name}</div>
                     </div>
                     {selectedUser?.id === u.id && <Check size={18} />}
                  </button>
               ))}
            </div>
         </div>

         {/* צד שמאל: פרטי הפעולה */}
         <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Scale size={18}/> פרטי הפעולה {selectedUser && <span className="text-blue-600">עבור {selectedUser.first_name}</span>}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
               
               {/* כפתורי סוג */}
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setType('income')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-all ${
                      type === 'income' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                     <ArrowDownLeft /> זיכוי (הוספת כסף)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setType('expense')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-all ${
                      type === 'expense' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                     <ArrowUpRight /> חיוב (הורדת כסף)
                  </button>
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">סכום ({type === 'income' ? 'להפקדה' : 'לחיוב'})</label>
                  <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 outline-none font-bold text-lg" placeholder="0.00" />
               </div>

               <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">סיבה / הערה (יופיע לשליח)</label>
                  <textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 outline-none h-24 resize-none" placeholder="לדוגמה: בונוס על פעילות חנוכה / תיקון טעות חישוב..." />
               </div>

               <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform">
                  {isSubmitting ? "מבצע פעולה..." : "בצע פעולה"}
               </button>
            </form>
         </div>

      </div>
    </div>
  );
}