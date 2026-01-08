"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, Download, RefreshCw, 
  Archive, DollarSign, CheckSquare, Square
} from "lucide-react";
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType 
} from "docx";

// --- ממשקים ---
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

  // --- 1. שליפת נתונים וסינון ---
  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('transactions')
      .select('*, users(first_name, last_name, branch_name)')
      .eq('status', 'approved')
      .eq('type', 'expense')
      .order('users(branch_name)', { ascending: true }) 
      .order('date', { ascending: false });

    if (viewMode === 'new') {
      query = query.eq('is_exported', false);
    } else {
      query = query.eq('is_exported', true);
    }

    const { data, error } = await query;
    if (!error) {
      const filtered = (data || []).filter((t: any) => {
          const d = t.details || {};
          const adminModes = ['subscription_charge', 'manual_admin_action', 'bulk_excel_import', 'manual_debit'];
          if (adminModes.includes(d.mode)) return false;
          if (t.type === 'manual_debit') return false;
          return true;
      });

      const sortedData = filtered.sort((a: any, b: any) => 
         (a.users?.branch_name || '').localeCompare(b.users?.branch_name || '')
      );
      
      setTransactions(sortedData);
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, [viewMode]);

  // --- לוגיקה מתוקנת לזיהוי סוג ---
  const getTransactionCategory = (t: Transaction) => {
    // בדיקה ראשונה: האם זה החזר הוצאות
    if (t.details?.mode === 'refund') return 'refund';
    
    // בדיקה שניה: ספקים
    if (t.details?.mode === 'supplier') {
        // תיקון: בדיקה רחבה יותר האם יש פרטי בנק
        // אם יש אובייקט bank_details והוא לא ריק - זה ספק חדש
        if (t.details?.bank_details && Object.keys(t.details.bank_details).length > 0) {
            return 'supplier_new';
        }
        return 'supplier_exist'; 
    }
    
    // ברירת מחדל: אם לא מוגדר מוד, נניח ספק קיים
    return 'supplier_exist'; 
  };

  const getTypeHebrew = (cat: string) => {
      switch(cat) {
          case 'refund': return 'החזר הוצאות';
          case 'supplier_new': return 'ספק חדש';
          case 'supplier_exist': return 'ספק קיים';
          default: return 'כללי';
      }
  };

  const cleanText = (str: string) => str.replace(/[^a-zA-Z0-9א-ת -]/g, "").trim();

  // סינון UI
  const filteredData = transactions.filter(t => {
    const cat = getTransactionCategory(t);
    if (categoryFilter === 'all') return true;
    return cat === categoryFilter;
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredData.map(t => t.id)));
  };

  // --- תהליך הייצוא המתוקן ---
  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);

    try {
      const itemsToExport = transactions.filter(t => selectedIds.has(t.id));
      const dateStr = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
      const zip = new JSZip();
      
      // קיבוץ לפי סניפים
      const groupedByBranch: Record<string, Transaction[]> = {};
      itemsToExport.forEach(t => {
          const branch = t.users?.branch_name || 'כללי';
          if (!groupedByBranch[branch]) groupedByBranch[branch] = [];
          groupedByBranch[branch].push(t);
      });

      // --- 1. אקסל (XLSX) ---
      const excelRows: any[] = [];
      // כותרות העמודות באקסל
      const excelHeader = ["תאריך", "שם הספק/העסק", "סוג (סיווג)", "שם השליח", "הערות", "סכום"];

      Object.keys(groupedByBranch).sort().forEach(branch => {
          const branchItems = groupedByBranch[branch];
          let branchTotal = 0;

          excelRows.push(["", "", "", "", "", ""]); 
          excelRows.push([`סניף: ${branch}`, "", "", "", "", ""]); 
          excelRows.push(excelHeader);

          branchItems.forEach(t => {
              const cat = getTransactionCategory(t);
              const typeHeb = getTypeHebrew(cat); // כאן יכנס: 'ספק חדש' / 'ספק קיים' / 'החזר הוצאות'
              branchTotal += t.amount;

              excelRows.push([
                  new Date(t.date).toLocaleDateString('he-IL'),
                  t.title,
                  typeHeb, // עמודה C - הסיווג המדויק
                  `${t.users?.first_name} ${t.users?.last_name}`,
                  t.details?.notes || '',
                  t.amount
              ]);
          });

          excelRows.push(["", "", "", "", `סה"כ לסניף ${branch}:`, branchTotal]);
          excelRows.push([]); 
      });

      const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
      // הרחבת עמודות לנוחות קריאה
      worksheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 10 }];
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "דוח מרוכז");
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      zip.file(`דוח_הנהח_${dateStr}.xlsx`, excelBuffer);


      // --- 2. וורד (DOCX) ---
      // (השארתי את הקוד הזהה לחלק הקודם כי הוא תקין, רק וידוא לוגיקה)
      const docChildren: any[] = [];
      docChildren.push(
          new Paragraph({
              text: `דוח הוצאות וספקים - ${dateStr}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" })
      );

      Object.keys(groupedByBranch).sort().forEach(branch => {
          const branchItems = groupedByBranch[branch];
          let branchTotal = 0;

          docChildren.push(
              new Paragraph({
                  text: `סניף: ${branch}`,
                  heading: HeadingLevel.HEADING_2,
                  thematicBreak: true,
                  spacing: { before: 400, after: 200 }
              })
          );

          const tableRows = [
              new TableRow({
                  children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ספק / עסק", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "סוג", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "פרטים / בנק", bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "סכום", bold: true })] })] }),
                  ],
              })
          ];

          branchItems.forEach(t => {
              branchTotal += t.amount;
              const cat = getTransactionCategory(t);
              let detailsText = t.details?.notes || "-";

              if (cat === 'supplier_new' && t.details?.bank_details) {
                  const bd = t.details.bank_details;
                  detailsText += `\nבנק: ${bd.bank_name || ''} (${bd.branch || ''})\nח-ן: ${bd.account || bd.accountNumber || ''}\nמוטב: ${bd.owner_name || ''}`;
              }

              tableRows.push(
                  new TableRow({
                      children: [
                          new TableCell({ children: [new Paragraph(t.title)] }),
                          new TableCell({ children: [new Paragraph(getTypeHebrew(cat))] }),
                          new TableCell({ children: [new Paragraph(detailsText)] }),
                          new TableCell({ children: [new Paragraph(`₪${t.amount}`)] }),
                      ],
                  })
              );
          });

          // שורת סיכום
          tableRows.push(
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph("")] }),
                    new TableCell({ children: [new Paragraph("")] }),
                    new TableCell({ children: [new Paragraph("סה\"כ:")] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `₪${branchTotal}`, bold: true })] })] }),
                ],
            })
          );

          docChildren.push(
              new Table({
                  rows: tableRows,
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.NONE, size: 0 },
                      right: { style: BorderStyle.NONE, size: 0 },
                      insideHorizontal: { style: BorderStyle.DOTTED, size: 1 },
                      insideVertical: { style: BorderStyle.NONE, size: 0 },
                  }
              }),
              new Paragraph({ text: "" })
          );
      });

      const doc = new Document({ sections: [{ children: docChildren }] });
      const docBuffer = await Packer.toBlob(doc);
      zip.file(`פירוט_ספקים_דוקס_${dateStr}.docx`, docBuffer);


      // --- 3. תמונות ושמירה ---
      const imgFolder = zip.folder("קבלות_ואישורים");
      
      for (const t of itemsToExport) {
          const category = getTransactionCategory(t);
          // כאן התיקון הקריטי לשמות הקבצים:
          // מחליף רווחים בקו תחתון כדי שהמחשב יקרא את זה טוב (ספק_חדש / ספק_קיים)
          const typeHeb = getTypeHebrew(category).replace(/\s+/g, "_"); 
          const safeSupplier = cleanText(t.title);
          const safeBranch = cleanText(t.users?.branch_name || 'כללי');
          const cleanDate = t.date; // YYYY-MM-DD

          // הפורמט: שם-ספק__סוג__תאריך__סניף.jpg
          const baseFileName = `${safeSupplier}__${typeHeb}__${cleanDate}__${safeBranch}`;

          if (t.file_url && imgFolder) {
              try {
                  const response = await fetch(t.file_url);
                  const blob = await response.blob();
                  imgFolder.file(`${baseFileName}_קבלה.jpg`, blob);
              } catch (e) { console.error("Error fetching img", t.id); }
          }

          if (category === 'supplier_new' && t.details?.bank_details?.proof_url && imgFolder) {
              try {
                  const response = await fetch(t.details.bank_details.proof_url);
                  const blob = await response.blob();
                  imgFolder.file(`${baseFileName}_אישור_בנק.jpg`, blob);
              } catch (e) { console.error("Error fetching bank proof", t.id); }
          }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `הנהלת_חשבונות_${dateStr}.zip`);

      await supabase.from('transactions').update({ is_exported: true }).in('id', Array.from(selectedIds));
      
      alert("הייצוא בוצע בהצלחה!");
      fetchTransactions();

    } catch (err) {
      console.error(err);
      alert("שגיאה בתהליך הייצוא");
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
      
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <DollarSign className="text-blue-600" /> הנהלת חשבונות
            </h1>
            <p className="text-slate-500 text-sm mt-1">ייצוא חכם לרואה חשבון (Excel + Word + תמונות)</p>
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

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <button onClick={() => setCategoryFilter('all')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>הכל</button>
            <button onClick={() => setCategoryFilter('supplier_exist')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'supplier_exist' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>ספקים קיימים</button>
            <button onClick={() => setCategoryFilter('supplier_new')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'supplier_new' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>ספקים חדשים</button>
            <button onClick={() => setCategoryFilter('refund')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${categoryFilter === 'refund' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>החזר הוצאות</button>
         </div>

         {selectedIds.size > 0 && viewMode === 'new' && (
             <button onClick={handleExport} disabled={exporting} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95">
                {exporting ? "מעבד ומייצא..." : <><Download size={18} /> הפק דוחות והורד</>}
             </button>
         )}
         {selectedIds.size > 0 && viewMode === 'archived' && (
             <button onClick={handleRestore} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                <RefreshCw size={18} /> שחזר לממתינים
             </button>
         )}
      </div>

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
                        <th className="px-6 py-4">סניף ושליח</th>
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
                                <div className="text-xs text-slate-500 font-bold mb-0.5">{t.users?.branch_name}</div>
                                <div className="font-bold text-slate-800 text-sm">{t.users?.first_name} {t.users?.last_name}</div>
                             </td>
                             <td className="px-6 py-4">
                                {cat === 'refund' && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold">החזר הוצאות</span>}
                                {cat === 'supplier_new' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold">ספק חדש</span>}
                                {cat === 'supplier_exist' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">ספק קיים</span>}
                             </td>
                             <td className="px-6 py-4 font-medium text-sm">{t.title}</td>
                             <td className="px-6 py-4 font-bold text-slate-900">₪{t.amount.toLocaleString()}</td>
                             <td className="px-6 py-4 flex gap-2">
                                {t.file_url && <a href={t.file_url} target="_blank" className="text-blue-600 hover:underline text-[10px] font-bold flex items-center gap-1"><FileText size={12} /> קבלה</a>}
                                {t.details?.bank_details?.proof_url && <a href={t.details.bank_details.proof_url} target="_blank" className="text-orange-600 hover:underline text-[10px] font-bold flex items-center gap-1"><FileText size={12} /> בנק</a>}
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