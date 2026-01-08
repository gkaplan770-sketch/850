"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Camera, Calendar, 
  Store, DollarSign, Trash2, 
  UserPlus, RefreshCw, Briefcase, Building
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ExpensePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  
  const [viewMode, setViewMode] = useState<'menu' | 'form'>('menu');
  const [expenseType, setExpenseType] = useState(''); 

  const [existingVendors, setExistingVendors] = useState<string[]>([]);

  // שדות הטופס
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState(''); // זה תמיד שם הספק עכשיו
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(''); // כאן נכתוב את סיבת ההחזר
  
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null);

  // שדות לספק חדש
  const [bankName, setBankName] = useState('');
  const [branchNumber, setBranchNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountOwner, setAccountOwner] = useState('');
  const [bankProofType, setBankProofType] = useState('check');
  
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);
  const [bankProofPreviewUrl, setBankProofPreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    if (!id) { router.push('/'); return; }
    setUserId(id);
    fetchExistingVendors(id);
  }, []);

  // שליפה מסוננת - מביא רק ספקים שהוקמו כ"חדשים" עם פרטי בנק
  const fetchExistingVendors = async (uid: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('title, details') 
      .eq('user_id', uid)
      .eq('type', 'expense')
      .not('title', 'is', null);

    if (data && data.length > 0) {
      const filtered = data.filter((item: any) => {
          const d = item.details || {};
          // רק מי שהוגדר כ-vendor_new נכנס לרשימה
          return d.expense_type === 'vendor_new';
      }).map(item => item.title);

      setExistingVendors(Array.from(new Set(filtered)).sort());
    }
  };

  const handleSelectType = (type: string) => {
    setExpenseType(type);
    setTitle('');
    setDescription('');
    setViewMode('form');
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInvoiceFile(file);
      setInvoicePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleBankProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBankProofFile(file);
      setBankProofPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !title) { alert("חובה למלא סכום ושם ספק"); return; }
    
    if (expenseType === 'vendor_new') {
        if (!bankName || !accountNumber || !accountOwner) {
            alert("לספק חדש חובה למלא את פרטי הבנק המלאים");
            return;
        }
        if (!bankProofFile) {
            alert("לספק חדש חובה להעלות צילום צ'ק או אישור ניהול חשבון");
            return;
        }
    }

    setIsSubmitting(true);

    try {
      let invoiceUrl = null;
      let bankProofUrl = null;

      if (invoiceFile) {
          const fileExt = invoiceFile.name.split('.').pop();
          const fileName = `inv_${userId}_${Date.now()}.${fileExt}`;
          const { error: upErr } = await supabase.storage.from('images').upload(fileName, invoiceFile);
          if (upErr) throw new Error("שגיאה בהעלאת חשבונית: " + upErr.message);
          const { data } = supabase.storage.from('images').getPublicUrl(fileName);
          invoiceUrl = data.publicUrl;
      }

      if (bankProofFile) {
          const fileExt = bankProofFile.name.split('.').pop();
          const fileName = `bank_${userId}_${Date.now()}.${fileExt}`;
          const { error: upErr } = await supabase.storage.from('images').upload(fileName, bankProofFile);
          if (upErr) throw new Error("שגיאה בהעלאת אישור בנק: " + upErr.message);
          const { data } = supabase.storage.from('images').getPublicUrl(fileName);
          bankProofUrl = data.publicUrl;
      }

      const detailsObj: any = {
          expense_type: expenseType,
          payment_method: 'transfer', 
          notes: description,
          is_expense: true
      };

      if (expenseType === 'vendor_new') {
          detailsObj.bank_details = {
              bank_name: bankName,
              branch: branchNumber,
              account: accountNumber,
              owner_name: accountOwner,
              proof_type: bankProofType,
              proof_url: bankProofUrl
          };
      }

      const { error: insertError } = await supabase.from('transactions').insert([{
        user_id: userId,
        type: 'expense', 
        title: title, // זה תמיד שם הספק
        amount: Number(amount), 
        date: date,
        status: 'pending',
        file_url: invoiceUrl,
        activity_id: null,
        details: detailsObj
      }]);

      if (insertError) throw insertError;
      
      alert("הדיווח נקלט בהצלחה!");
      router.push('/dashboard');

    } catch (err: any) {
      console.error(err);
      alert("שגיאה בשליחה:\n" + (err.message || "שגיאה לא ידועה"));
      setIsSubmitting(false);
    }
  };

  // --- תפריט ראשי ---
  if (viewMode === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-6" dir="rtl">
        <div className="flex items-center gap-4 mb-8">
           <Link href="/dashboard/add" className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-100">
              <ArrowRight size={20} />
           </Link>
           <div>
              <h1 className="text-2xl font-black text-slate-900">סוג הוצאה</h1>
              <p className="text-slate-500 text-sm">בחר את סוג ההוצאה לדיווח</p>
           </div>
        </div>

        <div className="grid gap-4 max-w-md mx-auto">
           <button onClick={() => handleSelectType('vendor_new')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all text-right group">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                 <UserPlus size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800 text-lg">ספק חדש</h3>
                 <p className="text-xs text-slate-400">הקמת ספק חדש + פרטי בנק</p>
              </div>
           </button>

           <button onClick={() => handleSelectType('vendor_exist')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all text-right group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Briefcase size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800 text-lg">ספק קיים</h3>
                 <p className="text-xs text-slate-400">דיווח מהיר לספק מוכר</p>
              </div>
           </button>

           <button onClick={() => handleSelectType('reimbursement')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all text-right group">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                 <RefreshCw size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800 text-lg">החזר הוצאות</h3>
                 <p className="text-xs text-slate-400">בקשת החזר על הוצאה אישית</p>
              </div>
           </button>
        </div>
      </div>
    );
  }

  // --- הגדרות כותרת וטקסטים ---
  const pageTitle = expenseType === 'reimbursement' ? 'בקשת החזר הוצאות' : (expenseType === 'vendor_new' ? 'הקמת ספק חדש' : 'דיווח ספק קיים');
  
  // כאן השינוי: הכותרת תמיד מבקשת את שם הספק
  const titleLabel = 'שם הספק / העסק';
  const titlePlaceholder = expenseType === 'reimbursement' ? 'לדוגמה: מקס סטוק, אושר עד...' : 'שם העסק/הספק';
  
  // כיתוב לתיבת הפירוט למטה
  const descriptionLabel = expenseType === 'reimbursement' ? 'פירוט ההוצאה (על מה שולם?)' : 'הערות נוספות';
  const descriptionPlaceholder = expenseType === 'reimbursement' ? 'לדוגמה: ציוד לפעילות פתיחה, כיבוד למדריכים...' : 'הערות...';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      <div className="bg-white p-5 shadow-sm border-b border-slate-100 sticky top-0 z-10 flex items-center gap-3">
         <button onClick={() => setViewMode('menu')} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600">
            <ArrowRight size={18} />
         </button>
         <h1 className="text-lg font-black text-slate-800">{pageTitle}</h1>
      </div>

      <div className="p-5 max-w-xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
           
           <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              
              {/* שדה שם הספק */}
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">{titleLabel}</label>
                 <div className="relative">
                    {expenseType === 'vendor_exist' ? (
                       existingVendors.length > 0 ? (
                           <select 
                             value={title} 
                             onChange={(e) => setTitle(e.target.value)} 
                             className="w-full p-4 pl-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-slate-800 appearance-none bg-white"
                           >
                             <option value="">בחר ספק מהרשימה...</option>
                             {existingVendors.map((v, i) => (
                               <option key={i} value={v}>{v}</option>
                             ))}
                           </select>
                       ) : (
                           <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-bold">
                               עדיין אין לך ספקים קודמים ברשימה.
                               <br/>
                               <span className="text-xs font-normal">הקם ספק דרך "ספק חדש" כדי שיופיע כאן בעתיד.</span>
                               <br/>
                               <button type="button" onClick={() => handleSelectType('vendor_new')} className="underline mt-2">מעבר להקמת ספק חדש</button>
                           </div>
                       )
                    ) : (
                       <input 
                         type="text" 
                         required={expenseType !== 'vendor_exist'}
                         placeholder={titlePlaceholder} 
                         value={title} 
                         onChange={(e) => setTitle(e.target.value)} 
                         className="w-full p-4 pl-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-slate-800" 
                       />
                    )}
                    
                    {(expenseType !== 'vendor_exist' || existingVendors.length > 0) && (
                        <Store className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
                    )}
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">סכום לתשלום</label>
                 <div className="relative">
                    <input type="number" required placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 outline-none focus:border-red-500 font-black text-2xl" />
                    <DollarSign className="absolute left-4 top-5 text-slate-300 pointer-events-none" size={24} />
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">תאריך החשבונית</label>
                 <div className="relative">
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800" />
                    <Calendar className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
                 </div>
              </div>
           </div>

           {/* פרטי בנק - רק לספק חדש */}
           {expenseType === 'vendor_new' && (
             <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2 text-purple-700">
                    <Building size={20} />
                    <h3 className="font-bold">פרטי חשבון בנק</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">שם הבנק ומספר</label>
                        <input type="text" required placeholder="לדוגמה: פועלים 12" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">מספר סניף</label>
                        <input type="text" required placeholder="000" value={branchNumber} onChange={(e) => setBranchNumber(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold" />
                    </div>
                </div>
                
                <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">מספר חשבון</label>
                    <input type="text" required placeholder="000000" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold" />
                </div>
                
                <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">שם בעל החשבון</label>
                    <input type="text" required placeholder="ישראל ישראלי" value={accountOwner} onChange={(e) => setAccountOwner(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold" />
                </div>

                <div className="pt-2 border-t border-purple-200 mt-2">
                    <label className="text-xs font-bold text-slate-600 mb-2 block">סוג אסמכתא לבנק</label>
                    <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => setBankProofType('check')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${bankProofType === 'check' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200'}`}>צ'ק מבוטל</button>
                        <button type="button" onClick={() => setBankProofType('approval')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${bankProofType === 'approval' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200'}`}>אישור ניהול חשבון</button>
                    </div>

                    {bankProofPreviewUrl ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-purple-200 h-32 bg-white">
                           <img src={bankProofPreviewUrl} alt="Bank Proof" className="w-full h-full object-contain" />
                           <button onClick={() => {setBankProofFile(null); setBankProofPreviewUrl(null)}} type="button" className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><Trash2 size={14} /></button>
                        </div>
                    ) : (
                        <div className="relative bg-white rounded-xl border-2 border-dashed border-purple-200 p-4 text-center">
                           <span className="text-xs font-bold text-purple-600">לחץ להעלאת צילום האישור</span>
                           <input type="file" accept="image/*" onChange={handleBankProofChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    )}
                </div>
             </div>
           )}

           <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                 <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 block">צילום חשבונית / קבלה</label>
                    <span className="text-[10px] px-2 rounded-full bg-red-50 text-red-600 font-bold">חובה</span>
                 </div>
                 {invoicePreviewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm h-48">
                       <img src={invoicePreviewUrl} alt="Preview" className="w-full h-full object-contain bg-slate-50" />
                       <button onClick={() => {setInvoiceFile(null); setInvoicePreviewUrl(null)}} type="button" className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-md hover:bg-red-700 transition-colors"><Trash2 size={18} /></button>
                    </div>
                 ) : (
                    <div className="relative">
                       <input type="file" accept="image/*" onChange={handleInvoiceChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                       <div className="border-2 border-dashed rounded-2xl p-8 text-center border-slate-200 hover:border-blue-400 transition-colors bg-slate-50">
                          <Camera className="mx-auto mb-2 text-slate-300" size={32} />
                          <p className="text-sm font-bold text-slate-500">לחץ לצילום החשבונית</p>
                       </div>
                    </div>
                 )}
              </div>
              
              {/* תיבת פירוט / הערות */}
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">{descriptionLabel}</label>
                 <textarea 
                    rows={2} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 resize-none text-sm" 
                    placeholder={descriptionPlaceholder} 
                 />
              </div>
           </div>

           <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50">
              {isSubmitting ? "שולח..." : (expenseType === 'vendor_new' ? "הקם ספק ושלח דיווח" : "שלח דיווח")}
           </button>
        </form>
      </div>
    </div>
  );
}