"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, Upload, FileSpreadsheet, Search, Check, 
  ArrowUp, ArrowDown, AlertCircle, X, ChevronDown, Loader2 
} from "lucide-react";

export default function ManualBalancePage() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- התיקון הגדול כאן ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    
    // 1. שולפים הכל (*) כדי לא לפספס אף עמודה
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true }); // מיון ברירת מחדל
    
    if (error) {
        console.error("שגיאה בטעינת משתמשים:", error);
        alert("שגיאה בטעינה: " + error.message);
    } else {
        // 2. הדפסה לקונסול כדי שנוכל לראות מה השמות האמיתיים
        console.log("משתמשים שנטענו מהמסד:", data);
        setUsers(data || []);
    }
    
    setLoadingUsers(false);
  };

  // פונקציית עזר למציאת שם התצוגה (מנסה את כל האפשרויות)
  const getUserDisplayName = (u: any) => {
      // מנסה למצוא שם סניף בכל מיני וריאציות
      return u.branch_name || u.snif || u.branch || u.name || u.full_name || "ללא שם";
  };

  const getUserIdNumber = (u: any) => {
      return u.identity_number || u.tz || u.id_num || "";
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    
    // בדיקה על כל השדות האפשריים
    const display = getUserDisplayName(user).toLowerCase();
    const email = (user.email || '').toLowerCase();
    const idNum = getUserIdNumber(user).toString();
    const fullName = (user.full_name || '').toLowerCase();

    return display.includes(term) || email.includes(term) || idNum.includes(term) || fullName.includes(term);
  });

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchTerm(getUserDisplayName(user));
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchTerm('');
    setIsDropdownOpen(true);
  };

  const handleSubmitSingle = async () => {
    if (!selectedUser || !amount || !reason) {
        alert("נא למלא את כל השדות");
        return;
    }

    setIsSubmitting(true);
    try {
        const finalAmount = actionType === 'credit' ? parseFloat(amount) : -parseFloat(amount);
        
        const { error } = await supabase.from('transactions').insert([{
            user_id: selectedUser.id,
            type: actionType === 'credit' ? 'manual_credit' : 'manual_debit',
            amount: finalAmount,
            title: actionType === 'credit' ? 'זיכוי יזום' : 'חיוב יזום',
            status: 'approved',
            details: {
                notes: reason,
                admin_action: true
            },
            date: new Date().toISOString() // שימוש בשדה date אם קיים, אחרת created_at יתפוס אוטומטית
        }]);

        if (error) throw error;

        alert("הפעולה בוצעה בהצלחה!");
        setAmount('');
        setReason('');
        clearSelection();

    } catch (error: any) {
        alert("שגיאה: " + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20" dir="rtl">
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">זיכוי או חיוב יזום</h2>
        <p className="text-slate-500 mt-1">עדכון מאזן ידני לשליח בודד או לקבוצה</p>
      </div>

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
         
         {activeTab === 'single' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
               
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

               <div ref={dropdownRef}>
                  <label className="block text-sm font-bold text-slate-700 mb-2">עבור שליח / סניף</label>
                  <div className="relative max-w-md">
                     <div className="relative">
                        <Search className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
                        
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                                if (selectedUser) setSelectedUser(null);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder="חפש לפי שם סניף..." 
                            className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`} 
                        />

                        <div className="absolute left-3 top-3.5 text-slate-400 cursor-pointer">
                            {searchTerm ? (
                                <X size={18} onClick={clearSelection} className="hover:text-red-500" />
                            ) : (
                                <ChevronDown size={18} onClick={() => setIsDropdownOpen(!isDropdownOpen)} />
                            )}
                        </div>
                     </div>

                     {isDropdownOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                            {loadingUsers ? (
                                <div className="p-4 text-center text-slate-400 text-sm"><Loader2 className="animate-spin inline ml-2" size={16}/> טוען רשימה...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    לא נמצאו תוצאות.
                                    <br/>
                                    <span className="text-[10px] text-red-400">(בדוק בקונסול F12 אם הטבלה ריקה)</span>
                                </div>
                            ) : (
                                filteredUsers.map((user) => {
                                    const displayName = getUserDisplayName(user);
                                    const idNum = getUserIdNumber(user);
                                    
                                    return (
                                        <div 
                                            key={user.id} 
                                            onClick={() => handleSelectUser(user)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                                        >
                                            <div className="font-bold text-slate-800 text-sm">{displayName}</div>
                                            <div className="text-xs text-slate-500 flex justify-between mt-1">
                                                <span>{user.full_name || user.email}</span>
                                                {idNum && <span className="font-mono bg-slate-100 px-1 rounded">{idNum}</span>}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                     )}
                  </div>
                  {selectedUser && (
                      <div className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1 animate-in slide-in-from-top-1">
                          <Check size={12} /> נבחר: {getUserDisplayName(selectedUser)}
                      </div>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">סכום</label>
                     <div className="relative">
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-lg" 
                            placeholder="0.00" 
                        />
                        <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₪</span>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">סיבת הפעולה</label>
                     <input 
                        type="text" 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" 
                        placeholder="לדוגמה: בונוס..." 
                     />
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={handleSubmitSingle}
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${actionType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                     {actionType === 'credit' ? 'בצע זיכוי כספי' : 'בצע חיוב כספי'}
                  </button>
               </div>
            </div>
         )}

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
            </div>
         )}
      </div>
    </div>
  );
}