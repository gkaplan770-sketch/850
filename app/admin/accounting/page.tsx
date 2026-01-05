"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, Download, RefreshCw, 
  Archive, DollarSign, Package, CheckSquare, Square
} from "lucide-react";
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Transaction {
  id: string;
  created_at: string;
  date: string;
  amount: number;
  title: string;
  type: 'income' | 'expense';
  status: 'pending' | 'approved' | 'rejected';
  file_url?: string;
  details?: any;
  is_exported: boolean;
  users?: { first_name: string; last_name: string; branch_name: string; };
}

export default function AccountingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [viewMode, setViewMode] = useState<'new' | 'archived'>('new');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'supplier_exist' | 'supplier_new' | 'refund'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchTransactions = async () => {
    setLoading(true);
    // מביא רק עסקאות שאושרו
    let query = supabase
      .from('transactions')
      .select('*, users(first_name, last_name, branch_name)')
      .eq('status', 'approved')
      .order('date', { ascending: false });

    // סינון לפי סטטוס ייצוא
    if (viewMode === 'new') {
      query = query.eq('is_exported', false);
    } else {
      query = query.eq('is_exported', true);
    }

    const { data, error } = await query;
    if (!error) {
      setTransactions(data || []);
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [viewMode]);

  // --- הלוגיקה הקובעת: איזה סוג עסקה זה? ---
  const getTransactionCategory = (t: Transaction) => {
    // 1. החזר הוצאות
    if (t.details?.mode === 'refund') return 'refund';
    
    // 2. ספק (חדש או קיים)
    if (t.details?.mode === 'supplier') {
        // אם יש פרטי חשבון בנק מלאים -> זה ספק חדש
        if (t.details?.bank_details?.accountNumber && t.details?.bank_details?.bankNumber) {
            return 'supplier_new';
        }
        // אחרת -> ספק קיים
        return 'supplier_exist'; 
    }
    
    // ברירת מחדל
    return 'supplier_exist';
  };

  // סינון הרשימה לפי הטאב שנבחר
  const filteredData = transactions.filter(t => {
    const cat = getTransactionCategory(t);
    if (categoryFilter === 'all') return true;
    return cat === categoryFilter;
  });

  // בחירה מרובה
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      const ids = filteredData.map(t => t.id);
      setSelectedIds(new Set(ids));
    }
  };

  // --- ייצוא ל-ZIP + Excel ---
  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);

    try {
      const zip = new JSZip();
      const excelRows: any[] = [];
      const dateStr = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
      const folderName = `הנהלת_חשבונות_${dateStr}`;
      const imgFolder = zip.folder("קבצים");

      const itemsToExport = transactions.filter(t => selectedIds.has(t.id));

      for (const t of itemsToExport) {
        const category = getTransactionCategory(t);
        let catName = 'כללי';
        if (category === 'refund') catName = 'החזר_הוצאות';
        if (category === 'supplier_new') catName = 'ספק_חדש';
        if (category === 'supplier_exist') catName = 'ספק_קיים';

        // 1. בניית שורה לאקסל
        const rowData: any = {
          'תאריך': new Date(t.date).toLocaleDateString('he-IL'),
          'סניף': t.users?.branch_name || '',
          'שם השליח': `${t.users?.first_name} ${t.users?.last_name}`,
          'סוג': catName.replace('_', ' '),
          'שם ספק/עסק': t.title,
          'סכום': t.amount,
          'הערות': t.details?.notes || '',
        };

        // הוספת פרטי בנק לאקסל (אם יש)
        if (t.details?.bank_details?.accountNumber) {
            rowData['שם מוטב'] = t.details.bank_details.ownerName;
            rowData['בנק'] = t.details.bank_details.bankNumber;
            rowData['סניף'] = t.details.bank_details.branchNumber;
            rowData['חשבון'] = t.details.bank_details.accountNumber;
        }

        excelRows.push(rowData);

        // 2. הורדת תמונות והוספה ל-ZIP
        // קובץ ראשי (חשבונית)
        if (t.file_url && imgFolder) {
          try {
            const safeTitle = t.title.replace(/[^a-zA-Z0-9א-ת]/g, "_");
            const fileName = `${catName}_${safeTitle}_${t.amount}SH_${t.id.slice(0,4)}.jpg`;
            const response = await fetch(t.file_url);
            const blob = await response.blob();
            imgFolder.file(fileName, blob);
          } catch (err) {
            console.error("שגיאה בהורדת קובץ", t.id);
          }
        }

        // קובץ משני (אישור בנק - אם קיים)
        if (t.details?.bank_confirm_url && imgFolder) {
           try {
             const safeTitle = t.title.replace(/[^a-zA-Z0-9א-ת]/g, "_");
             const fileName = `אישור_בנק_${safeTitle}_${t.id.slice(0,4)}.jpg`;
             const response = await fetch(t.details.bank_confirm_url);
             const blob = await response.blob();
             imgFolder.file(fileName, blob);
           } catch (err) {
             console.error("שגיאה בהורדת אישור בנק", t.id);
           }
        }
      }

      // 3. יצירת אקסל
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "נתונים");
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      zip.file(`דוח_מרכז_${dateStr}.xlsx`, excelBuffer);

      // 4. שמירת ה-ZIP במחשב
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);

      // 5. עדכון ב-DB שהקבצים יוצאו
      await supabase
        .from('transactions')
        .update({ is_exported: true })
        .in('id', Array.from(selectedIds));

      alert("הייצוא הסתיים בהצלחה!");
      await fetchTransactions(); // רענון הטבלה

    } catch (err) {
      console.error(err);
      alert("אירעה שגיאה בייצוא.");
    } finally {
      setExporting(false);
    }
  };

  const handleRestore = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm("להחזיר את הפריטים שנבחרו למצב 'ממתין לייצוא'?")) return;
    await supabase.from('transactions').update({ is_exported: false }).in('id', Array.from(selectedIds));
    fetchTransactions();
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* כותרת עליונה */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <DollarSign className="text-blue-600" /> הנהלת חשבונות
            </h1>
            <p className="text-slate-500 text-sm mt-1">ייצוא מרוכז וניהול הוצאות</p>
         </div>
         
         <div className="bg-slate-100 p-1 rounded-xl flex">
            <button onClick={() => setViewMode('new')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'new' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>
               <RefreshCw size={16} /> ממתין לייצוא
            </button>
            <button onClick={() => setViewMode('archived')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'archived' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
               <Archive size={16} /> היסטוריה
            </button>
         </div>
      </div>

      {/* סרגל כלים וסינון */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button onClick={() => setCategoryFilter('all')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>הכל</button>
            <button onClick={() => setCategoryFilter('supplier_exist')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'supplier_exist' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>ספקים קיימים</button>
            <button onClick={() => setCategoryFilter('supplier_new')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'supplier_new' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>ספקים חדשים</button>
            <button onClick={() => setCategoryFilter('refund')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'refund' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>החזר הוצאות</button>
         </div>

         {selectedIds.size > 0 && viewMode === 'new' && (
             <button onClick={handleExport} disabled={exporting} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all">
                {exporting ? "מעבד..." : <><Download size={18} /> הורד ZIP + Excel</>}
             </button>
         )}
         {selectedIds.size > 0 && viewMode === 'archived' && (
             <button onClick={handleRestore} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                <RefreshCw size={18} /> שחזר לממתינים
             </button>
         )}
      </div>

      {/* טבלת נתונים */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         {loading ? (
            <div className="p-20 text-center text-slate-400">טוען נתונים...</div>
         ) : filteredData.length === 0 ? (
            <div className="p-20 text-center text-slate-500 font-bold">אין נתונים להצגה בקטגוריה זו</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4 w-12"><input type="checkbox" onChange={selectAll} checked={selectedIds.size === filteredData.length && filteredData.length > 0} className="w-4 h-4" /></th>
                        <th className="px-6 py-4">תאריך</th>
                        <th className="px-6 py-4">שליח</th>
                        <th className="px-6 py-4">סוג</th>
                        <th className="px-6 py-4">נושא / ספק</th>
                        <th className="px-6 py-4">סכום</th>
                        <th className="px-6 py-4">אסמכתא</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredData.map((t) => {
                        const cat = getTransactionCategory(t);
                        return (
                          <tr key={t.id} className={`hover:bg-blue-50/50 transition-colors ${selectedIds.has(t.id) ? 'bg-blue-50' : ''}`}>
                             <td className="px-6 py-4">
                                <button onClick={() => toggleSelect(t.id)} className="text-slate-400 hover:text-blue-600">
                                   {selectedIds.has(t.id) ? <CheckSquare className="text-blue-600" /> : <Square />}
                                </button>
                             </td>
                             <td className="px-6 py-4 text-sm font-medium">{new Date(t.date).toLocaleDateString('he-IL')}</td>
                             <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{t.users?.first_name} {t.users?.last_name}</div>
                                <div className="text-xs text-slate-500">{t.users?.branch_name}</div>
                             </td>
                             <td className="px-6 py-4">
                                {cat === 'refund' && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">החזר הוצאות</span>}
                                {cat === 'supplier_new' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">ספק חדש</span>}
                                {cat === 'supplier_exist' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">ספק קיים</span>}
                             </td>
                             <td className="px-6 py-4 font-medium">{t.title}</td>
                             <td className="px-6 py-4 font-bold text-slate-900">₪{t.amount.toLocaleString()}</td>
                             <td className="px-6 py-4 flex gap-2">
                                {t.file_url && <a href={t.file_url} target="_blank" className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1"><FileText size={14} /> קבלה</a>}
                                {t.details?.bank_confirm_url && <a href={t.details.bank_confirm_url} target="_blank" className="text-orange-600 hover:underline text-xs font-bold flex items-center gap-1"><FileText size={14} /> אישור בנק</a>}
                             </td>
                          </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}