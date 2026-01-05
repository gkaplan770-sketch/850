"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, CheckSquare, Square, 
  Search, FileSpreadsheet, FolderArchive, History, Clock, Loader2 
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // למצב ייצוא
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // טעינת נתונים
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          users:user_id ( branch_name, first_name, last_name )
        `)
        .eq('status', 'approved'); // רק מה שאושר

      // סינון לפי טאבים
      if (activeTab === 'pending') {
        // טרם יוצא (אין תאריך ייצוא)
        query = query.is('exported_at', null); 
      } else {
        // כבר יוצא (יש תאריך ייצוא)
        query = query.not('exported_at', 'is', null).order('exported_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // פירמוט הנתונים לתצוגה נוחה
      const formatted = data.map((t: any) => ({
        id: t.id,
        date: t.date,
        branch: t.users?.branch_name || 'כללי',
        shaliach: `${t.users?.first_name} ${t.users?.last_name}`,
        title: t.title,
        type: t.type === 'supplier' ? 'expense' : t.type,
        amount: t.amount,
        file_url: t.file_url,
        exported_at: t.exported_at ? new Date(t.exported_at).toLocaleDateString('he-IL') : null,
        raw_details: t // שומרים את האובייקט המקורי לייצוא
      }));

      setTransactions(formatted);
      setSelectedItems([]); // איפוס בחירה במעבר טאב

    } catch (err) {
      console.error("Error fetching accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

  // --- לוגיקה לבחירה ---
  const toggleSelectAll = () => {
    if (selectedItems.length === transactions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(transactions.map(t => t.id));
    }
  };

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // --- המנוע הגדול: ייצוא לאקסל ו-ZIP ---
  const handleExport = async () => {
    if (selectedItems.length === 0) return;
    setProcessing(true);

    try {
      const zip = new JSZip();
      const excelRows: any[] = [];
      const selectedTransactions = transactions.filter(t => selectedItems.includes(t.id));

      // לולאה על כל הפריטים שנבחרו
      for (const t of selectedTransactions) {
        
        // 1. הכנת שורה לאקסל
        excelRows.push({
          'תאריך': t.date,
          'סניף': t.branch,
          'שם השליח': t.shaliach,
          'סוג': t.type === 'income' ? 'הכנסה' : 'הוצאה',
          'תיאור / ספק': t.title,
          'סכום': t.amount,
          'אסמכתא': t.file_url ? 'כן' : 'לא'
        });

        // 2. טיפול בקובץ תמונה (אם קיים)
        if (t.file_url) {
          try {
            // הורדת התמונה כ-Blob
            const response = await fetch(t.file_url);
            const blob = await response.blob();
            
            // יצירת שם קובץ חכם: שם-ספק_תאריך_סניף
            // מנקים תווים בעייתיים משם הקובץ
            const safeTitle = t.title.replace(/[^a-zA-Z0-9א-ת\s-]/g, '').trim();
            const safeBranch = t.branch.replace(/[^a-zA-Z0-9א-ת\s-]/g, '').trim();
            const extension = t.file_url.split('.').pop() || 'jpg';
            
            const fileName = `${safeTitle}_${t.date}_${safeBranch}.${extension}`;
            
            // הוספה ל-ZIP
            zip.file(fileName, blob);
          } catch (imgErr) {
            console.error(`Failed to download image for ${t.title}`, imgErr);
          }
        }
      }

      // 3. יצירת והורדת קובץ ZIP
      if (Object.keys(zip.files).length > 0) {
        const zipContent = await zip.generateAsync({ type: "blob" });
        saveAs(zipContent, `אסמכתאות_${new Date().toISOString().split('T')[0]}.zip`);
      }

      // 4. יצירת והורדת קובץ Excel
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
      XLSX.writeFile(workbook, `דוח_מרכז_${new Date().toISOString().split('T')[0]}.xlsx`);

      // 5. עדכון ב-DB שהפריטים יוצאו (רק אם אנחנו בטאב הממתינים)
      if (activeTab === 'pending') {
        const { error } = await supabase
          .from('transactions')
          .update({ exported_at: new Date().toISOString() })
          .in('id', selectedItems);

        if (error) throw error;
        
        // רענון הרשימה (הפריטים יעברו להיסטוריה)
        fetchTransactions();
      }

      alert("הייצוא הושלם בהצלחה!");

    } catch (err) {
      console.error("Export failed:", err);
      alert("אירעה שגיאה בעת הייצוא");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">הנהלת חשבונות</h2>
          <p className="text-slate-500 mt-1">ייצוא תשלומים והיסטוריית דיווחים</p>
        </div>
        
        {selectedItems.length > 0 && (
          <button 
            onClick={handleExport}
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-right-5 disabled:opacity-70"
          >
            {processing ? <Loader2 className="animate-spin" /> : <Download size={20} />}
            {activeTab === 'pending' ? `ייצא ${selectedItems.length} פריטים` : `הורד ${selectedItems.length} פריטים שוב`}
          </button>
        )}
      </div>

      {/* טאבים */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button 
           onClick={() => setActiveTab('pending')}
           className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
           <FileText size={16} /> ממתינים לייצוא
        </button>
        <button 
           onClick={() => setActiveTab('history')}
           className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
           <History size={16} /> היסטוריית ייצוא
        </button>
      </div>

      {/* טעינה */}
      {loading && (
        <div className="text-center py-12">
           <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
           <p className="text-slate-500 mt-2">טוען נתונים...</p>
        </div>
      )}

      {/* טבלה */}
      {!loading && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
           <div className="flex items-center gap-3">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600">
                 {selectedItems.length > 0 && selectedItems.length === transactions.length ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                 בחר הכל
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">{selectedItems.length} נבחרו</span>
           </div>
           <div className="flex items-center gap-2">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="חיפוש..." className="bg-transparent outline-none text-sm" />
           </div>
        </div>

        <table className="w-full text-right">
          <thead className="bg-white text-slate-500 font-bold border-b border-slate-100 text-sm">
            <tr>
              <th className="px-6 py-4 w-16"></th>
              <th className="px-6 py-4">תאריך</th>
              <th className="px-6 py-4">סניף</th>
              <th className="px-6 py-4">תיאור / ספק</th>
              <th className="px-6 py-4">סוג</th>
              {activeTab === 'history' && <th className="px-6 py-4">תאריך ייצוא</th>}
              <th className="px-6 py-4">סכום</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((item: any) => (
              <tr 
                key={item.id} 
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedItems.includes(item.id) ? 'bg-blue-50/50' : ''}`}
                onClick={() => toggleItem(item.id)}
              >
                <td className="px-6 py-4">
                   {selectedItems.includes(item.id) ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} className="text-slate-300" />}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.date}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{item.branch}</td>
                <td className="px-6 py-4">
                   <div className="font-medium text-slate-800">{item.title}</div>
                   <div className="text-xs text-slate-500">{item.shaliach}</div>
                </td>
                <td className="px-6 py-4">
                   <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.type === 'income' ? 'פעילות' : 'הוצאה'}
                   </span>
                </td>
                
                {activeTab === 'history' && (
                  <td className="px-6 py-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1"><Clock size={12}/>{item.exported_at}</div>
                  </td>
                )}

                <td className={`px-6 py-4 font-black dir-ltr text-right ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                   ₪{item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
           <div className="text-center py-12">
              <p className="text-slate-400">
                {activeTab === 'pending' ? 'אין נתונים מאושרים לייצוא כרגע' : 'היסטוריית הייצוא ריקה'}
              </p>
           </div>
        )}
      </div>
      )}
    </div>
  );
}