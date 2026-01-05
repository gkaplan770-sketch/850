"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Check, CreditCard, UploadCloud, 
  Building, User, ChevronDown, AlertTriangle, 
  Plus, Search, Store, FileText 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const KNOWN_SUPPLIERS = [
  "מקס סטוק", "פוקס", "רמי לוי", "אגד היסעים", "חברת חשמל", "בזק", "דפוס המרכז"
];

export default function ExpenseRequestPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [branchName, setBranchName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'refund' | 'supplier_exist' | 'supplier_new'>('refund');
  
  const [supplierName, setSupplierName] = useState(''); 
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  const [bankDetails, setBankDetails] = useState({ 
    ownerName: '', bankNumber: '', branchNumber: '', accountNumber: '' 
  });
  
  // קובץ 1: קבלה/חשבונית (חובה תמיד)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  // קובץ 2: אישור חשבון (חובה רק לספק חדש)
  const [bankFile, setBankFile] = useState<File | null>(null);

  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedBranch = localStorage.getItem('user_branch');
    if (!storedUserId) { router.push('/'); return; }
    
    setUserId(storedUserId);
    setBranchName(storedBranch || '');

    setSavedAccounts([
      { id: '1', label: 'החשבון הראשי שלי', owner: 'ישראל ישראלי', bank: '12', branch: '654', account: '987654' }
    ]);
  }, []);

  const handleSelectSavedAccount = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const acc = savedAccounts.find(a => a.id === e.target.value);
    if (acc) {
      setBankDetails({ ownerName: acc.owner, bankNumber: acc.bank, branchNumber: acc.branch, accountNumber: acc.account });
    } else {
      setBankDetails({ ownerName: '', bankNumber: '', branchNumber: '', accountNumber: '' });
    }
  };

  // פונקציה שמטפלת בשני סוגי הקבצים
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'bank') => {
    if (e.target.files && e.target.files[0]) {
        if (type === 'invoice') setInvoiceFile(e.target.files[0]);
        if (type === 'bank') setBankFile(e.target.files[0]);
    }
  };

  const checkBalance = async () => {
    const { data } = await supabase.from('transactions').select('amount, type').eq('user_id', userId).eq('status', 'approved');
    if (!data) return 0;
    const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceError(null);

    // בדיקות תקינות
    if (!userId) return;
    if (!invoiceFile) { alert("חובה להעלות קבלה/חשבונית"); return; }
    
    // בדיקה ייחודית לספק חדש
    if (mode === 'supplier_new' && !bankFile) {
        alert("עבור ספק חדש חובה לצרף צילום צ'ק או אישור ניהול חשבון");
        return;
    }

    setIsSubmitting(true);

    try {
      // 1. בדיקת יתרה
      const currentBalance = await checkBalance();
      if (Number(amount) > currentBalance) {
        setBalanceError(`היתרה שלך היא ₪${currentBalance.toLocaleString()}. אין כיסוי לבקשה זו.`);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 2. העלאת הקבלה (Invoice)
      const invExt = invoiceFile.name.split('.').pop();
      const invName = `inv_${userId}_${Date.now()}.${invExt}`;
      const { error: upErr1 } = await supabase.storage.from('images').upload(invName, invoiceFile);
      if (upErr1) throw upErr1;
      const { data: invUrlData } = supabase.storage.from('images').getPublicUrl(invName);

      // 3. העלאת אישור בנק (אם יש)
      let bankFileUrl = null;
      if (mode === 'supplier_new' && bankFile) {
          const bankExt = bankFile.name.split('.').pop();
          const bankName = `bank_${userId}_${Date.now()}.${bankExt}`;
          const { error: upErr2 } = await supabase.storage.from('images').upload(bankName, bankFile);
          if (upErr2) throw upErr2;
          const { data: bankUrlData } = supabase.storage.from('images').getPublicUrl(bankName);
          bankFileUrl = bankUrlData.publicUrl;
      }

      // 4. הכנת הנתונים
      let finalMode = 'supplier'; 
      let finalBankDetails = {};

      if (mode === 'refund') {
        finalMode = 'refund'; 
        finalBankDetails = bankDetails; 
      } else if (mode === 'supplier_new') {
        finalMode = 'supplier'; 
        finalBankDetails = bankDetails; 
      } else {
        finalMode = 'supplier'; 
        finalBankDetails = {}; 
      }

      // 5. שמירה ב-DB
      const { error: insertError } = await supabase.from('transactions').insert([{
        user_id: userId,
        type: 'expense',
        title: supplierName,
        amount: Number(amount),
        date: new Date().toISOString(),
        status: 'pending',
        file_url: invUrlData.publicUrl, // הקבלה הראשית
        details: {
          notes: notes,
          bank_details: finalBankDetails,
          mode: finalMode,
          supplierName: supplierName,
          bank_confirm_url: bankFileUrl // הלינק לאישור החשבון (אם יש)
        }
      }]);

      if (insertError) throw insertError;
      setIsSubmitting(false);
      setShowSuccessPopup(true);

    } catch (error) {
      console.error(error);
      alert('שגיאה בשמירה');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      
      {/* כותרת */}
      <div className="bg-white p-5 shadow-sm border-b border-slate-100 sticky top-0 z-10 flex items-center gap-3">
         <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600">
            <ArrowRight size={18} />
         </Link>
         <h1 className="text-lg font-black text-slate-800">בקשת תשלום / החזר</h1>
      </div>

      <div className="p-5 max-w-xl mx-auto space-y-6">
        
        {/* התראת יתרה */}
        {balanceError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="text-red-500 shrink-0" />
            <div>
              <h3 className="font-bold text-red-800 text-sm">חריגה מתקציב</h3>
              <p className="text-red-600 text-xs">{balanceError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           
           {/* שלב 1: בחירת סוג התשלום */}
           <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 px-1">סוג התשלום (בחר אחד)</label>
              <div className="grid grid-cols-1 gap-3">
                 
                 <button type="button" onClick={() => setMode('refund')} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-right ${mode === 'refund' ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mode === 'refund' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                       <User size={20} />
                    </div>
                    <div>
                       <div className={`font-bold ${mode === 'refund' ? 'text-purple-700' : 'text-slate-700'}`}>החזר הוצאות</div>
                       <div className="text-xs text-slate-400">שילמתי מכספי, תזכו אותי</div>
                    </div>
                    {mode === 'refund' && <Check className="mr-auto text-purple-600" size={20} />}
                 </button>

                 <button type="button" onClick={() => setMode('supplier_exist')} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-right ${mode === 'supplier_exist' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mode === 'supplier_exist' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                       <Store size={20} />
                    </div>
                    <div>
                       <div className={`font-bold ${mode === 'supplier_exist' ? 'text-blue-700' : 'text-slate-700'}`}>ספק קיים</div>
                       <div className="text-xs text-slate-400">ספק מוכר (לא צריך פרטי בנק)</div>
                    </div>
                    {mode === 'supplier_exist' && <Check className="mr-auto text-blue-600" size={20} />}
                 </button>

                 <button type="button" onClick={() => setMode('supplier_new')} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-right ${mode === 'supplier_new' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mode === 'supplier_new' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                       <Plus size={20} />
                    </div>
                    <div>
                       <div className={`font-bold ${mode === 'supplier_new' ? 'text-orange-700' : 'text-slate-700'}`}>ספק חדש</div>
                       <div className="text-xs text-slate-400">הקמת ספק + הזנת פרטי בנק</div>
                    </div>
                    {mode === 'supplier_new' && <Check className="mr-auto text-orange-600" size={20} />}
                 </button>
              </div>
           </div>

           {/* שלב 2: פרטים כלליים */}
           <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-800 border-b pb-2">פרטי התשלום</h3>
              
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">
                    {mode === 'refund' ? 'שם העסק (עבור מה שילמת?)' : 'שם הספק'}
                 </label>
                 
                 {mode === 'supplier_exist' ? (
                   <div className="relative">
                      <select 
                        className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-slate-700 appearance-none"
                        onChange={(e) => setSupplierName(e.target.value)}
                        value={supplierName}
                      >
                         <option value="">בחר ספק מהרשימה...</option>
                         {KNOWN_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                         <option value="other">אחר (הזן ידנית)...</option>
                      </select>
                      <ChevronDown className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
                   </div>
                 ) : null}

                 {(mode !== 'supplier_exist' || supplierName === 'other') && (
                    <input 
                      type="text" 
                      placeholder="הקלד את השם..." 
                      className={`w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400 ${mode === 'supplier_exist' ? 'mt-2' : ''}`}
                      value={supplierName === 'other' ? '' : supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                 )}
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">סכום לתשלום</label>
                 <div className="relative">
                    <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 pl-10 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400 font-mono text-lg font-bold" placeholder="0.00" />
                    <span className="absolute left-4 top-3.5 text-slate-400">₪</span>
                 </div>
              </div>

              {/* העלאת קבלה (תמיד) */}
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">צילום קבלה / חשבונית (חובה)</label>
                 <div className="relative">
                    <input type="file" required onChange={(e) => handleFileChange(e, 'invoice')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center ${invoiceFile ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-50'}`}>
                       <UploadCloud className={`mx-auto mb-1 ${invoiceFile ? 'text-green-600' : 'text-slate-400'}`} />
                       <span className={`text-xs font-bold ${invoiceFile ? 'text-green-700' : 'text-slate-500'}`}>
                          {invoiceFile ? invoiceFile.name : 'לחץ להעלאת קבלה'}
                       </span>
                    </div>
                 </div>
              </div>

           </div>

           {/* שלב 3: פרטי בנק ואישור חשבון (רק לספק חדש) */}
           {mode === 'supplier_new' && (
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 space-y-4 shadow-sm animate-in slide-in-from-bottom-2">
                 <h3 className="font-bold text-orange-800 border-b border-orange-200 pb-2 flex items-center gap-2">
                    <Building size={18} /> פרטי ספק חדש (חובה למלא הכל)
                 </h3>

                 {/* העלאת אישור חשבון */}
                 <div>
                    <label className="text-xs font-bold text-orange-700 mb-1 block">צילום צ'ק / אישור ניהול חשבון (חובה)</label>
                    <div className="relative">
                       <input type="file" required onChange={(e) => handleFileChange(e, 'bank')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                       <div className={`border-2 border-dashed rounded-xl p-4 text-center ${bankFile ? 'border-green-500 bg-green-50' : 'border-orange-300 bg-white'}`}>
                          <FileText className={`mx-auto mb-1 ${bankFile ? 'text-green-600' : 'text-orange-400'}`} />
                          <span className={`text-xs font-bold ${bankFile ? 'text-green-700' : 'text-orange-600'}`}>
                             {bankFile ? bankFile.name : 'לחץ להעלאת אישור בנק'}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <input type="text" placeholder="שם בעל החשבון" value={bankDetails.ownerName} onChange={e => setBankDetails({...bankDetails, ownerName: e.target.value})} className="w-full p-3 rounded-xl border border-orange-200 outline-none text-sm" />
                    <div className="grid grid-cols-3 gap-2">
                       <input type="tel" placeholder="בנק" maxLength={2} value={bankDetails.bankNumber} onChange={e => setBankDetails({...bankDetails, bankNumber: e.target.value})} className="p-3 rounded-xl border border-orange-200 outline-none text-center text-sm" />
                       <input type="tel" placeholder="סניף" maxLength={3} value={bankDetails.branchNumber} onChange={e => setBankDetails({...bankDetails, branchNumber: e.target.value})} className="p-3 rounded-xl border border-orange-200 outline-none text-center text-sm" />
                       <input type="tel" placeholder="חשבון" value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} className="p-3 rounded-xl border border-orange-200 outline-none text-center text-sm" />
                    </div>
                 </div>
              </div>
           )}

           {/* פרטי בנק להחזר הוצאות (רגיל) */}
           {mode === 'refund' && (
              <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 space-y-4 shadow-sm animate-in slide-in-from-bottom-2">
                 <h3 className="font-bold text-purple-800 border-b border-purple-200 pb-2 flex items-center gap-2">
                    <CreditCard size={18} /> פרטי חשבון לזיכוי
                 </h3>
                 
                 <div className="relative">
                    <select onChange={handleSelectSavedAccount} className="w-full p-3 bg-white text-purple-900 rounded-xl border-none outline-none font-bold appearance-none">
                       <option value="">בחר חשבון שמור...</option>
                       {savedAccounts.map(a => <option key={a.id} value={a.id}>{a.label} ({a.account})</option>)}
                       <option value="new">חשבון אחר...</option>
                    </select>
                    <ChevronDown className="absolute left-3 top-3.5 text-purple-400 pointer-events-none" size={18} />
                 </div>

                 <div className="space-y-3">
                    <input type="text" placeholder="שם בעל החשבון" value={bankDetails.ownerName} onChange={e => setBankDetails({...bankDetails, ownerName: e.target.value})} className="w-full p-3 rounded-xl border border-purple-200 outline-none text-sm" />
                    <div className="grid grid-cols-3 gap-2">
                       <input type="tel" placeholder="בנק" maxLength={2} value={bankDetails.bankNumber} onChange={e => setBankDetails({...bankDetails, bankNumber: e.target.value})} className="p-3 rounded-xl border border-purple-200 outline-none text-center text-sm" />
                       <input type="tel" placeholder="סניף" maxLength={3} value={bankDetails.branchNumber} onChange={e => setBankDetails({...bankDetails, branchNumber: e.target.value})} className="p-3 rounded-xl border border-purple-200 outline-none text-center text-sm" />
                       <input type="tel" placeholder="חשבון" value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} className="p-3 rounded-xl border border-purple-200 outline-none text-center text-sm" />
                    </div>
                 </div>
              </div>
           )}

           <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
              {isSubmitting ? "שולח..." : "שלח בקשה לאישור"}
           </button>

        </form>
      </div>

      {/* פופאפ הצלחה */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                 <Check size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">הבקשה נשלחה!</h2>
              <p className="text-slate-500 mb-6">הבקשה הועברה לאישור המנהל ותופיע מיד בלוח הבקרה שלך.</p>
              <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">חזור לראשי</button>
           </div>
        </div>
      )}

    </div>
  );
}