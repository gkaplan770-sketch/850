"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { 
  Scale, ArrowDownLeft, ArrowUpRight, Check, Search, User, 
  FileSpreadsheet, Upload, Download, AlertCircle, Info 
} from "lucide-react";

export default function CreditDebitPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // --- מצב בודד ---
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income'); 
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- מצב אקסל ---
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('id, first_name, last_name, branch_name, teudat_zehut');
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.includes(searchTerm) || 
    u.branch_name.includes(searchTerm) ||
    u.teudat_zehut.includes(searchTerm)
  );

  // שמירת פעולה בודדת
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || !reason) return;
    setIsSubmitting(true);

    try {
      await supabase.from('transactions').insert([{
        user_id: selectedUser.id,
        type: type,
        amount: Number(amount),
        title: reason, // הסיבה נשמרת ככותרת כדי שהשליח יראה אותה
        status: 'approved',
        date: new Date().toISOString(),
        details: {
          notes: 'פעולה ידנית ע"י מנהל',
          mode: 'manual_admin_action'
        }
      }]);

      alert("הפעולה בוצעה בהצלחה!");
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

  // הורדת תבנית אקסל
  const downloadTemplate = () => {
    const data = [
      { "תעודת זהות": "123456789", "סכום (פלוס לזיכוי, מינוס לחיוב)": "500", "סיבה": "בונוס חנוכה" },
      { "תעודת זהות": "987654321", "סכום (פלוס לזיכוי, מינוס לחיוב)": "-200", "סיבה": "קיזוז חוב ישן" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_balance_update.xlsx");
  };

  // העלאת אקסל וביצוע פעולות
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploading(true);
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        let success = 0;
        let fail = 0;

        for (const row of data) {
          // זיהוי עמודות (גמיש לשמות שונים)
          const tz = row['תעודת זהות'] || row['id'] || row['ת.ז'];
          const val = row['סכום (פלוס לזיכוי, מינוס לחיוב)'] || row['amount'] || row['סכום'];
          const desc = row['סיבה'] || row['reason'] || row['הערה'];

          if (tz && val && desc) {
            // מציאת המשתמש לפי ת.ז
            const user = users.find(u => u.teudat_zehut === String(tz));
            
            if (user) {
              const numVal = Number(val);
              const isIncome = numVal >= 0;
              
              await supabase.from('transactions').insert([{
                user_id: user.id,
                type: isIncome ? 'income' : 'expense',
                amount: Math.abs(numVal), // תמיד חיובי בדאטהבייס, הסוג קובע אם זה פלוס או מינוס
                title: desc,
                status: 'approved',
                date: new Date().toISOString(),
                details: {
                  mode: 'bulk_excel_import',
                  notes: 'עודכן באמצעות קובץ אקסל'
                }
              }]);
              success++;
            } else {
              console.log(`User not found for TZ: ${tz}`);
              fail++;
            }
          } else {
            fail++;
          }
        }

        alert(`התהליך הסתיים:\n✅ ${success} פעולות בוצעו בהצלחה\n❌ ${fail} נכשלו (ת.ז לא קיימת או נתונים חסרים)`);

      } catch (err) {
        console.error(err);
        alert("שגיאה בקריאת הקובץ");
      } finally {
        setIsUploading(false);
        e.target.value = ''; // איפוס השדה
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 pb-20">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Scale className="text-orange-600" /> זיכוי / חיוב יזום
            </h1>
            <p className="text-slate-500 text-sm mt-1">עדכון מאזן ידני לשליח בודד או לקבוצה</p>
         </div>
         
         <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('single')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'single' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
               <User size={16} /> פעולה בודדת
            </button>
            <button onClick={() => setActiveTab('bulk')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
               <FileSpreadsheet size={16} /> טעינת אקסל
            </button>
         </div>
      </div>

      {activeTab === 'single' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
           {/* צד ימין: בחירת שליח */}
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Search size={18}/> איתור שליח</h3>
              <div className="relative mb-4">
                 <input type="text" placeholder="שם, סניף או תעודת זהות..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                 <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                 {filteredUsers.map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full p-3 rounded-xl text-right flex justify-between items-center transition-all ${selectedUser?.id === u.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                       <div><div className="font-bold">{u.first_name} {u.last_name}</div><div className={`text-xs ${selectedUser?.id === u.id ? 'text-slate-400' : 'text-slate-500'}`}>{u.branch_name} • {u.teudat_zehut}</div></div>
                       {selectedUser?.id === u.id && <Check size={18} />}
                    </button>
                 ))}
              </div>
           </div>

           {/* צד שמאל: טופס */}
           <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Scale size={18}/> פרטי הפעולה {selectedUser && <span className="text-blue-600">עבור {selectedUser.first_name}</span>}</h3>
              <form onSubmit={handleSingleSubmit} className="space-y-5">
                 <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setType('income')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-all ${type === 'income' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400'}`}><ArrowDownLeft /> זיכוי (הוספה)</button>
                    <button type="button" onClick={() => setType('expense')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-all ${type === 'expense' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-400'}`}><ArrowUpRight /> חיוב (הורדה)</button>
                 </div>
                 <div><label className="text-xs font-bold text-slate-500 mb-1 block">סכום בשקלים</label><input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 outline-none font-bold text-lg" placeholder="0.00" /></div>
                 <div><label className="text-xs font-bold text-slate-500 mb-1 block">סיבת הפעולה (יופיע לשליח)</label><textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 outline-none h-24 resize-none" placeholder="לדוגמה: בונוס על פעילות / קיזוז חוב..." /></div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform">{isSubmitting ? "מבצע..." : "בצע עדכון מאזן"}</button>
              </form>
           </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-2xl mx-auto text-center animate-in fade-in">
           <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8 text-right">
              <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Info size={18}/> הנחיות לטעינת קובץ</h4>
              <p className="text-sm text-blue-700 mb-4">יש להכין קובץ אקסל עם העמודות הבאות (ניתן להוריד תבנית):</p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                 <li><b>תעודת זהות:</b> מספר מזהה של השליח (חייב להיות קיים במערכת)</li>
                 <li><b>סכום:</b> מספר חיובי לזיכוי, מספר שלילי (מינוס) לחיוב</li>
                 <li><b>סיבה:</b> טקסט שיופיע לשליח בפירוט הפעולה</li>
              </ul>
           </div>

           <div className="flex gap-4 justify-center">
              <button onClick={downloadTemplate} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
                 <Download size={20} /> הורד תבנית
              </button>
              
              <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-95">
                 {isUploading ? "מעבד נתונים..." : <><Upload size={20} /> בחר קובץ אקסל</>}
                 <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              </label>
           </div>
        </div>
      )}

    </div>
  );
}