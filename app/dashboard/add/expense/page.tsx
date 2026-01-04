"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, CreditCard, UploadCloud, Building, User, ChevronDown, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ExpenseRequestPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [branchName, setBranchName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const [mode, setMode] = useState<'refund' | 'supplier'>('refund');
  
  // שדות נפרדים - לא קשורים אחד לשני
  const [supplierName, setSupplierName] = useState(''); 
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [bankDetails, setBankDetails] = useState({ ownerName: '', bankNumber: '', branchNumber: '', accountNumber: '' });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // רשימות שמורות (בהמשך יגיעו מ-DB)
  // רשימה 1: שמות ספקים נפוצים (רק להשלמת שם)
  const savedSuppliers = [
    "מקס סטוק", "פיצה כמעט חינם", "אגד היסעים", "דפוס המרכז", "חברת חשמל", "רמי לוי"
  ];

  // רשימה 2: חשבונות בנק שמורים (לבחירה נפרדת)
  const savedBankAccounts = [
    { id: 'my_main', label: 'החשבון שלי (ראשי)', owner: 'ישראל ישראלי', bank: '12', branch: '654', account: '987654' },
    { id: 'wife', label: 'החשבון של אשתי', owner: 'רחלי ישראלי', bank: '10', branch: '881', account: '112233' },
    { id: 'supplier_bus', label: 'חשבון חברת האוטובוסים', owner: 'אגד היסעים בע"מ', bank: '12', branch: '500', account: '404040' },
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedBranch = localStorage.getItem('user_branch');
    
    if (!storedUserId) {
      router.push('/');
      return;
    }
    
    setUserId(storedUserId);
    setBranchName(storedBranch || '');
  }, []);

  // פונקציה לבחירת חשבון בנק (לא משפיעה על הספק)
  const handleSelectBankAccount = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const account = savedBankAccounts.find(acc => acc.id === selectedId);
    
    if (account) {
      setBankDetails({
        ownerName: account.owner,
        bankNumber: account.bank,
        branchNumber: account.branch,
        accountNumber: account.account
      });
    } else {
      // אם בחר "חשבון אחר" - ננקה את השדות
      setBankDetails({ ownerName: '', bankNumber: '', branchNumber: '', accountNumber: '' });
    }
  };

  // פונקציה לבחירת ספק (לא משפיעה על הבנק)
  const handleSelectSupplier = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSupplierName(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!selectedFile) {
      alert("חובה להעלות חשבונית או דרישת תשלום");
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = null;

      // 1. העלאת הקובץ
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `expense_${userId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrlData.publicUrl;

      // 2. שמירת הנתונים
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            type: mode === 'refund' ? 'expense' : 'supplier',
            title: supplierName, // שם הספק נשמר בכותרת
            amount: Number(amount),
            date: new Date().toISOString(),
            status: 'pending',
            file_url: fileUrl,
            details: {
              notes: notes,
              bank_details: bankDetails, // פרטי הבנק שנבחרו נשמרים כאן
              mode: mode
            }
          }
        ]);

      if (insertError) throw insertError;

      setIsSubmitting(false);
      setShowSuccessPopup(true);

    } catch (error) {
      console.error('Error:', error);
      alert('אירעה שגיאה. נסה שנית.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" dir="rtl">
      <div className="max-w-xl mx-auto pb-20">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 font-medium hover:text-red-600 mb-6 transition-colors px-2">
          <ArrowRight size={20} />
          חזרה
        </Link>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          
          <div className="p-8 bg-gradient-to-r from-red-600 to-red-500 text-white relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-xl"></div>
            <h1 className="text-2xl font-bold relative z-10">בקשת תשלום</h1>
            <p className="text-red-100 text-sm mt-1 relative z-10">{branchName}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* סוג הבקשה */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('refund')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'refund' 
                    ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <User size={18} />
                החזר הוצאות
              </button>
              <button
                type="button"
                onClick={() => setMode('supplier')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'supplier' 
                    ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building size={18} />
                תשלום לספק
              </button>
            </div>

            {/* פרטי התשלום (ספק וסכום) */}
            <div className="space-y-5">
              
              {/* בחירת שם ספק בנפרד */}
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2 px-1">
                   {mode === 'refund' ? 'עבור מה שילמת? (שם העסק)' : 'למי צריך לשלם? (שם הספק)'}
                 </label>
                 
                 <div className="space-y-2">
                   {/* דרופדאון להשלמה מהירה */}
                   <select 
                      onChange={handleSelectSupplier}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-sm rounded-xl py-2 px-3 outline-none"
                   >
                      <option value="">בחר שם מוכר או הקלד למטה...</option>
                      {savedSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>

                   {/* שדה טקסט חופשי לשם הספק */}
                   <input 
                      type="text" 
                      required 
                      value={supplierName} 
                      onChange={(e) => setSupplierName(e.target.value)} 
                      placeholder="לדוגמה: מקס סטוק"
                      className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-medium" 
                   />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2 px-1">סכום לתשלום</label>
                 <div className="relative">
                    <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="block w-full px-4 py-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-xl" placeholder="0.00" />
                    <span className="absolute left-5 top-4 text-slate-400 font-bold text-lg">₪</span>
                 </div>
              </div>

              {/* העלאת קובץ */}
              <div className="relative">
                 <input 
                    type="file" 
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${selectedFile ? 'border-green-500 bg-green-50' : 'border-red-200 bg-red-50/30 hover:bg-red-50'}`}>
                    <UploadCloud className={`mx-auto mb-2 ${selectedFile ? 'text-green-600' : 'text-red-400'}`} size={28} />
                    <span className={`text-sm font-bold block ${selectedFile ? 'text-green-700' : 'text-red-600'}`}>
                      {selectedFile ? selectedFile.name : (mode === 'refund' ? 'העלאת חשבונית/קבלה' : 'העלאת דרישת תשלום')}
                    </span>
                    {!selectedFile && <span className="text-xs text-red-400">חובה *</span>}
                 </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* פרטי בנק (מופרד לגמרי) */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                      <CreditCard className="text-red-500" size={20} />
                      לאן להעביר את הכסף?
                  </h3>
               </div>
               
               {/* בחירת חשבון שמור */}
               <div className="relative">
                  <select 
                    onChange={handleSelectBankAccount} 
                    className="w-full bg-blue-50/50 border border-blue-200 text-slate-700 font-medium text-sm rounded-xl py-3 px-4 appearance-none outline-none focus:border-blue-500"
                  >
                    <option value="">בחר חשבון בנק שמור...</option>
                    {savedBankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label} ({acc.account})</option>)}
                    <option value="new">הזן חשבון חדש...</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-3.5 text-slate-400" size={16} />
               </div>

               {/* שדות הבנק */}
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                   <input type="text" placeholder="שם בעל החשבון" required value={bankDetails.ownerName} onChange={(e) => setBankDetails({...bankDetails, ownerName: e.target.value})} className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
                   <div className="grid grid-cols-3 gap-3">
                      <input type="text" placeholder="בנק" required maxLength={2} value={bankDetails.bankNumber} onChange={(e) => setBankDetails({...bankDetails, bankNumber: e.target.value})} className="col-span-1 px-3 py-3 bg-white border border-slate-200 rounded-xl outline-none text-center" />
                      <input type="text" placeholder="סניף" required maxLength={3} value={bankDetails.branchNumber} onChange={(e) => setBankDetails({...bankDetails, branchNumber: e.target.value})} className="col-span-1 px-3 py-3 bg-white border border-slate-200 rounded-xl outline-none text-center" />
                      <input type="text" placeholder="חשבון" required value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})} className="col-span-1 px-3 py-3 bg-white border border-slate-200 rounded-xl outline-none text-center" />
                   </div>
               </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-lg mt-6">
              {isSubmitting ? "שולח..." : "שלח בקשה"}
            </button>
          </form>
        </div>
      </div>
      
      {/* פופאפ הצלחה */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">הבקשה נשלחה!</h2>
            <p className="text-slate-500 mb-8">הבקשה הועברה לאישור המנהל.</p>
            <button onClick={() => router.push('/dashboard')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg">חזור לדף הבית</button>
          </div>
        </div>
      )}
    </div>
  );
}